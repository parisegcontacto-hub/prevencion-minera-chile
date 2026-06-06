(function () {
  const data = window.DASHBOARD_DATA;
  const siteById = new Map(data.sites.map((site) => [site.id, site]));

  const els = {
    siteFilter: document.querySelector("#siteFilter"),
    categoryFilter: document.querySelector("#categoryFilter"),
    statusFilter: document.querySelector("#statusFilter"),
    searchInput: document.querySelector("#searchInput"),
    resetFilters: document.querySelector("#resetFilters"),
    overallCompliance: document.querySelector("#overallCompliance"),
    overallTrend: document.querySelector("#overallTrend"),
    coursesCurrent: document.querySelector("#coursesCurrent"),
    coursesDetail: document.querySelector("#coursesDetail"),
    expiredDocs: document.querySelector("#expiredDocs"),
    criticalActions: document.querySelector("#criticalActions"),
    sidebarFocus: document.querySelector("#sidebarFocus"),
    statusDonut: document.querySelector("#statusDonut"),
    statusLegend: document.querySelector("#statusLegend"),
    siteRanking: document.querySelector("#siteRanking"),
    siteCards: document.querySelector("#siteCards"),
    recordsTable: document.querySelector("#recordsTable"),
    dueSoonList: document.querySelector("#dueSoonList"),
    actionList: document.querySelector("#actionList"),
    recordCount: document.querySelector("#recordCount"),
    exportCsvButton: document.querySelector("#exportCsvButton"),
    installAppButton: document.querySelector("#installAppButton"),
  };

  const statusMeta = {
    "Al dia": { color: "#1d7a45", className: "al-dia" },
    "Por vencer": { color: "#bd7a13", className: "por-vencer" },
    Vencido: { color: "#b73535", className: "vencido" },
    Critico: { color: "#7f1d1d", className: "critico" },
  };

  let lastRenderedRecords = [];
  let deferredInstallPrompt = null;

  function init() {
    els.siteFilter.innerHTML = [
      '<option value="all">Todas las faenas</option>',
      ...data.sites.map((site) => `<option value="${site.id}">${site.name}</option>`),
    ].join("");

    [els.siteFilter, els.categoryFilter, els.statusFilter, els.searchInput].forEach((el) => {
      el.addEventListener("input", render);
    });

    els.resetFilters.addEventListener("click", () => {
      els.siteFilter.value = "all";
      els.categoryFilter.value = "all";
      els.statusFilter.value = "all";
      els.searchInput.value = "";
      render();
    });

    els.exportCsvButton.addEventListener("click", exportCsv);
    setupPwa();
    render();
  }

  function getFilteredRecords() {
    const siteId = els.siteFilter.value;
    const category = els.categoryFilter.value;
    const status = els.statusFilter.value;
    const search = normalize(els.searchInput.value);

    return data.records.filter((record) => {
      const site = siteById.get(record.siteId);
      const haystack = normalize(
        [site.name, site.region, record.category, record.item, record.owner, record.status].join(" ")
      );

      return (
        (siteId === "all" || record.siteId === siteId) &&
        (category === "all" || record.category === category) &&
        (status === "all" || record.status === status) &&
        (!search || haystack.includes(search))
      );
    });
  }

  function render() {
    const records = getFilteredRecords();
    lastRenderedRecords = records;
    renderMetrics(records);
    renderDonut(records);
    renderRanking(records);
    renderSiteCards(records);
    renderTable(records);
    renderLists(records);
  }

  function renderMetrics(records) {
    const total = records.length || 1;
    const average = Math.round(sum(records.map((record) => record.compliance)) / total);
    const courseRecords = records.filter((record) => record.category === "Cursos");
    const courseTotal = courseRecords.length || 1;
    const coursesOk = courseRecords.filter((record) => record.status === "Al dia").length;
    const coursesPct = Math.round((coursesOk / courseTotal) * 100);
    const expiredDocs = records.filter(
      (record) => record.category === "Documentacion" && ["Vencido", "Critico"].includes(record.status)
    ).length;
    const critical = records.filter((record) => record.status === "Critico").length;

    els.overallCompliance.textContent = `${average || 0}%`;
    els.overallTrend.textContent =
      average >= 85 ? "Control saludable" : average >= 70 ? "Requiere seguimiento" : "Brecha prioritaria";
    els.coursesCurrent.textContent = `${Number.isFinite(coursesPct) ? coursesPct : 0}%`;
    els.coursesDetail.textContent = `${coursesOk} de ${courseRecords.length} registros`;
    els.expiredDocs.textContent = expiredDocs;
    els.criticalActions.textContent = critical;
    els.sidebarFocus.textContent = `${critical} acciones criticas`;
    els.recordCount.textContent = `${records.length} registros`;
  }

  function renderDonut(records) {
    const counts = Object.keys(statusMeta).map((status) => ({
      status,
      count: records.filter((record) => record.status === status).length,
      ...statusMeta[status],
    }));
    const total = records.length || 1;
    let cursor = 0;
    const segments = counts
      .map((entry) => {
        const start = cursor;
        const pct = (entry.count / total) * 100;
        cursor += pct;
        return `${entry.color} ${start}% ${cursor}%`;
      })
      .join(", ");

    els.statusDonut.style.background = `conic-gradient(${segments || "#dce3dd 0 100%"})`;
    els.statusDonut.dataset.label = `${Math.round(
      ((records.filter((record) => record.status === "Al dia").length || 0) / total) * 100
    )}%`;

    els.statusLegend.innerHTML = counts
      .map(
        (entry) => `
          <div class="legend-item">
            <span class="swatch" style="background:${entry.color}"></span>
            <strong>${entry.status}</strong>
            <span>${entry.count}</span>
          </div>
        `
      )
      .join("");
  }

  function renderRanking(records) {
    const rows = data.sites
      .map((site) => {
        const siteRecords = records.filter((record) => record.siteId === site.id);
        const avg = siteRecords.length
          ? Math.round(sum(siteRecords.map((record) => record.compliance)) / siteRecords.length)
          : 0;
        const critical = siteRecords.filter((record) => ["Critico", "Vencido"].includes(record.status)).length;
        return { site, avg, critical, total: siteRecords.length };
      })
      .sort((a, b) => b.critical - a.critical || a.avg - b.avg);

    els.siteRanking.innerHTML = rows
      .map(
        ({ site, avg, critical, total }) => `
          <div class="ranking-item">
            <div class="ranking-row">
              <strong>${site.name}</strong>
              <span class="status-badge ${critical > 0 ? "critico" : "al-dia"}">${critical} brechas</span>
            </div>
            <small>${site.operation} - ${total} registros visibles</small>
            <div class="bar" aria-label="Cumplimiento ${avg}%"><span style="width:${avg}%"></span></div>
          </div>
        `
      )
      .join("");
  }

  function renderSiteCards(records) {
    els.siteCards.innerHTML = data.sites
      .map((site) => {
        const siteRecords = records.filter((record) => record.siteId === site.id);
        const avg = siteRecords.length
          ? Math.round(sum(siteRecords.map((record) => record.compliance)) / siteRecords.length)
          : 0;
        const open = siteRecords.filter((record) => record.status !== "Al dia").length;
        return `
          <article class="site-card">
            <div>
              <h3>${site.name}</h3>
              <p>${site.region}</p>
            </div>
            <p>${site.operation}</p>
            <div class="bar" aria-label="Cumplimiento ${avg}%"><span style="width:${avg}%"></span></div>
            <div class="site-card-meta">
              <span class="risk-badge ${site.risk === "Alto" ? "high" : ""}">Riesgo ${site.risk}</span>
              <span>${open} pendientes</span>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderTable(records) {
    if (!records.length) {
      els.recordsTable.innerHTML = `
        <tr>
          <td colspan="6">No hay registros para los filtros seleccionados.</td>
        </tr>
      `;
      return;
    }

    els.recordsTable.innerHTML = records
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .map((record) => {
        const site = siteById.get(record.siteId);
        return `
          <tr>
            <td><strong>${site.name}</strong><br><small>${site.region}</small></td>
            <td>${record.category}</td>
            <td>${record.item}</td>
            <td>${record.owner}</td>
            <td>${formatDate(record.dueDate)}</td>
            <td><span class="status-badge ${statusMeta[record.status].className}">${record.status}</span></td>
          </tr>
        `;
      })
      .join("");
  }

  function renderLists(records) {
    const dueSoon = records
      .filter((record) => record.category === "Documentacion")
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    const actions = records
      .filter((record) => record.category === "Acciones")
      .sort((a, b) => {
        const severity = { Critico: 0, Vencido: 1, "Por vencer": 2, "Al dia": 3 };
        return severity[a.status] - severity[b.status] || new Date(a.dueDate) - new Date(b.dueDate);
      })
      .slice(0, 5);

    els.dueSoonList.innerHTML = renderTaskItems(dueSoon, "No hay documentos visibles.");
    els.actionList.innerHTML = renderTaskItems(actions, "No hay acciones visibles.");
  }

  function renderTaskItems(items, emptyText) {
    if (!items.length) {
      return `<div class="task-item"><span>${emptyText}</span></div>`;
    }

    return items
      .map((record) => {
        const site = siteById.get(record.siteId);
        return `
          <div class="task-item">
            <div class="task-row">
              <strong>${record.item}</strong>
              <span class="status-badge ${statusMeta[record.status].className}">${record.status}</span>
            </div>
            <small>${site.name} - ${record.owner} - vence ${formatDate(record.dueDate)}</small>
          </div>
        `;
      })
      .join("");
  }

  function exportCsv() {
    const headers = ["Faena", "Region", "Categoria", "Item", "Responsable", "Vence", "Estado", "Cumplimiento"];
    const rows = lastRenderedRecords.map((record) => {
      const site = siteById.get(record.siteId);
      return [
        site.name,
        site.region,
        record.category,
        record.item,
        record.owner,
        record.dueDate,
        record.status,
        `${record.compliance}%`,
      ];
    });
    const csv = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `prevencion-minera-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function escapeCsvValue(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  function setupPwa() {
    if ("serviceWorker" in navigator && window.isSecureContext) {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        // La aplicacion sigue funcionando aunque el registro offline no este disponible.
      });
    }

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      els.installAppButton.hidden = false;
    });

    els.installAppButton.addEventListener("click", async () => {
      if (!deferredInstallPrompt) {
        return;
      }
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      els.installAppButton.hidden = true;
    });
  }

  function sum(values) {
    return values.reduce((total, value) => total + value, 0);
  }

  function normalize(value) {
    return String(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "America/Santiago",
    }).format(new Date(`${value}T12:00:00-04:00`));
  }

  init();
})();
