/**
 * controls.js — Controles de la interfaz: editor de vértices y lista de transformaciones.
 *
 * Regla general: un valor solo pasa al estado si es válido. Si no lo es, el campo
 * se marca en rojo, se muestra el motivo y la escena conserva el último valor válido.
 */
(function (Geo) {
  'use strict';

  const V = Geo.Validation;
  const f = Geo.Matrix.formatNumber;

  /** Configuración de deslizadores (el campo de texto admite el rango completo de RULES). */
  const SLIDERS = {
    traslacion: { min: -10, max: 10, step: 0.5 },
    angulo: { min: -360, max: 360, step: 1 },
    escala: { min: -3, max: 3, step: 0.1 }
  };

  /** Crea un elemento con clase y atributos. */
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'className') node.className = attrs[k];
      else if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  /**
   * @param {object} options
   *   state       — estado de la escena (se modifica en el lugar)
   *   onChange()  — pide redibujar
   *   setStatus(text, type) — mensaje en la barra de estado
   */
  function create(options) {
    const state = options.state;
    const onChange = options.onChange;
    const setStatus = options.setStatus;

    const dom = {
      shapeType: document.getElementById('shapeType'),
      vertexList: document.getElementById('vertexList'),
      vertexButtons: document.getElementById('vertexButtons'),
      addVertex: document.getElementById('addVertex'),
      removeVertex: document.getElementById('removeVertex'),
      shapeMessage: document.getElementById('shapeMessage'),
      transformList: document.getElementById('transformList'),
      transformLimit: document.getElementById('transformLimit'),
      addButtons: document.querySelectorAll('[data-add]'),
      examples: document.getElementById('examples'),
      resetBtn: document.getElementById('resetBtn')
    };

    /** Errores activos: id del campo → mensaje. */
    const errors = new Map();
    let fieldCounter = 0;

    function reportErrors() {
      if (errors.size) {
        setStatus(errors.values().next().value + ' Se mantiene el último valor válido.', 'error');
      } else {
        setStatus('', 'ok');
      }
    }

    /**
     * Campo numérico validado, con deslizador opcional.
     * @param {object} cfg { label, rule, value, slider (bool), onValid(value) }
     */
    function numberField(cfg) {
      const id = 'f' + (++fieldCounter);
      const input = el('input', {
        id: id, type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false',
        value: f(cfg.value, 4), 'aria-describedby': id + '-msg'
      });
      const message = el('p', { id: id + '-msg', className: 'field-message' });
      let range = null;

      function apply(value) {
        errors.delete(id);
        input.removeAttribute('aria-invalid');
        message.textContent = '';
        cfg.onValid(value);
        reportErrors();
      }

      function fail(error) {
        errors.set(id, error);
        input.setAttribute('aria-invalid', 'true');
        message.textContent = error;
        reportErrors();
      }

      input.addEventListener('input', function () {
        const r = V.validate(input.value, cfg.rule);
        if (r.ok) {
          if (range) range.value = String(r.value);
          apply(r.value);
        } else {
          fail(r.error);
        }
      });
      // Al salir del campo con un valor válido se muestra con formato limpio.
      input.addEventListener('blur', function () {
        if (!errors.has(id)) {
          const r = V.validate(input.value, cfg.rule);
          if (r.ok) input.value = f(r.value, 4);
        }
      });

      const children = [el('label', { for: id, text: cfg.label })];
      if (cfg.slider) {
        const s = SLIDERS[cfg.rule];
        range = el('input', {
          type: 'range', min: s.min, max: s.max, step: s.step, value: cfg.value,
          'aria-label': cfg.label + ' (deslizador)', tabindex: '-1'
        });
        range.addEventListener('input', function () {
          input.value = range.value;
          const r = V.validate(range.value, cfg.rule);
          if (r.ok) apply(r.value); else fail(r.error);
        });
        children.push(el('div', { className: 'field-row' }, [range, input]));
      } else {
        children.push(input);
      }
      children.push(message);
      return el('div', { className: 'field' }, children);
    }

    /** Quita los errores de campos que ya no existen en el documento. */
    function pruneErrors() {
      Array.from(errors.keys()).forEach(function (id) {
        if (!document.getElementById(id)) errors.delete(id);
      });
      reportErrors();
    }

    // ------------------------------------------------------------------ Figura

    function checkShape() {
      const shape = state.shape;
      if (shape.closed && Math.abs(Geo.Shapes.signedArea(shape.vertices)) < 1e-9) {
        dom.shapeMessage.textContent = 'Advertencia: los vértices son colineales; la figura no encierra área.';
        dom.shapeMessage.className = 'field-message warning';
      } else {
        dom.shapeMessage.textContent = '';
        dom.shapeMessage.className = 'field-message';
      }
    }

    function renderVertexEditor() {
      const shape = state.shape;
      dom.shapeType.value = shape.type;
      dom.vertexList.innerHTML = '';
      shape.vertices.forEach(function (v, i) {
        const name = Geo.Shapes.vertexName(i);
        const row = el('div', { className: 'vertex-row' }, [
          el('span', { className: 'vertex-name', text: name }),
          numberField({
            label: 'x', rule: 'coordenada', value: v.x,
            onValid: function (value) { shape.vertices[i].x = value; checkShape(); onChange(); }
          }),
          numberField({
            label: 'y', rule: 'coordenada', value: v.y,
            onValid: function (value) { shape.vertices[i].y = value; checkShape(); onChange(); }
          })
        ]);
        row.setAttribute('aria-label', 'Vértice ' + name);
        dom.vertexList.appendChild(row);
      });

      const limits = Geo.Shapes.LIMITS[shape.type];
      dom.vertexButtons.hidden = limits.min === limits.max;
      dom.addVertex.disabled = shape.vertices.length >= limits.max;
      dom.removeVertex.disabled = shape.vertices.length <= limits.min;
      pruneErrors();
      checkShape();
    }

    dom.shapeType.addEventListener('change', function () {
      state.shape = Geo.Shapes.create(dom.shapeType.value);
      state.selectedVertex = 0;
      renderVertexEditor();
      onChange();
    });

    dom.addVertex.addEventListener('click', function () {
      const vs = state.shape.vertices;
      if (vs.length >= Geo.Shapes.LIMITS[state.shape.type].max) return;
      // Nuevo vértice en el punto medio entre el último y el primero.
      const a = vs[vs.length - 1], b = vs[0];
      vs.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      renderVertexEditor();
      onChange();
    });

    dom.removeVertex.addEventListener('click', function () {
      const vs = state.shape.vertices;
      if (vs.length <= Geo.Shapes.LIMITS[state.shape.type].min) {
        dom.shapeMessage.textContent = 'Un polígono necesita entre 3 y 12 vértices.';
        return;
      }
      vs.pop();
      state.selectedVertex = Math.min(state.selectedVertex, vs.length - 1);
      renderVertexEditor();
      onChange();
    });

    // --------------------------------------------------------- Transformaciones

    function pivotFields(t, card) {
      const pivot = t.params.pivot;
      const id = 'p' + (++fieldCounter);
      const select = el('select', { id: id });
      [['origen', 'Origen (0, 0)'], ['centroide', 'Centroide de la figura'], ['personalizado', 'Punto personalizado']]
        .forEach(function (o) {
          const opt = el('option', { value: o[0], text: o[1] });
          if (pivot.mode === o[0]) opt.selected = true;
          select.appendChild(opt);
        });

      const custom = el('div', { className: 'field-pair' }, [
        numberField({ label: 'px', rule: 'coordenada', value: pivot.x, onValid: function (v) { pivot.x = v; refreshLabel(t, card); onChange(); } }),
        numberField({ label: 'py', rule: 'coordenada', value: pivot.y, onValid: function (v) { pivot.y = v; refreshLabel(t, card); onChange(); } })
      ]);
      custom.hidden = pivot.mode !== 'personalizado';

      select.addEventListener('change', function () {
        pivot.mode = select.value;
        custom.hidden = pivot.mode !== 'personalizado';
        pruneErrorsIfHidden(custom);
        refreshLabel(t, card);
        onChange();
      });

      return el('div', { className: 'field' }, [el('label', { for: id, text: 'Pivote (centro de la transformación)' }), select, custom]);
    }

    /** Si los campos del pivote se ocultan, sus errores dejan de aplicar. */
    function pruneErrorsIfHidden(container) {
      if (!container.hidden) return;
      container.querySelectorAll('input[type="text"]').forEach(function (input) {
        errors.delete(input.id);
        input.removeAttribute('aria-invalid');
      });
      container.querySelectorAll('.field-message').forEach(function (m) { m.textContent = ''; });
      reportErrors();
    }

    function refreshLabel(t, card) {
      const centroid = Geo.Shapes.centroid(state.shape.vertices);
      card.querySelector('.transform-label').textContent = Geo.Transforms.label(t, centroid);
    }

    function transformCard(t, index, total) {
      const card = el('li', { className: 'transform-card type-' + t.type + (t.enabled ? '' : ' disabled') });
      const enabledId = 'en-' + t.id;
      const enabled = el('input', { type: 'checkbox', id: enabledId });
      enabled.checked = t.enabled;
      enabled.addEventListener('change', function () {
        t.enabled = enabled.checked;
        card.classList.toggle('disabled', !t.enabled);
        onChange();
      });

      function action(text, title, disabled, handler) {
        const b = el('button', { type: 'button', className: 'icon-btn', title: title, 'aria-label': title, text: text });
        b.disabled = disabled;
        b.addEventListener('click', handler);
        return b;
      }

      const head = el('div', { className: 'card-head' }, [
        el('label', { className: 'check', for: enabledId }, [enabled, el('span', { text: (index + 1) + '. ' + Geo.Panels.TYPE_NAMES[t.type] })]),
        el('div', { className: 'card-actions' }, [
          action('↑', 'Aplicar antes', index === 0, function () { move(index, -1); }),
          action('↓', 'Aplicar después', index === total - 1, function () { move(index, 1); }),
          action('✕', 'Eliminar', false, function () { removeTransform(index); })
        ])
      ]);
      const labelEl = el('p', { className: 'transform-label' });
      card.appendChild(head);
      card.appendChild(labelEl);

      const p = t.params;
      function update(key) {
        return function (value) { p[key] = value; refreshLabel(t, card); onChange(); };
      }
      if (t.type === 'T') {
        card.appendChild(numberField({ label: 'tx (desplazamiento en X)', rule: 'traslacion', value: p.tx, slider: true, onValid: update('tx') }));
        card.appendChild(numberField({ label: 'ty (desplazamiento en Y)', rule: 'traslacion', value: p.ty, slider: true, onValid: update('ty') }));
      } else if (t.type === 'R') {
        card.appendChild(numberField({ label: 'θ (grados, + antihorario)', rule: 'angulo', value: p.angle, slider: true, onValid: update('angle') }));
        card.appendChild(pivotFields(t, card));
      } else {
        card.appendChild(numberField({ label: 'sx (escala en X)', rule: 'escala', value: p.sx, slider: true, onValid: update('sx') }));
        card.appendChild(numberField({ label: 'sy (escala en Y)', rule: 'escala', value: p.sy, slider: true, onValid: update('sy') }));
        card.appendChild(pivotFields(t, card));
      }
      refreshLabel(t, card);
      return card;
    }

    function renderTransformList() {
      dom.transformList.innerHTML = '';
      const list = state.transforms;
      if (!list.length) {
        dom.transformList.appendChild(el('li', { className: 'empty', text: 'Sin transformaciones: M = I (la figura no cambia).' }));
      }
      list.forEach(function (t, i) { dom.transformList.appendChild(transformCard(t, i, list.length)); });

      const full = list.length >= Geo.State.MAX_TRANSFORMS;
      dom.addButtons.forEach(function (b) { b.disabled = full; });
      dom.transformLimit.textContent = full ? 'Se alcanzó el máximo de ' + Geo.State.MAX_TRANSFORMS + ' transformaciones.' : '';
      pruneErrors();
    }

    function move(index, delta) {
      const list = state.transforms;
      const j = index + delta;
      if (j < 0 || j >= list.length) return;
      const tmp = list[index]; list[index] = list[j]; list[j] = tmp;
      renderTransformList();
      onChange();
    }

    function removeTransform(index) {
      state.transforms.splice(index, 1);
      renderTransformList();
      onChange();
    }

    dom.addButtons.forEach(function (b) {
      b.addEventListener('click', function () {
        if (state.transforms.length >= Geo.State.MAX_TRANSFORMS) return;
        state.transforms.push(Geo.State.makeTransform(b.getAttribute('data-add')));
        renderTransformList();
        onChange();
        // Lleva el foco al primer campo de la nueva tarjeta.
        const last = dom.transformList.lastElementChild;
        const first = last && last.querySelector('input[type="text"]');
        if (first) first.focus();
      });
    });

    // ------------------------------------------------------ Ejemplos y reinicio

    Object.keys(Geo.State.EXAMPLES).forEach(function (key) {
      dom.examples.appendChild(el('option', { value: key, text: Geo.State.EXAMPLES[key].title }));
    });

    dom.examples.addEventListener('change', function () {
      const ex = Geo.State.EXAMPLES[dom.examples.value];
      if (!ex) return;
      const built = ex.build();
      state.shape = Geo.Shapes.create(built.shapeType);
      state.transforms = built.transforms;
      state.view.compare = built.compare;
      state.selectedVertex = 0;
      renderAll();
      onChange();
      setStatus('Ejemplo cargado: ' + ex.title + '.', 'ok');
    });

    dom.resetBtn.addEventListener('click', function () {
      const fresh = Geo.State.initial();
      state.shape = fresh.shape;
      state.transforms = fresh.transforms;
      state.view = fresh.view;
      state.selectedVertex = fresh.selectedVertex;
      dom.examples.value = '';
      errors.clear();
      renderAll();
      onChange();
      setStatus('Escena reiniciada a los valores iniciales.', 'ok');
    });

    function renderAll() {
      renderVertexEditor();
      renderTransformList();
      if (options.onViewReset) options.onViewReset();
    }

    return {
      renderAll: renderAll,
      hasErrors: function () { return errors.size > 0; }
    };
  }

  Geo.Controls = { create: create };
})(window.Geo = window.Geo || {});
