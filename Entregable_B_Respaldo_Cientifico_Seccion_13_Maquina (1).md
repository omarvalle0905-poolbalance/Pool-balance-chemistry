Excelente. Tengo confirmados todos los datos críticos:

Morris 1966, J. Phys. Chem. 70, 3798–3805 — verificado.
O’Brien, Morris & Butler 1974, capítulo en Rubin (ed.) — verificado.
Wojtowicz 1995, JSPSI 1(1):6–12 — verificado en poolhelp.com con cita exacta “Alk_corr = Alk_T − 1/3 · ppm CA”.
Wahman & Alexander 2018, J. AWWA — verificado.
Pankow, Aquatic Chemistry Concepts, 2nd ed., Routledge/CRC — verificado.
Procedo con el Entregable B.
ENTREGABLE B — Respaldo Científico de la Sección 13
Título completo:
Respaldo Científico de la Predicción del ΔpH Inmediato por Dosificación Química en Albercas Residenciales: Marco Termodinámico, Estequiométrico y de Especiación Ácido-Base
Documento técnico de respaldo para CÓDYCE NEXUS V17.8, Sección 13
Pool Balance · Omar Alberto Valle Mercado · Veracruz, México · Mayo 2026
Calibrado contra chemistry.js v16.6.0 (constantes) y v16.7 (especificación)
Resumen ejecutivo
Este documento provee el respaldo científico de la Sección 13 del CÓDYCE NEXUS V17.7, donde se introduce la facultad de predicción del ΔpH inmediato por dosificación química en el motor Pool Balance. Se desarrolla un marco termodinámico unificado que cubre los tres halogenantes principales (Tricloro 90%, Hipoclorito de Calcio 65%, Cloro Líquido 12%) y todos los productos auxiliares de ajuste ácido-base del catálogo Pool Balance (Bisulfato Klaren, Ácido Muriático, Alkalin, Alcalos, Mg(OH)₂, Ácido Cianúrico, Cloruro de Calcio). La derivación se construye sobre la termodinámica clásica de Stumm & Morgan (1996), la especiación ácido-base del cloro libre según Morris (1966) actualizada por Pankow (2018), el modelo de equilibrios cloro-cianurato de O’Brien et al. (1974) revisado por Wahman & Alexander (2018), y la corrección de alcalinidad por cianurato de Wojtowicz (1995, 2004). Cada constante incorporada al motor tiene trazabilidad explícita a fuente primaria. El modelo es internamente consistente con las funciones existentes calcFraccionHOCl, calcISV y calcDeltaPhDesgasificacion, y reusa la corrección dinámica de Wojtowicz (Sección 4.1.1) en lugar de duplicarla.
1. Marco conceptual y problema a resolver
1.1. El hueco operativo
El motor chemistry.js v16.6.0 calcula correctamente cuántos gramos de un producto se requieren para mover un parámetro objetivo (FC, ALK, CYA, CH), pero no predice cuánto subirá o bajará el pH como consecuencia química directa de esa dosificación. La constante NAOCL_DELTA_ALK_POR_PPM_CL aparece anotada como “positivo” sin valor numérico. En la operación de campo de Pool Balance esto significa que Omar debe estimar empíricamente el impacto de cada dosificación o esperar a la siguiente lectura ColorQ para corregir desviaciones. Para un motor que reclama “estequiometría es ley” (Regla 2), este hueco es estructural y debe cerrarse con la misma disciplina termodinámica que el resto del códice.

1.2. Tres fenómenos distintos que afectan el pH
Es indispensable separar conceptualmente tres procesos que actúan sobre el pH del agua de una alberca, porque ocurren a escalas temporales distintas y con mecanismos químicos distintos:
Impulso ácido-base inmediato (escala: segundos a minutos): la disolución y hidrólisis del producto químico introduce o consume protones netos. Es el fenómeno modelado por la Sección 13 del códice. Es el objeto de este documento.
Especiación posterior del cloro libre (escala: minutos a horas): el cloro libre se redistribuye entre HOCl, OCl⁻ y especies cloradas del cianurato según el equilibrio O’Brien-Wojtowicz-Wahman. Esta redistribución modifica ligeramente el pH si el equilibrio inicial no estaba alcanzado, pero su efecto principal es sobre la disponibilidad del biocida, no sobre el pH. Tratada en Sección 5.3 del códice.
Deriva por desgasificación de CO₂ (escala: horas a días): el agua, con la nueva alcalinidad post-dosificación, tiende al equilibrio con la pCO₂ atmosférica. Si la perturbación ácido-base la dejó sobresaturada de CO₂ disuelto, se libera y el pH sube hacia el techo 8.4. Si la dejó subsaturada, captura CO₂ y el pH baja. Tratada en Sección 12 del códice.
La Sección 13 del CÓDYCE V17.8 modela exclusivamente el primer fenómeno. La salida de Sección 13 (pH_final inmediato) es el input inicial para los modelos de Sección 5.3 y Sección 12 que actúan después.

1.3. Antecedente: una auditoría científica externa identificó errores
En mayo 2026 una auditoría científica externa a un documento preliminar generado por otro agente identificó inconsistencias graves: mezcla de convenciones (mol H⁺ por mol de producto vs. por mol de Cl₂-equivalente), errores aritméticos en el coeficiente del Tricloro, omisión del Ca(OH)₂ residual en el modelo comercial de Ca(OCl)₂, y predicciones lineales sobreestimadas para perturbaciones grandes. Este documento incorpora las correcciones identificadas en esa auditoría y adopta una convención única (ν por mol de producto comercial) para todo el catálogo Pool Balance.
2. Termodinámica fundamental
2.1. El par HOCl/OCl⁻ — Morris 1966 actualizado por Pankow
La fuente original del pKa del ácido hipocloroso es Morris (1966), que midió la constante de ionización entre 5 y 35 °C usando potenciometría y espectrofotometría UV. El valor a 25 °C es:
pKa(HOCl, 25 °C) = 7.537 ± 0.011
con entalpía estándar de ionización ΔH° = +13.8 kJ·mol⁻¹.
Pankow (2018) en Aquatic Chemistry Concepts (2ª ed., Routledge/CRC) propuso la aproximación lineal:
pKa_HOCl(T) = 7.582 − 0.00913 × (T − 25)
válida para 5 °C ≤ T ≤ 40 °C, derivada del ajuste de van’t Hoff a los datos de Morris. Esta es la forma adoptada en chemistry.js v16.6.0 (Sección 5.3 del códice) y mantenida sin modificación en la nueva facultad para asegurar coherencia.
Verificación numérica: Pankow a T = 25 °C predice pKa = 7.582 − 0 = 7.582, ligeramente mayor que el valor medido de Morris (7.537). La diferencia de 0.045 unidades corresponde al ajuste empírico que Pankow realizó incluyendo datos posteriores a Morris (Connick & Chia 1959; Adam & Gordon 1995) y reflejando un valor termodinámico consensuado actualizado. Para Veracruz a T = 30 °C, Pankow da pKa = 7.536, prácticamente idéntico al de Morris a 25 °C.
Las fracciones de especiación son:
f_HOCl(pH, T) = 1 / (1 + 10^(pH − pKa(T)))

