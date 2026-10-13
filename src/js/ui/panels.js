/**
 * panels.js — Paneles de matrices y tabla de coordenadas.
 * Solo muestra datos ya calculados por el núcleo matemático.
 */
(function (Geo) {
  'use strict';

  const f = Geo.Matrix.formatNumber;

  const TYPE_NAMES = { T: 'Traslación', R: 'Rotación', S: 'Escalado' };

  /** Escapa texto antes de insertarlo como HTML. */
  function esc(text) {
    return String(text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /** HTML de una matriz 3×3 con corchetes. */
  function matrixHTML(M, extraClass) {
    let cells = '';
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        // Se resalta la columna de traslación (tx, ty) para fines didácticos.
        const cls = j === 2 && i < 2 ? ' class="m-translate"' : (i === 2 ? ' class="m-fixed"' : '');
        cells += '<span' + cls + '>' + f(M[i][j]) + '</span>';
      }
    }
    return '<div class="matrix ' + (extraClass || '') + '" role="img" aria-label="Matriz ' +
      esc(M.map(function (r) { return r.map(function (v) { return f(v); }).join(', '); }).join('; ')) +
      '">' + cells + '</div>';
  }

  /**
   * Muestra cada matriz Mi y la matriz compuesta M.
   * @param {object} composition  resultado de Geo.Transforms.compose
   * @param {object} centroid     centroide de la figura original
   */
  function renderMatrices(listEl, compositeEl, composition, centroid) {
    const steps = composition.steps;

    if (!steps.length) {
      listEl.innerHTML = '<p class="empty">No hay transformaciones activas. Agrega una con los botones de la sección 2.</p>';
    } else {
      listEl.innerHTML = steps.map(function (step, i) {
        const t = step.transform;
        return '<article class="matrix-card type-' + t.type + '">' +
          '<h3>M<sub>' + (i + 1) + '</sub> · ' + TYPE_NAMES[t.type] + '</h3>' +
          '<p class="matrix-label">' + esc(Geo.Transforms.label(t, centroid)) + '</p>' +
          matrixHTML(step.matrix) +
          '</article>';
      }).join('');
    }

    // Expresión del producto: M = Mn · … · M1 (la primera aplicada queda a la derecha).
    const names = steps.map(function (_, i) { return 'M<sub>' + (i + 1) + '</sub>'; }).reverse();
    const product = names.length ? names.join(' · ') : 'I';
    const det = Geo.Matrix.determinant(composition.matrix);

    let detNote;
    if (Math.abs(det) < 1e-12) {
      detNote = 'La figura se reduce a una línea o un punto.';
    } else if (det < 0) {
      detNote = 'Negativo: hay una reflexión (la orientación se invierte). El área se multiplica por |det| = ' + f(Math.abs(det)) + '.';
    } else {
      detNote = 'El área de la figura se multiplica por ' + f(det) + '.';
    }

    compositeEl.innerHTML =
      '<h3>Matriz compuesta</h3>' +
      '<p class="product">M = ' + product + '</p>' +
      matrixHTML(composition.matrix, 'matrix-total') +
      '<p class="det"><strong>det(M) = ' + f(det) + '</strong> · ' + esc(detNote) + '</p>' +
      (steps.length > 1
        ? '<p class="hint">La transformación aplicada primero (M<sub>1</sub>) queda a la <strong>derecha</strong> del producto, ' +
          'porque es la primera que multiplica al punto: P′ = ' + product + ' · P.</p>'
        : '');
  }

  /** Tabla de coordenadas originales y transformadas. */
  function renderCoordinates(bodyEl, original, result) {
    bodyEl.innerHTML = original.map(function (p, i) {
      const q = result[i];
      const name = Geo.Shapes.vertexName(i);
      return '<tr>' +
        '<th scope="row">' + name + ' → ' + name + '′</th>' +
        '<td>(' + f(p.x) + ', ' + f(p.y) + ', 1)</td>' +
        '<td>(' + f(q.x) + ', ' + f(q.y) + ', 1)</td>' +
        '</tr>';
    }).join('');
  }

  Geo.Panels = {
    TYPE_NAMES: TYPE_NAMES,
    esc: esc,
    matrixHTML: matrixHTML,
    renderMatrices: renderMatrices,
    renderCoordinates: renderCoordinates
  };
})(window.Geo = window.Geo || {});
