import { Pharmacy, DemoLocation } from '../../types/pharmacy';
import { PharmacyDataProvider } from './pharmacyProvider';
import { normalizeMedicineName } from '../../utils/medicineNormalization';

export const DEMO_USER_LOCATION: DemoLocation = {
  latitude: 12.9716,
  longitude: 77.5946,
  address: "Flat 402, Palm Grove Heights, Indiranagar, Bengaluru",
};

/**
 * High-fidelity demo pharmacy dataset.
 * Specifically calibrated to demonstrate:
 * 1. Multi-pharmacy combination beats single pharmacy on time
 * 2. Complete fulfilment requirement
 * 3. Inventory quantity constraints
 */
export const DEMO_PHARMACIES_DATA: Pharmacy[] = [
  {
    id: "pharm_citycare",
    name: "CityCare Pharmacy",
    address: "100ft Road, Indiranagar",
    latitude: 12.9782,
    longitude: 77.6408,
    open: true,
    preparationTimeMinutes: 4,
    deliveryTimeMinutes: 7,
    rating: 4.8,
    phone: "+91 80 4123 4567",
    tagline: "High-speed dispensing hub with express courier dispatch",
    inventory: [
      {
        medicineName: "Dolo 650",
        normalizedMedicineName: normalizeMedicineName("Dolo 650"),
        availableQuantity: 50,
        unit: "strip",
        unitPrice: 32,
      },
      {
        medicineName: "Pantoprazole",
        normalizedMedicineName: normalizeMedicineName("Pantoprazole"),
        availableQuantity: 30,
        unit: "strip",
        unitPrice: 75,
      },
      {
        medicineName: "Azithromycin",
        normalizedMedicineName: normalizeMedicineName("Azithromycin"),
        availableQuantity: 25,
        unit: "strip",
        unitPrice: 120,
      },
      {
        medicineName: "Paracetamol 500mg",
        normalizedMedicineName: normalizeMedicineName("Paracetamol 500mg"),
        availableQuantity: 80,
        unit: "strip",
        unitPrice: 20,
      },
    ],
  },
  {
    id: "pharm_quickcare",
    name: "QuickCare Pharmacy",
    address: "HAL 2nd Stage, Defence Colony",
    latitude: 12.9654,
    longitude: 77.6492,
    open: true,
    preparationTimeMinutes: 4,
    deliveryTimeMinutes: 8,
    rating: 4.9,
    phone: "+91 80 4789 0123",
    tagline: "Dedicated cold-chain & essential generic dispensary",
    inventory: [
      {
        medicineName: "ORS",
        normalizedMedicineName: normalizeMedicineName("ORS"),
        availableQuantity: 40,
        unit: "sachet",
        unitPrice: 22,
      },
      {
        medicineName: "Cetirizine",
        normalizedMedicineName: normalizeMedicineName("Cetirizine"),
        availableQuantity: 35,
        unit: "strip",
        unitPrice: 35,
      },
      {
        medicineName: "Dolo 650",
        normalizedMedicineName: normalizeMedicineName("Dolo 650"),
        availableQuantity: 2, // Low stock on purpose for quantity testing!
        unit: "strip",
        unitPrice: 34,
      },
      {
        medicineName: "Vitamin C 500mg",
        normalizedMedicineName: normalizeMedicineName("Vitamin C 500mg"),
        availableQuantity: 60,
        unit: "strip",
        unitPrice: 28,
      },
    ],
  },
  {
    id: "pharm_lifeline_mega",
    name: "LifeLine Mega Medicals",
    address: "Outer Ring Road Junction, Domlur",
    latitude: 12.9350,
    longitude: 77.6820,
    open: true,
    preparationTimeMinutes: 12,
    deliveryTimeMinutes: 18,
    rating: 4.6,
    phone: "+91 80 4999 8888",
    tagline: "Large central warehouse with comprehensive stock, high queuing delays",
    inventory: [
      {
        medicineName: "Dolo 650",
        normalizedMedicineName: normalizeMedicineName("Dolo 650"),
        availableQuantity: 200,
        unit: "strip",
        unitPrice: 32,
      },
      {
        medicineName: "Pantoprazole",
        normalizedMedicineName: normalizeMedicineName("Pantoprazole"),
        availableQuantity: 150,
        unit: "strip",
        unitPrice: 78,
      },
      {
        medicineName: "Azithromycin",
        normalizedMedicineName: normalizeMedicineName("Azithromycin"),
        availableQuantity: 100,
        unit: "strip",
        unitPrice: 125,
      },
      {
        medicineName: "ORS",
        normalizedMedicineName: normalizeMedicineName("ORS"),
        availableQuantity: 120,
        unit: "sachet",
        unitPrice: 24,
      },
      {
        medicineName: "Cetirizine",
        normalizedMedicineName: normalizeMedicineName("Cetirizine"),
        availableQuantity: 90,
        unit: "strip",
        unitPrice: 36,
      },
      {
        medicineName: "Amoxicillin 625mg",
        normalizedMedicineName: normalizeMedicineName("Amoxicillin 625mg"),
        availableQuantity: 80,
        unit: "strip",
        unitPrice: 180,
      },
    ],
  },
  {
    id: "pharm_healthfirst",
    name: "HealthFirst Pharmacy",
    address: "Old Airport Road, Kodihalli",
    latitude: 12.9610,
    longitude: 77.6520,
    open: true,
    preparationTimeMinutes: 6,
    deliveryTimeMinutes: 10,
    rating: 4.7,
    phone: "+91 80 4432 1098",
    tagline: "Neighborhood family medical store",
    inventory: [
      {
        medicineName: "Dolo 650",
        normalizedMedicineName: normalizeMedicineName("Dolo 650"),
        availableQuantity: 25,
        unit: "strip",
        unitPrice: 33,
      },
      {
        medicineName: "Pantoprazole",
        normalizedMedicineName: normalizeMedicineName("Pantoprazole"),
        availableQuantity: 20,
        unit: "strip",
        unitPrice: 76,
      },
      {
        medicineName: "Amoxicillin 625mg",
        normalizedMedicineName: normalizeMedicineName("Amoxicillin 625mg"),
        availableQuantity: 18,
        unit: "strip",
        unitPrice: 185,
      },
      {
        medicineName: "Ibuprofen 400mg",
        normalizedMedicineName: normalizeMedicineName("Ibuprofen 400mg"),
        availableQuantity: 30,
        unit: "strip",
        unitPrice: 25,
      },
    ],
  },
  {
    id: "pharm_sunrise",
    name: "Sunrise Medical Store",
    address: "Ulsoor Lake Road, Someshwarpura",
    latitude: 12.9840,
    longitude: 77.6210,
    open: true,
    preparationTimeMinutes: 7,
    deliveryTimeMinutes: 12,
    rating: 4.5,
    phone: "+91 80 4876 5432",
    tagline: "Local pharmacy specializing in respiratory and fever aids",
    inventory: [
      {
        medicineName: "ORS",
        normalizedMedicineName: normalizeMedicineName("ORS"),
        availableQuantity: 50,
        unit: "sachet",
        unitPrice: 20,
      },
      {
        medicineName: "Cetirizine",
        normalizedMedicineName: normalizeMedicineName("Cetirizine"),
        availableQuantity: 40,
        unit: "strip",
        unitPrice: 32,
      },
      {
        medicineName: "Montair-LC",
        normalizedMedicineName: normalizeMedicineName("Montair-LC"),
        availableQuantity: 25,
        unit: "strip",
        unitPrice: 165,
      },
      {
        medicineName: "Paracetamol 500mg",
        normalizedMedicineName: normalizeMedicineName("Paracetamol 500mg"),
        availableQuantity: 100,
        unit: "strip",
        unitPrice: 18,
      },
    ],
  },
  {
    id: "pharm_metrohealth",
    name: "MetroHealth Dispensary",
    address: "Cunningham Road, Vasanth Nagar",
    latitude: 12.9910,
    longitude: 77.5950,
    open: true,
    preparationTimeMinutes: 10,
    deliveryTimeMinutes: 15,
    rating: 4.7,
    phone: "+91 80 4555 1234",
    tagline: "Trauma and chronic disease prescription center",
    inventory: [
      {
        medicineName: "Azithromycin",
        normalizedMedicineName: normalizeMedicineName("Azithromycin"),
        availableQuantity: 30,
        unit: "strip",
        unitPrice: 122,
      },
      {
        medicineName: "Amoxicillin 625mg",
        normalizedMedicineName: normalizeMedicineName("Amoxicillin 625mg"),
        availableQuantity: 40,
        unit: "strip",
        unitPrice: 190,
      },
      {
        medicineName: "Metformin 500mg",
        normalizedMedicineName: normalizeMedicineName("Metformin 500mg"),
        availableQuantity: 100,
        unit: "strip",
        unitPrice: 42,
      },
      {
        medicineName: "Salbutamol Inhaler",
        normalizedMedicineName: normalizeMedicineName("Salbutamol Inhaler"),
        availableQuantity: 15,
        unit: "inhaler",
        unitPrice: 145,
      },
    ],
  },
];

export class DemoPharmacyProvider implements PharmacyDataProvider {
  private pharmacies: Pharmacy[];

  constructor(customData?: Pharmacy[]) {
    this.pharmacies = customData ? [...customData] : [...DEMO_PHARMACIES_DATA];
  }

  async getPharmacies(): Promise<Pharmacy[]> {
    // Return clone to ensure immutability
    return JSON.parse(JSON.stringify(this.pharmacies));
  }

  async getPharmacyById(id: string): Promise<Pharmacy | null> {
    const found = this.pharmacies.find(p => p.id === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }
}

// Export singleton instance for easy app-wide usage
export const demoPharmacyProvider = new DemoPharmacyProvider();
