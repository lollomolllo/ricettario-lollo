// js/app.js

// --- VARIABILI GLOBALI E PREFERENZE ---
let idRicettaInModifica = null;
let urlImmagineInModifica = null;

const PREFS_KEY = 'erp_ricettario_prefs';

function getPrefs() {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) || { defaultView: 'grid', theme: 'light', defaultGrouped: true, defaultCalendarView: 'lista' };
}

function savePrefs(prefs) { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); }
function applicaTema() { document.documentElement.setAttribute('data-bs-theme', getPrefs().theme); }

applicaTema();

// --- 1. IL GUARDIANO (Avvio App) ---
document.addEventListener('DOMContentLoaded', async () => {
    const session = await API.getSession();
    if (!session) return; // Se non loggato, resta sul form

    document.getElementById('login-container').classList.add('d-none');
    document.getElementById('main-app-container').classList.remove('d-none');

    inizializzaNavbar();
    UI.renderElenco();
    initElenco();
});

// --- 2. LOGICA NAVBAR UNIFICATA E BLINDATA ---
function inizializzaNavbar() {
    const navElenco = document.getElementById('nav-elenco');
    const navCalendario = document.getElementById('nav-calendario');
    const navSpesa = document.getElementById('nav-spesa');
    const navImpostazioni = document.getElementById('nav-impostazioni');
    const navLogout = document.getElementById('nav-logout');

    const botElenco = document.getElementById('bot-nav-elenco');
    const botCalendario = document.getElementById('bot-nav-calendario');
    const botSpesa = document.getElementById('bot-nav-spesa');
    const botImpostazioni = document.getElementById('bot-nav-impostazioni');

    function setActiveNav(tag) {
        document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(el => el.classList.remove('active'));
        if (tag === 'elenco') { if (navElenco) navElenco.classList.add('active'); if (botElenco) botElenco.classList.add('active'); }
        if (tag === 'calendario') { if (navCalendario) navCalendario.classList.add('active'); if (botCalendario) botCalendario.classList.add('active'); }
        if (tag === 'spesa') { if (navSpesa) navSpesa.classList.add('active'); if (botSpesa) botSpesa.classList.add('active'); }
        if (tag === 'impostazioni') { if (navImpostazioni) navImpostazioni.classList.add('active'); if (botImpostazioni) botImpostazioni.classList.add('active'); }
    }

    // Qui abbiamo usato le Arrow Function () => { ... } per non perdere il contesto di UI!
    const gestisciClick = (e, tag, action) => {
        if (e) e.preventDefault();
        setActiveNav(tag);
        action();
        window.scrollTo(0, 0);
    };

    if (navElenco) navElenco.addEventListener('click', (e) => gestisciClick(e, 'elenco', () => { UI.renderElenco(); initElenco(); }));
    if (navCalendario) navCalendario.addEventListener('click', (e) => gestisciClick(e, 'calendario', () => { UI.renderCalendario(); initCalendario(); }));
    if (navSpesa) navSpesa.addEventListener('click', (e) => gestisciClick(e, 'spesa', () => { UI.renderSpesa(); initSpesa(); }));
    if (navImpostazioni) navImpostazioni.addEventListener('click', (e) => gestisciClick(e, 'impostazioni', () => { UI.renderImpostazioni(); initImpostazioni(); }));

    if (botElenco) botElenco.addEventListener('click', (e) => gestisciClick(e, 'elenco', () => { UI.renderElenco(); initElenco(); }));
    if (botCalendario) botCalendario.addEventListener('click', (e) => gestisciClick(e, 'calendario', () => { UI.renderCalendario(); initCalendario(); }));
    if (botSpesa) botSpesa.addEventListener('click', (e) => gestisciClick(e, 'spesa', () => { UI.renderSpesa(); initSpesa(); }));
    if (botImpostazioni) botImpostazioni.addEventListener('click', (e) => gestisciClick(e, 'impostazioni', () => { UI.renderImpostazioni(); initImpostazioni(); }));

    if (navLogout) { navLogout.addEventListener('click', async (e) => { e.preventDefault(); await API.logout(); window.location.reload(); }); }
}

// --- 3. LOGIN ---
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = e.target.querySelector('button');
    const errDiv = document.getElementById('login-error');

    btn.disabled = true; btn.textContent = "Verifica in corso..."; errDiv.classList.add('d-none');
    try { await API.login(email, password); window.location.reload(); }
    catch (err) { errDiv.classList.remove('d-none'); btn.disabled = false; btn.textContent = "Accedi al Ricettario"; }
});

async function loadDizionari() {
    UI.renderListaCategorie(await API.getCategorie());
    UI.renderListaTag(await API.getTags());
    UI.renderListaIngredientiDizionario(await API.getDizionarioIngredienti());
}

