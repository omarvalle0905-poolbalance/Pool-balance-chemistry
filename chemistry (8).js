/**
 * ═══════════════════════════════════════════════════════════════
 * POOL BALANCE — Motor Químico V16.6.0 (Gemelo Digital Ciber-Físico)
 * Factor Omar · Índice de Saturación Pool Balance (ISPB)
 * Marcas Reales: Klaren, Spin, Cristalin, Novem
 *
 * © Omar Alberto Valle Mercado | RFC: VAMO870509HW3
 * Pool Balance - Gestoría Hídrica Profesional
 *
 * VERSIÓN: 16.6.0 — Helpers calcFraccionHOCl y calcHOClActivo (adición)
 *   - V16.6.0 ADD METHOD calcFraccionHOCl(ph, temp): devuelve la
 *     fracción del cloro libre que está como HOCl activo, según
 *     el equilibrio HOCl/OCl⁻ gobernado por el pH y modulado por
 *     temperatura via pKa(T) = 7.582 - 0.00913(T-25) (Pankow,
 *     Aquatic Chemistry).
 *   - V16.6.0 ADD METHOD calcHOClActivo(cl, ph, temp): wrapper que
 *     devuelve directamente ppm de HOCl activo a partir de Cl libre.
 *   - Justificación: a pH 7.82 / 28.8°C solo ~35% del cloro libre
 *     es HOCl activo (resto OCl⁻, ~80x menos efectivo). Bajar pH
 *     a 7.40 sube la fracción a ~58%, multiplicando por ~1.68 el
 *     poder desinfectante sin agregar gramo de cloro. Esta es la
 *     base cinética de la regla #2 del manifiesto (ISPB primero,
 *     cloro después).
 *   - NO modifica funciones existentes. Helpers informativos para
 *     Isaías (system prompt) y futuros displays educativos en
 *     bitácora.
 *
 * VERSIÓN: 16.5.4 — Hotfix umbrales FC/CYA dinámicos
 *   - V16.5.4 FIX getUmbralesClorOperativos: cl_minimo, cl_toxico
 *     y cl_superchoque dividen entre 100 antes de multiplicar por
 *     CYA. Las constantes FC_CYA_*_PCT son porcentaje numerador
 *     (7.5, 50, 80) y antes se multiplicaban directamente,
 *     produciendo umbrales 100x más altos. cl_objetivo y cl_alto
 *     no tenían el bug (vienen de FACTORES_CLORO_POR_MODO en decimal).
 *   - Para CYA=57 los umbrales correctos son: cl_minimo=4.28,
 *     cl_toxico=28.5, cl_superchoque=45.6 (antes 427.5, 2850, 4560).
 *   - Sin cambios en pisos absolutos ni en lógica de modos.
 *
 * VERSIÓN: 16.5.3 — Modo operativo consciente (cirugía 1 de 4).
 *   - getUmbralesClorOperativos acepta modo. Tabla
 *     FACTORES_CLORO_POR_MODO mapea cada modo a multiplicadores
 *     de cl_objetivo y cl_alto sobre CYA. Modo metales bloquea.
 *   - evaluarAgua (getAlertas) propaga modo a la llamada de umbrales y silencia
 *     alertas de cloro en modo metales (todas) y de cloro alto en
 *     rescate/post_choque/recuperacion_severa.
 *   - calcSaludGeneral (calcHealth) acepta modo y aplica topes por modo desde
 *     TOPES_SALUD_POR_MODO. rescate=40, metales=30, etc.
 *   - Sin cambios en constantes calibradas Klaren.
 *
 * VERSIÓN: 16.5.2 — N-07: Alkalin ahora reporta colateral sobre pH (0.003 pH/ppm ALK)
 *   y setea impactoMasa.deltaPH. Alcalos: hard-stop si delta pH > 2.0, aviso ámbar si > 1.0.
 *
 * VERSIÓN: 16.5.1 — Albedo y rugosidad cableados al motor químico
 *   - calcDegradacionCloro: nuevo parámetro opcional `albedo`
 *     que ajusta el UV efectivo (UV_reflejado = albedo × 0.5).
 *     Default 0.40 si no se provee. Resuelve dato huérfano D1.
 *     La fórmula de degradación en sí NO se modificó; solo cambia
 *     el insumo uvIdx → uvAjustado antes de entrar al cálculo.
 *   - calcFactorRugosidad(rugosidad): helper nuevo que devuelve
 *     0.85 (Lisa) / 1.00 (Media) / 1.20 (Rugosa). Disponible
 *     para engine.js en Cirugía 3 del Manifiesto. NO altera calcISV.
 *   - Resuelve datos huérfanos D1 (albedo) y D2 (rugosidad)
 *     desde el lado químico.
 *   - NO se modificó ninguna fórmula química existente.
 *
 * VERSIÓN: 16.5.0 — Regla FC/CYA dinámica (TFP/CMAHC) integrada
 *   - V16.5.0 ADD CONST: FC_CYA_MIN_PCT (7.5), FC_CYA_OBJ_PCT (10),
 *     FC_CYA_ALTO_PCT (30), FC_CYA_TOXICO_PCT (50),
 *     FC_CYA_SUPERCHOQUE_PCT (80), FC_PISO_ABSOLUTO (1.5).
 *
 *   - V16.5.0 ADD METHOD: getUmbralesClorOperativos(cya). Devuelve
 *     umbrales operativos de cloro libre (mínimo sanitario, objetivo,
 *     alto, tóxico, superchoque) escalados por CYA según la regla
 *     industrial FC/CYA del 7.5 % (Trouble Free Pool / CMAHC Model
 *     Aquatic Health Code). Si CYA < 20 ppm aplica pisos absolutos
 *     (0.5 / 1.5 / 5.0 / 10.0 / 20.0) — modo "piso_absoluto". Si
 *     CYA >= 20 ppm aplica los porcentajes — modo "fc_cya_dinamica".
 *     Cada umbral está protegido con Math.max contra caer por
 *     debajo del piso absoluto correspondiente.
 *
 *   - V16.5.0 FIX getAlertas: la sección de cloro libre ahora consume
 *     getUmbralesClorOperativos(cyaN) en lugar de comparar contra
 *     constantes fijas CL_MIN_SANITARIO / CL_OPTIMO_MIN. Se añaden
 *     tres nuevos casos: cloro alto (>= cl_alto), tóxico (>= cl_toxico)
 *     y superchoque (>= cl_superchoque), con prioridades 2/1/1 y
 *     mensajes operativos (suspender cloración, dilución 30-50 %,
 *     no permitir bañistas, esperar degradación UV). Los casos
 *     bajos siguen existiendo pero ahora son relativos al CYA.
 *
 *   - V16.5.0 ADD calcDosificacion: tricloro-*, hipoclorito-calcio
 *     y cloro-liquido aceptan ctx.modo_objetivo === 'fc_cya_dinamica'.
 *     Cuando se activa y cam <= 0, el método calcula internamente
 *     el delta para llegar a cl_objetivo dinámico (basado en
 *     ctx.cianurico y ctx.cloro_libre_actual). Sin esta bandera el
 *     comportamiento es idéntico al previo (cero regresión).
 *
 *   - V16.5.0 FIX calcHealth: la penalización por cloro bajo usa
 *     umbrales dinámicos (cl_minimo, cl_objetivo) y la de cloro alto
 *     usa cl_alto en lugar de un literal 5.0 ppm. Esto evita
 *     penalizar piscinas con CYA = 50 que operan correctamente
 *     a 5 ppm de cloro libre (su FC objetivo real).
 *
 *   - V16.5.0 BOOT-ASSERT: IIFE final amplía la verificación a 26
 *     constantes críticas e incluye chequeo de coherencia ordinal
 *     FC_CYA_MIN_PCT < OBJ < ALTO < TOXICO < SUPERCHOQUE.
 *
 *   - Justificación científica: CPO/NSPF (Skinner & Hales) calibra
 *     dosificación por masa, pero NO contempla la inhibición
 *     cinética del HOCl por estabilizador (CYA). Industria piscina
 *     (TFP, CMAHC, O'Brien 2011, PoolMath) demuestra que el ratio
 *     FC/CYA debe ser >= 7.5 % para mantener desinfección efectiva.
 *     Con CYA = 50 ppm, 1.5 ppm FC equivalen a ~0.05 ppm HOCl libre
 *     activo (sub-letal); se requieren ~5 ppm FC (10 %) para
 *     equivalencia operativa con piscina sin estabilizar a 1.5 ppm.
 *     Esta versión unifica el motor de masa (CPO) con la cinética
 *     de equilibrio HOCl/OCl-/CYA (regla 7.5 %).
 *
 * VERSIÓN: 16.4.6 — Calibración Klaren comercial (~50% NaHSO4)
 *   - V16.4.6 FIX KLAREN-50: NAHSO4_G_POR_PPM_ALK_10M3 ajustado de
 *     25.47 (NaHSO4 técnico 94.5% puro, fórmula CPO directa) a 50.94
 *     (Klaren comercial ~50% activo, calibrado empíricamente con
 *     datos de campo: 220 g en 10 m³ con ALK=83 → -4.1 ppm ALK).
 *     Esta constante ahora coincide con calculadoras.js V15.2.0,
 *     unificando la fuente de verdad para el producto comercial real
 *     usado por el técnico (no el reactivo grado industrial).
 *   - Sin cambios en NAHCO3_G_POR_PPM_ALK_10M3 (16.78 g/ppm/10m³),
 *     que sí es bicarbonato puro (NaHCO3 grado alimenticio).
 *   - calcDeltaPorAplicacion ahora reporta Δ ALK realista para
 *     pH Menos Klaren (~-4.2 ppm en 10 m³ por 220 g, no -8.3 ppm).
 *
 * VERSIÓN: 16.4.5 (heredada) — Pulido auditoría:
 *   - V16.4.5 FIX TYPO: HCl_PPM_ALK_POR_LITRO_10M3 → HCL_PPM_ALK_POR_LITRO_10M3
 *     en calcDeltaPorAplicacion (case-incorrecto producía NaN en deltaALK).
 *   - V16.4.5 FIX LITERAL-MAGICO: literal `10` del modo 'ph' del ácido
 *     muriático reemplazado por this.CONST.ACIDO_L_POR_PUNTO_PH_10M3 * 10.
 *   - V16.4.5 FIX RECIPROCIDAD: factorPH refinado con pH promedio en
 *     calcDeltaPorAplicacion (simétrico con calcDosificacion).
 *   - V16.4.5 FIX -0: impactoMasa.deltaPH se fuerza a 0 literal en modo 'alk'.
 *   - V16.4.5 BOOT-ASSERT: IIFE final verifica 20 constantes críticas.
 *
 * VERSIÓN: 16.4.4 (heredada) — Modo dual Ácido Muriático (pH vs Alcalinidad)
 * VERSIÓN: 16.4.3 (heredada) — Corrección de deltaPH en calcDeltaPorAplicacion
 * VERSIÓN: 16.4.2 (heredada) — ADD: calcDeltaPorAplicacion
 *
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

const Chemistry = {

  VERSION: '16.6.0',

  CONST: {
    TRICLORO_CLORO_PCT:        0.90,
    TRICLORO_CIAN_PCT:         0.55,
    HIPO_CALCIO_CLORO_PCT:     0.65,
    HIPO_CALCIO_DUREZA_PPM_G:  0.8,
    CLORO_LIQUIDO_PCT:         0.10,
    ALCALOS_G_POR_PUNTO_PH_10M3: 11,

    // CPO (Skinner & Hales): 16.78 g NaHCO3 por +1 ppm ALK en 10 m³
    // 16.78 × 10 = 167.8 ≈ 168 g por +10 ppm en 10 m³
    ALKALIN_G_POR_10PPM_10M3:  168,

    ACIDO_L_POR_PUNTO_PH_10M3: 1.0,
    CYA_G_POR_PPM_M3:          1.0,
    CALCIO_G_POR_10PPM_10M3:   100,
    GOLDCLEAR_ML_MANT_POR_M3:  15,
    GOLDCLEAR_ML_CHOQUE_POR_M3: 30,
    MAGNESIO_G_POR_PUNTO_PH_10M3: 8,
    ALGEN_ML_MANT_POR_M3:      10,
    ALGEN_ML_CHOQUE_POR_M3:    20,

    // pH Menos Klaren — Bisulfato de Sodio (NaHSO4) / Ácido Globular
    // Calibrado contra tabla fabricante Klaren (Brunssen Internacional)
    // Base: 55 g por -0.1 pH por 10 m³ (a ALK ~100 ppm, pH ~7.8)
    // NOTA: Klaren comercial es ~50% NaHSO4 activo (no 94.5% técnico).
    // Esta constante ya está calibrada al producto comercial.
    PH_MENOS_G_BASE_POR_01PH_10M3: 55,

    // ─────────────────────────────────────────────────────────
    // V16.4.6 FIX KLAREN-50: Impacto de pH Menos Klaren en Alcalinidad
    // ─────────────────────────────────────────────────────────
    // Fuente teórica (CPO Skinner & Hales para NaHSO4 94.5% técnico):
    //   (Vol_gal ÷ 47,058) × Δppm = lb → 25.47 g/ppm/10m³
    //
    // Calibración empírica al producto comercial Klaren (~50% activo):
    //   Caso de campo Veracruz: 220 g en 10 m³, ALK inicial 83 ppm,
    //   pH inicial 7.8 → Δ pH = -0.41, Δ ALK = -4.1 ppm.
    //   Constante derivada: 220 / 4.1 ≈ 50.94 g/ppm/10m³.
    //
    // Razón del factor 2× respecto al CPO puro: el Klaren comercial
    // está rebajado a la mitad de pureza activa, por lo que se necesita
    // ~el doble de masa para el mismo impacto en ALK.
    //
    // V16.4.6: Esta constante UNIFICA la fuente de verdad con
    // calculadoras.js V15.2.0. No tocar sin recalibrar empíricamente.
    NAHSO4_G_POR_PPM_ALK_10M3: 50.94, // V16.4.6 FIX KLAREN-50

    // Bicarbonato de Sodio por ppm ALK (sin cambios — NaHCO3 puro)
    // Fuente: Skinner & Hales, JSPSI Vol.1 No.1 (CPO)
    // Fórmula CPO: (Vol_gal ÷ 71,425) × Δppm = lb de NaHCO3
    // Para 10 m³ (2,641.72 gal): 0.03699 lb = 16.78 g por +1 ppm ALK
    NAHCO3_G_POR_PPM_ALK_10M3: 16.78,

    // Ácido Muriático impacto ALK
    // Fuente: Skinner & Hales, JSPSI Vol.1 No.1 (CPO)
    // Fórmula CPO: (Vol_gal ÷ 125,000) × Δppm = qt de HCl 31.45%
    // Para 10 m³: 0.02113 qt = 20.0 mL por -1 ppm ALK
    // Inverso: 1 L = 1000 mL / 20.0 = 50 ppm ALK por 10 m³
    HCL_PPM_ALK_POR_LITRO_10M3: 50,

    // V16.4.1 FIX A4: Cloro Líquido aporte de ALK
    // NaOCl 10% es sal alcalina; aporta ALK al disociarse.
    // Referencia: pool industry — 1 ppm Cl libre vía NaOCl 10% eleva ALK ~1.4 ppm.
    NAOCL_DELTA_ALK_POR_PPM_CL: 1.4,

    CYA_BLOQUEO:               75,
    CYA_CRITICO:               100,
    PH_MIN_CRITICO:            7.0,
    PH_MAX_CRITICO:            8.0,
    PH_OPTIMO_MIN:             7.2,
    PH_OPTIMO_MAX:             7.6,

    // V16.5.0: Estas dos constantes se conservan como FALLBACK
    // cuando CYA = 0 (piscina recién llenada, sin estabilizar) o
    // como referencia histórica. La nueva lógica dinámica vive en
    // getUmbralesClorOperativos(cya). No eliminar.
    CL_MIN_SANITARIO:          0.5,
    CL_OPTIMO_MIN:             1.0,

    ALK_OPTIMO_MIN:            80,
    ALK_OPTIMO_MAX:            120,
    CH_OPTIMO_MIN:             200,
    CH_OPTIMO_MAX:             400,
    TDS_OPTIMO_MAX:            1500,
    TDS_CRITICO:               2000,
    ISV_SEGURO_MIN:            -0.3,
    ISV_SEGURO_MAX:             0.3,

    // V16.4.1 FIX A6: Rangos físicamente plausibles para validación
    PH_FISICO_MIN:             4.0,
    PH_FISICO_MAX:             11.0,

    // ─────────────────────────────────────────────────────────
    // V16.5.0 ADD: Regla FC/CYA dinámica (TFP / CMAHC)
    // ─────────────────────────────────────────────────────────
    // El cloro libre necesario para desinfección efectiva NO es
    // un valor absoluto: depende de la concentración de ácido
    // cianúrico (estabilizador). El CYA secuestra HOCl en forma
    // de cloroisocianurato, reduciendo la fracción de HOCl
    // libre activo.
    // Ver getUmbralesClorOperativos() para la implementación.
    FC_CYA_MIN_PCT:            7.5,
    FC_CYA_OBJ_PCT:            10,
    FC_CYA_ALTO_PCT:           30,
    FC_CYA_TOXICO_PCT:         50,
    FC_CYA_SUPERCHOQUE_PCT:    80,
    FC_PISO_ABSOLUTO:          1.5, // FC objetivo mínimo cuando CYA = 0

    // V16.5.3 ADD — Factores de cloro por modo operativo.
    // Mapa: modo → multiplicadores aplicados sobre CYA para derivar
    // cl_objetivo y cl_alto. Cuando el modo es 'metales', los factores
    // son null porque la cloración está bloqueada (HARD-STOP, Regla #5).
    FACTORES_CLORO_POR_MODO: Object.freeze({
      rutinario:           { cl_obj_pct: 0.10, cl_alto_pct: 0.30 },
      rescate:             { cl_obj_pct: 0.40, cl_alto_pct: 0.50 },
      post_choque:         { cl_obj_pct: 0.30, cl_alto_pct: 0.50 },
      recuperacion_severa: { cl_obj_pct: 0.30, cl_alto_pct: 0.50 },
      recuperacion_leve:   { cl_obj_pct: 0.20, cl_alto_pct: 0.40 },
      sarro_controlado:    { cl_obj_pct: 0.10, cl_alto_pct: 0.30 },
      balance:             { cl_obj_pct: 0.10, cl_alto_pct: 0.30 },
      metales:             { cl_obj_pct: null, cl_alto_pct: null }
    }),

    // V16.5.3 ADD — Topes de salud general por modo operativo.
    // Una alberca en modo no rutinario está por definición fuera de
    // operación normal, por lo que su salud general no puede exceder
    // estos topes aunque sus parámetros químicos parezcan correctos.
    TOPES_SALUD_POR_MODO: Object.freeze({
      rutinario:           100,
      rescate:             40,
      post_choque:         70,
      recuperacion_severa: 50,
      recuperacion_leve:   75,
      sarro_controlado:    60,
      balance:             100,
      metales:             30
    }),

    FIRMA: 'Omar Alberto Valle Mercado | VAMO870509HW3'
  },

  // ═══════════════════════════════════════════════
  //  FACTOR TEMPERATURA — Tabla Langelier Pool-Industry
  //  Compatible con fórmula: LSI = pH + TF + CF + AF - 12.1
  // ═══════════════════════════════════════════════

  _factorTemp(tempC) {
    const tabla = [
      { t:  0, f: 0.058 },
      { t:  5, f: 0.134 },
      { t: 10, f: 0.165 },
      { t: 15, f: 0.208 },
      { t: 20, f: 0.247 },
      { t: 25, f: 0.290 },
      { t: 27, f: 0.310 },
      { t: 28, f: 0.320 },
      { t: 29, f: 0.330 },
      { t: 30, f: 0.340 },
      { t: 32, f: 0.360 },
      { t: 35, f: 0.390 },
      { t: 37, f: 0.410 },
      { t: 40, f: 0.440 },
      { t: 45, f: 0.490 },
      { t: 50, f: 0.530 }
    ];

    const temp = parseFloat(tempC) || 0;

    if (temp <= tabla[0].t) return tabla[0].f;
    if (temp >= tabla[tabla.length - 1].t) return tabla[tabla.length - 1].f;

    for (let i = 0; i < tabla.length - 1; i++) {
      const puntoActual = tabla[i];
      const puntoSiguiente = tabla[i + 1];

      if (temp >= puntoActual.t && temp <= puntoSiguiente.t) {
        const deltaT = temp - puntoActual.t;
        const rangoT = puntoSiguiente.t - puntoActual.t;
        const rangoF = puntoSiguiente.f - puntoActual.f;
        const resultado = puntoActual.f + (deltaT * rangoF / rangoT);
        return parseFloat(resultado.toFixed(4));
      }
    }

    return 0.290;
  },

  _colorISV(isv, zonaMin, zonaMax) {
    const v = parseFloat(isv);
    if (v < zonaMin - 0.5) return '#dc2626';
    if (v < zonaMin) return '#f59e0b';
    if (v >= zonaMin && v <= zonaMax) return '#2da44e';
    if (v <= zonaMax + 0.5) return '#3b82f6';
    return '#7c3aed';
  },

  // ═══════════════════════════════════════════════
  //  V16.5.4 FIX: getUmbralesClorOperativos — corrección de unidades
  //  V16.5.3 MOD: getUmbralesClorOperativos recibe modo
  //  V16.5.0 ADD: getUmbralesClorOperativos
  //
  //  Devuelve los umbrales operativos de cloro libre escalados
  //  por CYA y modo operativo. Mapa de modos: FACTORES_CLORO_POR_MODO.
  //  Modo metales: bloquea cloración (cl_objetivo y cl_alto = null).
  //  Si CYA < 20 ppm o no se mide, aplica pisos absolutos.
  // ═══════════════════════════════════════════════

  getUmbralesClorOperativos(cya, modo) {
    const C = this.CONST;
    const cyaN = parseFloat(cya);
    const cyaValido = !isNaN(cyaN) && cyaN >= 20;

    // Normalizar modo: si no existe en la tabla, fallback a 'rutinario'.
    const modoN = (typeof modo === 'string' && C.FACTORES_CLORO_POR_MODO[modo])
      ? modo
      : 'rutinario';

    const factores = C.FACTORES_CLORO_POR_MODO[modoN];
    const esMetales = (modoN === 'metales');

    // Pisos absolutos cuando CYA < 20 o NaN
    const PISO_MIN = C.CL_MIN_SANITARIO;
    const PISO_OBJ = C.FC_PISO_ABSOLUTO;
    const PISO_ALT = 5.0;
    const PISO_TOX = 10.0;
    const PISO_SUP = 20.0;

    if (!cyaValido) {
      return {
        cl_minimo:      PISO_MIN,
        cl_objetivo:    esMetales ? null : PISO_OBJ,
        cl_alto:        esMetales ? null : PISO_ALT,
        cl_toxico:      PISO_TOX,
        cl_superchoque: PISO_SUP,
        cya_referencia: isNaN(cyaN) ? 0 : cyaN,
        regla_aplicada: 'piso_absoluto',
        piso_absoluto_aplicado: true,
        modo_aplicado:  modoN,
        bloqueo_cloracion: esMetales
      };
    }

    // CYA válido: aplicar tabla de modos
    // V16.5.4 FIX: las constantes FC_CYA_*_PCT están almacenadas como
    // porcentaje numerador (7.5, 50, 80). Hay que dividir entre 100
    // para obtener el factor decimal aplicable. La tabla
    // FACTORES_CLORO_POR_MODO ya está en decimal (0.10, 0.30, 0.40)
    // y por eso cl_objetivo y cl_alto NO requieren división.
    return {
      cl_minimo:      parseFloat((cyaN * C.FC_CYA_MIN_PCT / 100).toFixed(2)),
      cl_objetivo:    esMetales ? null : parseFloat((cyaN * factores.cl_obj_pct).toFixed(2)),
      cl_alto:        esMetales ? null : parseFloat((cyaN * factores.cl_alto_pct).toFixed(2)),
      cl_toxico:      parseFloat((cyaN * C.FC_CYA_TOXICO_PCT / 100).toFixed(2)),
      cl_superchoque: parseFloat((cyaN * C.FC_CYA_SUPERCHOQUE_PCT / 100).toFixed(2)),
      cya_referencia: cyaN,
      regla_aplicada: 'fc_cya_dinamica',
      piso_absoluto_aplicado: false,
      modo_aplicado:  modoN,
      bloqueo_cloracion: esMetales
    };
  },

  // ═══════════════════════════════════════════════
  //  V16.6.0 ADD — Fracción HOCl activa por pH y temperatura
  //
  //  El "Cloro Libre" del ColorQ es la suma HOCl + OCl⁻ en
  //  equilibrio:
  //    HOCl ⇌ H⁺ + OCl⁻
  //  Solo HOCl mata efectivamente (OCl⁻ es ~80x menos potente).
  //  El reparto depende del pH, gobernado por el pKa del ácido
  //  hipocloroso, modulado por temperatura.
  //
  //  Aproximación lineal (Pankow, Aquatic Chemistry):
  //    pKa(T) = 7.582 - 0.00913 × (T - 25)   [T en °C, 5°C ≤ T ≤ 40°C]
  //
  //  Fracción HOCl activa:
  //    fHOCl = 1 / (1 + 10^(pH - pKa))
  //
  //  Uso operativo: si FC=3.82 ppm a pH 7.82 y T=28.8°C, el HOCl
  //  efectivo es 3.82 × calcFraccionHOCl(7.82, 28.8) ≈ 1.33 ppm.
  //  Bajar pH a 7.40 sube la fracción a ~0.58, dando 2.23 ppm
  //  efectivos sin agregar cloro (multiplicador ×1.68). Esta es
  //  la base cinética de la regla #2 del manifiesto (ISPB primero,
  //  cloro después).
  //
  //  Estos helpers NO modifican calcDegradacionCloro ni getAlertas.
  //  Son informativos para Isaías (system prompt) y futuros displays
  //  educativos en bitácora.
  // ═══════════════════════════════════════════════

  /**
   * Devuelve la fracción del cloro libre que está como HOCl activo,
   * según el pH y la temperatura del agua.
   * @param {number} ph - pH del agua (4.0-11.0).
   * @param {number} [temperatura] - Temperatura en °C (default 25°C).
   * @returns {number} Fracción entre 0 y 1. NaN si pH inválido.
   */
  calcFraccionHOCl(ph, temperatura) {
    const phN = parseFloat(ph);
    if (isNaN(phN) || phN < this.CONST.PH_FISICO_MIN || phN > this.CONST.PH_FISICO_MAX) {
      return NaN;
    }
    const tN = parseFloat(temperatura);
    const tEff = (isNaN(tN) || tN < 0 || tN > 50) ? 25 : tN;

    const pKa = 7.582 - 0.00913 * (tEff - 25);
    return 1 / (1 + Math.pow(10, phN - pKa));
  },

  /**
   * Calcula el HOCl activo en ppm a partir del cloro libre total
   * y las condiciones del agua. Wrapper de conveniencia.
   * @param {number} cloroLibre - Cl libre en ppm (lectura ColorQ).
   * @param {number} ph - pH del agua.
   * @param {number} [temperatura] - Temperatura en °C.
   * @returns {number} HOCl activo en ppm. NaN si datos inválidos.
   */
  calcHOClActivo(cloroLibre, ph, temperatura) {
    const clN = parseFloat(cloroLibre);
    if (isNaN(clN) || clN < 0) return NaN;
    const f = this.calcFraccionHOCl(ph, temperatura);
    if (isNaN(f)) return NaN;
    return parseFloat((clN * f).toFixed(3));
  },

  _recomendacionISV(ctx) {
    const { isv, ph, pHs, zonaMin, zonaMax, alk, alkCorr, ch, cya, rec } = ctx;
    const recomendaciones = [];
    const dosisAlkalin = this.CONST.ALKALIN_G_POR_10PPM_10M3;

    if (isv >= zonaMin && isv <= zonaMax) {
      recomendaciones.push('Agua en equilibrio perfecto con el recubrimiento.');
      recomendaciones.push('Mantener dosificacion rutinaria de Tricloro 90%.');
      if (cya >= 50) {
        // V16.5.0: añadir referencia FC objetivo dinámico
        const umbCya = this.getUmbralesClorOperativos(cya);
        recomendaciones.push(
          'CYA en rango alto (' + cya + ' ppm): Monitorear acumulacion. ' +
          'Objetivo Cl libre ~' + umbCya.cl_objetivo + ' ppm (regla FC/CYA 10%). ' +
          'Evaluar retrolavado si supera 75 ppm.'
        );
      }
    } else if (isv < zonaMin) {
      if (isv < zonaMin - 0.5) {
        recomendaciones.push('AGUA AGRESIVA CRITICA: Riesgo de corrosion en equipos y estructura.');
        recomendaciones.push('Accion inmediata: Subir alcalinidad con Alkalin Spin (' + dosisAlkalin + 'g por +10 ppm en 10 m3).');
        recomendaciones.push('Subir dureza calcica con Cloruro de Calcio si CH < 200 ppm.');
      } else {
        recomendaciones.push('Agua ligeramente agresiva: Tendencia corrosiva moderada.');
        recomendaciones.push('Subir alcalinidad con Alkalin Spin hacia 90-110 ppm.');
      }
    } else {
      if (isv > zonaMax + 0.5) {
        recomendaciones.push('AGUA INCRUSTANTE CRITICA: Riesgo de depositos en tuberias y equipo.');
        recomendaciones.push('Accion inmediata: Bajar pH con pH Menos Klaren o Acido Muriatico.');
        recomendaciones.push('Considerar reduccion de alcalinidad si supera 120 ppm.');
      } else {
        recomendaciones.push('Agua ligeramente incrustante: Tendencia a depositar carbonatos.');
        recomendaciones.push('Bajar pH hacia 7.2-7.4 con pH Menos Klaren en pequenas dosis.');
      }
      if (ch > 400) {
        recomendaciones.push('Dureza muy alta (>400 ppm): Evaluar cambio parcial de agua.');
      }
    }

    if (rec === 'fibra' || (typeof rec === 'string' && rec.includes('fibra'))) {
      recomendaciones.push('Para fibra prefabricada: mantener ISPB ligeramente negativo (-0.1 a +0.1).');
    } else if (rec === 'pebble' || rec === 'piedra') {
      recomendaciones.push('Para acabado mineral: tolera mayor incrustacion (+0.5 max).');
    }

    if (Math.abs(isv) > 0.3) {
      recomendaciones.push(`pHs calculado: ${pHs.toFixed(2)}. Ajustar quimica para acercar pH a este valor.`);
    }

    return recomendaciones;
  },

  // ═══════════════════════════════════════════════
  //  CALC ISV — Factor Omar / ISPB
  // ═══════════════════════════════════════════════

  calcISV(params) {
    const {
      ph, temperatura, dureza, alcalinidad,
      cianurico = 0, tds = 0, recubrimiento = 'porcelanato'
    } = params || {};

    const phN   = parseFloat(ph);
    const tempN = parseFloat(temperatura);
    const durN  = parseFloat(dureza);
    const alkN  = parseFloat(alcalinidad);

    if (isNaN(phN) || isNaN(tempN) || isNaN(durN) || isNaN(alkN)) return null;
    if (durN <= 0 || alkN <= 0) return null;

    if (phN < this.CONST.PH_FISICO_MIN || phN > this.CONST.PH_FISICO_MAX) {
      console.warn('[Chemistry.calcISV] pH fuera de rango físico (' + this.CONST.PH_FISICO_MIN + '-' + this.CONST.PH_FISICO_MAX + '): ' + phN);
      return null;
    }

    const cianN = parseFloat(cianurico) || 0;
    const tdsN  = parseFloat(tds) || 0;

    const F_T = this._factorTemp(tempN);
    const F_CH = parseFloat(Math.log10(durN).toFixed(4));

    const alkCorr = Math.max(1, alkN - (cianN / 3));
    const F_ALK = parseFloat(Math.log10(alkCorr).toFixed(4));

    let F_TDS = 0;
    if (tdsN > 1000) {
      F_TDS = parseFloat((0.1 * Math.log10(tdsN / 1000)).toFixed(4));
    }

    const LANGELIER_CONST = 12.1;
    const pHs = parseFloat((LANGELIER_CONST + F_TDS - F_T - F_CH - F_ALK).toFixed(2));
    const isv = parseFloat((phN - pHs).toFixed(2));

    const zonas = {
      porcelanato: { min: -0.10, max: 0.30 },
      veneciano:   { min: -0.10, max: 0.30 },
      fibra:       { min: -0.30, max: 0.10 },
      pebble:      { min: -0.20, max: 0.50 },
      vinil:       { min: -0.30, max: 0.20 },
      azulejo:     { min: -0.15, max: 0.35 },
      concreto:    { min: -0.20, max: 0.40 },
      piedra:      { min: -0.20, max: 0.50 }
    };

    const zona    = zonas[recubrimiento] || zonas.porcelanato;
    const zonaMin = zona.min;
    const zonaMax = zona.max;

    let estado;
    if (isv < zonaMin - 0.5)       estado = 'Corrosivo Critico';
    else if (isv < zonaMin)        estado = 'Ligeramente Corrosivo';
    else if (isv <= zonaMax)       estado = 'Equilibrio Perfecto';
    else if (isv <= zonaMax + 0.5) estado = 'Ligeramente Incrustante';
    else                           estado = 'Incrustante Critico';

    const color = this._colorISV(isv, zonaMin, zonaMax);

    const recomendacion = this._recomendacionISV({
      isv, ph: phN, pHs, zonaMin, zonaMax,
      alk: alkN, alkCorr, ch: durN, cya: cianN, rec: recubrimiento
    });

    const F_ALK_sin_cya = parseFloat(Math.log10(alkN).toFixed(4));
    const isl_ref = parseFloat(
      (phN + F_T + F_CH + F_ALK_sin_cya - LANGELIER_CONST - F_TDS).toFixed(2)
    );

    return {
      isv, pHs, estado, color,
      F_T:     parseFloat(F_T.toFixed(4)),
      F_CH:    parseFloat(F_CH.toFixed(4)),
      F_ALK:   parseFloat(F_ALK.toFixed(4)),
      F_TDS:   parseFloat(F_TDS.toFixed(4)),
      alkCorr: parseFloat(alkCorr.toFixed(1)),
      zonaMin, zonaMax, recubrimiento,
      recomendacion, isl_ref,
      firma: this.CONST.FIRMA
    };
  },

  // ═══════════════════════════════════════════════
  //  GET ALERTAS — Regla Suprema de Cloracion
  //  V16.5.3: modo operativo consciente (silencia cloro en metales y alto en rescate)
  //  V16.5.0: cloro libre evaluado contra umbrales dinámicos FC/CYA
  // ═══════════════════════════════════════════════

  getAlertas(params, options) {
    const {
      ph, cloro_libre, alcalinidad, dureza, cianurico, tds, turbidez,
      isv = null, nivel_cliente = 'estandar'
    } = params || {};

    const opts = options || {};
    const modo = (typeof opts.modo === 'string' && opts.modo) ? opts.modo : 'rutinario';

    const alertas = [];
    const isvN = parseFloat(isv);
    const isvDisponible = !isNaN(isvN);
    const isvFueraDeRango = isvDisponible &&
      (isvN < this.CONST.ISV_SEGURO_MIN || isvN > this.CONST.ISV_SEGURO_MAX);
    const isvCorrosivo = isvDisponible && isvN < this.CONST.ISV_SEGURO_MIN;
    const isvIncrustante = isvDisponible && isvN > this.CONST.ISV_SEGURO_MAX;

    const esPremium = (nivel_cliente || '').toLowerCase() === 'premium';
    const alguicidaNombre = esPremium ? 'Algen Plus Klaren (Premium)' : 'Algen Blue Klaren';
    const alguicidaProducto = esPremium ? 'algen-plus' : 'algen-blue';
    const dosisAlkalin = this.CONST.ALKALIN_G_POR_10PPM_10M3;

    const cianN = parseFloat(cianurico) || 0;
    if (cianN >= this.CONST.CYA_CRITICO) {
      alertas.push({
        nivel: 'CRITICO', param: 'cianurico', valor: cianN,
        mensaje: 'CYA CRITICO: ' + cianN + ' ppm (>=' + this.CONST.CYA_CRITICO + ' ppm). Cambio parcial de agua obligatorio (>=50%).',
        accion: 'Suspender todo tricloro. Cambio de agua inmediato.',
        producto: null, prioridad: 1
      });
    } else if (cianN >= this.CONST.CYA_BLOQUEO) {
      alertas.push({
        nivel: 'ADVERTENCIA', param: 'cianurico', valor: cianN,
        mensaje: 'CYA BLOQUEADO: ' + cianN + ' ppm (>=' + this.CONST.CYA_BLOQUEO + ' ppm). Suspender Tricloro.',
        accion: 'Cambiar a Hipocalcio Klaren 65% como fuente de cloro.',
        producto: 'hipoclorito-calcio', prioridad: 2
      });
    }

    if (isvFueraDeRango) {
      if (isvCorrosivo) {
        alertas.push({
          nivel: 'CRITICO', param: 'isv', valor: isvN,
          mensaje: 'ISPB CORROSIVO: ' + isvN + ' (limite: ' + this.CONST.ISV_SEGURO_MIN + '). Agua agresiva. Corregir balance hidrico ANTES de clorar.',
          accion: 'Subir alcalinidad con Alkalin Spin y/o dureza con Cloruro de Calcio. No agregar cloro hasta estabilizar ISPB.',
          producto: 'alkalin', prioridad: 1
        });
      } else if (isvIncrustante) {
        alertas.push({
          nivel: 'CRITICO', param: 'isv', valor: isvN,
          mensaje: 'ISPB INCRUSTANTE: ' + isvN + ' (limite: +' + this.CONST.ISV_SEGURO_MAX + '). Riesgo de depositos. Corregir balance hidrico ANTES de clorar.',
          accion: 'Bajar pH y/o alcalinidad con pH Menos Klaren o Acido Muriatico. No agregar cloro hasta estabilizar ISPB.',
          producto: 'ph-menos', prioridad: 1
        });
      }
    }

    const phN = parseFloat(ph);
    if (!isNaN(phN)) {
      if (phN < this.CONST.PH_MIN_CRITICO || phN > this.CONST.PH_MAX_CRITICO) {
        alertas.push({
          nivel: 'CRITICO', param: 'ph', valor: phN,
          mensaje: 'pH CRITICO: ' + phN + ' (rango seguro: ' + this.CONST.PH_MIN_CRITICO + '-' + this.CONST.PH_MAX_CRITICO + '). Ajuste inmediato.',
          accion: phN < 7.0 ? 'Aplicar Alcalos Spin.' : 'Aplicar pH Menos Klaren o Acido Muriatico.',
          producto: phN < 7.0 ? 'alcalos' : 'ph-menos', prioridad: 1
        });
      } else if (phN < this.CONST.PH_OPTIMO_MIN || phN > this.CONST.PH_OPTIMO_MAX) {
        alertas.push({
          nivel: 'ADVERTENCIA', param: 'ph', valor: phN,
          mensaje: 'pH fuera del optimo: ' + phN + ' (optimo: ' + this.CONST.PH_OPTIMO_MIN + '-' + this.CONST.PH_OPTIMO_MAX + ').',
          accion: phN < this.CONST.PH_OPTIMO_MIN ? 'Aplicar Alcalos Spin.' : 'Aplicar pH Menos Klaren o Acido Muriatico.',
          producto: phN < this.CONST.PH_OPTIMO_MIN ? 'alcalos' : 'ph-menos', prioridad: 3
        });
      }
    }

    // ─────────────────────────────────────────────────────
    // V16.5.3 REFACTOR: Cloro libre evaluado por regla FC/CYA y modo
    // ─────────────────────────────────────────────────────
    const clN = parseFloat(cloro_libre);
    if (!isNaN(clN)) {
      const umbCl = this.getUmbralesClorOperativos(cianN, modo);
      const refCYA = umbCl.cya_referencia > 0
        ? '(CYA ' + umbCl.cya_referencia + ' ppm, regla FC/CYA dinamica, modo ' + modo + ')'
        : '(CYA no medido, pisos absolutos, modo ' + modo + ')';

      // V16.5.3: si el modo es metales, la cloración está bloqueada.
      // Silenciar todas las alertas de cloro (alto, bajo, crítico,
      // tóxico, superchoque) porque el técnico no debe dosificar
      // cloro hasta resolver el problema de metales.
      const cloroBloqueado = (umbCl.bloqueo_cloracion === true);

      // ── 1) SUPERCHOQUE: cloro extremadamente alto (NUNCA silenciado) ─────
      if (clN >= umbCl.cl_superchoque) {
        alertas.push({
          nivel: 'CRITICO', param: 'cloro_libre', valor: clN,
          mensaje: 'CLORO LIBRE — SUPERCHOQUE: ' + clN + ' ppm (umbral: ' + umbCl.cl_superchoque + ' ppm) ' + refCYA + '. Cierre temporal de la alberca.',
          accion: 'SUSPENDER toda cloracion. Cambio parcial de agua 30-50% y/o esperar degradacion natural por UV. NO permitir banistas hasta que Cl libre <= ' + umbCl.cl_objetivo + ' ppm.',
          producto: null, prioridad: 1
        });
      }
      // ── 2) TÓXICO: cloro tóxico, suspender cloración (NUNCA silenciado) ──
      else if (clN >= umbCl.cl_toxico) {
        alertas.push({
          nivel: 'CRITICO', param: 'cloro_libre', valor: clN,
          mensaje: 'CLORO LIBRE TOXICO: ' + clN + ' ppm (umbral: ' + umbCl.cl_toxico + ' ppm) ' + refCYA + '. Riesgo a banistas.',
          accion: 'Suspender cloracion. Dilucion parcial 20-30% o esperar degradacion natural por UV. Reabrir cuando Cl libre <= ' + umbCl.cl_objetivo + ' ppm.',
          producto: null, prioridad: 1
        });
      }
      // ── 3) ALTO: no permitir bañistas (silenciado en rescate/post_choque/recup_severa) ────────
      else if (umbCl.cl_alto !== null && clN >= umbCl.cl_alto && modo !== 'rescate' &&
               modo !== 'post_choque' && modo !== 'recuperacion_severa') {
        if (!cloroBloqueado) {
          alertas.push({
            nivel: 'ADVERTENCIA', param: 'cloro_libre', valor: clN,
            mensaje: 'Cloro libre alto: ' + clN + ' ppm (umbral: ' + umbCl.cl_alto + ' ppm) ' + refCYA + '. No permitir banistas hasta normalizar.',
            accion: 'Reducir dosificacion de Tricloro/Hipocalcio. Esperar degradacion UV o dilucion parcial. Objetivo: ~' + umbCl.cl_objetivo + ' ppm.',
            producto: null, prioridad: 2
          });
        }
      }
      // ── 4) BAJO: cloro libre por debajo del mínimo (silenciado en metales) ───
      else if (clN < umbCl.cl_minimo) {
        if (!cloroBloqueado) {
          if (isvFueraDeRango) {
            alertas.push({
              nivel: 'CRITICO', param: 'cloro_libre', valor: clN,
              mensaje: 'CLORO LIBRE CRITICO: ' + clN + ' ppm (minimo: ' + umbCl.cl_minimo + ' ppm) ' + refCYA + '. PERO el ISPB (' + isvN + ') esta fuera de rango seguro. CORREGIR BALANCE HIDRICO PRIMERO.',
              accion: isvCorrosivo
                ? 'Primero: estabilizar ISPB subiendo alcalinidad/dureza. Despues: clorar hacia ' + umbCl.cl_objetivo + ' ppm.'
                : 'Primero: estabilizar ISPB bajando pH/alcalinidad con pH Menos Klaren. Despues: clorar hacia ' + umbCl.cl_objetivo + ' ppm.',
              producto: isvCorrosivo ? 'alkalin' : 'ph-menos', prioridad: 1
            });
          } else {
            alertas.push({
              nivel: 'CRITICO', param: 'cloro_libre', valor: clN,
              mensaje: 'CLORO LIBRE CRITICO: ' + clN + ' ppm (minimo: ' + umbCl.cl_minimo + ' ppm, objetivo: ' + umbCl.cl_objetivo + ' ppm) ' + refCYA + '. Riesgo biologico.' +
                (isvDisponible ? ' ISPB: ' + isvN + ' (en rango). Cloracion autorizada.' : ' ISPB no disponible. Verificar antes de dosificar.'),
              accion: cianN >= this.CONST.CYA_BLOQUEO
                ? 'Aplicar Hipocalcio Klaren 65% (CYA bloqueado). Objetivo: ' + umbCl.cl_objetivo + ' ppm.'
                : 'Aplicar Tricloro 90% para cloracion de choque. Objetivo: ' + umbCl.cl_objetivo + ' ppm.',
              producto: cianN >= this.CONST.CYA_BLOQUEO ? 'hipoclorito-calcio' : 'tricloro-polvo', prioridad: 1
            });
          }
        }
      }
      // ── 5) BAJO MODERADO: por debajo del objetivo (silenciado en metales) ────
      else if (clN < umbCl.cl_objetivo) {
        if (!cloroBloqueado) {
          if (isvFueraDeRango) {
            alertas.push({
              nivel: 'ADVERTENCIA', param: 'cloro_libre', valor: clN,
              mensaje: 'Cloro libre bajo: ' + clN + ' ppm (objetivo: ' + umbCl.cl_objetivo + ' ppm) ' + refCYA + '. ISPB fuera de rango (' + isvN + '). Estabilizar balance hidrico antes de aumentar cloro.',
              accion: 'Corregir ISPB primero, luego ajustar cloro hacia ' + umbCl.cl_objetivo + ' ppm.',
              producto: null, prioridad: 2
            });
          } else {
            alertas.push({
              nivel: 'ADVERTENCIA', param: 'cloro_libre', valor: clN,
              mensaje: 'Cloro libre bajo: ' + clN + ' ppm (objetivo: ' + umbCl.cl_objetivo + ' ppm) ' + refCYA + '.' +
                (isvDisponible ? ' ISPB: ' + isvN + ' (OK).' : ''),
              accion: cianN >= this.CONST.CYA_BLOQUEO
                ? 'Usar Hipocalcio Klaren 65%. Objetivo: ' + umbCl.cl_objetivo + ' ppm.'
                : 'Aumentar dosis de Tricloro 90%. Objetivo: ' + umbCl.cl_objetivo + ' ppm.',
              producto: cianN >= this.CONST.CYA_BLOQUEO ? 'hipoclorito-calcio' : 'tricloro-polvo', prioridad: 2
            });
          }
        }
      }
      // ── 6) En rango: entre objetivo y alto, sin alerta ──
    }
    // ────────────────────────────────────────────── fin sección cloro

    const tdsN = parseFloat(tds);
    if (!isNaN(tdsN)) {
      if (tdsN >= this.CONST.TDS_CRITICO) {
        alertas.push({
          nivel: 'CRITICO', param: 'tds', valor: tdsN,
          mensaje: 'TDS CRITICO: ' + tdsN + ' ppm (>=' + this.CONST.TDS_CRITICO + ' ppm). Cambio de agua necesario.',
          accion: 'Cambio parcial de agua (30-50%).',
          producto: null, prioridad: 2
        });
      } else if (tdsN > this.CONST.TDS_OPTIMO_MAX) {
        alertas.push({
          nivel: 'ADVERTENCIA', param: 'tds', valor: tdsN,
          mensaje: 'TDS elevado: ' + tdsN + ' ppm (maximo: ' + this.CONST.TDS_OPTIMO_MAX + ' ppm).',
          accion: 'Aumentar frecuencia de retrolavados.',
          producto: null, prioridad: 4
        });
      }
    }

    const alkN = parseFloat(alcalinidad);
    if (!isNaN(alkN)) {
      if (alkN < this.CONST.ALK_OPTIMO_MIN) {
        alertas.push({
          nivel: 'ADVERTENCIA', param: 'alcalinidad', valor: alkN,
          mensaje: 'Alcalinidad baja: ' + alkN + ' ppm (optimo: ' + this.CONST.ALK_OPTIMO_MIN + '-' + this.CONST.ALK_OPTIMO_MAX + ' ppm). pH inestable.',
          accion: 'Aplicar Alkalin Spin: ' + dosisAlkalin + 'g por +10 ppm en 10 m3.',
          producto: 'alkalin', prioridad: 3
        });
      } else if (alkN > this.CONST.ALK_OPTIMO_MAX) {
        alertas.push({
          nivel: 'INFO', param: 'alcalinidad', valor: alkN,
          mensaje: 'Alcalinidad alta: ' + alkN + ' ppm. Puede elevar el pH y causar agua turbia.',
          accion: 'Reducir con pH Menos Klaren o Acido Muriatico en pequenas dosis.',
          producto: 'ph-menos', prioridad: 5
        });
      }
    }

    const durN = parseFloat(dureza);
    if (!isNaN(durN)) {
      if (durN < this.CONST.CH_OPTIMO_MIN) {
        alertas.push({
          nivel: 'ADVERTENCIA', param: 'dureza', valor: durN,
          mensaje: 'Dureza calcica baja: ' + durN + ' ppm (optimo: ' + this.CONST.CH_OPTIMO_MIN + '-' + this.CONST.CH_OPTIMO_MAX + ' ppm). Riesgo de corrosion.',
          accion: 'Agregar Cloruro de Calcio: 100g por +10 ppm en 10 m3.',
          producto: 'cloruro-calcio', prioridad: 4
        });
      } else if (durN > this.CONST.CH_OPTIMO_MAX) {
        alertas.push({
          nivel: 'INFO', param: 'dureza', valor: durN,
          mensaje: 'Dureza alta: ' + durN + ' ppm. Contribuye a incrustacion.',
          accion: 'Evaluar cambio parcial de agua si supera 500 ppm.',
          producto: null, prioridad: 6
        });
      }
    }

    if (turbidez) {
      if (turbidez === 'verde' || turbidez === 'cafe' || turbidez === 'café') {
        alertas.push({
          nivel: 'CRITICO', param: 'turbidez', valor: turbidez,
          mensaje: 'TURBIDEZ CRITICA: Agua ' + turbidez + '. Posible proliferacion de algas.',
          accion: 'Cloracion de choque + ' + alguicidaNombre + '.',
          producto: alguicidaProducto, prioridad: 1
        });
      } else if (turbidez === 'turbia') {
        alertas.push({
          nivel: 'ADVERTENCIA', param: 'turbidez', valor: turbidez,
          mensaje: 'Agua turbia. Verificar filtracion y cloro libre.',
          accion: 'Aplicar Gold & Clear Klaren como clarificante.',
          producto: 'gold-and-clear', prioridad: 3
        });
      }
    }

    alertas.sort((a, b) => a.prioridad - b.prioridad);
    return alertas;
  },

  calcVolumen(forma, dims) {
    const largo = parseFloat(dims.largo) || 0;
    const ancho = parseFloat(dims.ancho) || 0;
    const profProm = parseFloat(dims.prof_prom) || 0;
    let vol = 0;
    if (forma === 'rectangular') vol = largo * ancho * profProm;
    else if (forma === 'ovalada' || forma === 'oval') vol = Math.PI * (largo / 2) * (ancho / 2) * profProm;
    else if (forma === 'irregular') { const sup = parseFloat(dims.superficie) || largo; vol = sup * profProm; }
    else vol = largo * ancho * profProm;
    return parseFloat(vol.toFixed(2));
  },

  // ═══════════════════════════════════════════════
  //  V15 — FUNCIONES DEL GEMELO DIGITAL VIVO
  // ═══════════════════════════════════════════════

  // V16.5.1 MOD: nuevo parámetro opcional `albedo` que ajusta el UV efectivo.
  // La fórmula de degradación en sí NO se modifica; solo cambia el insumo.
  calcDegradacionCloro(cloro_inicial, horas_transcurridas, iuv, cya, temperatura, albedo) {
    const cl0 = parseFloat(cloro_inicial) || 0;
    const horas = parseFloat(horas_transcurridas) || 0;
    const uvIdx = Math.max(0, parseFloat(iuv) || 0);
    const cyaN = Math.max(0, parseFloat(cya) || 0);
    const tempC = parseFloat(temperatura) || 25;

    if (cl0 <= 0) return 0;
    if (horas <= 0) return parseFloat(cl0.toFixed(2));

    // V16.5.1 ADD: ganancia UV reflejada por albedo del vaso
    var albedoUsado = (typeof albedo === 'number' && albedo >= 0 && albedo <= 1)
                       ? albedo : 0.40;
    // El UV efectivo que ataca al cloro es el directo + el rebote.
    // Modelo conservador: el rebote suma 50% de su valor reflejado.
    var uvAjustado = uvIdx * (1 + 0.5 * albedoUsado);

    const k_base = 0.015;
    const factor_uv = 1 + (uvAjustado / 10) * 0.5; // V16.5.1 MOD: uvIdx → uvAjustado
    const factor_temp = Math.max(0.5, 1 + (tempC - 25) * 0.02);
    const factor_cya = Math.max(0.3, 1 - (cyaN / 150));
    const k = k_base * factor_uv * factor_temp * factor_cya;
    const cloro_final = cl0 * Math.exp(-k * horas);

    return parseFloat(Math.max(0, cloro_final).toFixed(2));
  },

  calcDeltaPhDesgasificacion(ph_inicial, horas_transcurridas, alcalinidad, factor_desgasificacion_co2) {
    const phI = parseFloat(ph_inicial) || 7.4;
    const horas = parseFloat(horas_transcurridas) || 0;
    const alk = parseFloat(alcalinidad) || 100;
    const factCO2 = Math.max(0, parseFloat(factor_desgasificacion_co2) || 0);

    if (horas <= 0 || factCO2 <= 0) return 0;

    const k_desgasificacion = 0.0015;
    const factor_buffer = Math.max(0.2, 1 + (120 - alk) / 100);
    let delta = k_desgasificacion * horas * factCO2 * factor_buffer;

    const PH_EQUILIBRIO = 8.4;
    const gap = Math.max(0, PH_EQUILIBRIO - phI);
    delta = Math.min(delta, gap);

    return parseFloat(Math.max(0, delta).toFixed(3));
  },

  calcDilucionReposicion(conc_actual_ppm, vol_actual_m3, conc_llenado_ppm, vol_llenado_l) {
    const cActual = parseFloat(conc_actual_ppm) || 0;
    const vActual = parseFloat(vol_actual_m3) || 0;
    const cLlenado = parseFloat(conc_llenado_ppm) || 0;
    const vLlenadoL = parseFloat(vol_llenado_l) || 0;

    if (vLlenadoL <= 0) return parseFloat(cActual.toFixed(2));
    if (vActual <= 0) return parseFloat(cLlenado.toFixed(2));

    const vLlenadoM3 = vLlenadoL / 1000;
    const vFinal = vActual + vLlenadoM3;
    const nuevaConc = (cActual * vActual + cLlenado * vLlenadoM3) / vFinal;

    return parseFloat(Math.max(0, nuevaConc).toFixed(2));
  },

  calcConcentracionPostEvaporacion(conc_actual_ppm, vol_inicial_m3, vol_evaporado_l) {
    const cActual = parseFloat(conc_actual_ppm) || 0;
    const vInicial = parseFloat(vol_inicial_m3) || 0;
    const vEvapL = parseFloat(vol_evaporado_l) || 0;

    if (vEvapL <= 0) return parseFloat(cActual.toFixed(2));
    if (vInicial <= 0) return parseFloat(cActual.toFixed(2));

    const vEvapM3 = vEvapL / 1000;
    const vFinal = Math.max(0.1, vInicial - vEvapM3);
    const nuevaConc = cActual * (vInicial / vFinal);

    return parseFloat(Math.max(0, nuevaConc).toFixed(2));
  },

  calcDisolucionSarro(masa_inicial_g, isv_actual, temperatura_c, horas_filtracion) {
    const masa = parseFloat(masa_inicial_g) || 0;
    const isv = parseFloat(isv_actual) || 0;
    const tempC = parseFloat(temperatura_c) || 25;
    const horas = parseFloat(horas_filtracion) || 0;

    if (isv >= 0) return 0;
    if (masa <= 0 || horas <= 0) return 0;

    const k_base = 0.015;
    const factor_agresividad = Math.abs(isv);
    const factor_temp = Math.max(0.5, 1 + (tempC - 25) * 0.02);
    const k = k_base * factor_agresividad * factor_temp;
    const masa_disuelta = masa * (1 - Math.exp(-k * horas));

    return parseFloat(Math.min(masa, Math.max(0, masa_disuelta)).toFixed(1));
  },

  protocoloDisolucion9h(masa_sarro_g, isv, temp_c) {
    const HORAS_PROTOCOLO = 9;
    const disuelto = this.calcDisolucionSarro(masa_sarro_g, isv, temp_c, HORAS_PROTOCOLO);
    const porcentaje = masa_sarro_g > 0 ? parseFloat((disuelto / masa_sarro_g * 100).toFixed(1)) : 0;

    return {
      horas: HORAS_PROTOCOLO,
      masa_inicial_g: masa_sarro_g,
      masa_disuelta_g: disuelto,
      masa_restante_g: parseFloat((masa_sarro_g - disuelto).toFixed(1)),
      porcentaje_disuelto: porcentaje,
      isv_utilizado: isv,
      temperatura_c: temp_c,
      protocolo: 'Ley de Compensacion por Disolucion — Pool Balance (modelo empirico propietario, no estandar de industria)',
      firma: this.CONST.FIRMA
    };
  },

  // ═══════════════════════════════════════════════
  //  CALC HEALTH
  //  V16.5.3: aplica tope de salud según modo operativo
  //  V16.5.0: penalización por cloro usa umbrales dinámicos FC/CYA
  // ═══════════════════════════════════════════════

  calcHealth(params, modo) {
    const { ph, cloro_libre, alcalinidad, dureza, cianurico, tds } = params || {};
    let score = 100;

    const phN = parseFloat(ph);
    if (!isNaN(phN)) {
      const devPh = Math.abs(phN - 7.4);
      if (devPh > 1.0) score -= 25;
      else if (devPh > 0.4) score -= 15;
      else if (devPh > 0.2) score -= 5;
    }

    // V16.5.0: cloro penalizado contra umbrales dinámicos FC/CYA
    const clN = parseFloat(cloro_libre);
    const cianN = parseFloat(cianurico);
    if (!isNaN(clN)) {
      const umbCl = this.getUmbralesClorOperativos(cianN);
      // Cloro bajo
      if (clN < umbCl.cl_minimo) score -= 30;
      else if (clN < umbCl.cl_objetivo * 0.6) score -= 20; // muy por debajo del objetivo
      else if (clN < umbCl.cl_objetivo)       score -= 8;  // por debajo del objetivo
      // Cloro alto (con CYA)
      if (clN > umbCl.cl_alto) score -= 10;
    }

    if (!isNaN(cianN)) {
      if (cianN >= this.CONST.CYA_CRITICO) score -= 20;
      else if (cianN >= this.CONST.CYA_BLOQUEO) score -= 12;
      else if (cianN > 60) score -= 5;
    }

    const alkN = parseFloat(alcalinidad);
    if (!isNaN(alkN)) {
      if (alkN < 60 || alkN > 180) score -= 10;
      else if (alkN < 80 || alkN > 120) score -= 5;
    }

    const tdsN = parseFloat(tds);
    if (!isNaN(tdsN)) {
      if (tdsN >= this.CONST.TDS_CRITICO) score -= 10;
      else if (tdsN > this.CONST.TDS_OPTIMO_MAX) score -= 5;
    }

    const durN = parseFloat(dureza);
    if (!isNaN(durN)) {
      if (durN < 100 || durN > 500) score -= 5;
    }

    // V16.5.3 — Aplicar tope según modo operativo. Una alberca en
    // modo no rutinario está fuera de operación normal y su salud
    // general no puede exceder estos topes aunque los parámetros
    // químicos parezcan correctos.
    const C = this.CONST;
    const modoN = (typeof modo === 'string' && C.TOPES_SALUD_POR_MODO[modo] !== undefined)
      ? modo
      : 'rutinario';
    const topeSalud = C.TOPES_SALUD_POR_MODO[modoN];
    score = Math.min(score, topeSalud);

    return Math.max(0, Math.min(100, Math.round(score)));
  },

  healthLabel(score) {
    const s = parseInt(score) || 0;
    if (s >= 90) return { label: 'Excelente', color: '#2da44e', descripcion: 'Agua en condiciones optimas.' };
    if (s >= 75) return { label: 'Bueno', color: '#3b82f6', descripcion: 'Agua saludable. Ajustes menores.' };
    if (s >= 55) return { label: 'Regular', color: '#f59e0b', descripcion: 'Fuera de parametros. Intervencion necesaria.' };
    if (s >= 30) return { label: 'Deficiente', color: '#ef4444', descripcion: 'Accion correctiva inmediata.' };
    return { label: 'Critico', color: '#dc2626', descripcion: 'Agua no apta. Cierre temporal.' };
  },

  // ═══════════════════════════════════════════════
  //  CALC DOSIFICACION — Motor Klaren/Spin
  //
  //  V16.5.0: tricloro-*, hipoclorito-calcio y cloro-liquido aceptan
  //  ctx.modo_objetivo === 'fc_cya_dinamico'. Cuando se activa y
  //  cam <= 0, el método calcula internamente el delta requerido
  //  para llegar a cl_objetivo dinámico (basado en ctx.cianurico y
  //  ctx.cloro_libre_actual). Sin esa bandera el comportamiento es
  //  idéntico al previo. Cero regresión.
  //
  //  V16.5.2: Alkalin reporta colateral pH (0.003 pH/ppm ALK) y
  //  setea impactoMasa.deltaPH. Alcalos: hard-stop si delta pH > 2.0,
  //  aviso ámbar si > 1.0.
  // ═══════════════════════════════════════════════

  calcDosificacion(producto, volM3, phActual, cambio, contextoGemelo) {
    const vol   = parseFloat(volM3)   || 50;
    const phA   = parseFloat(phActual) || 7.4;
    let   cam   = parseFloat(cambio)   || 0;
    const firma = this.CONST.FIRMA;

    const ctx = contextoGemelo || {};
    const ctxAlk  = parseFloat(ctx.alcalinidad) || 0;
    const ctxTemp = parseFloat(ctx.temperatura) || 0;
    const ctxCH   = parseFloat(ctx.dureza) || 0;
    const ctxCYA  = parseFloat(ctx.cianurico) || 0;
    const ctxTDS  = parseFloat(ctx.tds) || 0;
    const ctxISV  = parseFloat(ctx.isv);
    const ctxRec  = ctx.recubrimiento || '';
    const ctxClActual = parseFloat(ctx.cloro_libre_actual);
    const modoObjetivoDinamico = (ctx.modo_objetivo === 'fc_cya_dinamico');

    const resultado = {
      cantidad: 0, unidad: 'g', producto: '', nota: '', firma,
      impactoMasa: { deltaCYA: 0, deltaCl: 0, deltaCH: 0, deltaALK: 0 }
    };

    // V16.5.0: Helper interno para auto-calcular cam desde objetivo dinámico
    // Sólo se activa cuando cam <= 0 Y modoObjetivoDinamico === true.
    // Devuelve el delta de cloro libre (ppm) necesario para llegar a cl_objetivo.
    const _calcCamDesdeFcCya = () => {
      if (!modoObjetivoDinamico || cam > 0) return cam;
      const umb = this.getUmbralesClorOperativos(ctxCYA);
      const clActual = !isNaN(ctxClActual) ? Math.max(0, ctxClActual) : 0;
      const deltaNecesario = umb.cl_objetivo - clActual;
      return Math.max(0, parseFloat(deltaNecesario.toFixed(2)));
    };

    // ─── TRICLORO 90% ───
    if (['tricloro', 'tricloro-polvo', 'tricloro-grano'].includes(producto)) {
      cam = _calcCamDesdeFcCya();
      if (cam <= 0) return null;
      const gramos = parseFloat(((cam * vol) / this.CONST.TRICLORO_CLORO_PCT).toFixed(1));
      const deltaCYA = parseFloat(((gramos * this.CONST.TRICLORO_CIAN_PCT) / vol).toFixed(2));
      resultado.cantidad = gramos;
      resultado.producto = 'Tricloro 90% (Granulado)';
      resultado.nota = 'Aumenta Cl libre +' + cam + ' ppm y CYA +' + deltaCYA + ' ppm en ' + vol + ' m3. Si CYA >= ' + this.CONST.CYA_BLOQUEO + ' ppm, cambiar a Hipocalcio Klaren.';
      resultado.impactoMasa.deltaCl = parseFloat(cam.toFixed(2));
      resultado.impactoMasa.deltaCYA = deltaCYA;
      return resultado;
    }

    if (producto === 'tricloro-tab3') {
      cam = _calcCamDesdeFcCya();
      if (cam <= 0) return null;
      const gramosTotal = (cam * vol) / this.CONST.TRICLORO_CLORO_PCT;
      const tabs = Math.ceil(gramosTotal / 200);
      const gramosReales = tabs * 200;
      const deltaCYA = parseFloat(((gramosReales * this.CONST.TRICLORO_CIAN_PCT) / vol).toFixed(2));
      resultado.cantidad = tabs;
      resultado.unidad = 'tab(s) de 200g';
      resultado.producto = 'Tricloro 90% Tab 3"';
      resultado.nota = tabs + ' tableta(s) de 200g (' + gramosReales + 'g total). CYA +' + deltaCYA + ' ppm.';
      resultado.impactoMasa.deltaCl = parseFloat(cam.toFixed(2));
      resultado.impactoMasa.deltaCYA = deltaCYA;
      return resultado;
    }

    if (producto === 'tricloro-tab1') {
      cam = _calcCamDesdeFcCya();
      if (cam <= 0) return null;
      const gramosTotal = (cam * vol) / this.CONST.TRICLORO_CLORO_PCT;
      const tabs = Math.ceil(gramosTotal / 20);
      const gramosReales = tabs * 20;
      const deltaCYA = parseFloat(((gramosReales * this.CONST.TRICLORO_CIAN_PCT) / vol).toFixed(2));
      resultado.cantidad = tabs;
      resultado.unidad = 'tab(s) de 20g';
      resultado.producto = 'Tricloro 90% Tab 1"';
      resultado.nota = tabs + ' tableta(s) de 20g (' + gramosReales + 'g total). CYA +' + deltaCYA + ' ppm.';
      resultado.impactoMasa.deltaCl = parseFloat(cam.toFixed(2));
      resultado.impactoMasa.deltaCYA = deltaCYA;
      return resultado;
    }

    // ─── HIPOCLORITO DE CALCIO 65% ───
    if (['hipoclorito-calcio', 'hipocalcio'].includes(producto)) {
      cam = _calcCamDesdeFcCya();
      if (cam <= 0) return null;
      const gramos = parseFloat(((cam * vol) / this.CONST.HIPO_CALCIO_CLORO_PCT).toFixed(1));
      const deltaCH = parseFloat((gramos * this.CONST.HIPO_CALCIO_DUREZA_PPM_G / vol).toFixed(2));
      resultado.cantidad = gramos;
      resultado.producto = 'Hipocalcio Klaren 65%';
      resultado.nota = 'Sin aporte de CYA. Aumenta Cl libre +' + cam + ' ppm y dureza calcica +' + deltaCH + ' ppm en ' + vol + ' m3.';
      resultado.impactoMasa.deltaCl = parseFloat(cam.toFixed(2));
      resultado.impactoMasa.deltaCH = deltaCH;
      return resultado;
    }

    // ─── CLORO LÍQUIDO (NaOCl 10%) ───
    if (['cloro-liquido', 'hipoclorito-sodio'].includes(producto)) {
      cam = _calcCamDesdeFcCya();
      if (cam <= 0) return null;
      const litros = parseFloat(((cam * vol) / (this.CONST.CLORO_LIQUIDO_PCT * 1000)).toFixed(2));
      const deltaALK = parseFloat((cam * this.CONST.NAOCL_DELTA_ALK_POR_PPM_CL).toFixed(2));
      resultado.cantidad = litros;
      resultado.unidad = 'L';
      resultado.producto = 'Cloro Liquido (Hipoclorito de Sodio 10%)';
      resultado.nota = 'Sin CYA, sin aumento de dureza. Aumenta Cl libre +' + cam + ' ppm en ' + vol + ' m3. Aporta ~' + deltaALK + ' ppm ALK (sal alcalina).';
      resultado.impactoMasa.deltaCl = parseFloat(cam.toFixed(2));
      resultado.impactoMasa.deltaALK = deltaALK;
      return resultado;
    }

    // ─── pH MENOS KLAREN (Bisulfato de Sodio comercial ~50%) ───
    if (['ph-menos', 'ph-menos-klaren', 'bisulfato', 'acido-globular'].includes(producto)) {
      let deltaPh;
      if (cam > 0) deltaPh = cam;
      else { const phObjetivo = 7.4; deltaPh = Math.max(0, phA - phObjetivo); }

      if (deltaPh <= 0.05) {
        resultado.cantidad = 0;
        resultado.producto = 'pH Menos Klaren (Bisulfato de Sodio)';
        resultado.nota = 'pH actual (' + phA + ') ya esta en rango optimo y no se especifico un delta de pH a bajar.';
        return resultado;
      }

      if (ctxAlk === 0 && ctxTemp === 0 && isNaN(ctxISV)) {
        console.warn('[Chemistry.calcDosificacion ph-menos] contextoGemelo vacío. Usando valores de referencia.');
      }

      const BASE = this.CONST.PH_MENOS_G_BASE_POR_01PH_10M3;

      // V16.4.5: factorPH al pH PROMEDIO del trayecto
      const phPromedio = phA - (deltaPh / 2);
      const factorPHRaw = 1 + 0.15 * (phPromedio - 7.8);
      const factorPH = Math.max(0.85, Math.min(1.5, factorPHRaw));

      const alkRef = ctxAlk > 0 ? ctxAlk : 100;
      const factorBufferRaw = 1 + 0.08 * ((alkRef - 100) / 100);
      const factorBuffer = Math.max(0.85, Math.min(1.5, factorBufferRaw));

      const tempRef = ctxTemp > 0 ? ctxTemp : 28;
      const factorTempRaw = 1 + 0.02 * (28 - tempRef);
      const factorTemp = Math.max(0.85, Math.min(1.15, factorTempRaw));

      let factorISPB = 1.0;
      if (!isNaN(ctxISV) && ctxISV > 0.3) {
        factorISPB = 1 + 0.05 * Math.min(1, ctxISV - 0.3);
      }

      const factorTotal = factorPH * factorBuffer * factorTemp * factorISPB;
      const gramos = parseFloat(
        ((deltaPh / 0.1) * BASE * (vol / 10) * factorTotal).toFixed(0)
      );

      const phFinal = parseFloat((phA - deltaPh).toFixed(1));

      // V16.4.6: Ahora con NAHSO4 = 50.94 (Klaren comercial), Δ ALK realista
      const deltaALK = -parseFloat(
        (gramos / (this.CONST.NAHSO4_G_POR_PPM_ALK_10M3 * (vol / 10))).toFixed(1)
      );

      let advertenciaALK = '';
      if (ctxAlk > 0) {
        const alkResultante = ctxAlk + deltaALK;
        if (alkResultante < this.CONST.ALK_OPTIMO_MIN) {
          const deficit = this.CONST.ALK_OPTIMO_MIN - alkResultante;
          const gBicarbonato = Math.round(deficit * this.CONST.NAHCO3_G_POR_PPM_ALK_10M3 * (vol / 10));
          advertenciaALK = ' ATENCION: ALK resultante ~' + alkResultante.toFixed(0) + ' ppm (debajo de ' + this.CONST.ALK_OPTIMO_MIN + '). Compensar con ~' + gBicarbonato + 'g de Alkalin Spin.';
        }
      }

      let notaGemelo = '';
      if (ctxAlk > 0 || ctxTemp > 0 || !isNaN(ctxISV)) {
        const partes = [];
        if (ctxAlk > 0) partes.push('ALK: ' + ctxAlk + ' ppm');
        if (ctxTemp > 0) partes.push('Temp: ' + ctxTemp + '°C');
        if (!isNaN(ctxISV)) partes.push('ISPB: ' + ctxISV);
        notaGemelo = ' Gemelo Digital [' + partes.join(', ') + '] → Factor precision: x' + factorTotal.toFixed(4) + '.';
      }

      resultado.cantidad = gramos;
      resultado.producto = 'pH Menos Klaren (Bisulfato de Sodio)';
      resultado.nota = 'Baja pH de ' + phA + ' hacia ' + phFinal + ' (-' + deltaPh.toFixed(1) + ') en ' + vol + ' m3. Reduce ALK aprox. ' + Math.abs(deltaALK) + ' ppm. Revisar pH 4 horas despues (Klaren).' + notaGemelo + advertenciaALK;
      resultado.impactoMasa.deltaALK = deltaALK;
      resultado.impactoMasa.deltaPH = -deltaPh;
      return resultado;
    }

    // ─── ACIDO MURIATICO — modo dual pH/ALK ───
    if (['acido-muriatico', 'acido'].includes(producto)) {
      const modo = (ctx && ctx.modo_acido === 'alk') ? 'alk' : 'ph';
      let deltaPh, deltaALK, litros;

      if (modo === 'alk') {
        const deltaAlkDeseado = Math.abs(cam) || 0;
        if (deltaAlkDeseado <= 0) {
          resultado.cantidad = 0; resultado.unidad = 'L';
          resultado.producto = 'Acido Muriatico (HCl 31%)';
          resultado.nota = 'Especifica la reduccion de alcalinidad deseada (ppm).';
          return resultado;
        }
        litros = parseFloat(((deltaAlkDeseado / this.CONST.HCL_PPM_ALK_POR_LITRO_10M3) * (vol / 10)).toFixed(2));
        deltaALK = -deltaAlkDeseado;
        deltaPh = 0;
        resultado.cantidad = litros; resultado.unidad = 'L';
        resultado.producto = 'Acido Muriatico (HCl 31%) — Reduccion de Alcalinidad';
        resultado.nota = 'Reduce ALK aprox. ' + deltaAlkDeseado + ' ppm en ' + vol + ' m3. Aplicar SIN DILUIR en un solo punto, con bomba apagada. Dejar reposar 1-2 h. pH apenas se mueve.';
      } else {
        if (cam > 0) { deltaPh = cam; }
        else { const phObjetivo = 7.4; deltaPh = Math.max(0, phA - phObjetivo); }
        if (deltaPh <= 0.05) {
          resultado.cantidad = 0; resultado.unidad = 'L';
          resultado.producto = 'Acido Muriatico';
          resultado.nota = 'pH actual (' + phA + ') ya esta en rango optimo y no se especifico un delta de pH a bajar.';
          return resultado;
        }
        litros = parseFloat(((deltaPh * vol) / (this.CONST.ACIDO_L_POR_PUNTO_PH_10M3 * 10)).toFixed(2));
        deltaALK = -parseFloat((litros * this.CONST.HCL_PPM_ALK_POR_LITRO_10M3 * 10 / vol).toFixed(1));
        const phFinal = parseFloat((phA - deltaPh).toFixed(1));
        resultado.cantidad = litros; resultado.unidad = 'L';
        resultado.producto = 'Acido Muriatico (HCl 31%)';
        resultado.nota = 'Baja pH de ' + phA + ' hacia ' + phFinal + ' (-' + deltaPh.toFixed(1) + '). Reduce ALK aprox. ' + Math.abs(deltaALK) + ' ppm.';
      }

      resultado.impactoMasa.deltaALK = parseFloat(deltaALK.toFixed(1));
      resultado.impactoMasa.deltaPH = (deltaPh !== undefined) ? -deltaPh : 0;
      return resultado;
    }

    // ─── ALCALOS SPIN ───
    // V16.5.2: Hard-stop si delta pH solicitado > 2.0 (valor destructivo).
    //          Aviso ámbar si delta pH > 1.0 y <= 2.0 (agresivo pero válido).
    if (['alcalos', 'soda-ash'].includes(producto)) {
      // V16.5.2 ADD: validación de seguridad sobre el delta pH solicitado
      if (cam > 2.0) {
        return {
          error: true,
          nota: 'Valor fuera de rango. Alcalos opera en DÉCIMAS de pH (ej: 0.4). El valor ' + cam + ' subiría el pH a niveles destructivos (>11). Si querías 0.4, teclea con punto decimal.'
        };
      }

      let deltaPh;
      if (cam > 0) deltaPh = cam;
      else { const phObjetivo = 7.4; deltaPh = Math.max(0, phObjetivo - phA); }

      if (deltaPh <= 0.05) {
        resultado.cantidad = 0;
        resultado.producto = 'Alcalos Spin (Carbonato de Sodio)';
        resultado.nota = 'pH actual (' + phA + ') ya esta en rango optimo y no se especifico un delta de pH a subir.';
        return resultado;
      }

      const gramos = parseFloat(((deltaPh / 0.1) * this.CONST.ALCALOS_G_POR_PUNTO_PH_10M3 * (vol / 10)).toFixed(0));
      const deltaALK = parseFloat((gramos / vol * 0.6).toFixed(1));
      const phFinal = parseFloat((phA + deltaPh).toFixed(1));
      resultado.cantidad = gramos;
      resultado.producto = 'Alcalos Spin (Carbonato de Sodio)';
      resultado.nota = 'Sube pH de ' + phA + ' hacia ' + phFinal + ' (+' + deltaPh.toFixed(1) + ') en ' + vol + ' m3. Incremento estimado de ALK: +' + deltaALK + ' ppm.';

      // V16.5.2 ADD: aviso ámbar si delta pH > 1.0 (zona agresiva)
      if (cam > 1.0 && cam <= 2.0) {
        resultado.nota += ' ⚠️ Δ pH > 1.0 es agresivo. Verifica la dosis antes de aplicarla.';
      }

      resultado.impactoMasa.deltaALK = deltaALK;
      return resultado;
    }

    // ─── ALKALIN SPIN ───
    // V16.5.2: reportar efecto colateral sobre pH (0.003 pH/ppm ALK)
    //          y setear impactoMasa.deltaPH para la bitácora.
    if (['alkalin', 'bicarbonato'].includes(producto)) {
      if (cam <= 0) return null;
      const gramos = parseFloat(((cam / 10) * this.CONST.ALKALIN_G_POR_10PPM_10M3 * (vol / 10)).toFixed(0));

      // V16.5.2 ADD: efecto buffer del bicarbonato sobre el pH (~0.003 pH/ppm ALK)
      const deltaPHColateral = parseFloat((cam * 0.003).toFixed(2));

      resultado.cantidad = gramos;
      resultado.producto = 'Alkalin Spin (Bicarbonato de Sodio)';
      resultado.nota = 'Sube alcalinidad +' + cam + ' ppm en ' + vol + ' m3. También eleva pH ~+' + deltaPHColateral.toFixed(2) + ' puntos (efecto buffer del bicarbonato).';
      resultado.impactoMasa.deltaALK = parseFloat(cam.toFixed(2));
      resultado.impactoMasa.deltaPH = deltaPHColateral; // V16.5.2 ADD
      return resultado;
    }

    // ─── ACIDO CIANURICO ───
    if (['acido-cianurico', 'cya', 'estabilizador'].includes(producto)) {
      if (cam <= 0) return null;
      const gramos = parseFloat((cam * vol * this.CONST.CYA_G_POR_PPM_M3).toFixed(0));
      resultado.cantidad = gramos;
      resultado.producto = 'Acido Cianurico (Estabilizador)';
      resultado.nota = 'Sube CYA +' + cam + ' ppm en ' + vol + ' m3. No superar ' + this.CONST.CYA_BLOQUEO + ' ppm.';
      resultado.impactoMasa.deltaCYA = parseFloat(cam.toFixed(2));
      return resultado;
    }

    // ─── CLORURO DE CALCIO ───
    if (['cloruro-calcio', 'calcio'].includes(producto)) {
      if (cam <= 0) return null;
      const gramos = parseFloat(((cam / 10) * this.CONST.CALCIO_G_POR_10PPM_10M3 * (vol / 10)).toFixed(0));
      resultado.cantidad = gramos;
      resultado.producto = 'Cloruro de Calcio (CaCl2)';
      resultado.nota = 'Sube dureza calcica +' + cam + ' ppm en ' + vol + ' m3.';
      resultado.impactoMasa.deltaCH = parseFloat(cam.toFixed(2));
      return resultado;
    }

    // ─── AMORTIGUADOR DE MAGNESIO ───
    if (['magnesio', 'mgo', 'mg-oh2', 'amortiguador-magnesio'].includes(producto)) {
      if (cam <= 0) return null;
      const gramos = parseFloat(((cam / 0.1) * this.CONST.MAGNESIO_G_POR_PUNTO_PH_10M3 * (vol / 10)).toFixed(1));
      const deltaPH_real = parseFloat(((gramos / this.CONST.MAGNESIO_G_POR_PUNTO_PH_10M3) * 0.1 * (10 / vol)).toFixed(2));
      resultado.cantidad = gramos;
      resultado.producto = 'Amortiguador de Magnesio (MgO/Mg(OH)2)';
      resultado.nota = 'Sube pH +' + deltaPH_real + ' en ' + vol + ' m3. NO suma a Alcalinidad Total (Ley de Henry).';
      resultado.impactoMasa.deltaALK = 0;
      resultado.impactoMasa.deltaPH_magnesio = deltaPH_real;
      resultado.impactoMasa.magnesio_ley_henry = true;
      return resultado;
    }

    // ─── GOLD & CLEAR ───
    if (['gold-and-clear', 'goldclear'].includes(producto)) {
      const mlMant = parseFloat((vol * this.CONST.GOLDCLEAR_ML_MANT_POR_M3).toFixed(0));
      const mlChoque = parseFloat((vol * this.CONST.GOLDCLEAR_ML_CHOQUE_POR_M3).toFixed(0));
      resultado.cantidad = mlMant;
      resultado.unidad = 'mL (mantenimiento)';
      resultado.producto = 'Gold & Clear Klaren (Clarificante)';
      resultado.nota = 'Mantenimiento: ' + mlMant + ' mL. Choque: ' + mlChoque + ' mL.';
      return resultado;
    }

    // ─── ALGEN PLUS / BLUE / generico ───
    if (producto === 'algen-plus') {
      const mlMant = parseFloat((vol * this.CONST.ALGEN_ML_MANT_POR_M3).toFixed(0));
      const mlChoque = parseFloat((vol * this.CONST.ALGEN_ML_CHOQUE_POR_M3).toFixed(0));
      resultado.cantidad = mlMant; resultado.unidad = 'mL (mantenimiento)';
      resultado.producto = 'Algen Plus Klaren (Premium)';
      resultado.nota = 'Premium. Mantenimiento: ' + mlMant + ' mL. Tratamiento algas: ' + mlChoque + ' mL.';
      return resultado;
    }
    if (producto === 'algen-blue') {
      const mlMant = parseFloat((vol * this.CONST.ALGEN_ML_MANT_POR_M3).toFixed(0));
      const mlChoque = parseFloat((vol * this.CONST.ALGEN_ML_CHOQUE_POR_M3).toFixed(0));
      resultado.cantidad = mlMant; resultado.unidad = 'mL (mantenimiento)';
      resultado.producto = 'Algen Blue Klaren';
      resultado.nota = 'Mantenimiento: ' + mlMant + ' mL. Tratamiento algas: ' + mlChoque + ' mL.';
      return resultado;
    }
    if (producto === 'alguicida') {
      const mlMant = parseFloat((vol * this.CONST.ALGEN_ML_MANT_POR_M3).toFixed(0));
      const mlChoque = parseFloat((vol * this.CONST.ALGEN_ML_CHOQUE_POR_M3).toFixed(0));
      resultado.cantidad = mlMant; resultado.unidad = 'mL (mantenimiento)';
      resultado.producto = 'Algen Blue Klaren';
      resultado.nota = 'Mantenimiento: ' + mlMant + ' mL. Tratamiento algas: ' + mlChoque + ' mL. Para clientes Premium usar Algen Plus.';
      return resultado;
    }

    if (['brilloquim', 'brillo-kim'].includes(producto)) {
      const mlMant = parseFloat((vol * this.CONST.GOLDCLEAR_ML_MANT_POR_M3).toFixed(0));
      const mlChoque = parseFloat((vol * this.CONST.GOLDCLEAR_ML_CHOQUE_POR_M3).toFixed(0));
      resultado.cantidad = mlMant; resultado.unidad = 'mL (mantenimiento)';
      resultado.producto = 'Brilloquim Novem (Clarificante)';
      resultado.nota = 'Mantenimiento: ' + mlMant + ' mL. Choque: ' + mlChoque + ' mL.';
      return resultado;
    }

    console.warn('[Chemistry] Producto no reconocido: ' + producto);
    return null;
  },

  // ═══════════════════════════════════════════════
  //  CALC DELTA POR APLICACION
  //
  //  V16.4.5 FIXES: typo HCL, literal mágico, reciprocidad pH promedio, -0.
  //  V16.4.6: Δ ALK de pH Menos Klaren ahora realista (NAHSO4 = 50.94).
  // ═══════════════════════════════════════════════

  calcDeltaPorAplicacion(producto, cantidad_aplicada, unidad, volumen_m3, contextoGemelo) {
    const cant = parseFloat(cantidad_aplicada) || 0;
    const vol  = parseFloat(volumen_m3) || 0;
    const u    = (unidad || '').toLowerCase();
    const ctx  = contextoGemelo || {};

    const out = {
      deltaCl:  0, deltaCYA: 0, deltaCH:  0, deltaALK: 0, deltaPH:  0,
      producto_normalizado: producto,
      nota: '',
      firma: this.CONST.FIRMA
    };

    if (!producto || cant <= 0 || vol <= 0) {
      out.nota = 'Cantidad o volumen invalidos.';
      return out;
    }

    const p = String(producto).toLowerCase().trim();

    // ─── TRICLORO 90% ───
    if (['tricloro', 'tricloro-polvo', 'tricloro-grano',
         'tricloro-tab3', 'tricloro-tab1'].indexOf(p) !== -1) {
      out.deltaCl  = parseFloat(((cant * this.CONST.TRICLORO_CLORO_PCT) / vol).toFixed(3));
      out.deltaCYA = parseFloat(((cant * this.CONST.TRICLORO_CIAN_PCT) / vol).toFixed(3));
      out.nota = 'Tricloro 90%: ' + cant + 'g aplicados en ' + vol + ' m3 -> +' + out.deltaCl + ' ppm Cl, +' + out.deltaCYA + ' ppm CYA.';
      return out;
    }

    // ─── HIPOCLORITO DE CALCIO 65% ───
    if (['hipoclorito-calcio', 'hipocalcio'].indexOf(p) !== -1) {
      out.deltaCl = parseFloat(((cant * this.CONST.HIPO_CALCIO_CLORO_PCT) / vol).toFixed(3));
      out.deltaCH = parseFloat(((cant * this.CONST.HIPO_CALCIO_DUREZA_PPM_G) / vol).toFixed(3));
      out.nota = 'Hipocalcio 65%: ' + cant + 'g en ' + vol + ' m3 -> +' + out.deltaCl + ' ppm Cl, +' + out.deltaCH + ' ppm dureza.';
      return out;
    }

    // ─── CLORO LIQUIDO ───
    if (['cloro-liquido', 'hipoclorito-sodio'].indexOf(p) !== -1) {
      let litros = cant;
      if (u === 'ml') litros = cant / 1000;
      out.deltaCl  = parseFloat(((litros * this.CONST.CLORO_LIQUIDO_PCT * 1000) / vol).toFixed(3));
      out.deltaALK = parseFloat((out.deltaCl * this.CONST.NAOCL_DELTA_ALK_POR_PPM_CL).toFixed(3));
      out.nota = 'Cloro liquido 10%: ' + litros + 'L en ' + vol + ' m3 -> +' + out.deltaCl + ' ppm Cl, +' + out.deltaALK + ' ppm ALK.';
      return out;
    }

    // ─── ACIDO MURIATICO (modo dual) ───
    // V16.4.5 FIX TYPO: HCL_PPM_ALK_POR_LITRO_10M3 (no HCl_…).
    // V16.4.5 FIX LITERAL-MAGICO: usar this.CONST.ACIDO_L_POR_PUNTO_PH_10M3 * 10.
    // V16.4.5 FIX -0: forzar deltaPH = 0 literal en modo 'alk'.
    if (['acido-muriatico', 'acido'].indexOf(p) !== -1) {
      let litros = cant;
      if (u === 'ml') litros = cant / 1000;
      const modo = (ctx && ctx.modo_acido === 'alk') ? 'alk' : 'ph';
      out.deltaALK = -parseFloat(((litros * this.CONST.HCL_PPM_ALK_POR_LITRO_10M3 * 10) / vol).toFixed(3));
      if (modo === 'alk') {
        out.deltaPH = 0;
        out.nota = 'Acido muriatico (modo ALK): ' + litros + 'L en ' + vol + ' m3 -> ' + out.deltaALK + ' ppm ALK. Aplicar sin diluir, bomba apagada, dejar reposar 1-2 h.';
      } else {
        out.deltaPH = -parseFloat(((litros * 10) / (this.CONST.ACIDO_L_POR_PUNTO_PH_10M3 * 10 * vol / 10)).toFixed(3));
        out.nota = 'Acido muriatico: ' + litros + 'L en ' + vol + ' m3 -> ' + out.deltaPH.toFixed(2) + ' pH, ' + out.deltaALK + ' ppm ALK.';
      }
      return out;
    }

    // ─── pH MENOS KLAREN ───
    // V16.4.5 FIX RECIPROCIDAD: refinamiento de un paso con pH promedio.
    // V16.4.6: usa NAHSO4_G_POR_PPM_ALK_10M3 = 50.94 (Klaren comercial),
    //          coincide con calcDosificacion. Δ ALK realista para campo.
    if (['ph-menos', 'ph-menos-klaren', 'bisulfato', 'acido-globular'].indexOf(p) !== -1) {
      const denomALK = this.CONST.NAHSO4_G_POR_PPM_ALK_10M3 * (vol / 10);
      out.deltaALK = denomALK > 0 ? -parseFloat((cant / denomALK).toFixed(3)) : 0;

      const ctxAlk  = parseFloat(ctx.alcalinidad)  || 100;
      const ctxPH   = parseFloat(ctx.ph)           || 7.4;
      const ctxTemp = parseFloat(ctx.temperatura)  || 28;
      const ctxISV  = parseFloat(ctx.isv)          || 0;

      const BASE = this.CONST.PH_MENOS_G_BASE_POR_01PH_10M3;

      // Estimación de un paso con pH inicial
      const factorPHRaw0 = 1 + 0.15 * (ctxPH - 7.8);
      const factorPH0 = Math.max(0.85, Math.min(1.5, factorPHRaw0));
      const factorBufferRaw = 1 + 0.08 * ((ctxAlk - 100) / 100);
      const factorBuffer = Math.max(0.85, Math.min(1.5, factorBufferRaw));
      const factorTempRaw = 1 + 0.02 * (28 - ctxTemp);
      const factorTemp = Math.max(0.85, Math.min(1.15, factorTempRaw));
      let factorISPB = 1.0;
      if (!isNaN(ctxISV) && ctxISV > 0.3) {
        factorISPB = 1 + 0.05 * Math.min(1, ctxISV - 0.3);
      }

      const denomPH0 = BASE * (vol / 10) * (factorPH0 * factorBuffer * factorTemp * factorISPB);
      const dPH0 = denomPH0 > 0 ? (cant * 0.1) / denomPH0 : 0;

      // Refinamiento al pH promedio del trayecto
      const phPromedio = ctxPH - (dPH0 / 2);
      const factorPHRaw = 1 + 0.15 * (phPromedio - 7.8);
      const factorPH = Math.max(0.85, Math.min(1.5, factorPHRaw));

      const factorTotal = factorPH * factorBuffer * factorTemp * factorISPB;
      const denomPH = BASE * (vol / 10) * factorTotal;
      out.deltaPH = denomPH > 0 ? -parseFloat(((cant * 0.1) / denomPH).toFixed(3)) : 0;

      out.nota = 'pH Menos Klaren: ' + cant + 'g en ' + vol + ' m3 -> ' +
        out.deltaPH.toFixed(2) + ' pH, ' + out.deltaALK + ' ppm ALK. ' +
        '(ALK ref: ' + ctxAlk + ' ppm, pH ref: ' + ctxPH.toFixed(1) +
        ', FactorBuffer: ' + factorBuffer.toFixed(3) + ')';
      return out;
    }

    // ─── ALKALIN SPIN ───
    if (['alkalin', 'bicarbonato'].indexOf(p) !== -1) {
      const denomALK = (this.CONST.ALKALIN_G_POR_10PPM_10M3 / 10) * (vol / 10);
      out.deltaALK = denomALK > 0 ? parseFloat((cant / denomALK).toFixed(3)) : 0;
      out.deltaPH = 0;
      out.nota = 'Alkalin Spin: ' + cant + 'g en ' + vol + ' m3 -> +' + out.deltaALK + ' ppm ALK.';
      return out;
    }

    // ─── ALCALOS SPIN ───
    if (['alcalos', 'soda-ash'].indexOf(p) !== -1) {
      out.deltaALK = parseFloat(((cant / vol) * 0.6).toFixed(3));
      const denomPH = this.CONST.ALCALOS_G_POR_PUNTO_PH_10M3 * (vol / 10);
      out.deltaPH = denomPH > 0 ? parseFloat(((cant * 0.1) / denomPH).toFixed(3)) : 0;
      out.nota = 'Alcalos Spin: ' + cant + 'g en ' + vol + ' m3 -> +' + out.deltaPH.toFixed(2) + ' pH, +' + out.deltaALK + ' ppm ALK colateral.';
      return out;
    }

    // ─── ACIDO CIANURICO ───
    if (['acido-cianurico', 'cya', 'estabilizador'].indexOf(p) !== -1) {
      out.deltaCYA = parseFloat((cant / (vol * this.CONST.CYA_G_POR_PPM_M3)).toFixed(3));
      out.nota = 'CYA: ' + cant + 'g en ' + vol + ' m3 -> +' + out.deltaCYA + ' ppm CYA.';
      return out;
    }

    // ─── CLORURO DE CALCIO ───
    if (['cloruro-calcio', 'calcio'].indexOf(p) !== -1) {
      const denomCH = (this.CONST.CALCIO_G_POR_10PPM_10M3 / 10) * (vol / 10);
      out.deltaCH = denomCH > 0 ? parseFloat((cant / denomCH).toFixed(3)) : 0;
      out.nota = 'Cloruro de Calcio: ' + cant + 'g en ' + vol + ' m3 -> +' + out.deltaCH + ' ppm dureza.';
      return out;
    }

    // ─── MAGNESIO ───
    if (['magnesio', 'mgo', 'mg-oh2', 'amortiguador-magnesio'].indexOf(p) !== -1) {
      out.deltaALK = 0;
      const denomPH = this.CONST.MAGNESIO_G_POR_PUNTO_PH_10M3 * (vol / 10);
      out.deltaPH = denomPH > 0 ? parseFloat(((cant * 0.1) / denomPH).toFixed(3)) : 0;
      out.nota = 'Amortiguador de Magnesio: ' + cant + 'g en ' + vol + ' m3 -> +' + out.deltaPH.toFixed(2) + ' pH. ALK no se altera (Ley de Henry).';
      return out;
    }

    // ─── PRODUCTOS VISUALES ───
    if (['gold-and-clear', 'goldclear',
         'algen-plus', 'algen-blue', 'alguicida',
         'brilloquim', 'brillo-kim'].indexOf(p) !== -1) {
      out.nota = 'Producto visual (clarificante/alguicida): sin impacto directo en parametros quimicos medidos.';
      return out;
    }

    out.nota = 'Producto no reconocido por calcDeltaPorAplicacion: ' + producto + '. Deltas en cero.';
    console.warn('[Chemistry.calcDeltaPorAplicacion] Producto no reconocido:', producto);
    return out;
  },

  // ═══════════════════════════════════════════════
  //  CALCULAR RETROLAVADO
  // ═══════════════════════════════════════════════

  calcularRetrolavado(poolId, duracion_min) {
    if (!poolId) {
      return { error: true, mensaje: 'poolId requerido.', html: '<div class="alert-inline alert-warn">Selecciona una alberca primero.</div>' };
    }
    const tMin = parseFloat(duracion_min);
    if (isNaN(tMin) || tMin <= 0) {
      return { error: true, mensaje: 'Tiempo debe ser mayor a 0.', html: '<div class="alert-inline alert-warn">Ingresa el tiempo de retrolavado.</div>' };
    }
    if (!window.DB || typeof window.DB.getAlberca !== 'function') {
      return { error: true, mensaje: 'DB no disponible.', html: '<div class="alert-inline alert-danger">Error de conectividad con DB.</div>' };
    }

    const alberca = window.DB.getAlberca(poolId);
    if (!alberca) {
      return { error: true, mensaje: 'Expediente no encontrado: ' + poolId, html: '<div class="alert-inline alert-danger">Expediente no encontrado.</div>' };
    }

    const lmp = parseFloat(
      alberca.auditoria_hidraulica?.bomba?.flujo_real_lpm ||
      alberca.flujo_desague_lpm || 0
    );
    if (isNaN(lmp) || lmp <= 0) {
      return { error: true, mensaje: 'Flujo desague no configurado.', html: '<div class="alert-inline alert-danger">Configura el Flujo real (LPM) en el Expediente, seccion Auditoria Hidraulica.</div>' };
    }

    const volM3 = parseFloat(alberca.geometria_adn?.volumen_m3) || parseFloat(alberca.volumen_m3) || 50;
    const volLitros = volM3 * 1000;
    const litros = parseFloat((tMin * lmp).toFixed(1));

    if (litros >= volLitros) {
      return { error: true, mensaje: 'Tiempo excesivo: ' + litros + 'L > ' + volLitros + 'L.', html: '<div class="alert-inline alert-danger">Tiempo excede el volumen total.</div>' };
    }

    const fraccionPerdida = litros / volLitros;

    let cyaPPM = 0, chPPM = 0;
    try {
      const ultimoRegistro = window.DB.getUltimoRegistro(poolId);
      if (ultimoRegistro && ultimoRegistro.parametros) {
        cyaPPM = parseFloat(ultimoRegistro.parametros.cianurico) || 0;
        chPPM = parseFloat(ultimoRegistro.parametros.dureza_calcica) || 0;
      }
    } catch (e) {
      console.warn('[Chemistry.calcularRetrolavado] Error al obtener ultimo registro:', e);
    }

    if (cyaPPM === 0) cyaPPM = parseFloat(alberca.punto_cero_quimico?.cianurico) || 0;
    if (chPPM === 0) chPPM = parseFloat(alberca.punto_cero_quimico?.dureza) || 300;

    const cyaGms = parseFloat((cyaPPM * volM3 * fraccionPerdida).toFixed(1));
    const chGms = parseFloat((chPPM * volM3 * fraccionPerdida).toFixed(1));
    const nuevoCYA = parseFloat((cyaPPM * (1 - fraccionPerdida)).toFixed(1));
    const nuevoCH = parseFloat((chPPM * (1 - fraccionPerdida)).toFixed(0));

    let impactoISPB = 0;
    const tempBase = parseFloat(alberca.punto_cero_quimico?.temperatura_llenado) || 28;
    const alkBase = parseFloat(alberca.punto_cero_quimico?.alcalinidad) || 100;
    const phBase = parseFloat(alberca.punto_cero_quimico?.ph) || 7.4;
    const recubrimiento = alberca.geometria_adn?.recubrimiento?.tipo || 'porcelanato';

    const isvAntes = this.calcISV({ ph: phBase, temperatura: tempBase, dureza: chPPM, alcalinidad: alkBase, cianurico: cyaPPM, tds: 0, recubrimiento });
    const isvDespues = this.calcISV({ ph: phBase, temperatura: tempBase, dureza: nuevoCH, alcalinidad: alkBase, cianurico: nuevoCYA, tds: 0, recubrimiento });

    if (isvAntes && isvDespues) {
      impactoISPB = parseFloat((isvDespues.isv - isvAntes.isv).toFixed(3));
    }

    const html =
      '<div class="info-box" style="margin-top:8px">' +
        '<div style="font-size:0.72rem;font-weight:700;color:#b45309;margin-bottom:8px">Auditoria de Retrolavado — Motor Quimico V' + this.VERSION + '</div>' +
        '<div class="info-row"><span>Tiempo</span><strong>' + tMin + ' min</strong></div>' +
        '<div class="info-row"><span>Flujo</span><strong>' + lmp + ' L/min</strong></div>' +
        '<div class="info-row"><span>Litros</span><strong style="color:#f59e0b">' + litros.toLocaleString('es-MX') + ' L</strong></div>' +
        '<div class="info-row"><span>% volumen</span><strong>' + (fraccionPerdida * 100).toFixed(1) + '%</strong></div>' +
        '<div class="info-row"><span>CYA</span><strong>' + cyaPPM + ' -> ' + nuevoCYA + ' ppm</strong></div>' +
        '<div class="info-row"><span>Calcio</span><strong>' + chPPM + ' -> ' + nuevoCH + ' ppm</strong></div>' +
        '<div class="info-row"><span>Masa CYA</span><strong>' + cyaGms + ' g</strong></div>' +
        '<div class="info-row"><span>Masa CaCO3</span><strong>' + chGms + ' g</strong></div>' +
        '<div class="info-row"><span>ISPB</span><strong style="color:var(--primary)">' + (impactoISPB > 0 ? '+' : '') + impactoISPB + ' pts</strong></div>' +
        '<div style="font-size:0.65rem;color:var(--text-muted);margin-top:8px;text-align:right">Motor Quimico V' + this.VERSION + ' | ' + this.CONST.FIRMA + '</div>' +
      '</div>';

    return {
      litros, fraccionPerdida, volM3, lpm: lmp, duracion_min: tMin,
      cyaPPM, nuevoCYA, cyaGms, chPPM, nuevoCH, chGms,
      impactoISPB, html,
      albercaId: poolId, firma: this.CONST.FIRMA, error: false
    };
  },

  // ═══════════════════════════════════════════════
  //  V16.5.1 ADD: calcFactorRugosidad
  //  Helper de rugosidad para uso futuro en engine.js
  //  (Cirugía 3 del Manifiesto — desgasificación dinámica CO2).
  //
  //  Devuelve un multiplicador sobre la dinámica de carbonatos
  //  (velocidad de depósito/disolución de sarro).
  //  NO altera calcISV ni ninguna fórmula existente.
  //
  //  Lisa   = 0.85 (menos área, depósito y disolución más lentos)
  //  Media  = 1.00 (referencia)
  //  Rugosa = 1.20 (más área, dinámica acelerada)
  // ═══════════════════════════════════════════════

  calcFactorRugosidad(rugosidad) {
    // V16.5.1 ADD: factor de rugosidad sobre dinámica de sarro
    var FACTOR_RUGOSIDAD = {
      'Lisa':   0.85,   // menos área, depósito y disolución más lentos
      'Media':  1.00,   // referencia
      'Rugosa': 1.20    // más área, dinámica acelerada
    };
    return FACTOR_RUGOSIDAD[rugosidad] !== undefined
      ? FACTOR_RUGOSIDAD[rugosidad]
      : 1.00;
  }

};

