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

    // Soft glow sprite behind the core (cheap fake-bloom, no post-processing needed)
    function makeGlowTexture(hex){
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(128,128,0,128,128,128);
      g.addColorStop(0, hex + 'cc');
      g.addColorStop(0.5, hex + '22');
      g.addColorStop(1, hex + '00');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,256,256);
      return new THREE.CanvasTexture(c);
    }
    const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture('#7cf29c'), transparent:true, depthWrite:false, blending: THREE.AdditiveBlending
    }));
    glowSprite.scale.set(5, 5, 1);
    group.add(glowSprite);

    // Tilted gizmo rings, like an engine's orbit/selection gizmo
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.014, 8, 100),
      new THREE.MeshBasicMaterial({ color:0x7cf29c, transparent:true, opacity:0.4 })
    );
    ring.rotation.x = Math.PI / 2.4;
    group.add(ring);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.014, 8, 100),
      new THREE.MeshBasicMaterial({ color:0xff9f5b, transparent:true, opacity:0.3 })
    );
    ring2.rotation.x = Math.PI / 1.7;
    ring2.rotation.z = Math.PI / 6;
    ring2.scale.setScalar(1.25);
    group.add(ring2);

    // Fine drifting dust inside the viewport volume, for depth
    const dustCount = 130;
    const dustPos = new Float32Array(dustCount * 3);
    for(let i=0;i<dustCount;i++){
      const r = 2.2 + Math.random()*2.3;
      const theta = Math.random()*Math.PI*2;
      const phi = Math.acos((Math.random()*2)-1);
      dustPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      dustPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.55;
      dustPos[i*3+2] = r * Math.cos(phi);
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
      size:0.045, color:0x9fb0bd, transparent:true, opacity:0.55
    }));
    group.add(dust);

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
      ring.rotation.z += 0.0025;
      ring2.rotation.z -= 0.0018;
      dust.rotation.y += 0.0006;
      glowSprite.scale.setScalar(5 + Math.sin(t * 0.8) * 0.3);

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

  /* ---------- Full-page ambient particle background ---------- */
  (function(){
    const canvas = document.getElementById('bg-canvas');
    if(!canvas || getComputedStyle(canvas).display === 'none') return;

    const isSmall = window.innerWidth < 900;
    const count = isSmall ? 400 : 1000;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const accentColor = new THREE.Color(0x7cf29c);
    const amberColor = new THREE.Color(0xff9f5b);
    const dimColor = new THREE.Color(0x39424e);
    for(let i=0;i<count;i++){
      positions[i*3]   = (Math.random()-0.5) * 30;
      positions[i*3+1] = (Math.random()-0.5) * 30;
      positions[i*3+2] = (Math.random()-0.5) * 30;
      const r = Math.random();
      const col = r < 0.06 ? accentColor : r < 0.11 ? amberColor : dimColor;
      colors[i*3] = col.r; colors[i*3+1] = col.g; colors[i*3+2] = col.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    function makeDotTexture(){
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(32,32,0,32,32,32);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.4, 'rgba(255,255,255,0.6)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,64,64);
      return new THREE.CanvasTexture(c);
    }

    const points = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.14,
      map: makeDotTexture(),
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    scene.add(points);

    let mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', e => {
      mouseX = (e.clientX / window.innerWidth) - 0.5;
      mouseY = (e.clientY / window.innerHeight) - 0.5;
    });

    function onResize(){
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', () => setTimeout(onResize, 200));

    let tabVisible = true;
    document.addEventListener('visibilitychange', () => { tabVisible = !document.hidden; });

    const clock = new THREE.Clock();
    function animate(){
      requestAnimationFrame(animate);
      if(!tabVisible) return;
      const t = clock.getElapsedTime();
      points.rotation.y = t * 0.02;
      points.rotation.x = t * 0.008;
      camera.position.x += (mouseX * 2 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 2 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    }
    animate();
  })();

  /* ---------- 3D tilt on hover for cards (pointer-precision devices only) ---------- */
  (function(){
    if(!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    function attachTilt(elements, maxTilt, scale){
      elements.forEach(el => {
        el.addEventListener('mousemove', e => {
          const rect = el.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          el.style.transform = `perspective(800px) rotateX(${(-y * maxTilt).toFixed(2)}deg) rotateY(${(x * maxTilt).toFixed(2)}deg) scale(${scale})`;
        });
        el.addEventListener('mouseleave', () => { el.style.transform = ''; });
      });
    }
    attachTilt(document.querySelectorAll('.project-card'), 8, 1.02);
    attachTilt(document.querySelectorAll('.skill-card'), 6, 1.03);
  })();
