"ENTREGABLE F — Código JavaScript Nativo para chemistry.js v16.7  
Parte 1 de 2: Constantes, especiación, ALK Wojtowicz, β multibuffer, ν por producto, solver cuártico

Pool Balance · Veracruz, México · Mayo 2026 Listo para pegar en chemistry.js. ES6+. Sin dependencias externas.

F.1. Bloque de constantes nuevas  
Insertar al inicio de chemistry.js, dentro del objeto CONST existente o en bloque adyacente:

Copy// \=============================================================================  
// SECCIÓN 13 V17.8 — IMPACTO ÁCIDO-BASE INMEDIATO POR DOSIFICACIÓN  
// Calibración inicial desde literatura primaria.  
// Refinar empíricamente con lotes comerciales reales de Veracruz (Entregable I).  
// \=============================================================================

// pKa del ácido cianúrico (Wahman, Alexander & Kirisits 2018, PMC6223631)  
CONST.PKA1\_CYA\_25C \= 6.88;  
CONST.PKA1\_CYA\_DTDT \= \-0.011;     // dpKa1/dT en °C⁻¹

// pKa del sistema carbonato (Stumm & Morgan 1996; Plummer & Busenberg 1982\)  
CONST.PKA1\_H2CO3\_25C \= 6.35;  
CONST.PKA2\_H2CO3\_25C \= 10.33;  
CONST.PKA1\_H2CO3\_DTDT \= \-0.0055;  
CONST.PKA2\_H2CO3\_DTDT \= \-0.0090;

// Producto iónico del agua (Harned & Robinson 1940\)  
CONST.PKW\_25C \= 14.00;  
CONST.PKW\_DTDT \= \-0.0335;

// Masas molares en g/mol  
CONST.M\_TCCA      \= 232.41;  
CONST.M\_CaOCl2    \= 142.98;  
CONST.M\_NaOCl     \= 74.44;  
CONST.M\_NaHSO4    \= 120.06;  
CONST.M\_HCl       \= 36.46;  
CONST.M\_NaHCO3    \= 84.01;  
CONST.M\_Na2CO3    \= 105.99;  
CONST.M\_MgOH2     \= 58.32;  
CONST.M\_H3Cy      \= 129.07;  
CONST.M\_CaCl2     \= 110.98;  
CONST.M\_Cl2       \= 70.91;  
CONST.M\_CaCO3     \= 100.09;  
CONST.M\_NaOH      \= 40.00;

// Purezas comerciales nominales (fracción másica de producto activo)  
CONST.PUREZA\_TRICLORO      \= 0.915;  
CONST.PUREZA\_HIPO\_CALCIO   \= 0.65;  
CONST.PUREZA\_NAOCL         \= 0.12;  
CONST.PUREZA\_BISULFATO     \= 0.50;  
CONST.PUREZA\_MURIATICO     \= 0.3145;  
CONST.PUREZA\_CACL2         \= 0.95;  
CONST.PUREZA\_ALKALIN       \= 1.00;   // NaHCO₃ puro  
CONST.PUREZA\_ALCALOS       \= 1.00;  
CONST.PUREZA\_MGOH2         \= 1.00;  
CONST.PUREZA\_CYA           \= 1.00;

// Densidades de líquidos en g/mL (para conversión mL ↔ g)  
CONST.DENSIDAD\_MURIATICO   \= 1.16;  
CONST.DENSIDAD\_NAOCL\_12    \= 1.18;

// Impurezas alcalinas residuales (mol impureza / mol producto activo)  
// REFINAR EMPÍRICAMENTE — ver Entregable I, protocolo de calibración  
CONST.ETA\_NAOH\_DEFAULT     \= 0.05;   // \~0.3% NaOH libre / 12% NaOCl (Pioneer/Force Flow)  
CONST.ETA\_NAOH\_MAX         \= 0.10;   // caso pesimista (\~0.6% NaOH)  
CONST.ETA\_CAOH2\_DEFAULT    \= 0.03;   // 3% Ca(OH)₂ residual (Redox SDS, Valudor TDS)  
CONST.ETA\_CAOH2\_MAX        \= 0.05;   // caso pesimista

// Aporte de CYA por unidad de cloro libre dosificado (productos clorados estabilizados)  
CONST.TRICLORO\_CYA\_POR\_PPM\_CL \= 0.60;   // ya existe en motor, referenciada aquí  
CONST.NADCC\_CYA\_POR\_PPM\_CL    \= 0.45;   // si se añade NaDCC en futuro

// Límites de régimen del solver  
CONST.DELTAPH\_LINEAL\_MAX        \= 0.30;   // |ΔpH| superior → activar cuártica  
CONST.ALK\_CORR\_LINEAL\_MIN\_PPM   \= 60;     // ALK\_corr inferior → activar cuártica  
CONST.ALK\_CORR\_ULTRA\_MIN\_PPM    \= 30;     // ALK\_corr inferior → régimen ultra no lineal

// Solver Newton-Raphson para cuártica  
CONST.NEWTON\_TOLERANCIA   \= 1e-9;  
CONST.NEWTON\_MAX\_ITER     \= 30;  
CONST.NEWTON\_SEMILLA\_PH   \= 7.50;

// Premedicación  
CONST.PREMED\_FACTOR\_SEGURIDAD \= 1.30;  
CONST.PREMED\_PH\_PISO\_DEFAULT  \= 7.20;  
CONST.PREMED\_PH\_TECHO\_DEFAULT \= 7.80;

// Desviaciones estándar para propagación gaussiana (Opción B)  
CONST.SIGMA\_ALK\_PPM       \= 5.0;     // error típico ColorQ  
CONST.SIGMA\_CYA\_PPM       \= 5.0;  
CONST.SIGMA\_T\_AGUA\_C      \= 1.0;  
CONST.SIGMA\_PH\_UNITS      \= 0.05;  
CONST.SIGMA\_ETA\_REL       \= 0.50;    // 50% del valor default  
CONST.SIGMA\_GRAMOS\_REL    \= 0.02;    // 2% en pesaje de Omar

// Flag de feature  
CONST.ENABLE\_DELTAPH\_PREDICTION \= true;

// Catálogo cerrado de productos soportados  
CONST.PRODUCTOS\_SOPORTADOS \= \[  
  'tricloro',  
  'hipo\_calcio',  
  'cloro\_liquido',  
  'bisulfato',  
  'muriatico',  
  'alkalin',  
  'alcalos',  
  'mg\_oh2',  
  'cya',  
  'cacl2'  
\];  
Copy  
F.2. Funciones auxiliares de especiación termodinámica  
Copy// \=============================================================================  
// FUNCIONES PRIVADAS DE ESPECIACIÓN  
// Todas dependientes de pH y T\_agua. Coherentes con calcFraccionHOCl existente.  
// \=============================================================================

/\*\*  
 \* pKa del HOCl con corrección térmica (Pankow 2018, válida 5-40°C)  
 \* @private  
 \*/  
function \_pKaHOCl(T) {  
  return 7.582 \- 0.00913 \* (T \- 25);  
}

/\*\*  
 \* pKa1 del ácido cianúrico con corrección térmica (Wahman 2018b)  
 \* @private  
 \*/  
function \_pKa1CYA(T) {  
  return CONST.PKA1\_CYA\_25C \+ CONST.PKA1\_CYA\_DTDT \* (T \- 25);  
}

/\*\*  
 \* pKa1 del ácido carbónico (CO₂\*/HCO₃⁻) con corrección térmica  
 \* @private  
 \*/  
function \_pKa1Carbonato(T) {  
  return CONST.PKA1\_H2CO3\_25C \+ CONST.PKA1\_H2CO3\_DTDT \* (T \- 25);  
}

/\*\*  
 \* pKa2 del ácido carbónico (HCO₃⁻/CO₃²⁻) con corrección térmica  
 \* @private  
 \*/  
function \_pKa2Carbonato(T) {  
  return CONST.PKA2\_H2CO3\_25C \+ CONST.PKA2\_H2CO3\_DTDT \* (T \- 25);  
}

/\*\*  
 \* pKw del agua con corrección térmica  
 \* @private  
 \*/  
function \_pKw(T) {  
  return CONST.PKW\_25C \+ CONST.PKW\_DTDT \* (T \- 25);  
}

/\*\*  
 \* Fracción de HOCl en el equilibrio HOCl ⇌ H⁺ \+ OCl⁻  
 \* @private  
 \*/  
function \_alphaHOCl(pH, T) {  
  return 1 / (1 \+ Math.pow(10, pH \- \_pKaHOCl(T)));  
}

/\*\*  
 \* Fracción de OCl⁻ (complemento de alphaHOCl)  
 \* @private  
 \*/  
function \_alphaOCl(pH, T) {  
  return 1 \- \_alphaHOCl(pH, T);  
}

/\*\*  
 \* Fracción mono-deprotonada del cianurato (H₂Cy⁻ / total)  
 \* Válida en pH 7-9 donde las disociaciones 2da y 3ra son despreciables.  
 \* @private  
 \*/  
function \_alphaCy1(pH, T) {  
  return 1 / (1 \+ Math.pow(10, \_pKa1CYA(T) \- pH));  
}

/\*\*  
 \* Fracciones de especiación del sistema carbonato.  
 \* Retorna α0 (H₂CO₃\*), α1 (HCO₃⁻), α2 (CO₃²⁻) y constantes K1, K2.  
 \* @private  
 \*/  
