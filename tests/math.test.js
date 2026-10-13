/**
 * math.test.js — Pruebas del núcleo matemático, la escena y la validación.
 * Los valores esperados están en docs/diseno.md, sección 6 (calculados a mano).
 * Se ejecutan abriendo tests/test-runner.html en el navegador.
 */
(function (Geo) {
  'use strict';

  const TOL = 1e-9;
  const results = [];

  const T = Geo.Transforms;
  const Mx = Geo.Matrix;
  const ORIGIN = { x: 0, y: 0 };

  function near(a, b) { return Math.abs(a - b) <= TOL; }

  function pointEq(p, x, y) {
    if (!near(p.x, x) || !near(p.y, y)) {
      throw new Error('se esperaba (' + x + ', ' + y + ') y se obtuvo (' + p.x + ', ' + p.y + ')');
    }
  }

  function matrixEq(A, B) {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (!near(A[i][j], B[i][j])) {
          throw new Error('diferencia en [' + i + '][' + j + ']: ' + A[i][j] + ' ≠ ' + B[i][j]);
        }
      }
    }
  }

  function eq(actual, expected, what) {
    if (actual !== expected) throw new Error((what || 'valor') + ': se esperaba ' + expected + ' y se obtuvo ' + actual);
  }

  function test(id, name, fn) {
    try {
      fn();
      results.push({ id: id, name: name, ok: true });
    } catch (e) {
      results.push({ id: id, name: name, ok: false, error: e.message });
    }
  }

  /** Atajo: compone una lista de transformaciones creadas con makeTransform. */
  function compose(list, centroid) {
    return T.compose(list, centroid || ORIGIN).matrix;
  }
  const mk = Geo.State.makeTransform;

  // ------------------------------------------------------- 6.1 Núcleo matemático

  test('CP01', 'Identidad', function () {
    pointEq(Mx.applyToPoint(Mx.identity(), { x: 3, y: -2 }), 3, -2);
  });
  test('CP02', 'Traslación T(2, 1)', function () {
    pointEq(Mx.applyToPoint(T.translation(2, 1), { x: 1, y: 1 }), 3, 2);
  });
  test('CP03', 'Traslación negativa T(−3, 4)', function () {
    pointEq(Mx.applyToPoint(T.translation(-3, 4), { x: 0, y: 0 }), -3, 4);
  });
  test('CP04', 'Rotación 90°', function () {
    pointEq(Mx.applyToPoint(T.rotation(90), { x: 1, y: 0 }), 0, 1);
    pointEq(Mx.applyToPoint(T.rotation(90), { x: 2, y: 3 }), -3, 2);
  });
  test('CP05', 'Rotación 180°', function () {
    pointEq(Mx.applyToPoint(T.rotation(180), { x: 2, y: 3 }), -2, -3);
  });
  test('CP06', 'Rotación 45°', function () {
    pointEq(Mx.applyToPoint(T.rotation(45), { x: 1, y: 0 }), Math.SQRT1_2, Math.SQRT1_2);
  });
  test('CP07', 'Rotación horaria −90°', function () {
    pointEq(Mx.applyToPoint(T.rotation(-90), { x: 1, y: 0 }), 0, -1);
  });
  test('CP08', 'Vuelta completa 360°', function () {
    pointEq(Mx.applyToPoint(T.rotation(360), { x: 2, y: 3 }), 2, 3);
  });
  test('CP09', 'Escalado S(2, 3)', function () {
    pointEq(Mx.applyToPoint(T.scaling(2, 3), { x: 1, y: 1 }), 2, 3);
  });
  test('CP10', 'Reducción S(0.5, 0.5)', function () {
    pointEq(Mx.applyToPoint(T.scaling(0.5, 0.5), { x: 4, y: -2 }), 2, -1);
  });
  test('CP11', 'Reflexión S(−1, 1) y det = −1', function () {
    pointEq(Mx.applyToPoint(T.scaling(-1, 1), { x: 2, y: 3 }), -2, 3);
    if (!near(Mx.determinant(T.scaling(-1, 1)), -1)) throw new Error('det ≠ −1');
  });
  test('CP12', 'Rotación 90° respecto a (2, 1)', function () {
    const t = mk('R', { angle: 90, pivot: { mode: 'personalizado', x: 2, y: 1 } });
    pointEq(Mx.applyToPoint(T.matrixFor(t, ORIGIN), { x: 3, y: 1 }), 2, 2);
  });
  test('CP13', 'Escalado S(2, 2) respecto a (1, 1)', function () {
    const t = mk('S', { sx: 2, sy: 2, pivot: { mode: 'personalizado', x: 1, y: 1 } });
    pointEq(Mx.applyToPoint(T.matrixFor(t, ORIGIN), { x: 2, y: 2 }), 3, 3);
  });
  test('CP14', 'Composición S(2,2) → R(90°) → T(2,1)', function () {
    const M = compose([mk('S', { sx: 2, sy: 2 }), mk('R', { angle: 90 }), mk('T', { tx: 2, ty: 1 })]);
    matrixEq(M, [[0, -2, 2], [2, 0, 1], [0, 0, 1]]);
    pointEq(Mx.applyToPoint(M, { x: 1, y: 0 }), 2, 3);
  });
  test('CP15', 'El orden importa: escalado y traslación', function () {
    const a = compose([mk('S', { sx: 2, sy: 2 }), mk('T', { tx: 2, ty: 1 })]);
    const b = compose([mk('T', { tx: 2, ty: 1 }), mk('S', { sx: 2, sy: 2 })]);
    pointEq(Mx.applyToPoint(a, { x: 1, y: 1 }), 4, 3);
    pointEq(Mx.applyToPoint(b, { x: 1, y: 1 }), 6, 4);
  });
  test('CP16', 'No conmutatividad: rotación y traslación', function () {
    const list = [mk('R', { angle: 90 }), mk('T', { tx: 2, ty: 0 })];
    pointEq(Mx.applyToPoint(compose(list), { x: 1, y: 0 }), 2, 1);
    pointEq(Mx.applyToPoint(T.composeReversed(list, ORIGIN).matrix, { x: 1, y: 0 }), 0, 3);
  });
  test('CP17', 'Determinante de S(2,3) → R(37°) → T(4,−1) = 6', function () {
    const M = compose([mk('S', { sx: 2, sy: 3 }), mk('R', { angle: 37 }), mk('T', { tx: 4, ty: -1 })]);
    if (!near(Mx.determinant(M), 6)) throw new Error('det = ' + Mx.determinant(M));
  });
  test('CP18', 'Escena inicial: R(90°) → T(2,1)', function () {
    const s = Geo.State.initial();
    const M = compose(s.transforms, Geo.Shapes.centroid(s.shape.vertices));
    const r = Mx.applyToPoints(M, s.shape.vertices);
    pointEq(r[0], 1, 2);
    pointEq(r[1], 1, 5);
    pointEq(r[2], -1, 2);
  });
  test('CP19', 'Viewport: (2, 1) → (480, 260) y su inversa', function () {
    const canvas = document.createElement('canvas');
    const r = Geo.Renderer.create(canvas);
    r.resize(800, 600, 1);
    const view = { zoom: 40, center: { x: 0, y: 0 } };
    pointEq(Mx.applyToPoint(r.viewportMatrix(view), { x: 2, y: 1 }), 480, 260);
    pointEq(r.toWorld(480, 260, view), 2, 1);
  });
  test('CP20', 'Lista vacía → M = I', function () {
    matrixEq(compose([]), Mx.identity());
  });
  test('CP21', 'Transformación desactivada se ignora', function () {
    const t = mk('T', { tx: 5, ty: 5 });
    t.enabled = false;
    matrixEq(compose([t]), Mx.identity());
  });
  test('CP22', 'El último paso intermedio coincide con M·P', function () {
    const c = T.compose([mk('S', { sx: 2, sy: 2 }), mk('R', { angle: 90 }), mk('T', { tx: 2, ty: 1 })], ORIGIN);
    let p = { x: 1, y: 0 };
    c.steps.forEach(function (s) { p = Mx.applyToPoint(s.matrix, p); });
    const direct = Mx.applyToPoint(c.matrix, { x: 1, y: 0 });
    pointEq(p, direct.x, direct.y);
    matrixEq(c.steps[c.steps.length - 1].cumulative, c.matrix);
  });

  // Pruebas adicionales de apoyo
  test('CP23', 'Pivote en el centroide: el centroide no se mueve al rotar', function () {
    const vs = Geo.Shapes.preset('triangulo');
    const c = Geo.Shapes.centroid(vs);
    const t = mk('R', { angle: 73, pivot: { mode: 'centroide', x: 0, y: 0 } });
    pointEq(Mx.applyToPoint(T.matrixFor(t, c), c), c.x, c.y);
  });
  test('CP24', 'Formato numérico sin «-0» ni residuos', function () {
    eq(Mx.formatNumber(Math.cos(Math.PI / 2)), '0');
    eq(Mx.formatNumber(-0.0000001), '0');
    eq(Mx.formatNumber(2), '2');
    eq(Mx.formatNumber(0.70710678), '0.707');
  });

  // ------------------------------------------------------- 6.2 Validación

  const val = Geo.Validation.validate;
  test('CV01', 'Campo vacío es inválido', function () { eq(val('', 'escala').ok, false); });
  test('CV02', 'Texto «abc» es inválido', function () { eq(val('abc', 'escala').ok, false); });
  test('CV03', 'Escala 0 es inválida y menciona det(M)', function () {
    const r = val('0', 'escala');
    eq(r.ok, false);
    if (r.error.indexOf('det(M)') < 0) throw new Error('el mensaje no menciona det(M)');
  });
  test('CV04', 'Coma decimal «1,5» → 1.5', function () {
    const r = val('1,5', 'escala');
    eq(r.ok, true); eq(r.value, 1.5);
  });
  test('CV05', 'Ángulo 720 fuera de rango', function () { eq(val('720', 'angulo').ok, false); });
  test('CV06', 'Traslación 1000000 fuera de rango', function () { eq(val('1000000', 'traslacion').ok, false); });
  test('CV07', 'Polígono: límites de 3 a 12 vértices', function () {
    eq(Geo.Shapes.LIMITS.poligono.min, 3); eq(Geo.Shapes.LIMITS.poligono.max, 12);
  });
  test('CV08', 'Triángulo colineal tiene área 0', function () {
    if (!near(Geo.Shapes.signedArea([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }]), 0)) throw new Error('área ≠ 0');
  });
  test('CV09', 'Máximo de 10 transformaciones', function () { eq(Geo.State.MAX_TRANSFORMS, 10); });
  test('CV10', '«Infinity» y «1e400» son inválidos', function () {
    eq(val('Infinity', 'traslacion').ok, false);
    eq(val('1e400', 'traslacion').ok, false);
  });
  test('CV11', 'Signo menos tipográfico «−2» → −2', function () {
    const r = val('−2', 'traslacion');
    eq(r.ok, true); eq(r.value, -2);
  });
  test('CV12', 'Escala negativa permitida (reflexión)', function () {
    const r = val('-1', 'escala');
    eq(r.ok, true); eq(r.value, -1);
  });

  Geo.TestResults = results;
})(window.Geo = window.Geo || {});