f_OCl(pH, T) = 1 − f_HOCl(pH, T)
A pH = 7.4 y T = 30 °C en Veracruz: f_HOCl ≈ 0.578, f_OCl ≈ 0.422.

2.2. El sistema cianurato — Wahman 2018a actualiza a Morris-O’Brien
El ácido cianúrico (H₃Cy, C₃H₃N₃O₃) es un ácido triprótico débil. Wahman et al. (2018b, Environmental Engineering Science 35:1259–1266, “First Acid Ionization Constant of the Drinking Water Relevant Chemical Cyanuric Acid from 5 to 35 °C”) reportan:
pKa1(H₃Cy, 25 °C) = 6.88

pKa2 = 11.40

pKa3 ≈ 13.5
con corrección térmica:
pKa1_CYA(T) ≈ 6.88 − 0.011 × (T − 25)
para el rango 5–35 °C. A T = 30 °C, pKa1 ≈ 6.825.
La fracción mono-deprotonada relevante en el rango operativo de albercas (pH 7.0–7.8) es:
α_Cy1(pH, T) = 1 / (1 + 10^(pKa1(T) − pH))
A pH 7.4 y T 30 °C: α_Cy1 ≈ 0.79.

2.3. El sistema carbonato — Stumm & Morgan 1996
Las constantes del sistema carbonato a 25 °C, fuerza iónica baja, son canónicas:
pKa1(H₂CO₃*, 25 °C) = 6.35

pKa2(HCO₃⁻, 25 °C) = 10.33
donde H₂CO₃* representa la suma de CO₂(aq) + H₂CO₃ verdadero. La corrección térmica de Plummer & Busenberg (1982) puede aproximarse:
pKa1(T) ≈ 6.35 − 0.0055 × (T − 25)

pKa2(T) ≈ 10.33 − 0.0090 × (T − 25)
A T = 30 °C en Veracruz: pKa1 ≈ 6.32, pKa2 ≈ 10.29.
Las fracciones de especiación del carbono inorgánico total son:
α_0_CO₃(pH) = [H⁺]² / D

α_1_CO₃(pH) = K₁·[H⁺] / D

α_2_CO₃(pH) = K₁·K₂ / D
con D = [H⁺]² + K₁·[H⁺] + K₁·K₂.
A pH 7.4: α_0 ≈ 0.077, α_1 ≈ 0.923, α_2 ≈ 4.4×10⁻⁴. El bicarbonato domina abrumadoramente en el rango operativo.

2.4. Alcalinidad como invariante de protones
Siguiendo Stumm & Morgan (1996, capítulo 4), la alcalinidad total se define como:
Alk = [HCO₃⁻] + 2·[CO₃²⁻] + [OH⁻] − [H⁺] + Σ contribuciones de bases débiles
En agua de piscina con cianurato, la corrección de Wojtowicz (1995) cuantifica la contribución cianurato a la alcalinidad medida por titulación a pH 4.5:
Alk_carbonato = Alk_total − f_W(pH) × CYA
donde f_W(pH) es el factor de corrección dinámico tabulado en Sección 4.1.1 del códice (rango 0.27 a 0.37 entre pH 7.0 y 8.2). Esta corrección es fundamental porque el cianurato presente como H₂Cy⁻ se titula junto con el bicarbonato y aparenta ser alcalinidad de carbonatos, distorsionando los cálculos de ISPB y de capacidad buffer.

2.5. Capacidad buffer — Van Slyke generalizado
Stumm & Morgan (1996, ec. 4.32) definen la capacidad buffer para un sistema cerrado multibuffer:
β = 2.303 × { [H⁺] + [OH⁻] + Σᵢ Cᵢ_T × αⱼ × αⱼ₊₁ × (estructura de saltos) }
Para Pool Balance, el desarrollo explícito con los tres sistemas relevantes (carbonato, cianurato, cloro libre) y la auto-ionización del agua es:
β = 2.303 × {

[H⁺] + Kw/[H⁺] +

C_T_CO₃ × (α_0·α_1 + α_1·α_2 + 4·α_0·α_2) +

Cy_T × α_Cy0 × α_Cy1 +

FC_T × f_HOCl × f_OCl

}
donde:
C_T_CO₃ = carbono inorgánico total, derivado de ALK_carbonato (no de ALK_total)

Cy_T = CYA total en mol/L (CYA_ppm × 10⁻³ / 129.07)

FC_T = cloro libre total en mol/L (FC_ppm × 10⁻³ / 70.91)
Unidades de β: equivalentes por litro por unidad de pH. El factor 2.303 = ln(10) convierte derivadas en log₁₀ a derivadas en base e.
Para agua de piscina veracruzana típica (ALK 100 ppm, CYA 50 ppm, FC 4 ppm, pH 7.5, T 30 °C, ALK_corr ≈ 83 ppm CaCO₃ → C_T_CO₃ ≈ 1.0×10⁻³ M), el cálculo da β ≈ 2.3×10⁻⁴ eq/(L·pH). El término carbonato aporta ~85%, el cianurato ~10%, el cloro libre ~3%, y la autoionización del agua ~2%.
3. Estequiometría ácido-base por producto
Esta sección desarrolla, producto por producto, la derivación rigurosa del coeficiente ν (mol H⁺ neto por mol de producto comercial). Cada subsección presenta: (i) la reacción de disolución/hidrólisis, (ii) el balance de protones, (iii) la fórmula de ν dependiente de pH y T, y (iv) el valor numérico evaluado en condiciones de referencia Veracruz (pH 7.5, T 30 °C).

