-- Esquema de base de datos para el sistema de zapatería
CREATE DATABASE ZAPATERIA;

-- 1. MÓDULO DE INVENTARIO Y RECETAS
CREATE TABLE materiales (
    id_material SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    unidad_medida VARCHAR(20),
    stock_actual DECIMAL(12,2) DEFAULT 0
);

CREATE TABLE modelos (
    id_modelo SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE series (
    id_serie SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE receta_modelo (
    id_receta SERIAL PRIMARY KEY,
    id_modelo INT REFERENCES modelos(id_modelo),
    id_material INT REFERENCES materiales(id_material),
    cantidad_por_docena DECIMAL(12,4)
);

CREATE TABLE movimiento_almacen (
    id_movimiento SERIAL PRIMARY KEY,
    id_material INT REFERENCES materiales(id_material),
    tipo_movimiento VARCHAR(10) CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA')),
    cantidad DECIMAL(12,2),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    referencia VARCHAR(150)
);

-- 2. MÓDULO DE VENTAS Y PEDIDOS
CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE pedidos (
    id_pedido SERIAL PRIMARY KEY,
    id_cliente INT REFERENCES clientes(id_cliente),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalle_pedido (
    id_detalle SERIAL PRIMARY KEY,
    id_pedido INT REFERENCES pedidos(id_pedido),
    id_modelo INT REFERENCES modelos(id_modelo),
    id_serie INT REFERENCES series(id_serie),
    color VARCHAR(30),
    cantidad_docenas INT
);

-- 3. MÓDULO DE PRODUCCIÓN Y TRAZABILIDAD
CREATE TABLE operarios (
    id_operario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(50)
);

CREATE TABLE control_docena (
    id_docena SERIAL PRIMARY KEY,
    id_detalle INT REFERENCES detalle_pedido(id_detalle),
    numero_docena INT,
    codigo_qr VARCHAR(100) UNIQUE,
    estado_actual VARCHAR(50) DEFAULT 'CORTE'
);

CREATE TABLE trazabilidad_produccion (
    id_traza SERIAL PRIMARY KEY,
    id_docena INT REFERENCES control_docena(id_docena),
    id_operario INT REFERENCES operarios(id_operario),
    etapa VARCHAR(50),
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP,
    observacion TEXT
);

-- PROCEDIMIENTOS ALMACENADOS
CREATE OR REPLACE FUNCTION obtener_todas_docenas()
RETURNS TABLE (
    id_docena INT,
    numero_docena INT,
    codigo_qr VARCHAR,
    estado_actual VARCHAR,
    modelo VARCHAR,
    color VARCHAR,
    serie VARCHAR,
    cliente VARCHAR,
    id_pedido INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cd.id_docena,
        cd.numero_docena,
        cd.codigo_qr,
        cd.estado_actual,
        COALESCE(m.nombre, 'N/D') AS modelo,
        COALESCE(dp.color, '') AS color,
        COALESCE(s.descripcion, 'N/D') AS serie,
        COALESCE(c.nombre, 'Sin cliente') AS cliente,
        COALESCE(p.id_pedido, 0) AS id_pedido
    FROM control_docena cd
    LEFT JOIN detalle_pedido dp ON cd.id_detalle = dp.id_detalle
    LEFT JOIN pedidos p ON dp.id_pedido = p.id_pedido
    LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
    LEFT JOIN modelos m ON dp.id_modelo = m.id_modelo
    LEFT JOIN series s ON dp.id_serie = s.id_serie
    ORDER BY cd.estado_actual, cd.numero_docena;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION obtener_docenas_por_estado(estado_filtro VARCHAR)
RETURNS TABLE (
    id_docena INT,
    numero_docena INT,
    codigo_qr VARCHAR,
    estado_actual VARCHAR,
    modelo VARCHAR,
    color VARCHAR,
    serie VARCHAR,
    cliente VARCHAR,
    id_pedido INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cd.id_docena,
        cd.numero_docena,
        cd.codigo_qr,
        cd.estado_actual,
        COALESCE(m.nombre, 'N/D') AS modelo,
        COALESCE(dp.color, '') AS color,
        COALESCE(s.descripcion, 'N/D') AS serie,
        COALESCE(c.nombre, 'Sin cliente') AS cliente,
        COALESCE(p.id_pedido, 0) AS id_pedido
    FROM control_docena cd
    LEFT JOIN detalle_pedido dp ON cd.id_detalle = dp.id_detalle
    LEFT JOIN pedidos p ON dp.id_pedido = p.id_pedido
    LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
    LEFT JOIN modelos m ON dp.id_modelo = m.id_modelo
    LEFT JOIN series s ON dp.id_serie = s.id_serie
    WHERE cd.estado_actual = estado_filtro
    ORDER BY cd.numero_docena;
END;
$$ LANGUAGE plpgsql;
