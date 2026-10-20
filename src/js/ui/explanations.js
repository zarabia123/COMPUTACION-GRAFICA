/**
 * explanations.js — Explicación educativa del cálculo de un vértice.
 *
 * Muestra el mismo resultado por dos caminos:
 *  1. Transformación por transformación, con su fórmula y los números sustituidos.
 *  2. De una sola vez con la matriz compuesta: P′ = M · P.
 * Que ambos coincidan es la idea central de la composición de matrices.
 */
(function (Geo) {
  'use strict';

  const f = Geo.Matrix.formatNumber;
  const esc = Geo.Panels.esc;

  /** Muestra un número entre paréntesis si es negativo: 3 · (−2). */
  function n(v) {
    const s = f(v);
    return s.charAt(0) === '-' ? '(' + s.replace('-', '−') + ')' : s;
  }

  function pt(p) {
    return '(' + f(p.x).replace('-', '−') + ', ' + f(p.y).replace('-', '−') + ')';
  }

  /** Fórmulas de un paso con los valores del punto p sustituidos. Devuelve líneas de texto. */
  function stepLines(t, p, q, centroid) {
    const P = t.params;
    const lines = [];
    if (t.type === 'T') {
      lines.push("x′ = x + tx = " + n(p.x) + ' + ' + n(P.tx) + ' = ' + f(q.x));
      lines.push("y′ = y + ty = " + n(p.y) + ' + ' + n(P.ty) + ' = ' + f(q.y));
      return lines;
    }

    const pivot = Geo.Transforms.resolvePivot(P.pivot, centroid);
    const hasPivot = pivot.x !== 0 || pivot.y !== 0;
    // Con pivote: se trabaja con el punto relativo al pivote (x − px, y − py).
    const rx = p.x - pivot.x;
    const ry = p.y - pivot.y;
    if (hasPivot) {
      lines.push('Pivote p = ' + pt(pivot) + ': se lleva al origen → (x − px, y − py) = ' + pt({ x: rx, y: ry }));
    }

    if (t.type === 'R') {
      const rad = Geo.Transforms.toRadians(P.angle);
      const c = Math.cos(rad), s = Math.sin(rad);
      lines.push('θ = ' + f(P.angle) + '°  →  cos θ = ' + f(c, 4) + ',  sin θ = ' + f(s, 4));
      const xr = rx * c - ry * s;
      const yr = rx * s + ry * c;
      lines.push("x′ = x·cos θ − y·sin θ = " + n(rx) + '·' + n(c) + ' − ' + n(ry) + '·' + n(s) + ' = ' + f(xr));
      lines.push("y′ = x·sin θ + y·cos θ = " + n(rx) + '·' + n(s) + ' + ' + n(ry) + '·' + n(c) + ' = ' + f(yr));
      if (hasPivot) lines.push('Se regresa al pivote: (' + f(xr) + ' + ' + n(pivot.x) + ', ' + f(yr) + ' + ' + n(pivot.y) + ') = ' + pt(q));
    } else {
      const xs = P.sx * rx;
      const ys = P.sy * ry;
      lines.push("x′ = sx · x = " + n(P.sx) + ' · ' + n(rx) + ' = ' + f(xs));
      lines.push("y′ = sy · y = " + n(P.sy) + ' · ' + n(ry) + ' = ' + f(ys));
      if (hasPivot) lines.push('Se regresa al pivote: (' + f(xs) + ' + ' + n(pivot.x) + ', ' + f(ys) + ' + ' + n(pivot.y) + ') = ' + pt(q));
    }
    return lines;
  }

  /**
   * @param {HTMLElement} el
   * @param {number} index        vértice elegido
   * @param {Array} original      vértices originales
   * @param {object} composition  resultado de Geo.Transforms.compose
   * @param {object} centroid
   */
  function render(el, index, original, composition, centroid) {
    const p0 = original[index];
    if (!p0) { el.innerHTML = '<p class="empty">Dibuja o elige una figura para ver el cálculo de sus puntos.</p>'; return; }
    const name = Geo.Shapes.vertexName(index);
    const M = composition.matrix;
    const final = Geo.Matrix.applyToPoint(M, p0);

    let html = '<p>Punto original en coordenadas homogéneas: <code>' + name + ' = [' +
      f(p0.x) + ', ' + f(p0.y) + ', 1]ᵀ</code></p>';

    // Camino 1: transformación por transformación.
    if (composition.steps.length) {
      html += '<h3>Camino 1 · Una transformación a la vez</h3><ol class="steps">';
      let current = p0;
      composition.steps.forEach(function (step, i) {
        const next = Geo.Matrix.applyToPoint(step.matrix, current);
        html += '<li><strong>M<sub>' + (i + 1) + '</sub> = ' + esc(Geo.Transforms.label(step.transform, centroid)) +
          '</strong>: ' + pt(current) + ' → ' + pt(next) +
          '<pre>' + esc(stepLines(step.transform, current, next, centroid).join('\n')) + '</pre></li>';
        current = next;
      });
      html += '</ol>';
    }

    // Camino 2: matriz compuesta. Como la fila 3 es [0 0 1], basta con las dos primeras.
    html += '<h3>Camino ' + (composition.steps.length ? '2' : '') + ' · Con la matriz compuesta</h3>' +
      '<pre>' + esc(
        "P′ = M · P\n" +
        "x′ = m11·x + m12·y + m13 = " + n(M[0][0]) + '·' + n(p0.x) + ' + ' + n(M[0][1]) + '·' + n(p0.y) + ' + ' + n(M[0][2]) + ' = ' + f(final.x) + '\n' +
        "y′ = m21·x + m22·y + m23 = " + n(M[1][0]) + '·' + n(p0.x) + ' + ' + n(M[1][1]) + '·' + n(p0.y) + ' + ' + n(M[1][2]) + ' = ' + f(final.y) + '\n' +
        "w′ = 0·x + 0·y + 1 = 1"
      ) + '</pre>' +
      '<p class="result-line">Resultado: <strong>' + name + '′ = ' + pt(final) + '</strong>' +
      (composition.steps.length > 1 ? ' — coincide con el camino 1.' : '') + '</p>';

    el.innerHTML = html;
  }

  Geo.Explain = { render: render };
})(window.Geo = window.Geo || {});
