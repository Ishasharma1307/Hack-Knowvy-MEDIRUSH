import { UrgencyLevel } from '../../types';
import { DemoLocation, Pharmacy } from '../../types/pharmacy';

export interface RequestedMedicine {
  name: string;
  quantity: number;
  unit: string;
}

export interface EngineInput {
  medicines: RequestedMedicine[];
  urgency: UrgencyLevel;
  userLocation?: DemoLocation;
}

export interface MedicineAllocation {
  medicineName: string;
  quantity: number;
  unit: string;
  pharmacyId: string;
  pharmacyName: string;
}

export interface PharmacyFulfilmentSegment {
  pharmacyId: string;
  pharmacyName: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  preparationTimeMinutes: number;
  deliveryTimeMinutes: number;
  totalTimeMinutes: number; // prep + delivery
  allocatedMedicines: RequestedMedicine[];
}

export interface FulfilmentPlan {
  planId: string;
  allMedicinesCovered: boolean;
  medicinesCoveredCount: number;
  totalMedicinesRequestedCount: number;
  pharmacies: PharmacyFulfilmentSegment[];
  allocations: MedicineAllocation[];
  estimatedCompletionMinutes: number;
  coordinationPenaltyMinutes: number;
  totalDistanceKm: number;
  pharmacyCount: number;
  score: number;
  explanation: string;
  missingMedicines: string[];
}

export interface SinglePharmacyBaseline {
  pharmacy: Pharmacy | null;
  canFulfillAll: boolean;
  medicinesCoveredCount: number;
  totalMedicinesRequestedCount: number;
  coveredMedicines: RequestedMedicine[];
  missingMedicines: string[];
  estimatedCompletionMinutes: number;
  timeSavedMinutes: number;
  distanceKm: number;
}

export interface EngineResult {
  status: 'success' | 'no_complete_plan' | 'empty_request';
  bestPlan: FulfilmentPlan | null;
  baseline: SinglePharmacyBaseline | null;
  timeSavedMinutes: number;
  speedupPercentage: number;
  missingMedicines: string[];
  whyThisCombination: string;
  topPlans?: FulfilmentPlan[];
}

