# Guide de débogage Supabase

## Problème : Les factures créées sur mobile ne sont pas sauvegardées dans Supabase

### Étapes de diagnostic

#### 1. Vérifier la console du navigateur sur mobile

Sur votre téléphone, ouvrez l'application et suivez ces étapes :

1. **Ouvrir les outils de développement** :
   - **Chrome Android** : Connectez votre téléphone en USB, activez le débogage USB, puis dans Chrome sur PC : `chrome://inspect`
   - **Safari iOS** : Sur Mac, connectez l'iPhone, puis dans Safari : Développement > [Votre iPhone] > [Page web]
   - **Alternative** : Utilisez [Eruda](https://github.com/liriliri/eruda) - ajoutez ce script temporairement dans `index.html` :
     ```html
     <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
     <script>eruda.init();</script>
     ```

2. **Créer une nouvelle facture** et regarder les logs dans la console.

#### 2. Logs à vérifier

Vous devriez voir ces messages dans l'ordre :

**Au chargement de la page :**
```
[Supabase] Initialisation du client Supabase...
[Supabase] supabase disponible: true
[Supabase] URL valide: true ✓
[Supabase] Clé valide: true ✓
[Supabase] ✓ Client Supabase initialisé avec succès
[App] Chargement des données - useSupabase: true
[Supabase] ✓ Données reçues: X facture(s)
```

**Lors de la création d'une facture :**
```
[Save Invoice] Tentative de sauvegarde dans Supabase pour: FAC-XXX
[Supabase Save] Début de la sauvegarde de la facture: FAC-XXX
[Supabase Save] useSupabase: true
[Supabase Save] supabaseClient: ✓ Disponible
[Supabase Save] 💾 Données à sauvegarder: {...}
[Supabase Save] Exécution de upsert...
[Supabase Save] ✅ Facture sauvegardée avec succès dans Supabase: FAC-XXX
```

#### 3. Erreurs possibles et solutions

##### Erreur : "Supabase non configuré ou client non disponible"

**Cause** : Le client Supabase n'est pas initialisé.

**Solutions** :
- Vérifiez que `window.supabaseConfig` est défini dans la console
- Vérifiez que les variables d'environnement sont bien configurées sur Vercel
- Redéployez l'application après avoir configuré les variables

##### Erreur : "new row violates row-level security policy"

**Cause** : Les RLS (Row Level Security) policies dans Supabase bloquent l'insertion.

**Solution** : Exécutez ce SQL dans Supabase :

```sql
-- Vérifier que RLS est activé
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'invoices';

-- Si RLS bloque, vérifiez les policies
SELECT * FROM pg_policies WHERE tablename = 'invoices';

-- Si nécessaire, créer/modifier la policy pour permettre l'insertion
DROP POLICY IF EXISTS "Allow all operations on invoices" ON invoices;
CREATE POLICY "Allow all operations on invoices" ON invoices
    FOR ALL USING (true) WITH CHECK (true);
```

##### Erreur : "permission denied for table invoices"

**Cause** : L'utilisateur anonyme n'a pas les permissions nécessaires.

**Solution** : Dans Supabase, allez dans :
1. **Authentication** → **Policies**
2. Vérifiez que la table `invoices` a une policy qui permet l'insertion pour `anon` (utilisateur anonyme)

##### Erreur : "invalid input syntax for type jsonb"

**Cause** : Le format des `items` n'est pas valide JSON.

**Solution** : Vérifiez que `invoice.items` est un tableau JSON valide dans les logs.

#### 4. Vérifier dans Supabase

1. Allez sur votre projet Supabase
2. **Table Editor** → **invoices**
3. Vérifiez si la nouvelle facture apparaît
4. Si elle n'apparaît pas, regardez les **Logs** dans Supabase pour voir les erreurs

#### 5. Test rapide

Pour tester rapidement si Supabase fonctionne, ouvrez la console du navigateur et exécutez :

```javascript
// Vérifier la configuration
console.log('Config:', window.supabaseConfig);
console.log('Client:', app.supabaseClient);
console.log('useSupabase:', app.useSupabase);

// Tester une insertion manuelle
if (app.useSupabase && app.supabaseClient) {
    const testInvoice = {
        id: 'TEST-' + Date.now(),
        number: 'TEST-' + Date.now(),
        client_name: 'Test Client',
        date: new Date().toISOString().split('T')[0],
        items: [{ designation: 'Test', quantity: 1, unitPrice: 100, total: 100 }],
        subtotal: 100,
        total: 100,
        status: 'PENDING'
    };
    
    app.supabaseClient
        .from('invoices')
        .upsert(testInvoice)
        .then(({ data, error }) => {
            if (error) {
                console.error('Erreur test:', error);
            } else {
                console.log('✅ Test réussi!', data);
            }
        });
}
```

### Solution temporaire

Si Supabase ne fonctionne toujours pas, les factures sont sauvegardées dans `localStorage` comme fallback. Vous pouvez les récupérer en exécutant dans la console :

```javascript
const invoices = JSON.parse(localStorage.getItem('akg85_invoices') || '[]');
console.log('Factures dans localStorage:', invoices);
```

Puis les migrer manuellement vers Supabase une fois le problème résolu.