const AuditoriaMasa = {
  renderizar: function() {
    const albId = document.getElementById('bit-alberca')?.value || document.getElementById('bit-cliente-select')?.value;
    const tMin = parseFloat(document.getElementById('bit-duracion-min')?.value) || 0;
    const panel = document.getElementById('retro-live-report');
    const box = document.getElementById('bit-masa-result');

    if (!panel) return;
    if (!albId) { panel.innerHTML = '<div class="alert-inline alert-warn">Selecciona una alberca.</div>'; if (box) box.style.display = 'none'; return; }
    if (tMin <= 0) { panel.innerHTML = '<span style="color:var(--text-muted);font-size:0.82rem">Ingresa el tiempo.</span>'; if (box) box.style.display = 'none'; return; }

    const res = Chemistry.calcularRetrolavado(albId, tMin);
    if (res.error) { panel.innerHTML = '<div class="alert-inline alert-danger">' + res.mensaje + '</div>'; if (box) box.style.display = 'none'; return; }

    panel.innerHTML = res.html;
    if (box) box.style.display = 'block';

    const litrosEl = document.getElementById('bit-masa-litros');
    const cyaEl = document.getElementById('bit-masa-cya');
    const chEl = document.getElementById('bit-masa-ch');
    const ispbEl = document.getElementById('bit-masa-ispb');

    if (litrosEl) litrosEl.textContent = res.litros.toLocaleString('es-MX') + ' L';
    if (cyaEl) cyaEl.textContent = res.cyaGms + ' g';
    if (chEl) chEl.textContent = res.chGms + ' g';
    if (ispbEl) ispbEl.textContent = (res.impactoISPB > 0 ? '+' : '') + res.impactoISPB + ' pts';
  },

  persistirCambios: function(albercaId, tiempoMin) {
    const res = Chemistry.calcularRetrolavado(albercaId, tiempoMin);
    if (res.error) { console.warn('[AuditoriaMasa] Error:', res.mensaje); return res; }

    if (window.DB && typeof window.DB.saveAlberca === 'function') {
      try {
        window.DB.saveAlberca({
          id: albercaId,
          punto_cero_quimico: {
            cianurico: parseFloat(res.nuevoCYA.toFixed(1)),
            dureza: parseFloat(res.nuevoCH.toFixed(0))
          }
        });
      } catch (e) {
        console.warn('[AuditoriaMasa] Error al persistir cambios en expediente:', e);
      }
    }

    const nota = '[Motor Quimico V' + Chemistry.VERSION + '] Retrolavado: ' + res.litros + 'L en ' + res.duracion_min + 'min. CYA: ' + res.cyaPPM + '->' + res.nuevoCYA.toFixed(1) + ' ppm. CH: ' + res.chPPM + '->' + res.nuevoCH + ' ppm. ISPB: ' + (res.impactoISPB > 0 ? '+' : '') + res.impactoISPB + ' pts. Firma: ' + Chemistry.CONST.FIRMA;

    return Object.assign({}, res, { nota: nota, persistido: true });
  }
};

