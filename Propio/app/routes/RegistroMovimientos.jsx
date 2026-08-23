import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import { formatPrice } from "../lib/services/productData";
import { resolveImageUrl, FALLBACK_IMAGE } from "../lib/services/imageUtils";
import { httpRequest } from "../lib/api/httpClient";
import { API_ENDPOINTS } from "../lib/config/api.config";
import "../styles/Lista_productos.css";

const getStockTone = (producto) => {
  if (producto?.stock <= 0) return "critical";
  if (producto?.isLowStock) return "warning";
  return "healthy";
};

const isVisibleInStock = (producto) => {
  const status = String(producto?.estado || "").trim().toLowerCase();
  return status !== "deshabilitado" && status !== "no disponible" && status !== "no-disponible";
};

const getStockColor = (producto) => {
  const tone = getStockTone(producto);
  if (tone === "critical") return "#dc3545";
  if (tone === "warning") return "#f59e0b";
  return "#198754";
};

const ModalMovimiento = ({
  producto,
  onCerrar,
  onGuardar
}) => {
  const [cantidad, setCantidad] = useState("");
  const [tipo, setTipo] = useState("ENTRADA");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const numCantidad = parseInt(cantidad, 10);
    if (isNaN(numCantidad) || numCantidad <= 0) {
      setError("La cantidad debe ser un numero positivo.");
      return;
    }

    if (tipo === "SALIDA" && numCantidad > producto.stock) {
      setError(`Stock insuficiente. Disponible: ${producto.stock}.`);
      return;
    }

    onGuardar({
      id_producto: producto.id,
      tipo_movimiento: tipo,
      cantidad: numCantidad,
      comentario: comentario.trim()
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: "600px" }}>
        <header className="modal-header">
          <h2>Registrar {tipo === "ENTRADA" ? "Entrada" : "Salida"} - {producto.nombre}</h2>
          <button onClick={onCerrar} className="close-modal-btn">X</button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Tipo de Movimiento</label>
              <select
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value);
                  setError(null);
                }}
                className="input"
                required
              >
                <option value="ENTRADA">Entrada / Recepcion de Mercancia</option>
                <option value="SALIDA">Salida / Ajuste Negativo</option>
              </select>
            </div>

            <div className="form-group">
              <label>Cantidad</label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => {
                  setCantidad(e.target.value);
                  setError(null);
                }}
                className="input"
                min="1"
                required
              />
              <small className="help-text" style={{ fontWeight: "bold" }}>
                Stock Actual:{" "}
                <span style={{ color: getStockColor(producto) }}>
                  {producto.stock}
                </span>
                {producto.isLowStock && producto.stock > 0 && (
                  <span style={{ color: "#b45309", marginLeft: "8px" }}>
                    Stock bajo (umbral: {producto.lowStockThreshold})
                  </span>
                )}
              </small>
            </div>

            <div className="form-group full-width">
              <label>Comentario</label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                className="input"
                rows="2"
              />
            </div>
          </div>

          {error && <p className="error-message" style={{ color: "red", textAlign: "center" }}>{error}</p>}

          <footer className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCerrar}>Cancelar</button>
            <button type="submit" className={`btn ${tipo === "ENTRADA" ? "btn-primary" : "btn-danger"}`}>
              Registrar {tipo}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default function RegistroMovimientos() {
  const { token, logout } = useAuthContext();
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [toast, setToast] = useState(null);

  const authorizedFetch = useCallback(
    async (endpoint, method = "GET", body = null) => {
      try {
        return await httpRequest(`${API_ENDPOINTS.movements.base}${endpoint}`, {
          method,
          data: body,
          auth: true,
          token
        });
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          logout();
          navigate("/login");
          throw new Error("No autorizado");
        }
        throw err;
      }
    },
    [logout, navigate, token]
  );

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authorizedFetch("/productos", "GET");
      const productosArray = Array.isArray(data) ? data : [];
      const visible = productosArray.filter(isVisibleInStock);
      setProductos(visible);
    } catch (err) {
      setError("Error al cargar la lista de productos: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch]);

  useEffect(() => {
    if (token) {
      fetchProductos();
    }
  }, [fetchProductos, token]);

  const mostrarToast = (mensaje, tipo = "success") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGuardarMovimiento = async (movimientoData) => {
    setProductoSeleccionado(null);
    setLoading(true);

    try {
      const result = await authorizedFetch("/registrar", "POST", movimientoData);
      if (result?.warning?.message) {
        mostrarToast(result.warning.message, "warning");
      } else {
        mostrarToast(result?.message || "Movimiento registrado correctamente.", "success");
      }
      fetchProductos();
    } catch (err) {
      const errorMessage =
        err.message.includes("No autorizado") ? "Sesion expirada. Inicie sesion de nuevo." : err.message;
      setError("Fallo al registrar el movimiento: " + errorMessage);
      mostrarToast("Error: " + errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const productosFiltrados = useMemo(() => {
    const lowerCaseFiltro = filtroNombre.toLowerCase();
    if (!lowerCaseFiltro) {
      return productos;
    }

    return productos.filter((p) => {
      const nombre = (p.nombre || "").toLowerCase();
      const categoria = (p.categoria || "").toLowerCase();
      const id = String(p.id || "");
      return nombre.includes(lowerCaseFiltro) || categoria.includes(lowerCaseFiltro) || id.includes(lowerCaseFiltro);
    });
  }, [productos, filtroNombre]);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Registro de Inventario (Entradas y Salidas)</h1>
        <p>Modulo para que los empleados registren ajustes de inventario, recepciones o perdidas.</p>
        <button className="btn green" onClick={() => navigate("/usuarioC")}>Volver al Dashboard</button>
      </header>

      <main className="dashboard-content">
        <section className="card full-width">
          <header className="card-header">
            <h2>Lista de Productos y Stock</h2>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Buscar producto, ID o categoria..."
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                className="input"
              />
            </div>
          </header>

          <div className="card-body table-responsive">
            {loading ? (
              <p style={{ textAlign: "center" }}>Cargando productos...</p>
            ) : error ? (
              <p className="error-message" style={{ color: "red", textAlign: "center" }}>{error}</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Imagen</th>
                    <th>Nombre</th>
                    <th>Categoria</th>
                    <th>Precio Venta</th>
                    <th>Stock Actual</th>
                    <th>Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.length > 0 ? (
                    productosFiltrados.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>
                          <img
                            src={resolveImageUrl(p.imagen)}
                            alt={p.nombre}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = FALLBACK_IMAGE;
                            }}
                            style={{ width: "50px", height: "50px", objectFit: "cover" }}
                          />
                        </td>
                        <td>{p.nombre}</td>
                        <td>{p.categoria}</td>
                        <td>{formatPrice(p.precio)}</td>
                        <td style={{ fontWeight: "bold", color: getStockColor(p) }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span>{p.stock}</span>
                            {p.isLowStock && p.stock > 0 && (
                              <span
                                style={{
                                  display: "inline-block",
                                  fontSize: "0.75rem",
                                  color: "#9a3412",
                                  backgroundColor: "#ffedd5",
                                  borderRadius: "999px",
                                  padding: "2px 8px",
                                  width: "fit-content"
                                }}
                              >
                                Stock bajo
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => setProductoSeleccionado(p)}>
                            Registrar Movimiento
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center" }}>No se encontraron productos.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {productoSeleccionado && (
        <ModalMovimiento
          producto={productoSeleccionado}
          onCerrar={() => setProductoSeleccionado(null)}
          onGuardar={handleGuardarMovimiento}
        />
      )}

      {toast && (
        <div
          className={`toast-notification ${toast.tipo}`}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "10px 20px",
            borderRadius: "8px",
            backgroundColor:
              toast.tipo === "success"
                ? "#198754"
                : toast.tipo === "warning"
                  ? "#f59e0b"
                  : "#dc3545",
            color: "white",
            zIndex: 1000
          }}
        >
          {toast.mensaje}
        </div>
      )}
    </div>
  );
}
