/**
 * renderer.js — Dibujo del plano cartesiano y las figuras en Canvas 2D.
 *
 * Solo dibuja: recibe vértices ya transformados por el núcleo matemático
 * y los convierte a píxeles con la matriz de viewport V (ecuación 8).
 * No modifica el estado de la escena.
 */
(function (Geo) {
  'use strict';

  const M = Geo.Matrix;

  /**
   * Colores del lienzo, inspirados en GeoGebra (coinciden con la leyenda en estilos.css):
   *  - Puntos libres (se pueden mover) en azul; puntos dependientes (resultado) en gris oscuro.
   *  - Figura original en café, como los polígonos de GeoGebra; transformada en verde azulado.
   */
  const COLORS = {
    background: '#ffffff',
    gridMinor: '#f0f0f0',
    gridMajor: '#d6d6d6',
    axis: '#252525',
    tickText: '#252525',
    original: '#996633',
    originalFill: 'rgba(153, 102, 51, 0.12)',
    freePoint: '#4d4dff',
    freePointStroke: '#1a1a66',
    freeLabel: '#3333cc',
    result: '#00796b',
    resultFill: 'rgba(0, 121, 107, 0.14)',
    dependentPoint: '#424242',
    dependentLabel: '#00695c',
    step: '#9e9e9e',
    compare: '#8e24aa',
    pivot: '#d32f2f',
    preview: '#996633'
  };

  /** Separación mínima en píxeles entre líneas de la cuadrícula. */
  const MIN_GRID_PX = 30;

  /** Separación mínima para dibujar las subdivisiones finas de la cuadrícula. */
  const MIN_MINOR_PX = 6;

  /**
   * Crea un renderizador asociado a un <canvas>.
   * @param {HTMLCanvasElement} canvas
   */
  function create(canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width;   // tamaño lógico en píxeles CSS
    let height = canvas.height;

    /**
     * Ajusta el tamaño interno del lienzo a su tamaño en pantalla y a la
     * densidad de píxeles del dispositivo, para que las líneas se vean nítidas.
     */
    function resize(cssWidth, cssHeight, dpr) {
      // El tamaño lógico conserva decimales (p. ej. 436.4 px) para que la conversión
      // píxel ↔ plano coincida con lo que se ve; solo el búfer interno se redondea.
      width = Math.max(1, cssWidth);
      height = Math.max(1, cssHeight);
      const ratio = dpr || 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    }

    /**
     * Matriz de viewport V (ecuación 8): mundo → pantalla.
     *   u = k·x + cu,  v = −k·y + cv
     * El −k invierte el eje Y (en pantalla Y crece hacia abajo).
     */
    function viewportMatrix(view) {
      const k = view.zoom;
      const cu = width / 2 - view.center.x * k;
      const cv = height / 2 + view.center.y * k;
      return [
        [k, 0, cu],
        [0, -k, cv],
        [0, 0, 1]
      ];
    }

    /** Inversa de V: píxel de pantalla → coordenadas del plano. */
    function toWorld(u, v, view) {
      const V = viewportMatrix(view);
      return { x: (u - V[0][2]) / V[0][0], y: (v - V[1][2]) / V[1][1] };
    }

    /** Elige el paso de la cuadrícula en la serie 1, 2, 5 × 10ⁿ (algoritmo A6). */
    function gridStep(zoom) {
      const minUnits = MIN_GRID_PX / zoom;
      const power = Math.pow(10, Math.floor(Math.log10(minUnits)));
      const candidates = [1, 2, 5, 10];
      for (let i = 0; i < candidates.length; i++) {
        if (candidates[i] * power >= minUnits) return candidates[i] * power;
      }
      return 10 * power;
    }

    /**
     * Subdivisiones de la cuadrícula, como en GeoGebra: un paso de 1 o 5 se divide
     * en 5 partes y un paso de 2 en 4 (líneas finas cada 0.2, 1 o 0.5 respectivamente).
     */
    function minorStep(step) {
      const lead = Math.round(step / Math.pow(10, Math.floor(Math.log10(step) + 1e-9)));
      return step / (lead === 2 ? 4 : 5);
    }

    /** Dibuja líneas verticales y horizontales cada «step» unidades (solo las visibles). */
    function gridLines(step, V, topLeft, bottomRight) {
      const x0 = Math.ceil(topLeft.x / step), x1 = Math.floor(bottomRight.x / step);
      for (let i = x0; i <= x1; i++) {
        const u = Math.round(V[0][0] * i * step + V[0][2]) + 0.5;
        line(u, 0, u, height);
      }
      const y0 = Math.ceil(bottomRight.y / step), y1 = Math.floor(topLeft.y / step);
      for (let i = y0; i <= y1; i++) {
        const v = Math.round(V[1][1] * i * step + V[1][2]) + 0.5;
        line(0, v, width, v);
      }
    }

    function drawGrid(view, V) {
      const step = gridStep(view.zoom);
      const minor = minorStep(step);
      const topLeft = toWorld(0, 0, view);
      const bottomRight = toWorld(width, height, view);
      const origin = M.applyToPoint(V, { x: 0, y: 0 });

      ctx.lineWidth = 1;
      if (minor * view.zoom >= MIN_MINOR_PX) {
        ctx.strokeStyle = COLORS.gridMinor;
        gridLines(minor, V, topLeft, bottomRight);
      }
      ctx.strokeStyle = COLORS.gridMajor;
      gridLines(step, V, topLeft, bottomRight);

      // Ejes X e Y.
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.2;
      line(0, Math.round(origin.y) + 0.5, width, Math.round(origin.y) + 0.5);
      line(Math.round(origin.x) + 0.5, 0, Math.round(origin.x) + 0.5, height);
      arrowHead(width - 1, Math.round(origin.y) + 0.5, 0);
      arrowHead(Math.round(origin.x) + 0.5, 1, -Math.PI / 2);

      ctx.fillStyle = COLORS.axis;
      ctx.font = 'italic 15px "Times New Roman", serif';
      ctx.fillText('x', width - 14, origin.y - 8);
      ctx.fillText('y', origin.x + 8, 14);

      // Números de los ejes; si un eje sale de la vista, los números se fijan al borde.
      ctx.font = '13px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = COLORS.tickText;
      ctx.strokeStyle = COLORS.background;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      const labelY = clamp(origin.y + 16, 14, height - 4);
      const x0 = Math.ceil(topLeft.x / step), x1 = Math.floor(bottomRight.x / step);
      ctx.textAlign = 'center';
      for (let i = x0; i <= x1; i++) {
        if (i === 0) continue;
        const u = V[0][0] * i * step + V[0][2];
        haloText(axisNumber(i * step), u, labelY);
      }
      ctx.textAlign = 'right';
      const labelX = clamp(origin.x - 5, 26, width - 4);
      const y0 = Math.ceil(bottomRight.y / step), y1 = Math.floor(topLeft.y / step);
      for (let i = y0; i <= y1; i++) {
        if (i === 0) continue;
        const v = V[1][1] * i * step + V[1][2];
        haloText(axisNumber(i * step), labelX, v + 4);
      }
      haloText('0', clamp(origin.x - 5, 10, width - 4), labelY);
      ctx.textAlign = 'left';
    }

    /** Número de eje con signo menos tipográfico (−3), como en GeoGebra. */
    function axisNumber(value) {
      return M.formatNumber(value, 3).replace('-', '\u2212');
    }

    /** Texto con contorno del color de fondo, para que se lea sobre las líneas. */
    function haloText(text, x, y) {
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    }

    function clamp(v, lo, hi) {
      return Math.min(Math.max(v, lo), hi);
    }

    function line(x1, y1, x2, y2) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    function arrowHead(x, y, angle) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-8, -3.5);
      ctx.lineTo(-8, 3.5);
      ctx.closePath();
      ctx.fillStyle = COLORS.axis;
      ctx.fill();
      ctx.restore();
    }

    /**
     * Dibuja una figura al estilo GeoGebra: contorno, relleno suave, puntos con borde,
     * nombres de los vértices (A, B, …) y, opcionalmente, de los lados (a, b, …).
     * @param {Array<{x,y}>} vertices  en coordenadas del plano
     * @param {object} style {
     *   stroke, fill, width, dash,
     *   pointFill, pointStroke, pointRadius   (sin pointFill no se dibujan los puntos)
     *   labels, suffix, labelColor            nombres de los vértices
     *   sideLabels                            nombres de los lados, en el color del contorno
     *   highlight                             índice del vértice resaltado (bajo el cursor)
     *   hidden                                arreglo de booleanos: puntos ocultos (sin marcador ni nombre)
     * }
     */
    function drawShape(vertices, closed, V, style) {
      if (!vertices.length) return;
      const pts = vertices.map(function (p) { return M.applyToPoint(V, p); });

      ctx.save();
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.setLineDash(style.dash || []);
      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = style.width || 2;

      if (pts.length > 1) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        if (closed) {
          ctx.closePath();
          if (style.fill) {
            ctx.fillStyle = style.fill;
            ctx.fill();
          }
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);

      if (style.sideLabels && pts.length > 1) drawSideLabels(pts, closed, style.stroke);

      // Resalte del vértice bajo el cursor (anillo, como en GeoGebra).
      const isHidden = function (i) { return !!(style.hidden && style.hidden[i]); };

      if (style.highlight !== undefined && style.highlight >= 0 && pts[style.highlight] && !isHidden(style.highlight)) {
        const h = pts[style.highlight];
        ctx.beginPath();
        ctx.arc(h.x, h.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(77, 77, 255, 0.18)';
        ctx.fill();
        ctx.strokeStyle = style.pointFill;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      if (style.pointFill) {
        const r = style.pointRadius || 4.5;
        pts.forEach(function (p, i) {
          if (isHidden(i)) return;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = style.pointFill;
          ctx.fill();
          ctx.strokeStyle = style.pointStroke || style.pointFill;
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      }

      if (style.labels) {
        ctx.font = '15px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = style.labelColor;
        ctx.strokeStyle = COLORS.background;
        ctx.lineWidth = 3;
        pts.forEach(function (p, i) {
          if (isHidden(i)) return;
          haloText(Geo.Shapes.vertexName(i) + (style.suffix || ''), p.x + 7, p.y - 8);
        });
      }
      ctx.restore();
    }

    /**
     * Nombres de los lados en minúscula (a = AB, b = BC, …), en el punto medio de
     * cada lado y desplazados hacia afuera de la figura.
     */
    function drawSideLabels(pts, closed, color) {
      let cx = 0, cy = 0;
      pts.forEach(function (p) { cx += p.x; cy += p.y; });
      cx /= pts.length; cy /= pts.length;
      const sides = closed ? pts.length : pts.length - 1;

      ctx.font = '14px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = color;
      ctx.strokeStyle = COLORS.background;
      ctx.lineWidth = 3;
      for (let i = 0; i < sides; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        if (len < 24) continue;   // lado demasiado corto en pantalla: se omite el nombre
        // Normal del lado, orientada hacia afuera (lejos del centro de la figura).
        let nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
        if ((mx - cx) * nx + (my - cy) * ny < 0) { nx = -nx; ny = -ny; }
        haloText(Geo.Shapes.sideName(i), mx + nx * 12, my + ny * 12 + 5);
      }
      ctx.textAlign = 'left';
    }

    /**
     * Línea guía mientras se dibuja: del último vértice colocado hasta el cursor,
     * con un punto fantasma donde caería el siguiente vértice.
     */
    function drawPreview(preview, V) {
      const b = M.applyToPoint(V, preview.to);
      ctx.save();
      if (preview.from) {
        const a = M.applyToPoint(V, preview.from);
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = COLORS.preview;
        ctx.lineWidth = 2;
        line(a.x, a.y, b.x, b.y);
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(77, 77, 255, 0.35)';
      ctx.fill();
      ctx.restore();
    }

    /**
     * Etiqueta con las coordenadas del punto más cercano al puntero, p. ej. «A (2, 1)».
     * Solo aparece al acercar el puntero, para que el plano se vea limpio.
     */
    function drawCoordinateTag(frame, V) {
      const ptr = frame.pointer;
      let best = null, bestDist = ptr.radius;

      function consider(list, suffix, color, soft) {
        list.forEach(function (p, i) {
          if (p.hidden) return;   // los puntos ocultos no muestran coordenadas
          const s = M.applyToPoint(V, p);
          const d = Math.hypot(s.x - ptr.u, s.y - ptr.v);
          if (d <= bestDist) {
            bestDist = d;
            best = { screen: s, world: p, name: Geo.Shapes.vertexName(i) + suffix, color: color, soft: soft };
          }
        });
      }
      if (frame.showResult) consider(frame.result, '′', COLORS.result, '#e0f2f1');
      if (frame.view.showOriginal) consider(frame.original, '', COLORS.freeLabel, '#eef0ff');
      if (!best) return;

      const text = best.name + ' (' + axisNumber(best.world.x) + ', ' + axisNumber(best.world.y) + ')';
      ctx.save();
      ctx.font = '600 14px "Segoe UI", Arial, sans-serif';
      const w = ctx.measureText(text).width + 18;
      const h = 28;
      // Se coloca arriba a la derecha del punto, sin salirse del lienzo.
      let x = best.screen.x + 12, y = best.screen.y - h - 10;
      if (x + w > width - 4) x = best.screen.x - w - 12;
      if (y < 4) y = best.screen.y + 12;

      ctx.beginPath();
      roundRect(x, y, w, h, 7);
      ctx.fillStyle = best.soft;
      ctx.fill();
      ctx.strokeStyle = best.color;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = best.color;
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x + 9, y + h / 2 + 1);
      ctx.restore();
    }

    /** Rectángulo con esquinas redondeadas (compatible con navegadores sin ctx.roundRect). */
    function roundRect(x, y, w, h, r) {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    /** Marca un pivote con una cruz roja. */
    function drawPivot(point, V) {
      const p = M.applyToPoint(V, point);
      ctx.save();
      ctx.strokeStyle = COLORS.pivot;
      ctx.lineWidth = 2;
      line(p.x - 6, p.y - 6, p.x + 6, p.y + 6);
      line(p.x - 6, p.y + 6, p.x + 6, p.y - 6);
      ctx.restore();
    }

    /**
     * Dibuja la escena completa.
     * @param {object} frame {
     *   view, closed,
     *   original: [{x,y}], result: [{x,y}],
     *   steps: [[{x,y}]]   figuras intermedias (sin la última),
     *   compare: [{x,y}] | null   resultado con el orden inverso,
     *   pivots: [{x,y}],
     *   highlight: índice del vértice original bajo el cursor (−1 si ninguno),
     *   preview: { from, to } | null   línea guía al dibujar,
     *   showResult: false si no hay transformaciones activas (el resultado = la original)
     * }
     */
    function draw(frame) {
      const view = frame.view;
      const V = viewportMatrix(view);

      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, width, height);
      drawGrid(view, V);

      if (view.showSteps) {
        frame.steps.forEach(function (stepVertices) {
          drawShape(stepVertices, frame.closed, V, { stroke: COLORS.step, dash: [4, 4], width: 1.5 });
        });
      }
      if (frame.compare) {
        drawShape(frame.compare, frame.closed, V, {
          stroke: COLORS.compare, dash: [8, 5], width: 2,
          pointFill: COLORS.compare, pointRadius: 3,
          labels: true, suffix: '\u2033', labelColor: COLORS.compare
        });
      }
      // Resultado: puntos dependientes (oscuros), como en GeoGebra. Sin transformaciones
      // coincide con la original, así que no se dibuja (evita ver A′ encima de A).
      if (frame.showResult) drawShape(frame.result, frame.closed, V, {
        stroke: COLORS.result, fill: COLORS.resultFill, width: 2.5,
        pointFill: COLORS.dependentPoint, pointRadius: 3.5,
        labels: true, suffix: '\u2032', labelColor: COLORS.dependentLabel
      });
      // Original encima: sus puntos son libres (azules) y se pueden arrastrar.
      if (view.showOriginal) {
        drawShape(frame.original, frame.closed, V, {
          stroke: COLORS.original, fill: COLORS.originalFill, width: 2.5,
          pointFill: COLORS.freePoint, pointStroke: COLORS.freePointStroke, pointRadius: 5,
          labels: true, labelColor: COLORS.freeLabel, sideLabels: true,
          highlight: frame.highlight,
          hidden: frame.original.map(function (v) { return !!v.hidden; })
        });
      }
      if (frame.preview) drawPreview(frame.preview, V);
      if (frame.pointer) drawCoordinateTag(frame, V);
      frame.pivots.forEach(function (p) { drawPivot(p, V); });
    }

    return {
      resize: resize,
      draw: draw,
      viewportMatrix: viewportMatrix,
      toWorld: toWorld,
      gridStep: gridStep,
      size: function () { return { width: width, height: height }; }
    };
  }

  Geo.Renderer = { create: create, COLORS: COLORS };
})(window.Geo = window.Geo || {});
