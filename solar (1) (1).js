/**
 * ═══════════════════════════════════════════════════════════════
 * POOL BALANCE V16.3 — js/solar.js
 * Módulo de Cálculo Solar y Factor de Sombra Efectivo
 * ═══════════════════════════════════════════════════════════════
 *
 * PROPÓSITO:
 *   Calcular la posición del sol (elevación y azimut) para cualquier
 *   latitud, longitud, fecha y hora, y determinar qué fracción de la
 *   superficie de la alberca está sombreada por bardas y árboles
 *   circundantes. Produce un factor UV efectivo (0–1) que multiplica
 *   el UVI crudo de clima.js antes de alimentar la degradación de cloro
 *   en chemistry.js.
 *
 * ECUACIONES SOLARES:
 *   Basadas en "General Solar Position Calculations" de NOAA Global
 *   Monitoring Division (https://gml.noaa.gov/grad/solcalc/solareqns.PDF)
 *   y en "Astronomical Algorithms" de Jean Meeus.
 *
 * PROYECCIÓN DE SOMBRAS:
 *   Longitud de sombra = altura / tan(elevación solar).
 *   Dirección de sombra = azimut solar + 180° (la sombra cae opuesta al sol).
 *   Fracción sombreada = área de sombra proyectada sobre la alberca / área total.
 *
 * INTEGRACIÓN:
 *   Engine.js llama a Solar.calcFactorSombraEfectivo() pasando el expediente
 *   de la alberca y la fecha/hora. El resultado (0–1) multiplica al UVI.
 *   Factor 1.0 = sol pleno. Factor 0.0 = sombra total.
 *
 * @author Omar Alberto Valle Mercado | VAMO870509HW3
 * @version 16.3
 * @depends Ninguna dependencia externa. Módulo autocontenido.
 */

'use strict';

