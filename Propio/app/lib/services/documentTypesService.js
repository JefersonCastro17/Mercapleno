import { httpRequest } from "../api/httpClient";
import { API_ENDPOINTS } from "../config/api.config";

export async function getDocumentTypes() {
  const data = await httpRequest(API_ENDPOINTS.auth.documentTypes, {
    method: "GET"
  });

  const documentTypes = Array.isArray(data?.tipos_identificacion)
    ? data.tipos_identificacion
    : [];

  return documentTypes.map((item) => ({
    id: String(item.id),
    nombre: item.nombre
  }));
}
