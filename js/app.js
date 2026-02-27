// js/app.js
// --- VARIABILI GLOBALI (Lasciale in cima) ---
let idRicettaInModifica = null;
let urlImmagineInModifica = null;

// --- GESTIONE PREFERENZE LOCALI ---
const PREFS_KEY = 'erp_ricettario_prefs';

function getPrefs() {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) || { defaultView: 'grid', theme: 'light' };
}
function savePrefs(prefs) {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
function applicaTema() {
    const prefs = getPrefs();
    document.documentElement.setAttribute('data-bs-theme', prefs.theme);
}

// Applichiamo il tema scuro o chiaro non appena si apre la pagina
applicaTema();


// --- 1. IL GUARDIANO (Parte all'avvio) ---
document.addEventListener('DOMContentLoaded', async () => {
    const session = await API.getSession();

    if (!session) {
        // Se NON sei loggato, il codice si ferma qui e vedi solo il form di login
        return;
    }

    // Se SEI loggato, esegue queste 3 cose:
    document.getElementById('login-container').classList.add('d-none'); // Nasconde login
    document.getElementById('main-app-container').classList.remove('d-none'); // Mostra l'app

    inizializzaNavbar(); // ATTIVA I BOTTONI DELLA NAVBAR (Punto fondamentale)

    UI.renderElenco(); // Carica la galleria
    initElenco();
});

// --- 2. LA FUNZIONE CHE ACCENDE LA NAVBAR E LA BOTTOM NAV (MOBILE) ---
function inizializzaNavbar() {
    // Menu Desktop
    const navElenco = document.getElementById('nav-elenco');
    const navInserimento = document.getElementById('nav-inserimento');
    const navImpostazioni = document.getElementById('nav-impostazioni');
    const navCalendario = document.getElementById('nav-calendario');
    const navSpesa = document.getElementById('nav-spesa');
    const navLogout = document.getElementById('nav-logout');

    // Menu Mobile (Bottom Nav)
    const botElenco = document.getElementById('bot-nav-elenco');
    const botCalendario = document.getElementById('bot-nav-calendario');
    const botSpesa = document.getElementById('bot-nav-spesa');
    const botImpostazioni = document.getElementById('bot-nav-impostazioni');

    function setActiveNav(tag) {
        // Spegne tutti gli indicatori
        [navElenco, navInserimento, navImpostazioni, navCalendario, navSpesa, botElenco, botCalendario, botSpesa, botImpostazioni].forEach(el => {
            if (el) el.classList.remove('active');
        });

        // Accende sia quello su PC che quello su Mobile
        if (tag === 'elenco') { if (navElenco) navElenco.classList.add('active'); if (botElenco) botElenco.classList.add('active'); }
        if (tag === 'inserimento') { if (navInserimento) navInserimento.classList.add('active'); } // Su mobile si entra premendo "Nuova Ricetta" dalla galleria
        if (tag === 'calendario') { if (navCalendario) navCalendario.classList.add('active'); if (botCalendario) botCalendario.classList.add('active'); }
        if (tag === 'spesa') { if (navSpesa) navSpesa.classList.add('active'); if (botSpesa) botSpesa.classList.add('active'); }
        if (tag === 'impostazioni') { if (navImpostazioni) navImpostazioni.classList.add('active'); if (botImpostazioni) botImpostazioni.classList.add('active'); }
    }

    const gestisciClick = (e, tag, renderFunc, initFunc) => {
        if (e) e.preventDefault();
        setActiveNav(tag);
        renderFunc();
        if (initFunc) initFunc();
    };

    // Ascolto Header Desktop
    if (navElenco) navElenco.addEventListener('click', (e) => gestisciClick(e, 'elenco', UI.renderElenco, initElenco));
    if (navCalendario) navCalendario.addEventListener('click', (e) => gestisciClick(e, 'calendario', UI.renderCalendario, initCalendario));
    if (navSpesa) navSpesa.addEventListener('click', (e) => gestisciClick(e, 'spesa', UI.renderSpesa, initSpesa));
    if (navInserimento) navInserimento.addEventListener('click', (e) => gestisciClick(e, 'inserimento', UI.renderInserimento, initInserimento));
    if (navImpostazioni) navImpostazioni.addEventListener('click', (e) => gestisciClick(e, 'impostazioni', UI.renderImpostazioni, initImpostazioni));

    // Ascolto Bottom Nav Mobile
    if (botElenco) botElenco.addEventListener('click', (e) => gestisciClick(e, 'elenco', UI.renderElenco, initElenco));
    if (botCalendario) botCalendario.addEventListener('click', (e) => gestisciClick(e, 'calendario', UI.renderCalendario, initCalendario));
    if (botSpesa) botSpesa.addEventListener('click', (e) => gestisciClick(e, 'spesa', UI.renderSpesa, initSpesa));
    if (botImpostazioni) botImpostazioni.addEventListener('click', (e) => gestisciClick(e, 'impostazioni', UI.renderImpostazioni, initImpostazioni));

    if (navLogout) {
        navLogout.addEventListener('click', async (e) => {
            e.preventDefault();
            await API.logout();
            window.location.reload();
        });
    }
}

// --- 3. GESTIONE INVIO FORM LOGIN (Sempre attiva) ---
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = e.target.querySelector('button');
    btn.disabled = true; btn.textContent = "Verifica...";
    try {
        await API.login(email, password);
        window.location.reload();
    } catch (err) {
        document.getElementById('login-error').classList.remove('d-none');
        btn.disabled = false; btn.textContent = "Accedi al Ricettario";
    }
});

// ==========================================
// GESTIONE LOGIN E LOGOUT
// ==========================================
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = e.target.querySelector('button');
    const errDiv = document.getElementById('login-error');

    btn.disabled = true; btn.textContent = "Verifica in corso..."; errDiv.classList.add('d-none');

    try {
        await API.login(email, password);
        // Ricarichiamo la pagina: al prossimo giro il Guardiano ci farà entrare!
        window.location.reload();
    } catch (err) {
        console.error(err);
        errDiv.classList.remove('d-none');
        btn.disabled = false; btn.textContent = "Accedi al Ricettario";
    }
});

const btnLogout = document.getElementById('nav-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
        e.preventDefault();
        await API.logout();
        window.location.reload(); // Ricaricando, il Guardiano ci sbatte fuori
    });
}

// ==========================================
// 1. IMPOSTAZIONI (Dizionari e Preferenze)
// ==========================================
async function initImpostazioni() {
    // --- GESTIONE PREFERENZE LOCALI ---
    const prefs = getPrefs();
    const selectView = document.getElementById('pref-view');
    const selectTheme = document.getElementById('pref-theme');

    // Imposta i valori salvati
    selectView.value = prefs.defaultView;
    selectTheme.value = prefs.theme;

    // Salva al cambiamento
    selectView.addEventListener('change', (e) => {
        prefs.defaultView = e.target.value;
        savePrefs(prefs);
    });

    selectTheme.addEventListener('change', (e) => {
        prefs.theme = e.target.value;
        savePrefs(prefs);
        applicaTema(); // La pagina diventa subito scura o chiara!
    });

    // --- GESTIONE CATEGORIE E TAGS (Database) ---
    await loadDizionari();
    document.getElementById('btn-add-categoria').addEventListener('click', async () => {
        const val = document.getElementById('input-categoria').value.trim();
        if (val) { await API.addCategoria(val); document.getElementById('input-categoria').value = ''; await loadDizionari(); }
    });
    document.getElementById('btn-add-tag').addEventListener('click', async () => {
        const val = document.getElementById('input-tag').value.trim();
        if (val) { await API.addTag(val); document.getElementById('input-tag').value = ''; await loadDizionari(); }
    });
    document.getElementById('lista-categorie').addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-delete-categoria') && confirm('Sicuro?')) {
            await API.deleteCategoria(e.target.getAttribute('data-id')); await loadDizionari();
        }
    });
    document.getElementById('lista-tag').addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-delete-tag') && confirm('Sicuro?')) {
            await API.deleteTag(e.target.getAttribute('data-id')); await loadDizionari();
        }
    });
}

