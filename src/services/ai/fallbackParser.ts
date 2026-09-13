import { MedicineItem, UrgencyLevel } from '../../types';

// Common known clinical/commercial medicine catalog for fast, accurate regex extraction
export const KNOWN_MEDICINES = [
  { name: "Dolo 650", keywords: ["dolo 650", "dolo", "paracetamol 650"], defaultDosage: "650mg", defaultUnit: "strip" },
  { name: "Paracetamol 500mg", keywords: ["paracetamol", "crocin", "calpol"], defaultDosage: "500mg", defaultUnit: "strip" },
  { name: "Pantoprazole 40mg", keywords: ["pantoprazole 40mg", "pantoprazole", "pantocid", "pan 40", "pan-d"], defaultDosage: "40mg", defaultUnit: "strip" },
  { name: "Azithromycin 500mg", keywords: ["azithromycin 500mg", "azithromycin", "azithral", "zithromax", "azee"], defaultDosage: "500mg", defaultUnit: "strip" },
  { name: "Montair-LC", keywords: ["montair-lc", "montair lc", "montair", "montelukast", "levocetirizine"], defaultDosage: "10mg/5mg", defaultUnit: "strip" },
  { name: "Amoxicillin-Clav 625mg", keywords: ["amoxicillin-clav", "amoxicillin 625", "amoxicillin", "augmentin", "moxclav"], defaultDosage: "625mg", defaultUnit: "strip" },
  { name: "Cetirizine 10mg", keywords: ["cetirizine 10mg", "cetirizine", "citralka", "cetzine"], defaultDosage: "10mg", defaultUnit: "strip" },
  { name: "Salbutamol Inhaler", keywords: ["salbutamol inhaler", "salbutamol", "asthalin", "inhaler"], defaultDosage: "100mcg", defaultUnit: "inhaler" },
  { name: "Oral Rehydration Salts (ORS)", keywords: ["oral rehydration salts", "ors", "electral", "rehydration"], defaultDosage: "21.8g", defaultUnit: "sachet" },
  { name: "Metformin 500mg", keywords: ["metformin 500mg", "metformin", "glycomet"], defaultDosage: "500mg", defaultUnit: "strip" },
  { name: "Ibuprofen 400mg", keywords: ["ibuprofen 400mg", "ibuprofen", "brufen"], defaultDosage: "400mg", defaultUnit: "strip" },
  { name: "Vitamin C 500mg", keywords: ["vitamin c", "limcee", "ascorbic"], defaultDosage: "500mg", defaultUnit: "strip" },
  { name: "Atorvastatin 20mg", keywords: ["atorvastatin 20mg", "atorvastatin", "atorva"], defaultDosage: "20mg", defaultUnit: "strip" },
];

export const DEMO_PRESET_MEDICINES: MedicineItem[] = [
  { id: 'demo-1', name: 'Dolo 650', quantity: 1, unit: 'strip', dosage: '650mg', urgency: 'urgent', notes: 'Fever / Analgesic' },
  { id: 'demo-2', name: 'Pantoprazole', quantity: 1, unit: 'strip', dosage: '40mg', urgency: 'urgent', notes: 'Antacid' },
  { id: 'demo-3', name: 'Azithromycin', quantity: 1, unit: 'strip', dosage: '500mg', urgency: 'urgent', notes: 'Antibiotic' },
  { id: 'demo-4', name: 'ORS', quantity: 2, unit: 'sachet', dosage: '21.8g', urgency: 'urgent', notes: 'Electrolyte rehydration' },
  { id: 'demo-5', name: 'Cetirizine', quantity: 1, unit: 'strip', dosage: '10mg', urgency: 'urgent', notes: 'Anti-allergy' },
];

export interface FallbackParseResult {
  medicines: MedicineItem[];
  urgency: UrgencyLevel;
  user_note: string;
  confidence: number;
  requiresPrescriptionDetails?: boolean;
  isConsultationQuery?: boolean;
  safetyAlert?: string;
}

// Convert words like "one", "two", "three" to numbers
function wordToNumber(word: string): number | null {
  const map: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    a: 1, an: 1, single: 1
  };
  return map[word.toLowerCase()] ?? null;
}

/**
 * Robust offline clinical NLP fallback parser.
 * Strict safety: Never invents medicines or diagnoses diseases.
 */