function \_alphasCarbonato(pH, T) {  
  const K1 \= Math.pow(10, \-\_pKa1Carbonato(T));  
  const K2 \= Math.pow(10, \-\_pKa2Carbonato(T));  
  const H  \= Math.pow(10, \-pH);  
  const D  \= H \* H \+ K1 \* H \+ K1 \* K2;  
  return {  
    alpha0: (H \* H) / D,  
    alpha1: (K1 \* H) / D,  
    alpha2: (K1 \* K2) / D,  
    K1: K1,  
    K2: K2  
  };  
}

/\*\*  
 \* Concentración de iones hidrógeno e hidroxilo a partir del pH y T.  
 \* @private  
 \*/  
function \_concentracionesIonicas(pH, T) {  
  const H  \= Math.pow(10, \-pH);  
  const Kw \= Math.pow(10, \-\_pKw(T));  
  return { H: H, OH: Kw / H, Kw: Kw };  
}  
Copy  
F.3. Factor de Wojtowicz para ALK\_corr  
Copy/\*\*  
 \* Factor de Wojtowicz para corrección de alcalinidad por cianurato.  
 \* Implementa la tabla de la Sección 4.1.1 del CÓDYCE con interpolación lineal.  
 \* Si \_factorWojtowicz ya existe en el motor v16.6.0, esta función debe  
 \* REEMPLAZARSE por una llamada a la existente para evitar duplicación.  
 \* @private  
 \*/  
function \_factorWojtowiczLocal(pH) {  
  const tabla \= \[  
    { pH: 7.0, f: 0.27 },  
    { pH: 7.2, f: 0.28 },  
    { pH: 7.4, f: 0.32 },  
    { pH: 7.5, f: 0.33 },  
    { pH: 7.6, f: 0.34 },  
    { pH: 7.8, f: 0.35 },  
    { pH: 8.0, f: 0.36 },  
    { pH: 8.2, f: 0.37 }  
  \];

  if (pH \<= tabla\[0\].pH) return tabla\[0\].f;  
  if (pH \>= tabla\[tabla.length \- 1\].pH) return tabla\[tabla.length \- 1\].f;

  for (let i \= 0; i \< tabla.length \- 1; i++) {  
    if (pH \>= tabla\[i\].pH && pH \<= tabla\[i \+ 1\].pH) {  
      const t \= (pH \- tabla\[i\].pH) / (tabla\[i \+ 1\].pH \- tabla\[i\].pH);  
      return tabla\[i\].f \+ t \* (tabla\[i \+ 1\].f \- tabla\[i\].f);  
    }  
  }  
  return tabla\[Math.floor(tabla.length / 2)\].f;  // fallback defensivo  
}

/\*\*  
 \* Calcula ALK\_corr de Wojtowicz, sustrayendo el aporte cianurato de la  
 \* alcalinidad total cruda medida por titulación.  
 \* @private  
 \*/  
function \_alkCorrWojtowicz(ALK\_total\_ppm, CYA\_ppm, pH) {  
  const factor \= (typeof \_factorWojtowicz \=== 'function')  
    ? \_factorWojtowicz(pH)     // usar la función existente del motor si está  
    : \_factorWojtowiczLocal(pH);  
  return Math.max(1, ALK\_total\_ppm \- CYA\_ppm \* factor);  
}  
Copy  
F.4. Capacidad buffer β multibuffer (Stumm & Morgan 1996\)  
Copy/\*\*  
 \* Capacidad buffer total del agua en eq/(L·pH).  
 \* Incluye contribuciones de:  
 \*   \- autoionización del agua (\[H⁺\] \+ \[OH⁻\])  
 \*   \- sistema carbonato (α0·α1, α1·α2, 4·α0·α2)  
 \*   \- sistema cianurato (α\_Cy0·α\_Cy1)  
 \*   \- cloro libre (f\_HOCl·f\_OCl)  
 \*  
 \* Reference: Stumm & Morgan, Aquatic Chemistry 3rd ed., 1996, ec. 4.32 generalizada.  
 \*  
 \* @param {number} pH         pH actual del agua  
 \* @param {number} T          Temperatura en °C  
 \* @param {number} ALK\_corr\_ppm  Alcalinidad de Wojtowicz en ppm CaCO₃  
 \* @param {number} CYA\_ppm    Cianurato total en ppm  
 \* @param {number} FC\_ppm     Cloro libre en ppm  
 \* @returns {number}          β en eq/(L·pH)  
 \* @private  
 \*/  
function \_calcBeta(pH, T, ALK\_corr\_ppm, CYA\_ppm, FC\_ppm) {  
  const ions \= \_concentracionesIonicas(pH, T);  
  const carb \= \_alphasCarbonato(pH, T);

  // ALK\_corr en eq/L. 1 ppm CaCO₃ \= 1/(M\_CaCO3/2) × 10⁻³ eq/L \= 2×10⁻⁵ eq/L  
  const ALK\_corr\_eqL \= ALK\_corr\_ppm / (CONST.M\_CaCO3 \* 0.5) / 1000;

  // C\_T (carbono inorgánico total) derivado de ALK\_corr.  
  // ALK\_corr ≈ C\_T·(α1 \+ 2·α2) en el rango operativo.  
  // Despejar C\_T:  
  const denomCT \= carb.alpha1 \+ 2 \* carb.alpha2;  
  const C\_T \= (denomCT \> 1e-12) ? ALK\_corr\_eqL / denomCT : 0;

  // CYA en mol/L  
  const Cy\_T \= (CYA\_ppm / 1000\) / CONST.M\_H3Cy;  
  const alphaCy1 \= \_alphaCy1(pH, T);  
  const alphaCy0 \= 1 \- alphaCy1;

  // FC en mol/L (como Cl₂ equivalente)  
  const FC\_T \= (FC\_ppm / 1000\) / CONST.M\_Cl2;  
  const f\_HOCl \= \_alphaHOCl(pH, T);  
  const f\_OCl  \= 1 \- f\_HOCl;

  const beta \= 2.303 \* (  
    ions.H \+ ions.OH  
    \+ C\_T \* (  
        carb.alpha0 \* carb.alpha1  
      \+ carb.alpha1 \* carb.alpha2  
      \+ 4 \* carb.alpha0 \* carb.alpha2  
    )  
    \+ Cy\_T \* alphaCy0 \* alphaCy1  
    \+ FC\_T \* f\_HOCl \* f\_OCl  
  );

  return beta;  
}  
Copy  
F.5. Coeficientes ν por producto (catálogo Pool Balance)  
Copy/\*\*  
 \* Coeficiente estequiométrico ácido-base ν para cada producto del catálogo.  
 \* Convención: ν \= mol H⁺ neto liberados por mol de producto comercial activo.  
 \*   ν \> 0  → acidificante (consume alcalinidad)  
 \*   ν \< 0  → alcalinizante (aporta alcalinidad)  
 \*  
 \* Reference: Entregable B Sección 3 del respaldo científico V17.8.  
 \*  
 \* @param {string} producto  Identificador del catálogo  
 \* @param {number} pH        pH operativo  
 \* @param {number} T         Temperatura del agua °C  
 \* @param {Object} opciones  {lote: {eta\_NaOH, eta\_CaOH2}} para override empírico  
 \* @returns {number}         ν adimensional  
 \* @private  
 \*/  
function \_calcularNu(producto, pH, T, opciones) {  
  opciones \= opciones || {};  
  const lote \= opciones.lote || {};

  const f\_HOCl \= \_alphaHOCl(pH, T);  
  const f\_OCl  \= 1 \- f\_HOCl;  
  const a\_Cy1  \= \_alphaCy1(pH, T);  
  const carb   \= \_alphasCarbonato(pH, T);

  const eta\_NaOH \= (lote.eta\_NaOH \!== undefined && lote.eta\_NaOH \!== null)  
    ? lote.eta\_NaOH  
    : CONST.ETA\_NAOH\_DEFAULT;

  const eta\_CaOH2 \= (lote.eta\_CaOH2 \!== undefined && lote.eta\_CaOH2 \!== null)  
    ? lote.eta\_CaOH2  
    : CONST.ETA\_CAOH2\_DEFAULT;

  switch (producto) {  
    case 'tricloro':  
      // C₃Cl₃N₃O₃ \+ 3 H₂O → H₃Cy \+ 3 HOCl  
      // ν \= 3·f\_OCl (disociación HOCl) \+ α\_Cy1 (1ra disociación cianúrico)  
      return 3 \* f\_OCl \+ a\_Cy1;

    case 'hipo\_calcio':  
      // Ca(OCl)₂ → Ca²⁺ \+ 2 OCl⁻; OCl⁻ \+ H⁺ → HOCl (consume H⁺)  
      // Más Ca(OH)₂ residual: cada mol aporta 2 OH⁻  
      return \-2 \* f\_HOCl \- 2 \* eta\_CaOH2;

    case 'cloro\_liquido':  
      // NaOCl → Na⁺ \+ OCl⁻; OCl⁻ \+ H⁺ → HOCl  
      // Más NaOH libre del producto comercial  
      return \-f\_HOCl \- eta\_NaOH;

    case 'bisulfato':  
      // NaHSO₄ → Na⁺ \+ HSO₄⁻ → Na⁺ \+ H⁺ \+ SO₄²⁻  
      // pKa(HSO₄⁻) \= 1.99, totalmente disociado en pH \> 3  
      return \+1.0;

    case 'muriatico':  
      // HCl → H⁺ \+ Cl⁻ (ácido fuerte, disociación completa)  
      return \+1.0;

    case 'alkalin':  
      // NaHCO₃ → Na⁺ \+ HCO₃⁻  
      // En rango operativo el HCO₃⁻ es estable; el efecto sobre pH es  
      // proporcional a α0 (fracción que va hacia H₂CO₃\*) menos α2 (despreciable).  
      // Resultado: ν ≈ \-α0 → ALK sube \~1 eq, pH casi invariante.  
      return \-(carb.alpha0 \- carb.alpha2);

    case 'alcalos':  
      // Na₂CO₃ → 2 Na⁺ \+ CO₃²⁻  
      // CO₃²⁻ \+ H⁺ → HCO₃⁻ (paso 1, consume 1 H⁺)  
      // HCO₃⁻ \+ α0·H⁺ → H₂CO₃ (paso 2, parcial)  
      return \-(1 \+ carb.alpha0 \- carb.alpha2);

    case 'mg\_oh2':  
      // Mg(OH)₂ → Mg²⁺ \+ 2 OH⁻  
      // Limitado por solubilidad: techo de pH 8.5 (Ksp ≈ 5.6e-12)  
      if (pH \< 8.0) return \-2;  
      if (pH \>= 8.5) return 0;  
      // Transición lineal entre 8.0 y 8.5  
      return \-2 \* (8.5 \- pH) / 0.5;

    case 'cya':  
      // H₃Cy → H⁺ \+ H₂Cy⁻ (1ra disociación únicamente en rango operativo)  
      return \+a\_Cy1;

    case 'cacl2':  
      // CaCl₂ → Ca²⁺ \+ 2 Cl⁻; sal neutra  
      return 0;

    default:  
      throw new Error('\[calcDeltaPhPorDosificacion\] Producto desconocido: ' \+ producto);  
  }  
}  
Copy  
F.6. Conversión gramos producto comercial → mol activo / L  
Copy/\*\*  
 \* Convierte la cantidad dosificada del producto comercial (en gramos) a  
 \* concentración molar de especie activa en el volumen del vaso.  
 \*  
 \* Para productos líquidos (cloro\_liquido, muriatico), el input "gramos" debe  
 \* calcularse externamente como volumen\_mL × densidad\_g\_mL antes de invocar  
 \* esta función. Esto mantiene la firma uniforme.  
 \*  
 \* @param {string} producto  Identificador del catálogo  
 \* @param {number} gramos    Masa de producto comercial dosificado (g)  
 \* @param {number} V\_m3      Volumen del vaso en m³  
 \* @returns {number}         C\_P en mol/L  
 \* @private  
 \*/  