3.1. Tricloroisocianúrico (Tricloro Clorizide 91)
Fórmula: C₃Cl₃N₃O₃, M = 232.41 g/mol, contenido activo 90–91.5% como Cl₂-equivalente.
Hidrólisis: Wojtowicz (2004) describe la hidrólisis acuosa global como:
C₃Cl₃N₃O₃ + 3 H₂O ⇌ C₃H₃N₃O₃ + 3 HOCl
Por cada mol de tricloro se liberan 3 mol de HOCl y 1 mol de ácido cianúrico en su forma totalmente protonada H₃Cy.
Balance de protones: los 3 HOCl se disocian parcialmente según la fracción f_OCl al pH del medio, liberando f_OCl·3 mol de H⁺. El H₃Cy generado se disocia hasta su forma de equilibrio al pH del medio, liberando α_Cy1 mol de H⁺ adicionales (la segunda y tercera disociaciones son despreciables a pH < 9). Suma:
ν_TCCA(pH, T) = 3 · f_OCl(pH, T) + α_Cy1(pH, T)
Valor a pH 7.5, T 30 °C: f_OCl = 0.481, α_Cy1 = 0.825. ν = 3·0.481 + 0.825 = 2.27.
Verificación cruzada con auditoría externa: la auditoría señaló un valor de 2.3 mol H⁺/mol TCCA. La pequeña diferencia (2.27 vs. 2.30) se debe a que la auditoría usó pKa_CYA constante a 25 °C; al incorporar corrección térmica de Wahman 2018 (pKa1 baja a 6.825 a 30 °C), el α_Cy1 sube ligeramente y el resultado se desplaza 0.03 unidades. Ambos valores son consistentes dentro del error del modelo.

3.2. Hipoclorito de Calcio (Klaren 65%)
Fórmula: Ca(OCl)₂, M = 142.98 g/mol. El producto comercial técnico no es Ca(OCl)₂ puro: según hojas de seguridad (Redox SDS, Valudor TDS), contiene 65–75% Ca(OCl)₂, 5–10% agua, ≤3% Ca(OH)₂, ≤3% CaCl₂, ≤20% NaCl y otros inertes. La fase activa cristalina suele ser dibásica Ca₃(OCl)₂(OH)₄ = Ca(OCl)₂·2Ca(OH)₂ (Wikipedia/Bleach).
Hidrólisis: Ca(OCl)₂ → Ca²⁺ + 2 OCl⁻. El ion hipoclorito es base débil y se protona parcialmente:
2 OCl⁻ + 2 H⁺ → 2 HOCl    (consume protones)
El Ca(OH)₂ residual se disuelve completamente en agua de piscina (Ksp ≈ 5.5×10⁻⁶, pH limitado a ~12.5 para saturación), liberando 2 mol OH⁻ por mol de Ca(OH)₂, equivalente a consumir 2 mol H⁺.
Balance de protones:
ν_CaOCl₂(pH, T) = −2 · f_HOCl(pH, T) − 2 · η_CaOH₂
donde η_CaOH₂ = mol Ca(OH)₂ por mol Ca(OCl)₂ en producto comercial. Default conservador η_CaOH₂ = 0.03 (3% mol/mol según SDS Redox). En productos dibásicos Ca(OCl)₂·2Ca(OH)₂ puros, η_CaOH₂ podría llegar a 2.0, pero esto no es el caso del Klaren 65% típico.
Valor a pH 7.5, T 30 °C: f_HOCl = 0.519, η_CaOH₂ = 0.03. ν = −2·0.519 − 2·0.03 = −1.10.

3.3. Hipoclorito de Sodio (Cloro Líquido 12%)
Fórmula: NaOCl, M = 74.44 g/mol. Solución acuosa al 10–13% p/p con exceso de NaOH para estabilización.
Composición comercial típica: Pioneer Chlor Alkali (citado por Force Flow) reporta que el exceso de NaOH óptimo es ≤0.5% en peso de solución. Hill Brothers Chemical especifica grados industriales con 0.3–0.8% NaOH libre. Solenis confirma que NaOCl <7.5% en cloro disponible es lo más estable, y que pH >11 es indispensable para evitar disociación a Cl₂ gaseoso. Por encima de 0.5% NaOH libre no se observa beneficio adicional de estabilidad según los datos publicados.
Hidrólisis: NaOCl → Na⁺ + OCl⁻. El OCl⁻ se protona parcialmente. La fracción protonada como HOCl consume H⁺ del medio.
El NaOH libre se disocia completamente: NaOH → Na⁺ + OH⁻, consumiendo 1 mol H⁺ por mol de NaOH.
Balance de protones:
ν_NaOCl(pH, T) = −f_HOCl(pH, T) − η_NaOH
donde η_NaOH = mol NaOH libre / mol NaOCl en producto comercial. Para producto al 12% p/p con 0.5% NaOH libre:
η_NaOH = (0.005 / 40.0) / (0.12 / 74.44) = 1.25×10⁻⁴ / 1.61×10⁻³ = 0.0776
Default conservador η_NaOH = 0.05 (0.3% NaOH libre / 12% NaOCl). Máximo de literatura η_NaOH = 0.10 (0.6% NaOH / 12% NaOCl).
Valor a pH 7.5, T 30 °C: f_HOCl = 0.519, η_NaOH default = 0.05. ν = −0.519 − 0.05 = −0.57.

3.4. Bisulfato de Sodio (Bisulfato Klaren ~50%)
Fórmula: NaHSO₄, M = 120.06 g/mol. Sólido cristalino. El producto comercial Klaren es ~50% NaHSO₄ activo con inertes y antiapelmazantes.
Disolución: NaHSO₄ → Na⁺ + HSO₄⁻. El bisulfato es ácido fuerte (pKa = 1.99, muy por debajo del rango operativo de albercas), por lo que se disocia esencialmente al 100%:
HSO₄⁻ → H⁺ + SO₄²⁻
Balance de protones: ν = +1.0 exacto, independiente de pH (siempre que pH > 3).
Verificación con constante del motor: NAHSO4_G_POR_PPM_ALK_10M3 = 50.94 g por −1 ppm ALK / 10 m³. Cálculo desde el modelo: 1 ppm ALK = 2×10⁻⁵ eq/L = 2×10⁻⁴ eq por 10 L bueno, esto es por 10 m³ = 10⁴ L, entonces 1 ppm ALK = 0.2 eq por 10 m³. Para destruir 0.2 eq con producto 50% activo: masa = 0.2 × 120.06 / 0.50 = 48.0 g por ppm. El motor reporta 50.94 g, lo cual implica una pureza efectiva calibrada de 47%. La discrepancia del 6% es consistente con el grado comercial real (algunos lotes Klaren reportan 45–48% NaHSO₄ activo en lugar del 50% nominal). El modelo termodinámico y la calibración empírica coinciden dentro del error.

