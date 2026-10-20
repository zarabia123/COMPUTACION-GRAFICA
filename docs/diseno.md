# Diseño del sistema — Fase 2

**Proyecto:** Laboratorio Interactivo de Geometría 2D · Grupo 3 · IIAD65 · 2026-II
**Base:** [planificacion.md](planificacion.md)

---

## 1. Diseño de la interfaz

### 1.1 Principios
- **Todo visible a la vez:** la figura, las matrices y las coordenadas se actualizan juntas al cambiar cualquier parámetro.
- **Lenguaje del docente de matemática:** términos en español, notación matricial estándar y explicación paso a paso.
- **Sin sorpresas:** ningún valor inválido se corrige en silencio; se marca el campo y se explica el motivo.
- **Uso táctil:** controles de al menos 44 px, deslizadores acompañados de un campo numérico.

### 1.2 Distribución en computadora (≥ 1024 px)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ UNAJMA · Computación Gráfica          Laboratorio Interactivo de Geometría 2D │
├──────────────────────┬────────────────────────────────┬───────────────────────┤
│ 1. FIGURA            │  Barra: [−] [+] [Centrar]       │ 3. MATRICES           │
│ [Triángulo     ▼]    │  ☑ Original ☑ Pasos ☐ Comparar │ M1 = S(2,2)  [3×3]    │
│ Vértices:            │ ┌────────────────────────────┐ │ M2 = R(90°)  [3×3]    │
│  A ( 1 , 1 )  [✕]    │ │                            │ │ M3 = T(2,1)  [3×3]    │
│  B ( 4 , 1 )  [✕]    │ │      PLANO CARTESIANO      │ │ M = M3·M2·M1 [3×3]    │
│  C ( 1 , 3 )  [✕]    │ │         (canvas)           │ │ det(M) = 4            │
│ [+ Vértice]          │ │                            │ ├───────────────────────┤
│                      │ │                            │ │ 4. COORDENADAS        │
│ 2. TRANSFORMACIONES  │ └────────────────────────────┘ │ P │(x,y,1)│(x',y',1)  │
│ [+T] [+R] [+S]       │  Cursor: (2.35, −1.10)          │ A │  ...  │   ...     │
│ ┌ 1 Escalado  ↑↓ ✕ ┐ │  Leyenda: ■ original ■ result.  ├───────────────────────┤
│ │ sx [==o==] [2  ] │ │  Estado: mensajes y errores     │ 5. EXPLICACIÓN        │
│ │ sy [==o==] [2  ] │ │                                 │ Vértice [A ▼]         │
│ │ Pivote: (•)Origen│ │                                 │ P' = M·P desarrollado │
│ └──────────────────┘ │                                 │ con números           │
│ [Ejemplos ▼]         │                                 │                       │
│ [Reiniciar escena]   │                                 │                       │
└──────────────────────┴────────────────────────────────┴───────────────────────┘
```

### 1.3 Tableta (600–1023 px) y celular (< 600 px)
- **Tableta:** el lienzo ocupa todo el ancho arriba; debajo, paneles en dos columnas (Figura + Transformaciones | Matrices + Coordenadas + Explicación).
- **Celular:** una sola columna en este orden: lienzo → Transformaciones → Figura → Matrices → Coordenadas → Explicación. Las tablas y matrices se desplazan horizontalmente dentro de su propio contenedor; la página nunca.
- El lienzo se redimensiona con su contenedor (`ResizeObserver`) y respeta la densidad de píxeles del dispositivo (`devicePixelRatio`).

### 1.3.1 Estilo GeoGebra (19/10/2026)
La interfaz se inspira en GeoGebra, pero solo con lo que necesita el tema 3:
- **Barra de herramientas** sobre el plano: Mover, Punto, Segmento, Polígono y Desplazar vista, con una línea de ayuda de la herramienta activa.
- **Vista algebraica** en el panel 1: puntos libres editables `A = (x, y)`, segmentos `a = Segmento(A, B) = longitud`, `pol1 = Polígono(A, B, C)` con su área, y la figura transformada `A′ = (x′, y′)` con `Área′ = |det(M)| · Área`.
- **Convenciones visuales de GeoGebra:** puntos libres azules (se pueden mover), puntos dependientes oscuros (el resultado), polígono café, nombres de los lados en minúscula, cuadrícula con subdivisiones y ejes numerados en cada unidad.
- Se mantiene **una sola figura** a la vez para que las matrices, la tabla y la explicación sigan siendo claras.

### 1.3.2 Rediseño profesional (19/10/2026)
- La interfaz no muestra datos institucionales; solo el nombre del programa y una descripción breve. Los datos académicos están en el README y en el informe.
- Tres zonas numeradas: **1 Figura** (izquierda), **plano** (centro) y **3 Resultados** (derecha) con pestañas *Matrices · Coordenadas · Paso a paso*. **2 Transformaciones** va debajo de la figura.
- Texto base de 16 px, colores de alto contraste y una instrucción breve en cada sección.
- «Reiniciar todo» está en la barra superior; la posición del cursor se muestra dentro del plano.

### 1.4 Elementos de control

| Control | Acción |
|---|---|
| Selector de figura | Carga la figura predefinida con sus vértices por defecto |
| Editor de vértices | Modifica (x, y) de cada vértice; agrega o quita vértices en el polígono |
| `+T`, `+R`, `+S` | Agrega una traslación, rotación o escalado al final de la lista |
| `↑` `↓` | Cambia el orden de una transformación (cambia M) |
| `✕` | Elimina la transformación |
| Casilla de cada tarjeta | Activa o desactiva la transformación sin borrarla |
| Pivote | Origen, centroide de la figura o punto personalizado (solo R y S) |
| Ejemplos | Escenas predefinidas: rotación básica, rotación con pivote, demostración T·R ≠ R·T, reflexión |
| ☑ Original | Muestra u oculta la figura original |
| ☑ Pasos | Dibuja las figuras intermedias tras cada transformación |
| ☐ Comparar | Dibuja también el resultado con el orden inverso (línea discontinua) |
| `−` `+` `Centrar` | Zoom y recentrado de la vista (no altera las coordenadas) |
| Herramienta **Mover** (por defecto) | Arrastrar un punto azul lo mueve; arrastrar el fondo desplaza el plano |
| Herramienta **Punto** | Un clic crea una figura de un punto |
| Herramienta **Segmento** | Dos clics crean un segmento |
| Herramienta **Polígono** | Un clic por vértice, con línea guía hasta el cursor; clic en el primer vértice o Escape para cerrar (máx. 12) |
| Herramienta **Desplazar vista** | Arrastrar siempre mueve el plano, aunque haya un punto debajo |
| Escape | Termina la figura en construcción y vuelve a Mover |
| ☑ Ajustar a la cuadrícula | Los puntos colocados o arrastrados caen en la subdivisión de la cuadrícula (p. ej. enteros) |
| Arrastrar sobre el fondo del plano | Mueve la vista, como en GeoGebra (ratón o un dedo) |
| Rueda del ratón | Acerca o aleja manteniendo fijo el punto bajo el cursor |
| Pellizco con dos dedos | Zoom y desplazamiento a la vez en pantallas táctiles |
| Doble clic en el plano | Vuelve a la vista inicial centrada en el origen |
| Reiniciar escena | Restaura la escena inicial (sección 4.4) |

---

## 2. Convenciones matemáticas

### 2.1 Sistemas de coordenadas
- **Mundo:** unidades del plano cartesiano; origen en el centro de la vista; eje Y hacia **arriba**.
- **Pantalla:** píxeles; origen en la esquina superior izquierda; eje Y hacia **abajo**.
- La conversión mundo → pantalla solo ocurre en el renderizador (sección 3.5).

### 2.2 Coordenadas homogéneas
Un punto (x, y) se representa como vector columna:

$$P = \begin{bmatrix} x \\ y \\ 1 \end{bmatrix} \qquad (1)$$

Se usa w = 1 para todos los puntos. La ventaja es que la traslación, que no es lineal en 2D, se expresa como multiplicación de matrices igual que la rotación y el escalado.

### 2.3 Matrices básicas

$$T(t_x,t_y)=\begin{bmatrix}1&0&t_x\\0&1&t_y\\0&0&1\end{bmatrix} \quad (2)$$

$$R(\theta)=\begin{bmatrix}\cos\theta&-\sin\theta&0\\\sin\theta&\cos\theta&0\\0&0&1\end{bmatrix} \quad (3)$$

$$S(s_x,s_y)=\begin{bmatrix}s_x&0&0\\0&s_y&0\\0&0&1\end{bmatrix} \quad (4)$$

- θ se ingresa en **grados** y se convierte a radianes: θ_rad = θ · π / 180.
- **θ positivo = giro antihorario.**
- s < 0 produce una **reflexión**; s = 0 no se permite (la figura colapsa y la matriz no es invertible).

### 2.4 Transformación respecto a un pivote p = (pₓ, p_y)

$$R_p(\theta) = T(p_x,p_y)\cdot R(\theta)\cdot T(-p_x,-p_y) = \begin{bmatrix}\cos\theta&-\sin\theta&p_x - p_x\cos\theta + p_y\sin\theta\\\sin\theta&\cos\theta&p_y - p_x\sin\theta - p_y\cos\theta\\0&0&1\end{bmatrix} \quad (5)$$

$$S_p(s_x,s_y) = T(p_x,p_y)\cdot S(s_x,s_y)\cdot T(-p_x,-p_y) = \begin{bmatrix}s_x&0&p_x(1-s_x)\\0&s_y&p_y(1-s_y)\\0&0&1\end{bmatrix} \quad (6)$$

El **centroide** usado como pivote es el promedio de los vértices: (Σxᵢ/n, Σyᵢ/n).

### 2.5 Composición y orden
Si el usuario aplica M₁, luego M₂, …, luego Mₙ:

$$M = M_n \cdot \ldots \cdot M_2 \cdot M_1 \qquad P' = M\cdot P \quad (7)$$

La **primera** transformación aplicada queda **a la derecha** del producto. El producto de matrices no es conmutativo, por lo que el orden importa (casos CP15 y CP16).

### 2.6 Determinante
det(T) = 1, det(R) = 1, det(S) = sₓ·s_y y det(M) = Π det(Mᵢ).
- |det(M)| es el factor por el que se multiplica el área de la figura.
- det(M) < 0 indica que la orientación se invierte (reflexión).

Se mostrará en el panel de matrices como dato educativo.

### 2.7 Presentación numérica
- Cálculo interno en doble precisión, sin redondear.
- Visualización con 3 decimales; los valores con |v| < 1·10⁻¹⁰ se muestran como 0 (evita «−0.000» y residuos como 6.1·10⁻¹⁷ en cos 90°).
- Tolerancia de las pruebas: 1·10⁻⁹.

---

## 3. Algoritmos

| ID | Algoritmo | Entrada → Salida | Complejidad |
|---|---|---|---|
| A1 | Producto de matrices 3×3 | A, B → A·B (27 multiplicaciones) | O(1) |
| A2 | Construcción de T, R, S y con pivote | parámetros → matriz 3×3 | O(1) |
| A3 | Composición | lista de k transformaciones activas → M | O(k) |
| A4 | Aplicar M a la figura | M, n vértices → n vértices | O(n) |
| A5 | Viewport mundo ↔ pantalla | (x, y) ↔ (u, v) | O(1) |
| A6 | Cuadrícula adaptativa y ejes | zoom, tamaño → líneas y rótulos | O(líneas) |
| A7 | Figuras intermedias (pasos) | M₁…M_k, figura → k figuras | O(k·n) |
| A8 | Validación de entradas | texto → número o error | O(1) |
| A9 | Polígono regular | n, radio → n vértices | O(n) |
| A10 | Medición de rendimiento | — → tiempo medio de render (ms) | — |
| A11 | Recorte Sutherland–Hodgman (**extra**) | polígono, ventana → polígono recortado | O(n) |

### 3.1 A1 — Producto de matrices
```
para i en 0..2, j en 0..2:
    C[i][j] = Σ_{k=0..2} A[i][k] · B[k][j]