function \_concentracionMolar(producto, gramos, V\_m3) {  
  const V\_L \= V\_m3 \* 1000;  
  if (V\_L \<= 0\) throw new Error('\[calcDeltaPhPorDosificacion\] V\_m3 inválido');

  let pureza, M;

  switch (producto) {  
    case 'tricloro':  
      pureza \= CONST.PUREZA\_TRICLORO;  
      M \= CONST.M\_TCCA;  
      break;  
    case 'hipo\_calcio':  
      pureza \= CONST.PUREZA\_HIPO\_CALCIO;  
      M \= CONST.M\_CaOCl2;  
      break;  
    case 'cloro\_liquido':  
      pureza \= CONST.PUREZA\_NAOCL;  
      M \= CONST.M\_NaOCl;  
      break;  
    case 'bisulfato':  
      pureza \= CONST.PUREZA\_BISULFATO;  
      M \= CONST.M\_NaHSO4;  
      break;  
    case 'muriatico':  
      pureza \= CONST.PUREZA\_MURIATICO;  
      M \= CONST.M\_HCl;  
      break;  
    case 'alkalin':  
      pureza \= CONST.PUREZA\_ALKALIN;  
      M \= CONST.M\_NaHCO3;  
      break;  
    case 'alcalos':  
      pureza \= CONST.PUREZA\_ALCALOS;  
      M \= CONST.M\_Na2CO3;  
      break;  
    case 'mg\_oh2':  
      pureza \= CONST.PUREZA\_MGOH2;  
      M \= CONST.M\_MgOH2;  
      break;  
    case 'cya':  
      pureza \= CONST.PUREZA\_CYA;  
      M \= CONST.M\_H3Cy;  
      break;  
    case 'cacl2':  
      pureza \= CONST.PUREZA\_CACL2;  
      M \= CONST.M\_CaCl2;  
      break;  
    default:  
      throw new Error('\[calcDeltaPhPorDosificacion\] Producto desconocido: ' \+ producto);  
  }

  const masaActiva \= gramos \* pureza;  
  return (masaActiva / M) / V\_L;  
}  
Copy  
F.7. Solver cuártico Newton-Raphson  
Copy/\*\*  
 \* Resuelve el balance de alcalinidad acoplado para encontrar \[H⁺\] final  
 \* tras una perturbación ΔAlk \= \-ν·C\_P aplicada al sistema.  
 \*  
 \* El sistema satisface:  
 \*   Alk\_predicha(\[H⁺\]) \= Alk\_objetivo  
 \* con  
 \*   Alk \= C\_T·(K1·H \+ 2·K1·K2) / (H² \+ K1·H \+ K1·K2)   \[carbonato\]  
 \*       \+ Cy\_T · α\_Cy1(H)                              \[cianurato\]  
 \*       \+ Kw/H \- H                                      \[agua\]  
 \*  
 \* Método: Newton-Raphson con derivada numérica robusta, fallback a bisección  
 \* en caso de divergencia, semilla inicial en pH \= NEWTON\_SEMILLA\_PH.  
 \*  
 \* @param {number} Alk\_objetivo\_eqL  Alcalinidad final objetivo en eq/L  
 \* @param {number} C\_T\_eqL           Carbono inorgánico total en mol/L  
 \* @param {number} Cy\_T\_M            Cianurato total en mol/L  
 \* @param {number} T\_agua            Temperatura del agua °C  
 \* @param {number} pH\_inicial        pH antes de la dosificación (para semilla)  
 \* @returns {Object}                 {pH, converged, iteraciones}  
 \* @private  
 \*/  
function \_resolverCuartica(Alk\_objetivo\_eqL, C\_T\_eqL, Cy\_T\_M, T\_agua, pH\_inicial) {  
  const K1     \= Math.pow(10, \-\_pKa1Carbonato(T\_agua));  
  const K2     \= Math.pow(10, \-\_pKa2Carbonato(T\_agua));  
  const Kw     \= Math.pow(10, \-\_pKw(T\_agua));  
  const Ka\_Cy1 \= Math.pow(10, \-\_pKa1CYA(T\_agua));

  // Función residuo: F(H) \= Alk\_predicha(H) \- Alk\_objetivo  
  function residuo(H) {  
    if (H \<= 0 || \!isFinite(H)) return Number.POSITIVE\_INFINITY;  
    const D\_carb \= H \* H \+ K1 \* H \+ K1 \* K2;  
    const alk\_carb \= C\_T\_eqL \* (K1 \* H \+ 2 \* K1 \* K2) / D\_carb;  
    const alphaCy1\_local \= 1 / (1 \+ (H / Ka\_Cy1));  
    const alk\_cya  \= Cy\_T\_M \* alphaCy1\_local;  
    const alk\_agua \= (Kw / H) \- H;  
    return alk\_carb \+ alk\_cya \+ alk\_agua \- Alk\_objetivo\_eqL;  
  }

  // Derivada numérica centrada  
  function derivada(H) {  
    const dH \= Math.max(H \* 1e-7, 1e-15);  
    return (residuo(H \+ dH) \- residuo(H \- dH)) / (2 \* dH);  
  }

  // Semilla: pH\_inicial (continuidad respecto al estado previo)  
  let H \= Math.pow(10, \-(pH\_inicial || CONST.NEWTON\_SEMILLA\_PH));  
  let converged \= false;  
  let i;

  for (i \= 0; i \< CONST.NEWTON\_MAX\_ITER; i++) {  
    const f  \= residuo(H);  
    if (Math.abs(f) \< CONST.NEWTON\_TOLERANCIA) {  
      converged \= true;  
      break;  
    }  
    const df \= derivada(H);  
    if (df \=== 0 || \!isFinite(df)) {  
      // Derivada degenerada: fallback a paso conservador  
      H \= H \* 0.95;  
      continue;  
    }  
    let H\_new \= H \- f / df;

    // Restricción de dominio: H ∈ (1e-14, 1e-1) corresponde a pH ∈ (1, 14\)  
    if (H\_new \<= 1e-14 || H\_new \>= 1e-1 || \!isFinite(H\_new)) {  
      // Bisección defensiva: mover hacia el centro físico  
      H\_new \= H \* (residuo(H) \> 0 ? 1.2 : 0.8);  
    }

    const cambio\_relativo \= Math.abs((H\_new \- H) / H);  
    H \= H\_new;

    if (cambio\_relativo \< 1e-12) {  
      converged \= true;  
      break;  
    }  
  }

  return {  
    pH: \-Math.log10(H),  
    converged: converged,  
    iteraciones: i \+ 1  
  };  
}  
Copy  
F.8. Cálculo de aporte de CYA por productos clorados estabilizados  
Copy/\*\*  
 \* Calcula el aporte secundario de CYA al agua cuando se dosifica un producto  
 \* clorado estabilizado (Tricloro o NaDCC). Necesario para recalcular ALK\_corr  
 \* final correctamente.  
 \*  
 \* @param {string} producto  Identificador del catálogo  
 \* @param {number} gramos    Cantidad dosificada (g)  
 \* @param {number} V\_m3      Volumen en m³  
 \* @returns {number}         ΔCYA en ppm  
 \* @private  
 \*/  
