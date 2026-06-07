-- V3.0 Yangilanishlari (Omad g'ildiragi, Promokodlar, Rassilka, Banners, VIP)

-- 1. Promokodlar jadvali
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    discount NUMERIC NOT NULL,
    is_percent BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(store_id, code)
);

-- 2. Bannerlar (Stories) jadvali
CREATE TABLE IF NOT EXISTS banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    link_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Mijozlar jadvaliga yangi ustunlar (VIP va G'ildirak uchun)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_spent NUMERIC DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_spin TIMESTAMP WITH TIME ZONE;

-- 4. RLS qoidalari
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promo codes public" ON promo_codes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Banners public" ON banners FOR ALL USING (true) WITH CHECK (true);
