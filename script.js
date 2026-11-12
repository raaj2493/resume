(function(){
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.body.setAttribute('data-theme', saved);
  const metaTheme = document.getElementById('theme-color-meta');
  if(metaTheme) metaTheme.setAttribute('content', saved === 'dark' ? '#000000' : '#FFFFFF');
})();

document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle Listener
  const thmBtn = document.getElementById('thm');
  if (thmBtn) {
    thmBtn.addEventListener('click', () => {
      const curr = document.body.getAttribute('data-theme') || 'dark';
      const next = curr === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', next);
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      const metaTheme = document.getElementById('theme-color-meta');
      if(metaTheme) metaTheme.setAttribute('content', next === 'dark' ? '#000000' : '#FFFFFF');
    });
  }

  // Scroll Progress
  window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    const progressEl = document.getElementById('scroll-progress');
    if (progressEl) progressEl.style.width = scrolled + "%";
  }, {passive:true});

  // Nav resize and desktop/mobile nav display
  function resizeNav(){
    const dn = document.getElementById('dnav');
    const hb = document.getElementById('hbg');
    const navElement = document.getElementById('nav');
    
    if(navElement) {
      document.documentElement.style.setProperty('--nav-h', navElement.offsetHeight + 'px');
    }

    if (window.innerWidth >= 900) {
      if (dn) dn.style.display = 'flex';
      if (hb) hb.style.display = 'none';
    } else {
      if (dn) dn.style.display = 'none';
      if (hb) hb.style.display = 'flex';
    }
  }
  resizeNav();
  window.addEventListener('resize', resizeNav);

  // Hamburger menu toggling
  const hbg = document.getElementById('hbg');
  const mm  = document.getElementById('mob-menu');
  const mo  = document.getElementById('mob-overlay');

  if (hbg && mm && mo) {
    hbg.addEventListener('click', () => {
      const o = mm.classList.toggle('open');
      mo.classList.toggle('open', o);
      const ls = hbg.querySelectorAll('.hbar');
      if(o && ls.length >= 3){
        ls[0].style.transform='translateY(6.5px) rotate(45deg)';
        ls[1].style.opacity='0';
        ls[2].style.transform='translateY(-6.5px) rotate(-45deg)';
        ls[2].style.width='20px';
      } else if (ls.length >= 3) {
        ls.forEach(l=>{ l.style.transform=''; l.style.opacity=''; });
        ls[2].style.width='12px';
      }
    });
  }

  window.closeMob = function(){
    if (mm) mm.classList.remove('open');
    if (mo) mo.classList.remove('open');
    if (hbg) {
      const ls = hbg.querySelectorAll('.hbar');
      if(ls.length >= 3) {
        ls.forEach(l=>{ l.style.transform=''; l.style.opacity=''; });
        ls[2].style.width='12px';
      }
    }
  };

  // Mobile menu active state based on scroll
  function setMobActive(){
    const links = document.querySelectorAll('#mob-menu a[href^="#"]');
    const sections = [...document.querySelectorAll('section[id]')];
    let current = sections[0] ? sections[0].id : '';
    sections.forEach(s => {
      if(window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    links.forEach(a => {
      const href = a.getAttribute('href').replace('#','');
      a.classList.toggle('mob-active', href === current);
    });
  }
  window.addEventListener('scroll', setMobActive, {passive:true});
  window.addEventListener('load', setMobActive);

  // Back to top button visibility
  const btt = document.getElementById('btt');
  window.addEventListener('scroll', () => {
    if (btt) btt.classList.toggle('show', window.scrollY > 400);
  }, {passive:true});

  // Smooth scroll with offset for sticky nav
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      const t = document.querySelector(href);
      if(t){
        e.preventDefault();
        window.scrollTo({
          top: t.getBoundingClientRect().top + window.scrollY - 54,
          behavior: 'smooth'
        });
        window.closeMob();
      }
    });
  });

  // Intersection observer for scroll animations
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting) {
        e.target.classList.add('on');
      }
    });
  }, {threshold: 0.05});

  document.querySelectorAll('.up, .lft, .rgt, .sgrid, .sfade').forEach(el => io.observe(el));

  // Active nav link highlight based on IntersectionObserver
  const secs = document.querySelectorAll('section[id]');
  const nls  = document.querySelectorAll('.nav-a');
  const nIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting){
        nls.forEach(l => l.classList.remove('active'));
        const a = document.querySelector(`.nav-a[data-s="${e.target.id}"]`);
        if(a) a.classList.add('active');
      }
    });
  }, {threshold: 0.2});
  secs.forEach(s => nIO.observe(s));

  // Typewriter Animation
  const words = ["Go · Flutter · PostgreSQL", "Backend Systems · AI Builder", "Clean Architecture · REST APIs"];
  let wi = 0, ci = 0, del = false;
  const el = document.getElementById('typ');
  function tick(){
    if(!el) return;
    if(wi >= words.length) wi = 0;
    const w = words[wi];
    el.textContent = del ? w.slice(0, --ci) : w.slice(0, ++ci);
    let sp = del ? 30 : 65;
    if(!del && ci === w.length){
      sp = 2200; // Pause at end of word
      del = true;
    } else if(del && ci === 0){
      del = false;
      wi++;
      sp = 320; // Pause before starting next word
    }
    setTimeout(tick, sp);
  }

  // Defer typewriter initiation to font loading completion or window loading
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(tick);
  } else {
    window.addEventListener('load', tick);
  }

  // Expandable Experience Card toggles
  window.toggleExpCard = function(card) {
    const details = card.querySelector('.exp-details');
    const btn = card.querySelector('.exp-toggle-btn');
    if (!details || !btn) return;
    const isOpen = details.classList.contains('open');

    if (isOpen) {
      details.classList.remove('open');
      btn.classList.remove('active');
      btn.innerHTML = 'View Details <span class="arr">↓</span>';
    } else {
      details.classList.add('open');
      btn.classList.add('active');
      btn.innerHTML = 'Show Less <span class="arr">↑</span>';
    }
  };

  // Set the current year in footer dynamically
  const currentYearEl = document.getElementById('current-year');
  if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
  }
});
