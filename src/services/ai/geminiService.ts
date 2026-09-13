import { GoogleGenerativeAI } from '@google/generative-ai';
import { MedicineItem, UrgencyLevel, FulfilmentPlan, ComparisonResult, StructuredMedicineRequest } from '../../types';
import { parseMedicineRequestOffline, DEMO_PRESET_MEDICINES } from './fallbackParser';

const STORAGE_KEY_API_KEY = 'medirush_gemini_api_key';

export function getStoredGeminiApiKey(): string {
  // 1. User-saved key in browser localStorage
  const localKey = localStorage.getItem(STORAGE_KEY_API_KEY);
  if (localKey && localKey.trim()) return localKey.trim();
  // 2. Key from .env file (VITE_GEMINI_API_KEY, gitignored)
  const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
  return envKey.trim();
}

export function saveGeminiApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY_API_KEY, key.trim());
}

export function clearGeminiApiKey(): void {
  localStorage.removeItem(STORAGE_KEY_API_KEY);
}

export interface ExtractionResult {
  medicines: MedicineItem[];
  urgency: UrgencyLevel;
  user_note: string;
  source: 'gemini' | 'fallback' | 'demo';
  safetyAlert?: string;
  requiresPrescriptionDetails?: boolean;
  isConsultationQuery?: boolean;
  rawResponse?: string;
}

/**
 * Validates and sanitizes Gemini output against the target schema:
 * {
 *   "medicines": [{ "name": string, "quantity": number, "unit": string }],
 *   "urgency": "normal" | "urgent" | "emergency",
 *   "user_note": string
 * }
 */
function sanitizeGeminiResponse(parsed: any, prompt: string): ExtractionResult | null {
  if (!parsed || typeof parsed !== 'object') return null;

  const validUrgency: UrgencyLevel = ['normal', 'urgent', 'emergency'].includes(parsed.urgency)
    ? (parsed.urgency as UrgencyLevel)
    : 'normal';

  const userNote = typeof parsed.user_note === 'string' ? parsed.user_note : prompt.trim();

  // If Gemini flagged a consultation query or emergency
  const isConsultation = parsed.is_consultation === true || parsed.consultation_warning;
  let safetyAlert: string | undefined = undefined;

  if (isConsultation) {
    return {
      medicines: [],
      urgency: 'normal',
      user_note: userNote,
      source: 'gemini',
      isConsultationQuery: true,
      safetyAlert: "MediRush cannot diagnose diseases or prescribe medications. Please consult a licensed medical professional or pharmacist.",
    };
  }

  if (validUrgency === 'emergency') {
    safetyAlert = "Emergency Care Advisory: If you or the patient is experiencing a life-threatening medical emergency (e.g., severe chest pain, acute breathlessness, or trauma), please immediately call emergency services (108 / 112) rather than waiting for medicine delivery.";
  }

  // Sanitize medicines list
  const rawList = Array.isArray(parsed.medicines) ? parsed.medicines : [];
  const sanitizedMeds: MedicineItem[] = [];

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (!item || typeof item !== 'object') continue;
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    if (!name || name.length < 2) continue;

    // Filter out hallucinations like "Prescription 1" or "Unknown Medicine"
    if (/^(medicine|prescription|tablet|drug)\s*\d*$/i.test(name)) continue;

    const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? Math.round(item.quantity) : 1;
    const unit = typeof item.unit === 'string' && item.unit.trim() ? item.unit.trim().toLowerCase() : 'strip';

    sanitizedMeds.push({
      id: `med_gemini_${Date.now()}_${i}`,
      name,
      quantity,
      unit,
      dosage: typeof item.dosage === 'string' ? item.dosage : '',
      urgency: validUrgency,
      notes: "Extracted via Gemini Intelligence",
    });
  }

  return {
    medicines: sanitizedMeds,
    urgency: validUrgency,
    user_note: userNote,
    source: 'gemini',
    safetyAlert,
    requiresPrescriptionDetails: sanitizedMeds.length === 0,
  };
}

/**
 * Extracts structured medicines from natural language requests using Gemini.
 * Follows strict medical safety guidelines: NEVER prescribes or diagnoses.
 * Seamlessly falls back to offline parser on any network or auth error.
 */
