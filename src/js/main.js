/**
 * main.js — Arranque de la aplicación y ciclo de actualización.
 *
 * Pipeline (docs/diseno.md, sección 5.1):
 *   estado → M = Mn·…·M1 → P′ = M·P → V (viewport) → Canvas 2D → paneles
 */
(function (Geo) {
  'use strict';

  const ZOOM_FACTOR = 1.25;

  const state = Geo.State.initial();

  const dom = {
    canvas: document.getElementById('canvas'),
    canvasWrap: document.getElementById('canvasWrap'),
    status: document.getElementById('status'),
    cursor: document.getElementById('cursor'),
    showOriginal: document.getElementById('showOriginal'),
    showSteps: document.getElementById('showSteps'),
    compare: document.getElementById('compare'),
    snap: document.getElementById('snap'),
    toolButtons: document.querySelectorAll('[data-tool]'),
    toolHelp: document.getElementById('toolHelp'),
    algebraDerived: document.getElementById('algebraDerived'),
    zoomIn: document.getElementById('zoomIn'),
    zoomOut: document.getElementById('zoomOut'),
    centerView: document.getElementById('centerView'),
    matrixList: document.getElementById('matrixList'),
    composite: document.getElementById('composite'),
    coordBody: document.getElementById('coordBody'),
    explainVertex: document.getElementById('explainVertex'),
    explanation: document.getElementById('explanation')
  };

  const renderer = Geo.Renderer.create(dom.canvas);

  function setStatus(text, type) {
    dom.status.textContent = text;
    dom.status.className = 'status-message' + (type === 'error' ? ' is-error' : '');
  }

  // ------------------------------------------------------------ Cálculo

  /** Calcula todo lo que se dibuja y se muestra a partir del estado. */
  function computeFrame() {
    const original = state.shape.vertices;
    const centroid = Geo.Shapes.centroid(original);
    const composition = Geo.Transforms.compose(state.transforms, centroid);
    const result = Geo.Matrix.applyToPoints(composition.matrix, original);

    // Figuras intermedias: el acumulado tras cada paso, salvo el último (que es el resultado).
    const steps = composition.steps.slice(0, -1).map(function (s) {
      return Geo.Matrix.applyToPoints(s.cumulative, original);
    });

    // Comparación con el orden inverso (solo tiene sentido con 2 o más pasos).
    let compare = null;
    if (state.view.compare && composition.steps.length > 1) {
      const reversed = Geo.Transforms.composeReversed(state.transforms, centroid);
      compare = Geo.Matrix.applyToPoints(reversed.matrix, original);
    }

    // Pivotes distintos del origen de las rotaciones y escalados activos.
    const pivots = [];
    composition.steps.forEach(function (s) {
      if (s.transform.type === 'T') return;
      const p = Geo.Transforms.resolvePivot(s.transform.params.pivot, centroid);
      if (p.x !== 0 || p.y !== 0) pivots.push(p);
    });

    return {
      view: state.view,
      closed: state.shape.closed,
      original: original,
      result: result,
      steps: steps,
      compare: compare,
      pivots: pivots,
      composition: composition,
      centroid: centroid
    };
  }

  // ------------------------------------------------------------ Dibujo

  let pending = false;

  /** Agrupa varios cambios seguidos en un solo redibujado por cuadro. */
  function requestRender() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(function () {
      pending = false;
      renderNow();
    });
  }

  function renderNow() {
    const frame = computeFrame();
    // Resalte del vértice bajo el cursor y línea guía de la herramienta activa.
    const overlay = input.overlay();
    frame.highlight = overlay.highlight;
    frame.preview = overlay.preview;
    renderer.draw(frame);
    Geo.Panels.renderAlgebra(dom.algebraDerived, state.shape, frame.result, frame.composition);
    Geo.Panels.renderMatrices(dom.matrixList, dom.composite, frame.composition, frame.centroid);
    Geo.Panels.renderCoordinates(dom.coordBody, frame.original, frame.result);
    renderExplainOptions();
    Geo.Explain.render(dom.explanation, state.selectedVertex, frame.original, frame.composition, frame.centroid);
    if (state.view.compare && frame.composition.steps.length < 2) {
      dom.compare.title = 'Se necesitan al menos 2 transformaciones activas para comparar el orden.';
    } else {
      dom.compare.title = '';
    }
    return frame;
  }

  /** Opciones del selector de vértice (A, B, C…), solo si cambió la cantidad. */
  function renderExplainOptions() {
    const n = state.shape.vertices.length;
    if (dom.explainVertex.options.length !== n) {
      dom.explainVertex.innerHTML = '';
      for (let i = 0; i < n; i++) {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = Geo.Shapes.vertexName(i);
        dom.explainVertex.appendChild(opt);
      }
    }
    if (state.selectedVertex >= n) state.selectedVertex = 0;
    dom.explainVertex.value = String(state.selectedVertex);
  }

  // ------------------------------------------------------------ Vista

  function syncViewControls() {
    // Tras reiniciar, la vista vuelve al zoom automático.
    if (!state.view.manualZoom && renderer.size().width > 1) state.view.zoom = autoZoom();
    dom.showOriginal.checked = state.view.showOriginal;
    dom.showSteps.checked = state.view.showSteps;
    dom.compare.checked = state.view.compare;
    dom.snap.checked = state.view.snap;
  }

  dom.showOriginal.addEventListener('change', function () { state.view.showOriginal = dom.showOriginal.checked; requestRender(); });
  dom.showSteps.addEventListener('change', function () { state.view.showSteps = dom.showSteps.checked; requestRender(); });
  dom.compare.addEventListener('change', function () {
    state.view.compare = dom.compare.checked;
    const active = state.transforms.filter(function (t) { return t.enabled; }).length;
    if (state.view.compare && active < 2) {
      setStatus('Para comparar el orden se necesitan al menos 2 transformaciones activas.', 'error');
    }
    requestRender();
  });

  /** Unidades visibles desde el origen hasta el borde más corto con el zoom automático. */
  const AUTO_HALF_UNITS = 8;

  /**
   * Zoom automático: en pantallas pequeñas se aleja para que se vea al menos
   * de −8 a 8 en el lado más corto; en pantallas grandes no supera el valor inicial.
   */
  function autoZoom() {
    const size = renderer.size();
    const fit = Math.min(size.width, size.height) / (2 * AUTO_HALF_UNITS);
    return Math.min(Geo.State.DEFAULT_ZOOM, Math.max(input.ZOOM_MIN, fit));
  }

  dom.zoomIn.addEventListener('click', function () { input.setZoom(state.view.zoom * ZOOM_FACTOR); });
  dom.zoomOut.addEventListener('click', function () { input.setZoom(state.view.zoom / ZOOM_FACTOR); });
  dom.centerView.addEventListener('click', resetView);

  /** Vista inicial: origen al centro y zoom automático. */
  function resetView() {
    state.view.manualZoom = false;
    state.view.zoom = autoZoom();
    state.view.center = { x: 0, y: 0 };
    requestRender();
  }

  dom.explainVertex.addEventListener('change', function () {
    state.selectedVertex = Number(dom.explainVertex.value) || 0;
    requestRender();
  });

  dom.snap.addEventListener('change', function () { state.view.snap = dom.snap.checked; });

  // ------------------------------------------- Pestañas de resultados
  // Matrices · Coordenadas · Paso a paso. Se puede cambiar con clic o con ← →.

  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));

  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      const selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
    });
    if (focus) tab.focus();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab, false); });
    tab.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = (i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
      selectTab(tabs[next], true);
      e.preventDefault();
    });
  });

  // ------------------------------------------- Interacción directa con el plano
  // (arrastrar vértices, colocar puntos, mover el plano, zoom; ver canvas-input.js)

  const input = Geo.CanvasInput.create({
    canvas: dom.canvas,
    renderer: renderer,
    state: state,
    requestRender: requestRender,
    onShapeEdited: function () { controls.refreshShape(); },
    onCursor: function (text) { dom.cursor.textContent = text; },
    setStatus: setStatus,
    onResetView: resetView,
    onToolChange: function (tool) {
      dom.toolButtons.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-tool') === tool));
      });
      const t = input.TOOLS[tool];
      dom.toolHelp.innerHTML = '<strong>' + t.name + ':</strong> ' + Geo.Panels.esc(t.help);
    }
  });

  dom.toolButtons.forEach(function (b) {
    b.addEventListener('click', function () { input.setTool(b.getAttribute('data-tool')); });
  });

  // El lienzo sigue el tamaño de su contenedor y la densidad de píxeles.
  function fitCanvas() {
    // Se mide el lienzo, no el contenedor: el borde del contenedor lo haría 2 px más grande
    // y la conversión píxel ↔ plano quedaría desfasada.
    // getBoundingClientRect conserva los decimales (clientWidth los redondea).
    const rect = dom.canvas.getBoundingClientRect();
    renderer.resize(rect.width, rect.height, window.devicePixelRatio || 1);
    if (!state.view.manualZoom) state.view.zoom = autoZoom();
    renderNow();
  }
  if ('ResizeObserver' in window) {
    new ResizeObserver(fitCanvas).observe(dom.canvasWrap);
  } else {
    window.addEventListener('resize', fitCanvas);
  }

  // ------------------------------------------------------------ Arranque

  const controls = Geo.Controls.create({
    state: state,
    onChange: requestRender,
    setStatus: setStatus,
    onViewReset: syncViewControls,
    onShapeReplaced: function () { input.abortBuilding(); }
  });
  controls.renderAll();
  input.setTool('mover');
  fitCanvas();
  setStatus('', 'ok');

  // Acceso para depuración y para medir rendimiento desde la consola.
  Geo.App = { state: state, renderer: renderer, renderNow: renderNow, computeFrame: computeFrame };
})(window.Geo = window.Geo || {});