async function loadDizionari() {
    UI.renderListaCategorie(await API.getCategorie());
    UI.renderListaTag(await API.getTags());
}

async function loadDizionari() {
    UI.renderListaCategorie(await API.getCategorie());
    UI.renderListaTag(await API.getTags());
}

async function loadDizionari() {
    UI.renderListaCategorie(await API.getCategorie());
    UI.renderListaTag(await API.getTags());
}


// ==========================================
// 2. INSERIMENTO E MODIFICA (Form)
// ==========================================
async function initInserimento() {
    let opzioniRicetteHTML = '<option value="">Seleziona ricetta...</option>';
    let categorieDB = [];
    let tagsDB = [];
    let ricetteDB = [];

    // 1. INIETTIAMO I DATALIST INVISIBILI NEL BODY (Per suggerimenti unità/ingredienti)
    if (!document.getElementById('dizionario-ingredienti')) {
        document.body.insertAdjacentHTML('beforeend', `
            <datalist id="dizionario-ingredienti"></datalist>
            <datalist id="dizionario-unita"></datalist>
        `);
    }

    try {
        // SCARICHIAMO I DATI DAL DATABASE
        const [categorie, tags, ricette, dizionario] = await Promise.all([
            API.getCategorie(), API.getTags(), API.getRicetteElencoBreve(), API.getDizionarioIngredienti()
        ]);
        categorieDB = categorie; tagsDB = tags; ricetteDB = ricette;

        document.getElementById('dizionario-ingredienti').innerHTML = dizionario.nomi.map(n => `<option value="${n}">`).join('');
        document.getElementById('dizionario-unita').innerHTML = dizionario.unita.map(u => `<option value="${u}">`).join('');

        const selectCat = document.getElementById('ricetta-categoria');
        categorie.forEach(c => selectCat.innerHTML += `<option value="${c.id}">${c.nome}</option>`);

        const containerTags = document.getElementById('container-tags');
        containerTags.innerHTML = tags.map(t => `<div class="form-check form-check-inline"><input class="form-check-input checkbox-tag" type="checkbox" value="${t.id}" id="tag-${t.id}"><label class="form-check-label" for="tag-${t.id}">${t.nome}</label></div>`).join('') || '<span class="text-muted small">Nessun tag.</span>';

        ricette.forEach(r => opzioniRicetteHTML += `<option value="${r.id}">${r.nome}</option>`);
    } catch (e) { console.error("Errore caricamento dizionari:", e); }

    // --- LOGICA PULSANTI AGGIUNTA RIGHE DINAMICHE ---
    document.getElementById('btn-add-ingrediente').addEventListener('click', () => {
        document.getElementById('container-ingredienti').insertAdjacentHTML('beforeend', UI.getIngredienteRowHTML());
    });
    document.getElementById('btn-add-step').addEventListener('click', () => {
        document.getElementById('container-procedimento').insertAdjacentHTML('beforeend', UI.getStepRowHTML());
        aggiornaNumeriStep();
    });
    document.getElementById('btn-add-sottoricetta').addEventListener('click', () => {
        document.getElementById('container-sottoricette').insertAdjacentHTML('beforeend', UI.getSottoricettaRowHTML(opzioniRicetteHTML));
    });
    document.getElementById('form-ricetta').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-row')) {
            e.target.closest('.row').remove();
            aggiornaNumeriStep();
        }
    });

    // Se stiamo creando una nuova ricetta, aggiungiamo subito una riga vuota
    if (!idRicettaInModifica) {
        document.getElementById('btn-add-ingrediente').click();
        document.getElementById('btn-add-step').click();
    }

    // ==========================================
    // LOGICA DI IMPORTAZIONE TXT ANTIPROIETTILE
    // ==========================================
    const btnImport = document.getElementById('btn-import-txt');
    const inputImport = document.getElementById('input-import-txt');

    if (btnImport && inputImport) {
        const nuovoBtnImport = btnImport.cloneNode(true);
        btnImport.parentNode.replaceChild(nuovoBtnImport, btnImport);

        nuovoBtnImport.addEventListener('click', (e) => {
            e.preventDefault();
            inputImport.click();
        });

        inputImport.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                const testo = event.target.result;
                const blocchi = testo.split('=== RICETTA ===').map(b => b.trim()).filter(b => b !== '');

                if (blocchi.length === 0) {
                    alert("Nessuna ricetta trovata. Controlla il formato.");
                    return;
                }

                const sceltaSalvataggio = confirm(`Ho trovato ${blocchi.length} ricette nel file.\n\nVuoi SALVARE DIRETTAMENTE nel database (premendo OK)?\n\nPremi ANNULLA per caricare l'anteprima nel form e correggerla prima di salvare.`);

                let ricetteProcessate = [];
                for (let blocco of blocchi) {
                    const estraiCampo = (chiave) => {
                        const regex = new RegExp(`${chiave}:\\s*(.*)`, 'i');
                        const match = blocco.match(regex);
                        return match ? match[1].trim() : '';
                    };

                    const estraiSezione = (titolo) => {
                        const regex = new RegExp(`--- ${titolo} ---`, 'i');
                        const parti = blocco.split(regex);
                        if (parti.length < 2) return '';
                        let str = parti[1];
                        const nextHeader = str.match(/--- [A-Z]+ ---/i);
                        if (nextHeader) str = str.substring(0, nextHeader.index);
                        return str.trim();
                    };

                    const nome = estraiCampo('NOME');
                    if (!nome) continue;

                    let id_categoria = null;
                    const catNome = estraiCampo('CATEGORIA');
                    if (catNome) {
                        const catTrovata = categorieDB.find(c => c.nome.toLowerCase() === catNome.toLowerCase());
                        if (catTrovata) id_categoria = catTrovata.id;
                    }

                    let tagsSpuntati = [];
                    const tagsString = estraiCampo('TAGS');
                    if (tagsString) {
                        const nomiTagsTxt = tagsString.split(',').map(t => t.trim().toLowerCase());
                        nomiTagsTxt.forEach(nt => {
                            const tTrovato = tagsDB.find(t => t.nome.toLowerCase() === nt);
                            if (tTrovato) tagsSpuntati.push(tTrovato.id);
                        });
                    }

                    const ricettaData = {
                        nome: nome, id_categoria: id_categoria,
                        porzioni_base: parseFloat(estraiCampo('PORZIONI').replace(',', '.')) || 1,
                        unita_porzioni: estraiCampo('UNITA') || 'pz',
                        tempo_riposo_ore: parseFloat(estraiCampo('RIPOSO \\(ore\\)').replace(',', '.')) || 0,
                        tempo_cottura_min: parseInt(estraiCampo('COTTURA \\(min\\)')) || 0,
                        fonte: '', link_fonte: '', note: estraiCampo('NOTE'), url_immagine: null
                    };

                    const ingredientiData = [];
                    const bloccoIng = estraiSezione('INGREDIENTI');
                    if (bloccoIng) {
                        bloccoIng.split('\n').forEach(linea => {
                            let l = linea.trim().replace(/^[\-\*\•]\s*/, '');
                            if (l.includes('|')) {
                                const parti = l.split('|').map(p => p.trim());
                                if (parti.length >= 2) {
                                    ingredientiData.push({ nome: parti[0], qta: parseFloat(parti[1].replace(',', '.')) || 0, unita: parti[2] || '' });
                                }
                            }
                        });
                    }

                    const procedimentoData = [];
                    const bloccoProc = estraiSezione('PROCEDIMENTO');
                    if (bloccoProc) {
                        bloccoProc.split('\n').forEach(linea => {
                            let l = linea.trim();
                            if (l !== '') {
                                l = l.replace(/^\d+[\.\-\)]\s*/, '');
                                procedimentoData.push({ desc: l });
                            }
                        });
                    }

                    const sottoricetteData = [];
                    const bloccoSr = estraiSezione('SOTTORICETTE');
                    if (bloccoSr) {
                        bloccoSr.split('\n').forEach(linea => {
                            let l = linea.trim().replace(/^[\-\*\•]\s*/, '');
                            if (l.includes('|')) {
                                const parti = l.split('|').map(p => p.trim());
                                if (parti.length >= 2) {
                                    const ricTrovata = ricetteDB.find(r => r.nome.toLowerCase() === parti[0].toLowerCase());
                                    if (ricTrovata) sottoricetteData.push({ id_figlia: ricTrovata.id, moltiplicatore: parseFloat(parti[1].replace(',', '.')) || 1 });
                                }
                            }
                        });
                    }

                    ricetteProcessate.push({ ricettaData, ingredientiData, procedimentoData, tagsSpuntati, sottoricetteData });
                }

                if (ricetteProcessate.length === 0) return;

                if (sceltaSalvataggio) {
                    nuovoBtnImport.disabled = true; nuovoBtnImport.textContent = "Salvataggio...";
                    try {
                        for (let r of ricetteProcessate) {
                            await API.salvaRicettaCompleta(r.ricettaData, r.ingredientiData, r.procedimentoData, r.tagsSpuntati, r.sottoricetteData);
                        }
                        alert(`Successo! Importate direttamente ${ricetteProcessate.length} ricette.`);
                        document.getElementById('nav-elenco').click();
                    } catch (err) { alert("Errore salvataggio: " + err.message); }
                    finally { nuovoBtnImport.disabled = false; nuovoBtnImport.innerHTML = "📄 Importa da TXT"; }
                } else {
                    const prima = ricetteProcessate[0];
                    if (blocchi.length > 1) alert("Attenzione: avendo scelto l'anteprima, verrà pre-compilata SOLO la prima ricetta del file.");

                    document.getElementById('ricetta-nome').value = prima.ricettaData.nome;
                    if (prima.ricettaData.id_categoria) document.getElementById('ricetta-categoria').value = prima.ricettaData.id_categoria;
                    document.getElementById('ricetta-porzioni').value = prima.ricettaData.porzioni_base;
                    document.getElementById('ricetta-unita').value = prima.ricettaData.unita_porzioni;
                    document.getElementById('ricetta-riposo').value = prima.ricettaData.tempo_riposo_ore;
                    document.getElementById('ricetta-cottura').value = prima.ricettaData.tempo_cottura_min;
                    document.getElementById('ricetta-note').value = prima.ricettaData.note;
                    document.getElementById('ricetta-fonte').value = '';
                    document.getElementById('ricetta-link').value = '';

                    document.querySelectorAll('.checkbox-tag').forEach(chk => chk.checked = false);
                    prima.tagsSpuntati.forEach(tagId => { const cb = document.getElementById(`tag-${tagId}`); if (cb) cb.checked = true; });

                    document.getElementById('container-ingredienti').innerHTML = '';
                    document.getElementById('container-procedimento').innerHTML = '';
                    document.getElementById('container-sottoricette').innerHTML = '';

                    prima.ingredientiData.forEach(ing => {
                        document.getElementById('btn-add-ingrediente').click();
                        const riga = document.getElementById('container-ingredienti').lastElementChild;
                        riga.querySelector('.ing-nome').value = ing.nome;
                        riga.querySelector('.ing-qta').value = ing.qta;
                        riga.querySelector('.ing-unita').value = ing.unita;
                    });

                    prima.procedimentoData.forEach(step => {
                        document.getElementById('btn-add-step').click();
                        const riga = document.getElementById('container-procedimento').lastElementChild;
                        const txtArea = riga.querySelector('.step-desc');
                        txtArea.value = step.desc;
                        setTimeout(() => { txtArea.style.height = 'auto'; txtArea.style.height = txtArea.scrollHeight + 'px'; }, 10);
                    });

                    prima.sottoricetteData.forEach(sr => {
                        document.getElementById('btn-add-sottoricetta').click();
                        const riga = document.getElementById('container-sottoricette').lastElementChild;
                        riga.querySelector('.sr-id').value = sr.id_figlia;
                        riga.querySelector('.sr-moltiplicatore').value = sr.moltiplicatore;
                    });

                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    }

    // ==========================================
    // LOGICA ELIMINAZIONE RICETTA (Solo in Modifica)
    // ==========================================
    const btnEliminaForm = document.getElementById('btn-elimina-ricetta-form');
    if (btnEliminaForm) {
        // Cloniamo il bottone per rimuovere vecchi "ascoltatori"
        const nuovoBtnElimina = btnEliminaForm.cloneNode(true);
        btnEliminaForm.parentNode.replaceChild(nuovoBtnElimina, btnEliminaForm);

        nuovoBtnElimina.addEventListener('click', async () => {
            if (!idRicettaInModifica) return;

            const conferma = confirm("Sei sicuro di voler eliminare definitivamente questa ricetta dal database?");
            if (!conferma) return;

            try {
                nuovoBtnElimina.disabled = true;
                nuovoBtnElimina.innerHTML = "🗑 Eliminazione in corso...";

                await API.deleteRicetta(idRicettaInModifica, urlImmagineInModifica);

                alert("Ricetta eliminata con successo!");

                idRicettaInModifica = null;
                urlImmagineInModifica = null;
                document.getElementById('nav-elenco').click(); // Torna alla galleria
            } catch (err) {
                console.error(err);
                alert("Errore durante l'eliminazione: " + err.message);
                nuovoBtnElimina.disabled = false;
                nuovoBtnElimina.innerHTML = "🗑 Elimina";
            }
        });
    }

    // ==========================================
    // SALVATAGGIO MANUALE DEL FORM
    // ==========================================
    document.getElementById('form-ricetta').addEventListener('submit', async (e) => {
        e.preventDefault();

        // PUNTIAMO AL NUOVO BOTTONE IN ALTO
        const btnSubmit = document.getElementById('btn-salva-ricetta-top');
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Salvataggio in corso...";

        try {
            let url_immagine = idRicettaInModifica ? urlImmagineInModifica : null;
            const fileInput = document.getElementById('ricetta-immagine');
            if (fileInput.files.length > 0) {
                url_immagine = await API.uploadImmagine(fileInput.files[0]);
            }

            const idCat = document.getElementById('ricetta-categoria').value;
            const ricettaData = {
                nome: document.getElementById('ricetta-nome').value.trim(),
                id_categoria: idCat ? parseInt(idCat) : null,
                porzioni_base: parseFloat(document.getElementById('ricetta-porzioni').value),
                unita_porzioni: document.getElementById('ricetta-unita').value.trim(),
                tempo_riposo_ore: parseFloat(document.getElementById('ricetta-riposo').value) || 0,
                tempo_cottura_min: parseInt(document.getElementById('ricetta-cottura').value) || 0,
                fonte: document.getElementById('ricetta-fonte')?.value.trim() || null,
                link_fonte: document.getElementById('ricetta-link')?.value.trim() || null,
                note: document.getElementById('ricetta-note')?.value.trim() || null,
                url_immagine: url_immagine
            };

            const tagsSpuntati = Array.from(document.querySelectorAll('.checkbox-tag:checked')).map(cb => cb.value);

            const ingredientiData = Array.from(document.querySelectorAll('.riga-ingrediente')).map(r => ({
                nome: r.querySelector('.ing-nome').value.trim(),
                qta: parseFloat(r.querySelector('.ing-qta').value),
                unita: r.querySelector('.ing-unita').value.trim()
            })).filter(i => i.nome !== "");

            const procedimentoData = Array.from(document.querySelectorAll('.riga-step')).map(r => ({
                desc: r.querySelector('.step-desc').value.trim()
            })).filter(s => s.desc !== "");

            const sottoricetteData = Array.from(document.querySelectorAll('.riga-sottoricetta')).map(r => ({
                id_figlia: r.querySelector('.sr-id').value,
                moltiplicatore: parseFloat(r.querySelector('.sr-moltiplicatore').value)
            })).filter(sr => sr.id_figlia !== "" && !isNaN(sr.moltiplicatore));

            // ESEGUIAMO L'AGGIORNAMENTO O IL SALVATAGGIO
            if (idRicettaInModifica) {
                await API.aggiornaRicettaCompleta(idRicettaInModifica, ricettaData, ingredientiData, procedimentoData, tagsSpuntati, sottoricetteData);
                alert("Ricetta aggiornata con successo!");
            } else {
                await API.salvaRicettaCompleta(ricettaData, ingredientiData, procedimentoData, tagsSpuntati, sottoricetteData);
                alert("Nuova ricetta salvata con successo!");
            }

            // PULIZIA E RITORNO ALLA GALLERIA
            idRicettaInModifica = null;
            urlImmagineInModifica = null;
            document.getElementById('nav-elenco').click();

        } catch (error) {
            console.error(error);
            alert("Errore: " + error.message);
            // In caso di errore sblocchiamo il bottone in alto
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = idRicettaInModifica ? "💾 Salva Modifiche" : "💾 Salva Ricetta";
        }
    });
}
function aggiornaNumeriStep() {
    document.querySelectorAll('.riga-step .step-number').forEach((el, index) => el.textContent = index + 1);
}