async function initImpostazioni() {
    const prefs = getPrefs();
    document.getElementById('pref-view').value = prefs.defaultView || 'grid';
    document.getElementById('pref-theme').value = prefs.theme || 'light';
    document.getElementById('pref-grouped').value = prefs.defaultGrouped !== false ? 'true' : 'false';
    document.getElementById('pref-calendar-view').value = prefs.defaultCalendarView || 'lista';

    document.getElementById('pref-view').addEventListener('change', (e) => { prefs.defaultView = e.target.value; savePrefs(prefs); });
    document.getElementById('pref-theme').addEventListener('change', (e) => { prefs.theme = e.target.value; savePrefs(prefs); applicaTema(); });
    document.getElementById('pref-grouped').addEventListener('change', (e) => { prefs.defaultGrouped = (e.target.value === 'true'); savePrefs(prefs); });
    document.getElementById('pref-calendar-view').addEventListener('change', (e) => { prefs.defaultCalendarView = e.target.value; savePrefs(prefs); });

    await loadDizionari();

    document.getElementById('btn-add-categoria').addEventListener('click', async () => { const v = document.getElementById('input-categoria').value.trim(); if (v && !(await API.getCategorie()).some(c => c.nome.toLowerCase() === v.toLowerCase())) { await API.addCategoria(v); document.getElementById('input-categoria').value = ''; await loadDizionari(); } });
    document.getElementById('btn-add-tag').addEventListener('click', async () => { const v = document.getElementById('input-tag').value.trim(); if (v && !(await API.getTags()).some(t => t.nome.toLowerCase() === v.toLowerCase())) { await API.addTag(v); document.getElementById('input-tag').value = ''; await loadDizionari(); } });

    // LOGICA NUOVO DIZIONARIO INGREDIENTI
    document.getElementById('btn-add-ingrediente-diz').addEventListener('click', async () => {
        const nome = document.getElementById('input-ing-nome').value.trim();
        const unita = document.getElementById('input-ing-unita').value.trim();
        if (nome && unita) {
            const dbIng = await API.getDizionarioIngredienti();
            if (dbIng.some(i => i.nome.toLowerCase() === nome.toLowerCase())) { alert("Ingrediente già presente!"); return; }
            await API.addIngredienteDizionario(nome, unita);
            document.getElementById('input-ing-nome').value = ''; document.getElementById('input-ing-unita').value = '';
            await loadDizionari();
        } else { alert("Inserisci sia il nome che le unità di misura ammesse!"); }
    });

    document.getElementById('lista-categorie').addEventListener('click', async (e) => { if (e.target.classList.contains('btn-delete-categoria') && confirm('Sicuro?')) { await API.deleteCategoria(e.target.getAttribute('data-id')); await loadDizionari(); } });
    document.getElementById('lista-tag').addEventListener('click', async (e) => { if (e.target.classList.contains('btn-delete-tag') && confirm('Sicuro?')) { await API.deleteTag(e.target.getAttribute('data-id')); await loadDizionari(); } });
    document.getElementById('lista-ingredienti-diz').addEventListener('click', async (e) => { if (e.target.classList.contains('btn-delete-ingrediente-diz') && confirm('Vuoi eliminare questo ingrediente dal dizionario centrale?')) { await API.deleteIngredienteDizionario(e.target.getAttribute('data-id')); await loadDizionari(); } });
}
// ==========================================
// 2. INSERIMENTO E MODIFICA (Form)
// ==========================================
async function initInserimento() {
    let categorieDB = [], tagsDB = [], ricetteDB = [], dizionarioIngredientiDB = [];
    let opzioniIngredientiHTML = '<option value="">Seleziona ingrediente...</option>';
    let opzioniRicetteHTML = '<option value="">Seleziona ricetta...</option>'; // <--- AGGIUNGI QUESTA
    if (!document.getElementById('dizionario-ricette')) {
        document.body.insertAdjacentHTML('beforeend', `<datalist id="dizionario-ricette"></datalist>`);
    }

    try {
        const [categorie, tags, ricette, dizIng] = await Promise.all([API.getCategorie(), API.getTags(), API.getRicetteElencoBreve(), API.getDizionarioIngredienti()]);
        categorieDB = categorie; tagsDB = tags; ricetteDB = ricette; dizionarioIngredientiDB = dizIng;

        document.getElementById('dizionario-ricette').innerHTML = ricette.map(r => `<option value="${r.nome}">`).join('');

        const selectCat = document.getElementById('ricetta-categoria');
        selectCat.innerHTML = '<option value="">Seleziona...</option>';
        categorie.forEach(c => selectCat.innerHTML += `<option value="${c.id}">${c.nome}</option>`);

        document.getElementById('container-tags').innerHTML = tags.map(t => `<div class="form-check form-check-inline"><input class="form-check-input checkbox-tag" type="checkbox" value="${t.id}" id="tag-${t.id}"><label class="form-check-label" for="tag-${t.id}">${t.nome}</label></div>`).join('') || '<span class="text-muted small">Nessun tag.</span>';

        dizIng.forEach(ing => opzioniIngredientiHTML += `<option value="${ing.nome}">${ing.nome}</option>`);
        ricette.forEach(r => opzioniRicetteHTML += `<option value="${r.nome}">${r.nome}</option>`);
    } catch (e) { console.error("Errore caricamento dizionari:", e); }

    // --- AGGIUNTA RIGHE DINAMICHE ---
    document.getElementById('btn-add-ingrediente').addEventListener('click', () => {
        document.getElementById('container-ingredienti').insertAdjacentHTML('beforeend', UI.getIngredienteRowHTML(opzioniIngredientiHTML));
    });

    document.getElementById('btn-add-step').addEventListener('click', () => {
        document.getElementById('container-procedimento').insertAdjacentHTML('beforeend', UI.getStepRowHTML());
        aggiornaNumeriStep();
    });

    document.getElementById('btn-add-sottoricetta').addEventListener('click', () => {
        document.getElementById('container-sottoricette').insertAdjacentHTML('beforeend', UI.getSottoricettaRowHTML(opzioniRicetteHTML));
    });

    // --- MAGIA: GESTIONE AUTOMATICA DELLE UNITÀ DI MISURA ---
    document.getElementById('container-ingredienti').addEventListener('change', (e) => {
        // 1. Logica quando selezioni un INGREDIENTE
        if (e.target.classList.contains('ing-nome')) {
            const nomeScelto = e.target.value;
            const selectUnita = e.target.closest('.riga-ingrediente').querySelector('.ing-unita');

            selectUnita.innerHTML = ''; // Svuota l'opzione vuota

            const ingTrovato = dizionarioIngredientiDB.find(i => i.nome === nomeScelto);
            if (ingTrovato) {
                const unitaAmmesse = ingTrovato.unita_misura.split(',').map(u => u.trim());
                unitaAmmesse.forEach((u, index) => {
                    selectUnita.innerHTML += `<option value="${u}" ${index === 0 ? 'selected' : ''}>${u}</option>`;
                });
                // Forza l'aggiornamento per far scattare il controllo "q.b."
                selectUnita.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        // 2. Logica magica quando l'UNITÀ DI MISURA è "q.b."
        if (e.target.classList.contains('ing-unita')) {
            const riga = e.target.closest('.riga-ingrediente');
            const qtaInput = riga.querySelector('.ing-qta');
            const stepperGroup = riga.querySelector('.stepper-group');

            if (e.target.value === 'q.b.') {
                stepperGroup.classList.add('d-none'); // Nasconde il campo quantità
                qtaInput.removeAttribute('required'); // Non è più obbligatorio
                qtaInput.value = ''; // Lo svuota
            } else {
                stepperGroup.classList.remove('d-none'); // Lo fa riapparire
                qtaInput.setAttribute('required', 'required'); // Torna obbligatorio
            }
        }
    });

    // --- GESTIONE CLICK SUI BOTTONI (Elimina, Sposta Su, Sposta Giù) ---
    document.getElementById('form-ricetta').addEventListener('click', (e) => {
        // Elimina Riga
        if (e.target.classList.contains('btn-remove-row')) {
            e.target.closest('.row').remove();
            aggiornaNumeriStep();
        }
        // Sposta Su
        if (e.target.classList.contains('btn-move-up')) {
            const row = e.target.closest('.row');
            if (row.previousElementSibling) {
                row.parentNode.insertBefore(row, row.previousElementSibling);
                aggiornaNumeriStep(); // Aggiorna i numeri 1, 2, 3...
            }
        }
        // Sposta Giù
        if (e.target.classList.contains('btn-move-down')) {
            const row = e.target.closest('.row');
            if (row.nextElementSibling) {
                row.parentNode.insertBefore(row.nextElementSibling, row);
                aggiornaNumeriStep(); // Aggiorna i numeri 1, 2, 3...
            }
        }
    });

    // Eliminazione righe
    document.getElementById('form-ricetta').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-row')) { e.target.closest('.row').remove(); aggiornaNumeriStep(); }
    });

    // ==========================================
    // LOGICA DI IMPORTAZIONE TXT ANTIPROIETTILE
    // ==========================================
    const btnImport = document.getElementById('btn-import-txt');
    const inputImport = document.getElementById('input-import-txt');

    if (btnImport && inputImport) {
        btnImport.addEventListener('click', (e) => { e.preventDefault(); inputImport.click(); });

        inputImport.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                const testo = event.target.result;
                const blocchi = testo.split('=== RICETTA ===').map(b => b.trim()).filter(b => b !== '');

                if (blocchi.length === 0) { alert("Nessuna ricetta trovata."); return; }

                const sceltaSalvataggio = confirm(`Ho trovato ${blocchi.length} ricette nel file.\n\nVuoi SALVARE DIRETTAMENTE nel database (premendo OK)?\n\nPremi ANNULLA per caricare l'anteprima nel form.`);

                let ricetteProcessate = [];
                for (let blocco of blocchi) {
                    const estraiCampo = (chiave) => { const match = blocco.match(new RegExp(`${chiave}:\\s*(.*)`, 'i')); return match ? match[1].trim() : ''; };
                    const estraiSezione = (titolo) => {
                        const parti = blocco.split(new RegExp(`--- ${titolo} ---`, 'i'));
                        if (parti.length < 2) return '';
                        let str = parti[1];
                        const nextHeader = str.match(/--- [A-Z]+ ---/i);
                        if (nextHeader) str = str.substring(0, nextHeader.index);
                        return str.trim();
                    };

                    const nome = estraiCampo('NOME'); if (!nome) continue;
                    let id_categoria = null; const catNome = estraiCampo('CATEGORIA');
                    if (catNome) { const catTrovata = categorieDB.find(c => c.nome.toLowerCase() === catNome.toLowerCase()); if (catTrovata) id_categoria = catTrovata.id; }

                    let tagsSpuntati = [];
                    const tagsString = estraiCampo('TAGS');
                    if (tagsString) { tagsString.split(',').map(t => t.trim().toLowerCase()).forEach(nt => { const tTrovato = tagsDB.find(t => t.nome.toLowerCase() === nt); if (tTrovato) tagsSpuntati.push(tTrovato.id); }); }

                    const ricettaData = {
                        nome: nome, id_categoria: id_categoria, porzioni_base: parseFloat(estraiCampo('PORZIONI').replace(',', '.')) || 1, unita_porzioni: estraiCampo('UNITA') || 'pz',
                        tempo_riposo_ore: parseFloat(estraiCampo('RIPOSO \\(ore\\)').replace(',', '.')) || 0, tempo_cottura_min: parseInt(estraiCampo('COTTURA \\(min\\)')) || 0,
                        fonte: estraiCampo('FONTE'), link_fonte: estraiCampo('LINK'), note: estraiCampo('NOTE'), url_immagine: estraiCampo('IMMAGINE') || null
                    };

                    const ingredientiData = [];
                    const bloccoIng = estraiSezione('INGREDIENTI');
                    if (bloccoIng) {
                        bloccoIng.split('\n').forEach(linea => {
                            let l = linea.trim().replace(/^[\-\*\•]\s*/, '');
                            if (l.includes('|')) { const parti = l.split('|').map(p => p.trim()); if (parti.length >= 2) ingredientiData.push({ nome: parti[0], qta: parseFloat(parti[1].replace(',', '.')) || 0, unita: parti[2] || '' }); }
                        });
                    }

                    const procedimentoData = [];
                    const bloccoProc = estraiSezione('PROCEDIMENTO');
                    if (bloccoProc) {
                        bloccoProc.split('\n').forEach(linea => { let l = linea.trim(); if (l !== '') { l = l.replace(/^\d+[\.\-\)]\s*/, ''); procedimentoData.push({ desc: l }); } });
                    }

                    const sottoricetteData = [];
                    const bloccoSr = estraiSezione('SOTTORICETTE');
                    if (bloccoSr) {
                        bloccoSr.split('\n').forEach(linea => {
                            let l = linea.trim().replace(/^[\-\*\•]\s*/, '');
                            if (l.includes('|')) { const parti = l.split('|').map(p => p.trim()); if (parti.length >= 2) { const ricTrovata = ricetteDB.find(r => r.nome.toLowerCase() === parti[0].toLowerCase()); if (ricTrovata) sottoricetteData.push({ id_figlia: ricTrovata.id, moltiplicatore: parseFloat(parti[1].replace(',', '.')) || 1 }); } }
                        });
                    }

                    ricetteProcessate.push({ ricettaData, ingredientiData, procedimentoData, tagsSpuntati, sottoricetteData });
                }

                if (ricetteProcessate.length === 0) return;

                if (sceltaSalvataggio) {
                    btnImport.disabled = true; btnImport.textContent = "Salvataggio...";
                    try {
                        for (let r of ricetteProcessate) {
                            if (r.ricettaData.url_immagine && r.ricettaData.url_immagine.startsWith('http')) {
                                try { const resp = await fetch(r.ricettaData.url_immagine); const blob = await resp.blob(); const file = new File([blob], `img_importata_${Date.now()}.jpg`, { type: blob.type }); r.ricettaData.url_immagine = await API.uploadImmagine(file); } catch (e) { console.warn("Errore download immagine"); }
                            }
                            await API.salvaRicettaCompleta(r.ricettaData, r.ingredientiData, r.procedimentoData, r.tagsSpuntati, r.sottoricetteData);
                        }
                        alert(`Successo! Importate direttamente ${ricetteProcessate.length} ricette.`); document.getElementById('nav-elenco').click();
                    } catch (err) { alert("Errore salvataggio: " + err.message); } finally { btnImport.disabled = false; btnImport.innerHTML = "📄 Importa da TXT"; }
                } else {
                    const prima = ricetteProcessate[0];
                    if (blocchi.length > 1) alert("Attenzione: verrà pre-compilata SOLO la prima ricetta del file.");

                    document.getElementById('ricetta-nome').value = prima.ricettaData.nome;
                    if (prima.ricettaData.id_categoria) document.getElementById('ricetta-categoria').value = prima.ricettaData.id_categoria;
                    document.getElementById('ricetta-porzioni').value = prima.ricettaData.porzioni_base; document.getElementById('ricetta-unita').value = prima.ricettaData.unita_porzioni;
                    document.getElementById('ricetta-riposo').value = prima.ricettaData.tempo_riposo_ore; document.getElementById('ricetta-cottura').value = prima.ricettaData.tempo_cottura_min;
                    document.getElementById('ricetta-note').value = prima.ricettaData.note; document.getElementById('ricetta-fonte').value = prima.ricettaData.fonte || ''; document.getElementById('ricetta-link').value = prima.ricettaData.link_fonte || '';

                    urlImmagineInModifica = prima.ricettaData.url_immagine;
                    document.querySelectorAll('.checkbox-tag').forEach(chk => chk.checked = false);
                    prima.tagsSpuntati.forEach(tagId => { const cb = document.getElementById(`tag-${tagId}`); if (cb) cb.checked = true; });

                    document.getElementById('container-ingredienti').innerHTML = ''; document.getElementById('container-procedimento').innerHTML = ''; document.getElementById('container-sottoricette').innerHTML = '';

                    prima.ingredientiData.forEach(ing => {
                        document.getElementById('btn-add-ingrediente').click();
                        const riga = document.getElementById('container-ingredienti').lastElementChild;

                        riga.querySelector('.ing-nome').value = ing.nome;
                        riga.querySelector('.ing-nome').dispatchEvent(new Event('change', { bubbles: true }));

                        riga.querySelector('.ing-unita').value = ing.unita;
                        riga.querySelector('.ing-unita').dispatchEvent(new Event('change', { bubbles: true })); // Fa scattare il controllo q.b.

                        if (ing.unita !== 'q.b.') {
                            riga.querySelector('.ing-qta').value = ing.qta;
                        }
                    });

                    prima.procedimentoData.forEach(step => {
                        document.getElementById('btn-add-step').click();
                        const riga = document.getElementById('container-procedimento').lastElementChild;
                        const txtArea = riga.querySelector('.step-desc'); txtArea.value = step.desc; setTimeout(() => { txtArea.style.height = 'auto'; txtArea.style.height = txtArea.scrollHeight + 'px'; }, 10);
                    });

                    prima.sottoricetteData.forEach(sr => {
                        document.getElementById('btn-add-sottoricetta').click();
                        const riga = document.getElementById('container-sottoricette').lastElementChild;
                        const ricTrovata = ricetteDB.find(x => x.id === sr.id_figlia); riga.querySelector('.sr-nome').value = ricTrovata ? ricTrovata.nome : ''; riga.querySelector('.sr-moltiplicatore').value = sr.moltiplicatore;
                    });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            };
            reader.readAsText(file); e.target.value = '';
        });
    }

    // ==========================================
    // ELIMINAZIONE MANUALE
    // ==========================================
    const btnEliminaForm = document.getElementById('btn-elimina-ricetta-form');
    if (btnEliminaForm) {
        btnEliminaForm.addEventListener('click', async () => {
            if (!idRicettaInModifica) return;
            if (!confirm("Sei sicuro di voler eliminare definitivamente questa ricetta dal database?")) return;
            try {
                btnEliminaForm.disabled = true; btnEliminaForm.innerHTML = "🗑 Eliminazione in corso...";
                await API.deleteRicetta(idRicettaInModifica, urlImmagineInModifica);
                alert("Ricetta eliminata con successo!");
                idRicettaInModifica = null; urlImmagineInModifica = null; document.getElementById('nav-elenco').click();
            } catch (err) { alert("Errore durante l'eliminazione: " + err.message); btnEliminaForm.disabled = false; btnEliminaForm.innerHTML = "🗑 Elimina"; }
        });
    }

    // ==========================================
    // SALVATAGGIO MANUALE DEL FORM
    // ==========================================
    document.getElementById('form-ricetta').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById('btn-salva-ricetta-top');
        btnSubmit.disabled = true; btnSubmit.textContent = "Salvataggio in corso...";

        try {
            let url_immagine = urlImmagineInModifica;
            const fileInput = document.getElementById('ricetta-immagine');
            if (fileInput.files.length > 0) {
                url_immagine = await API.uploadImmagine(fileInput.files[0]);
            } else if (url_immagine && url_immagine.startsWith('http') && !url_immagine.includes('supabase.co')) {
                try { const resp = await fetch(url_immagine); const blob = await resp.blob(); const file = new File([blob], `img_salvata_${Date.now()}.jpg`, { type: blob.type }); url_immagine = await API.uploadImmagine(file); } catch (e) { console.warn("Impossibile scaricare, uso link diretto"); }
            }

            const idCat = document.getElementById('ricetta-categoria').value;
            const ricettaData = {
                nome: document.getElementById('ricetta-nome').value.trim(), id_categoria: idCat ? parseInt(idCat) : null,
                porzioni_base: parseFloat(document.getElementById('ricetta-porzioni').value), unita_porzioni: document.getElementById('ricetta-unita').value.trim(),
                tempo_riposo_ore: parseFloat(document.getElementById('ricetta-riposo').value) || 0, tempo_cottura_min: parseInt(document.getElementById('ricetta-cottura').value) || 0,
                fonte: document.getElementById('ricetta-fonte')?.value.trim() || null, link_fonte: document.getElementById('ricetta-link')?.value.trim() || null,
                note: document.getElementById('ricetta-note')?.value.trim() || null, url_immagine: url_immagine
            };

            const tagsSpuntati = Array.from(document.querySelectorAll('.checkbox-tag:checked')).map(cb => cb.value);

            const ingredientiData = Array.from(document.querySelectorAll('.riga-ingrediente')).map(r => ({
                nome: r.querySelector('.ing-nome').value.trim(), qta: parseFloat(r.querySelector('.ing-qta').value), unita: r.querySelector('.ing-unita').value.trim()
            })).filter(i => i.nome !== "");

            const procedimentoData = Array.from(document.querySelectorAll('.riga-step')).map(r => ({ desc: r.querySelector('.step-desc').value.trim() })).filter(s => s.desc !== "");

            const sottoricetteData = Array.from(document.querySelectorAll('.riga-sottoricetta')).map(r => {
                const nomeCercato = r.querySelector('.sr-nome').value.trim();
                const ricTrovata = ricetteDB.find(x => x.nome.toLowerCase() === nomeCercato.toLowerCase());
                return { id_figlia: ricTrovata ? ricTrovata.id : "", moltiplicatore: parseFloat(r.querySelector('.sr-moltiplicatore').value) };
            }).filter(sr => sr.id_figlia !== "" && !isNaN(sr.moltiplicatore));

            if (idRicettaInModifica) { await API.aggiornaRicettaCompleta(idRicettaInModifica, ricettaData, ingredientiData, procedimentoData, tagsSpuntati, sottoricetteData); alert("Ricetta aggiornata!"); }
            else { await API.salvaRicettaCompleta(ricettaData, ingredientiData, procedimentoData, tagsSpuntati, sottoricetteData); alert("Nuova ricetta salvata!"); }

            idRicettaInModifica = null; urlImmagineInModifica = null; document.getElementById('nav-elenco').click();

        } catch (error) { console.error(error); alert("Errore: " + error.message); btnSubmit.disabled = false; btnSubmit.innerHTML = idRicettaInModifica ? "💾 Salva Modifiche" : "💾 Salva Ricetta"; }
    });

    // Avvia automaticamente il caricamento righe solo se è una Nuova Ricetta (dopo aver caricato tutti i listener)
    if (!idRicettaInModifica) {
        document.getElementById('btn-add-ingrediente').click();
        document.getElementById('btn-add-step').click();
    }
}
function aggiornaNumeriStep() { document.querySelectorAll('.riga-step .step-number').forEach((el, index) => el.textContent = index + 1); }