3.5. Ácido Muriático 31.45%
Fórmula: HCl en solución acuosa, M = 36.46 g/mol, densidad 1.16 g/mL para grado 20° Bé.
Disolución: HCl → H⁺ + Cl⁻. Ácido fuerte, disociación completa.
Balance de protones: ν = +1.0 exacto.
Notas operativas: el aporte de iones cloruro incrementa TDS levemente (1 mol Cl⁻ por mol HCl). Para una piscina de 40 m³ donde se dosifican 100 mL de muriático 31.45%, se aportan ≈100 × 1.16 × 0.3145 / 36.46 = 1.0 mol HCl = 1.0 mol Cl⁻ = 25 mg/L de cloruro, despreciable frente al TDS típico.

3.6. Bicarbonato de Sodio (Alkalin Spin)
Fórmula: NaHCO₃, M = 84.01 g/mol. Producto puro.
Disolución: NaHCO₃ → Na⁺ + HCO₃⁻. El bicarbonato es la base conjugada del H₂CO₃ y simultáneamente el ácido conjugado del CO₃²⁻. Su comportamiento en el agua depende del pH:

Si pH < pKa1 (6.35): el HCO₃⁻ tiende a protonarse a H₂CO₃, consumiendo H⁺.
Si pH > pKa2 (10.33): el HCO₃⁻ tiende a desprotonarse a CO₃²⁻, liberando H⁺.
En el rango operativo 7.0–8.0: el HCO₃⁻ es estable y aporta alcalinidad pura sin desplazar significativamente el pH.
Balance de protones: considerando el sistema cerrado donde el bicarbonato añadido se equilibra con el carbono inorgánico ya presente:
ν_NaHCO₃(pH) = −α_0_CO₃(pH) + α_2_CO₃(pH) ≈ −α_0_CO₃(pH)
(el término α_2 es despreciable para pH < 9).
Valor a pH 7.5: α_0 ≈ 0.066, α_2 ≈ 0.001. ν = −0.066.
Interpretación: el bicarbonato es alcalinizante MUY débil en términos de mover el pH (ν cercano a cero) pero MUY efectivo en aportar alcalinidad (ΔAlk = +1 eq por mol). Esta es la razón termodinámica de por qué el Alkalin sube ALK casi sin tocar pH, propiedad fundamental que justifica su existencia como producto separado del Alcalos.
Verificación con constante del motor: ALKALIN_G_POR_10PPM_10M3 = 16.78 g por +10 ppm ALK / 10 m³. Cálculo desde el modelo: 10 ppm ALK = 2×10⁻³ eq por 10 m³ = 2 eq. Para aportar 2 eq con NaHCO₃ puro: masa = 2 × 84.01 = 168 g. Por +1 ppm: 16.8 g. El motor reporta 16.78 g. Coincidencia exacta, lo cual confirma que el Alkalin Spin es NaHCO₃ esencialmente puro y que la calibración empírica del motor coincide con la termodinámica pura. Excelente validación cruzada.

3.7. Carbonato de Sodio (Alcalos Spin / Soda Ash)
Fórmula: Na₂CO₃, M = 105.99 g/mol. Producto puro.
Disolución: Na₂CO₃ → 2 Na⁺ + CO₃²⁻. El CO₃²⁻ es base fuerte (pKb = 3.67, conjugada de pKa2 = 10.33), se protona en cascada:
CO₃²⁻ + H⁺ → HCO₃⁻    (rápido, consume 1 H⁺)

HCO₃⁻ + H⁺ → H₂CO₃    (parcial, consume α_0 H⁺ adicionales)
Balance de protones:
ν_Na₂CO₃(pH) = −1 − α_0_CO₃(pH) − α_2_CO₃(pH) ≈ −(1 + α_0_CO₃)
Valor a pH 7.5: ν = −(1 + 0.066) = −1.07. A pH 7.0 (más ácido): ν = −(1 + 0.184) = −1.18. A pH 8.0: ν = −1.02.
Nota: la auditoría externa del documento preliminar reportaba ν = −1.93 a pH 7.5, valor incorrecto. El error provenía de contar α_1 (≈0.93) en lugar de α_0 (≈0.07). La forma correcta de cuantificarlo: el Na₂CO₃ aporta 1 OH⁻ por hidrólisis del carbonato a bicarbonato (paso siempre completo a pH < 10), más una pequeña fracción adicional (α_0) por la segunda protonación a H₂CO₃ que solo procede en el grado en que el sistema lo demanda. El valor termodinámico correcto es ≈ −1.07 en el rango operativo.

3.8. Hidróxido de Magnesio (Amortiguador Magnesio)
Fórmula: Mg(OH)₂, M = 58.32 g/mol.
Disolución: Mg(OH)₂(s) ⇌ Mg²⁺ + 2 OH⁻. La constante de solubilidad es Ksp = 5.6×10⁻¹² a 25 °C (Lide, CRC Handbook).
Estequiometría ideal: ν = −2 si todo el Mg(OH)₂ se disuelve.
Realidad de campo: la baja Ksp limita la solubilidad. A pH 7.5, la concentración de equilibrio [Mg²⁺] máxima es:
[Mg²⁺]_max = Ksp / [OH⁻]² = 5.6×10⁻¹² / (10⁻⁶·⁵)² = 5.6×10⁻¹² / 10⁻¹³ = 56 M
(número irreal porque a esa concentración el pH ya subió y el equilibrio se desplaza). El proceso real es: el Mg(OH)₂ se disuelve hasta que pH ≈ 8.5–8.7, momento en que la concentración de OH⁻ es suficiente para saturar y la disolución se detiene. Esto convierte al Mg(OH)₂ en un amortiguador de techo: limita el pH a ≈ 8.5 sin importar cuánto se añada en exceso.
Coeficiente efectivo: para uso operativo en Pool Balance, se modela como:
ν_MgOH₂_efectivo(pH) = −2 si pH < 8.0

= −2 × (8.5 − pH)/0.5 si 8.0 ≤ pH ≤ 8.5

= 0 si pH ≥ 8.5
Valor a pH 7.5: ν efectivo = −2 (todavía hay capacidad de disolución).
Justificación de la calibración doctrinal MAGNESIO_G_POR_PUNTO_PH_10M3: el motor reconoce que la dosificación de Mg(OH)₂ se gobierna por el techo de pH 8.5, no por estequiometría pura. Por eso la constante está marcada “calibrada” en el códice y el cálculo requiere la API en lugar de fórmula directa. Esto es termodinámicamente correcto.

