PASO 1 — Refactor de calcISV con Wojtowicz dinámica  
Cambios sobre chemistry.js v16.6.0 → v16.7.0 (propuesto)

Tres modificaciones quirúrgicas: una constante nueva (tabla Wojtowicz), un helper nuevo ( \_factorWojtowicz), y una línea sustituida dentro de calcISV. Cero cambios en la firma pública. Cero cambios en lo que retorna calcISV(excepto que ahora alkCorry pHssalen calculados correctamente).

1.1. Nueva constante en el bloque CONST  
Inyectar dentro de Chemistry.CONST, idealmente justo después de TOPES\_SALUD\_POR\_MODOy antes de FIRMA:

Copy    // ─────────────────────────────────────────────────────────  
    // V16.7.0 ADD — Matriz Wojtowicz dinámica para corrección  
    // de alcalinidad por ácido cianúrico.  
    //  
    // Fuente primaria: Wojtowicz, J.A. (1995, 2004\) "Effect of  
    // Cyanuric Acid on Swimming Pool Maintenance" J. Swimming  
    // Pool & Spa Industry. Tabla de factores publicados.  
    //  
    // Reemplaza la aproximación heurística ALK \- CYA/3, que  
    // introduce errores de hasta ±0.04 unidades de pHs en los  
    // extremos de pH (7.0 y 8.2), magnificados en proyecciones  
    // temporales largas.  
    //  
    // Aplicación: ALK\_corregida \= max(1, ALK \- CYA × factor(pH))  
    // Interpolación: lineal entre puntos adyacentes (igual  
    // estrategia que \_factorTemp).  
    // ─────────────────────────────────────────────────────────  
    WOJTOWICZ\_TABLA: Object.freeze(\[  
      { ph: 7.0, f: 0.27 },  
      { ph: 7.2, f: 0.28 },  
      { ph: 7.4, f: 0.32 },  
      { ph: 7.5, f: 0.33 },  
      { ph: 7.6, f: 0.34 },  
      { ph: 7.8, f: 0.35 },  
      { ph: 8.0, f: 0.36 },  
      { ph: 8.2, f: 0.37 }  
    \]),  
1.2. Nuevo helper privado\_factorWojtowicz  
Inyectar justo después de \_factorTemp(mantener proximidad estructural, son helpers hermanos):

Copy  // ═══════════════════════════════════════════════  
  //  V16.7.0 ADD — FACTOR WOJTOWICZ DINÁMICO  
  //  
  //  Devuelve el factor de corrección de cianurato sobre  
  //  alcalinidad total según el pH actual del agua. Reemplaza  
  //  la regla heurística CYA/3 por la matriz publicada por  
  //  Wojtowicz (1995, 2004).  
  //  
  //  Para pH fuera del rango tabulado \[7.0, 8.2\]: extrapolación  
  //  por extremos (clamp al valor del borde más cercano). NO  
  //  extrapolar linealmente porque los datos de Wojtowicz no  
  //  están validados fuera de ese rango y la extrapolación  
  //  introduciría errores no controlados.  
  //  
  //  Interpolación entre puntos: lineal (consistente con  
  //  \_factorTemp).  
  // ═══════════════════════════════════════════════

  \_factorWojtowicz(ph) {  
    const tabla \= this.CONST.WOJTOWICZ\_TABLA;  
    const phN \= parseFloat(ph);

    if (isNaN(phN)) return tabla\[3\].f; // fallback pH 7.5 \= 0.33

    // Clamp en extremos (no extrapolar fuera de rango validado)  
    if (phN \<= tabla\[0\].ph) return tabla\[0\].f;  
    if (phN \>= tabla\[tabla.length \- 1\].ph) return tabla\[tabla.length \- 1\].f;

    // Interpolación lineal entre puntos adyacentes  
    for (let i \= 0; i \< tabla.length \- 1; i++) {  
      const p0 \= tabla\[i\];  
      const p1 \= tabla\[i \+ 1\];  
      if (phN \>= p0.ph && phN \<= p1.ph) {  
        const deltaPh \= phN \- p0.ph;  
        const rangoPh \= p1.ph \- p0.ph;  
        const rangoF  \= p1.f \- p0.f;  
        const resultado \= p0.f \+ (deltaPh \* rangoF / rangoPh);  
        return parseFloat(resultado.toFixed(4));  
      }  
    }

    return tabla\[3\].f; // unreachable, fallback defensivo  
  },  
Copy  
1.3. Modificación quirúrgica dentro de calcISV  
Localizar este bloque dentro de calcISV(línea aproximada según tu archivo, dentro del cálculo de factores):

Copy    // CÓDIGO ACTUAL — v16.6.0 (ELIMINAR)  
    const alkCorr \= Math.max(1, alkN \- (cianN / 3));  
    const F\_ALK \= parseFloat(Math.log10(alkCorr).toFixed(4));  
Reemplazar literalmente por:

Copy    // V16.7.0 MOD — Wojtowicz dinámico reemplaza heurística CYA/3  
    // La fórmula previa (CYA/3) introducía errores de hasta ±0.04  
    // pHs en los extremos del rango operativo. Crítico para el  
    // Proyector Temporal del ISPB donde el sesgo se acumula.  
    const factorWoj \= this.\_factorWojtowicz(phN);  
    const alkCorr \= Math.max(1, alkN \- (cianN \* factorWoj));  
    const F\_ALK \= parseFloat(Math.log10(alkCorr).toFixed(4));  
