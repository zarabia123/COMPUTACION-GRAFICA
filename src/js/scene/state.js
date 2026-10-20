/**
 * state.js — Estado de la escena, valores iniciales y escenas de ejemplo.
 * No usa el DOM. La interfaz modifica este estado y luego pide redibujar.
 */
(function (Geo) {
  'use strict';

  /** Máximo de transformaciones en la lista (regla de validación A8). */
  const MAX_TRANSFORMS = 10;

  /** Zoom inicial: píxeles por unidad del plano. */
  const DEFAULT_ZOOM = 40;

  let nextId = 1;

  /** Crea una transformación con valores neutros o con los parámetros dados. */
  function makeTransform(type, params) {
    const defaults = {
      T: { tx: 0, ty: 0 },
      R: { angle: 0, pivot: { mode: 'origen', x: 0, y: 0 } },
      S: { sx: 1, sy: 1, pivot: { mode: 'origen', x: 0, y: 0 } }
    };
    const merged = Object.assign({}, defaults[type], params || {});
    if (merged.pivot) merged.pivot = Object.assign({}, merged.pivot);
    return { id: 't' + (nextId++), type: type, enabled: true, params: merged };
  }

  /**
   * Escena inicial (docs/diseno.md, sección 4.4): plano vacío, sin figura ni
   * transformaciones. El usuario empieza dibujando o eligiendo una figura.
   * «Reiniciar todo» vuelve a esto.
   */
  function initial() {
    return {
      shape: Geo.Shapes.empty(),
      transforms: [],
      view: {
        zoom: DEFAULT_ZOOM,
        manualZoom: false,       // true cuando el usuario usa + o −
        center: { x: 0, y: 0 },
        showOriginal: true,
        showSteps: false,
        compare: false,
        snap: true               // ajustar a la cuadrícula al colocar o arrastrar puntos
      },
      selectedVertex: 0
    };
  }

  /** Escenas de ejemplo para la clase. Cada una devuelve figura y transformaciones. */
  const EXAMPLES = {
    rotacion: {
      title: 'Rotación de 90° respecto al origen',
      build: function () {
        return { shapeType: 'cuadrado', transforms: [makeTransform('R', { angle: 90 })], compare: false };
      }
    },
    pivote: {
      title: 'Rotación respecto al centroide',
      build: function () {
        return {
          shapeType: 'triangulo',
          transforms: [makeTransform('R', { angle: 90, pivot: { mode: 'centroide', x: 0, y: 0 } })],
          compare: false
        };
      }
    },
    orden: {
      title: 'El orden importa: T·R ≠ R·T',
      build: function () {
        return {
          shapeType: 'triangulo',
          transforms: [makeTransform('R', { angle: 90 }), makeTransform('T', { tx: 4, ty: 0 })],
          compare: true
        };
      }
    },
    compuesta: {
      title: 'Composición S → R → T',
      build: function () {
        return {
          shapeType: 'cuadrado',
          transforms: [
            makeTransform('S', { sx: 0.5, sy: 0.5 }),
            makeTransform('R', { angle: 45 }),
            makeTransform('T', { tx: 4, ty: 3 })
          ],
          compare: false
        };
      }
    },
    reflexion: {
      title: 'Reflexión respecto al eje Y',
      build: function () {
        return { shapeType: 'triangulo', transforms: [makeTransform('S', { sx: -1, sy: 1 })], compare: false };
      }
    }
  };

  Geo.State = {
    MAX_TRANSFORMS: MAX_TRANSFORMS,
    DEFAULT_ZOOM: DEFAULT_ZOOM,
    makeTransform: makeTransform,
    initial: initial,
    EXAMPLES: EXAMPLES
  };
})(window.Geo = window.Geo || {});
