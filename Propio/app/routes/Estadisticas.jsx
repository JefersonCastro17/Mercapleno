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
  getResumen,
  getResumenMes,
  fetchReportPdf,
  formatPrice
} from "../lib/services/reportesService";

const PIE_COLORS = ["#0ea5e9", "#f59e0b", "#22c55e", "#ef4444", "#14b8a6"];

const formatMonthRange = (inicio, fin) => {
  if (!inicio && !fin) return "Todo el periodo";
  return `${inicio || "inicio"} a ${fin || "hoy"}`;
};

const safeNumber = (value) => Number(value) || 0;

export default function Estadisticas() {
  const navigate = useNavigate();

  const [ventasMes, setVentasMes] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [resumen, setResumen] = useState({ dinero_total: 0, total_ventas: 0, promedio: 0 });
  const [resumenMes, setResumenMes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mesInicio, setMesInicio] = useState("");
  const [mesFin, setMesFin] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [rVentasMes, rTopProductos, rResumen, rResumenMes] = await Promise.all([
        getVentasMes(mesInicio, mesFin),
        getTopProductos(),
        getResumen(),
        getResumenMes()
      ]);

      const resumenLimpio = {
        total_ventas: safeNumber(rResumen.total_ventas),
        dinero_total: safeNumber(rResumen.dinero_total),
        promedio: safeNumber(rResumen.promedio)
      };

      const resumenMesLimpio = rResumenMes.map((item) => ({
        ...item,
        total_mes: safeNumber(item.total_mes),
        cantidad_ventas: safeNumber(item.cantidad_ventas)
      }));

      const ventasMesLimpio = rVentasMes.map((item) => ({
        ...item,
        total: safeNumber(item.total)
      }));

      setVentasMes(ventasMesLimpio);
      setTopProductos(rTopProductos);
      setResumen(resumenLimpio);
      setResumenMes(resumenMesLimpio);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error al cargar reportes:", error);
      if (error.status === 401 || error.status === 403) {
        alert("Sesion expirada o no autorizada. Redirigiendo al Login.");
        navigate("/login", { replace: true });
      } else {
        alert("Error al cargar los datos de reportes. Verifique la conexion.");
      }
    } finally {
      setLoading(false);
    }
  }, [mesInicio, mesFin, navigate]);

  const handlePdfDownload = async () => {
    try {
      const blob = await fetchReportPdf();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "reporte_ventas.pdf";
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

  const ventasOrdenadas = useMemo(() => {
    return [...ventasMes].sort((a, b) => String(a.mes).localeCompare(String(b.mes)));
  }, [ventasMes]);

  const totalPeriodo = useMemo(
    () => ventasOrdenadas.reduce((acc, item) => acc + safeNumber(item.total), 0),
    [ventasOrdenadas]
  );

  const promedioMensual = useMemo(() => {
    if (!ventasOrdenadas.length) return 0;
    return totalPeriodo / ventasOrdenadas.length;
  }, [ventasOrdenadas, totalPeriodo]);

  const bestMonth = useMemo(() => {
    if (!ventasOrdenadas.length) return { mes: "-", total: 0 };
    return ventasOrdenadas.reduce((max, item) => (item.total > max.total ? item : max), ventasOrdenadas[0]);
  }, [ventasOrdenadas]);

  const worstMonth = useMemo(() => {
    if (!ventasOrdenadas.length) return { mes: "-", total: 0 };
    return ventasOrdenadas.reduce((min, item) => (item.total < min.total ? item : min), ventasOrdenadas[0]);
  }, [ventasOrdenadas]);

  const crecimientoMensual = useMemo(() => {
    if (ventasOrdenadas.length < 2) return null;
    const last = ventasOrdenadas[ventasOrdenadas.length - 1];
    const prev = ventasOrdenadas[ventasOrdenadas.length - 2];
    if (!prev || prev.total === 0) return null;
    return ((last.total - prev.total) / prev.total) * 100;
  }, [ventasOrdenadas]);

  const topProductosData = useMemo(() => {
    return topProductos
      .map((item) => ({
        name: item.nombre,
        value: safeNumber(item.total_vendido)
      }))
      .filter((item) => item.value > 0)
      .slice(0, 6);
  }, [topProductos]);

  const topProductosTotal = useMemo(
    () => topProductosData.reduce((acc, item) => acc + item.value, 0),
    [topProductosData]
  );

  const topProducto = topProductosData[0];
  const topProductoShare = topProducto && topProductosTotal
    ? (topProducto.value / topProductosTotal) * 100
    : null;

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
      <header className="dashboard-header">
        <div className="header-text">
          <span className="eyebrow">Panel de analitica</span>
          <h1>Estadisticas de ventas</h1>
          <p className="subtitle">
            Rango: {formatMonthRange(mesInicio, mesFin)} · Actualizado: {lastUpdatedLabel}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={cargarDatos} disabled={loading}>
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
          <button className="btn-secondary" onClick={handlePdfPrint} disabled={loading}>
            Imprimir PDF
          </button>
          <button className="btn-primary" onClick={handlePdfDownload} disabled={loading}>
            Descargar PDF
          </button>
        </div>
      </header>

      <section className="filter-card">
        <div className="filter-field">
          <label htmlFor="mesInicio">Desde</label>
          <input type="month" id="mesInicio" value={mesInicio} onChange={(e) => setMesInicio(e.target.value)} />
        </div>
        <div className="filter-field">
          <label htmlFor="mesFin">Hasta</label>
          <input type="month" id="mesFin" value={mesFin} onChange={(e) => setMesFin(e.target.value)} />
        </div>
        <button
          className="btn-ghost"
          onClick={() => {
            setMesInicio("");
            setMesFin("");
          }}
        >
          Limpiar filtros
        </button>
      </section>

      {loading ? (
        <p className="loading">Cargando reportes...</p>
      ) : (
        <>
          <section className="kpi-grid">
            <div className="kpi-card">
              <p className="kpi-title">Ingresos totales</p>
              <h3>{formatPrice(resumen.dinero_total)}</h3>
              <span className="kpi-sub">Periodo completo</span>
            </div>
            <div className="kpi-card">
              <p className="kpi-title">Total de ventas</p>
              <h3>{resumen.total_ventas}</h3>
              <span className="kpi-sub">Transacciones registradas</span>
            </div>
            <div className="kpi-card">
              <p className="kpi-title">Ticket promedio</p>
              <h3>{formatPrice(resumen.promedio)}</h3>
              <span className="kpi-sub">Promedio por compra</span>
            </div>
            <div className="kpi-card">
              <p className="kpi-title">Crecimiento mensual</p>
              <h3>{crecimientoMensual == null ? "-" : `${crecimientoMensual.toFixed(1)}%`}</h3>
              <span className="kpi-sub">Ultimo vs mes anterior</span>
            </div>
          </section>

          <section className="insights">
            <div className="insight">
              <span className="insight-label">Mejor mes</span>
              <strong>{bestMonth.mes}</strong>
              <span>{formatPrice(bestMonth.total)}</span>
            </div>
            <div className="insight">
              <span className="insight-label">Mes mas bajo</span>
              <strong>{worstMonth.mes}</strong>
              <span>{formatPrice(worstMonth.total)}</span>
            </div>
            <div className="insight">
              <span className="insight-label">Promedio mensual</span>
              <strong>{formatPrice(promedioMensual)}</strong>
              <span>Total periodo: {formatPrice(totalPeriodo)}</span>
            </div>
            <div className="insight">
              <span className="insight-label">Top producto</span>
              <strong>{topProducto ? topProducto.name : "-"}</strong>
              <span>{topProductoShare == null ? "-" : `${topProductoShare.toFixed(1)}%`} del top</span>
            </div>
          </section>

          <section className="grid">
            <div className="card span-2">
              <div className="card-header">
                <h2>Ventas por mes</h2>
                <span className="card-sub">Evolucion del ingreso mensual</span>
              </div>
              <div className="card-body">
                {ventasOrdenadas.length === 0 ? (
                  <div className="empty-state">Sin datos para el rango seleccionado.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={ventasOrdenadas}>
                      <defs>
                        <linearGradient id="ventasFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="mes" tickMargin={8} />
                      <YAxis tickFormatter={(v) => formatPrice(v).replace("$", "")} />
                      <Tooltip formatter={(value) => formatPrice(value)} />
                      <Area type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={3} fill="url(#ventasFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Mix de productos</h2>
                <span className="card-sub">Participacion del top</span>
              </div>
              <div className="card-body">
                {topProductosData.length === 0 ? (
                  <div className="empty-state">Sin datos para mostrar.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Tooltip formatter={(value) => formatPrice(value)} />
                      <Legend verticalAlign="bottom" height={36} />
                      <Pie data={topProductosData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={120} paddingAngle={4}>
                        {topProductosData.map((entry, index) => (
                          <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Productos mas vendidos</h2>
                <span className="card-sub">Top por unidades</span>
              </div>
              <div className="card-body">
                {topProductos.length === 0 ? (
                  <div className="empty-state">Sin datos para mostrar.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={topProductos}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="nombre"
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={70}
                        tickFormatter={(value) => (String(value).length > 12 ? `${String(value).slice(0, 12)}...` : value)}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => value} />
                      <Bar dataKey="total_vendido" fill="#f59e0b" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="card span-2">
              <div className="card-header">
                <h2>Resumen mensual</h2>
                <span className="card-sub">Detalle por mes</span>
              </div>
              <div className="card-body">
                {resumenMes.length === 0 ? (
                  <div className="empty-state">Sin datos para mostrar.</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Mes</th>
                          <th>Ventas</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumenMes.map((m, i) => (
                          <tr key={`${m.mes}-${i}`}>
                            <td>{m.mes}</td>
                            <td>{m.cantidad_ventas}</td>
                            <td>{formatPrice(m.total_mes)}</td>
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

