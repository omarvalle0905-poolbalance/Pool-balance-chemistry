/**
 * ═══════════════════════════════════════════════
 * POOL BALANCE V16.2 — js/clima.js
 * Módulo de Clima (API + Cache + Fallback Offline)
 * © Omar Alberto Valle Mercado | VAMO870509HW3
 *
 * V16.2 CAMBIOS:
 *   - Cache en memoria con TTL configurable (default 20 min).
 *     Reduce llamadas API de cientos/hora a 3/hora.
 *   - Timeout de 8s en fetch (evita bloquear Engine).
 *   - Intento de obtener UV real desde endpoint /uvi.
 *   - Campo uv_fuente para distinguir UV medido vs estimado.
 *   - Promedios mensuales ampliados con humedad y viento.
 *   - Evento clima:actualizado para EventBus.
 *   - Advertencia de seguridad sobre API Key expuesta.
 *
 * ═══════════════════════════════════════════════
 */

'use strict';

const Clima = (function () {
  // ── CONFIGURACIÓN ──────────────────────────────
  // ADVERTENCIA DE SEGURIDAD: Esta key es visible en el navegador del cliente.
  // Restringir por HTTP Referrer en el dashboard de OpenWeatherMap:
  // https://home.openweathermap.org/api_keys
  // Dominios permitidos: tu-dominio.com, localhost
  const API_KEY = '6ab1b6e69906119547051cd14a69ebbd';
  const LAT_VERACRUZ = 19.1738;
  const LNG_VERACRUZ = -96.1342;

  const FETCH_TIMEOUT_MS = 8000;
  const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutos

  const VERSION = '16.2';

  // ── CACHE EN MEMORIA ───────────────────────────
  let _cache = null;       // { datos, timestamp, lat, lng }

  // ── FALLBACK OFFLINE (Promedios Mensuales Veracruz) ──
  // V16.2: Ampliado con humedad y viento estacionales.
  // Fuente: Normales climatológicas CONAGUA — Estación Veracruz (30192).
  const PROMEDIOS_MENSUALES = {
    0:  { temp: 22, uv: 6,  humedad: 77, viento: 18 },  // Ene (nortes)
    1:  { temp: 23, uv: 7,  humedad: 75, viento: 17 },  // Feb
    2:  { temp: 25, uv: 8,  humedad: 73, viento: 15 },  // Mar
    3:  { temp: 27, uv: 9,  humedad: 74, viento: 14 },  // Abr
    4:  { temp: 29, uv: 10, humedad: 76, viento: 12 },  // May
    5:  { temp: 29, uv: 11, humedad: 80, viento: 11 },  // Jun
    6:  { temp: 29, uv: 11, humedad: 80, viento: 10 },  // Jul
    7:  { temp: 29, uv: 11, humedad: 81, viento: 10 },  // Ago
    8:  { temp: 28, uv: 10, humedad: 83, viento: 12 },  // Sep
    9:  { temp: 27, uv: 9,  humedad: 82, viento: 16 },  // Oct (nortes inician)
    10: { temp: 25, uv: 7,  humedad: 79, viento: 22 },  // Nov (nortes fuertes)
    11: { temp: 23, uv: 6,  humedad: 78, viento: 20 }   // Dic (nortes)
  };

  /**
   * V16.2: Verifica si el cache es válido para la ubicación solicitada.
   */
  function _cacheValido(lat, lng) {
    if (!_cache) return false;
    const edad = Date.now() - _cache.timestamp;
    if (edad > CACHE_TTL_MS) return false;

    // Verificar que la ubicación es la misma (tolerancia ~1 km)
    const dLat = Math.abs(lat - _cache.lat);
    const dLng = Math.abs(lng - _cache.lng);
    return dLat < 0.01 && dLng < 0.01;
  }

  /**
   * V16.2: Fetch con timeout usando AbortController.
   */
  async function _fetchConTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const respuesta = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return respuesta;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  /**
   * V16.2: Intenta obtener UV real del endpoint dedicado.
   * Este endpoint puede no estar disponible en todos los tiers.
   * @returns {number|null} Índice UV real o null si no disponible.
   */
  async function _obtenerUVReal(lat, lng) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lng}&appid=${API_KEY}`;
      const respuesta = await _fetchConTimeout(url, 5000);
      if (respuesta.ok) {
        const data = await respuesta.json();
        if (data.value != null && isFinite(data.value)) {
          return Math.round(data.value);
        }
      }
    } catch (e) {
      // Silencioso: UV real no disponible, se usará estimación
    }
    return null;
  }

  /**
   * Estima el UV basándose en nubosidad y promedios estacionales.
   * Usado como fallback cuando el endpoint de UV no está disponible.
   */
  function _estimarUV(nubosidadPct) {
    const mesActual = new Date().getMonth();
    const uvBase = PROMEDIOS_MENSUALES[mesActual]?.uv || 8;
    return Math.round(uvBase * Math.max(0.2, 1 - (nubosidadPct / 100) * 0.8));
  }

  /**
   * Construye el objeto de respuesta del fallback offline.
   */
  function _fallbackOffline() {
    const mes = new Date().getMonth();
    const promedio = PROMEDIOS_MENSUALES[mes] || PROMEDIOS_MENSUALES[0];

    return {
      temp_c: promedio.temp,
      uv: promedio.uv,
      uv_fuente: 'promedio_mensual',
      humedad: promedio.humedad,
      viento_kmh: promedio.viento,
      descripcion: 'Veracruz (estimacion offline)',
      fuente: 'Fallback Offline',
      timestamp: new Date().toISOString()
    };
  }

  // ── FUNCIÓN PRINCIPAL ──────────────────────────
  /**
   * Obtiene los datos climáticos actuales para una ubicación.
   * Flujo: Cache -> API -> Fallback Offline.
   *
   * @param {number} lat - Latitud (default: Veracruz).
   * @param {number} lng - Longitud (default: Veracruz).
   * @returns {Promise<Object>} Datos climáticos normalizados.
   */
  async function obtenerClimaActual(lat = LAT_VERACRUZ, lng = LNG_VERACRUZ) {

    // 1. Verificar cache
    if (_cacheValido(lat, lng)) {
      console.debug('[Clima] Datos servidos desde cache.');
      return _cache.datos;
    }

    // 2. Intento de conexión a la API
    if (API_KEY && API_KEY !== 'TU_API_KEY_DE_OPENWEATHERMAP') {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric&lang=es`;
        const respuesta = await _fetchConTimeout(url, FETCH_TIMEOUT_MS);

        if (respuesta.ok) {
          const data = await respuesta.json();

          const nubosidadPct = data.clouds?.all || 0;

          // V16.2: Intentar obtener UV real en paralelo (no bloquea)
          let uvValor = _estimarUV(nubosidadPct);
          let uvFuente = 'estimacion_nubosidad';

          // Lanzar petición de UV real sin bloquear el flujo principal
          const uvRealPromise = _obtenerUVReal(lat, lng);

          // Esperar UV real con timeout corto (no más de 3 segundos extra)
          try {
            const uvReal = await Promise.race([
              uvRealPromise,
              new Promise(resolve => setTimeout(() => resolve(null), 3000))
            ]);
            if (uvReal != null) {
              uvValor = uvReal;
              uvFuente = 'OpenWeatherMap_UV';
            }
          } catch (e) {
            // Mantener estimación
          }

          const datos = {
            temp_c: data.main.temp,
            uv: uvValor,
            uv_fuente: uvFuente,
            humedad: data.main.humidity,
            viento_kmh: parseFloat((data.wind.speed * 3.6).toFixed(1)),
            descripcion: data.weather[0]?.description || 'Desconocido',
            fuente: 'OpenWeatherMap',
            timestamp: new Date().toISOString()
          };

          // Guardar en cache
          _cache = {
            datos,
            timestamp: Date.now(),
            lat,
            lng
          };

          // V16.2: Notificar por EventBus si está disponible
          if (window.EventBus && typeof window.EventBus.dispatch === 'function') {
            window.EventBus.dispatch('clima:actualizado', {
              ...datos,
              cache: false
            });
          }

          console.info(`[Clima] Datos obtenidos de OpenWeatherMap. Temp: ${datos.temp_c}C, UV: ${datos.uv} (${uvFuente}), Humedad: ${datos.humedad}%, Viento: ${datos.viento_kmh} km/h`);

          return datos;
        } else {
          console.warn(`[Clima] API respondio ${respuesta.status}. Usando fallback offline.`);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn(`[Clima] Timeout de ${FETCH_TIMEOUT_MS / 1000}s alcanzado. Usando fallback offline.`);
        } else {
          console.warn('[Clima] Error al conectar con OpenWeatherMap. Pasando a fallback offline.', error.message);
        }
      }
    }

    // 3. Fallback Offline
    const datosFallback = _fallbackOffline();

    // Cache incluso el fallback para evitar reintentos durante el TTL
    _cache = {
      datos: datosFallback,
      timestamp: Date.now(),
      lat,
      lng
    };

    if (window.EventBus && typeof window.EventBus.dispatch === 'function') {
      window.EventBus.dispatch('clima:actualizado', {
        ...datosFallback,
        cache: false,
        offline: true
      });
    }

    console.info('[Clima] Modo offline activado. Usando promedios mensuales de Veracruz.');

    return datosFallback;
  }

  // ── API PÚBLICA ─────────────────────────────────
  return {
    obtenerClimaActual,
    VERSION,

    /**
     * Fuerza la invalidación del cache.
     * Útil si el técnico cambia de ubicación o quiere datos frescos.
     */
    invalidarCache() {
      _cache = null;
      console.info('[Clima] Cache invalidado.');
    },

    /**
     * Devuelve el estado actual del módulo para diagnóstico.
     */
    diagnostico() {
      return {
        version: VERSION,
        apiConfigurada: API_KEY && API_KEY !== 'TU_API_KEY_DE_OPENWEATHERMAP',
        cacheActivo: _cache !== null,
        cacheEdadMinutos: _cache ? parseFloat(((Date.now() - _cache.timestamp) / 60000).toFixed(1)) : null,
        cacheTTLMinutos: CACHE_TTL_MS / 60000,
        timeoutMs: FETCH_TIMEOUT_MS,
        ultimaFuente: _cache?.datos?.fuente || 'Sin datos',
        uvFuente: _cache?.datos?.uv_fuente || 'Sin datos',
        firma: 'Omar Alberto Valle Mercado | VAMO870509HW3'
      };
    }
  };
})();

window.Clima = Clima;

console.log(`[Clima] Modulo V${Clima.VERSION} cargado. | Omar Alberto Valle Mercado`);