// ==========================================
// 3. ELENCO (Galleria)
// ==========================================
async function initElenco() {
    try {
        const [ricette, categorie, tags] = await Promise.all([API.getRicetteGalleria(), API.getCategorie(), API.getTags()]);
        let cacheRicette = ricette;

        const prefs = getPrefs();
        let currentView = prefs.defaultView || 'grid';
        let isGrouped = prefs.defaultGrouped !== false; // <-- Legge l'impostazione salvata!

        const btnNuovaRicetta = document.getElementById('btn-nuova-ricetta-elenco');
        if (btnNuovaRicetta) {
            btnNuovaRicetta.addEventListener('click', () => {
                idRicettaInModifica = null; urlImmagineInModifica = null;
                document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(el => el.classList.remove('active'));
                UI.renderInserimento(); initInserimento();
            });
        }

        const btnGrid = document.getElementById('btn-view-grid');
        const btnList = document.getElementById('btn-view-list');
        const btnCompact = document.getElementById('btn-view-compact');
        const toggleRaggruppa = document.getElementById('toggle-raggruppa');

        // <-- Allinea l'interruttore grafico alla preferenza salvata
        if (toggleRaggruppa) toggleRaggruppa.checked = isGrouped;
        // Funzione per aggiornare graficamente quale bottone è premuto
        function aggiornaBottoniVista() {
            [btnGrid, btnList, btnCompact].forEach(b => b.classList.remove('active'));
            if (currentView === 'list') btnList.classList.add('active');
            else if (currentView === 'compact') btnCompact.classList.add('active');
            else btnGrid.classList.add('active');
        }
        aggiornaBottoniVista();

        const selectCat = document.getElementById('filtro-categoria');
        categorie.forEach(c => selectCat.innerHTML += `<option value="${c.nome}">${c.nome}</option>`);
        const selectTag = document.getElementById('filtro-tag');
        tags.forEach(t => selectTag.innerHTML += `<option value="${t.nome}">${t.nome}</option>`);
        const inputTesto = document.getElementById('filtro-testo');

        function applicaFiltri(mantieniAperti = false) {
            const testo = inputTesto.value.toLowerCase().trim();
            const catScelta = selectCat.value;
            const tagScelto = selectTag.value;

            let categorieAperte = [];

            if (mantieniAperti === true && isGrouped) {
                document.querySelectorAll('#griglia-ricette .collapse.show').forEach(el => {
                    const nome = el.getAttribute('data-cat-nome');
                    if (nome) categorieAperte.push(nome);
                });
            }

            let filtrate = cacheRicette.filter(r => {
                const matchTesto = r.nome.toLowerCase().includes(testo);
                const matchCategoria = catScelta === "" || (r.categorie && r.categorie.nome === catScelta);
                const matchTag = tagScelto === "" || r.ricette_tags.map(rt => rt.tag.nome).includes(tagScelto);
                return matchTesto && matchCategoria && matchTag;
            });

            // Ordine alfabetico forzato
            filtrate.sort((a, b) => a.nome.localeCompare(b.nome));

            UI.renderCards(filtrate, currentView, isGrouped, categorieAperte);
        }

        // ASCOLTATORI
        if (toggleRaggruppa) {
            toggleRaggruppa.addEventListener('change', (e) => {
                isGrouped = e.target.checked;
                applicaFiltri(true);
            });
        }

        inputTesto.addEventListener('input', () => applicaFiltri(false));
        selectCat.addEventListener('change', () => applicaFiltri(false));
        selectTag.addEventListener('change', () => applicaFiltri(false));

        // Cliccando sui bottoni, aggiorniamo la variabile e la grafica
        btnGrid.addEventListener('click', () => { currentView = 'grid'; aggiornaBottoniVista(); applicaFiltri(true); });
        btnList.addEventListener('click', () => { currentView = 'list'; aggiornaBottoniVista(); applicaFiltri(true); });
        btnCompact.addEventListener('click', () => { currentView = 'compact'; aggiornaBottoniVista(); applicaFiltri(true); });

        applicaFiltri(false);

        document.getElementById('griglia-ricette').addEventListener('click', (e) => {
            const card = e.target.closest('.ricetta-card'); if (card) apriDettaglioRicetta(card.getAttribute('data-id'));
        });

    } catch (error) { console.error(error); document.getElementById('griglia-ricette').innerHTML = `<div class="col-12 alert alert-danger">Errore database.</div>`; }
}

