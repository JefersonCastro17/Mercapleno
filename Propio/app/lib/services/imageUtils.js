import { API_URL } from "../config/env";

const PUBLIC_URL = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
const API_BASE_URL = API_URL.replace(/\/+$/, "");

export const FALLBACK_IMAGE = `${PUBLIC_URL}/images/placeholder.svg`;

function withBase(baseUrl, path) {
  if (!path) return baseUrl;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

// Returns a safe URL for product images.
// - Full URLs (http/https), protocol-relative (//) and data URIs are returned as-is.
// - Files served by the backend under /uploads are resolved against the API host.
// - Frontend public assets remain resolved against the Vite public root.
// - Bare filenames are resolved under /images/productos/.
export const resolveImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== "string") return FALLBACK_IMAGE;

  const trimmed = imagePath.trim();
  if (!trimmed) return FALLBACK_IMAGE;

  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }

  const normalized = trimmed.replace(/\\/g, "/");
  const cleaned = normalized.replace(/^\.?\//, "");

  if (normalized.startsWith("/uploads/") || cleaned.startsWith("uploads/")) {
    return withBase(API_BASE_URL, normalized.startsWith("/") ? normalized : cleaned);
  }

  if (normalized.startsWith("/")) {
    return `${PUBLIC_URL}${normalized}`;
  }

  if (cleaned.includes("/")) {
    return `${PUBLIC_URL}/${cleaned}`;
  }

  return `${PUBLIC_URL}/images/productos/${cleaned}`;
};