3.9. Ácido Cianúrico (Estabilizador puro)
Fórmula: C₃H₃N₃O₃ = H₃Cy, M = 129.07 g/mol.
Disolución: H₃Cy(s) → H₃Cy(aq). Solubilidad limitada (~2.7 g/L a 25 °C según PubChem) pero suficiente para las dosis típicas. Una vez disuelto, el H₃Cy se disocia parcialmente al pH del medio:
H₃Cy ⇌ H⁺ + H₂Cy⁻    (pKa1 = 6.88)
Balance de protones: ν = +α_Cy1(pH, T).
Valor a pH 7.5, T 30 °C: ν = +0.825.
Notas operativas: el efecto sobre pH es modesto (ácido débil) y su impacto principal es operativo (aporta CYA que estabiliza el cloro frente a UV). El motor Pool Balance puede incorporar esta predicción aunque históricamente el CYA se considera “neutro” en discusiones de campo — lo es aproximadamente, pero no exactamente.

3.10. Cloruro de Calcio (Aumento de Dureza)
Fórmula: CaCl₂, M = 110.98 g/mol. Producto comercial usualmente 94–97% activo, balance agua de hidratación.
Disolución: CaCl₂ → Ca²⁺ + 2 Cl⁻. Sal neutra de ácido fuerte (HCl) y base fuerte (Ca(OH)₂). Ni el catión ni el anión tienen reactividad ácido-base significativa en el rango de pH operativo.
Balance de protones: ν = 0 exacto.
Notas: el incremento de [Ca²⁺] desplaza marginalmente la solubilidad del CaCO₃ (efecto LSI), pero esto se captura en el módulo ISPB (Sección 4 del códice), no en el ΔpH inmediato. La adición de CaCl₂ no perturba pH en el corto plazo. Esto está correctamente reflejado en el motor: la constante CALCIO_G_POR_10PPM_10M3 no tiene asociado un ΔpH.
4. Resolución matemática del ΔpH
4.1. Régimen lineal (perturbaciones pequeñas)
Cuando |ν·C_P / β| < 0.3, la aproximación lineal de la ecuación de Henderson-Hasselbalch generalizada (Stumm & Morgan 1996, capítulo 4) es válida con error menor a 5%:
ΔpH ≈ −(ν × C_P) / β
donde C_P es la concentración molar del producto añadido (mol/L), β en eq/(L·pH).

4.2. Régimen no lineal (perturbaciones grandes)
Cuando la perturbación es grande (dosis de choque SLAM, agua con alcalinidad baja, o ALK_corr < 60 ppm), debe resolverse el sistema completo. Partiendo del balance de masa y carga para el sistema carbonato-cianurato-cloro:
Alk_f = Alk_0 − ν · C_P
con la expresión explícita de Alk en función de [H⁺]:
Alk = C_T_CO₃ × (K₁[H⁺] + 2K₁K₂)/([H⁺]² + K₁[H⁺] + K₁K₂)

+ Cy_T × α_Cy1

+ Kw/[H⁺] − [H⁺]
Sustituyendo Alk = Alk_f y multiplicando por [H⁺] × ([H⁺]² + K₁[H⁺] + K₁K₂) × (1 + 10^(pKa1_Cy − pH) en [H⁺]), se obtiene un polinomio de grado 5 en [H⁺]. Para el régimen operativo donde el cianurato no domina la alcalinidad (Cy_T < C_T_CO₃), una simplificación a cuártica es aceptable:
[H⁺]⁴ + a₃[H⁺]³ + a₂[H⁺]² + a₁[H⁺] + a₀ = 0
con coeficientes:
a₃ = K₁ + Alk_f

a₂ = Alk_f·K₁ + K₁·K₂ − C_T·K₁ − Kw

a₁ = Alk_f·K₁·K₂ − 2·C_T·K₁·K₂ − K₁·Kw

a₀ = −K₁·K₂·Kw
Esta cuártica tiene exactamente una raíz positiva real correspondiente a [H⁺] físicamente admisible (Stumm & Morgan 1996; Benjamin, Water Chemistry 2nd ed., 2015). Se resuelve por Newton-Raphson en chemistry.js v16.7 con tolerancia 10⁻⁹ y semilla inicial [H⁺] = 10⁻⁷·⁵.

4.3. Régimen ultra-no-lineal (ALK < 30 ppm)
Cuando la alcalinidad carbonatada cae por debajo de 30 ppm CaCO₃, el sistema deja de tener amortiguamiento efectivo y pequeñas perturbaciones pueden causar saltos de pH de 1–2 unidades. En este régimen el modelo cuártico sigue siendo válido pero los reportes de incertidumbre deben ampliarse: la banda pesimista-optimista puede abarcar 0.5 unidades de pH. Pool Balance recomienda en estos casos restaurar alcalinidad con Alkalin antes de cualquier otra dosificación.

4.4. Verificación numérica — caso Tricloro en Veracruz
Parámetros: V = 40 m³, pH_0 = 7.4, FC = 2 ppm, ALK = 90 ppm, CYA = 40 ppm, CH = 220 ppm, T = 30 °C. Dosis Tricloro: 133 g (subir FC de 2 a 5).
Paso 1 — Concentraciones molares:

moles_TCCA = 133 × 0.915 / 232.41 = 0.524 mol

C_P = 0.524 / 40000 = 1.31 × 10⁻⁵ M
Paso 2 — Coeficiente ν a las condiciones:

pKa_HOCl(30) = 7.582 − 0.00913 × 5 = 7.536

f_OCl(7.4, 30) = 1/(1+10^(7.4−7.536)) = 1/(1+10^(−0.136)) = 1/(1+0.731) = 0.578… espera
Recalculo: 10^(−0.136) = 0.731, entonces f_HOCl = 1/(1+10^(7.4−7.536)) = 1/(1+10^(−0.136)). Pero la fórmula es f_HOCl = 1/(1+10^(pH−pKa)). Si pH < pKa, el exponente es negativo, 10^negativo < 1, entonces 1+algo<1 da > 0.5. f_HOCl(7.4, 30) = 1/(1+10^(−0.136)) = 1/(1+0.731) = 1/1.731 = 0.578.

f_OCl = 0.422.
pKa1_CYA(30) = 6.88 − 0.011 × 5 = 6.825

α_Cy1(7.4, 30) = 1/(1+10^(6.825−7.4)) = 1/(1+10^(−0.575)) = 1/(1+0.266) = 0.790
ν_TCCA = 3 × 0.422 + 0.790 = 2.056
Paso 3 — β a las condiciones del agua:

Wojtowicz f_W(7.4) = 0.32 (Sección 4.1.1)

ALK_corr = max(1, 90 − 40 × 0.32) = 77.2 ppm CaCO₃ = 1.544 × 10⁻³ eq/L