function aggiornaNumeriStep() {
    document.querySelectorAll('.riga-step .step-number').forEach((el, index) => el.textContent = index + 1);
}

function aggiornaNumeriStep() {
    document.querySelectorAll('.riga-step .step-number').forEach((el, index) => el.textContent = index + 1);
}


// ==========================================
// 3. ELENCO (Galleria)
// ==========================================
async function initElenco() {

    try {
        const [ricette, categorie, tags] = await Promise.all([API.getRicetteGalleria(), API.getCategorie(), API.getTags()]);
        cacheRicette = ricette;
        const prefs = getPrefs();
        let currentView = prefs.defaultView; // Legge l'impostazione salvata!

        const inputTesto = document.getElementById('filtro-testo');
        const btnGrid = document.getElementById('btn-view-grid');
        const btnList = document.getElementById('btn-view-list');

        // Aggiorniamo i bottoni graficamente in base alla preferenza
        if (currentView === 'list') {
            btnList.classList.add('active');
            btnGrid.classList.remove('active');
        } else {
            btnGrid.classList.add('active');
            btnList.classList.remove('active');
        }

        const selectCat = document.getElementById('filtro-categoria');
        categorie.forEach(c => selectCat.innerHTML += `<option value="${c.nome}">${c.nome}</option>`);

        const selectTag = document.getElementById('filtro-tag');
        tags.forEach(t => selectTag.innerHTML += `<option value="${t.nome}">${t.nome}</option>`);


        function applicaFiltri() {
            const testo = inputTesto.value.toLowerCase().trim();
            const catScelta = selectCat.value;
            const tagScelto = selectTag.value;

            let ricetteFiltrate = cacheRicette.filter(r => {
                const matchTesto = r.nome.toLowerCase().includes(testo);
                const nomeCategoria = r.categorie ? r.categorie.nome : '';
                const matchCategoria = catScelta === "" || nomeCategoria === catScelta;
                const nomiTags = r.ricette_tags.map(rt => rt.tag.nome);
                const matchTag = tagScelto === "" || nomiTags.includes(tagScelto);
                return matchTesto && matchCategoria && matchTag;
            });

            // ORDINE ALFABETICO ASSOLUTO PER TUTTE LE RICETTE (Indipendente dalla vista)
            ricetteFiltrate.sort((a, b) => a.nome.localeCompare(b.nome));

            UI.renderCards(ricetteFiltrate, currentView);
        }

        inputTesto.addEventListener('input', applicaFiltri);
        selectCat.addEventListener('change', applicaFiltri);
        selectTag.addEventListener('change', applicaFiltri);

        btnGrid.addEventListener('click', () => { currentView = 'grid'; btnGrid.classList.add('active'); btnList.classList.remove('active'); applicaFiltri(); });
        btnList.addEventListener('click', () => { currentView = 'list'; btnList.classList.add('active'); btnGrid.classList.remove('active'); applicaFiltri(); });

        applicaFiltri();

        // Click sulla singola card
        document.getElementById('griglia-ricette').addEventListener('click', (e) => {
            const card = e.target.closest('.ricetta-card');
            if (card) apriDettaglioRicetta(card.getAttribute('data-id'));
        });

    } catch (error) {
        console.error(error); document.getElementById('griglia-ricette').innerHTML = `<div class="col-12 alert alert-danger">Errore database.</div>`;
    }
}


