import React, { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { httpRequest } from "../lib/api/httpClient";
import { API_ENDPOINTS } from "../lib/config/api.config";
import "../styles/proveedores.css";

const EMPTY_FORM = { nombre: "", apellido: "", telefono: "" };
// Endpoint admin que muestra activos + deshabilitados
const PROVEEDORES_ADMIN_URL = API_ENDPOINTS.products.proveedoresAdmin;
// Alias cortos para construir URLs de acción
const base = (id) => `/api/proveedores/${id}`;

export default function Proveedores() {
  const { token, logout } = useAuthContext();
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("activos"); // "activos" | "inactivos" | "todos"
  const [operando, setOperando] = useState(false);

  const mostrarToast = (mensaje, tipo = "success", duracion = 3500) => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), duracion);
  };

  const manejarErrorAuth = (err) => {
    if (err?.status === 401 || err?.status === 403) {
      logout();
      mostrarToast("Sesión expirada. Inicia sesión nuevamente.", "error");
      return true;
    }
    return false;
  };

  const cargarProveedores = async () => {
    setLoading(true);
    setError(null);
    try {
      // Usamos el endpoint /admin que devuelve todos (activos + deshabilitados)
      const data = await httpRequest(PROVEEDORES_ADMIN_URL, { auth: true, token });
      const lista = Array.isArray(data?.proveedores) ? data.proveedores : [];
      setProveedores(lista);
    } catch (err) {
      if (manejarErrorAuth(err)) return;
      setError(err?.data?.message || err?.message || "Error al cargar proveedores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) cargarProveedores();
  }, [token]);

  const proveedoresFiltrados = useMemo(() => {
    const query = search.trim().toLowerCase();
    return proveedores
      .filter((p) => {
        if (filtroEstado === "activos") return p.activo !== false;
        if (filtroEstado === "inactivos") return p.activo === false;
        return true;
      })
      .filter((p) => {
        if (!query) return true;
        const nombre = `${p.nombre || ""} ${p.apellido || ""}`.toLowerCase();
        return nombre.includes(query) || String(p.telefono || "").toLowerCase().includes(query);
      });
  }, [proveedores, search, filtroEstado]);

  const cerrarModal = () => { setMostrarModal(false); setEditId(null); setForm(EMPTY_FORM); };
  const abrirCrear = () => { setEditId(null); setForm(EMPTY_FORM); setMostrarModal(true); };
  const abrirEditar = (p) => { setEditId(p.id); setForm({ nombre: p.nombre || "", apellido: p.apellido || "", telefono: p.telefono || "" }); setMostrarModal(true); };

  const guardar = async () => {
    const payload = { nombre: form.nombre.trim(), apellido: form.apellido.trim(), telefono: form.telefono.trim() };
    if (!payload.nombre || !payload.apellido) { mostrarToast("Nombre y apellido son obligatorios.", "error"); return; }

    setOperando(true);
    try {
      const method = editId ? "PATCH" : "POST";
      const url = editId ? base(editId) : "/api/proveedores";
      await httpRequest(url, { method, data: payload, auth: true, token });
      mostrarToast(editId ? "Proveedor actualizado correctamente" : "Proveedor creado correctamente");
      cerrarModal();
      cargarProveedores();
    } catch (err) {
      if (manejarErrorAuth(err)) return;
      mostrarToast(err?.data?.message || err?.message || "Error al guardar proveedor.", "error");
    } finally {
      setOperando(false);
    }
  };

  const deshabilitar = async (p) => {
    if (!window.confirm(`¿Deshabilitar a "${p.nombre} ${p.apellido}"?\nEl proveedor quedará inactivo pero sus productos se conservan.`)) return;
    setOperando(true);
    try {
      await httpRequest(`${base(p.id)}/deshabilitar`, { method: "PATCH", auth: true, token });
      mostrarToast(`Proveedor "${p.nombre} ${p.apellido}" deshabilitado.`);
      cargarProveedores();
    } catch (err) {
      if (manejarErrorAuth(err)) return;
      mostrarToast(err?.data?.message || err?.message || "Error al deshabilitar.", "error");
    } finally {
      setOperando(false);
    }
  };

  const habilitar = async (p) => {
    setOperando(true);
    try {
      await httpRequest(`${base(p.id)}/habilitar`, { method: "PATCH", auth: true, token });
      mostrarToast(`Proveedor "${p.nombre} ${p.apellido}" habilitado nuevamente.`);
      cargarProveedores();
    } catch (err) {
      if (manejarErrorAuth(err)) return;
      mostrarToast(err?.data?.message || err?.message || "Error al habilitar.", "error");
    } finally {
      setOperando(false);
    }
  };

  const eliminar = async (p) => {
    if (p.total_productos > 0) {
      mostrarToast(
        `No se puede eliminar a "${p.nombre} ${p.apellido}" porque tiene ${p.total_productos} producto(s) vinculado(s). Usa la opción "Deshabilitar" para conservar el historial.`,
        "error",
        5500
      );
      return;
    }
    if (!window.confirm(`¿Eliminar permanentemente a "${p.nombre} ${p.apellido}"?`)) return;
    setOperando(true);
    try {
      await httpRequest(base(p.id), { method: "DELETE", auth: true, token });
      mostrarToast("Proveedor eliminado correctamente.");
      cargarProveedores();
    } catch (err) {
      if (manejarErrorAuth(err)) return;
      mostrarToast(err?.data?.message || err?.message || "Error al eliminar el proveedor.", "error", 5500);
    } finally {
      setOperando(false);
    }
  };

  const totalActivos = proveedores.filter(p => p.activo !== false).length;
  const totalInactivos = proveedores.filter(p => p.activo === false).length;

  return (
    <div className="proveedores-page">
      {toast && <div className={`proveedores-toast ${toast.tipo}`}>{toast.mensaje}</div>}

      <div className="proveedores-shell">
        {/* ── Header ── */}
        <div className="proveedores-header">
          <div>
            <p className="proveedores-overline">Administración</p>
            <h1>Proveedores</h1>
            <p>Gestiona los proveedores disponibles para los productos del sistema.</p>
          </div>
          <div className="proveedores-actions">
            <button className="proveedores-btn proveedores-btn--ghost" onClick={() => window.history.back()}>Volver</button>
            <button className="proveedores-btn proveedores-btn--primary" onClick={abrirCrear} disabled={operando}>
              + Nuevo proveedor
            </button>
          </div>
        </div>

        {/* ── Contadores ── */}
        <div className="proveedores-stats">
          <span className="stat-chip stat-chip--green" onClick={() => setFiltroEstado("activos")} style={{ cursor: "pointer" }}>
            ● {totalActivos} activos
          </span>
          <span className="stat-chip stat-chip--red" onClick={() => setFiltroEstado("inactivos")} style={{ cursor: "pointer" }}>
            ○ {totalInactivos} deshabilitados
          </span>
          <span className="stat-chip" onClick={() => setFiltroEstado("todos")} style={{ cursor: "pointer" }}>
            Total: {proveedores.length}
          </span>
        </div>

        {/* ── Toolbar ── */}
        <div className="proveedores-toolbar">
          <input
            className="proveedores-input"
            placeholder="Buscar por nombre o teléfono…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="proveedores-input"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{ maxWidth: 180 }}
          >
            <option value="activos">Solo activos</option>
            <option value="inactivos">Solo deshabilitados</option>
            <option value="todos">Todos</option>
          </select>
        </div>

        {loading && <p className="proveedores-state">Cargando proveedores…</p>}
        {error && <p className="proveedores-state proveedores-state--error">{error}</p>}

        {!loading && !error && proveedoresFiltrados.length === 0 && (
          <div className="proveedores-empty">
            <h2>No hay proveedores</h2>
            <p>{filtroEstado === "inactivos" ? "No tienes proveedores deshabilitados." : "Agrega uno para poder asociarlo a productos."}</p>
          </div>
        )}

        {!loading && !error && proveedoresFiltrados.length > 0 && (
          <>
            <div className="proveedores-table-wrap">
            <table className="proveedores-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Productos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {proveedoresFiltrados.map((p) => (
                  <tr key={p.id} style={{ opacity: p.activo === false ? 0.55 : 1 }}>
                    <td>{p.id}</td>
                    <td>{`${p.nombre || ""} ${p.apellido || ""}`.trim()}</td>
                    <td>{p.telefono || "—"}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: p.total_productos > 0 ? "#10b981" : "#6b7280" }}>
                        {p.total_productos}
                      </span>
                    </td>
                    <td>
                      {p.activo !== false
                        ? <span className="badge badge--active">Activo</span>
                        : <span className="badge badge--disabled">Deshabilitado</span>}
                    </td>
                    <td className="proveedores-cell-actions">
                      {/* Editar — siempre disponible */}
                      <button
                        className="proveedores-btn proveedores-btn--secondary"
                        onClick={() => abrirEditar(p)}
                        disabled={operando}
                      >
                        Editar
                      </button>

                      {/* Deshabilitar / Habilitar */}
                      {p.activo !== false ? (
                        <button
                          className="proveedores-btn proveedores-btn--warning"
                          onClick={() => deshabilitar(p)}
                          disabled={operando}
                          title="Oculta el proveedor sin eliminarlo"
                        >
                          Deshabilitar
                        </button>
                      ) : (
                        <button
                          className="proveedores-btn proveedores-btn--success"
                          onClick={() => habilitar(p)}
                          disabled={operando}
                        >
                          Habilitar
                        </button>
                      )}

                      {/* Eliminar */}
                      <button
                        className={`proveedores-btn ${p.total_productos > 0 ? "proveedores-btn--blocked" : "proveedores-btn--danger"}`}
                        onClick={() => eliminar(p)}
                        disabled={operando}
                        title={p.total_productos > 0 ? `Tiene ${p.total_productos} producto(s): clic para más información` : "Eliminar permanentemente"}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="proveedores-cards">
            {proveedoresFiltrados.map((p) => (
              <article key={p.id} className="proveedor-card" style={{ opacity: p.activo === false ? 0.65 : 1 }}>
                <div className="proveedor-card__header">
                  <div>
                    <span className="proveedor-card__id">ID #{p.id}</span>
                    <h3 className="proveedor-card__name">{`${p.nombre || ""} ${p.apellido || ""}`.trim()}</h3>
                  </div>
                  {p.activo !== false
                    ? <span className="badge badge--active">Activo</span>
                    : <span className="badge badge--disabled">Deshabilitado</span>}
                </div>

                <div className="proveedor-card__info">
                  <p><strong>Teléfono:</strong> {p.telefono || "—"}</p>
                  <p>
                    <strong>Productos vinculados:</strong>{" "}
                    <span style={{ fontWeight: 700, color: p.total_productos > 0 ? "#10b981" : "#6b7280" }}>
                      {p.total_productos}
                    </span>
                  </p>
                </div>

                <div className="proveedor-card__actions">
                  <button
                    className="proveedores-btn proveedores-btn--secondary"
                    onClick={() => abrirEditar(p)}
                    disabled={operando}
                  >
                    Editar
                  </button>

                  {p.activo !== false ? (
                    <button
                      className="proveedores-btn proveedores-btn--warning"
                      onClick={() => deshabilitar(p)}
                      disabled={operando}
                      title="Oculta el proveedor sin eliminarlo"
                    >
                      Deshabilitar
                    </button>
                  ) : (
                    <button
                      className="proveedores-btn proveedores-btn--success"
                      onClick={() => habilitar(p)}
                      disabled={operando}
                    >
                      Habilitar
                    </button>
                  )}

                  <button
                    className={`proveedores-btn ${p.total_productos > 0 ? "proveedores-btn--blocked" : "proveedores-btn--danger"}`}
                    onClick={() => eliminar(p)}
                    disabled={operando}
                    title={p.total_productos > 0 ? `Tiene ${p.total_productos} producto(s): clic para más información` : "Eliminar permanentemente"}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
          </>
        )}
      </div>

      {/* ── Modal Crear / Editar ── */}
      {mostrarModal && (
        <div className="proveedores-modal-backdrop">
          <div className="proveedores-modal">
            <div className="proveedores-modal__header">
              <h2>{editId ? "Editar proveedor" : "Nuevo proveedor"}</h2>
              <button className="proveedores-btn proveedores-btn--ghost" onClick={cerrarModal}>✕</button>
            </div>
            <div className="proveedores-modal__body">
              <label>Nombre <span style={{ color: "red" }}>*</span></label>
              <input
                className="proveedores-input"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Luis"
              />
              <label>Apellido <span style={{ color: "red" }}>*</span></label>
              <input
                className="proveedores-input"
                value={form.apellido}
                onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                placeholder="Ej: González"
              />
              <label>Teléfono <span style={{ color: "red" }}>*</span></label>
              <input
                className="proveedores-input"
                type="tel"
                maxLength={10}
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="Ej: 3001234567"
              />
            </div>
            <div className="proveedores-modal__actions">
              <button className="proveedores-btn proveedores-btn--ghost" onClick={cerrarModal} disabled={operando}>Cancelar</button>
              <button className="proveedores-btn proveedores-btn--primary" onClick={guardar} disabled={operando}>
                {operando ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
