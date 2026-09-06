import { API_URL, INTERNAL_API_KEY } from "../config/env";

function normalizePath(path = "") {
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}

function extractErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload || fallback;

  return (
    payload.message ||
    payload.error ||
    payload.details ||
    fallback
  );
}

export function buildApiUrl(path = "") {
  return `${API_URL}${normalizePath(path)}`;
}

function requiresInternalApiKey(path = "") {
  const normalizedPath = normalizePath(path);

  return (
    normalizedPath.startsWith("/api/admin/users") ||
    normalizedPath.startsWith("/admin/users") ||
    normalizedPath.startsWith("/api/sales/reports") ||
    normalizedPath.startsWith("/sales/reports")
  );
}

export async function httpRequest(path, options = {}) {
  const {
    method = "GET",
    data,
    headers = {},
    auth = false,
    token,
    responseType = "json"
  } = options;

  const normalizedMethod = method.toUpperCase();
  const normalizedPath = normalizePath(path);
  const allowBody = normalizedMethod !== "GET" && normalizedMethod !== "HEAD";
  const requestHeaders = { ...headers };
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  const hasPayload = allowBody && data !== undefined && data !== null;

  if (auth) {
    let authToken = token;
    if (!authToken && typeof window !== "undefined") {
      authToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    }
    if (authToken && authToken !== "cookie") {
      requestHeaders.Authorization = `Bearer ${authToken}`;
    }
  }

  if (requiresInternalApiKey(normalizedPath)) {
    const key = INTERNAL_API_KEY || "mercapleno123456789";
    requestHeaders["x-api-key"] = key;
  }

  if (hasPayload && !isFormData && !requestHeaders["Content-Type"]) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(buildApiUrl(normalizedPath), {
    method: normalizedMethod,
    headers: requestHeaders,
    credentials: "include",
    body: hasPayload ? (isFormData ? data : JSON.stringify(data)) : undefined
  });

  if (responseType === "blob") {
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return response.blob();
  }

  const contentType = response.headers.get("content-type") || "";
  const text = response.status === 204 ? "" : await response.text();

  let payload = null;
  if (text) {
    if (contentType.includes("application/json")) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    } else {
      payload = text;
    }
  }

  if (!response.ok) {
    const error = new Error(extractErrorMessage(payload, `HTTP ${response.status}`));
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  return payload;
}
