import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "../styles/base.css";
import "../styles/registro.css";
import { httpRequest } from "../lib/api/httpClient";
import { API_ENDPOINTS } from "../lib/config/api.config";

function Recuperar() {
  const navigate = useNavigate();

  /*
    Controlled Components (Componentes controlados):
    - Definicion: el valor de cada input vive en el estado de React.
    - Como se logra: se usa value={estado} + onChange={setEstado}.
    - Por que aqui: validacion, mensajes y flujo por pasos sin leer el DOM.
    - Resultado: React controla el formulario y sus datos en todo momento.
  */
  const [step, setStep] = useState("request"); // Estado que controla que formulario se muestra
  const [email, setEmail] = useState(""); // Controlled: valor del input email
  const [code, setCode] = useState(""); // Controlled: valor del input codigo
  const [newPassword, setNewPassword] = useState(""); // Controlled: valor del input nueva contrasena
  const [confirmPassword, setConfirmPassword] = useState(""); // Controlled: valor del input confirmar
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    // Se usan valores del estado (email), no se lee el DOM.
    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      // El payload sale del estado controlado (email).
      const data = await httpRequest(API_ENDPOINTS.auth.requestPasswordReset, {
        method: "POST",
        data: { email }
      });

      if (!data?.success) {
        setMessage(data?.message || "No se pudo enviar el codigo");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setMessage(data.message || "Si el correo existe, se envio un codigo.");
      setMessageType("success");
      setStep("reset");
    } catch (err) {
      console.error("Error al solicitar codigo:", err);
      setMessage(err.message || "Error de conexion con el servidor.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    // Se usan valores del estado (email, code, newPassword, confirmPassword).
    setLoading(true);
    setMessage("");
    setMessageType("");

    if (newPassword !== confirmPassword) {
      setMessage("Las contrasenas no coinciden.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    try {
      // El payload sale del estado controlado (email, code, newPassword, confirmPassword).
      const data = await httpRequest(API_ENDPOINTS.auth.resetPassword, {
        method: "POST",
        data: { email, code, newPassword, confirmPassword }
      });

      if (!data?.success) {
        setMessage(data?.message || "No se pudo actualizar la contrasena");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setMessage(data.message || "Contrasena actualizada correctamente.");
      setMessageType("success");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      console.error("Error al resetear:", err);
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
            <img src="/images/placeholder.svg" alt="Logo" className="logo-img" />
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
          <h2>Recuperar Contrasena</h2>

          {message && <div className={`message ${messageType}`}>{message}</div>}

          {step === "request" && (
            <form onSubmit={handleRequest}>
              <div className="form-group">
                <label htmlFor="resetEmail">Correo Electronico</label>
                {/* Controlled Component: value toma el dato del estado */}
                <input
                  type="email"
                  id="resetEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} // onChange actualiza el estado
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Codigo"}
              </button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleReset}>
              <div className="form-group">
                <label htmlFor="resetEmailConfirm">Correo Electronico</label>
                {/* Controlled Component: value toma el dato del estado (se mantiene entre pasos) */}
                <input
                  type="email"
                  id="resetEmailConfirm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} // onChange actualiza el estado
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="resetCode">Codigo</label>
                {/* Controlled Component: value toma el dato del estado */}
                <input
                  type="text"
                  id="resetCode"
                  value={code}
                  onChange={(e) => setCode(e.target.value)} // onChange actualiza el estado
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">Nueva Contrasena</label>
                {/* Controlled Component: value toma el dato del estado */}
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} // onChange actualiza el estado
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar Contrasena</label>
                {/* Controlled Component: value toma el dato del estado */}
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} // onChange actualiza el estado
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Actualizando..." : "Actualizar Contrasena"}
              </button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}

export default Recuperar;

