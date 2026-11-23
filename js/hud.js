/* XO LAB — "mission control" layout layer.
   Telemetry cards, preview callouts, the scene / preset strip, layout views, the side panel toggle,
   and the UI accent colour. Pure UI: it only reads app state and calls the app's existing actions,
   so every feature keeps working exactly as before. */
(function () {
  'use strict';
  const XO = window.XO;

  function init() {
    const $ = XO.$, $$ = XO.$$, A = XO.audio, S = XO.S, G = XO.gl, D = XO.detector, L = XO.look3d;
    const root = document.documentElement, stage = $('#stage');
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const store = {
      get(k, d) { try { const v = localStorage.getItem('xo.ui.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
      set(k, v) { try { localStorage.setItem('xo.ui.' + k, JSON.stringify(v)); } catch (e) { /* storage off: keep in memory only */ } },
    };
    const phone = () => window.matchMedia('(max-width: 899px)').matches;

    /* ======================= accent colour ======================= */
    const ACCENTS = [['#ff3b30', 'Red'], ['#ff8a00', 'Orange'], ['#e9e9ea', 'White'], ['#3ddc84', 'Green'], ['#4da3ff', 'Blue'], ['#a78bfa', 'Violet']];
    function inkFor(hex) {
      const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#0b0b0c' : '#ffffff';
    }
    function setAccent(hex, save) {
      if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
      root.style.setProperty('--accent', hex);
      root.style.setProperty('--accent-ink', inkFor(hex));
      $$('#accentRow [data-accent]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.accent.toLowerCase() === hex.toLowerCase())));
      const ci = $('#accentCustom'); if (ci) ci.value = hex.toLowerCase();
      if (save) store.set('accent', hex);
    }
    $('#accentRow').innerHTML = ACCENTS.map(([h, n]) => `<button type="button" class="sw-accent" data-accent="${h}" style="--c:${h}" aria-label="${n} accent" aria-pressed="false"></button>`).join('') +
      '<input type="color" id="accentCustom" aria-label="Custom accent colour" />';
    $('#accentRow').addEventListener('click', (e) => { const b = e.target.closest('[data-accent]'); if (b) setAccent(b.dataset.accent, true); });
    $('#accentCustom').addEventListener('input', (e) => setAccent(e.target.value, true));
    setAccent(store.get('accent', '#ff3b30'), false);

    const uiBtn = $('#uiBtn'), uiPop = $('#uiPop');
    function popOpen(on) { uiPop.hidden = !on; uiBtn.setAttribute('aria-expanded', String(on)); }
    uiBtn.addEventListener('click', (e) => { e.stopPropagation(); popOpen(uiPop.hidden); });
    document.addEventListener('click', (e) => { if (!uiPop.hidden && !uiPop.contains(e.target) && e.target !== uiBtn) popOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !uiPop.hidden) popOpen(false); });

    /* ======================= layout views + side panel ======================= */
    const VIEWS = ['edit', 'perform', 'overlay'];
    let view = store.get('view', 'edit'); if (!VIEWS.includes(view)) view = 'edit';
    let sideOpen = store.get('side', true);
    function applyLayout() {
      VIEWS.forEach((v) => root.classList.toggle('view-' + v, v === view));
      $$('#viewPills [data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
      const hideSide = !phone() && (view !== 'edit' || !sideOpen);
      root.classList.toggle('side-hidden', hideSide);
      $('#sqSide').setAttribute('aria-pressed', String(!hideSide));
      window.dispatchEvent(new Event('resize')); // the 3D renderer re-measures the stage
    }
    $('#viewPills').addEventListener('click', (e) => {
      const b = e.target.closest('[data-view]'); if (!b) return;
      view = b.dataset.view; store.set('view', view);
      if (view === 'edit') { sideOpen = true; store.set('side', true); }
      applyLayout();
    });
    function showSide(on) {
      if (on && view !== 'edit') { view = 'edit'; store.set('view', view); }
      sideOpen = on; store.set('side', on); applyLayout();
    }
    $('#sqSide').addEventListener('click', () => showSide(root.classList.contains('side-hidden')));
    $('#sideClose').addEventListener('click', () => showSide(false));
    window.matchMedia('(max-width: 899px)').addEventListener('change', applyLayout);
    applyLayout();

    // telemetry card buttons jump to the matching panel
    document.addEventListener('click', (e) => {
      const g = e.target.closest('[data-goto]'); if (!g) return;
      if (root.classList.contains('side-hidden')) showSide(true);
      XO.showTab(g.dataset.goto);
      if (phone()) { const p = $('#panels'); if (p) p.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
    });

    /* ======================= stage bar buttons ======================= */
    let labelsOn = store.get('callouts', true);
    function setLabels(on) { labelsOn = on; store.set('callouts', on); $('#sqLabels').setAttribute('aria-pressed', String(on)); $('#uiCallouts').checked = on; }
    $('#sqLabels').addEventListener('click', () => setLabels(!labelsOn));
    $('#uiCallouts').addEventListener('change', (e) => setLabels(e.target.checked));
    setLabels(labelsOn);

    const audioEl = A.el;
    function setLoop(on) { audioEl.loop = on; store.set('loop', on); $('#sqLoop').setAttribute('aria-pressed', String(on)); }
    $('#sqLoop').addEventListener('click', () => { setLoop(!audioEl.loop); XO.toast(audioEl.loop ? 'Track loops.' : 'Track plays once.'); });
    setLoop(store.get('loop', true));

    const fsOk = !!(stage.requestFullscreen || stage.webkitRequestFullscreen);
    if (!fsOk) $('#sqFull').hidden = true;
    $('#sqFull').addEventListener('click', () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      if (fsEl) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (stage.requestFullscreen || stage.webkitRequestFullscreen).call(stage);
    });

    const pal = $('#paletteSelect');
    pal.innerHTML = '<option value="">PALETTE…</option>' + Object.keys(XO.PALETTES || {}).map((n) => `<option value="${esc(n)}">${esc(n.toUpperCase())}</option>`).join('');
    pal.addEventListener('change', () => {
      const n = pal.value; if (!n) return;
      XO.applyPalette(n); XO.syncUI(); if (XO.renderFxList) XO.renderFxList();
      XO.toast(n + ' palette applied.'); pal.value = '';
    });

    /* ======================= asset strip ======================= */
    const strip = $('#assetStrip');
    let stripMode = store.get('strip', 'scenes'); if (!['scenes', 'presets', 'motion'].includes(stripMode)) stripMode = 'scenes';
    let liveScene = null, livePreset = null, liveMotion = null;
    let thumbs = store.get('thumbs', {});
    let prevNames = null;

    function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
    function glyph(name) {
      // deterministic wireframe thumbnail for items without a captured frame
      const h = hash(name), rings = 2 + (h % 3), tilt = (h >> 3) % 60 - 30, sq = (h >> 7) % 2;
      let g = '';
      for (let i = 0; i < rings; i++) g += `<ellipse cx="32" cy="32" rx="${22 - i * 5}" ry="${(8 + i * 3)}" transform="rotate(${tilt + i * 35} 32 32)"/>`;
      g += sq ? '<rect x="24" y="24" width="16" height="16"/>' : '<circle cx="32" cy="32" r="7"/>';
      return `<svg viewBox="0 0 64 64" aria-hidden="true">${g}<path d="M4 32h6M54 32h6M32 4v6M32 54v6"/></svg>`;
    }
    function captureThumb(name) {
      try {
        const src = $('#view'), c = document.createElement('canvas'); c.width = 128; c.height = 128;
        const x = c.getContext('2d'), s = Math.max(c.width / src.width, c.height / src.height);
        x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
        x.drawImage(src, (c.width - src.width * s) / 2, (c.height - src.height * s) / 2, src.width * s, src.height * s);
        thumbs[name] = c.toDataURL('image/jpeg', 0.72);
        const keys = Object.keys(thumbs); if (keys.length > 40) delete thumbs[keys[0]];
        store.set('thumbs', thumbs);
      } catch (e) { /* tainted or no canvas: the glyph is used instead */ }
    }

    function sceneItems() {
      const list = XO.scenes.list();
      const names = list.map((s) => s.name);
      if (prevNames) names.filter((n) => !prevNames.includes(n) && !thumbs[n]).forEach(captureThumb);
      prevNames = names;
      return list.map((s, i) => {
        const fx = (s.S && s.S.fx && s.S.fx.stack) ? s.S.fx.stack.length : 0;
        return { id: s.name, name: s.name, key: i < 9 ? String(i + 1) : '', tag: s.name === liveScene ? 'LIVE' : fx ? fx + ' FX' : 'READY', live: s.name === liveScene, energy: Math.min(1, fx / 6), thumb: thumbs[s.name] };
      });
    }
    function presetItems() {
      return Object.keys(XO.FX_PRESETS || {}).map((n, i) => { const c = XO.FX_PRESETS[n].length; return { id: n, name: n, key: '', tag: n === livePreset ? 'ACTIVE' : c + ' FX', live: n === livePreset, energy: Math.min(1, c / 6), idx: i }; });
    }
    function motionItems() {
      const P = (L && L.MOTION_PRESETS) || {};
      return Object.keys(P).map((n) => { const on = Object.values(P[n]).filter((v) => v === true).length; return { id: n, name: n, key: '', tag: n === liveMotion ? 'ACTIVE' : on ? on + ' MOVES' : 'STATIC', live: n === liveMotion, energy: Math.min(1, on / 6) }; });
    }
    function cardHTML(it) {
      const th = it.thumb ? `<img src="${it.thumb}" alt="" />` : glyph(it.name);
      return `<button type="button" class="asset${it.live ? ' live' : ''}" data-item="${esc(it.id)}" aria-pressed="${it.live}">
        <span class="a-thumb">${th}</span>
        <span class="a-meta"><b>${esc(it.name)}</b><span class="a-tag">${it.live ? '<i></i>' : ''}${esc(it.tag)}</span></span>
        ${it.key ? `<span class="a-key">${it.key}</span>` : ''}
        <span class="a-bar"><i style="width:${(it.energy * 100).toFixed(0)}%"></i></span></button>`;
    }
    function renderStrip() {
      $$('#stageBar [data-strip]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.strip === stripMode)));
      let html = '';
      if (stripMode === 'scenes') {
        const items = sceneItems();
        html = '<button type="button" class="asset add" data-add="scene"><span class="a-plus">＋</span><span class="a-meta"><b>SAVE SCENE</b><span class="a-tag">KEYS 1–9 RECALL</span></span></button>' +
          items.map(cardHTML).join('') + (items.length ? '' : '<div class="asset-empty">No scenes yet. Set up a look, then save it as a scene.</div>');
      } else if (stripMode === 'presets') html = presetItems().map(cardHTML).join('');
      else html = motionItems().map(cardHTML).join('') + (XO.model && XO.model.loaded ? '' : '<div class="asset-empty">Motion moves 3D models. Load a model in Media to see it.</div>');
      strip.innerHTML = html;
      strip.setAttribute('aria-label', { scenes: 'Scenes', presets: 'Filter presets', motion: '3D motion presets' }[stripMode]);
    }
    $('#stageBar').addEventListener('click', (e) => {
      const c = e.target.closest('[data-strip]'); if (!c) return;
      stripMode = c.dataset.strip; store.set('strip', stripMode); renderStrip(); strip.scrollLeft = 0;
    });
    function activate(id) {
      if (stripMode === 'scenes') { XO.loadScene(id); }
      else if (stripMode === 'presets') {
        const sel = $('#fxPreset'); if (!sel) return;
        sel.value = 'b:' + id; sel.dispatchEvent(new Event('change', { bubbles: true }));
        livePreset = id; XO.toast('Filter preset: ' + id); renderStrip();
      } else {
        const b = document.querySelector('[data-motion="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]'); if (b) b.click();
        liveMotion = id; XO.toast('3D motion: ' + id); renderStrip();
      }
    }
    strip.addEventListener('click', (e) => {
      if (e.target.closest('[data-add="scene"]')) { const s = $('#sceneSave'); if (s) s.click(); return; }
      const a = e.target.closest('[data-item]'); if (a) activate(a.dataset.item);
    });
    $('#sqShuffle').addEventListener('click', () => {
      const ids = $$('#assetStrip [data-item]').map((b) => b.dataset.item).filter((id) => id !== liveScene && id !== livePreset && id !== liveMotion);
      if (!ids.length) { XO.toast(stripMode === 'scenes' ? 'Save at least two scenes to shuffle.' : 'Nothing else to shuffle to.'); return; }
      activate(ids[Math.floor(Math.random() * ids.length)]);
    });
    // track which scene is live (list clicks, keys 1–9 and the strip all go through XO.loadScene)
    const origLoad = XO.loadScene;
    XO.loadScene = function (name) { const ok = origLoad(name); if (ok) { liveScene = name; if (stripMode === 'scenes') renderStrip(); } return ok; };
    // re-render when the scene list changes (save, rename, delete, import, project open)
    const sl = $('#sceneList');
    if (sl) new MutationObserver(() => { if (stripMode === 'scenes') renderStrip(); else prevNames = XO.scenes.list().map((s) => s.name); }).observe(sl, { childList: true, subtree: true, characterData: true });
    prevNames = XO.scenes.list().map((s) => s.name);
    renderStrip();

    /* ======================= live telemetry ======================= */
    const bandRows = $$('#tcBars .bar-row');
    const thrKey = { bass: 'thrBass', mid: 'thrMid', high: 'thrHigh' };
    let fxSig = null, lastTick = 0, wasModel = null;
    const txt = (id, v) => { const el = document.getElementById(id); if (el && el.textContent !== v) el.textContent = v; };

    function renderFxMini() {
      const st = S.fx.stack;
      $('#tcFx').innerHTML = st.length
        ? st.map((f, i) => `<button type="button" class="fxm${f.on ? ' on' : ''}" data-fxm="${esc(f.id)}" aria-pressed="${f.on}"><span class="n">${String(i + 1).padStart(2, '0')}</span><span class="nm">${esc((XO.FILTERS[f.type] || { name: f.type }).name)}</span><i class="sw"></i></button>`).join('')
        : '<div class="fx-empty">No filters. Pick a preset in the strip or open FX.</div>';
    }
    $('#tcFx').addEventListener('click', (e) => {
      const b = e.target.closest('[data-fxm]'); if (!b) return;
      const f = S.fx.stack.find((x) => x.id === b.dataset.fxm); if (!f) return;
      f.on = !f.on; if (XO.renderFxList) XO.renderFxList(); fxSig = ''; tick(performance.now(), true);
    });

    function tick(now, force) {
      if (!force && (document.hidden || now - lastTick < 100)) return;
      lastTick = now;
      const playing = A.isPlaying && A.isPlaying();
      // audio gauge
      const lvl = Math.max(0, Math.min(1, (A.level || 0) * 2));
      const gf = $('#gaugeFill'); if (gf) gf.style.strokeDasharray = (lvl * 100).toFixed(1) + ' 100';
      txt('gaugeVal', String(Math.round(lvl * 100)));
      const tag = ($('#audioTag') || {}).textContent || '';
      txt('tcAudioState', A.loaded ? tag.replace(/^AUDIO /, '') : 'NO TRACK');
      const bpm = A.effectiveBpm ? A.effectiveBpm() : 0;
      const bpmTxt = bpm ? bpm.toFixed(1) : '—';
      txt('tcBpm', bpmTxt + ' BPM'); txt('roBpm', bpmTxt);
      // bar.beat counter from the detected kicks (4 beats per bar)
      const beatN = A.loaded ? (A.beatCount || 0) : 0;
      txt('roBeat', beatN ? (Math.floor((beatN - 1) / 4) % 999 + 1) + '.' + (((beatN - 1) % 4) + 1) : '—');
      txt('roAudio', A.loaded ? tag : 'AUDIO OFF');
      $('#roAudioDot').classList.toggle('on', !!playing);
      const gpu = !!(G && G.ok);
      txt('roGpu', gpu ? 'GPU FX' : 'NO WEBGL2');
      $('#roGpuDot').classList.toggle('ok', gpu); $('#roGpuDot').classList.toggle('alert', !gpu);
      // bands
      bandRows.forEach((row) => {
        const k = row.dataset.band, b = A.bands[k]; if (!b) return;
        row.querySelector('i').style.width = (b.norm * 100).toFixed(1) + '%';
        row.querySelector('b').style.left = (S.audio[thrKey[k]] || 0) + '%';
        row.querySelector('output').textContent = b.norm.toFixed(2);
        row.querySelector('em').classList.toggle('hit', now - b.lastHit < 140);
      });
      // fx chain
      const sig = S.fx.stack.map((f) => f.id + (f.on ? 1 : 0) + f.type).join('|');
      if (sig !== fxSig) { fxSig = sig; renderFxMini(); }
      // output / system
      const V = XO.state.V, out = XO.qa && XO.qa.OUT;
      if (out) txt('tcRes', out.full.w + '×' + out.full.h);
      txt('tcFps', XO.perf && XO.perf.fps ? Math.round(XO.perf.fps) + '' : '—');
      txt('tcSrc', V.kind ? (V.kind === 'model' ? '3D' : V.kind.toUpperCase()) : 'NONE');
      txt('tcBlobs', S.blob.on && V.kind ? String(D.count || 0) : 'OFF');
      // callouts on the preview
      const co = $('#callouts'), empty = $('#empty');
      const showCo = labelsOn && (V.kind || A.loaded) && empty && empty.hidden;
      co.hidden = !showCo;
      if (showCo) {
        const bass = A.bands.bass ? A.bands.bass.norm : 0, active = S.fx.stack.filter((f) => f.on).length;
        txt('coA', 'BPM ' + bpmTxt);
        txt('coB', 'BASS ' + bass.toFixed(2));
        txt('coC', 'FX ' + active + (S.blob.on && V.kind ? ' · BLOBS ' + (D.count || 0) : ''));
        txt('coD', 'LEVEL ' + Math.round(lvl * 100) + '%');
        $('#coOrbit').style.setProperty('--s', (1 + Math.min(1, (A.bands.bass ? A.bands.bass.env || 0 : 0)) * 0.22).toFixed(3));
      }
      // strip: live card energy follows the music
      const liveBar = $('#assetStrip .asset.live .a-bar i'); if (liveBar && playing) liveBar.style.width = (lvl * 100).toFixed(0) + '%';
      // motion strip hint depends on a model being loaded
      const isModel = !!(XO.model && XO.model.loaded);
      if (isModel !== wasModel) { wasModel = isModel; if (stripMode === 'motion') renderStrip(); }
    }
    (function loop(now) { requestAnimationFrame(loop); if (!(XO.exporter && XO.exporter.rendering)) tick(now); })(performance.now());
    XO.hud = { renderStrip, setAccent, applyLayout };
  }
  if (XO.ready) init(); else document.addEventListener('xo:ready', init, { once: true });
})();
