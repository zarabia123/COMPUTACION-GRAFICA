# Planificación del proyecto — Fase 1

**Proyecto:** Laboratorio Interactivo de Geometría 2D
**Asignatura:** Computación Gráfica (IIAD65) · EPIS · UNAJMA · 2026-II
**Docente:** Mtro. Jhamer Anderson Rojas Silva
**Grupo:** 3 · **Tema:** N.º 3 — Laboratorio de geometría con matrices visibles
**Fuente de requisitos:** *Indicaciones para la Presentación del Proyecto* (documento del docente).

## 1. Resumen

Aplicación web educativa dirigida a **docentes de matemática** que permite construir figuras en un plano cartesiano y aplicarles traslación, rotación y escalado mediante matrices homogéneas de 3×3, mostrando simultáneamente la figura, cada matriz, la matriz compuesta y las coordenadas antes y después de cada transformación.

## 2. Decisiones tomadas (13/10/2026)

| Decisión | Elección | Motivo |
|---|---|---|
| Ubicación del repositorio | `COMP_GRAFICA PROYECT/`, migrando y mejorando el prototipo previo | Partir de una base que ya funciona |
| Forma de ejecución | Doble clic en `src/index.html` (scripts clásicos, sin módulos ES) | Debe ejecutarse en el Lab. 05 sin internet ni instalaciones |
| Tecnología | HTML5, CSS3, JavaScript, Canvas 2D, sin dependencias | Los algoritmos deben ser programados por el grupo |
| Recorte (clipping) | Extra opcional al final | No es técnica exigida para el tema 3 |
| Roles | Confirmados (sección 6) | — |

## 3. Requisitos

### Funcionales
| ID | Requisito | Prioridad |
|---|---|---|
| RF01 | Plano cartesiano con cuadrícula, ejes y numeración | Obligatorio |
| RF02 | Figuras: punto, segmento, triángulo, cuadrado, rectángulo y polígono del usuario | Obligatorio |
| RF03 | Traslación, rotación y escalado programados por el grupo | Obligatorio |
| RF04 | Matrices homogéneas 3×3 visibles: individuales y compuesta M | Obligatorio |
| RF05 | Coordenadas homogéneas y tabla de vértices antes/después | Obligatorio |
| RF06 | Composición en orden editable y demostración de T·R ≠ R·T | Obligatorio |
| RF07 | Rotación y escalado respecto a un punto pivote | Obligatorio |
| RF08 | Controles interactivos y reinicio de la escena | Obligatorio |
| RF09 | Explicación paso a paso de fórmulas y cálculos | Obligatorio |
| RF10 | Validación de entradas con mensajes claros | Obligatorio |
| RF11 | Recorte de polígonos (Sutherland–Hodgman) | Extra |

### No funcionales
| ID | Requisito |
|---|---|
| RNF01 | Se ejecuta en el Lab. 05 sin instalación ni internet |
| RNF02 | Interfaz adaptable a computadora, tableta y celular |
| RNF03 | Código modular y comentado; lógica separada del renderizado |
| RNF04 | Repositorio con README y commits de los tres integrantes |
| RNF05 | Medición de rendimiento (tiempo de ejecución o FPS) |
| RNF06 | Recursos de terceros citados con autor, fuente y licencia |

## 4. Entregables (carpeta `IIAD65_G03_U1.zip`)

1. `1_Codigo/` — código y enlace al repositorio.
2. `2_Informe.pdf` — 11 partes (avance al 50 %: 1–8 completas, 9–11 parciales).
3. `3_Manual_Usuario.pdf` — 6 a 12 páginas.
4. `4_Manual_Tecnico.pdf` — 6 a 12 páginas, con diagrama de módulos y del pipeline gráfico.
5. `5_Video_Demostracion.mp4` o enlace — 3 a 5 minutos.
6. `6_Presentacion.pptx` — 8 a 12 diapositivas.
7. `7_Evidencias_RSU.pdf` — ficha, fotos, asistentes, constancia y párrafo de ética.
8. `8_Ficha_Proyecto.pdf` — Anexo A firmado por el docente.
9. `9_Declaracion_IA.pdf` — una página.

**Plazo:** semana 8 (21/10 al 27/10/2026). Retraso: −2 puntos por día hábil.

## 5. Cronograma

| Fechas | Fase | Producto |
|---|---|---|
| 13–14/10 | 1–2 Análisis y diseño | Planificación, diseño, Anexo A, contacto RSU |
| 15–18/10 | 3 Implementación | Aplicación funcional por etapas |
| 18–19/10 | 4 Pruebas | Pruebas unitarias, manuales, rendimiento, prueba en Lab. 05 |
| 19–22/10 | 6 RSU | Actividad con docentes de matemática y evidencias reales |
| 19–23/10 | 5 Documentación | Informe, manuales, declaración de IA |
| 23–25/10 | 7 Entrega | Video, diapositivas, lista de cotejo, zip |

## 6. Roles

| Integrante | Rol | Explica en la sustentación |
|---|---|---|
| Oscco Zarabia Rider Gilmar | Coordinación, renderer y plano, repositorio, informe | Pipeline gráfico; conversión mundo ↔ pantalla |
| Vargas Alhuay Hernan | Núcleo matemático, composición, pivote, pruebas | Matrices T, R, S; coordenadas homogéneas; no conmutatividad |
| Chilingano Lazo Albert | Interfaz, validación, explicaciones, manual de usuario, video | Uso del programa; manejo de errores; diseño adaptable |

Todos deben comprender y poder explicar cualquier parte del proyecto, y registrar commits propios.

## 7. Pendientes que no bloquean el desarrollo

- [ ] Beneficiario RSU real: institución, contacto y fecha.
- [ ] Anexo A completado y firmado por el docente.
- [ ] Navegador disponible en el Lab. 05.
- [ ] Fecha exacta de entrega dentro de la semana 8.
- [ ] Cuenta de GitHub propietaria del repositorio.

## 8. Criterios de completitud

Lista de cotejo del Anexo C de la guía, más: casos calculados a mano para cada transformación, prueba de no conmutatividad, manejo de entradas inválidas, consola sin errores y diseño usable en 375, 768 y 1280 px.
