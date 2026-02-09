-- Add unit column to order_items for temporary unit per order
ALTER TABLE public.order_items 
ADD COLUMN unit TEXT NOT NULL DEFAULT 'τεμ';

-- Add sort_order column to suppliers for drag-drop ordering
ALTER TABLE public.suppliers 
ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Update existing suppliers to have sequential sort_order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) - 1 as new_order
  FROM public.suppliers
)
UPDATE public.suppliers
SET sort_order = numbered.new_order
FROM numbered
WHERE public.suppliers.id = numbered.id;