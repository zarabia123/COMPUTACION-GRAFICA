# Laboratorio Interactivo de Geometría 2D

Aplicación web educativa para aprender **traslación, rotación y escalado con matrices homogéneas de 3×3**. Muestra al mismo tiempo la figura en el plano cartesiano, cada matriz, la matriz compuesta y las coordenadas de los vértices antes y después de transformar.

Proyecto de la Unidad I de **Computación Gráfica (IIAD65)** — Escuela Profesional de Ingeniería de Sistemas, Universidad Nacional José María Arguedas, semestre 2026-II.
Docente: Mtro. Jhamer Anderson Rojas Silva. Tema N.º 3: *Laboratorio de geometría con matrices visibles*.

## Integrantes (Grupo 3)

| Integrante | Rol |
|---|---|
| Oscco Zarabia Rider Gilmar | Coordinación, renderizado y plano cartesiano, repositorio |
| Vargas Alhuay Hernan | Núcleo matemático, composición de matrices, pruebas |
| Chilingano Lazo Albert | Interfaz, validación, explicaciones, manual de usuario |

## Cómo ejecutar

No requiere instalación, servidor ni conexión a internet.

1. Descarga o clona este repositorio.
2. Abre la carpeta `src/` y haz **doble clic en `index.html`**.
3. Se abre en el navegador (Chrome, Edge o Firefox actualizados).

Para ejecutar las pruebas, abre `tests/test-runner.html` de la misma forma.

## Funcionalidades

- Plano cartesiano con cuadrícula adaptativa, ejes numerados y coordenadas del cursor.
- Figuras: punto, segmento, triángulo, cuadrado, rectángulo y polígono de 3 a 12 vértices, con vértices editables.
- Traslación T(tx, ty), rotación R(θ) y escalado S(sx, sy); rotación y escalado respecto al origen, al centroide o a un punto personalizado.
- Lista ordenable de hasta 10 transformaciones, que se pueden activar o desactivar.
- Matrices 3×3 de cada transformación, matriz compuesta M y su determinante.
- Tabla de coordenadas homogéneas originales y transformadas.
- Explicación paso a paso del cálculo de un vértice, por dos caminos que deben coincidir.
- Pasos intermedios y comparación con el orden inverso (para mostrar que T·R ≠ R·T).
- Ejemplos listos para clase y botón para reiniciar la escena.
- Validación de entradas: no se aceptan valores vacíos, texto, escala 0 ni valores fuera de rango, y se explica el motivo.
- Diseño adaptable a computadora, tableta y celular.

## Convención matemática

- Puntos como vectores columna homogéneos: `P = [x, y, 1]ᵀ`, `P′ = M · P`.
- Ángulo en grados; positivo = antihorario.
- Si se aplica M₁, luego M₂, …, luego Mₙ: `M = Mₙ · … · M₂ · M₁` (la primera aplicada queda a la derecha).
- Pivote: `T(p) · R(θ) · T(−p)`.

Detalle completo en [docs/diseno.md](docs/diseno.md).

## Estructura del repositorio

```
├── README.md
├── src/                     código fuente (abrir src/index.html)
│   ├── index.html
│   ├── css/estilos.css
│   └── js/
│       ├── math/            matrix.js, transforms.js   (sin DOM)
│       ├── scene/           shapes.js, state.js        (sin DOM)
│       ├── render/          renderer.js                (solo Canvas 2D)
│       ├── ui/              validation.js, controls.js, panels.js, explanations.js
│       └── main.js          arranque y ciclo de actualización
├── tests/                   test-runner.html, math.test.js
├── assets/capturas/         capturas reales del programa
└── docs/                    planificación, diseño, pruebas, manuales, informe
```

## Tecnologías

HTML5, CSS3, JavaScript (ES2015+, scripts clásicos sin módulos para permitir la apertura con doble clic) y la API Canvas 2D del navegador. **No se usan bibliotecas externas**: todas las matrices y transformaciones las programa el grupo.

## Video de demostración

Pendiente. El enlace se agregará aquí.

## Uso de inteligencia artificial

Se usó un asistente de IA (Claude, de Anthropic) como apoyo en la planificación, el diseño, la escritura del código y la verificación. La declaración completa estará en `docs/`. Los integrantes revisan, comprenden y pueden explicar todo el código.

## Licencia

Proyecto académico. Uso educativo.
