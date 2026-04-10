# TAREA04 — Bases de datos distribuidas (MoveFast / Uber)

Proyecto para el análisis de una arquitectura tipo **Uber** en tres regiones: Guatemala, México y Estados Unidos.

## Estructura

```
TAREA04_DB_DISTRIBUIDA/
├── README.md
├── docs/
│   ├── cap.md
│   ├── sharding.md
│   ├── caso-real.md
│   ├── arquitectura.md
│   └── diagramas/
│       └── arquitectura.png
└── simulador/
    ├── index.html   # interfaz del simulador (solo frontend)
    ├── styles.css
    └── app.js       # lógica del clúster en el navegador
```

## Documentación por tema


| Archivo                                      | Contenido                                      |
| -------------------------------------------- | ---------------------------------------------- |
| [docs/cap.md](docs/cap.md)                   | Teorema CAP                                    |
| [docs/sharding.md](docs/sharding.md)         | Sharding y replicación                         |
| [docs/caso-real.md](docs/caso-real.md)       | Caso real: Uber                                |
| [docs/arquitectura.md](docs/arquitectura.md) | Arquitectura MoveFast + referencia al diagrama |


## Simulador de caídas de nodos (solo frontend)

Interfaz web estática: **sin backend, sin API**. Abre el archivo en el navegador:

- **Opción A:** doble clic en `simulador/index.html` (Chrome/Edge/Firefox).
- **Opción B:** desde la carpeta del proyecto, `npx --yes serve simulador` y entra a la URL que muestre (útil si tu navegador restringe `file://` para algún recurso).

En pantalla verás las tres regiones (réplicas GT/US y primario MX), botones de caída/revivir/promoción, escritura, lecturas fuerte vs réplica (AP), fallo aleatorio y un registro de eventos.

**Flujo de prueba:** tumbar `db-mx-1` → lectura fuerte (degradada) → lectura réplica (AP) → promover `db-gt-1` → escribir de nuevo.

