import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";

export function getOrderBetween(
  before: string | null,
  after: string | null
): string {
  if (before !== null && after !== null && before >= after) {
    return generateKeyBetween(before, null);
  }
  return generateKeyBetween(before, after);
}

export function getInitialOrders(count: number): string[] {
  return generateNKeysBetween(null, null, count);
}

export { generateKeyBetween, generateNKeysBetween };
