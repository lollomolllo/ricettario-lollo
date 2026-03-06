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

// ==========================================
// MOTORE CALCOLATORE TEGLIE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const formaOrig = document.getElementById('calc-forma-orig');
    const formaDest = document.getElementById('calc-forma-dest');
    const btnApplica = document.getElementById('btn-applica-teglia');
    let currentMultiplier = 1;

    // --- ATTIVAZIONE APP NATIVA (PWA) ---
    if ('serviceWorker' in navigator) {
        // Se stiamo aprendo il file in locale (doppio click dal PC), non prova a installarlo per non dare errori
        if (window.location.protocol === 'file:') {
            console.log('🔧 App Nativa in pausa (Richiede un server web, normale in locale).');
        } else {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log('🔧 Motore App Nativa avviato!'))
                .catch((err) => console.error('Errore avvio App Nativa:', err));
        }
    }
    // Mostra/nasconde i campi (Diametro vs Lati) in base alla forma scelta
    const aggiornaVistaTeglie = () => {
        document.getElementById('calc-inputs-orig-tonda').classList.toggle('d-none', formaOrig.value !== 'tonda');
        document.getElementById('calc-inputs-orig-rett').classList.toggle('d-none', formaOrig.value !== 'rettangolare');
        document.getElementById('calc-inputs-dest-tonda').classList.toggle('d-none', formaDest.value !== 'tonda');
        document.getElementById('calc-inputs-dest-rett').classList.toggle('d-none', formaDest.value !== 'rettangolare');
        calcolaMoltiplicatoreTeglia();
    };

    // La matematica delle aree
    const calcolaMoltiplicatoreTeglia = () => {
        let areaOrig = 0, areaDest = 0;

        if (formaOrig.value === 'tonda') {
            const d = parseFloat(document.getElementById('calc-d-orig').value) || 0;
            areaOrig = Math.PI * Math.pow(d / 2, 2);
        } else {
            const l1 = parseFloat(document.getElementById('calc-l1-orig').value) || 0;
            const l2 = parseFloat(document.getElementById('calc-l2-orig').value) || 0;
            areaOrig = l1 * l2;
        }

        if (formaDest.value === 'tonda') {
            const d = parseFloat(document.getElementById('calc-d-dest').value) || 0;
            areaDest = Math.PI * Math.pow(d / 2, 2);
        } else {
            const l1 = parseFloat(document.getElementById('calc-l1-dest').value) || 0;
            const l2 = parseFloat(document.getElementById('calc-l2-dest').value) || 0;
            areaDest = l1 * l2;
        }

        const resEl = document.getElementById('calc-risultato');
        if (areaOrig > 0 && areaDest > 0) {
            currentMultiplier = areaDest / areaOrig;
            resEl.innerHTML = `x ${currentMultiplier.toFixed(2)}`;
            resEl.className = 'display-4 fw-bold text-success';
            btnApplica.disabled = false;
        } else {
            currentMultiplier = 1;
            resEl.innerHTML = '---';
            resEl.className = 'display-4 fw-bold text-muted';
            btnApplica.disabled = true;
        }
    };

    if (formaOrig && formaDest) {
        formaOrig.addEventListener('change', aggiornaVistaTeglie);
        formaDest.addEventListener('change', aggiornaVistaTeglie);
        document.querySelectorAll('.calc-input').forEach(inp => inp.addEventListener('input', calcolaMoltiplicatoreTeglia));

        // Il tasto Magico che inietta il risultato nella ricetta
        btnApplica.addEventListener('click', () => {
            const inputRicalcolo = document.getElementById('input-ricalcolo');
            if (inputRicalcolo) {
                // Prende le porzioni base della ricetta (salvate nell'attributo data-base) e le moltiplica!
                const base = parseFloat(inputRicalcolo.getAttribute('data-base')) || 1;
                inputRicalcolo.value = Number((base * currentMultiplier).toFixed(2));

                // Forza la lista ingredienti ad aggiornarsi
                inputRicalcolo.dispatchEvent(new Event('input', { bubbles: true }));

                // Chiude il modale in automatico
                bootstrap.Modal.getInstance(document.getElementById('modal-calcolatore-teglie')).hide();
            }

        });
        // ==========================================
        // RESET AUTOMATICO QUANDO SI CHIUDE LA FINESTRA
        // ==========================================
        const modalCalcolatoreEl = document.getElementById('modal-calcolatore-teglie');
        if (modalCalcolatoreEl) {
            modalCalcolatoreEl.addEventListener('hidden.bs.modal', () => {
                // 1. Resetta le tendine su "Tonda"
                formaOrig.value = 'tonda';
                formaDest.value = 'tonda';

                // 2. Svuota tutti i campi numerici digitati
                document.querySelectorAll('.calc-input').forEach(inp => inp.value = '');

                // 3. Ripristina i pannelli giusti
                aggiornaVistaTeglie();

                // 4. Azzera il numerone del risultato e riblocca il tasto
                currentMultiplier = 1;
                const resEl = document.getElementById('calc-risultato');
                resEl.innerHTML = '---';
                resEl.className = 'display-4 fw-bold text-muted';
                btnApplica.disabled = true;
            });
        }
    } // <-- Questa è la chiusura di if (formaOrig && formaDest)
});

// --- 1. IL GUARDIANO (Avvio App) ---
let utenteLoggato = null; // Variabile globale per sapere chi è loggato
let isUtenteAdmin = false; // Variabile globale per i permessi

document.addEventListener('DOMContentLoaded', async () => {
    const session = await API.getSession();
    if (!session) return; // Se non loggato, resta sul form

    // 1. SALVIAMO I DATI DELL'UTENTE
    utenteLoggato = session.user;

    // 2. CONTROLLIAMO SE È L'ADMIN (Leggendo il codice segreto di Supabase)
    if (utenteLoggato.user_metadata && utenteLoggato.user_metadata.ruolo === 'admin') {
        isUtenteAdmin = true;
        console.log("👑 Accesso consentito: Amministratore");
    } else {
        isUtenteAdmin = false;
        console.log("👤 Accesso consentito: Operatore standard");
    }

    // 3. APPLICHIAMO LE RESTRIZIONI VISIVE
    applicaPermessi();

    document.getElementById('login-container').classList.add('d-none');
    document.getElementById('main-app-container').classList.remove('d-none');

    inizializzaNavbar();
    UI.renderElenco();
    initElenco();
});

