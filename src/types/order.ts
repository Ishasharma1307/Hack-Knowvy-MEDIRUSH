import { MedicineItem, UrgencyLevel } from './index';
import { DemoLocation, Pharmacy } from './pharmacy';

export type OrderStatus = 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered';
export type OrderSource = 'manual' | 'prescription';

export interface OrderItem {
  id: string;
  orderId: string;
  medicineName: string;
  strength?: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  status: 'confirmed' | 'out_of_stock';
}

export interface PharmacyCandidateEvaluation {
  candidateId?: string;
  candidateName?: string;
  id?: string;
  name?: string;
  address: string;
  distanceKm: number;
  open: boolean;
  medicinesAvailableCount: number;
  totalMedicinesRequestedCount: number;
  isComplete: boolean;
  status: 'SELECTED' | 'Eligible' | 'Not eligible';
  missingMedicines: string[];
  preparationTimeMinutes: number;
  deliveryTimeMinutes: number;
  totalTimeMinutes: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  status: OrderStatus;
  source: OrderSource;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacyDistanceKm: number;
  totalMedicines: number;
  medicinesCovered: number;
  items: OrderItem[];
  estimatedPreparationMinutes: number;
  estimatedDeliveryMinutes: number;
  estimatedFulfilmentMinutes: number;
  userLocation: DemoLocation;
  urgency: UrgencyLevel;
  whyThisPharmacy: string;
  candidatesChecked: PharmacyCandidateEvaluation[];
  createdAt: string;
}

export interface CreateOrderParams {
  userLocation: DemoLocation;
  medicines: MedicineItem[];
  selectedPharmacy: Pharmacy;
  source: OrderSource;
  urgency?: UrgencyLevel;
  candidatesChecked: PharmacyCandidateEvaluation[];
  whyThisPharmacy: string;
}
