// js/app.js
// Autor: Omar Alberto Valle Mercado | VAMO870509HW3
const CronometroRetrolavado = {
    timer: null,
    startTime: 0,
    elapsed: 0,
    running: false,
    lpm: 0,
    volumenM3: 1,
    cya_actual: 0,
    ch_actual: 0,

    init(lpm, volumenM3, cya, ch) {
        this.lpm = parseFloat(lpm) || 0;
        this.volumenM3 = parseFloat(volumenM3) || 1;
        this.cya_actual = parseFloat(cya) || 0;
        this.ch_actual = parseFloat(ch) || 0;
        
        document.getElementById('bw-lpm').textContent = this.lpm;
        this.reset();
    },
    
    start() {
        if(this.running) return;
        this.running = true;
        this.startTime = Date.now() - this.elapsed;
        this.timer = setInterval(() => this.update(), 100);
        document.getElementById('btn-start-bw').style.background = '#81c784';
        document.getElementById('btn-stop-bw').style.background = '#f44336';
    },
    
    stop() {
        if(!this.running) return;
        this.running = false;
        clearInterval(this.timer);
        this.update();
        document.getElementById('btn-start-bw').style.background = '#4caf50';
        document.getElementById('btn-stop-bw').style.background = '#e57373';
        return this.getResults();
    },

    reset() {
        this.running = false;
        clearInterval(this.timer);
        this.elapsed = 0;
        this.renderTime(0, 0, 0);
        this.renderResults(0, 0, 0);
    },
    
    update() {
        this.elapsed = Date.now() - this.startTime;
        const totalSegs = this.elapsed / 1000;
        
        const m = Math.floor(totalSegs / 60);
        const s = Math.floor(totalSegs % 60);
        const d = Math.floor((this.elapsed % 1000) / 100);
        
        this.renderTime(m, s, d);
        
        const litros = (totalSegs / 60) * this.lpm;
        const cya_g = (litros * this.cya_actual) / 1000;
        const ch_g = (litros * this.ch_actual) / 1000;
        
        this.renderResults(litros, cya_g, ch_g);
    },
    
    renderTime(m, s, d) {
        document.getElementById('cron-min').textContent = m.toString().padStart(2, '0');
        document.getElementById('cron-seg').textContent = s.toString().padStart(2, '0');
        document.getElementById('cron-dec').textContent = d;
    },
    
    renderResults(litros, cyaG, chG) {
        document.getElementById('bw-litros').textContent = litros.toFixed(1);
        document.getElementById('bw-cya-g').textContent = cyaG.toFixed(1);
        document.getElementById('bw-ch-g').textContent = chG.toFixed(1);
        
        document.getElementById('bw-cya-old').textContent = this.cya_actual.toFixed(1);
        document.getElementById('bw-cya-new').textContent = Math.max(0, this.cya_actual - (cyaG / this.volumenM3)).toFixed(1);
        
        document.getElementById('bw-ch-old').textContent = this.ch_actual.toFixed(1);
        document.getElementById('bw-ch-new').textContent = Math.max(0, this.ch_actual - (chG / this.volumenM3)).toFixed(1);
    },

    getResults() {
        const totalSegs = this.elapsed / 1000;
        const litros = (totalSegs / 60) * this.lpm;
        const cya_perdido_g = (litros * this.cya_actual) / 1000;
        const ch_perdido_g = (litros * this.ch_actual) / 1000;
        
        return {
            litros, cya_perdido_g, ch_perdido_g,
            cya_nuevo: Math.max(0, this.cya_actual - (cya_perdido_g / this.volumenM3)),
            ch_nuevo: Math.max(0, this.ch_actual - (ch_perdido_g / this.volumenM3))
        };
    }
};