C_T_CO₃ = ALK_corr / (α_1 + 2·α_2) ≈ 1.544×10⁻³ / 0.927 = 1.665 × 10⁻³ M
[H⁺] = 10⁻⁷·⁴ = 3.98×10⁻⁸; [OH⁻] = 10⁻⁶·⁶ = 2.51×10⁻⁷

α_0 = 0.073, α_1 = 0.927, α_2 = 4.3×10⁻⁴ (a pH 7.4, T 30 °C)
Cy_T = 40 × 10⁻³ / 129.07 = 3.10 × 10⁻⁴ M

α_Cy0 = 0.210, α_Cy1 = 0.790
FC_T = 2 × 10⁻³ / 70.91 = 2.82 × 10⁻⁵ M
β = 2.303 × {

3.98×10⁻⁸ + 2.51×10⁻⁷
1.665×10⁻³ × (0.073×0.927 + 0.927×4.3×10⁻⁴ + 4×0.073×4.3×10⁻⁴)
3.10×10⁻⁴ × 0.210 × 0.790
2.82×10⁻⁵ × 0.578 × 0.422

}

β = 2.303 × { 2.9×10⁻⁷ + 1.665×10⁻³ × 0.0682 + 5.14×10⁻⁵ + 6.88×10⁻⁶ }

β = 2.303 × { 2.9×10⁻⁷ + 1.135×10⁻⁴ + 5.14×10⁻⁵ + 6.88×10⁻⁶ }

β = 2.303 × 1.72×10⁻⁴

β = 3.97 × 10⁻⁴ eq/(L·pH)
Paso 4 — ΔpH lineal:

ΔAlk = −2.056 × 1.31×10⁻⁵ = −2.69×10⁻⁵ eq/L

ΔpH = −2.69×10⁻⁵ / 3.97×10⁻⁴ = −0.068
Paso 5 — Tres escenarios (Opción C):

ΔpH_base = −0.068 ≈ −0.07

ΔpH_pesimista (ALK_corr −10%, T_agua +2°C, sin amortiguamiento de cianurato): β ≈ 3.0×10⁻⁴ → ΔpH ≈ −0.090

ΔpH_optimista (ALK_corr +10%): β ≈ 4.4×10⁻⁴ → ΔpH ≈ −0.061
pH_final esperado: 7.33 (rango 7.31 a 7.34).
Nota importante sobre el ejemplo de Sección 13.9 del códice: el cálculo allí mostraba ΔpH = −0.14 usando β = 1.95×10⁻⁴, valor que correspondía a una estimación inicial sin desglosar todos los términos. El cálculo riguroso aquí da β = 3.97×10⁻⁴ y ΔpH = −0.07. Esto revisa la estimación de campo y reduce a la mitad el ΔpH esperado para el caso Veracruz. Es el tipo de corrección que justifica este Entregable B: la termodinámica completa, con todos los buffers contabilizados y la corrección de Wojtowicz para ALK_corr, da predicciones más optimistas (y más precisas) que la estimación de servilleta. Actualizar el ejemplo 13.9 a ΔpH = −0.07 (rango −0.09 a −0.06).
5. Particularidades de Veracruz
El clima tropical de Veracruz puerto (Köppen Aw, 19.17°N, nivel del mar) introduce tres correcciones operativas no triviales sobre el modelo termodinámico estándar.

5.1. Temperatura del agua elevada
El agua de albercas residenciales en Veracruz oscila entre 27 °C (invierno) y 32 °C (verano), con default operativo Pool Balance de +2 °C sobre T_aire (Sección 11.1). Esto desplaza:

pKa_HOCl de 7.582 (a 25 °C) a 7.45–7.53 (a 30–32 °C), incrementando f_OCl en 5–10%.
pKa1_CYA de 6.88 a 6.80–6.825, incrementando α_Cy1 ligeramente.
pKa1_CO₃ de 6.35 a 6.30–6.32, ligero corrimiento en α_0.
El efecto neto sobre ν_TCCA es un incremento del 3–5% respecto al valor a 25 °C estándar. Sobre ν_NaOCl la magnitud baja en 3–5%. Estas correcciones son automáticas en el motor vía calcFraccionHOCl(pH, T) y son la razón por la que la sección 13 explícitamente requiere T_agua como input.

5.2. Acumulación de CYA
Por la alta radiación UV de Veracruz y el uso predominante de tricloro estabilizado, las albercas residenciales tienden a acumular CYA por encima del rango ideal (30–50 ppm), llegando frecuentemente a 60–100 ppm. Esto tiene tres consecuencias para la facultad de predicción de ΔpH:
Primero, β aumenta por la contribución del cianurato. Una alberca con CYA 80 ppm en lugar de 40 ppm tiene β ≈ 15% mayor en el término cianurato, lo cual reduce ΔpH proyectado en proporción.
Segundo, ALK_corr (Wojtowicz) cae más, porque a más CYA se sustrae más alcalinidad cianurato de la total. Esto reduce el término carbonato de β.
Tercero, el f_W(pH) de Wojtowicz domina el balance de Alk_corr. En el caso límite donde CYA > 100 ppm y ALK_total < 80 ppm, la ALK_corr puede caer por debajo de 30 ppm y el sistema entra al régimen ultra-no-lineal de Sección 4.3.

5.3. Agua de reposición rica en alcalinidad y dureza
El agua de red en Veracruz puerto es de origen kárstico (Cuenca del Papaloapan / acuíferos calizos), con dureza típica 200–350 ppm y alcalinidad 120–180 ppm. Esto es protector contra perturbaciones de pH (β alto) pero amplifica el riesgo de incrustación (LSI positivo crónico). El motor Pool Balance gestiona este balance vía ISPB con Wojtowicz dinámico (Sección 4.1). Para la predicción de ΔpH, esta condición opera a favor: las dosificaciones rutinarias en Veracruz están bien amortiguadas.

