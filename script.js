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

  /* ---------- Glitch text: mirror content into data-text for pseudo-element layers ---------- */
  document.querySelectorAll('.glitch').forEach(el => {
    if(!el.getAttribute('data-text')) el.setAttribute('data-text', el.textContent);
  });

  const IS_TOUCH = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------- Theme toggle (also triggerable by the in-scene Theme Portal) ---------- */
  const themeToggleBtn = document.getElementById('theme-toggle');
  function setTheme(light){
    document.documentElement.classList.toggle('light-theme', light);
    if(themeToggleBtn) themeToggleBtn.textContent = light ? '☀ LIGHT' : '☾ DARK';
    try{ localStorage.setItem('portfolio-theme', light ? 'light' : 'dark'); }catch(e){}
  }
  (function initTheme(){
    let saved = null;
    try{ saved = localStorage.getItem('portfolio-theme'); }catch(e){}
    setTheme(saved === 'light');
  })();
  function toggleTheme(){ setTheme(!document.documentElement.classList.contains('light-theme')); }
  if(themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

  /* ---------- Home jump button ---------- */
  const homeJumpBtn = document.getElementById('home-jump');
  if(homeJumpBtn){
    homeJumpBtn.addEventListener('click', () => {
      document.getElementById('home').scrollIntoView({ behavior:'smooth' });
    });
  }

  /* ---------- Procedural ambient music toggle (Web Audio, no external file) ---------- */
  const musicToggleBtn = document.getElementById('music-toggle');
  let audioCtx = null, musicNodes = null, musicOn = false;
  function startMusic(){
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if(audioCtx.state === 'suspended') audioCtx.resume();

    const master = audioCtx.createGain();
    master.gain.value = 0.05;
    master.connect(audioCtx.destination);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.connect(master);

    const notes = [110, 146.83, 164.81, 220]; // A2 D3 E3 A3 - simple ambient pad
    const oscs = notes.map((freq, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = audioCtx.createGain();
      g.gain.value = 0;
      osc.connect(g);
      g.connect(filter);
      osc.start();
      const now = audioCtx.currentTime;
      g.gain.linearRampToValueAtTime(0.18, now + 2 + i * 0.4);
      return { osc, g };
    });

    // slow LFO drifting the filter for movement
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    musicNodes = { master, filter, oscs, lfo };
  }
  function stopMusic(){
    if(!musicNodes) return;
    const now = audioCtx.currentTime;
    musicNodes.master.gain.linearRampToValueAtTime(0, now + 0.6);
    setTimeout(() => {
      musicNodes.oscs.forEach(o => o.osc.stop());
      musicNodes.lfo.stop();
      musicNodes = null;
    }, 700);
  }
  if(musicToggleBtn){
    musicToggleBtn.addEventListener('click', () => {
      musicOn = !musicOn;
      musicToggleBtn.textContent = musicOn ? '♪ MUSIC: ON' : '♪ MUSIC: OFF';
      if(musicOn) startMusic(); else stopMusic();
    });
  }

  /* ---------- Contact form -> opens the visitor's email client, addressed to Sathkrith ---------- */
  const contactForm = document.getElementById('contact-form');
  if(contactForm){
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const fromEmail = document.getElementById('email').value.trim();
      const message = document.getElementById('message').value.trim();
      const subject = encodeURIComponent(`Portfolio contact from ${name || 'your site'}`);
      const body = encodeURIComponent(`${message}\n\n— ${name}\n${fromEmail}`);
      window.location.href = `mailto:sathkrith0@gmail.com?subject=${subject}&body=${body}`;
    });
  }

  /* ---------- Playable hero scene: walk the character into coins & portals ---------- */
  (function(){
    const container = document.getElementById('viewport');
    if(!container) return;
    let width = container.clientWidth;
    let height = container.clientHeight;

    const hudHint = document.getElementById('hud-hint');
    const dragHint = document.getElementById('vp-drag-hint');
    if(hudHint) hudHint.textContent = IS_TOUCH ? 'DRAG JOYSTICK TO MOVE' : 'WASD / ARROWS TO MOVE';
    if(dragHint) dragHint.textContent = 'collect coins · walk through a portal to jump sections';

    const SKILLS = ['Unreal Engine 5', 'Unity / C#', 'Blueprints', 'Enemy AI', 'Web Dev', 'Combat Systems'];
    const BONUS_COIN_COUNT = 8;
    const TOTAL_COLLECTIBLES = SKILLS.length + BONUS_COIN_COUNT;

    // ---- score dots (one per named skill) ----
    const dotsLayer = document.getElementById('vp-dots');
    const dotEls = SKILLS.map(() => {
      const d = document.createElement('div');
      d.className = 'vp-dot';
      dotsLayer.appendChild(d);
      return d;
    });
    const scoreEl = document.getElementById('hud-score');
    const totalEl = document.getElementById('hud-total');
    if(totalEl) totalEl.textContent = TOTAL_COLLECTIBLES;
    const sbCountEl = document.getElementById('sb-count');
    const sbTotalEl = document.getElementById('sb-total');
    if(sbTotalEl) sbTotalEl.textContent = TOTAL_COLLECTIBLES;
    const toastLayer = document.getElementById('vp-toast-layer');
    const completeEl = document.getElementById('vp-complete');

    function spawnToast(text){
      const t = document.createElement('div');
      t.className = 'vp-toast';
      t.textContent = text;
      t.style.left = (44 + Math.random() * 12) + '%';
      toastLayer.appendChild(t);
      setTimeout(() => t.remove(), 1500);
    }

    // ---- three.js setup ----
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0d10, 0.05);
    scene.background = new THREE.Color(0x0b0d10);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.insertBefore(renderer.domElement, container.firstChild);

    scene.add(new THREE.AmbientLight(0x8899aa, 0.7));
    const key = new THREE.PointLight(0x7cf29c, 1.1, 24);
    key.position.set(4, 6, 4);
    scene.add(key);
    const rim = new THREE.PointLight(0xff9f5b, 0.8, 24);
    rim.position.set(-4, 3, -3);
    scene.add(rim);

    // ---- floor ----
    const FLOOR_SIZE = 9;
    const grid = new THREE.GridHelper(FLOOR_SIZE * 2, 22, 0x2a3038, 0x1a1e24);
    scene.add(grid);
    const floorMat = new THREE.MeshStandardMaterial({ color:0x0e1116, roughness:0.95, metalness:0.05 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_SIZE * 2, FLOOR_SIZE * 2), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    scene.add(floor);

    // ---- character (simple blocky robot) ----
    const character = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color:0xd7dde3, metalness:0.2, roughness:0.5 });
    const darkMat = new THREE.MeshStandardMaterial({ color:0x1c2026, metalness:0.3, roughness:0.6 });
    const eyeMat = new THREE.MeshStandardMaterial({ color:0x7cf29c, emissive:0x7cf29c, emissiveIntensity:1.2 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.32), bodyMat);
    body.position.y = 0.55;
    character.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.32, 0.36), darkMat);
    head.position.y = 0.98;
    character.add(head);

    const eyeGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.09, 0.96, 0.19);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(0.09, 0.96, 0.19);
    character.add(eyeL, eyeR);

    function makeLimb(w,h,d,x,y,z){
      const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), darkMat);
      m.position.set(x,y,z);
      const pivot = new THREE.Group();
      pivot.position.set(x, y + h/2, z);
      m.position.set(0, -h/2, 0);
      pivot.add(m);
      character.add(pivot);
      return pivot;
    }
    const legL = makeLimb(0.14, 0.42, 0.16, -0.14, 0.42, 0);
    const legR = makeLimb(0.14, 0.42, 0.16, 0.14, 0.42, 0);
    const armL = makeLimb(0.12, 0.36, 0.14, -0.32, 0.75, 0);
    const armR = makeLimb(0.12, 0.36, 0.14, 0.32, 0.75, 0);

    const shadowBlob = new THREE.Mesh(
      new THREE.CircleGeometry(0.34, 20),
      new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:0.35 })
    );
    shadowBlob.rotation.x = -Math.PI / 2;
    shadowBlob.position.y = 0.005;
    character.add(shadowBlob);

    character.position.set(0, 0, 2.5);
    scene.add(character);

    // ---- collectible coins (skill coins + bonus coins) ----
    function makeGlowTexture(hex){
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(64,64,0,64,64,64);
      g.addColorStop(0, hex + 'ee');
      g.addColorStop(0.5, hex + '33');
      g.addColorStop(1, hex + '00');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,128,128);
      return new THREE.CanvasTexture(c);
    }
    const coinGlowTex = makeGlowTexture('#ffd35c');
    const coinGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.045, 24);
    const coinMat = new THREE.MeshStandardMaterial({
      color:0xffd35c, emissive:0x8a5b0e, emissiveIntensity:0.7, metalness:0.75, roughness:0.3
    });

    function makeCoin(x, z, skill, index){
      const g = new THREE.Group();
      g.position.set(x, 0.55, z);

      const core = new THREE.Mesh(coinGeo, coinMat.clone());
      g.add(core);

      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: coinGlowTex, transparent:true, depthWrite:false, blending: THREE.AdditiveBlending
      }));
      glow.scale.set(0.8, 0.8, 1);
      g.add(glow);

      g.userData = { skill: skill || null, collected:false, bobOff: Math.random()*10, core, glow, index };
      scene.add(g);
      return g;
    }

    const orbAngles = SKILLS.map((_, i) => (i / SKILLS.length) * Math.PI * 2);
    const orbs = SKILLS.map((skill, i) => {
      const radius = 3.4 + (i % 2) * 1.6;
      const a = orbAngles[i];
      return makeCoin(Math.cos(a) * radius, Math.sin(a) * radius, skill, i);
    });

    // Bonus coins: unlabeled, scattered for extra score, no repeat too close to skill coins
    for(let i = 0; i < BONUS_COIN_COUNT; i++){
      const a = Math.random() * Math.PI * 2;
      const r = 1.4 + Math.random() * 6.2;
      orbs.push(makeCoin(Math.cos(a) * r, Math.sin(a) * r, null, SKILLS.length + i));
    }

    let collectedCount = 0;

    // ---- navigation portals: walk through one to jump to a section, or flip the theme ----
    function scrollToSection(id){
      const el = document.getElementById(id);
      if(el) el.scrollIntoView({ behavior:'smooth' });
    }
    function makeLabelSprite(text, colorHex){
      const c = document.createElement('canvas');
      c.width = 256; c.height = 64;
      const ctx = c.getContext('2d');
      ctx.font = '700 26px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = colorHex;
      ctx.shadowBlur = 14;
      ctx.fillStyle = colorHex;
      ctx.fillText(text, 128, 32);
      const tex = new THREE.CanvasTexture(c);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, depthWrite:false }));
      sprite.scale.set(1.7, 0.42, 1);
      return sprite;
    }

    const PORTAL_DEFS = [
      { id:'theme',    label:'THEME',    color:'#b79bff', angle: Math.PI * 0.25, action: () => toggleTheme() },
      { id:'skills',   label:'SKILLS',   color:'#7cf29c', angle: Math.PI * 1.1,  action: () => scrollToSection('skills') },
      { id:'projects', label:'PROJECTS', color:'#ff9f5b', angle: Math.PI * 1.75, action: () => scrollToSection('projects') },
      { id:'contact',  label:'CONTACT',  color:'#5bc8ff', angle: Math.PI * 0.7,  action: () => scrollToSection('contact') }
    ];
    const portals = PORTAL_DEFS.map(p => {
      const g = new THREE.Group();
      const radius = 7.3;
      g.position.set(Math.cos(p.angle) * radius, 0.9, Math.sin(p.angle) * radius);
      g.rotation.y = p.angle + Math.PI / 2;

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.7, 0.06, 12, 32),
        new THREE.MeshStandardMaterial({ color:p.color, emissive:p.color, emissiveIntensity:0.6, metalness:0.4, roughness:0.35 })
      );
      g.add(ring);

      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeGlowTexture(p.color), transparent:true, depthWrite:false, blending: THREE.AdditiveBlending
      }));
      glow.scale.set(2.4, 2.4, 1);
      g.add(glow);

      const label = makeLabelSprite(p.label, p.color);
      label.position.set(0, 1.05, 0);
      g.add(label);

      g.userData = { ...p, wasInside:false, ring };
      scene.add(g);
      return g;
    });

    function collectOrb(orb){
      if(orb.userData.collected) return;
      orb.userData.collected = true;
      collectedCount++;
      scoreEl.textContent = collectedCount;
      if(sbCountEl) sbCountEl.textContent = collectedCount;
      if(orb.userData.skill){
        dotEls[orb.userData.index].classList.add('collected');
        spawnToast('+1 · ' + orb.userData.skill.toUpperCase());
      } else {
        spawnToast('+1 COIN');
      }
      pulseAmount(0.012, 220);

      // quick burst-and-fade animation
      const startScale = orb.scale.x;
      const t0 = performance.now();
      function burst(){
        const p = Math.min((performance.now() - t0) / 320, 1);
        const s = startScale * (1 + p * 1.8);
        orb.scale.setScalar(s);
        orb.userData.core.material.opacity = 1 - p;
        orb.userData.core.material.transparent = true;
        if(p < 1){ requestAnimationFrame(burst); } else { scene.remove(orb); }
      }
      burst();

      if(collectedCount === TOTAL_COLLECTIBLES){
        setTimeout(() => {
          completeEl.classList.add('show');
          pulseAmount(0.02, 900);
          setTimeout(() => completeEl.classList.remove('show'), 3200);
        }, 350);
      }
    }

    // ---- chromatic-aberration post-process (manual, no jsm needed) ----
    let rt = new THREE.WebGLRenderTarget(width, height);
    const postScene = new THREE.Scene();
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const postMat = new THREE.ShaderMaterial({
      uniforms:{
        tDiffuse:{ value: rt.texture },
        uAmount:{ value: 0.0032 },
        uTime:{ value: 0 }
      },
      vertexShader:`
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }
      `,
      fragmentShader:`
        uniform sampler2D tDiffuse;
        uniform float uAmount;
        uniform float uTime;
        varying vec2 vUv;
        void main(){
          vec2 dir = vUv - 0.5;
          vec2 offset = dir * uAmount * (1.0 + length(dir) * 1.5);
          float r = texture2D(tDiffuse, vUv - offset).r;
          float g = texture2D(tDiffuse, vUv).g;
          float b = texture2D(tDiffuse, vUv + offset).b;
          float scan = sin((vUv.y + uTime * 0.02) * 700.0) * 0.015;
          vec3 col = vec3(r, g, b) - scan;
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
    const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat);
    postScene.add(postQuad);

    let aberrationBoost = 0, aberrationDecay = 0;
    function pulseAmount(amt, ms){
      aberrationBoost = amt;
      aberrationDecay = amt / (ms / 16);
    }

    function resize(){
      width = container.clientWidth; height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      rt.setSize(width, height);
    }
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 200));

    // ---- controls: keyboard (desktop) + virtual joystick (touch) ----
    const keys = {};
    const MOVE_KEYS = ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
    function isTypingTarget(el){
      return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    }
    let heroVisible = true;
    const heroObserver = new IntersectionObserver(entries => {
      entries.forEach(en => {
        heroVisible = en.isIntersecting;
        if(!heroVisible){ Object.keys(keys).forEach(k => keys[k] = false); }
      });
    }, { threshold:0.15 });
    heroObserver.observe(container.closest('section'));

    window.addEventListener('keydown', e => {
      if(!heroVisible || isTypingTarget(document.activeElement)) return;
      const k = e.key.toLowerCase();
      keys[k] = true;
      if(MOVE_KEYS.includes(k)) e.preventDefault();
    });
    window.addEventListener('keyup', e => {
      if(isTypingTarget(document.activeElement)) return;
      keys[e.key.toLowerCase()] = false;
    });

    let joyVec = { x:0, y:0 };
    const joystick = document.getElementById('joystick');
    const nub = document.getElementById('joystick-nub');
    if(IS_TOUCH && joystick){
      joystick.classList.add('active');
      let dragging = false, originX = 0, originY = 0;
      const maxR = 30;

      function start(x, y){ dragging = true; originX = x; originY = y; }
      function move(x, y){
        if(!dragging) return;
        let dx = x - originX, dy = y - originY;
        const dist = Math.min(Math.hypot(dx, dy), maxR);
        const ang = Math.atan2(dy, dx);
        dx = Math.cos(ang) * dist; dy = Math.sin(ang) * dist;
        nub.style.transform = `translate(${dx}px, ${dy}px)`;
        joyVec.x = dx / maxR; joyVec.y = dy / maxR;
      }
      function end(){
        dragging = false;
        nub.style.transform = '';
        joyVec.x = 0; joyVec.y = 0;
      }
      joystick.addEventListener('touchstart', e => {
        const t = e.touches[0]; start(t.clientX, t.clientY); e.preventDefault();
      }, { passive:false });
      window.addEventListener('touchmove', e => {
        if(!dragging) return;
        const t = e.touches[0]; move(t.clientX, t.clientY);
      }, { passive:true });
      window.addEventListener('touchend', end);
    }

    // ---- camera chase state ----
    const camOffset = new THREE.Vector3(0, 4.6, 5.6);
    const camCurrent = new THREE.Vector3().copy(camera.position);
    let facing = 0;
    let lastMoveTime = performance.now();

    const clock = new THREE.Clock();
    function animate(){
      requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      // movement input
      let mx = 0, mz = 0;
      if(keys['w'] || keys['arrowup']) mz -= 1;
      if(keys['s'] || keys['arrowdown']) mz += 1;
      if(keys['a'] || keys['arrowleft']) mx -= 1;
      if(keys['d'] || keys['arrowright']) mx += 1;
      if(IS_TOUCH){ mx += joyVec.x; mz += joyVec.y; }

      const len = Math.hypot(mx, mz);
      const moving = len > 0.05;
      if(moving){
        lastMoveTime = performance.now();
        mx /= len; mz /= len;
        const speed = 2.6;
        character.position.x += mx * speed * dt;
        character.position.z += mz * speed * dt;
        character.position.x = Math.max(-FLOOR_SIZE + 0.4, Math.min(FLOOR_SIZE - 0.4, character.position.x));
        character.position.z = Math.max(-FLOOR_SIZE + 0.4, Math.min(FLOOR_SIZE - 0.4, character.position.z));

        const targetFacing = Math.atan2(mx, mz);
        let diff = targetFacing - facing;
        while(diff > Math.PI) diff -= Math.PI * 2;
        while(diff < -Math.PI) diff += Math.PI * 2;
        facing += diff * Math.min(dt * 10, 1);
        character.rotation.y = facing;

        const walkCycle = t * 9;
        legL.rotation.x = Math.sin(walkCycle) * 0.6;
        legR.rotation.x = -Math.sin(walkCycle) * 0.6;
        armL.rotation.x = -Math.sin(walkCycle) * 0.5;
        armR.rotation.x = Math.sin(walkCycle) * 0.5;
        body.position.y = 0.55 + Math.abs(Math.sin(walkCycle)) * 0.03;
      } else if(performance.now() - lastMoveTime > 4000){
        // idle too long — bust out a little dance
        const dt2 = t * 5;
        legL.rotation.x += (Math.sin(dt2) * 0.25 - legL.rotation.x) * 0.2;
        legR.rotation.x += (-Math.sin(dt2) * 0.25 - legR.rotation.x) * 0.2;
        armL.rotation.z = Math.sin(dt2) * 0.6;
        armR.rotation.z = -Math.sin(dt2) * 0.6;
        armL.rotation.x += (0 - armL.rotation.x) * 0.2;
        armR.rotation.x += (0 - armR.rotation.x) * 0.2;
        character.rotation.z = Math.sin(dt2 * 0.6) * 0.09;
        character.rotation.y += Math.sin(dt2 * 0.3) * 0.004;
        body.position.y = 0.55 + Math.abs(Math.sin(dt2 * 1.3)) * 0.05;
      } else {
        legL.rotation.x += (0 - legL.rotation.x) * 0.2;
        legR.rotation.x += (0 - legR.rotation.x) * 0.2;
        armL.rotation.x += (0 - armL.rotation.x) * 0.2;
        armR.rotation.x += (0 - armR.rotation.x) * 0.2;
        armL.rotation.z += (0 - armL.rotation.z) * 0.2;
        armR.rotation.z += (0 - armR.rotation.z) * 0.2;
        character.rotation.z += (0 - character.rotation.z) * 0.2;
        body.position.y = 0.55 + Math.sin(t * 2) * 0.01;
      }

      // coin bob + collision
      orbs.forEach(orb => {
        if(orb.userData.collected) return;
        orb.position.y = 0.55 + Math.sin(t * 1.6 + orb.userData.bobOff) * 0.12;
        orb.rotation.y += 0.02;
        const dist = Math.hypot(orb.position.x - character.position.x, orb.position.z - character.position.z);
        if(dist < 0.45) collectOrb(orb);
      });

      // portal proximity trigger (enter/exit edge-detected so it fires once per pass)
      portals.forEach(portal => {
        portal.userData.ring.rotation.z += 0.008;
        const dist = Math.hypot(portal.position.x - character.position.x, portal.position.z - character.position.z);
        const inside = dist < 0.85;
        if(inside && !portal.userData.wasInside){
          portal.userData.wasInside = true;
          spawnToast('→ ' + portal.userData.label);
          pulseAmount(0.022, 500);
          portal.userData.action();
        } else if(!inside){
          portal.userData.wasInside = false;
        }
      });

      // chase camera
      const desired = character.position.clone().add(camOffset);
      camCurrent.lerp(desired, 1 - Math.pow(0.001, dt));
      camera.position.copy(camCurrent);
      camera.lookAt(character.position.x, character.position.y + 0.7, character.position.z);

      // chromatic aberration pulse decay
      if(aberrationBoost > 0){ aberrationBoost = Math.max(0, aberrationBoost - aberrationDecay); }
      postMat.uniforms.uAmount.value = 0.0032 + aberrationBoost;
      postMat.uniforms.uTime.value = t;

      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCamera);
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
