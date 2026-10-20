# Registro de pruebas

Casos definidos en [diseno.md](diseno.md), sección 6. Este documento registra **resultados reales**; los casos aún no ejecutados se marcan como pendientes.

## Ejecución 1 — 13/10/2026 (Fase 3, primera versión)

**Entorno:** navegador basado en Chromium (panel de navegador de la aplicación Claude para escritorio), Windows 11. La aplicación se sirvió con `python -m http.server` solo para poder inspeccionar la consola; la apertura con doble clic (CU03) queda pendiente de verificar a mano.

### Pruebas automáticas (`tests/test-runner.html`)

**Resultado: 36 de 36 aprobadas** (CP01–CP24 y CV01–CV12), con tolerancia de 1·10⁻⁹. Los valores esperados se calcularon a mano y se verificaron con un cálculo independiente en Node.js antes de programar.

### Pruebas de interfaz

| ID | Prueba | Resultado observado | Estado |
|---|---|---|---|
| CU01 | Reiniciar escena tras modificarla | Coordenadas (1, 2), (1, 5), (−1, 2); lista R(90°) → T(2, 1); 0 campos con error | Aprobada |
| CU02 | Sin desplazamiento horizontal a 375, 768, 1024 y 1366 px | Ancho del documento igual al ancho visible en los 4 casos (tras las correcciones 1 y 2) | Aprobada |
| CU03 | Abrir con doble clic (`file://`) sin errores | — | **Pendiente** |
| CU05 | Reordenar: S(2.5, 1) → R(90°) → T(2, 1) | M = M₃·M₂·M₁; A′ = (1, 3.5), B′ = (1, 11), C′ = (−1, 3.5), que coincide con el cálculo a mano | Aprobada |
| CU06 | Ejemplo «El orden importa» | Se activa «Comparar»; A′ = (3, 1), B′ = (3, 4), C′ = (1, 1); el resultado en orden inverso se dibuja aparte | Aprobada |
| — | Rotación 90° respecto al pivote (2, 1) seguida de T(2, 1) | M₁ = [[0, −1, 3], [1, 0, −1], [0, 0, 1]]; A′ = (4, 1), B′ = (4, 4), C′ = (2, 1), que coincide con el cálculo a mano | Aprobada |
| CV01–CV04 | Campo de escala: vacío, «abc», 0 y «2,5» desde la interfaz | Los tres primeros se marcan como inválidos y la escena no cambia; «2,5» se acepta como 2.5 | Aprobada |
| CU04 | Sincronía entre deslizador y campo | — | **Pendiente** (prueba manual con el ratón) |
| CU07 | Uso con teclado | — | **Pendiente** |
| CU08 | Chrome, Edge, Firefox y navegador del Lab. 05 | — | **Pendiente** |

### Rendimiento (botón «Medir rendimiento» de `tests/test-runner.html`)

Tiempo medio de 100 renderizados completos en un lienzo de 800×600, con 10 transformaciones, pasos intermedios y comparación activados:

| ID | Vértices | Tiempo medio | Equivalente |
|---|---|---|---|
| CR01 | 3 | 0.189 ms | ≈ 5300 cuadros/s |
| CR02 | 12 | 0.367 ms | ≈ 2700 cuadros/s |
| CR03 | 100 | 1.718 ms | ≈ 580 cuadros/s |

Estos tiempos corresponden al equipo de desarrollo; se deben repetir en una PC del Lab. 05 para el manual técnico.

## Ejecución 2 — 19/10/2026 (navegación estilo GeoGebra)

**Entorno:** el mismo de la ejecución 1.

| ID | Prueba | Resultado observado | Estado |
|---|---|---|---|
| CU09 | Zoom con rueda: el punto bajo el cursor no se mueve (20 pasos, acercar y alejar) | Error máximo 8.9·10⁻¹⁶ unidades (precisión de punto flotante) | Aprobada |
| CU10 | Arrastrar 100 px a la derecha y 50 px abajo con k = 20.18 | El centro cambió en (−4.9557, +2.4779), igual al valor esperado (−100/k, +50/k) | Aprobada |
| CU11 | Pellizco: dos dedos que duplican su separación | Zoom ×2.000; el punto medio entre los dedos se mantuvo (diferencia < 0.002 unidades, por el redondeo de las coordenadas del evento) | Aprobada |
| CU12 | Doble clic en el plano | Centro (0, 0) y zoom automático | Aprobada |
| CU13 | Arrastre real con el ratón | La vista se desplazó en la dirección del movimiento | Aprobada |
| — | Pruebas automáticas tras el cambio | 36 de 36 aprobadas | Aprobada |