function \_aporteCYA(producto, gramos, V\_m3) {  
  const V\_L \= V\_m3 \* 1000;

  if (producto \=== 'tricloro') {  
    // Tricloro: 91.5% activo, cada mol libera 3 mol HOCl \= 3 mol Cl  
    // Estequiometría: 1 mol TCCA → 1 mol H₃Cy  
    const moles\_TCCA \= (gramos \* CONST.PUREZA\_TRICLORO) / CONST.M\_TCCA;  
    const masa\_CYA\_g \= moles\_TCCA \* CONST.M\_H3Cy;  
    return (masa\_CYA\_g \* 1000\) / V\_L;   // ppm  
  }

  if (producto \=== 'cya') {  
    return (gramos \* CONST.PUREZA\_CYA \* 1000\) / V\_L;  
  }

  // Hipo calcio, NaOCl, ácidos, sales neutras: no aportan CYA  
  return 0;  
}  
F.9. Cálculo de aporte de Ca y de variación de ALK total  
Copy/\*\*  
 \* Calcula el aporte de CH (dureza de calcio) al agua. Relevante para hipo\_calcio  
 \* y CaCl₂, y para mantener consistencia con ISPB post-dosificación.  
 \*  
 \* @private  
 \*/  
function \_aporteCH(producto, gramos, V\_m3) {  
  const V\_L \= V\_m3 \* 1000;

  if (producto \=== 'hipo\_calcio') {  
    // Ca(OCl)₂: 1 mol producto → 1 mol Ca²⁺ → expresado como ppm CaCO₃ equivalente  
    const moles\_CaOCl2 \= (gramos \* CONST.PUREZA\_HIPO\_CALCIO) / CONST.M\_CaOCl2;  
    const masa\_CaCO3\_g \= moles\_CaOCl2 \* CONST.M\_CaCO3;  
    return (masa\_CaCO3\_g \* 1000\) / V\_L;  
  }

  if (producto \=== 'cacl2') {  
    const moles\_CaCl2 \= (gramos \* CONST.PUREZA\_CACL2) / CONST.M\_CaCl2;  
    const masa\_CaCO3\_g \= moles\_CaCl2 \* CONST.M\_CaCO3;  
    return (masa\_CaCO3\_g \* 1000\) / V\_L;  
  }

  return 0;  
}

/\*\*  
 \* Calcula la variación de alcalinidad total cruda en ppm CaCO₃, considerando  
 \* tanto el consumo/aporte estequiométrico (vía ν) como el aporte de cianurato  
 \* (que entra a la alcalinidad total medida por titulación a pH 4.5).  
 \*  
 \* @private  
 \*/  
function \_calcDeltaALKTotal(deltaAlk\_eqL\_estequio, deltaCYA\_ppm, pH\_final) {  
  // Aporte estequiométrico en ppm CaCO₃  
  const deltaAlk\_estequio\_ppm \= deltaAlk\_eqL\_estequio \* CONST.M\_CaCO3 \* 0.5 \* 1000;

  // El CYA aportado se titula como alcalinidad cruda con factor Wojtowicz  
  const factor\_W \= \_factorWojtowiczLocal(pH\_final);  
  const deltaAlk\_por\_CYA \= deltaCYA\_ppm \* factor\_W;

  return deltaAlk\_estequio\_ppm \+ deltaAlk\_por\_CYA;  
}  
Copy  
F.10. Helper de validación de inputs  
Copy/\*\*  
 \* Valida y normaliza inputs de calcDeltaPhPorDosificacion. Lanza errores  
 \* descriptivos para inputs inválidos; genera advertencias para inputs en  
 \* rangos extremos pero procesables.  
 \*  
 \* @returns {Array\<string\>}  Lista de advertencias no bloqueantes  
 \* @private  
 \*/  
function \_validarInputs(producto, gramos, V\_m3, lecturas) {  
  const advertencias \= \[\];

  if (\!CONST.PRODUCTOS\_SOPORTADOS.includes(producto)) {  
    throw new Error(  
      '\[calcDeltaPhPorDosificacion\] Producto no soportado: "' \+ producto \+  
      '". Soportados: ' \+ CONST.PRODUCTOS\_SOPORTADOS.join(', ')  
    );  
  }  
  if (typeof gramos \!== 'number' || gramos \<= 0 || \!isFinite(gramos)) {  
    throw new Error('\[calcDeltaPhPorDosificacion\] gramos debe ser número positivo finito');  
  }  
  if (typeof V\_m3 \!== 'number' || V\_m3 \<= 0 || \!isFinite(V\_m3)) {  
    throw new Error('\[calcDeltaPhPorDosificacion\] V\_m3 debe ser número positivo finito');  
  }  
  if (\!lecturas || typeof lecturas \!== 'object') {  
    throw new Error('\[calcDeltaPhPorDosificacion\] lecturas requerido como objeto');  
  }

  const { pH, ALK, CYA, FC, T\_agua } \= lecturas;

  if (typeof pH \!== 'number' || pH \< 4 || pH \> 11\) {  
    throw new Error('\[calcDeltaPhPorDosificacion\] pH fuera de rango admisible (4-11): ' \+ pH);  
  }  
  if (typeof ALK \!== 'number' || ALK \< 0\) {  
    throw new Error('\[calcDeltaPhPorDosificacion\] ALK inválida: ' \+ ALK);  
  }  
  if (typeof CYA \!== 'number' || CYA \< 0\) {  
    throw new Error('\[calcDeltaPhPorDosificacion\] CYA inválido: ' \+ CYA);  
  }  
  if (typeof FC \!== 'number' || FC \< 0\) {  
    throw new Error('\[calcDeltaPhPorDosificacion\] FC inválido: ' \+ FC);  
  }  
  if (typeof T\_agua \!== 'number' || T\_agua \< 0 || T\_agua \> 50\) {  
    throw new Error('\[calcDeltaPhPorDosificacion\] T\_agua fuera de rango (0-50°C): ' \+ T\_agua);  
  }

  // Advertencias no bloqueantes  
  if (pH \< 5 || pH \> 9\) {  
    advertencias.push('pH fuera de rango operativo confiable (5-9). Modelo extrapolado.');  
  }  
  if (T\_agua \< 5 || T\_agua \> 40\) {  
    advertencias.push('T\_agua fuera de rango Pankow (5-40°C). Correcciones térmicas extrapoladas.');  
  }  
  if (ALK \< 10\) {  
    advertencias.push('ALK extremadamente baja. Sistema sin amortiguamiento efectivo. Restaurar antes de dosificar.');  
  }  
  if (CYA \> 100\) {  
    advertencias.push('CYA elevado (\>100 ppm). Considerar dilución antes de continuar (patrón Caso Slow).');  
  }

  return advertencias;  
}  
Copy  
FIN DE LA PARTE 1\.

En la Parte 2 que sigue irán: función principal calcDeltaPhPorDosificacion, evaluación de premedicación corregida (sin el placeholder de la spec), propagación gaussiana, exportación del módulo, suite completa de tests unitarios, y nota de integración con el motor existente.

¿Procedo con la Parte 2?

Copiar  
Si  
Procedo con la Parte 2 del Entregable F.

ENTREGABLE F — Parte 2 de 2  
Función principal, premedicación, propagación gaussiana, exportación, suite de tests, integración

F.11. Evaluación de premedicación  
Copy/\*\*  
 \* Evalúa si la dosificación proyectada saca el pH del rango operativo en  
 \* escenario pesimista, y de ser así genera recomendación de premedicación.  
 \*  
 \* La lógica:  
 \*   1\. Determina el rango operativo efectivo: intersección entre rango del  
 \*      modo activo (Sección 1.4 del CÓDYCE) y ventana del recubrimiento  
 \*      (Sección 4.3). El rango más estrecho prevalece.  
 \*   2\. Calcula pH\_final en escenario pesimista.  
 \*   3\. Si pH\_final\_pesimista \< piso → premedicación con Alkalin (subir ALK).  
 \*   4\. Si pH\_final\_pesimista \> techo → premedicación con Bisulfato Klaren.  
 \*   5\. Si dentro de rango → no se requiere.  
 \*  
 \* @param {number} pH\_actual          pH antes de dosificar  
 \* @param {number} deltaPh\_pesimista  ΔpH en escenario peor caso  
 \* @param {number} V\_m3               Volumen del vaso  
 \* @param {number} beta               β actual eq/(L·pH)  
 \* @param {Object} opciones           {phPiso, phTecho, recubrimiento, modo}  
 \* @returns {Object}                  {requerida, producto, gramos, justificacion}  
 \* @private  
 \*/  
