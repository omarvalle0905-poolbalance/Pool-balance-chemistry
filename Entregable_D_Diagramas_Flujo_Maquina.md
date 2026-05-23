ENTREGABLE D — Diagramas de Flujo del Razonamiento de Isaías
Documento técnico de visualización Pool Balance · CÓDYCE NEXUS V17.8 · Flujo de razonamiento de 11 pasos Diagramas en ASCII art para portabilidad máxima (visualización en chat, terminal, código, PDF, Markdown)
D.1. Diagrama maestro — Flujo de 11 pasos con facultad ν integrada
Copy

┌─────────────────────────────────────────────────────────────────┐
│           OMAR REPORTA A ISAÍAS: lectura ColorQ + intención     │
│        (pH, FC, CYA, ALK, CH, recubrimiento, V, T_aire, modo)   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 1.  Clima.obtenerClimaActual()                             │
│          → T_aire, UVI_crudo, nubosidad, humedad, viento        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 2.  Solar.calcFactorSombraEfectivo(expediente, diario)     │
│          → factorUV_geométrico, horasSolEfectivas               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 3.  UVI_efectivo en cadena                                 │
│          = UVI_crudo × Mult_Nubes × factorUV × (1+0.5×albedo)   │
│          Aplicar offset T_agua = T_aire + 2°C (default)         │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 4.  Determinar MODO operativo                              │
│          Inputs: nivel claridad, CYA, síntomas reportados       │
│          Output: {rutinario|rescate|post_choque|sarro|metales}  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
                    ┌──────────┴──────────┐
                    │ ¿Modo == metales?   │
                    └──────────┬──────────┘
                       SÍ      │      NO
            ┌─────────────────┘   └─────────────────┐
            ▼                                       ▼
┌───────────────────────┐        ┌─────────────────────────────────┐
│ HARD-STOP activado    │        │ PASO 5. Chemistry.getAlertas()  │
│ Bloquear cloración    │        │ → array de alertas priorizadas  │
│ Salida: secuestrante  │        │ Aplicar silenciado por modo     │
│ Firma: "Pam,pam,pam"  │        └────────────────┬────────────────┘
└───────────────────────┘                         │
                                                  ▼
                            ┌─────────────────────────────────────┐
                            │ PASO 6. calcDegradacionCloro(...)   │
                            │ Proyección FC en 4h, 8h, 24h        │
                            │ Identificar si requiere recloración │
                            └────────────────┬────────────────────┘
                                             │
                                             ▼
                            ┌─────────────────────────────────────┐
                            │ PASO 6-bis. calcDosificacion(...)   │
                            │ Calcular gramos del producto óptimo │
                            │ para mover FC/ALK/pH/CH al objetivo │
                            └────────────────┬────────────────────┘
                                             │
                                             ▼
                ╔════════════════════════════════════════════════╗
                ║ PASO 6-ter. ★ NUEVA FACULTAD V17.8 ★           ║
                ║                                                ║
                ║ calcDeltaPhPorDosificacion(producto, gramos,   ║
                ║                            V, lecturas)        ║
                ║                                                ║
                ║ → ΔpH_base, ΔpH_pesimista, ΔpH_optimista       ║
                ║ → pH_final esperado y banda                    ║
                ║ → ALK_corr_final, ISPB recalculado             ║
                ║ → régimen (lineal/cuártico/ultra)              ║
                ║ → premedicacion.requerida (true/false)         ║
                ╚════════════════════┬═══════════════════════════╝
                                     │
                                     ▼
                        ┌────────────┴────────────┐
                        │ ¿premedicación.req.?    │
                        └────────────┬────────────┘
                            SÍ       │       NO
                ┌────────────────────┘   └──────────────────────┐
                ▼                                                ▼
