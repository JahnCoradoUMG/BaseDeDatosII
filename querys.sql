CREATE TABLE productos (
    id_producto INT IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    activo BIT DEFAULT 1
);

CREATE TABLE inventario_stock (
    id_producto INT PRIMARY KEY,
    stock INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_stock_producto
        FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

CREATE TABLE inventario_movimientos (
    id_movimiento INT IDENTITY PRIMARY KEY,
    id_producto INT NOT NULL,
    tipo CHAR(1) CHECK (tipo IN ('E','S')),
    cantidad INT NOT NULL,
    fecha DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_mov_producto
        FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);
GO

-- Trigger para actualizar el saldo automáticamente

CREATE TRIGGER trg_actualizar_stock
ON inventario_movimientos
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- Entradas
    UPDATE s
    SET s.stock = s.stock + i.cantidad
    FROM inventario_stock s
    INNER JOIN inserted i ON s.id_producto = i.id_producto
    WHERE i.tipo = 'E';

    -- Salidas
    UPDATE s
    SET s.stock = s.stock - i.cantidad
    FROM inventario_stock s
    INNER JOIN inserted i ON s.id_producto = i.id_producto
    WHERE i.tipo = 'S';
END;
GO

-- SP PARA INSERTAR MOVIMIENTOS

CREATE PROCEDURE sp_registrar_movimiento
    @id_producto INT,
    @tipo CHAR(1),
    @cantidad INT
AS
BEGIN
    BEGIN TRY
        BEGIN TRAN;

        INSERT INTO inventario_movimientos (id_producto, tipo, cantidad)
        VALUES (@id_producto, @tipo, @cantidad);

        COMMIT;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END;


INSERT INTO productos (nombre) VALUES ('Laptop Dell');
INSERT INTO productos (nombre) VALUES ('Mouse Logitech');
INSERT INTO productos (nombre) VALUES ('Teclado Mecánico');

INSERT INTO inventario_stock (id_producto, stock)
SELECT id_producto, 0
FROM productos;

SELECT * FROM inventario_movimientos;
SELECT * FROM inventario_stock;

SELECT 
    p.nombre,
    m.tipo,
    m.cantidad,
    m.fecha
FROM inventario_movimientos m
INNER JOIN productos p ON p.id_producto = m.id_producto
ORDER BY m.fecha;