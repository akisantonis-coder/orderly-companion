-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  unit TEXT NOT NULL DEFAULT 'τεμ',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table (temporary/draft orders)
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for now - can restrict later with auth)
CREATE POLICY "Allow public read access to suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Allow public insert to suppliers" ON public.suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to suppliers" ON public.suppliers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to suppliers" ON public.suppliers FOR DELETE USING (true);

CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert to products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to products" ON public.products FOR DELETE USING (true);

CREATE POLICY "Allow public read access to orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert to orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to orders" ON public.orders FOR DELETE USING (true);

CREATE POLICY "Allow public read access to order_items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert to order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to order_items" ON public.order_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to order_items" ON public.order_items FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_products_supplier ON public.products(supplier_id);
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_orders_supplier ON public.orders(supplier_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

-- Insert sample suppliers
INSERT INTO public.suppliers (name, email, phone) VALUES
  ('Γαλακτοκομικά Δημητρίου', 'info@dimitriou.gr', '2101234567'),
  ('Αρτοποιεία Παπαδόπουλος', 'orders@papadopoulos.gr', '2107654321'),
  ('Κρεοπωλείο Νίκου', 'nikou@meat.gr', '2109876543'),
  ('Λαχανικά Μαρίας', 'maria@vegetables.gr', '2105551234'),
  ('Ποτά & Αναψυκτικά ΑΕ', 'sales@drinks.gr', '2108889999');

-- Insert sample products
INSERT INTO public.products (name, supplier_id, unit) VALUES
  ('Γάλα Φρέσκο 1L', (SELECT id FROM public.suppliers WHERE name = 'Γαλακτοκομικά Δημητρίου'), 'τεμ'),
  ('Φέτα ΠΟΠ 400γρ', (SELECT id FROM public.suppliers WHERE name = 'Γαλακτοκομικά Δημητρίου'), 'τεμ'),
  ('Γιαούρτι Στραγγιστό 1kg', (SELECT id FROM public.suppliers WHERE name = 'Γαλακτοκομικά Δημητρίου'), 'κιβ'),
  ('Κασέρι 500γρ', (SELECT id FROM public.suppliers WHERE name = 'Γαλακτοκομικά Δημητρίου'), 'τεμ'),
  ('Ψωμί Χωριάτικο', (SELECT id FROM public.suppliers WHERE name = 'Αρτοποιεία Παπαδόπουλος'), 'τεμ'),
  ('Τσουρέκι 500γρ', (SELECT id FROM public.suppliers WHERE name = 'Αρτοποιεία Παπαδόπουλος'), 'τεμ'),
  ('Κουλούρια Θεσσαλονίκης (συσκ. 10 τεμ)', (SELECT id FROM public.suppliers WHERE name = 'Αρτοποιεία Παπαδόπουλος'), 'κιβ'),
  ('Μοσχαρίσιος Κιμάς', (SELECT id FROM public.suppliers WHERE name = 'Κρεοπωλείο Νίκου'), 'kg'),
  ('Κοτόπουλο Ολόκληρο', (SELECT id FROM public.suppliers WHERE name = 'Κρεοπωλείο Νίκου'), 'τεμ'),
  ('Μπριζόλες Χοιρινές', (SELECT id FROM public.suppliers WHERE name = 'Κρεοπωλείο Νίκου'), 'kg'),
  ('Λουκάνικα Χωριάτικα', (SELECT id FROM public.suppliers WHERE name = 'Κρεοπωλείο Νίκου'), 'kg'),
  ('Ντομάτες Εγχώριες', (SELECT id FROM public.suppliers WHERE name = 'Λαχανικά Μαρίας'), 'κιβ'),
  ('Πατάτες', (SELECT id FROM public.suppliers WHERE name = 'Λαχανικά Μαρίας'), 'kg'),
  ('Κρεμμύδια Ξερά', (SELECT id FROM public.suppliers WHERE name = 'Λαχανικά Μαρίας'), 'kg'),
  ('Αγγούρια', (SELECT id FROM public.suppliers WHERE name = 'Λαχανικά Μαρίας'), 'κιβ'),
  ('Μαρούλια', (SELECT id FROM public.suppliers WHERE name = 'Λαχανικά Μαρίας'), 'τεμ'),
  ('Coca-Cola 330ml (συσκ. 24 τεμ)', (SELECT id FROM public.suppliers WHERE name = 'Ποτά & Αναψυκτικά ΑΕ'), 'παλ'),
  ('Νερό Εμφιαλωμένο 500ml (συσκ. 24)', (SELECT id FROM public.suppliers WHERE name = 'Ποτά & Αναψυκτικά ΑΕ'), 'κιβ'),
  ('Πορτοκαλάδα 1.5L', (SELECT id FROM public.suppliers WHERE name = 'Ποτά & Αναψυκτικά ΑΕ'), 'κιβ'),
  ('Μπύρα Lager 330ml (συσκ. 24)', (SELECT id FROM public.suppliers WHERE name = 'Ποτά & Αναψυκτικά ΑΕ'), 'κιβ');