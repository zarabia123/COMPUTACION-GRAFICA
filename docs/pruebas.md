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

### Errores encontrados y corregidos

| N.º | Error | Causa | Corrección |
|---|---|---|---|
| 1 | Desplazamiento horizontal en pantallas angostas | Los elementos de la lista de la explicación (grid) no se encogían por debajo del ancho de su bloque `<pre>` | `min-width: 0` en los hijos de los contenedores grid |
| 2 | Los campos px/py del pivote se veían aunque el pivote fuera «Origen» | La regla `display: grid` anulaba el atributo `hidden` | Regla global `[hidden] { display: none !important; }` |
| 3 | En el celular la figura transformada quedaba fuera de la vista |
| 5 | El mensaje «Figura terminada» desaparecía | Al refrescar el editor de vértices se limpiaba la barra de estado después de escribir el mensaje | Se refresca primero el editor y luego se escribe el mensaje |
| 4 | La conversión píxel ↔ plano tenía un desfase de 1 px | El tamaño del lienzo se medía en su contenedor, que incluye un borde de 1 px por lado, y además se redondeaba a píxeles enteros | Se mide el propio lienzo con `getBoundingClientRect()` y se conservan los decimales; solo el búfer interno se redondea | El zoom fijo de 40 px por unidad solo mostraba ±4 unidades en 375 px | Zoom automático según el tamaño del lienzo (al menos ±8 unidades); se desactiva si el usuario usa + o − |
