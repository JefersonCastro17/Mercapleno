// 🟢 src/pages/InventarioMovimientos.jsx (NUEVO COMPONENTE PARA EL MÓDULO)

import React, { useState, useEffect } from "react";
import { getInventoryProducts, registerInventoryMovement } from '../services/inventarioService';
// Importa el contexto para el usuario y el token, y los estilos
import { useAuthContext } from '../context/AuthContext'; 
import "../styles/Lista_productos.css"; // Reutiliza un estilo de tabla si existe

const MOVEMENT_TYPES = [
    { value: 'ENTRADA', label: 'Entrada / Adición de Stock' },
    { value: 'SALIDA', label: 'Salida / Ajuste Negativo' },
];

export default function InventarioMovimientos() {
    const { token, user, logout } = useAuthContext();
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    
    // Estado del formulario de movimiento
    const [formData, setFormData] = useState({
        id_producto: '',
        cantidad: '',
        tipo_movimiento: 'ENTRADA',
        motivo: '',
    });

    // Cargar la lista de productos
    useEffect(() => {
        const fetchProducts = async () => {
            if (!token) {
                setError("Acceso no autorizado. Por favor, inicie sesión.");
                logout();
                return;
            }
            setLoading(true);
            try {
                // Obtener productos, ya incluye el stock si la función productData.getProducts es correcta
                const data = await getInventoryProducts({}); 
                setProductos(data);
                setLoading(false);
            } catch (err) {
                setError("Error al cargar la lista de productos.");
                setLoading(false);
            }
        };

        fetchProducts();
    }, [token, logout]);

    // Manejador de cambios en el formulario
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setMessage(null); // Limpiar mensaje al cambiar el formulario
        setError(null);
    };

    // Manejador de envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        const { id_producto, cantidad, tipo_movimiento, motivo } = formData;

        if (!id_producto || !cantidad || !motivo) {
            setError("Debe seleccionar un producto, ingresar una cantidad y un motivo.");
            return;
        }

        if (Number(cantidad) <= 0) {
            setError("La cantidad debe ser un número positivo.");
            return;
        }
        
        try {
            setLoading(true);
            await registerInventoryMovement({
                id_producto: Number(id_producto),
                cantidad: Number(cantidad),
                tipo_movimiento,
                motivo,
            });

            // Éxito
            setMessage(`¡Movimiento de ${tipo_movimiento} registrado con éxito!`);
            setFormData({ // Resetear formulario
                id_producto: '',
                cantidad: '',
                tipo_movimiento: 'ENTRADA',
                motivo: '',
            });

            // Recargar la lista de productos para reflejar el nuevo stock
            const updatedProducts = await getInventoryProducts({});
            setProductos(updatedProducts);
            setLoading(false);

        } catch (err) {
            setLoading(false);
            const errorMessage = err.message || "Error al registrar el movimiento. Verifique la cantidad en stock.";
            setError(errorMessage);
        }
    };

    // Producto seleccionado para mostrar el stock
    const productoSeleccionado = productos.find(p => p.id.toString() === formData.id_producto);

    return (
        <div className="admin-container">
            <header className="page-header">
                <h1>📦 Módulo de Entradas y Salidas (Ajuste de Inventario)</h1>
                <p>Bienvenido: {user?.nombre} {user?.apellido}</p>
            </header>
            
            <main className="main-content">
                <section className="card form-section">
                    <h2>Registrar Nuevo Movimiento</h2>
                    <form onSubmit={handleSubmit} className="inventory-movement-form">
                        
                        {/* Mensajes de feedback */}
                        {error && <p className="alert-error" style={{color: 'red', fontWeight: 'bold'}}>{error}</p>}
                        {message && <p className="alert-success" style={{color: 'green', fontWeight: 'bold'}}>{message}</p>}

                        {/* Producto */}
                        <div className="form-group">
                            <label htmlFor="id_producto">Producto:</label>
                            <select 
                                name="id_producto" 
                                id="id_producto" 
                                value={formData.id_producto} 
                                onChange={handleChange} 
                                required
                            >
                                <option value="">-- Seleccione un Producto --</option>
                                {loading ? (
                                    <option disabled>Cargando productos...</option>
                                ) : (
                                    productos.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre} (ID: {p.id}) - Stock Actual: {p.stock || 0}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                        
                        {/* Tipo de Movimiento */}
                        <div className="form-group">
                            <label htmlFor="tipo_movimiento">Tipo de Movimiento:</label>
                            <select 
                                name="tipo_movimiento" 
                                id="tipo_movimiento" 
                                value={formData.tipo_movimiento} 
                                onChange={handleChange} 
                                required
                            >
                                {MOVEMENT_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Cantidad */}
                        <div className="form-group">
                            <label htmlFor="cantidad">Cantidad a Ajustar:</label>
                            <input 
                                type="number" 
                                name="cantidad" 
                                id="cantidad" 
                                value={formData.cantidad} 
                                onChange={handleChange} 
                                min="1"
                                required
                            />
                        </div>
                        
                        {/* Motivo */}
                        <div className="form-group full-width">
                            <label htmlFor="motivo">Motivo del Ajuste:</label>
                            <textarea 
                                name="motivo" 
                                id="motivo" 
                                value={formData.motivo} 
                                onChange={handleChange} 
                                placeholder="Ej: Inventario inicial, Devolución de proveedor, Daño/Pérdida por X..."
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Procesando...' : `Registrar ${formData.tipo_movimiento}`}
                        </button>
                    </form>
                </section>
                
            </main>
            <button className="btn green" onClick={() => window.history.back()} style={{marginTop: '20px'}}>Volver al Dashboard</button>
        </div>
    );
}