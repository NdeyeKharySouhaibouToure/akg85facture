# Configuration Vercel pour Supabase

Ce guide explique comment configurer les variables d'environnement Supabase sur Vercel pour que l'application fonctionne correctement en production.

## Problème

Sur Vercel, le fichier `supabase-config.local.js` n'existe pas (il est dans `.gitignore`), donc l'application utilise les valeurs par défaut et Supabase n'est pas initialisé. Résultat : les factures ne sont pas chargées depuis Supabase.

## Solution

### 1. Configurer les variables d'environnement sur Vercel

1. Allez sur votre projet Vercel : https://vercel.com/dashboard
2. Sélectionnez votre projet `akg85facture`
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez les deux variables suivantes :

   - **Nom** : `SUPABASE_URL`
   - **Valeur** : Votre URL Supabase (ex: `https://xxxxx.supabase.co`)
   - **Environnements** : Production, Preview, Development (cochez tous)

   - **Nom** : `SUPABASE_ANON_KEY`
   - **Valeur** : Votre clé anonyme Supabase
   - **Environnements** : Production, Preview, Development (cochez tous)

### 2. Redéployer

Après avoir ajouté les variables d'environnement :

1. Allez dans **Deployments**
2. Cliquez sur les **3 points** (⋯) du dernier déploiement
3. Sélectionnez **Redeploy**
4. Vérifiez que les variables d'environnement sont bien sélectionnées
5. Cliquez sur **Redeploy**

### 3. Vérifier le build

Le script `scripts/build-vercel.js` génère automatiquement `supabase-config.local.js` à partir des variables d'environnement lors du build.

Vous pouvez vérifier dans les logs de build Vercel :
- `✓ Fichier supabase-config.local.js généré avec succès`
- `✓ Variables d'environnement Supabase détectées`

Si vous voyez un avertissement :
- `⚠️ ATTENTION: Les variables d'environnement Supabase ne sont pas configurées sur Vercel!`

Cela signifie que les variables ne sont pas correctement configurées.

### 4. Vérifier dans le navigateur

Une fois déployé, ouvrez la console du navigateur (F12) sur votre site Vercel. Vous devriez voir :

```
[Supabase] Initialisation du client Supabase...
[Supabase] URL valide: true ✓
[Supabase] Clé valide: true ✓
[Supabase] ✓ Client Supabase initialisé avec succès
[Supabase] ✓ Données reçues: 2 facture(s)
[Supabase] ✓ Factures chargées dans app.data.invoices: 2
```

Si vous voyez des erreurs ou des ✗, vérifiez :
1. Que les variables d'environnement sont bien configurées sur Vercel
2. Que vous avez redéployé après avoir ajouté les variables
3. Que les valeurs sont correctes (pas de caractères invisibles, pas d'espaces)

## Alternative : Utiliser NEXT_PUBLIC_*

Si vous préférez utiliser le préfixe `NEXT_PUBLIC_` (même si ce n'est pas une app Next.js), le script `build-vercel.js` les détecte aussi :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Dépannage

### Les factures ne se chargent toujours pas

1. **Vérifiez la console du navigateur** pour les logs `[Supabase]`
2. **Vérifiez les RLS policies** dans Supabase - assurez-vous que les politiques permettent la lecture (`SELECT`)
3. **Vérifiez les logs de build Vercel** pour voir si le fichier de configuration est généré
4. **Vérifiez que les variables d'environnement sont bien définies** dans Settings → Environment Variables

### Le fichier de configuration n'est pas généré

Le script `build-vercel.js` est exécuté automatiquement via `vercel.json`. Si ce n'est pas le cas :

1. Vérifiez que `vercel.json` existe à la racine du projet
2. Vérifiez que `scripts/build-vercel.js` existe
3. Vérifiez les logs de build Vercel pour les erreurs
