/**
 * export.js — Exportar el plano y los cálculos.
 *
 *  - Imagen del plano (PNG): se vuelve a dibujar la escena en un lienzo aparte, en alta
 *    resolución, con un pie que resume las transformaciones.
 *  - Informe completo (PDF): se arma una página con figura, matrices, coordenadas y el
 *    cálculo paso a paso de cada punto, y se abre la ventana de impresión del navegador
 *    («Guardar como PDF»). No necesita bibliotecas ni internet.
 *  - Resumen como imagen (PNG): plano + matrices + coordenadas dibujados en un solo lienzo.
 *
 * Reutiliza el renderizador y los paneles: lo exportado es exactamente lo que se ve.
 */
(function (Geo) {
  'use strict';

  const f = Geo.Matrix.formatNumber;
  const esc = Geo.Panels.esc;

  /** Tamaño de la imagen del plano exportada (píxeles CSS) y su densidad. */
  const PLANE_W = 1600;
  const PLANE_H = 1000;
  const EXPORT_DPR = 2;
  /**
   * Ancho «lógico» con el que se dibuja el plano antes de ampliarlo a PLANE_W.
   * Así los textos y líneas quedan del mismo tamaño relativo que en pantalla.
   */
  const PLANE_LOGICAL_W = 1150;

  const TYPE_NAMES = Geo.Panels.TYPE_NAMES;
  const FONT = '"Segoe UI", Arial, sans-serif';
  const MONO = 'Consolas, "Courier New", monospace';

  /**
   * @param {object} o
   *   state, renderer (el del plano en pantalla), computeFrame(), setStatus(text, type)
   */
  function create(o) {
    const state = o.state;

    // ------------------------------------------------------------ Utilidades

    /** Fecha legible para los documentos: «20/10/2026, 18:42». */
    function timestamp() {
      const d = new Date();
      const p = function (n) { return String(n).padStart(2, '0'); };
      return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ', ' + p(d.getHours()) + ':' + p(d.getMinutes());
    }

    /** Sufijo para el nombre de archivo: 2026-10-20_1842. */
    function fileStamp() {
      const d = new Date();
      const p = function (n) { return String(n).padStart(2, '0'); };
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes());
    }

    /** Descarga un lienzo como PNG y avisa cuando el archivo está listo (tarda ~1 s). */
    function downloadCanvas(canvas, filename, doneMessage) {
      canvas.toBlob(function (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        o.setStatus(doneMessage + ' Archivo: ' + filename, 'ok');
      }, 'image/png');
    }

    function hasFigure() {
      if (state.shape.vertices.length) return true;
      o.setStatus('Primero dibuja o elige una figura; no hay nada que exportar.', 'error');
      setTimeout(function () { o.setStatus('', 'ok'); }, 3500);
      return false;
    }

    /** Lista de transformaciones activas como texto: «S(0.5, 0.5) → R(45°) → T(4, 3)». */
    function chainText(frame) {
      if (!frame.composition.steps.length) return 'Sin transformaciones (M = I)';
      return frame.composition.steps.map(function (s) { return Geo.Transforms.label(s.transform, frame.centroid); }).join('  →  ');
    }

    // ------------------------------------------------------------ Imagen del plano

    /**
     * Dibuja la escena en un lienzo nuevo de PLANE_W × PLANE_H. Se ajusta el zoom para que
     * se vea la misma región del plano que en pantalla (la imagen solo gana resolución).
     */
    function renderPlane(width, height) {
      const frame = o.computeFrame();
      const canvas = document.createElement('canvas');
      const r = Geo.Renderer.create(canvas);
      // Se dibuja a un tamaño lógico menor y con más densidad: el resultado mide
      // width × EXPORT_DPR píxeles reales, con letras proporcionales a la pantalla.
      const factor = width / PLANE_LOGICAL_W;
      width = PLANE_LOGICAL_W;
      height = height / factor;
      r.resize(width, height, EXPORT_DPR * factor);

      const screen = o.renderer.size();
      const scale = Math.min(width / screen.width, height / screen.height);
      const view = Object.assign({}, state.view, { zoom: state.view.zoom * scale });
      r.draw(Object.assign({}, frame, { view: view, highlight: -1, preview: null, pointer: null }));
      return { canvas: canvas, frame: frame };
    }

    /** Leyenda y pie dibujados sobre la imagen del plano. */
    function drawPlaneDecorations(ctx, width, height, frame) {
      const C = Geo.Renderer.COLORS;
      const items = [{ color: C.freePoint, text: 'Figura original (A)' }];
      if (frame.showResult) items.push({ color: C.result, text: 'Figura transformada (A′)' });
      if (state.view.showSteps && frame.steps.length) items.push({ color: C.step, text: 'Pasos intermedios' });
      if (frame.compare) items.push({ color: C.compare, text: 'Orden inverso (A″)' });

      // Leyenda (abajo a la izquierda, sobre el plano)
      ctx.save();
      ctx.font = '600 22px ' + FONT;
      const lh = 34, pad = 16;
      const boxW = Math.max.apply(null, items.map(function (i) { return ctx.measureText(i.text).width; })) + 70;
      const boxH = items.length * lh + pad * 2 - 6;
      const bx = 24, by = height - 90 - boxH;
      roundRect(ctx, bx, by, boxW, boxH, 12);
      ctx.fillStyle = 'rgba(255,255,255,.95)';
      ctx.fill();
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      items.forEach(function (it, i) {
        const y = by + pad + i * lh + 12;
        ctx.beginPath();
        ctx.arc(bx + 28, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = it.color;
        ctx.fill();
        ctx.fillStyle = '#1f2937';
        ctx.textBaseline = 'middle';
        ctx.fillText(it.text, bx + 48, y + 1);
      });

      // Pie: nombre del programa, transformaciones y fecha
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(0, height - 64, width, 64);
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 26px ' + FONT;
      ctx.textBaseline = 'middle';
      ctx.fillText('GeoMatriz 2D', 24, height - 32);
      ctx.font = '500 22px ' + FONT;
      ctx.fillStyle = '#dbeafe';
      const chain = chainText(frame);
      ctx.fillText(chain, 230, height - 32);
      ctx.textAlign = 'right';
      ctx.fillText(timestamp(), width - 24, height - 32);
      ctx.restore();
    }

    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    /** Lienzo final de la imagen del plano (escena + leyenda + pie), en píxeles reales. */
    function planeImage() {
      const plane = renderPlane(PLANE_W, PLANE_H - 64);
      const out = document.createElement('canvas');
      out.width = PLANE_W * EXPORT_DPR;
      out.height = PLANE_H * EXPORT_DPR;
      const ctx = out.getContext('2d');
      ctx.scale(EXPORT_DPR, EXPORT_DPR);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, PLANE_W, PLANE_H);
      ctx.drawImage(plane.canvas, 0, 0, PLANE_W, PLANE_H - 64);
      drawPlaneDecorations(ctx, PLANE_W, PLANE_H, plane.frame);
      return { canvas: out, frame: plane.frame };
    }

    function exportPlanePNG() {
      if (!hasFigure()) return;
      o.setStatus('Generando la imagen del plano…', 'ok');
      downloadCanvas(planeImage().canvas, 'geomatriz-plano_' + fileStamp() + '.png', 'Imagen del plano descargada.');
    }

    // ------------------------------------------------------------ Resumen como imagen

    /** Dibuja una matriz 3×3 con corchetes; devuelve su ancho y alto. */
    function drawMatrix(ctx, M, x, y, opts) {
      const cell = opts.cell || 92, row = opts.row || 38;
      const w = cell * 3 + 28, h = row * 3 + 16;
      ctx.save();
      if (opts.fill) {
        ctx.fillStyle = opts.fill;
        ctx.fillRect(x, y, w, h);
      }
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2.5;
      // Corchetes
      ctx.beginPath();
      ctx.moveTo(x + 10, y); ctx.lineTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + 10, y + h);
      ctx.moveTo(x + w - 10, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - 10, y + h);
      ctx.stroke();
      ctx.font = '600 24px ' + MONO;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          ctx.fillStyle = i === 2 ? '#6b7280' : (j === 2 ? '#0f766e' : '#111827');
          ctx.fillText(f(M[i][j]), x + 14 + cell * (j + 1) - 8, y + 8 + row * i + row / 2);
        }
      }
      ctx.restore();
      return { w: w, h: h };
    }

    function exportSummaryPNG() {
      if (!hasFigure()) return;
      o.setStatus('Generando el resumen…', 'ok');
      const plane = planeImage();
      const frame = plane.frame;
      const steps = frame.composition.steps;

      const W = 1600, pad = 48;
      const planeH = Math.round(PLANE_H * (W - pad * 2) / PLANE_W);
      const cardsPerRow = 3;
      const matrixRows = Math.ceil(Math.max(steps.length, 1) / cardsPerRow);
      const coordRows = frame.original.length;
      // Alto exacto: encabezado, plano, 3 títulos (56 px c/u), matrices, compuesta, tabla y margen final.
      const H = 110 + planeH + 40 + 56 + (steps.length ? matrixRows * 230 : 70) +
                56 + 260 + 56 + 48 + coordRows * 44 + 40;

      const out = document.createElement('canvas');
      out.width = W * EXPORT_DPR;
      out.height = H * EXPORT_DPR;
      const ctx = out.getContext('2d');
      ctx.scale(EXPORT_DPR, EXPORT_DPR);
      ctx.fillStyle = '#f1f4f9';
      ctx.fillRect(0, 0, W, H);

      // Encabezado azul
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, '#1e3a8a');
      grad.addColorStop(1, '#2563eb');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, 90);
      ctx.fillStyle = '#fff';
      ctx.font = '800 38px ' + FONT;
      ctx.textBaseline = 'middle';
      ctx.fillText('GeoMatriz 2D', pad, 45);
      ctx.font = '500 24px ' + FONT;
      ctx.fillStyle = '#dbeafe';
      ctx.fillText('Resumen de la transformación', pad + 290, 47);
      ctx.textAlign = 'right';
      ctx.fillText(timestamp(), W - pad, 47);
      ctx.textAlign = 'left';

      let y = 110;
      ctx.drawImage(plane.canvas, pad, y, W - pad * 2, planeH);
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 2;
      ctx.strokeRect(pad, y, W - pad * 2, planeH);
      y += planeH + 40;

      function heading(text) {
        ctx.fillStyle = '#111827';
        ctx.font = '700 30px ' + FONT;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(text, pad, y + 30);
        y += 56;
      }

      // Matrices de cada transformación
      heading('Matrices de transformación');
      if (!steps.length) {
        ctx.fillStyle = '#5b6472';
        ctx.font = '24px ' + FONT;
        ctx.fillText('No hay transformaciones: la matriz compuesta es la identidad I.', pad, y + 24);
        y += 70;
      }
      const colW = (W - pad * 2) / cardsPerRow;
      steps.forEach(function (s, i) {
        const cx = pad + (i % cardsPerRow) * colW;
        const cy = y + Math.floor(i / cardsPerRow) * 230;
        ctx.fillStyle = '#111827';
        ctx.font = '700 24px ' + FONT;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('M' + (i + 1) + ' · ' + TYPE_NAMES[s.transform.type], cx, cy + 24);
        ctx.fillStyle = '#5b6472';
        ctx.font = '22px ' + MONO;
        ctx.fillText(Geo.Transforms.label(s.transform, frame.centroid), cx, cy + 56);
        drawMatrix(ctx, s.matrix, cx, cy + 74, {});
      });
      if (steps.length) y += matrixRows * 230;

      // Matriz compuesta y determinante
      heading('Matriz compuesta');
      const names = steps.map(function (_, i) { return 'M' + (i + 1); }).reverse();
      ctx.fillStyle = '#111827';
      ctx.font = '600 24px ' + MONO;
      ctx.fillText('M = ' + (names.length ? names.join(' · ') : 'I'), pad, y + 10);
      drawMatrix(ctx, frame.composition.matrix, pad, y + 30, { fill: '#eff6ff', cell: 110 });
      const det = Geo.Matrix.determinant(frame.composition.matrix);
      ctx.font = '700 26px ' + FONT;
      ctx.fillText('det(M) = ' + f(det), pad + 420, y + 90);
      ctx.font = '22px ' + FONT;
      ctx.fillStyle = '#5b6472';
      ctx.fillText(det < 0 ? 'Negativo: hay una reflexión. El área se multiplica por ' + f(Math.abs(det)) + '.'
                           : 'El área de la figura se multiplica por ' + f(det) + '.', pad + 420, y + 130);
      ctx.fillText('Orden: ' + chainText(frame), pad + 420, y + 170);
      y += 260;

      // Tabla de coordenadas
      heading('Coordenadas homogéneas');
      const cols = [pad, pad + 240, pad + 760];
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(pad, y, W - pad * 2, 48);
      ctx.fillStyle = '#374151';
      ctx.font = '700 22px ' + FONT;
      ctx.textBaseline = 'middle';
      ['Punto', 'Original (x, y, 1)', 'Transformado (x′, y′, 1)'].forEach(function (t, i) { ctx.fillText(t, cols[i] + 16, y + 24); });
      y += 48;
      frame.original.forEach(function (p, i) {
        const q = frame.result[i];
        const n = Geo.Shapes.vertexName(i);
        ctx.fillStyle = i % 2 ? '#ffffff' : '#f9fafb';
        ctx.fillRect(pad, y, W - pad * 2, 44);
        ctx.fillStyle = '#111827';
        ctx.font = '700 22px ' + FONT;
        ctx.fillText(n + ' → ' + n + '′', cols[0] + 16, y + 22);
        ctx.font = '22px ' + MONO;
        ctx.fillText('(' + f(p.x) + ', ' + f(p.y) + ', 1)', cols[1] + 16, y + 22);
        ctx.fillText('(' + f(q.x) + ', ' + f(q.y) + ', 1)', cols[2] + 16, y + 22);
        y += 44;
      });

      downloadCanvas(out, 'geomatriz-resumen_' + fileStamp() + '.png', 'Resumen descargado como imagen.');
    }

    // ------------------------------------------------------------ Informe completo (PDF)

    /** Estilos del informe (impresión en A4). */
    const REPORT_CSS = [
      '@page { size: A4; margin: 16mm 14mm; }',
      '* { box-sizing: border-box; }',
      'body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; color: #111827; font-size: 11.5pt; line-height: 1.5; }',
      'header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-radius: 10px;',
      '  background: linear-gradient(120deg, #1e3a8a, #2563eb); color: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }',
      'header h1 { margin: 0; font-size: 20pt; } header p { margin: 0; color: #dbeafe; }',
      'h2 { margin: 22px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #dbeafe; font-size: 14pt; color: #1e3a8a; }',
      'h3 { margin: 14px 0 6px; font-size: 11.5pt; }',
      '.plane { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; }',
      'table { width: 100%; border-collapse: collapse; margin: 6px 0; }',
      'th, td { padding: 6px 10px; border: 1px solid #e5e7eb; text-align: left; }',
      'th { background: #f3f4f6; -webkit-print-color-adjust: exact; print-color-adjust: exact; }',
      'td.mono, .mono { font-family: Consolas, "Courier New", monospace; }',
      '.matrices { display: flex; flex-wrap: wrap; gap: 12px; }',
      '.matrix-card { flex: 1 1 200px; padding: 10px 12px; border: 1px solid #e5e7eb; border-left: 4px solid #0f766e; border-radius: 8px; break-inside: avoid; }',
      '.matrix-card.type-R { border-left-color: #6d28d9; } .matrix-card.type-S { border-left-color: #b45309; }',
      '.matrix-card h3 { margin: 0; } .matrix-label { margin: 2px 0 8px; color: #5b6472; font-family: Consolas, monospace; font-size: 10pt; }',
      '.matrix { position: relative; display: inline-grid; grid-template-columns: repeat(3, auto); gap: 2px 16px; padding: 6px 14px; font-family: Consolas, monospace; }',
      '.matrix::before, .matrix::after { content: ""; position: absolute; top: 0; bottom: 0; width: 7px; border: 2px solid #374151; }',
      '.matrix::before { left: 0; border-right: 0; } .matrix::after { right: 0; border-left: 0; }',
      '.matrix span { min-width: 3.4ch; text-align: right; } .m-translate { color: #0f766e; font-weight: 700; } .m-fixed { color: #6b7280; }',
      '.matrix-total { background: #eff6ff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }',
      '.composite h3 { display: none; } .product { font-family: Consolas, monospace; margin: 0 0 6px; } .det { margin: 8px 0; } .hint { color: #5b6472; font-size: 10pt; }',
      '.point { margin-top: 14px; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 8px; break-inside: avoid; }',
      '.point h3 { margin-top: 0; color: #1e3a8a; }',
      '.explanation h3 { font-size: 10.5pt; margin: 10px 0 4px; color: #111827; }',
      '.explanation pre { margin: 4px 0 0; padding: 8px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;',
      '  font-family: Consolas, monospace; font-size: 9.5pt; white-space: pre-wrap; -webkit-print-color-adjust: exact; print-color-adjust: exact; }',
      '.steps { margin: 0; padding-left: 20px; } .result-line { margin: 8px 0 0; font-weight: 600; }',
      '.empty { color: #5b6472; }',
      'footer { margin-top: 24px; color: #6b7280; font-size: 9pt; text-align: center; }',
      '.print-bar { position: sticky; top: 0; display: flex; gap: 10px; justify-content: flex-end; padding: 10px 0; background: #fff; }',
      '.print-bar button { padding: 8px 16px; border: 0; border-radius: 8px; background: #2563eb; color: #fff; font: inherit; font-weight: 600; cursor: pointer; }',
      '@media print { .print-bar { display: none; } }',
      '@media screen { body { max-width: 900px; margin: 0 auto; padding: 0 20px 40px; } }'
    ].join('\n');

    function exportReportPDF() {
      if (!hasFigure()) return;
      // Se abre la ventana primero (en el mismo clic) para que el navegador no la bloquee.
      const win = window.open('', '_blank');
      if (!win) {
        o.setStatus('El navegador bloqueó la ventana del informe. Permite las ventanas emergentes e inténtalo de nuevo.', 'error');
        return;
      }

      const plane = planeImage();
      const frame = plane.frame;
      const imgURL = plane.canvas.toDataURL('image/png');

      // Matrices y coordenadas con los mismos generadores que usa la pantalla.
      const tmpList = document.createElement('div');
      const tmpComposite = document.createElement('div');
      Geo.Panels.renderMatrices(tmpList, tmpComposite, frame.composition, frame.centroid);
      const tmpBody = document.createElement('tbody');
      Geo.Panels.renderCoordinates(tmpBody, frame.original, frame.result);
      const tmpMeasures = document.createElement('div');
      Geo.Panels.renderAlgebra(tmpMeasures, state.shape, frame.result, frame.composition);

      // Cálculo paso a paso de cada punto.
      let pointsHTML = '';
      frame.original.forEach(function (_, i) {
        const box = document.createElement('div');
        Geo.Explain.render(box, i, frame.original, frame.composition, frame.centroid);
        pointsHTML += '<section class="point"><h3>Punto ' + Geo.Shapes.vertexName(i) + '</h3><div class="explanation">' + box.innerHTML + '</div></section>';
      });

      const pointsList = frame.original.map(function (p, i) {
        return '<tr><td><strong>' + Geo.Shapes.vertexName(i) + '</strong></td><td class="mono">(' + f(p.x) + ', ' + f(p.y) + ')</td></tr>';
      }).join('');

      const transformsList = frame.composition.steps.length
        ? '<ol>' + frame.composition.steps.map(function (s) {
            return '<li><strong>' + TYPE_NAMES[s.transform.type] + '</strong>: <span class="mono">' + esc(Geo.Transforms.label(s.transform, frame.centroid)) + '</span></li>';
          }).join('') + '</ol>'
        : '<p class="empty">No hay transformaciones activas: la figura no cambia (M = I).</p>';

      const shapeName = Geo.Shapes.NAMES[state.shape.type] || 'Figura';
      const html = '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
        '<title>Informe GeoMatriz 2D — ' + esc(timestamp()) + '</title><style>' + REPORT_CSS + '</style></head><body>' +
        '<div class="print-bar"><button onclick="window.print()">Guardar como PDF / Imprimir</button></div>' +
        '<header><div><h1>GeoMatriz 2D</h1><p>Informe de la transformación</p></div><p>' + esc(timestamp()) + '</p></header>' +
        '<h2>1. Plano cartesiano</h2><img class="plane" src="' + imgURL + '" alt="Plano con la figura original y la transformada">' +
        '<h2>2. Figura original</h2><p>' + esc(shapeName) + ' con ' + frame.original.length + (frame.original.length === 1 ? ' punto.' : ' puntos.') + '</p>' +
        '<table><thead><tr><th>Punto</th><th>Coordenadas (x, y)</th></tr></thead><tbody>' + pointsList + '</tbody></table>' +
        tmpMeasures.innerHTML +
        '<h2>3. Transformaciones (en orden de aplicación)</h2>' + transformsList +
        '<h2>4. Matrices homogéneas 3×3</h2><div class="matrices">' + tmpList.innerHTML + '</div>' +
        '<h3>Matriz compuesta</h3><div class="composite">' + tmpComposite.innerHTML + '</div>' +
        '<h2>5. Coordenadas homogéneas</h2><table><thead><tr><th>Punto</th><th>Original (x, y, 1)</th><th>Transformado (x′, y′, 1)</th></tr></thead>' +
        '<tbody>' + tmpBody.innerHTML.replace(/<td>/g, '<td class="mono">') + '</tbody></table>' +
        '<h2>6. Cálculo paso a paso</h2><p class="hint">Cada punto se calcula de dos formas: aplicando una transformación a la vez y con la matriz compuesta. Ambos resultados coinciden.</p>' +
        pointsHTML +
        '<footer>Generado con GeoMatriz 2D · ' + esc(timestamp()) + '</footer>' +
        '<script>window.addEventListener("load", function () { setTimeout(function () { window.print(); }, 300); });<\/script>' +
        '</body></html>';

      win.document.open();
      win.document.write(html);
      win.document.close();
      o.setStatus('Informe abierto. En la ventana de impresión elige «Guardar como PDF».', 'ok');
    }

    return {
      exportPlanePNG: exportPlanePNG,
      exportSummaryPNG: exportSummaryPNG,
      exportReportPDF: exportReportPDF
    };
  }

  Geo.Export = { create: create };
})(window.Geo = window.Geo || {});