// ==========================================
// 4. DETTAGLIO E RICALCOLO
// ==========================================
async function apriDettaglioRicetta(id_ricetta) {
    UI.container.innerHTML = `<div class="text-center mt-5"><div class="spinner-border text-primary" role="status"></div></div>`;

    try {
        const ricetta = await API.getRicettaCompleta(id_ricetta);
        UI.renderDettaglio(ricetta);

        const inputRicalcolo = document.getElementById('input-ricalcolo');
        const listaIngredienti = document.getElementById('lista-ingredienti-ricalcolati');
        const containerSottoricette = document.getElementById('container-sottoricette-ricalcolate');

        // ------------------------------------------
        // GESTIONE MODALITÀ CUCINA
        // ------------------------------------------
        const btnCucina = document.getElementById('btn-cucina-ricetta');
        if (btnCucina) {
            btnCucina.addEventListener('click', () => {
                const porzioniDesiderate = parseFloat(inputRicalcolo.value) || ricetta.porzioni_base;
                const rapporto = porzioniDesiderate / ricetta.porzioni_base;
                avviaModalitaCucina(ricetta, rapporto);
            });
        }

        function ricalcolaBOM() {
            const porzioniDesiderate = parseFloat(inputRicalcolo.value) || 0;
            const rapporto = porzioniDesiderate / ricetta.porzioni_base;

            let htmlIngredienti = '';
            ricetta.ingredienti.forEach(ing => {
                const nuovaQta = Number((ing.quantita * rapporto).toFixed(2));
                htmlIngredienti += `<li class="list-group-item d-flex justify-content-between align-items-center">${ing.nome_ingrediente}<span class="badge bg-dark rounded-pill fs-6">${nuovaQta} ${ing.unita_distinta}</span></li>`;
            });
            listaIngredienti.innerHTML = htmlIngredienti || '<li class="list-group-item">Nessun ingrediente</li>';

            let htmlSottoricette = '';
            if (ricetta.sottoricette_esplose && ricetta.sottoricette_esplose.length > 0) {
                htmlSottoricette += `<h5 class="fw-bold mb-3 mt-4 border-top pt-3">Sottoricette Incluse</h5>`;

                ricetta.sottoricette_esplose.forEach(sr => {
                    const ricFiglia = sr.ricetta_figlia;
                    const rapportoSottoricetta = rapporto * sr.moltiplicatore;
                    let subProcedure = ricFiglia.procedimento || [];
                    subProcedure.sort((a, b) => a.step_num - b.step_num);

                    htmlSottoricette += `<div class="card border-warning mb-4 shadow-sm"><div class="card-header bg-warning text-dark fw-bold py-2 d-flex justify-content-between align-items-center"><span>↳ ${ricFiglia.nome}</span><button class="btn btn-sm btn-dark btn-apri-sottoricetta" data-id="${ricFiglia.id}">Apri Ricetta</button></div><div class="card-body p-0"><ul class="list-group list-group-flush small">`;

                    ricFiglia.ingredienti.forEach(subIng => {
                        const nuovaSubQta = Number((subIng.quantita * rapportoSottoricetta).toFixed(2));
                        htmlSottoricette += `<li class="list-group-item d-flex justify-content-between align-items-center bg-light">${subIng.nome_ingrediente}<span class="fw-bold">${nuovaSubQta} ${subIng.unita_distinta}</span></li>`;
                    });
                    htmlSottoricette += `</ul>`;

                    if (subProcedure.length > 0) {
                        htmlSottoricette += `<div class="p-3 border-top bg-white"><h6 class="fw-bold mb-2 small text-muted">PROCEDIMENTO:</h6>`;
                        subProcedure.forEach(step => { htmlSottoricette += `<div class="mb-2 small"><strong class="me-1">${step.step_num}.</strong> ${step.descrizione}</div>`; });
                        htmlSottoricette += `</div>`;
                    }
                    htmlSottoricette += `</div></div>`;
                });
            }
            containerSottoricette.innerHTML = htmlSottoricette;
        }

        ricalcolaBOM();
        inputRicalcolo.addEventListener('input', ricalcolaBOM);

        document.getElementById('btn-torna-elenco').addEventListener('click', () => { UI.renderElenco(); initElenco(); });

        containerSottoricette.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-apri-sottoricetta')) {
                window.scrollTo(0, 0); apriDettaglioRicetta(e.target.getAttribute('data-id'));
            }
        });

        // ------------------------------------------
        // GESTIONE ELIMINAZIONE
        // ------------------------------------------
        const btnElimina = document.getElementById('btn-elimina-ricetta');
        if (btnElimina) {
            btnElimina.addEventListener('click', async () => {
                const idDaEliminare = btnElimina.getAttribute('data-id');
                try {
                    const ricetteCoinvolte = await API.getUsiComeSottoricetta(idDaEliminare);
                    if (ricetteCoinvolte.length > 0) {
                        const listaNomi = ricetteCoinvolte.map(n => "• " + n).join("\n");
                        if (!confirm(`⚠️ ATTENZIONE: DISTINTA BASE CONDIVISA ⚠️\n\nQuesta ricetta è utilizzata come Sottoricetta nelle seguenti preparazioni:\n\n${listaNomi}\n\nSe elimini, verrà strappata via. Procedere forzatamente?`)) return;
                    } else {
                        if (!confirm("Sei sicuro di voler eliminare definitivamente questa ricetta?")) return;
                    }

                    btnElimina.disabled = true; btnElimina.textContent = "Eliminazione...";
                    await API.deleteRicetta(idDaEliminare, btnElimina.getAttribute('data-img'));
                    alert("Ricetta eliminata!"); UI.renderElenco(); initElenco();
                } catch (err) { alert("Errore: " + err.message); btnElimina.disabled = false; btnElimina.textContent = "🗑 Elimina"; }
            });
        }

        // ------------------------------------------
        // GESTIONE STAMPA / PDF
        // ------------------------------------------
        const btnStampa = document.getElementById('btn-stampa-ricetta');
        if (btnStampa) {
            btnStampa.addEventListener('click', () => window.print());
        }

        // ------------------------------------------
        // GESTIONE MODIFICA (AUTOCOMPILAZIONE SICURA)
        // ------------------------------------------
        const btnModifica = document.getElementById('btn-modifica-ricetta');
        if (btnModifica) {
            btnModifica.addEventListener('click', async () => {
                idRicettaInModifica = ricetta.id;
                urlImmagineInModifica = ricetta.url_immagine;

                // Cambiamo interfaccia visiva
                document.getElementById('nav-elenco').classList.remove('active');
                document.getElementById('nav-inserimento').classList.add('active');
                UI.renderInserimento();

                // ASPETTIAMO che il form sia agganciato e i dati dal DB siano scaricati (Tendine)
                await initInserimento();

                // 1. Modifichiamo titoli e bottoni in alto
                const h2Titolo = document.getElementById('titolo-inserimento');
                if (h2Titolo) h2Titolo.textContent = "✏️ Modifica Ricetta";

                const btnSubmit = document.getElementById('btn-salva-ricetta-top');
                if (btnSubmit) {
                    btnSubmit.textContent = "💾 Salva Modifiche";
                    btnSubmit.classList.replace('btn-success', 'btn-primary');
                }

                // 2. Facciamo apparire il tasto "Elimina"
                const btnEliminaForm = document.getElementById('btn-elimina-ricetta-form');
                if (btnEliminaForm) btnEliminaForm.classList.remove('d-none');

                // 3. Precompilazione dei campi base
                document.getElementById('ricetta-nome').value = ricetta.nome || '';

                if (ricetta.categorie) {
                    const selectCat = document.getElementById('ricetta-categoria');
                    Array.from(selectCat.options).forEach(opt => { if (opt.text === ricetta.categorie.nome) opt.selected = true; });
                }

                document.getElementById('ricetta-porzioni').value = ricetta.porzioni_base || '';
                document.getElementById('ricetta-unita').value = ricetta.unita_porzioni || '';
                document.getElementById('ricetta-riposo').value = ricetta.tempo_riposo_ore || 0;
                document.getElementById('ricetta-cottura').value = ricetta.tempo_cottura_min || 0;

                const fieldFonte = document.getElementById('ricetta-fonte');
                if (fieldFonte) fieldFonte.value = ricetta.fonte || '';

                const fieldLink = document.getElementById('ricetta-link');
                if (fieldLink) fieldLink.value = ricetta.link_fonte || '';

                document.getElementById('ricetta-note').value = ricetta.note || '';

                // Tags
                if (ricetta.ricette_tags) {
                    const nomiTags = ricetta.ricette_tags.map(rt => rt.tag.nome);
                    document.querySelectorAll('.checkbox-tag').forEach(chk => {
                        const labelTesto = chk.nextElementSibling.textContent;
                        if (nomiTags.includes(labelTesto)) chk.checked = true;
                    });
                }

                const containerIng = document.getElementById('container-ingredienti');
                const containerProc = document.getElementById('container-procedimento');
                const containerSr = document.getElementById('container-sottoricette');
                containerIng.innerHTML = ''; containerProc.innerHTML = ''; containerSr.innerHTML = '';

                // Compilazione Liste
                if (ricetta.ingredienti) {
                    ricetta.ingredienti.forEach(ing => {
                        document.getElementById('btn-add-ingrediente').click();
                        const riga = containerIng.lastElementChild;
                        riga.querySelector('.ing-nome').value = ing.nome_ingrediente;
                        riga.querySelector('.ing-qta').value = ing.quantita;
                        riga.querySelector('.ing-unita').value = ing.unita_distinta || '';
                    });
                }

                if (ricetta.procedimento) {
                    ricetta.procedimento.forEach(step => {
                        document.getElementById('btn-add-step').click();
                        const riga = containerProc.lastElementChild;
                        const txt = riga.querySelector('.step-desc');
                        txt.value = step.descrizione;
                        setTimeout(() => { txt.style.height = txt.scrollHeight + 'px'; }, 10);
                    });
                }

                if (ricetta.sottoricette_esplose) {
                    ricetta.sottoricette_esplose.forEach(sr => {
                        document.getElementById('btn-add-sottoricetta').click();
                        const riga = containerSr.lastElementChild;
                        riga.querySelector('.sr-id').value = sr.ricetta_figlia.id;
                        riga.querySelector('.sr-moltiplicatore').value = sr.moltiplicatore;
                    });
                }

                window.scrollTo(0, 0); // Riportiamo in alto
            }); // <-- Questa parentesi chiude l'evento del click
        }

    } catch (error) {
        console.error(error);
        UI.container.innerHTML = `<div class="alert alert-danger">Errore durante il caricamento della ricetta.</div>`;
    } // <-- Questa parentesi chiude il Try/Catch principale
}

