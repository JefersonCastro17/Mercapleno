import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";
import "../styles/estadisticas.css";
import {
  getVentasMes,
  getTopProductos,
  getFinancialSummary,
  getVentasPorCategoria,
  getVentasPorMetodo,
  getProductosRentabilidad,
  getResumenMes,
  fetchReportPdf,
  formatPrice
} from "../lib/services/reportesService";

const CATEGORY_COLORS = ["#0ea5e9", "#f59e0b", "#22c55e", "#ef4444", "#8b5cf6", "#14b8a6", "#ec4899", "#f97316"];
const PAYMENT_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"];

const safeNumber = (value) => Number(value) || 0;

export default function Estadisticas() {
  const navigate = useNavigate();

  // Estados de datos
  const [ventasMes, setVentasMes] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({
    ingresos_totales: 0,
    costo_estimado: 0,
    ganancia_bruta: 0,
    margen_porcentaje: 0,
    ticket_promedio: 0,
    total_ventas: 0,
    inventario: {
      unidades_stock_total: 0,
      valor_venta: 0,
      valor_costo: 0,
      productos_stock_bajo: 0
    }
  });
  const [ventasCategoria, setVentasCategoria] = useState([]);
  const [ventasMetodo, setVentasMetodo] = useState([]);
  const [productosRentabilidad, setProductosRentabilidad] = useState([]);
  const [resumenMes, setResumenMes] = useState([]);

  // Estados de control y filtros
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activePreset, setActivePreset] = useState("todo");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Aplicar presets de fecha
  const applyPreset = (preset) => {
    setActivePreset(preset);
    const now = new Date();
    const formatDate = (d) => d.toISOString().split("T")[0];

    if (preset === "hoy") {
      const today = formatDate(now);
      setFechaInicio(today);
      setFechaFin(today);
    } else if (preset === "7d") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setFechaInicio(formatDate(d));
      setFechaFin(formatDate(now));
    } else if (preset === "mes") {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      setFechaInicio(formatDate(d));
      setFechaFin(formatDate(now));
    } else if (preset === "anio") {
      const d = new Date(now.getFullYear(), 0, 1);
      setFechaInicio(formatDate(d));
      setFechaFin(formatDate(now));
    } else {
      setFechaInicio("");
      setFechaFin("");
    }
  };

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [
        rFinancial,
        rVentasMes,
        rTopProductos,
        rVentasCat,
        rVentasMet,
        rProdRentables,
        rResumenMes
      ] = await Promise.all([
        getFinancialSummary(fechaInicio, fechaFin),
        getVentasMes(fechaInicio ? fechaInicio.slice(0, 7) : undefined, fechaFin ? fechaFin.slice(0, 7) : undefined),
        getTopProductos(),
        getVentasPorCategoria(),
        getVentasPorMetodo(),
        getProductosRentabilidad(),
        getResumenMes()
      ]);

      if (rFinancial) {
        setFinancialSummary({
          ingresos_totales: safeNumber(rFinancial.ingresos_totales),
          costo_estimado: safeNumber(rFinancial.costo_estimado),
          ganancia_bruta: safeNumber(rFinancial.ganancia_bruta),
          margen_porcentaje: safeNumber(rFinancial.margen_porcentaje),
          ticket_promedio: safeNumber(rFinancial.ticket_promedio),
          total_ventas: safeNumber(rFinancial.total_ventas),
          inventario: {
            unidades_stock_total: safeNumber(rFinancial.inventario?.unidades_stock_total),
            valor_venta: safeNumber(rFinancial.inventario?.valor_venta),
            valor_costo: safeNumber(rFinancial.inventario?.valor_costo),
            productos_stock_bajo: safeNumber(rFinancial.inventario?.productos_stock_bajo)
          }
        });
      }

      setVentasMes(Array.isArray(rVentasMes) ? rVentasMes.map(v => ({ ...v, total: safeNumber(v.total) })) : []);
      setTopProductos(Array.isArray(rTopProductos) ? rTopProductos : []);
      setVentasCategoria(Array.isArray(rVentasCat) ? rVentasCat.map(c => ({ ...c, total_ingresos: safeNumber(c.total_ingresos), unidades_vendidas: safeNumber(c.unidades_vendidas) })) : []);
      setVentasMetodo(Array.isArray(rVentasMet) ? rVentasMet.map(m => ({ ...m, total_recaudado: safeNumber(m.total_recaudado), transacciones: safeNumber(m.transacciones) })) : []);
      setProductosRentabilidad(Array.isArray(rProdRentables) ? rProdRentables : []);
      setResumenMes(Array.isArray(rResumenMes) ? rResumenMes.map(m => ({ ...m, total_mes: safeNumber(m.total_mes), cantidad_ventas: safeNumber(m.cantidad_ventas) })) : []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error al cargar reportes:", error);
      if (error.status === 401 || error.status === 403) {
        setErrorMessage("Sesión no autorizada o expirada. Por favor inicia sesión nuevamente para acceder a los reportes.");
      } else {
        setErrorMessage("No se pudieron cargar las estadísticas. Si el backend está iniciando en la nube, reintenta en unos segundos.");
      }
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin]);

  const handlePdfDownload = async () => {
    try {
      const blob = await fetchReportPdf();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte_financiero_mercapleno_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        alert("Sesion expirada. Inicia sesion nuevamente.");
        navigate("/login", { replace: true });
      } else {
        alert("No se pudo descargar el PDF.");
      }
    }
  };

  const handlePdfPrint = async () => {
    try {
      const blob = await fetchReportPdf();
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      if (!printWindow) {
        alert("Permite las ventanas emergentes para imprimir el PDF.");
        return;
      }
      const cleanup = () => window.URL.revokeObjectURL(url);
      const timer = setInterval(() => {
        if (printWindow.document.readyState === "complete") {
          clearInterval(timer);
          printWindow.focus();
          printWindow.print();
          cleanup();
        }
      }, 400);
      setTimeout(() => {
        clearInterval(timer);
        try {
          printWindow.focus();
          printWindow.print();
        } catch (err) {
          // ignore
        }
        cleanup();
      }, 3000);
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        alert("Sesion expirada. Inicia sesion nuevamente.");
        navigate("/login", { replace: true });
      } else {
        alert("No se pudo imprimir el PDF.");
      }
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Cálculos y transformaciones
  const ventasOrdenadas = useMemo(() => {
    return [...ventasMes].sort((a, b) => String(a.mes).localeCompare(String(b.mes)));
  }, [ventasMes]);

  const pieCategoriaData = useMemo(() => {
    return ventasCategoria
      .map(c => ({
        name: c.categoria,
        value: safeNumber(c.total_ingresos)
      }))
      .filter(c => c.value > 0);
  }, [ventasCategoria]);

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "Sin datos";

  return (
    <div className="dashboard">
      {/* ENCABEZADO */}
      <header className="dashboard-header">
        <div className="header-text">
          <span className="eyebrow">Analítica & Rendimiento Financiero</span>
          <h1>Panel de Control Mercapleno</h1>
          <p className="subtitle">
            Monitoreo en tiempo real de ingresos, márgenes, inventario y ventas · Actualizado: {lastUpdatedLabel}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => navigate("/usuarioC")}>
            ⬅ Volver al Panel
          </button>
          <button className="btn-secondary" onClick={cargarDatos} disabled={loading}>
            {loading ? "Actualizando..." : "🔄 Actualizar"}
          </button>
          <button className="btn-secondary" onClick={handlePdfPrint} disabled={loading}>
            🖨️ Imprimir PDF
          </button>
          <button className="btn-primary" onClick={handlePdfDownload} disabled={loading}>
            📥 Descargar Reporte
          </button>
        </div>
      </header>

      {/* BANNER DE ERROR SI OCURRE */}
      {errorMessage && (
        <div style={{
          background: "#fee2e2",
          border: "1px solid #ef4444",
          color: "#991b1b",
          padding: "1rem 1.5rem",
          borderRadius: "10px",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          fontWeight: 500
        }}>
          <div>
            <strong>⚠️ Estado: </strong> {errorMessage}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="btn-primary"
              style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem", cursor: "pointer" }}
              onClick={cargarDatos}
            >
              Reintentar
            </button>
            {errorMessage.includes("inicia sesión") && (
              <button
                className="btn-secondary"
                style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem", cursor: "pointer" }}
                onClick={() => navigate("/login")}
              >
                Ir a Login
              </button>
            )}
          </div>
        </div>
      )}

      {/* BARRA DE FILTROS Y PRESETS TEMPORALES */}
      <section className="filter-card">
        <div className="presets-bar">
          <span className="presets-label">Periodo:</span>
          <button
            type="button"
            className={`preset-btn ${activePreset === "todo" ? "active" : ""}`}
            onClick={() => applyPreset("todo")}
          >
            Histórico Completo
          </button>
          <button
            type="button"
            className={`preset-btn ${activePreset === "hoy" ? "active" : ""}`}
            onClick={() => applyPreset("hoy")}
          >
            Hoy
          </button>
          <button
            type="button"
            className={`preset-btn ${activePreset === "7d" ? "active" : ""}`}
            onClick={() => applyPreset("7d")}
          >
            Últimos 7 Días
          </button>
          <button
            type="button"
            className={`preset-btn ${activePreset === "mes" ? "active" : ""}`}
            onClick={() => applyPreset("mes")}
          >
            Este Mes
          </button>
          <button
            type="button"
            className={`preset-btn ${activePreset === "anio" ? "active" : ""}`}
            onClick={() => applyPreset("anio")}
          >
            Este Año
          </button>
        </div>

        <div className="custom-dates">
          <div className="filter-field">
            <label htmlFor="fechaInicio">Desde</label>
            <input
              type="date"
              id="fechaInicio"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value);
                setActivePreset("custom");
              }}
            />
          </div>
          <div className="filter-field">
            <label htmlFor="fechaFin">Hasta</label>
            <input
              type="date"
              id="fechaFin"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value);
                setActivePreset("custom");
              }}
            />
          </div>
          {(fechaInicio || fechaFin) && (
            <button
              className="btn-ghost"
              onClick={() => applyPreset("todo")}
            >
              Limpiar
            </button>
          )}
        </div>
      </section>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando métricas financieras en tiempo real...</p>
        </div>
      ) : (
        <>
          {/* TARJETAS DE KPIS FINANCIEROS */}
          <section className="kpi-grid">
            <div className="kpi-card tone-revenue">
              <div className="kpi-header">
                <span className="kpi-icon">💰</span>
                <span className="kpi-badge badge-blue">Ingresos Brutos</span>
              </div>
              <p className="kpi-title">Facturación Total</p>
              <h3>{formatPrice(financialSummary.ingresos_totales)}</h3>
              <span className="kpi-sub">{financialSummary.total_ventas} transacciones registradas</span>
            </div>

            <div className="kpi-card tone-profit">
              <div className="kpi-header">
                <span className="kpi-icon">📈</span>
                <span className="kpi-badge badge-green">Utilidad Neta</span>
              </div>
              <p className="kpi-title">Ganancia Bruta Estimada</p>
              <h3>{formatPrice(financialSummary.ganancia_bruta)}</h3>
              <span className="kpi-sub">Costo de venta: {formatPrice(financialSummary.costo_estimado)}</span>
            </div>

            <div className="kpi-card tone-margin">
              <div className="kpi-header">
                <span className="kpi-icon">📊</span>
                <span className="kpi-badge badge-purple">Rentabilidad</span>
              </div>
              <p className="kpi-title">Margen de Ganancia</p>
              <h3>{financialSummary.margen_porcentaje}%</h3>
              <span className="kpi-sub">Retorno promedio sobre ventas</span>
            </div>

            <div className="kpi-card tone-ticket">
              <div className="kpi-header">
                <span className="kpi-icon">🧾</span>
                <span className="kpi-badge badge-amber">Ticket Medio</span>
              </div>
              <p className="kpi-title">Gasto por Cliente</p>
              <h3>{formatPrice(financialSummary.ticket_promedio)}</h3>
              <span className="kpi-sub">Promedio por cada compra</span>
            </div>

            <div className="kpi-card tone-inventory">
              <div className="kpi-header">
                <span className="kpi-icon">📦</span>
                <span className="kpi-badge badge-cyan">Inventario</span>
              </div>
              <p className="kpi-title">Valor en Bodega (Venta)</p>
              <h3>{formatPrice(financialSummary.inventario.valor_venta)}</h3>
              <span className="kpi-sub">
                {financialSummary.inventario.unidades_stock_total} unidades · {financialSummary.inventario.productos_stock_bajo} stock crítico
              </span>
            </div>
          </section>

          {/* CUADRÍCULA DE GRÁFICOS Y ANALÍTICA */}
          <section className="grid">
            {/* GRÁFICO 1: EVOLUCIÓN DE VENTAS */}
            <div className="card span-2">
              <div className="card-header">
                <div>
                  <h2>Evolución de Ingresos</h2>
                  <span className="card-sub">Facturación mensual del supermercado</span>
                </div>
              </div>
              <div className="card-body">
                {ventasOrdenadas.length === 0 ? (
                  <div className="empty-state">No hay registros de ventas en este periodo.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={ventasOrdenadas}>
                      <defs>
                        <linearGradient id="ventasGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="mes" tickMargin={8} stroke="#64748b" />
                      <YAxis tickFormatter={(v) => formatPrice(v).replace("$", "")} stroke="#64748b" />
                      <Tooltip formatter={(value) => formatPrice(value)} />
                      <Area type="monotone" dataKey="total" name="Ingresos" stroke="#0ea5e9" strokeWidth={3} fill="url(#ventasGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* GRÁFICO 2: VENTAS POR CATEGORÍA (DONUT) */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h2>Mix por Categoría</h2>
                  <span className="card-sub">Participación de ingresos</span>
                </div>
              </div>
              <div className="card-body">
                {pieCategoriaData.length === 0 ? (
                  <div className="empty-state">Sin ventas por categoría.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Tooltip formatter={(value) => formatPrice(value)} />
                      <Legend verticalAlign="bottom" height={36} />
                      <Pie
                        data={pieCategoriaData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={105}
                        paddingAngle={3}
                      >
                        {pieCategoriaData.map((entry, index) => (
                          <Cell key={`cell-${entry.name}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* GRÁFICO 3: VENTAS POR MÉTODO DE PAGO */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h2>Métodos de Pago</h2>
                  <span className="card-sub">Recaudación por canal</span>
                </div>
              </div>
              <div className="card-body">
                {ventasMetodo.length === 0 ? (
                  <div className="empty-state">Sin datos de métodos de pago.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ventasMetodo}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="metodo" stroke="#64748b" />
                      <YAxis tickFormatter={(v) => formatPrice(v).replace("$", "")} stroke="#64748b" />
                      <Tooltip formatter={(value) => formatPrice(value)} />
                      <Bar dataKey="total_recaudado" name="Recaudado" radius={[8, 8, 0, 0]}>
                        {ventasMetodo.map((entry, index) => (
                          <Cell key={`pay-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* TABLA: TOP PRODUCTOS POR RENTABILIDAD */}
            <div className="card span-2">
              <div className="card-header">
                <div>
                  <h2>Top Productos Más Rentables</h2>
                  <span className="card-sub">Mayor ganancia bruta aportada al supermercado</span>
                </div>
              </div>
              <div className="card-body">
                {productosRentabilidad.length === 0 ? (
                  <div className="empty-state">No hay ventas registradas para calcular rentabilidad.</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Categoría</th>
                          <th>Unidades</th>
                          <th>Facturado</th>
                          <th>Ganancia Neta</th>
                          <th>Margen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productosRentabilidad.map((p, idx) => (
                          <tr key={p.id_productos || idx}>
                            <td style={{ fontWeight: 600, textAlign: "left" }}>{p.nombre}</td>
                            <td><span className="cat-pill">{p.categoria}</span></td>
                            <td>{p.unidades_vendidas}</td>
                            <td>{formatPrice(p.total_facturado)}</td>
                            <td style={{ color: "#16a34a", fontWeight: 700 }}>{formatPrice(p.ganancia_total)}</td>
                            <td><span className="badge-margin">{p.margen_pct}%</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* TABLA: RESUMEN MENSUAL */}
            <div className="card span-3">
              <div className="card-header">
                <div>
                  <h2>Histórico Mensual Detallado</h2>
                  <span className="card-sub">Resumen de ventas y transacciones por mes</span>
                </div>
              </div>
              <div className="card-body">
                {resumenMes.length === 0 ? (
                  <div className="empty-state">Sin datos mensuales registrados.</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Periodo (Mes)</th>
                          <th>Cantidad de Ventas</th>
                          <th>Total Facturado</th>
                          <th>Ticket Promedio Mensual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumenMes.map((m, i) => (
                          <tr key={`${m.mes}-${i}`}>
                            <td style={{ fontWeight: 600 }}>{m.mes}</td>
                            <td>{m.cantidad_ventas} transacciones</td>
                            <td style={{ fontWeight: 700 }}>{formatPrice(m.total_mes)}</td>
                            <td>
                              {formatPrice(m.cantidad_ventas > 0 ? m.total_mes / m.cantidad_ventas : 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}


