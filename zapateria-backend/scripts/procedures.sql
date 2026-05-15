CREATE OR REPLACE FUNCTION obtener_todas_docenas()
RETURNS TABLE (
    id_docena INT,
    numero_docena INT,
    codigo_qr VARCHAR,
    estado_actual VARCHAR,
    modelo VARCHAR,
    color VARCHAR,
    serie VARCHAR,
    id_cliente INT,
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
        COALESCE(c.id_cliente, 0) AS id_cliente,
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
    id_cliente INT,
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
        COALESCE(c.id_cliente, 0) AS id_cliente,
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



CREATE OR REPLACE FUNCTION obtener_docenas_operario_por_estado(
    estado_filtro VARCHAR
)
RETURNS TABLE (
    id_docena INT,
    numero_docena INT,
    codigo_qr VARCHAR,
    estado_actual VARCHAR,
    modelo VARCHAR,
    color VARCHAR,
    serie VARCHAR,
    id_cliente INT,
    id_pedido INT,
    asignado BOOLEAN,
    id_operario_asignado INT,
    operario_asignado VARCHAR
)
AS $$
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
        COALESCE(c.id_cliente, 0) AS id_cliente,
        COALESCE(p.id_pedido, 0) AS id_pedido,

        CASE
            WHEN tp.id_operario IS NOT NULL THEN true
            ELSE false
        END AS asignado,

        COALESCE(o.id_operario, 0) AS id_operario_asignado,

        COALESCE(
            CONCAT(o.nombre, ' ', o.apellido),
            ''
        ) AS operario_asignado

    FROM control_docena cd

    LEFT JOIN detalle_pedido dp
        ON cd.id_detalle = dp.id_detalle

    LEFT JOIN pedidos p
        ON dp.id_pedido = p.id_pedido

    LEFT JOIN clientes c
        ON p.id_cliente = c.id_cliente

    LEFT JOIN modelos m
        ON dp.id_modelo = m.id_modelo

    LEFT JOIN series s
        ON dp.id_serie = s.id_serie

    LEFT JOIN trazabilidad_produccion tp
        ON tp.id_docena = cd.id_docena
        AND tp.fecha_fin IS NULL

    LEFT JOIN operarios o
        ON tp.id_operario = o.id_operario

    WHERE cd.estado_actual = estado_filtro

    ORDER BY cd.numero_docena;

END;
$$ LANGUAGE plpgsql;