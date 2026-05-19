/**
 * Image URL rewriter — proxy brand-CDN images through Cloudinary's "fetch"
 * endpoint so we get a single fast CDN, auto-WebP/AVIF, auto-quality, and
 * resilient caching for SKU images that live on slow long-tail Indian
 * brand origins (thefuncompany.in, oluolin.com etc.).
 *
 * Configuration:
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME   (Vercel env var)
 *
 * Behaviour:
 *   - If the env var is set: every brand URL is wrapped in
 *     `https://res.cloudinary.com/<cloud>/image/fetch/<transforms>/<encoded>`
 *     Cloudinary downloads-once + caches + serves WebP from its global CDN.
 *   - If unset: returns the original URL unchanged so local dev / un-
 *     configured environments still render images.
 *   - Already-Cloudinary URLs are returned as-is (no double wrap).
 *
 * Cost note: Cloudinary's free tier covers 25 GB storage + 25 GB bandwidth
 * per month — comfortably more than our SKU image traffic.
 */

const CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || "";

const CLOUDINARY_HOST = "res.cloudinary.com";

export interface CdnImageOptions {
  /** Target width in CSS pixels. Cloudinary will resize before delivery. */
  width?: number;
  /** Crop strategy. 'fill' = cover the box, 'fit' = letterbox. */
  fit?: "fill" | "fit" | "limit";
  /** Aspect ratio in CSS "W:H" form, e.g. "4:5". Only applies when fit=fill. */
  aspectRatio?: string;
  /**
   * Force the browser to download instead of render inline. Adds Cloudinary's
   * fl_attachment flag which sets Content-Disposition: attachment server-side.
   * Use this for SKU "Download" buttons in the admin library so a click
   * triggers a save dialog instead of opening the image in a new tab.
   */
  download?: boolean;
}

/**
 * Convert a brand-CDN URL into a Cloudinary "fetch" URL when configured.
 * Returns the input unchanged when not configured or input is unusable.
 */
export function cdnImage(
  url: string | null | undefined,
  opts: CdnImageOptions = {},
): string {
  if (!url) return "";
  if (!CLOUD_NAME) return url;
  // Don't double-wrap an already-proxied URL.
  if (url.includes(CLOUDINARY_HOST)) return url;

  const parts: string[] = ["f_auto", "q_auto"];
  if (opts.width) parts.push(`w_${Math.round(opts.width)}`);
  if (opts.fit === "fill") parts.push("c_fill");
  else if (opts.fit === "fit") parts.push("c_fit");
  else if (opts.fit === "limit") parts.push("c_limit");
  if (opts.aspectRatio && opts.fit === "fill") {
    parts.push(`ar_${opts.aspectRatio}`);
  }
  if (opts.download) parts.push("fl_attachment");
  // Reasonable defaults if caller didn't pin a size — Cloudinary still
  // re-encodes to WebP which is the bulk of the speedup.
  const transforms = parts.join(",");
  const encoded = encodeURIComponent(url);
  return `https://${CLOUDINARY_HOST}/${CLOUD_NAME}/image/fetch/${transforms}/${encoded}`;
}

/**
 * Is the Cloudinary proxy currently configured? Useful for diagnostics +
 * showing dev banners when env vars are missing.
 */
export function cdnIsConfigured(): boolean {
  return Boolean(CLOUD_NAME);
}
