-- =========================================
-- SISTEMA DE GESTIÓN Y CONTROL DE PRODUCCIÓN
-- ZAPATERÍA
-- =========================================

-- =========================================
-- 1. MÓDULO DE ALMACÉN E INVENTARIO
-- =========================================

CREATE TABLE materiales (
    id_material SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL, -- Ej: 'Biocuero', 'Planta'
    unidad_medida VARCHAR(20), -- Ej: 'Metros', 'Litros'
    stock_actual DECIMAL(12,2) DEFAULT 0
);

-- =========================================
-- TABLAS MAESTRAS
-- =========================================

CREATE TABLE modelos (
    id_modelo SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE series (
    id_serie SERIAL PRIMARY KEY,
    descripcion VARCHAR(50) UNIQUE NOT NULL -- Ej: 'JUVENIL 35-39'
);

-- =========================================
-- RECETAS DE PRODUCCIÓN
-- =========================================

CREATE TABLE receta_modelo (
    id_receta SERIAL PRIMARY KEY,
    id_modelo INT REFERENCES modelos(id_modelo),
    id_material INT REFERENCES materiales(id_material),
    cantidad_por_docena DECIMAL(12,4) -- Ej: 2.2 de Biocuero
);

-- =========================================
-- MOVIMIENTOS DE ALMACÉN
-- =========================================

CREATE TABLE movimiento_almacen (
    id_movimiento SERIAL PRIMARY KEY,
    id_material INT REFERENCES materiales(id_material),
    tipo_movimiento VARCHAR(10)
        CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA')),
    cantidad DECIMAL(12,2),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    referencia VARCHAR(150) -- Ej: 'Pedido Vanesa - Salida para Corte'
);

-- =========================================
-- 2. MÓDULO DE VENTAS Y PEDIDOS
-- =========================================

CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NULL
);


CREATE TABLE pedidos (
    id_pedido SERIAL PRIMARY KEY,
    id_cliente INT REFERENCES clientes(id_cliente),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO','EMPAQUETADO','ENVIADO','ENTREGADO','CANCELADO'))
);

ALTER TABLE pedidos
ADD COLUMN total_doc_pedido INT DEFAULT 0
CHECK (total_doc_pedido >= 0);



CREATE TABLE detalle_pedido (
    id_detalle SERIAL PRIMARY KEY,
    id_pedido INT REFERENCES pedidos(id_pedido),
    id_modelo INT REFERENCES modelos(id_modelo),
    id_serie INT REFERENCES series(id_serie),
    color VARCHAR(30), -- Ej: 'ROSADO', 'CELESTE'
    cantidad_docenas INT
);

-- =========================================
-- 3. MÓDULO DE PRODUCCIÓN Y TRAZABILIDAD
-- =========================================

CREATE TABLE operarios (
    id_operario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    rol VARCHAR(50) -- Corte, Aparado, Pegado, etc.
);

CREATE TABLE control_docena (
    id_docena SERIAL PRIMARY KEY,
    id_detalle INT REFERENCES detalle_pedido(id_detalle),
    numero_docena INT, -- Docena 1, 2...
    codigo_qr VARCHAR(100) UNIQUE,
    estado_actual VARCHAR(50) DEFAULT 'CORTE'
);

-- Eliminar el valor DEFAULT anterior
ALTER TABLE control_docena
ALTER COLUMN estado_actual DROP DEFAULT;

-- Agregar nuevo DEFAULT
ALTER TABLE control_docena
ALTER COLUMN estado_actual SET DEFAULT 'Por cortar';

-- Agregar restricción CHECK
ALTER TABLE control_docena
ADD CONSTRAINT chk_estado_actual
CHECK (
    estado_actual IN (
        'Por cortar',
        'Cortado',
        'Alistado',
        'Aparado',
        'Empastado',
        'Armado',
        'Pegado',
        'Rematado',
        'Doc. Acabadas'
    )
);

CREATE TABLE trazabilidad_produccion (
    id_traza SERIAL PRIMARY KEY,
    id_docena INT REFERENCES control_docena(id_docena),
    id_operario INT REFERENCES operarios(id_operario),
    etapa VARCHAR(50), -- Ej: 'APARADO'
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP,
    observacion TEXT
);


CREATE TABLE despachos (
    id_despacho SERIAL PRIMARY KEY,
    id_pedido INT REFERENCES pedidos(id_pedido),
    numero_guia VARCHAR(100) UNIQUE,
    empresa_transporte VARCHAR(100),
    fecha_empaquetado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_envio TIMESTAMP,
    fecha_entrega TIMESTAMP,
    estado_envio VARCHAR(30) DEFAULT 'PENDIENTE_GUIA'
    CHECK (
        estado_envio IN (
            'PENDIENTE_GUIA',
            'GUIA_GENERADA',
            'PENDIENTE_ENVIO',
            'ENVIADO',
            'ENTREGADO'
        )
    ),

    observaciones TEXT
);



ALTER TABLE control_docena
DROP CONSTRAINT IF EXISTS chk_estado_actual;

ALTER TABLE control_docena
ALTER COLUMN estado_actual TYPE VARCHAR(50);

ALTER TABLE control_docena
ALTER COLUMN estado_actual DROP DEFAULT;

ALTER TABLE control_docena
ALTER COLUMN estado_actual
SET DEFAULT 'Por cortar';

ALTER TABLE control_docena
ADD CONSTRAINT chk_estado_actual
CHECK (
    estado_actual IN (
        'Por cortar',
        'Cortado',
        'Alistado',
        'Aparado',
        'Empastado',
        'Armado',
        'Pegado',
        'Rematado',
        'Doc. Acabadas'
    )
);
