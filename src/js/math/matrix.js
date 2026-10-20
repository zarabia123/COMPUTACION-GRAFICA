/**
 * matrix.js — Operaciones con matrices homogéneas de 3×3.
 *
 * Una matriz se representa como un arreglo de 3 filas con 3 números cada una,
 * igual que en la notación del pizarrón:  M[fila][columna].
 * Un punto 2D (x, y) se trata como el vector columna homogéneo [x, y, 1]ᵀ.
 *
 * Este módulo no usa el DOM: puede probarse sin interfaz.
 */
(function (Geo) {
  'use strict';

  /** Valores con magnitud menor que esto se muestran como 0 (evita «-0.000»). */
  const EPSILON_DISPLAY = 1e-10;

  /** Devuelve la matriz identidad I de 3×3. */
  function identity() {
    return [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];
  }

  /**
   * Producto de matrices C = A · B (algoritmo A1).
   * C[i][j] = Σ_k A[i][k] · B[k][j]
   */
  function multiply(A, B) {
    const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let sum = 0;
        for (let k = 0; k < 3; k++) {
          sum += A[i][k] * B[k][j];
        }
        C[i][j] = sum;
      }
    }
    return C;
  }

  /**
   * Aplica M a un punto: P' = M · [x, y, 1]ᵀ (algoritmo A4).
   * La última fila de nuestras matrices es siempre [0 0 1], así que w' = 1.
   */
  function applyToPoint(M, point) {
    return {
      x: M[0][0] * point.x + M[0][1] * point.y + M[0][2],
      y: M[1][0] * point.x + M[1][1] * point.y + M[1][2]
    };
  }

  /** Aplica M a todos los vértices de una lista. */
  function applyToPoints(M, points) {
    return points.map(function (p) { return applyToPoint(M, p); });
  }

  /** Determinante de una matriz 3×3 (regla de Sarrus / cofactores de la primera fila). */
  function determinant(M) {
    return M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1])
         - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0])
         + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  }

  /**
   * Formatea un número para mostrarlo: limpia residuos de punto flotante
   * (p. ej. cos 90° = 6.1e-17) y usa un número fijo de decimales.
   */
  function formatNumber(value, decimals) {
    const d = decimals === undefined ? 3 : decimals;
    const clean = Math.abs(value) < EPSILON_DISPLAY ? 0 : value;
    // Se redondea y se quitan ceros sobrantes: 2.000 → "2", 0.707 → "0.707".
    const text = clean.toFixed(d);
    const trimmed = text.indexOf('.') >= 0 ? text.replace(/\.?0+$/, '') : text;
    return trimmed === '-0' ? '0' : trimmed;
  }

  Geo.Matrix = {
    identity: identity,
    multiply: multiply,
    applyToPoint: applyToPoint,
    applyToPoints: applyToPoints,
    determinant: determinant,
    formatNumber: formatNumber
  };
})(window.Geo = window.Geo || {});
