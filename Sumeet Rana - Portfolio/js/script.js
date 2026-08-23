if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }
window.addEventListener('pageshow', function () { window.scrollTo(0, 0); });

(function () {
  var viewHome = document.getElementById('view-home');
  var caseViews = {
    'lendee': document.getElementById('view-case'),
    'design-system': document.getElementById('view-case-design-system')
  };
  // where the home view was scrolled to when a case study was opened from it
  var homeScrollY = null;
  var nav = document.getElementById('nav');
  var navHomeInner = document.getElementById('navHomeInner');
  var navCaseInner = document.getElementById('navCaseInner');
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  var bar = document.getElementById('progress');
  var navItems = [].slice.call(document.querySelectorAll('[data-nav]'));
  var sections = navItems.map(function (x) { return document.querySelector('#view-home ' + x.getAttribute('href')); }).filter(Boolean);

  /* ---------- reusable word-field (magnetic scatter) ---------- */
  function initWordField(container) {
    if (!container) return { rebuild: function () {} };
    var WORDS = ['UX','DESIGN','RESEARCH','WIREFRAMES','PROTOTYPE','PRODUCT','INTERACTION','SYSTEMS','DISCOVERY','EMPATHY','ACCESSIBILITY','USABILITY'];
    var RADIUS = 190, PUSH = 74, EASE = 0.14;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    var items = [], mx = -99999, my = -99999, active = false, rafId = null;
    function makeRand(seed) { return function () { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; }; }
    function measureWidths() {
      return WORDS.map(function (word) {
        var m = document.createElement('span'); m.className = 'w'; m.style.position = 'absolute'; m.style.visibility = 'hidden'; m.style.left = '-9999px';
        m.textContent = word; container.appendChild(m); var wd = m.getBoundingClientRect().width; container.removeChild(m); return wd;
      });
    }
    function build() {
      container.innerHTML = ''; items = [];
      var W = container.clientWidth, H = container.clientHeight;
      if (W === 0 || H === 0) return;
      var small = W < 640, ROW_H = small ? 46 : 40, GAP = small ? 42 : 30, BAND = 160;
      var rows = Math.ceil(H / ROW_H) + 2, widths = measureWidths();
      var rand = makeRand(0x9e3779b9);
      var frag = document.createDocumentFragment(); var prevRow = [];
      for (var r = 0; r < rows; r++) {
        var x = -((r % 3) * 44 + (r % 2) * 20); var y = r * ROW_H;
        var thisRow = []; var lastIdx = -1, last2Idx = -1;
        while (x < W) {
          var forbidden = {};
          if (lastIdx >= 0) forbidden[lastIdx] = 1;
          if (last2Idx >= 0) forbidden[last2Idx] = 1;
          for (var p = 0; p < prevRow.length; p++) { if (Math.abs(prevRow[p].x - x) < BAND) forbidden[prevRow[p].idx] = 1; }
          var pool = [];
          for (var i = 0; i < WORDS.length; i++) { if (!forbidden[i]) pool.push(i); }
          if (pool.length === 0) { for (var j = 0; j < WORDS.length; j++) pool.push(j); }
          var idx = pool[(rand() * pool.length) | 0];
          var el = document.createElement('span'); el.className = 'w'; el.textContent = WORDS[idx];
          el.style.left = x + 'px'; el.style.top = y + 'px';
          frag.appendChild(el); items.push({ el: el, bx: x, by: y, x: 0, y: 0, px: 0, py: 0 });
          thisRow.push({ idx: idx, x: x });
          last2Idx = lastIdx; lastIdx = idx;
          x += widths[idx] + GAP;
        }
        prevRow = thisRow;
      }
      container.appendChild(frag);
    }
    function tick() {
      var r2 = RADIUS * RADIUS, mX = active ? mx : -99999, mY = active ? my : -99999;
      for (var k = 0; k < items.length; k++) {
        var it = items[k]; var tx = 0, ty = 0;
        if (active) { var dx = it.bx - mX, dy = it.by - mY, d2 = dx * dx + dy * dy; if (d2 < r2) { var d = Math.sqrt(d2) || 0.0001, f = (RADIUS - d) / RADIUS, fall = f * f; tx = (dx / d) * fall * PUSH; ty = (dy / d) * fall * PUSH; } }
        it.x += (tx - it.x) * EASE; it.y += (ty - it.y) * EASE;
        if (Math.abs(it.x) < 0.06 && tx === 0) it.x = 0;
        if (Math.abs(it.y) < 0.06 && ty === 0) it.y = 0;
        if (it.x !== it.px || it.y !== it.py) { it.el.style.transform = 'translate3d(' + it.x.toFixed(2) + 'px,' + it.y.toFixed(2) + 'px,0)'; it.px = it.x; it.py = it.y; }
      }
      rafId = requestAnimationFrame(tick);
    }
    function onMove(e) { var rect = container.getBoundingClientRect(); mx = e.clientX - rect.left; my = e.clientY - rect.top; active = true; }
    function onLeave() { active = false; }
    build();
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(build); }
    var rzT;
    if ('ResizeObserver' in window) { new ResizeObserver(function () { clearTimeout(rzT); rzT = setTimeout(build, 180); }).observe(container); }
    if (!reduceMotion && !coarse) {
      var hero = container.parentElement;
      hero.addEventListener('pointermove', onMove, { passive: true });
      hero.addEventListener('pointerleave', onLeave, { passive: true });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (en.isIntersecting) { if (rafId === null) tick(); } else if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } });
        }, { threshold: 0 }).observe(hero);
      } else { tick(); }
    }
    return { rebuild: build };
  }
  var homeWF = initWordField(document.getElementById('wf-home'));
  var caseWFs = {
    'lendee': initWordField(document.getElementById('wf-case')),
    'design-system': initWordField(document.getElementById('wf-case-ds'))
  };

  /* ---------- active nav indicator (home view only) ---------- */
  function updateActive() {
    if (viewHome.hidden) { navItems.forEach(function (x) { x.classList.remove('active'); }); return; }
    var line = window.innerHeight * 0.3, currentId = null;
    for (var i = 0; i < sections.length; i++) { if (sections[i].getBoundingClientRect().top <= line) currentId = '#' + sections[i].id; }
    navItems.forEach(function (x) { x.classList.toggle('active', x.getAttribute('href') === currentId); });
  }

  /* ---------- view router ---------- */
  function showView(name, target) {
    var toCase = (name !== 'home');
    var scrollToAnchor = target && !toCase;
    /* returning home with no explicit anchor lands exactly where the reader
       left it, so opening a case study and backing out of it is a round trip
       rather than a reset. Captured on the way out (below), consumed here. */
    var restoreY = (!toCase && !target && homeScrollY !== null) ? homeScrollY : 0;
    if (toCase) homeScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

    /* html carries scroll-behavior:smooth, which turns a naive reset into an
       animated run back up from wherever the previous view was scrolled to —
       the new view flashes in mid-page and then travels. Setting the scroll
       *before* the content swap, while the old layout is still what's on
       screen, means there is nothing for the browser to visually correct
       afterward: the swap always happens at the position we asked for. */
    var root = document.documentElement;
    var prevBehavior = root.style.scrollBehavior;
    if (!scrollToAnchor) {
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, restoreY);
    }

    viewHome.hidden = toCase;
    Object.keys(caseViews).forEach(function (key) {
      var v = caseViews[key];
      if (v) v.hidden = !(toCase && key === name);
    });
    navHomeInner.hidden = toCase;
    navCaseInner.hidden = !toCase;
    document.body.classList.toggle('reading', toCase);
    if (toCase) { if (caseWFs[name]) caseWFs[name].rebuild(); } else { homeWF.rebuild(); }
    if (toCase) { buildTOC(caseViews[name]); } else { tocEntries = []; closeTOC(); }
    updateActive();
    if (scrollToAnchor) {
      var t = document.querySelector('#view-home ' + target); if (t) t.scrollIntoView();
    } else {
      // belt-and-suspenders: re-assert after the browser has actually painted
      // the swap, in case anything (scroll anchoring included) nudged it
      requestAnimationFrame(function () {
        window.scrollTo(0, restoreY);
        root.style.scrollBehavior = prevBehavior;
      });
    }
  }

  /* ---------- case-study table of contents ----------
     Built from whichever case view is open, so both case studies get one for
     free. Tracks the section under the reading line and reflects it both in the
     panel and on the closed button, which is the only place a reader who never
     opens the panel finds out where they are. */
  var tocWrap = document.getElementById('navToc');
  var tocBtn = document.getElementById('tocBtn');
  var tocPanel = document.getElementById('tocPanel');
  var tocHere = document.getElementById('tocHere');
  var tocEntries = [];

  function addTocLink(target, label, num, isSub) {
    var a = document.createElement('a');
    a.className = 'toc-link' + (isSub ? ' toc-sub' : '');
    a.href = '#' + target.id;
    a.innerHTML = (num ? '<span class="toc-n">' + num + '</span>' : '<span class="toc-n"></span>') +
      '<span>' + label + '</span>';
    a.addEventListener('click', function (e) {
      e.preventDefault();
      // must not bubble: the global anchor handler treats any in-page "#" link
      // while a case is open as a request to go back to the home view
      e.stopPropagation();
      closeTOC();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    tocPanel.appendChild(a);
    // only top-level entries drive the button label; sub-entries just highlight
    tocEntries.push({ el: a, node: target, label: label, isSub: isSub });
  }

  function buildTOC(view) {
    if (!tocPanel || !view) return;
    tocEntries = [];
    tocPanel.innerHTML = '';
    var heads = [].slice.call(view.querySelectorAll('.cs-head'));
    heads.forEach(function (head, i) {
      var section = head.closest('section');
      if (!section) return;
      if (!section.id) section.id = view.id + '-sec-' + i;
      var idx = head.querySelector('.cs-index');
      var title = head.querySelector('h2');
      // an index can carry more than one separator ("05 · Act 1 · First Time
      // Home"), so everything past the number is the label, not just the
      // next segment — splitting on [1] alone truncated it to "Act 1"
      var parts = idx ? idx.textContent.split('·') : [];
      var num = idx ? parts[0].trim() : String(i + 1);
      var label = parts.slice(1).join('·').trim();
      if (!label) label = title ? title.textContent : 'Section';
      addTocLink(section, label, num, false);

      // sub-entries: every sub-heading in the section, in either case study
      var subs = [].slice.call(section.querySelectorAll('.subhead'));
      subs.forEach(function (sub, j) {
        if (!sub.id) sub.id = section.id + '-sub-' + j;
        addTocLink(sub, sub.querySelector('.subhead-t').textContent, '', true);
      });
    });
    tocPanel.hidden = tocEntries.length === 0;
    updateTOCActive();
  }

  function updateTOCActive() {
    if (!tocEntries.length) return;
    var line = window.innerHeight * 0.28;
    var current = null, currentTop = null;
    tocEntries.forEach(function (en) {
      if (en.node.getBoundingClientRect().top <= line) {
        current = en;
        if (!en.isSub) currentTop = en;
      }
    });
    tocEntries.forEach(function (en) { en.el.classList.toggle('is-current', en === current); });
    if (tocHere) {
      // above the first section the button is just the icon; the label appears
      // once a section is actually under the reading line
      if (currentTop) {
        tocHere.textContent = currentTop.label;
        tocBtn.classList.add('has-here');
      } else {
        tocBtn.classList.remove('has-here');
      }
    }
  }

  /* Hover opens the panel transiently; a click *pins* it so it survives the
     pointer leaving. Without the pin, a desktop click was a no-op: mouseenter
     had already opened the panel, so the click read it as open and closed it
     again in the same gesture. */
  var tocPinned = false;
  function openTOC() { if (tocWrap) { tocWrap.classList.add('open'); tocBtn.setAttribute('aria-expanded', 'true'); } }
  function closeTOC() { tocPinned = false; if (tocWrap) { tocWrap.classList.remove('open'); tocBtn.setAttribute('aria-expanded', 'false'); } }

  if (tocBtn && tocWrap) {
    tocBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (tocPinned) closeTOC(); else { tocPinned = true; openTOC(); }
    });
    // hover only where there is a real pointer; touch relies on the click above
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      tocWrap.addEventListener('mouseenter', openTOC);
      tocWrap.addEventListener('mouseleave', function () { if (!tocPinned) closeTOC(); });
    }
    document.addEventListener('click', function (e) {
      if (!tocWrap.contains(e.target)) closeTOC();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeTOC(); });
  }

  /* ---------- scroll: glass + active + reading progress ---------- */
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 24);
    updateActive();
    updateTOCActive();
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateActive, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  if (toggle) {
    toggle.addEventListener('click', function () { var open = links.classList.toggle('open'); toggle.classList.toggle('open', open); toggle.setAttribute('aria-expanded', open ? 'true' : 'false'); });
    links.querySelectorAll('a').forEach(function (x) { x.addEventListener('click', function () { links.classList.remove('open'); toggle.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }); });
  }

  /* ---------- clicks: open case + in-page / cross-view nav ---------- */
  var caseLoader = document.getElementById('caseLoader');
  var CASE_LOADER_MS = 1300; // matches the sweep's one-cycle CSS duration exactly
  function openCaseWithLoader(name) {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!caseLoader || reduceMotion) { showView(name); return; }
    caseLoader.classList.add('is-active');
    setTimeout(function () {
      showView(name);
      caseLoader.classList.remove('is-active');
    }, CASE_LOADER_MS);
  }
  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-open-case]');
    if (opener) { e.preventDefault(); openCaseWithLoader(opener.getAttribute('data-open-case') || 'lendee'); return; }
    var a = e.target.closest('a[href]');
    if (!a) return;
    if (a.classList.contains('toc-link')) return; // owns its own scrolling
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) !== '#') return;
    e.preventDefault();
    var homeVisible = !viewHome.hidden;
    if (href === '#' || href === '#top') {
      if (homeVisible) window.scrollTo({ top: 0, behavior: 'smooth' }); else showView('home');
      return;
    }
    // an in-page link inside an open case study should scroll within that
    // case, not fall through to the home-only lookup below
    if (!homeVisible) {
      for (var key in caseViews) {
        var view = caseViews[key];
        if (view && !view.hidden) {
          var inCase = view.querySelector(href);
          if (inCase) { inCase.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
        }
      }
    }
    if (homeVisible) {
      var t = document.querySelector('#view-home ' + href);
      if (t) {
        // scroll to the heading itself, not the section's own padded box:
        // scroll-margin-top on .section-head (in CSS) handles the nav
        // clearance natively, so it's correct regardless of how the click
        // was triggered, mouse, keyboard, or the mobile panel closing
        var marker = t.querySelector('.section-head') || t;
        marker.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    else { showView('home', href); }
  });

  /* ---------- scroll reveals (staggered) ---------- */
  (function () {
    var els = [].slice.call(document.querySelectorAll('.reveal'));
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          var sibs = [].slice.call(el.parentElement.querySelectorAll(':scope > .reveal'));
          var i = Math.max(0, sibs.indexOf(el));
          el.style.transitionDelay = (i * 70) + 'ms';
          el.classList.add('in'); obs.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- stat numbers count up once, on scroll ----------
     Finds every number inside a stat badge and animates it up from zero
     the moment the badge crosses into view, reusing the same threshold/
     rootMargin as the reveal observer above. Works on any mix of numbers
     in the string (percentages, "343 → 75", "0.71 → 0.03", "8/8"...) by
     re-inserting each animated value back into its original position,
     so surrounding text/signs/arrows never move. */
  (function () {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var els = [].slice.call(document.querySelectorAll('.ev .n, .fs .n, .oc .n, .pp, .cst-pill'));
    if (!els.length || reduceMotion || !('IntersectionObserver' in window)) return;

    function tokens(str) {
      var re = /-?\d+(?:\.\d+)?/g, out = [], m;
      while ((m = re.exec(str))) out.push({ i: m.index, raw: m[0], v: parseFloat(m[0]), d: (m[0].split('.')[1] || '').length });
      return out;
    }
    function run(el) {
      var original = el.textContent, toks = tokens(original);
      if (!toks.length) return;
      var dur = 900, start = null;
      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        var out = '', last = 0;
        toks.forEach(function (t) {
          out += original.slice(last, t.i);
          out += (t.v * eased).toFixed(t.d);
          last = t.i + t.raw.length;
        });
        out += original.slice(last);
        el.textContent = out;
        if (p < 1) requestAnimationFrame(frame); else el.textContent = original;
      }
      requestAnimationFrame(frame);
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); obs.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- the "I write" document types itself in once, on scroll, with the
     same human-ish key timing and caret-walk corrections as a real editing
     session: line one, a break, line two typing "eight" and catching itself
     down to "seven", then — after the line reads as finished — the caret
     walks back into the middle of the sentence to insert a parenthetical,
     exactly like arrowing back to fix a line you already typed past. The
     element's own text is the final, correct draft, so a no-JS or
     reduced-motion reader sees the finished document with nothing to wait
     through. ---------- */
  (function () {
    var el = document.getElementById('write-doc');
    if (!el) return;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // the HTML already carries the finished, correct draft as plain text —
    // reduced-motion (and no-JS) readers see exactly that and nothing runs
    if (reduceMotion) { return; }
    // for everyone else, clear that static draft immediately so there's no
    // flash of the finished text before typing takes over
    el.textContent = '';

    var text = '', caret = 0;
    var RATE = 0.48; // slower than the previous pass, still brisker than the reference's own "FAST" preset (0.55)

    function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function render() {
      el.innerHTML = esc(text.slice(0, caret)) + '<span class="doc-caret"></span>' + esc(text.slice(caret));
    }
    function busy(on) { el.classList.toggle('is-busy', on); }

    // slower after punctuation, the odd mid-sentence hesitation — the same
    // shape a person's typing actually has, not a metronome
    function keyDelay(ch, prev) {
      var d = 58 + Math.random() * 54;
      if (ch === ' ') d += 16;
      if (prev === '.' || prev === ',' || prev === '?') d += 240;
      if (prev === ' ' && Math.random() < 0.10) d += 170;
      if (Math.random() < 0.04) d += 200;
      return d * RATE;
    }

    function type(s, onDone) {
      busy(true);
      var i = 0;
      (function step() {
        var ch = s[i];
        text = text.slice(0, caret) + ch + text.slice(caret);
        caret++; i++; render();
        if (i < s.length) {
          setTimeout(step, keyDelay(ch, s[i - 1]));
        } else {
          busy(false); if (onDone) onDone();
        }
      })();
    }
    function backspaceN(n, onDone) {
      busy(true);
      var i = 0;
      (function step() {
        if (caret === 0) { busy(false); if (onDone) onDone(); return; }
        text = text.slice(0, caret - 1) + text.slice(caret);
        caret--; i++; render();
        if (i < n) {
          setTimeout(step, (52 + Math.random() * 26) * RATE);
        } else {
          busy(false); if (onDone) onDone();
        }
      })();
    }
    function left(n, onDone) { // arrow key: caret walks, text untouched
      busy(true);
      var i = 0;
      (function step() {
        if (caret === 0) { busy(false); if (onDone) onDone(); return; }
        caret--; i++; render();
        if (i < n) {
          setTimeout(step, (38 + Math.random() * 14) * RATE);
        } else {
          busy(false); if (onDone) onDone();
        }
      })();
    }
    function enter(onDone) {
      text = text.slice(0, caret) + '\n' + text.slice(caret);
      caret++; render();
      setTimeout(onDone, 300 * RATE);
    }
    function pause(ms, onDone) { setTimeout(onDone, ms * RATE); }
    // a click at the end of the document, not an animated walk — there's no
    // reason a person would arrow-key past ninety characters to get there
    function toEnd(onDone) {
      caret = text.length; render();
      setTimeout(onDone, 120 * RATE);
    }

    function run() {
      render();
      pause(500, function () {
        type('Outside of work, I write fiction.', function () {
          pause(400, function () {
            enter(function () {
              type('Currently juggling eight', function () {
                pause(660, function () { // the beat where the draft notices its own number
                  backspaceN(5, function () { // "eight" gone, "Currently juggling " remains
                    pause(200, function () {
                      type("seven points of view across evenings and weekends on my first novel. The antagonist is usually the one that makes more sense to me.", function () {
                        pause(780, function () { // the line reads as finished
                          left(48, function () { // walk back to just after "antagonist"
                            pause(300, function () {
                              type(' (trying hard to show him as the villain)', function () { // U+2009 thin space: a real separator, narrower than the wide gap a full space left next to Arial's "("
                                pause(400, function () {
                                  toEnd(function () { enter(function () {}); });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    }

    if (!('IntersectionObserver' in window)) { run(); return; }
    // a fast nav-jump scroll can carry this section through the 50% threshold
    // in transit, without the reader ever actually looking at it — only start
    // once it's stayed in view long enough to mean someone is actually here
    var dwellTimer = null;
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          if (dwellTimer) return;
          dwellTimer = setTimeout(function () { run(); obs.disconnect(); }, 350);
        } else if (dwellTimer) {
          clearTimeout(dwellTimer);
          dwellTimer = null;
        }
      });
    }, { threshold: 0.5 });
    io.observe(el);
  })();

  /* ---------- the exhibit theme/breakpoint switches pin to the right, under the
     floating "Contents" button, and slide clear of it once their sticky offset
     actually engages. Plain scroll-position check — cheapest way to know a sticky
     element is currently stuck (its own rect.top gets clamped to the offset). ---------- */
  (function () {
    var switches = [].slice.call(document.querySelectorAll('.sem-sticky--inset > .pill-toggle'));
    var tocBtnEl = document.getElementById('tocBtn');
    if (!switches.length) return;
    var SWITCH_TOP = 20, GAP = 12;
    // the switch slides sideways to clear the floating Contents button, which
    // only exists as a problem on desktop. On mobile CSS pins it right and the
    // inline `top` written below would fight that, so the whole branch is off.
    function isMobile() { return window.matchMedia('(max-width:640px)').matches; }
    function setShift() {
      /* The Contents button grows and shrinks with its section label, so the
         offset is measured live rather than derived from a formula: the switch
         has to end up exactly GAP to the left of the button, and its own natural
         right edge depends on the exhibit's padding, not on anything knowable
         up front. Vertical centres are matched the same way. */
      if (tocBtnEl && switches.length && !isMobile()) {
        var tr = tocBtnEl.getBoundingClientRect();
        if (tr.width) {
          var tocCentre = tr.top + tr.height / 2;
          switches.forEach(function (sw) {
            /* measure the wrapper, never the switch: the switch carries the
               transform, so reading its own rect feeds the last shift back into
               the next one and the offset drifts. The wrapper's right edge is
               the switch's untransformed right edge. */
            var wrap = sw.parentElement;
            var need = Math.max(0, Math.round(wrap.getBoundingClientRect().right - (tr.left - GAP)));
            sw.style.setProperty('--toc-shift', need + 'px');
            wrap.style.top = Math.round(tocCentre - sw.getBoundingClientRect().height / 2) + 'px';
          });
        }
      }
    }
    function update() {
      setShift();
      switches.forEach(function (sw) {
        if (isMobile()) {
          // clear anything a wider viewport left behind, then let CSS own it
          sw.parentElement.style.top = '';
          sw.classList.remove('is-shifted');
          return;
        }
        var pinned = parseFloat(sw.parentElement.style.top) || SWITCH_TOP;
        sw.classList.toggle('is-shifted', sw.getBoundingClientRect().top <= pinned + 0.5);
      });
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', setShift);
    update();
  })();

  /* ---------- auto-hide device chrome: header/navbar hide on scroll-down, reveal on scroll-up ---------- */
  function initAutoHideChrome(device) {
    var scroller = device.querySelector('.screen-scroll');
    var header = device.querySelector('.screen-header');
    var navbar = device.querySelector('.screen-navbar');
    var content = device.querySelector('.screen-content');
    if (!scroller || (!header && !navbar)) return;
    var THRESH = 10, EDGE = 4;

    // black/white header switch point: tracks the actual height of the dark hero
    // section behind it, so the header only turns white once that section has
    // scrolled out from underneath it (not at a fixed scroll distance)
    var darkSection = device.querySelector('[data-black-height-ratio]');
    function scrolledThreshold() {
      if (!darkSection) return EDGE;
      var ratio = parseFloat(darkSection.getAttribute('data-black-height-ratio')) || 0;
      return darkSection.getBoundingClientRect().height * ratio;
    }

    var isStaged = header && header.classList.contains('screen-header--staged');

    // Header and navbar hide/show via transform. The header's own height is
    // reserved permanently by a static spacer ahead of .screen-content, so
    // when the header hides, that reserved space would otherwise sit there
    // as a blank gap — .screen-content gets shifted up by the header's
    // height to close it, and back down when the header reappears.
    //
    // Both flip state based on cumulative distance from the last direction
    // change (an "anchor"), not the raw delta of a single scroll event — a
    // couple of jittery pixels during momentum scrolling can't flip state
    // back and forth this way.
    var headerHidden = false, headerAnchor = 0;
    var navHidden = false, navAnchor = 0;

    scroller.addEventListener('scroll', function () {
      var top = scroller.scrollTop;
      var maxTop = scroller.scrollHeight - scroller.clientHeight;

      if (header && !isStaged) {
        var wasHidden = headerHidden;
        if (!headerHidden) {
          if (top <= EDGE) headerAnchor = top;
          else if (top - headerAnchor > THRESH) { headerHidden = true; header.classList.add('is-hidden'); headerAnchor = top; }
          else if (top < headerAnchor) headerAnchor = top;
        } else {
          if (headerAnchor - top > THRESH) { headerHidden = false; header.classList.remove('is-hidden'); headerAnchor = top; }
          else if (top > headerAnchor) headerAnchor = top;
        }
        if (content && headerHidden !== wasHidden) {
          content.style.transform = headerHidden ? 'translateY(-' + header.getBoundingClientRect().height + 'px)' : '';
        }
        header.classList.toggle('is-scrolled', top > scrolledThreshold());
      }

      if (navbar) {
        if (top >= maxTop - EDGE) {
          if (navHidden) { navHidden = false; navbar.classList.remove('is-hidden'); }
          navAnchor = top;
        } else if (!navHidden) {
          if (top - navAnchor > THRESH) { navHidden = true; navbar.classList.add('is-hidden'); navAnchor = top; }
          else if (top < navAnchor) navAnchor = top;
        } else {
          if (navAnchor - top > THRESH) { navHidden = false; navbar.classList.remove('is-hidden'); navAnchor = top; }
          else if (top > navAnchor) navAnchor = top;
        }
      }
    }, { passive: true });
  }
  [].slice.call(document.querySelectorAll('.device--autohide')).forEach(function (device) {
    var panels = device.querySelectorAll('.tab-panel');
    if (panels.length) { [].slice.call(panels).forEach(initAutoHideChrome); }
    else { initAutoHideChrome(device); }
  });

  /* ---------- in-device tabs: switch between full header/filtration/list/navbar panels ---------- */
  function initDeviceTabs(device) {
    var panels = [].slice.call(device.querySelectorAll('.tab-panel'));
    if (!panels.length) return;
    device.addEventListener('click', function (e) {
      var btn = e.target.closest('.tab-hit');
      if (!btn) return;
      var targetName = btn.getAttribute('data-tab-target');
      panels.forEach(function (panel) {
        var isTarget = panel.getAttribute('data-tab-panel') === targetName;
        panel.hidden = !isTarget;
        if (isTarget) {
          var sc = panel.querySelector('.screen-scroll');
          if (sc) sc.scrollTop = 0;
        }
      });
    });
  }
  [].slice.call(document.querySelectorAll('.device--tabs')).forEach(initDeviceTabs);

  /* ---------- staged header: hidden -> compact (arrow+switcher) -> full (+title) ---------- */
  function initPaymentHeaderCascade(panel) {
    var header = panel.querySelector('.screen-header--staged');
    var subnav = panel.querySelector('.ph-subnav');
    var scroller = panel.querySelector('.screen-scroll');
    var content = panel.querySelector('.screen-content');
    if (!header || !scroller || !subnav) return;
    var THRESH = 10, EDGE = 4;
    var headerH = 0, measured = false, headerHidden = false, anchor = 0;

    // Subnav (switcher + filter chips) is the one thing on this screen
    // that's explicitly supposed to stay pinned/visible at all times: its
    // transform is recomputed every scroll event from a self-correcting
    // formula (target minus its natural position), so it snaps flush against
    // the header immediately on any state change and then just stays put no
    // matter how much further you scroll.
    //
    // The list below it keeps scrolling normally, but its static layout
    // still reserves the header's full height ahead of it (via the header
    // spacer), same as the subnav's "natural" position does. So it needs the
    // same close-the-gap shift every other auto-hide screen's content gets:
    // translate up by the header's height while the header is hidden, back
    // to 0 when it reappears.
    //
    // The header's hide/show flip is driven by cumulative distance from the
    // last direction change (an "anchor"), not a single scroll event's raw
    // delta, so a couple of jittery pixels during momentum scrolling can't
    // flip state back and forth (that was the subnav-fluctuating bug).
    function measure() {
      var h = header.getBoundingClientRect().height;
      if (!h) return false;
      headerH = h;
      measured = true;
      return true;
    }

    function layoutSubnav(top) {
      if (!measured && !measure()) return;
      var target = headerHidden ? 0 : headerH;
      var natural = headerH - top; // subnav's position if it were plain static content
      subnav.style.transform = 'translateY(' + (target - natural) + 'px)';
    }

    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { if (!measured) layoutSubnav(scroller.scrollTop); }).observe(header);
    }

    scroller.addEventListener('scroll', function () {
      var top = scroller.scrollTop;
      var wasHidden = headerHidden;
      if (!headerHidden) {
        if (top <= EDGE) anchor = top;
        else if (top - anchor > THRESH) { headerHidden = true; header.classList.add('is-hidden'); anchor = top; }
        else if (top < anchor) anchor = top;
      } else {
        if (anchor - top > THRESH) { headerHidden = false; header.classList.remove('is-hidden'); anchor = top; }
        else if (top > anchor) anchor = top;
      }
      layoutSubnav(top); // continuous — subnav stays pinned
      if (content && measured && headerHidden !== wasHidden) {
        content.style.transform = headerHidden ? 'translateY(-' + headerH + 'px)' : '';
      }
    }, { passive: true });
  }
  [].slice.call(document.querySelectorAll('.screen-header--staged')).forEach(function (header) {
    initPaymentHeaderCascade(header.closest('.tab-panel') || header.closest('.device'));
  });

  /* ---------- hovering a decision card scrolls the "after" phone so that
     feature sits centered in view — the primary move, always. If the card
     also carries data-scroll-before (i.e. the thing it describes has a real
     counterpart in the old design), the "before" phone gets the same
     centered treatment as a secondary move; cards describing something
     wholly new (no data-scroll-before) leave the "before" phone alone.
     Desktop-only (mouse + the min-width where the phones sit sticky beside
     the decisions) — on touch/narrow layouts the frames aren't even
     alongside the text, so there's nothing to scroll into view. Also reacts
     to scrolling alone: if the page moves a different card under a
     stationary pointer, that card activates too, same as if the mouse had
     moved into it. ---------- */
  (function () {
    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var wideEnough = window.matchMedia('(min-width: 1000px)').matches;
    if (!canHover || !wideEnough) return;

    var cards = [].slice.call(document.querySelectorAll('.decision[data-scroll]'));
    if (!cards.length) return;

    function centerOn(scroller, frac) {
      if (!scroller) return;
      var maxTop = scroller.scrollHeight - scroller.clientHeight;
      if (maxTop <= 0) return;
      var target = Math.max(0, Math.min(maxTop, frac * scroller.scrollHeight - scroller.clientHeight / 2));
      if (Math.abs(scroller.scrollTop - target) < 6) return;
      scroller.scrollTo({ top: target, behavior: 'smooth' });
    }

    var active = null;
    function activate(card) {
      if (!card || card === active) return;
      active = card;
      var act = card.closest('.act');
      if (!act) return;
      var afterScroller = act.querySelector('.compare .device--autohide .screen-scroll');
      centerOn(afterScroller, parseFloat(card.getAttribute('data-scroll')));

      var beforeFrac = card.getAttribute('data-scroll-before');
      if (beforeFrac === null) return; // this feature is new — nothing to compare, leave "before" alone
      var beforeScroller = act.querySelector('.compare .device--live:not(.device--autohide) .screen-scroll');
      centerOn(beforeScroller, parseFloat(beforeFrac));
    }

    cards.forEach(function (card) {
      card.addEventListener('mouseenter', function () { activate(card); });
    });

    // catches the mouse-stays-still-but-page-scrolls case
    var lastX = -1, lastY = -1, ticking = false;
    document.addEventListener('mousemove', function (e) { lastX = e.clientX; lastY = e.clientY; }, { passive: true });
    window.addEventListener('scroll', function () {
      if (ticking || lastX < 0) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var el = document.elementFromPoint(lastX, lastY);
        var card = el && el.closest && el.closest('.decision[data-scroll]');
        if (card) activate(card);
        else active = null;
      });
    }, { passive: true });
  })();

  /* ---------- Denefits case study: interactive exhibits ----------
     Every value below is the real shipped token, read from the Figma file.
     The seven contract rows in the matrix exhibit are recomputed live in the
     browser from these hexes and reproduce the certification board exactly. */
  (function () {
    var colourEx = document.getElementById('ex-colour');
    if (!colourEx) return; // exhibits only exist on the design-system case

    var PALETTE = {
      Blue:    {50:"#EEF6FF",100:"#DBEBFF",200:"#BCDBFF",300:"#75B3FC",400:"#3D91EC",500:"#0073D4",600:"#0061B4",700:"#004F94",800:"#00386C",900:"#002449",950:"#001937"},
      Green:   {50:"#EDF9EF",100:"#D8F1DC",200:"#B7E5BF",300:"#7CC38B",400:"#41A15C",500:"#00853B",600:"#007031",700:"#005C27",800:"#00451B",900:"#002D0F",950:"#002109"},
      Amber:   {50:"#FAF4EB",100:"#F4E8D4",200:"#EBD4AF",300:"#CBAA72",400:"#B2883B",500:"#976B00",600:"#805A00",700:"#694900",800:"#4B3300",900:"#322000",950:"#241700"},
      Red:     {50:"#FFF2F0",100:"#FFE2DE",200:"#FFC8C1",300:"#F48F84",400:"#E5685D",500:"#CB443D",600:"#B0332E",700:"#932622",800:"#691211",900:"#470808",950:"#350505"},
      Neutral: {50:"#F4F5F6",100:"#E8EAEB",200:"#D6D8DA",300:"#ADB0B3",400:"#8C8F92",500:"#717376",600:"#5E6164",700:"#4C4F52",750:"#414447",800:"#36383B",850:"#2C2E31",900:"#222427",950:"#181A1C"}
    };
    var CONTRACT_TONES = [400, 500, 600, 700];
    var WHITE = '#FFFFFF';

    function srgbToLinear(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    function hexToRgb(hex) { hex = hex.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(hex.slice(i, i + 2), 16); }); }
    function relLuminance(hex) { var rgb = hexToRgb(hex).map(srgbToLinear); return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]; }
    function contrastRatio(hexA, hexB) {
      var yA = relLuminance(hexA), yB = relLuminance(hexB);
      var lighter = Math.max(yA, yB), darker = Math.min(yA, yB);
      return (lighter + 0.05) / (darker + 0.05);
    }
    function contrastVsWhite(hex) { return contrastRatio(hex, WHITE); }

    /* The semantic layer: every token, both themes, with the job it does.
       [name, lightHex, darkHex, useItFor] */
    var P = PALETTE;
    var SEMANTIC_GROUPS = [
      { group: 'Background', tokens: [
        ['Default', WHITE, P.Neutral[950], 'the page, everything sits on this'],
        ['Subtle', P.Neutral[50], P.Neutral[900], 'a quiet wash separating a region'],
        ['Muted', P.Neutral[100], P.Neutral[850], 'table headers, inset panels'],
        ['Raised', WHITE, P.Neutral[900], 'cards and raised surfaces'],
        ['Overlay', WHITE, P.Neutral[800], 'modals, popovers, menus'],
        ['Inverse', P.Neutral[950], WHITE, 'tooltips and inverted callouts'],
        ['Brand', P.Blue[500], P.Blue[400], 'the brand fill'],
        ['Brand-Subtle', P.Blue[50], P.Blue[950], 'selected rows, info panels'],
        ['Disabled', P.Neutral[100], P.Neutral[800], 'disabled control surface'],
        ['Scrim', 'rgba(24,26,28,.55)', 'rgba(24,26,28,.65)', 'the dim behind a modal']
      ]},
      { group: 'Text', tokens: [
        ['Primary', P.Neutral[950], WHITE, 'body and headings'],
        ['Secondary', P.Neutral[700], P.Neutral[200], 'supporting copy, descriptions'],
        ['Tertiary', P.Neutral[600], P.Neutral[300], 'timestamps, hints, metadata'],
        ['Disabled', P.Neutral[400], P.Neutral[600], 'disabled labels'],
        ['Inverse', WHITE, P.Neutral[950], 'the only ink legal on Background/Inverse'],
        ['Brand', P.Blue[600], P.Blue[300], 'brand-colored text'],
        ['Link', P.Blue[700], P.Blue[300], 'inline links, must carry an underline too'],
        ['OnBrand', WHITE, P.Neutral[950], 'on Action/Primary'],
        ['OnSuccess', WHITE, P.Neutral[950], 'on Status/Success'],
        ['OnWarning', WHITE, P.Neutral[950], 'on Status/Warning'],
        ['OnDanger', WHITE, P.Neutral[950], 'on Action/Danger']
      ]},
      { group: 'Icon', tokens: [
        ['Primary', P.Neutral[900], P.Neutral[100], 'default icon color'],
        ['Secondary', P.Neutral[700], P.Neutral[300], 'supporting icons'],
        ['Tertiary', P.Neutral[600], P.Neutral[400], 'decorative icons'],
        ['Disabled', P.Neutral[300], P.Neutral[700], 'disabled icons'],
        ['Brand', P.Blue[500], P.Blue[400], 'brand-colored icons'],
        ['Inverse', WHITE, P.Neutral[950], 'on Background/Inverse'],
        ['OnBrand', WHITE, P.Neutral[950], 'on a brand fill']
      ]},
      { group: 'Border', tokens: [
        ['Default', P.Neutral[200], P.Neutral[800], 'standard 1px boundary'],
        ['Subtle', P.Neutral[100], P.Neutral[850], 'dividers inside a card'],
        ['Strong', P.Neutral[500], P.Neutral[400], 'inputs, checkboxes, clears 3:1'],
        ['Disabled', P.Neutral[200], P.Neutral[800], 'disabled control boundary'],
        ['Brand', P.Blue[500], P.Blue[400], 'selected and active boundaries'],
        ['Focus', P.Blue[600], P.Blue[300], 'focus ring, needs a 2px offset gap'],
        ['Inverse', P.Neutral[700], P.Neutral[300], 'boundaries on Background/Inverse'],
        ['Overlay', P.Neutral[400], P.Neutral[400], 'the 1px boundary an overlay carries as well as its shadow']
      ]},
      { group: 'Action', tokens: [
        ['Primary', P.Blue[500], P.Blue[400], 'primary button rest'],
        ['Primary-Hover', P.Blue[600], P.Blue[300], 'darkens on light, lightens on dark'],
        ['Primary-Pressed', P.Blue[700], P.Blue[200], 'one step beyond hover'],
        ['Primary-Disabled', P.Neutral[200], P.Neutral[800], 'neutral, never a faded brand'],
        ['Secondary', WHITE, P.Neutral[850], 'outline button, weight not a second hue'],
        ['Secondary-Hover', P.Neutral[50], P.Neutral[800], 'secondary hover'],
        ['Secondary-Pressed', P.Neutral[100], P.Neutral[750], 'secondary pressed'],
        ['Danger', P.Red[500], P.Red[400], 'destructive rest'],
        ['Danger-Hover', P.Red[600], P.Red[300], 'destructive hover'],
        ['Danger-Pressed', P.Red[700], P.Red[200], 'destructive pressed']
      ]},
      { group: 'Status', tokens: [
        ['Success', P.Green[500], P.Green[400], 'paid, completed, approved'],
        ['Success-Subtle', P.Green[50], P.Green[950], 'paid chip surface'],
        ['Success-Ink', P.Green[600], P.Green[300], 'paid text and icons'],
        ['Warning', P.Amber[500], P.Amber[400], 'pending, due soon'],
        ['Warning-Subtle', P.Amber[50], P.Amber[950], 'pending chip surface'],
        ['Warning-Ink', P.Amber[600], P.Amber[300], 'pending text and icons'],
        ['Danger', P.Red[500], P.Red[400], 'overdue, failed, declined'],
        ['Danger-Subtle', P.Red[50], P.Red[950], 'overdue chip surface'],
        ['Danger-Ink', P.Red[600], P.Red[300], 'overdue text and icons'],
        ['Info', P.Blue[500], P.Blue[400], 'scheduled, informational'],
        ['Info-Subtle', P.Blue[50], P.Blue[950], 'scheduled chip surface'],
        ['Info-Ink', P.Blue[600], P.Blue[300], 'scheduled text and icons'],
        ['Neutral', P.Neutral[500], P.Neutral[400], 'cancelled, closed, written off'],
        ['Neutral-Subtle', P.Neutral[100], P.Neutral[850], 'inactive chip surface'],
        ['Neutral-Ink', P.Neutral[700], P.Neutral[300], 'inactive text and icons']
      ]},
      { group: 'Shadow', tokens: [
        ['Contact', 'rgba(24,26,28,.08)', 'rgba(0,0,0,.32)', 'the tight near-surface layer of a two-layer shadow'],
        ['Ambient', 'rgba(24,26,28,.04)', 'rgba(0,0,0,.24)', 'the broad far layer, carries how far off the surface sits'],
        ['Edge', 'rgba(24,26,28,.04)', 'rgba(255,255,255,.08)', 'the 1px inset top edge that expresses elevation in dark mode']
      ]}
    ];

    /* A semantic token's job is to alias a primitive, so the table shows the alias
       rather than the hex. The map is derived from the palette instead of typed,
       which means a value that resolves to nothing is visible as exactly what it
       would be in the real file: a hardcoded value the layer model forbids. */
    var HEX_TO_PRIM = { '#FFFFFF': 'Color/White', '#000000': 'Color/Black' };
    Object.keys(PALETTE).forEach(function (fam) {
      Object.keys(PALETTE[fam]).forEach(function (tone) {
        HEX_TO_PRIM[PALETTE[fam][tone].toUpperCase()] = 'Color/' + fam + '/' + tone;
      });
    });
    // the alpha primitives are not on the tonal ramps, so they are named directly
    var ALPHA_PRIM = {
      'rgba(24,26,28,.55)': 'Color/Black-Alpha/48',
      'rgba(24,26,28,.65)': 'Color/Black-Alpha/64',
      'rgba(24,26,28,.08)': 'Color/Black-Alpha/8',
      'rgba(24,26,28,.04)': 'Color/Black-Alpha/4',
      'rgba(0,0,0,.32)': 'Color/Black-Alpha/32',
      'rgba(0,0,0,.24)': 'Color/Black-Alpha/24',
      'rgba(255,255,255,.08)': 'Color/White-Alpha/8'
    };
    function primOf(value) {
      if (ALPHA_PRIM[value]) return ALPHA_PRIM[value];
      return HEX_TO_PRIM[String(value).toUpperCase()] || '⚠ not a primitive';
    }

    // flat lookup: 'Group/Token' -> {light, dark}
    var SEM = {};
    SEMANTIC_GROUPS.forEach(function (g) {
      g.tokens.forEach(function (t) { SEM[g.group + '/' + t[0]] = { light: t[1], dark: t[2] }; });
    });
    function tok(name, mode) { return SEM[name] ? SEM[name][mode] : '#000'; }

    // ---- colour ramps ----
    var FAMILIES = ['Blue', 'Green', 'Amber', 'Red', 'Neutral'];
    var ramps = document.getElementById('colour-ramps');
    if (ramps) {
      var html = '';
      FAMILIES.forEach(function (fam) {
        var tones = Object.keys(PALETTE[fam]).map(Number).sort(function (a, b) { return a - b; });
        html += '<div class="fam-row"><div class="fam-label">' + fam + '</div><div class="ramp ramp-' + tones.length + '">';
        tones.forEach(function (t) {
          var hex = PALETTE[fam][t];
          var isContract = CONTRACT_TONES.indexOf(t) !== -1;
          html += '<div class="swatch" style="background:' + hex + '" data-hex="' + hex + '" data-tone="' + t + '" data-contract="' + isContract + '">' +
            '<span class="tone">' + t + '</span>' + (isContract ? '<span class="contrast-badge" data-badge></span>' : '') + '</div>';
        });
        html += '</div></div>';
      });
      ramps.innerHTML = html;

      var exhibitTooltip = document.createElement('div');
      exhibitTooltip.className = 'exhibit-tooltip';
      document.body.appendChild(exhibitTooltip);

      ramps.querySelectorAll('.swatch').forEach(function (sw) {
        var hex = sw.dataset.hex, tone = sw.dataset.tone, isContract = sw.dataset.contract === 'true';
        // no contrast figures on the swatches: a ramp is an inventory of what
        // exists, and a contrast claim needs a criterion and a threshold beside
        // it, which is the contract matrix's job further down
        var badge = sw.querySelector('[data-badge]');
        if (badge) badge.remove();
        // the tone label flips with the swatch it sits on, not with the tone number,
        // so a light 300 and a dark 800 are both legible
        var label = sw.querySelector('.tone');
        if (label) label.style.color = relLuminance(hex) > 0.36 ? 'rgba(0,0,0,.5)' : 'rgba(255,255,255,.82)';
        sw.addEventListener('mousemove', function (e) {
          exhibitTooltip.textContent = hex;
          exhibitTooltip.style.left = e.clientX + 'px';
          exhibitTooltip.style.top = e.clientY + 'px';
          exhibitTooltip.classList.add('show');
        });
        sw.addEventListener('mouseleave', function () { exhibitTooltip.classList.remove('show'); });
      });

      var readout = document.getElementById('variance-readout');
      if (readout) {
        CONTRACT_TONES.forEach(function (t) {
          var ratios = ['Blue', 'Green', 'Amber', 'Red'].map(function (f) { return contrastVsWhite(PALETTE[f][t]); });
          var spread = Math.max.apply(null, ratios) - Math.min.apply(null, ratios);
          var div = document.createElement('div');
          div.className = 'vr';
          div.innerHTML = '<div class="n">' + spread.toFixed(2) + '</div><div class="c">variance at tone ' + t + '</div>';
          readout.appendChild(div);
        });
      }
    }

    // ---- semantic layer: every token + a real card, both themes ----
    var semGroupsEl = document.getElementById('semantic-groups');
    var semStageEl = document.getElementById('semantic-stage');

    var semState = { grp: 'Background', mode: 'light' };
    var GROUP_NOTE = {
      Background: 'Surfaces. The order matters: Default is the page, Raised lifts a card off it, Overlay sits above both. In light mode all three are white and the separation comes from shadow; in dark mode shadow barely reads, so the surface itself steps lighter instead.',
      Text: 'Ink. Every On- token names the fill it is legal on, because a label that is only readable on the surface its author happened to test is the most common accessibility defect in a system this size.',
      Icon: 'Icons are drawn as shapes or strokes, never as text or frame fills, and these are scoped so the Figma picker only offers them where an icon can actually use them.',
      Border: 'Boundaries. Strong clears 3:1 because a control boundary carries meaning under WCAG; Subtle deliberately does not, because a divider inside a card is decoration.',
      Action: 'Controls. Every action has rest, hover and pressed, and hover moves in opposite directions per theme: darker on light, lighter on dark. Disabled is neutral rather than a faded brand, because a faded brand still reads as clickable.',
      Status: 'Meaning. Each status ships as a trio, the fill, a subtle surface for chips, and an ink that clears 4.5:1 on that surface. Colour alone never carries status here: every one is paired with a distinct glyph, because red and green converge under deuteranopia.',
      Shadow: 'Depth. Two layers per elevation, a tight contact shadow that anchors the edge and a broad ambient one that carries distance. Edge is the odd one: a 1px inset highlight that is near-invisible in light and load-bearing in dark.'
    };

    function renderSemGroup() {
      if (!semGroupsEl) return;
      var g = SEMANTIC_GROUPS.filter(function (x) { return x.group === semState.grp; })[0];
      if (!g) return;
      /* No group title or note: the tab above already names the group and its
         count, and the per-token "use it for" column carries the rest */
      semGroupsEl.innerHTML = '<div class="sem-group">' +
        '<div class="ramp-rows">' +
        g.tokens.map(function (t) {
          return '<div class="ramp-row sem-trow">' +
            '<span class="sem-name">' + t[0] + '</span>' +
            '<span class="sem-chip" data-l="' + t[1] + '" data-d="' + t[2] + '"></span>' +
            '<span class="sem-hex" data-l="' + primOf(t[1]) + '" data-d="' + primOf(t[2]) + '" title="' + t[1] + ' / ' + t[2] + '"></span>' +
            '<span class="sem-use">' + t[3] + '</span></div>';
        }).join('') + '</div></div>';
    }

    var colourSemTabs = document.getElementById('colour-sem-tabs');
    if (colourSemTabs) {
      colourSemTabs.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        colourSemTabs.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        semState.grp = b.dataset.grp;
        renderSemGroup();
        paintSemantic(semState.mode);
      });
    }

    /* The applied card. Built from semantic tokens only, so flipping the theme
       re-resolves it exactly the way a real screen would. */
    function renderStage(mode) {
      if (!semStageEl) return;
      var bg = tok('Background/Default', mode);
      var raised = tok('Background/Raised', mode);
      var bd = tok('Border/Default', mode);
      var bdSubtle = tok('Border/Subtle', mode);
      var t1 = tok('Text/Primary', mode);
      var t2 = tok('Text/Secondary', mode);
      var t3 = tok('Text/Tertiary', mode);
      var shadow = mode === 'light'
        ? '0 1px 2px ' + tok('Shadow/Contact', mode) + ', 0 2px 8px ' + tok('Shadow/Ambient', mode)
        : '0 2px 4px ' + tok('Shadow/Contact', mode) + ', 0 8px 24px ' + tok('Shadow/Ambient', mode);

      function chip(label, kind) {
        return '<span class="stage-chip" style="background:' + tok('Status/' + kind + '-Subtle', mode) +
          ';color:' + tok('Status/' + kind + '-Ink', mode) + '">' + label + '</span>';
      }
      function row(label, amount, kind, chipLabel, last) {
        return '<div class="stage-row" style="border-bottom:' + (last ? '0' : '1px solid ' + bdSubtle) + '">' +
          '<div><div class="stage-row-l" style="color:' + t1 + '">' + label + '</div>' +
          '<div class="stage-row-d" style="color:' + t3 + '">' + amount + '</div></div>' +
          chip(chipLabel, kind) + '</div>';
      }

      semStageEl.style.background = bg;
      semStageEl.innerHTML =
        '<div class="stage-card" style="background:' + raised + ';border:1px solid ' + bd + ';box-shadow:' + shadow + '">' +
          '<div class="stage-head">' +
            '<div><div class="stage-eyebrow" style="color:' + t3 + '">Amount due</div>' +
            '<div class="stage-amount" style="color:' + t1 + '">$1,240.00</div>' +
            '<div class="stage-sub" style="color:' + t2 + '">Plan 4 of 12 · Whitfield Dental</div></div>' +
            chip('Overdue', 'Danger') +
          '</div>' +
          '<div class="stage-rows">' +
            row('March payment', '$310.00 · paid Mar 3', 'Success', 'Paid') +
            row('April payment', '$310.00 · due Apr 3', 'Warning', 'Due soon') +
            row('May payment', '$310.00 · scheduled', 'Info', 'Scheduled', true) +
          '</div>' +
          '<div class="stage-actions">' +
            '<button class="stage-btn" style="background:' + tok('Action/Primary', mode) + ';color:' + tok('Text/OnBrand', mode) + '">Pay now</button>' +
            '<button class="stage-btn" style="background:' + tok('Action/Secondary', mode) + ';color:' + t1 + ';border:1px solid ' + tok('Border/Strong', mode) + '">View plan</button>' +
          '</div>' +
        '</div>';
    }

    function paintSemantic(mode) {
      semState.mode = mode;
      if (semGroupsEl) {
        semGroupsEl.querySelectorAll('.sem-chip').forEach(function (c) {
          c.style.background = mode === 'light' ? c.dataset.l : c.dataset.d;
        });
        semGroupsEl.querySelectorAll('.sem-hex').forEach(function (h) {
          h.textContent = mode === 'light' ? h.dataset.l : h.dataset.d;
        });
        semGroupsEl.classList.toggle('is-dark', mode === 'dark');
      }
      var semTag = document.getElementById('sem-tag');
      if (semTag) semTag.textContent = mode;
      renderStage(mode);
    }

    var themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        themeToggle.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        paintSemantic(b.dataset.theme);
      });
    }
    renderSemGroup();
    paintSemantic('light');

    // ---- the contract matrix: seven rows, recomputed live from the real hexes ----
    var contractEl = document.getElementById('contract-matrix');
    if (contractEl) {
      var FAMS = ['Blue', 'Green', 'Amber', 'Red', 'Neutral'];
      var ROWS = [
        ['White on 500', function (f) { return { ink: WHITE, surf: P[f][500] }; }, 4.5],
        ['600 ink on white', function (f) { return { ink: P[f][600], surf: WHITE }; }, 4.5],
        ['600 ink on Neutral/50', function (f) { return { ink: P[f][600], surf: P.Neutral[50] }; }, 4.5],
        ['600 ink on own 50', function (f) { return { ink: P[f][600], surf: P[f][50] }; }, 4.5],
        ['700 ink on own 100', function (f) { return { ink: P[f][700], surf: P[f][100] }; }, 4.5],
        ['400 border on white', function (f) { return { ink: P[f][400], surf: WHITE }; }, 3.0],
        ['400 ink on Neutral/950', function (f) { return { ink: P[f][400], surf: P.Neutral[950] }; }, 4.5]
      ];
      var head = '<div class="cm-row cm-head"><span>Contract row</span>' +
        FAMS.map(function (f) { return '<span>' + f + '</span>'; }).join('') +
        '<span>Min</span><span>Var</span><span>Result</span></div>';
      var body = ROWS.map(function (r) {
        var pairs = FAMS.map(function (f) { return r[1](f); });
        var ratios = pairs.map(function (p) { return contrastRatio(p.ink, p.surf); });
        var variance = Math.max.apply(null, ratios) - Math.min.apply(null, ratios);
        var pass = ratios.every(function (x) { return x >= r[2]; });
        return '<div class="cm-row"><span class="cm-label">' + r[0] + '</span>' +
          pairs.map(function (p, i) {
            return '<span class="cm-cell" style="background:' + p.surf + ';color:' + p.ink + '">' + ratios[i].toFixed(2) + '</span>';
          }).join('') +
          '<span class="cm-min">' + r[2].toFixed(1) + '</span>' +
          '<span class="cm-var">' + variance.toFixed(2) + '</span>' +
          '<span class="cm-result' + (pass ? '' : ' is-fail') + '">' + (pass ? 'PASS' : 'FAIL') + '</span></div>';
      }).join('');
      contractEl.innerHTML = head + body;
    }

    // ---- type primitive ramps, tabbed ----
    var SPECIMEN = 'Treatment #4821';
    var RAMPS = {
      size: {
        note: 'Eight steps. The bottom four serve mobile; 32 and 48 exist because desktop scaling claimed them, which is the only standard for adding one.',
        rows: [10, 12, 14, 16, 20, 24, 32, 48].map(function (s) {
          return { tok: 'Size/' + s, render: '<span style="font-family:var(--nunito);font-size:' + s + 'px;line-height:1.25">Treatment 1,240</span>' };
        })
      },
      line: {
        note: 'Seven steps, every one a multiple of 4, because a line box off the grid breaks every text block’s rhythm with the spacing scale. The ratio is a result you verify, not an input you set.',
        rows: [[16, '10 and 12'], [20, '14'], [24, '16'], [28, '20'], [32, '24'], [40, '32'], [56, '48']].map(function (p) {
          return {
            tok: 'LineHeight/' + p[0],
            render: '<span class="lh-box" style="height:' + p[0] + 'px"></span>',
            meta: p[0] + 'px, pairs with ' + p[1]
          };
        })
      },
      weight: {
        note: 'Five weights, each assigned exactly one job rather than left available. More weights means more ways to be inconsistent.',
        rows: [['Regular', 400, 'body, captions, prose'], ['Medium', 500, 'labels, buttons, table headers'], ['SemiBold', 600, 'card titles, subtitles'], ['Bold', 700, 'section and page titles'], ['ExtraBold', 800, 'display, big amounts, hero numbers']].map(function (w) {
          return {
            tok: 'Weight/' + w[0],
            render: '<span style="font-family:var(--nunito);font-size:22px;font-weight:' + w[1] + '">' + SPECIMEN + '</span>',
            meta: w[2]
          };
        })
      },
      track: {
        note: 'Optical correction, and it ships in pixels rather than percent because binding a variable to letter spacing forces the unit to PIXELS, and setting it back to percent breaks the binding. So the percentage is the intent and the pixel value is what ships. Every sample here is drawn at one size, because this ramp isolates tracking: the value only pairs with a size once a semantic role combines the two.',
        rows: [[-1.4, '−3%', 'display, desktop'], [-0.6, '−2%', 'display, mobile'], [-0.2, '−1%', 'heading'], [0, '0', 'the neutral band'], [0.1, '+1%', 'label and caption'], [0.2, '+2%', 'legal']].map(function (t) {
          return {
            tok: 'Tracking/' + (t[0] === 0 ? '0' : String(t[0]).replace('.', '_')),
            render: '<span style="font-family:var(--nunito);font-size:22px;letter-spacing:' + t[0] + 'px;font-weight:500">' + SPECIMEN + '</span>',
            meta: (t[0] > 0 ? '+' + t[0] : t[0]) + 'px · ' + t[1] + ' · serves ' + t[2]
          };
        })
      },
      family: {
        note: 'Two families. The sans does every role but one; the mono exists for the single job where telling a zero from a capital O matters more than reading comfort.',
        rows: [
          { tok: 'Family/Sans', render: '<span style="font-family:var(--nunito);font-size:22px;font-weight:600">Nunito Sans</span>', meta: 'tabular digits by default, every role except Code' },
          { tok: 'Family/Mono', render: '<span style="font-family:var(--plex);font-size:20px;font-weight:600">IBM Plex Mono</span>', meta: 'contract references and IDs only' }
        ]
      }
    };

    var rampBody = document.getElementById('ramp-body');
    var rampTabs = document.getElementById('ramp-tabs');
    function paintRamp(key) {
      if (!rampBody) return;
      var r = RAMPS[key];
      /* No note: the tab already names the ramp and its count, and each
         row's meta column carries the rest */
      rampBody.innerHTML = '<div class="ramp-rows">' + r.rows.map(function (row) {
          return '<div class="ramp-row"><span class="ramp-tok">' + row.tok + '</span>' +
            '<span class="ramp-render">' + row.render + '</span>' +
            '<span class="ramp-meta">' + (row.meta || '') + '</span></div>';
        }).join('') + '</div>';
    }
    if (rampTabs) {
      rampTabs.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        rampTabs.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        paintRamp(b.dataset.ramp);
      });
      paintRamp('size');
    }

    /* ---- the ten semantic roles, resolved per breakpoint.
       Only Display, Heading and Title vary; the other seven hold one value,
       and Body deliberately never scales because it is a reading size. ---- */
    var ROLES = [
      { role: 'Display', fam: 'sans', weight: 800, mobile: [32, 40, -0.6], desktop: [48, 56, -1.4], use: 'The one number a screen is about: balance due, amount financed.' },
      { role: 'Heading', fam: 'sans', weight: 700, mobile: [24, 32, -0.2], desktop: [32, 40, -0.6], use: 'Page and screen titles.' },
      { role: 'Title', fam: 'sans', weight: 700, mobile: [20, 28, 0], desktop: [24, 32, -0.2], use: 'Card and section titles.' },
      { role: 'Subtitle', fam: 'sans', weight: 600, mobile: [16, 24, 0], use: 'A named thing under a title: practice, plan, patient.' },
      { role: 'Body', fam: 'sans', weight: 400, mobile: [16, 24, 0], use: 'Every sentence the user reads.' },
      { role: 'Body-Strong', fam: 'sans', weight: 500, mobile: [16, 24, 0], use: 'One emphasised phrase inside body copy.' },
      { role: 'Label', fam: 'sans', weight: 500, mobile: [14, 20, 0.1], use: 'Form labels, buttons, table headers.' },
      { role: 'Caption', fam: 'sans', weight: 400, mobile: [12, 16, 0.1], use: 'Timestamps, helper text, secondary detail.' },
      { role: 'Legal', fam: 'sans', weight: 500, mobile: [10, 16, 0.2], use: 'Disclosures and consent text, never body copy.' },
      { role: 'Code', fam: 'mono', weight: 400, mobile: [14, 20, 0], use: 'Contract references, IDs, anything read character by character.' }
    ];

    var typeRolesEl = document.getElementById('type-roles');

    function paintRoles(bp) {
      if (!typeRolesEl) return;
      typeRolesEl.innerHTML = ROLES.map(function (r) {
        var v = (bp === 'desktop' && r.desktop) ? r.desktop : r.mobile;
        var scales = !!r.desktop;
        var changed = scales && bp === 'desktop';
        return '<div class="role-row' + (changed ? ' is-changed' : '') + '">' +
          '<div class="role-head">' +
            '<span class="role-name">' + r.role + (scales ? '<span class="role-flag">change with mode</span>' : '') + '</span>' +
            '<span class="role-spec">' + v[0] + '/' + v[1] + (v[2] ? ' · ' + (v[2] > 0 ? '+' : '') + v[2] : '') + '</span>' +
          '</div>' +
          '<div class="role-sample" style="font-family:' + (r.fam === 'mono' ? 'var(--plex)' : 'var(--nunito)') +
            ';font-size:' + v[0] + 'px;line-height:' + v[1] + 'px;font-weight:' + r.weight + ';letter-spacing:' + v[2] + 'px">' +
            (r.fam === 'mono' ? 'DN-4821-001I' : 'Treatment #4821') + '</div>' +
          '<div class="role-use">' + r.use + '</div>' +
        '</div>';
      }).join('');
    }

    var bpToggle = document.getElementById('bp-toggle');
    if (bpToggle) {
      bpToggle.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        bpToggle.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        paintRoles(b.dataset.bp);
      });
      paintRoles('mobile');
    }

    /* ---- Space & Size: two primitive ramps ---- */
    var SPACE_RAMPS = {
      rhythm: {
        rows: [
          [4, '—', 'Inline/Tight · Stack/Tight'],
          [8, '×2.00', 'Inline/Default · Inset/Tight · Stack/Default'],
          [12, '×1.50', 'Inline/Comfortable · Inset/Default · Type/Legal/ParagraphSpacing'],
          [16, '×1.33', 'Inline/Loose · Inset/Comfortable · Stack/Comfortable · Type/Body/ParagraphSpacing'],
          [24, '×1.50', 'Inset/Spacious · Stack/Loose'],
          [32, '×1.33', 'Stack/Section'],
          [48, '×1.50', 'Stack/Block · Stack/Section'],
          [64, '×1.33', 'Stack/Block']
        ].map(function (r) {
          return {
            tok: 'Space/' + r[0],
            render: '<span class="sp-bar" style="width:' + r[0] + 'px"></span>',
            val: r[0] + 'px', ratio: r[1], meta: r[2]
          };
        })
      },
      dimension: {
        rows: [16, 20, 24, 32, 40, 44, 56].map(function (s) {
          return {
            tok: 'Size/' + s,
            render: '<span class="sp-square" style="width:' + s + 'px;height:' + s + 'px"></span>',
            val: s + 'px', ratio: '', meta: s === 44 ? 'the touch-target floor, an absolute rather than a step' : ''
          };
        })
      }
    };

    var spaceRampBody = document.getElementById('space-ramp-body');
    var spaceRampTabs = document.getElementById('space-ramp-tabs');
    function paintSpaceRamp(key) {
      if (!spaceRampBody) return;
      var r = SPACE_RAMPS[key];
      /* No note: the tab already names the ramp and its count */
      spaceRampBody.innerHTML = '<div class="ramp-rows">' + r.rows.map(function (row) {
          return '<div class="ramp-row sp-row sp-row--ramp"><span class="ramp-tok">' + row.tok + '</span>' +
            '<span class="ramp-render">' + row.render + '</span>' +
            '<span class="sp-val">' + row.val + '</span>' +
            '<span class="sp-ratio">' + row.ratio + '</span></div>';
        }).join('') + '</div>';
    }
    if (spaceRampTabs) {
      spaceRampTabs.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        spaceRampTabs.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        paintSpaceRamp(b.dataset.ramp);
      });
      paintSpaceRamp('rhythm');
    }

    /* ---- Space & Size: the semantic layer, four groups, per breakpoint.
       [name, mobile, desktop|null, useItFor, shape] ---- */
    var SPACE_SEM = {
      inset: { label: 'Inset · padding inside a container', desc: 'Padding inside a container.', tokens: [
        ['Tight', 8, null, 'chips, badges, dense table cells'],
        ['Default', 12, null, 'inputs, list rows, menu items'],
        ['Comfortable', 16, null, 'cards, panels, dialogs'],
        ['Spacious', 24, null, 'feature cards, empty states'],
        ['Section', 32, 48, 'page and large-surface padding, the horizontal counterpart of the grid margin']
      ]},
      stack: { label: 'Stack · vertical gap between siblings', desc: 'The vertical gap between siblings.', tokens: [
        ['Tight', 4, null, 'label above its input, so the two read as one unit'],
        ['Default', 8, null, 'title to subtitle, row to row'],
        ['Comfortable', 16, null, 'between blocks inside a card'],
        ['Loose', 24, null, 'between cards in a list'],
        ['Section', 32, 48, 'between titled sections of a page'],
        ['Block', 48, 64, 'between major page regions']
      ]},
      inline: { label: 'Inline · horizontal gap between siblings', desc: 'The horizontal gap between siblings.', tokens: [
        ['Tight', 4, null, 'icon to its label'],
        ['Default', 8, null, 'buttons in a row, chips in a set'],
        ['Comfortable', 12, null, 'form fields side by side'],
        ['Loose', 16, null, 'between toolbar clusters']
      ]},
      control: { label: 'Control · interactive element heights', desc: 'How tall an interactive control is.', shape: 'square', tokens: [
        ['Control/Small', 32, null, 'dense tables, compact toolbars'],
        ['Control/Medium', 44, 40, 'the default. The touch floor applies to a finger, not a pointer, which is why this is the one token that gets smaller on desktop'],
        ['Control/Large', 56, null, 'primary calls to action'],
        ['Target', 44, null, 'a hit area, not a size you pick. Nothing is ever drawn at 44; a control smaller than this extends its hit area to reach it. SC 2.5.5 / Apple HIG']
      ]},
      icon: { label: 'Icon · icon dimensions', desc: 'How large an icon is.', shape: 'square', tokens: [
        ['Icon/XS', 16, null, 'inline with Label and Caption'],
        ['Icon/Small', 20, null, 'inline with Body'],
        ['Icon/Medium', 24, null, 'the default, toolbar and standalone'],
        ['Icon/Large', 32, null, 'feature icons, empty states']
      ]}
    };

    var spaceSemBody = document.getElementById('space-sem-body');
    var spaceSemTabs = document.getElementById('space-sem-tabs');
    var spaceSemDesc = document.getElementById('space-sem-desc');
    var spaceState = { grp: 'inset', bp: 'mobile' };

    function paintSpaceSem() {
      if (!spaceSemBody) return;
      var g = SPACE_SEM[spaceState.grp];
      var isSquare = g.shape === 'square';
      if (spaceSemDesc) spaceSemDesc.textContent = g.desc || '';
      /* No group label: the tab already names the group and its count */
      spaceSemBody.innerHTML = '<div class="ramp-rows">' + g.tokens.map(function (t) {
          var v = (spaceState.bp === 'desktop' && t[2] !== null) ? t[2] : t[1];
          var varies = t[2] !== null;
          var render = isSquare
            ? '<span class="sp-square" style="width:' + v + 'px;height:' + v + 'px"></span>'
            : '<span class="sp-bar" style="width:' + v + 'px"></span>';
          // a varying token shows both ends with the active one emphasised, so the
          // arrow reads as a mode rather than as a progression
          var valCell = varies
            ? '<span class="sp-pair"><b class="' + (spaceState.bp === 'mobile' ? 'on' : '') + '">' + t[1] + '</b>' +
              '<i>→</i><b class="' + (spaceState.bp === 'desktop' ? 'on' : '') + '">' + t[2] + '</b></span>'
            : v;
          return '<div class="ramp-row sp-row' + (varies ? ' sp-row--varies' : '') + '">' +
            '<span class="ramp-tok">' + t[0] + '</span>' +
            '<span class="ramp-render">' + render + '</span>' +
            '<span class="sp-val">' + valCell + '</span>' +
            '<span class="sp-ratio"></span>' +
            '<span class="ramp-meta">' + t[3] + '</span></div>';
        }).join('') + '</div>';
    }

    if (spaceSemTabs) {
      spaceSemTabs.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        spaceSemTabs.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        spaceState.grp = b.dataset.grp;
        paintSpaceSem();
      });
    }
    var spToggle = document.getElementById('sp-toggle');
    if (spToggle) {
      spToggle.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        spToggle.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        spaceState.bp = b.dataset.bp;
        paintSpaceSem();
      });
    }
    paintSpaceSem();

    // ---- keyline template: four shapes, each drawn inside a scaled 24-unit frame ----
    var keylineGrid = document.getElementById('keyline-grid');
    if (keylineGrid) {
      var PX = 4; // scale: 4 display px per master unit, so the 24 frame renders at 96px
      var KEYLINES = [
        { name: 'Square', dim: '18 × 18', w: 18, h: 18, radius: '4px' },
        { name: 'Circle', dim: '⌀ 20', w: 20, h: 20, radius: '50%' },
        { name: 'Vertical', dim: '16 × 20', w: 16, h: 20, radius: '4px' },
        { name: 'Horizontal', dim: '20 × 16', w: 20, h: 16, radius: '4px' }
      ];
      keylineGrid.innerHTML = KEYLINES.map(function (k) {
        return '<div class="keyline-card">' +
          '<div class="keyline-frame"><div class="keyline-shape" style="width:' + (k.w * PX) + 'px;height:' + (k.h * PX) + 'px;border-radius:' + k.radius + '"></div></div>' +
          '<div class="keyline-label"><span class="keyline-name">' + k.name + '</span><span class="keyline-dim">' + k.dim + '</span></div>' +
        '</div>';
      }).join('');
    }

    // ---- icon library: pick a category from the dropdown, then an icon from
    // the pills, then see that one icon at every size it's built for. ----
    var iconLibGrid = document.getElementById('icon-library-grid');
    var iconLibSelect = document.getElementById('iconlib-cat-select');
    var iconLibTabs = document.getElementById('iconlib-icon-tabs');
    if (iconLibGrid && iconLibSelect && iconLibTabs) {
      var ICON_SIZE_INFO = [
        { token: 'Icon/XS', size: 16, stroke: '1.5', use: 'inline with Label and Caption' },
        { token: 'Icon/Small', size: 20, stroke: '1.5', use: 'inline with Body' },
        { token: 'Icon/Medium', size: 24, stroke: '1.5', use: 'standalone and toolbar, the master' },
        { token: 'Icon/Large', size: 32, stroke: '2.0', use: 'feature icons, empty states' }
      ];
      var ICON_LIBRARY = [
        { cat: 'Navigation', n: 11, icons: ['ChevronRight'] },
        { cat: 'Actions', n: 13, icons: ['Search', 'Retry'] },
        { cat: 'Status & feedback', n: 10, icons: ['Check', 'AlertTriangle', 'InfoCircle'] },
        { cat: 'Money & contracts', n: 13, icons: ['CreditCard', 'Signature', 'Bank', 'ArrowUpRight', 'ArrowDownRight'] },
        { cat: 'Clinical', n: 2, icons: ['Tooth'] },
        { cat: 'Data & views', n: 6, icons: ['Calendar'] },
        { cat: 'System', n: 7, icons: ['Close'] }
      ];

      // Real Lucide artwork (MIT, pinned), inner markup only, 24x24 viewBox,
      // stroke inherited from the wrapping <svg> so one path serves every
      // size. Tooth has no Lucide equivalent, drawn in-house per the record.
      var ICON_PATHS = {
        ChevronRight: '<path d="m9 18 6-6-6-6"/>',
        Search: '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
        Retry: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
        Check: '<path d="M20 6 9 17l-5-5"/>',
        AlertTriangle: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
        InfoCircle: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
        CreditCard: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
        Signature: '<path d="m21 17-2.156-1.868A.5.5 0 0 0 18 15.5v.5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1c0-2.545-3.991-3.97-8.5-4a1 1 0 0 0 0 5c4.153 0 4.745-11.295 5.708-13.5a2.5 2.5 0 1 1 3.31 3.284"/><path d="M3 21h18"/>',
        Bank: '<path d="M10 18v-7"/><path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 22h18"/><path d="M6 18v-7"/>',
        ArrowUpRight: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
        ArrowDownRight: '<path d="m7 7 10 10"/><path d="M17 7v10H7"/>',
        Calendar: '<path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>',
        Close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
        Tooth: '<path d="M12 3c-1.8 0-2.7 1-4 1-1.6 0-3 .9-3 3.3 0 3.4 1.1 7.7 2.1 10.3.6 1.6 1.1 2.4 1.7 2.4.7 0 1-1.1 1.3-2.7.3-1.6.5-2.3.9-2.3s.6.7.9 2.3c.3 1.6.6 2.7 1.3 2.7.6 0 1.1-.8 1.7-2.4C15.9 15 17 10.7 17 7.3 17 4.9 15.6 4 14 4c-1.3 0-2.2-1-4-1z"/>'
      };
      var ICON_IS_INHOUSE = { Tooth: true };

      var iconLibState = { cat: ICON_LIBRARY[0].cat, icon: ICON_LIBRARY[0].icons[0] };

      function iconLibGroup() {
        for (var i = 0; i < ICON_LIBRARY.length; i++) if (ICON_LIBRARY[i].cat === iconLibState.cat) return ICON_LIBRARY[i];
        return ICON_LIBRARY[0];
      }

      function paintIconLibSelect() {
        iconLibSelect.innerHTML = ICON_LIBRARY.map(function (grp) {
          return '<option value="' + grp.cat + '"' + (grp.cat === iconLibState.cat ? ' selected' : '') + '>' +
            grp.cat + ' · ' + grp.n + ' sets</option>';
        }).join('');
        iconLibSelect.dispatchEvent(new CustomEvent('ddn:refresh'));
      }

      function paintIconLibTabs() {
        var grp = iconLibGroup();
        iconLibTabs.innerHTML = grp.icons.map(function (name) {
          return '<button class="tab' + (name === iconLibState.icon ? ' active' : '') + '" data-icon="' + name + '" type="button">' + name + '</button>';
        }).join('');
      }

      function paintIconLibCards() {
        var name = iconLibState.icon;
        var inner = ICON_PATHS[name] || '';
        var inhouse = !!ICON_IS_INHOUSE[name];
        iconLibGrid.innerHTML = (inhouse ?
          '<div class="iconlib-provenance">hand-drawn in-house, not from Lucide, no general set carries a tooth</div>' : ''
        ) + '<div class="iconlib-sizeset">' + ICON_SIZE_INFO.map(function (s) {
          var svg = '<svg class="iconlib-svg" width="' + s.size + '" height="' + s.size +
            '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + s.stroke +
            '" stroke-linecap="round" stroke-linejoin="round" aria-label="' + name + ' at ' + s.size + 'px" role="img">' + inner + '</svg>';
          return '<div class="iconlib-sizecard">' +
            '<div class="iconlib-sizecard-box">' + svg + '</div>' +
            '<div class="iconlib-sizecard-label">' + s.token + ' · ' + s.size + '</div>' +
            '<div class="iconlib-sizecard-meta">stroke ' + s.stroke + '</div>' +
            '<div class="iconlib-sizecard-use">' + s.use + '</div>' +
          '</div>';
        }).join('') + '</div>';
      }

      function paintIconLib() {
        paintIconLibSelect();
        paintIconLibTabs();
        paintIconLibCards();
      }

      iconLibSelect.addEventListener('change', function () {
        iconLibState.cat = iconLibSelect.value;
        iconLibState.icon = iconLibGroup().icons[0];
        paintIconLibTabs();
        paintIconLibCards();
      });

      iconLibTabs.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        iconLibState.icon = b.dataset.icon;
        paintIconLibTabs();
        paintIconLibCards();
      });

      paintIconLib();
    }

    // ---- digit demo toggle ----
    var digitToggle = document.getElementById('digit-toggle');
    if (digitToggle) {
      digitToggle.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        digitToggle.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        var col = document.getElementById('money-col');
        col.classList.toggle('font-nunito', b.dataset.font === 'nunito');
        col.classList.toggle('font-inter', b.dataset.font === 'inter');
      });
    }

    // ---- Button component: Type × Colour × State × Size, rendered from the
    // same real palette values as every other exhibit, not one CSS class
    // per combination. renderDsBtn() is the single source every block below
    // calls, so the "library" phase can reuse it once it picks up icons. ----
    var BTN_COLORS = {
      brand:   { label: 'Brand', caption: 'the action the screen exists for', fill: P.Blue[500], hover: P.Blue[600], pressed: P.Blue[700], onInk: '#FFFFFF', ink: P.Blue[600], border: P.Blue[500], subtle: P.Blue[50], subtlePressed: P.Blue[100], focus: P.Blue[600] },
      neutral: { label: 'Neutral', caption: 'a strong action that is not the brand', fill: P.Neutral[900], hover: P.Neutral[950], pressed: '#000000', onInk: '#FFFFFF', ink: P.Neutral[900], border: P.Neutral[300], subtle: P.Neutral[50], subtlePressed: P.Neutral[100], focus: P.Blue[600] },
      danger:  { label: 'Danger', caption: 'destructive and irreversible', fill: P.Red[500], hover: P.Red[600], pressed: P.Red[700], onInk: '#FFFFFF', ink: P.Red[600], border: P.Red[500], subtle: P.Red[50], subtlePressed: P.Red[100], focus: P.Blue[600] },
      inverse: { label: 'Inverse', caption: 'for placing on a brand or dark surface, it opposes the page rather than matching it', fill: '#FFFFFF', hover: P.Neutral[100], pressed: P.Neutral[200], onInk: P.Neutral[950], ink: '#FFFFFF', border: '#FFFFFF', subtle: 'rgba(255,255,255,.16)', subtlePressed: 'rgba(255,255,255,.28)', focus: '#FFFFFF' }
    };
    var BTN_TYPES = {
      primary:   { label: 'Primary', mode: 'filled', caption: 'filled, one per screen' },
      secondary: { label: 'Secondary', mode: 'outline', caption: 'outlined, a real alternative' },
      tertiary:  { label: 'Tertiary', mode: 'text', caption: 'text-only, low commitment or repeated in a list' }
    };
    var BTN_SIZES = {
      sm: { h: 32, pad: 14, font: 13, gap: 6, icon: 14 },
      md: { h: 40, pad: 20, font: 14, gap: 8, icon: 16 },
      lg: { h: 56, pad: 26, font: 15.5, gap: 9, icon: 18 }
    };

    function dsIconPlus(size) {
      return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
    }

    function renderDsBtn(opts) {
      var c = BTN_COLORS[opts.colorKey], t = BTN_TYPES[opts.typeKey], s = BTN_SIZES[opts.sizeKey || 'md'];
      var state = opts.state || 'default';
      var disabled = state === 'disabled';
      var isInverse = opts.colorKey === 'inverse';
      var mutedFill = isInverse ? 'rgba(255,255,255,.32)' : P.Neutral[100];
      var mutedInk = isInverse ? 'rgba(255,255,255,.6)' : P.Neutral[400];
      var mutedBorder = isInverse ? 'rgba(255,255,255,.3)' : P.Neutral[200];
      var bg, color, borderColor;
      if (t.mode === 'filled') {
        bg = disabled ? mutedFill : state === 'hover' ? c.hover : state === 'pressed' ? c.pressed : c.fill;
        color = disabled ? mutedInk : c.onInk;
        borderColor = 'transparent';
      } else if (t.mode === 'outline') {
        bg = disabled ? 'transparent' : state === 'hover' ? c.subtle : state === 'pressed' ? c.subtlePressed : 'transparent';
        color = disabled ? mutedInk : c.ink;
        borderColor = disabled ? mutedBorder : c.border;
      } else {
        bg = disabled ? 'transparent' : state === 'hover' ? c.subtle : state === 'pressed' ? c.subtlePressed : 'transparent';
        color = disabled ? mutedInk : c.ink;
        borderColor = 'transparent';
      }
      var style = 'height:' + s.h + 'px;' + (opts.iconOnly ? 'width:' + s.h + 'px;padding:0;' : 'padding:0 ' + s.pad + 'px;') +
        'font-size:' + s.font + 'px;gap:' + s.gap + 'px;background:' + bg + ';color:' + color + ';border-color:' + borderColor + ';';
      if (state === 'focus') {
        style += 'box-shadow:0 0 0 2px ' + (opts.ringGap || '#FFFFFF') + ',0 0 0 4px ' + c.focus + ';';
      }
      var icon = dsIconPlus(s.icon);
      var label = opts.iconOnly ? '' : '<span>' + (opts.label || 'Button') + '</span>';
      return '<button type="button" class="dsbtn" style="' + style + '"' +
        (opts.iconOnly ? ' aria-label="' + (opts.label || 'Button') + '"' : '') +
        (disabled ? ' aria-disabled="true"' : '') + '>' + icon + label + '</button>';
    }

    var btnTypeDemo = document.getElementById('btn-type-demo');
    if (btnTypeDemo) {
      btnTypeDemo.innerHTML = '<div class="dsbtn-row">' + ['primary', 'secondary', 'tertiary'].map(function (k) {
        var t = BTN_TYPES[k];
        return '<div class="dsbtn-item">' + renderDsBtn({ colorKey: 'brand', typeKey: k, sizeKey: 'md' }) +
          '<div class="dsbtn-item-label">' + t.label + '</div><div class="dsbtn-item-caption">' + t.caption + '</div></div>';
      }).join('') + '</div>';
    }

    var btnColorDemo = document.getElementById('btn-color-demo');
    if (btnColorDemo) {
      btnColorDemo.innerHTML = '<div class="dsbtn-colorgrid">' + ['brand', 'neutral', 'danger', 'inverse'].map(function (k) {
        var c = BTN_COLORS[k];
        var panel = k === 'inverse';
        var stack = '<div class="dsbtn-stack">' + renderDsBtn({ colorKey: k, typeKey: 'primary', sizeKey: 'md' }) + '</div>';
        return '<div>' +
          '<div class="dsbtn-colorgroup' + (panel ? ' dsbtn-colorgroup--panel' : '') + '"' + (panel ? ' style="background:' + P.Blue[500] + '"' : '') + '>' + stack + '</div>' +
          '<div class="dsbtn-item-label" style="margin-top:12px">' + c.label + '</div><div class="dsbtn-item-caption">' + c.caption + '</div>' +
        '</div>';
      }).join('') + '</div>';
    }

    var btnStateDemo = document.getElementById('btn-state-demo');
    if (btnStateDemo) {
      var BTN_STATES = ['default', 'hover', 'pressed', 'focus', 'disabled'];
      // label and button live in one cell rather than in two separate rows of
      // the grid: a flat "5 labels then 5 buttons" order re-flows into
      // nonsense the moment the column count drops on a narrow screen
      btnStateDemo.innerHTML = '<div class="dsbtn-stategrid">' + BTN_STATES.map(function (st) {
        return '<div class="dsbtn-statecell">' +
          '<span class="dsbtn-state-head">' + st + '</span>' +
          renderDsBtn({ colorKey: 'brand', typeKey: 'primary', state: st, sizeKey: 'md', ringGap: '#FFFFFF' }) +
        '</div>';
      }).join('') + '</div>';
    }

    var btnSizeDemo = document.getElementById('btn-size-demo');
    if (btnSizeDemo) {
      var BTN_SIZE_ROWS = [
        { key: 'sm', label: 'Small', caption: '32 · hit area extends to 44' },
        { key: 'md', label: 'Medium', caption: '44 → 40, the default. The touch floor applies to a finger, not a pointer' },
        { key: 'lg', label: 'Large', caption: '56, a screen-level call to action' }
      ];
      btnSizeDemo.innerHTML = '<div class="dsbtn-sizegrid">' + BTN_SIZE_ROWS.map(function (s) {
        return '<div class="dsbtn-sizecol">' +
          '<div class="dsbtn-sizerow">' + renderDsBtn({ colorKey: 'brand', typeKey: 'primary', sizeKey: s.key }) + '</div>' +
          '<div class="dsbtn-item-label">' + s.label + '</div><div class="dsbtn-item-caption">' + s.caption + '</div>' +
        '</div>';
      }).join('') + '</div>';
    }

    /* ---- Button simulator: the component's properties panel, rebuilt --------
       The blocks above illustrate one axis at a time with values chosen to read
       well on a page. This one does not illustrate anything: every value in
       BSIM_STYLE and BSIM_SIZE was measured off the shipped variant, so what
       renders in the stage is the button in the Figma file rather than a
       likeness of it. That is the whole reason it exists — a reader can reach a
       combination I would never have thought to put on a page, and it still has
       to be right.

       One row per Type/Colour/State, tilde-delimited:
         fill ~ border ~ border-width ~ label ~ focus ring ~ ring-width
       and every colour is written "light|dark". An empty field means the
       variant genuinely has no value there, not that one is missing. ---- */
    var bsimStage = document.getElementById('bsim-stage');
    if (bsimStage) {
      var BSIM_ROWS = [
        'Primary/Brand/Default #0073d4|#3d91ec~~1~#ffffff|#181a1c~~0',
        'Primary/Brand/Hover #0061b4|#75b3fc~~1~#ffffff|#181a1c~~0',
        'Primary/Brand/Pressed #004f94|#bcdbff~~1~#ffffff|#181a1c~~0',
        'Primary/Brand/Focus #0073d4|#3d91ec~~1~#ffffff|#181a1c~#0061b4|#75b3fc~2',
        'Primary/Brand/Disabled #d6d8da|#36383b~~1~#8c8f92|#5e6164~~0',
        'Primary/Neutral/Default #222427|#f4f5f6~~1~#ffffff|#181a1c~~0',
        'Primary/Neutral/Hover #36383b|#d6d8da~~1~#ffffff|#181a1c~~0',
        'Primary/Neutral/Pressed #4c4f52|#adb0b3~~1~#ffffff|#181a1c~~0',
        'Primary/Neutral/Focus #222427|#f4f5f6~~1~#ffffff|#181a1c~#0061b4|#75b3fc~2',
        'Primary/Neutral/Disabled #d6d8da|#36383b~~1~#8c8f92|#5e6164~~0',
        'Primary/Inverse/Default #ffffff|#222427~~1~#181a1c|#f4f5f6~~0',
        'Primary/Inverse/Hover #e8eaeb|#36383b~~1~#181a1c|#f4f5f6~~0',
        'Primary/Inverse/Pressed #d6d8da|#4c4f52~~1~#181a1c|#f4f5f6~~0',
        'Primary/Inverse/Focus #ffffff|#222427~~1~#181a1c|#f4f5f6~#ffffff|#181a1c~2',
        'Primary/Inverse/Disabled #d6d8da|#36383b~~1~#8c8f92|#5e6164~~0',
        'Primary/Danger/Default #cb443d|#e5685d~~1~#ffffff|#181a1c~~0',
        'Primary/Danger/Hover #b0332e|#f48f84~~1~#ffffff|#181a1c~~0',
        'Primary/Danger/Pressed #932622|#ffc8c1~~1~#ffffff|#181a1c~~0',
        'Primary/Danger/Focus #cb443d|#e5685d~~1~#ffffff|#181a1c~#0061b4|#75b3fc~2',
        'Primary/Danger/Disabled #d6d8da|#36383b~~1~#8c8f92|#5e6164~~0',
        'Secondary/Brand/Default #ffffff|#222427~#0073d4|#3d91ec~1~#0061b4|#75b3fc~~0',
        'Secondary/Brand/Hover #f4f5f6|#2c2e31~#0073d4|#3d91ec~1~#0061b4|#75b3fc~~0',
        'Secondary/Brand/Pressed #e8eaeb|#36383b~#0073d4|#3d91ec~1~#0061b4|#75b3fc~~0',
        'Secondary/Brand/Focus #ffffff|#222427~#0073d4|#3d91ec~1~#0061b4|#75b3fc~#0061b4|#75b3fc~2',
        'Secondary/Brand/Disabled #ffffff|#222427~#d6d8da|#36383b~1~#8c8f92|#5e6164~~0',
        'Secondary/Neutral/Default #ffffff|#222427~#717376|#8c8f92~1~#222427|#f4f5f6~~0',
        'Secondary/Neutral/Hover #f4f5f6|#2c2e31~#717376|#8c8f92~1~#222427|#f4f5f6~~0',
        'Secondary/Neutral/Pressed #e8eaeb|#36383b~#717376|#8c8f92~1~#222427|#f4f5f6~~0',
        'Secondary/Neutral/Focus #ffffff|#222427~#717376|#8c8f92~1~#222427|#f4f5f6~#0061b4|#75b3fc~2',
        'Secondary/Neutral/Disabled #ffffff|#222427~#d6d8da|#36383b~1~#8c8f92|#5e6164~~0',
        'Secondary/Inverse/Default ~#ffffff|#181a1c~1~#ffffff|#181a1c~~0',
        'Secondary/Inverse/Hover #ffffff|#000000~#ffffff|#181a1c~1~#ffffff|#181a1c~~0',
        'Secondary/Inverse/Pressed #ffffff|#000000~#ffffff|#181a1c~1~#ffffff|#181a1c~~0',
        'Secondary/Inverse/Focus ~#ffffff|#181a1c~1~#ffffff|#181a1c~#ffffff|#181a1c~2',
        'Secondary/Inverse/Disabled ~#d6d8da|#36383b~1~#8c8f92|#5e6164~~0',
        'Secondary/Danger/Default #ffffff|#222427~#cb443d|#e5685d~1~#b0332e|#f48f84~~0',
        'Secondary/Danger/Hover #f4f5f6|#2c2e31~#cb443d|#e5685d~1~#b0332e|#f48f84~~0',
        'Secondary/Danger/Pressed #e8eaeb|#36383b~#cb443d|#e5685d~1~#b0332e|#f48f84~~0',
        'Secondary/Danger/Focus #ffffff|#222427~#cb443d|#e5685d~1~#b0332e|#f48f84~#0061b4|#75b3fc~2',
        'Secondary/Danger/Disabled #ffffff|#222427~#d6d8da|#36383b~1~#8c8f92|#5e6164~~0',
        'Tertiary/Brand/Default ~~1~#0061b4|#75b3fc~~0',
        'Tertiary/Brand/Hover #f4f5f6|#2c2e31~~1~#0061b4|#75b3fc~~0',
        'Tertiary/Brand/Pressed #e8eaeb|#36383b~~1~#0061b4|#75b3fc~~0',
        'Tertiary/Brand/Focus ~~1~#0061b4|#75b3fc~#0061b4|#75b3fc~2',
        'Tertiary/Brand/Disabled ~~1~#8c8f92|#5e6164~~0',
        'Tertiary/Neutral/Default ~~1~#222427|#f4f5f6~~0',
        'Tertiary/Neutral/Hover #f4f5f6|#2c2e31~~1~#222427|#f4f5f6~~0',
        'Tertiary/Neutral/Pressed #e8eaeb|#36383b~~1~#222427|#f4f5f6~~0',
        'Tertiary/Neutral/Focus ~~1~#222427|#f4f5f6~#0061b4|#75b3fc~2',
        'Tertiary/Neutral/Disabled ~~1~#8c8f92|#5e6164~~0',
        'Tertiary/Inverse/Default ~~1~#ffffff|#181a1c~~0',
        'Tertiary/Inverse/Hover #ffffff|#000000~~1~#ffffff|#181a1c~~0',
        'Tertiary/Inverse/Pressed #ffffff|#000000~~1~#ffffff|#181a1c~~0',
        'Tertiary/Inverse/Focus ~~1~#ffffff|#181a1c~#ffffff|#181a1c~2',
        'Tertiary/Inverse/Disabled ~~1~#8c8f92|#5e6164~~0',
        'Tertiary/Danger/Default ~~1~#b0332e|#f48f84~~0',
        'Tertiary/Danger/Hover #f4f5f6|#2c2e31~~1~#b0332e|#f48f84~~0',
        'Tertiary/Danger/Pressed #e8eaeb|#36383b~~1~#b0332e|#f48f84~~0',
        'Tertiary/Danger/Focus ~~1~#b0332e|#f48f84~#0061b4|#75b3fc~2',
        'Tertiary/Danger/Disabled ~~1~#8c8f92|#5e6164~~0'
      ];
      var BSIM_STYLE = {};
      BSIM_ROWS.forEach(function (line) {
        var i = line.indexOf(' ');
        BSIM_STYLE[line.slice(0, i)] = line.slice(i + 1).split('~');
      });

      /* measured size specs. Medium's 44 is the touch floor, which is why it,
         and not Small, is the default the panel opens on. */
      var BSIM_SIZE = {
        Small:  { h: 32, padX: 12, gap: 8,  r: 8, fs: 14, lh: 20, icon: 16, sw: 1.5 },
        Medium: { h: 44, padX: 16, gap: 8,  r: 8, fs: 14, lh: 20, icon: 20, sw: 1.5 },
        Large:  { h: 56, padX: 24, gap: 12, r: 8, fs: 16, lh: 24, icon: 24, sw: 2 }
      };

      /* a working subset of the 73-set library, all drawn on the same 24 grid */
      var BSIM_ICONS = {
        Plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
        ArrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
        ArrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
        ChevronRight: '<path d="m9 18 6-6-6-6"/>',
        ChevronDown: '<path d="m6 9 6 6 6-6"/>',
        Check: '<path d="M20 6 9 17l-5-5"/>',
        Close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
        Download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
        Upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
        Trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        Edit: '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.4 2.6a2 2 0 0 1 2.8 2.8L12 14.6 8 15.6l1-4z"/>',
        Send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
        Retry: '<path d="M3 12a9 9 0 1 0 9-9 9.8 9.8 0 0 0-6.7 2.7L3 8"/><path d="M3 3v5h5"/>',
        Filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
        Search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
        CreditCard: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
        Wallet: '<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-3a2 2 0 0 1 0-4h4"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
        Calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
        CheckCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
        AlertTriangle: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
        InfoCircle: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
        ExternalLink: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
        Signature: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/><path d="M14 2v5h6"/><path d="M8 17c1.5-3 3-3 4 0s2.5 3 4 0"/>',
        Printer: '<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>'
      };

      var BS = {
        Type: 'Primary', Color: 'Brand', State: 'Default', Size: 'Medium',
        IconOnly: false, Text: 'Button', LI: true, RI: false,
        LIg: 'Check', RIg: 'ChevronRight', dark: false
      };

      var bsimMount = document.getElementById('bsim-mount');
      var bsimHint = document.getElementById('bsim-hint');
      var BSIM_INERTABLE = ['bsim-r-text', 'bsim-r-li', 'bsim-r-lisel', 'bsim-r-ri', 'bsim-r-risel'];

      function bsimEsc(s) {
        return String(s).replace(/[&<>"]/g, function (c) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
      }

      function bsimTone(pair) {
        if (!pair) return '';
        var p = pair.split('|');
        return BS.dark ? (p[1] || p[0]) : p[0];
      }

      /* the viewBox is always 24, so a stroke that reads as strokeW on screen
         has to be written back up by 24/size */
      function bsimSvg(name, size, colour, strokeW) {
        if (!BSIM_ICONS[name]) return '';
        return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + colour +
          '" stroke-width="' + (strokeW * 24 / size) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          BSIM_ICONS[name] + '</svg>';
      }

      function bsimRender() {
        var row = BSIM_STYLE[BS.Type + '/' + BS.Color + '/' + BS.State];
        if (!row) return;
        var borderW = row[2], ringW = row[5];
        var z = BSIM_SIZE[BS.Size];
        var bg = bsimTone(row[0]), bd = bsimTone(row[1]), ink = bsimTone(row[3]), ring = bsimTone(row[4]);
        var showL = BS.IconOnly ? true : BS.LI;
        var showR = BS.IconOnly ? false : BS.RI;

        var b = document.createElement('span');
        b.className = 'bsim-btn';
        b.style.height = z.h + 'px';
        b.style.borderRadius = z.r + 'px';
        b.style.background = bg || 'transparent';
        b.style.borderWidth = (bd ? borderW : 0) + 'px';
        b.style.borderColor = bd || 'transparent';
        b.style.color = ink;
        b.style.fontSize = z.fs + 'px';
        b.style.lineHeight = z.lh + 'px';
        b.style.gap = z.gap + 'px';
        if (BS.IconOnly) { b.style.width = z.h + 'px'; b.style.padding = '0'; }
        else { b.style.padding = '0 ' + z.padX + 'px'; }

        var html = '';
        if (showL) html += bsimSvg(BS.LIg, z.icon, ink, z.sw);
        if (!BS.IconOnly) html += '<span>' + bsimEsc(BS.Text || '') + '</span>';
        if (showR) html += bsimSvg(BS.RIg, z.icon, ink, z.sw);
        b.innerHTML = html;

        /* the ring sits outside the button with a 2px gap rather than on its
           edge, which is what stops a blue ring disappearing into a blue fill */
        if (ring && +ringW) {
          var r = document.createElement('span');
          r.className = 'bsim-ring';
          r.style.inset = -(+ringW + 2) + 'px';
          r.style.borderWidth = ringW + 'px';
          r.style.borderColor = ring;
          r.style.borderRadius = (z.r + 4) + 'px';
          b.appendChild(r);
        }
        bsimMount.innerHTML = '';
        bsimMount.appendChild(b);

        /* Inverse is the one colour that never sits on the page, so the stage
           flips under it rather than the button being shown somewhere it never
           appears */
        bsimStage.style.background = (BS.Color === 'Inverse') === BS.dark ? '#FFFFFF' : P.Neutral[950];

        /* Icon Only reaches none of the label properties, so they come off the
           panel rather than sitting there dimmed. The glyph picker stays: it is
           the one control that still changes what the button looks like. */
        BSIM_INERTABLE.forEach(function (id) {
          document.getElementById(id).classList.remove('is-inert', 'is-off');
        });
        if (BS.IconOnly) {
          ['bsim-r-text', 'bsim-r-li', 'bsim-r-ri', 'bsim-r-risel'].forEach(function (id) {
            document.getElementById(id).classList.add('is-off');
          });
        } else {
          if (!showL) document.getElementById('bsim-r-lisel').classList.add('is-inert');
          if (!showR) document.getElementById('bsim-r-risel').classList.add('is-inert');
        }
        bsimHint.textContent = BS.IconOnly
          ? 'Icon only takes its glyph from Instance left. The label and both icon toggles change nothing in this state, so they come off the panel.'
          : '';

      }

      function bsimFill(id, arr, val) {
        document.getElementById(id).innerHTML = arr.map(function (v) {
          return '<option value="' + v + '"' + (v === val ? ' selected' : '') + '>' + v + '</option>';
        }).join('');
      }
      bsimFill('bsim-type', ['Primary', 'Secondary', 'Tertiary'], BS.Type);
      bsimFill('bsim-color', ['Brand', 'Neutral', 'Inverse', 'Danger'], BS.Color);
      bsimFill('bsim-state', ['Default', 'Hover', 'Pressed', 'Focus', 'Disabled'], BS.State);
      bsimFill('bsim-size', ['Small', 'Medium', 'Large'], BS.Size);
      bsimFill('bsim-lisel', Object.keys(BSIM_ICONS), BS.LIg);
      bsimFill('bsim-risel', Object.keys(BSIM_ICONS), BS.RIg);

      [['bsim-type', 'Type'], ['bsim-color', 'Color'], ['bsim-state', 'State'],
       ['bsim-size', 'Size'], ['bsim-lisel', 'LIg'], ['bsim-risel', 'RIg']].forEach(function (p) {
        document.getElementById(p[0]).addEventListener('change', function (e) {
          BS[p[1]] = e.target.value; bsimRender();
        });
      });
      document.getElementById('bsim-text').addEventListener('input', function (e) {
        BS.Text = e.target.value; bsimRender();
      });
      [['bsim-io', 'IconOnly'], ['bsim-li', 'LI'], ['bsim-ri', 'RI']].forEach(function (p) {
        var el = document.getElementById(p[0]);
        el.addEventListener('click', function () {
          BS[p[1]] = !BS[p[1]];
          el.setAttribute('aria-checked', String(BS[p[1]]));
          bsimRender();
        });
      });
      var bsimTheme = document.getElementById('bsim-theme');
      bsimTheme.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        bsimTheme.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        BS.dark = b.dataset.theme === 'dark';
        bsimRender();
      });
      bsimRender();
    }

    /* ---- mobile: mirror every pill row into a native select ----
       A wrapping six-pill row is a list pretending to be a control, and at
       375px it costs three lines before any content shows. The select is a
       mirror rather than a replacement: it drives the pills by clicking them,
       so every existing tab handler keeps working untouched. CSS decides which
       of the two is visible, so desktop never sees the select. ---- */
    (function () {
      var tabRows = [].slice.call(document.querySelectorAll('.tabs'));
      tabRows.forEach(function (tabs) {
        var wrap = document.createElement('div');
        wrap.className = 'tabs-select-wrap';
        var sel = document.createElement('select');
        sel.className = 'tabs-select';
        var labelledBy = tabs.closest('.exhibit');
        var head = labelledBy && labelledBy.querySelector('.exhibit-head h4');
        sel.setAttribute('aria-label', head ? head.textContent + ' — choose a group' : 'Choose a group');
        wrap.appendChild(sel);
        tabs.parentNode.insertBefore(wrap, tabs.nextSibling);

        function sync() {
          var btns = [].slice.call(tabs.querySelectorAll('button'));
          if (!btns.length) { wrap.style.display = ''; return; }
          sel.innerHTML = btns.map(function (b, i) {
            // the count lives in a nested span, so reading textContent straight
            // off the button gives "Background 10" — separate them explicitly
            var badge = b.querySelector('span');
            var count = badge ? badge.textContent.replace(/\s+/g, ' ').trim() : '';
            var name = (badge ? b.firstChild && b.firstChild.textContent : b.textContent) || b.textContent;
            name = name.replace(/\s+/g, ' ').trim();
            var text = count ? name + ' · ' + count : name;
            return '<option value="' + i + '"' + (b.classList.contains('active') ? ' selected' : '') + '>' + text + '</option>';
          }).join('');
          sel.dispatchEvent(new CustomEvent('ddn:refresh'));
        }
        sync();

        sel.addEventListener('change', function () {
          var btns = tabs.querySelectorAll('button');
          var target = btns[parseInt(sel.value, 10)];
          if (target) target.click();
        });
        // a pill row can be re-rendered wholesale (the icon library does it on
        // every category change), so watch the DOM rather than only the click
        new MutationObserver(sync).observe(tabs, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
      });
    })();

    /* ---- custom dropdown ----
       A native <select> renders its list with the OS's own type and chrome,
       which is the one part of this page that cannot be made to match the
       system it is documenting — and its closed and open text sizes differ.
       So the select stays in the DOM as the state and the accessibility
       surface, and this draws a listbox over it. Every existing consumer
       still listens to `change` on the select and never knows. ---- */
    function enhanceSelect(sel) {
      if (!sel || sel.dataset.ddn) return;
      sel.dataset.ddn = '1';
      var root = document.createElement('div');
      root.className = 'ddn';
      var trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'ddn-trigger';
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');
      if (sel.getAttribute('aria-label')) trigger.setAttribute('aria-label', sel.getAttribute('aria-label'));
      var label = document.createElement('span');
      label.className = 'ddn-label';
      trigger.appendChild(label);
      trigger.insertAdjacentHTML('beforeend', '<svg class="ddn-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>');
      var menu = document.createElement('div');
      menu.className = 'ddn-menu';
      menu.setAttribute('role', 'listbox');
      sel.parentNode.insertBefore(root, sel);
      root.appendChild(sel);
      root.appendChild(trigger);
      root.appendChild(menu);

      function close() { root.classList.remove('is-open'); trigger.setAttribute('aria-expanded', 'false'); }
      function open() {
        root.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        var on = menu.querySelector('.ddn-opt.is-on');
        if (on) on.focus();
      }

      function render() {
        var opts = [].slice.call(sel.options);
        label.textContent = sel.selectedIndex >= 0 ? opts[sel.selectedIndex].textContent : '';
        menu.innerHTML = '';
        opts.forEach(function (o, i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'ddn-opt' + (i === sel.selectedIndex ? ' is-on' : '');
          b.setAttribute('role', 'option');
          b.setAttribute('aria-selected', i === sel.selectedIndex ? 'true' : 'false');
          b.textContent = o.textContent;
          b.addEventListener('click', function () {
            sel.selectedIndex = i;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            render();
            close();
            trigger.focus();
          });
          menu.appendChild(b);
        });
      }
      render();

      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        root.classList.contains('is-open') ? close() : open();
      });
      root.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && root.classList.contains('is-open')) { close(); trigger.focus(); }
        if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !root.classList.contains('is-open')) { e.preventDefault(); open(); return; }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          var items = [].slice.call(menu.querySelectorAll('.ddn-opt'));
          var at = items.indexOf(document.activeElement);
          var next = e.key === 'ArrowDown' ? Math.min(items.length - 1, at + 1) : Math.max(0, at - 1);
          if (items[next]) items[next].focus();
        }
      });
      document.addEventListener('click', function (e) { if (!root.contains(e.target)) close(); });
      // the option list is rebuilt whenever its owner re-renders (the icon
      // library rewrites it on every category change), so mirror that
      sel.addEventListener('ddn:refresh', render);
      return render;
    }

    document.querySelectorAll('.tabs-select, .iconlib-select, .bsim-select').forEach(enhanceSelect);

    /* ---- gate tables: carry the column name into each cell ----
       Stacked on mobile, "≥ 4.5:1" and "passes, both modes" sit as two bare
       lines with the header row hidden, and nothing says which is the
       threshold and which is the reading. The label is read off that table's
       own head row rather than hardcoded, because these tables are not all
       Gate/Requires/Measured — some are Property/Value/Why. ---- */
    (function () {
      document.querySelectorAll('.gates').forEach(function (table) {
        var head = table.querySelector('.gate-row.gate-head');
        if (!head) return;
        var labels = [].slice.call(head.children).map(function (c) { return c.textContent.trim(); });
        [].slice.call(table.querySelectorAll('.gate-row')).forEach(function (row) {
          if (row === head || row.classList.contains('gate-band')) return;
          [].slice.call(row.children).forEach(function (cell, i) {
            if (i === 0 || !labels[i]) return;
            cell.setAttribute('data-label', labels[i]);
          });
        });
      });
    })();

    /* ---- mobile: tap a swatch for its hex ----
       The ramp tooltip is mousemove-only, and the tone numbers are hidden at
       this width, so without this a phone reader gets colour and nothing else. */
    (function () {
      var tip = document.querySelector('.exhibit-tooltip');
      var ramps = document.getElementById('colour-ramps');
      if (!tip || !ramps) return;
      var open = null;
      ramps.addEventListener('click', function (e) {
        if (!window.matchMedia('(max-width:640px)').matches) return;
        var sw = e.target.closest('.swatch');
        if (!sw) return;
        if (open) open.classList.remove('is-tapped');
        if (open === sw) { open = null; tip.classList.remove('show'); return; }
        open = sw;
        sw.classList.add('is-tapped');
        var r = sw.getBoundingClientRect();
        tip.textContent = sw.dataset.hex;
        tip.style.left = (r.left + r.width / 2) + 'px';
        tip.style.top = r.top + 'px';
        tip.classList.add('show');
      });
      document.addEventListener('click', function (e) {
        if (open && !e.target.closest('.swatch')) {
          open.classList.remove('is-tapped'); open = null; tip.classList.remove('show');
        }
      });
    })();
  })();
})();