// ==========================================
// 5. CALENDARIO E STORICO MES
// ==========================================
async function initCalendario() {
    try {
        // CAMBIO FONDAMENTALE: Usiamo 'let' invece di 'const' per poter sovrascrivere i dati dopo un'eliminazione
        let [storico, ricette] = await Promise.all([
            API.getStorico(),
            API.getRicetteElencoBreve()
        ]);

        let meseCorrente = new Date().getMonth();
        let annoCorrente = new Date().getFullYear();
        let vistaAttiva = 'lista';

        // 1. Popoliamo la tendina delle ricette
        const selectRicetta = document.getElementById('prod-ricetta');
        selectRicetta.innerHTML = '<option value="">-- Seleziona la ricetta prodotta --</option>';
        ricette.forEach(r => selectRicetta.innerHTML += `<option value="${r.id}">${r.nome}</option>`);

        // Impostiamo la data di default a oggi
        document.getElementById('prod-data').valueAsDate = new Date();

        // 2. CALCOLO STATISTICHE DASHBOARD
        function aggiornaStatistiche() {
            const annoAttuale = new Date().getFullYear();
            const storicoAnno = storico.filter(s => new Date(s.data_svolgimento).getFullYear() === annoAttuale);

            const totProduzioni = storicoAnno.length;

            // Calcolo ricetta più prodotta
            const conteggioRicette = {};
            storicoAnno.forEach(s => {
                const nome = s.ricette.nome;
                conteggioRicette[nome] = (conteggioRicette[nome] || 0) + 1;
            });
            let ricettaTop = "Nessuna";
            let maxProd = 0;
            for (const [nome, count] of Object.entries(conteggioRicette)) {
                if (count > maxProd) { maxProd = count; ricettaTop = nome; }
            }

            document.getElementById('dashboard-statistiche').innerHTML = `
                <div class="col-md-4 mb-3">
                    <div class="card bg-primary text-white shadow-sm text-center h-100 py-2">
                        <div class="card-body">
                            <h6 class="text-uppercase mb-1">Produzioni ${annoAttuale}</h6>
                            <h2 class="display-6 fw-bold mb-0">${totProduzioni}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-8 mb-3">
                    <div class="card bg-white border-primary shadow-sm h-100 py-2">
                        <div class="card-body d-flex align-items-center justify-content-between">
                            <div>
                                <h6 class="text-muted text-uppercase mb-1">Ricetta più prodotta</h6>
                                <h4 class="fw-bold text-dark mb-0">${ricettaTop} <small class="text-muted fs-6">(${maxProd} volte)</small></h4>
                            </div>
                            <div class="text-primary display-6">🏆</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // 3. GENERAZIONE VISTE (Diario vs Calendario)
        function renderVista() {
            const container = document.getElementById('calendario-view-container');

            if (vistaAttiva === 'lista') {
                // VISTA DIARIO (Lista cronologica)
                let html = '<div class="list-group list-group-flush">';
                if (storico.length === 0) html += '<p class="text-muted">Nessuna produzione registrata.</p>';

                storico.forEach(s => {
                    const dataFormat = new Date(s.data_svolgimento).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
                    html += `
                        <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3">
                            <div>
                                <h6 class="mb-1 fw-bold text-primary">${s.ricette.nome}</h6>
                                <small class="text-muted">Prodotte: <strong>${s.porzioni_prodotte}</strong> porzioni</small>
                            </div>
                            <div class="d-flex align-items-center">
                                <span class="badge bg-light text-dark border me-3">${dataFormat}</span>
                                <button class="btn btn-sm btn-outline-danger shadow-sm btn-delete-produzione" data-id="${s.id}" title="Elimina dallo storico">🗑</button>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
                container.innerHTML = html;

            } else {
                // VISTA CALENDARIO MENSILE
                const nomiMesi = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
                const primoGiorno = new Date(annoCorrente, meseCorrente, 1).getDay();
                const offset = primoGiorno === 0 ? 6 : primoGiorno - 1;
                const giorniNelMese = new Date(annoCorrente, meseCorrente + 1, 0).getDate();

                let html = `
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <button class="btn btn-sm btn-outline-secondary" id="btn-mese-prec">◀ Prec</button>
                            <button class="btn btn-sm btn-outline-primary ms-1 fw-bold" id="btn-mese-oggi">Oggi</button>
                        </div>
                        <h5 class="fw-bold mb-0">${nomiMesi[meseCorrente]} ${annoCorrente}</h5>
                        <button class="btn btn-sm btn-outline-secondary" id="btn-mese-succ">Succ ▶</button>
                    </div>

                    <div class="calendario-table-wrapper">
                        <table class="table table-bordered table-fixed text-center" style="table-layout: fixed;">
                            <thead class="bg-light"><tr><th>Lun</th><th>Mar</th><th>Mer</th><th>Gio</th><th>Ven</th><th>Sab</th><th>Dom</th></tr></thead>
                            <tbody><tr>
                `;

                let giornoSettimana = 0;
                for (let i = 0; i < offset; i++) { html += '<td class="bg-light text-muted"></td>'; giornoSettimana++; }

                for (let giorno = 1; giorno <= giorniNelMese; giorno++) {
                    if (giornoSettimana === 7) { html += '</tr><tr>'; giornoSettimana = 0; }

                    const dataCorrenteStr = `${annoCorrente}-${String(meseCorrente + 1).padStart(2, '0')}-${String(giorno).padStart(2, '0')}`;
                    const produzioniOggi = storico.filter(s => s.data_svolgimento === dataCorrenteStr);

                    // Aggiunta piccola X dentro al badge
                    let badgeHtml = produzioniOggi.map(p => `
                        <div class="badge bg-success d-flex justify-content-between align-items-center mb-1 shadow-sm px-2 py-1" title="${p.ricette.nome}">
                            <span class="text-truncate text-start" style="max-width: 80%;">${p.ricette.nome}</span>
                            <span class="text-white ms-1 btn-delete-produzione" style="cursor:pointer;" data-id="${p.id}">✖</span>
                        </div>
                    `).join('');

                    html += `<td style="height: 100px; vertical-align: top;" class="p-1"><div class="fw-bold text-muted small text-end mb-1">${giorno}</div>${badgeHtml}</td>`;
                    giornoSettimana++;
                }

                while (giornoSettimana < 7) { html += '<td class="bg-light text-muted"></td>'; giornoSettimana++; }

                // NUOVO DIV WRAPPER MOBILE FINE
                html += '</tr></tbody></table></div>';

                container.innerHTML = html;

                document.getElementById('btn-mese-prec').addEventListener('click', () => {
                    meseCorrente--; if (meseCorrente < 0) { meseCorrente = 11; annoCorrente--; } renderVista();
                });
                document.getElementById('btn-mese-succ').addEventListener('click', () => {
                    meseCorrente++; if (meseCorrente > 11) { meseCorrente = 0; annoCorrente++; } renderVista();
                });
                document.getElementById('btn-mese-oggi').addEventListener('click', () => {
                    meseCorrente = new Date().getMonth();
                    annoCorrente = new Date().getFullYear();
                    renderVista();
                });
            }
        }

        aggiornaStatistiche();
        renderVista();

        // 4. GESTIONE TOGGLE
        document.getElementById('btn-view-lista').addEventListener('click', (e) => {
            vistaAttiva = 'lista'; e.target.classList.add('active'); document.getElementById('btn-view-griglia').classList.remove('active'); renderVista();
        });
        document.getElementById('btn-view-griglia').addEventListener('click', (e) => {
            vistaAttiva = 'griglia'; e.target.classList.add('active'); document.getElementById('btn-view-lista').classList.remove('active'); renderVista();
        });

        // 5. ELIMINAZIONE DI UNA PRODUZIONE
        document.getElementById('calendario-view-container').addEventListener('click', async (e) => {
            const btnDelete = e.target.closest('.btn-delete-produzione');
            if (btnDelete) {
                const idProd = btnDelete.getAttribute('data-id');
                if (confirm('Sei sicuro di voler eliminare questa registrazione dal calendario?')) {
                    try {
                        btnDelete.style.opacity = '0.5';
                        await API.deleteProduzione(idProd);

                        // AGGIORNAMENTO DOLCE: Riscriviamo solo i dati per non creare cloni dei click!
                        storico = await API.getStorico();
                        aggiornaStatistiche();
                        renderVista();
                    } catch (err) {
                        alert('Errore durante l\'eliminazione: ' + err.message);
                        btnDelete.style.opacity = '1';
                    }
                }
            }
        });

        // 6. GESTIONE FORM DI PRODUZIONE
        const formContainer = document.getElementById('form-produzione-container');
        document.getElementById('btn-nuova-produzione').addEventListener('click', () => formContainer.classList.remove('d-none'));
        document.getElementById('btn-annulla-produzione').addEventListener('click', () => formContainer.classList.add('d-none'));

        let ricettaSelezionataCompleta = null;

        selectRicetta.addEventListener('change', async (e) => {
            const id = e.target.value;
            const containerDettagli = document.getElementById('prod-dettagli-dinamici');
            containerDettagli.innerHTML = '';
            ricettaSelezionataCompleta = null;

            if (!id) return;

            containerDettagli.innerHTML = '<div class="spinner-border text-success spinner-border-sm"></div> Caricamento distinte base...';

            try {
                ricettaSelezionataCompleta = await API.getRicettaCompleta(id);

                const generaBloccoInput = (idRicetta, nome, porzioniBase, unita, isSottoricetta = false) => `
                    <div class="card border-${isSottoricetta ? 'warning' : 'primary'} mb-3 riga-produzione-item" data-id="${idRicetta}">
                        <div class="card-header bg-${isSottoricetta ? 'warning text-dark' : 'primary text-white'} py-2 fw-bold d-flex justify-content-between align-items-center">
                            <span>${isSottoricetta ? '↳ Sottoricetta: ' : 'Ricetta Principale: '} ${nome}</span>
                        </div>
                        <div class="card-body bg-white py-2">
                            <div class="row align-items-center mb-2">
                                <div class="col-md-4">
                                    <div class="form-check form-switch">
                                      <input class="form-check-input check-porzioni-modificate" type="checkbox" id="check-mod-${idRicetta}">
                                      <label class="form-check-label small" for="check-mod-${idRicetta}">Porzioni modificate?</label>
                                    </div>
                                </div>
                                <div class="col-md-8">
                                    <div class="input-group input-group-sm contenitore-input-porzioni d-none">
                                        <span class="input-group-text">Prodotte:</span>
                                        <input type="number" step="0.1" class="form-control input-porzioni-reali" value="${porzioniBase}" data-base="${porzioniBase}">
                                        <span class="input-group-text">${unita}</span>
                                    </div>
                                </div>
                            </div>
                            <textarea class="form-control form-control-sm input-note-produzione" rows="2" placeholder="Note post-preparazione (es. temperatura ambiente diversa, farina più umida...)"></textarea>
                            <input type="hidden" class="vecchie-note-nascoste" value="${ricettaSelezionataCompleta.note || ''}">
                        </div>
                    </div>
                `;

                let html = generaBloccoInput(ricettaSelezionataCompleta.id, ricettaSelezionataCompleta.nome, ricettaSelezionataCompleta.porzioni_base, ricettaSelezionataCompleta.unita_porzioni);

                if (ricettaSelezionataCompleta.sottoricette_esplose && ricettaSelezionataCompleta.sottoricette_esplose.length > 0) {
                    html += `<h6 class="mt-4 fw-bold text-muted border-bottom pb-1">Sottoricette incluse (verranno registrate in automatico)</h6>`;
                    ricettaSelezionataCompleta.sottoricette_esplose.forEach(sr => {
                        const rFiglia = sr.ricetta_figlia;
                        html += generaBloccoInput(rFiglia.id, rFiglia.nome, rFiglia.porzioni_base, rFiglia.unita_porzioni, true);
                    });
                }

                containerDettagli.innerHTML = html;

                containerDettagli.querySelectorAll('.check-porzioni-modificate').forEach(chk => {
                    chk.addEventListener('change', (ev) => {
                        const inputGroup = ev.target.closest('.card-body').querySelector('.contenitore-input-porzioni');
                        if (ev.target.checked) inputGroup.classList.remove('d-none');
                        else inputGroup.classList.add('d-none');
                    });
                });

            } catch (err) {
                containerDettagli.innerHTML = `<div class="alert alert-danger">Errore caricamento dettagli.</div>`;
            }
        });

        // 7. SALVATAGGIO PRODUZIONE
        document.getElementById('form-produzione').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!ricettaSelezionataCompleta) return;

            const btnSubmit = e.target.querySelector('button[type="submit"]');
            btnSubmit.disabled = true; btnSubmit.textContent = "Salvataggio...";

            try {
                const dataSvolgimento = document.getElementById('prod-data').value;
                const dataFormatItaliana = new Date(dataSvolgimento).toLocaleDateString('it-IT');

                let produzioniDaSalvare = [];
                let noteDaAggiornare = [];

                document.querySelectorAll('.riga-produzione-item').forEach(blocco => {
                    const idRic = blocco.getAttribute('data-id');
                    const checkMod = blocco.querySelector('.check-porzioni-modificate').checked;
                    const inputValore = blocco.querySelector('.input-porzioni-reali');
                    const porzioniEffettive = checkMod ? parseFloat(inputValore.value) : parseFloat(inputValore.getAttribute('data-base'));

                    produzioniDaSalvare.push({
                        id_ricetta: idRic,
                        data_svolgimento: dataSvolgimento,
                        porzioni_prodotte: porzioniEffettive
                    });

                    const noteNuove = blocco.querySelector('.input-note-produzione').value.trim();
                    if (noteNuove !== "") {
                        const noteVecchie = blocco.querySelector('.vecchie-note-nascoste').value;
                        const bloccoTestoNote = `\n\n--- Note prep. ${dataFormatItaliana} ---\n${noteNuove}`;
                        const noteFinali = noteVecchie ? (noteVecchie + bloccoTestoNote) : bloccoTestoNote.trim();

                        noteDaAggiornare.push({ id_ricetta: idRic, note_finali: noteFinali });
                    }
                });

                await API.registraProduzione(produzioniDaSalvare, noteDaAggiornare);

                alert("Produzione registrata e note aggiornate con successo!");

                formContainer.classList.add('d-none');
                document.getElementById('form-produzione').reset();
                document.getElementById('prod-dettagli-dinamici').innerHTML = '';

                // AGGIORNAMENTO DOLCE: Anche qui riscriviamo solo i dati senza impazzire
                storico = await API.getStorico();
                aggiornaStatistiche();
                renderVista();

            } catch (err) {
                console.error(err);
                alert("Errore durante il salvataggio: " + err.message);
                btnSubmit.disabled = false; btnSubmit.textContent = "Salva nel Calendario";
            }
        });

    } catch (error) {
        console.error("Errore init calendario:", error);
        UI.container.innerHTML = `<div class="alert alert-danger">Errore di connessione al database.</div>`;
    }
}