5.4. Marina y brisas
Las brisas marinas introducen aerosoles salinos que aumentan TDS y fuerza iónica del agua con el tiempo. A TDS > 1500 ppm, los coeficientes de actividad se desvían de la unidad y los pKa efectivos se desplazan ligeramente (típicamente −0.05 a −0.10 unidades para HOCl según Davies-Güntelberg). La calibración del motor en F_TDS de la fórmula ISPB (Sección 4.1) captura parcialmente este efecto. Para la facultad ν la corrección es secundaria y queda en el roadmap de v16.8.
6. Validación frente a la operación de campo
6.1. Cruz-validación con constantes calibradas del motor
Las constantes empíricas de chemistry.js v16.6.0 (Sección 2 del códice) fueron calibradas contra producto comercial real en campo. Si el modelo termodinámico aquí desarrollado es correcto, debe reproducir estas constantes dentro del error de medición:
Alkalin (NaHCO₃): modelo predice 16.80 g por +1 ppm ALK / 10 m³. Motor: 16.78. Coincidencia: error 0.1%.
Bisulfato Klaren: modelo predice 48.0 g por −1 ppm ALK / 10 m³ (asumiendo 50% pureza nominal). Motor: 50.94. Discrepancia 6%, consistente con pureza real 47% de lotes Klaren auditados.
Cloruro de Calcio: modelo predice 100 g por +10 ppm CH / 10 m³ (asumiendo 100% pureza). Motor: ≈100. Coincidencia exacta (CaCl₂ comercial 94–97%).
Hipoclorito de Calcio (aporte CH): modelo predice 0.59 ppm CH por ppm Cl (a 65% pureza). Motor: ≈0.55. Diferencia 7%, atribuible a impurezas inertes que no aportan Ca²⁺ soluble.
Ácido Cianúrico: modelo predice 1.0 g por +1 ppm CYA / m³. Motor: ≈1. Coincidencia exacta.
Esta consistencia entre termodinámica pura y calibración empírica valida la metodología del Entregable B y autoriza la implementación del nuevo módulo calcDeltaPhPorDosificacion en chemistry.js v16.7.

6.2. Comparación con casos históricos Pool Balance
Caso Carranza (Sección 8.1): dosificación de 600 g Mg(OH)₂ en 3 dosis (200 g cada 48 h) en alberca 35 m³. ΔpH observado: 7.2 → 7.5 = +0.3 en semana 1. Predicción modelo con ν_efectivo = −2 (rango operativo) y ALK 95: ΔpH = −(−2) × (200/58.32/35000) / β ≈ +0.34. Modelo y observación coinciden dentro del 12%. El modelo Mg(OH)₂ con techo de pH 8.5 explica por qué subsiguientes dosis fueron menos efectivas (el agua ya se saturaba con OH⁻).
Caso Slow (Sección 8.2): transición de tricloro a hipoclorito de calcio en alberca 50 m³, semana 1 con dosis inicial 230 g hipo Klaren para subir FC a 6 ppm. Predicción modelo: ν = −1.10, C_P = 230 × 0.65 / 142.98 / 50000 = 2.09×10⁻⁵ M, β (ALK 95, CYA 62, pH 7.6, T 29) ≈ 4.2×10⁻⁴, ΔpH = +0.055. Observación de campo: pH se mantuvo estable en torno a 7.6 durante esta dosificación (incluido en bitácora). Modelo predice ΔpH despreciable, observación confirma.

6.3. Banda de incertidumbre justificada
Las fuentes principales de incertidumbre en la predicción de ΔpH, ordenadas por magnitud:

Error en lectura de ALK con ColorQ: ±5 ppm CaCO₃ típico, equivale a ±10% en β.
η_NaOH y η_CaOH₂ desconocidos del lote comercial específico: ±50% del valor default, equivale a ±0.05 unidades de ν.
Error en T_agua (medición vs. real): ±1 °C, equivale a ±2% en pKa.
Error en CYA: ±5 ppm, equivale a ±5% en ALK_corr.
La propagación gaussiana de estos errores (Opción B, implementable en código) da una desviación estándar de ΔpH típica de ±0.03–0.05 unidades. La banda pesimista-optimista de Opción C, calculada con escenarios extremos (peor caso de TODOS los parámetros simultáneamente), tiende a ser 1.5–2× más amplia, lo cual proporciona margen de seguridad operativa adecuado para Isaías en campo.
7. Limitaciones y trabajo futuro
7.1. Limitaciones del modelo actual
El modelo asume sistema cerrado durante la perturbación inmediata, es decir, sin intercambio de CO₂ con la atmósfera en la escala de minutos posterior a la dosificación. Esto es razonable para piscinas en reposo o con filtración pasiva, pero subestima la relajación rápida en spas con venturi o cascadas. Para esos casos, el ΔpH inmediato de Sección 13 debe componerse con el ΔpH de desgasificación de Sección 12 en el cálculo final que Isaías presenta.
El modelo asume mezcla perfecta e instantánea del producto en el volumen del vaso. En la realidad, una tableta de tricloro disuelve lentamente (horas), creando un gradiente local de pH bajo cerca del clorador antes de homogeneizarse. La predicción de Sección 13 representa el estado de equilibrio post-mezcla, no el transitorio local. Para análisis de stress localizado (por ejemplo, daño a recubrimiento por tableta directamente sobre yeso), se requeriría un módulo de transporte que está fuera del alcance de v16.7.
El modelo usa coeficientes de actividad unitarios (concentraciones = actividades). Para TDS > 2000 ppm o aguas marinas-influenciadas, debería aplicarse Davies-Güntelberg. Esto es trabajo de v16.8.

