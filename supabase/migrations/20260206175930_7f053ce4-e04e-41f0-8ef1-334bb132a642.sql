-- Add sort_order column to products for custom ordering
ALTER TABLE public.products 
ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Add index for efficient sorting
CREATE INDEX idx_products_sort_order ON public.products(supplier_id, sort_order);

-- Add sort_order column to order_items for ordering within orders
ALTER TABLE public.order_items 
ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Add index for efficient sorting
CREATE INDEX idx_order_items_sort_order ON public.order_items(order_id, sort_order);