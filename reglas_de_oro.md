# REGLAS DE ORO — POOL BALANCE

## Constitución del ecosistema (PWA Técnica \+ PWA Cliente)

### Autor: Omar Alberto Valle Mercado · VAMO870509HW3

### Última revisión: 2026-05-22 · v2

---

## QUÉ ES POOL BALANCE

Pool Balance es un GEMELO DIGITAL de albercas comerciales y residenciales. Combina química del agua, física de dilución, eventos externos y observación humana para mantener el agua en condiciones operativas seguras y predecibles.

No es un software de bitácora. No es una calculadora de cloro. Es un MODELO VIVO del estado de cada alberca.

El producto se materializa en un ecosistema de **dos PWAs hermanas**, ambas deployadas en Vercel desde GitHub, ambas firmadas por VAMO870509HW3:

- **PWA Técnica** (`pool-balance-15`) — Captura ColorQ, motor químico, agente cognitivo, bitácora de servicio. Vive en el celular del técnico.  
- **PWA Cliente** (`Pool-balance-mx` — [https://pool-balance-mx.vercel.app](https://pool-balance-mx.vercel.app)) — Sitio público, podcast, portal del cliente con bitácora detallada y reportes PDF.

El puente entre ambas es **Firebase** (Auth \+ Firestore \+ Storage). La PWA Técnica empuja, la PWA Cliente lee.

---

## LAS 12 REGLAS DE ORO (INMUTABLES)

1. **FC/CYA dinámico siempre.** Nunca usar umbrales fijos de cloro sin consultar el CYA actual. Implementado en chemistry.js vía `getUmbralesClorOperativos`.  
     
2. **Expediente y bitácora son separados.** Ningún campo de bitácora sobrescribe el expediente. EXPEDIENTE \= lo que ES la alberca (`pb_albercas`, inmutable). BITÁCORA \= lo que PASÓ en la alberca (`pb_servicios`, append-only).  
     
3. **Anclar solo lo medido.** Campos vacíos no sobrescriben proyección. Validado con `_tieneValorExplicito()` en engine.js.  
     
4. **Naturaleza del color es independiente del nivel de claridad.** Son dos campos, dos selectores. Verde por algas ≠ verde por metales.  
     
5. **Metales bloquean choque de cloro. HARD-STOP, sin override.** Si `naturaleza_color === 'metales'`, el sistema bloquea recomendaciones de cloración. Es seguridad química, no decisión operativa.  
     
6. **Modo operativo es derivado.** Nunca se persiste en expediente. Vive solo en `poolState.calculado` y se recalcula con cada evento.  
     
7. **`salud_inicial` es inmutable.** Solo `claridad_actual` evoluciona. `salud_inicial` solo se escribe desde Expediente, nunca desde Bitácora (en la práctica, la UI ya no la captura desde V17.2.x; el campo permanece en el esqueleto de db.js por compatibilidad).  
     
8. **Una sola fuente de verdad por cálculo.** Toda química vive en chemistry.js. Cualquier duplicación de lógica química es un bug arquitectónico.  
     
9. **EventBus es el único canal entre módulos UI y motor.** Sin llamadas directas. API canónica: `EventBus.dispatch` (no emit). Eventos en snake\_case con namespace (`bitacora:guardada`, `poolState:updated`).  
     
10. **Override automático nunca silencioso.** Banner ámbar obligatorio, bidireccional (escalación y descalación de modo).  
      
11. **Decisión humana sobre automatismo.** El técnico decide `tipo_servicio`. El motor SUGIERE cambios cuando detecta inconsistencia, pero NUNCA fuerza un override silencioso. La única excepción es la Regla \#5 (metales).  
      
12. **Offline-first es ley. Firestore es espejo.** `localStorage` es la fuente de verdad de la PWA Técnica. La sincronización con Firestore es eventual y no bloqueante. Si Firestore falla o el técnico está offline, la captura sigue funcionando y la cola pendiente se procesa al reconectar. Nunca se condiciona la captura técnica a la disponibilidad cloud. La PWA Cliente, en cambio, sí depende de Firestore (es su única fuente de lectura) pero solo lee, nunca muta el gemelo.

---

## REGLA FC/CYA DINÁMICA — DETALLE

El cloro libre objetivo NO es un número fijo. Depende del CYA.

- FC mínimo sanitario  \= CYA × 7.5%  
- FC objetivo          \= CYA × 10%  
- FC alto sin bañistas \= CYA × 30%  
- FC choque algas      \= CYA × 40%  
- FC tóxico            \= CYA × 50%  
- FC superchoque       \= CYA × 80%

Con CYA menor a 20 ppm, aplican PISOS ABSOLUTOS: 0.5 / 1.5 / 5.0 / 10.0 / 20.0 ppm.

---

## IDENTIDAD DE MARCA (FUENTE DE VERDAD ÚNICA)

La paleta y tipografía oficiales viven en el repo cliente (`Pool-balance-mx/index.html`, bloque `tailwind.config`). Es la **fuente de verdad** y aplica a las dos PWAs sin excepción.

### Paleta

| Token | Hex | Uso |
| :---- | :---- | :---- |
| `bruma` | `#EEF1F5` | Fondo neutro |
| `marino` | `#0E4569` | Primario (headers, theme\_color) |
| `marino-dark` | `#0a3350` | Hover oscuro |
| `marino-light` | `#1a5a82` | Acento marino claro |
| `arcilla` | `#E8664A` | Acento naranja terracota |
| `arcilla-dark` | `#d44f33` | Hover acento |
| `arcilla-light` | `#fde8e3` | Fondo suave acento |
| `cristal` | `#6FB8C6` | Secundario turquesa (cloro / agua) |
| `cristal-dark` | `#5aa3b1` | — |
| `cristal-light` | `#8ecbd7` | — |
| `success` | `#2D9E6B` | OK |
| `warning` | `#E8A838` | Atención |
| `danger` | `#D95C5C` | Crítico |

### Tipografía

**Bricolage Grotesque** (Google Fonts). Pesos disponibles: 300, 400, 500, 600, 700, 800\. Eje opsz 12..96 activo.

### Iconos

**Font Awesome** (`fa-solid`, `fa-brands`). No usar emojis Unicode como iconografía estructural; reservar emojis para mensajes conversacionales (toasts, resúmenes WhatsApp).

### Aplicación

- **PWA Cliente:** paleta aplicada vía Tailwind \+ variables CSS.  
- **PWA Técnica:** paleta pendiente de migración a la cirugía estética (V16.7.1 aún usa estilos inline antiguos en `index.html`).

---

## CONVENCIONES DE CÓDIGO (NO NEGOCIABLES)

- **Versionado:** cada archivo declara su versión en constante `VERSION` (o `ENGINE_VERSION`, `DB_VERSION`, etc.) al inicio. Bump obligatorio en cada cirugía, con entrada en cabecera del archivo.  
- **Firma:** "Omar Alberto Valle Mercado | VAMO870509HW3" presente en cabecera y logs. Intacta en cada cirugía.  
- **Idioma:** variables y comentarios en español.  
- **EventBus:** nombres de evento en snake\_case con namespace (`bitacora:guardada`, `poolState:updated`, `bitacora:diagnostico_anclado`, `servicio:guardado`, `db:initialized`). API canónica: `dispatch` / `on` / `off` / `listenerCount` / `reset`.  
- **Funciones internas:** prefijo `_` (ej. `_anclarDiagnostico`).  
- **Constantes globales:** UPPER\_SNAKE\_CASE.  
- **Storage keys (PWA Técnica):** prefijo `pb_` (ej. `pb_albercas`, `pb_servicios`, `pb_isaias_estado`, `pb_isaias_observaciones`, `pb_isaias_identidad`, `pb_photos`, `pending_photos`).  
- **IDs de bitácora en Firestore:** formato `YYYY-MM-DD_HHMM` para evitar colisiones de bitácoras del mismo día.  
- **IDs de cliente:** formato `PB-YYYY-NNN` (ej. `PB-2026-007`).  
- **Email sintético para Firebase Auth (cliente):** `{clienteId}@poolbalance.cliente`. El PIN de 6 dígitos es la password.

---

## PROHIBIDO

- Refactorizar nada fuera de lo pedido en la cirugía actual.  
- Modificar constantes calibradas a producto Klaren (\~50% pureza activa).  
- Tocar el HARD-STOP de metales (Regla \#5).  
- Persistir `modo_operativo` en el expediente (Regla \#6).  
- Que un módulo UI hable directamente con db.js (Regla \#9).  
- Que cualquier módulo que no sea engine.js mute `poolState` (Regla \#8 extendida: engine es el único orquestador del estado).  
- Condicionar la captura técnica a la disponibilidad de Firestore (Regla \#12).  
- Que la PWA Cliente intente escribir / mutar bitácoras (es read-only por diseño; las reglas de seguridad de Firestore lo bloquean además).  
- Usar paleta diferente a la oficial. Si un componente nuevo "necesita" un color que no existe en la paleta, primero se discute, después se agrega a `tailwind.config` del repo cliente, y después se usa.

---

**FIN DE REGLAS DE ORO**  