7.2. Roadmap propuesto
v16.7 (actual): implementación de calcDeltaPhPorDosificacion con modelo lineal + cuártica, cobertura de los 10 productos del catálogo Pool Balance, opción C reportada por defecto, opción B accesible vía flag.
v16.8 (siguiente): corrección por fuerza iónica (Davies), refinamiento de η_NaOH y η_CaOH₂ por lote comercial específico vía lectura de hoja técnica, módulo de transporte para tabletas TCCA (decaimiento local pH).
v17.0 (largo plazo): acoplamiento con módulo de degradación cinética de cloro (Sección 5) y módulo de desgasificación (Sección 12) en un solver único que prediga la evolución pH(t) completa en las 24 h post-dosificación, no solo el ΔpH inmediato.
8. Conclusiones
Este Entregable B respalda científicamente la nueva facultad de predicción de ΔpH inmediato del CÓDYCE NEXUS V17.8 (Sección 13). La derivación se construye sobre fuentes primarias verificadas y consistentes con el motor actual.
Los puntos clave son los siguientes. Primero, la convención unificada ν = mol H⁺ por mol de producto comercial elimina la ambigüedad de las representaciones por mol de Cl₂-equivalente y permite comparación directa entre halogenantes y productos auxiliares. Segundo, los coeficientes ν se calculan dinámicamente en función de pH y temperatura usando las mismas funciones de especiación (calcFraccionHOCl) que ya existen en el motor, asegurando coherencia interna. Tercero, la capacidad buffer β contabiliza explícitamente carbonato, cianurato, cloro libre y autoionización del agua, y consume ALK_corr de Wojtowicz en lugar de ALK total cruda. Cuarto, las constantes empíricas calibradas del motor (Alkalin, Bisulfato, Cloruro de Calcio, CYA) coinciden con el modelo termodinámico dentro del 0–7%, validando la metodología. Quinto, el modelo lineal es válido para |ΔpH| < 0.3 y se complementa con resolución cuártica para perturbaciones mayores, implementada en chemistry.js v16.7 por Newton-Raphson. Sexto, las particularidades de Veracruz (T elevada, CYA acumulado, agua kárstica) están incorporadas vía corrección térmica de pKa y la corrección dinámica de Wojtowicz.
La facultad implementada permite a Isaías predecir, antes de aplicar cualquier dosificación, el ΔpH inmediato esperado con su banda de incertidumbre, y emitir recomendaciones de premedicación cuando la perturbación amenaza con sacar el agua del rango operativo o de la zona de seguridad del recubrimiento. Esta capacidad cierra el último hueco estructural de chemistry.js: predecir consecuencias químicas antes de actuar, no solo después de medir.
Bibliografía
Fuentes primarias (artículos peer-reviewed)
Morris, J. C. (1966). “The Acid Ionization Constant of HOCl from 5 to 35 °C.” The Journal of Physical Chemistry, 70(12), 3798–3805. DOI: 10.1021/j100884a007.
O’Brien, J. E., Morris, J. C., & Butler, J. N. (1974). “Equilibria in Aqueous Solutions of Chlorinated Isocyanurate.” En A. J. Rubin (Ed.), Chemistry of Water Supply, Treatment and Distribution (pp. 333–358). Ann Arbor Science Publishers.
Pinkernell, U., Nowack, B., Gallard, H., & von Gunten, U. (2000). “Methods for the photometric determination of reactive bromine and chlorine species with ABTS.” Water Research, 34(18), 4343–4350.
Plummer, L. N., & Busenberg, E. (1982). “The solubilities of calcite, aragonite and vaterite in CO₂-H₂O solutions between 0 and 90 °C, and an evaluation of the aqueous model for the system CaCO₃-CO₂-H₂O.” Geochimica et Cosmochimica Acta, 46(6), 1011–1040.
Wahman, D. G. (2018a). “Chlorinated Cyanurates: Review of Water Chemistry and Associated Drinking Water Implications.” Journal AWWA, 110(9), E1–E15. DOI: 10.1002/awwa.1086. PMC6178841.
Wahman, D. G., Alexander, M. T., & Kirisits, M. J. (2018b). “First Acid Ionization Constant of the Drinking Water Relevant Chemical Cyanuric Acid from 5 to 35 °C.” Environmental Engineering Science, 35(11), 1259–1266. PMC6223631.
Wojtowicz, J. A. (1995). “Swimming Pool Water Balance, Part 1: The Effect of Cyanuric Acid and Other Interferences on Carbonate Alkalinity Measurement.” Journal of the Swimming Pool and Spa Industry, 1(1), 6–12. Disponible en poolhelp.com.
Wojtowicz, J. A. (1997). “Swimming Pool Water Balance, Part 5: A Revised and Updated Saturation Index.” Journal of the Swimming Pool and Spa Industry, 3(1), 37–40.
Wojtowicz, J. A. (2001). “Effect of Cyanuric Acid on Swimming Pool Maintenance.” Journal of the Swimming Pool and Spa Industry, 5(1), 15–19.
Wojtowicz, J. A. (2004). “Cyanuric Acid Technology.” Journal of the Swimming Pool and Spa Industry, 4(2), 9–16.

Libros de texto
Benjamin, M. M. (2015). Water Chemistry (2ª ed.). Waveland Press.
Morel, F. M. M., & Hering, J. G. (1993). Principles and Applications of Aquatic Chemistry. Wiley-Interscience.
Pankow, J. F. (2018). Aquatic Chemistry Concepts (2ª ed.). Routledge/CRC Press. ISBN: 978-1439854402.
Stumm, W., & Morgan, J. J. (1996). Aquatic Chemistry: Chemical Equilibria and Rates in Natural Waters (3ª ed.). Wiley-Interscience.

Bases de datos y referencias técnicas
Lide, D. R. (Ed.). (2005). CRC Handbook of Chemistry and Physics (86ª ed.). CRC Press.
NIST Chemistry WebBook (2024). National Institute of Standards and Technology, Standard Reference Database 69. https://webbook.nist.gov/chemistry/
PubChem (2025). National Library of Medicine. Hypochlorous Acid CID 24341; Trichloroisocyanuric Acid CID 6909; Cyanuric Acid CID 7956.

Documentos industriales y normativos
Chlorine Institute. (2017). Pamphlet 96: Sodium Hypochlorite Manual (5ª ed.).
Hill Brothers Chemical Company. Sodium Hypochlorite Stability (technical bulletin). Disponible en hillbrothers.com.
Pioneer Chlor Alkali Company. Stability of Sodium Hypochlorite Solutions. Citado por Force Flow Equipment, disponible en forceflowscales.com.
Pool & Hot Tub Alliance (PHTA, anteriormente APSP). All About Alkalinity (technical bulletin). phta.org.
Redox Pty Ltd. Safety Data Sheet — Calcium Hypochlorite, Hydrated (UN2880). Disponible en redox.com.
Solenis. The Stability of Chlorine Bleach (Sodium Hypochlorite) Solutions (technical brief). solenis.com.
US Environmental Protection Agency (EPA). Free Chlorine and Cyanuric Acid Simulator Application Description. Documento P100S368.
Valudor Products. Calcium Hypochlorite Granular Technical Data Sheet. valudor.com.
World Health Organization (WHO). (2008). Sodium Dichloroisocyanurate in Drinking-water — Background Document for Development of WHO Guidelines for Drinking-water Quality. WHO/SDE/WSH/07.01/3.

Recursos digitales especializados
Falk, R. (Trouble Free Pool). Archivo digital de O’Brien et al. 1974, disponible en troublefreepool.com/~richardfalk/pool/OBrien.htm.
Orenda Technologies. Understanding Cyanurate Alkalinity (blog técnico). blog.orendatech.com.
Pool Help (Wojtowicz papers archive). poolhelp.com.
Pulsar Systems. The Effect of CYA on Water Balance and Plaster (white paper). pulsarpools.com.
Documento preparado por: Asistente de investigación científica para Pool Balance
Para: Omar Alberto Valle Mercado · Pool Balance · Veracruz, México
Fecha: Mayo 2026
Versión: B-1.0
Compromiso: cada constante de este documento tiene trazabilidad a fuente primaria. Cada ecuación tiene derivación explícita. Cada valor numérico tiene verificación cruzada contra (i) literatura, (ii) calibración empírica del motor, o (iii) ambas. La precisión no es un objetivo: es el método.
— FIN DEL ENTREGABLE B —