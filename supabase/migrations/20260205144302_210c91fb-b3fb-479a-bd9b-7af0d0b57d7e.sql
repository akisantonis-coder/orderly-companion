-- Drop all existing public policies for suppliers
DROP POLICY IF EXISTS "Allow public read access to suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow public insert to suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow public update to suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow public delete to suppliers" ON suppliers;

-- Drop all existing public policies for products
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
DROP POLICY IF EXISTS "Allow public insert to products" ON products;
DROP POLICY IF EXISTS "Allow public update to products" ON products;
DROP POLICY IF EXISTS "Allow public delete to products" ON products;

-- Drop all existing public policies for orders
DROP POLICY IF EXISTS "Allow public read access to orders" ON orders;
DROP POLICY IF EXISTS "Allow public insert to orders" ON orders;
DROP POLICY IF EXISTS "Allow public update to orders" ON orders;
DROP POLICY IF EXISTS "Allow public delete to orders" ON orders;

-- Drop all existing public policies for order_items
DROP POLICY IF EXISTS "Allow public read access to order_items" ON order_items;
DROP POLICY IF EXISTS "Allow public insert to order_items" ON order_items;
DROP POLICY IF EXISTS "Allow public update to order_items" ON order_items;
DROP POLICY IF EXISTS "Allow public delete to order_items" ON order_items;

-- Create authenticated-only policies for suppliers
CREATE POLICY "Authenticated users can read suppliers" 
  ON suppliers FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert suppliers" 
  ON suppliers FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update suppliers" 
  ON suppliers FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete suppliers" 
  ON suppliers FOR DELETE 
  TO authenticated
  USING (true);

-- Create authenticated-only policies for products
CREATE POLICY "Authenticated users can read products" 
  ON products FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products" 
  ON products FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products" 
  ON products FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete products" 
  ON products FOR DELETE 
  TO authenticated
  USING (true);

-- Create authenticated-only policies for orders
CREATE POLICY "Authenticated users can read orders" 
  ON orders FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert orders" 
  ON orders FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders" 
  ON orders FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete orders" 
  ON orders FOR DELETE 
  TO authenticated
  USING (true);

-- Create authenticated-only policies for order_items
CREATE POLICY "Authenticated users can read order_items" 
  ON order_items FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert order_items" 
  ON order_items FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update order_items" 
  ON order_items FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete order_items" 
  ON order_items FOR DELETE 
  TO authenticated
  USING (true);