// FUNZIONE CHE NASCONDE/MOSTRA IN BASE AL RUOLO
function applicaPermessi() {
    if (!isUtenteAdmin) {
        console.log("🔒 Applico restrizioni: Utente Standard (Sola Lettura)");
        document.body.classList.add('accesso-limitato');
    } else {
        console.log("🔓 Applico permessi: Amministratore");
        document.body.classList.remove('accesso-limitato');
    }
}

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

    // --- GESTIONE MANUALE D'USO ---
    const btnApriManuale = document.getElementById('btn-apri-manuale');
    if (btnApriManuale) {
        btnApriManuale.addEventListener('click', () => {
            UI.renderManuale(); // Disegna la schermata del manuale
            window.scrollTo(0, 0);

            // Attiva il bottone per tornare indietro
            document.getElementById('btn-chiudi-manuale').addEventListener('click', () => {
                UI.renderImpostazioni();
                initImpostazioni();
            });
        });
    }

}
// ==========================================
// 2. INSERIMENTO E MODIFICA (Form)
// ==========================================
async function initInserimento() {
    let categorieDB = [], tagsDB = [], ricetteDB = [], dizionarioIngredientiDB = [];
    let opzioniIngredientiHTML = '<option value="">Seleziona ingrediente...</option>';
    let opzioniRicetteHTML = '<option value="">Seleziona ricetta...</option>'; // <--- AGGIUNTA

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
        ricette.forEach(r => opzioniRicetteHTML += `<option value="${r.nome}">${r.nome}</option>`); // <--- AGGIUNTA
    } catch (e) { console.error("Errore caricamento dizionari:", e); }

    // --- AGGIUNTA RIGHE DINAMICHE ---
    document.getElementById('btn-add-ingrediente').addEventListener('click', () => {
        document.getElementById('container-ingredienti').insertAdjacentHTML('beforeend', UI.getIngredienteRowHTML(opzioniIngredientiHTML));
    });
    document.getElementById('btn-add-step').addEventListener('click', () => {
        document.getElementById('container-procedimento').insertAdjacentHTML('beforeend', UI.getStepRowHTML()); aggiornaNumeriStep();
    });
    document.getElementById('btn-add-sezione-step').addEventListener('click', () => {
        document.getElementById('container-procedimento').insertAdjacentHTML('beforeend', UI.getSezioneStepRowHTML()); aggiornaNumeriStep();
    });

    // --- MAGIA: ABILITA IL DRAG & DROP DEI PASSAGGI ---
    const contenitoreProc = document.getElementById('container-procedimento');
    if (contenitoreProc && typeof Sortable !== 'undefined') {
        new Sortable(contenitoreProc, {
            handle: '.drag-handle-step',
            animation: 150,
            ghostClass: 'bg-light',
            dragClass: 'shadow-lg',
            onEnd: function () {
                aggiornaNumeriStep(); // Ricalcola i numeri appena rilasci il blocco!
            }
        });
    }

    function aggiornaNumeriStep() {
        let count = 1;
        document.querySelectorAll('#container-procedimento .riga-step').forEach(r => {
            const numEl = r.querySelector('.step-numero');
            if (numEl) numEl.textContent = count++;
        });
    }
    // --- MAGIA: ABILITA IL DRAG & DROP DEGLI INGREDIENTI ---
    const contenitoreIng = document.getElementById('container-ingredienti');
    if (contenitoreIng && typeof Sortable !== 'undefined') {
        new Sortable(contenitoreIng, {
            handle: '.drag-handle', // Rende trascinabile SOLO cliccando sui puntini
            animation: 150,         // Animazione fluida (in ms)
            ghostClass: 'bg-light', // Sfondo che prende l'elemento mentre lo sposti
            dragClass: 'shadow-lg'  // Ombra per l'elemento sollevato
        });
    }
    // ==========================================
    // BARRA SMART RICERCA SOTTORICETTE
    // ==========================================
    const inputRicercaSr = document.getElementById('ricerca-sottoricetta');
    const boxSuggerimentiSr = document.getElementById('suggerimenti-sottoricette');

    if (inputRicercaSr && boxSuggerimentiSr) {
        inputRicercaSr.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase().trim();
            if (!val) { boxSuggerimentiSr.innerHTML = ''; return; }

            const matches = ricetteDB.filter(r => r.nome.toLowerCase().includes(val));
            if (matches.length > 0) {
                boxSuggerimentiSr.innerHTML = matches.slice(0, 10).map(m => `
                    <div class="badge bg-white text-dark border border-warning p-2 fs-6 shadow-sm sugg-btn-sr" style="cursor: pointer; transition: 0.2s;" onmouseover="this.classList.replace('bg-white', 'bg-warning');" onmouseout="this.classList.replace('bg-warning', 'bg-white');" data-nome="${m.nome}" data-resa="${m.porzioni_base} ${m.unita_porzioni}">
                        + ${m.nome}
                    </div>
                `).join('');
            } else {
                boxSuggerimentiSr.innerHTML = `<span class="text-danger small fw-bold">Nessuna ricetta trovata in galleria. Impossibile inventare sottoricette.</span>`;
            }
        });

        const aggiungiRigaSottoricettaPrecompilata = (nome, resaBase) => {
            document.getElementById('container-sottoricette').insertAdjacentHTML('beforeend', UI.getSottoricettaRowHTML(nome, resaBase));
            const riga = document.getElementById('container-sottoricette').lastElementChild;
            riga.querySelector('.sr-moltiplicatore').dispatchEvent(new Event('input', { bubbles: true }));
        };

        // Click sul suggerimento
        boxSuggerimentiSr.addEventListener('click', (e) => {
            const btn = e.target.closest('.sugg-btn-sr');
            if (btn) {
                aggiungiRigaSottoricettaPrecompilata(btn.getAttribute('data-nome'), btn.getAttribute('data-resa'));
                inputRicercaSr.value = ''; boxSuggerimentiSr.innerHTML = '';
            }
        });

        // Tasto invio protetto (Accetta solo se trova corrispondenza esatta!)
        inputRicercaSr.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const val = inputRicercaSr.value.trim();
                const esatto = ricetteDB.find(r => r.nome.toLowerCase() === val.toLowerCase());
                if (esatto) {
                    aggiungiRigaSottoricettaPrecompilata(esatto.nome, `${esatto.porzioni_base} ${esatto.unita_porzioni}`);
                    inputRicercaSr.value = ''; boxSuggerimentiSr.innerHTML = '';
                } else {
                    alert("⚠️ Sottoricetta non valida. Devi cliccare su uno dei suggerimenti proposti e assicurarti che esista in galleria.");
                }
            }
        });
    }

    document.getElementById('btn-add-sezione-ing').addEventListener('click', () => {
        document.getElementById('container-ingredienti').insertAdjacentHTML('beforeend', UI.getSezioneRowHTML());
    });

    // --- MAGIA: GESTIONE AUTOMATICA DELLE UNITÀ DI MISURA ---
    document.getElementById('container-ingredienti').addEventListener('change', (e) => {

        // 1. Logica quando selezioni o inserisci un INGREDIENTE
        if (e.target.classList.contains('ing-nome')) {
            const nomeScelto = e.target.value.trim();
            const selectUnita = e.target.closest('.riga-ingrediente').querySelector('.ing-unita');

            selectUnita.innerHTML = ''; // Svuota la tendina

            // Cerca nel dizionario IGNORANDO maiuscole e minuscole
            const ingTrovato = dizionarioIngredientiDB.find(i => i.nome.toLowerCase() === nomeScelto.toLowerCase());

            if (ingTrovato) {
                const unitaAmmesse = ingTrovato.unita_misura.split(',').map(u => u.trim());
                unitaAmmesse.forEach((u, index) => {
                    selectUnita.innerHTML += `<option value="${u}" ${index === 0 ? 'selected' : ''}>${u}</option>`;
                });
                selectUnita.dispatchEvent(new Event('change', { bubbles: true })); // Forza il check del "q.b."
            } else if (nomeScelto !== "") {
                // Ingrediente inserito "Solo per questa ricetta" -> Mostra tutte le tue opzioni
                ['g', 'ml', 'cucchiai', 'q.b.', 'pz', 'cucchiaini'].forEach((u, index) => {
                    selectUnita.innerHTML += `<option value="${u}" ${index === 0 ? 'selected' : ''}>${u}</option>`;
                });
                selectUnita.dispatchEvent(new Event('change', { bubbles: true })); // Forza il check del "q.b."
            }
        }

        // 2. Logica quando l'UNITÀ DI MISURA è "q.b."
        if (e.target.classList.contains('ing-unita')) {
            const riga = e.target.closest('.riga-ingrediente');
            const qtaInput = riga.querySelector('.ing-qta');
            const stepperGroup = riga.querySelector('.stepper-group');

            if (e.target.value === 'q.b.') {
                stepperGroup.classList.add('d-none'); // Nasconde quantità
                qtaInput.removeAttribute('required'); // Toglie l'obbligo
                qtaInput.value = ''; // Svuota
            } else {
                stepperGroup.classList.remove('d-none'); // Mostra quantità
                qtaInput.setAttribute('required', 'required'); // Rimette l'obbligo
            }
        }
    });

    // --- MAGIA: GESTIONE SOTTORICETTE (Mostra Porzioni Base e Apporto Calcolato) ---
    const aggiornaHintSottoricetta = (riga) => {
        const nomeScelto = riga.querySelector('.sr-nome').value;
        const hintBase = riga.querySelector('.sr-hint');
        const hintCalc = riga.querySelector('.sr-calc-hint');
        const molt = parseFloat(riga.querySelector('.sr-moltiplicatore').value) || 0;

        const ricTrovata = ricetteDB.find(r => r.nome === nomeScelto);
        if (ricTrovata) {
            hintBase.innerHTML = `<strong>Resa Base:</strong> ${ricTrovata.porzioni_base} ${ricTrovata.unita_porzioni}`;
            if (molt > 0) {
                const tot = Number((ricTrovata.porzioni_base * molt).toFixed(2));
                hintCalc.innerHTML = `Apporto nel dolce: <strong>${tot} ${ricTrovata.unita_porzioni}</strong>`;
            } else {
                hintCalc.innerHTML = '';
            }
        } else {
            hintBase.innerHTML = '';
            hintCalc.innerHTML = '';
        }
    };

    document.getElementById('container-sottoricette').addEventListener('change', (e) => {
        if (e.target.classList.contains('sr-nome') || e.target.classList.contains('sr-moltiplicatore')) {
            aggiornaHintSottoricetta(e.target.closest('.riga-sottoricetta'));
        }
    });

    document.getElementById('container-sottoricette').addEventListener('input', (e) => {
        if (e.target.classList.contains('sr-moltiplicatore')) {
            aggiornaHintSottoricetta(e.target.closest('.riga-sottoricetta'));
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
    // BARRA SMART RICERCA INGREDIENTI
    // ==========================================
    const inputRicerca = document.getElementById('ricerca-ingrediente');
    const boxSuggerimenti = document.getElementById('suggerimenti-ingredienti');
    const modalIngEl = document.getElementById('modal-ingrediente');
    let ingredientePendente = "";

    function aggiungiRigaPrecompilata(nome) {
        document.getElementById('btn-add-ingrediente').click(); // Crea la riga vuota
        const riga = document.getElementById('container-ingredienti').lastElementChild;
        const selectNome = riga.querySelector('.ing-nome');

        // Se non esiste nella tendina (es. è stato scelto "Solo per questa ricetta"), lo aggiunge al volo
        if (!Array.from(selectNome.options).some(o => o.value === nome)) {
            selectNome.innerHTML += `<option value="${nome}">${nome}</option>`;
        }

        selectNome.value = nome;
        selectNome.dispatchEvent(new Event('change', { bubbles: true })); // Fa comparire le unità di misura

        riga.querySelector('.ing-qta').focus(); // Mette il cursore pronto per scrivere il numero!
    }

    if (inputRicerca && boxSuggerimenti) {
        // 1. Digitando compaiono i rettangoli
        inputRicerca.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase().trim();
            if (!val) { boxSuggerimenti.innerHTML = ''; return; }

            const matches = dizionarioIngredientiDB.filter(i => i.nome.toLowerCase().includes(val));
            if (matches.length > 0) {
                boxSuggerimenti.innerHTML = matches.slice(0, 12).map(m => `
                    <div class="badge bg-white text-success border border-success p-2 fs-6 shadow-sm sugg-btn" style="cursor: pointer; transition: 0.2s;" onmouseover="this.classList.replace('bg-white', 'bg-success'); this.classList.replace('text-success', 'text-white');" onmouseout="this.classList.replace('bg-success', 'bg-white'); this.classList.replace('text-white', 'text-success');" data-nome="${m.nome}">
                        + ${m.nome}
                    </div>
                `).join('');
            } else {
                boxSuggerimenti.innerHTML = `<span class="text-muted small">Nessun ingrediente trovato in archivio. Premi Invio per aggiungerlo comunque.</span>`;
            }
        });

        // 2. Click su un rettangolo
        boxSuggerimenti.addEventListener('click', (e) => {
            const btn = e.target.closest('.sugg-btn');
            if (btn) {
                aggiungiRigaPrecompilata(btn.getAttribute('data-nome'));
                inputRicerca.value = ''; boxSuggerimenti.innerHTML = '';
            }
        });

        // 3. Pressione di INVIO
        inputRicerca.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Impedisce il salvataggio errato della ricetta
                const val = inputRicerca.value.trim();
                if (!val) return;

                const esatto = dizionarioIngredientiDB.find(i => i.nome.toLowerCase() === val.toLowerCase());
                if (esatto) {
                    aggiungiRigaPrecompilata(esatto.nome);
                    inputRicerca.value = ''; boxSuggerimenti.innerHTML = '';
                } else {
                    // Manca l'ingrediente! Apre le 3 opzioni.
                    ingredientePendente = val.charAt(0).toUpperCase() + val.slice(1); // Mette la prima lettera maiuscola
                    document.getElementById('modal-ing-nome').textContent = ingredientePendente;
                    document.getElementById('modal-ing-unita').value = 'g, ml, q.b.'; // Default utile

                    const bsModal = new bootstrap.Modal(modalIngEl);
                    bsModal.show();
                }
            }
        });

        // --- AZIONI DELLE 3 OPZIONI DEL MODAL ---

        // Opzione 1: Solo locale
        document.getElementById('btn-opt-locale').addEventListener('click', () => {
            bootstrap.Modal.getInstance(modalIngEl).hide();
            aggiungiRigaPrecompilata(ingredientePendente);
            inputRicerca.value = ''; boxSuggerimenti.innerHTML = '';
        });

        // Opzione 2: Salva nel dizionario e inserisci
        document.getElementById('btn-opt-salva-diz').addEventListener('click', async () => {
            const unita = document.getElementById('modal-ing-unita').value.trim();
            if (!unita) { alert("Inserisci le unità di misura!"); return; }

            const btn = document.getElementById('btn-opt-salva-diz');
            btn.disabled = true; btn.textContent = 'Salvataggio...';

            try {
                await API.addIngredienteDizionario(ingredientePendente, unita);
                dizionarioIngredientiDB = await API.getDizionarioIngredienti(); // Aggiorna dizionario locale

                // Aggiorna le opzioni per le prossime righe
                opzioniIngredientiHTML = '<option value="">Seleziona ingrediente...</option>';
                dizionarioIngredientiDB.forEach(ing => opzioniIngredientiHTML += `<option value="${ing.nome}">${ing.nome}</option>`);

                bootstrap.Modal.getInstance(modalIngEl).hide();
                aggiungiRigaPrecompilata(ingredientePendente);
                inputRicerca.value = ''; boxSuggerimenti.innerHTML = '';
            } catch (err) { alert("Errore: " + err.message); }
            finally { btn.disabled = false; btn.textContent = 'Salva e Inserisci'; }
        });
    }

    // ==========================================
    // LOGICA IBRIDA DI IMPORTAZIONE (Testo Incollato o File TXT)
    // ==========================================
    const btnToggleImport = document.getElementById('btn-toggle-import');
    const panelImport = document.getElementById('panel-import-rapido');
    const btnAnalizzaTesto = document.getElementById('btn-analizza-testo');
    const inputTestoImport = document.getElementById('testo-import-rapido');
    const btnImportFile = document.getElementById('btn-import-file');
    const inputImport = document.getElementById('input-import-txt');

    if (btnToggleImport) {
        btnToggleImport.addEventListener('click', () => panelImport.classList.toggle('d-none'));
        btnImportFile.addEventListener('click', () => inputImport.click());

        const eseguiImport = async (testo, sceltaSalvataggio) => {
            const blocchi = testo.split('=== RICETTA ===').map(b => b.trim()).filter(b => b !== '');
            if (blocchi.length === 0) { alert("Nessuna ricetta trovata."); return; }

            let ricetteProcessate = [];
            for (let blocco of blocchi) {
                const estraiCampo = (chiave) => { const match = blocco.match(new RegExp(`${chiave}:\\s*(.*)`, 'i')); return match ? match[1].trim() : ''; };
                const estraiSezione = (titolo) => {
                    const parti = blocco.split(new RegExp(`--- ${titolo} ---`, 'i')); if (parti.length < 2) return '';
                    let str = parti[1]; const nextHeader = str.match(/--- [A-Z]+ ---/i); if (nextHeader) str = str.substring(0, nextHeader.index); return str.trim();
                };

                const nome = estraiCampo('NOME'); if (!nome) continue;
                let id_categoria = null; const catNome = estraiCampo('CATEGORIA');
                if (catNome) { const catTrovata = categorieDB.find(c => c.nome.toLowerCase() === catNome.toLowerCase()); if (catTrovata) id_categoria = catTrovata.id; }

                let tagsSpuntati = []; const tagsString = estraiCampo('TAGS');
                if (tagsString) { tagsString.split(',').map(t => t.trim().toLowerCase()).forEach(nt => { const tTrovato = tagsDB.find(t => t.nome.toLowerCase() === nt); if (tTrovato) tagsSpuntati.push(tTrovato.id); }); }

                const ricettaData = {
                    nome: nome, id_categoria: id_categoria, porzioni_base: parseFloat(estraiCampo('PORZIONI').replace(',', '.')) || 1, unita_porzioni: estraiCampo('UNITA') || 'pz',
                    tempo_riposo_ore: parseFloat(estraiCampo('RIPOSO \\(ore\\)').replace(',', '.')) || 0, tempo_cottura_min: parseInt(estraiCampo('COTTURA \\(min\\)')) || 0,
                    fonte: estraiCampo('FONTE'), link_fonte: estraiCampo('LINK'), note: estraiCampo('NOTE'), url_immagine: estraiCampo('IMMAGINE') || null
                };

                const ingredientiData = []; const bloccoIng = estraiSezione('INGREDIENTI');
                if (bloccoIng) { bloccoIng.split('\n').forEach(linea => { let l = linea.trim().replace(/^[\-\*\•]\s*/, ''); if (l.includes('|')) { const parti = l.split('|').map(p => p.trim()); if (parti.length >= 2) ingredientiData.push({ nome: parti[0], qta: parseFloat(parti[1].replace(',', '.')) || 0, unita: parti[2] || '' }); } }); }

                const procedimentoData = []; const bloccoProc = estraiSezione('PROCEDIMENTO');
                if (bloccoProc) { bloccoProc.split('\n').forEach(linea => { let l = linea.trim(); if (l !== '') { l = l.replace(/^\d+[\.\-\)]\s*/, ''); procedimentoData.push({ desc: l }); } }); }

                const sottoricetteData = []; const bloccoSr = estraiSezione('SOTTORICETTE');
                if (bloccoSr) { bloccoSr.split('\n').forEach(linea => { let l = linea.trim().replace(/^[\-\*\•]\s*/, ''); if (l.includes('|')) { const parti = l.split('|').map(p => p.trim()); if (parti.length >= 2) { const ricTrovata = ricetteDB.find(r => r.nome.toLowerCase() === parti[0].toLowerCase()); if (ricTrovata) sottoricetteData.push({ id_figlia: ricTrovata.id, moltiplicatore: parseFloat(parti[1].replace(',', '.')) || 1 }); } } }); }

                ricetteProcessate.push({ ricettaData, ingredientiData, procedimentoData, tagsSpuntati, sottoricetteData });
            }

            if (ricetteProcessate.length === 0) return;

            if (sceltaSalvataggio) {
                btnImportFile.disabled = true; btnImportFile.textContent = "Salvataggio in corso...";
                try {
                    for (let r of ricetteProcessate) {
                        if (r.ricettaData.url_immagine && r.ricettaData.url_immagine.startsWith('http')) {
                            try { const resp = await fetch(r.ricettaData.url_immagine); const blob = await resp.blob(); const file = new File([blob], `img_importata_${Date.now()}.jpg`, { type: blob.type }); r.ricettaData.url_immagine = await API.uploadImmagine(file); } catch (e) { console.warn("Errore download immagine"); }
                        }
                        await API.salvaRicettaCompleta(r.ricettaData, r.ingredientiData, r.procedimentoData, r.tagsSpuntati, r.sottoricetteData);
                    }
                    alert(`Successo! Importate direttamente ${ricetteProcessate.length} ricette.`); document.getElementById('nav-elenco').click();
                } catch (err) { alert("Errore salvataggio: " + err.message); } finally { btnImportFile.disabled = false; btnImportFile.innerHTML = "📁 Importa da file TXT"; }
            } else {
                const prima = ricetteProcessate[0];
                if (blocchi.length > 1) alert("Attenzione: verrà pre-compilata SOLO la prima ricetta del testo.");

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
                    riga.querySelector('.ing-nome').value = ing.nome; riga.querySelector('.ing-nome').dispatchEvent(new Event('change', { bubbles: true }));
                    riga.querySelector('.ing-qta').value = ing.qta; riga.querySelector('.ing-unita').value = ing.unita;
                });

                prima.procedimentoData.forEach(step => {
                    document.getElementById('btn-add-step').click();
                    const riga = document.getElementById('container-procedimento').lastElementChild;
                    const txtArea = riga.querySelector('.step-desc'); txtArea.value = step.desc; setTimeout(() => { txtArea.style.height = 'auto'; txtArea.style.height = txtArea.scrollHeight + 'px'; }, 10);
                });

                prima.sottoricetteData.forEach(sr => {
                    const ricTrovata = ricetteDB.find(x => x.id === sr.id_figlia);
                    const nomeFiglia = ricTrovata ? ricTrovata.nome : '';
                    const resaBaseStr = ricTrovata ? `${ricTrovata.porzioni_base} ${ricTrovata.unita_porzioni}` : '';

                    document.getElementById('container-sottoricette').insertAdjacentHTML('beforeend', UI.getSottoricettaRowHTML(nomeFiglia, resaBaseStr));
                    const riga = document.getElementById('container-sottoricette').lastElementChild;
                    riga.querySelector('.sr-moltiplicatore').value = sr.moltiplicatore;
                    riga.querySelector('.sr-moltiplicatore').dispatchEvent(new Event('input', { bubbles: true }));
                });

                panelImport.classList.add('d-none'); // Nasconde il pannello dopo averlo compilato
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        btnAnalizzaTesto.addEventListener('click', () => {
            if (!inputTestoImport.value.trim()) { alert("Inserisci il testo della ricetta."); return; }
            eseguiImport(inputTestoImport.value, false);
        });

        inputImport.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const sceltaSalvataggio = confirm(`Ho trovato delle ricette nel file.\n\nVuoi SALVARE DIRETTAMENTE nel database (premendo OK)?\n\nPremi ANNULLA per caricare l'anteprima nel form.`);
                eseguiImport(event.target.result, sceltaSalvataggio);
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
            let nomeDigitato = document.getElementById('ricetta-nome').value.trim();
            const fonteInserita = document.getElementById('ricetta-fonte')?.value.trim() || null;

            // ==========================================
            // GESTIONE OMONIMIE (Rinomina sia la vecchia che la nuova)
            // ==========================================
            // Cerca se esiste già questo nome (escludendo la ricetta stessa se la stiamo modificando)
            const duplicati = ricetteDB.filter(r => r.nome.toLowerCase() === nomeDigitato.toLowerCase() && r.id !== idRicettaInModifica);

            if (duplicati.length > 0) {
                // 1. Rinominiamo le ricette VECCHIE già presenti nel DB
                for (let vecchia of duplicati) {
                    let fonteVecchia = vecchia.fonte ? vecchia.fonte.trim() : 'Originale';
                    let nomeVecchioAggiornato = `${vecchia.nome} - ${fonteVecchia}`;

                    // Salviamo il nuovo nome della vecchia ricetta nel cloud
                    await API.rinominaRicettaSingola(vecchia.id, nomeVecchioAggiornato);
                }

                // 2. Modifichiamo il nome di QUELLA CHE STIAMO SALVANDO ORA
                let fonteNuova = fonteInserita ? fonteInserita : 'Nuova Variante';
                nomeDigitato = `${nomeDigitato} - ${fonteNuova}`;

                alert(`⚠️ Omonimia rilevata!\nLe ricette precedenti e quella attuale sono state rinominate in base alla loro "Fonte" per non confonderle in futuro.`);
            }

            const ricettaData = {
                nome: nomeDigitato, id_categoria: idCat ? parseInt(idCat) : null,
                porzioni_base: parseFloat(document.getElementById('ricetta-porzioni').value), unita_porzioni: document.getElementById('ricetta-unita').value.trim(),
                tempo_riposo_ore: parseFloat(document.getElementById('ricetta-riposo').value) || 0, tempo_cottura_min: parseInt(document.getElementById('ricetta-cottura').value) || 0,
                fonte: fonteInserita, link_fonte: document.getElementById('ricetta-link')?.value.trim() || null,
                note: document.getElementById('ricetta-note')?.value.trim() || null, url_immagine: url_immagine
            };
            const tagsSpuntati = Array.from(document.querySelectorAll('.checkbox-tag:checked')).map(cb => cb.value);

            // Sostituisci l'estrazione degli ingredienti con questa:
            const ingredientiData = Array.from(document.getElementById('container-ingredienti').children).map(r => {
                if (r.classList.contains('riga-sezione-ing')) {
                    const val = r.querySelector('.titolo-sezione').value.trim();
                    return { nome: `--- ${val} ---`, qta: 0, unita: 'SEZIONE' };
                } else if (r.classList.contains('riga-ingrediente')) {
                    return {
                        nome: r.querySelector('.ing-nome').value.trim(),
                        // LA MAGIA È QUI SOTTO: L'aggiunta di "|| 0" salva il database dal crash!
                        qta: parseFloat(r.querySelector('.ing-qta').value) || 0,
                        unita: r.querySelector('.ing-unita').value.trim()
                    };
                }
            }).filter(i => i && i.nome !== "");

            const procedimentoData = Array.from(document.getElementById('container-procedimento').children).map(r => {
                if (r.classList.contains('riga-sezione-step')) {
                    const val = r.querySelector('.titolo-sezione-step').value.trim();
                    return { desc: `--- ${val} ---` };
                } else if (r.classList.contains('riga-step')) {
                    return { desc: r.querySelector('.step-desc').value.trim() };
                }
            }).filter(s => s && s.desc !== "");
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

    // Avvia automaticamente il caricamento righe solo se è una Nuova Ricetta
    if (!idRicettaInModifica) {
        // Non aggiungiamo più la riga ingrediente vuota!
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
        let ricetteAttualiFiltrate = ricette;
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

        // RECUPERO DEGLI ELEMENTI DI RICERCA
        const inputTesto = document.getElementById('filtro-testo');
        const inputIngrediente = document.getElementById('filtro-ingrediente');
        const btnToggleDispensa = document.getElementById('btn-toggle-dispensa');
        const containerDispensa = document.getElementById('container-filtro-ingrediente');

        // Logica per Aprire/Chiudere il pannello Dispensa
        if (btnToggleDispensa) {
            btnToggleDispensa.addEventListener('click', () => {
                containerDispensa.classList.toggle('d-none');
                if (!containerDispensa.classList.contains('d-none')) {
                    inputIngrediente.focus();
                } else {
                    inputIngrediente.value = ''; // Pulisce il testo se chiudi
                    applicaFiltri(false);
                }
            });
        }

        const btnChiudiDispensa = document.getElementById('btn-chiudi-dispensa');
        if (btnChiudiDispensa) {
            btnChiudiDispensa.addEventListener('click', () => {
                containerDispensa.classList.add('d-none');
                inputIngrediente.value = '';
                applicaFiltri(false);
            });
        }

        // MOTORE DI RICERCA UNIFICATO
        function applicaFiltri(mantieniAperti = false) {
            const testo = inputTesto.value.toLowerCase().trim();
            const testoIng = inputIngrediente.value.toLowerCase().trim();
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
                const matchTag = tagScelto === "" || (r.ricette_tags && r.ricette_tags.map(rt => rt.tag.nome).includes(tagScelto));

                // Filtro MAGICO Svuota-Dispensa
                let matchIngrediente = true;
                if (testoIng !== "") {
                    let tuttiIngredienti = [];
                    // Prende gli ingredienti base
                    if (r.ingredienti) r.ingredienti.forEach(i => tuttiIngredienti.push(i.nome_ingrediente.toLowerCase()));

                    // Prende gli ingredienti dalle sottoricette collegate
                    if (r.figlie_ids) {
                        r.figlie_ids.forEach(idFiglia => {
                            const ricettaFiglia = cacheRicette.find(x => x.id === idFiglia);
                            if (ricettaFiglia && ricettaFiglia.ingredienti) {
                                ricettaFiglia.ingredienti.forEach(si => tuttiIngredienti.push(si.nome_ingrediente.toLowerCase()));
                            }
                        });
                    }

                    const terminiCercati = testoIng.split(',').map(i => i.trim()).filter(i => i !== "");
                    matchIngrediente = terminiCercati.every(termine =>
                        tuttiIngredienti.some(ing => ing.includes(termine))
                    );
                }

                return matchTesto && matchCategoria && matchTag && matchIngrediente;
            });

            // Ordine alfabetico forzato
            filtrate.sort((a, b) => a.nome.localeCompare(b.nome));
            ricetteAttualiFiltrate = filtrate; // Per la Roulette!

            const badgeTotale = document.getElementById('badge-totale-ricette');
            if (badgeTotale) badgeTotale.textContent = filtrate.length;

            UI.renderCards(filtrate, currentView, isGrouped, categorieAperte);
        }

        // ASCOLTATORI DEI FILTRI
        if (toggleRaggruppa) {
            toggleRaggruppa.addEventListener('change', (e) => {
                isGrouped = e.target.checked;
                applicaFiltri(true);
            });
        }
        inputTesto.addEventListener('input', () => applicaFiltri(false));
        inputIngrediente.addEventListener('input', () => applicaFiltri(false));
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

        // ==========================================
        // LA ROULETTE GOLOSA 
        // ==========================================
        const btnRoulette = document.getElementById('btn-roulette');
        if (btnRoulette) {
            btnRoulette.addEventListener('click', () => {
                if (ricetteAttualiFiltrate.length === 0) {
                    alert("Non ci sono ricette con questi filtri! Impossibile pescare a caso.");
                    return;
                }

                // Creiamo un piccolo effetto di "suspense"
                const originalText = btnRoulette.innerHTML;
                btnRoulette.innerHTML = "<i class='bi bi-dice-5-fill'></i> Estrazione...";
                btnRoulette.classList.add('disabled'); // Disabilita i click ripetuti

                setTimeout(() => {
                    // Pesca un numero a caso da 0 alla fine dell'elenco
                    const randomIndex = Math.floor(Math.random() * ricetteAttualiFiltrate.length);
                    const ricettaScelta = ricetteAttualiFiltrate[randomIndex];

                    // Ripristina il bottone
                    btnRoulette.innerHTML = originalText;
                    btnRoulette.classList.remove('disabled');

                    // Apre la ricetta fortunata!
                    apriDettaglioRicetta(ricettaScelta.id);
                }, 500); // Mezzo secondo di animazione
            });
        }

    } catch (error) { console.error(error); document.getElementById('griglia-ricette').innerHTML = `<div class="col-12 alert alert-danger">Errore database.</div>`; }
}

