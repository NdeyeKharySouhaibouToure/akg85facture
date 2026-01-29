-- Schéma Supabase pour l'application de facturation AKG 85
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Table des paramètres (settings)
-- Utilise un ID fixe 'default' pour un seul enregistrement de paramètres
CREATE TABLE IF NOT EXISTS settings (
    user_id TEXT PRIMARY KEY DEFAULT 'default', -- Pour permettre plusieurs utilisateurs plus tard
    tax_rate DECIMAL(5,2) DEFAULT 18,
    currency TEXT DEFAULT 'FCFA',
    store_name TEXT,
    store_address TEXT[], -- Tableau pour plusieurs lignes d'adresse
    store_phone TEXT,
    store_email TEXT,
    store_logo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des factures
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY, -- Ex: FAC-001
    number TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT,
    client_email TEXT,
    client_address TEXT,
    date DATE NOT NULL,
    due_date DATE,
    items JSONB NOT NULL, -- Tableau d'articles
    subtotal DECIMAL(12,2) NOT NULL,
    discount_type TEXT DEFAULT 'FIXED', -- FIXED ou PERCENT
    discount_value DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'PENDING', -- PENDING, PAID, PARTIAL, CANCELLED, REFUNDED
    paid_amount DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_name ON invoices(client_name);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour updated_at
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Politique RLS (Row Level Security) - Pour permettre l'accès public pour l'instant
-- Vous pouvez activer RLS et créer des politiques plus tard si nécessaire
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Politiques pour permettre toutes les opérations (à modifier selon vos besoins de sécurité)
-- Note: Pour la production, créez des politiques basées sur l'authentification utilisateur
CREATE POLICY "Allow all operations on settings" ON settings
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on invoices" ON invoices
    FOR ALL USING (true) WITH CHECK (true);