export function parseMedicineRequestOffline(text: string): FallbackParseResult {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Safety check: Is the user asking for medical consultation / diagnosis / prescription?
  if (
    lower.includes("which medicine should i take") ||
    lower.includes("what medicine should i take") ||
    lower.includes("can you prescribe") ||
    lower.includes("what should i take for") ||
    lower.includes("diagnose me")
  ) {
    return {
      medicines: [],
      urgency: 'normal',
      user_note: trimmed,
      confidence: 1.0,
      isConsultationQuery: true,
      safetyAlert: "MediRush only organizes existing medicine requests. We do not diagnose diseases or prescribe medications. Please consult a licensed medical professional or pharmacist.",
    };
  }

  // Detect urgency
  let urgency: UrgencyLevel = 'normal';
  let safetyAlert: string | undefined = undefined;

  if (
    lower.includes('emergency') ||
    lower.includes('immediately') ||
    lower.includes('right away') ||
    lower.includes('severe') ||
    lower.includes('cannot breathe') ||
    lower.includes('chest pain') ||
    lower.includes('asap')
  ) {
    urgency = 'emergency';
    safetyAlert = "Emergency Care Advisory: If you or the patient is experiencing a life-threatening medical crisis (severe chest pain, acute respiratory distress, severe bleeding, or unconsciousness), please immediately contact emergency medical services (108 / 112) rather than waiting for medicine delivery.";
  } else if (
    lower.includes('urgent') ||
    lower.includes('urgently') ||
    lower.includes('today') ||
    lower.includes('as soon as possible') ||
    lower.includes('fast') ||
    lower.includes('fever') ||
    lower.includes('infection')
  ) {
    urgency = 'urgent';
  } else if (
    lower.includes('whenever convenient') ||
    lower.includes('routine') ||
    lower.includes('monthly') ||
    lower.includes('refill')
  ) {
    urgency = 'normal';
  }

  const foundMedicines: MedicineItem[] = [];
  const addedNames = new Set<string>();

  // Extract from known catalog
  for (const item of KNOWN_MEDICINES) {
    for (const kw of item.keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(lower) && !addedNames.has(item.name)) {
        let quantity = 1;
        let unit = item.defaultUnit || 'strip';

        // Check for pattern: "<number|word> <unit> of <medicine>"
        // e.g. "2 strips of Dolo" or "one strip of Pantoprazole"
        const qtyBeforeRegex = new RegExp(`(\\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an)\\s*(strips?|packs?|tablets?|boxes?|bottles?|capsules?|inhalers?|sachets?)?\\s*(?:of\\s*)?${kw}`, 'i');
        const matchBefore = lower.match(qtyBeforeRegex);

        if (matchBefore) {
          const qtyStr = matchBefore[1];
          const matchedUnit = matchBefore[2];
          const parsedNum = parseInt(qtyStr, 10);
          quantity = !isNaN(parsedNum) ? parsedNum : (wordToNumber(qtyStr) || 1);
          if (matchedUnit) {
            unit = matchedUnit.replace(/s$/, '').toLowerCase();
          }
        } else {
          // Check for pattern: "<medicine> <number|word> <unit>"
          // e.g. "Dolo 650 2 strips" or "Dolo 650 x 2"
          const qtyAfterRegex = new RegExp(`${kw}\\s*[x*]?\\s*(\\d+|one|two|three|four|five)\\s*(strips?|packs?|tablets?|boxes?|bottles?|sachets?)?`, 'i');
          const matchAfter = lower.match(qtyAfterRegex);
          if (matchAfter) {
            const qtyStr = matchAfter[1];
            const matchedUnit = matchAfter[2];
            const parsedNum = parseInt(qtyStr, 10);
            quantity = !isNaN(parsedNum) ? parsedNum : (wordToNumber(qtyStr) || 1);
            if (matchedUnit) {
              unit = matchedUnit.replace(/s$/, '').toLowerCase();
            }
          }
        }

        foundMedicines.push({
          id: `med_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: item.name,
          quantity: Math.max(1, quantity),
          unit,
          dosage: item.defaultDosage,
          urgency,
          notes: "Extracted from prescription request",
        });
        addedNames.add(item.name);
        break;
      }
    }
  }

  // If no known medicines matched, check if user simply described having a prescription without naming medicines
  // e.g. "I have a prescription for 4 medicines and I need them as soon as possible" or "I need my prescribed medicines today"
  if (foundMedicines.length === 0) {
    const isVaguePrescription = (
      lower.includes("prescription") ||
      lower.includes("prescribed") ||
      lower.includes("my medicines") ||
      lower.includes("these medicines") ||
      lower.includes("doctor gave me")
    );

    if (isVaguePrescription || lower.length < 5) {
      return {
        medicines: [],
        urgency,
        user_note: trimmed,
        confidence: 0.2,
        requiresPrescriptionDetails: true,
        safetyAlert: "No specific medicine names were detected in your request. Please specify the names of your prescribed medicines (e.g. Dolo 650, Pantoprazole) or enter them manually.",
      };
    }
  }

  return {
    medicines: foundMedicines,
    urgency,
    user_note: trimmed,
    confidence: foundMedicines.length > 0 ? 0.95 : 0.3,
    requiresPrescriptionDetails: foundMedicines.length === 0,
    safetyAlert,
  };
}