// --- 7. DETTAGLIO RICETTA E CUCINA ---
async function apriDettaglioRicetta(id_ricetta) {
    UI.container.innerHTML = `<div class="text-center mt-5"><div class="spinner-border text-primary" role="status"></div></div>`;
    try {
        const ricetta = await API.getRicettaCompleta(id_ricetta);
        UI.renderDettaglio(ricetta);

        const inputRicalcolo = document.getElementById('input-ricalcolo');
        const listIng = document.getElementById('lista-ingredienti-ricalcolati');
        const contSotto = document.getElementById('container-sottoricette-ricalcolate');

        const btnCucina = document.getElementById('btn-cucina-ricetta');
        if (btnCucina) btnCucina.addEventListener('click', () => avviaModalitaCucina(ricetta, (parseFloat(inputRicalcolo.value) || ricetta.porzioni_base) / ricetta.porzioni_base));

        function ricalcolaBOM() {
            const rapporto = (parseFloat(inputRicalcolo.value) || 0) / ricetta.porzioni_base;
            listIng.innerHTML = ricetta.ingredienti.map(ing => `<li class="list-group-item d-flex justify-content-between align-items-center">${ing.nome_ingrediente}<span class="badge bg-dark rounded-pill fs-6">${Number((ing.quantita * rapporto).toFixed(2))} ${ing.unita_distinta}</span></li>`).join('') || '<li class="list-group-item">Nessun ingrediente</li>';

            let htmlSr = '';
            if (ricetta.sottoricette_esplose?.length > 0) {
                htmlSr += `<h5 class="fw-bold mb-3 mt-4 border-top pt-3">Sottoricette Incluse</h5>`;
                ricetta.sottoricette_esplose.forEach(sr => {
                    const f = sr.ricetta_figlia; const rapSr = rapporto * sr.moltiplicatore;
                    let subs = f.procedimento || []; subs.sort((a, b) => a.step_num - b.step_num);
                    htmlSr += `<div class="card border-warning mb-4 shadow-sm"><div class="card-header bg-warning text-dark fw-bold py-2 d-flex justify-content-between align-items-center"><span>↳ ${f.nome}</span><button class="btn btn-sm btn-dark btn-apri-sottoricetta" data-id="${f.id}">Apri Ricetta</button></div><div class="card-body p-0"><ul class="list-group list-group-flush small">`;
                    htmlSr += f.ingredienti.map(si => `<li class="list-group-item d-flex justify-content-between align-items-center bg-light">${si.nome_ingrediente}<span class="fw-bold">${Number((si.quantita * rapSr).toFixed(2))} ${si.unita_distinta}</span></li>`).join('');
                    htmlSr += `</ul>`;
                    if (subs.length > 0) { htmlSr += `<div class="p-3 border-top bg-white"><h6 class="fw-bold mb-2 small text-muted">PROCEDIMENTO:</h6>${subs.map(st => `<div class="mb-2 small"><strong>${st.step_num}.</strong> ${st.descrizione}</div>`).join('')}</div>`; }
                    htmlSr += `</div></div>`;
                });
            }
            contSotto.innerHTML = htmlSr;
        }

        ricalcolaBOM(); inputRicalcolo.addEventListener('input', ricalcolaBOM);

        document.getElementById('btn-torna-elenco').addEventListener('click', () => { UI.renderElenco(); initElenco(); });
        contSotto.addEventListener('click', (e) => { if (e.target.classList.contains('btn-apri-sottoricetta')) { window.scrollTo(0, 0); apriDettaglioRicetta(e.target.getAttribute('data-id')); } });

        // --- BOTTONE ELIMINA STORICO/USI ---
        const btnElimina = document.getElementById('btn-elimina-ricetta');
        if (btnElimina) btnElimina.addEventListener('click', async () => {
            try {
                const coinv = await API.getUsiComeSottoricetta(id_ricetta);
                if (coinv.length > 0 && !confirm(`⚠️ USATA IN:\n${coinv.map(n => "• " + n).join("\n")}\nProcedere forzatamente?`)) return;
                else if (coinv.length === 0 && !confirm("Sicuro di eliminare?")) return;
                btnElimina.disabled = true; await API.deleteRicetta(id_ricetta, btnElimina.getAttribute('data-img'));
                alert("Eliminata!"); UI.renderElenco(); initElenco();
            } catch (err) { alert("Errore: " + err.message); btnElimina.disabled = false; }
        });

        const btnStampa = document.getElementById('btn-stampa-ricetta');
        if (btnStampa) btnStampa.addEventListener('click', () => window.print());

        // --- GESTIONE BOTTONE MODIFICA ---
        const btnModifica = document.getElementById('btn-modifica-ricetta');
        if (btnModifica) {
            btnModifica.addEventListener('click', async () => {
                idRicettaInModifica = ricetta.id;
                urlImmagineInModifica = ricetta.url_immagine;

                // Pulisce il menu e inizializza il form
                document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(el => el.classList.remove('active'));
                UI.renderInserimento();
                await initInserimento();

                // 1. PRECOMPILA DATI GENERALI
                document.getElementById('ricetta-nome').value = ricetta.nome;
                if (ricetta.id_categoria) document.getElementById('ricetta-categoria').value = ricetta.id_categoria;
                document.getElementById('ricetta-porzioni').value = ricetta.porzioni_base;
                document.getElementById('ricetta-unita').value = ricetta.unita_porzioni;
                document.getElementById('ricetta-riposo').value = ricetta.tempo_riposo_ore;
                document.getElementById('ricetta-cottura').value = ricetta.tempo_cottura_min;
                document.getElementById('ricetta-note').value = ricetta.note || '';
                document.getElementById('ricetta-fonte').value = ricetta.fonte || '';
                document.getElementById('ricetta-link').value = ricetta.link_fonte || '';

                // Tags
                document.querySelectorAll('.checkbox-tag').forEach(chk => chk.checked = false);
                if (ricetta.ricette_tags) {
                    ricetta.ricette_tags.forEach(rt => {
                        // Proviamo a rimettere la spunta usando l'ID
                        if (rt.id_tag) {
                            const cb = document.getElementById(`tag-${rt.id_tag}`);
                            if (cb) cb.checked = true;
                        } else if (rt.tag && rt.tag.nome) {
                            // Se l'ID non c'è, lo cerchiamo intelligentemente per nome!
                            const labels = Array.from(document.querySelectorAll('.form-check-label'));
                            const labelTrovata = labels.find(l => l.textContent.trim().toLowerCase() === rt.tag.nome.toLowerCase());
                            if (labelTrovata) {
                                const cb = document.getElementById(labelTrovata.getAttribute('for'));
                                if (cb) cb.checked = true;
                            }
                        }
                    });
                }

                // Svuota i contenitori prima di riempirli
                document.getElementById('container-ingredienti').innerHTML = '';
                document.getElementById('container-procedimento').innerHTML = '';
                document.getElementById('container-sottoricette').innerHTML = '';

                // 2. PRECOMPILA INGREDIENTI
                if (ricetta.ingredienti) {
                    ricetta.ingredienti.forEach(ing => {
                        document.getElementById('btn-add-ingrediente').click();
                        const riga = document.getElementById('container-ingredienti').lastElementChild;
                        riga.querySelector('.ing-nome').value = ing.nome_ingrediente || ing.nome;
                        riga.querySelector('.ing-nome').dispatchEvent(new Event('change', { bubbles: true }));

                        const unitaSalvata = ing.unita_distinta || ing.unita_misura || ing.unita || '';
                        riga.querySelector('.ing-unita').value = unitaSalvata;
                        riga.querySelector('.ing-unita').dispatchEvent(new Event('change', { bubbles: true })); // Fa scattare il controllo q.b.

                        if (unitaSalvata !== 'q.b.') {
                            riga.querySelector('.ing-qta').value = ing.quantita || ing.qta;
                        }
                    });
                }

                // 3. PRECOMPILA PROCEDIMENTO
                if (ricetta.procedimento) {
                    ricetta.procedimento.forEach(step => {
                        document.getElementById('btn-add-step').click();
                        const riga = document.getElementById('container-procedimento').lastElementChild;
                        const txtArea = riga.querySelector('.step-desc');
                        txtArea.value = step.descrizione || step.desc;
                        setTimeout(() => { txtArea.style.height = 'auto'; txtArea.style.height = txtArea.scrollHeight + 'px'; }, 10);
                    });
                }

                // 4. PRECOMPILA SOTTORICETTE
                if (ricetta.sottoricette_esplose || ricetta.sottoricette) {
                    const srArray = ricetta.sottoricette_esplose || ricetta.sottoricette;
                    srArray.forEach(sr => {
                        document.getElementById('btn-add-sottoricetta').click();
                        const riga = document.getElementById('container-sottoricette').lastElementChild;
                        riga.querySelector('.sr-nome').value = sr.ricetta_figlia ? sr.ricetta_figlia.nome : sr.nome;
                        riga.querySelector('.sr-moltiplicatore').value = sr.moltiplicatore;
                    });
                }

                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

    } catch (error) {
        // 👇 ADESSO TI STAMPA IL VERO ERRORE SIA NELLA CONSOLE CHE A SCHERMO
        console.error("Errore critico in apriDettaglioRicetta:", error);
        UI.container.innerHTML = `<div class="alert alert-danger m-4"><strong>Errore di caricamento:</strong> ${error.message}</div>`;
    }
}

let wakeLockCucina = null;
async function avviaModalitaCucina(ricetta, rapportoPorzioni) {
    try { if ('wakeLock' in navigator) wakeLockCucina = await navigator.wakeLock.request('screen'); } catch (err) { }
    let htmlIngredienti = '<h3 class="mb-4 text-warning fw-bold">Ingredienti</h3><ul class="list-group list-group-flush fs-5">';
    ricetta.ingredienti.forEach(ing => { htmlIngredienti += `<li class="list-group-item bg-transparent text-light border-secondary d-flex justify-content-between align-items-center ps-0 pe-0">${ing.nome_ingrediente} <strong class="text-warning">${Number((ing.quantita * rapportoPorzioni).toFixed(2))} ${ing.unita_distinta}</strong></li>`; });
    if (ricetta.sottoricette_esplose?.length > 0) {
        ricetta.sottoricette_esplose.forEach(sr => {
            htmlIngredienti += `<h5 class="mt-4 mb-2 text-info fw-bold">↳ ${sr.ricetta_figlia.nome}</h5>`;
            sr.ricetta_figlia.ingredienti.forEach(subIng => htmlIngredienti += `<li class="list-group-item bg-transparent text-light border-secondary d-flex justify-content-between align-items-center ps-0 pe-0">${subIng.nome_ingrediente} <strong class="text-info">${Number((subIng.quantita * (rapportoPorzioni * sr.moltiplicatore)).toFixed(2))} ${subIng.unita_distinta}</strong></li>`);
        });
    }
    htmlIngredienti += '</ul>';

    let htmlSteps = '<h3 class="mb-4 text-warning fw-bold">Procedimento</h3>';
    if (ricetta.sottoricette_esplose?.length > 0) {
        ricetta.sottoricette_esplose.forEach(sr => {
            let subs = sr.ricetta_figlia.procedimento || []; subs.sort((a, b) => a.step_num - b.step_num);
            if (subs.length > 0) { htmlSteps += `<h4 class="mt-5 mb-3 text-info fw-bold">↳ ${sr.ricetta_figlia.nome}</h4>` + subs.map(st => `<div class="cooking-step-card" onclick="this.classList.toggle('fatto')"><span class="badge bg-info text-dark me-2 fs-5">${st.step_num}</span> ${st.descrizione}</div>`).join(''); }
        });
        htmlSteps += `<h4 class="mt-5 mb-3 text-warning fw-bold">Assemblaggio finale: ${ricetta.nome}</h4>`;
    }
    let mainSteps = ricetta.procedimento || []; mainSteps.sort((a, b) => a.step_num - b.step_num);
    htmlSteps += mainSteps.map(st => `<div class="cooking-step-card" onclick="this.classList.toggle('fatto')"><span class="badge bg-warning text-dark me-2 fs-5">${st.step_num}</span> ${st.descrizione}</div>`).join('');
    htmlSteps += `<div class="text-center mt-5 mb-5"><h4 class="text-success">🎉 Preparazione Completata!</h4></div>`;

    const overlay = document.createElement('div'); overlay.id = 'cooking-mode-overlay';
    overlay.innerHTML = `<div class="cooking-header"><h2 class="mb-0 text-white fw-bold">${ricetta.nome}</h2><button class="btn btn-outline-danger btn-lg fw-bold" id="btn-chiudi-cucina">✖ Chiudi</button></div><div class="cooking-body"><div class="cooking-ingredients">${htmlIngredienti}</div><div class="cooking-steps">${htmlSteps}</div></div>`;
    document.body.appendChild(overlay);

    try { await document.documentElement.requestFullscreen(); } catch (e) { }
    document.getElementById('btn-chiudi-cucina').addEventListener('click', async () => {
        if (document.fullscreenElement) await document.exitFullscreen();
        if (wakeLockCucina) { wakeLockCucina.release(); wakeLockCucina = null; }
        overlay.remove();
    });
}

// --- 8. CALENDARIO E STORICO ---
async function initCalendario() {
    try {
        let [storico, ricette] = await Promise.all([API.getStorico(), API.getRicetteElencoBreve()]);

        // Leggiamo la preferenza dal localStorage
        let meseCorrente = new Date().getMonth();
        let annoCorrente = new Date().getFullYear();
        let vistaAttiva = getPrefs().defaultCalendarView || 'lista';

        const selectRicetta = document.getElementById('prod-ricetta');
        selectRicetta.innerHTML = '<option value="">-- Seleziona la ricetta prodotta --</option>' + ricette.map(r => `<option value="${r.id}">${r.nome}</option>`).join('');
        document.getElementById('prod-data').valueAsDate = new Date();

        // Coloriamo il bottone giusto in base a come si apre
        const btnViewLista = document.getElementById('btn-view-lista');
        const btnViewGriglia = document.getElementById('btn-view-griglia');
        if (vistaAttiva === 'griglia') {
            if (btnViewGriglia) btnViewGriglia.classList.add('active');
            if (btnViewLista) btnViewLista.classList.remove('active');
        } else {
            if (btnViewLista) btnViewLista.classList.add('active');
            if (btnViewGriglia) btnViewGriglia.classList.remove('active');
        }
        function aggiornaStatistiche() {
            const storicoAnno = storico.filter(s => new Date(s.data_svolgimento).getFullYear() === new Date().getFullYear());
            const conteggio = {}; storicoAnno.forEach(s => conteggio[s.ricette.nome] = (conteggio[s.ricette.nome] || 0) + 1);
            let top = "Nessuna", max = 0; for (let [n, c] of Object.entries(conteggio)) { if (c > max) { max = c; top = n; } }
            document.getElementById('dashboard-statistiche').innerHTML = `<div class="col-md-4 mb-3"><div class="card bg-primary text-white shadow-sm text-center h-100 py-2"><div class="card-body"><h6 class="text-uppercase mb-1">Produzioni ${new Date().getFullYear()}</h6><h2 class="display-6 fw-bold mb-0">${storicoAnno.length}</h2></div></div></div><div class="col-md-8 mb-3"><div class="card bg-white border-primary shadow-sm h-100 py-2"><div class="card-body d-flex align-items-center justify-content-between"><div><h6 class="text-muted text-uppercase mb-1">Ricetta più prodotta</h6><h4 class="fw-bold text-dark mb-0">${top} <small class="text-muted fs-6">(${max} volte)</small></h4></div><div class="text-primary display-6">🏆</div></div></div></div>`;
        }

        function renderVista() {
            const container = document.getElementById('calendario-view-container');
            if (vistaAttiva === 'lista') {
                container.innerHTML = '<div class="list-group list-group-flush">' + (storico.length === 0 ? '<p class="text-muted">Nessuna produzione registrata.</p>' : storico.map(s => `<div class="list-group-item list-group-item-action d-flex flex-column flex-md-row justify-content-md-between align-items-start align-items-md-center py-3 gap-2"><div><h6 class="mb-1 fw-bold text-primary">${s.ricette.nome}</h6><small class="text-muted">Prodotte: <strong>${s.porzioni_prodotte}</strong> porzioni</small></div><div class="d-flex w-100 w-md-auto justify-content-between justify-content-md-end align-items-center gap-3"><span class="badge bg-light text-dark border fs-6 shadow-sm">${new Date(s.data_svolgimento).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</span><button class="btn btn-sm btn-outline-danger shadow-sm btn-delete-produzione" data-id="${s.id}">🗑</button></div></div>`).join('')) + '</div>';
            } else {
                const primoGiorno = new Date(annoCorrente, meseCorrente, 1).getDay(); const offset = primoGiorno === 0 ? 6 : primoGiorno - 1;
                const giorniNelMese = new Date(annoCorrente, meseCorrente + 1, 0).getDate();
                let html = `<div class="d-flex justify-content-between align-items-center mb-3"><div><button class="btn btn-sm btn-outline-secondary" id="btn-mese-prec">◀ Prec</button><button class="btn btn-sm btn-outline-primary ms-1 fw-bold" id="btn-mese-oggi">Oggi</button></div><h5 class="fw-bold mb-0">${["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"][meseCorrente]} ${annoCorrente}</h5><button class="btn btn-sm btn-outline-secondary" id="btn-mese-succ">Succ ▶</button></div><div class="calendario-table-wrapper"><table class="table table-bordered table-fixed text-center" style="table-layout: fixed;"><thead class="bg-light"><tr><th>Lun</th><th>Mar</th><th>Mer</th><th>Gio</th><th>Ven</th><th>Sab</th><th>Dom</th></tr></thead><tbody><tr>`;
                let gSet = 0; for (let i = 0; i < offset; i++) { html += '<td class="bg-light"></td>'; gSet++; }
                for (let g = 1; g <= giorniNelMese; g++) {
                    if (gSet === 7) { html += '</tr><tr>'; gSet = 0; }
                    const prodOggi = storico.filter(s => s.data_svolgimento === `${annoCorrente}-${String(meseCorrente + 1).padStart(2, '0')}-${String(g).padStart(2, '0')}`);
                    html += `<td style="height: 100px; vertical-align: top;" class="p-1"><div class="fw-bold text-muted small text-end mb-1">${g}</div>${prodOggi.map(p => `<div class="badge bg-success d-flex justify-content-between align-items-center mb-1 shadow-sm px-2 py-1"><span class="text-truncate text-start" style="max-width:80%;">${p.ricette.nome}</span><span class="text-white ms-1 btn-delete-produzione" style="cursor:pointer;" data-id="${p.id}">✖</span></div>`).join('')}</td>`;
                    gSet++;
                }
                while (gSet < 7) { html += '<td class="bg-light"></td>'; gSet++; }
                container.innerHTML = html + '</tr></tbody></table></div>';
                document.getElementById('btn-mese-prec').addEventListener('click', () => { meseCorrente--; if (meseCorrente < 0) { meseCorrente = 11; annoCorrente--; } renderVista(); });
                document.getElementById('btn-mese-succ').addEventListener('click', () => { meseCorrente++; if (meseCorrente > 11) { meseCorrente = 0; annoCorrente++; } renderVista(); });
                document.getElementById('btn-mese-oggi').addEventListener('click', () => { meseCorrente = new Date().getMonth(); annoCorrente = new Date().getFullYear(); renderVista(); });
            }
        }
        aggiornaStatistiche(); renderVista();

        document.getElementById('btn-view-lista').addEventListener('click', (e) => { vistaAttiva = 'lista'; e.target.classList.add('active'); document.getElementById('btn-view-griglia').classList.remove('active'); renderVista(); });
        document.getElementById('btn-view-griglia').addEventListener('click', (e) => { vistaAttiva = 'griglia'; e.target.classList.add('active'); document.getElementById('btn-view-lista').classList.remove('active'); renderVista(); });

        document.getElementById('calendario-view-container').addEventListener('click', async (e) => {
            const btn = e.target.closest('.btn-delete-produzione');
            if (btn && confirm('Vuoi eliminare questa produzione?')) {
                btn.style.opacity = '0.5'; await API.deleteProduzione(btn.getAttribute('data-id'));
                storico = await API.getStorico(); aggiornaStatistiche(); renderVista();
            }
        });

        const fCont = document.getElementById('form-produzione-container');
        document.getElementById('btn-nuova-produzione').addEventListener('click', () => fCont.classList.remove('d-none'));
        document.getElementById('btn-annulla-produzione').addEventListener('click', () => fCont.classList.add('d-none'));

        let rSelCom = null;
        selectRicetta.addEventListener('change', async (e) => {
            const cDet = document.getElementById('prod-dettagli-dinamici'); cDet.innerHTML = ''; rSelCom = null;
            if (!e.target.value) return; cDet.innerHTML = '<div class="spinner-border spinner-border-sm text-success"></div>';
            try {
                rSelCom = await API.getRicettaCompleta(e.target.value);
                const genBlocco = (id, nome, porzioni, unita, isSr, noteAttuali) => `
                <div class="card border-${isSr ? 'warning' : 'primary'} mb-3 riga-produzione-item" data-id="${id}">
                    <div class="card-header bg-${isSr ? 'warning text-dark' : 'primary text-white'} py-2 fw-bold">
                        ${isSr ? '↳ Sottoricetta:' : 'Principale:'} ${nome}
                    </div>
                    <div class="card-body py-2">
                        <div class="row align-items-center mb-2">
                            <div class="col-md-4">
                                <div class="form-check form-switch">
                                    <input class="form-check-input check-porzioni-modificate" type="checkbox" id="cm-${id}">
                                    <label class="form-check-label small" for="cm-${id}">Modifica porzioni?</label>
                                </div>
                            </div>
                            <div class="col-md-8">
                                <div class="stepper-group contenitore-input-porzioni d-none w-100 shadow-sm mt-2">
                                    <span class="bg-light text-muted small px-2 border-end d-flex align-items-center">Prodotte:</span>
                                    <button type="button" class="stepper-btn px-2" tabindex="-1" onclick="this.nextElementSibling.stepDown(); this.nextElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">−</button>
                                    <input type="number" step="0.1" class="form-control stepper-input input-porzioni-reali px-0" value="${porzioni}" data-base="${porzioni}">
                                    <button type="button" class="stepper-btn px-2" tabindex="-1" onclick="this.previousElementSibling.stepUp(); this.previousElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">+</button>
                                    <span class="bg-light text-muted small px-2 border-start d-flex align-items-center">${unita}</span>
                                </div>
                            </div>
                        </div>
                        <div class="mt-2">
                            <input type="text" class="form-control input-note-produzione form-control-sm" placeholder="Aggiungi note (es. Torta Mario)">
                            <input type="hidden" class="vecchie-note-nascoste" value="${noteAttuali || ''}">
                        </div>
                    </div>
                </div>`;

                cDet.innerHTML = genBlocco(rSelCom.id, rSelCom.nome, rSelCom.porzioni_base, rSelCom.unita_porzioni, false, rSelCom.note) +
                    (rSelCom.sottoricette_esplose?.map(sr => genBlocco(sr.ricetta_figlia.id, sr.ricetta_figlia.nome, sr.ricetta_figlia.porzioni_base, sr.ricetta_figlia.unita_porzioni, true, sr.ricetta_figlia.note)).join('') || '');

                cDet.querySelectorAll('.check-porzioni-modificate').forEach(chk => chk.addEventListener('change', (ev) => ev.target.checked ? ev.target.closest('.card-body').querySelector('.contenitore-input-porzioni').classList.remove('d-none') : ev.target.closest('.card-body').querySelector('.contenitore-input-porzioni').classList.add('d-none')));
            } catch (err) { cDet.innerHTML = `<div class="alert alert-danger">Errore db: ${err.message}</div>`; }
        });

        document.getElementById('form-produzione').addEventListener('submit', async (e) => {
            e.preventDefault(); if (!rSelCom) return; const btn = e.target.querySelector('button[type="submit"]'); btn.disabled = true; btn.textContent = "Salvataggio...";
            try {
                const dataSv = document.getElementById('prod-data').value, dataIt = new Date(dataSv).toLocaleDateString('it-IT');
                let prodSalvare = [], noteAgg = [];
                document.querySelectorAll('.riga-produzione-item').forEach(b => {
                    const idR = b.getAttribute('data-id'), vInp = b.querySelector('.input-porzioni-reali');
                    prodSalvare.push({ id_ricetta: idR, data_svolgimento: dataSv, porzioni_prodotte: b.querySelector('.check-porzioni-modificate').checked ? parseFloat(vInp.value) : parseFloat(vInp.getAttribute('data-base')) });

                    const notaInput = b.querySelector('.input-note-produzione');
                    const noteNuove = notaInput ? notaInput.value.trim() : "";

                    if (noteNuove !== "") {
                        const vecchieNote = b.querySelector('.vecchie-note-nascoste') ? b.querySelector('.vecchie-note-nascoste').value : "";
                        noteAgg.push({ id_ricetta: idR, note_finali: (vecchieNote ? vecchieNote + `\n\n--- Note ${dataIt} ---\n${noteNuove}` : `--- Note ${dataIt} ---\n${noteNuove}`).trim() });
                    }
                });
                await API.registraProduzione(prodSalvare, noteAgg); alert("Produzione Registrata!");
                fCont.classList.add('d-none'); document.getElementById('form-produzione').reset(); document.getElementById('prod-dettagli-dinamici').innerHTML = '';
                storico = await API.getStorico(); aggiornaStatistiche(); renderVista();
                btn.disabled = false; btn.textContent = "Salva nel Calendario";
            } catch (err) { alert("Errore durante il salvataggio: " + err.message); btn.disabled = false; btn.textContent = "Salva nel Calendario"; }
        });
    } catch (error) { UI.container.innerHTML = `<div class="alert alert-danger">Errore calendario: ${error.message}</div>`; }
}

// ==========================================
// 6. LISTA DELLA SPESA (SINCRONIZZATA IN CLOUD)
// ==========================================
async function initSpesa() {
    let statoSpesa = { ricetteInMenu: [], spunte: {} };

    const selectRicetta = document.getElementById('spesa-select-ricetta');
    const inputPorzioni = document.getElementById('spesa-input-porzioni');
    const btnAggiungi = document.getElementById('btn-aggiungi-spesa');
    const btnSvuota = document.getElementById('btn-svuota-spesa');
    const listaRicette = document.getElementById('lista-ricette-spesa');
    const listaAggregata = document.getElementById('lista-spesa-aggregata');

    // 1. SCARICHIAMO LO STATO DELLA SPESA DAL DATABASE (Non più da localStorage!)
    try {
        listaAggregata.innerHTML = '<li class="list-group-item text-center text-muted p-4"><div class="spinner-border text-primary spinner-border-sm mb-2"></div><br>Sincronizzazione carrello dal cloud...</li>';
        statoSpesa = await API.getSpesa();
    } catch (e) {
        console.error("Errore caricamento spesa dal DB", e);
    }

    // 2. SCARICHIAMO LE RICETTE (Per la tendina)
    try {
        const ricette = await API.getRicetteElencoBreve();
        selectRicetta.innerHTML = '<option value="">-- Seleziona una ricetta --</option>';
        ricette.forEach(r => { selectRicetta.innerHTML += `<option value="${r.id}">${r.nome}</option>`; });
    } catch (errApi) {
        selectRicetta.innerHTML = '<option value="">Errore di caricamento database</option>'; return;
    }

    // 3. CAMBIO RICETTA NELLA TENDINA
    selectRicetta.addEventListener('change', async (e) => {
        if (!e.target.value) { btnAggiungi.disabled = true; inputPorzioni.value = ''; return; }
        btnAggiungi.disabled = true; inputPorzioni.value = "Caricamento...";
        try {
            const ric = await API.getRicettaCompleta(e.target.value);
            inputPorzioni.value = ric.porzioni_base || 1; btnAggiungi.disabled = false;
        } catch (err) { inputPorzioni.value = ''; alert("Impossibile caricare i dettagli."); }
    });

    // 4. FUNZIONE DI SALVATAGGIO AUTOMATICO
    function salvaStatoCloud() {
        // Manda il salvataggio a Supabase in background senza bloccare l'utente
        API.saveSpesa(statoSpesa);
    }

    // 5. MOTORE MATEMATICO E AGGIORNAMENTO GRAFICO
    function renderDatiSpesa() {
        // A. Render Lista Ricette (Colonna Sinistra)
        if (statoSpesa.ricetteInMenu.length === 0) {
            listaRicette.innerHTML = '<li class="list-group-item text-muted small">Nessuna ricetta in programma.</li>';
        } else {
            listaRicette.innerHTML = statoSpesa.ricetteInMenu.map((item, index) => `
                <li class="list-group-item d-flex justify-content-between align-items-center bg-white shadow-sm mb-2 border rounded">
                    <div>
                        <strong class="text-primary">${item.nome}</strong><br>
                        <small class="text-muted">${item.porzioni} porzioni previste</small>
                    </div>
                    <button class="btn btn-sm btn-outline-danger btn-rimuovi-ricetta" data-index="${index}">✖</button>
                </li>
            `).join('');
        }

        // B. Ricalcolo Aggregato
        let mappaIngredienti = {};
        statoSpesa.ricetteInMenu.forEach(item => {
            item.ingredientiEsplosi.forEach(ing => {
                let nomeNorm = ing.nome.trim().toLowerCase();
                let unitaNorm = (ing.unita || '').trim().toLowerCase();
                let key = `${nomeNorm}|${unitaNorm}`;

                if (!mappaIngredienti[key]) {
                    let nomeDisplay = nomeNorm.charAt(0).toUpperCase() + nomeNorm.slice(1);
                    mappaIngredienti[key] = { nome: nomeDisplay, unita: ing.unita, qta: 0 };
                }
                mappaIngredienti[key].qta += ing.qta;
            });
        });

        let ingredientiAggregati = Object.keys(mappaIngredienti).map(key => ({
            key: key, ...mappaIngredienti[key]
        })).sort((a, b) => a.nome.localeCompare(b.nome));

        // C. Render Ingredienti Totali (Colonna Destra)
        if (ingredientiAggregati.length === 0) {
            listaAggregata.innerHTML = '<li class="list-group-item text-muted p-4 text-center border-0">Aggiungi delle ricette per generare la spesa.</li>';
        } else {
            listaAggregata.innerHTML = ingredientiAggregati.map(ing => {
                const isChecked = statoSpesa.spunte[ing.key] ? 'checked' : '';
                const textClass = isChecked ? 'text-decoration-line-through text-muted' : 'fw-bold text-dark';
                const qtaArrotondata = Number(ing.qta.toFixed(2));

                return `
                <li class="list-group-item d-flex align-items-center py-3 border-bottom">
                    <input class="form-check-input me-3 check-ingrediente shadow-sm" style="transform: scale(1.4);" type="checkbox" data-key="${ing.key}" ${isChecked}>
                    <div class="flex-grow-1 ${textClass} fs-5 label-ingrediente">
                        ${ing.nome}
                    </div>
                    <div class="badge bg-success rounded-pill fs-6 px-3 py-2 shadow-sm">
                        ${qtaArrotondata} ${ing.unita}
                    </div>
                </li>`;
            }).join('');
        }

        // Ogni volta che si aggiorna la pagina visivamente, la salviamo nel Cloud
        salvaStatoCloud();
    }

    // 6. AGGIUNTA DI UNA NUOVA RICETTA ALLA SPESA
    btnAggiungi.addEventListener('click', async () => {
        const idRicetta = selectRicetta.value;
        const porzioniRichieste = parseFloat(inputPorzioni.value);
        if (!idRicetta || isNaN(porzioniRichieste)) return;

        btnAggiungi.disabled = true;
        btnAggiungi.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Calcolo BOM...';

        try {
            const ricetta = await API.getRicettaCompleta(idRicetta);
            const rapporto = porzioniRichieste / ricetta.porzioni_base;
            let ingredientiEstratti = [];

            ricetta.ingredienti.forEach(ing => {
                ingredientiEstratti.push({ nome: ing.nome_ingrediente, unita: ing.unita_distinta, qta: ing.quantita * rapporto });
            });

            if (ricetta.sottoricette_esplose && ricetta.sottoricette_esplose.length > 0) {
                ricetta.sottoricette_esplose.forEach(sr => {
                    const rFiglia = sr.ricetta_figlia;
                    const moltiplicatoreReale = parseFloat(sr.moltiplicatore) || 1;
                    const rapportoSotto = rapporto * moltiplicatoreReale;

                    rFiglia.ingredienti.forEach(subIng => {
                        ingredientiEstratti.push({ nome: subIng.nome_ingrediente, unita: subIng.unita_distinta, qta: subIng.quantita * rapportoSotto });
                    });
                });
            }

            statoSpesa.ricetteInMenu.push({
                id: ricetta.id, nome: ricetta.nome, porzioni: porzioniRichieste, ingredientiEsplosi: ingredientiEstratti
            });
            statoSpesa.spunte = {}; // Resetta le spunte se si aggiunge nuova roba

            selectRicetta.value = ''; inputPorzioni.value = '';
            btnAggiungi.disabled = true; btnAggiungi.innerHTML = '➕ Aggiungi alla Spesa';

            renderDatiSpesa();
        } catch (e) {
            alert("Errore nell'estrazione della distinta base.");
            btnAggiungi.disabled = false; btnAggiungi.innerHTML = '➕ Aggiungi alla Spesa';
        }
    });

    // 7. GESTIONE DEI CLICK SULLE LISTE (Delegate Listener)
    listaRicette.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-rimuovi-ricetta')) {
            const index = e.target.getAttribute('data-index');
            statoSpesa.ricetteInMenu.splice(index, 1);
            statoSpesa.spunte = {};
            renderDatiSpesa();
        }
    });

    listaAggregata.addEventListener('change', (e) => {
        if (e.target.classList.contains('check-ingrediente')) {
            const key = e.target.getAttribute('data-key');
            statoSpesa.spunte[key] = e.target.checked;
            renderDatiSpesa();
        }
    });

    btnSvuota.addEventListener('click', () => {
        if (confirm("Vuoi cancellare tutto il menu e le spunte del supermercato da tutti i dispositivi?")) {
            statoSpesa = { ricetteInMenu: [], spunte: {} };
            renderDatiSpesa();
        }
    });

    // Primo caricamento appena si apre la tab
    renderDatiSpesa();
}