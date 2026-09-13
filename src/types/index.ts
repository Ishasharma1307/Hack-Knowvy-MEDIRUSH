export type UrgencyLevel = 'normal' | 'urgent' | 'emergency';

export interface MedicineItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string; // e.g. "strip", "tablet", "bottle", "box", "pack"
  dosage?: string;
  urgency: UrgencyLevel;
  notes?: string;
}

export interface StructuredMedicineRequest {
  medicines: {
    name: string;
    quantity: number;
    unit: string;
  }[];
  urgency: UrgencyLevel;
  user_note: string;
}


export interface PharmacyStockItem {
  name: string;
  normalizedName: string;
  inStock: boolean;
  quantityAvailable: number;
  unitPrice: number;
}

export interface Pharmacy {
  id: string;
  name: string;
  brand: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  prepTimeMin: number;
  deliveryTimeMin: number; // calculated delivery time from distance
  totalEtaMin: number;    // prepTimeMin + deliveryTimeMin
  isOpen: boolean;
  rating: number;
  phone: string;
  tagline: string;
  inventory: PharmacyStockItem[];
}

export interface PharmacyContribution {
  pharmacy: Pharmacy;
  medicinesCovered: MedicineItem[];
  prepTimeMin: number;
  deliveryTimeMin: number;
  totalEtaMin: number;
  subtotal: number;
}

export interface FulfilmentPlan {
  planId: string;
  selectedPharmacies: PharmacyContribution[];
  allCovered: boolean;
  coveredMedicines: MedicineItem[];
  uncoveredMedicines: MedicineItem[];
  estimatedTotalTimeMin: number; // In parallel multi-courier dispatch, max of ETAs + buffer
  totalDistanceKm: number;
  totalCost: number;
  pharmacyCount: number;
  efficiencyScore: number;
  aiExplanation?: string;
}

export interface SinglePharmacyBenchmark {
  pharmacy: Pharmacy | null;
  medicinesCovered: MedicineItem[];
  missingMedicines: MedicineItem[];
  estimatedTimeMin: number;
  timeSavedMin: number;
  speedupPercentage: number;
  isComplete: boolean;
}

export interface ComparisonResult {
  smartPlan: FulfilmentPlan;
  singleBenchmark: SinglePharmacyBenchmark;
  timeSavedMin: number;
  speedupPercentage: number;
  whyBetter: string;
}

export interface OrderTrackingStep {
  id: string;
  title: string;
  subtitle: string;
  completed: boolean;
  timestamp: string;
}

export interface OrderState {
  orderId: string;
  createdAt: string;
  medicines: MedicineItem[];
  plan: FulfilmentPlan;
  status: 'routing_complete' | 'preparing' | 'dispatched' | 'delivered';
  currentStep: number;
  couriers: {
    pharmacyName: string;
    courierName: string;
    phone: string;
    status: string;
    etaMinutes: number;
    vehicle: string;
  }[];
}

export interface SamplePrescription {
  id: string;
  title: string;
  description: string;
  urgency: UrgencyLevel;
  rawText: string;
  medicines: MedicineItem[];
}
