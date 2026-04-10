# Parte 4 — Arquitectura MoveFast

## Componentes


| Componente                  | Rol                                                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Base de datos principal** | Primario **por región** (GT / MX / US): PostgreSQL/MySQL u homólogo; shards lógicos por región.                                     |
| **Réplicas**                | Lectura en la misma región; DR entre zonas; caché (p. ej. Redis) cerca del API para datos calientes.                                |
| **Balanceador**             | **GeoDNS / GSLB** global + **L7 regional** hacia el API Gateway; health checks.                                                     |
| **API**                     | Gateway → microservicios (matching, tarifas, ubicación, pagos); WebSockets/gRPC para tiempo real; rate limiting y circuit breakers. |


## Requisitos del enunciado

- **Fallos de red:** partición por región, degradación controlada, timeouts e idempotencia, aislamiento (bulkhead) entre pagos y matching.
- **Alta concurrencia:** API stateless, colas, partición de datos, réplicas de lectura, caché con TTL corto.
- **Tiempo real:** conexiones largas, eventos de ubicación, datos servidos **cerca** del usuario geográficamente.

## Diagrama

Vista lógica exportada como imagen:

Arquitectura MoveFast por regiones

## Lectura del diagrama

El **balanceador global** envía al usuario al borde más cercano. El **balanceador regional** reparte entre instancias del **API Gateway**. Matching y ubicación usan **primario regional** y **caché**; las **réplicas** alivian lecturas pesadas. **Pagos** sigue reglas más estrictas y jurisdicción del método de pago. Las líneas de réplica simbolizan replicación con lag monitoreado.