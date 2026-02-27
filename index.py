import pyodbc

try:
    conn = pyodbc.connect(
        "DRIVER={SQL Server};"
        "SERVER=localhost\\SQLEXPRESS;"
        "DATABASE=UMG_TAREAS;"
        "Trusted_Connection=yes;"
    )

    cursor = conn.cursor()

    def registrar_movimiento(id_producto, tipo, cantidad):
        cursor.execute(
            "EXEC sp_registrar_movimiento ?, ?, ?",
            id_producto, tipo, cantidad
        )
        conn.commit()

    #registrar_movimiento(1, 'E', 3)
    registrar_movimiento(1, 'S', 3)
    print("Movimiento registrado correctamente")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()