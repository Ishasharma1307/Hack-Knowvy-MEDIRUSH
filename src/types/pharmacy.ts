export interface PharmacyInventoryItem {
  medicineName: string;
  normalizedMedicineName: string;
  availableQuantity: number;
  unit: string;
  unitPrice?: number;
}

export interface Pharmacy {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  open: boolean;
  preparationTimeMinutes: number;
  deliveryTimeMinutes: number;
  rating?: number;
  phone?: string;
  tagline?: string;
  inventory: PharmacyInventoryItem[];
}

export interface DemoLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export interface NearbyPharmacyCandidate {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  distanceKm: number;
  placeId?: string;
  open: boolean;
}

export interface NearbyPharmacyProvider {
  findNearbyPharmacies(location: { latitude: number; longitude: number }): Promise<NearbyPharmacyCandidate[]>;
}
