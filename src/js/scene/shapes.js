/**
 * shapes.js — Figuras predefinidas y cálculos geométricos sobre sus vértices.
 * No usa el DOM.
 */
(function (Geo) {
  'use strict';

  /** Límites de vértices por tipo de figura (min = max significa cantidad fija). */
  const LIMITS = {
    punto:      { min: 1, max: 1 },
    segmento:   { min: 2, max: 2 },
    triangulo:  { min: 3, max: 3 },
    cuadrado:   { min: 4, max: 4 },
    rectangulo: { min: 4, max: 4 },
    poligono:   { min: 3, max: 12 }
  };

  const NAMES = {
    punto: 'Punto',
    segmento: 'Segmento',
    triangulo: 'Triángulo',
    cuadrado: 'Cuadrado',
    rectangulo: 'Rectángulo',
    poligono: 'Polígono'
  };

  /** Algoritmo A9: n vértices de un polígono regular centrado en el origen. */
  function regularPolygon(n, radius) {
    const vertices = [];
    for (let i = 0; i < n; i++) {
      // Se empieza en 90° para que el primer vértice quede arriba.
      const angle = Math.PI / 2 + i * 2 * Math.PI / n;
      vertices.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
    }
    return vertices;
  }

  /** Redondea a 3 decimales para que los vértices editables sean legibles. */
  function round3(v) {
    return Math.round(v * 1000) / 1000;
  }

  /** Vértices por defecto de cada figura (docs/diseno.md, sección 4.5). */
  function preset(type) {
    switch (type) {
      case 'punto':      return [{ x: 2, y: 1 }];
      case 'segmento':   return [{ x: -2, y: -1 }, { x: 3, y: 2 }];
      case 'cuadrado':   return [{ x: -2, y: -2 }, { x: 2, y: -2 }, { x: 2, y: 2 }, { x: -2, y: 2 }];
      case 'rectangulo': return [{ x: -3, y: -1 }, { x: 3, y: -1 }, { x: 3, y: 2 }, { x: -3, y: 2 }];
      case 'poligono':
        return regularPolygon(5, 3).map(function (p) { return { x: round3(p.x), y: round3(p.y) }; });
      case 'triangulo':
      default:           return [{ x: 1, y: 1 }, { x: 4, y: 1 }, { x: 1, y: 3 }];
    }
  }

  /** Crea una figura completa a partir de su tipo. */
  function create(type) {
    return {
      type: type,
      vertices: preset(type),
      closed: isClosedType(type)
    };
  }

  /** Figura vacía: el plano sin puntos (estado inicial). El tipo vacío ('') no es un tipo del selector. */
  function empty() {
    return { type: '', vertices: [], closed: false };
  }

  /**
   * Tipo de figura según cuántos vértices tiene (al dibujar, duplicar o borrar puntos):
   * 0 → vacía, 1 → punto, 2 → segmento, 3 → triángulo, 4 o más → polígono.
   */
  function typeForCount(n) {
    if (n <= 0) return '';
    if (n === 1) return 'punto';
    if (n === 2) return 'segmento';
    if (n === 3) return 'triangulo';
    return 'poligono';
  }

  /** Punto y segmento no forman un contorno cerrado. */
  function isClosedType(type) {
    return type !== 'punto' && type !== 'segmento';
  }

  /** Centroide de los vértices: (Σx / n, Σy / n). */
  function centroid(vertices) {
    if (!vertices.length) return { x: 0, y: 0 };
    let sx = 0, sy = 0;
    vertices.forEach(function (v) { sx += v.x; sy += v.y; });
    return { x: sx / vertices.length, y: sy / vertices.length };
  }

  /** Área con signo por la fórmula del zapato (shoelace). Positiva si es antihoraria. */
  function signedArea(vertices) {
    let sum = 0;
    for (let i = 0; i < vertices.length; i++) {
      const a = vertices[i];
      const b = vertices[(i + 1) % vertices.length];
      sum += a.x * b.y - b.x * a.y;
    }
    return sum / 2;
  }

  /** Letra para el vértice i: A, B, C, … */
  function vertexName(i) {
    return String.fromCharCode(65 + i);
  }

  /** Nombre del lado i (del vértice i al siguiente): a, b, c, … */
  function sideName(i) {
    return String.fromCharCode(97 + i);
  }

  /**
   * Lados de la figura: para cada uno, sus extremos y su longitud
   * d = √((x₂ − x₁)² + (y₂ − y₁)²). Un segmento tiene 1 lado y un punto ninguno.
   */
  function sides(vertices, closed) {
    const n = vertices.length;
    const count = closed ? n : Math.max(0, n - 1);
    const list = [];
    for (let i = 0; i < count; i++) {
      const a = vertices[i], b = vertices[(i + 1) % n];
      list.push({ name: sideName(i), from: i, to: (i + 1) % n, length: Math.hypot(b.x - a.x, b.y - a.y) });
    }
    return list;
  }

  Geo.Shapes = {
    LIMITS: LIMITS,
    NAMES: NAMES,
    regularPolygon: regularPolygon,
    preset: preset,
    create: create,
    empty: empty,
    typeForCount: typeForCount,
    isClosedType: isClosedType,
    centroid: centroid,
    signedArea: signedArea,
    vertexName: vertexName,
    sideName: sideName,
    sides: sides
  };
})(window.Geo = window.Geo || {});
