// js/api.js

const API = {
    // --- CATEGORIE ---
    getCategorie: async () => {
        const { data, error } = await supabaseClient.from('categorie').select('*').order('nome');
        if (error) throw error;
        return data;
    },
    addCategoria: async (nome) => {
        const { error } = await supabaseClient.from('categorie').insert([{ nome }]);
        if (error) throw error;
    },
    deleteCategoria: async (id) => {
        const { error } = await supabaseClient.from('categorie').delete().eq('id', id);
        if (error) throw error;
    },

    // --- TAG ---
    getTags: async () => {
        const { data, error } = await supabaseClient.from('tag').select('*').order('nome');
        if (error) throw error;
        return data;
    },
    addTag: async (nome) => {
        const { error } = await supabaseClient.from('tag').insert([{ nome }]);
        if (error) throw error;
    },
    deleteTag: async (id) => {
        const { error } = await supabaseClient.from('tag').delete().eq('id', id);
        if (error) throw error;
    },

    // --- RICETTE (BOM) ---
    getRicetteElencoBreve: async () => {
        const { data, error } = await supabaseClient.from('ricette').select('id, nome').order('nome');
        if (error) throw error;
        return data;
    },

    getRicetteGalleria: async () => {
        // Questa query unisce la ricetta con il nome della sua categoria 
        // e i nomi dei tag associati attraversando la tabella di mezzo 'ricette_tags'
        const { data, error } = await supabaseClient
            .from('ricette')
            .select(`
                id, 
                nome, 
                url_immagine, 
                tempo_cottura_min, 
                tempo_riposo_ore,
                categorie (nome),
                ricette_tags ( tag (nome) )
            `)
            .order('data_inserimento', { ascending: false }); // Le più recenti prima

        if (error) throw error;
        return data;
    },


    getRicettaCompleta: async (id) => {
        // 1. Scarichiamo la ricetta padre con i suoi ingredienti, step e tag
        const { data: ricetta, error: errRicetta } = await supabaseClient
            .from('ricette')
            .select(`
                *,
                categorie (nome),
                ricette_tags ( tag (nome) ),
                ingredienti (*),
                procedimento (*)
            `)
            .eq('id', id)
            .single();

        if (errRicetta) throw errRicetta;

        // Ordiniamo gli step per numero
        if (ricetta.procedimento) {
            ricetta.procedimento.sort((a, b) => a.step_num - b.step_num);
        }

        // 2. Scarichiamo le sottoricette collegate a questo padre
        const { data: sottoricette, error: errSotto } = await supabaseClient
            .from('sottoricette')
            .select(`
                moltiplicatore,
                ricetta_figlia:id_figlia (
                    id, nome, porzioni_base, unita_porzioni,
                    ingredienti (*),
                    procedimento (*) 
                )
            `)
            .eq('id_padre', id);

        if (errSotto) throw errSotto;

        // Uniamo i dati
        ricetta.sottoricette_esplose = sottoricette || [];

        return ricetta;
    },


    // Nuova funzione per scoprire se la ricetta è usata come "figlia" altrove
    getUsiComeSottoricetta: async (id_ricetta) => {
        // 1. Troviamo gli ID delle ricette padre
        const { data: links, error: errLinks } = await supabaseClient
            .from('sottoricette')
            .select('id_padre')
            .eq('id_figlia', id_ricetta);
        if (errLinks) throw errLinks;

        if (!links || links.length === 0) return [];

        const padriIds = links.map(l => l.id_padre);

        // 2. Troviamo i NOMI delle ricette padre per mostrarli all'utente
        const { data: padri, error: errPadri } = await supabaseClient
            .from('ricette')
            .select('nome')
            .in('id', padriIds);
        if (errPadri) throw errPadri;

        return padri.map(p => p.nome); // Ritorna un array di stringhe (es. ["Torta di Mele", "Biscotti"])
    },

    // Funzione di eliminazione aggiornata
    deleteRicetta: async (id_ricetta, url_immagine) => {
        // 1. Pulizia Storage
        if (url_immagine && url_immagine.includes('immagini-ricette')) {
            try {
                const fileName = url_immagine.split('/').pop();
                await supabaseClient.storage.from('immagini-ricette').remove([fileName]);
            } catch (e) { console.warn("Errore immagine", e); }
        }

        // 2. Rimuoviamo i legami come sottoricetta per non far arrabbiare il vincolo RESTRICT di PostgreSQL
        await supabaseClient.from('sottoricette').delete().eq('id_figlia', id_ricetta);

        // 3. Eliminiamo la ricetta (il CASCADE penserà a ingredienti e step)
        const { error: errDb } = await supabaseClient.from('ricette').delete().eq('id', id_ricetta);
        if (errDb) throw errDb;
    },

    // ... sotto deleteRicetta ...

    aggiornaRicettaCompleta: async (id_ricetta, ricetta, ingredienti, procedimento, tagsIds, sottoricette) => {
        // 1. Aggiorniamo i dati principali del Padre (titolo, porzioni, ecc.)
        const { error: errRicetta } = await supabaseClient
            .from('ricette')
            .update(ricetta)
            .eq('id', id_ricetta);
        if (errRicetta) throw errRicetta;

        // 2. Cancelliamo tutti i vecchi "Figli" (il DB farà pulizia)
        await supabaseClient.from('ingredienti').delete().eq('id_ricetta', id_ricetta);
        await supabaseClient.from('procedimento').delete().eq('id_ricetta', id_ricetta);
        await supabaseClient.from('ricette_tags').delete().eq('id_ricetta', id_ricetta);
        await supabaseClient.from('sottoricette').delete().eq('id_padre', id_ricetta);

        // 3. Prepariamo i nuovi array (esattamente come nel salvataggio)
        const ingredientiDaSalvare = ingredienti.map(ing => ({
            id_ricetta: id_ricetta, nome_ingrediente: ing.nome, quantita: ing.qta, unita_distinta: ing.unita || ""
        }));
        const procedimentoDaSalvare = procedimento.map((step, index) => ({
            id_ricetta: id_ricetta, step_num: index + 1, descrizione: step.desc
        }));
        const tagsDaSalvare = tagsIds.map(id_tag => ({
            id_ricetta: id_ricetta, id_tag: parseInt(id_tag)
        }));
        const sottoricetteDaSalvare = sottoricette.map(sr => ({
            id_padre: id_ricetta, id_figlia: sr.id_figlia, moltiplicatore: sr.moltiplicatore
        }));

        // 4. Inseriamo i nuovi "Figli" (Bulk Insert)
        if (ingredientiDaSalvare.length > 0) await supabaseClient.from('ingredienti').insert(ingredientiDaSalvare);
        if (procedimentoDaSalvare.length > 0) await supabaseClient.from('procedimento').insert(procedimentoDaSalvare);
        if (tagsDaSalvare.length > 0) await supabaseClient.from('ricette_tags').insert(tagsDaSalvare);
        if (sottoricetteDaSalvare.length > 0) await supabaseClient.from('sottoricette').insert(sottoricetteDaSalvare);

        return id_ricetta;
    },

    // ==========================================
    // CHIAMATE PER IL CALENDARIO E STORICO MES
    // ==========================================

    getStorico: async () => {
        // Scarichiamo tutto lo storico unito ai dettagli base delle ricette (per le statistiche)
        const { data, error } = await supabaseClient
            .from('storico_produzione')
            .select(`
                id,
                data_svolgimento,
                porzioni_prodotte,
                ricette (
                    id,
                    nome,
                    note,
                    categorie (nome),
                    ricette_tags ( tag (nome) )
                )
            `)
            .order('data_svolgimento', { ascending: false }); // Dal più recente al più vecchio

        if (error) throw error;
        return data || [];
    },

    registraProduzione: async (arrayProduzioni, arrayNoteAggiornate) => {
        // 1. Inseriamo i record di produzione (sia padre che figlie) nel calendario
        const { error: errProd } = await supabaseClient
            .from('storico_produzione')
            .insert(arrayProduzioni);

        if (errProd) throw errProd;

        // 2. Aggiorniamo in blocco il campo "note" di tutte le ricette coinvolte
        for (let aggiornamento of arrayNoteAggiornate) {
            const { error: errNote } = await supabaseClient
                .from('ricette')
                .update({ note: aggiornamento.note_finali })
                .eq('id', aggiornamento.id_ricetta);

            if (errNote) throw errNote;
        }

        return true;
    },

    uploadImmagine: async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabaseClient.storage.from('immagini-ricette').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data } = supabaseClient.storage.from('immagini-ricette').getPublicUrl(fileName);
        return data.publicUrl;
    },

    salvaRicettaCompleta: async (ricetta, ingredienti, procedimento, tagsIds, sottoricette) => {
        // 1. Salva Padre
        const { data: ricettaSalvata, error: errRicetta } = await supabaseClient.from('ricette').insert([ricetta]).select();
        if (errRicetta) throw errRicetta;
        const id_ricetta = ricettaSalvata[0].id;

        // 2. Prepara Array
        const ingredientiDaSalvare = ingredienti.map(ing => ({
            id_ricetta: id_ricetta, nome_ingrediente: ing.nome, quantita: ing.qta, unita_distinta: ing.unita || ""
        }));
        const procedimentoDaSalvare = procedimento.map((step, index) => ({
            id_ricetta: id_ricetta, step_num: index + 1, descrizione: step.desc
        }));
        const tagsDaSalvare = tagsIds.map(id_tag => ({
            id_ricetta: id_ricetta, id_tag: parseInt(id_tag)
        }));
        const sottoricetteDaSalvare = sottoricette.map(sr => ({
            id_padre: id_ricetta, id_figlia: sr.id_figlia, moltiplicatore: sr.moltiplicatore
        }));

        // 3. Insert Bulk
        if (ingredientiDaSalvare.length > 0) await supabaseClient.from('ingredienti').insert(ingredientiDaSalvare);
        if (procedimentoDaSalvare.length > 0) await supabaseClient.from('procedimento').insert(procedimentoDaSalvare);
        if (tagsDaSalvare.length > 0) await supabaseClient.from('ricette_tags').insert(tagsDaSalvare);
        if (sottoricetteDaSalvare.length > 0) await supabaseClient.from('sottoricette').insert(sottoricetteDaSalvare);

        return id_ricetta;
    },

    getDizionarioIngredienti: async () => {
        // Scarichiamo tutti gli ingredienti usati finora
        const { data, error } = await supabaseClient
            .from('ingredienti')
            .select('nome_ingrediente, unita_distinta');

        if (error) throw error;

        // Estraiamo i nomi, li mettiamo in minuscolo per confrontarli, togliamo i doppioni (Set) e li rimettiamo in maiuscolo
        const nomiUnici = [...new Set(data.map(i => i.nome_ingrediente.trim().toLowerCase()))]
            .filter(n => n)
            .map(n => n.charAt(0).toUpperCase() + n.slice(1)); // Inizia con la maiuscola

        // Stessa cosa per le unità di misura (g, ml, cucchiai, ecc.)
        const unitaUniche = [...new Set(data.map(i => (i.unita_distinta || '').trim().toLowerCase()))]
            .filter(u => u);

        // Li restituiamo in ordine alfabetico
        return {
            nomi: nomiUnici.sort(),
            unita: unitaUniche.sort()
        };
    }
};