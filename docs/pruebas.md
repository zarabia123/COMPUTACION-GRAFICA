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

### Errores encontrados y corregidos

| N.º | Error | Causa | Corrección |
|---|---|---|---|
| 1 | Desplazamiento horizontal en pantallas angostas | Los elementos de la lista de la explicación (grid) no se encogían por debajo del ancho de su bloque `<pre>` | `min-width: 0` en los hijos de los contenedores grid |
| 2 | Los campos px/py del pivote se veían aunque el pivote fuera «Origen» | La regla `display: grid` anulaba el atributo `hidden` | Regla global `[hidden] { display: none !important; }` |
| 3 | En el celular la figura transformada quedaba fuera de la vista | El zoom fijo de 40 px por unidad solo mostraba ±4 unidades en 375 px | Zoom automático según el tamaño del lienzo (al menos ±8 unidades); se desactiva si el usuario usa + o − |
