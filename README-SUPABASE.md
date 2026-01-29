# Configuration Supabase pour AKG 85 Facturation

Ce guide vous explique comment configurer Supabase comme backend pour l'application de facturation.

## Étapes de configuration

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Créez un nouveau projet
4. Notez votre **URL du projet** et votre **clé API anonyme (anon key)**

### 2. Configurer la base de données

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Ouvrez le fichier `supabase-schema.sql` de ce projet
3. Copiez tout le contenu du fichier
4. Collez-le dans l'éditeur SQL de Supabase
5. Cliquez sur **Run** pour exécuter le script

Cela créera :
- La table `invoices` pour stocker les factures
- La table `settings` pour stocker les paramètres
- Les index et triggers nécessaires
- Les politiques RLS (Row Level Security) pour permettre l'accès

### 3. Trouver vos clés API Supabase

1. Dans votre projet Supabase, allez dans **Settings** (Paramètres) dans le menu de gauche
2. Cliquez sur **API** dans le sous-menu
3. Vous trouverez deux informations importantes :
   - **Project URL** : C'est votre URL Supabase (ex: `https://abcdefghijklmnop.supabase.co`)
   - **anon public** : C'est votre clé API anonyme (une longue chaîne commençant par `eyJ...`)

### 4. Configurer les clés API dans l'application

**Méthode recommandée (fichier .env)** :

1. **Installez les dépendances Node.js** (une seule fois) :
   ```bash
   npm install
   ```

2. **Créez votre fichier .env** :
   ```bash
   cp .env.example .env
   ```
   Ou créez manuellement le fichier `.env`

3. **Ouvrez le fichier `.env`** et remplissez vos clés :
   ```env
   SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ...
   ```

4. **Générez la configuration** :
   ```bash
   npm run setup
   ```
   
   Cette commande lit votre fichier `.env` et génère automatiquement `supabase-config.local.js`.

**⚠️ Important** : 
- Le fichier `supabase-config.local.js` est dans `.gitignore` et ne sera **jamais** commité dans Git
- Utilisez toujours la clé **anon public** (jamais la clé `service_role` dans le code client)
- La clé `anon public` est sécurisée pour être utilisée côté client grâce aux politiques RLS
- Ne partagez jamais vos clés API publiquement

### 5. Tester l'application

1. **Option 1 - Ouvrir directement** :
   - Ouvrez `index.html` dans votre navigateur
   - L'application devrait maintenant utiliser Supabase au lieu de localStorage
   - Les données seront automatiquement migrées depuis localStorage lors du premier chargement

2. **Option 2 - Serveur de développement** :
   ```bash
   npm run dev
   ```
   Cela génère la config et lance un serveur local sur http://localhost:8080

## Fonctionnalités

- ✅ **Synchronisation automatique** : Les données sont sauvegardées dans Supabase en temps réel
- ✅ **Migration automatique** : Les données existantes dans localStorage sont migrées vers Supabase
- ✅ **Fallback** : Si Supabase n'est pas configuré, l'application utilise localStorage
- ✅ **Gestion des erreurs** : En cas d'erreur Supabase, l'application continue de fonctionner avec localStorage

## Structure des données

### Table `invoices`
Stocke toutes les factures avec leurs détails complets (client, articles, totaux, statut, etc.)

### Table `settings`
Stocke les paramètres de l'application (taux de TVA, devise, informations du magasin, etc.)

## Sécurité

Actuellement, les politiques RLS permettent toutes les opérations. Pour un environnement de production, vous devriez :

1. Activer l'authentification Supabase
2. Créer des politiques RLS plus restrictives basées sur l'utilisateur
3. Utiliser la clé `service_role` uniquement côté serveur (jamais dans le code client)

## Dépannage

### L'application n'utilise pas Supabase
- Vérifiez que le fichier `supabase-config.local.js` existe et contient vos vraies clés
- Vérifiez que les clés ne contiennent plus `YOUR_SUPABASE_URL` ou `YOUR_SUPABASE_ANON_KEY`
- Vérifiez la console du navigateur pour les erreurs
- Assurez-vous que le schéma SQL a été exécuté correctement

### Erreurs de connexion
- Vérifiez que votre URL Supabase est correcte
- Vérifiez que votre clé API est valide
- Vérifiez les politiques RLS dans Supabase

### Les données ne se sauvegardent pas
- Vérifiez la console du navigateur pour les erreurs
- Vérifiez que les tables existent dans Supabase
- Vérifiez que les politiques RLS permettent les opérations