// ==========================================
// MODALITÀ MANI IN PASTA (Fullscreen)
// ==========================================
let wakeLockCucina = null;

async function avviaModalitaCucina(ricetta, rapportoPorzioni) {
    // 1. Richiediamo di tenere lo schermo sempre acceso (se supportato)
    try {
        if ('wakeLock' in navigator) wakeLockCucina = await navigator.wakeLock.request('screen');
    } catch (err) { console.log('Wake Lock non supportato', err); }

    // 2. Costruiamo la colonna Ingredienti (ricalcolati!)
    let htmlIngredienti = '<h3 class="mb-4 text-warning fw-bold">Ingredienti</h3><ul class="list-group list-group-flush fs-5">';
    ricetta.ingredienti.forEach(ing => {
        const qta = Number((ing.quantita * rapportoPorzioni).toFixed(2));
        htmlIngredienti += `<li class="list-group-item bg-transparent text-light border-secondary d-flex justify-content-between align-items-center ps-0 pe-0">${ing.nome_ingrediente} <strong class="text-warning">${qta} ${ing.unita_distinta}</strong></li>`;
    });
    // Aggiungiamo anche gli ingredienti delle sottoricette
    if (ricetta.sottoricette_esplose && ricetta.sottoricette_esplose.length > 0) {
        ricetta.sottoricette_esplose.forEach(sr => {
            const rFiglia = sr.ricetta_figlia;
            const rapportoSotto = rapportoPorzioni * sr.moltiplicatore;
            htmlIngredienti += `<h5 class="mt-4 mb-2 text-info fw-bold">↳ ${rFiglia.nome}</h5>`;
            rFiglia.ingredienti.forEach(subIng => {
                const qta = Number((subIng.quantita * rapportoSotto).toFixed(2));
                htmlIngredienti += `<li class="list-group-item bg-transparent text-light border-secondary d-flex justify-content-between align-items-center ps-0 pe-0">${subIng.nome_ingrediente} <strong class="text-info">${qta} ${subIng.unita_distinta}</strong></li>`;
            });
        });
    }
    htmlIngredienti += '</ul>';

    // 3. Costruiamo la colonna Procedimenti
    let htmlSteps = '<h3 class="mb-4 text-warning fw-bold">Procedimento</h3>';

    // Mostriamo prima i procedimenti delle sottoricette, se ci sono
    if (ricetta.sottoricette_esplose && ricetta.sottoricette_esplose.length > 0) {
        ricetta.sottoricette_esplose.forEach(sr => {
            const rFiglia = sr.ricetta_figlia;
            let subs = rFiglia.procedimento || [];
            subs.sort((a, b) => a.step_num - b.step_num);
            if (subs.length > 0) {
                htmlSteps += `<h4 class="mt-5 mb-3 text-info fw-bold">↳ Prepariamo: ${rFiglia.nome}</h4>`;
                subs.forEach(step => {
                    htmlSteps += `<div class="cooking-step-card" onclick="this.classList.toggle('fatto')"><span class="badge bg-info text-dark me-2 fs-5">${step.step_num}</span> ${step.descrizione}</div>`;
                });
            }
        });
        htmlSteps += `<h4 class="mt-5 mb-3 text-warning fw-bold">Assemblaggio finale: ${ricetta.nome}</h4>`;
    }

    let mainSteps = ricetta.procedimento || [];
    mainSteps.sort((a, b) => a.step_num - b.step_num);
    mainSteps.forEach(step => {
        htmlSteps += `<div class="cooking-step-card" onclick="this.classList.toggle('fatto')"><span class="badge bg-warning text-dark me-2 fs-5">${step.step_num}</span> ${step.descrizione}</div>`;
    });

    htmlSteps += `<div class="text-center mt-5 mb-5"><h4 class="text-success">🎉 Preparazione Completata!</h4></div>`;

    // 4. Creiamo il div a tutto schermo e lo iniettiamo
    const overlay = document.createElement('div');
    overlay.id = 'cooking-mode-overlay';
    overlay.innerHTML = `
        <div class="cooking-header">
            <h2 class="mb-0 text-white fw-bold">${ricetta.nome}</h2>
            <button class="btn btn-outline-danger btn-lg fw-bold" id="btn-chiudi-cucina">✖ Chiudi Modalità</button>
        </div>
        <div class="cooking-body">
            <div class="cooking-ingredients">${htmlIngredienti}</div>
            <div class="cooking-steps">${htmlSteps}</div>
        </div>
    `;
    document.body.appendChild(overlay);

    // 5. Entriamo in Fullscreen (se supportato dal browser)
    try { await document.documentElement.requestFullscreen(); } catch (e) { console.log("Fullscreen ignorato"); }

    // 6. Gestione chiusura
    document.getElementById('btn-chiudi-cucina').addEventListener('click', async () => {
        if (document.fullscreenElement) await document.exitFullscreen();
        if (wakeLockCucina !== null) { wakeLockCucina.release(); wakeLockCucina = null; }
        overlay.remove();
    });
}


