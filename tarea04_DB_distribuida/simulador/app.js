(function () {
  "use strict";

  const Rol = { PRIMARY: "PRIMARY", REPLICA: "REPLICA" };

  class DBNode {
    constructor(id, region, rol, vivo = true, lagMs = 0) {
      this.id = id;
      this.region = region;
      this.rol = rol;
      this.vivo = vivo;
      this.lagMs = lagMs;
    }
  }

  class Cluster {
    constructor(nodos) {
      this.nodos = nodos;
    }

    primaryVivo() {
      const primaries = this.nodos.filter((n) => n.rol === Rol.PRIMARY && n.vivo);
      return primaries[0] ?? null;
    }

    replicasVivas() {
      return this.nodos.filter((n) => n.rol === Rol.REPLICA && n.vivo);
    }

    escribir(dato) {
      const p = this.primaryVivo();
      if (!p) {
        return "ESCRITURA RECHAZADA: no hay primario disponible (posible partición o fallo total).";
      }
      return `OK escrito en ${p.id}: ${JSON.stringify(dato)}`;
    }

    leer(tolerarStale = false) {
      const p = this.primaryVivo();
      if (p) return `Lectura fuerte desde ${p.id} (consistente).`;
      const reps = this.replicasVivas();
      if (reps.length === 0) return "LECTURA FALLIDA: no hay nodos disponibles.";
      if (!tolerarStale) {
        return (
          "LECTURA DEGRADADA: primario caído; sin lectura fuerte " +
          "(en CP podrías rechazar; en AP podrías leer réplica con stale)."
        );
      }
      const r = reps.reduce((a, b) => (a.lagMs <= b.lagMs ? a : b));
      return `Lectura desde réplica ${r.id} (posible dato con retraso ~${r.lagMs}ms).`;
    }

    simularCaidaAleatoria() {
      const vivos = this.nodos.filter((n) => n.vivo);
      if (vivos.length === 0) return null;
      const victima = vivos[Math.floor(Math.random() * vivos.length)];
      victima.vivo = false;
      return victima.id;
    }

    promoverReplica(replicaId) {
      const rep = this.nodos.find((n) => n.id === replicaId);
      if (!rep || rep.rol !== Rol.REPLICA) return `No existe réplica ${JSON.stringify(replicaId)}.`;
      if (!rep.vivo) return `${replicaId} está caída; no se puede promover.`;
      for (const n of this.nodos) {
        if (n.rol === Rol.PRIMARY) n.rol = Rol.REPLICA;
      }
      rep.rol = Rol.PRIMARY;
      rep.lagMs = 0;
      return `Promovido ${replicaId} a PRIMARY (antiguo primario pasado a REPLICA).`;
    }

    revivir(nodoId) {
      const n = this.nodos.find((x) => x.id === nodoId);
      if (!n) return `No existe nodo ${JSON.stringify(nodoId)}.`;
      n.vivo = true;
      return `Nodo ${nodoId} marcado como UP.`;
    }

    tumbar(nodoId) {
      const n = this.nodos.find((x) => x.id === nodoId);
      if (!n) return `No existe nodo ${JSON.stringify(nodoId)}.`;
      n.vivo = false;
      return `Nodo ${nodoId} marcado como DOWN.`;
    }
  }

  function clusterInicial() {
    return new Cluster([
      new DBNode("db-mx-1", "MX", Rol.PRIMARY, true, 0),
      new DBNode("db-gt-1", "GT", Rol.REPLICA, true, 45),
      new DBNode("db-us-1", "US", Rol.REPLICA, true, 120),
    ]);
  }

  const regionLabels = { GT: "Guatemala", MX: "México", US: "EE. UU." };

  let cluster = clusterInicial();
  const clusterEl = document.getElementById("cluster-nodes");
  const logEl = document.getElementById("event-log");
  const writeInput = document.getElementById("write-input");

  function nowTime() {
    return new Date().toLocaleTimeString("es-GT", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function log(msg, kind = "info") {
    const row = document.createElement("div");
    row.className = `log-entry log-entry--${kind}`;
    row.innerHTML = `<span class="log-entry__time">${nowTime()}</span><span class="log-entry__msg"></span>`;
    row.querySelector(".log-entry__msg").textContent = msg;
    logEl.appendChild(row);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function classifyMessage(text) {
    if (/RECHAZADA|FALLIDA|No existe|caída/i.test(text)) return "err";
    if (/DEGRADADA|posible dato con retraso/i.test(text)) return "warn";
    if (/^OK |^Lectura fuerte|^Promovido|^Nodo .*UP/i.test(text)) return "ok";
    return "info";
  }

  function renderCluster() {
    clusterEl.innerHTML = "";
    for (const n of cluster.nodos) {
      const article = document.createElement("article");
      article.className = "node-card";
      article.setAttribute("role", "listitem");
      if (n.rol === Rol.PRIMARY && n.vivo) article.classList.add("node-card--primary");
      if (!n.vivo) article.classList.add("node-card--down");

      const top = document.createElement("div");
      top.className = "node-card__top";
      top.innerHTML = `
        <p class="node-card__id">${escapeHtml(n.id)}</p>
        <span class="region-pill" data-region="${escapeHtml(n.region)}">${escapeHtml(n.region)}</span>
      `;

      const statusRow = document.createElement("div");
      statusRow.className = "status-row";
      const dot = document.createElement("span");
      dot.className = "status-dot" + (n.vivo ? "" : " status-dot--down");
      dot.setAttribute("aria-hidden", "true");
      const statusText = document.createElement("span");
      statusText.textContent = n.vivo ? "Operativo" : "Caído";
      statusRow.appendChild(dot);
      statusRow.appendChild(statusText);

      const role = document.createElement("span");
      role.className = "role-badge" + (n.rol === Rol.PRIMARY ? " role-badge--primary" : "");
      role.textContent = n.rol === Rol.PRIMARY ? "Primario" : "Réplica";

      const meta = document.createElement("p");
      meta.className = "meta";
      meta.textContent =
        n.rol === Rol.REPLICA
          ? `${regionLabels[n.region] || n.region} · lag simulado ${n.lagMs} ms`
          : `${regionLabels[n.region] || n.region} · acepta escrituras`;

      const actions = document.createElement("div");
      actions.className = "node-actions";

      const btnDown = document.createElement("button");
      btnDown.type = "button";
      btnDown.className = "btn btn--danger btn--small";
      btnDown.textContent = "Marcar caída";
      btnDown.disabled = !n.vivo;
      btnDown.addEventListener("click", () => {
        const r = cluster.tumbar(n.id);
        log(r, classifyMessage(r));
        renderCluster();
      });

      const btnUp = document.createElement("button");
      btnUp.type = "button";
      btnUp.className = "btn btn--secondary btn--small";
      btnUp.textContent = "Revivir";
      btnUp.disabled = n.vivo;
      btnUp.addEventListener("click", () => {
        const r = cluster.revivir(n.id);
        log(r, classifyMessage(r));
        renderCluster();
      });

      actions.appendChild(btnDown);
      actions.appendChild(btnUp);

      if (n.rol === Rol.REPLICA && n.vivo) {
        const btnP = document.createElement("button");
        btnP.type = "button";
        btnP.className = "btn btn--promote btn--small";
        btnP.textContent = "Promover a primario";
        btnP.addEventListener("click", () => {
          const r = cluster.promoverReplica(n.id);
          log(r, classifyMessage(r));
          renderCluster();
        });
        actions.appendChild(btnP);
      }

      article.appendChild(top);
      article.appendChild(statusRow);
      article.appendChild(role);
      article.appendChild(meta);
      article.appendChild(actions);
      clusterEl.appendChild(article);
    }
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  document.getElementById("btn-write").addEventListener("click", () => {
    const text = writeInput.value.trim() || "(vacío)";
    const r = cluster.escribir(text);
    log(r, classifyMessage(r));
    renderCluster();
  });

  writeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("btn-write").click();
  });

  document.getElementById("btn-read-strong").addEventListener("click", () => {
    const r = cluster.leer(false);
    log(r, classifyMessage(r));
  });

  document.getElementById("btn-read-stale").addEventListener("click", () => {
    const r = cluster.leer(true);
    log(r, classifyMessage(r));
  });

  document.getElementById("btn-random-fail").addEventListener("click", () => {
    const vid = cluster.simularCaidaAleatoria();
    if (vid) log(`Caída aleatoria: ${vid}`, "warn");
    else log("No quedan nodos vivos.", "err");
    renderCluster();
  });

  document.getElementById("btn-reset").addEventListener("click", () => {
    cluster = clusterInicial();
    log("Clúster reiniciado al estado inicial.", "info");
    writeInput.value = "";
    renderCluster();
  });

  document.getElementById("btn-clear-log").addEventListener("click", () => {
    logEl.innerHTML = "";
    log("Registro vaciado.", "info");
  });

  log("Simulador listo. Prueba tumbar db-mx-1 y luego «Lectura réplica (AP)».", "info");
  renderCluster();
})();
