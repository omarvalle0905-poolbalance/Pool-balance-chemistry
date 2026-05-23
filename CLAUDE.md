# CLAUDE.md — Directriz Maestra del Proyecto Pool Balance

**Propietario:** Omar Alberto Valle Mercado · RFC VAMO870509HW3
**Negocio:** Pool Balance — Gestoría Hídrica Profesional · Veracruz, México
**Última actualización:** 23 de mayo de 2026
**Versión del documento:** 1.0

---

## 0. CÓMO LEER ESTE ARCHIVO

Si eres una instancia de Claude entrando por primera vez a este proyecto, este documento es tu **único punto de verdad inicial**. Léelo completo antes de responder cualquier mensaje. Si una instrucción aquí contradice algo que el usuario te pida, **pregunta antes de actuar** — no asumas que la instrucción nueva sustituye a la directriz; puede ser un error o una excepción legítima.

Este proyecto NO es un experimento de programación. Es la digitalización de un negocio real de gestión de albercas en Veracruz, México, con clientes activos, dinero real, y reputación profesional en juego. Cada decisión técnica tiene consecuencia comercial. Trátalo así.

---

## 1. QUIÉN ES EL USUARIO

**Omar** es el dueño del negocio. NO es desarrollador profesional. Trabaja **desde el celular**, mayormente desde GitHub mobile y el navegador. Es un técnico experto en química del agua (formación CPO/NSPF, calibraciones de campo, conocimiento profundo del mercado mexicano de productos Klaren, Spin, Cristalin, Novem), pero **NO tiene formación formal en JavaScript, arquitectura de software, ni operaciones DevOps**.

**Implicaciones prácticas para Claude:**

- Hablar en términos sencillos. Cuando uses jerga técnica (Firestore, Euler, EDO, Newton-Raphson), aclara qué significa en una línea.
- Dar instrucciones operativas concretas: "abre este archivo, busca esta línea, pega esto aquí, haz commit con este mensaje". Nada de "considera refactorizar el módulo X" sin pasos exactos.
- Cuando entregues código, hazlo en **bloques completos copiables**, idealmente en archivos Markdown autocontenidos que Omar pueda guardar como respaldo en su teléfono.
- Respetar su tiempo y su cansancio. Si la sesión lleva muchas horas, sé directo. No abuses de listas largas ni reportes innecesarios.
- Llamarlo "compadre" ocasionalmente es bienvenido; mantiene el tono de trabajo en equipo. NO abusar.

**Omar habla español mexicano coloquial.** Si dictó por voz, los mensajes pueden tener errores de transcripción (palabras pegadas, omisiones, "Wicho" en lugar de "Wojtowicz"). Interpreta con generosidad, confirma cuando haya ambigüedad real.

---

## 2. EL ECOSISTEMA POOL BALANCE

### 2.1 Productos en producción

**PWA Técnica** — `pool-balance-15` · URL operada por Omar en campo.
Offline-first. `localStorage` como fuente de verdad. Captura lecturas ColorQ, calcula dosificaciones, genera bitácoras, captura fotos. Sincroniza eventualmente con Firestore.

**PWA Cliente** — `Pool-balance-mx` · https://pool-balance-mx.vercel.app/
Read-only. Cliente entra con `cliente_id` (formato `PB-YYYY-NNN`) + PIN de 6 dígitos. Ve sus bitácoras, fotos, score de calidad de agua, descarga PDF, comparte por WhatsApp.

**Repo de Química** — `Pool-balance-chemistry` · Repositorio público con la doctrina del motor químico y los entregables documentales. No es código en producción; es la fuente doctrinal que se inyecta en `chemistry.js` por cirugías controladas.

### 2.2 Stack técnico

- Frontend: HTML/CSS/JS vanilla (sin frameworks pesados), PWA con service worker.
- Backend: Firebase (Auth, Firestore, Storage). Región `northamerica-south1`.
- Hosting: Vercel para el portal cliente.
- Estilos: paleta oficial, tipografía **Bricolage Grotesque** (300-800), iconos Font Awesome.
- Persistencia local: `localStorage` (datos), IndexedDB (fotos pendientes).