const App = {
    albercaActual: null,
    
    init() {
        this.bindNav();
        this.bindEncabezadoInteligente();
        this.bindColorQ();
        this.bindCronometro();
        this.bindIsaias();
        
        document.getElementById('btn-guardar-maestro').addEventListener('click', () => this.ejecutarSecuenciaMaestra());
        
        this.renderClientesCombo();
        this.renderInventarioDosing();
        
        // Fix zona horaria local
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('bit-fecha-hora').value = now.toISOString().slice(0,16);
    },

    bindNav() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                const target = e.currentTarget.dataset.target;
                document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
                
                const view = document.getElementById(target);
                if(view) view.classList.add('active-view');
            });
        });
    },

    bindEncabezadoInteligente() {
        const selCliente = document.getElementById('bit-cliente-select');
        const selAlberca = document.getElementById('bit-alberca-select');
        const cardExp = document.getElementById('bit-expediente-card');
        
        selCliente.addEventListener('change', (e) => {
            selAlberca.innerHTML = '<option value="">Seleccione Alberca...</option>';
            if(e.target.value) {
                selAlberca.disabled = false;
                DB.getAlbercas(e.target.value).forEach(a => {
                    selAlberca.innerHTML += `<option value="${a.id}">${a.nombre}</option>`;
                });
            } else {
                selAlberca.disabled = true;
                cardExp.style.display = 'none';
                this.albercaActual = null;
                this.limpiarDosificacionLive();
            }
        });

        selAlberca.addEventListener('change', (e) => {
            if(!e.target.value) {
                cardExp.style.display = 'none';
                this.albercaActual = null;
                this.limpiarDosificacionLive();
                return;
            }
            this.albercaActual = DB.getAlberca(e.target.value);
            
            cardExp.style.display = 'block';
            cardExp.innerHTML = `
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid #ccc; padding-bottom:5px; margin-bottom:5px;">
                    <span><b>Volumen:</b> ${this.albercaActual.volumen} m³</span>
                    <span><b>Flujo:</b> ${this.albercaActual.flujoLPM} LPM</span>
                    <span><b>PSI Limpio:</b> ${this.albercaActual.psiLimpio}</span>
                </div>
                <div style="display:flex; justify-content:space-between; color:var(--secondary);">
                    <span><b>CYA:</b> ${this.albercaActual.cya_actual.toFixed(1)} ppm</span>
                    <span><b>Dureza:</b> ${this.albercaActual.ch_actual.toFixed(1)} ppm</span>
                    <span><b>Alk:</b> ${this.albercaActual.alcalinidad_actual.toFixed(1)} ppm</span>
                </div>
            `;
            
            CronometroRetrolavado.init(
                this.albercaActual.flujoLPM, 
                this.albercaActual.volumen, 
                this.albercaActual.cya_actual, 
                this.albercaActual.ch_actual
            );
            
            this.calcularDosificacionLive();
        });
    },

    bindColorQ() {
        document.getElementById('btn-toggle-colorq').addEventListener('click', () => {
            const div = document.getElementById('colorq-completo');
            const isHidden = div.style.display === 'none';
            div.style.display = isHidden ? 'block' : 'none';
            document.getElementById('btn-toggle-colorq').innerHTML = isHidden ? 'Ocultar Lectura ColorQ ▲' : 'Lectura Completa ColorQ Pro 7 ▼';
        });

        const inputsISPB = ['cq-ph', 'cq-alk', 'cq-ch', 'cq-cya', 'cq-temp'];
        inputsISPB.forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                this.calcularISPBLocal();
                if(id === 'cq-cya') this.calcularDosificacionLive();
            });
        });

        // Evento para detonar Regla del 7.5% de Cloro/CYA
        document.getElementById('cq-fcl').addEventListener('input', () => this.calcularDosificacionLive());
    },

    // ⚡ LÓGICA DE DOSIFICACIÓN PROFESIONAL POOL BALANCE
    calcularDosificacionLive() {
        if (!this.albercaActual) return;

        const cloroActual = parseFloat(document.getElementById('cq-fcl').value) || 0;
        // Priorizar CYA dictado, sino usar el del expediente
        const inputCYA = parseFloat(document.getElementById('cq-cya').value);
        const cya = !isNaN(inputCYA) ? inputCYA : this.albercaActual.cya_actual || 0;
        const volumenM3 = this.albercaActual.volumen;

        if (cya <= 0 || volumenM3 <= 0) return;

        // 1. Punto de Quiebre (Desinfección real): Cloro Libre >= 7.5% del CYA
        const cloroMinimoRequerido = cya * 0.075;
        // 2. Degradación UV/Calor diaria: 3% del nivel de CYA
        const perdidaDiariaPPM = cya * 0.03;
        // 3. Reposición diaria (Gramos de Tricloro 90% para compensar sol)
        const gramosTricloroDiario = (perdidaDiariaPPM * volumenM3) / 0.90;

        let htmlAlerts = `
            <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 12px; margin-bottom: 10px; border-radius: 4px; font-size:0.9rem;">
                <strong style="color: #0d47a1;">💧 Reposición Diaria UV (3%):</strong><br>
                Evaporación est. <b>${perdidaDiariaPPM.toFixed(2)} ppm</b> de Cloro/día.<br>
                Aplica <b>${gramosTricloroDiario.toFixed(0)}g</b> de Tricloro 90% diarios.
            </div>
        `;

        // 4. Cálculo de Shock
        if (cloroActual < cloroMinimoRequerido) {
            const deficitPPM = cloroMinimoRequerido - cloroActual;
            const gramosHipoShock = (deficitPPM * volumenM3) / 0.65;
            const gramosTricloroShock = (deficitPPM * volumenM3) / 0.90;

            htmlAlerts += `
                <div style="background-color: #fffde7; border-left: 4px solid #fbc02d; padding: 12px; margin-bottom: 15px; border-radius: 4px; font-size:0.9rem;">
                    <strong style="color: #f57f17;">⚠️ SHOCK REQUERIDO (Regla 7.5% CYA):</strong><br>
                    Cloro mínimo sano: <b>${cloroMinimoRequerido.toFixed(2)} ppm</b> (Faltan ${deficitPPM.toFixed(2)} ppm).<br>
                    Elige una dosificación de impacto rápido:<br>
                    • <b>${gramosHipoShock.toFixed(0)}g</b> de Hipocalcio 65% (Recomendado)<br>
                    • <b>${gramosTricloroShock.toFixed(0)}g</b> de Tricloro 90%
                </div>
            `;
        }

        // Inyectar alertas dinámicamente antes de la tabla de dosificación
        let container = document.getElementById('live-dosing-alerts');
        if (!container) {
            container = document.createElement('div');
            container.id = 'live-dosing-alerts';
            const targetSection = document.querySelector('.section-e');
            targetSection.insertBefore(container, targetSection.querySelector('div')); // Insertar debajo del título h3
        }
        
        container.innerHTML = htmlAlerts;
    },

    limpiarDosificacionLive() {
        const container = document.getElementById('live-dosing-alerts');
        if(container) container.innerHTML = '';
    },

    calcularISPBLocal() {
        const ph = parseFloat(document.getElementById('cq-ph').value);
        const alk = parseFloat(document.getElementById('cq-alk').value);
        const ch = parseFloat(document.getElementById('cq-ch').value);
        const cya = parseFloat(document.getElementById('cq-cya').value);
        const temp = parseFloat(document.getElementById('cq-temp').value);

        const resDiv = document.getElementById('bit-ispb-result');
        if(ph && alk && ch && cya && temp) {
            const ispb = Chemistry.ISPB(ph, temp, ch, alk, cya, 1000);
            let color = '#4caf50';
            if(ispb < -0.3) color = '#ffeb3b';
            if(ispb > 0.3) color = '#f44336';
            
            resDiv.innerHTML = `ISPB Calculado: <span style="font-size:1.2rem; color:${color};">${ispb}</span>`;
        } else {
            resDiv.innerHTML = 'ISPB: Esperando datos (pH, Alk, Ca, CYA, Temp)...';
        }
    },

    bindCronometro() {
        document.getElementById('btn-start-bw').addEventListener('click', () => CronometroRetrolavado.start());
        document.getElementById('btn-stop-bw').addEventListener('click', () => CronometroRetrolavado.stop());
    },

    renderClientesCombo() {
        const sel = document.getElementById('bit-cliente-select');
        sel.innerHTML = '<option value="">Seleccione Cliente...</option>';
        DB.getClientes().forEach(c => sel.innerHTML += `<option value="${c.id}">${c.nombre}</option>`);
    },

    renderInventarioDosing() {
        const tbody = document.getElementById('dosing-tbody');
        tbody.innerHTML = '';
        const inv = DB.getInventario();
        
        // Mostramos solo los clave en la UI de bitácora rápida
        const displayKeys = ['tricloro', 'hipocalcio', 'acido', 'alkalin'];
        const descripciones = {
            'tricloro': { d: '🔵 Tricloro 90%', u: 'g' },
            'hipocalcio': { d: '🟢 Hipocalcio 65%', u: 'g' },
            'acido': { d: '🔴 Ácido Muriático', u: 'L' },
            'alkalin': { d: '🟡 Alkalin Spin', u: 'g' }
        };

        displayKeys.forEach(k => {
            const prod = inv[k];
            if(!prod) return;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${descripciones[k].d}</b></td>
                <td><input type="number" class="dose-input" data-key="${k}" placeholder="0" style="width:60px; padding:5px;"> ${descripciones[k].u}</td>
                <td style="color:#666;">${prod.stock.toFixed(1)} ${prod.unidad}</td>
                <td class="dose-impact text-sm" style="font-family:monospace; color:var(--primary); font-weight:bold;">--</td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.dose-input').forEach(input => {
            input.addEventListener('input', (e) => {
                if(!this.albercaActual) return;
                const val = parseFloat(e.target.value) || 0;
                const key = e.target.dataset.key;
                
                const impact = Chemistry.AuditoriaMasa.impacto(key, val, this.albercaActual.volumen);
                
                let text = [];
                if(impact.cl) text.push(`+${impact.cl.toFixed(2)} Cl`);
                if(impact.cya) text.push(`+${impact.cya.toFixed(2)} CYA`);
                if(impact.ca) text.push(`+${impact.ca.toFixed(2)} Ca`);
                if(impact.ph) text.push(`${impact.ph.toFixed(2)} pH`);
                if(impact.alk) text.push(`${impact.alk > 0 ? '+' : ''}${impact.alk.toFixed(2)} ALK`);
                
                e.target.closest('tr').querySelector('.dose-impact').textContent = text.length > 0 ? text.join(' | ') : '--';
            });
        });
    },

    bindIsaias() {
        document.getElementById('btn-enviar-isaias').addEventListener('click', async () => {
            const inputEl = document.getElementById('isaias-input');
            const texto = inputEl.value.trim();
            if(!texto) return;
            
            const clienteId = document.getElementById('bit-cliente-select').value;
            if(!clienteId) { alert("⚠️ Para contexto completo, seleccione un cliente en la pestaña Bitácora primero."); return; }
            
            const log = document.getElementById('isaias-chat-log');
            log.innerHTML += `<div style="text-align:right; padding:10px; background:#e8f5e9; border-radius:10px 10px 0 10px; max-width:85%; align-self:flex-end; font-size:0.95rem; border:1px solid #c8e6c9;"><b>Ingeniero:</b> ${texto}</div>`;
            inputEl.value = '';
            
            const typingId = 'typing-' + Date.now();
            log.innerHTML += `<div id="${typingId}" style="text-align:left; padding:10px; color:#666; font-style:italic;">Isaías está analizando la masa dinámica...</div>`;
            log.scrollTop = log.scrollHeight;
            
            const respuesta = await IsaiasAI.procesarSensacion(texto, clienteId);
            
            document.getElementById(typingId).remove();
            log.innerHTML += `<div style="text-align:left; padding:10px; background:#fff9c4; border-radius:10px 10px 10px 0; max-width:85%; align-self:flex-start; font-size:0.95rem; border:1px solid #fff59d;"><b>Isaías:</b> ${respuesta}</div>`;
            log.scrollTop = log.scrollHeight;
        });
    },

    ejecutarSecuenciaMaestra() {
        const clienteId = document.getElementById('bit-cliente-select').value;
        const albercaId = document.getElementById('bit-alberca-select').value;
        
        if(!clienteId || !albercaId || !this.albercaActual) {
            alert("❌ ERROR: Seleccione Cliente y Alberca.");
            return;
        }

        // 1 & 2. Detener y extraer retrolavado
        const bwRes = CronometroRetrolavado.stop() || CronometroRetrolavado.getResults();

        // 3 & 5. Calcular impactos dosificación y descontar inventario
        const inputs = document.querySelectorAll('.dose-input');
        let sumaCya = 0;
        let sumaCa = 0;
        let sumaAlk = 0;
        const invLog = [];

        inputs.forEach(input => {
            const v = parseFloat(input.value) || 0;
            const k = input.dataset.key;
            if(v > 0) {
                const imp = Chemistry.AuditoriaMasa.impacto(k, v, this.albercaActual.volumen);
                sumaCya += (imp.cya || 0);
                sumaCa += (imp.ca || 0);
                sumaAlk += (imp.alk || 0);
                
                // Conversión UI a Stock (Polvos en kg, Líquidos en L)
                const desc = k === 'acido' ? v : (v / 1000); 
                DB.updateInventario(k, desc);
                invLog.push({ producto: k, cantidad_aplicada: v });
            }
        });

        // 4. Actualizar Expediente (ADN Químico)
        const newCya = Math.max(0, this.albercaActual.cya_actual - (bwRes.cya_perdido_g / this.albercaActual.volumen) + sumaCya);
        const newCh = Math.max(0, this.albercaActual.ch_actual - (bwRes.ch_perdido_g / this.albercaActual.volumen) + sumaCa);
        const newAlk = Math.max(0, this.albercaActual.alcalinidad_actual + sumaAlk);

        DB.updateAlbercaV2(albercaId, {
            cya_actual: newCya,
            ch_actual: newCh,
            alcalinidad_actual: newAlk
        });

        // 6 & 7. Guardar Bitácora Completa (incluye historial litros)
        const b = {
            id: Date.now(),
            clienteId,
            albercaId,
            fecha: document.getElementById('bit-fecha-hora').value,
            tipoServicio: document.getElementById('bit-tipo-servicio').value,
            checklist: {
                cepillado: document.getElementById('chk-cepillado').checked,
                aspirado: document.getElementById('chk-aspirado').checked,
                canastillas: document.getElementById('chk-canastillas').checked,
                red: document.getElementById('chk-red').checked,
                filtro: document.getElementById('chk-filtro').checked,
                nivel: document.getElementById('chk-nivel').checked,
            },
            parametros: {
                ph: document.getElementById('cq-ph').value,
                fcl: document.getElementById('cq-fcl').value,
                turbidez: document.getElementById('cq-turbidez').value,
                tcl: document.getElementById('cq-tcl').value,
                alk: document.getElementById('cq-alk').value,
                ch: document.getElementById('cq-ch').value,
                cya: document.getElementById('cq-cya').value
            },
            retrolavado: {
                litros: bwRes.litros,
                cyaPerdido: bwRes.cya_perdido_g,
                chPerdido: bwRes.ch_perdido_g
            },
            inventarioUsado: invLog,
            observaciones: document.getElementById('bit-observaciones').value
        };

        DB.saveBitacora(b);

        // 8. Confirmación
        alert("✅ Visita guardada exitosamente · ADN químico de la alberca actualizado en la Masa Dinámica");
        
        // Reset Visual
        CronometroRetrolavado.reset();
        inputs.forEach(i => { i.value = ''; i.dispatchEvent(new Event('input')); });
        document.querySelectorAll('.grid-2x3 input[type=checkbox]').forEach(c => c.checked = false);
        document.querySelectorAll('.section-c input[type=number]').forEach(i => i.value = '');
        document.getElementById('bit-observaciones').value = '';
        document.getElementById('bit-ispb-result').textContent = 'ISPB: Calculando...';
        this.limpiarDosificacionLive();
        
        // Refrescar tarjetas
        document.getElementById('bit-alberca-select').dispatchEvent(new Event('change'));
        this.renderInventarioDosing();
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());