# Parte 1 — Teorema CAP (MoveFast)

**Contexto:** MoveFast es una app tipo Uber en **Guatemala, México y Estados Unidos**: viajes en tiempo real, tarifas dinámicas, ubicación de conductores y pagos.

## 1. ¿Qué dos propiedades del CAP elegiría?

En un sistema distribuido geográficamente, **la tolerancia a particiones (P) no es opcional**: si la red entre Ciudad de México y Nueva York se fragmenta, el software debe seguir tomando decisiones coherentes con su diseño. La elección real es entre **consistencia (C)** y **disponibilidad (A)** durante esa partición.

Para la **capa operativa** (solicitud de viajes, ubicación en tiempo casi real, tarifas, conductores cercanos):

- **P — Partition tolerance**
- **A — Availability (alta disponibilidad)**

Es decir, **AP** en el núcleo operativo, con **consistencia eventual** donde el negocio lo tolera (posición del conductor, ETA, oferta/demanda).

Para **pagos y liquidaciones**, lo razonable es acercarse a **CP** en un **subservicio dedicado** (consistencia fuerte donde importa el dinero). CAP se aplica por **subsistema**, no como un único interruptor global.

## 2. Justificación con un escenario real

**Escenario:** Un corte de red deja **incomunicadas** temporalmente Guatemala y el centro principal en EE. UU. Usuarios y conductores siguen activos en Guatemala.

- Con **AP**: los nodos regionales pueden **seguir aceptando solicitudes** y mostrar datos **posiblemente desfasados** (réplica/caché local); luego hay **reconciliación** al volver la red.
- Con **consistencia fuerte global** en cada lectura “cerca de mí”, muchas operaciones **fallarían o esperarían** cruzando la partición → la app se siente **no disponible** en horas pico.

Uber combina muchos almacenes; la idea aplicable: **matching y tiempo real** priorizan **seguir operando**; el **dinero** exige reglas más estrictas.

## 3. ¿Qué pasaría con una combinación incorrecta?

- **CA ignorando P:** asumir red perfecta → **timeouts en cascada** y bloqueos ante fallos reales.
- **CP en todo (incluida geolocalización):** ante partición, **rechazo o demora** hasta consenso global → menos viajes completados.
- **AP también en pagos sin diseño:** riesgo de **doble cobro** e **inconsistencia de saldos**; ahí conviene **ACID**, idempotencia y compensación.