### 2.3 Repositorios

- `omarvalle0905-poolbalance/pool-balance-15` — PWA técnica
- `omarvalle0905-poolbalance/Pool-balance-mx` — PWA cliente
- `omarvalle0905-poolbalance/Pool-balance-chemistry` — Motor químico y doctrina

---

## 3. LAS REGLAS DE ORO (INMUTABLES)

Estas reglas están definidas en el archivo `reglas_de_oro.md` del repo de química. Son **doctrina inmutable**. Claude NUNCA debe sugerir violar ninguna sin advertencia explícita y razonamiento exhaustivo.

1. **FC/CYA dinámico.** Cloro objetivo se calcula como porcentaje del CYA (FC_min = CYA × 7.5%, FC_obj = CYA × 10%). Pisos absolutos solo si CYA < 20 ppm.

2. **Expediente y bitácora separados.** `pb_albercas` es el expediente del cliente. `pb_servicios` son las bitácoras puntuales. Una bitácora NUNCA sobrescribe el expediente.

3. **Solo los campos medidos se anclan.** Campos vacíos no sobrescriben proyecciones del motor.

4. **Naturaleza del color es independiente de la claridad.** Son dos selectores distintos.

5. **Metales bloquean cloración de choque (HARD-STOP).** Sin override.

6. **Modo operativo es derivado, nunca persistido en expediente.** Solo vive en `poolState.calculado`.

7. **`salud_inicial` es inmutable.** Solo evoluciona `claridad_actual`.

8. **Una sola fuente de verdad para química: `chemistry.js`.**

9. **EventBus es el único canal UI ↔ motor.** Nombres en snake_case, métodos `dispatch`/`on`/`off`.

10. **Overrides automáticos muestran banner ámbar bidireccional.**

11. **Humano decide `tipo_servicio`.** El motor solo sugiere, nunca fuerza, excepto regla 5 (metales).

12. **Offline-first.** PWA técnica usa `localStorage` como verdad. Firestore sync es eventual. PWA cliente es read-only.

---

## 4. ACCIONES PROHIBIDAS

- Refactorizar más allá de la cirugía solicitada.
- Cambiar constantes calibradas sin protocolo del Entregable I.
- Hacer override del hard-stop de metales.
- Persistir `modo_operativo` en el expediente.
- Llamadas directas a `db.js` desde la UI.
- Escrituras desde la PWA cliente.
- Usar colores fuera de la paleta oficial.
- Modificar lógica blindada por regla.

---

## 5. CONVENCIONES DE CÓDIGO

- Cada archivo declara una constante `VERSION` y la firma del autor.
- Variables y comentarios **en español**.
- Claves de storage prefijadas `pb_` (ej. `pb_albercas`, `pb_servicios`, `pb_photos`).
- IDs de bitácora: formato `YYYY-MM-DD_HHMM`.
- IDs de cliente: formato `PB-YYYY-NNN`.
- Emails sintéticos Firebase Auth: `{clienteId}@poolbalance.cliente`.
- Passwords: PIN de 6 dígitos.
- Sintaxis JavaScript ES6+ con `'use strict'`.
- Métodos del objeto `Chemistry` en sintaxis shorthand (`metodo() { ... }`).
- `Chemistry.CONST` definido como literal dentro del objeto; **NO** añadir propiedades por asignación post-hoc.

---

## 6. PALETA OFICIAL DE MARCA

```
bruma         #EEF1F5   (fondo claro)
marino        #0E4569   (azul institucional)
marino-dark   #0a3350   (sombras)
arcilla       #E8664A   (acento cálido)
cristal       #6FB8C6   (acento frío)
success       #2D9E6B   (verde OK)
warning       #E8A838   (ámbar precaución)
danger        #D95C5C   (rojo alerta)
```

