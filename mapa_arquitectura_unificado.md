# MAPA DE ARQUITECTURA UNIFICADO — POOL BALANCE
## Centro de mando del ecosistema (PWA Técnica + PWA Cliente)
### Autor: Omar Alberto Valle Mercado · VAMO870509HW3
### Última revisión: 2026-05-22 · v2

---

## 1. VISIÓN GENERAL DEL ECOSISTEMA

Pool Balance vive en dos PWAs hermanas conectadas por Firebase. Ambas
son vanilla JS por filosofía (sin frameworks pesados), pero con perfiles
de stack distintos según su rol.

| Repo              | Producción                              | Rol                                                   |
|-------------------|-----------------------------------------|-------------------------------------------------------|
| `pool-balance-15` | (uso interno del técnico)               | **PWA TÉCNICA** — Captura ColorQ, motor químico, dosis |
| `Pool-balance-mx` | https://pool-balance-mx.vercel.app/     | **PWA CLIENTE** — Sitio público + portal de bitácoras  |

El puente es Firebase: Auth + Firestore + Storage. La Técnica empuja,
la Cliente lee. Ver sección 4.

---

## 2. REPOSITORIO TÉCNICO — `pool-balance-15`

### 2.1 Estructura

```
pool-balance-15/
├── index.html              UI principal (declara V16.7.1), estilos inline, arranque
├── manifest.json           Configuración PWA (theme_color #0E4569)
├── sw.js                   Service worker (cache offline)
├── images/                 Assets visuales
└── js/
    ├── app.js              Director de UI
    ├── bitacora.js         Captura de eventos (puente mundo real ↔ digital)
    ├── calculadoras.js     Herramientas auxiliares
    ├── chemistry.js        Motor químico puro (librería)
    ├── clima.js            OpenWeather API
    ├── db.js               Persistencia local (única capa que toca localStorage)
    ├── engine.js           Orquestador del state (único que muta poolState)
    ├── eventBus.js         Canal pub/sub entre módulos
    ├── isaias.js           Agente cognitivo + UI (multi-selector de IA)
    ├── solar.js            Radiación UV + sombra física
    ├── firestore-sync.js   Puente a Firestore (cola offline, mapeo schema)
    ├── photo-queue.js      Compresión + IndexedDB + upload a Storage
    └── photo-ui.js         UI de captura de fotos en bitácora
```

### 2.2 Versiones vivas (declaradas en el código al 2026-05-22)

| Archivo              | Versión declarada |
|----------------------|-------------------|
| `index.html` (sistema) | V16.7.1           |
| `chemistry.js`       | V16.5.3           |
| `engine.js`          | V16.4.5           |
| `isaias.js`          | V16.7.3           |
| `bitacora.js`        | V17.2.3           |
| `calculadoras.js`    | V15.2.0           |
| `db.js`              | (declarada en `DB_VERSION`) |
| `firestore-sync.js`  | V1.0.3            |
| `photo-queue.js`     | V1.0.1            |
| `photo-ui.js`        | V1.0.2            |

Cualquier discrepancia entre lo que dice el header del archivo y lo que
dice la Gema o algún dosier viejo, **gana el header del archivo**. La
verdad vive en el código.

### 2.3 Rol de cada archivo

**chemistry.js** — Librería pura. Recibe datos, devuelve datos. SIN estado,
SIN DOM, SIN localStorage. Aquí viven fórmulas físico-químicas, tablas de
umbrales, cálculo de dosis, evaluación de agua, salud general. Funciones
clave: `getUmbralesClorOperativos`, `evaluarAgua`, `calcSaludGeneral`,
`calcDosificacion`, `calcDegradacionCloro`, `calcFactorRugosidad`. Constantes
calibradas a producto Klaren (no se modifican).

**engine.js** — Único módulo que muta `poolState`. Orquesta el flujo de
datos. Aquí viven proyecciones temporales (`proyectarEstadoActual`),
recálculos por evento (`recalcularTrasEvento`), gestión de timestamps,
anclaje de diagnósticos, cálculo de `modo_operativo`. Delega toda química
a chemistry.js. Versión en const `ENGINE_VERSION`. API pública:
`calcularModoOperativo`, `proyectarEstadoActual({forzar})`, `TIPOS_EVENTO`.

