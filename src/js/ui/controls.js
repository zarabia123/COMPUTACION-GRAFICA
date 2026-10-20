/**
 * controls.js — Controles de la interfaz: editor de vértices y lista de transformaciones.
 *
 * Regla general: un valor solo pasa al estado si es válido. Si no lo es, el campo
 * se marca en rojo, se muestra el motivo y la escena conserva el último valor válido.
 */
(function (Geo) {
  'use strict';

  const V = Geo.Validation;
  const MAX_POINTS = Geo.Shapes.LIMITS.poligono.max;
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
   *   state                 — estado de la escena (se modifica en el lugar)
   *   onChange()            — pide redibujar
   *   setStatus(text, type) — aviso sobre el plano
   *   onViewReset()         — la vista se reinició (sincronizar las casillas de Ajustes)
   *   onShapeReplaced()     — la figura se reemplazó por otra (cancelar la construcción en curso)
   */
  function create(options) {
    const state = options.state;
    const onChange = options.onChange;
    const setStatus = options.setStatus;

    const dom = {
      shapeType: document.getElementById('shapeType'),
      vertexList: document.getElementById('vertexList'),
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
    /** true mientras el aviso visible es un error de validación de estos campos. */
    let showingError = false;

    /** Muestra el primer error activo, o quita el aviso de error cuando ya no hay ninguno. */
    function reportErrors() {
      if (errors.size) {
        setStatus(errors.values().next().value + ' Se mantiene el último valor válido.', 'error');
        showingError = true;
      } else if (showingError) {
        // Solo se borra el aviso si era de validación; los demás avisos se respetan.
        setStatus('', 'ok');
        showingError = false;
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
      if (cfg.inline) {
        // Campo «en línea»: su ancho sigue al número, para leer «A = (1, 1)» sin huecos.
        input.classList.add('inline-number');
        const fit = function () { input.style.width = (Math.max(1, input.value.length) + 1.2) + 'ch'; };
        fit();
        input.addEventListener('input', fit);
        input.addEventListener('blur', function () { setTimeout(fit, 0); });
      }
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

      // En la vista algebraica la etiqueta solo la leen los lectores de pantalla.
      const children = [el('label', { for: id, text: cfg.label, className: cfg.hiddenLabel ? 'sr-only' : '' })];
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
      return el('div', { className: 'field' + (cfg.inline ? ' field-inline' : '') }, children);
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

    /** Cambia el número de puntos y actualiza el tipo de figura (1 → punto, 2 → segmento…). */
    function setVertices(vertices) {
      state.shape.vertices = vertices;
      state.shape.type = Geo.Shapes.typeForCount(vertices.length);
      state.shape.closed = Geo.Shapes.isClosedType(state.shape.type);
      state.selectedVertex = Math.min(state.selectedVertex, Math.max(0, vertices.length - 1));
      renderVertexEditor();
      onChange();
    }

    function duplicateVertex(i) {
      const vs = state.shape.vertices;
      if (vs.length >= MAX_POINTS) {
        setStatus('Una figura puede tener como máximo ' + MAX_POINTS + ' puntos.', 'ok');
        return;
      }
      // La copia se coloca una unidad a la derecha y arriba, para que no quede encima.
      const v = vs[i];
      const copy = { x: clampCoord(v.x + 1), y: clampCoord(v.y + 1) };
      state.selectedVertex = i + 1;   // la copia queda seleccionada
      setVertices(vs.slice(0, i + 1).concat([copy], vs.slice(i + 1)));
      setStatus('Punto ' + Geo.Shapes.vertexName(i) + ' duplicado como ' + Geo.Shapes.vertexName(i + 1) + '.', 'ok');
    }

    function deleteVertex(i) {
      const name = Geo.Shapes.vertexName(i);
      setVertices(state.shape.vertices.filter(function (_, k) { return k !== i; }));
      setStatus('Punto ' + name + ' borrado. Los demás puntos se renombraron en orden.', 'ok');
    }

    function clampCoord(value) {
      const lim = V.RULES.coordenada.max;
      return Math.min(lim, Math.max(-lim, value));
    }

    /** Menú ⋮ de una fila: Duplicar y Borrar (como en GeoGebra). */
    let openMenu = null;
    function closeMenu() {
      if (!openMenu) return;
      openMenu.menu.hidden = true;
      openMenu.button.setAttribute('aria-expanded', 'false');
      openMenu = null;
    }
    document.addEventListener('click', function (e) {
      if (openMenu && !openMenu.wrap.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && openMenu) { const b = openMenu.button; closeMenu(); b.focus(); }
    });

    function rowMenu(i) {
      const name = Geo.Shapes.vertexName(i);
      const button = el('button', {
        type: 'button', className: 'row-menu-btn', 'aria-haspopup': 'menu', 'aria-expanded': 'false',
        'aria-label': 'Opciones del punto ' + name, title: 'Opciones'
      });
      button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';
      const dup = el('button', { type: 'button', role: 'menuitem', text: 'Duplicar' });
      const del = el('button', { type: 'button', role: 'menuitem', className: 'danger', text: 'Borrar' });
      const menu = el('div', { className: 'row-menu', role: 'menu' }, [dup, del]);
      menu.hidden = true;
      const wrap = el('div', { className: 'row-menu-wrap' }, [button, menu]);

      button.addEventListener('click', function (e) {
        e.stopPropagation();
        const wasOpen = openMenu && openMenu.menu === menu;
        closeMenu();
        if (!wasOpen) {
          menu.hidden = false;
          button.setAttribute('aria-expanded', 'true');
          openMenu = { menu: menu, button: button, wrap: wrap };
          dup.focus();
        }
      });
      dup.addEventListener('click', function () { closeMenu(); duplicateVertex(i); });
      del.addEventListener('click', function () { closeMenu(); deleteVertex(i); });
      return wrap;
    }

    /**
     * Lista de puntos como la vista algebraica de GeoGebra:
     *   (●)  A = (−4.48, 2.36)   ⋮
     * La bolita muestra u oculta el punto; los números se editan con un clic.
     */
    function renderVertexEditor() {
      closeMenu();
      const shape = state.shape;
      dom.shapeType.value = shape.type;
      dom.vertexList.innerHTML = '';
      if (!shape.vertices.length) {
        dom.vertexList.appendChild(el('p', {
          className: 'empty',
          text: 'Aún no hay puntos. Dibuja en el plano con las herramientas Punto, Segmento o Polígono, o elige una figura predefinida.'
        }));
      }
      shape.vertices.forEach(function (v, i) {
        const name = Geo.Shapes.vertexName(i);

        const toggle = el('button', {
          type: 'button',
          className: 'visibility-dot' + (v.hidden ? ' is-off' : ''),
          'aria-pressed': String(!v.hidden),
          'aria-label': (v.hidden ? 'Mostrar' : 'Ocultar') + ' el punto ' + name,
          title: v.hidden ? 'Mostrar el punto' : 'Ocultar el punto'
        });
        toggle.addEventListener('click', function () {
          v.hidden = !v.hidden;
          renderVertexEditor();
          onChange();
        });

        const expr = el('div', { className: 'algebra-expr' + (v.hidden ? ' is-off' : '') }, [
          el('span', { className: 'algebra-name', text: name + ' = (' }),
          numberField({
            label: 'Coordenada x de ' + name, hiddenLabel: true, inline: true, rule: 'coordenada', value: v.x,
            onValid: function (value) { shape.vertices[i].x = value; checkShape(); onChange(); }
          }),
          el('span', { className: 'algebra-sep', text: ',' }),
          numberField({
            label: 'Coordenada y de ' + name, hiddenLabel: true, inline: true, rule: 'coordenada', value: v.y,
            onValid: function (value) { shape.vertices[i].y = value; checkShape(); onChange(); }
          }),
          el('span', { className: 'algebra-sep', text: ')' })
        ]);

        const row = el('div', {
          className: 'algebra-row vertex-row' + (i === state.selectedVertex ? ' is-selected' : ''),
          role: 'group', 'aria-label': 'Punto ' + name
        }, [el('div', { className: 'dot-gutter' }, [toggle]), expr, rowMenu(i)]);
        dom.vertexList.appendChild(row);
      });

      pruneErrors();
      checkShape();
    }

    /** Avisa que la figura se reemplazó por otra (p. ej. para salir del modo dibujo). */
    function shapeReplaced() {
      if (options.onShapeReplaced) options.onShapeReplaced();
    }

    dom.shapeType.addEventListener('change', function () {
      if (!dom.shapeType.value) return;   // opción «Elegir…»
      shapeReplaced();
      state.shape = Geo.Shapes.create(dom.shapeType.value);
      state.selectedVertex = 0;
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

    /**
     * Sentido de giro de una rotación. No es un dato aparte: es el signo del ángulo
     * (antihorario = positivo, horario = negativo). Elegir un sentido cambia el signo
     * y escribir un ángulo negativo marca «Horario».
     */
    function senseControl(t) {
      const name = 'sense-' + t.id;
      const ccw = el('input', { type: 'radio', name: name, value: 'antihorario', id: name + '-ccw' });
      const cw = el('input', { type: 'radio', name: name, value: 'horario', id: name + '-cw' });
      const element = el('fieldset', { className: 'sense' }, [
        el('legend', { text: 'Sentido' }),
        el('label', { className: 'check', for: name + '-ccw' }, [ccw, el('span', { text: 'Antihorario (positivo)' })]),
        el('label', { className: 'check', for: name + '-cw' }, [cw, el('span', { text: 'Horario (negativo)' })])
      ]);
      let angleInput = null, angleRange = null, card = null;

      function sync() {
        ccw.checked = t.params.angle >= 0;
        cw.checked = t.params.angle < 0;
      }

      function choose(sign) {
        const value = sign * Math.abs(t.params.angle);
        t.params.angle = value;
        if (angleInput) angleInput.value = f(value, 4);
        if (angleRange) angleRange.value = String(value);
        refreshLabel(t, card);
        onChange();
      }
      ccw.addEventListener('change', function () { choose(1); });
      cw.addEventListener('change', function () { choose(-1); });
      sync();

      return {
        element: element,
        sync: sync,
        /** Enlaza con el campo del ángulo para actualizarlo al cambiar de sentido. */
        bind: function (field, cardEl) {
          angleInput = field.querySelector('input[type="text"]');
          angleRange = field.querySelector('input[type="range"]');
          card = cardEl;
        }
      };
    }

    function transformCard(t, index, total) {
      const card = el('li', { className: 'transform-card type-' + t.type + (t.enabled ? '' : ' disabled') });
      cards.push({ transform: t, card: card });
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
        card.appendChild(numberField({ label: 'Desplazamiento horizontal (tx)', rule: 'traslacion', value: p.tx, slider: true, onValid: update('tx') }));
        card.appendChild(numberField({ label: 'Desplazamiento vertical (ty)', rule: 'traslacion', value: p.ty, slider: true, onValid: update('ty') }));
      } else if (t.type === 'R') {
        const sense = senseControl(t);
        const angleField = numberField({
          label: 'Ángulo θ (grados)', rule: 'angulo', value: p.angle, slider: true,
          onValid: function (value) { p.angle = value; sense.sync(); refreshLabel(t, card); onChange(); }
        });
        sense.bind(angleField, card);
        card.appendChild(angleField);
        card.appendChild(sense.element);
        card.appendChild(pivotFields(t, card));
      } else {
        card.appendChild(numberField({ label: 'Escala horizontal (sx)', rule: 'escala', value: p.sx, slider: true, onValid: update('sx') }));
        card.appendChild(numberField({ label: 'Escala vertical (sy)', rule: 'escala', value: p.sy, slider: true, onValid: update('sy') }));
        card.appendChild(pivotFields(t, card));
      }
      refreshLabel(t, card);
      return card;
    }

    /** Tarjetas visibles, para actualizar sus etiquetas (p. ej. el pivote en el centroide). */
    let cards = [];

    /**
     * Actualiza el texto «R(90°) respecto a (x, y)» de cada tarjeta. Hace falta cuando el
     * pivote es el centroide y se mueven los puntos de la figura.
     */
    function refreshTransformLabels() {
      cards.forEach(function (c) { refreshLabel(c.transform, c.card); });
    }

    function renderTransformList() {
      cards = [];
      dom.transformList.innerHTML = '';
      const list = state.transforms;
      if (!list.length) {
        dom.transformList.appendChild(el('li', { className: 'empty', text: 'Aún no hay transformaciones. Agrega una con los botones de arriba.' }));
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
      shapeReplaced();
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
      shapeReplaced();
      state.shape = fresh.shape;
      state.transforms = fresh.transforms;
      state.view = fresh.view;
      state.selectedVertex = fresh.selectedVertex;
      dom.examples.value = '';
      errors.clear();
      renderAll();
      onChange();
      setStatus('Se reinició todo: el plano está vacío.', 'ok');
    });

    function renderAll() {
      renderVertexEditor();
      renderTransformList();
      if (options.onViewReset) options.onViewReset();
    }

    return {
      renderAll: renderAll,
      refreshShape: renderVertexEditor,
      refreshTransformLabels: refreshTransformLabels
    };
  }

  Geo.Controls = { create: create };
})(window.Geo = window.Geo || {});