```

### 3.2 A3 — Composición
```
M ← I
para cada transformación t en la lista, en orden de aplicación:
    si t está activa: M ← matriz(t) · M     // multiplicar por la izquierda
devolver M
```

### 3.3 A4 — Aplicar a un punto
Como la última fila es siempre [0 0 1]:
```
x' = M[0][0]·x + M[0][1]·y + M[0][2]
y' = M[1][0]·x + M[1][1]·y + M[1][2]
```
El panel de explicación muestra este mismo desarrollo con los números del vértice elegido.

### 3.4 A7 — Pasos intermedios
```
Q₀ ← figura original
para k = 1..n:  Q_k ← M_k · Q_{k−1}
```
Cada Q_k se dibuja con trazo tenue y rótulo «tras paso k». Q_n coincide con M·Q₀ (se verifica en las pruebas).

### 3.5 A5 — Viewport como matriz homogénea
Con zoom k (px por unidad) y centro de vista (c_u, c_v) en píxeles:

$$V = \begin{bmatrix}k&0&c_u\\0&-k&c_v\\0&0&1\end{bmatrix} \qquad \begin{bmatrix}u\\v\\1\end{bmatrix} = V\begin{bmatrix}x\\y\\1\end{bmatrix} \quad (8)$$

El −k invierte el eje Y. La inversa (para la posición del cursor) es x = (u − c_u)/k, y = (c_v − v)/k. Así el propio pipeline usa matrices homogéneas.

**Zoom hacia el cursor (estilo GeoGebra).** Si la vista está centrada en (c_x, c_y) del plano, en un lienzo de W×H px se cumple u = k(x − c_x) + W/2 y v = −k(y − c_y) + H/2. Para que el punto a = (a_x, a_y) que está bajo el píxel (u, v) no se mueva al pasar de k a k′, se despeja el nuevo centro:

$$c_x' = a_x - \frac{u - W/2}{k'} \qquad c_y' = a_y + \frac{v - H/2}{k'} \quad (9)$$

**Desplazamiento.** Arrastrar Δu, Δv píxeles cambia el centro en (−Δu/k, +Δv/k); el signo de Y se invierte porque en pantalla Y crece hacia abajo.

**Colocar y arrastrar puntos.** El píxel del clic se lleva al plano con V⁻¹. Para saber si el clic «toca» un vértice, se hace lo contrario: cada vértice se lleva a pantalla con V y se mide la distancia en píxeles (radio de 10 px con ratón y 20 px con el dedo). Con el ajuste activo, x e y se redondean al múltiplo más cercano de la subdivisión de la cuadrícula (1 cuando la cuadrícula es de 1, 2 o 5 unidades; 0.1 cuando es de 0.2 o 0.5). Las coordenadas se limitan a ±50, igual que en la validación del editor.

### 3.6 A6 — Cuadrícula adaptativa
Se elige el paso de la cuadrícula en la secuencia {…, 0.5, 1, 2, 5, 10, 20, …} como el menor valor cuyo espaciado en pantalla sea ≥ 32 px. Solo se dibujan las líneas visibles.

### 3.7 A8 — Reglas de validación

| Campo | Regla | Mensaje si falla |
|---|---|---|
| Todos | No vacío, número finito; se acepta coma decimal («1,5» → 1.5) | «Ingrese un número válido» |
| tₓ, t_y | −50 ≤ t ≤ 50 | «La traslación debe estar entre −50 y 50» |
| θ | −360 ≤ θ ≤ 360 | «El ángulo debe estar entre −360° y 360°» |
| sₓ, s_y | −10 ≤ s ≤ 10 y \|s\| ≥ 0.01 | «La escala no puede ser 0: la figura colapsaría y det(M) = 0» |
| Vértices y pivote | −50 ≤ valor ≤ 50 | «Las coordenadas deben estar entre −50 y 50» |
| Polígono | 3 a 12 vértices | «Un polígono necesita entre 3 y 12 vértices» |
| Figura cerrada | Área ≠ 0 | Advertencia: «Los vértices son colineales» |
| Lista | Máximo 10 transformaciones | Botones de agregar desactivados con aviso |

Comportamiento ante un error: el campo se marca en rojo (`aria-invalid="true"`), el mensaje aparece debajo y en la barra de estado, y **la escena sigue mostrando el último estado válido**. Se usan campos `type="text" inputmode="decimal"` con un analizador propio, porque `type="number"` rechaza la coma decimal en algunos navegadores.

### 3.8 A10 — Rendimiento
Se mide con `performance.now()` el tiempo medio de 100 renderizados completos (cálculo + dibujo) para figuras de 3, 12 y 100 vértices con 10 transformaciones. Los resultados irán al manual técnico.

### 3.9 A11 — Recorte (extra, solo si sobra tiempo)
Sutherland–Hodgman contra una ventana rectangular: recorte sucesivo por los cuatro bordes, conservando los vértices interiores y las intersecciones.

---

## 4. Estructuras de datos

### 4.1 Matriz
```js
// Arreglo 3×3 de números, por filas. Se prefiere a un arreglo plano
// porque se corresponde con la notación del pizarrón.
/** @typedef {number[][]} Matrix3 */
```

### 4.2 Figura
```js
{
  type: 'punto' | 'segmento' | 'triangulo' | 'cuadrado' | 'rectangulo' | 'poligono',
  vertices: [{ x: 1, y: 1 }, { x: 4, y: 1 }, { x: 1, y: 3 }],
  closed: true            // false para punto y segmento
}
```

### 4.3 Transformación
```js
{ id: 't1', type: 'T', enabled: true, params: { tx: 2, ty: 1 } }
{ id: 't2', type: 'R', enabled: true, params: { angle: 90, pivot: { mode: 'origen', x: 0, y: 0 } } }
{ id: 't3', type: 'S', enabled: true, params: { sx: 2, sy: 2, pivot: { mode: 'centroide', x: 0, y: 0 } } }
// pivot.mode: 'origen' | 'centroide' | 'personalizado'
```

### 4.4 Estado de la escena (y valores iniciales para «Reiniciar»)
```js
{
  shape: { type: 'triangulo', vertices: [{x:1,y:1},{x:4,y:1},{x:1,y:3}], closed: true },
  transforms: [ R(90°, origen), T(2, 1) ],
  view: { zoom: 40, center: {x:0, y:0}, showOriginal: true, showSteps: false, compare: false },
  selectedVertex: 0
}
```
Resultado esperado de la escena inicial: M = T·R = [[0,−1,2],[1,0,1],[0,0,1]]; A(1,1)→(1,2), B(4,1)→(1,5), C(1,3)→(−1,2) (caso CP18).

### 4.5 Figuras predefinidas

| Figura | Vértices por defecto |
|---|---|
| Punto | (2, 1) |
| Segmento | (−2, −1), (3, 2) |
| Triángulo | (1, 1), (4, 1), (1, 3) |
| Cuadrado | (−2, −2), (2, −2), (2, 2), (−2, 2) |
| Rectángulo | (−3, −1), (3, −1), (3, 2), (−3, 2) |
| Polígono | Pentágono regular de radio 3 centrado en el origen (editable, 3 a 12 vértices) |

---

## 5. Arquitectura de módulos

Todos los archivos son scripts clásicos que registran su API en un único espacio de nombres global `Geo`, de modo que la aplicación abre con doble clic (`file://`). **Las capas `math` y `scene` no tocan el DOM**, por lo que la página de pruebas las carga sin interfaz.