┌─────────────────────────────────────┐         ┌──────────────────────────────┐
│ PASO 6-quater. PROTOCOLO DUAL       │         │ Continuar con protocolo      │
│                                     │         │ principal directo            │
│ A) Premedicación opcional:          │         │                              │
│    - Producto sugerido (Alkalin     │         └──────────────┬───────────────┘
│      o Bisulfato)                   │                        │
│    - Gramos × factor seguridad 1.3  │                        │
│    - Esperar 30 min                 │                        │
│    - Re-medir pH                    │                        │
│                                     │                        │
│ B) Protocolo principal:             │                        │
│    - Dosis del producto objetivo    │                        │
│    - ΔpH proyectado revisado        │                        │
│                                     │                        │
│ Bandera: "[PREMEDICACIÓN-opcional]" │                        │
│ Omar decide aceptar o ignorar       │                        │
└──────────────────┬──────────────────┘                        │
                   │                                            │
                   └────────────────────┬──────────────────────┘
                                        │
                                        ▼
                    ┌────────────────────────────────────────────┐
                    │ PASO 7. ¿Hay aireación activa?             │
                    │ (cascada, spillway, spa venturi)           │
                    └────────────────┬───────────────────────────┘
                                     │
                              SÍ ────┴──── NO
                              │             │
                              ▼             ▼
            ┌─────────────────────────┐    ┌─────────────────┐
            │ calcDeltaPhDesgasif()   │    │ Saltar paso 7   │
            │ Aplicar techo pH = 8.4  │    │ ΔpH_desgas = 0  │
            │ Proyectar 24h           │    └─────────┬───────┘
            └────────────┬────────────┘              │
                         └────────────┬──────────────┘
                                      ▼
                ┌───────────────────────────────────────────┐
                │ PASO 8. ISPB FINAL PROYECTADO             │
                │ pH_total = pH_actual + ΔpH_inmediato      │
                │           + ΔpH_desgasificación           │
                │ Recalcular ISPB con ALK_corr final        │
                │ Validar contra zona del recubrimiento     │
                └────────────────┬──────────────────────────┘
                                 │
                                 ▼
                ┌───────────────────────────────────────────┐
                │ PASO 9. EMITIR RESPUESTA (Sección 9)      │
                │ Estructura: Estado / Diagnóstico /        │
                │             Deducción / Plan de Acción    │
                │ + Bitácora estandarizada                  │
                │ + Firma calibrada (Sección 1.1.7)         │
                └────────────────┬──────────────────────────┘
                                 │
                                 ▼
                ┌───────────────────────────────────────────┐
                │ RESPUESTA ENTREGADA A OMAR                │
                │ Próxima revisión sugerida en T+24h        │
                └───────────────────────────────────────────┘
D.2. Diagrama de decisión — Régimen del solver de ΔpH
Copy

                    calcDeltaPhPorDosificacion entra
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Calcular ALK_corr     │
                    │ (Wojtowicz dinámico)  │
                    └──────────┬────────────┘
                               │
                               ▼
                    ┌───────────────────────┐
                    │ Calcular ν y β        │
                    │ a condiciones reales  │
                    └──────────┬────────────┘
                               │
                               ▼
                    ┌───────────────────────┐
                    │ Estimar ΔpH lineal    │
                    │ = -ν·C_P / β          │
                    └──────────┬────────────┘
                               │
                               ▼
            ┌──────────────────┴──────────────────┐
            │                                     │
            │   ALK_corr < 30 ppm?                │
            │                                     │
            └──────────┬──────────────────────────┘
                       │
                  SÍ   │   NO
                       │
            ┌──────────┘   └────────────────┐
            ▼                                ▼
