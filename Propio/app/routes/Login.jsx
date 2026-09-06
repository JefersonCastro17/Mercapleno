import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/base.css";
import "../styles/login.css";
import { useAuthContext } from "../contexts/AuthContext";
import { httpRequest } from "../lib/api/httpClient";
import { API_ENDPOINTS } from "../lib/config/api.config";

function Login() {
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const requestedRedirect = params.get("redirect");

    if (!requestedRedirect || !requestedRedirect.startsWith("/") || requestedRedirect.startsWith("//")) {
      return null;
    }

    if (requestedRedirect === "/login") {
      return null;
    }

    return requestedRedirect;
  }, [location.search]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [requireCode, setRequireCode] = useState(false);
  const [pendingToken, setPendingToken] = useState("");
  const [twoFactorUser, setTwoFactorUser] = useState(null);
  const [twoFactorExpiresInMinutes, setTwoFactorExpiresInMinutes] = useState(null);
  const [loading, setLoading] = useState(false);

  const resetTwoFactorState = () => {
    setRequireCode(false);
    setSecurityCode("");
    setPendingToken("");
    setTwoFactorUser(null);
    setTwoFactorExpiresInMinutes(null);
  };

  const finishLogin = (userData, userToken = null) => {
    login(userData, userToken);

    if (redirectPath) {
      navigate(redirectPath, { replace: true });
      return;
    }

    const userRole = Number(userData.id_rol);
    if (userRole === 1 || userRole === 2) {
      navigate("/usuarioC", { replace: true });
      return;
    }

    navigate("/catalogo", { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (requireCode) {
        if (!pendingToken) {
          alert("La verificacion de segundo factor ya no es valida. Vuelve a iniciar sesion.");
          resetTwoFactorState();
          return;
        }

        const data = await httpRequest(API_ENDPOINTS.auth.verifyLoginCode, {
          method: "POST",
          data: {
            pendingToken,
            code: securityCode
          }
        });

        if (!data?.success) {
          alert(data?.message || "No se pudo validar el codigo de seguridad.");
          return;
        }

        resetTwoFactorState();
        finishLogin(data.user, data.token);
        alert(data.message || "Inicio de sesion exitoso");
        return;
      }

      const data = await httpRequest(API_ENDPOINTS.auth.login, {
        method: "POST",
        data: { email, password }
      });

      if (!data?.success) {
        alert(data?.message || "Credenciales incorrectas");
        setLoading(false);
        return;
      }

      if (data.requiresTwoFactor) {
        setRequireCode(true);
        setPendingToken(data.pendingToken || "");
        setTwoFactorUser(data.user || null);
        setTwoFactorExpiresInMinutes(data.twoFactorExpiresInMinutes || null);
        setSecurityCode("");
        alert(data.message || "Se envio un codigo de seguridad a tu correo.");
      } else {
        resetTwoFactorState();
        finishLogin(data.user, data.token);
      }
    } catch (error) {
      if (error.status === 403 && error.data?.code === "EMAIL_NOT_VERIFIED") {
        alert("Debes verificar tu correo antes de iniciar sesion.");
        navigate(`/verificar?email=${encodeURIComponent(email)}`);
      } else {
        if (requireCode && (error.status === 400 || error.status === 401)) {
          resetTwoFactorState();
        }
        console.error("Error al iniciar sesion:", error);
        alert(error.message || "Error de conexion con el servidor de autenticacion.");
      }
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
            <Link to="/registro" className="nav-btn">Registrate</Link>
          </nav>
        </div>
      </header>

      <main>
        <div className="form-container">
          <h2>Iniciar Sesion</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Correo electronico</label>
              <input
                type="email"
                id="email"
                placeholder="E-mail"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={requireCode}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contrasena</label>
              <input
                type="password"
                id="password"
                placeholder="Contrasena"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={requireCode}
              />
            </div>

            {requireCode ? (
              <>
                <p className="login-helper-text">
                  Ingresa el codigo enviado a {twoFactorUser?.email || email}.
                  {twoFactorExpiresInMinutes ? ` Vence en ${twoFactorExpiresInMinutes} minutos.` : ""}
                </p>

                <div className="form-group">
                  <label htmlFor="securityCode">Codigo de seguridad</label>
                  <input
                    type="text"
                    id="securityCode"
                    placeholder="Ingrese el codigo recibido por correo"
                    value={securityCode}
                    onChange={(event) => setSecurityCode(event.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </>
            ) : null}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Procesando..." : requireCode ? "Verificar codigo" : "Ingresar"}
            </button>

            {requireCode ? (
              <button
                type="button"
                className="secondary-btn"
                onClick={resetTwoFactorState}
                disabled={loading}
              >
                Volver al inicio de sesion
              </button>
            ) : null}

            <div className="register-link">
              <p>
                Olvidaste tu contrasena? <Link to="/recuperar">Recuperala</Link>
              </p>
              <p>
                No tienes cuenta? <Link to="/registro">Registrate aqui</Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

export default Login;
