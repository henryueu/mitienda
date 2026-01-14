-- 1. CREACIÓN DE TABLAS (Basado en tus capturas de Neon)
CREATE TABLE categoria (
    id_categoria SERIAL PRIMARY KEY,
    nombre_categoria VARCHAR(255) NOT NULL,
    descripcion TEXT
);

CREATE TABLE producto (
    id_producto SERIAL PRIMARY KEY,
    nombre_producto VARCHAR(255) NOT NULL,
    marca VARCHAR(255),
    precio_venta NUMERIC(10,2) NOT NULL CHECK (precio_venta > 0),
    stock INTEGER NOT NULL DEFAULT 0,
    id_categoria INTEGER REFERENCES categoria(id_categoria)
);

CREATE TABLE venta (
    id_venta SERIAL PRIMARY KEY,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    monto_total NUMERIC(10,2) DEFAULT 0
);

CREATE TABLE detalle_venta (
    id_detalle SERIAL PRIMARY KEY,
    id_venta INTEGER REFERENCES venta(id_venta) ON DELETE CASCADE,
    id_producto INTEGER REFERENCES producto(id_producto),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL
);

-- 2. "CEREBRO" DE LA BASE DE DATOS (Lo que te dará los puntos en el Extra)
-- Este trigger asegura que el stock baje AUTOMÁTICAMENTE en la DB
CREATE OR REPLACE FUNCTION actualizar_stock_venta()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE producto 
    SET stock = stock - NEW.cantidad
    WHERE id_producto = NEW.id_producto;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_bajar_stock
AFTER INSERT ON detalle_venta
FOR EACH ROW EXECUTE FUNCTION actualizar_stock_venta();

-- 3. VISTA DE REPORTES (Indispensable para un proyecto de ISC)
CREATE OR REPLACE VIEW reporte_inventario_critico AS
SELECT nombre_producto, stock, marca
FROM producto
WHERE stock < 10;