┌─────────────────────────┐    ┌─────────────────────────────┐
│ RÉGIMEN: ULTRA NO LINEAL│    │  ALK_corr < 60 ppm          │
│                         │    │      OR                     │
│ • Resolver cuártica     │    │  |ΔpH_lineal| > 0.3         │
│ • Banda incertidumbre   │    │      OR                     │
│   AMPLIADA (×2)         │    │  forzarCuartica = true ?    │
│ • Advertencia:          │    └─────────┬───────────────────┘
│   "ALK crítica,         │              │
│    restaurar antes"     │       SÍ ────┴──── NO
│ • Recomendar Alkalin    │       │             │
│   premedicación         │       ▼             ▼
└─────────────────────────┘ ┌──────────┐  ┌──────────────────┐
                            │ RÉGIMEN: │  │ RÉGIMEN: LINEAL  │
                            │ CUÁRTICO │  │                  │
                            │          │  │ • ΔpH = -νC_P/β  │
                            │ Newton-  │  │ • Tres escenarios│
                            │ Raphson  │  │   (Opción C)     │
                            │ tol 1e-9 │  │ • Si solicitado, │
                            │ 30 iter  │  │   gaussiana B    │
                            │          │  │ • Rápido (<1ms)  │
                            │ Fallback │  └──────────────────┘
                            │ a lineal │
                            │ si diverg│
                            └──────────┘
D.3. Diagrama de premedicación — Árbol de decisión
Copy

                  calcDeltaPhPorDosificacion completó
                  base + pesimista + optimista
                                │
                                ▼
                ┌───────────────────────────────────┐
                │ Recuperar pH_piso y pH_techo      │
                │ del modo operativo activo         │
                │ (Sección 1.4 del códice)          │
                │ + ventana del recubrimiento       │
                │ (Sección 4.3)                     │
                │                                   │
                │ Tomar el rango más ESTRECHO       │
                │ de los dos (más conservador)      │
                └────────────────┬──────────────────┘
                                 │
                                 ▼
                ┌───────────────────────────────────┐
                │ pH_pes = pH_actual + ΔpH_pesim    │
                │ pH_opt = pH_actual + ΔpH_optim    │
                └────────────────┬──────────────────┘
                                 │
                                 ▼
                    ┌────────────┴────────────┐
                    │ pH_pes < pH_piso ?      │
                    └────────────┬────────────┘
                                 │
                          SÍ ────┴──── NO
                          │             │
                          ▼             ▼
        ┌─────────────────────────┐  ┌─────────────────────────┐
        │ ACIDIFICACIÓN EXCESIVA  │  │ pH_pes > pH_techo ?     │
        │                         │  └─────────┬───────────────┘
        │ Producto entrante es    │            │
        │ ácido (ν > 0): TCCA,    │       SÍ ──┴── NO
        │ Bisulfato, Muriático,   │       │       │
        │ NaDCC, CYA              │       ▼       ▼
        │                         │  ┌────────┐  ┌──────────────────┐
        │ PREMEDICAR con Alkalin  │  │ ALCALI │  │ pH_pes y pH_opt  │
        │ (NaHCO₃)                │  │ EXCES. │  │ DENTRO de rango  │
        │                         │  │        │  │                  │
        │ g_alkalin =             │  │ Premed │  │ ✅ Sin premedic. │
        │  (pH_piso − pH_pes)     │  │ con    │  │                  │
        │  × β × V × 84.01 × 1000 │  │ Bisul- │  │ Protocolo PRINC. │
        │  × 1.3 (factor segur.)  │  │ fato   │  │ directo          │
        │                         │  │ Klaren │  └──────────────────┘
        │ Aplicar PRIMERO         │  │ (o     │
        │ Esperar 30 min          │  │ Muriá- │
        │ Re-medir pH             │  │ tico)  │
        │ Luego protocolo princ.  │  │        │
        │                         │  │ Igual  │
        │ Bandera:                │  │ lógica │
        │ [PREMEDICACIÓN-opcional]│  │ pero   │
        │                         │  │ inver- │
        └─────────────────────────┘  │ tida   │
                                     └────────┘
D.4. Diagrama de estructura de respuesta de Isaías
Copy

