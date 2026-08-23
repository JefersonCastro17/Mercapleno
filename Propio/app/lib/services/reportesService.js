import { authorizedFetch } from "./productData";
import { buildApiUrl, httpRequest } from "../api/httpClient";
import { API_ENDPOINTS } from "../config/api.config";

const BASE_REPORTS_URL = "/reports";

export const formatPrice = (price) => {
  if (typeof price !== "number" || Number.isNaN(price)) return "$0";

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

export const getVentasMes = async (inicio, fin) => {
  let endpoint = `${BASE_REPORTS_URL}/ventas-mes`;
  const params = new URLSearchParams();

  if (inicio) params.append("inicio", inicio);
  if (fin) params.append("fin", fin);
  if (params.toString()) endpoint += `?${params.toString()}`;

  const response = await authorizedFetch(endpoint, "GET");
  return response?.data || response;
};

export const getTopProductos = async () => {
  const response = await authorizedFetch(`${BASE_REPORTS_URL}/top-productos`, "GET");
  return response?.data || response;
};

export const getResumen = async () => {
  const response = await authorizedFetch(`${BASE_REPORTS_URL}/resumen`, "GET");
  return response?.data || response;
};

export const getResumenMes = async () => {
  const response = await authorizedFetch(`${BASE_REPORTS_URL}/resumen-mes`, "GET");
  return response?.data || response;
};

export const getPDFUrl = () => {
  return buildApiUrl(`${API_ENDPOINTS.sales.base}${BASE_REPORTS_URL}/pdf-resumen`);
};

export const fetchReportPdf = async () => {
  try {
    return await httpRequest(`${API_ENDPOINTS.sales.base}${BASE_REPORTS_URL}/pdf-resumen`, {
      method: "GET",
      auth: true,
      responseType: "blob"
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