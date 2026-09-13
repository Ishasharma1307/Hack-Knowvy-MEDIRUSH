import { UrgencyLevel } from '../../types';

/**
 * Coordination penalty when multiple independent couriers are dispatched simultaneously.
 * 1 pharmacy: +0 min
 * 2 pharmacies: +2 min
 * 3 pharmacies: +4 min
 * N pharmacies: +(N-1) * 2 min
 */
export function calculateCoordinationPenalty(pharmacyCount: number): number {
  if (pharmacyCount <= 1) return 0;
  return (pharmacyCount - 1) * 2;
}

/**
 * Calculates parallel completion time for multiple pharmacies dispatching concurrently.
 * completionTime = max(individual fulfilment times) + coordination penalty
 */
export function calculateParallelCompletionTime(
  pharmacyTimes: number[],
  coordinationPenalty: number
): number {
  if (pharmacyTimes.length === 0) return 0;
  const maxIndividualTime = Math.max(...pharmacyTimes);
  return maxIndividualTime + coordinationPenalty;
}

/**
 * Deterministic scoring function for ranking COMPLETE combinations.
 * Lower score is better.
 *
 * Priorities:
 * 1. Completion Time (weight: 10.0 per min) - Priority 2
 * 2. Pharmacy Count (weight: 3.0 per extra pharmacy) - Priority 4
 * 3. Total Distance (weight: 0.5 per km) - Priority 3
 *
 * Urgency modifies the time weight to prioritize speed even more aggressively
 * during urgent or emergency situations.
 */
export function scoreCombination(params: {
  completionTimeMinutes: number;
  totalDistanceKm: number;
  pharmacyCount: number;
  urgency: UrgencyLevel;
}): number {
  const { completionTimeMinutes, totalDistanceKm, pharmacyCount, urgency } = params;

  // Urgency multiplier for completion time
  const urgencyMultiplier =
    urgency === 'emergency' ? 1.5 :
    urgency === 'urgent' ? 1.2 : 1.0;

  const timeScore = completionTimeMinutes * 10 * urgencyMultiplier;
  const distanceScore = totalDistanceKm * 0.5;
  const pharmacyCountPenalty = (pharmacyCount - 1) * 3.0;

  return Math.round((timeScore + distanceScore + pharmacyCountPenalty) * 100) / 100;
}
