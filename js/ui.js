// js/ui.js

const UI = {
    container: document.getElementById('app-content'),

    renderElenco: function () {
        this.container.innerHTML = `
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <h2 class="mb-0 fw-bold d-flex align-items-center">
                    <i class="bi bi-grid-fill me-1"></i> Ricettario 
                    <span class="badge bg-primary fs-5 ms-3 shadow-sm" id="badge-totale-ricette">-</span>
                </h2>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-warning shadow-sm fw-bold text-dark" id="btn-roulette" title="Cosa preparo? Sceglie a caso tra le ricette filtrate">
                        <i class="bi bi-dice-5-fill"></i> Estrai
                    </button>
                    <button class="btn btn-primary shadow-sm fw-bold" id="btn-nuova-ricetta-elenco">
                        <i class="bi bi-plus-square"></i> Crea nuova ricetta
                    </button>
                </div>
            </div>
            
            <div class="card mb-4 shadow-sm border-0 bg-white">
                <div class="card-body">
                    <div class="row g-3 align-items-center">
                        <div class="col-md-3">
                            <input type="text" id="filtro-testo" class="form-control shadow-sm" placeholder="🔍 Nome...">
                        </div>
                        <div class="col-md-3">
                            <select id="filtro-categoria" class="form-select shadow-sm">
                                <option value="">Tutte le categorie</option>
                            </select>
                        </div>
                        
                        <div class="col-md-3 d-flex gap-2">
                            <select id="filtro-tag" class="form-select shadow-sm w-100">
                                <option value="">Tutti i tag</option>
                            </select>
                            <button class="btn btn-warning fw-bold border-warning text-dark px-3 shadow-sm flex-shrink-0 rounded" id="btn-toggle-dispensa" title="Ricerca Svuota-Dispensa" type="button"><i class="bi bi-fork-knife"></i></button>
                        </div>
                        
                        <div class="col-md-3 d-flex align-items-center justify-content-md-end justify-content-between gap-3">
                            <div class="form-check form-switch m-0 d-flex align-items-center" title="Attiva/disattiva vista a cassetti">
                                <input class="form-check-input shadow-sm m-0" type="checkbox" id="toggle-raggruppa" checked style="cursor: pointer; transform: scale(1.3);">
                                <label class="form-check-label small fw-bold text-muted ms-2" for="toggle-raggruppa" style="cursor: pointer; padding-top: 2px;">Categorie</label>
                            </div>

                            <div class="btn-group shadow-sm" role="group">
                                <button type="button" class="btn btn-outline-dark active" id="btn-view-grid" title="Vista a card"><svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M1 1h4v4H1V1zm5 0h4v4H6V1zm5 0h4v4h-4V1zM1 6h4v4H1V6zm5 0h4v4H6V6zm5 0h4v4h-4V6zM1 11h4v4H1v-4zm5 0h4v4H6v-4zm5 0h4v4h-4v-4z"/></svg></button>
                                <button type="button" class="btn btn-outline-dark" id="btn-view-list" title="Vista ad elenco"><svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg></button>
                                <button type="button" class="btn btn-outline-dark" id="btn-view-compact" title="Vista compatta"><svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><circle cx="8" cy="3" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="13" r="1.5"/></svg></button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mt-3 d-none" id="container-filtro-ingrediente">
                        <div class="col-12">
                            <div class="p-3 bg-warning bg-opacity-10 border border-warning rounded shadow-sm d-flex align-items-center gap-3">
                                <span class="fs-4"><i class="bi bi-fork-knife"></i></span>
                                <div class="flex-grow-1">
                                    <label class="form-label fw-bold text-dark mb-1">Ricerca Svuota-Dispensa</label>
                                    <input type="text" id="filtro-ingrediente" class="form-control border-warning shadow-sm" placeholder="Scrivi gli ingredienti separati da virgola (es. farina, uova)...">
                                </div>
                                <button type="button" class="btn btn-outline-secondary mt-4 bg-white shadow-sm" id="btn-chiudi-dispensa">✖</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row" id="griglia-ricette">
                <div class="col-12 text-center text-muted">Caricamento ricette in corso...</div>
            </div>
        `;
    },

    renderCards: function (ricette, viewMode = 'grid', isGrouped = true, categorieAperte = []) {
        const griglia = document.getElementById('griglia-ricette');
        if (!griglia) return;

        if (ricette.length === 0) {
            griglia.innerHTML = '<div class="col-12 text-center text-muted py-5">Nessuna ricetta trovata con questi filtri.</div>';
            return;
        }

        let html = '';

        // ==========================================
        // CASO 1: VISTA PIATTA (A-Z) - Niente Cassetti
        // ==========================================
        if (!isGrouped) {
            html += '<div class="row g-3">';
            ricette.forEach(r => {
                const catNome = r.categorie ? r.categorie.nome : 'Senza categoria';
                const imgUrl = r.url_immagine || 'https://placehold.co/400x300?text=Nessuna+Immagine';
                if (viewMode === 'compact') {
                    // Vista super compatta
                    html += `
                        <div class="col-12 mb-1">
                            <div class="px-3 py-2 border-bottom ricetta-card d-flex align-items-center" style="cursor: pointer; transition: background-color 0.2s;" data-id="${r.id}" onmouseover="this.classList.add('bg-light')" onmouseout="this.classList.remove('bg-light')">
                                <span class="me-3 text-primary fs-5">•</span>
                                <span class="fw-bold text-dark fs-6">${r.nome}</span>
                                ${catNome !== 'Senza categoria' ? `<small class="ms-auto text-muted d-none d-md-block">${catNome}</small>` : ''}
                            </div>
                        </div>
                    `;
                } else if (viewMode === 'list') {
                    // Vista Elenco classica (con miniatura)
                    html += `
                        <div class="col-12">
                            <div class="card shadow-sm ricetta-card flex-row align-items-center p-2" style="cursor: pointer; transition: background-color 0.2s;" data-id="${r.id}" onmouseover="this.classList.add('bg-light')" onmouseout="this.classList.remove('bg-light')">
                                <img src="${imgUrl}" class="rounded shadow-sm" alt="${r.nome}" style="width: 80px; height: 80px; object-fit: cover; margin-right: 15px;">
                                <div>
                                    <h5 class="mb-0 fw-bold text-dark">${r.nome}</h5>
                                    <small class="text-muted">${catNome}</small>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    // Vista Griglia classica
                    const tagsHTML = r.ricette_tags.map(rt => `<span class="badge bg-secondary me-1 mb-1">${rt.tag.nome}</span>`).join('');
                    html += `
                        <div class="col-md-4 col-lg-3">
                            <div class="card h-100 shadow-sm ricetta-card" style="cursor: pointer; transition: transform 0.2s;" data-id="${r.id}" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                                <img src="${imgUrl}" class="card-img-top" alt="${r.nome}" style="height: 180px; object-fit: cover;">
                                <div class="card-body d-flex flex-column p-3">
                                    <h6 class="card-title fw-bold mb-2">${r.nome}</h6>
                                    <h6 class="card-subtitle mb-3 text-muted small">${catNome}</h6>
                                    <div class="mt-auto">${tagsHTML}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });
            html += '</div>';
            griglia.innerHTML = html;
            return;
        }

        // ==========================================
        // CASO 2: VISTA A CASSETTI (Categoria)
        // ==========================================
        const gruppi = {};
        ricette.forEach(r => {
            const catNome = r.categorie ? r.categorie.nome : 'Senza categoria';
            if (!gruppi[catNome]) gruppi[catNome] = [];
            gruppi[catNome].push(r);
        });

        const categorieOrdinate = Object.keys(gruppi).sort((a, b) => {
            if (a === 'Senza categoria') return 1;
            if (b === 'Senza categoria') return -1;
            return a.localeCompare(b);
        });

        categorieOrdinate.forEach((catNome, index) => {
            const ricetteCategoria = gruppi[catNome];
            const catId = 'collapse-cat-' + index;
            const isOpen = categorieAperte.includes(catNome) ? 'show' : '';

            html += `
                <div class="col-12 mb-4">
                    <div class="d-flex justify-content-between align-items-center p-3 rounded shadow-sm border" 
                         style="cursor: pointer; background-color: var(--bs-tertiary-bg);" 
                         data-bs-toggle="collapse" data-bs-target="#${catId}">
                        <h4 class="mb-0 fw-bold text-primary">${catNome} <span class="badge bg-primary rounded-pill ms-2 fs-6">${ricetteCategoria.length}</span></h4>
                        <span class="fs-5 text-muted">▼</span>
                    </div>
                    
                    <div class="collapse ${isOpen} mt-3" id="${catId}" data-cat-nome="${catNome}">
                        <div class="row g-3">
            `;

            ricetteCategoria.forEach(r => {
                const imgUrl = r.url_immagine || 'https://placehold.co/400x300?text=Nessuna+Immagine';
                if (viewMode === 'compact') {
                    // Vista super compatta nei cassetti
                    html += `
                        <div class="col-12 mb-1">
                            <div class="px-3 py-2 border-bottom ricetta-card d-flex align-items-center" style="cursor: pointer; transition: background-color 0.2s;" data-id="${r.id}" onmouseover="this.classList.add('bg-light')" onmouseout="this.classList.remove('bg-light')">
                                <span class="me-3 text-primary fs-5">•</span>
                                <span class="fw-bold text-dark fs-6">${r.nome}</span>
                            </div>
                        </div>
                    `;
                } else if (viewMode === 'list') {
                    html += `
                        <div class="col-12">
                            <div class="card shadow-sm ricetta-card flex-row align-items-center p-2" style="cursor: pointer; transition: background-color 0.2s;" data-id="${r.id}" onmouseover="this.classList.add('bg-light')" onmouseout="this.classList.remove('bg-light')">
                                <img src="${imgUrl}" class="rounded shadow-sm" alt="${r.nome}" style="width: 80px; height: 80px; object-fit: cover; margin-right: 15px;">
                                <div>
                                    <h5 class="mb-0 fw-bold text-dark">${r.nome}</h5>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    const tagsHTML = r.ricette_tags.map(rt => `<span class="badge bg-secondary me-1 mb-1">${rt.tag.nome}</span>`).join('');
                    html += `
                        <div class="col-md-4 col-lg-3">
                            <div class="card h-100 shadow-sm ricetta-card" style="cursor: pointer; transition: transform 0.2s;" data-id="${r.id}" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                                <img src="${imgUrl}" class="card-img-top" alt="${r.nome}" style="height: 180px; object-fit: cover;">
                                <div class="card-body d-flex flex-column p-3">
                                    <h6 class="card-title fw-bold mb-2">${r.nome}</h6>
                                    <div class="mt-auto">${tagsHTML}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });

            html += `
                        </div>
                    </div>
                </div>
            `;
        });

        griglia.innerHTML = html;
    },


    renderImpostazioni: function () {
        this.container.innerHTML = `
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 border-bottom pb-3">
                <h2 class="mb-0 fw-bold"><i class="bi bi-gear"></i> Impostazioni</h2>
                <button class="btn btn-info shadow-sm fw-bold text-white mt-3 mt-md-0 px-4 py-2" id="btn-apri-manuale" style="background-color: #17a2b8; border: none;">
                    <i class="bi bi-book-fill"></i> Leggi il Manuale d'Uso
                </button>
            </div>
            
            <div class="row" id="row-impostazioni-top">
                <div class="col-md-6 mb-4" id="sezione-preferenze">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-dark text-white fw-bold p-3"><i class="bi bi-palette-fill"></i> Preferenze grafiche</div>
                        <div class="card-body bg-white p-4">
                            <div class="mb-4">
                                <label class="form-label fw-bold text-dark">Tema dell'app</label>
                                <select class="form-select shadow-sm" id="pref-theme"><option value="light">Chiaro</option><option value="dark">Scuro</option></select>
                            </div>
                            <div class="mb-4">
                                <label class="form-label fw-bold text-dark">Vista galleria</label>
                                <select class="form-select shadow-sm" id="pref-view"><option value="grid">Griglia</option><option value="list">Elenco</option><option value="compact">Compatto</option></select>
                            </div>
                            <div class="mb-4">
                                <label class="form-label fw-bold text-dark">Raggruppamento ricette</label>
                                <select class="form-select shadow-sm" id="pref-grouped"><option value="true">Cassetti (Categorie)</option><option value="false">Alfabetico (A-Z)</option></select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold text-dark">Vista Diario/Calendario</label>
                                <select class="form-select shadow-sm" id="pref-calendar-view"><option value="lista">Lista cronologica</option><option value="griglia">Griglia mensile</option></select>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-6 mb-4" id="sezione-admin-tag">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-primary text-white fw-bold p-3"><i class="bi bi-bookmark-fill"></i> Categorie e Tag</div>
                        <div class="card-body bg-white p-4">
                            <div class="mb-4">
                                <label class="form-label fw-bold text-primary">Categorie</label>
                                <div class="input-group shadow-sm mb-2"><input type="text" id="input-categoria" class="form-control"><button class="btn btn-primary fw-bold" id="btn-add-categoria">+</button></div>
                                <ul class="list-group shadow-sm" id="lista-categorie" style="max-height: 150px; overflow-y: auto;"></ul>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold text-secondary">Tag</label>
                                <div class="input-group shadow-sm mb-2"><input type="text" id="input-tag" class="form-control"><button class="btn btn-secondary fw-bold text-white" id="btn-add-tag">+</button></div>
                                <ul class="list-group shadow-sm" id="lista-tag" style="max-height: 150px; overflow-y: auto;"></ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row" id="sezione-admin-dizionario">
                <div class="col-12 mb-5">
                    <div class="card shadow-sm border-warning">
                        <div class="card-header bg-warning text-dark fw-bold p-3"><i class="bi bi-cart-fill"></i> Dizionario Ingredienti Centrale</div>
                        <div class="card-body bg-white p-4">
                            <p class="small text-muted mb-3">Gli ingredienti inseriti qui saranno <strong>gli unici selezionabili</strong> nelle ricette. Separa più unità di misura con la virgola (es. <span class="badge bg-light text-dark">g, ml</span> oppure <span class="badge bg-light text-dark">pz</span>).</p>
                            <div class="row g-2 mb-3">
                                <div class="col-md-5"><input type="text" id="input-ing-nome" class="form-control" placeholder="Nome (es. Farina 00)"></div>
                                <div class="col-md-5"><input type="text" id="input-ing-unita" class="form-control" placeholder="Unità ammesse (es. g, ml)"></div>
                                <div class="col-md-2"><button class="btn btn-warning w-100 fw-bold" id="btn-add-ingrediente-diz">Aggiungi</button></div>
                            </div>
                            <ul class="list-group shadow-sm" id="lista-ingredienti-diz" style="max-height: 300px; overflow-y: auto;">
                                <li class="list-group-item text-center text-muted">Caricamento...</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },


    renderManuale: function () {
        // Legge se chi sta visualizzando è l'Admin (se la variabile non esiste ancora, è false)
        const isAdmin = typeof isUtenteAdmin !== 'undefined' ? isUtenteAdmin : false;

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <h2 class="mb-0 fw-bold text-primary"><i class="bi bi-book-fill"></i> Manuale d'uso ${isAdmin ? '<span class="text-danger">(Admin)</span>' : '<span class="text-secondary">(Operatore)</span>'}</h2>
                <button class="btn btn-outline-secondary shadow-sm fw-bold" id="btn-chiudi-manuale">← Torna alle Impostazioni</button>
            </div>
            
            <div class="card shadow-sm border-0 mb-5">
                <div class="card-body p-4 p-md-5" style="line-height: 1.8; font-size: 1.05rem;">
                    <p class="fs-5 text-muted mb-5">Benvenuto nel gestionale ricette in cloud. L'interfaccia si adatta automaticamente al tuo dispositivo (PC o Smartphone).</p>

                    <h4 class="fw-bold text-primary mt-4 border-bottom pb-2">1. <i class="bi bi-book-fill"></i> Esplorare la Galleria</h4>
                    <p>La schermata principale è la tua libreria. Puoi:</p>
                    <ul>
                        <li>Cercare per <strong>Nome</strong>, o filtrare a tendina per <strong>Categoria</strong> e <strong>Tag</strong>.</li>
                        <li>Usare l'interruttore <strong>Categorie</strong> per raggruppare a cassetti o vedere tutto in ordine alfabetico (A-Z).</li>
                        <li>Cambiare visualizzazione (Griglia, Elenco, Compatta) tramite i bottoni in alto a destra.</li>
                        <li class="mt-2"><i class="bi bi-fork-knife"></i> <strong>Ricerca Svuota-Dispensa:</strong> Clicca sul bottone con la carota per aprire la ricerca per ingredienti. Scrivi più ingredienti separati da virgola (es. <em>mascarpone, fragole</em>) per trovare tutte le ricette che li contengono (anche all'interno delle loro sottoricette!).</li>
                        <li><i class="bi bi-dice-5"></i> <strong>La Roulette:</strong> Non sai cosa cucinare? Applica i tuoi filtri preferiti (es. Categoria "Torte") e premi <strong>"Sorprendimi"</strong> per farti pescare una ricetta a caso dal sistema.</li>
                    </ul>
        `;

        if (isAdmin) {
            html += `
                    <h4 class="fw-bold text-primary mt-5 border-bottom pb-2">2. <i class="bi bi-plus-circle-fill"></i> Creare e Modificare Ricette</h4>
                    <p>Hai i permessi per alterare le ricette. Ecco le funzioni principali:</p>
                    <ul>
                        <li><strong>Drag & Drop:</strong> Tieni premuto il simbolo <code>⋮⋮</code> a sinistra di ingredienti e procedimenti per riordinarli liberamente. I numeri dei passaggi si calcoleranno da soli.</li>
                        <li><strong>Sezioni <i class="bi bi-folder-plus me-1"></i>:</strong> Usa l'apposito tasto per creare intestazioni (es. "Per la Base", "Per la Crema") sia negli ingredienti che nei passaggi.</li>
                        <li><strong>Distinte Base (Sottoricette):</strong> Cerca una ricetta "Base" e inserisci il moltiplicatore (es. 0.5 per mezza dose). Verrà esplosa in automatico nel ricalcolo.</li>
                    </ul>
            `;
        }

        html += `
                    <h4 class="fw-bold text-primary mt-5 border-bottom pb-2">${isAdmin ? '3' : '2'}. ⚖️ Ricalcolo e Calcolatore Teglie</h4>
                    <p>Entrando in una ricetta, troverai le <strong>Porzioni da produrre</strong>. Usa i tasti <strong>−</strong> e <strong>+</strong> per calcolare all'istante le nuove grammature per la tua produzione.</p>
                    <p><strong>Novità:</strong> Cliccando su <strong>"📐 Adatta a una nuova teglia"</strong>, potrai inserire la forma e la grandezza della teglia originale e di quella che intendi usare tu. Il sistema calcolerà la proporzione esatta di area e aggiornerà l'intera ricetta da solo!</p>

                    <h4 class="fw-bold text-primary mt-5 border-bottom pb-2">${isAdmin ? '4' : '3'}. 🧑‍🍳 Modalità Cucina (Mani in pasta)</h4>
                    <p>Premi il pulsante giallo <strong>"🧑‍🍳 Cucina"</strong>: lo schermo diventerà nero e <strong>non si spegnerà mai</strong> da solo. A sinistra avrai gli ingredienti calcolati, a destra il procedimento. Fai tap sui passaggi che completi per barrarli e non perdere il segno.</p>
        `;

        if (isAdmin) {
            html += `
                    <h4 class="fw-bold text-primary mt-5 border-bottom pb-2">5. <i class="bi bi-cart-fill"></i> Spesa e <i class="bi bi-calendar-event-fill"></i> Calendario</h4>
                    <p>Essendo Amministratore, hai le chiavi per gestire la produzione:</p>
                    <ul>
                        <li><strong>Spesa:</strong> Aggiungi ricette al carrello; gli ingredienti verranno raggruppati e sommati. Con il bottone <strong>"Invia su WA"</strong> puoi formattare automaticamente il carrello in un messaggio Whatsapp pulito ed elegante!</li>
                        <li><strong>Calendario:</strong> Tieni traccia delle produzioni giornaliere, aggiungendo anche delle "Note" che si incolleranno in automatico alla storia della ricetta.</li>
                    </ul>

                    <h4 class="fw-bold text-primary mt-5 border-bottom pb-2">6. <i class="bi bi-gear"></i> Impostazioni e Backup</h4>
                    <p>Puoi gestire il dizionario degli ingredienti consentiti per mantenere i dati puliti. Se l'applicazione dovesse sembrare "bloccata" o non aggiornata, ricorda di premere <strong>Ctrl + F5</strong> sulla tastiera per svuotare la cache del browser.</p>
            `;
        } else {
            html += `
                    <h4 class="fw-bold text-primary mt-5 border-bottom pb-2">4. <i class="bi bi-gear"></i> Preferenze grafiche</h4>
                    <p>Nel menu impostazioni puoi scegliere il tema (Chiaro/Scuro) o l'impostazione predefinita per l'avvio della galleria, adattando l'app alle tue esigenze visive.</p>
            `;
        }

        html += `
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    },

    renderInserimento: function () {
        this.container.innerHTML = `
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 border-bottom pb-3">
                <h2 id="titolo-inserimento" class="mb-3 mb-md-0 fw-bold">Nuova ricetta</h2>
                <div class="d-flex align-items-center gap-2 flex-wrap">
                    <button type="button" class="btn btn-outline-primary shadow-sm fw-bold" id="btn-toggle-import"><i class="bi bi-download"></i> Importa da Testo / TXT</button>
                    <button type="button" class="btn btn-outline-danger shadow-sm fw-bold d-none" id="btn-elimina-ricetta-form"><i class="bi bi-trash"></i> Elimina</button>
                    <button type="submit" form="form-ricetta" class="btn btn-success shadow-sm fw-bold" id="btn-salva-ricetta-top"><i class="bi bi-floppy2-fill"></i> Salva ricetta</button>
                </div>
            </div>
            
            <div class="card mb-4 shadow-sm border-primary d-none" id="panel-import-rapido">
                <div class="card-body bg-light">
                    <h5 class="fw-bold text-primary mb-3">Importazione rapida</h5>
                    <textarea class="form-control mb-3 shadow-sm" id="testo-import-rapido" rows="6" placeholder="Incolla qui il testo elaborato..."></textarea>
                    <div class="d-flex gap-2 align-items-center flex-wrap">
                        <button type="button" class="btn btn-primary fw-bold shadow-sm" id="btn-analizza-testo"><i class="bi bi-pen"></i> Invia e compila form</button>
                        <span class="text-muted fw-bold mx-2">OPPURE</span>
                        <input type="file" id="input-import-txt" accept=".txt" class="d-none">
                        <button type="button" class="btn btn-outline-dark fw-bold shadow-sm" id="btn-import-file"><i class="bi bi-file-earmark-text"></i> Importa da file TXT</button>
                    </div>
                </div>
            </div>
            
            <form id="form-ricetta">
                <div class="card mb-4 shadow-sm border-0">
                    <div class="card-header bg-dark text-white p-3 d-flex justify-content-between align-items-center" style="cursor: pointer;" data-bs-toggle="collapse" data-bs-target="#collapse-dati">
                        <h4 class="mb-0 fw-bold">Dati generali e tag</h4>
                        <span class="fs-5">▼</span>
                    </div>
                    <div id="collapse-dati" class="collapse show">
                        <div class="card-body bg-white pt-4">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-bold text-dark">Nome ricetta *</label>
                                    <input type="text" id="ricetta-nome" class="form-control" required>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <label class="form-label fw-bold text-dark">Categoria</label>
                                    <select id="ricetta-categoria" class="form-select"><option value="">Seleziona...</option></select>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <label class="form-label fw-bold text-dark">Immagine</label>
                                    <input type="file" id="ricetta-immagine" class="form-control" accept="image/png, image/jpeg, image/webp">
                                </div>
                                
                                <div class="col-md-3 mb-3">
                                    <label class="form-label fw-bold text-dark">Porzioni base *</label>
                                    <div class="stepper-group shadow-sm">
                                        <button type="button" class="stepper-btn" tabindex="-1" onclick="this.nextElementSibling.stepDown(); this.nextElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">−</button>
                                        <input type="number" step="0.1" id="ricetta-porzioni" class="form-control stepper-input" value="1" required>
                                        <button type="button" class="stepper-btn" tabindex="-1" onclick="this.previousElementSibling.stepUp(); this.previousElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">+</button>
                                    </div>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <label class="form-label fw-bold text-dark">Unità (es. persone)</label>
                                    <input type="text" id="ricetta-unita" class="form-control">
                                </div>
                                <div class="col-md-3 mb-3">
                                    <label class="form-label fw-bold text-dark">Riposo (ore)</label>
                                    <div class="stepper-group shadow-sm">
                                        <button type="button" class="stepper-btn" tabindex="-1" onclick="this.nextElementSibling.stepDown(); this.nextElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">−</button>
                                        <input type="number" step="0.1" id="ricetta-riposo" class="form-control stepper-input" value="0">
                                        <button type="button" class="stepper-btn" tabindex="-1" onclick="this.previousElementSibling.stepUp(); this.previousElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">+</button>
                                    </div>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <label class="form-label fw-bold text-dark">Cottura (min)</label>
                                    <div class="stepper-group shadow-sm">
                                        <button type="button" class="stepper-btn" tabindex="-1" onclick="this.nextElementSibling.stepDown(); this.nextElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">−</button>
                                        <input type="number" step="1" id="ricetta-cottura" class="form-control stepper-input" value="0">
                                        <button type="button" class="stepper-btn" tabindex="-1" onclick="this.previousElementSibling.stepUp(); this.previousElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">+</button>
                                    </div>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-bold text-dark">Tags</label>
                                    <div id="container-tags" class="border rounded p-2 bg-light" style="max-height: 200px; overflow-y: auto;"></div>
                                </div>
                                <div class="col-md-3 mb-3">
                                    <label class="form-label fw-bold text-dark">Fonte</label>
                                    <input type="text" id="ricetta-fonte" class="form-control">
                                </div>
                                <div class="col-md-3 mb-3">
                                    <label class="form-label fw-bold text-dark">Link fonte</label>
                                    <input type="url" id="ricetta-link" class="form-control">
                                </div>
                                <div class="col-12 mb-3">
                                    <label class="form-label fw-bold text-dark">Note</label>
                                    <textarea id="ricetta-note" class="form-control" rows="2"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card mb-4 shadow-sm border-0">
                    <div class="card-header bg-success text-white p-3 d-flex justify-content-between align-items-center" style="cursor: pointer;" data-bs-toggle="collapse" data-bs-target="#collapse-ingredienti">
                        <h4 class="mb-0 fw-bold">Ingredienti</h4>
                        <span class="fs-5">▼</span>
                    </div>
                    <div id="collapse-ingredienti" class="collapse show">
                        <div class="card-body bg-white pt-4">
                            
                            <div class="mb-4 bg-light p-3 rounded border border-success border-opacity-25 shadow-sm">
                                <label class="form-label fw-bold text-success mb-2"><i class="bi bi-search"></i> Cerca e aggiungi ingrediente</label>
                                <input type="text" id="ricerca-ingrediente" class="form-control shadow-sm border-success" placeholder="Inizia a digitare (es. Farina...) e premi Invio" autocomplete="off">
                                <div id="suggerimenti-ingredienti" class="d-flex flex-wrap gap-2 mt-3"></div>
                            </div>

                            <div class="row fw-bold text-muted small mb-2 d-none d-md-flex">
                                <div class="col-md-5">Nome ingrediente</div><div class="col-md-3">Quantità</div><div class="col-md-3">Unità di misura</div>
                            </div>
                            
                            <div id="container-ingredienti"></div>
                            
                            <div class="d-flex gap-2 mt-3">
                                <button type="button" class="btn btn-sm btn-outline-info fw-bold shadow-sm" id="btn-add-sezione-ing"><i class="bi bi-folder-plus me-1"></i> Aggiungi Sezione</button>
                                <button type="button" class="btn btn-sm btn-outline-secondary fw-bold shadow-sm d-none" id="btn-add-ingrediente"><i class="bi bi-plus-circle-fill"></i> Aggiungi riga manuale</button>
                            </div>
                        </div>
                    </div>
                </div>
                

                <div class="card mb-4 shadow-sm border-0">
                    <div class="card-header bg-primary text-white p-3 d-flex justify-content-between align-items-center" style="cursor: pointer;" data-bs-toggle="collapse" data-bs-target="#collapse-procedimento">
                        <h4 class="mb-0 fw-bold">Procedimento</h4>
                        <span class="fs-5">▼</span>
                    </div>
                    <div id="collapse-procedimento" class="collapse show">
                        <div class="card-body bg-white pt-4">
                            <div id="container-procedimento"></div>
<div class="d-flex gap-2 mt-3">
                                <button type="button" class="btn btn-sm btn-outline-info fw-bold shadow-sm" id="btn-add-sezione-step"><i class="bi bi-folder-plus me-1"></i> Aggiungi Sezione</button>
                                <button type="button" class="btn btn-sm btn-outline-secondary fw-bold shadow-sm" id="btn-add-step"><i class="bi bi-plus-circle-fill"></i> Aggiungi passaggio</button>
                            </div>                        </div>
                    </div>
                </div>

                <div class="card mb-4 shadow-sm border-0">
                    <div class="card-header bg-warning text-dark p-3 d-flex justify-content-between align-items-center" style="cursor: pointer;" data-bs-toggle="collapse" data-bs-target="#collapse-sottoricette">
                        <h4 class="mb-0 fw-bold">Sottoricette (opzionali)</h4>
                        <span class="fs-5">▼</span>
                    </div>
                    <div id="collapse-sottoricette" class="collapse show">
                        <div class="card-body bg-white pt-4">
                            <p class="small text-muted mb-3">Includi altre ricette indicando il moltiplicatore (es. 0.5 per mezza dose).</p>
                            
                            <div class="mb-4 bg-light p-3 rounded border border-warning border-opacity-25 shadow-sm">
                                <label class="form-label fw-bold text-dark mb-2"><i class="bi bi-search"></i> Cerca e aggiungi sottoricetta</label>
                                <input type="text" id="ricerca-sottoricetta" class="form-control shadow-sm border-warning" placeholder="Inizia a digitare (es. Crema...) e clicca sul suggerimento" autocomplete="off">
                                <div id="suggerimenti-sottoricette" class="d-flex flex-wrap gap-2 mt-3"></div>
                            </div>

                            <div id="container-sottoricette"></div>
                            
                        </div>
                    </div>
                </div>
                <div class="modal fade" id="modal-ingrediente" tabindex="-1" aria-hidden="true">
              <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg">
                  <div class="modal-header bg-warning text-dark border-0">
                    <h5 class="modal-title fw-bold"><i class="bi bi-exclamation-triangle-fill"></i> Ingrediente non in elenco</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body p-4">
                    <p class="fs-5">L'ingrediente <strong id="modal-ing-nome" class="text-primary"></strong> non è nel dizionario.</p>
                    <p class="text-muted mb-4">Come vuoi procedere?</p>
                    
                    <div class="d-grid gap-3">
                      <button type="button" class="btn btn-outline-primary fw-bold text-start p-3" id="btn-opt-locale">
                        <i class="bi bi-file-earmark-plus"></i> Inseriscilo SOLO in questa ricetta
                      </button>
                      
                      <div class="card border-success shadow-sm">
                        <button type="button" class="btn btn-success fw-bold text-start p-3 border-0" data-bs-toggle="collapse" data-bs-target="#collapse-add-diz">
                          <i class="bi bi-plus-circle-fill"></i> Aggiungilo al dizionario (Consigliato)
                        </button>
                        <div class="collapse" id="collapse-add-diz">
                          <div class="card-body bg-light">
                            <label class="form-label fw-bold small">Unità ammesse (es. g, ml, pz)</label>
                            <div class="input-group">
                              <input type="text" id="modal-ing-unita" class="form-control" value="g, ml, q.b.">
                              <button type="button" class="btn btn-success fw-bold" id="btn-opt-salva-diz">Salva e Inserisci</button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button type="button" class="btn btn-light fw-bold text-start p-3 border" data-bs-dismiss="modal">
                        <i class="bi bi-x-circle-fill"></i> Annulla (ho sbagliato a scrivere)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </form>
        `;
    },

    renderListaCategorie: function (categorie) {
        const lista = document.getElementById('lista-categorie');
        if (!lista) return;
        lista.innerHTML = categorie.length === 0 ? '<li class="list-group-item">Nessuna.</li>' : '';
        categorie.forEach(cat => lista.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center">${cat.nome}<button class="btn btn-sm btn-outline-danger btn-delete-categoria" data-id="${cat.id}">X</button></li>`);
    },

    renderListaTag: function (tags) {
        const lista = document.getElementById('lista-tag');
        if (!lista) return;
        lista.innerHTML = tags.length === 0 ? '<li class="list-group-item">Nessuno.</li>' : '';
        tags.forEach(tag => lista.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center">${tag.nome}<button class="btn btn-sm btn-outline-danger btn-delete-tag" data-id="${tag.id}">X</button></li>`);
    },

    renderListaIngredientiDizionario: function (ingredienti) {
        const lista = document.getElementById('lista-ingredienti-diz');
        if (!lista) return;
        lista.innerHTML = ingredienti.length === 0 ? '<li class="list-group-item text-muted">Nessun ingrediente inserito.</li>' : '';
        ingredienti.forEach(ing => lista.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center"><span><strong>${ing.nome}</strong> <span class="text-muted small ms-2">(Unità ammesse: ${ing.unita_misura})</span></span><button class="btn btn-sm btn-outline-danger btn-delete-ingrediente-diz" data-id="${ing.id}">✖</button></li>`);
    },

    getIngredienteRowHTML: function (opzioniHtml = '<option value="">Caricamento...</option>') {
        return `
            <div class="row mb-2 riga-ingrediente align-items-end mt-2">
                <div class="col-md-5 mb-2 mb-md-0 d-flex align-items-center gap-2">
                    <span class="drag-handle text-muted" style="cursor: grab; font-size: 1.5rem; line-height: 1;" title="Trascina">⋮⋮</span>
                    <select class="form-select ing-nome" required>
                        ${opzioniHtml}
                    </select>
                </div>
                <div class="col-md-3 mb-2 mb-md-0">
                    <div class="stepper-group shadow-sm">
                        <button type="button" class="stepper-btn" tabindex="-1" onclick="this.nextElementSibling.stepDown(); this.nextElementSibling.dispatchEvent(new Event('change', {bubbles: true}))">−</button>
                        <input type="number" step="0.1" class="form-control stepper-input ing-qta" required>
                        <button type="button" class="stepper-btn" tabindex="-1" onclick="this.previousElementSibling.stepUp(); this.previousElementSibling.dispatchEvent(new Event('change', {bubbles: true}))">+</button>
                    </div>
                </div>
                <div class="col-md-3 mb-2 mb-md-0">
                    <select class="form-select ing-unita" required>
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="pz">pz</option>
                        <option value="q.b.">q.b.</option>
                    </select>
                </div>
                <div class="col-md-1 text-end">
                    <button type="button" class="btn btn-outline-danger btn-remove-row" tabindex="-1">✖</button>
                </div>
            </div>
        `;
    },

    getSezioneRowHTML: function () {
        return `
            <div class="row align-items-center mb-2 riga-sezione-ing mt-3">
                <div class="col-md-10 mb-2 mb-md-0 d-flex align-items-center gap-2">
                    <span class="drag-handle text-muted" style="cursor: grab; font-size: 1.5rem; line-height: 1;" title="Trascina">⋮⋮</span>
                    <input type="text" class="form-control fw-bold bg-light text-primary titolo-sezione border-info" placeholder="Es. Per la Base Sacher..." required>
                </div>
                <div class="col-md-2 text-end">
                    <button type="button" class="btn btn-outline-danger btn-sm btn-remove-row" tabindex="-1" title="Elimina">✖</button>
                </div>
            </div>
        `;
    },

    getSottoricettaRowHTML: function (nomeRicetta = '', resaBase = '') {
        return `
            <div class="row mb-2 riga-sottoricetta align-items-start mt-2">
                <div class="col-md-7 mb-2 mb-md-0">
                    <input type="text" class="form-control sr-nome fw-bold bg-light" value="${nomeRicetta}" readonly required>
                    <small class="text-muted sr-hint d-block mt-1 ps-1" style="font-size: 0.85em; min-height: 1.2em;"><strong>Resa Base:</strong> ${resaBase}</small>
                </div>
                <div class="col-md-4 mb-2 mb-md-0">
                    <div class="stepper-group shadow-sm">
                        <span class="bg-light text-muted small px-2 border-end d-flex align-items-center">Moltiplicatore</span>
                        <button type="button" class="stepper-btn px-2" tabindex="-1" onclick="this.nextElementSibling.stepDown(); this.nextElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">−</button>
                        <input type="number" step="0.01" class="form-control stepper-input sr-moltiplicatore px-0" value="1" required>
                        <button type="button" class="stepper-btn px-2" tabindex="-1" onclick="this.previousElementSibling.stepUp(); this.previousElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">+</button>
                    </div>
                    <small class="text-primary sr-calc-hint d-block mt-1 text-center fw-bold" style="font-size: 0.85em; min-height: 1.2em;"></small>
                </div>
                <div class="col-md-1 text-end">
                    <button type="button" class="btn btn-outline-danger btn-remove-row" tabindex="-1">✖</button>
                </div>
            </div>
        `;
    },

    getStepRowHTML: function () {
        return `
            <div class="row mb-3 riga-step align-items-start mt-2">
                <div class="col-md-11 mb-2 mb-md-0 d-flex gap-2 align-items-start">
                    <span class="drag-handle-step text-muted mt-2" style="cursor: grab; font-size: 1.5rem; line-height: 1;" title="Trascina">⋮⋮</span>
                    <div class="input-group shadow-sm">
                        <span class="input-group-text bg-light text-muted fw-bold step-numero">1</span>
                        <textarea class="form-control step-desc" rows="2" placeholder="Descrivi il passaggio..." required></textarea>
                    </div>
                </div>
                <div class="col-md-1 text-end mt-1">
                    <button type="button" class="btn btn-outline-danger btn-remove-row" tabindex="-1">✖</button>
                </div>
            </div>
        `;
    },

    getSezioneStepRowHTML: function () {
        return `
            <div class="row align-items-center mb-3 riga-sezione-step mt-4">
                <div class="col-md-11 mb-2 mb-md-0 d-flex align-items-center gap-2">
                    <span class="drag-handle-step text-muted" style="cursor: grab; font-size: 1.5rem; line-height: 1;" title="Trascina">⋮⋮</span>
                    <input type="text" class="form-control fw-bold bg-light text-primary titolo-sezione-step border-info" placeholder="Es. Preparazione della Base..." required>
                </div>
                <div class="col-md-1 text-end">
                    <button type="button" class="btn btn-outline-danger btn-sm btn-remove-row" tabindex="-1" title="Elimina">✖</button>
                </div>
            </div>
        `;
    },



    renderDettaglio: function (ricetta) {
        const catNome = ricetta.categorie ? ricetta.categorie.nome : 'Senza categoria';
        const imgUrl = ricetta.url_immagine || 'https://placehold.co/800x400?text=Nessuna+Immagine'; const tagsHTML = ricetta.ricette_tags.map(rt => `<span class="badge bg-secondary me-1">${rt.tag.nome}</span>`).join('');

        // Costruiamo la lista degli Step del procedimento
        let stepHTML = '';
        let stepCount = 1; // Contatore manuale per ignorare le sezioni
        if (ricetta.procedimento) {
            ricetta.procedimento.forEach(step => {
                const testo = step.descrizione || '';
                if (testo.startsWith('---') && testo.endsWith('---')) {
                    stepHTML += `<h5 class="mt-4 mb-2 text-primary fw-bold border-bottom border-primary pb-1"><i class="bi bi-folder-plus me-1"></i> ${testo.replace(/---/g, '').trim()}</h5>`;
                } else {
                    // Allineamento centrato, pallino più elegante e rientranze corrette
                    stepHTML += `
                        <div class="d-flex mb-3 align-items-center">
                            <div class="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-3 flex-shrink-0 shadow-sm" style="width: 30px; height: 30px; font-weight: bold; font-size: 0.95rem;">
                                ${stepCount++}
                            </div>
                            <div class="bg-light py-2 px-3 rounded flex-grow-1 shadow-sm border" style="white-space: pre-line; line-height: 1.5; margin: 0;">${testo.trim()}</div>
                        </div>
                    `;
                }
            });
        }

        this.container.innerHTML = `
            <div class="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 d-print-none">
                <button class="btn btn-outline-secondary btn-sm shadow-sm" id="btn-torna-elenco">← Torna alla Galleria</button>
                
                <div class="d-flex flex-wrap gap-2">
                    <button class="btn btn-warning btn-sm shadow-sm fw-bold" id="btn-cucina-ricetta">
                        <i class="bi bi-egg-fried"></i> Cucina
                    </button>
                    <button class="btn btn-outline-success btn-sm shadow-sm" id="btn-stampa-ricetta">
                        <i class="bi bi-printer-fill"></i> Stampa
                    </button>
                    <button class="btn btn-outline-primary btn-sm shadow-sm" id="btn-modifica-ricetta" data-id="${ricetta.id}">
                        <i class="bi bi-pen"></i> Modifica
                    </button>
                    <button class="btn btn-outline-danger btn-sm shadow-sm" id="btn-elimina-ricetta" data-id="${ricetta.id}" data-img="${ricetta.url_immagine || ''}">
                        🗑 Elimina
                    </button>
                </div>
            </div>

            <div class="card shadow-sm border-0 mb-4">
                <img src="${imgUrl}" class="card-img-top" alt="${ricetta.nome}" style="max-height: 400px; object-fit: cover;">
                <div class="card-body">
                    <h1 class="fw-bold display-5 mb-1">${ricetta.nome}</h1>
                    <h5 class="text-muted mb-3">${catNome}</h5>
                    <div class="mb-4">${tagsHTML}</div>
                    
                    <div class="row text-center mb-4 bg-light rounded py-3 mx-0 shadow-sm">
                        <div class="col-4 border-end">
                            <small class="text-muted d-block">Riposo</small>
                            <span class="fw-bold fs-5">${ricetta.tempo_riposo_ore} h</span>
                        </div>
                        <div class="col-4 border-end">
                            <small class="text-muted d-block">Cottura</small>
                            <span class="fw-bold fs-5">${ricetta.tempo_cottura_min} min</span>
                        </div>
                        <div class="col-4">
                            <small class="text-muted d-block">Resa base</small>
                            <span class="fw-bold fs-5">${ricetta.porzioni_base} ${ricetta.unita_porzioni}</span>
                        </div>
                    </div>

                    ${ricetta.note ? `<div class="alert alert-info border-0 shadow-sm mb-0" style="white-space: pre-wrap;"><strong>Note:</strong><br>${ricetta.note}</div>` : ''}                </div>
            </div>

            <div class="row align-items-start">
                
                <div class="col-lg-8 mb-4">
                    <div class="card shadow-sm border-0">
                        <div class="card-body">
                            <h3 class="fw-bold mb-4 border-bottom pb-2">Procedimento</h3>
                            ${stepHTML || '<p class="text-muted">Nessun procedimento inserito.</p>'}
                        </div>
                    </div>
                </div>

                <div class="col-lg-4 mb-4">
                    <div class="card shadow-sm border-primary sticky-top" style="top: 20px; z-index: 1;">
                        <div class="card-header bg-primary text-white text-center">
                            <span class="fw-bold fs-5">INGREDIENTI</span>
                        </div>
                        <div class="card-body bg-light">
                            <label class="form-label fw-bold">Porzioni da produrre (${ricetta.unita_porzioni}):</label>
                            
                            <div class="stepper-group mb-2 shadow-sm" style="height: 55px;">
                                <button type="button" class="stepper-btn fs-3 px-4" tabindex="-1" onclick="this.nextElementSibling.stepDown(); this.nextElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">−</button>
                                <input type="number" step="0.1" class="form-control stepper-input text-primary fs-4" id="input-ricalcolo" value="${ricetta.porzioni_base}" data-base="${ricetta.porzioni_base}">
                                <button type="button" class="stepper-btn fs-3 px-4" tabindex="-1" onclick="this.previousElementSibling.stepUp(); this.previousElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">+</button>
                            </div>

                            <button class="btn btn-outline-info btn-sm w-100 fw-bold shadow-sm mb-4" data-bs-toggle="modal" data-bs-target="#modal-calcolatore-teglie">
                                <i class="bi bi-calculator"></i> Adatta a una nuova teglia
                            </button>

                            <ul class="list-group list-group-flush shadow-sm" id="lista-ingredienti-ricalcolati">
                            </ul>
                            
                            <div id="container-sottoricette-ricalcolate">
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderCalendario: function () {
        this.container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2><i class="bi bi-calendar-check"></i> Storico di produzione</h2>
                <button class="btn btn-success fw-bold shadow-sm" id="btn-nuova-produzione">
                    <i class="bi bi-plus-circle-fill"></i> Registra produzione
                </button>
            </div>

            <div class="row mb-4" id="dashboard-statistiche">
                <div class="col-12 text-center text-muted">Calcolo statistiche in corso...</div>
            </div>

            <div class="card shadow border-success mb-4 d-none" id="form-produzione-container">
                <div class="card-header bg-success text-white fw-bold">
                    Nuova registrazione svolgimento
                </div>
                <div class="card-body bg-light">
                    <form id="form-produzione">
                        <div class="row g-3">
                            <div class="col-md-7">
                                <label class="form-label fw-bold"><i class="bi bi-search"></i> Cerca Ricetta Prodotta</label>
                                <input type="text" id="ricerca-prod-ricetta" class="form-control border-success shadow-sm" placeholder="Inizia a digitare (es. Crema...)" autocomplete="off">
                                <div id="suggerimenti-prod-ricetta" class="d-flex flex-wrap gap-2 mt-2"></div>
                                <input type="hidden" id="prod-ricetta-id" required>
                            </div>
                            <div class="col-md-5">
                                <label class="form-label fw-bold">Data di Svolgimento</label>
                                <input type="date" class="form-control shadow-sm" id="prod-data" required>
                            </div>
                        </div>

                        <div id="prod-dettagli-dinamici" class="mt-4"></div>

                        <div class="mt-4 text-end">
                            <button type="button" class="btn btn-outline-secondary me-2" id="btn-annulla-produzione">Annulla</button>
                            <button type="submit" class="btn btn-success fw-bold">Salva nel Calendario</button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="card shadow-sm">
                <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
                    <h5 class="mb-0 fw-bold text-dark">Registro eventi</h5>
                    <div class="btn-group shadow-sm" role="group">
                        <button type="button" class="btn btn-outline-dark active" id="btn-view-lista" title="Vista Diario">
                            <i class="bi bi-list"></i> Diario
                        </button>
                        <button type="button" class="btn btn-outline-dark" id="btn-view-griglia" title="Vista Calendario Mensile">
                            <i class="bi bi-calendar-week"></i> Calendario
                        </button>
                    </div>
                </div>
                <div class="card-body" id="calendario-view-container">
                    </div>
            </div>
        `;
    },

    renderSpesa: function () {
        this.container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4 gap-2 flex-wrap">
                <h2 class="mb-0"><i class="bi bi-cart-fill"></i> Lista della spesa</h2>
                <div class="d-flex gap-2">
                    <button class="btn btn-success btn-sm shadow-sm fw-bold text-white d-flex align-items-center" id="btn-condividi-whatsapp">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="me-2" viewBox="0 0 16 16"><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.49.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/></svg>
                        Invia su WA
                    </button>
                    <button class="btn btn-outline-danger btn-sm shadow-sm" id="btn-svuota-spesa">🗑 Svuota tutto</button>
                </div>
            </div>

            <div class="row">
                <div class="col-md-5 mb-4">
                    <div class="card shadow-sm border-primary mb-4">
                        <div class="card-header bg-primary text-white fw-bold py-2">
                            Aggiungi al carrello
                        </div>
                        <div class="card-body bg-light">
                            <label class="form-label small fw-bold text-muted"><i class="bi bi-search"></i> Cerca Ricetta:</label>
                            <input type="text" id="ricerca-spesa-ricetta" class="form-control mb-3 shadow-sm border-primary" placeholder="Inizia a digitare..." autocomplete="off">
                            <div id="suggerimenti-spesa-ricetta" class="d-flex flex-wrap gap-2 mb-3"></div>
                            <input type="hidden" id="spesa-ricetta-id">
                            
                            <label class="form-label small fw-bold text-muted">Porzioni da preparare:</label>
                            <div class="stepper-group mb-3 shadow-sm">
                                <button type="button" class="stepper-btn" tabindex="-1" onclick="this.nextElementSibling.stepDown(); this.nextElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">−</button>
                                <input type="number" step="0.1" class="form-control stepper-input" id="spesa-input-porzioni">
                                <button type="button" class="stepper-btn" tabindex="-1" onclick="this.previousElementSibling.stepUp(); this.previousElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">+</button>
                            </div>
                            
                            <button class="btn btn-primary w-100 fw-bold shadow-sm" id="btn-aggiungi-spesa" disabled>
                                <i class="bi bi-cart-plus-fill"></i> Aggiungi alla spesa
                            </button>
                        </div>
                    </div>

                    <h5 class="fw-bold mb-3">Ricette in programma:</h5>
                    <ul class="list-group shadow-sm" id="lista-ricette-spesa">
                        <li class="list-group-item text-muted small">Nessuna ricetta selezionata.</li>
                    </ul>
                </div>

                <div class="col-md-7 mb-4">
                    <div class="card shadow border-success">
                        <div class="card-header bg-success text-white fw-bold py-3">
                            Checklist ingredienti
                        </div>
                        <div class="card-body p-0">
                            <ul class="list-group list-group-flush" id="lista-spesa-aggregata">
                                <li class="list-group-item text-muted p-4 text-center">Aggiungi delle ricette per generare la spesa.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};