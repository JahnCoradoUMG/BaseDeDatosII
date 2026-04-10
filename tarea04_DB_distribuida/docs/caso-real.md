# Parte 3 — Caso real: Uber

## 1. Tipo de base de datos

Uber ha evolucionado un stack heterogéneo; en documentación y charlas públicas aparecen:

- **MySQL** (y enfoques relacionales) para muchos datos transaccionales de negocio.
- Sistemas **NoSQL / clave-valor / documentales** y almacenes **especializados** (p. ej. líneas de trabajo alrededor de **Schemaless** en su historia) para escala y esquemas flexibles.
- **Streaming**, **cachés** y pipelines para tiempo real y analítica.

## 2. Cómo aplican distribución y replicación

- **Partición** de datos y tráfico entre muchos **servicios y bases** por dominio (viajes, pagos, mapas, etc.).
- **Replicación** y despliegue **multi-región** por disponibilidad y proximidad al usuario.
- Patrones frecuentes a esa escala: **eventos**, **CDC**, **cachés regionales**, separación **tiempo real vs analítica**.

## 3. Qué priorizan en CAP

No es una sola elección global:

- **P** asumida en arquitectura mundial.
- **Producto en tiempo real:** más cerca de **A** y **latencia baja**, con **eventual consistency** donde el negocio lo permite.
- **Pagos y contabilidad:** más cerca de **consistencia fuerte** y **correctitud**, con caminos transaccionales e idempotencia.

