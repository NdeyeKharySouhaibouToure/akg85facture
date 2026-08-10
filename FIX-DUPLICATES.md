# Correction des IDs en double

## Problème

Vous avez des factures avec le même numéro (ex: deux factures avec `FAC-102`). C'est un problème car chaque facture doit avoir un numéro unique.

## Solution

### Option 1 : Script automatique (Recommandé)

1. **Ouvrez votre site Vercel** sur votre téléphone ou ordinateur
2. **Ouvrez la console du navigateur** (F12 ou outils développeur)
3. **Copiez-collez ce code** dans la console :

```javascript
// Fonction pour corriger les IDs en double
async function fixDuplicateInvoiceIds() {
    if (!app.useSupabase || !app.supabaseClient) {
        console.error('Supabase n\'est pas configuré');
        return;
    }

    console.log('🔍 Recherche des factures avec des IDs en double...');
    
    try {
        // Récupérer toutes les factures
        const { data: invoices, error } = await app.supabaseClient
            .from('invoices')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Erreur lors de la récupération:', error);
            return;
        }

        console.log(`📋 ${invoices.length} facture(s) trouvée(s)`);

        // Grouper par ID pour trouver les doublons
        const idGroups = {};
        invoices.forEach(inv => {
            if (!idGroups[inv.id]) {
                idGroups[inv.id] = [];
            }
            idGroups[inv.id].push(inv);
        });

        // Trouver les IDs en double
        const duplicates = Object.entries(idGroups).filter(([id, group]) => group.length > 1);
        
        if (duplicates.length === 0) {
            console.log('✅ Aucun doublon trouvé !');
            return;
        }

        console.log(`⚠️ ${duplicates.length} ID(s) en double trouvé(s):`);
        duplicates.forEach(([id, group]) => {
            console.log(`  - ${id}: ${group.length} facture(s)`);
        });

        // Corriger les doublons
        let fixedCount = 0;
        const existingIds = new Set(invoices.map(inv => inv.id));

        for (const [duplicateId, group] of duplicates) {
            // Garder la première facture avec l'ID original
            const firstInvoice = group[0];
            console.log(`\n📝 Correction de ${duplicateId}:`);
            console.log(`   ✓ Garde: ${firstInvoice.client_name} (${firstInvoice.id})`);

            // Corriger les autres factures
            for (let i = 1; i < group.length; i++) {
                const invoice = group[i];
                let newId;
                let num = 1;

                // Trouver un nouvel ID disponible
                do {
                    const paddedNum = String(num).padStart(3, '0');
                    newId = `FAC-${paddedNum}`;
                    num++;
                } while (existingIds.has(newId));

                existingIds.add(newId);

                console.log(`   ↻ Change: ${invoice.client_name} (${invoice.id} → ${newId})`);

                // Mettre à jour dans Supabase
                const { error: updateError } = await app.supabaseClient
                    .from('invoices')
                    .update({ id: newId, number: newId })
                    .eq('id', invoice.id);

                if (updateError) {
                    console.error(`   ❌ Erreur pour ${invoice.id}:`, updateError);
                } else {
                    fixedCount++;
                    console.log(`   ✅ ${invoice.id} → ${newId}`);
                }
            }
        }

        console.log(`\n✅ Correction terminée: ${fixedCount} facture(s) corrigée(s)`);
        console.log('🔄 Rechargez la page pour voir les changements');

    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

// Exécuter la correction
fixDuplicateInvoiceIds();
```

4. **Appuyez sur Entrée** pour exécuter
5. **Regardez les logs** dans la console pour voir les corrections
6. **Rechargez la page** pour voir les changements

### Option 2 : Correction manuelle dans Supabase

1. Allez sur votre projet Supabase
2. **Table Editor** → **invoices**
3. Trouvez les factures avec des IDs en double
4. Modifiez manuellement les IDs pour qu'ils soient uniques
5. Assurez-vous que le champ `number` correspond à l'`id`

## Prévention

La fonction `generateId()` a été corrigée pour :
- ✅ Vérifier tous les IDs existants (locaux + Supabase)
- ✅ Trouver automatiquement le prochain numéro disponible
- ✅ Garantir l'unicité même si plusieurs factures sont créées simultanément

Les nouvelles factures créées après cette correction auront automatiquement des numéros uniques.
