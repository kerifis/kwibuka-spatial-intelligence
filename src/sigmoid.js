/**
 * Sigmoid distribution model for the 100-day timeline.
 * Reaches 1,000,000 by day ~100 with inflection at day 30.
 */

export const TOTAL_LIVES = 1_000_000;
export const TOTAL_DAYS = 102;
export const START_DATE = new Date('1994-04-06');

/**
 * Cumulative lives lost at a given day using logistic sigmoid.
 * @param {number} day - Day offset from April 6, 1994
 * @param {number} k - Steepness parameter (default 0.13)
 * @param {number} mid - Inflection point day (default 30)
 * @returns {number} Cumulative estimated lives lost
 */
export function sigmoid(day, k = 0.13, mid = 30) {
  return TOTAL_LIVES / (1 + Math.exp(-k * (day - mid)));
}

/**
 * Instantaneous killing rate (derivative of sigmoid).
 * @param {number} day
 * @param {number} k
 * @param {number} mid
 * @returns {number} Lives lost per day at this point
 */
export function sigmoidRate(day, k = 0.13, mid = 30) {
  const s = sigmoid(day, k, mid);
  return k * s * (1 - s / TOTAL_LIVES);
}

/**
 * Per-province sigmoid with onset offset.
 * Each province started at a different day and carries a share of the total.
 * @param {number} day - Current day
 * @param {number} onset - Day killings began in this province
 * @param {number} share - Fraction of total (0-1)
 * @returns {number} Province-level cumulative lives lost
 */
export function provSigmoid(day, onset, share) {
  const d = Math.max(0, day - onset);
  return sigmoid(d, 0.15, 25) * share;
}

/**
 * Convert day offset to Date object.
 */
export function dayToDate(day) {
  const dt = new Date(START_DATE);
  dt.setDate(dt.getDate() + day);
  return dt;
}

/**
 * Format Date to ISO date string (YYYY-MM-DD).
 */
export function formatDate(dt) {
  return dt.toISOString().slice(0, 10);
}