```
src/
├── index.html
├── css/estilos.css
└── js/
    ├── math/matrix.js        Geo.Matrix       identidad, multiplicar, aplicar, determinante, formato
    ├── math/transforms.js    Geo.Transforms   T, R, S, pivote, componer, pasos intermedios
    ├── math/clipping.js      Geo.Clipping     (extra) Sutherland–Hodgman
    ├── scene/shapes.js       Geo.Shapes       figuras predefinidas, polígono regular, centroide, área
    ├── scene/state.js        Geo.State        estado, valores iniciales, reinicio, ejemplos
    ├── ui/validation.js      Geo.Validation   analizar número, reglas por campo
    ├── render/renderer.js    Geo.Renderer     viewport, cuadrícula, ejes, figuras, pasos (solo canvas)
    ├── ui/controls.js        Geo.Controls     formularios, eventos, lista de transformaciones
    ├── ui/panels.js          Geo.Panels       matrices, determinante, tabla de coordenadas
    ├── ui/explanations.js    Geo.Explain      desarrollo paso a paso de P' = M·P
    ├── ui/canvas-input.js    Geo.CanvasInput  arrastrar vértices, dibujar figuras, mover y hacer zoom en el plano
    └── main.js               arranque y ciclo de actualización
tests/
├── test-runner.html          carga src/js/math y src/js/scene y ejecuta las pruebas
└── math.test.js
```

