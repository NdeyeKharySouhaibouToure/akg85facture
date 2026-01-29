#!/usr/bin/env node

/**
 * Script pour générer supabase-config.local.js depuis .env
 * Usage: node scripts/setup-config.js
 */

const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement depuis .env
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Contenu du fichier de configuration
const configContent = `// Configuration Supabase générée automatiquement depuis .env
// Ne modifiez pas ce fichier manuellement, il sera écrasé lors de l'exécution du script setup
// Pour modifier la configuration, éditez le fichier .env

window.supabaseConfig = {
    url: '${SUPABASE_URL}',
    anonKey: '${SUPABASE_ANON_KEY}'
};
`;

// Chemin du fichier de sortie
const outputPath = path.join(__dirname, '..', 'supabase-config.local.js');

// Écrire le fichier
try {
    fs.writeFileSync(outputPath, configContent, 'utf8');
    console.log('✅ Configuration générée avec succès !');
    console.log(`   Fichier créé: ${outputPath}`);
    
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.log('\n⚠️  Attention: Les valeurs par défaut sont encore utilisées.');
        console.log('   Assurez-vous d\'avoir créé un fichier .env avec vos clés API Supabase.');
    } else {
        console.log('\n✅ Configuration chargée depuis .env');
    }
} catch (error) {
    console.error('❌ Erreur lors de la génération de la configuration:', error.message);
    process.exit(1);
}