// ==========================================
// 6. LISTA DELLA SPESA AGGREGATA
// ==========================================
async function initSpesa() {
    const STORAGE_KEY = 'erp_ricettario_spesa';

    // 1. LETTURA SICURA STORAGE (Evita crash se la memoria del browser fa i capricci)
    let statoSpesa = { ricetteInMenu: [], spunte: {} };
    try {
        const memoriaSalvata = localStorage.getItem(STORAGE_KEY);
        if (memoriaSalvata) {
            statoSpesa = JSON.parse(memoriaSalvata);
        }
    } catch (e) {
        console.warn("Memoria locale corrotta, riparto da zero.", e);
        localStorage.removeItem(STORAGE_KEY); // Pulizia automatica
    }

    const selectRicetta = document.getElementById('spesa-select-ricetta');
    const inputPorzioni = document.getElementById('spesa-input-porzioni');
    const btnAggiungi = document.getElementById('btn-aggiungi-spesa');
    const btnSvuota = document.getElementById('btn-svuota-spesa');
    const listaRicette = document.getElementById('lista-ricette-spesa');
    const listaAggregata = document.getElementById('lista-spesa-aggregata');

    // 2. SCARICHIAMO LE RICETTE (Con gestione errori visiva)
    try {
        const ricette = await API.getRicetteElencoBreve();
        selectRicetta.innerHTML = '<option value="">-- Seleziona una ricetta --</option>';
        ricette.forEach(r => {
            selectRicetta.innerHTML += `<option value="${r.id}">${r.nome}</option>`;
        });
    } catch (errApi) {
        console.error("Errore API Ricette:", errApi);
        selectRicetta.innerHTML = '<option value="">Errore di caricamento database</option>';
        return; // Ferma l'esecuzione per non fare altri danni
    }

    // 3. EVENTO CAMBIO TENDINA
    selectRicetta.addEventListener('change', async (e) => {
        if (!e.target.value) {
            btnAggiungi.disabled = true;
            inputPorzioni.value = '';
            return;
        }
        btnAggiungi.disabled = true;
        inputPorzioni.value = "Caricamento...";

        try {
            const ric = await API.getRicettaCompleta(e.target.value);
            inputPorzioni.value = ric.porzioni_base || 1;
            btnAggiungi.disabled = false;
        } catch (err) {
            inputPorzioni.value = '';
            alert("Impossibile caricare i dettagli di questa ricetta.");
        }
    });

    function salvaStato() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(statoSpesa));
    }

    // 4. MOTORE MATEMATICO E RENDER
    function renderDatiSpesa() {
        // Render Colonna Sinistra
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

        // Calcolo Colonna Destra (Aggregazione)
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
            key: key,
            ...mappaIngredienti[key]
        })).sort((a, b) => a.nome.localeCompare(b.nome));

        // Render Colonna Destra
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
        salvaStato();
    }

    // 5. AZIONE: AGGIUNGI RICETTA
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

            // 1. Estrazione Ingredienti Base della ricetta principale
            ricetta.ingredienti.forEach(ing => {
                ingredientiEstratti.push({
                    nome: ing.nome_ingrediente,
                    unita: ing.unita_distinta,
                    qta: ing.quantita * rapporto
                });
            });

            // 2. Estrazione Sottoricette (con matematica forzata)
            if (ricetta.sottoricette_esplose && ricetta.sottoricette_esplose.length > 0) {
                ricetta.sottoricette_esplose.forEach(sr => {
                    const rFiglia = sr.ricetta_figlia;

                    // FORZIAMO il moltiplicatore a essere un numero decimale (se manca o è corrotto, vale 1)
                    const moltiplicatoreReale = parseFloat(sr.moltiplicatore) || 1;
                    const rapportoSotto = rapporto * moltiplicatoreReale;

                    rFiglia.ingredienti.forEach(subIng => {
                        ingredientiEstratti.push({
                            nome: subIng.nome_ingrediente,
                            unita: subIng.unita_distinta,
                            qta: subIng.quantita * rapportoSotto
                        });
                    });
                });
            }

            // Salvataggio nello stato (il carrello)
            statoSpesa.ricetteInMenu.push({
                id: ricetta.id,
                nome: ricetta.nome,
                porzioni: porzioniRichieste,
                ingredientiEsplosi: ingredientiEstratti
            });
            statoSpesa.spunte = {};

            selectRicetta.value = '';
            inputPorzioni.value = '';
            btnAggiungi.disabled = true;
            btnAggiungi.innerHTML = '➕ Aggiungi alla Spesa';

            renderDatiSpesa();

        } catch (e) {
            console.error(e);
            alert("Errore nell'estrazione della distinta base.");
            btnAggiungi.disabled = false;
            btnAggiungi.innerHTML = '➕ Aggiungi alla Spesa';
        }
    });

    // 6. AZIONI DI CLIC (Delegate localmente, non sul document!)
    listaRicette.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-rimuovi-ricetta')) {
            const index = e.target.getAttribute('data-index');
            statoSpesa.ricetteInMenu.splice(index, 1);

            // ---> AGGIUNGI QUESTA RIGA: Azzera le spunte anche qui!
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
        if (confirm("Vuoi cancellare tutto il menu e le spunte del supermercato?")) {
            statoSpesa = { ricetteInMenu: [], spunte: {} };
            renderDatiSpesa();
        }
    });

    // Avvio iniziale
    renderDatiSpesa();
}
