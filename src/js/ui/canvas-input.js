/**
 * canvas-input.js — Interacción directa con el plano mediante herramientas, al estilo GeoGebra.
 *
 * Herramientas:
 *  - mover     → arrastrar un vértice lo mueve; arrastrar el fondo mueve el plano.
 *  - punto     → un clic crea una figura de un punto.
 *  - segmento  → dos clics crean un segmento.
 *  - poligono  → cada clic agrega un vértice; clic en el primero (o Escape) cierra el polígono.
 *  - vista     → arrastrar siempre mueve el plano (no toma vértices).
 * En todas: rueda del ratón → zoom hacia el cursor; dos dedos → pellizco (zoom + desplazamiento).
 * Con «Ajustar a la cuadrícula», los puntos caen en coordenadas exactas.
 *
 * Toda conversión píxel ↔ plano usa la matriz de viewport V (ecuación 8) y su inversa.
 */
(function (Geo) {
  'use strict';

  const ZOOM_MIN = 2;     // ≈ ±100 unidades visibles en un lienzo de 400 px
  const ZOOM_MAX = 400;

  /** Distancia en píxeles para «tocar» un vértice (más amplia con el dedo). */
  const HIT_MOUSE = 10;
  const HIT_TOUCH = 20;

  /** Si el puntero se mueve menos que esto, la acción cuenta como clic y no como arrastre. */
  const CLICK_TOLERANCE = 5;

  /** Límite de coordenadas, igual que en la validación (regla «coordenada»). */
  const COORD_LIMIT = Geo.Validation.RULES.coordenada.max;

  /** Vértices máximos de un polígono. */
  const MAX_VERTICES = Geo.Shapes.LIMITS.poligono.max;

  /** Herramientas: nombre visible y ayuda que se muestra al elegirlas. */
  const TOOLS = {
    mover:    { name: 'Mover', help: 'Arrastra un punto azul para moverlo, o el fondo para desplazar el plano.' },
    punto:    { name: 'Punto', help: 'Haz clic en el plano para crear un punto.' },
    segmento: { name: 'Segmento', help: 'Haz clic en dos lugares del plano: el extremo inicial y el final.' },
    poligono: { name: 'Polígono', help: 'Haz clic para cada vértice (hasta ' + MAX_VERTICES +
                ') y termina haciendo clic otra vez en el primero o pulsando Escape.' },
    vista:    { name: 'Desplazar vista', help: 'Arrastra para mover el plano. Usa la rueda o el pellizco para el zoom.' }
  };

  /** Clics necesarios para terminar la figura con cada herramienta (polígono: hasta cerrarlo). */
  const CLICKS_TO_FINISH = { punto: 1, segmento: 2, poligono: MAX_VERTICES };

  /**
   * @param {object} o
   *   canvas, renderer, state
   *   requestRender()        — pide redibujar
   *   onShapeEdited()        — la figura cambió desde el plano (refrescar la vista algebraica)
   *   onCursor(text)         — texto de la posición del cursor
   *   setStatus(text, type)
   *   onToolChange(tool)     — la herramienta activa cambió
   *   onResetView()          — volver a la vista inicial (doble clic)
   */
  function create(o) {
    const canvas = o.canvas;
    const renderer = o.renderer;
    const state = o.state;

    const pointers = new Map();   // id → { u, v } en píxeles del lienzo
    let gesture = null;

    let tool = 'mover';
    let building = false;         // hay una figura a medio construir
    let shapeBefore = null;       // figura anterior, por si se cancela la construcción
    let hoverIndex = -1;          // vértice bajo el cursor (para resaltarlo)
    let hoverPoint = null;        // punto del plano bajo el cursor (para la línea guía)

    // ------------------------------------------------------------ Utilidades

    function localPoint(e) {
      const rect = canvas.getBoundingClientRect();
      return { u: e.clientX - rect.left, v: e.clientY - rect.top };
    }

    function clampCoord(value) {
      return Math.min(COORD_LIMIT, Math.max(-COORD_LIMIT, value));
    }

    /**
     * Paso de ajuste: la potencia de 10 de la cuadrícula visible.
     * Cuadrícula de 1, 2 o 5 → enteros; de 0.2 o 0.5 → décimas.
     */
    function snapStep() {
      const step = renderer.gridStep(state.view.zoom);
      return Math.pow(10, Math.floor(Math.log10(step) + 1e-9));
    }

    /** Píxel → punto del plano, ajustado a la cuadrícula si está activado. */
    function worldPoint(p) {
      const w = renderer.toWorld(p.u, p.v, state.view);
      let x = w.x, y = w.y;
      if (state.view.snap) {
        const s = snapStep();
        x = Math.round(x / s) * s;
        y = Math.round(y / s) * s;
      }
      // Se redondea a 3 decimales para que la tabla y la vista algebraica sean legibles.
      return {
        x: clampCoord(Math.round(x * 1000) / 1000),
        y: clampCoord(Math.round(y * 1000) / 1000)
      };
    }

    /** Índice del vértice original más cercano al píxel p, o −1 si ninguno está a tiro. */
    function hitVertex(p, radius) {
      if (!state.view.showOriginal) return -1;
      const V = renderer.viewportMatrix(state.view);
      let best = -1, bestDist = radius;
      state.shape.vertices.forEach(function (vertex, i) {
        const s = Geo.Matrix.applyToPoint(V, vertex);
        const d = Math.hypot(s.x - p.u, s.y - p.v);
        if (d <= bestDist) { best = i; bestDist = d; }
      });
      return best;
    }

    function hitRadius(e) {
      return e.pointerType === 'touch' || e.pointerType === 'pen' ? HIT_TOUCH : HIT_MOUSE;
    }

    function showCursor(p) {
      const w = renderer.toWorld(p.u, p.v, state.view);
      o.onCursor('Cursor: (' + w.x.toFixed(2) + ', ' + w.y.toFixed(2) + ')');
    }

    function isCreationTool(t) {
      return t === 'punto' || t === 'segmento' || t === 'poligono';
    }

    // ------------------------------------------------------------ Zoom

    /**
     * Cambia el zoom manteniendo fijo el punto del plano bajo el píxel (u, v).
     * Ecuación (9):  cx = x − (u − W/2) / k     cy = y + (v − H/2) / k
     */
    function setZoom(z, u, v) {
      const size = renderer.size();
      if (u === undefined) { u = size.width / 2; v = size.height / 2; }
      const anchor = renderer.toWorld(u, v, state.view);
      const k = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
      state.view.zoom = k;
      state.view.center = {
        x: anchor.x - (u - size.width / 2) / k,
        y: anchor.y + (v - size.height / 2) / k
      };
      state.view.manualZoom = true;
      o.requestRender();
    }

    // ------------------------------------------------------------ Construcción de figuras

    /** Tipo de figura según cuántos vértices tiene. */
    function typeForCount(n) {
      if (n <= 1) return 'punto';
      if (n === 2) return 'segmento';
      if (n === 3) return 'triangulo';
      return 'poligono';
    }

    function startBuilding() {
      shapeBefore = state.shape;
      state.shape = { type: 'punto', vertices: [], closed: false };
      state.selectedVertex = 0;
      building = true;
    }

    /** Termina la figura en construcción (se cierra si tiene 3 o más vértices). */
    function finishBuilding() {
      if (!building) return;
      building = false;
      const n = state.shape.vertices.length;
      let message;
      if (!n && shapeBefore) {
        state.shape = shapeBefore;
        message = 'Construcción cancelada: no se colocó ningún punto.';
      } else {
        state.shape.type = typeForCount(n);
        state.shape.closed = Geo.Shapes.isClosedType(state.shape.type);
        message = 'Figura terminada: ' + Geo.Shapes.NAMES[state.shape.type].toLowerCase() +
          ' con ' + n + (n === 1 ? ' vértice.' : ' vértices.');
      }
      shapeBefore = null;
      // Primero se refresca la vista algebraica (limpia la barra de estado) y luego el mensaje.
      o.onShapeEdited();
      o.setStatus(message, 'ok');
      o.requestRender();
    }

    function addVertex(point) {
      const vs = state.shape.vertices;
      vs.push(point);
      // Mientras se construye, la figura se muestra abierta; se cierra al terminar.
      state.shape.type = typeForCount(vs.length);
      state.shape.closed = false;
      state.selectedVertex = vs.length - 1;
      o.onShapeEdited();
      o.setStatus('Vértice ' + Geo.Shapes.vertexName(vs.length - 1) + ' = (' +
        Geo.Matrix.formatNumber(point.x) + ', ' + Geo.Matrix.formatNumber(point.y) + ').', 'ok');
      if (vs.length >= CLICKS_TO_FINISH[tool]) finishBuilding();
      o.requestRender();
    }

    /** Clic con una herramienta de construcción. */
    function creationClick(p, hit) {
      if (!building) startBuilding();
      if (tool === 'poligono' && hit === 0 && state.shape.vertices.length >= 3) {
        finishBuilding();   // clic en el primer vértice: se cierra el polígono
        return;
      }
      addVertex(worldPoint(p));
    }

    // ------------------------------------------------------------ Herramientas

    function setTool(next) {
      if (!TOOLS[next]) return;
      if (building) finishBuilding();
      tool = next;
      hoverIndex = -1;
      Object.keys(TOOLS).forEach(function (t) { canvas.classList.toggle('tool-' + t, t === tool); });
      o.onToolChange(tool);
      o.requestRender();
    }

    // ------------------------------------------------------------ Gestos

    function pointerSummary() {
      const pts = Array.from(pointers.values());
      let u = 0, v = 0;
      pts.forEach(function (p) { u += p.u; v += p.v; });
      u /= pts.length; v /= pts.length;
      const dist = pts.length > 1 ? Math.hypot(pts[0].u - pts[1].u, pts[0].v - pts[1].v) : 0;
      return { u: u, v: v, dist: dist };
    }

    /** Empieza (o reinicia) un gesto de desplazamiento / pellizco. */
    function startPan(moved, hit) {
      const s = pointerSummary();
      gesture = { kind: 'pan', u: s.u, v: s.v, dist: s.dist, zoom: state.view.zoom,
                  moved: !!moved, startU: s.u, startV: s.v, hit: hit === undefined ? -1 : hit };
    }

    canvas.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button > 0) return;   // solo botón principal
      // La captura hace que el arrastre siga aunque el puntero salga del lienzo.
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* puntero ya liberado */ }
      const p = localPoint(e);
      pointers.set(e.pointerId, p);

      if (pointers.size > 1) {         // segundo dedo: siempre pellizco
        startPan(true);
        return;
      }
      const hit = tool === 'vista' ? -1 : hitVertex(p, hitRadius(e));
      if (tool === 'mover' && hit >= 0) {
        gesture = { kind: 'vertex', index: hit, moved: false, startU: p.u, startV: p.v };
        state.selectedVertex = hit;
        canvas.classList.add('is-moving-point');
      } else {
        startPan(false, hit);
        canvas.classList.add('is-dragging');
      }
    });

    canvas.addEventListener('pointermove', function (e) {
      const p = localPoint(e);
      showCursor(p);

      if (!pointers.has(e.pointerId)) {
        // Sin botón pulsado: resaltar el vértice bajo el cursor y actualizar la línea guía.
        const radius = hitRadius(e);
        const overIndex = tool === 'mover' || (tool === 'poligono' && building) ? hitVertex(p, radius) : -1;
        canvas.classList.toggle('over-point', tool === 'mover' && overIndex >= 0);
        const newHover = isCreationTool(tool) ? worldPoint(p) : null;
        if (overIndex !== hoverIndex || isCreationTool(tool)) {
          hoverIndex = overIndex;
          hoverPoint = newHover;
          o.requestRender();
        }
        return;
      }
      pointers.set(e.pointerId, p);

      if (gesture.kind === 'vertex') {
        if (Math.hypot(p.u - gesture.startU, p.v - gesture.startV) > CLICK_TOLERANCE) gesture.moved = true;
        if (!gesture.moved) return;
        const w = worldPoint(p);
        const vertex = state.shape.vertices[gesture.index];
        if (vertex.x !== w.x || vertex.y !== w.y) {
          vertex.x = w.x;
          vertex.y = w.y;
          o.onShapeEdited();
          o.requestRender();
        }
        return;
      }

      // Desplazamiento: el plano sigue al dedo o al ratón (1 px = 1/k unidades; Y invertido).
      const s = pointerSummary();
      if (Math.hypot(s.u - gesture.startU, s.v - gesture.startV) > CLICK_TOLERANCE) gesture.moved = true;
      const k = state.view.zoom;
      state.view.center = {
        x: state.view.center.x - (s.u - gesture.u) / k,
        y: state.view.center.y + (s.v - gesture.v) / k
      };
      gesture.u = s.u;
      gesture.v = s.v;
      // Pellizco: el zoom sigue la razón entre la separación actual y la inicial.
      if (pointers.size > 1 && gesture.dist > 0) {
        setZoom(gesture.zoom * s.dist / gesture.dist, s.u, s.v);
      } else {
        o.requestRender();
      }
    });

    function endPointer(e, cancelled) {
      if (!pointers.has(e.pointerId)) return;
      const p = pointers.get(e.pointerId);
      pointers.delete(e.pointerId);
      if (pointers.size) { startPan(true); return; }

      const g = gesture;
      gesture = null;
      canvas.classList.remove('is-dragging', 'is-moving-point');
      if (!g || cancelled) return;

      if (g.kind === 'vertex') {
        if (g.moved) {
          const v = state.shape.vertices[g.index];
          o.setStatus('Punto ' + Geo.Shapes.vertexName(g.index) + ' = (' +
            Geo.Matrix.formatNumber(v.x) + ', ' + Geo.Matrix.formatNumber(v.y) + ').', 'ok');
        } else {
          o.onShapeEdited();   // un clic sobre el vértice lo selecciona para la explicación
          o.requestRender();
        }
        return;
      }

      if (!g.moved && isCreationTool(tool)) creationClick(p, g.hit);
    }
    canvas.addEventListener('pointerup', function (e) { endPointer(e, false); });
    canvas.addEventListener('pointercancel', function (e) { endPointer(e, true); });
    canvas.addEventListener('pointerleave', function () {
      o.onCursor('Cursor: —');
      canvas.classList.remove('over-point');
      if (hoverIndex !== -1 || hoverPoint) {
        hoverIndex = -1;
        hoverPoint = null;
        o.requestRender();
      }
    });

    // Rueda del ratón (o dos dedos en el panel táctil): zoom hacia el cursor.
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      const p = localPoint(e);
      const delta = e.deltaY * (e.deltaMode === 1 ? 16 : 1);   // deltaMode 1 = líneas
      setZoom(state.view.zoom * Math.exp(-delta * 0.0015), p.u, p.v);
      showCursor(p);
    }, { passive: false });

    // Doble clic: vista inicial. Con las herramientas de construcción no, porque cada clic crea puntos.
    canvas.addEventListener('dblclick', function () {
      if (!isCreationTool(tool)) o.onResetView();
    });

    // Escape: termina la figura en construcción y vuelve a la herramienta Mover (como en GeoGebra).
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (building) finishBuilding();
      if (tool !== 'mover') setTool('mover');
    });

    /** Sale de la construcción sin tocar la figura (cuando otra acción la reemplaza). */
    function abortBuilding() {
      building = false;
      shapeBefore = null;
    }

    /**
     * Datos para el renderizador: vértice resaltado y línea guía desde el último
     * vértice colocado hasta el cursor.
     */
    function overlay() {
      let preview = null;
      if (hoverPoint && isCreationTool(tool)) {
        const vs = state.shape.vertices;
        const from = building && vs.length ? vs[vs.length - 1] : null;
        preview = { from: from, to: hoverPoint };
      }
      return { highlight: hoverIndex, preview: preview };
    }

    return {
      TOOLS: TOOLS,
      setZoom: setZoom,
      setTool: setTool,
      getTool: function () { return tool; },
      isBuilding: function () { return building; },
      abortBuilding: abortBuilding,
      overlay: overlay,
      ZOOM_MIN: ZOOM_MIN
    };
  }

  Geo.CanvasInput = { create: create };
})(window.Geo = window.Geo || {});
