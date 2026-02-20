import { useState } from 'react';
import { Truck, Plus, Lock, Unlock } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Layout } from '@/components/Layout';
import { SortableSupplierCard } from '@/components/SortableSupplierCard';
import { SupplierDialog } from '@/components/SupplierDialog';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { useSuppliers, useCreateSupplier, useUpdateSupplierOrder } from '@/hooks/useSuppliers';
import { useDraftOrders } from '@/hooks/useOrders';
import { toast } from 'sonner';

export default function Suppliers() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const { data: draftOrders = [] } = useDraftOrders();
  const createSupplier = useCreateSupplier();
  const updateSupplierOrder = useUpdateSupplierOrder();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Count orders per supplier
  const orderCountBySupplier = draftOrders.reduce((acc, order) => {
    acc[order.supplier_id] = (acc[order.supplier_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort suppliers: those with open orders first, then by sort_order
  const sortedSuppliers = [...suppliers].sort((a, b) => {
    const aHasOrders = orderCountBySupplier[a.id] || 0;
    const bHasOrders = orderCountBySupplier[b.id] || 0;
    
    // Suppliers with orders come first
    if (aHasOrders > 0 && bHasOrders === 0) return -1;
    if (bHasOrders > 0 && aHasOrders === 0) return 1;
    
    // Then sort by sort_order
    return (a.sort_order || 0) - (b.sort_order || 0);
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedSuppliers.findIndex(s => s.id === active.id);
      const newIndex = sortedSuppliers.findIndex(s => s.id === over.id);
      
      const newSuppliers = arrayMove(sortedSuppliers, oldIndex, newIndex);
      
      // Update sort_order for all suppliers
      const updates = newSuppliers.map((s, index) => ({
        id: s.id,
        sort_order: index,
      }));
      
      updateSupplierOrder.mutate(updates);
    }
  };

  const handleCreateSupplier = async (data: { name: string; email?: string; phone?: string }) => {
    console.log('[Suppliers] handleCreateSupplier - Starting with data:', data);
    try {
      const result = await createSupplier.mutateAsync(data);
      console.log('[Suppliers] handleCreateSupplier - Success:', result);
      toast.success('Ο προμηθευτής δημιουργήθηκε');
    } catch (error: any) {
      console.error('[Suppliers] handleCreateSupplier - Error:', error);
      console.error('[Suppliers] handleCreateSupplier - Error message:', error?.message);
      const errorMessage = error?.message || 'Σφάλμα κατά τη δημιουργία';
      toast.error(`Σφάλμα κατά τη δημιουργία: ${errorMessage}`);
      throw error;
    }
  };

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Προμηθευτές</h1>
            <p className="text-muted-foreground mt-1">
              {suppliers.length} καταχωρημένοι προμηθευτές
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Κλείδωμα
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Επεξεργασία
                </>
              )}
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Νέος
            </Button>
          </div>
        </div>

        {/* Suppliers List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="order-card h-20 animate-pulse bg-muted" />
            ))}
          </div>
        ) : suppliers.length > 0 ? (
          isEditMode ? (
            // Edit mode: drag-drop enabled
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedSuppliers.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {sortedSuppliers.map((supplier) => (
                    <SortableSupplierCard
                      key={supplier.id}
                      supplier={supplier}
                      orderCount={orderCountBySupplier[supplier.id] || 0}
                      isDragEnabled={true}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            // Normal mode: no drag-drop
            <div className="space-y-2">
              {sortedSuppliers.map((supplier) => (
                <SortableSupplierCard
                  key={supplier.id}
                  supplier={supplier}
                  orderCount={orderCountBySupplier[supplier.id] || 0}
                  isDragEnabled={false}
                />
              ))}
            </div>
          )
        ) : (
          <EmptyState
            icon={Truck}
            title="Δεν υπάρχουν προμηθευτές"
            description="Δημιουργήστε τον πρώτο σας προμηθευτή"
            action={
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Νέος Προμηθευτής
              </Button>
            }
          />
        )}
      </div>

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateSupplier}
        isLoading={createSupplier.isPending}
      />
    </Layout>
  );
}
