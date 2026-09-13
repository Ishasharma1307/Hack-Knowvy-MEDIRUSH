import { GoogleGenerativeAI } from '@google/generative-ai';
import { getStoredGeminiApiKey } from '../ai/geminiService';

export interface ExtractedPrescriptionMedicine {
  id: string;
  rawName: string;
  medicineName: string | null;
  strength?: string;
  form?: string;
  quantity: number | null;
  unit?: string;
  instructions?: string;
  confidence: number;
  needsConfirmation: boolean;
  uncertainCandidates?: string[];
}

export interface PrescriptionAnalysisResult {
  prescriptionReadable: boolean;
  medicines: ExtractedPrescriptionMedicine[];
  unclearItems: string[];
  notes?: string;
  rawImagePreview?: string;
  warning?: string;
  source: 'gemini_vision' | 'gemini_text' | 'demo_synthetic' | 'manual_fallback';
}

// ─── DEMO SYNTHETIC FALLBACK (only used when API key is absent) ─────────────

/**
 * Hardcoded fallback result — only used when no API key is present at all.
 */
export function getDemoSyntheticPrescriptionResult(includeUnclear: boolean = false): PrescriptionAnalysisResult {
  const meds: ExtractedPrescriptionMedicine[] = [
    {
      id: `rx_demo_1`,
      rawName: 'Dolo-650 Tab',
      medicineName: 'Dolo 650',
      strength: '650 mg',
      form: 'tablet',
      quantity: 10,
      unit: 'tablet',
      instructions: '1-0-1 after food (Fever/Body pain)',
      confidence: 0.98,
      needsConfirmation: false,
    },
    {
      id: `rx_demo_2`,
      rawName: 'Cap. Pantoprazole 40',
      medicineName: 'Pantoprazole',
      strength: '40 mg',
      form: 'capsule',
      quantity: 10,
      unit: 'capsule',
      instructions: '1-0-0 empty stomach (Acid reflux)',
      confidence: 0.95,
      needsConfirmation: false,
    },
    {
      id: `rx_demo_3`,
      rawName: 'Tab. Azithromycin 500mg',
      medicineName: 'Azithromycin',
      strength: '500 mg',
      form: 'tablet',
      quantity: 5,
      unit: 'tablet',
      instructions: '0-0-1 once daily for 5 days',
      confidence: 0.96,
      needsConfirmation: false,
    },
    {
      id: `rx_demo_4`,
      rawName: 'Electral / ORS Sachet',
      medicineName: 'ORS',
      strength: '21.8 g',
      form: 'sachet',
      quantity: 2,
      unit: 'sachet',
      instructions: 'Dissolve in 1 liter water as needed',
      confidence: 0.92,
      needsConfirmation: false,
    },
    {
      id: `rx_demo_5`,
      rawName: includeUnclear ? 'Cetr... 10mg (?)' : 'Tab. Cetirizine 10mg',
      medicineName: includeUnclear ? null : 'Cetirizine',
      strength: '10 mg',
      form: 'tablet',
      quantity: includeUnclear ? null : 10,
      unit: 'tablet',
      instructions: '0-0-1 at night for cold/allergy',
      confidence: includeUnclear ? 0.62 : 0.94,
      needsConfirmation: includeUnclear,
      uncertainCandidates: includeUnclear ? ['Cetirizine 10mg', 'Ceterol 10mg', 'Cetrizen'] : undefined,
    },
  ];

  return {
    prescriptionReadable: true,
    medicines: meds,
    unclearItems: includeUnclear ? ['Line 5 medicine name is partially occluded'] : [],
    notes: 'Prescription extracted from simulated clinical prescription sheet.',
    source: 'demo_synthetic',
    warning: includeUnclear ? 'One medicine entry is unclear and requires your confirmation before fulfilment.' : undefined,
  };
}

// ─── FILE VALIDATION ─────────────────────────────────────────────────────────

/**
 * Validates basic image file properties before processing.
 */
