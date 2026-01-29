// Configuration Supabase par défaut
// Les valeurs par défaut seront remplacées par supabase-config.local.js s'il existe
window.supabaseConfig = window.supabaseConfig || {
    url: 'YOUR_SUPABASE_URL', // Ex: https://xxxxx.supabase.co
    anonKey: 'YOUR_SUPABASE_ANON_KEY' // Votre clé publique anonyme
};

// Initialisation du client Supabase
let supabaseClient = null;

if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(
        window.supabaseConfig.url,
        window.supabaseConfig.anonKey
    );
}
