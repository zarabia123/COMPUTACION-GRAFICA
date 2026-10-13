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

  /** Colores del lienzo (coinciden con la leyenda en estilos.css). */
  const COLORS = {
    background: '#ffffff',
    gridMinor: '#eef2f7',
    gridMajor: '#dbe3ee',
    axis: '#475569',
    tickText: '#64748b',
    original: '#d9730d',
    originalFill: 'rgba(217, 115, 13, 0.10)',
    result: '#1d4ed8',
    resultFill: 'rgba(29, 78, 216, 0.16)',
    step: '#94a3b8',
    compare: '#9333ea',
    pivot: '#dc2626',
    label: '#0f172a'
  };

  /** Separación mínima en píxeles entre líneas de la cuadrícula. */
  const MIN_GRID_PX = 32;

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
      width = Math.max(1, Math.round(cssWidth));
      height = Math.max(1, Math.round(cssHeight));
      const ratio = dpr || 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
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

    function drawGrid(view, V) {
      const step = gridStep(view.zoom);
      const topLeft = toWorld(0, 0, view);
      const bottomRight = toWorld(width, height, view);
      const origin = M.applyToPoint(V, { x: 0, y: 0 });

      ctx.lineWidth = 1;
      // Líneas verticales y horizontales: solo las visibles.
      for (let x = Math.ceil(topLeft.x / step) * step; x <= bottomRight.x; x += step) {
        const u = Math.round(V[0][0] * x + V[0][2]) + 0.5;
        ctx.strokeStyle = isMajor(x, step) ? COLORS.gridMajor : COLORS.gridMinor;
        line(u, 0, u, height);
      }
      for (let y = Math.ceil(bottomRight.y / step) * step; y <= topLeft.y; y += step) {
        const v = Math.round(V[1][1] * y + V[1][2]) + 0.5;
        ctx.strokeStyle = isMajor(y, step) ? COLORS.gridMajor : COLORS.gridMinor;
        line(0, v, width, v);
      }

      // Ejes X e Y.
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.5;
      line(0, origin.y, width, origin.y);
      line(origin.x, 0, origin.x, height);
      arrowHead(width - 2, origin.y, 0);
      arrowHead(origin.x, 2, -Math.PI / 2);

      ctx.fillStyle = COLORS.axis;
      ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
      ctx.fillText('x', width - 14, origin.y - 8);
      ctx.fillText('y', origin.x + 8, 14);

      // Números de los ejes; si el eje sale de la vista, se fijan al borde.
      ctx.font = '11px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = COLORS.tickText;
      const labelY = clamp(origin.y + 14, 12, height - 4);
      const labelX = clamp(origin.x + 4, 2, width - 30);
      for (let x = Math.ceil(topLeft.x / step) * step; x <= bottomRight.x; x += step) {
        if (Math.abs(x) < step / 2) continue;
        const u = V[0][0] * x + V[0][2];
        ctx.fillText(M.formatNumber(x, 2), u + 3, labelY);
      }
      for (let y = Math.ceil(bottomRight.y / step) * step; y <= topLeft.y; y += step) {
        if (Math.abs(y) < step / 2) continue;
        const v = V[1][1] * y + V[1][2];
        ctx.fillText(M.formatNumber(y, 2), labelX, v - 3);
      }
      ctx.fillText('0', clamp(origin.x + 4, 2, width - 10), clamp(origin.y + 14, 12, height - 4));
    }

    /** Las líneas múltiplos de 5 pasos se dibujan más marcadas. */
    function isMajor(value, step) {
      const n = Math.round(value / step);
      return n % 5 === 0;
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
      ctx.lineTo(-9, -4);
      ctx.lineTo(-9, 4);
      ctx.closePath();
      ctx.fillStyle = COLORS.axis;
      ctx.fill();
      ctx.restore();
    }

    /**
     * Dibuja una figura.
     * @param {Array<{x,y}>} vertices  en coordenadas del plano
     * @param {object} style  { stroke, fill, width, dash, labels, suffix, markers }
     */
    function drawShape(vertices, closed, V, style) {
      if (!vertices.length) return;
      const pts = vertices.map(function (p) { return M.applyToPoint(V, p); });

      ctx.save();
      ctx.lineJoin = 'round';
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

      if (style.markers !== false) {
        pts.forEach(function (p) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, pts.length === 1 ? 5 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = style.stroke;
          ctx.fill();
        });
      }

      if (style.labels) {
        ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = style.labelColor || COLORS.label;
        pts.forEach(function (p, i) {
          ctx.fillText(Geo.Shapes.vertexName(i) + (style.suffix || ''), p.x + 7, p.y - 7);
        });
      }
      ctx.restore();
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
     *   pivots: [{x,y}]
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
      if (view.showOriginal) {
        drawShape(frame.original, frame.closed, V, {
          stroke: COLORS.original, fill: COLORS.originalFill, labels: true, labelColor: COLORS.original
        });
      }
      if (frame.compare) {
        drawShape(frame.compare, frame.closed, V, {
          stroke: COLORS.compare, dash: [8, 5], width: 2, labels: true, suffix: '″', labelColor: COLORS.compare
        });
      }
      drawShape(frame.result, frame.closed, V, {
        stroke: COLORS.result, fill: COLORS.resultFill, width: 2.5, labels: true, suffix: '′', labelColor: COLORS.result
      });
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
