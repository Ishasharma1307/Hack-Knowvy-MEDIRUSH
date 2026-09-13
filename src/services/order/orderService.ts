import { Order, OrderItem, CreateOrderParams } from '../../types/order';
import { isSupabaseConfigured, supabaseInstance } from '../supabase/client';
import { calculateDistanceKm } from '../../utils/distance';

const ORDERS_STORAGE_KEY = 'medirush_orders';

/**
 * Generates a clean, sequential, business-formatted Order ID.
 * Format: MR-YYYYMMDD-001
 */
function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Track sequence count in localStorage
  let count = 1;
  try {
    const existing = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (existing) {
      const orders: Order[] = JSON.parse(existing);
      const todayOrders = orders.filter((o) => o.orderNumber.startsWith(`MR-${dateStr}`));
      count = todayOrders.length + 1;
    }
  } catch (_e) {
    count = 1;
  }

  return `MR-${dateStr}-${String(count).padStart(3, '0')}`;
}

/**
 * Creates and persists a verified MediRush medicine order.
 * Follows the strict MVP lifecycle: initial status is "confirmed".
 */
export async function createMedicineOrder(params: CreateOrderParams): Promise<Order> {
  const {
    userLocation,
    medicines,
    selectedPharmacy,
    source,
    urgency = 'urgent',
    candidatesChecked,
    whyThisPharmacy,
  } = params;

  const orderNumber = generateOrderNumber();
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const distanceKm = Math.round(
    calculateDistanceKm(
      userLocation.latitude,
      userLocation.longitude,
      selectedPharmacy.latitude,
      selectedPharmacy.longitude
    ) * 10
  ) / 10;

  const prepTime = selectedPharmacy.preparationTimeMinutes || 5;
  const deliveryTime = selectedPharmacy.deliveryTimeMinutes || Math.max(6, Math.round(distanceKm * 2.5));
  const fulfilmentTime = prepTime + deliveryTime;

  // Build order items
  const orderItems: OrderItem[] = medicines.map((med, idx) => ({
    id: `item_${orderId}_${idx + 1}`,
    orderId,
    medicineName: med.name,
    strength: (med as any).strength || undefined,
    quantity: med.quantity || 1,
    unit: med.unit || 'strip',
    unitPrice: 35, // standard reference
    status: 'confirmed',
  }));

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    userId: null,
    status: 'confirmed',
    source,
    pharmacyId: selectedPharmacy.id,
    pharmacyName: selectedPharmacy.name,
    pharmacyAddress: selectedPharmacy.address,
    pharmacyDistanceKm: distanceKm,
    totalMedicines: medicines.length,
    medicinesCovered: medicines.length,
    items: orderItems,
    estimatedPreparationMinutes: prepTime,
    estimatedDeliveryMinutes: deliveryTime,
    estimatedFulfilmentMinutes: fulfilmentTime,
    userLocation,
    urgency,
    whyThisPharmacy,
    candidatesChecked,
    createdAt: new Date().toISOString(),
  };

  // 1. Persist to local storage
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    const list: Order[] = raw ? JSON.parse(raw) : [];
    list.unshift(newOrder);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('[MediRush Order] Failed to save order to localStorage:', err);
  }

  // 2. Persist to Supabase if configured
  if (isSupabaseConfigured() && supabaseInstance) {
    try {
      await supabaseInstance.from('orders').insert({
          id: newOrder.id,
          order_number: newOrder.orderNumber,
          status: newOrder.status,
          source: newOrder.source,
          pharmacy_id: newOrder.pharmacyId,
          pharmacy_name: newOrder.pharmacyName,
          total_medicines: newOrder.totalMedicines,
          estimated_fulfilment_minutes: newOrder.estimatedFulfilmentMinutes,
          user_latitude: newOrder.userLocation.latitude,
          user_longitude: newOrder.userLocation.longitude,
          created_at: newOrder.createdAt,
        });

        await supabaseInstance.from('order_items').insert(
          orderItems.map((item) => ({
            id: item.id,
            order_id: item.orderId,
            medicine_name: item.medicineName,
            strength: item.strength || null,
            quantity: item.quantity,
            unit: item.unit,
            status: item.status,
          }))
        );
    } catch (dbErr) {
      console.warn('[MediRush Order] Supabase persistence skipped or failed:', dbErr);
    }
  }

  return newOrder;
}

/**
 * Retrieves past orders from storage.
 */
export function getSavedOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_err) {
    return [];
  }
}
