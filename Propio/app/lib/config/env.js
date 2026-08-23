const DEFAULT_API_URL = "http://localhost:4000";

const rawApiUrl = import.meta.env.VITE_API_URL || DEFAULT_API_URL;
const rawInternalApiKey = import.meta.env.VITE_INTERNAL_API_KEY || "";

export const API_URL = rawApiUrl.replace(/\/+$/, "");
export const INTERNAL_API_KEY = String(rawInternalApiKey).trim();