const Solar = (function () {

  const VERSION = '16.3';
  const DEG2RAD = Math.PI / 180;
  const RAD2DEG = 180 / Math.PI;

  // ═══════════════════════════════════════════════════════════
  //  SECCIÓN 1: POSICIÓN SOLAR (Ecuaciones NOAA)
  // ═══════════════════════════════════════════════════════════

  /**
   * Calcula el año fraccional γ (gamma) en radianes.
   * @param {Date} fecha - Objeto Date con fecha y hora local.
   * @returns {number} Año fraccional en radianes.
   */
  function _anioFraccional(fecha) {
    const inicio = new Date(fecha.getFullYear(), 0, 1);
    const diaDelAnio = Math.floor((fecha - inicio) / 86400000) + 1;
    const hora = fecha.getHours() + fecha.getMinutes() / 60;
    const diasEnAnio = _esBisiesto(fecha.getFullYear()) ? 366 : 365;
    return (2 * Math.PI / diasEnAnio) * (diaDelAnio - 1 + (hora - 12) / 24);
  }

  function _esBisiesto(anio) {
    return (anio % 4 === 0 && anio % 100 !== 0) || (anio % 400 === 0);
  }

  /**
   * Ecuación del tiempo en minutos (NOAA).
   * Compensa la diferencia entre tiempo solar verdadero y tiempo medio.
   * @param {number} gamma - Año fraccional en radianes.
   * @returns {number} Ecuación del tiempo en minutos.
   */
  function _ecuacionDelTiempo(gamma) {
    return 229.18 * (
      0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma)
    );
  }

  /**
   * Declinación solar en radianes (NOAA).
   * Ángulo entre los rayos del sol y el plano ecuatorial.
   * @param {number} gamma - Año fraccional en radianes.
   * @returns {number} Declinación en radianes.
   */
  function _declinacionSolar(gamma) {
    return 0.006918 -
      0.399912 * Math.cos(gamma) +
      0.070257 * Math.sin(gamma) -
      0.006758 * Math.cos(2 * gamma) +
      0.000907 * Math.sin(2 * gamma) -
      0.002697 * Math.cos(3 * gamma) +
      0.00148 * Math.sin(3 * gamma);
  }

  /**
   * Calcula elevación y azimut solar para una ubicación y momento dados.
   *
   * @param {number} lat - Latitud en grados (positivo = norte).
   * @param {number} lng - Longitud en grados (positivo = este).
   * @param {Date} fecha - Objeto Date (hora local).
   * @param {number} [zonaHoraria] - Offset UTC en horas (ej: -6 para CST).
   *                                  Si no se provee, se infiere del Date.
   * @returns {Object} { elevacion, azimut, esSolVisible }
   *   - elevacion: grados sobre el horizonte (negativo = bajo el horizonte).
   *   - azimut: grados desde el norte, en sentido horario (0=N, 90=E, 180=S, 270=O).
   *   - esSolVisible: boolean, true si elevación > 0.
   */
  function calcPosicionSolar(lat, lng, fecha, zonaHoraria) {
    if (zonaHoraria === undefined || zonaHoraria === null) {
      zonaHoraria = -fecha.getTimezoneOffset() / 60;
    }

    const gamma = _anioFraccional(fecha);
    const eqtime = _ecuacionDelTiempo(gamma);
    const decl = _declinacionSolar(gamma);

    // Offset de tiempo en minutos
    const timeOffset = eqtime + 4 * lng - 60 * zonaHoraria;

    // Tiempo solar verdadero en minutos desde medianoche
    const hr = fecha.getHours();
    const mn = fecha.getMinutes();
    const sc = fecha.getSeconds();
    const tst = hr * 60 + mn + sc / 60 + timeOffset;

    // Ángulo horario en grados
    const ha = (tst / 4) - 180;
    const haRad = ha * DEG2RAD;

    // Ángulo cenital solar
    const latRad = lat * DEG2RAD;
    const cosZenith = Math.sin(latRad) * Math.sin(decl) +
                      Math.cos(latRad) * Math.cos(decl) * Math.cos(haRad);
    const zenithRad = Math.acos(Math.max(-1, Math.min(1, cosZenith)));
    const zenith = zenithRad * RAD2DEG;

    // Elevación = 90 - zenith
    const elevacion = 90 - zenith;

    // Azimut solar (grados desde el norte, sentido horario)
    let azimut;
    const sinZenith = Math.sin(zenithRad);
    if (Math.abs(sinZenith) < 0.0001) {
      // Sol en el cenit o nadir, azimut indefinido
      azimut = 180;
    } else {
      const cosAzimuth = (Math.sin(latRad) * cosZenith - Math.sin(decl)) /
                          (Math.cos(latRad) * sinZenith);
      const azimuthRad = Math.acos(Math.max(-1, Math.min(1, cosAzimuth)));
      azimut = azimuthRad * RAD2DEG;

      // Corregir cuadrante: si el ángulo horario es positivo (tarde), azimut > 180
      if (ha > 0) {
        azimut = 360 - azimut;
      }
    }

    return {
      elevacion: parseFloat(elevacion.toFixed(2)),
      azimut: parseFloat(azimut.toFixed(2)),
      esSolVisible: elevacion > 0
    };
  }

  // ═══════════════════════════════════════════════════════════
  //  SECCIÓN 2: PROYECCIÓN DE SOMBRAS
  // ═══════════════════════════════════════════════════════════

  /**
   * Calcula la longitud de sombra proyectada por un objeto vertical.
   * Fórmula: longitud = altura / tan(elevación solar).
   *
   * @param {number} alturaMetros - Altura del objeto en metros.
   * @param {number} elevacionSolarGrados - Elevación solar en grados.
   * @returns {number} Longitud de la sombra en metros (0 si sol bajo horizonte).
   */
  function _longitudSombra(alturaMetros, elevacionSolarGrados) {
    if (elevacionSolarGrados <= 0 || alturaMetros <= 0) return Infinity;
    if (elevacionSolarGrados >= 89.99) return 0; // Sol en el cenit
    return alturaMetros / Math.tan(elevacionSolarGrados * DEG2RAD);
  }

  /**
   * Calcula qué fracción del ancho de la alberca es cubierta por la sombra
   * de una barda en un lado dado.
   *
   * Modelo simplificado:
   * - La alberca es rectangular con dimensiones largo × ancho.
   * - Las bardas están en los 4 lados cardinales (N, S, E, O).
   * - La orientación de la alberca (ángulo del eje largo respecto al norte)
   *   se usa para rotar el azimut solar al marco de referencia de la alberca.
   *
   * @param {Object} barda - { altura: m, distancia: m, lado: 'N'|'S'|'E'|'O' }
   * @param {number} largoAlberca - Largo de la alberca en metros (eje principal).
   * @param {number} anchoAlberca - Ancho de la alberca en metros.
   * @param {number} elevacionSolar - Elevación solar en grados.
   * @param {number} azimutSolar - Azimut solar en grados (desde norte, horario).
   * @param {number} orientacionAlberca - Ángulo del eje largo respecto al norte en grados.
   * @returns {number} Fracción de la alberca sombreada por esta barda (0–1).
   */
  function _fraccionSombraBarda(barda, largoAlberca, anchoAlberca, elevacionSolar, azimutSolar, orientacionAlberca) {
    if (!barda || !barda.altura || barda.altura <= 0) return 0;
    if (elevacionSolar <= 0) return 1; // Noche: todo sombreado (irrelevante para UV)

    const alturaEfectiva = barda.altura;
    const distancia = barda.distancia || 0;
    const lado = (barda.lado || '').toUpperCase();

    // Longitud total de sombra desde la base de la barda
    const sombraTotal = _longitudSombra(alturaEfectiva, elevacionSolar);
    if (sombraTotal === Infinity) return 1;
    if (sombraTotal === 0) return 0;

    // Dirección de la sombra (opuesta al sol)
    const dirSombra = (azimutSolar + 180) % 360;

    // Rotar al marco de referencia de la alberca
    // En el marco de la alberca: 0° = eje largo (Norte rotado), 90° = eje corto
    const dirRelativa = ((dirSombra - orientacionAlberca) % 360 + 360) % 360;

    // Determinar si la sombra de esta barda cae HACIA la alberca
    // La barda Norte proyecta sombra útil cuando la dirección relativa de sombra
    // apunta hacia el sur (hacia la alberca), es decir, componente perpendicular positiva.

    let componentePerpendicular = 0; // Penetración de sombra hacia el interior
    let componenteParalela = 0;       // Extensión lateral de la sombra

    // Ángulo relativo de la sombra respecto a la perpendicular de cada barda
    // en el marco de la alberca
    switch (lado) {
      case 'N': {
        // Barda al norte: sombra cae hacia el sur (dirRelativa ~180°)
        componentePerpendicular = sombraTotal * Math.cos((dirRelativa - 180) * DEG2RAD);
        componenteParalela = Math.abs(sombraTotal * Math.sin((dirRelativa - 180) * DEG2RAD));
        break;
      }
      case 'S': {
        // Barda al sur: sombra cae hacia el norte (dirRelativa ~0° o ~360°)
        componentePerpendicular = sombraTotal * Math.cos(dirRelativa * DEG2RAD);
        componenteParalela = Math.abs(sombraTotal * Math.sin(dirRelativa * DEG2RAD));
        break;
      }
      case 'E': {
        // Barda al este: sombra cae hacia el oeste (dirRelativa ~270°)
        componentePerpendicular = sombraTotal * Math.cos((dirRelativa - 270) * DEG2RAD);
        componenteParalela = Math.abs(sombraTotal * Math.sin((dirRelativa - 270) * DEG2RAD));
        break;
      }
      case 'O':
      case 'W': {
        // Barda al oeste: sombra cae hacia el este (dirRelativa ~90°)
        componentePerpendicular = sombraTotal * Math.cos((dirRelativa - 90) * DEG2RAD);
        componenteParalela = Math.abs(sombraTotal * Math.sin((dirRelativa - 90) * DEG2RAD));
        break;
      }
      default:
        return 0;
    }

    // Si la componente perpendicular es negativa, la sombra va LEJOS de la alberca
    if (componentePerpendicular <= 0) return 0;

    // Penetración de la sombra dentro de la alberca
    const penetracion = Math.max(0, componentePerpendicular - distancia);
    if (penetracion <= 0) return 0;

    // Dimensiones relevantes según la orientación de la barda
    let dimensionPerpendicular, dimensionParalela;
    if (lado === 'N' || lado === 'S') {
      dimensionPerpendicular = anchoAlberca; // La sombra cruza el ancho
      dimensionParalela = largoAlberca;
    } else {
      dimensionPerpendicular = largoAlberca; // La sombra cruza el largo
      dimensionParalela = anchoAlberca;
    }

    // Fracción de penetración (qué porcentaje del ancho cruza la sombra)
    const fraccionPerp = Math.min(1, penetracion / dimensionPerpendicular);

    // Fracción lateral (la sombra de una barda cubre todo su largo por definición,
    // pero puede extenderse oblicuamente)
    // Como la barda es continua a lo largo de su lado, la cobertura lateral es ~1.0
    // a menos que la barda sea más corta que la alberca (no modelamos eso aquí).
    const fraccionParalela = 1.0;

    return parseFloat((fraccionPerp * fraccionParalela).toFixed(4));
  }

  /**
   * Calcula la fracción de sombra de un árbol sobre la alberca.
   * Modelo: el árbol se modela como un punto que proyecta sombra circular
   * (cono invertido) sobre la superficie.
   *
   * @param {Object} arbol - { altura: m, distancia: m, azimut_desde_alberca: grados, radio_copa: m }
   * @param {number} largoAlberca - Largo en metros.
   * @param {number} anchoAlberca - Ancho en metros.
   * @param {number} elevacionSolar - Grados.
   * @param {number} azimutSolar - Grados desde norte.
   * @returns {number} Fracción sombreada (0–1).
   */
  function _fraccionSombraArbol(arbol, largoAlberca, anchoAlberca, elevacionSolar, azimutSolar) {
    if (!arbol || !arbol.altura || arbol.altura <= 0 || elevacionSolar <= 0) return 0;

    const sombraLong = _longitudSombra(arbol.altura, elevacionSolar);
    if (sombraLong === Infinity) return 0;
    if (sombraLong === 0) return 0;

    const dirSombra = (azimutSolar + 180) % 360;
    const dirSombraRad = dirSombra * DEG2RAD;

    // Posición de la punta de la sombra relativa al árbol
    const sombraX = sombraLong * Math.sin(dirSombraRad); // Este positivo
    const sombraY = sombraLong * Math.cos(dirSombraRad); // Norte positivo

    // Posición del árbol relativa al centro de la alberca
    const azArbol = (arbol.azimut_desde_alberca || 0) * DEG2RAD;
    const dist = arbol.distancia || 0;
    const arbolX = dist * Math.sin(azArbol);
    const arbolY = dist * Math.cos(azArbol);

    // Centro de la sombra (proyección de la copa, no de la base)
    // La sombra de la copa cae a una distancia proporcional a la altura de la copa
    const alturaCopa = arbol.altura * 0.7; // Asumir que la copa empieza al 70% de altura
    const sombraCopaLong = _longitudSombra(alturaCopa, elevacionSolar);
    const centraSombraX = arbolX + sombraCopaLong * Math.sin(dirSombraRad);
    const centraSombraY = arbolY + sombraCopaLong * Math.cos(dirSombraRad);

    // Radio de la sombra de la copa
    const radioCopa = arbol.radio_copa || (arbol.altura * 0.25); // Default: 25% de altura
    // La sombra se agranda por el ángulo de proyección
    const radioSombra = radioCopa / Math.sin(elevacionSolar * DEG2RAD);

    // ¿Cuánto de la sombra circular cae dentro del rectángulo de la alberca?
    // Simplificación: calcular la distancia del centro de la sombra al centro de la alberca
    const distAlCentro = Math.sqrt(centraSombraX * centraSombraX + centraSombraY * centraSombraY);

    // Radio efectivo de la alberca (aproximación circular)
    const radioAlberca = Math.sqrt(largoAlberca * anchoAlberca / Math.PI);
    const areaAlberca = largoAlberca * anchoAlberca;

    if (distAlCentro > radioAlberca + radioSombra) {
      // La sombra no toca la alberca
      return 0;
    }

    // Área de intersección simplificada (dos círculos)
    const areaSombra = Math.PI * radioSombra * radioSombra;
    let areaInterseccion;

    if (distAlCentro + radioSombra <= radioAlberca) {
      // Sombra completamente dentro de la alberca
      areaInterseccion = areaSombra;
    } else if (distAlCentro + radioAlberca <= radioSombra) {
      // Alberca completamente dentro de la sombra
      areaInterseccion = areaAlberca;
    } else {
      // Intersección parcial (aproximación lineal para simplicidad)
      const overlap = (radioAlberca + radioSombra - distAlCentro) /
                      (radioAlberca + radioSombra);
      areaInterseccion = Math.min(areaSombra, areaAlberca) * overlap;
    }

    return parseFloat(Math.min(1, areaInterseccion / areaAlberca).toFixed(4));
  }


  // ═══════════════════════════════════════════════════════════
  //  SECCIÓN 3: FACTOR DE SOMBRA INTEGRADO
  // ═══════════════════════════════════════════════════════════

  /**
   * Extrae las bardas del expediente del gemelo digital.
   * El expediente puede tener diferentes formatos; esta función normaliza.
   *
   * @param {Object} entorno - entorno_topografico del gemelo.
   * @returns {Array} Array de objetos barda { altura, distancia, lado }.
   */
  function _extraerBardas(entorno) {
    const bardas = [];
    const lados = ['N', 'S', 'E', 'O'];
    const nombres = {
      'N': { altura: 'barda_norte_altura', distancia: 'barda_norte_distancia' },
      'S': { altura: 'barda_sur_altura', distancia: 'barda_sur_distancia' },
      'E': { altura: 'barda_este_altura', distancia: 'barda_este_distancia' },
      'O': { altura: 'barda_oeste_altura', distancia: 'barda_oeste_distancia' }
    };

    for (const lado of lados) {
      const n = nombres[lado];
      const altura = parseFloat(entorno[n.altura]) || 0;
      const distancia = parseFloat(entorno[n.distancia]) || 0;
      if (altura > 0) {
        bardas.push({ altura, distancia, lado });
      }
    }

    // Formato alternativo: array de bardas
    if (bardas.length === 0 && Array.isArray(entorno.bardas)) {
      for (const b of entorno.bardas) {
        if (b && b.altura > 0) {
          bardas.push({
            altura: parseFloat(b.altura) || 0,
            distancia: parseFloat(b.distancia) || 0,
            lado: (b.lado || b.orientacion || 'N').toUpperCase().charAt(0)
          });
        }
      }
    }

    return bardas;
  }

  /**
   * Extrae los árboles del expediente del gemelo digital.
   *
   * @param {Object} entorno - entorno_topografico del gemelo.
   * @returns {Array} Array de objetos árbol.
   */
  function _extraerArboles(entorno) {
    const arboles = [];

    if (Array.isArray(entorno.arboles)) {
      for (const a of entorno.arboles) {
        if (a && (parseFloat(a.altura) > 0 || parseFloat(a.height) > 0)) {
          arboles.push({
            altura: parseFloat(a.altura || a.height) || 0,
            distancia: parseFloat(a.distancia || a.distance) || 0,
            azimut_desde_alberca: parseFloat(a.azimut || a.azimut_desde_alberca || a.bearing) || 0,
            radio_copa: parseFloat(a.radio_copa || a.crown_radius) || 0
          });
        }
      }
    }

    // Formato simplificado: un solo árbol
    if (arboles.length === 0 && entorno.arbol_altura) {
      const alt = parseFloat(entorno.arbol_altura) || 0;
      if (alt > 0) {
        arboles.push({
          altura: alt,
          distancia: parseFloat(entorno.arbol_distancia) || 0,
          azimut_desde_alberca: parseFloat(entorno.arbol_azimut) || 0,
          radio_copa: parseFloat(entorno.arbol_radio_copa) || 0
        });
      }
    }

    return arboles;
  }

  /**
   * Calcula el factor de sombra instantáneo para un momento dado.
   * Factor 1.0 = pleno sol. Factor 0.0 = sombra total.
   *
   * @param {Object} expediente - Gemelo digital completo de la alberca.
   * @param {Date} fecha - Momento para el cálculo.
   * @returns {Object} { factor, elevacion, azimut, fraccionSombreada, desglose }
   */
  function calcFactorSombraInstantaneo(expediente, fecha) {
    // Extraer ubicación
    const ubicacion = expediente.metadata?.ubicacion || {};
    const lat = parseFloat(ubicacion.lat) || 19.1738;  // Default: Veracruz
    const lng = parseFloat(ubicacion.lng || ubicacion.lon) || -96.1342;

    // Extraer geometría de la alberca
    const geometria = expediente.geometria_adn || {};
    const largo = parseFloat(geometria.largo_m || geometria.largo) || 10;
    const ancho = parseFloat(geometria.ancho_m || geometria.ancho) || 5;

    // Extraer entorno
    const entorno = expediente.entorno_topografico || {};
    const orientacion = parseFloat(entorno.orientacion_alberca || entorno.orientacion) || 0;

    // Posición solar
    const sol = calcPosicionSolar(lat, lng, fecha);

    if (!sol.esSolVisible) {
      return {
        factor: 0,
        elevacion: sol.elevacion,
        azimut: sol.azimut,
        fraccionSombreada: 1,
        desglose: { bardas: 1, arboles: 0, motivo: 'Sol bajo el horizonte' }
      };
    }

    // Calcular sombra de bardas
    const bardas = _extraerBardas(entorno);
    let sombraBardas = 0;
    const desgloseBardas = [];

    for (const barda of bardas) {
      const fraccion = _fraccionSombraBarda(
        barda, largo, ancho,
        sol.elevacion, sol.azimut, orientacion
      );
      desgloseBardas.push({ lado: barda.lado, altura: barda.altura, fraccion });
      // Las sombras de bardas se superponen: usar máximo por lado opuesto,
      // pero sumar lados perpendiculares (con límite en 1)
      sombraBardas = Math.min(1, sombraBardas + fraccion * (1 - sombraBardas));
    }

    // Calcular sombra de árboles
    const arboles = _extraerArboles(entorno);
    let sombraArboles = 0;
    const desgloseArboles = [];

    for (const arbol of arboles) {
      const fraccion = _fraccionSombraArbol(
        arbol, largo, ancho,
        sol.elevacion, sol.azimut
      );
      desgloseArboles.push({ altura: arbol.altura, distancia: arbol.distancia, fraccion });
      sombraArboles = Math.min(1, sombraArboles + fraccion * (1 - sombraArboles));
    }

    // Combinar sombras (las de bardas y árboles pueden superponerse)
    const fraccionSombreada = Math.min(1, sombraBardas + sombraArboles * (1 - sombraBardas));

    // Factor UV: la fracción NO sombreada. Con mínimo de 0.05 porque
    // incluso en sombra total hay radiación UV difusa (~5% del total).
    const factorUV = Math.max(0.05, 1 - fraccionSombreada);

    return {
      factor: parseFloat(factorUV.toFixed(4)),
      elevacion: sol.elevacion,
      azimut: sol.azimut,
      fraccionSombreada: parseFloat(fraccionSombreada.toFixed(4)),
      desglose: {
        bardas: parseFloat(sombraBardas.toFixed(4)),
        arboles: parseFloat(sombraArboles.toFixed(4)),
        detalle_bardas: desgloseBardas,
        detalle_arboles: desgloseArboles
      }
    };
  }


  // ═══════════════════════════════════════════════════════════
  //  SECCIÓN 4: PROMEDIO DIARIO (Integración horaria)
  // ═══════════════════════════════════════════════════════════

  /**
   * Calcula el factor de sombra promedio diario integrando hora por hora.
   * Este es el método recomendado para alimentar la degradación de cloro,
   * ya que promedia el efecto de sombra a lo largo del día completo.
   *
   * Calcula la posición solar y sombra cada 30 minutos desde las 6:00
   * hasta las 20:00 horas locales, pondera por la intensidad UV relativa
   * (proporcional al seno de la elevación solar), e integra.
   *
   * @param {Object} expediente - Gemelo digital completo.
   * @param {Date} [fecha] - Día para el cálculo (default: hoy).
   * @returns {Object} {
   *   factorPromedio: 0–1,
   *   horasSolEfectivas: horas equivalentes de sol pleno,
   *   horasSolTotal: horas de sol (elevación > 0),
   *   muestras: array de {hora, factor, elevacion, azimut}
   * }
   */
  function calcFactorSombraDiario(expediente, fecha) {
    if (!fecha) fecha = new Date();

    const dia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const HORA_INICIO = 6;
    const HORA_FIN = 20;
    const INTERVALO_MIN = 30;

    let sumaUVPonderado = 0;
    let sumaUVTeoricoTotal = 0;
    let horasSolTotal = 0;
    const muestras = [];

    for (let h = HORA_INICIO; h <= HORA_FIN; h += INTERVALO_MIN / 60) {
      const minutos = Math.round((h % 1) * 60);
      const horaEntera = Math.floor(h);
      const muestra = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), horaEntera, minutos);

      const resultado = calcFactorSombraInstantaneo(expediente, muestra);

      if (resultado.elevacion > 0) {
        // Peso proporcional al seno de la elevación (intensidad UV relativa)
        const pesoUV = Math.sin(resultado.elevacion * DEG2RAD);
        sumaUVPonderado += pesoUV * resultado.factor;
        sumaUVTeoricoTotal += pesoUV;
        horasSolTotal += INTERVALO_MIN / 60;
      }

      muestras.push({
        hora: horaEntera + ':' + (minutos < 10 ? '0' : '') + minutos,
        factor: resultado.factor,
        elevacion: resultado.elevacion,
        azimut: resultado.azimut,
        fraccionSombreada: resultado.fraccionSombreada
      });
    }

    // Factor promedio ponderado por intensidad UV
    const factorPromedio = sumaUVTeoricoTotal > 0
      ? parseFloat((sumaUVPonderado / sumaUVTeoricoTotal).toFixed(4))
      : 0;

    // Horas sol efectivas = horas de sol × factor promedio
    const horasSolEfectivas = parseFloat((horasSolTotal * factorPromedio).toFixed(2));

    return {
      factorPromedio,
      horasSolEfectivas,
      horasSolTotal: parseFloat(horasSolTotal.toFixed(2)),
      muestras,
      fecha: dia.toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    };
  }


  // ═══════════════════════════════════════════════════════════
  //  SECCIÓN 5: API PARA ENGINE.JS
  // ═══════════════════════════════════════════════════════════

  /**
   * FUNCIÓN PRINCIPAL para Engine.js.
   *
   * Calcula el factor de sombra efectivo que debe multiplicar al UVI
   * antes de alimentar la degradación de cloro.
   *
   * Modos de operación:
   *   1. INSTANTÁNEO: usa la hora actual para un cálculo puntual.
   *   2. PROMEDIO DIARIO: integra el día completo (más preciso para
   *      proyecciones de varias horas).
   *
   * @param {Object} expediente - Gemelo digital completo de la alberca.
   * @param {Object} [opciones] - Opciones de cálculo.
   * @param {string} [opciones.modo='instantaneo'] - 'instantaneo' o 'diario'.
   * @param {Date} [opciones.fecha] - Fecha/hora para el cálculo.
   * @returns {Object} {
   *   factorUV: 0–1 (multiplicar por UVI crudo),
   *   modo: string,
   *   horasSolEfectivas: number (solo en modo diario),
   *   detalle: Object (información completa del cálculo)
   * }
   */
  function calcFactorSombraEfectivo(expediente, opciones) {
    if (!expediente) {
      return { factorUV: 1.0, modo: 'sin_expediente', detalle: null };
    }

    const opts = opciones || {};
    const modo = (opts.modo || 'instantaneo').toLowerCase();
    const fecha = opts.fecha || new Date();

    // Verificar si hay datos de entorno suficientes
    const entorno = expediente.entorno_topografico || {};
    const tieneBardas = _extraerBardas(entorno).length > 0;
    const tieneArboles = _extraerArboles(entorno).length > 0;

    if (!tieneBardas && !tieneArboles) {
      // Sin datos de obstrucciones: factor 1.0 (sol pleno)
      // Pero respetar horas_sol_efectivas si está capturado manualmente
      const horasManual = parseFloat(entorno.horas_sol_efectivas);
      if (horasManual > 0 && horasManual < 14) {
        // Convertir horas manuales a factor aproximado (14h = día máximo)
        const factorManual = Math.min(1, horasManual / 14);
        return {
          factorUV: parseFloat(factorManual.toFixed(4)),
          modo: 'manual_horas_sol',
          horasSolEfectivas: horasManual,
          detalle: { fuente: 'Campo manual horas_sol_efectivas', valor: horasManual }
        };
      }

      return {
        factorUV: 1.0,
        modo: 'sin_obstrucciones',
        detalle: { nota: 'No hay bardas ni arboles registrados. UV sin ajuste.' }
      };
    }

    if (modo === 'diario') {
      const diario = calcFactorSombraDiario(expediente, fecha);
      return {
        factorUV: diario.factorPromedio,
        modo: 'diario',
        horasSolEfectivas: diario.horasSolEfectivas,
        detalle: diario
      };
    }

    // Modo instantáneo (default)
    const instantaneo = calcFactorSombraInstantaneo(expediente, fecha);
    return {
      factorUV: instantaneo.factor,
      modo: 'instantaneo',
      detalle: instantaneo
    };
  }


  // ═══════════════════════════════════════════════════════════
  //  SECCIÓN 6: UTILIDADES Y DIAGNÓSTICO
  // ═══════════════════════════════════════════════════════════

  /**
   * Genera una tabla de posición solar para un día completo.
   * Útil para diagnóstico y visualización.
   *
   * @param {number} lat - Latitud.
   * @param {number} lng - Longitud.
   * @param {Date} [fecha] - Día (default: hoy).
   * @returns {Array} Array de { hora, elevacion, azimut, esSolVisible }.
   */
  function tablaSolarDiaria(lat, lng, fecha) {
    if (!fecha) fecha = new Date();
    const dia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const tabla = [];

    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const momento = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), h, m);
        const pos = calcPosicionSolar(lat, lng, momento);
        tabla.push({
          hora: h + ':' + (m < 10 ? '0' : '') + m,
          elevacion: pos.elevacion,
          azimut: pos.azimut,
          esSolVisible: pos.esSolVisible
        });
      }
    }

    return tabla;
  }

  /**
   * Diagnóstico del módulo.
   */
  function diagnostico() {
    // Test rápido: posición solar en Veracruz al mediodía
    const test = calcPosicionSolar(19.1738, -96.1342, new Date());
    return {
      version: VERSION,
      timestamp: new Date().toISOString(),
      testPosicionSolar: test,
      ecuaciones: 'NOAA General Solar Position Calculations + Jean Meeus',
      modeloSombra: 'Proyeccion geometrica de bardas (lineal) + arboles (conico)',
      modos: ['instantaneo', 'diario'],
      uvDifusoMinimo: 0.05,
      firma: 'Omar Alberto Valle Mercado | VAMO870509HW3'
    };
  }


  // ═══════════════════════════════════════════════════════════
  //  API PÚBLICA
  // ═══════════════════════════════════════════════════════════

  return Object.freeze({
    VERSION,

    // Cálculo solar puro
    calcPosicionSolar,
    tablaSolarDiaria,

    // Factor de sombra
    calcFactorSombraInstantaneo,
    calcFactorSombraDiario,

    // API principal para Engine.js
    calcFactorSombraEfectivo,

    // Diagnóstico
    diagnostico
  });

})();

// Registrar en window
window.Solar = Solar;

console.log(`[Solar] Modulo V${Solar.VERSION} cargado. Ecuaciones NOAA + Modelo de sombra geometrico. | Omar Alberto Valle Mercado`);
