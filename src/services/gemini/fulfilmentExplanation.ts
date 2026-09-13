import { GoogleGenerativeAI } from '@google/generative-ai';
import { getStoredGeminiApiKey } from '../ai/geminiService';
import { FulfilmentPlan, SinglePharmacyBaseline } from '../fulfilment/types';

export interface StructuredExplanation {
  summary: string;
  reason: string;
  timeSavingExplanation: string;
}

/**
 * Builds deterministic fallback explanation based strictly on the mathematical optimization result.
 */
export function buildDeterministicExplanation(
  plan: FulfilmentPlan,
  baseline: SinglePharmacyBaseline | null
): StructuredExplanation {
  const pharmacyNames = plan.pharmacies.map(p => p.pharmacyName);
  const totalMeds = plan.totalMedicinesRequestedCount;
  const eta = plan.estimatedCompletionMinutes;

  if (plan.pharmacyCount === 1) {
    const single = plan.pharmacies[0];
    return {
      summary: `${single.pharmacyName} can fulfill all ${totalMeds} requested medicines directly in ~${eta} minutes.`,
      reason: `Because ${single.pharmacyName} is only ${single.distanceKm} km away and has complete stock for all items, a single-store delivery provides the fastest arrival without courier coordination overhead.`,
      timeSavingExplanation: `Dispatched directly from the nearest pharmacy with complete inventory.`,
    };
  }

  const p1 = plan.pharmacies[0];
  const p2 = plan.pharmacies[1];
  const p1Items = p1.allocatedMedicines.map(m => m.name).join(', ');
  const p2Items = p2.allocatedMedicines.map(m => m.name).join(', ');

  let timeSavingText = '';
  if (baseline && baseline.canFulfillAll && baseline.pharmacy) {
    timeSavingText = `The nearest single store with all items (${baseline.pharmacy.name}) would take ~${baseline.estimatedCompletionMinutes} min from ${baseline.distanceKm} km away. Splitting the order saves ~${Math.max(0, baseline.estimatedCompletionMinutes - eta)} minutes.`;
  } else if (baseline && baseline.pharmacy) {
    timeSavingText = `The best single pharmacy (${baseline.pharmacy.name}) only has ${baseline.medicinesCoveredCount}/${totalMeds} medicines in stock. MediRush combines 2 hubs to avoid missing medicines.`;
  } else {
    timeSavingText = `Parallel delivery across 2 hubs fulfills all ${totalMeds} medicines simultaneously in ~${eta} minutes.`;
  }

  return {
    summary: `${p1.pharmacyName} is fulfilling ${p1Items}, while ${p2.pharmacyName} is fulfilling ${p2Items}.`,
    reason: `No single nearby pharmacy could deliver all ${totalMeds} medicines within the shortest time. MediRush dispatched 2 closer express hubs concurrently so that both couriers travel shorter distances in parallel.`,
    timeSavingExplanation: timeSavingText,
  };
}

/**
 * Calls Gemini to generate a structured, human-readable explanation of WHY
 * the specific pharmacy combination was selected.
 * 
 * Safety & Architecture Rules:
 * - Gemini ONLY explains the already calculated result.
 * - Gemini does NOT select pharmacies or perform mathematical optimization.
 * - Strict JSON response format with deterministic fallback on any error.
 */
export async function generateFulfilmentExplanation(params: {
  plan: FulfilmentPlan;
  baseline: SinglePharmacyBaseline | null;
  urgency: string;
}): Promise<StructuredExplanation> {
  const { plan, baseline, urgency } = params;
  const fallback = buildDeterministicExplanation(plan, baseline);

  const apiKey = getStoredGeminiApiKey();
  if (!apiKey) {
    return fallback;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const systemPrompt = `
You are the Explanation Layer of MediRush, an intelligent prescription fulfilment platform.

CRITICAL RULES:
- You are strictly EXPLAINING an already-calculated mathematical result from our Smart Fulfilment Engine.
- Do NOT change any pharmacy names, medicines, quantities, or ETAs.
- Do NOT diagnose diseases, prescribe medicines, or suggest substitutions.
- Return ONLY valid JSON matching this schema:
{
  "summary": "A 1-sentence summary of which pharmacy fulfills which medicines",
  "reason": "A 1-2 sentence explanation of why this multi-pharmacy combination was faster than a single store",
  "timeSavingExplanation": "A 1-sentence comparison with the single-pharmacy baseline highlighting estimated time saved"
}
`;

    const userPrompt = `
Calculated Fulfilment Plan:
- Total medicines requested: ${plan.totalMedicinesRequestedCount}
- Number of pharmacies selected: ${plan.pharmacyCount}
- Selected pharmacies & allocations:
  ${plan.pharmacies.map(p => `${p.pharmacyName} (${p.distanceKm} km away, ~${p.totalTimeMinutes}m ETA) -> supplying: ${p.allocatedMedicines.map(m => `${m.name} x${m.quantity}`).join(', ')}`).join('\n  ')}
- Parallel completion time: ~${plan.estimatedCompletionMinutes} minutes
- Urgency: ${urgency}
- Baseline single-pharmacy alternative:
  ${baseline ? `${baseline.pharmacy?.name || 'Nearest pharmacy'} (can fulfill all: ${baseline.canFulfillAll}, coverage: ${baseline.medicinesCoveredCount}/${plan.totalMedicinesRequestedCount}, ETA: ~${baseline.estimatedCompletionMinutes}m, distance: ${baseline.distanceKm}km)` : 'None available'}
- Estimated time saved: ${baseline && baseline.canFulfillAll ? Math.max(0, baseline.estimatedCompletionMinutes - plan.estimatedCompletionMinutes) : 0} minutes

Generate the structured explanation JSON now.
`;

    const result = await model.generateContent([systemPrompt, userPrompt]);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    if (
      parsed &&
      typeof parsed.summary === 'string' &&
      typeof parsed.reason === 'string' &&
      typeof parsed.timeSavingExplanation === 'string'
    ) {
      return {
        summary: parsed.summary.trim(),
        reason: parsed.reason.trim(),
        timeSavingExplanation: parsed.timeSavingExplanation.trim(),
      };
    }

    return fallback;
  } catch (err) {
    console.warn('[MediRush AI] Gemini explanation generation failed, using deterministic fallback:', err);
    return fallback;
  }
}