function \_evaluarPremedicacion(pH\_actual, deltaPh\_pesimista, V\_m3, beta, opciones) {  
  opciones \= opciones || {};

  // Rango operativo: intersección modo activo ∩ ventana recubrimiento  
  const phPiso  \= (opciones.phPiso  \!== undefined) ? opciones.phPiso  : CONST.PREMED\_PH\_PISO\_DEFAULT;  
  const phTecho \= (opciones.phTecho \!== undefined) ? opciones.phTecho : CONST.PREMED\_PH\_TECHO\_DEFAULT;

  const pH\_final\_pesimista \= pH\_actual \+ deltaPh\_pesimista;  
  const V\_L \= V\_m3 \* 1000;

  // Caso 1: acidificación excesiva → premedicar con Alkalin  
  if (pH\_final\_pesimista \< phPiso) {  
    const gap \= phPiso \- pH\_final\_pesimista;  
    // g\_alkalin \= gap · β · V\_L · M\_NaHCO3 · factor\_seguridad  
    // (eq necesarios \= gap·β·V\_L; gramos \= eq·M, asumiendo Alkalin \= NaHCO₃ puro)  
    const gramos\_alkalin \=  
      gap \* beta \* V\_L \* CONST.M\_NaHCO3 \* CONST.PREMED\_FACTOR\_SEGURIDAD;

    return {  
      requerida: true,  
      producto: 'alkalin',  
      gramos: Math.round(gramos\_alkalin),  
      justificacion:  
        'pH proyectado en escenario pesimista (' \+ pH\_final\_pesimista.toFixed(2) \+  
        ') quedaría bajo el piso operativo (' \+ phPiso.toFixed(2) \+  
        '). Premedicar con Alkalin Spin sube ALK previamente y absorbe el impacto ácido del producto principal. Aplicar 30 min antes y re-medir.',  
      pH\_final\_pesimista: Number(pH\_final\_pesimista.toFixed(2)),  
      gap\_pH: Number(gap.toFixed(2))  
    };  
  }

  // Caso 2: alcalinización excesiva → premedicar con Bisulfato  
  if (pH\_final\_pesimista \> phTecho) {  
    const gap \= pH\_final\_pesimista \- phTecho;  
    // El bisulfato Klaren al 50% requiere compensar la pureza  
    const gramos\_bisulfato \=  
      gap \* beta \* V\_L \* CONST.M\_NaHSO4 \* CONST.PREMED\_FACTOR\_SEGURIDAD  
      / CONST.PUREZA\_BISULFATO;

    return {  
      requerida: true,  
      producto: 'bisulfato',  
      gramos: Math.round(gramos\_bisulfato),  
      justificacion:  
        'pH proyectado en escenario pesimista (' \+ pH\_final\_pesimista.toFixed(2) \+  
        ') excedería el techo operativo (' \+ phTecho.toFixed(2) \+  
        '). Premedicar con Bisulfato Klaren neutraliza la base entrante. Aplicar 30 min antes y re-medir.',  
      pH\_final\_pesimista: Number(pH\_final\_pesimista.toFixed(2)),  
      gap\_pH: Number(gap.toFixed(2))  
    };  
  }

  // Caso 3: dentro de rango  
  return {  
    requerida: false,  
    pH\_final\_pesimista: Number(pH\_final\_pesimista.toFixed(2))  
  };  
}  
Copy  
F.12. Propagación gaussiana de errores (Opción B)  
Copy/\*\*  
 \* Calcula la desviación estándar del ΔpH predicho mediante propagación de  
 \* errores gaussiana sobre las fuentes principales de incertidumbre:  
 \*   \- ALK (medición ColorQ)  
 \*   \- CYA (medición ColorQ)  
 \*   \- T\_agua (sensor o estimación)  
 \*   \- pH (medición ColorQ)  
 \*   \- gramos (pesaje del operador)  
 \*   \- η\_NaOH / η\_CaOH2 (composición específica del lote)  
 \*  
 \* Método: derivadas parciales por diferencias finitas centradas; suma cuadrática.  
 \*  
 \* @returns {Object}  {sigma, contribuciones, deltaPh\_base, banda\_95pct}  
 \* @private  
 \*/  
function \_propagacionGaussiana(producto, gramos, V\_m3, lecturas, opciones) {  
  // ΔpH base  
  function deltaPhLineal(producto, gramos\_arg, V\_m3, lecturas\_arg, opciones\_arg) {  
    const ALK\_corr \= \_alkCorrWojtowicz(lecturas\_arg.ALK, lecturas\_arg.CYA, lecturas\_arg.pH);  
    const nu \= \_calcularNu(producto, lecturas\_arg.pH, lecturas\_arg.T\_agua, opciones\_arg);  
    const beta \= \_calcBeta(  
      lecturas\_arg.pH, lecturas\_arg.T\_agua, ALK\_corr,  
      lecturas\_arg.CYA, lecturas\_arg.FC  
    );  
    const C\_P \= \_concentracionMolar(producto, gramos\_arg, V\_m3);  
    return \-nu \* C\_P / beta;  
  }

  const base \= deltaPhLineal(producto, gramos, V\_m3, lecturas, opciones);

  // Perturbaciones individuales  
  const perturbaciones \= \[  
    { fuente: 'ALK',     sigma: CONST.SIGMA\_ALK\_PPM,   key: 'ALK'    },  
    { fuente: 'CYA',     sigma: CONST.SIGMA\_CYA\_PPM,   key: 'CYA'    },  
    { fuente: 'T\_agua',  sigma: CONST.SIGMA\_T\_AGUA\_C,  key: 'T\_agua' },  
    { fuente: 'pH',      sigma: CONST.SIGMA\_PH\_UNITS,  key: 'pH'     }  
  \];

  let varianza \= 0;  
  const contribuciones \= \[\];

  // Derivadas parciales respecto a lecturas  
  for (const p of perturbaciones) {  
    const lectPlus  \= Object.assign({}, lecturas, { \[p.key\]: lecturas\[p.key\] \+ p.sigma });  
    const lectMinus \= Object.assign({}, lecturas, { \[p.key\]: lecturas\[p.key\] \- p.sigma });  
    const dF \= (deltaPhLineal(producto, gramos, V\_m3, lectPlus, opciones) \-  
                deltaPhLineal(producto, gramos, V\_m3, lectMinus, opciones)) / (2 \* p.sigma);  
    const aporte \= Math.pow(dF \* p.sigma, 2);  
    varianza \+= aporte;  
    contribuciones.push({  
      fuente: p.fuente,  
      sigma\_input: p.sigma,  
      dF\_dInput: Number(dF.toExponential(3)),  
      aporte\_sigma2: Number(aporte.toExponential(3))  
    });  
  }

  // Derivada respecto a gramos  
  const sigma\_gramos \= gramos \* CONST.SIGMA\_GRAMOS\_REL;  
  const dF\_gramos \= (deltaPhLineal(producto, gramos \+ sigma\_gramos, V\_m3, lecturas, opciones) \-  
                     deltaPhLineal(producto, gramos \- sigma\_gramos, V\_m3, lecturas, opciones))  
                     / (2 \* sigma\_gramos);  
  const aporte\_gramos \= Math.pow(dF\_gramos \* sigma\_gramos, 2);  
  varianza \+= aporte\_gramos;  
  contribuciones.push({  
    fuente: 'gramos',  
    sigma\_input: Number(sigma\_gramos.toFixed(2)),  
    dF\_dInput: Number(dF\_gramos.toExponential(3)),  
    aporte\_sigma2: Number(aporte\_gramos.toExponential(3))  
  });

  // Derivada respecto a η (solo si aplica al producto)  
  const opcionesEta \= opciones.lote || {};  
  const aplica\_eta\_NaOH \= (producto \=== 'cloro\_liquido');  
  const aplica\_eta\_CaOH2 \= (producto \=== 'hipo\_calcio');

  if (aplica\_eta\_NaOH || aplica\_eta\_CaOH2) {  
    const eta\_actual \= aplica\_eta\_NaOH  
      ? (opcionesEta.eta\_NaOH || CONST.ETA\_NAOH\_DEFAULT)  
      : (opcionesEta.eta\_CaOH2 || CONST.ETA\_CAOH2\_DEFAULT);  
    const sigma\_eta \= eta\_actual \* CONST.SIGMA\_ETA\_REL;  
    const eta\_key \= aplica\_eta\_NaOH ? 'eta\_NaOH' : 'eta\_CaOH2';

    const opcPlus  \= Object.assign({}, opciones, {  
      lote: Object.assign({}, opcionesEta, { \[eta\_key\]: eta\_actual \+ sigma\_eta })  
    });  
    const opcMinus \= Object.assign({}, opciones, {  
      lote: Object.assign({}, opcionesEta, { \[eta\_key\]: eta\_actual \- sigma\_eta })  
    });

    const dF\_eta \= (deltaPhLineal(producto, gramos, V\_m3, lecturas, opcPlus) \-  
                    deltaPhLineal(producto, gramos, V\_m3, lecturas, opcMinus))  
                    / (2 \* sigma\_eta);  
    const aporte\_eta \= Math.pow(dF\_eta \* sigma\_eta, 2);  
    varianza \+= aporte\_eta;  
    contribuciones.push({  
      fuente: eta\_key,  
      sigma\_input: Number(sigma\_eta.toFixed(4)),  
      dF\_dInput: Number(dF\_eta.toExponential(3)),  
      aporte\_sigma2: Number(aporte\_eta.toExponential(3))  
    });  
  }

  const sigma \= Math.sqrt(varianza);

  // Banda de confianza 95% (≈ ±1.96σ)  
  return {  
    deltaPh\_base: Number(base.toFixed(3)),  
    sigma: Number(sigma.toFixed(4)),  
    banda\_95pct: {  
      inferior: Number((base \- 1.96 \* sigma).toFixed(3)),  
      superior: Number((base \+ 1.96 \* sigma).toFixed(3))  
    },  
    contribuciones: contribuciones.sort((a, b) \=\> b.aporte\_sigma2 \- a.aporte\_sigma2)  
  };  
}  
Copy  
F.13. Función principal calcDeltaPhPorDosificacion  
Copy/\*\*  
 \* Predice el ΔpH inmediato producido por la dosificación de un producto químico  
 \* del catálogo Pool Balance, ANTES de aplicarlo.  
 \*  
 \* Distingue tres regímenes operativos:  
 \*   • Lineal: ALK\_corr ≥ 60 ppm y |ΔpH| \< 0.3 → fórmula Henderson-Hasselbalch  
 \*     generalizada.  
 \*   • Cuártico: perturbaciones moderadas → resolver Newton-Raphson sobre balance  
 \*     de alcalinidad acoplado.  
 \*   • Ultra no lineal: ALK\_corr \< 30 ppm → cuártica con banda de incertidumbre  
 \*     ampliada y advertencia operativa.  
 \*  
 \* Reporta tres escenarios (Opción C): base, pesimista, optimista. Opcionalmente  
 \* incluye banda gaussiana formal (Opción B) bajo flag.  
 \*  
 \* Activa premedicación automática si el escenario pesimista saca el pH del rango  
 \* operativo del modo activo o de la ventana del recubrimiento.  
 \*  
 \* @param {string} producto    Identificador: 'tricloro', 'hipo\_calcio',  
 \*                             'cloro\_liquido', 'bisulfato', 'muriatico',  
 \*                             'alkalin', 'alcalos', 'mg\_oh2', 'cya', 'cacl2'  
 \* @param {number} gramos      Producto comercial dosificado en gramos  
 \*                             (para líquidos: mL × densidad antes de invocar)  
 \* @param {number} V\_m3        Volumen del vaso en m³  
 \* @param {Object} lecturas    {pH, ALK, CYA, FC, T\_agua}  
 \* @param {Object} \[opciones\]  Configuración opcional  
 \* @param {boolean} \[opciones.incertidumbreFormal=false\]  Habilita Opción B  
 \* @param {boolean} \[opciones.forzarCuartica=false\]       Salta el lineal  
 \* @param {Object}  \[opciones.lote\]                       Override de η por lote  
 \* @param {number}  \[opciones.phPiso\]                     Piso operativo custom  
 \* @param {number}  \[opciones.phTecho\]                    Techo operativo custom  
 \* @param {string}  \[opciones.modo\]                       Modo activo (informativo)  
 \*  
 \* @returns {Object} Predicción completa con todos los escenarios y metadatos  
 \*/  
