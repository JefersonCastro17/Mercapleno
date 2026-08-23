import { httpRequest } from "../api/httpClient";
import { API_ENDPOINTS } from "../config/api.config";

const SALES_BASE = API_ENDPOINTS.sales.base;

export const formatPrice = (price) => {
  const normalizedPrice =
    typeof price === "number"
      ? price
      : typeof price === "string"
        ? Number(price)
        : Number.NaN;

  if (!Number.isFinite(normalizedPrice)) return "$0.00";

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(normalizedPrice);
};

export const authorizedFetch = async (endpoint, method = "GET", body = null) => {
  try {
    return await httpRequest(`${SALES_BASE}${endpoint}`, {
      method,
      data: body,
      auth: true
    });
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      const authError = new Error("Token invalido o requerido. Redirigir a Login.");
      authError.status = error.status;
      throw authError;
    }
    throw error;
  }
};

export const getProducts = async (nombre, categoria, precioMin, precioMax) => {
  const params = new URLSearchParams();

  if (nombre) params.append("search", nombre);
  if (categoria && categoria !== "todas") params.append("category", categoria);
  if (precioMin) params.append("precioMin", precioMin);
  if (precioMax) params.append("precioMax", precioMax);

  const endpoint = `/products?${params.toString()}`;
  const result = await authorizedFetch(endpoint);
  return result?.products || result?.data || result;
};

export const getCategories = async () => {
  const result = await authorizedFetch("/categories");
  return result?.categories || result?.data || result;
};

export const sendOrder = async (orderData) => {
  const sanitizedOrderData = {
    ...orderData,
    total: parseFloat(orderData.total.toFixed(2))
  };

  return authorizedFetch("/orders", "POST", sanitizedOrderData);
};