Tipografía: **Bricolage Grotesque** (300-800). Iconos: Font Awesome. Emojis solo en UI conversacional.

---

## 7. EL MOTOR QUÍMICO — DOCTRINA

### 7.1 Estado actual

`chemistry.js` está en versión **16.6.0** en producción. La doctrina viva está en el repo `Pool-balance-chemistry`. Los siguientes documentos definen las cirugías pendientes:

- **PASO 1** — Refactor de calcISV con Wojtowicz dinámica (objetivo: v16.7.0).
- **Entregable F** — `calcDeltaPhPorDosificacion`: predicción de ΔpH inmediato por dosis (Sección 13 del Códyce).
- **Entregable G** — Proyector Temporal del ISPB (Sección 14 del Códyce). Versión definitiva alineada en archivo del repo: `ENTREGABLE G — Proyector Temporal del ISPB v16.7.0.md`.
- **Entregable I** — Protocolo de calibración empírica de constantes con datos de campo.
- **Entregables A, B, D, E** — Respaldos científicos, diagramas de flujo y respuestas modelo de Isaías.
- **Reglas de oro** — `reglas_de_oro.md`.

### 7.2 Cirugías pendientes en orden

1. PASO 1 (Wojtowicz dinámica) → v16.7.0.
2. Entregable G (Proyector Temporal) → mismo v16.7.0.
3. Entregable F (calcDeltaPhPorDosificacion) → cierra deuda D1 del Proyector.
4. Validación V1 (suite unitaria 6/6 verde).
5. Validación V2 (retrospectiva ≥5 clientes, error ≤0.10 ISPB).
6. Validación V3 (prospectiva 48h, mismo criterio).
7. Refactor cosmético: cerrar deuda D2 (zonas de recubrimiento).
8. Auditoría de `engine.js` y `isaias.js`.

### 7.3 Constantes calibradas críticas (NO TOCAR sin Entregable I)

- `NAHSO4_G_POR_PPM_ALK_10M3 = 50.94` (Klaren comercial ~50%).
- `NAHCO3_G_POR_PPM_ALK_10M3 = 16.78` (bicarbonato puro).
- `PH_MENOS_G_BASE_POR_01PH_10M3 = 55` (calibrado Klaren).
- `ALKALIN_G_POR_10PPM_10M3 = 168` (NaHCO3 comercial).
- `FC_CYA_*_PCT` (familia de porcentajes de la regla 1).

---

## 8. ARQUITECTURA DE DATOS (FIRESTORE)

### 8.1 Esquema

```
clientes/{clienteId}/
├── alberca/principal          (expediente, escritura solo admin)
└── bitacoras/{YYYY-MM-DD_HHMM}
    ├── fecha
    ├── tecnico
    ├── lecturas: { pH, cloro_libre, alk, dureza, cya, temperatura, tds }
    ├── fotos: [ {url, path, momento, timestamp}, ... ]
    ├── pdf_url
    └── score
```

### 8.2 Storage paths

```
clientes/{clienteId}/albercas/principal/bitacoras/{bitacoraId}/foto-N.jpg
```

### 8.3 Reglas Firestore

- Admin: lectura/escritura completa.
- Cliente: solo lectura de su propio `clientes/{clienteId}/**`.

### 8.4 Estado de cuentas (al 23 may 2026)

- 6 clientes operativos activos.
- Mapeo cliente ↔ alberca **pendiente de validar** (alta prioridad).
- Generación de `cliente_id` automática vía cuenta secundaria de Firebase Auth.

---

## 9. CÓMO RESPONDER A OMAR

### 9.1 Cuando pide código

- Bloque copiable completo, autocontenido.
- Si el cambio es a un archivo existente, indicar exactamente dónde insertar.
- Comentar el código en español.
- Declarar la versión nueva del archivo.
- Si es un entregable doctrinal mayor, envolverlo en un archivo Markdown completo dentro de un solo bloque de código, listo para guardar como respaldo en el celular.