export function validatePrescriptionFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'Please select a prescription image file.' };
  }

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    if (file.type === 'application/pdf') {
      return { valid: false, error: 'PDF files are not supported in this version. Please take a photo or upload JPG, PNG, or WEBP.' };
    }
    return { valid: false, error: 'Unsupported format. Please upload JPG, PNG, or WEBP image.' };
  }

  const maxSizeMb = 12;
  if (file.size > maxSizeMb * 1024 * 1024) {
    return { valid: false, error: `Image file is too large (max ${maxSizeMb}MB). Please upload a smaller photo.` };
  }

  if (file.size < 100) {
    return { valid: false, error: 'The selected image file is empty or corrupted.' };
  }

  return { valid: true };
}

// ─── BASE64 HELPER ────────────────────────────────────────────────────────────

/**
 * Helper to convert a File to Base64 data string (without the data URL prefix)
 */
export async function fileToBase64(file: File): Promise<{ base64: string; dataUrl: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const parts = dataUrl.split(',');
      const mimeMatch = dataUrl.match(/^data:(.*?);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : file.type;
      const base64 = parts[1] || '';
      resolve({ base64, dataUrl, mimeType });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// ─── THE GEMINI PROMPT ────────────────────────────────────────────────────────

const EXTRACTION_PROMPT = `You are the Prescription Extraction Layer of MediRush, an intelligent medicine delivery platform.
Analyze the prescription carefully and extract ALL visible medicines.

STRICT MEDICAL & ETHICAL RULES:
1. Extract ONLY information that is clearly visible.
2. If a medicine name, strength, quantity, or instruction is not clearly legible, set "needsConfirmation": true and provide "uncertainCandidates" if possible.
3. DO NOT diagnose the patient or infer diseases.
4. DO NOT recommend alternatives or substitute medications.
5. DO NOT invent quantities if not written — set quantity to null.
6. Label dosage directions as "instructions".

Return ONLY valid JSON matching this exact schema (no markdown, no extra text):
{
  "prescriptionReadable": true,
  "medicines": [
    {
      "rawName": "Exact text from prescription",
      "medicineName": "Standardized brand or generic name (e.g. Dolo 650, Augmentin 625mg, Telma 40, Metformin 500mg)",
      "strength": "e.g. 650mg, 40mg (or null if not written)",
      "form": "tablet | capsule | syrup | sachet | inhaler | drops | strip",
      "quantity": 10,
      "unit": "tablet | strip | bottle | sachet | pack | ml",
      "instructions": "e.g. 1-0-1 after food",
      "confidence": 0.95,
      "needsConfirmation": false,
      "uncertainCandidates": []
    }
  ],
  "unclearItems": [],
  "notes": "Brief summary of what was extracted"
}`;

// ─── PARSE GEMINI JSON RESPONSE ───────────────────────────────────────────────

function parseGeminiResponse(responseText: string, source: 'gemini_vision' | 'gemini_text'): PrescriptionAnalysisResult {
  // Strip potential markdown code fences
  const cleaned = responseText.replace(/^```json\s*/m, '').replace(/```\s*$/m, '').trim();
  const parsed = JSON.parse(cleaned);

  if (!parsed || !Array.isArray(parsed.medicines)) {
    throw new Error('Invalid JSON schema returned from Gemini');
  }

  const sanitizedMedicines: ExtractedPrescriptionMedicine[] = parsed.medicines.map((item: any, idx: number) => {
    const rawName = typeof item.rawName === 'string' ? item.rawName.trim() : `Item ${idx + 1}`;
    const detectedName = typeof item.medicineName === 'string' && item.medicineName.trim() ? item.medicineName.trim() : null;
    const confidence = typeof item.confidence === 'number' ? Math.max(0, Math.min(1, item.confidence)) : 0.85;
    const needsConfirmation = item.needsConfirmation === true || confidence < 0.75 || !detectedName;

    return {
      id: `rx_item_${Date.now()}_${idx}`,
      rawName,
      medicineName: detectedName,
      strength: typeof item.strength === 'string' && item.strength.trim() ? item.strength.trim() : undefined,
      form: typeof item.form === 'string' ? item.form.trim() : 'tablet',
      quantity: typeof item.quantity === 'number' && item.quantity > 0 ? Math.round(item.quantity) : null,
      unit: typeof item.unit === 'string' && item.unit.trim() ? item.unit.trim() : 'tablet',
      instructions: typeof item.instructions === 'string' ? item.instructions.trim() : undefined,
      confidence,
      needsConfirmation,
      uncertainCandidates: Array.isArray(item.uncertainCandidates) && item.uncertainCandidates.length > 0
        ? item.uncertainCandidates
        : undefined,
    };
  });

  return {
    prescriptionReadable: parsed.prescriptionReadable !== false,
    medicines: sanitizedMedicines,
    unclearItems: Array.isArray(parsed.unclearItems) ? parsed.unclearItems : [],
    notes: typeof parsed.notes === 'string' ? parsed.notes : '',
    source,
  };
}

// ─── MAIN ENTRY: ANALYZE PRESCRIPTION ────────────────────────────────────────

export function isValidGeminiApiKey(key: string): boolean {
  if (typeof key !== 'string') return false;
  const trimmed = key.trim();
  return (trimmed.startsWith('AIza') || trimmed.startsWith('AQ.')) && trimmed.length > 20;
}

/**
 * Analyzes a prescription using Gemini Vision (real images) or returns
 * calibrated synthetic data (demo preset / no valid API key).
 *
 * - isDemoPreset=true → returns synthetic result instantly (no API call needed)
 * - Real image with valid AIza / AQ key → Gemini Vision multimodal call
 * - Real image with invalid/missing key → falls back gracefully to synthetic
 */
export async function analyzePrescriptionWithGemini(
  base64Data: string,
  mimeType: string,
  isDemoPreset: boolean = false,
  demoPrescriptionText?: string
): Promise<PrescriptionAnalysisResult> {

  // ── PATH A: Demo preset → return calibrated synthetic instantly ──
  // No Gemini call needed — the synthetic data perfectly matches the demo pharmacy network
  if (isDemoPreset) {
    console.log('[MediRush Vision] Demo preset: returning calibrated synthetic prescription result.');
    return getDemoSyntheticPrescriptionResult(false);
  }

  // ── PATH B: Real image upload → try Gemini Vision ──
  const apiKey = getStoredGeminiApiKey();

  // Validate key format before making any API call
  if (!apiKey || !isValidGeminiApiKey(apiKey)) {
    console.log('[MediRush Vision] No valid Gemini API key found. Using synthetic fallback for real upload.');
    // Return synthetic with a note that it's demo mode
    const result = getDemoSyntheticPrescriptionResult(false);
    result.notes = 'Demo mode: Add a valid Gemini API key (from aistudio.google.com) to analyze your prescription image.';
    result.warning = 'Live Gemini Vision requires a valid API key. Showing demo prescription data.';
    return result;
  }

  try {
    console.log('[MediRush Vision] Sending real prescription image to Gemini Vision (gemini-3.6-flash)...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType || 'image/jpeg',
      },
    };

    const response = await model.generateContent([EXTRACTION_PROMPT, imagePart]);
    const responseText = response.response.text();
    console.log('[MediRush Vision] Vision response received:', responseText.slice(0, 300));
    return parseGeminiResponse(responseText, 'gemini_vision');

  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error('[MediRush Vision] Gemini Vision error:', errMsg);

    // On auth / quota / server errors, fall back gracefully instead of crashing
    if (errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('Unauthorized') || errMsg.includes('ACCESS_TOKEN')) {
      console.warn('[MediRush Vision] Auth error — API key may be invalid. Returning synthetic fallback.');
      const result = getDemoSyntheticPrescriptionResult(false);
      result.warning = 'Could not authenticate with Gemini. Showing demo prescription data. Please verify your API key.';
      return result;
    }

    if (errMsg.includes('503') || errMsg.includes('overloaded') || errMsg.includes('500')) {
      const result = getDemoSyntheticPrescriptionResult(false);
      result.warning = 'Gemini is temporarily busy. Showing demo prescription. Try again in a few seconds.';
      return result;
    }

    // For other errors (network, parse), fall back to demo
    const result = getDemoSyntheticPrescriptionResult(false);
    result.warning = 'Could not analyze the image. Showing demo prescription data.';
    return result;
  }
}
