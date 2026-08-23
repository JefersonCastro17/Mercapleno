import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import "../styles/base.css";
import "../styles/registro.css";
import { httpRequest } from "../lib/api/httpClient";
import { API_ENDPOINTS } from "../lib/config/api.config";
import { getDocumentTypes } from "../lib/services/documentTypesService";

function Registro() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    direccion: "",
    fecha_nacimiento: "",
    id_rol: 3,
    id_tipo_identificacion: "",
    numero_identificacion: ""
  });

  const [documentTypes, setDocumentTypes] = useState([]);
  const [loadingDocumentTypes, setLoadingDocumentTypes] = useState(true);
  const [documentTypesError, setDocumentTypesError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let activo = true;

    const cargarTiposIdentificacion = async () => {
      setLoadingDocumentTypes(true);
      setDocumentTypesError("");

      try {
        const tipos = await getDocumentTypes();

        if (!activo) return;

        setDocumentTypes(tipos);
      } catch (error) {
        if (!activo) return;

        console.error("Error al cargar tipos de identificacion:", error);
        setDocumentTypesError("No se pudieron cargar los tipos de identificacion.");
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    const {
      nombre,
      apellido,
      email,
      password,
      direccion,
      fecha_nacimiento,
      id_tipo_identificacion,
      numero_identificacion
    } = formData;

    if (
      !nombre ||
      !apellido ||
      !email ||
      !password ||
      !direccion ||
      !fecha_nacimiento ||
      !id_tipo_identificacion ||
      !numero_identificacion
    ) {
      setMessage("Por favor completa todos los campos");
      setMessageType("error");
      setLoading(false);
      return;
    }

    const nacimiento = new Date(fecha_nacimiento);
    const hoy = new Date();
    const edad = hoy.getFullYear() - nacimiento.getFullYear();

    if (edad < 10) {
      setMessage("Debes tener al menos 10 anos para registrarte");
      setMessageType("error");
      setLoading(false);
      return;
    }

    try {
      const { id_rol, ...payload } = formData;

      const data = await httpRequest(API_ENDPOINTS.auth.register, {
        method: "POST",
        data: {
          ...payload,
          id_tipo_identificacion: Number(formData.id_tipo_identificacion)
        }
      });

      if (!data?.success) {
        setMessage(data?.message || "Error al registrar");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setMessage(data.message || "Registro exitoso. Revisa tu correo para el codigo.");
      setMessageType("success");

      setTimeout(() => {
        navigate(`/verificar?email=${encodeURIComponent(formData.email)}`);
      }, 800);
    } catch (err) {
      console.error("ERROR FETCH:", err);
      setMessage(err.message || "Error al conectar con el servidor");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header>
        <div className="header-container">
          <div className="logo-section">
            <img src={logo} alt="Logo" className="logo-img" />
            <h1 className="portal-title">Portal 2</h1>
          </div>

          <nav className="nav-links">
            <Link to="/" className="nav-btn">Inicio</Link>
            <Link to="/login" className="nav-btn">Iniciar Sesion</Link>
            <Link to="/registro" className="nav-btn">Registrate</Link>
          </nav>
        </div>
      </header>

      <main>
        <div className="form-container">
          <h2>Registrarse</h2>

          {message && <div className={`message ${messageType}`}>{message}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nombre">Nombre</label>
              <input
                type="text"
                id="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="apellido">Apellido</label>
              <input
                type="text"
                id="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="id_tipo_identificacion">Tipo de identificacion</label>
              <select
                id="id_tipo_identificacion"
                value={formData.id_tipo_identificacion}
                onChange={handleChange}
                disabled={loadingDocumentTypes || documentTypes.length === 0}
                required
              >
                {loadingDocumentTypes ? (
                  <option value="">Cargando tipos...</option>
                ) : (
                  <>
                    <option value="">Seleccione...</option>
                    {documentTypes.map((documentType) => (
                      <option key={documentType.id} value={documentType.id}>
                        {documentType.nombre}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {documentTypesError && (
                <small style={{ color: "#b42318" }}>{documentTypesError}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="numero_identificacion">Numero de identificacion</label>
              <input
                type="text"
                id="numero_identificacion"
                value={formData.numero_identificacion}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="fecha_nacimiento">Fecha de Nacimiento</label>
              <input
                type="date"
                id="fecha_nacimiento"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Correo Electronico</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="direccion">Direccion</label>
              <input
                type="text"
                id="direccion"
                value={formData.direccion}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contrasena</label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <input type="hidden" id="id_rol" value={3} />

            <button
              type="submit"
              className="submit-btn"
              disabled={loading || loadingDocumentTypes || documentTypes.length === 0}
            >
              {loading ? "Registrando..." : "Enviar"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

export default Registro;
