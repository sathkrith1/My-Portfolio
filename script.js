  /* ---------- Nav active-state on scroll ---------- */
  const navLinks = document.querySelectorAll('.navlink');
  const sections = document.querySelectorAll('main section');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const id = entry.target.id;
        navLinks.forEach(l => l.classList.toggle('active', l.dataset.target === id));
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px' });
  sections.forEach(s => observer.observe(s));

  /* ---------- HUD stat flicker ---------- */
  const hud = document.getElementById('hud-stats');
  setInterval(() => {
    const tris = (12.5 + Math.random()*0.6).toFixed(1);
    const fps = 58 + Math.floor(Math.random()*3);
    hud.innerHTML = `OBJ: 04<br>TRIS: ${tris}K<br>FPS: ${fps}`;
  }, 1800);

  /* ---------- Three.js viewport scene ---------- */
  (function(){
    const container = document.getElementById('viewport');
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0d10, 0.055);

    const camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 100);
    camera.position.set(0, 2.4, 7);

    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.insertBefore(renderer.domElement, container.firstChild);

    // Lighting
    scene.add(new THREE.AmbientLight(0x8899aa, 0.6));
    const key = new THREE.PointLight(0x7cf29c, 1.2, 20);
    key.position.set(4, 5, 4);
    scene.add(key);
    const rim = new THREE.PointLight(0xff9f5b, 0.9, 20);
    rim.position.set(-4, 2, -3);
    scene.add(rim);

    // Floor grid (viewport ground)
    const grid = new THREE.GridHelper(14, 22, 0x2a3038, 0x1a1e24);
    grid.position.y = -1.6;
    scene.add(grid);

    // Group of "game objects" orbiting a center point
    const group = new THREE.Group();
    scene.add(group);

    const wireMat = new THREE.MeshStandardMaterial({
      color: 0x7cf29c, wireframe:true, transparent:true, opacity:0.9
    });
    const solidMat = new THREE.MeshStandardMaterial({
      color: 0x191d23, metalness:0.3, roughness:0.6, emissive:0x0c3d24, emissiveIntensity:0.4
    });
    const amberMat = new THREE.MeshStandardMaterial({
      color: 0x1a1103, metalness:0.2, roughness:0.5, emissive:0x7a4419, emissiveIntensity:0.5
    });

    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 0), solidMat);
    group.add(core);
    const coreWire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 0), wireMat);
    group.add(coreWire);

    const orbiters = [];
    const geoms = [
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.TorusGeometry(0.35, 0.12, 8, 24),
      new THREE.OctahedronGeometry(0.4, 0),
      new THREE.BoxGeometry(0.35, 0.35, 0.35)
    ];
    geoms.forEach((geo, i) => {
      const mat = i % 2 === 0 ? amberMat : wireMat.clone();
      const mesh = new THREE.Mesh(geo, mat);
      const radius = 2.5 + i * 0.35;
      const angle = (i / geoms.length) * Math.PI * 2;
      mesh.userData = { radius, angle, speed: 0.25 + i * 0.07, yOff: i * 0.6 };
      group.add(mesh);
      orbiters.push(mesh);
    });

    function resize(){
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 200));

    // Drag-to-orbit interaction
    let isDragging = false, lastX = 0, lastY = 0;
    let autoRotate = true, idleTimer = null;
    let targetRotY = 0, targetRotX = -0.15;
    let currentRotY = 0, currentRotX = -0.15;

    function pointerDown(x, y){
      isDragging = true;
      autoRotate = false;
      lastX = x; lastY = y;
      if(idleTimer) clearTimeout(idleTimer);
    }
    function pointerMove(x, y){
      if(!isDragging) return;
      const dx = x - lastX, dy = y - lastY;
      targetRotY += dx * 0.005;
      targetRotX += dy * 0.003;
      targetRotX = Math.max(-0.8, Math.min(0.8, targetRotX));
      lastX = x; lastY = y;
    }
    function pointerUp(){
      isDragging = false;
      idleTimer = setTimeout(() => { autoRotate = true; }, 2200);
    }

    const dom = renderer.domElement;
    dom.style.cursor = 'grab';
    dom.addEventListener('mousedown', e => { pointerDown(e.clientX, e.clientY); dom.style.cursor='grabbing'; });
    window.addEventListener('mousemove', e => pointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', () => { pointerUp(); dom.style.cursor='grab'; });
    dom.addEventListener('touchstart', e => { const t=e.touches[0]; pointerDown(t.clientX, t.clientY); }, {passive:true});
    dom.addEventListener('touchmove', e => { const t=e.touches[0]; pointerMove(t.clientX, t.clientY); }, {passive:true});
    dom.addEventListener('touchend', pointerUp);

    const clock = new THREE.Clock();
    function animate(){
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if(autoRotate){ targetRotY += 0.0025; }
      currentRotY += (targetRotY - currentRotY) * 0.08;
      currentRotX += (targetRotX - currentRotX) * 0.08;
      group.rotation.y = currentRotY;
      group.rotation.x = currentRotX;

      core.rotation.y = t * 0.15;
      coreWire.rotation.y = -t * 0.1;

      orbiters.forEach(m => {
        const { radius, angle, speed, yOff } = m.userData;
        const a = angle + t * speed;
        m.position.set(Math.cos(a) * radius, Math.sin(t + yOff) * 0.4, Math.sin(a) * radius);
        m.rotation.x += 0.01;
        m.rotation.y += 0.012;
      });

      renderer.render(scene, camera);
    }
    animate();
  })();
