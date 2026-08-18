/* ---------- Theme toggle ---------- */
const themeBtn = document.getElementById('theme-toggle');
const themeTag = document.getElementById('theme-tag');
function setTheme(light){
  document.documentElement.classList.toggle('light-theme', light);
  if(themeTag) themeTag.textContent = light ? '[light]' : '[dark]';
  try{ localStorage.setItem('site-theme', light ? 'light' : 'dark'); }catch(e){}
}
(function initTheme(){
  let saved = null;
  try{ saved = localStorage.getItem('site-theme'); }catch(e){}
  setTheme(saved === 'light');
})();
if(themeBtn) themeBtn.addEventListener('click', () => {
  setTheme(!document.documentElement.classList.contains('light-theme'));
});

/* ---------- Live clock (Hyderabad, IST GMT+5:30) ---------- */
const clockEl = document.getElementById('clock');
function updateClock(){
  if(!clockEl) return;
  const now = new Date();
  const ist = new Date(now.toLocaleString('en-US', { timeZone:'Asia/Kolkata' }));
  const hh = String(ist.getHours()).padStart(2, '0');
  const mm = String(ist.getMinutes()).padStart(2, '0');
  clockEl.innerHTML = `${hh}:${mm} <span class="clock-zone">GMT+5:30 IN</span>`;
}
updateClock();
setInterval(updateClock, 1000 * 15);

/* ---------- Procedural ambient sound toggle (Web Audio, no external file) ---------- */
const soundBtn = document.getElementById('sound-toggle');
const soundTag = document.getElementById('sound-tag');
let audioCtx = null, soundNodes = null, soundOn = false;

function startSound(){
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if(audioCtx.state === 'suspended') audioCtx.resume();

  const master = audioCtx.createGain();
  master.gain.value = 0.045;
  master.connect(audioCtx.destination);

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  filter.connect(master);

  const notes = [110, 146.83, 164.81, 220];
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
    g.gain.linearRampToValueAtTime(0.16, now + 2 + i * 0.4);
    return { osc, g };
  });

  const lfo = audioCtx.createOscillator();
  lfo.frequency.value = 0.045;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 260;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  soundNodes = { master, filter, oscs, lfo };
}
function stopSound(){
  if(!soundNodes) return;
  const now = audioCtx.currentTime;
  soundNodes.master.gain.linearRampToValueAtTime(0, now + 0.6);
  setTimeout(() => {
    soundNodes.oscs.forEach(o => o.osc.stop());
    soundNodes.lfo.stop();
    soundNodes = null;
  }, 700);
}
if(soundBtn){
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    if(soundTag) soundTag.textContent = soundOn ? '[on]' : '[off]';
    if(soundOn) startSound(); else stopSound();
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

/* ---------- Header: subtle border/shadow once the page has scrolled ---------- */
const topbar = document.querySelector('.topbar');
function onScroll(){
  if(!topbar) return;
  topbar.style.borderBottomColor = window.scrollY > 8
    ? 'var(--border)'
    : 'transparent';
}
window.addEventListener('scroll', onScroll, { passive:true });
onScroll();

/* ---------- Scroll reveal ---------- */
const revealEls = document.querySelectorAll('.reveal');
if('IntersectionObserver' in window){
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold:0.12 });
  revealEls.forEach(el => revealObserver.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('in-view'));
}