## Ejecución 3 — 19/10/2026 (puntos en el plano)

| ID | Prueba | Resultado observado | Estado |
|---|---|---|---|
| CU14 | Arrastrar B(4, 1) y soltar en (5.2, 3.2) con ajuste | B = (5, 3); editor y tabla actualizados; B′ = (−1, 6), que coincide con R(90°) → T(2, 1) calculado a mano | Aprobada |
| CU15 | Arrastrar sobre el fondo | La figura no cambia; solo se mueve la vista | Aprobada |
| CU16 | Modo dibujo: clics en (0,0), (3.1, 0.2), (3,2), (1,3) y luego en A | Tipos sucesivos: punto → segmento → triángulo → polígono; con ajuste, (3.1, 0.2) quedó en (3, 0); el clic en A cerró el polígono de 4 vértices | Aprobada |
| CU17 | Activar y terminar el dibujo sin colocar puntos (botón y Escape) | Se recupera la figura anterior con el mensaje «Dibujo cancelado» | Aprobada |
| CU18 | Sin ajuste, clic en (1.234, −2.345) | Vértice (1.234, −2.345) | Aprobada |
| CU19 | Cambiar el tipo de figura durante el dibujo | Sale del modo dibujo y carga la figura elegida | Aprobada |
| CU20 | 13 clics en modo dibujo | Se detiene en 12 vértices con aviso | Aprobada |
| CU21 | Clic a 15 px de un vértice con ratón y con el dedo | Con ratón mueve el plano; con el dedo toma el vértice | Aprobada |
| CU02 | Ancho de 375 px con el nuevo botón | Sin desplazamiento horizontal | Aprobada |
| — | Pruebas automáticas | 36 de 36 aprobadas | Aprobada |

## Ejecución 4 — 19/10/2026 (interfaz estilo GeoGebra)

Viewport fijado en 1366×900 y en 375×812. El panel de navegador del entorno de prueba estaba oculto y medía 0×0 px; con ese tamaño el lienzo no tiene área y todos los clics caen en el mismo punto, por eso se fijó un tamaño antes de probar.

| ID | Prueba | Resultado observado | Estado |
|---|---|---|---|
| CU22 | Herramienta Punto: clic en (2.1, 2.9) y luego en (−1, 1) | Punto (2, 3); el segundo clic crea una figura nueva (−1, 1) | Aprobada |
| CU23 | Herramienta Segmento: clics en (0, 0) y (3, 4) | Segmento; vista algebraica `a = Segmento(A, B) = 5`; B′ = (−2, 4), que coincide con R(90°) → T(2, 1) a mano | Aprobada |
| CU24 | Herramienta Polígono: (0,0), (4,0), (4,3) y clic en A | Abierto mientras se construye; al cerrar: triángulo con a = 4, b = 3, c = 5, área 6, y `Área′ = |det(M)| · 6 = 6` | Aprobada |
| CU25 | Escape | Vuelve a la herramienta Mover | Aprobada |
| CU26 | Desplazar vista: arrastrar 60 px sobre el vértice A | La figura no cambia; el centro se desplazó −1.852 (= −60/k) | Aprobada |
| CU27 | Mover: arrastrar A 2 unidades a la izquierda | A = (−2, 0) | Aprobada |
| CU28 | 375 px de ancho | Las 5 herramientas en una fila; sin desplazamiento horizontal | Aprobada |
| — | Pruebas automáticas (se agregan CP25 lados y CP26 área = \|det\| · área) | 38 de 38 aprobadas | Aprobada |

## Ejecución 5 — 19/10/2026 (rediseño de la interfaz)

