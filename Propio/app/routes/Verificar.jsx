import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import "../styles/base.css";
import "../styles/registro.css";
import { httpRequest } from "../lib/api/httpClient";
import { API_ENDPOINTS } from "../lib/config/api.config";

function Verificar() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const paramEmail = searchParams.get("email");
    if (paramEmail) {
      setEmail(paramEmail);
    }
  }, [searchParams]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const data = await httpRequest(API_ENDPOINTS.auth.verifyEmail, {
        method: "POST",
        data: { email, code }
      });

      if (!data?.success) {
        setMessage(data?.message || "No se pudo verificar el correo");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setMessage(data.message || "Correo verificado correctamente.");
      setMessageType("success");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      console.error("Error al verificar:", err);
      setMessage(err.message || "Error de conexion con el servidor.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setMessage("Ingresa tu correo para reenviar el codigo.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const data = await httpRequest(API_ENDPOINTS.auth.resendVerification, {
        method: "POST",
        data: { email }
      });

      if (!data?.success) {
        setMessage(data?.message || "No se pudo reenviar el codigo");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setMessage(data.message || "Codigo reenviado. Revisa tu correo.");
      setMessageType("success");
    } catch (err) {
      console.error("Error al reenviar:", err);
      setMessage(err.message || "Error de conexion con el servidor.");
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
            <img src="/images/mercapleno-logo.svg" alt="Mercapleno" className="logo-img" />
            <h1 className="portal-title">Portal 2</h1>
          </div>

          <nav className="nav-links">
            <Link to="/" className="nav-btn">Inicio</Link>
            <Link to="/login" className="nav-btn">Iniciar Sesion</Link>
          </nav>
        </div>
      </header>

      <main>
        <div className="form-container">
          <h2>Verificar Correo</h2>

          {message && <div className={`message ${messageType}`}>{message}</div>}

          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label htmlFor="verifyEmail">Correo Electronico</label>
              <input
                type="email"
                id="verifyEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="verificationCode">Codigo</label>
              <input
                type="text"
                id="verificationCode"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Verificando..." : "Verificar"}
            </button>
          </form>

          <button
            type="button"
            className="submit-btn"
            style={{ marginTop: "12px" }}
            onClick={handleResend}
            disabled={loading}
          >
            Reenviar Codigo
          </button>
        </div>
      </main>
    </>
  );
}

export default Verificar;

