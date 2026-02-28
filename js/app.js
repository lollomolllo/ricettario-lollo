// js/app.js

// --- VARIABILI GLOBALI E PREFERENZE ---
let idRicettaInModifica = null;
let urlImmagineInModifica = null;

const PREFS_KEY = 'erp_ricettario_prefs';

function getPrefs() { return JSON.parse(localStorage.getItem(PREFS_KEY)) || { defaultView: 'grid', theme: 'light' }; }
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

// --- 4. IMPOSTAZIONI ---
async function initImpostazioni() {
    const prefs = getPrefs();
    const selectView = document.getElementById('pref-view');
    const selectTheme = document.getElementById('pref-theme');
    selectView.value = prefs.defaultView; selectTheme.value = prefs.theme;

    selectView.addEventListener('change', (e) => { prefs.defaultView = e.target.value; savePrefs(prefs); });
    selectTheme.addEventListener('change', (e) => { prefs.theme = e.target.value; savePrefs(prefs); applicaTema(); });

    await loadDizionari();
    document.getElementById('btn-add-categoria').addEventListener('click', async () => { const val = document.getElementById('input-categoria').value.trim(); if (val) { await API.addCategoria(val); document.getElementById('input-categoria').value = ''; await loadDizionari(); } });
    document.getElementById('btn-add-tag').addEventListener('click', async () => { const val = document.getElementById('input-tag').value.trim(); if (val) { await API.addTag(val); document.getElementById('input-tag').value = ''; await loadDizionari(); } });
    document.getElementById('lista-categorie').addEventListener('click', async (e) => { if (e.target.classList.contains('btn-delete-categoria') && confirm('Sicuro?')) { await API.deleteCategoria(e.target.getAttribute('data-id')); await loadDizionari(); } });
    document.getElementById('lista-tag').addEventListener('click', async (e) => { if (e.target.classList.contains('btn-delete-tag') && confirm('Sicuro?')) { await API.deleteTag(e.target.getAttribute('data-id')); await loadDizionari(); } });
}

async function loadDizionari() {
    UI.renderListaCategorie(await API.getCategorie());
    UI.renderListaTag(await API.getTags());
}