| ID | Prueba | Resultado observado | Estado |
|---|---|---|---|
| CU29 | Pestañas de resultados (clic y flecha →) | Solo se muestra la pestaña elegida; la flecha mueve la selección y el foco | Aprobada |
| CU30 | Textos institucionales en la interfaz | No aparecen (la información académica queda en el README y en el informe) | Aprobada |
| CU31 | Regresión: escala 0, reinicio y coordenadas | Mensaje de error correcto; reinicio a R(90°) → T(2, 1); A′ = (1, 2), B′ = (1, 5), C′ = (−1, 2) | Aprobada |
| CU02 | Anchos 375, 1024 y 1440 px | Sin desplazamiento horizontal; en 375 px el plano aparece primero; en 1440 px herramientas y zoom en una fila | Aprobada |
| — | Pruebas automáticas | 38 de 38 aprobadas | Aprobada |

## Ejecución 6 — 19/10/2026 (inicio vacío, coordenadas al pasar el puntero, Guía y Ajustes)

| ID | Prueba | Resultado observado | Estado |
|---|---|---|---|
| CU32 | Abrir el programa | Sin figura ni transformaciones; selector en «Elegir…»; mensaje de inicio en el plano; leyenda y cursor ocultos | Aprobada |
| CU33 | Dibujar A(1,1), B(4,1), C(1,3) con Polígono y cerrar en A | Triángulo; el mensaje de inicio se oculta; la leyenda muestra solo «Figura original» y «Figura transformada» | Aprobada |
| CU34 | Rotación: θ = 90 y elegir «Horario» | θ cambia a −90; etiqueta R(−90°); A′ = (1, −1), que coincide con el cálculo a mano | Aprobada |
| CU35 | Escribir θ = 45 tras elegir «Horario» | Se marca «Antihorario» (el sentido sigue al signo) | Aprobada |
| CU36 | Puntero cerca de A | Se dibuja la etiqueta «A (1, 1)» (píxel de su fondo #eef0ff); al salir del plano desaparece junto con la posición del cursor | Aprobada |
| CU37 | Ajustes → Pasos intermedios | La ventana abre y cierra; la leyenda agrega «Pasos intermedios» | Aprobada |
| CU38 | Guía | Abre con 3 pasos y 4 trucos; se cierra con clic en el fondo | Aprobada |
| CU39 | Reiniciar todo | Plano vacío, sin transformaciones, ajustes por defecto | Aprobada |
| CU40 | Borrar con un cuadrado cargado | Plano sin figura; el selector vuelve a «Elegir…» | Aprobada |
| CU02 | 375 px y 1600 px | Sin desplazamiento horizontal; en 375 px las 6 herramientas en una fila | Aprobada |
| — | Pruebas automáticas (CP18 actualizada al inicio vacío) | 38 de 38 aprobadas | Aprobada |

## Ejecución 7 — 19/10/2026 (barra azul, nombre GeoMatriz 2D y nueva distribución)

| ID | Prueba | Resultado observado | Estado |
|---|---|---|---|
| CU41 | 1600 px con el ejemplo «Composición S → R → T» | Figura (330 px) · plano (791 px) · Transformaciones (360 px) arriba; Resultados a todo el ancho abajo, con 3 tarjetas lado a lado | Aprobada |
| CU42 | Desplazar la página hasta Resultados | El plano ya no queda fijo encima de los resultados (se quitó `position: sticky`) | Aprobada |
| CU43 | Tabla de coordenadas en su tarjeta | Cabe sin desplazamiento interno (encabezados en dos líneas) | Aprobada |
| CU44 | 1024 px | Plano a la derecha; Figura y Transformaciones a la izquierda; Resultados abajo; sin desplazamiento horizontal | Aprobada |
| CU45 | 375 px | Orden: plano, Transformaciones, Figura, Resultados; sin desplazamiento horizontal | Aprobada |
| — | Pruebas automáticas | 38 de 38 aprobadas | Aprobada |

## Ejecución 8 — 19/10/2026 (figura y transformaciones juntas, plano más grande)

| ID | Prueba | Resultado observado | Estado |
|---|---|---|---|
| CU46 | 1600×900 con el ejemplo «Composición S → R → T» | Columna izquierda y plano de 772 px de alto; lienzo de 1085×585 px (antes 791×529); la columna izquierda se desplaza por dentro (contenido de 2248 px) | Aprobada |
| CU47 | Aparece y desaparece un aviso | El lienzo mantiene 1085×585 px; el tamaño interno coincide con el visible | Aprobada |
| CU48 | Aviso informativo | Se oculta solo a los 4 s | Aprobada |
| CU49 | Error (escala 0) | Sigue visible después de 4 s; desaparece al corregir el valor | Aprobada |
| CU50 | 1024×768 | Lienzo de 562×368 px, igual al tamaño interno; sin desplazamiento horizontal | Aprobada |
| CU51 | 375×812 | Orden plano → Transformaciones → Figura → Resultados; sin desplazamiento interno ni horizontal | Aprobada |
| — | Pruebas automáticas | 38 de 38 aprobadas | Aprobada |

## Ejecución 9 — 19/10/2026 (selector de figura en las herramientas; panel Figura solo con puntos)

| ID | Prueba | Resultado observado | Estado |
|---|---|---|---|
| CU52 | Ubicación del selector «Figura predefinida» | Está en la zona de herramientas, en la misma fila y a la misma altura (58 px) que los botones; los títulos de los 3 grupos alineados | Aprobada |
| CU53 | Contenido del panel 1 · Figura | Solo la lista de puntos editables (y los botones para agregar/quitar vértices en polígonos) | Aprobada |
| CU54 | Triángulo sin transformaciones | Solo se dibuja la figura original (A, B, C); la leyenda muestra solo «Figura original» | Aprobada |
| CU55 | Escribir A = (−3, 1) | Medidas: a = 7, b = 3.606, c = 4.472, área = 7, que coinciden con el cálculo a mano | Aprobada |
| CU56 | Agregar S(2, 1) | Aparece la figura transformada; «pol1′ · Área = 14 = 2 · 7» en Coordenadas y medidas | Aprobada |
| CU02 | 375 px | Sin desplazamiento horizontal; el selector ocupa el ancho disponible | Aprobada |
| — | Pruebas automáticas | 38 de 38 aprobadas | Aprobada |

## Ejecución 10 — 20/10/2026 (lista de puntos estilo GeoGebra)

| ID | Prueba | Resultado observado | Estado |
|---|---|---|---|
| CU57 | Aspecto de la lista | Cada fila: columna gris con la bolita, «A = (−4.48, 2.36)» y menú ⋮; los campos se ajustan al ancho del número | Aprobada |
| CU58 | Clic en la bolita de B | B se oculta (bolita vacía, texto gris, sin marcador ni nombre en el plano); la figura sigue completa; otro clic lo muestra | Aprobada |
| CU59 | Arrastrar B mientras está oculto | B no se mueve (los puntos ocultos no se pueden tomar) | Aprobada |
| CU60 | Escribir «-2,5» en la x de A | A.x = −2.5 | Aprobada |
| CU61 | ⋮ → Duplicar en C del triángulo | Se agrega D = C + (1, 1); la figura pasa a polígono de 4 vértices | Aprobada |
| CU62 | ⋮ → Borrar en A | Quedan 3 puntos renombrados A, B, C; la figura pasa a triángulo | Aprobada |
| CU63 | Clic fuera del menú | El menú se cierra | Aprobada |
| CU02 | 375 px con un polígono | Sin desplazamiento horizontal | Aprobada |
| — | Pruebas automáticas (nueva CP27: tipo según la cantidad de puntos) | 39 de 39 aprobadas | Aprobada |

## Ejecución 11 — 20/10/2026 (menú Exportar)

Las descargas se interceptaron durante la prueba para inspeccionar los archivos sin guardarlos.

| ID | Prueba | Resultado observado | Estado |
|---|---|---|---|
| CU64 | Exportar sin figura | No descarga nada; aviso «Primero dibuja o elige una figura» | Aprobada |
| CU65 | Imagen del plano (ejemplo «Composición S → R → T») | `geomatriz-plano_AAAA-MM-DD_HHMM.png`, 3200×2000 px (306 KB), con leyenda y pie con S(0.5, 0.5) → R(45°) → T(4, 3) y la fecha; el aviso de descarga aparece cuando el archivo está listo (~1 s) | Aprobada |
| CU66 | Resumen como imagen | `geomatriz-resumen_….png`, 3200×4024 px (1.3 MB): plano, M1–M3, matriz compuesta, det(M) = 0.25 y tabla de coordenadas | Aprobada |
| CU67 | Informe completo (PDF) | Documento con 6 secciones (plano, figura, transformaciones, matrices, coordenadas, paso a paso), plano incrustado, 4 matrices y los 4 puntos explicados; A′ = (4, 1.586), B′ = (5.414, 3), C′ = (4, 4.414), D′ = (2.586, 3), que coinciden con el cálculo a mano de A′ | Aprobada |
| CU68 | Menú en 375 px | Botones de la barra en 2 × 2; el menú no se sale de la pantalla; sin desplazamiento horizontal | Aprobada |
| CU69 | Guardar como PDF en el navegador real | — | **Pendiente** (requiere el diálogo de impresión del navegador del usuario) |
| — | Pruebas automáticas | 39 de 39 aprobadas | Aprobada |

## Ejecución 12 — 20/10/2026 (corrección: Exportar no respondía después de dibujar)

**Problema reportado por el usuario:** después de dibujar en el plano, el botón Exportar no abría el menú.

**Reproducción:** con un clic real del ratón, tras elegir la herramienta Polígono y colocar 3 puntos, el menú no se abría. Bastaba con cambiar de herramienta (sin dibujar) para que fallara. Las pruebas de la ejecución 11 no lo detectaron porque se hicieron sin cambiar de herramienta.

**Causa:** el código que registra los botones Borrar, Guía, Ajustes y Exportar había quedado, por error de edición, dentro de la función que se ejecuta en cada cambio de herramienta (`onToolChange` en main.js). Cada cambio volvía a registrar los botones; con dos registros, Exportar abría y cerraba el menú en el mismo clic.

| ID | Prueba | Resultado observado | Estado |
|---|---|---|---|
| CU70 | Cambiar 6 veces de herramienta | 0 registros nuevos de eventos (antes: 13 por cada cambio) | Aprobada |
| CU71 | Polígono con 3 puntos (sin cerrar) y clic real en Exportar | El menú se abre | Aprobada |
| CU72 | Desde ese estado: imagen del plano, resumen e informe | Se generan los 3 (el informe con los 3 puntos explicados) | Aprobada |
| CU73 | Guía, Ajustes y Borrar tras varios cambios de herramienta | Abren / borran una sola vez, sin errores en la consola | Aprobada |
| — | Pruebas automáticas | 39 de 39 aprobadas | Aprobada |

## Ejecución 13 — 20/10/2026 (revisión final de estructura y código)

**Revisión estática**
- Sintaxis: los 13 archivos JavaScript pasan `node --check`.
- HTML: sin IDs duplicados; todas las etiquetas `for`, `aria-labelledby`, `aria-controls` y los `getElementById` del código apuntan a elementos existentes.
- CSS: se eliminaron 8 clases y 1 variable que ya no se usaban (restos de versiones anteriores).
- JavaScript: se eliminaron 3 funciones sin uso (`Matrix.clone`, `getTool`, `hasErrors`); se actualizaron comentarios y textos de la Guía que describían la interfaz anterior.

**Errores encontrados y corregidos en la revisión**
- Con el pivote en el centroide, la etiqueta de la tarjeta («R(90°) respecto a (x, y)») no se actualizaba al mover los puntos (el plano y las matrices sí). Ahora se refresca en cada cuadro.
- Escribir un valor válido en cualquier campo borraba el aviso que estuviera visible aunque no fuera un error. Ahora solo se borran los avisos de validación.
- La tecla Esc cambiaba de herramienta aunque solo se quisiera cerrar la Guía o los Ajustes. Ahora, con una ventana abierta, Esc solo la cierra.
- La medición de rendimiento no dibujaba la figura transformada (le faltaba un dato añadido después), por lo que daba tiempos menores a los reales.
- `docs/diseno.md` listaba un módulo `clipping.js` que no existe; se aclaró que el recorte quedó como mejora futura y se agregó `export.js`.

**Prueba final**

| ID | Prueba | Resultado observado | Estado |
|---|---|---|---|
| — | Pruebas automáticas | 39 de 39 aprobadas | Aprobada |
| CR01–CR03 | Rendimiento (100 renderizados, 10 transformaciones) | 3 vértices: 0.442 ms · 12 vértices: 0.489 ms · 100 vértices: 2.412 ms (≥ 415 cuadros/s) | Aprobada |
| CU74 | Recorrido completo: inicio vacío → polígono (0,0), (3,0), (0,3) → R(90°) respecto al centroide | A′ = (2, 0), B′ = (2, 3), C′ = (−1, 0), que coinciden con el cálculo a mano | Aprobada |
| CU75 | Mover B a (6, 0) con ese pivote | La etiqueta pasa a «R(90°) respecto a (2, 1)» (centroide nuevo) | Aprobada |
| CU76 | Ocultar / mostrar, Esc con la Guía abierta, Esc sin ventanas | Correctos | Aprobada |
| CU77 | Exportar tras cambiar varias veces de herramienta | El menú abre y descarga la imagen | Aprobada |
| CU78 | Valor válido con un aviso informativo visible / valor inválido y su corrección | El aviso informativo se respeta; el error aparece y desaparece al corregir | Aprobada |
| CU79 | Reiniciar todo | Plano vacío, sin transformaciones | Aprobada |
| CU02 | 1440, 768 y 375 px | Sin desplazamiento horizontal | Aprobada |
| — | Errores en la consola durante todo el recorrido | Ninguno | Aprobada |

**Pendientes que requieren al equipo:** abrir con doble clic (CU03), probar en el navegador del Lab. 05 (CU08), «Guardar como PDF» en el diálogo real de impresión (CU69) y el pellizco en un celular real.

### Errores encontrados y corregidos

| N.º | Error | Causa | Corrección |
|---|---|---|---|
| 1 | Desplazamiento horizontal en pantallas angostas | Los elementos de la lista de la explicación (grid) no se encogían por debajo del ancho de su bloque `<pre>` | `min-width: 0` en los hijos de los contenedores grid |
| 2 | Los campos px/py del pivote se veían aunque el pivote fuera «Origen» | La regla `display: grid` anulaba el atributo `hidden` | Regla global `[hidden] { display: none !important; }` |
| 3 | En el celular la figura transformada quedaba fuera de la vista |
| 12 | La etiqueta del pivote en el centroide no se actualizaba al mover puntos; un valor válido borraba cualquier aviso; Esc cambiaba de herramienta con una ventana abierta | Ver la ejecución 13 | Ver la ejecución 13 |
| 11 | Exportar no abría su menú después de cambiar de herramienta (y Borrar, Guía y Ajustes quedaban registrados varias veces) | El registro de esos botones quedó dentro de `onToolChange`, que se ejecuta en cada cambio de herramienta | Se movió el registro fuera, para que se haga una sola vez al iniciar |
| 10 | En el celular, el botón Exportar desbordaba la barra y su menú salía de la pantalla | Cuatro botones en una fila no caben en 375 px | Botones en una cuadrícula de 2 × 2 y menú anclado a la izquierda |
| 9 | El aviso «Imagen descargada» aparecía antes de que el archivo estuviera listo | La imagen se genera de forma asíncrona (~1 s) | Se muestra «Generando…» y la confirmación llega cuando el archivo está listo |
| 8 | Sin transformaciones se veían A′, B′, C′ encima de A, B, C | La figura transformada (idéntica a la original cuando M = I) se dibujaba igual | Si no hay transformaciones activas, el resultado no se dibuja ni aparece en la leyenda |
| 7 | El lienzo cambiaba de tamaño al aparecer un aviso, y su tamaño interno no coincidía con el visible | El aviso ocupaba espacio debajo del plano, y el tamaño del búfer del lienzo influía en el alto de su contenedor | Los avisos flotan sobre el plano; el lienzo se posiciona de forma absoluta dentro de su contenedor |
| 6 | Al bajar a Resultados, el plano los tapaba | El plano tenía `position: sticky`, pensado para la distribución anterior en la que los resultados estaban al costado | Se quitó el posicionamiento fijo del plano |
| 5 | El mensaje «Figura terminada» desaparecía | Al refrescar el editor de vértices se limpiaba la barra de estado después de escribir el mensaje | Se refresca primero el editor y luego se escribe el mensaje |
| 4 | La conversión píxel ↔ plano tenía un desfase de 1 px | El tamaño del lienzo se medía en su contenedor, que incluye un borde de 1 px por lado, y además se redondeaba a píxeles enteros | Se mide el propio lienzo con `getBoundingClientRect()` y se conservan los decimales; solo el búfer interno se redondea | El zoom fijo de 40 px por unidad solo mostraba ±4 unidades en 375 px | Zoom automático según el tamaño del lienzo (al menos ±8 unidades); se desactiva si el usuario usa + o − |
