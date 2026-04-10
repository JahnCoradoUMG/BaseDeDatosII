# Parte 2 — Sharding vs replicación (MoveFast)

## A. ¿Cómo dividiría la base de datos? (país, ciudad, usuario)

Propuesta **híbrida** por dominio:


| Dominio de datos                        | Criterio de partición (sharding)                     | Motivo breve                                    |
| --------------------------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| Perfiles, viajes, historial por región  | **País / región** (GT, MX, US)                       | Cumplimiento, latencia, aislamiento de carga    |
| Conductores/pasajeros activos, matching | **Geohash o ciudad/metrópoli** dentro del país       | Consultas “cerca de mí”; no escanear el planeta |
| Identidad global                        | **Shard por `user_id`** o catálogo replicado         | Viajes en varios países con un mismo usuario    |
| Pagos y contabilidad                    | **Jurisdicción / pasarela** (+ partición por cuenta) | PCI, fiscalidad, auditoría                      |


**Resumen:** shard principal por **región (país)** y sub-sharding **geográfico (ciudad/celda)** para el estado en tiempo real del marketplace.

## B. ¿Qué tipo de replicación usaría?

- **Lectura asíncrona** para analítica, dashboards e informes con lag aceptable.
- **Síncrona o semisíncrona** en el **camino crítico de pagos** (clúster más pequeño y estricto).
- **Multi-región:** réplicas **locales** por región para catálogo y datos calientes; **CDC / eventos** hacia almacenes analíticos si aplica.

## C. Rendimiento, escalabilidad y riesgos

- **Rendimiento:** consultas geo acotadas a **pocos shards**, no a una base monolítica global.
- **Escalabilidad:** crecimiento por región sin re-mapear todo el mundo; más **read replicas** en picos.
- **Riesgos:** lag de réplicas asíncronas (diseño de producto); **hot spots** en ciudades enormes (subceldas, re-sharding); identidad y contratos claros entre regiones.