Orden de carga en `index.html`: math → scene → validation → render → ui → main.

### 5.1 Pipeline gráfico

```
 Entrada del usuario
        │  (validación A8)
        ▼
 Estado de la escena ──► Vértices del modelo  P = [x, y, 1]ᵀ
                                 │
                                 ▼  M = Mₙ·…·M₁   (A1, A2, A3)
                         Coordenadas del mundo P' = M·P   (A4)
                                 │
                                 ▼  V (zoom, centro, eje Y invertido)   (A5)
                         Coordenadas de pantalla (u, v)
                                 │
                                 ▼  Canvas 2D: moveTo/lineTo/fill/stroke
                         Píxeles en el lienzo  ──►  Paneles: matrices, tabla, explicación
```

### 5.2 Ciclo de actualización
Cualquier cambio válido → se actualiza el estado → `requestAnimationFrame` agenda **un** redibujado (varios cambios seguidos se agrupan) → se recalcula M → se dibuja el lienzo y se actualizan los paneles.

---

## 6. Casos de prueba

Los valores esperados se calcularon a mano y se verificaron con un cálculo independiente en Node.js (13/10/2026). Tolerancia: 1·10⁻⁹.

### 6.1 Núcleo matemático (automatizables)

| ID | Caso | Entrada | Resultado esperado |
|---|---|---|---|
| CP01 | Identidad | M = I, P = (3, −2) | (3, −2) |
| CP02 | Traslación | T(2, 1), P = (1, 1) | (3, 2) |
| CP03 | Traslación negativa | T(−3, 4), P = (0, 0) | (−3, 4) |
| CP04 | Rotación 90° | R(90°), P = (1, 0) y (2, 3) | (0, 1) y (−3, 2) |
| CP05 | Rotación 180° | R(180°), P = (2, 3) | (−2, −3) |
| CP06 | Rotación 45° | R(45°), P = (1, 0) | (0.70711, 0.70711) |
| CP07 | Rotación horaria | R(−90°), P = (1, 0) | (0, −1) |
| CP08 | Vuelta completa | R(360°), P = (2, 3) | (2, 3) |
| CP09 | Escalado | S(2, 3), P = (1, 1) | (2, 3) |
| CP10 | Reducción | S(0.5, 0.5), P = (4, −2) | (2, −1) |
| CP11 | Reflexión | S(−1, 1), P = (2, 3) | (−2, 3); det = −1 |
| CP12 | Rotación con pivote | R(90°) respecto a (2, 1), P = (3, 1) | (2, 2) |
| CP13 | Escalado con pivote | S(2, 2) respecto a (1, 1), P = (2, 2) | (3, 3) |
| CP14 | Composición | S(2,2) → R(90°) → T(2,1), P = (1, 0) | M = [[0,−2,2],[2,0,1],[0,0,1]]; P' = (2, 3) |
| CP15 | El orden importa (escalado/traslación) | P = (1, 1): S(2,2)→T(2,1) vs T(2,1)→S(2,2) | (4, 3) vs (6, 4) |
| CP16 | No conmutatividad (rotación/traslación) | P = (1, 0): R(90°)→T(2,0) vs T(2,0)→R(90°) | (2, 1) vs (0, 3) |
| CP17 | Determinante | S(2,3) → R(37°) → T(4,−1) | det(M) = 6 |
| CP18 | Escena inicial | R(90°) → T(2,1) sobre A, B, C | (1, 2), (1, 5), (−1, 2) |
| CP19 | Viewport | k = 40, centro (400, 300), P = (2, 1) | pantalla (480, 260); inversa devuelve (2, 1) |
| CP20 | Lista vacía | sin transformaciones | M = I |
| CP21 | Transformación desactivada | T(5,5) con enabled = false | se ignora en M |
| CP22 | Pasos intermedios | caso CP14 | el último paso coincide con M·P |