**isaias.js** — Módulo UI/cognitivo. Lee state, NO lo modifica. Agente
cognitivo con motor multi-selector de agentes IA (Gemini, OpenRouter,
DeepSeek). Aquí vive el árbol de prioridades de recomendaciones, HARD-STOP
de metales (Regla #5), generación de mensajes para el técnico. Funciones
clave: `_calcularDosisAlberca`, `_buildSystemPrompt`, `_renderPanelIsaias`,
`actualizarClaridadDesdeBitacora`.

**bitacora.js** — Puente entre el mundo exterior y el mundo digital.
Captura mediciones ColorQ, eventos de servicio, dosificaciones,
observaciones. Es donde se ancla la realidad al gemelo. Funciones clave:
`_anclarDiagnostico`, `_getUmbralesDosisActuales`. Emite eventos al
EventBus para que engine.js recalcule. Declara `TIPOS_SERVICIO`,
`NIVELES_CLARIDAD`, `TIPOS_ALGA`, `NATURALEZAS_COLOR`, `OLORES`,
`NIVELES_VASO`, `FUENTES_AGUA`.

**app.js** — Director de UI. Coordina renderizado del dashboard,
navegación entre vistas, banners, historial de bitácoras, chips de
alberca. Maneja import/export de respaldo JSON. Lee state, NO lo modifica.

**clima.js** — Consume OpenWeather (API key). Contempla sombra de bardas
y entorno físico. Alimenta predicciones del gemelo digital. Riesgo
conocido y aceptado: API key expuesta en cliente (modelo offline-first
sin backend propio).

**solar.js** — Calcula radiación UV efectiva considerando sombra física,
albedo del recubrimiento, y degradación de cloro por sol.

**db.js** — ÚNICA capa que toca `localStorage` en la PWA técnica. Storage
keys: `pb_albercas`, `pb_servicios`, `pb_isaias_estado`,
`pb_isaias_observaciones`, `pb_isaias_identidad`, `pb_inventario`,
`pb_lecciones`, `pb_pool_states`. APIs: `saveServicio`,
`getUltimoServicio`, `calcularAlbedoAutomatico`. Tablas congeladas:
`DICCIONARIO_ALBEDO` (8 materiales × 7 colores), `RUGOSIDADES_VALIDAS`.

**eventBus.js** — Canal pub/sub. ÚNICO puente entre módulos UI y motor.
API canónica: `dispatch` / `on` / `off` / `listenerCount` / `reset`.

**firestore-sync.js** — Puente Firestore. Maneja login admin persistente,
app Firebase secundaria para crear usuarios cliente sin romper la sesión
del admin, generación automática de `cliente_id` (`PB-YYYY-NNN`), PIN de
6 dígitos, modal de credenciales con botón WhatsApp pre-formateado, cola
offline en localStorage, mapeo schema técnico → schema cliente. IDs únicos
por hora (`YYYY-MM-DD_HHMM`).

**photo-queue.js** — Pipeline de fotos: compresión automática a 800 px JPEG
@ 0.75 calidad (de ~3 MB a ~45-200 KB), almacenamiento offline en
**IndexedDB** (`pb_photos` / `pending_photos`), subida a Firebase Storage en
`clientes/{clienteId}/albercas/principal/bitacoras/{bitacoraId}/foto-N.jpg`.

**photo-ui.js** — UI de captura de fotos en la bitácora. Lee `poolId`
directo del selector `#bit-alberca`.

**index.html** — UI principal. Estructura del dashboard, estilos inline
en bloque `<style>` (pendiente de cirugía estética para aplicar paleta
oficial). Bloques clave de bitácora: 3 (Salud del Agua), 5 (Estado
Hidráulico), 6 (Agua de Llenado). Botón ⚓ Anclar Diagnóstico.

**manifest.json** — `name: "Pool Balance"`, `theme_color: "#0E4569"`,
`background_color: "#0E4569"`. Ya alineado con paleta marino.

**sw.js** — Service worker para funcionalidad offline-first.

### 2.4 Diagrama de comunicación interno (PWA Técnica)

```
   ┌──────────────────────────────────────────┐
   │            index.html (UI)               │
   └────┬───────────────┬────────────┬────────┘
        │               │            │
   ┌────▼────┐    ┌────▼─────┐  ┌──▼─────────┐
   │bitacora │    │ isaias   │  │ photo-ui   │
   │ (captura)│   │(chat/dash)│  │ (fotos)   │
   └────┬────┘    └────┬─────┘  └──┬─────────┘
        │              │           │
        └──────┬───────┘           │
               │ EventBus          │
               │                   │
        ┌──────▼──────┐            │
        │  engine.js  │            │
        │(orquestador)│            │
        └──────┬──────┘            │
               │                   │
   ┌───────────┼───────────┐       │
   │           │           │       │
 ┌─▼──────┐ ┌──▼────┐ ┌────▼───┐   │
 │chemistry│ │solar │ │ clima  │   │
 └────────┘ └──────┘ └────────┘    │
               │                   │
        ┌──────▼──────┐    ┌───────▼────────┐
        │   db.js     │    │ photo-queue.js │
        │(localStorage)│   │  (IndexedDB)   │
        └──────┬──────┘    └────────┬───────┘
               │                    │
               └────────┬───────────┘
                        │
                ┌───────▼──────────┐
                │ firestore-sync.js│
                │  (puente cloud)  │
                └───────┬──────────┘
                        │
                     ↓ Firebase
```

---

## 3. REPOSITORIO CLIENTE — `Pool-balance-mx`

### 3.1 Estructura (inferida por inspección de archivos vinculados)

```
Pool-balance-mx/
├── index.html              SPA shell, declara tailwind.config con paleta
├── manifest.json           Configuración PWA
├── sw.js                   Service worker
├── data/
│   └── config.js           APP_CONFIG: precios, paquetes, podcast, hero, SEO, portal
├── css/
│   └── components.css      Variables CSS (--color-marino, --color-cristal, …),
│                           tarjetas, modales, photo-gallery, lightbox, WhatsApp FAB
├── js/
│   ├── firebase/
│   │   ├── firebase.js     Init de Auth + Firestore + Storage (CDN dinámico)
│   │   ├── auth.js         Login con email sintético + PIN, modo demo
│   │   ├── firestore.js    (servicio Firestore — confirmar nombre exacto)
│   │   └── pdf.js          Generador de PDF con jsPDF (header marino, score, lecturas)
│   └── views/
│       ├── home.js         (probable — confirmar)
│       ├── servicios.js    (probable — confirmar)
│       ├── podcast.js      (probable — confirmar)
│       ├── portal.js       Login + Dashboard del cliente, Firestore listener
│       └── bitacora-detalle.js   Vista de bitácora con galería, score, lightbox, WhatsApp
└── images/, assets/        Logos, iconos PWA
```

Nota: lo confirmado por inspección directa es `index.html`, `manifest.json`,
`data/config.js`, `css/components.css`, `js/firebase/firebase.js`,
`js/firebase/auth.js`, `js/firebase/pdf.js`, `js/views/portal.js`,
`js/views/bitacora-detalle.js`. El resto del árbol se infiere del
contenido de `data/config.js` (que define vistas Home, Servicios, Portal,
Podcast). Cuando se abra una cirugía en este repo, confirmar el árbol real.

### 3.2 Versiones vivas (PWA Cliente)

| Archivo                       | Versión declarada |
|-------------------------------|-------------------|
| `data/config.js`              | 1.0.0             |
| `js/views/bitacora-detalle.js`| v1.0.1            |

Los demás archivos no declaran header con `const VERSION`. Pendiente
estandarizar el versionado en este repo (ver sección 11).

### 3.3 Stack visual

- **Tailwind CSS** vía CDN (`cdn.tailwindcss.com`), con `tailwind.config`
  inline que define la paleta oficial (sección 5 de las Reglas).
- **Bricolage Grotesque** desde Google Fonts.
- **Font Awesome** para iconografía estructural.
- CSS modular en `css/components.css` con variables CSS y radios
  (`--radius-2xl`, `--radius-xl`, etc.), animaciones (`fadeIn`,
  `fadeInScale`) y patrón de componentes (cards, modals, photo-gallery,
  badges).
- Lightbox de fotos con navegación prev/next y contador.
- WhatsApp FAB (Floating Action Button) en mobile.

### 3.4 Rol de cada archivo

**index.html** — SPA shell. Declara meta tags PWA, configuración Tailwind
inline, scripts de Firebase como ES modules.

**data/config.js** — Archivo único editable para el cliente (Omar) que
contiene textos, precios, paquetes, episodios de podcast, mock de datos
del portal. Comentado para edición sin ayuda técnica.

**css/components.css** — Variables CSS de paleta, sombras, radios,
transiciones, y componentes (cards, modals, badges, photo-thumb,
photo-modal, whatsapp-fab, etc.).

**js/firebase/firebase.js** — Inicializa Firebase con `firebaseConfig`,
expone `window.FB` (app, auth, db, storage) y `window.FS` (helpers
Firestore). Carga dinámica de módulos desde la CDN de Google.

**js/firebase/auth.js** — `AuthService` con login por ID cliente + PIN,
convertido internamente a email sintético (`{id}@poolbalance.cliente`).
Modo demo activo si Firebase no está disponible.

**js/firebase/pdf.js** — Generador de PDF con jsPDF. Header marino con
nombre empresa, fecha, técnico, ID bitácora. Score visual del agua,
sección de lecturas, fotos.

**js/views/portal.js** — Pantalla A (Login) y Pantalla B (Dashboard).
Listener Firestore en tiempo real sobre la colección de bitácoras del
cliente autenticado.

**js/views/bitacora-detalle.js** — Pantalla C. Vista detallada de una
bitácora con hero (cliente, técnico, score ring), lecturas con badges
de estado, galería de fotos con lightbox y compartir WhatsApp con
resumen completo.

---

## 4. EL PUENTE — FIREBASE

### 4.1 Servicios usados

- **Firebase Auth** (modelo email sintético + PIN).
- **Firestore** (bitácoras y perfiles de cliente).
- **Firebase Storage** (fotos comprimidas).

### 4.2 Arquitectura de datos en Firestore

```
clientes/{clienteId}
  ├─ nombre, email, telefono, direccion, cliente_id, activo, creado_en
  └─ albercas/principal
      ├─ (metadata de la alberca)
      └─ bitacoras/{YYYY-MM-DD_HHMM}
          ├─ fecha, hora, fecha_timestamp, updated_at
          ├─ tecnico, estado, acciones[], notas
          ├─ lecturas: { ph, cloro_libre, cloro_combinado,
          │              alcalinidad, dureza_calcica, estabilizador,
          │              lsi, temperatura }
          ├─ fotos: [ { url, path, momento, timestamp }, ... ]
          └─ pdf_url, pool_id_tecnico, servicio_id_tecnico
```

### 4.3 Storage de fotos

```
clientes/{clienteId}/albercas/principal/bitacoras/{bitacoraId}/foto-{N}.jpg
```

Las fotos se comprimen en la PWA Técnica antes de subir (~45-200 KB c/u
desde originales de ~3 MB).

### 4.4 Flujo end-to-end

Captura en PWA Técnica (offline-first en localStorage e IndexedDB) → evento
`servicio:guardado` disparado por EventBus → `firestore-sync.js` mapea
schema técnico a cliente → genera ID único por hora → asegura
`cliente_id` (crea usuario Auth con app secundaria si es primera vez)
→ escribe bitácora en Firestore → `PhotoQueue.subirFotosDeServicio`
sube fotos a Storage → segundo `setDoc` actualiza el campo `fotos[]` con
URLs → cola offline procesa pendientes al reconectar → PWA Cliente lee
Firestore en tiempo real → `bitacora-detalle.js` renderiza con
explicaciones didácticas → galería de fotos funcional con lightbox.

### 4.5 Reglas de seguridad

- Admin (Omar) tiene lectura y escritura totales.
- Cliente solo puede leer su propio documento. Sin escritura.
- API key de Firebase es pública por diseño; la seguridad vive en las
  reglas, no en la ocultación de la key.

---

## 5. REGLA DE PROPAGACIÓN DE BUGS

Si un bug toca varios archivos, el orden de impacto típico es:

### En la PWA Técnica
```
chemistry → engine → isaias / bitacora → app / index
photo-queue → photo-ui → bitacora
firestore-sync ← engine (vía eventos del EventBus)
```

### En la PWA Cliente
```
firebase.js → auth.js → views/portal.js → views/bitacora-detalle.js
config.js → cualquier vista (es fuente de textos/datos)
components.css → todas las vistas
```

### Cross-repo
Bug que se ve en la PWA Cliente pero la causa está en la Técnica:
revisar primero `firestore-sync.js` (mapeo) o `photo-queue.js` (shape de
fotos: objeto vs string).

### Reglas adicionales
- Bugs de persistencia local: revisar `db.js`.
- Bugs de eventos no propagados: revisar `eventBus.js` + listeners en
  `engine.js`.
- Bugs de predicciones desfasadas: revisar `clima.js` o `solar.js`.
- Bugs visuales que no reflejan estado real: revisar `app.js` +
  `index.html` (técnico) o la vista correspondiente en `js/views/` (cliente).

---

## 6. TABLA DE DERIVACIÓN DE `modo_operativo`

Función `_calcularModoOperativo(tipoServicio, naturalezaColor, claridadActual,
tipoAlga, ispb)` en `engine.js`.

**PASO A — Severidad máxima:**
- `severidad_nivel` = `claridadActual` (0..6)
- `severidad_alga` = lookup en `TABLA_SEVERIDAD_ALGA`
- `severidad_max` = max(severidad_nivel, severidad_alga)

**PASO B — Reglas en ORDEN ESTRICTO. La primera que aplique gana:**
1. `naturaleza_color === 'metales'` → `'metales'` [HARD-STOP, siempre gana]
2. `tipo_servicio === 'post_choque_slam'` → `'post_choque'`
3. `tipo_servicio === 'correccion_sarro'` → `'sarro_controlado'`
4. `tipo_servicio === 'algas'` → `'rescate'`
5. `severidad_max >= 4` → `'rescate'` [override por agua]
6. `severidad_max === 3` → `'recuperacion_severa'`
7. `severidad_max ∈ {1, 2}` → `'recuperacion_leve'`
8. `tipo_servicio === 'balance_quimico'` → `'balance'`
9. default → `'rutinario'`

**Modos posibles (vigentes):** `rutinario`, `rescate`, `recuperacion_severa`,
`recuperacion_leve`, `balance`, `sarro_controlado`, `metales`, `post_choque`.

**NO REORDENAR** las reglas. La regla 1 es HARD-STOP.

Modo `flocular` pendiente de integración — ver sección 11.

---

## 7. NIVELES DE CLARIDAD (7 PUROS)

Basados en ISO 7027-2016.

| Nivel | Nombre          | NTU aprox.  |
|-------|-----------------|-------------|
| 0     | Cristalina      | < 0.5       |
| 1     | Velada          | 0.5 - 5     |
| 2     | Turbia          | 5 - 30      |
| 3     | Verde Claro     | 30 - 100    |
| 4     | Verde Oscuro    | 100 - 400   |
| 5     | Pantano         | > 400       |
| 6     | Blanca Lechosa  | variable    |

Verde con metales ≠ verde con algas. Se distingue con campo independiente
`naturaleza_color` (Regla de Oro #4).

---

## 8. TAXONOMÍA DE ALGAS Y SEVERIDAD

| Tipo de Alga | Severidad | Resistencia | Tratamiento base                              |
|--------------|-----------|-------------|-----------------------------------------------|
| Ninguna      | 0         | —           | —                                             |
| Muriendo     | 1         | —           | Mantener post-choque, no re-clorar            |
| Verde        | 3         | BAJA        | Choque simple                                 |
| Mostaza      | 3         | ALTA        | Cepillado agresivo + choque doble + algicida  |
| Rosa         | 4         | MEDIA       | Algicida + sanitizante bactericida            |
| Negra        | 5         | MUY ALTA    | CUÁDRUPLE choque + cepillo de alambre         |
| Múltiple     | 5         | —           | Tratamiento del más resistente presente       |

---

## 9. TRES CAMPOS DE SALUD DEL AGUA

| CAMPO            | DUEÑO (storage)          | MUTABILIDAD     | QUIÉN ESCRIBE                                                          |
|------------------|--------------------------|-----------------|------------------------------------------------------------------------|
| `salud_inicial`  | Expediente (pb_albercas) | INMUTABLE       | Formulario alta/edición (deshabilitado en UI desde V17.2.x)            |
| `salud_agua`     | Bitácora (pb_servicios)  | Append-only     | Bitácora, al guardar servicio (snapshot)                               |
| `claridad_actual`| Memoria (poolState)      | MUTABLE         | Engine, tras DIAGNOSTICO_ANCLADO (guarda solo número 0..6, no objeto)  |

---

## 10. GLOSARIO ESENCIAL

- **ISPB:** Índice de Saturación de Pool Balance. Equilibrio entre pH,
  ALK, CH, TDS, temperatura.
- **SLAM:** Shock Level And Maintain.
- **OCLT:** Overnight Chlorine Loss Test.
- **FC / CC / TC:** Cloro Libre / Combinado / Total.
- **CYA:** Ácido cianúrico (estabilizador UV del cloro).
- **Naturaleza del color:** Causa del color del agua (`ninguna`, `algas`,
  `metales`, `mixto`).
- **Modo operativo:** Estado derivado del gemelo (8 modos vigentes, ver
  sección 6).
- **Ancla de realidad:** Acción de reemplazar la proyección del gemelo con
  valores medidos por ColorQ.
- **Punto cero químico:** Composición del agua de origen (expediente).
- **Albedo refractivo:** Reflectividad UV del recubrimiento. Tabla
  `DICCIONARIO_ALBEDO` en db.js.
- **Rugosidad:** Textura del recubrimiento (Lisa / Media / Rugosa).
- **`cliente_id`:** ID público del cliente (formato `PB-YYYY-NNN`).
- **`pool_id_tecnico`:** ID interno de la alberca en la PWA Técnica.
- **Email sintético:** `{clienteId}@poolbalance.cliente`, mecanismo para
  que Firebase Auth acepte un ID + PIN de 6 dígitos.

---

## 11. PENDIENTES ARQUITECTÓNICOS CONOCIDOS

Lista viva de bugs y faltantes que afectan estructura, no solo cosmética.

### 11.1 MODO `flocular` NO INTEGRADO en PWA Técnica
**Detectado en campo: 2026-05-22.**
El técnico no tiene cómo declarar un servicio de floculación. Alcance de
la integración futura:
- Alta de `tipo_servicio = 'floculacion'` en `bitacora.js` (constante
  `TIPOS_SERVICIO`).
- Nueva regla en `_calcularModoOperativo` (`engine.js`) que mapee
  `tipo_servicio === 'floculacion'` → modo `'flocular'`. Definir
  prioridad: después de `metales` (HARD-STOP) y antes de los modos por
  severidad de agua.
- Lógica de tratamiento en `chemistry.js` (dosis típica de floculante,
  ventana de aplicación, instrucción de apagar circulación) y en
  `isaias.js` (mensajes del agente, prioridades, contraindicaciones —
  ej. no flocular con cloro alto activo).
- UI en `index.html` para capturar el evento de floculación
  (cantidad de producto, hora, momento del corte de bomba) y mostrar
  un banner mientras la bomba esté detenida.
- Considerar si `flocular` necesita un campo análogo a
  `naturaleza_color` para distinguir tipos de turbidez tratable por
  floculación.

### 11.2 Estilos inline antiguos en `index.html` de la PWA Técnica
V16.7.1 no usa la paleta oficial. Cirugía estética pendiente: migrar
estilos inline a usar la paleta de marca documentada en Reglas (sección
de Identidad de Marca). Considerar ergonomía de campo: botones grandes,
contraste en sol directo, manos mojadas.

### 11.3 Estandarizar versionado en PWA Cliente
Solo `data/config.js` y `js/views/bitacora-detalle.js` declaran versión.
Resto de archivos no tienen header con `const VERSION`. Cirugía menor:
agregar header con firma + versión a cada archivo del repo cliente para
poder hacer bumps controlados.

### 11.4 Reconciliación de versión del sistema en PWA Técnica
El header del `index.html` declara V16.7.1, pero el dosier de cierre del
22-may-2026 hablaba de V17.2.4. Confirmar con la Gema cuál es la
verdadera y, si es V17.2.4, actualizar el header del index.html.

### 11.5 Migración del campo `salud_inicial`
Sigue en el esqueleto de `db.js` por compatibilidad aunque la UI ya no
lo captura desde V17.2.x. Decidir si se elimina del schema o si se
documenta como "campo de migración histórica" sin captura activa.

### 11.6 Bug visual del portal cliente — campos no contemplados
La vista de bitácora del cliente espera ciertos campos en `lecturas`.
Si la PWA Técnica empieza a empujar campos nuevos (ej. ORP, salinidad,
fosfatos), la vista cliente los ignora silenciosamente. Mecanismo de
gracia degradada por verificar.

---

**FIN DE MAPA UNIFICADO**
