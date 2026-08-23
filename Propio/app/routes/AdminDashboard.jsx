import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";

import "../styles/base.css";
import "../styles/adminDashboard.css";

function AdminDashboard() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const getRoleName = (roleId) => {
    switch (roleId) {
      case 1:
        return "Administrador";
      case 2:
        return "Empleado";
      default:
        return "Usuario Restringido";
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavigateInventory = () => {
    if (!user?.id_rol) {
      alert("Error: datos de usuario no disponibles.");
      return;
    }

    if (user.id_rol === 1) {
      navigate("/products/admin");
      return;
    }

    if (user.id_rol === 2) {
      navigate("/products/employee");
      return;
    }

    alert("Acceso no permitido para este rol.");
  };

  const modules = [
    {
      id: "inventario",
      code: "INV",
      title: "Gestion de Inventario",
      detail:
        user?.id_rol === 1
          ? "Administra productos y stock del sistema."
          : "Registra entradas y salidas de inventario.",
      action: "Ir a Inventario",
      tone: "tone-inventory",
      onClick: handleNavigateInventory
    },
    ...(user?.id_rol === 1
      ? [
          {
            id: "usuarios",
            code: "USR",
            title: "Gestion de Usuarios",
            detail: "Administra cuentas, roles y permisos.",
            action: "Ir a Usuarios",
            tone: "tone-users",
            onClick: () => navigate("/admin/users")
          }
        ]
      : []),
    {
      id: "reportes",
      code: "RPT",
      title: "Reportes de Ventas",
      detail: "Consulta indicadores y resumen de ventas.",
      action: "Ir a Reportes",
      tone: "tone-reports",
      onClick: () => navigate("/estadisticas")
    }
  ];

  const firstName = user?.nombre || "Usuario";

  return (
    <main className="ops-shell">
      <div className="ops-wrap">
        <section className="ops-header-card">
          <div>
            <span className="ops-overline">Panel de control</span>
            <h1>Hola, {firstName}</h1>
            <p>Selecciona un modulo para continuar con tu trabajo.</p>
          </div>

          <div className="ops-header-meta">
            <span className={`ops-role-pill ${user?.id_rol === 1 ? "is-admin" : "is-employee"}`}>
              Rol: {getRoleName(user?.id_rol)}
            </span>
            <button type="button" className="ops-logout-btn" onClick={handleLogout}>
              Cerrar sesion
            </button>
          </div>
        </section>

        <section className="ops-section">
          <h2>Accesos rapidos</h2>
          <div className="ops-grid">
            {modules.map((module) => (
              <article key={module.id} className={`module-card ${module.tone}`}>
                <div className="module-top">
                  <span className="module-code">{module.code}</span>
                  <h3>{module.title}</h3>
                </div>
                <p>{module.detail}</p>
                <button type="button" className="module-btn" onClick={module.onClick}>
                  {module.action}
                </button>
              </article>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}

export default AdminDashboard;
