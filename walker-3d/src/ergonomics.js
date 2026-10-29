import { DIM } from './constants.js';

export const STATURE_RANGE = [140, 200]; // cm
export const DEFAULT_STATURE = 170;

// Elbow flexion with the hands on the grips: 15 to 35 degrees is the usual target for walking aids.
const GOOD_FLEXION = [15, 35];

/** Grips belong at wrist height with the arms relaxed, which is about half of standing height. */
export function recommendedHandleHeight(statureCm) {
  const [min, max] = DIM.heightRange;
  return Math.min(max, Math.max(min, Math.round(statureCm * 0.5) / 100));
}

export function assessFit({ elbowFlexion, reached }) {
  if (!reached) {
    return { tone: 'bad', label: 'Handle too low', detail: 'The arms are fully stretched and cannot reach the grips.' };
  }
  const rounded = Math.round(elbowFlexion);
  if (elbowFlexion < GOOD_FLEXION[0]) {
    return { tone: 'warn', label: 'Handle too low', detail: `Elbow bend ${rounded}°. The arm is almost straight, so the user stoops.` };
  }
  if (elbowFlexion > GOOD_FLEXION[1]) {
    return { tone: 'warn', label: 'Handle too high', detail: `Elbow bend ${rounded}°. The shoulders are pushed up.` };
  }
  return { tone: 'good', label: 'Good fit', detail: `Elbow bend ${rounded}°, inside the 15° to 35° target.` };
}