// --- 5. INSERIMENTO E MODIFICA RICETTA ---
async function initInserimento() {
    let opzioniRicetteHTML = '<option value="">Seleziona ricetta...</option>';
    let categorieDB = [], tagsDB = [], ricetteDB = [];

    if (!document.getElementById('dizionario-ingredienti')) {
        document.body.insertAdjacentHTML('beforeend', `<datalist id="dizionario-ingredienti"></datalist><datalist id="dizionario-unita"></datalist>`);
    }

    try {
        const [categorie, tags, ricette, dizionario] = await Promise.all([API.getCategorie(), API.getTags(), API.getRicetteElencoBreve(), API.getDizionarioIngredienti()]);
        categorieDB = categorie; tagsDB = tags; ricetteDB = ricette;

        document.getElementById('dizionario-ingredienti').innerHTML = dizionario.nomi.map(n => `<option value="${n}">`).join('');
        document.getElementById('dizionario-unita').innerHTML = dizionario.unita.map(u => `<option value="${u}">`).join('');

        const selectCat = document.getElementById('ricetta-categoria');
        categorie.forEach(c => selectCat.innerHTML += `<option value="${c.id}">${c.nome}</option>`);

        document.getElementById('container-tags').innerHTML = tags.map(t => `<div class="form-check form-check-inline"><input class="form-check-input checkbox-tag" type="checkbox" value="${t.id}" id="tag-${t.id}"><label class="form-check-label" for="tag-${t.id}">${t.nome}</label></div>`).join('') || '<span class="text-muted small">Nessun tag.</span>';
        ricette.forEach(r => opzioniRicetteHTML += `<option value="${r.id}">${r.nome}</option>`);
    } catch (e) { console.error("Errore dizionari:", e); }

    document.getElementById('btn-add-ingrediente').addEventListener('click', () => document.getElementById('container-ingredienti').insertAdjacentHTML('beforeend', UI.getIngredienteRowHTML()));
    document.getElementById('btn-add-step').addEventListener('click', () => { document.getElementById('container-procedimento').insertAdjacentHTML('beforeend', UI.getStepRowHTML()); aggiornaNumeriStep(); });
    document.getElementById('btn-add-sottoricetta').addEventListener('click', () => document.getElementById('container-sottoricette').insertAdjacentHTML('beforeend', UI.getSottoricettaRowHTML(opzioniRicetteHTML)));

    document.getElementById('form-ricetta').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-row')) { e.target.closest('.row').remove(); aggiornaNumeriStep(); }
    });

    if (!idRicettaInModifica) {
        document.getElementById('btn-add-ingrediente').click(); document.getElementById('btn-add-step').click();
    }

    // Importazione TXT
    const btnImport = document.getElementById('btn-import-txt');
    const inputImport = document.getElementById('input-import-txt');
    if (btnImport && inputImport) {
        const nuovoBtnImport = btnImport.cloneNode(true);
        btnImport.parentNode.replaceChild(nuovoBtnImport, btnImport);
        nuovoBtnImport.addEventListener('click', (e) => { e.preventDefault(); inputImport.click(); });

        inputImport.addEventListener('change', async (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = async (event) => {
                const testo = event.target.result;
                const blocchi = testo.split('=== RICETTA ===').map(b => b.trim()).filter(b => b !== '');
                if (blocchi.length === 0) { alert("Nessuna ricetta trovata."); return; }

                const sceltaSalvataggio = confirm(`Trovate ${blocchi.length} ricette.\nVuoi SALVARE DIRETTAMENTE nel DB?\nPremi ANNULLA per l'anteprima.`);
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
                    let id_categoria = null;
                    const catNome = estraiCampo('CATEGORIA');
                    if (catNome) { const cTrov = categorieDB.find(c => c.nome.toLowerCase() === catNome.toLowerCase()); if (cTrov) id_categoria = cTrov.id; }

                    let tagsSpuntati = [];
                    const tagsString = estraiCampo('TAGS');
                    if (tagsString) {
                        tagsString.split(',').map(t => t.trim().toLowerCase()).forEach(nt => {
                            const tTrov = tagsDB.find(t => t.nome.toLowerCase() === nt); if (tTrov) tagsSpuntati.push(tTrov.id);
                        });
                    }

                    const ricettaData = {
                        nome, id_categoria, porzioni_base: parseFloat(estraiCampo('PORZIONI').replace(',', '.')) || 1,
                        unita_porzioni: estraiCampo('UNITA') || 'pz', tempo_riposo_ore: parseFloat(estraiCampo('RIPOSO \\(ore\\)').replace(',', '.')) || 0,
                        tempo_cottura_min: parseInt(estraiCampo('COTTURA \\(min\\)')) || 0, fonte: '', link_fonte: '', note: estraiCampo('NOTE'), url_immagine: null
                    };

                    const ingredientiData = [];
                    const bIng = estraiSezione('INGREDIENTI');
                    if (bIng) bIng.split('\n').forEach(l => {
                        let r = l.trim().replace(/^[\-\*\•]\s*/, '');
                        if (r.includes('|')) { const p = r.split('|').map(x => x.trim()); if (p.length >= 2) ingredientiData.push({ nome: p[0], qta: parseFloat(p[1].replace(',', '.')) || 0, unita: p[2] || '' }); }
                    });

                    const procedimentoData = [];
                    const bProc = estraiSezione('PROCEDIMENTO');
                    if (bProc) bProc.split('\n').forEach(l => {
                        let r = l.trim(); if (r !== '') { r = r.replace(/^\d+[\.\-\)]\s*/, ''); procedimentoData.push({ desc: r }); }
                    });

                    const sottoricetteData = [];
                    const bSr = estraiSezione('SOTTORICETTE');
                    if (bSr) bSr.split('\n').forEach(l => {
                        let r = l.trim().replace(/^[\-\*\•]\s*/, '');
                        if (r.includes('|')) {
                            const p = r.split('|').map(x => x.trim());
                            if (p.length >= 2) { const rt = ricetteDB.find(x => x.nome.toLowerCase() === p[0].toLowerCase()); if (rt) sottoricetteData.push({ id_figlia: rt.id, moltiplicatore: parseFloat(p[1].replace(',', '.')) || 1 }); }
                        }
                    });

                    ricetteProcessate.push({ ricettaData, ingredientiData, procedimentoData, tagsSpuntati, sottoricetteData });
                }

                if (ricetteProcessate.length === 0) return;

                if (sceltaSalvataggio) {
                    nuovoBtnImport.disabled = true; nuovoBtnImport.textContent = "Salvataggio...";
                    try {
                        for (let r of ricetteProcessate) await API.salvaRicettaCompleta(r.ricettaData, r.ingredientiData, r.procedimentoData, r.tagsSpuntati, r.sottoricetteData);
                        alert(`Importate ${ricetteProcessate.length} ricette.`); document.getElementById('nav-elenco').click();
                    } catch (err) { alert("Errore: " + err.message); } finally { nuovoBtnImport.disabled = false; nuovoBtnImport.innerHTML = "📄 Importa"; }
                } else {
                    const pr = ricetteProcessate[0];
                    document.getElementById('ricetta-nome').value = pr.ricettaData.nome;
                    if (pr.ricettaData.id_categoria) document.getElementById('ricetta-categoria').value = pr.ricettaData.id_categoria;
                    document.getElementById('ricetta-porzioni').value = pr.ricettaData.porzioni_base; document.getElementById('ricetta-unita').value = pr.ricettaData.unita_porzioni;
                    document.getElementById('ricetta-riposo').value = pr.ricettaData.tempo_riposo_ore; document.getElementById('ricetta-cottura').value = pr.ricettaData.tempo_cottura_min;
                    document.getElementById('ricetta-note').value = pr.ricettaData.note; document.getElementById('ricetta-fonte').value = ''; document.getElementById('ricetta-link').value = '';

                    document.querySelectorAll('.checkbox-tag').forEach(chk => chk.checked = false);
                    pr.tagsSpuntati.forEach(tid => { const cb = document.getElementById(`tag-${tid}`); if (cb) cb.checked = true; });

                    document.getElementById('container-ingredienti').innerHTML = ''; document.getElementById('container-procedimento').innerHTML = ''; document.getElementById('container-sottoricette').innerHTML = '';

                    pr.ingredientiData.forEach(ing => { document.getElementById('btn-add-ingrediente').click(); const r = document.getElementById('container-ingredienti').lastElementChild; r.querySelector('.ing-nome').value = ing.nome; r.querySelector('.ing-qta').value = ing.qta; r.querySelector('.ing-unita').value = ing.unita; });
                    pr.procedimentoData.forEach(step => { document.getElementById('btn-add-step').click(); const r = document.getElementById('container-procedimento').lastElementChild; const t = r.querySelector('.step-desc'); t.value = step.desc; setTimeout(() => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; }, 10); });
                    pr.sottoricetteData.forEach(sr => { document.getElementById('btn-add-sottoricetta').click(); const r = document.getElementById('container-sottoricette').lastElementChild; r.querySelector('.sr-id').value = sr.id_figlia; r.querySelector('.sr-moltiplicatore').value = sr.moltiplicatore; });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            };
            reader.readAsText(file); e.target.value = '';
        });
    }

    const btnEliminaForm = document.getElementById('btn-elimina-ricetta-form');
    if (btnEliminaForm) {
        const nuovoBtnElimina = btnEliminaForm.cloneNode(true);
        btnEliminaForm.parentNode.replaceChild(nuovoBtnElimina, btnEliminaForm);
        nuovoBtnElimina.addEventListener('click', async () => {
            if (!idRicettaInModifica) return;
            if (!confirm("Sicuro di voler eliminare questa ricetta?")) return;
            try {
                nuovoBtnElimina.disabled = true; nuovoBtnElimina.innerHTML = "Eliminazione...";
                await API.deleteRicetta(idRicettaInModifica, urlImmagineInModifica);
                alert("Eliminata!"); idRicettaInModifica = null; urlImmagineInModifica = null; document.getElementById('nav-elenco').click();
            } catch (err) { alert("Errore: " + err.message); nuovoBtnElimina.disabled = false; nuovoBtnElimina.innerHTML = "🗑 Elimina"; }
        });
    }

    document.getElementById('form-ricetta').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById('btn-salva-ricetta-top');
        btnSubmit.disabled = true; btnSubmit.textContent = "Salvataggio...";

        try {
            let url_immagine = idRicettaInModifica ? urlImmagineInModifica : null;
            const fileInput = document.getElementById('ricetta-immagine');
            if (fileInput.files.length > 0) url_immagine = await API.uploadImmagine(fileInput.files[0]);

            const idCat = document.getElementById('ricetta-categoria').value;
            const ricettaData = {
                nome: document.getElementById('ricetta-nome').value.trim(), id_categoria: idCat ? parseInt(idCat) : null,
                porzioni_base: parseFloat(document.getElementById('ricetta-porzioni').value), unita_porzioni: document.getElementById('ricetta-unita').value.trim(),
                tempo_riposo_ore: parseFloat(document.getElementById('ricetta-riposo').value) || 0, tempo_cottura_min: parseInt(document.getElementById('ricetta-cottura').value) || 0,
                fonte: document.getElementById('ricetta-fonte')?.value.trim() || null, link_fonte: document.getElementById('ricetta-link')?.value.trim() || null, note: document.getElementById('ricetta-note')?.value.trim() || null, url_immagine
            };

            const tagsSpuntati = Array.from(document.querySelectorAll('.checkbox-tag:checked')).map(cb => cb.value);
            const ingredientiData = Array.from(document.querySelectorAll('.riga-ingrediente')).map(r => ({ nome: r.querySelector('.ing-nome').value.trim(), qta: parseFloat(r.querySelector('.ing-qta').value), unita: r.querySelector('.ing-unita').value.trim() })).filter(i => i.nome !== "");
            const procedimentoData = Array.from(document.querySelectorAll('.riga-step')).map(r => ({ desc: r.querySelector('.step-desc').value.trim() })).filter(s => s.desc !== "");
            const sottoricetteData = Array.from(document.querySelectorAll('.riga-sottoricetta')).map(r => ({ id_figlia: r.querySelector('.sr-id').value, moltiplicatore: parseFloat(r.querySelector('.sr-moltiplicatore').value) })).filter(sr => sr.id_figlia !== "" && !isNaN(sr.moltiplicatore));

            if (idRicettaInModifica) { await API.aggiornaRicettaCompleta(idRicettaInModifica, ricettaData, ingredientiData, procedimentoData, tagsSpuntati, sottoricetteData); alert("Aggiornata!"); }
            else { await API.salvaRicettaCompleta(ricettaData, ingredientiData, procedimentoData, tagsSpuntati, sottoricetteData); alert("Salvata!"); }

            idRicettaInModifica = null; urlImmagineInModifica = null; document.getElementById('nav-elenco').click();
        } catch (error) { alert("Errore: " + error.message); btnSubmit.disabled = false; btnSubmit.innerHTML = idRicettaInModifica ? "💾 Salva Modifiche" : "💾 Salva Ricetta"; }
    });
}

