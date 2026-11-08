(() => {
  const root = document.documentElement;
  root.classList.add('js');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  /* ---------- Year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Preloader ---------- */
  const preloader = $('#preloader');
  let preloaderHidden = false;
  function hidePreloader() {
    if (!preloader || preloaderHidden) return;
    preloaderHidden = true;
    preloader.classList.add('is-done');
    window.setTimeout(() => preloader.remove(), 900);
  }
  window.addEventListener('load', () => window.setTimeout(hidePreloader, 500));
  window.setTimeout(hidePreloader, 3200);

  /* ---------- Navigation, scroll progress ---------- */
  const nav = $('#nav');
  const progress = $('#scrollProgress');
  let scrollTicking = false;

  function onScroll() {
    const y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle('is-scrolled', y > 28);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty('--progress', max > 0 ? Math.min(y / max, 1).toFixed(4) : '0');
    }
    scrollTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(onScroll);
  }, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('#menuBtn');
  const mobileMenu = $('#mobileMenu');
  let menuOpen = false;

  function setMenu(open) {
    if (!menuBtn || !mobileMenu) return;
    menuOpen = open;
    menuBtn.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => setMenu(!menuOpen));
    $$('a', mobileMenu).forEach((link) => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuOpen) setMenu(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1020 && menuOpen) setMenu(false);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('[data-reveal]');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Animated counters ---------- */
  const counters = $$('[data-count]');
  const counterObserver = 'IntersectionObserver' in window && !reducedMotion
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        });
      }, { threshold: 0.6 })
    : null;

  function animateCounter(el) {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    if (reducedMotion || !counterObserver) {
      el.textContent = target.toLocaleString('en-US');
      return;
    }
    const duration = target > 500 ? 1800 : 1300;
    const start = performance.now();
    function frame(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-US');
      if (p < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }
  if (counterObserver) counters.forEach((el) => counterObserver.observe(el));
  else counters.forEach((el) => { el.textContent = Number(el.dataset.count).toLocaleString('en-US'); });

  /* ---------- Hero scene parallax ---------- */
  const hero = $('.hero');
  const scene = $('#scene');
  if (hero && scene && finePointer && !reducedMotion) {
    let frame = null;
    hero.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        scene.style.setProperty('--scene-rx', (y * -5).toFixed(2));
        scene.style.setProperty('--scene-ry', (x * 7).toFixed(2));
      });
    });
    hero.addEventListener('pointerleave', () => {
      scene.style.setProperty('--scene-rx', '0');
      scene.style.setProperty('--scene-ry', '0');
    });
  }

  /* ---------- 3D tilt cards ---------- */
  if (finePointer && !reducedMotion) {
    $$('[data-tilt]').forEach((card) => {
      let frame = null;
      card.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch') return;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        if (frame) window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(() => {
          card.style.setProperty('--rx', ((y - 0.5) * -6).toFixed(2));
          card.style.setProperty('--ry', ((x - 0.5) * 7).toFixed(2));
          card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
          card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
          card.style.setProperty('--lift', '-3px');
        });
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0');
        card.style.setProperty('--ry', '0');
        card.style.setProperty('--lift', '0px');
      });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reducedMotion) {
    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch') return;
        const rect = el.getBoundingClientRect();
        const dx = (event.clientX - (rect.left + rect.width / 2)) * 0.14;
        const dy = (event.clientY - (rect.top + rect.height / 2)) * 0.18;
        el.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ---------- Custom cursor ---------- */
  const cursorDot = $('#cursorDot');
  const cursorRing = $('#cursorRing');
  if (cursorDot && cursorRing && finePointer && !reducedMotion) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let cursorRaf = 0;

    function renderCursor() {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      cursorRaf = window.requestAnimationFrame(renderCursor);
    }

    window.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      mouseX = event.clientX;
      mouseY = event.clientY;
      cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      cursorDot.style.opacity = '1';
      cursorRing.style.opacity = '1';
      const interactive = event.target.closest('a, button, [data-tilt], .year-filter, .event-card__link');
      cursorRing.classList.toggle('is-hover', Boolean(interactive));
      if (!cursorRaf) renderCursor();
    }, { passive: true });

    document.addEventListener('pointerleave', () => {
      cursorDot.style.opacity = '0';
      cursorRing.style.opacity = '0';
    });
    document.addEventListener('pointerenter', () => {
      cursorDot.style.opacity = '1';
      cursorRing.style.opacity = '1';
    });
  } else if (cursorDot && cursorRing) {
    cursorDot.remove();
    cursorRing.remove();
  }

  /* ---------- Active navigation link ---------- */
  const navLinks = $$('.nav__links a');
  if ('IntersectionObserver' in window && navLinks.length) {
    const sectionMap = new Map();
    navLinks.forEach((link) => {
      const section = document.querySelector(link.getAttribute('href'));
      if (section) sectionMap.set(section, link);
    });
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.remove('is-active'));
        const active = sectionMap.get(entry.target);
        if (active) active.classList.add('is-active');
      });
    }, { rootMargin: '-42% 0px -52% 0px', threshold: 0 });
    sectionMap.forEach((_, section) => navObserver.observe(section));
  }

  /* ---------- Confetti ---------- */
  const confettiHost = $('#confetti');
  if (confettiHost && !reducedMotion) {
    const colors = ['#d8b070', '#f1d69b', '#2e755c', '#f7f1e4', '#a9792f'];
    for (let i = 0; i < 18; i += 1) {
      const piece = document.createElement('i');
      piece.style.left = `${(Math.random() * 100).toFixed(1)}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.setProperty('--d', `${(Math.random() * 6).toFixed(2)}s`);
      piece.style.setProperty('--drift', `${(Math.random() * 90 - 45).toFixed(0)}px`);
      piece.style.width = `${(4 + Math.random() * 4).toFixed(1)}px`;
      piece.style.height = `${(8 + Math.random() * 8).toFixed(1)}px`;
      confettiHost.appendChild(piece);
    }
  }

  /* ---------- Toast ---------- */
  const toast = $('#toast');
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }

  /* ---------- Results archive ---------- */
  const seedResults = [
    {
      id: 'seed-2026',
      year: 2026,
      title: 'Matric Annual Result 2026',
      description: 'High school topper Haram Suqraat — 1,169 marks.',
      badge: 'School highlight',
      meta: 'High school topper · 1,169 marks',
      linkLabel: 'Topper highlight'
    },
    {
      id: 'seed-2025',
      year: 2025,
      title: 'Matric Annual Result 2025',
      description: 'Demo archive placeholder — the school can add its official result file here.',
      badge: 'Demo archive',
      meta: 'Sample entry',
      linkLabel: 'Demo entry'
    },
    {
      id: 'seed-2024',
      year: 2024,
      title: 'Matric Annual Result 2024',
      description: 'Demo archive placeholder — the school can add its official result file here.',
      badge: 'Demo archive',
      meta: 'Sample entry',
      linkLabel: 'Demo entry'
    }
  ];

  const resultsGrid = $('#resultsGrid');
  const yearFilters = $('#yearFilters');
  const uploadDialog = $('#uploadDialog');
  const uploadForm = $('#uploadForm');
  const formMessage = $('#formMessage');
  let uploadedResults = [];
  let activeYear = '2026';
  let objectUrls = [];

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('Browser storage is unavailable.'));
        return;
      }
      const request = indexedDB.open('pshs-demo-results-v2', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('results')) db.createObjectStore('results', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open browser storage.'));
    });
  }

  async function readUploadedResults() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = db.transaction('results', 'readonly').objectStore('results').getAll();
      request.onsuccess = () => { db.close(); resolve(request.result || []); };
      request.onerror = () => { db.close(); reject(request.error); };
    });
  }

  async function storeResult(record) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('results', 'readwrite');
      tx.objectStore('results').put(record);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error || new Error('Could not save this file.')); };
      tx.onabort = () => { db.close(); reject(tx.error || new Error('Saving was cancelled.')); };
    });
  }

  function allResults() {
    return [...seedResults, ...uploadedResults]
      .sort((a, b) => Number(b.year) - Number(a.year));
  }

  function renderResults() {
    if (!resultsGrid || !yearFilters) return;
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    objectUrls = [];

    const results = allResults();
    const years = [...new Set(results.map((item) => String(item.year)))]
      .sort((a, b) => Number(b) - Number(a));

    if (!years.includes(activeYear) && activeYear !== 'all') activeYear = years[0] || 'all';

    const options = [{ value: 'all', label: 'All years' }, ...years.map((year) => ({ value: year, label: year }))];
    yearFilters.innerHTML = options.map((item) => (
      `<button class="year-filter" type="button" data-year="${item.value}" aria-pressed="${activeYear === item.value}">${item.label}</button>`
    )).join('');

    const visible = results.filter((item) => activeYear === 'all' || String(item.year) === activeYear);

    if (!visible.length) {
      resultsGrid.innerHTML = '<div class="empty-results">No result files are saved for this year yet. Use “Add result file” to add one.</div>';
      return;
    }

    resultsGrid.innerHTML = visible.map((item, index) => {
      const isUpload = item.file instanceof Blob;
      const badge = item.badge || 'Uploaded result';
      const meta = item.meta || item.fileName || 'Result file';
      let action = `<span class="result-link">${escapeHtml(item.linkLabel || 'Demo entry')}</span>`;
      if (isUpload) {
        const url = URL.createObjectURL(item.file);
        objectUrls.push(url);
        action = `<a class="result-link" href="${url}" target="_blank" rel="noopener" download="${escapeHtml(item.fileName || 'school-result')}">Open result ↗</a>`;
      }
      const description = item.description || `Uploaded file: ${escapeHtml(item.fileName || 'Result file')}`;
      return `
        <article class="result-card" style="animation-delay:${index * 70}ms">
          <div>
            <div class="result-card__top">
              <span class="result-year">${escapeHtml(item.year)}</span>
              <span class="result-badge">${escapeHtml(badge)}</span>
            </div>
            <h3>${escapeHtml(item.title)}</h3>
            <p class="result-description">${description}</p>
          </div>
          <div class="result-card__bottom">
            <span>${escapeHtml(meta)}</span>
            ${action}
          </div>
        </article>`;
    }).join('');
  }

  function openDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  if (yearFilters) {
    yearFilters.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-year]');
      if (!button) return;
      activeYear = button.dataset.year;
      renderResults();
    });
  }

  const openUpload = $('#openUpload');
  if (openUpload && uploadDialog) {
    openUpload.addEventListener('click', () => {
      if (formMessage) formMessage.textContent = '';
      openDialog(uploadDialog);
    });
  }

  ['closeUpload', 'cancelUpload'].forEach((id) => {
    const button = document.getElementById(id);
    if (button && uploadDialog) button.addEventListener('click', () => closeDialog(uploadDialog));
  });
  if (uploadDialog) {
    uploadDialog.addEventListener('click', (event) => {
      if (event.target === uploadDialog) closeDialog(uploadDialog);
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (formMessage) formMessage.textContent = '';
      const data = new FormData(uploadForm);
      const year = Number(data.get('year'));
      const title = String(data.get('title') || '').trim();
      const file = data.get('file');

      if (!Number.isInteger(year) || year < 2004 || year > 2100) {
        if (formMessage) formMessage.textContent = 'Enter a year from 2004 to 2100.';
        return;
      }
      if (!title) {
        if (formMessage) formMessage.textContent = 'Add a display title for this result.';
        return;
      }
      if (!(file instanceof File) || !file.size) {
        if (formMessage) formMessage.textContent = 'Choose a PDF, JPG or PNG result file.';
        return;
      }
      const validType = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)
        || /\.(pdf|jpe?g|png)$/i.test(file.name);
      if (!validType) {
        if (formMessage) formMessage.textContent = 'Only PDF, JPG or PNG files are supported.';
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        if (formMessage) formMessage.textContent = 'This file is over 8 MB. Please choose a smaller file.';
        return;
      }

      const submitButton = uploadForm.querySelector('button[type="submit"]');
      const originalLabel = submitButton ? submitButton.innerHTML : '';
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span>Saving…</span>';
      }

      try {
        await storeResult({
          id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          year,
          title,
          fileName: file.name,
          file,
          createdAt: new Date().toISOString()
        });
        uploadedResults = await readUploadedResults();
        activeYear = String(year);
        renderResults();
        closeDialog(uploadDialog);
        uploadForm.reset();
        const yearField = $('#resultYear');
        if (yearField) yearField.value = '2026';
        showToast('Result added to this browser’s demo archive.');
      } catch (error) {
        if (formMessage) {
          formMessage.textContent = error && error.name === 'QuotaExceededError'
            ? 'This browser is low on storage. Try a smaller file.'
            : 'Could not save the file in this browser. Please try again.';
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = originalLabel;
        }
      }
    });
  }

  readUploadedResults()
    .then((records) => {
      uploadedResults = records;
      renderResults();
    })
    .catch(() => {
      renderResults();
    });

  /* ---------- Event lightbox ---------- */
  const eventDialog = $('#eventDialog');
  const eventImage = $('#eventDialogImage');
  const eventTitle = $('#eventDialogTitle');
  const eventMeta = $('#eventDialogMeta');
  const eventCopy = $('#eventDialogCopy');
  const closeEvent = $('#closeEvent');

  $$('[data-event]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!eventDialog) return;
      if (eventImage) {
        eventImage.src = button.dataset.image || 'assets/sports.svg';
        eventImage.alt = `Illustrative artwork for ${button.dataset.title || 'school event'}`;
      }
      if (eventTitle) eventTitle.textContent = button.dataset.title || 'School event';
      if (eventMeta) eventMeta.textContent = button.dataset.meta || 'School life';
      if (eventCopy) eventCopy.textContent = button.dataset.copy || '';
      openDialog(eventDialog);
    });
  });

  if (closeEvent && eventDialog) closeEvent.addEventListener('click', () => closeDialog(eventDialog));
  if (eventDialog) {
    eventDialog.addEventListener('click', (event) => {
      if (event.target === eventDialog) closeDialog(eventDialog);
    });
  }
  const eventCta = $('#eventDialogCta');
  if (eventCta && eventDialog) eventCta.addEventListener('click', () => closeDialog(eventDialog));
})();