function calcDeltaPhPorDosificacion(producto, gramos, V\_m3, lecturas, opciones) {  
  opciones \= opciones || {};

  // \=== 1\. VALIDACIÓN DE INPUTS \===  
  const advertencias \= \_validarInputs(producto, gramos, V\_m3, lecturas);

  // \=== 2\. CONDICIONES INICIALES \===  
  const ALK\_corr\_inicial \= \_alkCorrWojtowicz(lecturas.ALK, lecturas.CYA, lecturas.pH);  
  const ALK\_corr\_eqL\_inicial \= ALK\_corr\_inicial / (CONST.M\_CaCO3 \* 0.5) / 1000;  
  const C\_P \= \_concentracionMolar(producto, gramos, V\_m3);  
  const nu\_base \= \_calcularNu(producto, lecturas.pH, lecturas.T\_agua, opciones);  
  const beta\_base \= \_calcBeta(  
    lecturas.pH, lecturas.T\_agua, ALK\_corr\_inicial,  
    lecturas.CYA, lecturas.FC  
  );

  // \=== 3\. ESTIMACIÓN LINEAL PRELIMINAR \===  
  const deltaAlk\_eqL \= \-nu\_base \* C\_P;  
  const deltaPh\_lineal\_base \= deltaAlk\_eqL / beta\_base;

  // \=== 4\. DECISIÓN DE RÉGIMEN \===  
  const requiere\_cuartica \= opciones.forzarCuartica  
    || Math.abs(deltaPh\_lineal\_base) \> CONST.DELTAPH\_LINEAL\_MAX  
    || ALK\_corr\_inicial \< CONST.ALK\_CORR\_LINEAL\_MIN\_PPM;

  let deltaPh\_base, pH\_final\_base, regimen;

  if (requiere\_cuartica) {  
    // Resolver cuártica para pH final exacto  
    const carb \= \_alphasCarbonato(lecturas.pH, lecturas.T\_agua);  
    const denomCT \= carb.alpha1 \+ 2 \* carb.alpha2;  
    const C\_T\_eqL \= (denomCT \> 1e-12) ? ALK\_corr\_eqL\_inicial / denomCT : 0;  
    const Cy\_T\_M \= (lecturas.CYA / 1000\) / CONST.M\_H3Cy;

    const Alk\_objetivo\_eqL \= ALK\_corr\_eqL\_inicial \+ deltaAlk\_eqL;

    const resCuartica \= \_resolverCuartica(  
      Alk\_objetivo\_eqL, C\_T\_eqL, Cy\_T\_M, lecturas.T\_agua, lecturas.pH  
    );

    pH\_final\_base \= resCuartica.pH;  
    deltaPh\_base \= pH\_final\_base \- lecturas.pH;  
    regimen \= (ALK\_corr\_inicial \< CONST.ALK\_CORR\_ULTRA\_MIN\_PPM)  
      ? 'ultra\_no\_lineal'  
      : 'cuartico';

    if (\!resCuartica.converged) {  
      advertencias.push(  
        'Solver cuártico no convergió en ' \+ CONST.NEWTON\_MAX\_ITER \+  
        ' iteraciones. Resultado aproximado, verificar empíricamente.'  
      );  
    }  
    if (regimen \=== 'ultra\_no\_lineal') {  
      advertencias.push(  
        'ALK\_corr crítica (' \+ ALK\_corr\_inicial.toFixed(1) \+ ' ppm). ' \+  
        'Restaurar amortiguamiento con Alkalin antes de dosificar es FUERTEMENTE recomendado.'  
      );  
    }  
  } else {  
    deltaPh\_base \= deltaPh\_lineal\_base;  
    pH\_final\_base \= lecturas.pH \+ deltaPh\_base;  
    regimen \= 'lineal';  
  }

  // \=== 5\. ESCENARIOS PESIMISTA Y OPTIMISTA (Opción C) \===

  // Pesimista: η máximos, T\_agua \+2°C, ALK\_corr \-10%  
  const opcPesimista \= Object.assign({}, opciones, {  
    lote: Object.assign({}, opciones.lote || {}, {  
      eta\_NaOH:  CONST.ETA\_NAOH\_MAX,  
      eta\_CaOH2: CONST.ETA\_CAOH2\_MAX  
    })  
  });  
  const T\_pes \= lecturas.T\_agua \+ 2;  
  const ALK\_corr\_pes \= ALK\_corr\_inicial \* 0.9;  
  const nu\_pes \= \_calcularNu(producto, lecturas.pH, T\_pes, opcPesimista);  
  const beta\_pes \= \_calcBeta(lecturas.pH, T\_pes, ALK\_corr\_pes, lecturas.CYA, lecturas.FC);  
  const deltaPh\_pesimista \= \-nu\_pes \* C\_P / beta\_pes;

  // Optimista: η \= 0, T exacta, ALK\_corr \+10%  
  const opcOptimista \= Object.assign({}, opciones, {  
    lote: { eta\_NaOH: 0, eta\_CaOH2: 0 }  
  });  
  const ALK\_corr\_opt \= ALK\_corr\_inicial \* 1.1;  
  const nu\_opt \= \_calcularNu(producto, lecturas.pH, lecturas.T\_agua, opcOptimista);  
  const beta\_opt \= \_calcBeta(lecturas.pH, lecturas.T\_agua, ALK\_corr\_opt, lecturas.CYA, lecturas.FC);  
  const deltaPh\_optimista \= \-nu\_opt \* C\_P / beta\_opt;

  // Garantizar orden semántico: pesimista \= el más adverso para el sistema  
  // (si ν \> 0, "peor" \= pH más bajo \= ΔpH más negativo)  
  // (si ν \< 0, "peor" \= pH más alto \= ΔpH más positivo)  
  // El cálculo ya produce el orden correcto por construcción.

  // \=== 6\. ESTADO FINAL DEL AGUA \===  
  const deltaCYA \= \_aporteCYA(producto, gramos, V\_m3);  
  const deltaCH \= \_aporteCH(producto, gramos, V\_m3);  
  const deltaALK\_total\_ppm \= \_calcDeltaALKTotal(deltaAlk\_eqL, deltaCYA, pH\_final\_base);  
  const ALK\_total\_final \= Math.max(0, lecturas.ALK \+ deltaALK\_total\_ppm);  
  const CYA\_final \= lecturas.CYA \+ deltaCYA;  
  const alkCorrFinal \= \_alkCorrWojtowicz(ALK\_total\_final, CYA\_final, pH\_final\_base);

  // \=== 7\. EVALUACIÓN DE PREMEDICACIÓN \===  
  const premedicacion \= \_evaluarPremedicacion(  
    lecturas.pH, deltaPh\_pesimista, V\_m3, beta\_base, opciones  
  );

  // \=== 8\. INCERTIDUMBRE FORMAL (Opción B, bajo flag) \===  
  let gaussiana \= null;  
  if (opciones.incertidumbreFormal \=== true) {  
    gaussiana \= \_propagacionGaussiana(producto, gramos, V\_m3, lecturas, opciones);  
  }

  // \=== 9\. RETORNO ESTRUCTURADO \===  
  return {  
    deltaPhBase:        Number(deltaPh\_base.toFixed(3)),  
    deltaPhPesimista:   Number(deltaPh\_pesimista.toFixed(3)),  
    deltaPhOptimista:   Number(deltaPh\_optimista.toFixed(3)),  
    phFinalBase:        Number(pH\_final\_base.toFixed(2)),  
    phFinalPesimista:   Number((lecturas.pH \+ deltaPh\_pesimista).toFixed(2)),  
    phFinalOptimista:   Number((lecturas.pH \+ deltaPh\_optimista).toFixed(2)),  
    alkCorrInicial:     Number(ALK\_corr\_inicial.toFixed(1)),  
    alkCorrFinal:       Number(alkCorrFinal.toFixed(1)),  
    alkTotalFinal:      Number(ALK\_total\_final.toFixed(1)),  
    cyaFinal:           Number(CYA\_final.toFixed(1)),  
    deltaCH:            Number(deltaCH.toFixed(1)),  
    nu:                 Number(nu\_base.toFixed(3)),  
    beta:               Number(beta\_base.toExponential(3)),  
    concentracionMolar: Number(C\_P.toExponential(3)),  
    regimen:            regimen,  
    gaussiana:          gaussiana,  
    premedicacion:      premedicacion,  
    advertencias:       advertencias,  
    metadatos: {  
      producto:        producto,  
      gramos:          gramos,  
      volumen\_m3:      V\_m3,  
      pH\_inicial:      lecturas.pH,  
      T\_agua:          lecturas.T\_agua,  
      pKa\_HOCl:        Number(\_pKaHOCl(lecturas.T\_agua).toFixed(3)),  
      pKa1\_CYA:        Number(\_pKa1CYA(lecturas.T\_agua).toFixed(3)),  
      version:         'chemistry.js v16.7 / Sección 13 CÓDYCE V17.8'  
    }  
  };  
}  
Copy  
F.14. Exportación del módulo  
Copy// \=============================================================================  
// EXPORTACIÓN  
// Compatible con CommonJS (Node) y ES Modules (PWA bundlers).  
// La función principal calcDeltaPhPorDosificacion se expone públicamente.  
// Las auxiliares con prefijo "\_" quedan privadas al módulo.  
// \=============================================================================