// ==========================================
// 7. DETTAGLIO RICETTA E CUCINA
// ==========================================
async function apriDettaglioRicetta(id_ricetta) {
    UI.container.innerHTML = `<div class="text-center mt-5"><div class="spinner-border text-primary" role="status"></div></div>`;

    try {
        const ricetta = await API.getRicettaCompleta(id_ricetta);
        UI.renderDettaglio(ricetta);

        // --- INIZIO MOTORE SPLIT PANE ---
        const dLeftPane = document.getElementById('dettaglio-leftPane');
        const dGutter = document.getElementById('dettaglio-gutter');

        if (dLeftPane && dGutter) {
            let isDragging = false;
            const containerSplit = dLeftPane.parentElement;

            dGutter.addEventListener('mousedown', function (e) {
                isDragging = true;
                document.body.style.cursor = 'col-resize';
                dGutter.classList.add('active');

                // Trucco fondamentale: impedisce di evidenziare il testo mentre trascini!
                document.body.style.userSelect = 'none';
            });

            document.addEventListener('mousemove', function (e) {
                if (!isDragging) return;

                const containerRect = containerSplit.getBoundingClientRect();
                let newWidth = e.clientX - containerRect.left;

                // Mettiamo dei paletti per evitare che l'utente distrugga la UI
                const minWidth = containerRect.width * 0.35; // Minimo 35%
                const maxWidth = containerRect.width * 0.75; // Massimo 75%

                if (newWidth < minWidth) newWidth = minWidth;
                if (newWidth > maxWidth) newWidth = maxWidth;

                // Applichiamo la percentuale
                const percentage = (newWidth / containerRect.width) * 100;
                dLeftPane.style.width = percentage + '%';
            });

            document.addEventListener('mouseup', function () {
                if (isDragging) {
                    isDragging = false;
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                    dGutter.classList.remove('active');
                }
            });
        }
        // --- FINE MOTORE SPLIT PANE ---

        const inputRicalcolo = document.getElementById('input-ricalcolo');
        const listIng = document.getElementById('lista-ingredienti-ricalcolati');
        const contSotto = document.getElementById('container-sottoricette-ricalcolate');

        const btnCucina = document.getElementById('btn-cucina-ricetta');
        if (btnCucina) btnCucina.addEventListener('click', () => avviaModalitaCucina(ricetta, (parseFloat(inputRicalcolo.value) || ricetta.porzioni_base) / ricetta.porzioni_base));

        function ricalcolaBOM() {
            const rapporto = (parseFloat(inputRicalcolo.value) || 0) / (ricetta.porzioni_base || 1);

            // Render Lista Ingredienti Principale
            listIng.innerHTML = ricetta.ingredienti.map(ing => {
                if (ing.unita_distinta === 'SEZIONE') {
                    return `<li class="list-group-item bg-light text-primary fw-bold mt-2 border-top border-primary border-2" style="font-size: 0.95rem; text-transform: uppercase;"><i class="bi bi-folder-plus me-1"></i> ${ing.nome_ingrediente.replace(/---/g, '').trim()}</li>`;
                }
                return `<li class="list-group-item d-flex justify-content-between align-items-center">${ing.nome_ingrediente}<span class="badge bg-dark rounded-pill fs-6 shadow-sm">${Number((ing.quantita * rapporto).toFixed(2))} ${ing.unita_distinta}</span></li>`;
            }).join('') || '<li class="list-group-item">Nessun ingrediente</li>';

            // Render Sottoricette Incluse
            let htmlSr = '';
            if (ricetta.sottoricette_esplose && ricetta.sottoricette_esplose.length > 0) {
                htmlSr += `<h5 class="fw-bold mb-3 mt-4 border-top pt-3 text-warning">Sottoricette Incluse</h5>`;

                ricetta.sottoricette_esplose.forEach(sr => {
                    const f = sr.ricetta_figlia;
                    if (!f) return;

                    const rapSr = rapporto * (sr.moltiplicatore || 1);
                    let subs = f.procedimento || [];
                    subs.sort((a, b) => a.step_num - b.step_num);

                    htmlSr += `<div class="card border-warning mb-4 shadow-sm">
                                <div class="card-header bg-warning text-dark fw-bold py-2 d-flex justify-content-between align-items-center">
                                    <span>↳ ${f.nome}</span>
                                    <button class="btn btn-sm btn-dark btn-apri-sottoricetta shadow-sm" data-id="${f.id}">Apri Ricetta</button>
                                </div>
                                <div class="card-body p-0">
                                    <ul class="list-group list-group-flush small">`;

                    if (f.ingredienti) {
                        htmlSr += f.ingredienti.map(si => {
                            if (si.unita_distinta === 'SEZIONE') {
                                return `<li class="list-group-item bg-light text-primary fw-bold mt-1" style="font-size: 0.8rem; text-transform: uppercase;"><i class="bi bi-folder-plus me-1"></i> ${si.nome_ingrediente.replace(/---/g, '').trim()}</li>`;
                            }
                            return `<li class="list-group-item d-flex justify-content-between align-items-center bg-light">${si.nome_ingrediente}<span class="fw-bold">${Number((si.quantita * rapSr).toFixed(2))} ${si.unita_distinta}</span></li>`;
                        }).join('');
                    }
                    htmlSr += `</ul>`;

                    if (subs.length > 0) {
                        htmlSr += `<div class="p-3 border-top bg-white"><h6 class="fw-bold mb-2 small text-muted">PROCEDIMENTO:</h6>`;
                        let procCount = 1;
                        subs.forEach(st => {
                            if (st.descrizione.startsWith('---') && st.descrizione.endsWith('---')) {
                                htmlSr += `<h6 class="mt-2 mb-1 text-info fw-bold" style="font-size: 0.85rem;"><i class="bi bi-folder-plus me-1"></i> ${st.descrizione.replace(/---/g, '').trim()}</h6>`;
                            } else {
                                htmlSr += `<div class="mb-2 small"><strong>${procCount++}.</strong> ${st.descrizione}</div>`;
                            }
                        });
                        htmlSr += `</div>`;
                    }
                    htmlSr += `</div></div>`;
                });
            }
            contSotto.innerHTML = htmlSr;
        }

        // Inizializza visualizzazione e bottoni
        ricalcolaBOM();
        inputRicalcolo.addEventListener('input', ricalcolaBOM);

        document.getElementById('btn-torna-elenco').addEventListener('click', () => { UI.renderElenco(); initElenco(); });
        contSotto.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-apri-sottoricetta')) {
                window.scrollTo(0, 0);
                apriDettaglioRicetta(e.target.getAttribute('data-id'));
            }
        });

        const btnStampa = document.getElementById('btn-stampa-ricetta');
        if (btnStampa) btnStampa.addEventListener('click', () => window.print());

        // --- BOTTONE ELIMINA ---
        const btnElimina = document.getElementById('btn-elimina-ricetta');
        if (btnElimina) {
            btnElimina.addEventListener('click', async () => {
                try {
                    const coinv = await API.getUsiComeSottoricetta(id_ricetta);
                    if (coinv.length > 0) {
                        if (!confirm(`⚠️ ATTENZIONE: Questa ricetta è usata come SOTTORICETTA in:\n${coinv.map(n => "• " + n).join("\n")}\n\nEliminarla romperà la distinta base di quelle ricette. Vuoi procedere forzatamente?`)) return;
                    } else {
                        if (!confirm("Sei sicuro di voler eliminare questa ricetta e il suo storico di produzione?")) return;
                    }

                    btnElimina.disabled = true;
                    btnElimina.textContent = 'Eliminazione...';
                    await API.deleteRicetta(id_ricetta, btnElimina.getAttribute('data-img'));
                    alert("Ricetta eliminata con successo!");
                    UI.renderElenco();
                    initElenco();
                } catch (err) {
                    alert("Errore durante l'eliminazione: " + err.message);
                    btnElimina.disabled = false;
                    btnElimina.innerHTML = '🗑 Elimina';
                }
            });
        }

        // --- GESTIONE BOTTONE MODIFICA ---
        const btnModifica = document.getElementById('btn-modifica-ricetta');
        if (btnModifica) {
            btnModifica.addEventListener('click', async () => {
                idRicettaInModifica = ricetta.id;
                urlImmagineInModifica = ricetta.url_immagine;

                // 0. Pulisce la navigazione e carica il Form
                document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(el => el.classList.remove('active'));
                UI.renderInserimento();
                await initInserimento();

                // 1. PRECOMPILA DATI GENERALI
                document.getElementById('ricetta-nome').value = ricetta.nome;
                if (ricetta.id_categoria) document.getElementById('ricetta-categoria').value = ricetta.id_categoria;
                document.getElementById('ricetta-porzioni').value = ricetta.porzioni_base;
                document.getElementById('ricetta-unita').value = ricetta.unita_porzioni;
                document.getElementById('ricetta-riposo').value = ricetta.tempo_riposo_ore || 0;
                document.getElementById('ricetta-cottura').value = ricetta.tempo_cottura_min || 0;
                document.getElementById('ricetta-note').value = ricetta.note || '';
                document.getElementById('ricetta-fonte').value = ricetta.fonte || '';
                document.getElementById('ricetta-link').value = ricetta.link_fonte || '';

                // Tags
                document.querySelectorAll('.checkbox-tag').forEach(chk => chk.checked = false);
                if (ricetta.ricette_tags) {
                    ricetta.ricette_tags.forEach(rt => {
                        if (rt.id_tag) {
                            const cb = document.getElementById(`tag-${rt.id_tag}`);
                            if (cb) cb.checked = true;
                        } else if (rt.tag && rt.tag.nome) {
                            const labels = Array.from(document.querySelectorAll('.form-check-label'));
                            const labelTrovata = labels.find(l => l.textContent.trim().toLowerCase() === rt.tag.nome.toLowerCase());
                            if (labelTrovata) {
                                const cb = document.getElementById(labelTrovata.getAttribute('for'));
                                if (cb) cb.checked = true;
                            }
                        }
                    });
                }

                // Svuota i contenitori prima di riempirli per evitare doppioni
                document.getElementById('container-ingredienti').innerHTML = '';
                document.getElementById('container-procedimento').innerHTML = '';
                document.getElementById('container-sottoricette').innerHTML = '';

                // 2. PRECOMPILA INGREDIENTI
                if (ricetta.ingredienti) {
                    ricetta.ingredienti.forEach(ing => {
                        const unitaSalvata = ing.unita_distinta || ing.unita_misura || ing.unita || '';

                        if (unitaSalvata === 'SEZIONE') {
                            document.getElementById('btn-add-sezione-ing').click();
                            const riga = document.getElementById('container-ingredienti').lastElementChild;
                            riga.querySelector('.titolo-sezione').value = (ing.nome_ingrediente || ing.nome).replace(/---/g, '').trim();
                        } else {
                            // Non usa il click, usa la funzione sicura che non apre la tendina di ricerca
                            if (typeof aggiungiRigaPrecompilata === 'function') {
                                aggiungiRigaPrecompilata(ing.nome_ingrediente || ing.nome);
                                const riga = document.getElementById('container-ingredienti').lastElementChild;
                                riga.querySelector('.ing-unita').value = unitaSalvata;
                                riga.querySelector('.ing-unita').dispatchEvent(new Event('change', { bubbles: true }));
                                if (unitaSalvata !== 'q.b.') {
                                    riga.querySelector('.ing-qta').value = ing.quantita || ing.qta || 0;
                                }
                            } else {
                                // Fallback di sicurezza se la funzione non esiste nello scope
                                document.getElementById('btn-add-ingrediente').click();
                                const riga = document.getElementById('container-ingredienti').lastElementChild;
                                const selNome = riga.querySelector('.ing-nome');
                                if (!Array.from(selNome.options).some(o => o.value === (ing.nome_ingrediente || ing.nome))) {
                                    selNome.innerHTML += `<option value="${ing.nome_ingrediente || ing.nome}">${ing.nome_ingrediente || ing.nome}</option>`;
                                }
                                selNome.value = ing.nome_ingrediente || ing.nome;
                                selNome.dispatchEvent(new Event('change', { bubbles: true }));
                                riga.querySelector('.ing-unita').value = unitaSalvata;
                                riga.querySelector('.ing-unita').dispatchEvent(new Event('change', { bubbles: true }));
                                if (unitaSalvata !== 'q.b.') riga.querySelector('.ing-qta').value = ing.quantita || ing.qta || 0;
                            }
                        }
                    });
                }

                // 3. PRECOMPILA PROCEDIMENTO (Modalità Diretta Antiproiettile)
                const contProc = document.getElementById('container-procedimento'); // <-- ECCO LA VARIABILE MANCANTE!
                if (ricetta.procedimento) {
                    let procHtml = '';
                    ricetta.procedimento.forEach(p => {
                        const testo = p.descrizione || p.desc || '';
                        if (testo.startsWith('---') && testo.endsWith('---')) {
                            procHtml += UI.getSezioneStepRowHTML();
                        } else if (testo) {
                            procHtml += UI.getStepRowHTML();
                        }
                    });
                    contProc.insertAdjacentHTML('beforeend', procHtml);

                    // Riempie i valori di testo e adatta le altezze
                    Array.from(contProc.children).forEach((riga, index) => {
                        const testo = ricetta.procedimento[index].descrizione || ricetta.procedimento[index].desc || '';
                        if (testo.startsWith('---') && testo.endsWith('---')) {
                            const inputSez = riga.querySelector('.titolo-sezione-step');
                            if (inputSez) inputSez.value = testo.replace(/---/g, '').trim();
                        } else if (testo) {
                            const txtArea = riga.querySelector('.step-desc');
                            if (txtArea) {
                                txtArea.value = testo;
                                setTimeout(() => {
                                    txtArea.style.height = 'auto';
                                    txtArea.style.height = txtArea.scrollHeight + 'px';
                                }, 10);
                            }
                        }
                    });

                    // Ricalcola i numerini usando la funzione globale
                    if (typeof aggiornaNumeriStep === 'function') {
                        aggiornaNumeriStep();
                    } else {
                        // Fallback d'emergenza
                        let count = 1;
                        document.querySelectorAll('#container-procedimento .riga-step').forEach(r => {
                            const numEl = r.querySelector('.step-numero');
                            if (numEl) numEl.textContent = count++;
                        });
                    }
                }

                // 4. PRECOMPILA SOTTORICETTE
                if (ricetta.sottoricette_esplose || ricetta.sottoricette) {
                    const srArray = ricetta.sottoricette_esplose || ricetta.sottoricette;
                    srArray.forEach(sr => {
                        const nomeFiglia = sr.ricetta_figlia ? sr.ricetta_figlia.nome : sr.nome;
                        const resaBaseStr = sr.ricetta_figlia ? `${sr.ricetta_figlia.porzioni_base} ${sr.ricetta_figlia.unita_porzioni}` : '';

                        document.getElementById('container-sottoricette').insertAdjacentHTML('beforeend', UI.getSottoricettaRowHTML(nomeFiglia, resaBaseStr));

                        const riga = document.getElementById('container-sottoricette').lastElementChild;
                        riga.querySelector('.sr-moltiplicatore').value = sr.moltiplicatore;
                        riga.querySelector('.sr-moltiplicatore').dispatchEvent(new Event('input', { bubbles: true }));
                    });
                }

                document.getElementById('titolo-inserimento').textContent = `Modifica: ${ricetta.nome}`;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

    } catch (error) {
        console.error("Errore critico in apriDettaglioRicetta:", error);
        UI.container.innerHTML = `<div class="alert alert-danger m-4 shadow-sm"><h4 class="alert-heading fw-bold"><i class="bi bi-exclamation-triangle-fill"></i> Errore di caricamento</h4><p>${error.message}</p><hr><button class="btn btn-outline-danger" onclick="UI.renderElenco(); initElenco();">Torna all'elenco</button></div>`;
    }
}
let wakeLockCucina = null;
async function avviaModalitaCucina(ricetta, rapportoPorzioni) {
    try { if ('wakeLock' in navigator) wakeLockCucina = await navigator.wakeLock.request('screen'); } catch (err) { }
    let htmlIngredienti = '<h3 class="mb-4 text-warning fw-bold">Ingredienti</h3><ul class="list-group list-group-flush fs-5">';
    ricetta.ingredienti.forEach(ing => {
        if (ing.unita_distinta === 'SEZIONE') {
            htmlIngredienti += `<h5 class="mt-4 mb-2 text-info fw-bold border-bottom border-secondary pb-1"><i class="bi bi-folder-plus me-1"></i> ${ing.nome_ingrediente.replace(/---/g, '').trim()}</h5>`;
        } else {
            htmlIngredienti += `<li class="list-group-item bg-transparent text-light border-secondary d-flex justify-content-between align-items-center ps-0 pe-0">${ing.nome_ingrediente} <strong class="text-warning">${Number((ing.quantita * rapportoPorzioni).toFixed(2))} ${ing.unita_distinta}</strong></li>`;
        }
    }); if (ricetta.sottoricette_esplose?.length > 0) {
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

// ==========================================
// 8. CALENDARIO E STORICO PRODUZIONE
// ==========================================
async function initCalendario() {
    try {
        let [storico, ricette] = await Promise.all([API.getStorico(), API.getRicetteElencoBreve()]);

        let meseCorrente = new Date().getMonth();
        let annoCorrente = new Date().getFullYear();
        let vistaAttiva = getPrefs().defaultCalendarView || 'lista';

        // Elementi DOM per la Ricerca Smart
        const inputRicercaProd = document.getElementById('ricerca-prod-ricetta');
        const boxSuggerimentiProd = document.getElementById('suggerimenti-prod-ricetta');
        const hiddenProdId = document.getElementById('prod-ricetta-id');

        document.getElementById('prod-data').valueAsDate = new Date();

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
            const conteggio = {};
            storicoAnno.forEach(s => {
                if (s.ricette && s.ricette.nome) {
                    conteggio[s.ricette.nome] = (conteggio[s.ricette.nome] || 0) + 1;
                }
            });
            let top = "Nessuna", max = 0;
            for (let [n, c] of Object.entries(conteggio)) {
                if (c > max) { max = c; top = n; }
            }
            const dashStats = document.getElementById('dashboard-statistiche');
            if (dashStats) {
                dashStats.innerHTML = `<div class="col-md-4 mb-3"><div class="card bg-primary text-white shadow-sm text-center h-100 py-2"><div class="card-body"><h6 class="text-uppercase mb-1">Produzioni ${new Date().getFullYear()}</h6><h2 class="display-6 fw-bold mb-0">${storicoAnno.length}</h2></div></div></div><div class="col-md-8 mb-3"><div class="card bg-white border-primary shadow-sm h-100 py-2"><div class="card-body d-flex align-items-center justify-content-between"><div><h6 class="text-muted text-uppercase mb-1">Ricetta più prodotta</h6><h4 class="fw-bold text-dark mb-0">${top} <small class="text-muted fs-6">(${max} volte)</small></h4></div><div class="text-primary display-6">🏆</div></div></div></div>`;
            }
        }

        function renderVista() {
            const container = document.getElementById('calendario-view-container');
            if (!container) return;

            if (vistaAttiva === 'lista') {
                container.innerHTML = '<div class="list-group list-group-flush">' + (storico.length === 0 ? '<p class="text-muted">Nessuna produzione registrata.</p>' : storico.map(s => `
                    <div class="list-group-item list-group-item-action py-3">
                        <div class="row align-items-center m-0">
                            <div class="col-12 col-md-8 col-lg-9 p-0 mb-3 mb-md-0">
                                <h5 class="mb-1 fw-bold text-primary titolo-ricetta-cliccabile" style="cursor: pointer; text-decoration: underline;" title="Apri ricetta" data-id="${s.ricette ? s.ricette.id : ''}">${s.ricette ? s.ricette.nome : 'Ricetta Eliminata'}</h5>
                                <small class="text-muted fs-6">Prodotte: <strong>${s.porzioni_prodotte}</strong> porzioni</small>
                            </div>
                            
                            <div class="col-12 col-md-4 col-lg-3 p-0 d-flex justify-content-between justify-content-md-end align-items-center gap-3">
                                <span class="badge bg-light text-dark border fs-6 shadow-sm px-3 py-2">${new Date(s.data_svolgimento).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                <button class="btn btn-outline-danger shadow-sm btn-delete-produzione" data-id="${s.id}">🗑</button>
                            </div>
                        </div>
                    </div>`).join('')) + '</div>';
            } else {
                const primoGiorno = new Date(annoCorrente, meseCorrente, 1).getDay(); const offset = primoGiorno === 0 ? 6 : primoGiorno - 1;
                const giorniNelMese = new Date(annoCorrente, meseCorrente + 1, 0).getDate();
                let html = `<div class="d-flex justify-content-between align-items-center mb-3"><div><button class="btn btn-sm btn-outline-secondary" id="btn-mese-prec">◀ Prec</button><button class="btn btn-sm btn-outline-primary ms-1 fw-bold" id="btn-mese-oggi">Oggi</button></div><h5 class="fw-bold mb-0">${["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"][meseCorrente]} ${annoCorrente}</h5><button class="btn btn-sm btn-outline-secondary" id="btn-mese-succ">Succ ▶</button></div><div class="calendario-table-wrapper"><table class="table table-bordered table-fixed text-center" style="table-layout: fixed;"><thead class="bg-light"><tr><th>Lun</th><th>Mar</th><th>Mer</th><th>Gio</th><th>Ven</th><th>Sab</th><th>Dom</th></tr></thead><tbody><tr>`;
                let gSet = 0; for (let i = 0; i < offset; i++) { html += '<td class="bg-light"></td>'; gSet++; }
                for (let g = 1; g <= giorniNelMese; g++) {
                    if (gSet === 7) { html += '</tr><tr>'; gSet = 0; }
                    const prodOggi = storico.filter(s => s.data_svolgimento === `${annoCorrente}-${String(meseCorrente + 1).padStart(2, '0')}-${String(g).padStart(2, '0')}`);
                    html += `<td style="height: 100px; vertical-align: top;" class="p-1"><div class="fw-bold text-muted small text-end mb-1">${g}</div>${prodOggi.map(p => `<div class="badge bg-success d-flex justify-content-between align-items-center mb-1 shadow-sm px-2 py-1"><span class="text-truncate text-start titolo-ricetta-cliccabile" style="max-width:80%; cursor:pointer; text-decoration:underline;" title="Apri ricetta" data-id="${p.ricette ? p.ricette.id : ''}">${p.ricette ? p.ricette.nome : '???'}</span><span class="text-white ms-1 btn-delete-produzione" style="cursor:pointer;" data-id="${p.id}">✖</span></div>`).join('')}</td>`;
                    gSet++;
                }
                while (gSet < 7) { html += '<td class="bg-light"></td>'; gSet++; }
                container.innerHTML = html + '</tr></tbody></table></div>';

                document.getElementById('btn-mese-prec').addEventListener('click', () => { meseCorrente--; if (meseCorrente < 0) { meseCorrente = 11; annoCorrente--; } renderVista(); });
                document.getElementById('btn-mese-succ').addEventListener('click', () => { meseCorrente++; if (meseCorrente > 11) { meseCorrente = 0; annoCorrente++; } renderVista(); });
                document.getElementById('btn-mese-oggi').addEventListener('click', () => { meseCorrente = new Date().getMonth(); annoCorrente = new Date().getFullYear(); renderVista(); });
            }
        }

        aggiornaStatistiche();
        renderVista();

        if (btnViewLista) {
            btnViewLista.addEventListener('click', (e) => { vistaAttiva = 'lista'; e.target.classList.add('active'); if (btnViewGriglia) btnViewGriglia.classList.remove('active'); renderVista(); });
        }
        if (btnViewGriglia) {
            btnViewGriglia.addEventListener('click', (e) => { vistaAttiva = 'griglia'; e.target.classList.add('active'); if (btnViewLista) btnViewLista.classList.remove('active'); renderVista(); });
        }

        document.getElementById('calendario-view-container').addEventListener('click', async (e) => {
            const btnDelete = e.target.closest('.btn-delete-produzione');
            const btnTitolo = e.target.closest('.titolo-ricetta-cliccabile');

            if (btnDelete && confirm('Vuoi eliminare questa produzione?')) {
                btnDelete.style.opacity = '0.5';
                await API.deleteProduzione(btnDelete.getAttribute('data-id'));
                storico = await API.getStorico();
                aggiornaStatistiche();
                renderVista();
            } else if (btnTitolo) {
                const idR = btnTitolo.getAttribute('data-id');
                if (idR && idR !== 'undefined' && idR !== 'null') apriDettaglioRicetta(idR);
            }
        });

        const fCont = document.getElementById('form-produzione-container');
        document.getElementById('btn-nuova-produzione').addEventListener('click', () => fCont.classList.remove('d-none'));

        let rSelCom = null;

        // ==========================================
        // CERVELLO RICERCA SMART E CARICAMENTO
        // ==========================================
        const caricaDettagliProduzione = async (idRicetta, nomeRicetta) => {
            hiddenProdId.value = idRicetta;
            inputRicercaProd.value = nomeRicetta;
            boxSuggerimentiProd.innerHTML = '';

            const cDet = document.getElementById('prod-dettagli-dinamici');
            cDet.innerHTML = '<div class="spinner-border spinner-border-sm text-success"></div>';
            rSelCom = null;

            try {
                rSelCom = await API.getRicettaCompleta(idRicetta);

                const genBlocco = (id, nome, porzioni, unita, isSr, noteAttuali, isPadre, molt = 1, fBase = 1) => `
                <div class="card border-${isSr ? 'warning' : 'primary'} mb-3 riga-produzione-item ${isPadre ? 'riga-padre' : 'riga-figlia'}" data-id="${id}" data-molt="${molt}" data-figlia-base="${fBase}">
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
                                    <input type="number" step="0.01" class="form-control stepper-input input-porzioni-reali px-0" value="${porzioni}" data-base="${porzioni}">
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

                let html = genBlocco(rSelCom.id, rSelCom.nome, rSelCom.porzioni_base, rSelCom.unita_porzioni, false, rSelCom.note, true);

                if (rSelCom.sottoricette_esplose) {
                    html += rSelCom.sottoricette_esplose.map(sr => {
                        const porzioniCalcolate = Number((sr.moltiplicatore * sr.ricetta_figlia.porzioni_base).toFixed(2));
                        return genBlocco(sr.ricetta_figlia.id, sr.ricetta_figlia.nome, porzioniCalcolate, sr.ricetta_figlia.unita_porzioni, true, sr.ricetta_figlia.note, false, sr.moltiplicatore, sr.ricetta_figlia.porzioni_base);
                    }).join('');
                }

                cDet.innerHTML = html;

                cDet.querySelectorAll('.check-porzioni-modificate').forEach(chk => {
                    chk.addEventListener('change', (ev) => {
                        if (ev.target.checked) ev.target.closest('.card-body').querySelector('.contenitore-input-porzioni').classList.remove('d-none');
                        else ev.target.closest('.card-body').querySelector('.contenitore-input-porzioni').classList.add('d-none');
                    });
                });

                // MAGIA: Ricalcolo proporzionale delle sottoricette
                cDet.addEventListener('input', (e) => {
                    if (e.target.classList.contains('input-porzioni-reali')) {
                        const riga = e.target.closest('.riga-produzione-item');
                        if (riga.classList.contains('riga-padre')) {
                            const nuovoValPadre = parseFloat(e.target.value) || 0;
                            const porzioniBasePadre = rSelCom.porzioni_base || 1;
                            const rapporto = nuovoValPadre / porzioniBasePadre;

                            cDet.querySelectorAll('.riga-figlia').forEach(figlia => {
                                const molt = parseFloat(figlia.getAttribute('data-molt')) || 0;
                                const fBase = parseFloat(figlia.getAttribute('data-figlia-base')) || 1;
                                const nuovoValFiglia = Number((rapporto * molt * fBase).toFixed(2));
                                const inputFiglia = figlia.querySelector('.input-porzioni-reali');
                                inputFiglia.value = nuovoValFiglia;
                                inputFiglia.setAttribute('data-base', nuovoValFiglia);
                            });
                        }
                    }
                });

            } catch (err) {
                cDet.innerHTML = `<div class="alert alert-danger">Errore db: ${err.message}</div>`;
            }
        };

        // Listeners Barra di Ricerca
        if (inputRicercaProd) {
            inputRicercaProd.addEventListener('input', (e) => {
                const val = e.target.value.toLowerCase().trim();
                hiddenProdId.value = '';
                document.getElementById('prod-dettagli-dinamici').innerHTML = '';
                rSelCom = null;

                if (!val) { boxSuggerimentiProd.innerHTML = ''; return; }

                const matches = ricette.filter(r => r.nome.toLowerCase().includes(val));
                if (matches.length > 0) {
                    boxSuggerimentiProd.innerHTML = matches.slice(0, 10).map(m => `
                        <div class="badge bg-white text-success border border-success p-2 fs-6 shadow-sm sugg-btn-prod" style="cursor: pointer; transition: 0.2s;" onmouseover="this.classList.replace('bg-white', 'bg-success'); this.classList.replace('text-success', 'text-white');" onmouseout="this.classList.replace('bg-success', 'bg-white'); this.classList.replace('text-white', 'text-success');" data-id="${m.id}" data-nome="${m.nome}">
                            + ${m.nome}
                        </div>
                    `).join('');
                } else {
                    boxSuggerimentiProd.innerHTML = `<span class="text-danger small fw-bold">Ricetta non trovata.</span>`;
                }
            });

            boxSuggerimentiProd.addEventListener('click', (e) => {
                const btn = e.target.closest('.sugg-btn-prod');
                if (btn) caricaDettagliProduzione(btn.getAttribute('data-id'), btn.getAttribute('data-nome'));
            });

            inputRicercaProd.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = inputRicercaProd.value.trim();
                    const esatto = ricette.find(r => r.nome.toLowerCase() === val.toLowerCase());
                    if (esatto) caricaDettagliProduzione(esatto.id, esatto.nome);
                    else alert("⚠️ Ricetta non valida. Clicca su uno dei suggerimenti proposti.");
                }
            });
        }

        // ==========================================
        // ANNULLA E SALVATAGGIO
        // ==========================================
        document.getElementById('btn-annulla-produzione').addEventListener('click', () => {
            fCont.classList.add('d-none');
            document.getElementById('form-produzione').reset();
            if (inputRicercaProd) inputRicercaProd.value = '';
            if (hiddenProdId) hiddenProdId.value = '';
            document.getElementById('prod-dettagli-dinamici').innerHTML = '';
            rSelCom = null;
        });

        document.getElementById('form-produzione').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!rSelCom) return;

            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = "Salvataggio...";

            try {
                const dataSv = document.getElementById('prod-data').value;
                const dataIt = new Date(dataSv).toLocaleDateString('it-IT');
                let prodSalvare = [], noteAgg = [];

                document.querySelectorAll('.riga-produzione-item').forEach(b => {
                    const idR = b.getAttribute('data-id');
                    const vInp = b.querySelector('.input-porzioni-reali');
                    const porzioniEffettive = b.querySelector('.check-porzioni-modificate').checked ? parseFloat(vInp.value) : parseFloat(vInp.getAttribute('data-base'));

                    prodSalvare.push({
                        id_ricetta: idR,
                        data_svolgimento: dataSv,
                        porzioni_prodotte: porzioniEffettive
                    });

                    const notaInput = b.querySelector('.input-note-produzione');
                    const noteNuove = notaInput ? notaInput.value.trim() : "";

                    if (noteNuove !== "") {
                        const vecchieNote = b.querySelector('.vecchie-note-nascoste') ? b.querySelector('.vecchie-note-nascoste').value : "";
                        noteAgg.push({
                            id_ricetta: idR,
                            note_finali: (vecchieNote ? vecchieNote + `\n\n--- Note ${dataIt} ---\n${noteNuove}` : `--- Note ${dataIt} ---\n${noteNuove}`).trim()
                        });
                    }
                });

                await API.registraProduzione(prodSalvare, noteAgg);
                alert("Produzione Registrata!");

                fCont.classList.add('d-none');
                document.getElementById('form-produzione').reset();
                if (inputRicercaProd) inputRicercaProd.value = '';
                if (hiddenProdId) hiddenProdId.value = '';
                document.getElementById('prod-dettagli-dinamici').innerHTML = '';
                rSelCom = null;

                storico = await API.getStorico();
                aggiornaStatistiche();
                renderVista();

                btn.disabled = false;
                btn.textContent = "Salva nel Calendario";
            } catch (err) {
                alert("Errore durante il salvataggio: " + err.message);
                btn.disabled = false;
                btn.textContent = "Salva nel Calendario";
            }
        });
    } catch (error) {
        UI.container.innerHTML = `<div class="alert alert-danger">Errore calendario: ${error.message}</div>`;
    }
}

// ==========================================
// 6. LISTA DELLA SPESA (SINCRONIZZATA IN CLOUD)
// ==========================================
async function initSpesa() {
    let statoSpesa = { ricetteInMenu: [], spunte: {} };

    const inputRicercaSpesa = document.getElementById('ricerca-spesa-ricetta');
    const boxSuggerimentiSpesa = document.getElementById('suggerimenti-spesa-ricetta');
    const hiddenSpesaId = document.getElementById('spesa-ricetta-id');

    const inputPorzioni = document.getElementById('spesa-input-porzioni');
    const btnAggiungi = document.getElementById('btn-aggiungi-spesa');
    const btnSvuota = document.getElementById('btn-svuota-spesa');
    const listaRicette = document.getElementById('lista-ricette-spesa');
    const listaAggregata = document.getElementById('lista-spesa-aggregata');

    // 1. SCARICHIAMO LO STATO DELLA SPESA DAL DATABASE (Protetto)
    try {
        if (listaAggregata) {
            listaAggregata.innerHTML = '<li class="list-group-item text-center text-muted p-4"><div class="spinner-border text-primary spinner-border-sm mb-2"></div><br>Sincronizzazione carrello dal cloud...</li>';
        }
        const spesaDalDB = await API.getSpesa();
        statoSpesa = spesaDalDB || { ricetteInMenu: [], spunte: {} };
        if (!statoSpesa.ricetteInMenu) statoSpesa.ricetteInMenu = [];
        if (!statoSpesa.spunte) statoSpesa.spunte = {};
    } catch (e) {
        console.error("Errore caricamento spesa dal DB", e);
        statoSpesa = { ricetteInMenu: [], spunte: {} };
    }

    // 2. SCARICHIAMO LE RICETTE (Per la barra smart)
    let ricetteSpesa = [];
    try {
        ricetteSpesa = await API.getRicetteElencoBreve();
    } catch (errApi) {
        if (inputRicercaSpesa) {
            inputRicercaSpesa.placeholder = "Errore database";
            inputRicercaSpesa.disabled = true;
        }
        return;
    }

    // 3. MOTORE DELLA BARRA SMART
    const selezionaRicettaSpesa = async (idRicetta, nomeRicetta) => {
        hiddenSpesaId.value = idRicetta;
        inputRicercaSpesa.value = nomeRicetta;
        boxSuggerimentiSpesa.innerHTML = '';

        btnAggiungi.disabled = true;
        inputPorzioni.value = "Caricamento...";
        try {
            const ricTrovata = ricetteSpesa.find(r => r.id === idRicetta);
            inputPorzioni.value = ricTrovata ? (ricTrovata.porzioni_base || 1) : 1;
            btnAggiungi.disabled = false;
        } catch (err) {
            inputPorzioni.value = '';
            alert("Impossibile caricare i dettagli della ricetta.");
        }
    };

    if (inputRicercaSpesa) {
        inputRicercaSpesa.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase().trim();
            hiddenSpesaId.value = '';
            btnAggiungi.disabled = true;
            inputPorzioni.value = '';

            if (!val) { boxSuggerimentiSpesa.innerHTML = ''; return; }

            const matches = ricetteSpesa.filter(r => r.nome.toLowerCase().includes(val));
            if (matches.length > 0) {
                boxSuggerimentiSpesa.innerHTML = matches.slice(0, 10).map(m => `
                    <div class="badge bg-white text-primary border border-primary p-2 fs-6 shadow-sm sugg-btn-spesa" style="cursor: pointer; transition: 0.2s;" onmouseover="this.classList.replace('bg-white', 'bg-primary'); this.classList.replace('text-primary', 'text-white');" onmouseout="this.classList.replace('bg-primary', 'bg-white'); this.classList.replace('text-white', 'text-primary');" data-id="${m.id}" data-nome="${m.nome}">
                        + ${m.nome}
                    </div>
                `).join('');
            } else {
                boxSuggerimentiSpesa.innerHTML = `<span class="text-danger small fw-bold">Ricetta non trovata.</span>`;
            }
        });

        boxSuggerimentiSpesa.addEventListener('click', (e) => {
            const btn = e.target.closest('.sugg-btn-spesa');
            if (btn) selezionaRicettaSpesa(btn.getAttribute('data-id'), btn.getAttribute('data-nome'));
        });

        inputRicercaSpesa.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const val = inputRicercaSpesa.value.trim();
                const esatto = ricetteSpesa.find(r => r.nome.toLowerCase() === val.toLowerCase());
                if (esatto) selezionaRicettaSpesa(esatto.id, esatto.nome);
                else alert("⚠️ Ricetta non valida. Clicca su uno dei suggerimenti proposti.");
            }
        });
    }

    // 4. FUNZIONE DI SALVATAGGIO AUTOMATICO
    function salvaStatoCloud() {
        API.saveSpesa(statoSpesa);
    }

    // 5. MOTORE MATEMATICO E AGGIORNAMENTO GRAFICO
    function renderDatiSpesa() {
        if (statoSpesa.ricetteInMenu.length === 0) {
            listaRicette.innerHTML = '<li class="list-group-item text-muted small">Nessuna ricetta in programma.</li>';
        } else {
            listaRicette.innerHTML = statoSpesa.ricetteInMenu.map((item, index) => `
                <li class="list-group-item d-flex justify-content-between align-items-center bg-white shadow-sm mb-2 border rounded">
                    <div>
                        <strong class="text-primary titolo-ricetta-cliccabile" style="cursor: pointer; text-decoration: underline;" title="Apri ricetta" data-id="${item.id}">${item.nome}</strong><br>
                        <small class="text-muted">${item.porzioni} porzioni previste</small>
                    </div>
                    <button class="btn btn-sm btn-outline-danger btn-rimuovi-ricetta" data-index="${index}">✖</button>
                </li>
            `).join('');
        }

        let mappaIngredienti = {};
        statoSpesa.ricetteInMenu.forEach(item => {
            if (item.ingredientiEsplosi) {
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
            }
        });

        let ingredientiAggregati = Object.keys(mappaIngredienti).map(key => ({
            key: key, ...mappaIngredienti[key]
        })).sort((a, b) => a.nome.localeCompare(b.nome));

        if (ingredientiAggregati.length === 0) {
            listaAggregata.innerHTML = '<li class="list-group-item text-muted p-4 text-center border-0">Aggiungi delle ricette per generare la spesa.</li>';
        } else {
            listaAggregata.innerHTML = ingredientiAggregati.map(ing => {
                const isChecked = statoSpesa.spunte[ing.key] ? 'checked' : '';

                // Variabili di stile dinamiche per l'effetto spegnimento
                const liBgClass = isChecked ? 'bg-light opacity-50' : 'bg-white';
                const textClass = isChecked ? 'text-decoration-line-through text-muted' : 'fw-bold text-dark';
                const badgeClass = isChecked ? 'bg-secondary text-decoration-line-through' : 'bg-success shadow-sm';
                const qtaArrotondata = Number(ing.qta.toFixed(2));

                return `
                <li class="list-group-item d-flex align-items-center py-3 border-bottom ${liBgClass}" style="transition: all 0.2s ease-in-out;">
                    <input class="form-check-input me-3 check-ingrediente shadow-sm" style="transform: scale(1.4);" type="checkbox" data-key="${ing.key}" ${isChecked}>
                    <div class="flex-grow-1 ${textClass} fs-5 label-ingrediente">
                        ${ing.nome}
                    </div>
                    <div class="badge ${badgeClass} rounded-pill fs-6 px-3 py-2">
                        ${qtaArrotondata} ${ing.unita}
                    </div>
                </li>`;
            }).join('');
        }

        salvaStatoCloud();
    }

    // 6. AGGIUNTA DI UNA NUOVA RICETTA ALLA SPESA
    btnAggiungi.addEventListener('click', async () => {
        const idRicetta = hiddenSpesaId.value;
        const porzioniRichieste = parseFloat(inputPorzioni.value);
        if (!idRicetta || isNaN(porzioniRichieste)) return;

        btnAggiungi.disabled = true;
        btnAggiungi.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Calcolo BOM...';

        try {
            const ricetta = await API.getRicettaCompleta(idRicetta);
            const rapporto = porzioniRichieste / (ricetta.porzioni_base || 1);
            let ingredientiEstratti = [];

            if (ricetta.ingredienti) {
                ricetta.ingredienti.forEach(ing => {
                    if (ing.unita_distinta === 'SEZIONE') return;
                    ingredientiEstratti.push({ nome: ing.nome_ingrediente, unita: ing.unita_distinta, qta: ing.quantita * rapporto });
                });
            }

            if (ricetta.sottoricette_esplose && ricetta.sottoricette_esplose.length > 0) {
                ricetta.sottoricette_esplose.forEach(sr => {
                    const rFiglia = sr.ricetta_figlia;
                    if (!rFiglia || !rFiglia.ingredienti) return;

                    const moltiplicatoreReale = parseFloat(sr.moltiplicatore) || 1;
                    const rapportoSotto = rapporto * moltiplicatoreReale;

                    rFiglia.ingredienti.forEach(subIng => {
                        if (subIng.unita_distinta === 'SEZIONE') return;
                        ingredientiEstratti.push({ nome: subIng.nome_ingrediente, unita: subIng.unita_distinta, qta: subIng.quantita * rapportoSotto });
                    });
                });
            }

            statoSpesa.ricetteInMenu.push({
                id: ricetta.id, nome: ricetta.nome, porzioni: porzioniRichieste, ingredientiEsplosi: ingredientiEstratti
            });
            statoSpesa.spunte = {};

            inputRicercaSpesa.value = ''; hiddenSpesaId.value = ''; inputPorzioni.value = '';
            btnAggiungi.disabled = true; btnAggiungi.innerHTML = '<i class="bi bi-plus-square"></i> Aggiungi alla spesa';

            renderDatiSpesa();
        } catch (e) {
            console.error(e);
            alert("Errore nell'estrazione della distinta base.");
            btnAggiungi.disabled = false; btnAggiungi.innerHTML = '<i class="bi bi-plus-square"></i> Aggiungi alla spesa';
        }
    });

    // 7. GESTIONE DEI CLICK SULLE LISTE
    if (listaRicette) {
        listaRicette.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-rimuovi-ricetta')) {
                const index = e.target.getAttribute('data-index');
                statoSpesa.ricetteInMenu.splice(index, 1);
                statoSpesa.spunte = {};
                renderDatiSpesa();
            } else if (e.target.classList.contains('titolo-ricetta-cliccabile')) {
                const idRicetta = e.target.getAttribute('data-id');
                if (idRicetta) apriDettaglioRicetta(idRicetta);
            }
        });
    }

    if (listaAggregata) {
        listaAggregata.addEventListener('change', (e) => {
            if (e.target.classList.contains('check-ingrediente')) {
                const key = e.target.getAttribute('data-key');
                statoSpesa.spunte[key] = e.target.checked;
                renderDatiSpesa();
            }
        });
    }

    if (btnSvuota) {
        btnSvuota.addEventListener('click', () => {
            if (confirm("Vuoi cancellare tutto il menu e le spunte della spesa?")) {
                statoSpesa = { ricetteInMenu: [], spunte: {} };
                renderDatiSpesa();
            }
        });
    }

    // ==========================================
    // INVIA SU WHATSAPP (Senza Emoji e Pulito)
    // ==========================================
    const btnCondividiWA = document.getElementById('btn-condividi-whatsapp');
    if (btnCondividiWA) {
        btnCondividiWA.addEventListener('click', () => {
            if (statoSpesa.ricetteInMenu.length === 0) {
                alert("Il carrello è vuoto! Aggiungi qualche ricetta prima di inviare la spesa.");
                return;
            }

            // 1. Costruisci il messaggio formattato per WA
            let messaggio = "LA LISTA DELLA SPESA\n\n";

            // Sezione Menu
            messaggio += ">> Menu in programma:\n";
            statoSpesa.ricetteInMenu.forEach(item => {
                messaggio += `${item.nome} (${item.porzioni} porzioni)\n`;
            });

            messaggio += "\n>> Da comprare:\n";

            // 2. Ricalcola gli ingredienti
            let mappaIngredienti = {};
            statoSpesa.ricetteInMenu.forEach(item => {
                if (item.ingredientiEsplosi) {
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
                }
            });

            let ingredientiAggregati = Object.keys(mappaIngredienti).map(key => ({
                key: key, ...mappaIngredienti[key]
            })).sort((a, b) => a.nome.localeCompare(b.nome));

            // 3. Aggiungiamo SOLO gli ingredienti NON SPUNTATI
            let countDaComprare = 0;
            ingredientiAggregati.forEach(ing => {
                if (!statoSpesa.spunte[ing.key]) {
                    let qtaArrotondata = Number(ing.qta.toFixed(2));

                    // Correzione estetica per il "q.b."
                    if (ing.unita === 'q.b.' && qtaArrotondata === 0) {
                        messaggio += `☐ ${ing.nome} - q.b.\n`;
                    } else {
                        messaggio += `☐ ${ing.nome} - ${qtaArrotondata} ${ing.unita}\n`;
                    }

                    countDaComprare++;
                }
            });

            if (countDaComprare === 0) {
                alert("Hai già spuntato tutti gli ingredienti! Non c'è nulla da comprare.");
                return;
            }

            messaggio += "\nGenerato dal mio Ricettario";

            // 4. Apri WhatsApp passando il messaggio pulito
            const url = `https://wa.me/?text=${encodeURIComponent(messaggio)}`;
            window.open(url, '_blank');
        });
    }

    renderDatiSpesa();
}