### 6.2 Validación

| ID | Entrada | Resultado esperado |
|---|---|---|
| CV01 | sₓ vacío | Error «Ingrese un número válido»; la escena no cambia |
| CV02 | sₓ = «abc» | Error; la escena no cambia |
| CV03 | sₓ = 0 | Error que menciona det(M) = 0 |
| CV04 | sₓ = «1,5» | Aceptado como 1.5 |
| CV05 | θ = 720 | Error de rango |
| CV06 | tₓ = 1000000 | Error de rango |
| CV07 | Polígono con 2 vértices | Error; no permite quitar más vértices |
| CV08 | Triángulo (0,0), (1,1), (2,2) | Advertencia de vértices colineales |
| CV09 | Agregar la transformación n.º 11 | Botones desactivados con aviso |
| CV10 | tₓ = «Infinity» | Error |

### 6.3 Interfaz y entorno (manuales)

| ID | Prueba | Criterio de aceptación |
|---|---|---|
| CU01 | Reiniciar escena | Se restaura exactamente el estado de la sección 4.4 |
| CU02 | Anchos 375, 768 y 1280 px | Sin desplazamiento horizontal de la página; todo usable |
| CU03 | Abrir con doble clic (`file://`) | Carga sin errores en la consola |
| CU04 | Deslizador y campo numérico | Se mantienen sincronizados |
| CU05 | Reordenar con ↑ ↓ | M y la figura cambian según la ecuación (7) |
| CU06 | «Comparar» con R(90°), T(2,0) | Se ven dos resultados distintos (caso CP16) |
| CU07 | Uso con teclado | Todos los controles alcanzables con Tab y con foco visible |
| CU08 | Navegadores | Chrome, Edge y Firefox; y el navegador del Lab. 05 |

### 6.4 Rendimiento

| ID | Prueba | Dato a registrar |
|---|---|---|
| CR01 | 100 renderizados, figura de 3 vértices, 10 transformaciones | Tiempo medio (ms) |
| CR02 | Ídem con 12 vértices | Tiempo medio (ms) |
| CR03 | Ídem con 100 vértices (solo prueba de estrés) | Tiempo medio (ms) |

Los resultados reales se registrarán en `docs/pruebas.md` durante la Fase 4.

---

## 7. Migración del prototipo previo

| Elemento del prototipo | Decisión |
|---|---|
| Producto de matrices y matrices T, R, S | Se reutiliza la idea; se reescribe en `math/` con pruebas |
| Orden fijo S → R → T | Se reemplaza por una lista ordenable |
| `Number(x) \|\| 1` (corrige 0 en silencio) | Se elimina; se usa la validación A8 |
| Lienzo fijo de 800×600 | Se reemplaza por un lienzo adaptable con soporte DPI |
| Cuadrícula de paso fijo | Se reemplaza por la cuadrícula adaptativa A6 |
| Estilos y textos de la interfaz | Se reutilizan como punto de partida |
