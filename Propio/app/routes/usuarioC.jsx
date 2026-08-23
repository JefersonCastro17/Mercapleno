import React, { useCallback, useEffect, useState } from "react";
import "../styles/usuarioC.css";
import { useAuthContext } from "../contexts/AuthContext";
import { httpRequest } from "../lib/api/httpClient";
import { API_ENDPOINTS } from "../lib/config/api.config";
import { getDocumentTypes } from "../lib/services/documentTypesService";

const getEmptyForm = (defaultDocumentTypeId = "") => ({
  nombre: "",
  apellido: "",
  email: "",
  password: "",
  direccion: "",
  fecha_nacimiento: "",
  id_rol: "3",
  id_tipo_identificacion: defaultDocumentTypeId,
  numero_identificacion: ""
});

export default function UsuarioC() {
  const { token, logout } = useAuthContext();

  const [usuarios, setUsuarios] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loadingDocumentTypes, setLoadingDocumentTypes] = useState(false);
  const [mostrar, setMostrar] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroId, setFiltroId] = useState("");
  const [filtroDocumento, setFiltroDocumento] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState(() => getEmptyForm());

  const mostrarToast = (mensaje, tipo = "success") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const manejarErrorAuth = (error) => {
    if (error?.status === 401 || error?.status === 403) {
      logout();
      mostrarToast("Sesion expirada. Inicie sesion de nuevo.", "error");
      return true;
    }
    return false;
  };

  const cargar = useCallback(async () => {
    try {
      const data = await httpRequest(API_ENDPOINTS.admin.users, {
        auth: true,
        token
      });
      setUsuarios(data?.usuarios || []);
    } catch (error) {
      if (manejarErrorAuth(error)) return;
      console.error("Error al cargar usuarios:", error);
      mostrarToast(error.message || "Error de conexion con el servidor.", "error");
    }
  }, [token, logout]);

  const cargarRoles = useCallback(async () => {
    if (!token) return;

    setLoadingRoles(true);

    try {
      const data = await httpRequest(API_ENDPOINTS.admin.roles, {
        auth: true,
        token
      });
      setRoles(data?.roles || []);
    } catch (error) {
      if (manejarErrorAuth(error)) return;
      console.error("Error al cargar roles:", error);
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  }, [token, logout]);

  useEffect(() => {
    if (token) {
      cargar();
      cargarRoles();
    }
  }, [cargar, cargarRoles, token]);

  useEffect(() => {
    let activo = true;

    const cargarTiposIdentificacion = async () => {
      setLoadingDocumentTypes(true);

      try {
        const tipos = await getDocumentTypes();

        if (!activo) return;

        setDocumentTypes(tipos);
        setForm((currentForm) =>
          currentForm.id_tipo_identificacion || tipos.length === 0
            ? currentForm
            : { ...currentForm, id_tipo_identificacion: tipos[0].id }
        );
      } catch (error) {
        if (!activo) return;

        console.error("Error al cargar tipos de identificacion:", error);
        mostrarToast("No se pudieron cargar los tipos de identificacion.", "error");
      } finally {
        if (activo) {
          setLoadingDocumentTypes(false);
        }
      }
    };

    cargarTiposIdentificacion();

    return () => {
      activo = false;
    };
  }, []);

  const limpiar = (defaultDocumentTypeId = documentTypes[0]?.id || "") => {
    setForm(getEmptyForm(defaultDocumentTypeId));
  };

  const cerrarModal = () => {
    setMostrar(false);
    setEditId(null);
    limpiar();
  };

  const abrirNuevoUsuario = () => {
    setEditId(null);
    limpiar();
    setMostrar(true);
  };

  const validarFormulario = () => {
    const camposRequeridos = [
      { key: "nombre", label: "Nombre" },
      { key: "apellido", label: "Apellido" },
      { key: "email", label: "Email" },
      { key: "direccion", label: "Direccion" },
      { key: "fecha_nacimiento", label: "Fecha de nacimiento" },
      { key: "id_tipo_identificacion", label: "Tipo de identificacion" },
      { key: "numero_identificacion", label: "Numero de identificacion" }
    ];

    const campoVacio = camposRequeridos.find(({ key }) => !String(form[key] || "").trim());
    if (campoVacio) {
      mostrarToast(`${campoVacio.label} es obligatorio.`, "error");
      return false;
    }

    if (!editId && String(form.password || "").trim().length < 6) {
      mostrarToast("La contrasena debe tener al menos 6 caracteres.", "error");
      return false;
    }

    if (editId && form.password && form.password.trim().length < 6) {
      mostrarToast("La nueva contrasena debe tener al menos 6 caracteres.", "error");
      return false;
    }

    return true;
  };

  const construirPayload = () => {
    const payload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      email: form.email.trim(),
      direccion: form.direccion.trim(),
      fecha_nacimiento: form.fecha_nacimiento,
      id_rol: Number(form.id_rol),
      id_tipo_identificacion: Number(form.id_tipo_identificacion),
      numero_identificacion: form.numero_identificacion.trim()
    };

    if (form.password?.trim()) {
      payload.password = form.password.trim();
    }

    return payload;
  };

  const guardar = async () => {
    if (!validarFormulario()) {
      return;
    }

    const url = editId
      ? `${API_ENDPOINTS.admin.users}/${editId}`
      : API_ENDPOINTS.admin.users;
    const method = editId ? "PUT" : "POST";
    const payload = construirPayload();

    try {
      const data = await httpRequest(url, {
        method,
        data: payload,
        auth: true,
        token
      });

      if (!data?.success) {
        mostrarToast(data?.message || "Error al guardar usuario", "error");
        return;
      }

      mostrarToast(editId ? "Usuario actualizado" : "Usuario creado");
      cerrarModal();
      cargar();
    } catch (error) {
      if (manejarErrorAuth(error)) return;
      mostrarToast(error.message || "Error de conexion", "error");
    }
  };

  const editar = (u) => {
    setEditId(u.id);
    setForm({
      nombre: u.nombre || "",
      apellido: u.apellido || "",
      email: u.email || "",
      password: "",
      direccion: u.direccion || "",
      fecha_nacimiento: u.fecha_nacimiento?.split("T")[0] || "",
      id_rol: String(u.id_rol),
      id_tipo_identificacion: String(u.id_tipo_identificacion || ""),
      numero_identificacion: u.numero_identificacion || ""
    });
    setMostrar(true);
  };

  const eliminar = async (id) => {
    if (!window.confirm("Eliminar usuario?")) return;

    try {
      await httpRequest(`${API_ENDPOINTS.admin.users}/${id}`, {
        method: "DELETE",
        auth: true,
        token
      });

      mostrarToast("Usuario eliminado");
      cargar();
    } catch (error) {
      if (manejarErrorAuth(error)) return;
      mostrarToast(error.message || "Error al eliminar.", "error");
    }
  };

  const rolBadge = (rol) => {
    if (rol === 1) return <span className="badge admin">Admin</span>;
    if (rol === 2) return <span className="badge empleado">Empleado</span>;
    return <span className="badge cliente">Cliente</span>;
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const queryNombre = filtroNombre.trim().toLowerCase();
    const queryId = filtroId.trim().toLowerCase();
    const queryDocumento = filtroDocumento.trim().toLowerCase();

    if (queryId && !String(u.id).toLowerCase().includes(queryId)) return false;

    if (queryDocumento && !String(u.numero_identificacion || "").toLowerCase().includes(queryDocumento)) return false;

    if (queryNombre) {
      const nombreCompleto = `${u.nombre || ""} ${u.apellido || ""}`.toLowerCase();
      const email = (u.email || "").toLowerCase();

      if (!nombreCompleto.includes(queryNombre) && !email.includes(queryNombre)) return false;
    }

    if (filtroRol && String(u.id_rol) !== String(filtroRol)) return false;

    return true;
  });

  return (
    <div className="container">
      {toast && <div className={`toast ${toast.tipo}`}>{toast.mensaje}</div>}

      <div className="main">
        <div className="controles">
          <button className="btn-crear" onClick={abrirNuevoUsuario}>
            Nuevo Usuario
          </button>

          <button
            className="btn-crear"
            onClick={() => window.location.assign("/admin/proveedores")}
            style={{ background: "#0B4A8B" }}
          >
            Gestionar Proveedores
          </button>

          <div className="controles-busqueda">
            <input
              className="input-busqueda"
              placeholder="Buscar por nombre o email"
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
            />

            <input
              className="input-busqueda input-busqueda--small"
              placeholder="ID"
              value={filtroId}
              onChange={(e) => setFiltroId(e.target.value)}
            />

            <input
              className="input-busqueda input-busqueda--small"
              placeholder="Documento"
              value={filtroDocumento}
              onChange={(e) => setFiltroDocumento(e.target.value)}
            />

            <select
              className="select-filtro-rol"
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              disabled={loadingRoles}
            >
              <option value="">Todos los roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.nombre}
                </option>
              ))}
            </select>

            {(filtroNombre || filtroId || filtroDocumento || filtroRol) && (
              <button
                className="btn-limpiar"
                onClick={() => {
                  setFiltroNombre("");
                  setFiltroId("");
                  setFiltroDocumento("");
                  setFiltroRol("");
                }}
              >
                ✕ Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="tabla-container">
          <table className="tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Tipo Doc</th>
                <th>N Documento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="td-empty">Sin usuarios</td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.nombre} {u.apellido}</td>
                    <td>{u.email}</td>
                    <td>{rolBadge(u.id_rol)}</td>
                    <td>{u.tipo_identificacion || u.id_tipo_identificacion}</td>
                    <td>{u.numero_identificacion}</td>
                    <td>
                      <button className="btn-modificar" onClick={() => editar(u)}>
                        Editar
                      </button>
                      <button className="btn-eliminar" onClick={() => eliminar(u.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrar && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editId ? "Editar Usuario" : "Nuevo Usuario"}</h2>
              <button className="modal-close" onClick={cerrarModal}>x</button>
            </div>

            <div className="modal-body">
              {["nombre", "apellido", "email", "direccion", "numero_identificacion"].map((campo) => (
                <div className="form-group" key={campo}>
                  <label>{campo.replace("_", " ")}</label>
                  <input
                    className="input"
                    value={form[campo]}
                    onChange={(e) => setForm({ ...form, [campo]: e.target.value })}
                  />
                </div>
              ))}

              <div className="form-group">
                <label>Fecha de Nacimiento</label>
                <input
                  type="date"
                  className="input"
                  value={form.fecha_nacimiento}
                  onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Tipo de Identificacion</label>
                <select
                  className="input"
                  value={form.id_tipo_identificacion}
                  onChange={(e) => setForm({ ...form, id_tipo_identificacion: e.target.value })}
                  disabled={loadingDocumentTypes || documentTypes.length === 0}
                >
                  {loadingDocumentTypes ? (
                    <option value="">Cargando tipos...</option>
                  ) : documentTypes.length > 0 ? (
                    documentTypes.map((documentType) => (
                      <option key={documentType.id} value={documentType.id}>
                        {documentType.nombre}
                      </option>
                    ))
                  ) : (
                    <option value="">No hay tipos disponibles</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Rol</label>
                <select
                  className="input"
                  value={form.id_rol}
                  onChange={(e) => setForm({ ...form, id_rol: e.target.value })}
                  disabled={loadingRoles || roles.length === 0}
                >
                  {roles.length > 0 ? (
                    roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.nombre}
                      </option>
                    ))
                  ) : (
                    <option value="3">Cliente</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>{editId ? "Nueva Contrasena (opcional)" : "Contrasena"}</label>
                <input
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-guardar" onClick={guardar}>Guardar</button>
              <button className="btn-cancelar" onClick={cerrarModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