┌────────────────────────────────────────────────────────────────┐
│ 1. ESTADO ACTUAL                                               │
│ ───────────────                                                │
│ • Cita literal de lectura ColorQ                               │
│ • Volumen, recubrimiento, T_agua estimada                      │
│ • Modo operativo identificado                                  │
│ • Contexto climático (UV, nubes, sombra geométrica)            │
└──────────────────────────────┬─────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. DIAGNÓSTICO ISPB + HOCl                                     │
│ ───────────────────────────                                    │
│ • ISPB calculado con ALK_corr Wojtowicz dinámico               │
│ • Zona del recubrimiento (in/out)                              │
│ • HOCl_activo calculado vía Pankow                             │
│ • Comparación contra umbral biocida 0.03 ppm                   │
│ • Diagnóstico cualitativo: agresivo/equilibrado/incrustante    │
└──────────────────────────────┬─────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. DEDUCCIÓN DE INGENIERÍA                                     │
│ ───────────────────────────                                    │
│ • Causa raíz identificada (cinética/balance/química)           │
│ • Conexión explícita con leyes:                                │
│   - Henry (desgasificación)                                    │
│   - Arrhenius (cinética temperatura)                           │
│   - O'Brien-Falk (especiación cloro-CYA)                       │
│   - Pankow (HOCl-OCl⁻)                                         │
│   - Wojtowicz (alcalinidad corregida)                          │
│   - Stumm-Morgan (capacidad buffer)                            │
└──────────────────────────────┬─────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. PLAN DE ACCIÓN                                              │
│ ─────────────────                                              │
│                                                                │
│ ╔════════════════════════════════════════════════╗             │
│ ║ ★ NUEVA SECCIÓN V17.8 (cuando aplique) ★      ║             │
│ ║                                                ║             │
│ ║ [PREMEDICACIÓN — opcional]                     ║             │
│ ║ • Producto, dosis, justificación               ║             │
│ ║ • ΔpH esperado de la premedicación             ║             │
│ ║ • Tiempo de espera antes del protocolo princ.  ║             │
│ ╚════════════════════════════════════════════════╝             │
│                                                                │
│ PROTOCOLO PRINCIPAL                                            │
│ • Dosis exacta del producto principal                          │
│ • ΔpH proyectado base (rango pesimista-optimista)              │
│ • pH final esperado                                            │
│ • ALK_corr final esperada                                      │
│ • ISPB final proyectado y zona                                 │
│ • Tiempo a próxima revisión                                    │
└──────────────────────────────┬─────────────────────────────────┘
                               │
                               ▼
                  ┌────────────────────────┐
                  │ FIRMA OPERATIVA        │
                  │ Sección 1.1.7          │
                  │                        │
                  │ Criterios calibrados:  │
                  │ • Modo rescate? ───┐   │
                  │ • Drenado parcial? │   │
                  │ • Hard-stop met.?  │   │
                  │ • FC≥30% CYA?      │   │
                  └─────────┬──────────┘   │
                            │              │
                  ¿alguno cumple?          │
                            │              │
                       SÍ ──┴── NO         │
                       │       │           │
                       ▼       ▼           │
                "Pam, pam,   "—Isaías"     │
                  pam"                     │
                            │              │
                            ▼              │
                ┌──────────────────────────┘
                │ BITÁCORA DE SALIDA       │
                │ Plantilla Sección 9.2    │
                │                          │
                │ "Copia esta bitácora y   │
                │  pégala en el cuaderno   │
                │  del cliente"            │
                └──────────────────────────┘
