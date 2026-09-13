import { SamplePrescription } from '../types';

export const SAMPLE_PRESCRIPTIONS: SamplePrescription[] = [
  {
    id: "sample-5-urgent",
    title: "5-Medicine Acute Infection (The Benchmark Demo)",
    description: "Requires Dolo, Azithromycin, Pantoprazole, Montair-LC & Amoxicillin. Proves dual-pharmacy speed over single mega-store.",
    urgency: "urgent",
    rawText: "I need Dolo 650, Azithromycin 500mg, Pantoprazole 40mg, Montair-LC, and Amoxicillin-Clav 625mg urgently. Doctor prescribed these after emergency discharge.",
    medicines: [
      { id: "m1", name: "Dolo 650", quantity: 2, dosage: "650mg", urgency: "urgent", notes: "Fever / body ache" },
      { id: "m2", name: "Azithromycin 500mg", quantity: 1, dosage: "500mg", urgency: "urgent", notes: "Antibiotic course" },
      { id: "m3", name: "Pantoprazole 40mg", quantity: 1, dosage: "40mg", urgency: "urgent", notes: "Antacid protector" },
      { id: "m4", name: "Montair-LC", quantity: 1, dosage: "10mg/5mg", urgency: "urgent", notes: "Allergy & congestion" },
      { id: "m5", name: "Amoxicillin-Clav 625mg", quantity: 1, dosage: "625mg", urgency: "urgent", notes: "Broad spectrum antibiotic" },
    ]
  },
  {
    id: "sample-respiratory",
    title: "Acute Asthma & Bronchospasm Kit",
    description: "Urgent need for Salbutamol Inhaler, Montair-LC and Dolo 650.",
    urgency: "emergency",
    rawText: "Emergency! Patient having breathing difficulty. Need 1 Salbutamol Inhaler, Montair-LC 1 strip, and Dolo 650 immediately!",
    medicines: [
      { id: "m1", name: "Salbutamol Inhaler", quantity: 1, dosage: "100mcg", urgency: "emergency", notes: "Immediate bronchodilator" },
      { id: "m2", name: "Montair-LC", quantity: 1, dosage: "10mg", urgency: "emergency", notes: "Airway relief" },
      { id: "m3", name: "Dolo 650", quantity: 1, dosage: "650mg", urgency: "urgent", notes: "Fever management" },
    ]
  },
  {
    id: "sample-chronic-refill",
    title: "Cardio-Metabolic Regular Refill",
    description: "Standard refill of Metformin, Pantoprazole, and Cetirizine.",
    urgency: "normal",
    rawText: "Please refill monthly prescription: Metformin 500mg 2 packs, Pantoprazole 40mg 1 pack, and Cetirizine 10mg.",
    medicines: [
      { id: "m1", name: "Metformin 500mg", quantity: 2, dosage: "500mg", urgency: "normal", notes: "Glycemic management" },
      { id: "m2", name: "Pantoprazole 40mg", quantity: 1, dosage: "40mg", urgency: "normal", notes: "Morning dose" },
      { id: "m3", name: "Cetirizine 10mg", quantity: 1, dosage: "10mg", urgency: "normal", notes: "Seasonal allergy" },
    ]
  }
];