function aggiornaNumeriStep() { document.querySelectorAll('.riga-step .step-number').forEach((el, index) => el.textContent = index + 1); }

// ==========================================
// 3. ELENCO (Galleria)
// ==========================================
async function initElenco() {
    try {
        const [ricette, categorie, tags] = await Promise.all([API.getRicetteGalleria(), API.getCategorie(), API.getTags()]);
        let cacheRicette = ricette;
        let currentView = getPrefs().defaultView;

        const btnNuovaRicetta = document.getElementById('btn-nuova-ricetta-elenco');
        if (btnNuovaRicetta) {
            btnNuovaRicetta.addEventListener('click', () => {
                idRicettaInModifica = null; urlImmagineInModifica = null;
                document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(el => el.classList.remove('active'));
                UI.renderInserimento(); initInserimento();
            });
        }

        const btnGrid = document.getElementById('btn-view-grid'); const btnList = document.getElementById('btn-view-list');
        if (currentView === 'list') { btnList.classList.add('active'); btnGrid.classList.remove('active'); }
        else { btnGrid.classList.add('active'); btnList.classList.remove('active'); }

        const selectCat = document.getElementById('filtro-categoria');
        categorie.forEach(c => selectCat.innerHTML += `<option value="${c.nome}">${c.nome}</option>`);
        const selectTag = document.getElementById('filtro-tag');
        tags.forEach(t => selectTag.innerHTML += `<option value="${t.nome}">${t.nome}</option>`);
        const inputTesto = document.getElementById('filtro-testo');

        // LA FUNZIONE CON IL CONTROLLO BLINDATO
        function applicaFiltri(mantieniAperti = false) {
            const testo = inputTesto.value.toLowerCase().trim();
            const catScelta = selectCat.value;
            const tagScelto = selectTag.value;

            let categorieAperte = [];

            // Legge i cassetti aperti SOLO se abbiamo premuto il bottone Grid/List (mantieniAperti === true)
            if (mantieniAperti === true) {
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

            filtrate.sort((a, b) => a.nome.localeCompare(b.nome));

            // Passiamo le categorie aperte alla UI
            UI.renderCards(filtrate, currentView, categorieAperte);
        }

        // RICERCA E FILTRI = FORZANO LA CHIUSURA PASSANDO 'false'
        inputTesto.addEventListener('input', () => applicaFiltri(false));
        selectCat.addEventListener('change', () => applicaFiltri(false));
        selectTag.addEventListener('change', () => applicaFiltri(false));

        // TASTI VISTA (GRID/LIST) = FORZANO IL MANTENIMENTO PASSANDO 'true'
        btnGrid.addEventListener('click', () => { currentView = 'grid'; btnGrid.classList.add('active'); btnList.classList.remove('active'); applicaFiltri(true); });
        btnList.addEventListener('click', () => { currentView = 'list'; btnList.classList.add('active'); btnGrid.classList.remove('active'); applicaFiltri(true); });

        // Primo avvio: tutto chiuso
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

        const btnModifica = document.getElementById('btn-modifica-ricetta');
        if (btnModifica) btnModifica.addEventListener('click', async () => {
            idRicettaInModifica = ricetta.id; urlImmagineInModifica = ricetta.url_immagine;
            document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(el => el.classList.remove('active'));
            UI.renderInserimento(); await initInserimento();

            document.getElementById('titolo-inserimento').textContent = "✏️ Modifica Ricetta";
            const bs = document.getElementById('btn-salva-ricetta-top'); bs.textContent = "💾 Salva Modifiche"; bs.classList.replace('btn-success', 'btn-primary');
            document.getElementById('btn-elimina-ricetta-form').classList.remove('d-none');

            document.getElementById('ricetta-nome').value = ricetta.nome || '';
            if (ricetta.categorie) Array.from(document.getElementById('ricetta-categoria').options).forEach(opt => { if (opt.text === ricetta.categorie.nome) opt.selected = true; });
            document.getElementById('ricetta-porzioni').value = ricetta.porzioni_base || ''; document.getElementById('ricetta-unita').value = ricetta.unita_porzioni || '';
            document.getElementById('ricetta-riposo').value = ricetta.tempo_riposo_ore || 0; document.getElementById('ricetta-cottura').value = ricetta.tempo_cottura_min || 0;
            document.getElementById('ricetta-fonte').value = ricetta.fonte || ''; document.getElementById('ricetta-link').value = ricetta.link_fonte || ''; document.getElementById('ricetta-note').value = ricetta.note || '';

            if (ricetta.ricette_tags) { const n = ricetta.ricette_tags.map(rt => rt.tag.nome); document.querySelectorAll('.checkbox-tag').forEach(chk => { if (n.includes(chk.nextElementSibling.textContent)) chk.checked = true; }); }

            const cIng = document.getElementById('container-ingredienti'); const cProc = document.getElementById('container-procedimento'); const cSr = document.getElementById('container-sottoricette');
            cIng.innerHTML = ''; cProc.innerHTML = ''; cSr.innerHTML = '';

            ricetta.ingredienti?.forEach(ing => { document.getElementById('btn-add-ingrediente').click(); const r = cIng.lastElementChild; r.querySelector('.ing-nome').value = ing.nome_ingrediente; r.querySelector('.ing-qta').value = ing.quantita; r.querySelector('.ing-unita').value = ing.unita_distinta || ''; });
            ricetta.procedimento?.forEach(step => { document.getElementById('btn-add-step').click(); const r = cProc.lastElementChild; const t = r.querySelector('.step-desc'); t.value = step.descrizione; setTimeout(() => t.style.height = t.scrollHeight + 'px', 10); });
            ricetta.sottoricette_esplose?.forEach(sr => { document.getElementById('btn-add-sottoricetta').click(); const r = cSr.lastElementChild; r.querySelector('.sr-id').value = sr.ricetta_figlia.id; r.querySelector('.sr-moltiplicatore').value = sr.moltiplicatore; });
            window.scrollTo(0, 0);
        });

    } catch (error) { UI.container.innerHTML = `<div class="alert alert-danger">Errore db.</div>`; }
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
        let meseCorrente = new Date().getMonth(), annoCorrente = new Date().getFullYear(), vistaAttiva = 'lista';

        const selectRicetta = document.getElementById('prod-ricetta');
        selectRicetta.innerHTML = '<option value="">-- Seleziona la ricetta prodotta --</option>' + ricette.map(r => `<option value="${r.id}">${r.nome}</option>`).join('');
        document.getElementById('prod-data').valueAsDate = new Date();

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
                const genBlocco = (id, nome, porzioni, unita, isSr) => `<div class="card border-${isSr ? 'warning' : 'primary'} mb-3 riga-produzione-item" data-id="${id}"><div class="card-header bg-${isSr ? 'warning text-dark' : 'primary text-white'} py-2 fw-bold">${isSr ? '↳ Sottoricetta:' : 'Principale:'} ${nome}</div><div class="card-body py-2"><div class="row align-items-center mb-2"><div class="col-md-4"><div class="form-check form-switch"><input class="form-check-input check-porzioni-modificate" type="checkbox" id="cm-${id}"><label class="form-check-label small" for="cm-${id}">Modifica porzioni?</label></div></div><div class="col-md-8"><div class="input-group input-group-sm contenitore-input-porzioni d-none"><span class="input-group-text">Prodotte:</span><input type="number" step="0.1" class="form-control input-porzioni-reali" value="${porzioni}" data-base="${porzioni}"><span class="input-group-text">${unita}</span></div></div></div><textarea class="form-control form-control-sm input-note-produzione" rows="2" placeholder="Note (es. farina debole...)"></textarea><input type="hidden" class="vecchie-note-nascoste" value="${rSelCom.note || ''}"></div></div>`;
                cDet.innerHTML = genBlocco(rSelCom.id, rSelCom.nome, rSelCom.porzioni_base, rSelCom.unita_porzioni, false) + (rSelCom.sottoricette_esplose?.map(sr => genBlocco(sr.ricetta_figlia.id, sr.ricetta_figlia.nome, sr.ricetta_figlia.porzioni_base, sr.ricetta_figlia.unita_porzioni, true)).join('') || '');
                cDet.querySelectorAll('.check-porzioni-modificate').forEach(chk => chk.addEventListener('change', (ev) => ev.target.checked ? ev.target.closest('.card-body').querySelector('.contenitore-input-porzioni').classList.remove('d-none') : ev.target.closest('.card-body').querySelector('.contenitore-input-porzioni').classList.add('d-none')));
            } catch (err) { cDet.innerHTML = `<div class="alert alert-danger">Errore db.</div>`; }
        });

        document.getElementById('form-produzione').addEventListener('submit', async (e) => {
            e.preventDefault(); if (!rSelCom) return; const btn = e.target.querySelector('button[type="submit"]'); btn.disabled = true; btn.textContent = "Salvataggio...";
            try {
                const dataSv = document.getElementById('prod-data').value, dataIt = new Date(dataSv).toLocaleDateString('it-IT');
                let prodSalvare = [], noteAgg = [];
                document.querySelectorAll('.riga-produzione-item').forEach(b => {
                    const idR = b.getAttribute('data-id'), vInp = b.querySelector('.input-porzioni-reali');
                    prodSalvare.push({ id_ricetta: idR, data_svolgimento: dataSv, porzioni_prodotte: b.querySelector('.check-porzioni-modificate').checked ? parseFloat(vInp.value) : parseFloat(vInp.getAttribute('data-base')) });
                    const noteNuove = b.querySelector('.input-note-produzione').value.trim();
                    if (noteNuove !== "") noteAgg.push({ id_ricetta: idR, note_finali: (b.querySelector('.vecchie-note-nascoste').value ? b.querySelector('.vecchie-note-nascoste').value + `\n\n--- Note ${dataIt} ---\n${noteNuove}` : `--- Note ${dataIt} ---\n${noteNuove}`).trim() });
                });
                await API.registraProduzione(prodSalvare, noteAgg); alert("Registrata!");
                fCont.classList.add('d-none'); document.getElementById('form-produzione').reset(); document.getElementById('prod-dettagli-dinamici').innerHTML = '';
                storico = await API.getStorico(); aggiornaStatistiche(); renderVista();
            } catch (err) { alert("Errore: " + err.message); btn.disabled = false; btn.textContent = "Salva"; }
        });
    } catch (error) { UI.container.innerHTML = `<div class="alert alert-danger">Errore calendario.</div>`; }
}

