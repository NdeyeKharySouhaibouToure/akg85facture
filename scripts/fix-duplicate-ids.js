// Script pour corriger les IDs en double dans Supabase
// À exécuter dans la console du navigateur sur votre site Vercel

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
