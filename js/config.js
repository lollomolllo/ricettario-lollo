// js/config.js

// 1. Inserisci le tue credenziali Supabase qui
const SUPABASE_URL = 'https://bkdllumldybbwbxfrgwi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZGxsdW1sZHliYndieGZyZ3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjAxMTksImV4cCI6MjA4NzY5NjExOX0.64vAvLUGOBJfJA95f6BV9Bo1SExXYsbQv0m19TkDQUs';


// Usiamo supabaseClient invece di supabase per evitare conflitti con la libreria globale
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("Supabase Client Inizializzato con successo!", supabaseClient);