// --- 9. SPESA ---
async function initSpesa() {
    const STORAGE_KEY = 'erp_ricettario_spesa';
    let statoSpesa = { ricetteInMenu: [], spunte: {} };
    try { const mem = localStorage.getItem(STORAGE_KEY); if (mem) statoSpesa = JSON.parse(mem); } catch (e) { localStorage.removeItem(STORAGE_KEY); }

    const selRic = document.getElementById('spesa-select-ricetta'), inpPorz = document.getElementById('spesa-input-porzioni'), btnAgg = document.getElementById('btn-aggiungi-spesa'), listRic = document.getElementById('lista-ricette-spesa'), listAgg = document.getElementById('lista-spesa-aggregata');

    try {
        const ricette = await API.getRicetteElencoBreve();
        selRic.innerHTML = '<option value="">-- Seleziona una ricetta --</option>' + ricette.map(r => `<option value="${r.id}">${r.nome}</option>`).join('');
    } catch (err) { selRic.innerHTML = '<option value="">Errore db</option>'; return; }

    selRic.addEventListener('change', async (e) => {
        if (!e.target.value) { btnAgg.disabled = true; inpPorz.value = ''; return; }
        btnAgg.disabled = true; inpPorz.value = "Carica...";
        try { inpPorz.value = (await API.getRicettaCompleta(e.target.value)).porzioni_base || 1; btnAgg.disabled = false; } catch (err) { inpPorz.value = ''; }
    });

    function renderDatiSpesa() {
        listRic.innerHTML = statoSpesa.ricetteInMenu.length === 0 ? '<li class="list-group-item text-muted">Nessuna ricetta.</li>' : statoSpesa.ricetteInMenu.map((item, index) => `<li class="list-group-item d-flex justify-content-between align-items-center bg-white shadow-sm mb-2 border rounded"><div><strong class="text-primary">${item.nome}</strong><br><small class="text-muted">${item.porzioni} porzioni</small></div><button class="btn btn-sm btn-outline-danger btn-rimuovi-ricetta" data-index="${index}">✖</button></li>`).join('');

        let mappaIng = {};
        statoSpesa.ricetteInMenu.forEach(item => item.ingredientiEsplosi.forEach(ing => {
            let key = `${ing.nome.trim().toLowerCase()}|${(ing.unita || '').trim().toLowerCase()}`;
            if (!mappaIng[key]) mappaIng[key] = { nome: ing.nome.charAt(0).toUpperCase() + ing.nome.slice(1).toLowerCase(), unita: ing.unita, qta: 0 };
            mappaIng[key].qta += ing.qta;
        }));

        let ingAgg = Object.keys(mappaIng).map(k => ({ key: k, ...mappaIng[k] })).sort((a, b) => a.nome.localeCompare(b.nome));
        listAgg.innerHTML = ingAgg.length === 0 ? '<li class="list-group-item text-muted p-4 text-center">Nessun ingrediente.</li>' : ingAgg.map(ing => `<li class="list-group-item d-flex align-items-center py-3 border-bottom"><input class="form-check-input me-3 check-ingrediente shadow-sm" style="transform: scale(1.4);" type="checkbox" data-key="${ing.key}" ${statoSpesa.spunte[ing.key] ? 'checked' : ''}><div class="flex-grow-1 ${statoSpesa.spunte[ing.key] ? 'text-decoration-line-through text-muted' : 'fw-bold text-dark'} fs-5">${ing.nome}</div><div class="badge bg-success rounded-pill fs-6 px-3 shadow-sm">${Number(ing.qta.toFixed(2))} ${ing.unita}</div></li>`).join('');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(statoSpesa));
    }

    btnAgg.addEventListener('click', async () => {
        const id = selRic.value, pR = parseFloat(inpPorz.value); if (!id || isNaN(pR)) return;
        btnAgg.disabled = true; btnAgg.innerHTML = 'Calcolo...';
        try {
            const r = await API.getRicettaCompleta(id); const rap = pR / r.porzioni_base; let ingEstr = [];
            r.ingredienti.forEach(i => ingEstr.push({ nome: i.nome_ingrediente, unita: i.unita_distinta, qta: i.quantita * rap }));
            r.sottoricette_esplose?.forEach(sr => sr.ricetta_figlia.ingredienti.forEach(si => ingEstr.push({ nome: si.nome_ingrediente, unita: si.unita_distinta, qta: si.quantita * (rap * (parseFloat(sr.moltiplicatore) || 1)) })));
            statoSpesa.ricetteInMenu.push({ id: r.id, nome: r.nome, porzioni: pR, ingredientiEsplosi: ingEstr }); statoSpesa.spunte = {};
            selRic.value = ''; inpPorz.value = ''; renderDatiSpesa();
        } catch (e) { alert("Errore BOM."); } finally { btnAgg.disabled = false; btnAgg.innerHTML = '➕ Aggiungi'; }
    });

    listRic.addEventListener('click', (e) => { if (e.target.classList.contains('btn-rimuovi-ricetta')) { statoSpesa.ricetteInMenu.splice(e.target.getAttribute('data-index'), 1); statoSpesa.spunte = {}; renderDatiSpesa(); } });
    listAgg.addEventListener('change', (e) => { if (e.target.classList.contains('check-ingrediente')) { statoSpesa.spunte[e.target.getAttribute('data-key')] = e.target.checked; renderDatiSpesa(); } });
    document.getElementById('btn-svuota-spesa').addEventListener('click', () => { if (confirm("Vuoi svuotare il carrello?")) { statoSpesa = { ricetteInMenu: [], spunte: {} }; renderDatiSpesa(); } });
    renderDatiSpesa();
}