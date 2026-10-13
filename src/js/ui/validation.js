/**
 * validation.js — Analizador de números y reglas por campo (algoritmo A8).
 * No usa el DOM: recibe texto y devuelve { ok, value } o { ok: false, error }.
 */
(function (Geo) {
  'use strict';

  /** Reglas por tipo de campo (docs/diseno.md, sección 3.7). */
  const RULES = {
    traslacion: { min: -50, max: 50, message: 'La traslación debe estar entre −50 y 50.' },
    angulo:     { min: -360, max: 360, message: 'El ángulo debe estar entre −360° y 360°.' },
    escala:     { min: -10, max: 10, message: 'La escala debe estar entre −10 y 10.', nonZero: 0.01 },
    coordenada: { min: -50, max: 50, message: 'Las coordenadas deben estar entre −50 y 50.' }
  };

  /**
   * Convierte el texto escrito por el usuario en número.
   * Acepta coma decimal («1,5») y signo menos tipográfico («−2»).
   * Rechaza vacío, texto, Infinity y notación ambigua.
   */
  function parseNumber(text) {
    if (text === null || text === undefined) return NaN;
    const normalized = String(text).trim().replace(',', '.').replace('−', '-');
    // Solo dígitos con signo y punto decimal opcionales: evita «1e400», «Infinity», «0x10».
    if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(normalized)) return NaN;
    const value = Number(normalized);
    return Number.isFinite(value) ? value : NaN;
  }

  /**
   * Valida un texto según una regla.
   * @param {string} text
   * @param {string} ruleName  clave de RULES
   */
  function validate(text, ruleName) {
    const rule = RULES[ruleName];
    const value = parseNumber(text);
    if (Number.isNaN(value)) {
      return { ok: false, error: 'Ingrese un número válido (por ejemplo 2 o 1,5).' };
    }
    if (value < rule.min || value > rule.max) {
      return { ok: false, error: rule.message };
    }
    if (rule.nonZero && Math.abs(value) < rule.nonZero) {
      return {
        ok: false,
        error: 'La escala no puede ser 0 (mínimo ±' + rule.nonZero + '): la figura colapsaría y det(M) = 0.'
      };
    }
    return { ok: true, value: value };
  }

  Geo.Validation = {
    RULES: RULES,
    parseNumber: parseNumber,
    validate: validate
  };
})(window.Geo = window.Geo || {});
