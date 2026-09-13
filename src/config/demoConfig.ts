import { MedicineItem, UrgencyLevel, SamplePrescription } from '../types';
import { DemoLocation } from '../types/pharmacy';

export interface DemoScenario {
  id: 'scenario-a' | 'scenario-b' | 'scenario-c';
  key: string;
  name: string;
  badge: string;
  description: string;
  urgency: UrgencyLevel;
  rawText: string;
  medicines: MedicineItem[];
  expectedOutcome: {
    pharmacyCount: number;
    estimatedMinutes: number;
    baselineMinutes?: number;
    timeSavedMinutes?: number;
    isFullyCovered: boolean;
    explanation: string;
  };
}

/**
 * Standard user coordinate for Bengaluru Indiranagar demo hub
 */
export const DEMO_USER_LOCATION: DemoLocation = {
  latitude: 12.9716,
  longitude: 77.5946,
  address: "Flat 402, Palm Grove Heights, Indiranagar, Bengaluru",
};

/**
 * Centralized hackathon demo scenarios.
 * Strictly calibrated against the Smart Fulfilment Engine and pharmacy inventory.
 */
export const DEMO_SCENARIOS: Record<string, DemoScenario> = {
  // Scenario A: Main WOW Demo (5 medicines -> 2 pharmacies beat 1 mega-store)
  'scenario-a': {
    id: 'scenario-a',
    key: 'scenario-a',
    name: 'Scenario A — Main WOW Demo',
    badge: 'Dual-Pharmacy Win',
    description: '5 medicines split across 2 nearby express pharmacies. Proves parallel dispatch beats single distant store.',
    urgency: 'urgent',
    rawText: 'I need Dolo 650, Pantoprazole, Azithromycin, ORS and Cetirizine urgently.',
    medicines: [
      { id: 'm1', name: 'Dolo 650', quantity: 1, unit: 'strip', dosage: '650mg', urgency: 'urgent', notes: 'Fever & body ache' },
      { id: 'm2', name: 'Pantoprazole', quantity: 1, unit: 'strip', dosage: '40mg', urgency: 'urgent', notes: 'Antacid' },
      { id: 'm3', name: 'Azithromycin', quantity: 1, unit: 'strip', dosage: '500mg', urgency: 'urgent', notes: 'Antibiotic' },
      { id: 'm4', name: 'ORS', quantity: 1, unit: 'sachet', dosage: 'Sachet', urgency: 'urgent', notes: 'Hydration' },
      { id: 'm5', name: 'Cetirizine', quantity: 1, unit: 'strip', dosage: '10mg', urgency: 'urgent', notes: 'Antihistamine' },
    ],
    expectedOutcome: {
      pharmacyCount: 2,
      estimatedMinutes: 14,
      baselineMinutes: 30,
      timeSavedMinutes: 16,
      isFullyCovered: true,
      explanation: 'CityCare Pharmacy (3 items) and QuickCare Pharmacy (2 items) dispatch concurrently, completing delivery in 14 min vs 30 min single store.',
    },
  },

  // Scenario B: Single Pharmacy (All items available at CityCare, fastest option)
  'scenario-b': {
    id: 'scenario-b',
    key: 'scenario-b',
    name: 'Scenario B — Single Pharmacy Optimal',
    badge: 'Single-Hub Optimal',
    description: '3 medicines all in stock at the nearest pharmacy. Proves engine does not force multiple stores when single is fastest.',
    urgency: 'normal',
    rawText: 'I need Dolo 650, Pantoprazole and Azithromycin.',
    medicines: [
      { id: 'm1', name: 'Dolo 650', quantity: 1, unit: 'strip', dosage: '650mg', urgency: 'normal', notes: 'Pain / fever' },
      { id: 'm2', name: 'Pantoprazole', quantity: 1, unit: 'strip', dosage: '40mg', urgency: 'normal', notes: 'Acid reflux' },
      { id: 'm3', name: 'Azithromycin', quantity: 1, unit: 'strip', dosage: '500mg', urgency: 'normal', notes: 'Antibiotic' },
    ],
    expectedOutcome: {
      pharmacyCount: 1,
      estimatedMinutes: 11,
      baselineMinutes: 11,
      timeSavedMinutes: 0,
      isFullyCovered: true,
      explanation: 'CityCare Pharmacy has all 3 medicines in stock and is only 1.2 km away. Single pharmacy selected as the fastest route.',
    },
  },

  // Scenario C: No Complete Fulfilment (Graceful handling when medicine is unavailable network-wide)
  'scenario-c': {
    id: 'scenario-c',
    key: 'scenario-c',
    name: 'Scenario C — Incomplete Network Inventory',
    badge: 'Graceful Fallback',
    description: 'Request contains an unavailable medicine. Demonstrates clean no-plan state without fake claims.',
    urgency: 'urgent',
    rawText: 'I need Dolo 650, Pantoprazole, and RareSpecialtyDrugX.',
    medicines: [
      { id: 'm1', name: 'Dolo 650', quantity: 1, unit: 'strip', dosage: '650mg', urgency: 'urgent', notes: 'Pain relief' },
      { id: 'm2', name: 'Pantoprazole', quantity: 1, unit: 'strip', dosage: '40mg', urgency: 'urgent', notes: 'Gastric relief' },
      { id: 'm3', name: 'RareSpecialtyDrugX', quantity: 1, unit: 'strip', dosage: '100mg', urgency: 'urgent', notes: 'Specialty medication' },
    ],
    expectedOutcome: {
      pharmacyCount: 0,
      estimatedMinutes: 0,
      isFullyCovered: false,
      explanation: 'No combination in the local pharmacy network carries RareSpecialtyDrugX. Product gracefully reports unfulfillable status.',
    },
  },
};

export const DEFAULT_DEMO_SCENARIO = DEMO_SCENARIOS['scenario-a'];

/**
 * Adapter to convert DemoScenario into legacy SamplePrescription format
 */
export function getDemoSamplePrescriptions(): SamplePrescription[] {
  return Object.values(DEMO_SCENARIOS).map((scenario) => ({
    id: scenario.id,
    title: scenario.name,
    description: scenario.description,
    urgency: scenario.urgency,
    rawText: scenario.rawText,
    medicines: scenario.medicines,
  }));
}
