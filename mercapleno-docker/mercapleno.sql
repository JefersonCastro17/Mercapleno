-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 22-02-2026 a las 20:58:53
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `mercapleno`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categoria`
--

CREATE TABLE `categoria` (
  `id_categoria` int(11) NOT NULL,
  `nombre` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categoria`
--

INSERT INTO `categoria` (`id_categoria`, `nombre`) VALUES
(1, 'Abarrotes'),
(2, 'Lácteos'),
(3, 'Cárnicos'),
(4, 'Bebidas'),
(5, 'Panadería'),
(6, 'Frutas y Verduras'),
(7, 'Aseo'),
(8, 'Higiene Personal'),
(9, 'Snacks'),
(10, 'Congelados');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `devolver_productos`
--

CREATE TABLE `devolver_productos` (
  `id_devolucion` int(11) NOT NULL,
  `id_productos` int(11) DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `metodo` varchar(100) DEFAULT NULL,
  `id_tipo_devolucion` int(11) DEFAULT NULL,
  `id_tipo` int(11) DEFAULT NULL,
  `id_documento` char(2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `entrada_productos`
--

CREATE TABLE `entrada_productos` (
  `id_entrada` int(11) NOT NULL,
  `id_productos` int(11) DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `costo_unitario` decimal(10,2) DEFAULT NULL,
  `observaciones` varchar(100) DEFAULT NULL,
  `id_movimiento` int(11) DEFAULT NULL,
  `id_documento` char(2) DEFAULT NULL,
  `id_usuario` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `entrada_productos`
--

INSERT INTO `entrada_productos` (`id_entrada`, `id_productos`, `cantidad`, `fecha`, `costo_unitario`, `observaciones`, `id_movimiento`, `id_documento`, `id_usuario`) VALUES
(1, 3, 1, '2025-12-17', NULL, 'si', 2, 'fa', 1),
(2, 11, 70, '2025-12-17', NULL, 'nuevo pan', 2, 'cc', 1),
(3, 11, 70, '2025-12-17', NULL, 'pan', 2, 'cc', 1),
(4, 11, 3, '2026-02-02', NULL, '', 2, 'pe', 1),
(5, 3, 3, '2026-02-03', NULL, 'llegada de porductos', 2, 'cc', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `metodo`
--

CREATE TABLE `metodo` (
  `id_metodo` char(2) NOT NULL,
  `metodo_pago` varchar(42) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `metodo`
--

INSERT INTO `metodo` (`id_metodo`, `metodo_pago`) VALUES
('M1', 'Efectivo'),
('M2', 'Tarjeta crédito'),
('M3', 'Tarjeta débito'),
('M4', 'Transferencia'),
('M5', 'Nequi'),
('M6', 'Daviplata');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimiento`
--

CREATE TABLE `movimiento` (
  `id_movimiento` int(11) NOT NULL,
  `id_tipo` int(11) DEFAULT NULL,
  `descripcion` varchar(100) DEFAULT NULL,
  `fecha_generar` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `movimiento`
--

INSERT INTO `movimiento` (`id_movimiento`, `id_tipo`, `descripcion`, `fecha_generar`) VALUES
(1, 2, 'Ingreso de abarrotes', '2025-10-22'),
(2, 3, 'Venta mostrador', '2025-10-22'),
(3, 2, 'Compra de productos', '2025-10-22'),
(4, 3, 'Venta general', '2025-10-22'),
(5, 1, 'Devolución cliente', '2025-10-22'),
(6, 2, 'COMPRA mercancía', '2025-10-22'),
(7, 2, 'COMPRA mercancía', '2025-10-22'),
(8, 3, 'VENTA', '2025-10-22'),
(9, 1, 'Producto vencido', '2025-10-22');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id_productos` int(11) NOT NULL,
  `nombre` varchar(50) DEFAULT NULL,
  `precio` decimal(12,2) DEFAULT NULL,
  `id_categoria` int(11) DEFAULT NULL,
  `id_proveedor` int(11) DEFAULT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `estado` enum('Disponible','Agotado','En tránsito','Descontinuado') DEFAULT 'Disponible',
  `imagen` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id_productos`, `nombre`, `precio`, `id_categoria`, `id_proveedor`, `descripcion`, `estado`, `imagen`) VALUES
(1, 'wous', 300.00, 1, 1, ' marca de arroz de alta calidad, seleccionada y cultivada para ofrecer granos blancos, sueltos y deliciosos', 'Disponible', 'https://exitocol.vtexassets.com/arquivos/ids/28955925/Arroz-Diana-1000-gr-552155_a.jpg?v=638864002504830000'),
(2, 'Leche Alquería 1L', 4200.00, 2, 2, 'eche de alta calidad, frescura y con respaldo de un sello de calidad que no necesita hervirse y se puede consumir directamente del empaque', 'Disponible', 'https://carulla.vteximg.com.br/arquivos/ids/21758068/Leche-Entera-Cremosa-En-Bolsa-X-11-Litro-64343_a.jpg?v=638877710608300000'),
(3, 'Carne de Res 500g', 14500.00, 3, 3, 'Carne de res 100% fresca, seleccionada de ganado criado bajo estrictos estándares de calidad. Su textura tierna y jugosa la hace ideal para asados, guisos, parrillas y preparaciones típicas colombianas.', 'Disponible', 'https://res.cloudinary.com/dnvonflxi/image/upload/v1741755504/products/hbcxagibhpdvkaeukp8m.png'),
(4, 'Coca-Cola 1.5L', 4800.00, 4, 4, 'Refrescante y deliciosa, ideal para acompañar tus comidas favoritas.', 'Disponible', 'https://product-images.farmatodo.com/8lPAboC9AiIl3ApU3iby9wX-oQ_mQy18Ac3AfVJTYU2DVvgdK1orI42eXPjwVVNlqgTt5n_m7XC2ZH_DvhRaS3gw4NmX3QIBsaJMry1Zunl4JRcJWg=s300-rw'),
(5, 'Pan Bimbo ', 4600.00, 5, 5, 'Pan tajado blanco suave y fresco Ideal para desayunos, merienda y sándwiches.', 'Disponible', 'https://exitocol.vteximg.com.br/arquivos/ids/25464114/Pan-tajado-Actidefensis-BIMBO-600-gr-3107868_a.jpg?v=638666269317300000'),
(6, 'Manzana Roja Kg', 5200.00, 6, 6, 'Fruta natural fresca, dulce y crujiente ideal para consumir sola, jugos, ensaladas o postres.', 'Disponible', 'https://elsuper.com.co/rails/active_storage/representations/proxy/eyJfcmFpbHMiOnsiZGF0YSI6MTgxNjgzNSwicHVyIjoiYmxvYl9pZCJ9fQ==--1301d4075fe0b768fd11e00f7949f1a32e8479ab/eyJfcmFpbHMiOnsiZGF0YSI6eyJmb3JtYXQiOiJqcGciLCJyZXNpemVfdG9fZml0IjpbODAwLDgwMF19LCJwdX'),
(7, 'Detergente Ariel 1Kg', 12800.00, 7, 7, 'Limpieza profunda y cuidado de la ropa Remueve manchas difíciles desde el primer lavado.', 'Disponible', 'ariel.jpg'),
(8, 'Shampoo Savital 350ml', 8700.00, 8, 8, 'Cuidado natural para tu cabello Enriquecido con sábila y extractos naturales que nutren, fortalecen y dejan el cabello suave y brillante.', 'Disponible', 'https://http2.mlstatic.com/D_NQ_NP_884079-MLU76991314497_062024-O.webp'),
(9, 'Papas Margarita 160g', 3200.00, 9, 9, 'Papas crocantes con sabor auténtico Elaboradas con papas 100% naturales, fritas y sazonadas para ofrecer un sabor clásico y delicioso.', 'Disponible', 'https://mecato.shop/cdn/shop/products/papas-margarita-1.jpg?v=1643909363'),
(10, 'Helado Crem Helado 1L', 10500.00, 10, 10, 'Postre cremoso y refrescante Elaborado con ingredientes de alta calidad y sabores irresistibles como vainilla, chocolate, fresa y arequipe.', 'Disponible', 'https://cdn1.totalcommerce.cloud/cremhelado/product-zoom/es/vaso-1-litro-vainilla-1.webp'),
(11, 'Pan', 12000.00, 5, 5, 'pan grande', 'Disponible', 'https://exitocol.vteximg.com.br/arquivos/ids/25464114/Pan-tajado-Actidefensis-BIMBO-600-gr-3107868_a.jpg?v=638666269317300000');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedor`
--

CREATE TABLE `proveedor` (
  `id_proveedor` int(11) NOT NULL,
  `nombre` varchar(50) DEFAULT NULL,
  `apellido` varchar(50) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `proveedor`
--

INSERT INTO `proveedor` (`id_proveedor`, `nombre`, `apellido`, `telefono`) VALUES
(1, 'Luis', 'González', '3104567890'),
(2, 'María', 'Rojas', '3112345678'),
(3, 'Pedro', 'Martínez', '3129876543'),
(4, 'Ana', 'Pérez', '3136789123'),
(5, 'Carlos', 'Ruiz', '3143456789'),
(6, 'Jorge', 'Moreno', '3157894321'),
(7, 'Tatiana', 'Vega', '3165678912'),
(8, 'Camilo', 'Ramírez', '3179876123'),
(9, 'Paola', 'Jiménez', '3182345678'),
(10, 'Andrés', 'Castro', '3198765432');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `nombre`) VALUES
(1, 'Administrador'),
(2, 'Empleado'),
(3, 'Cliente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `salida_productos`
--

CREATE TABLE `salida_productos` (
  `id_salida` int(11) NOT NULL,
  `id_productos` int(11) DEFAULT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `id_documento` char(2) DEFAULT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `id_movimiento` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `salida_productos`
--

INSERT INTO `salida_productos` (`id_salida`, `id_productos`, `cantidad`, `fecha`, `id_documento`, `id_usuario`, `id_movimiento`) VALUES
(1, 4, 2, '2025-12-16', 'CC', 4, 2),
(2, 3, 2, '2025-12-16', 'CC', 4, 2),
(3, 9, 1, '2025-12-16', 'CC', 4, 2),
(4, 4, 2, '2025-12-16', 'CC', 4, 2),
(5, 3, 1, '2025-12-17', 'CC', 4, 2),
(6, 1, 1, '2025-12-17', 'CC', 4, 2),
(7, 10, 1, '2025-12-17', 'CC', 4, 2),
(8, 7, 1, '2025-12-17', 'CC', 4, 2),
(9, 4, 2, '2025-12-17', 'fa', 1, 3),
(10, 4, 2, '2025-12-17', 'CC', 6, 2),
(11, 7, 2, '2026-02-02', 'CC', 4, 2),
(12, 3, 2, '2026-02-02', 'CC', 4, 2),
(13, 1, 32, '2026-02-02', 've', 1, 3),
(14, 9, 10, '2026-02-02', 've', 1, 3),
(15, 4, 1, '2026-02-03', 'CC', 8, 2),
(16, 3, 1, '2026-02-03', 'CC', 8, 2),
(17, 7, 1, '2026-02-03', 'CC', 9, 2),
(18, 7, 1, '2026-02-06', 'CC', 14, 2),
(19, 7, 1, '2026-02-06', 'CC', 14, 2),
(20, 4, 1, '2026-02-06', 'CC', 14, 2),
(21, 4, 5, '2026-02-06', 'CC', 14, 2),
(22, 4, 1, '2026-02-06', 'CC', 14, 2),
(23, 3, 1, '2026-02-06', 'CC', 14, 2),
(24, 2, 1, '2026-02-06', 'CC', 14, 2),
(25, 6, 1, '2026-02-06', 'CC', 14, 2),
(26, 8, 1, '2026-02-06', 'CC', 14, 2),
(27, 9, 1, '2026-02-06', 'CC', 14, 2),
(28, 7, 2, '2026-02-06', 'CC', 14, 2),
(29, 7, 2, '2026-02-06', 'CC', 14, 2),
(30, 6, 3, '2026-02-06', 'CC', 14, 2),
(31, 5, 1, '2026-02-06', 'CC', 14, 2),
(32, 2, 2, '2026-02-06', 'CC', 14, 2),
(33, 10, 1, '2026-02-06', 'CC', 14, 2),
(34, 4, 1, '2026-02-06', 'CC', 14, 2),
(35, 3, 1, '2026-02-06', 'CC', 14, 2),
(36, 8, 1, '2026-02-06', 'CC', 14, 2),
(37, 9, 1, '2026-02-06', 'CC', 14, 2),
(38, 5, 3, '2026-02-06', 'CC', 14, 2),
(39, 6, 2, '2026-02-06', 'CC', 14, 2),
(40, 2, 1, '2026-02-06', 'CC', 14, 2),
(41, 6, 1, '2026-02-09', 'CC', 15, 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `stock_actual`
--

CREATE TABLE `stock_actual` (
  `id_inventario` int(11) NOT NULL,
  `id_productos` int(11) DEFAULT NULL,
  `id_movimiento` int(11) DEFAULT NULL,
  `stock` int(11) DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `stock_actual`
--

INSERT INTO `stock_actual` (`id_inventario`, `id_productos`, `id_movimiento`, `stock`, `fecha_vencimiento`) VALUES
(1, 1, 1, 116, '2025-04-15'),
(2, 2, 1, 105, '2025-05-10'),
(3, 3, 2, 104, '2025-06-05'),
(4, 4, 2, 21, '2025-07-20'),
(5, 5, 1, 69, '2025-08-10'),
(6, 6, 2, 57, '2025-09-12'),
(7, 7, 5, 123, '2025-03-25'),
(8, 8, 1, 82, '2025-02-28'),
(9, 9, 2, 80, '2025-01-18'),
(10, 10, 5, 125, '2024-12-22');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_identificacion`
--

CREATE TABLE `tipos_identificacion` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipos_identificacion`
--

INSERT INTO `tipos_identificacion` (`id`, `nombre`) VALUES
(1, 'Cédula de ciudadanía'),
(2, 'Tarjeta de identidad'),
(3, 'Cédula de extranjería');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_devolucion`
--

CREATE TABLE `tipo_devolucion` (
  `id_tipo_devolucion` int(11) NOT NULL,
  `nombre_tipo` varchar(30) DEFAULT NULL,
  `descripcion` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_movimiento`
--

CREATE TABLE `tipo_movimiento` (
  `id_tipo` int(11) NOT NULL,
  `nombre_movimiento` varchar(20) DEFAULT NULL,
  `fecha_generar` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipo_movimiento`
--

INSERT INTO `tipo_movimiento` (`id_tipo`, `nombre_movimiento`, `fecha_generar`) VALUES
(1, 'Devolución', '2025-10-22'),
(2, 'Entrada', '2025-10-22'),
(3, 'Salida', '2025-10-22');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `direccion` varchar(255) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `id_rol` int(11) NOT NULL,
  `id_tipo_identificacion` int(11) NOT NULL,
  `numero_identificacion` varchar(50) NOT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `email_verification_code` varchar(64) DEFAULT NULL,
  `email_verification_expires` datetime DEFAULT NULL,
  `password_reset_code` varchar(64) DEFAULT NULL,
  `password_reset_expires` datetime DEFAULT NULL,
  `login_two_factor_code` varchar(64) DEFAULT NULL,
  `login_two_factor_expires` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `apellido`, `email`, `password`, `direccion`, `fecha_nacimiento`, `fecha_registro`, `id_rol`, `id_tipo_identificacion`, `numero_identificacion`, `email_verified`, `email_verification_code`, `email_verification_expires`, `password_reset_code`, `password_reset_expires`) VALUES
(1, 'jeferson', 'castro', 'jeferson@gmail.com', '$2b$10$zbVd416r7StggmQ1l6WYOuRlLkgJWOeyTVHHXoVGIOuQVuLHF3PoO', 'villa del rio', '2006-02-08', '2025-12-12 01:08:58', 1, 1, '1212121349', 1, NULL, NULL, NULL, NULL),
(2, 'juan', 'Perez', 'juanR@gmail.com', '$2b$10$jR9XYWp2ERoLpy7/Lf7I9OZEoM2fAPzZMSa0vuSI0JdbUXJZPPCMK', 'villa del rio', '2006-11-03', '2025-12-12 01:10:59', 2, 1, '12334343', 1, NULL, NULL, NULL, NULL),
(4, 'dylan sneider', 'rivera mora', 'elpepeyt@gmail.com', '$2a$10$whzWt1cZ5aZoMUpL.v6fQOvzEEfMZOW4Auh047yQXgIMB2g7OkeY2', 'diagonal 42 a sur #81h 09, villa de la torre,Kennedy,  Bogota D.C', '1999-09-09', '2025-12-16 01:15:59', 2, 1, '66666666', 1, NULL, NULL, NULL, NULL),
(6, 'pablo', 'rivero', 'pablo@gmail.com', '$2a$10$BlDDih/1lcUgG8H3kb/nUOqyJakWCsy4KryqVK2jJJ2PigqB5hQOK', 'villa del rio', '2008-07-09', '2025-12-17 11:20:20', 3, 1, '1233212343', 1, NULL, NULL, NULL, NULL),
(8, 'Daniel', 'Lozano', 'daniel@gmail.com', '$2a$10$Cr8xAMObrJwR0rAI.UW9NOP184sPJOjseLmpOTOiWh4TGwtvxmLOa', 'puerta6', '2006-12-31', '2026-02-03 19:17:51', 3, 1, '10125555421', 1, NULL, NULL, NULL, NULL),
(9, 'pepito ', 'perez', 'pepe@gmail.com', '$2a$10$AMjFZq7E7CPWE1VhqUHh7ubsJvYYsJWtyDcwsiDzJtx3ZgdSC6G5a', 'villa del rio', '2007-07-11', '2026-02-03 19:39:08', 3, 1, '11323454', 1, NULL, NULL, NULL, NULL),
(14, 'Usuario', 'Desconocido', 'usuario14@mercapleno.com', '$2a$10$KIX6aG5rMuejg0BD.7q9w.8KNCvT9LjouP8A3czVQHn0k.Tyn0WvG', 'desconocido', '1990-01-01', '2026-02-06 00:00:00', 3, 1, '0000000014', 1, NULL, NULL, NULL, NULL),
(15, 'Yogui', 'Castro', 'jefersonjairbernalcastro172129@gmail.com', '$2a$10$65RcZUqiv.xO8MbUta7CEO9ZApYYo7/vwhwPeqsNMQAA5s9vvPXaC', 'calle 12 # 12', '2000-05-21', '2026-02-10 01:23:12', 1, 1, '21365487', 1, NULL, NULL, NULL, NULL),
(16, 'sebastian', 'rivera', '5juansebas5@gmail.com', '$2a$10$fvqQp4Rmlx2Bq5c0K5kpl.7CTlkXB4PTum4N9p9SXe/zQC2Lk1s4C', 'calle 5# 12 norte', '2007-05-10', '2026-02-10 01:27:28', 3, 1, '123456789', 0, 'f4bfb4ad07bbb6b2d89abd6464a640437a920c40dff43bc27d37b5770ff47e35', '2026-02-09 20:42:28', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `venta`
--

CREATE TABLE `venta` (
  `id_venta` int(11) NOT NULL,
  `fecha` date DEFAULT NULL,
  `id_documento` char(2) DEFAULT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `total` decimal(12,2) DEFAULT NULL,
  `id_metodo` char(2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `venta`
--

INSERT INTO `venta` (`id_venta`, `fecha`, `id_documento`, `id_usuario`, `total`, `id_metodo`) VALUES
(1, '2025-12-16', 'CC', 4, 9600.00, 'M3'),
(2, '2025-12-16', 'CC', 4, 29000.00, 'M3'),
(3, '2025-12-16', 'CC', 4, 3200.00, 'M2'),
(4, '2025-12-16', 'CC', 4, 9600.00, 'M4'),
(5, '2025-12-17', 'CC', 4, 14800.00, 'M2'),
(6, '2025-12-17', 'CC', 4, 10500.00, 'M2'),
(7, '2025-12-17', 'CC', 4, 12800.00, 'M3'),
(8, '2025-12-17', 'CC', 6, 9600.00, 'M3'),
(9, '2026-02-02', 'CC', 4, 54600.00, 'M2'),
(10, '2026-02-03', 'CC', 8, 19300.00, 'M1'),
(11, '2026-02-03', 'CC', 9, 12800.00, 'M6'),
(12, '2026-02-06', 'CC', 14, 12800.00, 'M1'),
(13, '2026-02-06', 'CC', 14, 12800.00, 'M1'),
(14, '2026-02-06', 'CC', 14, 4800.00, 'M1'),
(15, '2026-02-06', 'CC', 14, 24000.00, 'M1'),
(16, '2026-02-06', 'CC', 14, 40600.00, 'M1'),
(17, '2026-02-06', 'CC', 14, 25600.00, 'M1'),
(18, '2026-02-06', 'CC', 14, 95900.00, 'M1'),
(19, '2026-02-06', 'CC', 14, 28400.00, 'M5'),
(20, '2026-02-09', 'CC', 15, 5200.00, 'M1');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `venta_productos`
--

CREATE TABLE `venta_productos` (
  `id_venta` int(11) NOT NULL,
  `id_productos` int(11) NOT NULL,
  `cantidad` int(11) DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `venta_productos`
--

INSERT INTO `venta_productos` (`id_venta`, `id_productos`, `cantidad`, `precio`) VALUES
(1, 4, 2, 4800.00),
(2, 3, 2, 14500.00),
(3, 9, 1, 3200.00),
(4, 4, 2, 4800.00),
(5, 1, 1, 300.00),
(5, 3, 1, 14500.00),
(6, 10, 1, 10500.00),
(7, 7, 1, 12800.00),
(8, 4, 2, 4800.00),
(9, 3, 2, 14500.00),
(9, 7, 2, 12800.00),
(10, 3, 1, 14500.00),
(10, 4, 1, 4800.00),
(11, 7, 1, 12800.00),
(12, 7, 1, 12800.00),
(13, 7, 1, 12800.00),
(14, 4, 1, 4800.00),
(15, 4, 5, 4800.00),
(16, 2, 1, 4200.00),
(16, 3, 1, 14500.00),
(16, 4, 1, 4800.00),
(16, 6, 1, 5200.00),
(16, 8, 1, 8700.00),
(16, 9, 1, 3200.00),
(17, 7, 2, 12800.00),
(18, 2, 2, 4200.00),
(18, 3, 1, 14500.00),
(18, 4, 1, 4800.00),
(18, 5, 1, 4600.00),
(18, 6, 3, 5200.00),
(18, 7, 2, 12800.00),
(18, 8, 1, 8700.00),
(18, 9, 1, 3200.00),
(18, 10, 1, 10500.00),
(19, 2, 1, 4200.00),
(19, 5, 3, 4600.00),
(19, 6, 2, 5200.00),
(20, 6, 1, 5200.00);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `categoria`
--
ALTER TABLE `categoria`
  ADD PRIMARY KEY (`id_categoria`);

--
-- Indices de la tabla `devolver_productos`
--
ALTER TABLE `devolver_productos`
  ADD PRIMARY KEY (`id_devolucion`),
  ADD KEY `fk_dev_prod` (`id_productos`),
  ADD KEY `fk_dev_tipo_devolucion` (`id_tipo_devolucion`),
  ADD KEY `fk_dev_tipo_movimiento` (`id_tipo`);

--
-- Indices de la tabla `entrada_productos`
--
ALTER TABLE `entrada_productos`
  ADD PRIMARY KEY (`id_entrada`),
  ADD KEY `entrada_productos_ibfk_1` (`id_productos`),
  ADD KEY `entrada_productos_ibfk_2` (`id_movimiento`),
  ADD KEY `entrada_productos_ibfk_3` (`id_usuario`);

--
-- Indices de la tabla `metodo`
--
ALTER TABLE `metodo`
  ADD PRIMARY KEY (`id_metodo`);

--
-- Indices de la tabla `movimiento`
--
ALTER TABLE `movimiento`
  ADD PRIMARY KEY (`id_movimiento`),
  ADD KEY `movimiento_ibfk_1` (`id_tipo`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id_productos`),
  ADD KEY `productos_ibfk_1` (`id_categoria`),
  ADD KEY `productos_ibfk_2` (`id_proveedor`);

--
-- Indices de la tabla `proveedor`
--
ALTER TABLE `proveedor`
  ADD PRIMARY KEY (`id_proveedor`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `salida_productos`
--
ALTER TABLE `salida_productos`
  ADD PRIMARY KEY (`id_salida`),
  ADD KEY `salida_productos_ibfk_1` (`id_productos`),
  ADD KEY `salida_productos_ibfk_2` (`id_usuario`),
  ADD KEY `salida_productos_ibfk_3` (`id_movimiento`);

--
-- Indices de la tabla `stock_actual`
--
ALTER TABLE `stock_actual`
  ADD PRIMARY KEY (`id_inventario`),
  ADD KEY `stock_actual_ibfk_1` (`id_productos`),
  ADD KEY `stock_actual_ibfk_2` (`id_movimiento`);

--
-- Indices de la tabla `tipos_identificacion`
--
ALTER TABLE `tipos_identificacion`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `tipo_devolucion`
--
ALTER TABLE `tipo_devolucion`
  ADD PRIMARY KEY (`id_tipo_devolucion`);

--
-- Indices de la tabla `tipo_movimiento`
--
ALTER TABLE `tipo_movimiento`
  ADD PRIMARY KEY (`id_tipo`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuarios_ibfk_1` (`id_rol`),
  ADD KEY `usuarios_ibfk_2` (`id_tipo_identificacion`);

--
-- Indices de la tabla `venta`
--
ALTER TABLE `venta`
  ADD PRIMARY KEY (`id_venta`),
  ADD KEY `venta_ibfk_1` (`id_usuario`),
  ADD KEY `venta_ibfk_2` (`id_metodo`);

--
-- Indices de la tabla `venta_productos`
--
ALTER TABLE `venta_productos`
  ADD PRIMARY KEY (`id_venta`,`id_productos`),
  ADD KEY `venta_productos_ibfk_2` (`id_productos`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `categoria`
--
ALTER TABLE `categoria`
  MODIFY `id_categoria` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `devolver_productos`
--
ALTER TABLE `devolver_productos`
  MODIFY `id_devolucion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `entrada_productos`
--
ALTER TABLE `entrada_productos`
  MODIFY `id_entrada` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `movimiento`
--
ALTER TABLE `movimiento`
  MODIFY `id_movimiento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id_productos` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `proveedor`
--
ALTER TABLE `proveedor`
  MODIFY `id_proveedor` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `salida_productos`
--
ALTER TABLE `salida_productos`
  MODIFY `id_salida` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT de la tabla `stock_actual`
--
ALTER TABLE `stock_actual`
  MODIFY `id_inventario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `tipos_identificacion`
--
ALTER TABLE `tipos_identificacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `tipo_devolucion`
--
ALTER TABLE `tipo_devolucion`
  MODIFY `id_tipo_devolucion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tipo_movimiento`
--
ALTER TABLE `tipo_movimiento`
  MODIFY `id_tipo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `venta`
--
ALTER TABLE `venta`
  MODIFY `id_venta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `devolver_productos`
--
ALTER TABLE `devolver_productos`
  ADD CONSTRAINT `fk_dev_prod` FOREIGN KEY (`id_productos`) REFERENCES `productos` (`id_productos`),
  ADD CONSTRAINT `fk_dev_tipo_devolucion` FOREIGN KEY (`id_tipo_devolucion`) REFERENCES `tipo_devolucion` (`id_tipo_devolucion`),
  ADD CONSTRAINT `fk_dev_tipo_movimiento` FOREIGN KEY (`id_tipo`) REFERENCES `tipo_movimiento` (`id_tipo`);

--
-- Filtros para la tabla `entrada_productos`
--
ALTER TABLE `entrada_productos`
  ADD CONSTRAINT `entrada_productos_ibfk_1` FOREIGN KEY (`id_productos`) REFERENCES `productos` (`id_productos`),
  ADD CONSTRAINT `entrada_productos_ibfk_2` FOREIGN KEY (`id_movimiento`) REFERENCES `movimiento` (`id_movimiento`),
  ADD CONSTRAINT `entrada_productos_ibfk_3` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `movimiento`
--
ALTER TABLE `movimiento`
  ADD CONSTRAINT `movimiento_ibfk_1` FOREIGN KEY (`id_tipo`) REFERENCES `tipo_movimiento` (`id_tipo`);

--
-- Filtros para la tabla `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`),
  ADD CONSTRAINT `productos_ibfk_2` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor` (`id_proveedor`);

--
-- Filtros para la tabla `salida_productos`
--
ALTER TABLE `salida_productos`
  ADD CONSTRAINT `salida_productos_ibfk_1` FOREIGN KEY (`id_productos`) REFERENCES `productos` (`id_productos`),
  ADD CONSTRAINT `salida_productos_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `salida_productos_ibfk_3` FOREIGN KEY (`id_movimiento`) REFERENCES `movimiento` (`id_movimiento`);

--
-- Filtros para la tabla `stock_actual`
--
ALTER TABLE `stock_actual`
  ADD CONSTRAINT `stock_actual_ibfk_1` FOREIGN KEY (`id_productos`) REFERENCES `productos` (`id_productos`),
  ADD CONSTRAINT `stock_actual_ibfk_2` FOREIGN KEY (`id_movimiento`) REFERENCES `movimiento` (`id_movimiento`);

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id`),
  ADD CONSTRAINT `usuarios_ibfk_2` FOREIGN KEY (`id_tipo_identificacion`) REFERENCES `tipos_identificacion` (`id`);

--
-- Filtros para la tabla `venta`
--
ALTER TABLE `venta`
  ADD CONSTRAINT `venta_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `venta_ibfk_2` FOREIGN KEY (`id_metodo`) REFERENCES `metodo` (`id_metodo`);

--
-- Filtros para la tabla `venta_productos`
--
ALTER TABLE `venta_productos`
  ADD CONSTRAINT `venta_productos_ibfk_1` FOREIGN KEY (`id_venta`) REFERENCES `venta` (`id_venta`),
  ADD CONSTRAINT `venta_productos_ibfk_2` FOREIGN KEY (`id_productos`) REFERENCES `productos` (`id_productos`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
