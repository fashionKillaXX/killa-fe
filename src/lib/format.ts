/**
 * Formatting helpers — keep display logic out of components.
 *
 * Why this exists: a fair chunk of our SKU catalogue (~40%) has no
 * extractable price upstream (scraper got empty/foreign-currency strings).
 * Naively rendering `₹0` makes the magazine look broken. Route every price
 * display through formatPriceINR so we get a single neutral fallback.
 */

/**
 * Render an INR price. Missing / zero / negative / non-finite values render
 * as an em-dash so cards don't show "₹0" or "₹NaN".
 *
 *   formatPriceINR(3290)  → "₹3,290"
 *   formatPriceINR(0)     → "—"
 *   formatPriceINR(null)  → "—"
 */
export function formatPriceINR(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return "—";
  }
  return "₹" + value.toLocaleString("en-IN");
}