export async function extractMedicinesWithAI(prompt: string): Promise<ExtractionResult> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return {
      medicines: [],
      urgency: 'normal',
      user_note: '',
      source: 'fallback',
      requiresPrescriptionDetails: true,
      safetyAlert: "Please enter a medicine name or prescription text to analyze.",
    };
  }

  const apiKey = getStoredGeminiApiKey();

  if (!apiKey) {
    console.log('[MediRush AI] Running in Offline NLP Mode (no API key).');
    const offline = parseMedicineRequestOffline(trimmed);
    return {
      medicines: offline.medicines,
      urgency: offline.urgency,
      user_note: offline.user_note,
      source: 'fallback',
      safetyAlert: offline.safetyAlert,
      requiresPrescriptionDetails: offline.requiresPrescriptionDetails,
      isConsultationQuery: offline.isConsultationQuery,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const systemInstruction = `
You are the Clinical Parsing Engine of MediRush, an intelligent prescription fulfilment platform.

CRITICAL SAFETY RULES:
- You must NOT diagnose any condition.
- You must NOT prescribe or recommend new medicines or substitutions.
- You must NOT invent medicines or dosages if the user didn't name them.
- If the user asks "Which medicine should I take?" or asks for clinical advice, set "is_consultation": true, "medicines": [].
- If the user says "I have a prescription for 4 medicines" or "I need my prescribed medicines today" without naming them, set "medicines": [], and set "user_note" to explain that specific medicine names or prescription upload are required.

Extract the medicine items and urgency level from the user's message.
Return JSON matching this exact schema:
{
  "medicines": [
    {
      "name": "Standardized medicine name (e.g., Dolo 650, Pantoprazole, Azithromycin)",
      "quantity": 1,
      "unit": "strip | tablet | bottle | box | pack | sachet | inhaler"
    }
  ],
  "urgency": "normal | urgent | emergency",
  "user_note": "A summary of the patient's request context",
  "is_consultation": false
}
`;

    const result = await model.generateContent([
      systemInstruction,
      `User Medicine Request: "${trimmed}"`
    ]);

    const text = result.response.text();
    const parsed = JSON.parse(text);

    const sanitized = sanitizeGeminiResponse(parsed, trimmed);
    if (sanitized) {
      sanitized.rawResponse = text;
      return sanitized;
    }

    throw new Error('Gemini response could not be sanitized');
  } catch (err) {
    console.warn('[MediRush AI] Gemini call unsuccessful or failed validation, activating NLP fallback:', err);
    const offline = parseMedicineRequestOffline(trimmed);
    return {
      medicines: offline.medicines,
      urgency: offline.urgency,
      user_note: offline.user_note,
      source: 'fallback',
      safetyAlert: offline.safetyAlert,
      requiresPrescriptionDetails: offline.requiresPrescriptionDetails,
      isConsultationQuery: offline.isConsultationQuery,
    };
  }
}

/**
 * Returns the official predefined hackathon demo prescription
 * (Dolo 650, Pantoprazole, Azithromycin, ORS, Cetirizine - Urgent)
 */
export function getDemoPrescriptionFallback(): ExtractionResult {
  return {
    medicines: DEMO_PRESET_MEDICINES.map(m => ({ ...m })),
    urgency: 'urgent',
    user_note: 'Demo Benchmark: 5-medicine acute infection prescription',
    source: 'demo',
  };
}

/**
 * Uses Gemini to generate a human-readable explanation of WHY the specific
 * pharmacy combination was selected over the traditional single-pharmacy approach.
 */
export async function explainFulfilmentPlan(
  plan: FulfilmentPlan,
  benchmark: ComparisonResult
): Promise<string> {
  const apiKey = getStoredGeminiApiKey();
  const fallbackExplanation = benchmark.whyBetter;

  if (!apiKey) {
    return fallbackExplanation;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 180,
      },
    });

    const prompt = `
Context: MediRush's Smart Fulfilment Engine just computed the fastest prescription delivery combination.
Data:
- Total medicines needed: ${plan.coveredMedicines.length + plan.uncoveredMedicines.length}
- MediRush selected ${plan.selectedPharmacies.length} pharmacies:
  ${plan.selectedPharmacies.map(p => `${p.pharmacy.name} (${p.pharmacy.distanceKm} km away, supplying ${p.medicinesCovered.map(m => m.name).join(', ')})`).join('; ')}
- Estimated parallel delivery time: ~${plan.estimatedTotalTimeMin} minutes
- Single pharmacy alternative: ${benchmark.singleBenchmark.pharmacy ? `${benchmark.singleBenchmark.pharmacy.name} (~${benchmark.singleBenchmark.estimatedTimeMin} mins, coverage: ${benchmark.singleBenchmark.medicinesCovered.length} items)` : 'No single pharmacy has inventory'}
- Time saved: ${benchmark.timeSavedMin} minutes

Task: Write a concise, professional, 2-sentence explanation to the patient explaining why MediRush chose this combination. Emphasize speed, complete prescription coverage, and parallel dispatch. Do not use markdown headers.
`;

    const result = await model.generateContent(prompt);
    const explanation = result.response.text().trim();
    return explanation || fallbackExplanation;
  } catch (err) {
    console.warn('[MediRush AI] Explanation generation fallback:', err);
    return fallbackExplanation;
  }
}
