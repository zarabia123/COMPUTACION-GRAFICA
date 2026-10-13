/**
 * transforms.js — Matrices de transformación 2D y su composición.
 *
 * Convenciones (ver docs/diseno.md, sección 2):
 *  - Puntos como vectores columna: P' = M · P.
 *  - Ángulo en grados; positivo = giro antihorario.
 *  - Si se aplica M1, luego M2, …, luego Mn:  M = Mn · … · M2 · M1.
 *
 * Una transformación de la escena es un objeto:
 *   { id, type: 'T' | 'R' | 'S', enabled, params }
 *   T → params { tx, ty }
 *   R → params { angle, pivot: { mode, x, y } }
 *   S → params { sx, sy, pivot: { mode, x, y } }
 *   pivot.mode: 'origen' | 'centroide' | 'personalizado'
 */
(function (Geo) {
  'use strict';

  const M = Geo.Matrix;

  /** Convierte grados a radianes: θ_rad = θ · π / 180. */
  function toRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  /** Ecuación (2): matriz de traslación T(tx, ty). */
  function translation(tx, ty) {
    return [
      [1, 0, tx],
      [0, 1, ty],
      [0, 0, 1]
    ];
  }

  /** Ecuación (3): matriz de rotación R(θ) respecto al origen. */
  function rotation(degrees) {
    const t = toRadians(degrees);
    const c = Math.cos(t);
    const s = Math.sin(t);
    return [
      [c, -s, 0],
      [s,  c, 0],
      [0,  0, 1]
    ];
  }

  /** Ecuación (4): matriz de escalado S(sx, sy) respecto al origen. */
  function scaling(sx, sy) {
    return [
      [sx, 0, 0],
      [0, sy, 0],
      [0,  0, 1]
    ];
  }

  /**
   * Ecuaciones (5) y (6): transforma respecto a un pivote p.
   *   T(px, py) · base · T(-px, -py)
   * Se lleva el pivote al origen, se aplica la transformación y se regresa.
   */
  function aroundPivot(base, px, py) {
    return M.multiply(translation(px, py), M.multiply(base, translation(-px, -py)));
  }

  /**
   * Devuelve las coordenadas del pivote de una transformación.
   * @param {object} pivot     { mode, x, y }
   * @param {object} centroid  centroide de la figura original { x, y }
   */
  function resolvePivot(pivot, centroid) {
    if (!pivot || pivot.mode === 'origen') return { x: 0, y: 0 };
    if (pivot.mode === 'centroide') return { x: centroid.x, y: centroid.y };
    return { x: pivot.x, y: pivot.y };
  }

  /** Construye la matriz 3×3 de una transformación de la escena (algoritmo A2). */
  function matrixFor(transform, centroid) {
    const p = transform.params;
    if (transform.type === 'T') {
      return translation(p.tx, p.ty);
    }
    const pivot = resolvePivot(p.pivot, centroid || { x: 0, y: 0 });
    const base = transform.type === 'R' ? rotation(p.angle) : scaling(p.sx, p.sy);
    if (pivot.x === 0 && pivot.y === 0) return base;
    return aroundPivot(base, pivot.x, pivot.y);
  }

  /**
   * Composición (algoritmo A3): recorre las transformaciones activas en orden
   * de aplicación y multiplica cada una por la IZQUIERDA del acumulado.
   *
   * Devuelve:
   *   matrix — matriz compuesta M
   *   steps  — por cada transformación activa: su matriz y el acumulado hasta ella
   */
  function compose(transforms, centroid) {
    let total = M.identity();
    const steps = [];
    transforms.forEach(function (t) {
      if (!t.enabled) return;
      const matrix = matrixFor(t, centroid);
      total = M.multiply(matrix, total);
      steps.push({ transform: t, matrix: matrix, cumulative: total });
    });
    return { matrix: total, steps: steps };
  }

  /** Igual que compose, pero aplicando las transformaciones en orden inverso. */
  function composeReversed(transforms, centroid) {
    return compose(transforms.slice().reverse(), centroid);
  }

  /** Nombre corto de una transformación, p. ej. «R(90°) respecto a (2, 1)». */
  function label(transform, centroid) {
    const p = transform.params;
    const f = M.formatNumber;
    if (transform.type === 'T') return 'T(' + f(p.tx) + ', ' + f(p.ty) + ')';
    const base = transform.type === 'R'
      ? 'R(' + f(p.angle) + '°)'
      : 'S(' + f(p.sx) + ', ' + f(p.sy) + ')';
    const pivot = resolvePivot(p.pivot, centroid || { x: 0, y: 0 });
    if (pivot.x === 0 && pivot.y === 0) return base;
    return base + ' respecto a (' + f(pivot.x) + ', ' + f(pivot.y) + ')';
  }

  Geo.Transforms = {
    toRadians: toRadians,
    translation: translation,
    rotation: rotation,
    scaling: scaling,
    aroundPivot: aroundPivot,
    resolvePivot: resolvePivot,
    matrixFor: matrixFor,
    compose: compose,
    composeReversed: composeReversed,
    label: label
  };
})(window.Geo = window.Geo || {});
