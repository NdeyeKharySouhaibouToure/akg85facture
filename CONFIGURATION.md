# Configuration des clés API Supabase

## Méthode recommandée : Utiliser un fichier .env

Pour protéger vos clés API, utilisez un fichier `.env` qui n'est pas versionné dans Git.

### Étapes :

1. **Installez les dépendances Node.js** (une seule fois) :
   ```bash
   npm install
   ```

2. **Créez votre fichier .env** :
   - Copiez `.env.example` vers `.env`
   - Ou créez manuellement le fichier `.env`

3. **Remplissez vos clés API** dans `.env` :
   ```env
   SUPABASE_URL=https://votre-projet.supabase.co
   SUPABASE_ANON_KEY=votre_clé_anon_ici
   ```

4. **Générez la configuration** :
   ```bash
   npm run setup
   ```
   
   Cette commande lit votre fichier `.env` et génère automatiquement `supabase-config.local.js`.

5. **C'est tout !** Le fichier `.env` est dans `.gitignore` et ne sera jamais commité.

### Structure des fichiers :

- ✅ `.env` - Vos clés API (non versionné, créé par vous)
- ✅ `.env.example` - Modèle de fichier .env (versionné, sans clés réelles)
- ✅ `supabase-config.js` - Configuration par défaut (versionnée, valeurs d'exemple)
- ✅ `supabase-config.local.js` - Configuration générée depuis .env (non versionnée, généré automatiquement)
- ✅ `scripts/setup-config.js` - Script qui génère la config depuis .env
- ✅ `.gitignore` - Exclut les fichiers sensibles du dépôt Git

### Comment ça fonctionne :

1. Vous créez un fichier `.env` avec vos clés API
2. Vous exécutez `npm run setup` qui lit le `.env` et génère `supabase-config.local.js`
3. `index.html` charge d'abord `supabase-config.local.js` (si il existe)
4. Puis charge `supabase-config.js` (qui peut override si le fichier local n'existe pas)
5. Si le fichier local existe, il prend la priorité

### Workflow recommandé :

```bash
# 1. Installer les dépendances (une seule fois)
npm install

# 2. Créer votre fichier .env avec vos clés
cp .env.example .env
# Puis éditez .env avec vos vraies clés

# 3. Générer la configuration
npm run setup

# 4. Ouvrir l'application dans le navigateur
# Ouvrez simplement index.html ou utilisez:
npm run dev  # Lance un serveur local
```

### Avantages :

- ✅ Utilise un fichier `.env` standard
- ✅ Vos clés ne sont jamais commitées dans Git
- ✅ Le fichier `.env` est dans `.gitignore`
- ✅ Le script génère automatiquement la config JavaScript
- ✅ Facile à utiliser et à partager avec l'équipe

### Sécurité :

- ✅ Vos clés ne sont jamais commitées dans Git
- ✅ Le fichier `.gitignore` protège automatiquement vos clés
- ✅ Chaque développeur crée son propre fichier local
- ✅ Le fichier d'exemple (`supabase-config.local.js.example`) peut être versionné sans problème