D.5. Diagrama de integración de tres fenómenos ácido-base
Este diagrama clarifica la separación temporal entre los tres efectos sobre el pH y cómo se componen.
Copy
TIEMPO:    t=0          minutos        horas           24h+
           ║              ║              ║              ║
           ▼              ▼              ▼              ▼
       ┌──────┐      ┌──────┐      ┌──────┐      ┌──────┐
       │ DOSI-│      │ MEZ- │      │ EQUI-│      │EQUIL.│
       │FICAR │ ──>  │ CLA  │ ──>  │LIBRIO│ ──>  │ ATM. │
       └──┬───┘      └──┬───┘      │CLORO-│      │ CO₂  │
          │             │          │ CYA  │      └──────┘
          │             │          └──┬───┘
          │             │             │
          ▼             ▼             ▼
   ┌────────────┐ ┌──────────┐ ┌────────────┐
   │  Sec 13    │ │  Sec 5.3 │ │  Sec 12    │
   │            │ │          │ │            │
   │ ΔpH_inme-  │ │ Reespe-  │ │ ΔpH_desga- │
   │ diato      │ │ ciación  │ │ sificación │
   │            │ │ HOCl/OCl │ │            │
   │ ν dinámico │ │ cloro-   │ │ Henry+kLa  │
   │ Estequio-  │ │ cianurato│ │ Techo 8.4  │
   │ metría     │ │          │ │            │
   │            │ │ Efecto   │ │            │
   │ MAGNITUD:  │ │ MAGNITUD:│ │ MAGNITUD:  │
   │ ±0.01 a    │ │ ±0.02    │ │ +0.1 a +1  │
   │ ±0.7       │ │ ajuste   │ │ (cascada)  │
   │            │ │ fino     │ │ +0 a +0.2  │
   │            │ │          │ │ (reposo)   │
   └─────┬──────┘ └─────┬────┘ └─────┬──────┘
         │              │            │
         └──────────────┴────────────┘
                        │
                        ▼
              ┌──────────────────────┐
              │ pH_FINAL(t→24h+) =   │
              │ pH_0                 │
              │ + ΔpH_inmediato      │
              │ + ΔpH_reespeciación  │
              │ + ΔpH_desgasificación│
              │                      │
              │ (todos calculables   │
              │  con chemistry.js    │
              │  v16.7)              │
              └──────────────────────┘
D.6. Diagrama de validación cruzada — Termodinámica vs Calibración Empírica
Copy

                ┌─────────────────────────────────────────┐
                │ CONSTANTE EMPÍRICA DEL MOTOR            │
                │ (calibrada con producto comercial real) │
                └────────────────────┬────────────────────┘
                                     │
                                     ▼
                        ┌────────────────────────┐
                        │ ¿Coincide con modelo   │
                        │ termodinámico puro     │
                        │ (Entregable B)?        │
                        └────────┬───────────────┘
                                 │
                  ┌──────────────┼──────────────┐
                  │              │              │
              <2% │          2-10% │          >10%│
                  │              │              │
                  ▼              ▼              ▼
        ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐
        │ COINCIDENCIA│  │ DISCREPANCIA │  │ DISCREPANCIA    │
        │   EXACTA    │  │   MODERADA   │  │   GRAVE         │
        │             │  │              │  │                 │
        │ Validación  │  │ Atribuible a │  │ Investigar:     │
        │ definitiva  │  │ pureza real  │  │ • Error modelo? │
        │             │  │ del lote     │  │ • Error medic.? │
        │ Ejemplos:   │  │              │  │ • Constante mal │
        │ • Alkalin   │  │ Ejemplos:    │  │   reportada?    │
        │   16.78 ≡   │  │ • Bisulfato  │  │                 │
        │   16.80     │  │   50.94 vs   │  │ Acción:         │
        │ • CaCl₂     │  │   48.0       │  │ Calibrar lote   │
        │   100 ≡ 100 │  │   (pureza    │  │ Verificar SDS   │
        │ • CYA       │  │   real 47%)  │  │ Re-medir piloto │
        │   1.0 ≡ 1.0 │  │ • Hipo Ca    │  │                 │
        │             │  │   0.55 vs    │  │                 │
        │             │  │   0.59       │  │                 │
        │             │  │   (impurezas)│  │                 │
        └─────────────┘  └──────────────┘  └─────────────────┘