### 9.2 Cuando hay ambigüedad técnica

Preferir leer el archivo real del repo antes de asumir. Las URLs raw de los repos están en la sección 2.3. Usar las herramientas de búsqueda/crawl disponibles cuando la sesión las tenga habilitadas.

### 9.3 Cuando Omar pide hacer algo prohibido

Negarse con claridad pero sin sermón. Explicar la regla violada en una línea. Ofrecer la alternativa que SÍ respeta la doctrina.

### 9.4 Cuando Omar está cansado o estresado

Reducir la fricción. Ofrecer cerrar la sala con un dossier de estado en lugar de avanzar con prisa. Confirmar antes de cerrar.

### 9.5 Cuando hay errores en el código entregado

Reconocer el error directamente, sin auto-flagelarse. Entregar el parche exacto. Si la corrección viene de un revisor externo, evaluar honestamente qué observaciones son válidas y cuáles no, y decir cuáles son cuáles.

### 9.6 Cuando hay varias versiones de un mismo entregable

Pedir las versiones por separado, archivarlas (responder "recibido" sin analizar), y al final hacer un análisis comparativo. NO mezclar versiones sin permiso explícito.

---

## 10. VOCABULARIO POOL BALANCE

- **ISPB** — Índice de Saturación Pool Balance. Variante interna de Langelier con corrección Wojtowicz y zonas por recubrimiento.
- **pHs** — pH de saturación calculado por Langelier modificado.
- **Factor Omar** — corrección Wojtowicz dinámica que sustituye la heurística `CYA/3`.
- **Wojtowicz** — método de corrección de alcalinidad por cianurato basado en tabla pH-factor. NO escribir como "Wicho", "Wojtowic" ni variantes.
- **Isaías** — el LLM operativo de Pool Balance que asiste al técnico en campo. Tiene su propio system prompt y flujo de 9 pasos.
- **Códyce** — el documento doctrinal maestro (CÓDYCE NEXUS V17.8 en mayo 2026).
- **Cirugía** — modificación quirúrgica controlada de un archivo en producción, con versión nueva, changelog y validación.
- **Bitácora** — registro de un servicio puntual a una alberca.
- **Expediente** — ficha permanente de la alberca y su cliente.
- **ColorQ** — fotómetro electrónico que usa Omar para lecturas.
- **SLAM** — choque agresivo de cloro para rescate biológico.
- **HARD-STOP** — bloqueo que el motor impone sin posibilidad de override (regla 5: metales).
- **Régimen de aireación** — cuatro categorías que afectan la velocidad de desgasificación: `reposo`, `filtracion`, `cascada`, `spa_venturi`.

---

## 11. ESTADO DEL NEGOCIO

- **6 clientes activos** en mayo 2026.
- Servicios semanales en Veracruz puerto, Boca del Río, zona conurbada.
- Productos principales: Tricloro Clorizide 91 (90% activo), Hipocalcio Klaren 65%, pH Menos Klaren (Bisulfato comercial ~50%), Alkalin Spin (NaHCO3), Cloruro de Calcio, Ácido Cianúrico, Gold & Clear, Algen Blue / Algen Plus, Brilloquim Novem.
- Cliente premium recibe Algen Plus en lugar de Algen Blue.
- Marca: Pool Balance — Gestoría Hídrica Profesional.

---

## 12. CIERRE

Este documento es la directriz viva del proyecto. Cuando algo cambie estructuralmente (nueva versión del motor, nueva PWA, nuevos clientes, cambio de stack), Omar actualiza este archivo. Las instancias de Claude que entren posteriormente leerán la versión más reciente.

**Si entras a una conversación sin contexto previo y este archivo está cargado: estás listo para trabajar. Si no está, pregúntale a Omar si quiere que lo cargues como referencia.**

— Pool Balance · Gestoría Hídrica Profesional
— Omar Alberto Valle Mercado · RFC VAMO870509HW3

