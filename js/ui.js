// js/ui.js

const UI = {
    container: document.getElementById('app-content'),

    renderElenco: function () {
        this.container.innerHTML = `
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <h2 class="mb-0 fw-bold">📚 Galleria ricette</h2>
                <button class="btn btn-primary shadow-sm fw-bold" id="btn-nuova-ricetta-elenco">
                    ➕ Crea nuova ricetta
                </button>
            </div>
            
            <div class="card mb-4 shadow-sm border-0 bg-white">
                <div class="card-body row g-3 align-items-center">
                    <div class="col-md-3">
                        <input type="text" id="filtro-testo" class="form-control" placeholder="🔍 Cerca per nome...">
                    </div>
                    <div class="col-md-3">
                        <select id="filtro-categoria" class="form-select">
                            <option value="">Tutte le categorie</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select id="filtro-tag" class="form-select">
                            <option value="">Tutti i tag</option>
                        </select>
                    </div>
                    
                    <div class="col-md-4 d-flex align-items-center justify-content-md-end justify-content-between gap-3">
                        
                        <div class="form-check form-switch m-0 d-flex align-items-center" title="Attiva/disattiva vista a cassetti">
                            <input class="form-check-input shadow-sm m-0" type="checkbox" id="toggle-raggruppa" checked style="cursor: pointer; transform: scale(1.3);">
                            <label class="form-check-label small fw-bold text-muted ms-2" for="toggle-raggruppa" style="cursor: pointer; padding-top: 2px;">Categorie</label>
                        </div>

                        <div class="btn-group shadow-sm" role="group">
                            <button type="button" class="btn btn-outline-dark active" id="btn-view-grid" title="Vista a card">
                                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M1 1h4v4H1V1zm5 0h4v4H6V1zm5 0h4v4h-4V1zM1 6h4v4H1V6zm5 0h4v4H6V6zm5 0h4v4h-4V6zM1 11h4v4H1v-4zm5 0h4v4H6v-4zm5 0h4v4h-4v-4z"/></svg>
                            </button>
                            <button type="button" class="btn btn-outline-dark" id="btn-view-list" title="Vista ad elenco">
                                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg>
                            </button>
                            <button type="button" class="btn btn-outline-dark" id="btn-view-compact" title="Vista compatta">
                                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                    <circle cx="8" cy="3" r="1.5"/>
                                    <circle cx="8" cy="8" r="1.5"/>
                                    <circle cx="8" cy="13" r="1.5"/>
                                </svg>
                            </button>
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
                const imgUrl = r.url_immagine || 'https://via.placeholder.com/400x300?text=Nessuna+Immagine';

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
                const imgUrl = r.url_immagine || 'https://via.placeholder.com/400x300?text=Nessuna+Immagine';

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
                <h2 class="mb-0 fw-bold">⚙️ Impostazioni sistema</h2>
                <button class="btn btn-info shadow-sm fw-bold text-white mt-3 mt-md-0 px-4 py-2" id="btn-apri-manuale" style="background-color: #17a2b8; border: none;">
                    📖 Leggi il Manuale d'Uso
                </button>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-4">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-dark text-white fw-bold p-3">🎨 Preferenze grafiche</div>
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

                <div class="col-md-6 mb-4">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-primary text-white fw-bold p-3">🏷️ Categorie e Tag</div>
                        <div class="card-body bg-white p-4">
                            <div class="mb-4">
                                <label class="form-label fw-bold text-primary">Categorie</label>
                                <div class="input-group shadow-sm mb-2"><input type="text" id="input-categoria" class="form-control"><button class="btn btn-primary fw-bold" id="btn-add-categoria">+</button></div>
                                <ul class="list-group shadow-sm" id="lista-categorie" style="max-height: 120px; overflow-y: auto;"></ul>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold text-secondary">Tag</label>
                                <div class="input-group shadow-sm mb-2"><input type="text" id="input-tag" class="form-control"><button class="btn btn-secondary fw-bold text-white" id="btn-add-tag">+</button></div>
                                <ul class="list-group shadow-sm" id="lista-tag" style="max-height: 120px; overflow-y: auto;"></ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-12 mb-5">
                    <div class="card shadow-sm border-warning">
                        <div class="card-header bg-warning text-dark fw-bold p-3">🛒 Dizionario Ingredienti Centrale</div>
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
        this.container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <h2 class="mb-0 fw-bold text-primary">📖 Manuale d'uso</h2>
                <button class="btn btn-outline-secondary shadow-sm fw-bold" id="btn-chiudi-manuale">← Torna alle Impostazioni</button>
            </div>
            
            <div class="card shadow-sm border-0 mb-5">
                <div class="card-body p-4 p-md-5" style="line-height: 1.8; font-size: 1.05rem;">
                    <p class="fs-5 text-muted mb-5">Benvenuto nel tuo nuovo gestionale ricette in cloud. Questo strumento è stato progettato per semplificare e velocizzare il lavoro in laboratorio o in cucina, permettendoti di gestire distinte base complesse, calcolare proporzioni all'istante, pianificare la spesa con il tuo team e tenere traccia delle produzioni giornaliere.</p>

                    <h4 class="fw-bold text-primary mt-4 border-bottom pb-2">1. 🧭 Navigazione e interfaccia</h4>
                    <p>L'applicazione si adatta magicamente al dispositivo che stai usando:</p>
                    <ul>
                        <li><strong>Da Computer:</strong> Troverai un classico e comodo menu di navigazione in alto.</li>
                        <li><strong>Da Smartphone:</strong> Troverai una pratica barra di navigazione fissata in basso da cui potrai scorrere tra le varie sezioni con il pollice.</li>
                    </ul>

                    <h4 class="fw-bold text-primary mt-5 border-bottom pb-2">2. 📚 Galleria ricette</h4>
                    <p>La schermata principale è la tua libreria. Sopra all'elenco troverai il bottone <strong>"➕ Crea nuova ricetta"</strong> e un potente motore di visualizzazione:</p>
                    <ul>
                        <li><strong>Filtri rapidi:</strong> Cerca scrivendo parte del nome, oppure usa le tendine per filtrare per categoria o tag.</li>
                        <li><strong>Interruttore categorie:</strong> Accendilo per raggruppare le ricette in comodi "cassetti" divisi per categoria. Spegnilo per avere un elenco unico e continuo in perfetto ordine alfabetico.</li>
                        <li><strong>Le 3 visualizzazioni:</strong> Griglia a card (ideale su PC), elenco con foto (perfetto su telefono), ed elenco compatto (per scorrere velocemente i titoli).</li>
                    </ul>

                    <h4 class="fw-bold text-primary mt-5 border-bottom pb-2">3. ➕ Creare e modificare una ricetta</h4>
                    <p>Il modulo di creazione è diviso in 4 pratici blocchi. <strong>Puoi cliccare sull'intestazione colorata di ogni blocco per chiuderlo o aprirlo.</strong> I campi obbligatori sono solo due: <em>Nome ricetta</em> e <em>Porzioni base</em>.</p>
                    <ul>
                        <li><strong>Dati generali:</strong> Inserisci nome, categoria, foto, riposo, cottura. Usa i tasti <strong>−</strong> e <strong>+</strong> per i numeri.</li>
                        <li><strong>Ingredienti:</strong> Mentre digiti il nome, il sistema ti suggerirà le parole usate in passato.</li>
                        <li><strong>Procedimento:</strong> L'area di testo si allarga da sola. I numeri degli step si aggiornano automaticamente.</li>
                        <li><strong>Sottoricette (Distinte Base):</strong> Se usi una base già salvata (es. Crema), cercala nella barra intelligente e inserisci il <strong>Moltiplicatore</strong> (es. 0.5 per mezza dose).</li>
                    </ul>

                    <h4 class="fw-bold text-primary mt-5 border-bottom pb-2">4. ⚖️ Ricalcolo istantaneo</h4>
                    <p>Entrando in una ricetta, troverai il riquadro degli Ingredienti. Usa i tasti <strong>−</strong> e <strong>+</strong> nel campo <strong>"Porzioni da produrre"</strong>. Tutti gli ingredienti si aggiorneranno all'istante, inclusi quelli delle eventuali sottoricette che verranno "esplosi".</p>

                    <h4 class="fw-bold text-primary mt-5 border-bottom pb-2">5. 🧑‍🍳 Modalità cucina (mani in pasta)</h4>
                    <p>Devi metterti a impastare? Premi il pulsante giallo <strong>"🧑‍🍳 Cucina"</strong>.</p>
                    <ul>
                        <li>Lo schermo diventerà nero e <strong>rimarrà sempre acceso</strong> (nessun blocco automatico dello schermo).</li>
                        <li>A sinistra avrai la lista ingredienti (ricalcolati), a destra i passaggi in grande.</li>
                        <li>Toccando un passaggio completato, verrà sbarrato per non farti perdere il segno.</li>
                    </ul>

                    <h4 class="fw-bold text-primary mt-5 border-bottom pb-2">6. 🛒 La lista della spesa</h4>
                    <p>La sezione Spesa è <strong>condivisa in tempo reale con tutto il team</strong>.</p>
                    <ul>
                        <li>Seleziona le ricette e le porzioni che vuoi produrre, poi premi "➕ Aggiungi".</li>
                        <li>Il gestionale "esploderà" le ricette e <strong>sommerà tutti gli ingredienti uguali</strong>.</li>
                        <li>Mentre fai la spesa, fai tap sulla spunta per barrare i prodotti messi nel carrello.</li>
                    </ul>

                    <h4 class="fw-bold text-primary mt-5 border-bottom pb-2">7. 📅 Diario e calendario di produzione</h4>
                    <p>Tieni traccia del lavoro quotidiano. Seleziona la ricetta, la data e le porzioni prodotte. La <strong>Dashboard</strong> ti dirà quante preparazioni hai fatto quest'anno e qual è la ricetta "Best Seller". Puoi visualizzare lo storico come Elenco o come Calendario a griglia.</p>

                    <h4 class="fw-bold text-primary mt-5 border-bottom pb-2">8. ⚙️ Setup e impostazioni</h4>
                    <p>Personalizza il gestionale: scegli la visuale predefinita, attiva il tema scuro per rilassare gli occhi, e gestisci le categorie e i tag (il sistema bloccherà in automatico l'inserimento di eventuali doppioni!).</p>
                </div>
            </div>
        `;
    },

    renderInserimento: function () {
        this.container.innerHTML = `
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 border-bottom pb-3">
                <h2 id="titolo-inserimento" class="mb-3 mb-md-0 fw-bold">Nuova ricetta</h2>
                <div class="d-flex align-items-center gap-2 flex-wrap">
                    <input type="file" id="input-import-txt" accept=".txt" class="d-none">
                    <button type="button" class="btn btn-outline-primary shadow-sm fw-bold" id="btn-import-txt">📄 Importa da TXT</button>
                    <button type="button" class="btn btn-outline-danger shadow-sm fw-bold d-none" id="btn-elimina-ricetta-form">🗑 Elimina</button>
                    <button type="submit" form="form-ricetta" class="btn btn-success shadow-sm fw-bold" id="btn-salva-ricetta-top">💾 Salva ricetta</button>
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
                            <div class="row fw-bold text-muted small mb-2 d-none d-md-flex">
                                <div class="col-md-4">Nome ingrediente</div><div class="col-md-4 text-center">Quantità</div><div class="col-md-3">Unità di misura</div>
                            </div>
                            <div id="container-ingredienti"></div>
<div class="d-flex gap-2 mt-3">
    <button type="button" class="btn btn-sm btn-outline-success fw-bold shadow-sm" id="btn-add-ingrediente">➕ Aggiungi ingrediente</button>
    <button type="button" class="btn btn-sm btn-outline-info fw-bold shadow-sm" id="btn-add-sezione-ing">🗂️ Aggiungi Sezione</button>
</div>                        </div>
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
                            <button type="button" class="btn btn-sm btn-outline-primary mt-3 fw-bold shadow-sm" id="btn-add-step">➕ Aggiungi step</button>
                        </div>
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
                            <div id="container-sottoricette"></div>
                            <button type="button" class="btn btn-sm btn-outline-warning text-dark mt-3 fw-bold shadow-sm" id="btn-add-sottoricetta">➕ Aggiungi sottoricetta</button>
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

    getIngredienteRowHTML: function (opzioniIngredientiHtml = '<option value="">Caricamento...</option>') {
        return `
            <div class="row align-items-center mb-2 riga-ingrediente">
                <div class="col-md-5 mb-2 mb-md-0">
                    <select class="form-select ing-nome fw-bold" required>
                        ${opzioniIngredientiHtml}
                    </select>
                </div>
                <div class="col-md-3 mb-2 mb-md-0">
                    <div class="stepper-group shadow-sm">
                        <button type="button" class="stepper-btn px-2" tabindex="-1" onclick="this.nextElementSibling.stepDown(); this.nextElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">−</button>
                        <input type="number" step="0.1" class="form-control stepper-input ing-qta px-0" placeholder="Q.tà" required>
                        <button type="button" class="stepper-btn px-2" tabindex="-1" onclick="this.previousElementSibling.stepUp(); this.previousElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">+</button>
                    </div>
                </div>
                <div class="col-md-2 mb-2 mb-md-0">
                    <select class="form-select ing-unita text-muted bg-light" required>
                        <option value="">-- Unità --</option>
                    </select>
                </div>
                <div class="col-md-2 text-end d-flex justify-content-end gap-1">
                    <button type="button" class="btn btn-outline-secondary btn-sm btn-move-up" tabindex="-1" title="Sposta su">↑</button>
                    <button type="button" class="btn btn-outline-secondary btn-sm btn-move-down" tabindex="-1" title="Sposta giù">↓</button>
                    <button type="button" class="btn btn-outline-danger btn-sm btn-remove-row" tabindex="-1" title="Elimina">✖</button>
                </div>
            </div>
        `;
    },

    getSezioneRowHTML: function () {
        return `
            <div class="row align-items-center mb-2 riga-sezione-ing mt-3">
                <div class="col-md-10 mb-2 mb-md-0">
                    <input type="text" class="form-control fw-bold bg-light text-primary titolo-sezione border-info" placeholder="Es. Per la Base Sacher..." required>
                </div>
                <div class="col-md-2 text-end d-flex justify-content-end gap-1">
                    <button type="button" class="btn btn-outline-secondary btn-sm btn-move-up" tabindex="-1" title="Sposta su">↑</button>
                    <button type="button" class="btn btn-outline-secondary btn-sm btn-move-down" tabindex="-1" title="Sposta giù">↓</button>
                    <button type="button" class="btn btn-outline-danger btn-sm btn-remove-row" tabindex="-1" title="Elimina">✖</button>
                </div>
            </div>
        `;
    },

    getSottoricettaRowHTML: function (opzioniRicetteHtml = '<option value="">Caricamento...</option>') {
        return `
            <div class="row mb-2 riga-sottoricetta align-items-center mt-2">
                <div class="col-md-5 mb-2 mb-md-0">
                    <select class="form-select sr-nome" required>
                        ${opzioniRicetteHtml}
                    </select>
                </div>
                <div class="col-md-5 mb-2 mb-md-0">
                    <div class="stepper-group shadow-sm">
                        <span class="bg-light text-muted small px-2 border-end d-flex align-items-center">Moltiplicatore</span>
                        <button type="button" class="stepper-btn px-2" tabindex="-1" onclick="this.nextElementSibling.stepDown(); this.nextElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">−</button>
                        <input type="number" step="0.01" class="form-control stepper-input sr-moltiplicatore px-0" placeholder="1" required>
                        <button type="button" class="stepper-btn px-2" tabindex="-1" onclick="this.previousElementSibling.stepUp(); this.previousElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">+</button>
                    </div>
                </div>
                <div class="col-md-2 text-end d-flex justify-content-end gap-1">
                    <button type="button" class="btn btn-outline-secondary btn-sm btn-move-up" tabindex="-1" title="Sposta su">↑</button>
                    <button type="button" class="btn btn-outline-secondary btn-sm btn-move-down" tabindex="-1" title="Sposta giù">↓</button>
                    <button type="button" class="btn btn-outline-danger btn-sm btn-remove-row" tabindex="-1" title="Elimina">✖</button>
                </div>
            </div>
        `;
    },

    getStepRowHTML: function () {
        return `
            <div class="row mb-2 riga-step align-items-start mt-3">
                <div class="col-md-1 text-center bg-light border rounded py-2 fw-bold step-number">#</div>
                <div class="col-md-9">
                    <textarea class="form-control step-desc" rows="1" style="overflow-y: hidden; resize: none;" oninput="this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px';" required></textarea>
                </div>
                <div class="col-md-2 text-end d-flex justify-content-end gap-1">
                    <button type="button" class="btn btn-outline-secondary btn-sm btn-move-up" tabindex="-1" title="Sposta su">↑</button>
                    <button type="button" class="btn btn-outline-secondary btn-sm btn-move-down" tabindex="-1" title="Sposta giù">↓</button>
                    <button type="button" class="btn btn-outline-danger btn-sm btn-remove-row" tabindex="-1" title="Elimina">✖</button>
                </div>
            </div>
        `;
    },



    renderDettaglio: function (ricetta) {
        const catNome = ricetta.categorie ? ricetta.categorie.nome : 'Senza categoria';
        const imgUrl = ricetta.url_immagine || 'https://via.placeholder.com/800x400?text=Nessuna+Immagine';
        const tagsHTML = ricetta.ricette_tags.map(rt => `<span class="badge bg-secondary me-1">${rt.tag.nome}</span>`).join('');

        // Costruiamo la lista degli Step del procedimento
        let stepHTML = '';
        ricetta.procedimento.forEach(step => {
            stepHTML += `
                <div class="d-flex mb-3">
                    <div class="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-3 flex-shrink-0" style="width: 35px; height: 35px; font-weight: bold;">
                        ${step.step_num}
                    </div>
                    <div class="bg-light p-3 rounded flex-grow-1 shadow-sm border">
                        ${step.descrizione}
                    </div>
                </div>
            `;
        });

        this.container.innerHTML = `
            <div class="mb-3 d-flex justify-content-between align-items-center d-print-none">
                <button class="btn btn-outline-secondary btn-sm" id="btn-torna-elenco">← Torna alla Galleria</button>
                <div>
                    <button class="btn btn-warning btn-sm shadow-sm me-2 fw-bold" id="btn-cucina-ricetta">
                        🧑‍🍳 Modalità Cucina
                    </button>
                    <button class="btn btn-outline-success btn-sm shadow-sm me-2" id="btn-stampa-ricetta">
                        🖨️ Stampa / PDF
                    </button>
                    <button class="btn btn-outline-primary btn-sm shadow-sm me-2" id="btn-modifica-ricetta" data-id="${ricetta.id}">
                        ✏️ Modifica
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
                            <div class="stepper-group mb-4 shadow-sm" style="height: 55px;">
                                <button type="button" class="stepper-btn fs-3 px-4" tabindex="-1" onclick="this.nextElementSibling.stepDown(); this.nextElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">−</button>
                                <input type="number" step="0.5" class="form-control stepper-input text-primary fs-4" id="input-ricalcolo" value="${ricetta.porzioni_base}">
                                <button type="button" class="stepper-btn fs-3 px-4" tabindex="-1" onclick="this.previousElementSibling.stepUp(); this.previousElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">+</button>
                            </div>

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
                <h2>🗓️ Storico di produzione</h2>
                <button class="btn btn-success fw-bold shadow-sm" id="btn-nuova-produzione">
                    ➕ Registra produzione
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
                            <div class="col-md-6">
                                <label class="form-label fw-bold">Seleziona Ricetta</label>
                                <select class="form-select" id="prod-ricetta" required>
                                    <option value="">Caricamento ricette...</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label fw-bold">Data di Svolgimento</label>
                                <input type="date" class="form-control" id="prod-data" required>
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
                            📄 Diario
                        </button>
                        <button type="button" class="btn btn-outline-dark" id="btn-view-griglia" title="Vista Calendario Mensile">
                            📅 Calendario
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
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>🛒 Lista della spesa</h2>
                <button class="btn btn-outline-danger btn-sm shadow-sm" id="btn-svuota-spesa">🗑 Svuota tutto</button>
            </div>

            <div class="row">
                <div class="col-md-5 mb-4">
                    <div class="card shadow-sm border-primary mb-4">
                        <div class="card-header bg-primary text-white fw-bold py-2">
                            Aggiungi al carrello
                        </div>
                        <div class="card-body bg-light">
                            <label class="form-label small fw-bold text-muted">Ricetta:</label>
                            <select class="form-select mb-3 shadow-sm" id="spesa-select-ricetta">
                                <option value="">Caricamento...</option>
                            </select>
                            
                            <label class="form-label small fw-bold text-muted">Porzioni da preparare:</label>
                            <div class="stepper-group mb-3 shadow-sm">
                                <button type="button" class="stepper-btn" tabindex="-1" onclick="this.nextElementSibling.stepDown(); this.nextElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">−</button>
                                <input type="number" step="0.1" class="form-control stepper-input" id="spesa-input-porzioni">
                                <button type="button" class="stepper-btn" tabindex="-1" onclick="this.previousElementSibling.stepUp(); this.previousElementSibling.dispatchEvent(new Event('input', {bubbles: true}))">+</button>
                            </div>
                            
                            <button class="btn btn-primary w-100 fw-bold shadow-sm" id="btn-aggiungi-spesa" disabled>
                                ➕ Aggiungi alla spesa
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