if (typeof module \!== 'undefined' && module.exports) {  
  module.exports.calcDeltaPhPorDosificacion \= calcDeltaPhPorDosificacion;  
  // Exportar también auxiliares para testing unitario externo  
  module.exports.\_internal\_v17\_8 \= {  
    pKaHOCl:           \_pKaHOCl,  
    pKa1CYA:           \_pKa1CYA,  
    pKa1Carbonato:     \_pKa1Carbonato,  
    pKa2Carbonato:     \_pKa2Carbonato,  
    alphaHOCl:         \_alphaHOCl,  
    alphaOCl:          \_alphaOCl,  
    alphaCy1:          \_alphaCy1,  
    alphasCarbonato:   \_alphasCarbonato,  
    factorWojtowicz:   \_factorWojtowiczLocal,  
    alkCorrWojtowicz:  \_alkCorrWojtowicz,  
    calcBeta:          \_calcBeta,  
    calcularNu:        \_calcularNu,  
    concentracionMolar:\_concentracionMolar,  
    resolverCuartica:  \_resolverCuartica,  
    aporteCYA:         \_aporteCYA,  
    aporteCH:          \_aporteCH,  
    evaluarPremedicacion: \_evaluarPremedicacion,  
    propagacionGaussiana: \_propagacionGaussiana  
  };  
}

// Para integración con namespace Chemistry existente en PWA:  
if (typeof Chemistry \!== 'undefined') {  
  Chemistry.calcDeltaPhPorDosificacion \= calcDeltaPhPorDosificacion;  
}  
Copy  
F.15. Suite de tests unitarios  
Copy// \=============================================================================  
// TESTS UNITARIOS — REGRESIÓN OBLIGATORIA  
// Ejecutar antes de cualquier release. Pass requerido: 100%.  
// \=============================================================================

const TESTS\_DELTAPH\_V17\_8 \= \[

  {  
    nombre: 'T01 \- Tricloro ejemplo canónico CÓDYCE Sec 13.9',  
    input: {  
      producto: 'tricloro',  
      gramos: 133,  
      V\_m3: 40,  
      lecturas: { pH: 7.4, ALK: 90, CYA: 40, FC: 2, T\_agua: 30 }  
    },  
    esperado: {  
      deltaPhBase:    { valor: \-0.07,  tolerancia: 0.03 },  
      nu:             { valor: 2.06,   tolerancia: 0.10 },  
      regimen:        'lineal',  
      premedicacion:  { requerida: false }  
    }  
  },

  {  
    nombre: 'T02 \- Validación Alkalin reproduce constante motor (16.78 g/ppm·10m³)',  
    input: {  
      producto: 'alkalin',  
      gramos: 16.78,   // dosis para subir ALK \+1 ppm en 10 m³  
      V\_m3: 10,  
      lecturas: { pH: 7.5, ALK: 80, CYA: 30, FC: 3, T\_agua: 28 }  
    },  
    esperado: {  
      // ΔAlk ≈ \+1 ppm CaCO₃, ΔpH muy pequeño (\<0.02)  
      deltaPhBase:    { valor: 0.005, tolerancia: 0.03 },  
      regimen:        'lineal',  
      premedicacion:  { requerida: false }  
    }  
  },

  {  
    nombre: 'T03 \- Hipoclorito Klaren caso Slow (Sec 8.2)',  
    input: {  
      producto: 'hipo\_calcio',  
      gramos: 230,  
      V\_m3: 50,  
      lecturas: { pH: 7.6, ALK: 95, CYA: 62, FC: 2.5, T\_agua: 29 }  
    },  
    esperado: {  
      deltaPhBase:    { valor: 0.04,  tolerancia: 0.04 },  
      nu:             { valor: \-1.05, tolerancia: 0.10 },  
      regimen:        'lineal'  
    }  
  },

  {  
    nombre: 'T04 \- Ácido muriático fuerte en agua subamortiguada (cuártica)',  
    input: {  
      producto: 'muriatico',  
      gramos: 500,   // ≈ 431 mL × 1.16  
      V\_m3: 30,  
      lecturas: { pH: 7.5, ALK: 40, CYA: 30, FC: 3, T\_agua: 28 }  
    },  
    esperado: {  
      regimen:        'cuartico',  
      deltaPhBase:    { valor: \-0.7,  tolerancia: 0.3 },  
      premedicacion:  { requerida: true, producto: 'alkalin' }  
    }  
  },

  {  
    nombre: 'T05 \- Cloruro de calcio: sal neutra (ΔpH ≈ 0)',  
    input: {  
      producto: 'cacl2',  
      gramos: 1000,  
      V\_m3: 40,  
      lecturas: { pH: 7.4, ALK: 100, CYA: 50, FC: 3, T\_agua: 30 }  
    },  
    esperado: {  
      deltaPhBase:    { valor: 0,    tolerancia: 0.005 },  
      nu:             { valor: 0,    tolerancia: 0.001 },  
      premedicacion:  { requerida: false }  
    }  
  },

  {  
    nombre: 'T06 \- Mg(OH)₂ cerca del techo (pH 8.3): ν efectivo reducido',  
    input: {  
      producto: 'mg\_oh2',  
      gramos: 300,  
      V\_m3: 35,  
      lecturas: { pH: 8.3, ALK: 100, CYA: 50, FC: 3, T\_agua: 29 }  
    },  
    esperado: {  
      nu:             { valor: \-0.8, tolerancia: 0.2 }  
    }  
  },

  {  
    nombre: 'T07 \- Caso Carranza Mg(OH)₂ en yeso (Sec 8.1)',  
    input: {  
      producto: 'mg\_oh2',  
      gramos: 200,  
      V\_m3: 35,  
      lecturas: { pH: 7.2, ALK: 95, CYA: 45, FC: 2.5, T\_agua: 28 }  
    },  
    esperado: {  
      nu:             { valor: \-2.0, tolerancia: 0.10 },  
      // Observación empírica histórica: pH subió \~+0.1 por dosis  
      deltaPhBase:    { valor: 0.10, tolerancia: 0.08 }  
    }  
  },

  {  
    nombre: 'T08 \- Régimen ultra no lineal: spa con ALK 15',  
    input: {  
      producto: 'cloro\_liquido',  
      gramos: 100,  
      V\_m3: 4,  
      lecturas: { pH: 7.0, ALK: 15, CYA: 0, FC: 0, T\_agua: 30 }  
    },  
    esperado: {  
      regimen:        'ultra\_no\_lineal',  
      advertencias\_min: 1  
    }  
  },

  {  
    nombre: 'T09 \- Bisulfato Klaren bajada controlada',  
    input: {  
      producto: 'bisulfato',  
      gramos: 500,  
      V\_m3: 35,  
      lecturas: { pH: 8.0, ALK: 130, CYA: 40, FC: 3, T\_agua: 30 }  
    },  
    esperado: {  
      nu:             { valor: 1.0,  tolerancia: 0.01 },  
      deltaPhBase:    { valor: \-0.27,tolerancia: 0.10 }  
    }  
  },

  {  
    nombre: 'T10 \- Tricloro ejemplo CÓDYCE con incertidumbreFormal',  
    input: {  
      producto: 'tricloro',  
      gramos: 133,  
      V\_m3: 40,  
      lecturas: { pH: 7.4, ALK: 90, CYA: 40, FC: 2, T\_agua: 30 },  
      opciones: { incertidumbreFormal: true }  
    },  
    esperado: {  
      // Gaussiana debe estar presente y con sigma razonable (\<0.05)  
      gaussiana\_presente: true,  
      gaussiana\_sigma\_max: 0.05  
    }  
  },

  {  
    nombre: 'T11 \- Producto desconocido lanza error',  
    input: {  
      producto: 'producto\_inexistente',  
      gramos: 100,  
      V\_m3: 30,  
      lecturas: { pH: 7.4, ALK: 90, CYA: 40, FC: 3, T\_agua: 30 }  
    },  
    esperado: { lanzaError: true }  
  },

  {  
    nombre: 'T12 \- V\_m3 inválido lanza error',  
    input: {  
      producto: 'tricloro',  
      gramos: 100,  
      V\_m3: 0,  
      lecturas: { pH: 7.4, ALK: 90, CYA: 40, FC: 3, T\_agua: 30 }  
    },  
    esperado: { lanzaError: true }  
  }  
\];

