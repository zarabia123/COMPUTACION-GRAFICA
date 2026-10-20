# GeoMatriz 2D — Laboratorio Interactivo de Geometría 2D

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

- El programa empieza con el plano vacío; se dibuja con las herramientas o se elige una figura predefinida.
- Plano cartesiano con cuadrícula fina, ejes numerados y coordenadas de un punto al acercar el puntero.
- Navegación como en GeoGebra: arrastrar para mover el plano, rueda o pellizco para el zoom hacia el cursor.
- Herramientas Mover, Punto, Segmento, Polígono, Desplazar vista y Borrar.
- Figuras: punto, segmento, triángulo, cuadrado, rectángulo y polígono de hasta 12 vértices.
- Lista de puntos al estilo de GeoGebra: coordenadas editables, bolita para mostrar u ocultar cada punto y menú ⋮ para duplicarlo o borrarlo.
- Vértices editables con el teclado, arrastrándolos en el plano o colocándolos con clics, con ajuste opcional a la cuadrícula.
- Traslación T(tx, ty), rotación R(θ) y escalado S(sx, sy); rotación y escalado respecto al origen, al centroide o a un punto personalizado.
- Lista ordenable de hasta 10 transformaciones, que se pueden activar o desactivar.
- Matrices 3×3 de cada transformación, matriz compuesta M y su determinante.
- Tabla de coordenadas homogéneas originales y transformadas, con las longitudes de los lados y el área (Área′ = |det(M)| · Área).
- Explicación paso a paso del cálculo de un vértice, por dos caminos que deben coincidir.
- Pasos intermedios y comparación con el orden inverso (para mostrar que T·R ≠ R·T).
- Ejemplos listos para clase, ventana de Guía, Ajustes de la vista y botón Reiniciar todo.
- Validación de entradas: no se aceptan valores vacíos, texto, escala 0 ni valores fuera de rango, y se explica el motivo.
- Exportar: imagen del plano (PNG), informe completo con matrices y pasos de cada punto (PDF, con «Guardar como PDF» del navegador) y resumen como imagen (PNG).
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
│       ├── ui/              validation.js, controls.js, panels.js, explanations.js, canvas-input.js, export.js
│       └── main.js          arranque y ciclo de actualización
├── tests/                   test-runner.html, math.test.js
├── assets/capturas/         capturas reales del programa
└── docs/                    planificación, diseño, pruebas, manuales, informe
```

## Tecnologías

HTML5, CSS3, JavaScript (ES2015+, scripts clásicos sin módulos para permitir la apertura con doble clic) y la API Canvas 2D del navegador. **No se usan bibliotecas externas**: todas las matrices y transformaciones las programa el grupo.

## Video de demostración

Pendiente de grabación (guion en `docs/entrega/5_Video_Guion.pdf`). Enlace: [por completar]

## Documentos de entrega

En `docs/entrega/` están los documentos de la entrega, en PDF y en su versión editable (Word / PowerPoint):

| N.º | Documento |
|---|---|
| 2 | `2_Informe.pdf` — informe técnico (11 partes) |
| 3 | `3_Manual_Usuario.pdf` |
| 4 | `4_Manual_Tecnico.pdf` |
| 5 | `5_Video_Guion.pdf` — guion para grabar el video |
| 6 | `6_Presentacion.pptx` — diapositivas de la sustentación |
| 7 | `7_Evidencias_RSU.pdf` — formatos para registrar la actividad |
| 8 | `8_Ficha_Proyecto.pdf` — Anexo A (para la firma del docente) |
| 9 | `9_Declaracion_IA.pdf` |

El estado de cada ítem está en `docs/entrega/LISTA_DE_COTEJO.md`. Las capturas reales del programa están en `assets/capturas/` y los diagramas en `assets/diagramas/`.

## Uso de inteligencia artificial

Se usó un asistente de IA (Claude, de Anthropic) como apoyo en la planificación, el diseño, la escritura del código y la verificación. La declaración completa estará en `docs/`. Los integrantes revisan, comprenden y pueden explicar todo el código.

## Licencia

Proyecto académico. Uso educativo.
