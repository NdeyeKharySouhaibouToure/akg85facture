// Script de build pour Vercel
// Génère supabase-config.local.js à partir des variables d'environnement Vercel
// ET injecte les variables directement dans index.html comme fallback

const fs = require('fs');
const path = require('path');

// Récupérer les variables d'environnement de Vercel
// Vercel expose toutes les variables d'environnement au build
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('[Build] Variables d\'environnement détectées:');
console.log('[Build] SUPABASE_URL:', supabaseUrl ? '✓ Présent' : '✗ Absent');
console.log('[Build] SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Présent' : '✗ Absent');

// Chemin du fichier de configuration
const configPath = path.join(__dirname, '..', 'supabase-config.local.js');
const indexPath = path.join(__dirname, '..', 'index.html');

// Générer le contenu du fichier
const finalUrl = supabaseUrl || 'YOUR_SUPABASE_URL';
const finalKey = supabaseAnonKey || 'YOUR_SUPABASE_ANON_KEY';
const urlStatus = supabaseUrl ? '✓ Configuré' : '✗ Non configuré';
const keyStatus = supabaseAnonKey ? '✓ Configuré' : '✗ Non configuré';

let configContent = `// Configuration Supabase générée automatiquement pour Vercel
// Ce fichier est généré à partir des variables d'environnement Vercel
// Ne pas modifier manuellement - sera régénéré à chaque build

window.supabaseConfig = window.supabaseConfig || {
    url: '${finalUrl}',
    anonKey: '${finalKey}'
};

console.log('[Vercel Build] Configuration Supabase chargée:', {
    url: '${urlStatus}',
    anonKey: '${keyStatus}'
});
`;

// Écrire le fichier de configuration
try {
    fs.writeFileSync(configPath, configContent, 'utf8');
    console.log('✓ Fichier supabase-config.local.js généré avec succès');
    
    // Aussi injecter dans index.html comme script inline (fallback)
    if (fs.existsSync(indexPath)) {
        let htmlContent = fs.readFileSync(indexPath, 'utf8');
        
        // Vérifier si le script inline existe déjà
        const inlineScriptPattern = /<!-- Supabase Config Inline -->[\s\S]*?<\/script>/;
        const inlineScript = `<!-- Supabase Config Inline -->
    <script>
        // Configuration Supabase injectée au build (fallback si supabase-config.local.js ne charge pas)
        if (!window.supabaseConfig || window.supabaseConfig.url === 'YOUR_SUPABASE_URL') {
            window.supabaseConfig = window.supabaseConfig || {
                url: '${finalUrl}',
                anonKey: '${finalKey}'
            };
            console.log('[Build Inline] Configuration Supabase injectée');
        }
    </script>`;
        
        // Remplacer ou insérer le script inline
        if (inlineScriptPattern.test(htmlContent)) {
            htmlContent = htmlContent.replace(inlineScriptPattern, inlineScript);
        } else {
            // Insérer juste avant la fermeture de </head>
            htmlContent = htmlContent.replace('</head>', `    ${inlineScript}\n</head>`);
        }
        
        fs.writeFileSync(indexPath, htmlContent, 'utf8');
        console.log('✓ Configuration Supabase injectée dans index.html');
    }
    
    if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL' || 
        !supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('⚠️  ATTENTION: Les variables d\'environnement Supabase ne sont pas configurées sur Vercel!');
        console.warn('   Configurez SUPABASE_URL et SUPABASE_ANON_KEY dans les paramètres Vercel.');
        console.warn('   Le build continuera mais Supabase ne fonctionnera pas en production.');
    } else {
        console.log('✓ Variables d\'environnement Supabase détectées et configurées');
        console.log('✓ URL:', supabaseUrl.substring(0, 20) + '...');
        console.log('✓ Clé:', supabaseAnonKey.substring(0, 20) + '...');
    }
} catch (error) {
    console.error('✗ Erreur lors de la génération du fichier de configuration:', error);
    process.exit(1);
}