/\*\*  
 \* Ejecuta la suite completa de tests y retorna reporte estructurado.  
 \*/  
function ejecutarTestsDeltaPh() {  
  const reporte \= {  
    total: TESTS\_DELTAPH\_V17\_8.length,  
    pass: 0,  
    fail: 0,  
    detalles: \[\]  
  };

  for (const t of TESTS\_DELTAPH\_V17\_8) {  
    const detalle \= { nombre: t.nombre, pass: false, observaciones: \[\] };

    // Caso de error esperado  
    if (t.esperado.lanzaError \=== true) {  
      try {  
        calcDeltaPhPorDosificacion(  
          t.input.producto, t.input.gramos, t.input.V\_m3, t.input.lecturas, t.input.opciones  
        );  
        detalle.observaciones.push('Esperaba error, no se lanzó');  
      } catch (e) {  
        detalle.pass \= true;  
        detalle.observaciones.push('Error correctamente lanzado: ' \+ e.message);  
      }  
      reporte\[detalle.pass ? 'pass' : 'fail'\]++;  
      reporte.detalles.push(detalle);  
      continue;  
    }

    // Caso de ejecución normal  
    let resultado;  
    try {  
      resultado \= calcDeltaPhPorDosificacion(  
        t.input.producto, t.input.gramos, t.input.V\_m3, t.input.lecturas, t.input.opciones  
      );  
    } catch (e) {  
      detalle.observaciones.push('Error inesperado: ' \+ e.message);  
      reporte.fail++;  
      reporte.detalles.push(detalle);  
      continue;  
    }

    let passLocal \= true;  
    const E \= t.esperado;

    // Verificaciones de valores numéricos con tolerancia  
    const camposNumericos \= \['deltaPhBase', 'nu'\];  
    for (const campo of camposNumericos) {  
      if (E\[campo\] && typeof E\[campo\].valor \=== 'number') {  
        const diff \= Math.abs(resultado\[campo\] \- E\[campo\].valor);  
        if (diff \> E\[campo\].tolerancia) {  
          passLocal \= false;  
          detalle.observaciones.push(  
            campo \+ ' fuera de tolerancia: obtenido=' \+ resultado\[campo\] \+  
            ' esperado=' \+ E\[campo\].valor \+ ' (±' \+ E\[campo\].tolerancia \+ ')'  
          );  
        }  
      }  
    }

    if (E.regimen && resultado.regimen \!== E.regimen) {  
      passLocal \= false;  
      detalle.observaciones.push(  
        'régimen incorrecto: obtenido=' \+ resultado.regimen \+ ' esperado=' \+ E.regimen  
      );  
    }

    if (E.premedicacion) {  
      if (E.premedicacion.requerida \!== undefined &&  
          resultado.premedicacion.requerida \!== E.premedicacion.requerida) {  
        passLocal \= false;  
        detalle.observaciones.push(  
          'premedicacion.requerida incorrecta: obtenido=' \+ resultado.premedicacion.requerida \+  
          ' esperado=' \+ E.premedicacion.requerida  
        );  
      }  
      if (E.premedicacion.producto &&  
          resultado.premedicacion.producto \!== E.premedicacion.producto) {  
        passLocal \= false;  
        detalle.observaciones.push(  
          'premedicacion.producto incorrecto: obtenido=' \+ resultado.premedicacion.producto \+  
          ' esperado=' \+ E.premedicacion.producto  
        );  
      }  
    }

    if (E.advertencias\_min && resultado.advertencias.length \< E.advertencias\_min) {  
      passLocal \= false;  
      detalle.observaciones.push(  
        'advertencias insuficientes: obtenidas=' \+ resultado.advertencias.length \+  
        ' mínimo=' \+ E.advertencias\_min  
      );  
    }

    if (E.gaussiana\_presente && \!resultado.gaussiana) {  
      passLocal \= false;  
      detalle.observaciones.push('gaussiana ausente, se esperaba presente');  
    }

    if (E.gaussiana\_sigma\_max \!== undefined && resultado.gaussiana &&  
        resultado.gaussiana.sigma \> E.gaussiana\_sigma\_max) {  
      passLocal \= false;  
      detalle.observaciones.push(  
        'gaussiana.sigma excede máximo: ' \+ resultado.gaussiana.sigma \+  
        ' \> ' \+ E.gaussiana\_sigma\_max  
      );  
    }

    detalle.pass \= passLocal;  
    detalle.resultado \= resultado;  
    reporte\[passLocal ? 'pass' : 'fail'\]++;  
    reporte.detalles.push(detalle);  
  }

  reporte.tasa\_exito \= (reporte.pass / reporte.total \* 100).toFixed(1) \+ '%';  
  return reporte;  
}

// Exportar tests si está en entorno Node  
if (typeof module \!== 'undefined' && module.exports) {  
  module.exports.TESTS\_DELTAPH\_V17\_8 \= TESTS\_DELTAPH\_V17\_8;  
  module.exports.ejecutarTestsDeltaPh \= ejecutarTestsDeltaPh;  
}  
Copy  
F.16. Nota de integración con chemistry.js v16.6.0  
Para integrar el módulo en tu motor existente, sigue este checklist en orden estricto:

Primero, localiza el bloque CONST existente en chemistry.js v16.6.0 y añade el bloque F.1 al final de ese objeto, sin tocar las constantes preexistentes. Las constantes nuevas usan prefijos que no colisionan con las antiguas (PKA1\_, M\_, PUREZA\_, ETA\_, NEWTON\_, PREMED\_, SIGMA\_\*).

Segundo, revisa si tu motor ya implementa \_factorWojtowicz. Si la función existe (Sección 4.1.1 del CÓDYCE V17.7 sugiere que sí), la función \_factorWojtowiczLocal de F.3 debe servir solo como fallback defensivo: el detección automática en \_alkCorrWojtowicz usará la existente si está disponible. Si tu nombre interno es distinto (por ejemplo factorCorreccionWojtowicz o \_wojtowicz), reemplaza el typeof \_factorWojtowicz \=== 'function' por el nombre real.

Tercero, inserta las funciones auxiliares en orden: F.2 → F.3 → F.4 → F.5 → F.6 → F.7 → F.8 → F.9 → F.10. Cada bloque es independiente excepto por las dependencias de constantes y por las funciones auxiliares previas. Si insertas todo el módulo como un bloque contiguo al final de chemistry.js, el orden queda resuelto naturalmente.

Cuarto, inserta la función principal F.13, seguida de la premedicación F.11 y la propagación gaussiana F.12. Conceptualmente F.11 y F.12 son auxiliares de F.13, pero por claridad de lectura en el archivo final pueden ir antes o después; lo importante es que estén declaradas antes de invocar calcDeltaPhPorDosificacion por primera vez.

Quinto, añade el bloque de exportación F.14 al final del archivo, después de cualquier otra exportación existente. El bloque detecta automáticamente si está en Node (CommonJS) o en PWA con namespace Chemistry. Si tu motor usa otro namespace (por ejemplo PoolBalance.Chemistry), añade la línea correspondiente.

Sexto, ejecuta la suite de tests F.15 después de la integración. Pueden ejecutarse desde consola de navegador con ejecutarTestsDeltaPh() o desde Node con require('./chemistry.js').ejecutarTestsDeltaPh(). La tasa de éxito debe ser 100% antes de marcar v16.7 como release stable. Si algún test falla, lee detalles\[i\].observaciones para diagnosticar.

Séptimo, actualiza la versión del header de chemistry.js de v16.6.0 a v16.7.0 con changelog breve referenciando la Sección 13 del CÓDYCE V17.8.

Octavo, registra el feature flag CONST.ENABLE\_DELTAPH\_PREDICTION \= true en tu configuración runtime. Si quisieras desactivar la facultad temporalmente (por ejemplo durante una sesión de calibración), basta con poner el flag en false y la función puede envolverse en un guardia opcional. En el código actual no hay tal guardia para no añadir complejidad innecesaria; añádelo si tu PWA lo necesita.

Noveno, invoca desde Isaías según el paso 6-ter del flujo de 11 pasos del Apéndice del CÓDYCE V17.8. La invocación canónica es:

Copyconst prediccion \= Chemistry.calcDeltaPhPorDosificacion(  
  'tricloro',           // o el producto que corresponda  
  133,                  // gramos calculados por calcDosificacion previa  
  40,                   // V\_m3 del gemelo digital  
  { pH: 7.4, ALK: 90, CYA: 40, FC: 2, T\_agua: 30 },  
  {  
    modo: 'rutinario',  
    phPiso: 7.2,        // del modo activo o recubrimiento, lo más estrecho  
    phTecho: 7.8,  
    incertidumbreFormal: false   // true solo para análisis técnico profundo  
  }  
);  
Y el resultado se inyecta en la respuesta estructurada de Isaías según el formato de Sección 9 del CÓDYCE.

Décimo y último, comienza el ciclo de calibración empírica según el Entregable I (que te entrego a continuación). Las constantes ETA\_NAOH\_DEFAULT, ETA\_CAOH2\_DEFAULT, y las purezas comerciales son los puntos donde la realidad de campo Veracruz puede diferir de la literatura general, y son los que el protocolo de calibración refina con tu data real.

— FIN DEL ENTREGABLE F (Partes 1 y 2\) —

"  