window.Chemistry = Chemistry;
window.AuditoriaMasa = AuditoriaMasa;

// ═══════════════════════════════════════════════
//  BOOT ASSERT — V16.6.0
//  Verifica 26 constantes críticas + coherencia ordinal FC/CYA
//  + integridad de tablas FACTORES / TOPES + presencia de helpers HOCl.
// ═══════════════════════════════════════════════

(function _bootAssert() {
  const C = Chemistry.CONST;
  const requeridas = [
    'TRICLORO_CLORO_PCT', 'TRICLORO_CIAN_PCT',
    'HIPO_CALCIO_CLORO_PCT', 'HIPO_CALCIO_DUREZA_PPM_G',
    'CLORO_LIQUIDO_PCT', 'NAOCL_DELTA_ALK_POR_PPM_CL',
    'ALCALOS_G_POR_PUNTO_PH_10M3', 'ALKALIN_G_POR_10PPM_10M3',
    'ACIDO_L_POR_PUNTO_PH_10M3', 'HCL_PPM_ALK_POR_LITRO_10M3',
    'PH_MENOS_G_BASE_POR_01PH_10M3', 'NAHSO4_G_POR_PPM_ALK_10M3',
    'NAHCO3_G_POR_PPM_ALK_10M3',
    'CYA_G_POR_PPM_M3', 'CALCIO_G_POR_10PPM_10M3', 'MAGNESIO_G_POR_PUNTO_PH_10M3',
    'CYA_BLOQUEO', 'PH_OPTIMO_MIN', 'ALK_OPTIMO_MIN', 'CH_OPTIMO_MIN',
    // V16.5.0 — Regla FC/CYA
    'FC_CYA_MIN_PCT', 'FC_CYA_OBJ_PCT', 'FC_CYA_ALTO_PCT',
    'FC_CYA_TOXICO_PCT', 'FC_CYA_SUPERCHOQUE_PCT', 'FC_PISO_ABSOLUTO'
  ];

  const faltantes = requeridas.filter(k => typeof C[k] !== 'number' || !isFinite(C[k]));
  if (faltantes.length > 0) {
    console.error('[Chemistry V' + Chemistry.VERSION + '] Boot assert FAIL: constantes faltantes o no numéricas:', faltantes);
  } else {
    // V16.4.6: verificación adicional Klaren
    if (C.NAHSO4_G_POR_PPM_ALK_10M3 < 40 || C.NAHSO4_G_POR_PPM_ALK_10M3 > 60) {
      console.warn('[Chemistry V' + Chemistry.VERSION + '] NAHSO4_G_POR_PPM_ALK_10M3 = ' + C.NAHSO4_G_POR_PPM_ALK_10M3 + '. Esperado ~50.94 (Klaren ~50% comercial).');
    }
    // V16.5.0: coherencia ordinal de la regla FC/CYA
    const ordenFcCya = (
      C.FC_CYA_MIN_PCT < C.FC_CYA_OBJ_PCT &&
      C.FC_CYA_OBJ_PCT < C.FC_CYA_ALTO_PCT &&
      C.FC_CYA_ALTO_PCT < C.FC_CYA_TOXICO_PCT &&
      C.FC_CYA_TOXICO_PCT < C.FC_CYA_SUPERCHOQUE_PCT
    );
    if (!ordenFcCya) {
      console.error('[Chemistry V' + Chemistry.VERSION + '] Boot assert FAIL: orden ordinal de FC/CYA incorrecto.');
    }

    // V16.5.3: verificar tablas de modo
    const factores = C.FACTORES_CLORO_POR_MODO;
    const topes = C.TOPES_SALUD_POR_MODO;
    const modosEsperados = ['rutinario','rescate','post_choque','recuperacion_severa','recuperacion_leve','sarro_controlado','balance','metales'];
    const okFactores = modosEsperados.every(m => factores[m] !== undefined);
    const okTopes = modosEsperados.every(m => typeof topes[m] === 'number');

    // V16.5.4: verificar que el fix de unidades produce valores correctos
    // Caso testigo: CYA=57, modo balance → cl_minimo debe estar entre 4 y 5 ppm.
    // Si la división entre 100 falta, daría 427.5 ppm.
    const umbTest = Chemistry.getUmbralesClorOperativos(57, 'balance');
    const fixUnidadesOK = umbTest && umbTest.cl_minimo > 1 && umbTest.cl_minimo < 10;

    // V16.6.0: verificar presencia y respuesta de helpers HOCl
    const hoclMethodsOK = (
      typeof Chemistry.calcFraccionHOCl === 'function' &&
      typeof Chemistry.calcHOClActivo === 'function'
    );
    const fTest = hoclMethodsOK ? Chemistry.calcFraccionHOCl(7.5, 25) : null;
    const hoclSanidad = (typeof fTest === 'number' && fTest > 0.3 && fTest < 0.6);

    if (!okFactores || !okTopes) {
      console.error('[Chemistry V' + Chemistry.VERSION + '] Boot assert FAIL: tablas FACTORES_CLORO_POR_MODO o TOPES_SALUD_POR_MODO incompletas.');
    } else if (!fixUnidadesOK) {
      console.error('[Chemistry V' + Chemistry.VERSION + '] Boot assert FAIL: V16.5.4 fix de unidades FC/CYA no surtió efecto. cl_minimo(57, balance) = ' + (umbTest && umbTest.cl_minimo) + '. Esperado ~4.28.');
    } else if (!hoclMethodsOK || !hoclSanidad) {
      console.error('[Chemistry V' + Chemistry.VERSION + '] Boot assert FAIL: helpers HOCl ausentes o fuera de rango. fHOCl(7.5, 25) = ' + fTest + '. Esperado ~0.46.');
    } else {
      console.log('[Chemistry V' + Chemistry.VERSION + '] Boot assert OK: ' + requeridas.length + ' constantes críticas, tablas de modo operativo, regla FC/CYA coherente, fix V16.5.4 verificado, helpers HOCl Pankow operativos. V16.6.0 activa.');
    }
  }
})();

console.log('[Chemistry] Motor Quimico V' + Chemistry.VERSION + ' — ISPB Langelier NSPF (12.1). Factor Omar. Regla Suprema de Cloracion. CPO-verified (Skinner & Hales). Klaren ~50% comercial calibrado. + calcDeltaPorAplicacion con deltaPH y modo dual Acido Muriatico. + Regla FC/CYA dinámica (TFP/CMAHC) + modos operativos. + albedo y rugosidad. + Alkalin colateral pH + Alcalos hard-stop. + Hotfix V16.5.4 umbrales FC/CYA. + V16.6.0 helpers HOCl (Pankow). V16.6.0 lista. | ' + Chemistry.CONST.FIRMA);
