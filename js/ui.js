// js/ui.js

const UI = {
    container: document.getElementById('app-content'),

    renderElenco: function () {
        this.container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Elenco Ricette</h2>
            </div>
            
            <div class="card mb-4 shadow-sm">
                <div class="card-body row g-3 align-items-center">
                    <div class="col-md-3">
                        <input type="text" id="filtro-testo" class="form-control" placeholder="🔍 Cerca per nome...">
                    </div>
                    <div class="col-md-3">
                        <select id="filtro-categoria" class="form-select">
                            <option value="">Tutte le Categorie</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select id="filtro-tag" class="form-select">
                            <option value="">Tutti i Tag</option>
                        </select>
                    </div>
                    <div class="col-md-3 text-end">
                        <div class="btn-group shadow-sm" role="group">
                            <button type="button" class="btn btn-outline-dark active" id="btn-view-grid" title="Vista a Card">
                                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M1 1h4v4H1V1zm5 0h4v4H6V1zm5 0h4v4h-4V1zM1 6h4v4H1V6zm5 0h4v4H6V6zm5 0h4v4h-4V6zM1 11h4v4H1v-4zm5 0h4v4H6v-4zm5 0h4v4h-4v-4z"/></svg>
                            </button>
                            <button type="button" class="btn btn-outline-dark" id="btn-view-list" title="Vista ad Elenco">
                                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg>
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

    renderCards: function (ricette, viewMode = 'grid', categorieAperte = []) {
        const griglia = document.getElementById('griglia-ricette');
        if (!griglia) return;

        if (ricette.length === 0) {
            griglia.innerHTML = '<div class="col-12 text-center text-muted py-5">Nessuna ricetta trovata con questi filtri.</div>';
            return;
        }

        // 1. RAGGRUPPIAMO LE RICETTE PER CATEGORIA
        const gruppi = {};
        ricette.forEach(r => {
            const catNome = r.categorie ? r.categorie.nome : 'Senza categoria';
            if (!gruppi[catNome]) gruppi[catNome] = [];
            gruppi[catNome].push(r);
        });

        // 2. ORDINIAMO LE CATEGORIE ALFABETICAMENTE
        const categorieOrdinate = Object.keys(gruppi).sort((a, b) => {
            if (a === 'Senza categoria') return 1;
            if (b === 'Senza categoria') return -1;
            return a.localeCompare(b);
        });

        let html = '';

        // 3. GENERIAMO I BLOCCHI ESPANDIBILI
        categorieOrdinate.forEach((catNome, index) => {
            const ricetteCategoria = gruppi[catNome];
            const catId = 'collapse-cat-' + index;

            // CONTROLLO FONDAMENTALE: Se la categoria è nell'elenco di quelle salvate, la classe è 'show', sennò vuoto (chiuso)
            const isOpen = categorieAperte.includes(catNome) ? 'show' : '';

            // Abbiamo aggiunto data-cat-nome="${catNome}" al div "collapse"
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

            // 4. INSERIAMO LE RICETTE
            ricetteCategoria.forEach(r => {
                const imgUrl = r.url_immagine || 'https://via.placeholder.com/400x300?text=Nessuna+Immagine';

                if (viewMode === 'list') {
                    html += `
                        <div class="col-12 mb-2">
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
                    const tagsHTML = r.ricette_tags.map(rt => `<span class="badge bg-secondary me-1 mb-1">${rt.tag.nome}</span>`).join('');
                    html += `
                        <div class="col-md-4 mb-4">
                            <div class="card h-100 shadow-sm ricetta-card" style="cursor: pointer; transition: transform 0.2s;" data-id="${r.id}" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                                <img src="${imgUrl}" class="card-img-top" alt="${r.nome}" style="height: 200px; object-fit: cover;">
                                <div class="card-body d-flex flex-column">
                                    <h5 class="card-title fw-bold">${r.nome}</h5>
                                    <h6 class="card-subtitle mb-3 text-muted">${catNome}</h6>
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
            <h2 class="mb-4">Impostazioni di Sistema</h2>
            
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card shadow-sm border-secondary">
                        <div class="card-header bg-secondary text-white fw-bold">Preferenze Visualizzazione (Salvate sul dispositivo)</div>
                        <div class="card-body bg-light">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-bold small text-muted">Vista Galleria Predefinita</label>
                                    <select id="pref-view" class="form-select shadow-sm">
                                        <option value="grid">Griglia (Card con immagini)</option>
                                        <option value="list">Elenco (Lista compatta laterale)</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label fw-bold small text-muted">Tema Grafico</label>
                                    <select id="pref-theme" class="form-select shadow-sm">
                                        <option value="light">☀️ Chiaro (Light Mode)</option>
                                        <option value="dark">🌙 Scuro (Dark Mode)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6 mb-4">
                    <div class="card shadow-sm">
                        <div class="card-header bg-primary text-white fw-bold">Gestione Categorie (Database)</div>
                        <div class="card-body">
                            <div class="input-group mb-3">
                                <input type="text" id="input-categoria" class="form-control" placeholder="Nuova categoria">
                                <button class="btn btn-primary" id="btn-add-categoria">Aggiungi</button>
                            </div>
                            <ul class="list-group" id="lista-categorie"></ul>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-4">
                    <div class="card shadow-sm">
                        <div class="card-header bg-success text-white fw-bold">Gestione Tag (Database)</div>
                        <div class="card-body">
                            <div class="input-group mb-3">
                                <input type="text" id="input-tag" class="form-control" placeholder="Nuovo tag">
                                <button class="btn btn-success" id="btn-add-tag">Aggiungi</button>
                            </div>
                            <ul class="list-group" id="lista-tag"></ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderInserimento: function () {
        this.container.innerHTML = `
            <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 border-bottom pb-3">
                <h2 id="titolo-inserimento" class="mb-3 mb-md-0">Nuova Ricetta (Distinta Base)</h2>
                <div class="d-flex align-items-center gap-2 flex-wrap">
                    <input type="file" id="input-import-txt" accept=".txt" class="d-none">
                    <button type="button" class="btn btn-outline-primary shadow-sm fw-bold" id="btn-import-txt">
                        📄 Importa da TXT
                    </button>
                    
                    <button type="button" class="btn btn-outline-danger shadow-sm fw-bold d-none" id="btn-elimina-ricetta-form">
                        🗑 Elimina
                    </button>
                    
                    <button type="submit" form="form-ricetta" class="btn btn-success shadow-sm fw-bold" id="btn-salva-ricetta-top">
                        💾 Salva Ricetta
                    </button>
                </div>
            </div>
            
            <form id="form-ricetta">
                <div class="card mb-4 shadow-sm">
                    <div class="card-header bg-dark text-white">1. Dati Generali e Tag</div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6 mb-3"><label class="form-label fw-bold">Nome Ricetta *</label><input type="text" id="ricetta-nome" class="form-control" required></div>
                            <div class="col-md-3 mb-3"><label class="form-label fw-bold">Categoria</label><select id="ricetta-categoria" class="form-select"><option value="">Seleziona...</option></select></div>
                            <div class="col-md-3 mb-3"><label class="form-label fw-bold">Immagine</label><input type="file" id="ricetta-immagine" class="form-control" accept="image/png, image/jpeg, image/webp"></div>
                            
                            <div class="col-md-3 mb-3"><label class="form-label small text-muted">Porzioni Base *</label><input type="number" step="0.1" id="ricetta-porzioni" class="form-control" value="4" required></div>
                            <div class="col-md-3 mb-3"><label class="form-label small text-muted">Unità (es. persone)</label><input type="text" id="ricetta-unita" class="form-control" value="persone"></div>
                            <div class="col-md-3 mb-3"><label class="form-label small text-muted">Riposo (ore)</label><input type="number" step="0.1" id="ricetta-riposo" class="form-control" value="0"></div>
                            <div class="col-md-3 mb-3"><label class="form-label small text-muted">Cottura (min)</label><input type="number" id="ricetta-cottura" class="form-control" value="0"></div>

                            <div class="col-md-6 mb-3"><label class="form-label fw-bold">Tags</label><div id="container-tags" class="border rounded p-2 bg-light" style="max-height: 200px; overflow-y: auto;"></div></div>
                            <div class="col-md-3 mb-3"><label class="form-label small text-muted">Fonte</label><input type="text" id="ricetta-fonte" class="form-control"></div>
                            <div class="col-md-3 mb-3"><label class="form-label small text-muted">Link Fonte</label><input type="url" id="ricetta-link" class="form-control"></div>
                            <div class="col-12 mb-3"><label class="form-label fw-bold">Note</label><textarea id="ricetta-note" class="form-control" rows="2"></textarea></div>
                        </div>
                    </div>
                </div>

                <div class="card mb-4 shadow-sm">
                    <div class="card-header bg-success text-white">2. Ingredienti</div>
                    <div class="card-body">
                        <div class="row fw-bold text-muted small mb-2 d-none d-md-flex">
                            <div class="col-md-5">Nome Ingrediente</div><div class="col-md-3">Quantità</div><div class="col-md-3">Unità di misura</div>
                        </div>
                        <div id="container-ingredienti"></div>
                        <button type="button" class="btn btn-sm btn-outline-success mt-3" id="btn-add-ingrediente">+ Aggiungi Ingrediente</button>
                    </div>
                </div>

                <div class="card mb-4 shadow-sm">
                    <div class="card-header bg-primary text-white">3. Procedimento</div>
                    <div class="card-body">
                        <div id="container-procedimento"></div>
                        <button type="button" class="btn btn-sm btn-outline-primary mt-3" id="btn-add-step">+ Aggiungi Step</button>
                    </div>
                </div>

                <div class="card mb-4 shadow-sm border-warning">
                    <div class="card-header bg-warning text-dark fw-bold">4. Sottoricette (Opzionali)</div>
                    <div class="card-body">
                        <p class="small text-muted mb-3">Includi altre ricette indicando il moltiplicatore (es. 0.5 per mezza dose).</p>
                        <div id="container-sottoricette"></div>
                        <button type="button" class="btn btn-sm btn-outline-warning text-dark mt-3" id="btn-add-sottoricetta">+ Aggiungi Sottoricetta</button>
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

    getIngredienteRowHTML: function () {
        return `
            <div class="row align-items-center mb-2 riga-ingrediente">
                <div class="col-5">
                    <input type="text" class="form-control ing-nome" placeholder="Nome ingrediente" list="dizionario-ingredienti" required>
                </div>
                <div class="col-3">
                    <input type="number" step="0.1" class="form-control ing-qta" placeholder="Q.tà" required>
                </div>
                <div class="col-3">
                    <input type="text" class="form-control ing-unita" placeholder="Unità (g, ml...)" list="dizionario-unita">
                </div>
                <div class="col-1 text-end">
                    <button type="button" class="btn btn-outline-danger btn-sm btn-remove-row">✖</button>
                </div>
            </div>
        `;
    },

    getStepRowHTML: function () {
        return `
            <div class="row mb-2 riga-step align-items-start mt-3">
                <div class="col-md-1 text-center bg-light border rounded py-2 fw-bold step-number">#</div>
                <div class="col-md-10">
                    <textarea class="form-control step-desc" rows="1" style="overflow-y: hidden; resize: none;" oninput="this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px';" required></textarea>
                </div>
                <div class="col-md-1 text-end"><button type="button" class="btn btn-outline-danger btn-remove-row" tabindex="-1">X</button></div>
            </div>
        `;
    },

    getSottoricettaRowHTML: function (optionsRicette) {
        return `
            <div class="row mb-2 riga-sottoricetta align-items-center mt-2">
                <div class="col-md-7 mb-2 mb-md-0"><select class="form-select sr-id" required>${optionsRicette}</select></div>
                <div class="col-md-4 mb-2 mb-md-0">
                    <div class="input-group"><span class="input-group-text bg-light">Moltiplicatore</span><input type="number" step="0.01" class="form-control sr-moltiplicatore" placeholder="Es. 0.5" required></div>
                </div>
                <div class="col-md-1 text-end"><button type="button" class="btn btn-outline-danger btn-remove-row" tabindex="-1">X</button></div>
            </div>
        `;
    },
    // ... sotto renderCards ...

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
                            <small class="text-muted d-block">Resa Base</small>
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
                            <div class="input-group input-group-lg mb-4 shadow-sm">
                                <input type="number" step="0.1" class="form-control text-center fw-bold text-primary" id="input-ricalcolo" value="${ricetta.porzioni_base}">
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
                <h2>🗓️ Storico di Produzione</h2>
                <button class="btn btn-success fw-bold shadow-sm" id="btn-nuova-produzione">
                    ➕ Registra Produzione
                </button>
            </div>

            <div class="row mb-4" id="dashboard-statistiche">
                <div class="col-12 text-center text-muted">Calcolo statistiche in corso...</div>
            </div>

            <div class="card shadow border-success mb-4 d-none" id="form-produzione-container">
                <div class="card-header bg-success text-white fw-bold">
                    Nuova Registrazione Svolgimento
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
                    <h5 class="mb-0 fw-bold text-dark">Registro Eventi</h5>
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
                <h2>🛒 Lista della Spesa</h2>
                <button class="btn btn-outline-danger btn-sm shadow-sm" id="btn-svuota-spesa">🗑 Svuota Tutto</button>
            </div>

            <div class="row">
                <div class="col-md-5 mb-4">
                    <div class="card shadow-sm border-primary mb-4">
                        <div class="card-header bg-primary text-white fw-bold py-2">
                            Aggiungi al Carrello
                        </div>
                        <div class="card-body bg-light">
                            <label class="form-label small fw-bold text-muted">Ricetta:</label>
                            <select class="form-select mb-3 shadow-sm" id="spesa-select-ricetta">
                                <option value="">Caricamento...</option>
                            </select>
                            
                            <label class="form-label small fw-bold text-muted">Porzioni da preparare:</label>
                            <div class="input-group mb-3 shadow-sm">
                                <input type="number" step="0.1" class="form-control" id="spesa-input-porzioni" placeholder="Es. 4">
                            </div>
                            
                            <button class="btn btn-primary w-100 fw-bold shadow-sm" id="btn-aggiungi-spesa" disabled>
                                ➕ Aggiungi alla Spesa
                            </button>
                        </div>
                    </div>

                    <h5 class="fw-bold mb-3">Menu in programma:</h5>
                    <ul class="list-group shadow-sm" id="lista-ricette-spesa">
                        <li class="list-group-item text-muted small">Nessuna ricetta selezionata.</li>
                    </ul>
                </div>

                <div class="col-md-7 mb-4">
                    <div class="card shadow border-success">
                        <div class="card-header bg-success text-white fw-bold py-3">
                            Checklist Ingredienti
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