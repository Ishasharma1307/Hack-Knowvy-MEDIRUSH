import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pharmacy, MedicineItem, FulfilmentPlan } from '../../types';
import { DEMO_PHARMACIES } from '../../data/demoPharmacies';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export let supabaseInstance: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http')) {
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.warn('[MediRush Supabase] Failed to initialize Supabase client:', err);
  }
}

export const isSupabaseConfigured = (): boolean => {
  return !!supabaseInstance;
};

/**
 * Loads pharmacies from Supabase if table exists, otherwise gracefully defaults
 * to the demo pharmacy dataset.
 */
export async function getPharmacies(): Promise<Pharmacy[]> {
  if (!supabaseInstance) {
    return DEMO_PHARMACIES;
  }

  try {
    const { data, error } = await supabaseInstance
      .from('pharmacies')
      .select('*, pharmacy_inventory(*)');

    if (error || !data || data.length === 0) {
      console.log('[MediRush Supabase] Table empty or not configured. Using local demo pharmacy dataset.');
      return DEMO_PHARMACIES;
    }

    // Map database records to Pharmacy format
    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      brand: row.brand || 'Pharmacy Hub',
      address: row.address,
      lat: Number(row.latitude || row.lat),
      lng: Number(row.longitude || row.lng),
      distanceKm: Number(row.distance_km || 1.5),
      prepTimeMin: Number(row.prep_time_min || 5),
      deliveryTimeMin: Number(row.delivery_time_min || 10),
      totalEtaMin: Number((row.prep_time_min || 5) + (row.delivery_time_min || 10)),
      isOpen: row.is_open ?? true,
      rating: Number(row.rating || 4.8),
      phone: row.phone || '+91 98450 00000',
      tagline: row.tagline || 'Verified Network Pharmacy',
      inventory: (row.pharmacy_inventory || []).map((inv: any) => ({
        name: inv.medicine_name,
        normalizedName: inv.medicine_name.toLowerCase(),
        inStock: inv.in_stock ?? true,
        quantityAvailable: inv.quantity_available || 50,
        unitPrice: Number(inv.unit_price || 50),
      })),
    }));
  } catch (err) {
    console.warn('[MediRush Supabase] Error fetching pharmacies:', err);
    return DEMO_PHARMACIES;
  }
}

/**
 * Persists an order / medicine request for auditing and tracking
 */
export async function persistOrderRequest(
  medicines: MedicineItem[],
  plan: FulfilmentPlan
): Promise<{ orderId: string; persistedRemote: boolean }> {
  const orderId = `MDR-${Math.floor(100000 + Math.random() * 900000)}`;

  // Save to local cache first
  const orderRecord = {
    orderId,
    timestamp: new Date().toISOString(),
    medicines,
    plan,
  };
  localStorage.setItem(`order_${orderId}`, JSON.stringify(orderRecord));

  if (!supabaseInstance) {
    return { orderId, persistedRemote: false };
  }

  try {
    const { error } = await supabaseInstance.from('medicine_requests').insert([
      {
        id: orderId,
        items_count: medicines.length,
        pharmacies_count: plan.pharmacyCount,
        estimated_eta_min: plan.estimatedTotalTimeMin,
        total_cost: plan.totalCost,
        medicines_json: medicines,
        fulfilment_plan_json: plan,
        status: 'confirmed',
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.warn('[MediRush Supabase] Failed to write order to Supabase:', error.message);
      return { orderId, persistedRemote: false };
    }

    return { orderId, persistedRemote: true };
  } catch (err) {
    console.warn('[MediRush Supabase] Network issue persisting to Supabase:', err);
    return { orderId, persistedRemote: false };
  }
}
