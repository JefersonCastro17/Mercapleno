import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
// Importación de Contextos y Componentes
import { CartProvider } from './contexts/CartContext'; 
import { useAuthContext } from './contexts/AuthContext'; 
import Header from './components/ui/Header'; 
import InventoryPage from './routes/InventoryPage'; 
import CartPage from './routes/CartPage'; 			
import TicketPage from './routes/TicketPage'; 	
// Home route removed: root now redirects to login
import Login from './routes/Login'; 					 
import Registro from './routes/Registro'; 			 
import Verificar from './routes/Verificar';
import Recuperar from './routes/Recuperar';
import AdminDashboard from './routes/AdminDashboard'; 
// 🔑 IMPORTACIONES CLAVE para la nueva funcionalidad
import Estadisticas from './routes/Estadisticas'; 
import UsuarioC from './routes/usuarioC'; 
import ListaProductosAdmin from './routes/Lista_productos'; // CRUD Completo (Admin)
import Proveedores from './routes/Proveedores';
// import ListaProductosEmployee from './routes/Lista_productos_Empleado'; // <-- ELIMINADO/COMENTADO
import RegistroMovimientos from './routes/RegistroMovimientos'; // <-- AÑADIDO (CAMBIO 1)


/**
 *COMPONENTE AUXILIAR: RoleRoute (Se mantiene sin cambios)
 */
function RoleRoute({ requiredRoles, element }) {
    const { user, isAuthenticated } = useAuthContext();
    const location = useLocation();

    // Si no hay usuario o no está autenticado, redirigir al login con la ruta solicitada.
    if (!isAuthenticated || !user) {
        const redirectPath = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?redirect=${redirectPath}`} replace />;
    }

    const currentRole = Number(user.id_rol);
    if (requiredRoles.includes(currentRole)) {
        return element;
    }

    console.warn(`Acceso denegado. Rol ${currentRole} intentó acceder a ruta restringida.`);
    return <Navigate to="/unauthorized" replace />;
}


function App() {
	const { user, isAuthenticated } = useAuthContext();
    const location = useLocation();

	// Determina la ruta de inicio tras el login si no se especifica una
    const getHomeRoute = () => {
        if (!user || user.id_rol === undefined || user.id_rol === null) {
            return "/login"; 
        }
        const roleId = Number(user.id_rol);
        // Rol 3 (Cliente) va a /catalogo. Roles 1 (Admin) y 2 (Empleado) van a /usuarioC (Dashboard de Operaciones)
        return roleId === 3 ? "/catalogo" : "/usuarioC";
    };

        const roleId = user ? Number(user.id_rol) : null;
    // Mostrar el Header solo para clientes autenticados.
    const showHeader = isAuthenticated && roleId === 3;

	return (
		<CartProvider>
            {showHeader && <Header />}
			<Routes>
				
				{/*RUTAS PÚBLICAS */}       // aqui se pone los roles donde se validaron a la bd donde en el backend cada componente lo valida
                <Route path="/" element={
                    <Navigate to="/login" replace />
                } />
				<Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to={getHomeRoute()} replace /> : <Login />}
                />
				<Route
                    path="/registro"
                    element={isAuthenticated ? <Navigate to={getHomeRoute()} replace /> : <Registro />}
                />
				<Route
                    path="/verificar"
                    element={isAuthenticated ? <Navigate to={getHomeRoute()} replace /> : <Verificar />}
                />
				<Route
                    path="/recuperar"
                    element={isAuthenticated ? <Navigate to={getHomeRoute()} replace /> : <Recuperar />}
                />
				<Route path="/unauthorized" element={<h1 style={{textAlign: 'center', marginTop: '100px'}}>Acceso Denegado (403)</h1>} />

				{/* 🛒 RUTAS DE VENTA (Acceso: Todos los Roles Autenticados - 1, 2, 3) */}
				<Route path="/catalogo" element={
                    <RoleRoute requiredRoles={[1, 2, 3]} element={<InventoryPage />} />
                } />
				<Route path="/cart" element={
                    <RoleRoute requiredRoles={[1, 2, 3]} element={<CartPage />} />
                } />
				<Route path="/ticket" element={
                    <RoleRoute requiredRoles={[1, 2, 3]} element={<TicketPage />} />
                } />
				
				{/* 💻 DASHBOARD Y MÓDULOS OPERACIONALES (Roles 1 y 2) */}
                <Route path="/usuarioC" element={
                    <RoleRoute requiredRoles={[1, 2]} element={<AdminDashboard />} /> 
                } />
				
				{/*RUTAS DE PRODUCTOS - DIVIDIDAS POR ROL */}
				
				{/* RUTA: Admin Products (CRUD Completo) */}
				<Route path="/products/admin" element={
					<RoleRoute requiredRoles={[1]} element={<ListaProductosAdmin />} />	
				} />

				{/* 🔑 CAMBIO 2: RUTA: Employee Products (Ahora es Registro de Movimientos) */}
				<Route path="/products/employee" element={
					<RoleRoute requiredRoles={[1, 2]} element={<RegistroMovimientos />} /> // <-- ¡Cambiado!
				} />
				
				{/* 🔑 GESTIÓN DE USUARIOS (Rol 1 - Administrador) */}
				<Route path="/admin/users" element={
                    <RoleRoute requiredRoles={[1]} element={<UsuarioC />} /> 
                } />
                <Route path="/admin/proveedores" element={
                    <RoleRoute requiredRoles={[1]} element={<Proveedores />} /> 
                } />

				{/* 🔑 MÓDULO DE REPORTES (Roles 1 y 2) */}
				<Route path="/estadisticas" element={
                    <RoleRoute requiredRoles={[1, 2]} element={<Estadisticas />} /> 
                } />

				{/* Ruta comodín (Se mantiene) */}
				<Route path="*" element={
                    isAuthenticated && user ? (
                        <Navigate to={getHomeRoute()} replace />
                    ) : (
                        <Navigate to="/" replace />
                    )
                } />

			</Routes>
		</CartProvider>
	);
}

export default App;
