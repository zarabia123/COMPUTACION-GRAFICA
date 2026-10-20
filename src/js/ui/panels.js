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

  /**
   * Parte de la vista algebraica que depende de los puntos libres, escrita como en GeoGebra:
   *   a = Segmento(A, B) = 3          pol1 = Polígono(A, B, C)   Área = 3
   *   A′ = (1, 2)                     Área′ = |det(M)| · Área
   * Se recalcula en cada cuadro; los campos editables de los puntos están en controls.js.
   */
  function renderAlgebra(el, shape, result, composition) {
    const vs = shape.vertices;
    if (!vs.length) { el.innerHTML = ''; return; }
    const names = vs.map(function (_, i) { return Geo.Shapes.vertexName(i); });
    const sides = Geo.Shapes.sides(vs, shape.closed);
    let html = '';

    if (sides.length) {
      html += '<h3 class="algebra-heading">Medidas</h3><ul class="algebra-list">';
      sides.forEach(function (s) {
        html += '<li class="algebra-row"><span class="algebra-dot dot-side" aria-hidden="true"></span>' +
          '<span><var>' + s.name + '</var> = Segmento(' + names[s.from] + ', ' + names[s.to] + ') = <strong>' +
          f(s.length) + '</strong></span></li>';
      });
      html += '</ul>';
    }

    const area = shape.closed && vs.length >= 3 ? Math.abs(Geo.Shapes.signedArea(vs)) : null;
    if (area !== null) {
      html += '<ul class="algebra-list"><li class="algebra-row"><span class="algebra-dot dot-poly" aria-hidden="true"></span>' +
        '<span><var>pol1</var> = Polígono(' + names.join(', ') + ') · Área = <strong>' + f(area) + '</strong></span></li></ul>';
    }

    html += '<h3 class="algebra-heading">Figura transformada <span class="algebra-note">(P′ = M · P)</span></h3><ul class="algebra-list">';
    result.forEach(function (q, i) {
      html += '<li class="algebra-row"><span class="algebra-dot dot-dependent" aria-hidden="true"></span>' +
        '<span>' + names[i] + '′ = (' + f(q.x) + ', ' + f(q.y) + ')</span></li>';
    });
    if (area !== null) {
      const det = Geo.Matrix.determinant(composition.matrix);
      const areaResult = Math.abs(Geo.Shapes.signedArea(result));
      html += '<li class="algebra-row"><span class="algebra-dot dot-result-poly" aria-hidden="true"></span>' +
        '<span><var>pol1′</var> · Área = <strong>' + f(areaResult) + '</strong> = |det(M)| · ' + f(area) +
        ' = ' + f(Math.abs(det)) + ' · ' + f(area) + '</span></li>';
    }
    html += '</ul>';
    el.innerHTML = html;
  }

  Geo.Panels = {
    renderAlgebra: renderAlgebra,
    TYPE_NAMES: TYPE_NAMES,
    esc: esc,
    matrixHTML: matrixHTML,
    renderMatrices: renderMatrices,
    renderCoordinates: renderCoordinates
  };
})(window.Geo = window.Geo || {});