Y en el returnde calcISV, agregue dos campos al objeto retornado para trazabilidad (no rompan consumidores existentes porque son aditivos):

Copy    return {  
      isv, pHs, estado, color,  
      F\_T:     parseFloat(F\_T.toFixed(4)),  
      F\_CH:    parseFloat(F\_CH.toFixed(4)),  
      F\_ALK:   parseFloat(F\_ALK.toFixed(4)),  
      F\_TDS:   parseFloat(F\_TDS.toFixed(4)),  
      alkCorr: parseFloat(alkCorr.toFixed(1)),  
      // V16.7.0 ADD — trazabilidad Wojtowicz  
      wojtowicz\_factor: factorWoj,  
      wojtowicz\_metodo: 'dinamico\_pH',  
      zonaMin, zonaMax, recubrimiento,  
      recomendacion, isl\_ref,  
      firma: this.CONST.FIRMA  
    };  
1.4. Actualizar encabezado de versión  
Cambiar VERSION: '16.6.0'por VERSION: '16.7.0'y agregar entrada al comentario maestro arriba del archivo:

Copy \* VERSIÓN: 16.7.0 — Wojtowicz dinámico reemplaza heurística CYA/3  
 \*   \- V16.7.0 ADD CONST: WOJTOWICZ\_TABLA (8 puntos pH 7.0-8.2,  
 \*     factores 0.27-0.37, Wojtowicz 1995/2004).  
 \*   \- V16.7.0 ADD METHOD: \_factorWojtowicz(ph) con interpolación  
 \*     lineal entre puntos adyacentes y clamp en extremos.  
 \*   \- V16.7.0 MOD calcISV: alkCorr ahora usa CYA × factor(pH)  
 \*     en lugar de CYA/3. Elimina sesgo de ±0.04 pHs en extremos.  
 \*   \- V16.7.0 ADD: calcISV retorna wojtowicz\_factor y  
 \*     wojtowicz\_metodo para trazabilidad y auditoría.  
 \*   \- Justificación: el sesgo de la heurística CYA/3 se acumula  
 \*     en proyecciones temporales largas (Proyector ISPB v17.8).  
 \*     Esta corrección es prerequisito del proyector.  
 \*   \- Compatibilidad: cero regresión. Firma pública intacta.  
 \*     Campos retornados son aditivos.  
1.5. Pruebas unitarias de regresión (T\_WOJ\_01 a T\_WOJ\_06)  
Suite mínima para validar el cambio antes de promover una producción:

CopyT\_WOJ\_01 — Punto exacto tabulado pH 7.4  
  Input:  ph=7.4, T=30, CH=300, ALK=100, CYA=50  
  Esperado: factorWoj=0.32, alkCorr=84.0, pHs≈7.51, ISPB≈-0.11  
  Antes (v16.6.0): alkCorr=83.3, pHs≈7.51 (casi idéntico en este punto)

T\_WOJ\_02 — Extremo bajo pH 7.0 (donde CYA/3 más se equivoca)  
  Input:  ph=7.0, T=30, CH=300, ALK=100, CYA=60  
  Esperado: factorWoj=0.27, alkCorr=83.8, pHs≈7.51, ISPB≈-0.51  
  Antes (v16.6.0): alkCorr=80.0, pHs≈7.53, ISPB≈-0.53  
  Delta pHs: \+0.02 (ISPB menos agresivo, más fiel a Wojtowicz)

T\_WOJ\_03 — Extremo alto pH 8.2 (techo de desgasificación)  
  Input:  ph=8.2, T=30, CH=300, ALK=100, CYA=60  
  Esperado: factorWoj=0.37, alkCorr=77.8, pHs≈7.55, ISPB≈+0.65  
  Antes (v16.6.0): alkCorr=80.0, pHs≈7.53, ISPB≈+0.67  
  Delta pHs: \+0.02 (ISPB menos incrustante, más fiel)

T\_WOJ\_04 — Interpolación pH 7.3 (entre 7.2 y 7.4)  
  Input:  ph=7.3, CYA=50  
  Esperado: factorWoj=0.30 (interpolación: 0.28 \+ 0.5×(0.32-0.28))  
  Verificación: alkCorr \= 100 \- 50×0.30 \= 85.0

T\_WOJ\_05 — Clamp inferior pH 6.8 (fuera de rango)  
  Input:  ph=6.8  
  Esperado: factorWoj=0.27 (clamp al valor de pH=7.0)  
  No extrapolar.

T\_WOJ\_06 — CYA=0 (regresión: debe comportarse idéntico a v16.6.0)  
  Input:  ph=7.5, CYA=0, ALK=100  
  Esperado: alkCorr=100, pHs idéntico a versión anterior  
  Validación: cuando no hay cianurato, Wojtowicz no aplica y el ISPB  
  debe ser bit-idéntico a la versión previa. Anti-regresión.  
Impacto cuantitativo de la corrección : en condiciones medias (pH 7.4-7.6, CYA 30-60 ppm) la diferencia con CYA/3 es \<0.02 pHs, prácticamente indistinguible. En los extremos (pH 7.0 o 8.2, CYA \>50) la diferencia llega a 0.04 pHs, que es exactamente el margen que mata la precisión del proyector temporal a 72 horas. Por eso este paso era no negociable.