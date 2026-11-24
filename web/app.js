/**
 * ESTACIÓN DE CONTROL — CORREDOR CRA. 51B (SIMULADOR TÁCTICO ILUSTRADO)
 * Priorización de Paraderos mediante Grafos Geodésicos y Perceptrón de Rosenblatt
 * Asignatura: Matemáticas Discretas (MAT 4021) - Universidad del Norte
 */

// ============================================================================
// 1. PALETA ARQUITECTÓNICA Y DATOS CANÓNICOS (PARIDAD CON motor_discreto.py)
// ============================================================================

const THEME = {
  canvas: "#181A1F",
  surface: "#1F2329",
  plate: "#24292F",
  recess: "#14161B",
  ivory: "#EFECE1",
  inkSecondary: "#C5C1B4",
  inkMuted: "#989386",
  terracotta: "#C25632",
  terracottaHi: "#DE704B",
  petrol: "#21556A",
  petrolHi: "#64A6C1",
  brass: "#C69C4E",
  brassHi: "#DBB873",
  sage: "#347D59",
  sageHi: "#55AF83",
  edgeBase: "#2B4657",
  edgeStroke: "#4E5866"
};

const PARADEROS_6 = [
  { id: 0, codigo: "v1", nombre: "Club Campestre", desc: "Acceso Norte / Villa Campestre", afluencia: 0.20, y: 0, x: 110, y_pos: 215 },
  { id: 1, codigo: "v2", nombre: "Clínica Portoazul", desc: "Intersección Crítica Gran Vía", afluencia: 0.70, y: 0, x: 275, y_pos: 95 },
  { id: 2, codigo: "v3", nombre: "UniNorte Puerta 4", desc: "Puente Peatonal / Demanda Máx.", afluencia: 0.95, y: 1, x: 275, y_pos: 335 },
  { id: 3, codigo: "v4", nombre: "Makro / Transversal", desc: "Bypass & Conector Intermedio", afluencia: 0.80, y: 1, x: 440, y_pos: 215 },
  { id: 4, codigo: "v5", nombre: "UniAtlántico / Colegios", desc: "Nodo Intercolegial Secundario", afluencia: 0.55, y: 0, x: 595, y_pos: 215 },
  { id: 5, codigo: "v6", nombre: "Retorno Sur 51B", desc: "Salida hacia Puerto Colombia", afluencia: 0.15, y: 0, x: 735, y_pos: 215 }
];

const ARISTAS_6 = [
  [0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5]
];

const CENTRALIDADES_6_TEORICAS = [
  { cod: "v1", nom: "Campestre", deg: 2, cd_frac: "2/5", cd_dec: "0.400", sum_d: 11, cc_frac: "5/11", cc_dec: "0.455", cb_frac: "1/2", cb_dec: "0.500", cb_norm_frac: "1/20", cb_norm_dec: "0.050", y: 0 },
  { cod: "v2", nom: "Portoazul", deg: 2, cd_frac: "2/5", cd_dec: "0.400", sum_d: 9, cc_frac: "5/9", cc_dec: "0.556", cb_frac: "3/2", cb_dec: "1.500", cb_norm_frac: "3/20", cb_norm_dec: "0.150", y: 0 },
  { cod: "v3", nom: "UniNorte P4", deg: 2, cd_frac: "2/5", cd_dec: "0.400", sum_d: 9, cc_frac: "5/9", cc_dec: "0.556", cb_frac: "3/2", cb_dec: "1.500", cb_norm_frac: "3/20", cb_norm_dec: "0.150", y: 1 },
  { cod: "v4", nom: "Makro", deg: 3, cd_frac: "3/5", cd_dec: "0.600", sum_d: 7, cc_frac: "5/7", cc_dec: "0.714", cb_frac: "13/2", cb_dec: "6.500", cb_norm_frac: "13/20", cb_norm_dec: "0.650", y: 1 },
  { cod: "v5", nom: "UniAtlántico", deg: 2, cd_frac: "2/5", cd_dec: "0.400", sum_d: 9, cc_frac: "5/9", cc_dec: "0.556", cb_frac: "4/1", cb_dec: "4.000", cb_norm_frac: "4/10", cb_norm_dec: "0.400", y: 0 },
  { cod: "v6", nom: "Retorno Sur", deg: 1, cd_frac: "1/5", cd_dec: "0.200", sum_d: 13, cc_frac: "5/13", cc_dec: "0.385", cb_frac: "0/1", cb_dec: "0.000", cb_norm_frac: "0/10", cb_norm_dec: "0.000", y: 0 }
];

const CAMINOS_EMPATADOS_6 = [
  { par: "(v1, v4)", ext: "Campestre ↔ Makro", sigma: 2, nodo: "v2 (Portoazul)", con_v: 1, aporte: "1/2 = 0.50" },
  { par: "(v1, v4)", ext: "Campestre ↔ Makro", sigma: 2, nodo: "v3 (UniNorte)", con_v: 1, aporte: "1/2 = 0.50" },
  { par: "(v1, v5)", ext: "Campestre ↔ UniAtlántico", sigma: 2, nodo: "v2 (Portoazul)", con_v: 1, aporte: "1/2 = 0.50" },
  { par: "(v1, v5)", ext: "Campestre ↔ UniAtlántico", sigma: 2, nodo: "v3 (UniNorte)", con_v: 1, aporte: "1/2 = 0.50" },
  { par: "(v1, v6)", ext: "Campestre ↔ Retorno Sur", sigma: 2, nodo: "v2 (Portoazul)", con_v: 1, aporte: "1/2 = 0.50" },
  { par: "(v1, v6)", ext: "Campestre ↔ Retorno Sur", sigma: 2, nodo: "v3 (UniNorte)", con_v: 1, aporte: "1/2 = 0.50" },
  { par: "(v2, v3)", ext: "Portoazul ↔ UniNorte", sigma: 2, nodo: "v1 (Campestre)", con_v: 1, aporte: "1/2 = 0.50" },
  { par: "(v2, v3)", ext: "Portoazul ↔ UniNorte", sigma: 2, nodo: "v4 (Makro)", con_v: 1, aporte: "1/2 = 0.50" }
];

const PARADEROS_15 = [
  { id: 0, codigo: "P01", nombre: "Circunvalar / Cra 51B", desc: "Acceso Sur Barranquilla / Entrada Troncal", afluencia: 0.40, lat: 11.0112, lon: -74.8385 },
  { id: 1, codigo: "P02", nombre: "Makro / Transversal 51B", desc: "Bypass Arterial y enlace con Cra 53", afluencia: 0.80, lat: 11.0145, lon: -74.8428 },
  { id: 2, codigo: "P03", nombre: "Le Champ / Villa Santos", desc: "Ruta Alterna Occidental Villa Santos", afluencia: 0.50, lat: 11.0162, lon: -74.8465 },
  { id: 3, codigo: "P04", nombre: "Clínica Portoazul", desc: "Frente de Obras Gran Vía / Av. Las Dunas", afluencia: 0.70, lat: 11.0178, lon: -74.8505 },
  { id: 4, codigo: "P05", nombre: "Colegio San José", desc: "Acceso Escolar y Desvío Sur", afluencia: 0.60, lat: 11.0172, lon: -74.8548 },
  { id: 5, codigo: "P06", nombre: "UniNorte Puerta 2", desc: "Acceso Administrativo y Deportivo", afluencia: 0.65, lat: 11.0190, lon: -74.8495 },
  { id: 6, codigo: "P07", nombre: "UniNorte Puerta 4", desc: "Puente Peatonal / Demanda Pico Máxima", afluencia: 0.95, lat: 11.0202, lon: -74.8512 },
  { id: 7, codigo: "P08", nombre: "Colegio Británico", desc: "Enlace Escolar Intermedio Calle 130", afluencia: 0.55, lat: 11.0215, lon: -74.8540 },
  { id: 8, codigo: "P09", nombre: "UniLibre (Sede Norte)", desc: "Campus Universitario Norte / Alta Demanda", afluencia: 0.85, lat: 11.0232, lon: -74.8582 },
  { id: 9, codigo: "P10", nombre: "Uni. Antonio Nariño (UAN)", desc: "Nodo Universitario Intermedio", afluencia: 0.50, lat: 11.0250, lon: -74.8620 },
  { id: 10, codigo: "P11", nombre: "Club Campestre", desc: "Retorno Norte Villa Campestre", afluencia: 0.25, lat: 11.0265, lon: -74.8665 },
  { id: 11, codigo: "P12", nombre: "UniAtlántico (Km 7)", desc: "Sede Regional Troncal / Afluencia Masiva", afluencia: 0.90, lat: 11.0185, lon: -74.8690 },
  { id: 12, codigo: "P13", nombre: "Villa Campestre Bulevar", desc: "Sector Residencial y Comercial 51B", afluencia: 0.60, lat: 11.0255, lon: -74.8550 },
  { id: 13, codigo: "P14", nombre: "Corredor Caujaral", desc: "Intersección Lagos de Caujaral y Retorno", afluencia: 0.30, lat: 11.0220, lon: -74.8800 },
  { id: 14, codigo: "P15", nombre: "Entrada Puerto Colombia", desc: "Glorieta de Acceso Intermunicipal / Playa", afluencia: 0.35, lat: 11.0200, lon: -74.8950 }
];

const ARISTAS_15_BASE = [
  [0, 1], [1, 2], [1, 3], [2, 5], [3, 4], [3, 6], [4, 6], [4, 7],
  [5, 6], [6, 7], [6, 8], [7, 8], [8, 9], [8, 10], [9, 11], [10, 11],
  [10, 12], [11, 13], [12, 13], [13, 14]
];

const ARISTA_CIERRE_GRAN_VIA = [3, 6]; // Portoazul (P04) <-> UniNorte Puerta 4 (P07)

// El backend Python (main.py) solo existe en ejecución local. En un hosting estático
// (p. ej. Netlify) no se llama a /api/* y todo se calcula en el navegador con las
// mismas fórmulas de motor_discreto.py.
const BACKEND_LOCAL = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

function apiFetch(url, opciones) {
  if (!BACKEND_LOCAL) return Promise.reject(new Error("Sin backend: calculo en el navegador"));
  return fetch(url, opciones);
}

// ============================================================================
// 1b. MOTOR DISCRETO EN EL CLIENTE (réplica de motor_discreto.py)
// ============================================================================

function construirAdyacencia(n, aristas) {
  const A = Array.from({ length: n }, () => new Array(n).fill(0));
  aristas.forEach(([u, v]) => { A[u][v] = 1; A[v][u] = 1; });
  return A;
}

// BFS por capas desde cada fuente: distancias D[s][t] y número de geodésicas sigma[s][t]
function bfsDistanciasYCaminos(A) {
  const n = A.length;
  const D = Array.from({ length: n }, () => new Array(n).fill(Infinity));
  const sigma = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let s = 0; s < n; s++) {
    D[s][s] = 0;
    sigma[s][s] = 1;
    const cola = [s];
    while (cola.length) {
      const u = cola.shift();
      for (let v = 0; v < n; v++) {
        if (!A[u][v]) continue;
        if (D[s][v] === Infinity) {
          D[s][v] = D[s][u] + 1;
          sigma[s][v] = sigma[s][u];
          cola.push(v);
        } else if (D[s][v] === D[s][u] + 1) {
          sigma[s][v] += sigma[s][u];
        }
      }
    }
  }
  return { D, sigma };
}

// Centralidades de Freeman: grado, cercanía e intermediación normalizada por C(n-1, 2).
// sigma_st(v) = sigma_sv * sigma_vt si d(s,v) + d(v,t) = d(s,t)
function centralidadesFreeman(A) {
  const n = A.length;
  const { D, sigma } = bfsDistanciasYCaminos(A);
  const cd = A.map(fila => fila.reduce((a, b) => a + b, 0));
  const sumD = D.map(fila => fila.reduce((a, b) => a + b, 0));
  const cc = sumD.map(sd => (sd > 0 && isFinite(sd) ? (n - 1) / sd : 0));
  const cb = new Array(n).fill(0);
  for (let s = 0; s < n; s++) {
    for (let t = s + 1; t < n; t++) {
      if (!isFinite(D[s][t]) || D[s][t] === 0) continue;
      for (let v = 0; v < n; v++) {
        if (v === s || v === t) continue;
        if (D[s][v] + D[v][t] === D[s][t]) cb[v] += (sigma[s][v] * sigma[v][t]) / sigma[s][t];
      }
    }
  }
  const pares = n > 2 ? ((n - 1) * (n - 2)) / 2 : 1;
  return { D, sigma, cd, sumD, cc, cb, cbNorm: cb.map(x => x / pares) };
}

function centralidades15(esCierre) {
  const aristas = esCierre
    ? ARISTAS_15_BASE.filter(([u, v]) => !((u === ARISTA_CIERRE_GRAN_VIA[0] && v === ARISTA_CIERRE_GRAN_VIA[1]) ||
                                          (u === ARISTA_CIERRE_GRAN_VIA[1] && v === ARISTA_CIERRE_GRAN_VIA[0])))
    : ARISTAS_15_BASE;
  return centralidadesFreeman(construirAdyacencia(PARADEROS_15.length, aristas));
}

// ============================================================================
// 2. ESTADO GLOBAL DE LA APLICACIÓN
// ============================================================================

const appState = {
  activeView: "view-menu",
  apiConnected: false,
  datosApi: null,
  centralidades15Data: null,
  simulacionActual: null,
  cierreGranVia: false,
  selectedBfsOrigin: 0,
  currentMatrixView: "adj",
  impactMetricMode: "wait", // "wait" | "reject"
  chartDecision: null,
  chartImpact: null,
  leafletMap: null,
  baseLayers: { osm: null, sat: null },
  activeBaseLayer: "osm",
  markersGroup: null,
  mapMarkers: [],
  mapPolylines: [],
  traceFilterEpoch: "all",
  activeStopIndex: null,
  // Hiperparámetros Perceptrón
  eta: 0.50,
  b0: -1.00,
  w1: 0.00,
  w2: 0.00,
  perceptronHistory: [],
  perceptronWeights: [0.20, 0.60],
  perceptronBias: -0.50,
  perceptronConverged: true,
  perceptronEpochs: 2
};

// ============================================================================
// 3. INICIALIZACIÓN
// ============================================================================

document.addEventListener("DOMContentLoaded", async () => {
  setupNavigationTabs();
  setupStudioSubviews();
  setupEventListeners();
  initSvgGraph6();
  renderMasterFreemanTable();
  renderTieBreakdownTable();
  renderMatrixView();

  // 1. Cargar datos del backend (/api/data)
  try {
    const res = await apiFetch("/api/data");
    if (res.ok) {
      appState.datosApi = await res.json();
      appState.apiConnected = true;

      if (appState.datosApi.centralidades_15_normal) {
        appState.centralidades15Data = {
          cierre_gran_via: false,
          ...appState.datosApi.centralidades_15_normal
        };
      }
      if (appState.datosApi.perceptron_6) {
        const pData = appState.datosApi.perceptron_6;
        appState.perceptronWeights = pData.w;
        appState.perceptronBias = pData.b;
        appState.perceptronEpochs = pData.epochs;
        appState.perceptronHistory = pData.history;
      }
      if (appState.datosApi.simulacion_base) {
        appState.simulacionActual = appState.datosApi.simulacion_base;
      }
    }
  } catch (err) {
    console.warn("Backend offline, operando con cómputo cliente determinista.", err);
  }

  // 2. Inicializar mapa Leaflet (solo OSM y Esri World Imagery)
  initLeafletMap();

  // 3. Inicializar Perceptrón de Rosenblatt
  await ejecutarEntrenamientoPerceptron();
  initDecisionBoundaryChart();

  // 4. Inicializar Simulación de Impacto y Telemetría del Menú
  await ejecutarSimulacionImpacto();
  actualizarResumenSidebar15();
  actualizarTelemetriaMenu();

  // 5. Activar vista inicial por hash (por defecto view-menu en '/') y KaTeX
  const initialView = resolveHashView();
  if (initialView !== "view-menu") {
    activarVista(initialView, false);
  } else {
    renderAllKaTeX();
  }
});

// ============================================================================
// 4. NAVEGACIÓN ENTRE MENÚ Y MÓDULOS
// ============================================================================

const VALID_VIEWS = new Set([
  "view-menu",
  "view-map",
  "view-centralities",
  "view-perceptron",
  "view-impact"
]);

function resolveHashView() {
  const raw = (window.location.hash || "").replace(/^#/, "").trim();
  return VALID_VIEWS.has(raw) ? raw : "view-menu";
}

function activarVista(targetId, updateHash = true) {
  if (!targetId || !VALID_VIEWS.has(targetId)) return;
  appState.activeView = targetId;

  const dockButtons = document.querySelectorAll(".dock-plaque-btn");
  const tabViews = document.querySelectorAll(".tab-view");

  dockButtons.forEach(btn => {
    const isActive = btn.getAttribute("data-tab") === targetId;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  tabViews.forEach(view => {
    view.classList.toggle("active", view.id === targetId);
  });

  if (updateHash && window.history && typeof window.history.replaceState === "function") {
    const desiredHash = targetId === "view-menu" ? "" : `#${targetId}`;
    if (window.location.hash !== desiredHash) {
      const nextUrl = desiredHash || `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(null, "", nextUrl);
    }
  }

  if (targetId === "view-map" && appState.leafletMap) {
    const recenter = () => {
      if (!appState.leafletMap) return;
      appState.leafletMap.invalidateSize({ animate: false });
      if (appState.activeStopIndex === null) {
        appState.leafletMap.setView([11.0185, -74.8550], 14, { animate: false });
      }
    };
    requestAnimationFrame(recenter);
    setTimeout(recenter, 160);
  }

  if (targetId === "view-perceptron" && appState.chartDecision) {
    requestAnimationFrame(() => appState.chartDecision && appState.chartDecision.resize());
    setTimeout(() => appState.chartDecision && appState.chartDecision.resize(), 140);
  }

  if (targetId === "view-impact" && appState.chartImpact) {
    requestAnimationFrame(() => appState.chartImpact && appState.chartImpact.resize());
    setTimeout(() => appState.chartImpact && appState.chartImpact.resize(), 140);
  }

  renderAllKaTeX();
}

function setupNavigationTabs() {
  document.querySelectorAll(".dock-plaque-btn[data-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      activarVista(btn.getAttribute("data-tab"));
    });
  });

  document.querySelectorAll(".menu-module-card[data-tab]").forEach(card => {
    card.addEventListener("click", () => {
      activarVista(card.getAttribute("data-tab"));
    });
  });

  window.addEventListener("hashchange", () => {
    activarVista(resolveHashView(), false);
  });
}

function setupStudioSubviews() {
  const subnavBtns = document.querySelectorAll(".subnav-plaque-btn[data-subview]");
  const subviews = document.querySelectorAll(".data-subview");

  subnavBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-subview");
      if (!targetId) return;

      subnavBtns.forEach(b => b.classList.remove("active"));
      subviews.forEach(v => v.classList.remove("active"));

      btn.classList.add("active");
      const targetView = document.getElementById(targetId);
      if (targetView) targetView.classList.add("active");

      renderAllKaTeX();
    });
  });
}

function actualizarTelemetriaMenu() {
  const paraderos = obtenerCentralidades15Actuales();
  const numRef = paraderos.filter(p => p.y_hat === 1).length;
  const maxNode = paraderos.reduce((best, cur) => (cur.cb_norm > best.cb_norm ? cur : best), paraderos[0]);

  const apiEl = document.getElementById("menu-api-status");
  if (apiEl) {
    apiEl.textContent = appState.apiConnected
      ? "Conectado a /api/data · Barranquilla"
      : "Cómputo local determinista · Barranquilla";
  }

  const nodesEl = document.getElementById("menu-tel-nodes");
  const roadEl = document.getElementById("menu-tel-road");
  if (nodesEl) nodesEl.textContent = `15 Nodos · ${appState.cierreGranVia ? 19 : 20} Tramos`;
  if (roadEl) {
    roadEl.textContent = appState.cierreGranVia
      ? "Cierre activo en La Gran Vía (desvío)"
      : "Calzada La Gran Vía habilitada";
  }

  const refEl = document.getElementById("menu-tel-reinforce");
  const maxEl = document.getElementById("menu-tel-maxnode");
  if (refEl) refEl.textContent = `${numRef} / 15 Paraderos (y=1)`;
  if (maxEl && maxNode) maxEl.innerHTML = `Máx. C<sub>B</sub>': ${maxNode.codigo} (${maxNode.cb_norm.toFixed(3)})`;

  const convEl = document.getElementById("menu-tel-convergence");
  const weightsEl = document.getElementById("menu-tel-weights");
  const w1 = appState.perceptronWeights[0];
  const w2 = appState.perceptronWeights[1];
  const b = appState.perceptronBias;
  if (convEl) {
    convEl.textContent = appState.perceptronConverged
      ? `Convergencia · Época ${appState.perceptronEpochs}`
      : `Límite ${appState.perceptronEpochs} épocas`;
  }
  if (weightsEl) {
    weightsEl.textContent = `w = [${w1.toFixed(2)}, ${w2.toFixed(2)}] · b = ${b.toFixed(2)}`;
  }

  const sim = appState.simulacionActual || calcularSimulacionLocal();
  const savEl = document.getElementById("menu-tel-savings");
  const paxEl = document.getElementById("menu-tel-saved-pax");
  if (savEl && sim) {
    savEl.textContent = `${sim.tiempo_espera_promedio_estatico.toFixed(1)} → ${sim.tiempo_espera_promedio_dinamico.toFixed(1)} min (-${sim.reduccion_tiempo_espera_pct.toFixed(1)}%)`;
  }
  if (paxEl && sim) {
    paxEl.textContent = `+${sim.pasajeros_salvados_sobrecupo.toLocaleString("en-US")} usuarios abordaron sin rechazo`;
  }
}

// ============================================================================
// 5. VISTA 1: MAPA DEL CORREDOR (OSM + ESRI WORLD IMAGERY - CONTROLES EN PLACA)
// ============================================================================

function initLeafletMap() {
  const mapElem = document.getElementById("leaflet-map");
  if (!mapElem || typeof L === "undefined") return;

  const osmLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  });

  const esriSatellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 19,
    attribution: "© Esri World Imagery"
  });

  appState.baseLayers = { osm: osmLayer, sat: esriSatellite };

  appState.leafletMap = L.map("leaflet-map", {
    layers: [osmLayer],
    zoomControl: false,
    scrollWheelZoom: true
  }).setView([11.0185, -74.8550], 14);

  // Controles Táctiles Top-Left: Zoom In (+), Zoom Out (-), Centrar Cra. 51B
  const TacticalNavControl = L.Control.extend({
    options: { position: "topleft" },
    onAdd: function () {
      const stack = L.DomUtil.create("div", "map-plaque-stack leaflet-control");

      const btnZoomIn = L.DomUtil.create("button", "map-square-plaque", stack);
      btnZoomIn.type = "button";
      btnZoomIn.id = "btn-map-zoom-in";
      btnZoomIn.title = "Acercar mapa";
      btnZoomIn.setAttribute("aria-label", "Acercar mapa");
      btnZoomIn.innerHTML = `<img src="/assets/btn-zoom-in.jpg" alt="" aria-hidden="true">`;

      const btnZoomOut = L.DomUtil.create("button", "map-square-plaque", stack);
      btnZoomOut.type = "button";
      btnZoomOut.id = "btn-map-zoom-out";
      btnZoomOut.title = "Alejar mapa";
      btnZoomOut.setAttribute("aria-label", "Alejar mapa");
      btnZoomOut.innerHTML = `<img src="/assets/btn-zoom-out.jpg" alt="" aria-hidden="true">`;

      const btnCenter = L.DomUtil.create("button", "map-square-plaque", stack);
      btnCenter.type = "button";
      btnCenter.id = "btn-map-center";
      btnCenter.title = "Centrar vista en el Corredor Cra. 51B";
      btnCenter.setAttribute("aria-label", "Centrar vista en el Corredor Cra. 51B");
      btnCenter.innerHTML = `<img src="/assets/btn-center-map.jpg" alt="" aria-hidden="true">`;

      L.DomEvent.disableClickPropagation(stack);
      L.DomEvent.disableScrollPropagation(stack);

      btnZoomIn.addEventListener("click", () => appState.leafletMap && appState.leafletMap.zoomIn());
      btnZoomOut.addEventListener("click", () => appState.leafletMap && appState.leafletMap.zoomOut());
      btnCenter.addEventListener("click", () => restablecerVistaCorredor());

      return stack;
    }
  });
  new TacticalNavControl().addTo(appState.leafletMap);

  // Selector de Capas Ilustrado Top-Right (Mapa Vial OSM vs Vista Satelital Esri)
  const TacticalLayerControl = L.Control.extend({
    options: { position: "topright" },
    onAdd: function () {
      const box = L.DomUtil.create("div", "map-layer-group leaflet-control");

      const btnOsm = L.DomUtil.create("button", "map-layer-plaque active", box);
      btnOsm.type = "button";
      btnOsm.id = "btn-layer-osm";
      btnOsm.innerHTML = `<span class="plaque-frame xs"><img src="/assets/btn-layer-map.jpg" alt="" aria-hidden="true"></span><span>Mapa Vial</span>`;

      const btnSat = L.DomUtil.create("button", "map-layer-plaque", box);
      btnSat.type = "button";
      btnSat.id = "btn-layer-sat";
      btnSat.innerHTML = `<span class="plaque-frame xs"><img src="/assets/btn-layer-sat.jpg" alt="" aria-hidden="true"></span><span>Satélite</span>`;

      L.DomEvent.disableClickPropagation(box);
      L.DomEvent.disableScrollPropagation(box);

      btnOsm.addEventListener("click", () => cambiarCapaBaseMapa("osm"));
      btnSat.addEventListener("click", () => cambiarCapaBaseMapa("sat"));

      return box;
    }
  });
  new TacticalLayerControl().addTo(appState.leafletMap);

  appState.markersGroup = L.featureGroup().addTo(appState.leafletMap);

  renderizarCapaVial15();
  renderizarTarjetas15();

  appState.leafletMap.on("popupclose", () => {
    if (appState.activeStopIndex !== null) {
      appState.activeStopIndex = null;
      document.querySelectorAll(".stop-card-dark").forEach(c => c.classList.remove("active"));
      aplicarEstilosMarcadores();
    }
  });
}

function cambiarCapaBaseMapa(tipo) {
  if (!appState.leafletMap || appState.activeBaseLayer === tipo) return;
  const { osm, sat } = appState.baseLayers;
  if (!osm || !sat) return;

  if (tipo === "sat") {
    if (appState.leafletMap.hasLayer(osm)) appState.leafletMap.removeLayer(osm);
    if (!appState.leafletMap.hasLayer(sat)) appState.leafletMap.addLayer(sat);
  } else {
    if (appState.leafletMap.hasLayer(sat)) appState.leafletMap.removeLayer(sat);
    if (!appState.leafletMap.hasLayer(osm)) appState.leafletMap.addLayer(osm);
  }

  appState.activeBaseLayer = tipo;
  const btnOsm = document.getElementById("btn-layer-osm");
  const btnSat = document.getElementById("btn-layer-sat");
  if (btnOsm) btnOsm.classList.toggle("active", tipo === "osm");
  if (btnSat) btnSat.classList.toggle("active", tipo === "sat");
}

function aplicarEstilosMarcadores() {
  const paraderos = obtenerCentralidades15Actuales();
  appState.mapMarkers.forEach((m, mIdx) => {
    const isCrit = paraderos[mIdx].y_hat === 1;
    const isSel = appState.activeStopIndex === mIdx;
    m.setStyle({
      radius: isSel ? 11.5 : (isCrit ? 8.5 : 7),
      weight: isSel ? 3.5 : (isCrit ? 2.5 : 2),
      color: isSel ? THEME.brassHi : THEME.ivory,
      fillColor: isCrit ? THEME.terracotta : THEME.petrol,
      fillOpacity: 0.96
    });
  });
}

function restablecerVistaCorredor() {
  if (!appState.leafletMap) return;
  appState.activeStopIndex = null;
  appState.leafletMap.setView([11.0185, -74.8550], 14);
  document.querySelectorAll(".stop-card-dark").forEach(c => c.classList.remove("active"));
  aplicarEstilosMarcadores();
  appState.mapMarkers.forEach(m => m.closePopup());
  const fFormula = document.getElementById("float-eval-formula");
  const fDetail = document.getElementById("float-eval-detail");
  if (fFormula) fFormula.innerHTML = `z = 0.20 · C<sub>B</sub>' + 0.60 · Demanda - 0.50`;
  if (fDetail) fDetail.textContent = "Selecciona un paradero para auditar su clasificación z ≥ 0.";
}

async function recalcularRed15(esCierre) {
  appState.cierreGranVia = esCierre;
  const selIdx = appState.activeStopIndex;
  const hadOpenPopup = selIdx !== null && appState.mapMarkers[selIdx] && appState.mapMarkers[selIdx].isPopupOpen();

  try {
    const res = await apiFetch(`/api/recalculate?cierre=${esCierre}`);
    if (res.ok) {
      appState.centralidades15Data = await res.json();
    }
  } catch (err) {
    console.warn("Recálculo offline con fallback local determinista.", err);
  }

  renderizarCapaVial15();
  const searchInput = document.getElementById("search-stops");
  renderizarTarjetas15(searchInput ? searchInput.value : "");
  actualizarResumenSidebar15();

  if (selIdx !== null) {
    actualizarPanelEvaluacionNodal(selIdx);
    if (hadOpenPopup && appState.mapMarkers[selIdx]) {
      appState.mapMarkers[selIdx].openPopup();
    }
  }

  await ejecutarSimulacionImpacto();
  actualizarTelemetriaMenu();
}

function obtenerCentralidades15Actuales() {
  const esCierre = appState.cierreGranVia;

  if (appState.centralidades15Data && appState.centralidades15Data.cierre_gran_via === esCierre) {
    const d = appState.centralidades15Data;
    return PARADEROS_15.map((p, i) => ({
      ...p,
      cb_norm: d.cb_norm[i],
      cc: d.cc[i],
      deg: d.cd[i],
      y_hat: d.predicciones[i]
    }));
  }

  if (appState.datosApi) {
    const key = esCierre ? "centralidades_15_cierre" : "centralidades_15_normal";
    if (appState.datosApi[key]) {
      const d = appState.datosApi[key];
      return PARADEROS_15.map((p, i) => ({
        ...p,
        cb_norm: d.cb_norm[i],
        cc: d.cc[i],
        deg: d.cd[i],
        y_hat: d.predicciones[i]
      }));
    }
  }

  // Sin backend: BFS + Freeman calculados aquí mismo sobre el grafo actual
  // (con o sin la arista cerrada) y clasificación con la frontera aprendida.
  const c = centralidades15(esCierre);
  return PARADEROS_15.map((p, i) => {
    const z = 0.20 * c.cbNorm[i] + 0.60 * p.afluencia - 0.50;
    return {
      ...p,
      cb_norm: c.cbNorm[i],
      cc: c.cc[i],
      deg: c.cd[i],
      y_hat: z >= 0 ? 1 : 0
    };
  });
}

function actualizarResumenSidebar15() {
  const paraderos = obtenerCentralidades15Actuales();
  const totalRefuerzos = paraderos.filter(p => p.y_hat === 1).length;
  const maxNode = paraderos.reduce((best, cur) => (cur.cb_norm > best.cb_norm ? cur : best), paraderos[0]);

  const kpiRef = document.getElementById("kpi-total-reinforcements");
  const kpiMax = document.getElementById("kpi-max-betweenness");
  const kpiWait = document.getElementById("kpi-avg-wait");

  if (kpiRef) kpiRef.textContent = `${totalRefuerzos} / 15`;
  if (kpiMax && maxNode) kpiMax.textContent = `${maxNode.codigo} (${maxNode.cb_norm.toFixed(3)})`;
  if (kpiWait && appState.simulacionActual) {
    kpiWait.textContent = `${appState.simulacionActual.tiempo_espera_promedio_dinamico.toFixed(1)} min`;
  }
}

function renderizarCapaVial15() {
  if (!appState.leafletMap || !appState.markersGroup) return;

  appState.mapPolylines.forEach(p => appState.leafletMap.removeLayer(p));
  appState.markersGroup.clearLayers();
  appState.mapPolylines = [];
  appState.mapMarkers = [];

  const paraderosConMetricas = obtenerCentralidades15Actuales();
  const esCierre = appState.cierreGranVia;

  // 1. Enlaces viales con borde oscuro de contraste sobre OSM y Satélite
  ARISTAS_15_BASE.forEach(([u, v]) => {
    const p1 = PARADEROS_15[u];
    const p2 = PARADEROS_15[v];
    const esTramoCierre = u === ARISTA_CIERRE_GRAN_VIA[0] && v === ARISTA_CIERRE_GRAN_VIA[1];

    if (esTramoCierre && esCierre) {
      const casing = L.polyline([[p1.lat, p1.lon], [p2.lat, p2.lon]], {
        color: THEME.canvas,
        weight: 6.5,
        opacity: 0.75
      }).addTo(appState.leafletMap);
      appState.mapPolylines.push(casing);

      const poly = L.polyline([[p1.lat, p1.lon], [p2.lat, p2.lon]], {
        color: THEME.terracottaHi,
        weight: 4,
        dashArray: "8, 8",
        opacity: 0.98
      }).addTo(appState.leafletMap);
      poly.bindTooltip("Cierre por obras: Portoazul ↔ UniNorte P4", {
        sticky: true,
        className: "custom-leaflet-tooltip"
      });
      appState.mapPolylines.push(poly);

      const midLat = (p1.lat + p2.lat) / 2;
      const midLon = (p1.lon + p2.lon) / 2;
      const closureIcon = L.divIcon({
        className: "",
        html: `<div class="gran-via-closure-badge" aria-label="Cierre Gran Vía">✕</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
      const closureMarker = L.marker([midLat, midLon], { icon: closureIcon, interactive: true }).addTo(appState.leafletMap);
      closureMarker.bindTooltip("Tramo cerrado: Obras La Gran Vía (P04 ↔ P07)", {
        direction: "top",
        offset: [0, -10],
        className: "custom-leaflet-tooltip"
      });
      appState.mapPolylines.push(closureMarker);
    } else {
      const esDesvioActivo = esCierre && (
        (u === 3 && v === 4) || (u === 4 && v === 6) || (u === 1 && v === 2) || (u === 2 && v === 5)
      );

      const casing = L.polyline([[p1.lat, p1.lon], [p2.lat, p2.lon]], {
        color: THEME.canvas,
        weight: esDesvioActivo ? 6 : 4.5,
        opacity: 0.65
      }).addTo(appState.leafletMap);
      appState.mapPolylines.push(casing);

      const poly = L.polyline([[p1.lat, p1.lon], [p2.lat, p2.lon]], {
        color: esDesvioActivo ? THEME.brass : THEME.petrol,
        weight: esDesvioActivo ? 3.5 : 2.8,
        opacity: 0.95
      }).addTo(appState.leafletMap);
      appState.mapPolylines.push(poly);
    }
  });

  // 2. Marcadores limpios y compactos (L.circleMarker) sin solapamiento en zoom 14
  paraderosConMetricas.forEach((p, idx) => {
    const esCritico = p.y_hat === 1;
    const esSeleccionado = appState.activeStopIndex === idx;

    const marker = L.circleMarker([p.lat, p.lon], {
      radius: esSeleccionado ? 11.5 : (esCritico ? 8.5 : 7),
      fillColor: esCritico ? THEME.terracotta : THEME.petrol,
      color: esSeleccionado ? THEME.brassHi : THEME.ivory,
      weight: esSeleccionado ? 3.5 : (esCritico ? 2.5 : 2),
      opacity: 1,
      fillOpacity: 0.96,
      className: esCritico ? "marker-circle-reinforcement" : "marker-circle-normal"
    }).addTo(appState.markersGroup);

    const tooltipHtml = `
      <div class="map-tooltip-content">
        <div class="map-tooltip-header">
          <span class="map-tooltip-code">${p.codigo}</span>
          <span class="stop-pill ${esCritico ? "red" : "blue"}">${esCritico ? "REFUERZO (y=1)" : "NORMAL (y=0)"}</span>
        </div>
        <div class="map-tooltip-name">${p.nombre}</div>
        <div class="map-tooltip-metrics">
          <span>Demanda (x₂): <strong>${p.afluencia.toFixed(2)}</strong></span>
          <span>Interm. (x₁): <strong>${p.cb_norm.toFixed(3)}</strong></span>
        </div>
      </div>
    `;
    marker.bindTooltip(tooltipHtml, {
      direction: "top",
      offset: [0, -10],
      opacity: 1,
      className: "custom-leaflet-tooltip"
    });

    const popupHtml = `
      <div class="popup-dark-box">
        <div class="popup-dark-title">${p.codigo} · ${p.nombre}</div>
        <div class="popup-dark-desc">${p.desc}</div>
        <div class="popup-dark-grid">
          <div class="popup-stat-cell"><span class="popup-stat-label">Grado deg(v)</span><strong class="popup-stat-val">${p.deg}</strong></div>
          <div class="popup-stat-cell"><span class="popup-stat-label">Cercanía C<sub>C</sub></span><strong class="popup-stat-val">${p.cc.toFixed(3)}</strong></div>
          <div class="popup-stat-cell"><span class="popup-stat-label">Intermed. C<sub>B</sub>'</span><strong class="popup-stat-val">${p.cb_norm.toFixed(3)}</strong></div>
          <div class="popup-stat-cell"><span class="popup-stat-label">Demanda x₂</span><strong class="popup-stat-val">${p.afluencia.toFixed(2)}</strong></div>
        </div>
        <div class="stop-pill ${esCritico ? "red" : "blue"}" style="text-align: center; display: block; margin-top: 8px;">
          ${esCritico ? "DESPACHO REFUERZO PRIORITARIO (y = 1)" : "OPERACIÓN NORMAL ESTÁNDAR (y = 0)"}
        </div>
      </div>
    `;
    marker.bindPopup(popupHtml);

    marker.on("mouseover", function () {
      if (marker.isPopupOpen()) return;
      this.bringToFront();
      if (appState.activeStopIndex !== idx) {
        this.setStyle({
          radius: esCritico ? 11 : 9,
          weight: 3,
          fillOpacity: 1
        });
      }
    });

    marker.on("mouseout", function () {
      if (appState.activeStopIndex !== idx) {
        this.setStyle({
          radius: esCritico ? 8.5 : 7,
          weight: esCritico ? 2.5 : 2,
          color: THEME.ivory,
          fillOpacity: 0.96
        });
      }
    });

    marker.on("tooltipopen", () => {
      if (marker.isPopupOpen()) marker.closeTooltip();
    });

    marker.on("click", () => seleccionarParadero(idx));

    appState.mapMarkers.push(marker);
  });

  actualizarResumenSidebar15();
}

function renderizarTarjetas15(filtroTexto = "") {
  const container = document.getElementById("stops-cards-list");
  if (!container) return;

  container.innerHTML = "";
  const paraderosConMetricas = obtenerCentralidades15Actuales();
  let visibles = 0;

  paraderosConMetricas.forEach((p, idx) => {
    if (filtroTexto) {
      const match = (p.codigo + " " + p.nombre + " " + p.desc).toLowerCase().includes(filtroTexto.trim().toLowerCase());
      if (!match) return;
    }

    visibles++;
    const esCritico = p.y_hat === 1;
    const card = document.createElement("div");
    card.className = `stop-card-dark ${appState.activeStopIndex === idx ? "active" : ""}`;
    card.id = `stop-card-${idx}`;
    card.tabIndex = 0;
    card.setAttribute("role", "button");

    const demPct = Math.round(p.afluencia * 100);
    const cbPct = Math.min(100, Math.round((p.cb_norm / 0.60) * 100));

    card.innerHTML = `
      <div class="stop-card-header">
        <span class="stop-code">${p.codigo}</span>
        <span class="stop-pill ${esCritico ? "red" : "blue"}">
          ${esCritico ? "REFUERZO (y=1)" : "NORMAL (y=0)"}
        </span>
      </div>
      <div class="stop-name-text">${p.nombre}</div>
      <div class="stop-desc-text">${p.desc}</div>
      <div class="stop-metrics-bars">
        <div class="stop-progress-group">
          <span class="progress-label">Demanda (x₂)</span>
          <div class="progress-track">
            <div class="progress-fill ${esCritico ? "red" : "blue"}" style="width: ${demPct}%;"></div>
          </div>
          <span class="progress-val">${p.afluencia.toFixed(2)}</span>
        </div>
        <div class="stop-progress-group">
          <span class="progress-label">Interm. (x₁)</span>
          <div class="progress-track">
            <div class="progress-fill ${esCritico ? "red" : "blue"}" style="width: ${cbPct}%;"></div>
          </div>
          <span class="progress-val">${p.cb_norm.toFixed(3)}</span>
        </div>
      </div>
    `;

    card.addEventListener("click", () => seleccionarParadero(idx));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        seleccionarParadero(idx);
      }
    });

    container.appendChild(card);
  });

  if (visibles === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "box-dark-academic";
    emptyMsg.textContent = "Ningún paradero coincide con la búsqueda. Pulsa «Todas» para restablecer los 15 nodos.";
    container.appendChild(emptyMsg);
  }
}

function actualizarPanelEvaluacionNodal(idx) {
  const paraderos = obtenerCentralidades15Actuales();
  const p = paraderos[idx];
  if (!p) return;

  // Regla canónica de clasificación del corredor (idéntica a /api/recalculate y marcadores del mapa)
  const w1 = 0.20;
  const w2 = 0.60;
  const b = -0.50;
  const x1 = p.cb_norm;
  const x2 = p.afluencia;
  const z = w1 * x1 + w2 * x2 + b;
  const esRefuerzo = p.y_hat === 1;

  const fFormula = document.getElementById("float-eval-formula");
  const fDetail = document.getElementById("float-eval-detail");

  if (fFormula) {
    fFormula.innerHTML = `z = (${w1.toFixed(2)})·(${x1.toFixed(3)}) + (${w2.toFixed(2)})·(${x2.toFixed(2)}) + (${b.toFixed(2)}) = <strong>${z.toFixed(3)}</strong>`;
  }
  if (fDetail) {
    const badgeColor = esRefuerzo ? THEME.terracottaHi : THEME.petrolHi;
    fDetail.innerHTML = `Nodo <strong>${p.codigo} (${p.nombre})</strong> ⟹ ${z.toFixed(3)} ≥ 0 ? <span style="color: ${badgeColor}; font-weight:700;">${esRefuerzo ? "SÍ (y = 1 ⟹ REFUERZO)" : "NO (y = 0 ⟹ ESTÁNDAR)"}</span>`;
  }
}

function seleccionarParadero(idx) {
  appState.activeStopIndex = idx;
  const paraderos = obtenerCentralidades15Actuales();
  const p = paraderos[idx];
  if (!p) return;

  document.querySelectorAll(".stop-card-dark").forEach(c => c.classList.remove("active"));
  const card = document.getElementById(`stop-card-${idx}`);
  if (card) {
    card.classList.add("active");
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  aplicarEstilosMarcadores();
  if (appState.mapMarkers[idx] && appState.mapMarkers[idx].bringToFront) {
    appState.mapMarkers[idx].bringToFront();
  }

  if (appState.leafletMap && appState.mapMarkers[idx]) {
    appState.leafletMap.flyTo([p.lat, p.lon], 16, { duration: 0.75 });
    appState.mapMarkers[idx].openPopup();
  }

  actualizarPanelEvaluacionNodal(idx);
}

// ============================================================================
// 6. VISTA 2: CASO DE PRUEBA 6 NODOS (SVG SERIGRÁFICO + MEDALLONES)
// ============================================================================

function initSvgGraph6() {
  const svg = document.getElementById("svg-graph-6");
  if (!svg) return;

  svg.innerHTML = "";

  // 1. Aristas con etiquetas de peso d=1
  ARISTAS_6.forEach(([u, v]) => {
    const p1 = PARADEROS_6[u];
    const p2 = PARADEROS_6[v];

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", p1.x);
    line.setAttribute("y1", p1.y_pos);
    line.setAttribute("x2", p2.x);
    line.setAttribute("y2", p2.y_pos);
    line.setAttribute("class", "edge-line-dark");
    line.setAttribute("id", `edge-6-${Math.min(u, v)}-${Math.max(u, v)}`);
    svg.appendChild(line);

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y_pos + p2.y_pos) / 2;

    const gW = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const rW = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rW.setAttribute("x", midX - 13);
    rW.setAttribute("y", midY - 9);
    rW.setAttribute("width", "26");
    rW.setAttribute("height", "18");
    rW.setAttribute("rx", "3");
    rW.setAttribute("class", "edge-weight-rect-dark");

    const tW = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tW.setAttribute("x", midX);
    tW.setAttribute("y", midY);
    tW.setAttribute("class", "edge-weight-text-dark");
    tW.textContent = "d=1";

    gW.appendChild(rW);
    gW.appendChild(tW);
    svg.appendChild(gW);
  });

  // 2. Nodos con pastillas informativas sin solapamiento
  PARADEROS_6.forEach((p, idx) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("id", `node-group-6-${idx}`);
    g.style.cursor = "pointer";

    const esCritico = p.y === 1;

    if (esCritico) {
      const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      pulse.setAttribute("cx", p.x);
      pulse.setAttribute("cy", p.y_pos);
      pulse.setAttribute("r", "25");
      pulse.setAttribute("class", "pulse-wave-svg");
      g.appendChild(pulse);
    }

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", p.x);
    circle.setAttribute("cy", p.y_pos);
    circle.setAttribute("r", "25");
    circle.setAttribute("fill", esCritico ? THEME.terracotta : THEME.petrol);
    circle.setAttribute("stroke", THEME.ivory);
    circle.setAttribute("stroke-width", "2.5");
    circle.setAttribute("id", `node-circle-6-${idx}`);
    g.appendChild(circle);

    const textCenter = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textCenter.setAttribute("x", p.x);
    textCenter.setAttribute("y", p.y_pos);
    textCenter.setAttribute("class", "node-center-text-dark");
    textCenter.textContent = p.codigo;
    g.appendChild(textCenter);

    const pillX = p.x - 68;
    let pillY = p.y_pos + 35;
    if (idx === 1 || idx === 3 || idx === 4) pillY = p.y_pos - 71;

    const gPill = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const rPill = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rPill.setAttribute("x", pillX);
    rPill.setAttribute("y", pillY);
    rPill.setAttribute("width", "136");
    rPill.setAttribute("height", "36");
    rPill.setAttribute("rx", "5");
    rPill.setAttribute("class", `node-pill-rect-dark ${esCritico ? "red" : ""}`);
    gPill.appendChild(rPill);

    const tTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tTitle.setAttribute("x", pillX + 68);
    tTitle.setAttribute("y", pillY + 14);
    tTitle.setAttribute("class", "node-text-title-dark");
    tTitle.textContent = `${p.codigo} · ${p.nombre.split("/")[0].trim()}`;
    gPill.appendChild(tTitle);

    const tSub = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tSub.setAttribute("x", pillX + 68);
    tSub.setAttribute("y", pillY + 28);
    tSub.setAttribute("class", "node-text-sub-dark");
    tSub.setAttribute("id", `node-subtext-6-${idx}`);
    tSub.innerHTML = `C<tspan dy="2.5" font-size="7.5">B</tspan><tspan dy="-2.5">' = ${CENTRALIDADES_6_TEORICAS[idx].cb_norm_dec} ${esCritico ? "(y=1)" : ""}</tspan>`;
    gPill.appendChild(tSub);

    g.appendChild(gPill);
    g.addEventListener("click", () => activarBfsDesdeNodo(idx));
    svg.appendChild(g);
  });
}

function calcularBfsCapas(origenIdx) {
  const A = [
    [0, 1, 1, 0, 0, 0],
    [1, 0, 0, 1, 0, 0],
    [1, 0, 0, 1, 0, 0],
    [0, 1, 1, 0, 1, 0],
    [0, 0, 0, 1, 0, 1],
    [0, 0, 0, 0, 1, 0]
  ];

  const dist = new Array(6).fill(Infinity);
  const layer = new Array(6).fill(-1);
  dist[origenIdx] = 0;
  layer[origenIdx] = 0;

  const queue = [origenIdx];
  while (queue.length > 0) {
    const u = queue.shift();
    for (let v = 0; v < 6; v++) {
      if (A[u][v] === 1 && dist[v] === Infinity) {
        dist[v] = dist[u] + 1;
        layer[v] = layer[u] + 1;
        queue.push(v);
      }
    }
  }

  return { dist, layer };
}

function activarBfsDesdeNodo(origenIdx) {
  appState.selectedBfsOrigin = origenIdx;
  const pOrigen = PARADEROS_6[origenIdx];
  const { dist, layer } = calcularBfsCapas(origenIdx);

  const coloresCapa = {
    0: THEME.brass,      // Capa 0: Raíz
    1: THEME.sage,       // Capa 1: 1 salto
    2: THEME.petrol,     // Capa 2: 2 saltos
    3: THEME.terracotta, // Capa 3: 3 saltos
    4: "#7A6B5C"         // Capa 4: 4 saltos
  };

  const coloresTextoCapa = {
    0: THEME.brassHi,
    1: THEME.sageHi,
    2: THEME.petrolHi,
    3: THEME.terracottaHi,
    4: THEME.inkSecondary
  };

  PARADEROS_6.forEach((p, idx) => {
    const circle = document.getElementById(`node-circle-6-${idx}`);
    const subText = document.getElementById(`node-subtext-6-${idx}`);
    const cLayer = layer[idx];
    const fillCol = coloresCapa[cLayer] || THEME.petrol;
    const labelCol = coloresTextoCapa[cLayer] || THEME.ivory;

    if (circle) {
      circle.setAttribute("fill", fillCol);
      circle.setAttribute("stroke", idx === origenIdx ? THEME.ivory : THEME.inkSecondary);
      circle.setAttribute("stroke-width", idx === origenIdx ? "4" : "2.5");
    }

    if (subText) {
      if (idx === origenIdx) {
        subText.textContent = "Capa 0 (Raíz BFS)";
        subText.style.fill = THEME.brassHi;
      } else {
        subText.textContent = `d=${dist[idx]} (Capa ${cLayer})`;
        subText.style.fill = labelCol;
      }
    }
  });

  document.querySelectorAll("#bfs-quick-nodes .node-chip-plaque").forEach((b, i) => {
    b.classList.toggle("active", i === origenIdx);
  });

  document.querySelectorAll("#tbody-freeman-6 tr").forEach(r => r.classList.remove("active-row"));
  const row = document.getElementById(`row-freeman-${origenIdx}`);
  if (row) row.classList.add("active-row");

  const banner = document.getElementById("bfs-status-banner");
  const sumD = dist.reduce((acc, d) => acc + d, 0);
  const ccVal = (5 / sumD).toFixed(3);

  if (banner) {
    banner.innerHTML = `
      <strong style="color: ${THEME.brassHi};">BFS desde ${pOrigen.codigo} (${pOrigen.nombre}):</strong>
      <span style="color:${THEME.brassHi}; font-weight:700;">C0: ${pOrigen.codigo}</span> ·
      <span style="color:${THEME.sageHi}; font-weight:700;">C1 (d=1)</span> ·
      <span style="color:${THEME.petrolHi}; font-weight:700;">C2 (d=2)</span> ·
      <span style="color:${THEME.terracottaHi}; font-weight:700;">C3 (d=3)</span> &nbsp;⟹&nbsp;
      <strong>∑ d = ${sumD}</strong> ⟹ <strong>C<sub>C</sub>(${pOrigen.codigo}) = 5/${sumD} ≈ ${ccVal}</strong>
    `;
  }
}

function resetearBfsVista() {
  appState.selectedBfsOrigin = null;

  PARADEROS_6.forEach((p, idx) => {
    const circle = document.getElementById(`node-circle-6-${idx}`);
    const subText = document.getElementById(`node-subtext-6-${idx}`);
    const esCritico = p.y === 1;

    if (circle) {
      circle.setAttribute("fill", esCritico ? THEME.terracotta : THEME.petrol);
      circle.setAttribute("stroke", THEME.ivory);
      circle.setAttribute("stroke-width", "2.5");
    }

    if (subText) {
      subText.innerHTML = `C<tspan dy="2.5" font-size="7.5">B</tspan><tspan dy="-2.5">' = ${CENTRALIDADES_6_TEORICAS[idx].cb_norm_dec} ${esCritico ? "(y=1)" : ""}</tspan>`;
      subText.style.fill = "";
    }
  });

  document.querySelectorAll("#tbody-freeman-6 tr").forEach(r => r.classList.remove("active-row"));
  document.querySelectorAll("#bfs-quick-nodes .node-chip-plaque").forEach(b => b.classList.remove("active"));

  const banner = document.getElementById("bfs-status-banner");
  if (banner) {
    banner.innerHTML = `
      <strong style="color: ${THEME.brassHi};">Demostración de Caminos Empatados (σ<sub>st</sub> = 2):</strong>
      Entre v1 y v4 existen 2 caminos mínimos de longitud 2: <em>v1–v2–v4</em> y <em>v1–v3–v4</em>. Cada nodo intermediario recibe un aporte fraccionario de 1/2 = 0.50.
    `;
  }
}

function renderMasterFreemanTable() {
  const tbody = document.getElementById("tbody-freeman-6");
  if (!tbody) return;

  tbody.innerHTML = "";
  CENTRALIDADES_6_TEORICAS.forEach((item, idx) => {
    const tr = document.createElement("tr");
    tr.id = `row-freeman-${idx}`;
    tr.style.cursor = "pointer";

    tr.innerHTML = `
      <td><strong>${item.cod}</strong></td>
      <td>${item.nom}</td>
      <td>${item.deg}</td>
      <td>
        <div class="val-pill-cell">
          <span class="val-dec">${item.cd_dec}</span>
          <span class="frac-pill-dark">${item.cd_frac}</span>
        </div>
      </td>
      <td>${item.sum_d}</td>
      <td>
        <div class="val-pill-cell">
          <span class="val-dec">${item.cc_dec}</span>
          <span class="frac-pill-dark">${item.cc_frac}</span>
        </div>
      </td>
      <td>
        <div class="val-pill-cell">
          <span class="val-dec">${item.cb_dec}</span>
          <span class="frac-pill-dark">${item.cb_frac}</span>
        </div>
      </td>
      <td>
        <div class="val-pill-cell">
          <span class="val-dec" style="color: ${item.y === 1 ? THEME.terracottaHi : THEME.petrolHi};">${item.cb_norm_dec}</span>
          <span class="frac-pill-dark bold">${item.cb_norm_frac}</span>
        </div>
      </td>
      <td>
        <span class="stop-pill ${item.y === 1 ? "red" : "blue"}">
          ${item.y === 1 ? "Refuerzo (y=1)" : "Normal (y=0)"}
        </span>
      </td>
    `;

    tr.addEventListener("click", () => activarBfsDesdeNodo(idx));
    tbody.appendChild(tr);
  });
}

function renderTieBreakdownTable() {
  const tbody = document.getElementById("tbody-ties-6");
  if (!tbody) return;

  tbody.innerHTML = "";
  CAMINOS_EMPATADOS_6.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.par}</strong></td>
      <td>${item.ext}</td>
      <td>${item.sigma}</td>
      <td><strong style="color: ${THEME.brassHi};">${item.nodo}</strong></td>
      <td>${item.con_v}</td>
      <td><span class="frac-pill-dark bold">${item.aporte}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function cambiarMatrizVista(tipo) {
  appState.currentMatrixView = tipo;
  const btnAdj = document.getElementById("btn-matrix-adj");
  const btnDist = document.getElementById("btn-matrix-dist");
  const footEl = document.getElementById("matrix-footnote");

  if (btnAdj) btnAdj.classList.toggle("active", tipo === "adj");
  if (btnDist) btnDist.classList.toggle("active", tipo === "dist");

  if (footEl) {
    footEl.innerHTML = tipo === "adj"
      ? "Matriz simétrica binaria en {0, 1}<sup>6×6</sup>: 6 aristas no dirigidas (12 entradas unitarias)."
      : "Matriz simétrica de distancias geodésicas mínimas D(G) mediante BFS por capas: diámetro δ(G) = 4.";
  }

  renderMatrixView();
}

function renderMatrixView() {
  const container = document.getElementById("matrix-display-container");
  if (!container) return;

  const esAdj = appState.currentMatrixView === "adj";

  const latexAdj = `A(G) = \\begin{pmatrix}
0 & 1 & 1 & 0 & 0 & 0 \\\\
1 & 0 & 0 & 1 & 0 & 0 \\\\
1 & 0 & 0 & 1 & 0 & 0 \\\\
0 & 1 & 1 & 0 & 1 & 0 \\\\
0 & 0 & 0 & 1 & 0 & 1 \\\\
0 & 0 & 0 & 0 & 1 & 0
\\end{pmatrix}`;

  const latexDist = `D(G) = \\begin{pmatrix}
0 & 1 & 1 & 2 & 3 & 4 \\\\
1 & 0 & 2 & 1 & 2 & 3 \\\\
1 & 2 & 0 & 1 & 2 & 3 \\\\
2 & 1 & 1 & 0 & 1 & 2 \\\\
3 & 2 & 2 & 1 & 0 & 1 \\\\
4 & 3 & 3 & 2 & 1 & 0
\\end{pmatrix}`;

  container.innerHTML = `<span class="katex-eq" data-formula="${esAdj ? latexAdj : latexDist}"></span>`;
  renderAllKaTeX();
}

// ============================================================================
// 7. VISTA 3: PERCEPTRÓN DE ROSENBLATT (SLIDERS, FRONTERA, TRAZA)
// ============================================================================

async function ejecutarEntrenamientoPerceptron() {
  const reqId = (appState.perceptronReqSeq = (appState.perceptronReqSeq || 0) + 1);
  const eta = appState.eta;
  const b_init = appState.b0;
  const w1_init = appState.w1;
  const w2_init = appState.w2;

  try {
    const res = await apiFetch("/api/train-perceptron", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eta: eta,
        b_init: b_init,
        w_init: [w1_init, w2_init],
        max_epochs: 20
      })
    });
    if (reqId !== appState.perceptronReqSeq) return;
    if (res.ok) {
      const data = await res.json();
      if (reqId !== appState.perceptronReqSeq) return;
      appState.perceptronHistory = data.history;
      appState.perceptronWeights = data.w;
      appState.perceptronBias = data.b;
      appState.perceptronConverged = data.convergencia;
      appState.perceptronEpochs = data.epocas;
      actualizarUiPerceptron();
      actualizarGraficaFrontera();
      renderizarBotonesEpoca();
      renderizarTrazaPerceptron();
      actualizarTelemetriaMenu();
      return;
    }
  } catch (err) {
    // Fallback determinista en cliente
  }

  const max_epochs = 20;
  const X = CENTRALIDADES_6_TEORICAS.map((c, i) => [parseFloat(c.cb_norm_dec), PARADEROS_6[i].afluencia]);
  const y = CENTRALIDADES_6_TEORICAS.map(c => c.y);

  let w = [w1_init, w2_init];
  let b = b_init;
  const history = [];
  let converged = false;

  for (let epoch = 1; epoch <= max_epochs; epoch++) {
    let totalError = 0;
    const logs = [];

    for (let i = 0; i < X.length; i++) {
      const xi = X[i];
      const yi = y[i];
      const z = w[0] * xi[0] + w[1] * xi[1] + b;
      const y_hat = z >= 0.0 ? 1 : 0;
      const error = yi - y_hat;

      const delta_w = [eta * error * xi[0], eta * error * xi[1]];
      const delta_b = eta * error;

      w[0] += delta_w[0];
      w[1] += delta_w[1];
      b += delta_b;

      totalError += Math.abs(error);

      logs.push({
        sample_idx: i,
        x: [...xi],
        y_true: yi,
        z: z,
        y_hat: y_hat,
        error: error,
        delta_w: [...delta_w],
        delta_b: delta_b,
        w: [...w],
        b: b
      });
    }

    history.push({
      epoch: epoch,
      total_error: totalError,
      logs: logs,
      final_w: [...w],
      final_b: b
    });

    if (totalError === 0) {
      converged = true;
      break;
    }
  }

  appState.perceptronHistory = history;
  appState.perceptronWeights = [...w];
  appState.perceptronBias = b;
  appState.perceptronConverged = converged;
  appState.perceptronEpochs = history.length;

  actualizarUiPerceptron();
  actualizarGraficaFrontera();
  renderizarBotonesEpoca();
  renderizarTrazaPerceptron();
  actualizarTelemetriaMenu();
}

function actualizarUiPerceptron() {
  const w1 = appState.perceptronWeights[0];
  const w2 = appState.perceptronWeights[1];
  const b = appState.perceptronBias;

  const statW1 = document.getElementById("stat-w1");
  const statW2 = document.getElementById("stat-w2");
  const statB = document.getElementById("stat-b");

  if (statW1) statW1.textContent = w1.toFixed(3);
  if (statW2) statW2.textContent = w2.toFixed(3);
  if (statB) statB.textContent = b.toFixed(3);

  const eqEl = document.getElementById("equation-hyperplane");
  const slopeEl = document.getElementById("equation-slope-intercept");

  const signB = b >= 0 ? `+ ${b.toFixed(3)}` : `- ${Math.abs(b).toFixed(3)}`;
  const signW2 = w2 >= 0 ? `+ ${w2.toFixed(3)}` : `- ${Math.abs(w2).toFixed(3)}`;

  if (eqEl) {
    eqEl.textContent = `${w1.toFixed(3)} · x₁ ${signW2} · x₂ ${signB} = 0`;
  }

  if (slopeEl) {
    if (Math.abs(w2) > 1e-6) {
      const m = -w1 / w2;
      const k = -b / w2;
      const signK = k >= 0 ? `+ ${k.toFixed(3)}` : `- ${Math.abs(k).toFixed(3)}`;
      slopeEl.textContent = `x₂ = ${m.toFixed(3)} · x₁ ${signK}`;
    } else if (Math.abs(w1) > 1e-6) {
      slopeEl.textContent = `Recta vertical x₁ = ${(-b / w1).toFixed(3)}`;
    } else {
      slopeEl.textContent = "Sin recta definida (w = [0, 0])";
    }
  }

  const badge = document.getElementById("convergence-badge");
  const topbarBadge = document.getElementById("topbar-status-badge");

  if (badge) {
    if (appState.perceptronConverged) {
      badge.innerHTML = `<span class="live-dot"></span><span>Convergencia en Época ${appState.perceptronEpochs} (Error = 0)</span>`;
      badge.className = "status-badge-convergencia centered";
    } else {
      badge.innerHTML = `<span class="live-dot"></span><span>Límite de épocas (${appState.perceptronEpochs})</span>`;
      badge.className = "status-badge-convergencia centered warn";
    }
  }

  if (topbarBadge) {
    if (appState.perceptronConverged) {
      topbarBadge.innerHTML = `<span class="live-dot"></span><span>Convergencia · Época ${appState.perceptronEpochs}</span>`;
      topbarBadge.className = "status-badge-convergencia";
    } else {
      topbarBadge.innerHTML = `<span class="live-dot"></span><span>Sin converger (${appState.perceptronEpochs} ép.)</span>`;
      topbarBadge.className = "status-badge-convergencia warn";
    }
  }
}

// Plugin Chart.js armonizado con paleta serigráfica (Terracota vs Petróleo)
const perceptronVisualSilkscreenPlugin = {
  id: "perceptronVisualSilkscreen",
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!scales.x || !scales.y) return;

    const w1 = appState.perceptronWeights[0];
    const w2 = appState.perceptronWeights[1];
    const b = appState.perceptronBias;

    ctx.save();
    ctx.beginPath();
    ctx.rect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
    ctx.clip();

    // Fondo base petróleo suave (y = 0)
    ctx.fillStyle = "rgba(33, 85, 106, 0.16)";
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);

    // Región de refuerzo (z >= 0): terracota suave
    if (Math.abs(w2) > 1e-5) {
      const xMin = scales.x.min;
      const xMax = scales.x.max;

      const yAtXMin = (-w1 * xMin - b) / w2;
      const yAtXMax = (-w1 * xMax - b) / w2;

      const px1 = scales.x.getPixelForValue(xMin);
      const py1 = scales.y.getPixelForValue(yAtXMin);
      const px2 = scales.x.getPixelForValue(xMax);
      const py2 = scales.y.getPixelForValue(yAtXMax);

      ctx.beginPath();
      ctx.moveTo(px1, py1);
      ctx.lineTo(px2, py2);

      if (w2 > 0) {
        ctx.lineTo(chartArea.right, chartArea.top);
        ctx.lineTo(chartArea.left, chartArea.top);
      } else {
        ctx.lineTo(chartArea.right, chartArea.bottom);
        ctx.lineTo(chartArea.left, chartArea.bottom);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(194, 86, 50, 0.19)";
      ctx.fill();
    } else if (Math.abs(w1) > 1e-5) {
      // Frontera vertical x1 = -b / w1
      const xVert = -b / w1;
      const pxVert = Math.max(chartArea.left, Math.min(chartArea.right, scales.x.getPixelForValue(xVert)));
      ctx.fillStyle = "rgba(194, 86, 50, 0.19)";
      if (w1 > 0) {
        if (pxVert < chartArea.right) {
          ctx.fillRect(pxVert, chartArea.top, chartArea.right - pxVert, chartArea.height);
        }
      } else {
        if (pxVert > chartArea.left) {
          ctx.fillRect(chartArea.left, chartArea.top, pxVert - chartArea.left, chartArea.height);
        }
      }
    } else if (b >= 0) {
      // Pesos nulos con sesgo no negativo: todo el plano z >= 0
      ctx.fillStyle = "rgba(194, 86, 50, 0.19)";
      ctx.fillRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
    }

    ctx.restore();
  },
  afterDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!scales.x || !scales.y) return;

    ctx.save();
    ctx.font = "700 11px 'JetBrains Mono', monospace";

    // Posicionamiento táctico sin colisiones (evita solapamiento v1/v6 y recorte derecho en v4)
    const offsetsByCode = {
      v1: { dx: 12, dy: -26, align: "right" },
      v2: { dx: 12, dy: -10, align: "right" },
      v3: { dx: 14, dy: -10, align: "right" },
      v4: { dx: -14, dy: -10, align: "left" },
      v5: { dx: 12, dy: -10, align: "right" },
      v6: { dx: 12, dy: 7, align: "right" }
    };

    CENTRALIDADES_6_TEORICAS.forEach((c, i) => {
      const xVal = parseFloat(c.cb_norm_dec);
      const yVal = PARADEROS_6[i].afluencia;

      const px = scales.x.getPixelForValue(xVal);
      const py = scales.y.getPixelForValue(yVal);

      const label = `${c.cod} (${c.nom})`;
      const textWidth = ctx.measureText(label).width;
      const boxW = textWidth + 10;
      const boxH = 19;
      const cfg = offsetsByCode[c.cod] || { dx: 12, dy: -10, align: "right" };

      let boxX = cfg.align === "left" ? (px + cfg.dx - boxW) : (px + cfg.dx);
      let boxY = py + cfg.dy;

      // Sujeción segura dentro del área del gráfico
      boxX = Math.max(chartArea.left + 4, Math.min(chartArea.right - boxW - 4, boxX));
      boxY = Math.max(chartArea.top + 4, Math.min(chartArea.bottom - boxH - 4, boxY));

      ctx.fillStyle = "rgba(24, 26, 31, 0.94)";
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeStyle = c.y === 1 ? THEME.terracottaHi : THEME.petrolHi;
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      ctx.fillStyle = c.y === 1 ? THEME.ivory : THEME.inkSecondary;
      ctx.fillText(label, boxX + 5, boxY + 13);
    });

    ctx.restore();
  }
};

function initDecisionBoundaryChart() {
  const canvas = document.getElementById("chart-decision-boundary");
  if (!canvas || typeof Chart === "undefined") return;

  const ctx = canvas.getContext("2d");

  const dataNormal = CENTRALIDADES_6_TEORICAS.filter(c => c.y === 0).map(c => {
    const idx = PARADEROS_6.findIndex(p => p.codigo === c.cod);
    return { x: parseFloat(c.cb_norm_dec), y: PARADEROS_6[idx].afluencia };
  });

  const dataCritico = CENTRALIDADES_6_TEORICAS.filter(c => c.y === 1).map(c => {
    const idx = PARADEROS_6.findIndex(p => p.codigo === c.cod);
    return { x: parseFloat(c.cb_norm_dec), y: PARADEROS_6[idx].afluencia };
  });

  appState.chartDecision = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Normal (y = 0)",
          data: dataNormal,
          backgroundColor: THEME.petrol,
          borderColor: THEME.ivory,
          borderWidth: 2,
          pointRadius: 8
        },
        {
          label: "Refuerzo prioritario (y = 1)",
          data: dataCritico,
          backgroundColor: THEME.terracotta,
          borderColor: THEME.ivory,
          borderWidth: 2,
          pointStyle: "rectRot",
          pointRadius: 10
        },
        {
          label: "Frontera lineal w₁x₁ + w₂x₂ + b = 0",
          type: "line",
          data: [],
          borderColor: THEME.brassHi,
          borderWidth: 2.8,
          borderDash: [7, 4],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    plugins: [perceptronVisualSilkscreenPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          min: -0.05,
          max: 0.85,
          title: {
            display: true,
            text: "Intermediación normalizada de Freeman (x₁)",
            font: { family: "'Plus Jakarta Sans', sans-serif", weight: "600", size: 12 },
            color: THEME.inkSecondary
          },
          grid: { color: "rgba(239, 236, 225, 0.08)" },
          ticks: { color: THEME.inkSecondary, font: { family: "'JetBrains Mono', monospace", size: 11 } }
        },
        y: {
          min: 0.0,
          max: 1.1,
          title: {
            display: true,
            text: "Demanda / Afluencia normalizada (x₂)",
            font: { family: "'Plus Jakarta Sans', sans-serif", weight: "600", size: 12 },
            color: THEME.inkSecondary
          },
          grid: { color: "rgba(239, 236, 225, 0.08)" },
          ticks: { color: THEME.inkSecondary, font: { family: "'JetBrains Mono', monospace", size: 11 } }
        }
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: "600" },
            color: THEME.ivory,
            boxWidth: 13
          }
        }
      }
    }
  });

  actualizarGraficaFrontera();
}

function actualizarGraficaFrontera() {
  if (!appState.chartDecision) return;

  const w1 = appState.perceptronWeights[0];
  const w2 = appState.perceptronWeights[1];
  const b = appState.perceptronBias;

  const linePoints = [];

  if (Math.abs(w2) > 1e-6) {
    const xs = [-0.05, 0.85];
    xs.forEach(x => {
      linePoints.push({ x: x, y: (-w1 * x - b) / w2 });
    });
  } else if (Math.abs(w1) > 1e-6) {
    const x_vert = -b / w1;
    linePoints.push({ x: x_vert, y: 0.0 });
    linePoints.push({ x: x_vert, y: 1.1 });
  }

  appState.chartDecision.stop();
  appState.chartDecision.data.datasets[2].data = linePoints;
  appState.chartDecision.update("none");
}

function renderizarBotonesEpoca() {
  const group = document.getElementById("epoch-filter-group");
  if (!group) return;

  const totalEpochs = Math.max(1, appState.perceptronHistory.length);
  if (appState.traceFilterEpoch !== "all" && parseInt(appState.traceFilterEpoch, 10) > totalEpochs) {
    appState.traceFilterEpoch = "all";
  }

  const maxVisibleBtns = Math.min(totalEpochs, 20);
  let html = `
    <button type="button" class="subnav-plaque-btn ${appState.traceFilterEpoch === "all" ? "active" : ""}" data-epoch="all">
      <span class="plaque-frame xs"><img src="/assets/btn-epoch-all.jpg" alt="" aria-hidden="true"></span>
      <span>Todas (${totalEpochs})</span>
    </button>
  `;

  for (let ep = 1; ep <= maxVisibleBtns; ep++) {
    html += `
      <button type="button" class="subnav-plaque-btn ${appState.traceFilterEpoch === String(ep) ? "active" : ""}" data-epoch="${ep}">
        <span class="plaque-frame xs"><img src="/assets/btn-epoch-step.jpg" alt="" aria-hidden="true"></span>
        <span>Época ${ep}</span>
      </button>
    `;
  }

  group.innerHTML = html;
  group.querySelectorAll(".subnav-plaque-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      group.querySelectorAll(".subnav-plaque-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      appState.traceFilterEpoch = btn.getAttribute("data-epoch");
      renderizarTrazaPerceptron();
    });
  });
}

function renderizarTrazaPerceptron() {
  const tbody = document.getElementById("tbody-perceptron-trace");
  if (!tbody) return;

  tbody.innerHTML = "";
  const filter = appState.traceFilterEpoch;

  appState.perceptronHistory.forEach(ep => {
    if (filter !== "all" && ep.epoch.toString() !== filter) return;

    ep.logs.forEach(log => {
      const tr = document.createElement("tr");
      const tieneError = log.error !== 0;

      tr.className = tieneError ? "trace-row-error" : "trace-row-ok";

      tr.innerHTML = `
        <td><strong>Época ${ep.epoch}</strong></td>
        <td><strong>${PARADEROS_6[log.sample_idx].codigo}</strong></td>
        <td>${log.x[0].toFixed(3)}</td>
        <td>${log.x[1].toFixed(2)}</td>
        <td><strong>${log.y_true}</strong></td>
        <td>${log.z.toFixed(3)}</td>
        <td>${log.y_hat}</td>
        <td><strong style="color: ${tieneError ? THEME.terracottaHi : THEME.sageHi};">${log.error}</strong></td>
        <td>${log.delta_w[0].toFixed(3)}</td>
        <td>${log.delta_w[1].toFixed(3)}</td>
        <td>${log.delta_b.toFixed(3)}</td>
        <td>${log.w[0].toFixed(3)}</td>
        <td>${log.w[1].toFixed(3)}</td>
        <td>${log.b.toFixed(3)}</td>
      `;

      tbody.appendChild(tr);
    });
  });
}

// ============================================================================
// 8. VISTA 4: SIMULACIÓN DE IMPACTO (DATOS REALES DE simular_impacto_despacho)
// ============================================================================

// Parámetros del modelo de flujo (idénticos a SIM_PARAMS en motor_discreto.py)
const SIM_PARAMS = {
  tasa_max_pax_h: 120.0,
  buses_regulares_h: 4.0,
  capacidad_bus: 40,
  ocupacion_previa: 0.7,
  r_min: 0.15,
  r_max: 0.95,
  fraccion_parada: 0.4,
  headway_min: 15.0,
  espera_extra_min: 35.0,
  horas_simulacion: 10,
  buses_refuerzo: 4
};

// Misma fórmula para todos los escenarios; solo cambia la asignación de refuerzos.
function evaluarAsignacion(afluencias, seleccion, buses, capBus) {
  const P = SIM_PARAMS;
  const k = seleccion.reduce((a, b) => a + b, 0);
  return afluencias.map((x2, i) => {
    const demanda = x2 * P.tasa_max_pax_h;
    const xOcup = i > 1 ? x2 : 0.2;
    const r = Math.min(P.r_max, Math.max(P.r_min, 1.0 - P.ocupacion_previa * xOcup));
    const cupo = P.buses_regulares_h * capBus * r * P.fraccion_parada;
    const refuerzo = seleccion[i] && k > 0 ? (buses * capBus) / k : 0;
    const rech = Math.max(0, demanda - (cupo + refuerzo));
    const pct = demanda > 0 ? (rech / demanda) * 100.0 : 0.0;
    return { demanda, pct, espera: P.headway_min + (pct / 100.0) * P.espera_extra_min };
  });
}

function metricasAsignacion(afl, sel, buses, capBus, horas) {
  const r = evaluarAsignacion(afl, sel, buses, capBus);
  const n = r.length;
  return {
    espera: r.reduce((a, x) => a + x.espera, 0) / n,
    rechazo: r.reduce((a, x) => a + x.pct, 0) / n,
    rechazados: r.reduce((a, x) => a + (x.pct / 100) * x.demanda, 0) * horas
  };
}

function topK(valores, k) {
  const orden = valores.map((v, i) => i).sort((a, b) => (valores[b] - valores[a]) || (a - b)).slice(0, k);
  return valores.map((_, i) => (orden.includes(i) ? 1 : 0));
}

function combinaciones(n, k) {
  const out = [];
  const rec = (inicio, actual) => {
    if (actual.length === k) { out.push(actual.slice()); return; }
    for (let i = inicio; i < n; i++) { actual.push(i); rec(i + 1, actual); actual.pop(); }
  };
  rec(0, []);
  return out;
}

// Línea base justa: mismas sillas de refuerzo repartidas con reglas distintas
function compararEstrategiasLocal(paraderos, buses, capBus, horas) {
  const afl = paraderos.map(p => p.afluencia);
  const cb = paraderos.map(p => p.cb_norm);
  const modelo = paraderos.map(p => p.y_hat);
  const n = paraderos.length;
  const k = Math.max(1, modelo.reduce((a, b) => a + b, 0));
  const codigos = sel => paraderos.filter((_, i) => sel[i]).map(p => p.codigo);
  const filas = [
    ["Sin refuerzo (actual)", new Array(n).fill(0)],
    ["Perceptrón (modelo)", modelo],
    [`Top-${k} por afluencia`, topK(afl, k)],
    [`Top-${k} por intermediación C_B'`, topK(cb, k)],
    ["Repartir entre los 15", new Array(n).fill(1)]
  ].map(([nombre, sel]) => {
    const m = metricasAsignacion(afl, sel, buses, capBus, horas);
    return { estrategia: nombre, paraderos: codigos(sel), espera_media: m.espera, rechazo_medio: m.rechazo, pasajeros_rechazados: m.rechazados };
  });
  const combos = combinaciones(n, k);
  const acc = { espera: 0, rechazo: 0, rechazados: 0 };
  combos.forEach(c => {
    const sel = new Array(n).fill(0);
    c.forEach(i => { sel[i] = 1; });
    const m = metricasAsignacion(afl, sel, buses, capBus, horas);
    acc.espera += m.espera; acc.rechazo += m.rechazo; acc.rechazados += m.rechazados;
  });
  filas.push({
    estrategia: `${k} paraderos al azar (promedio exacto)`,
    paraderos: [`${combos.length} combinaciones`],
    espera_media: acc.espera / combos.length,
    rechazo_medio: acc.rechazo / combos.length,
    pasajeros_rechazados: acc.rechazados / combos.length
  });
  return filas;
}

function calcularSimulacionLocal() {
  const paraderos = obtenerCentralidades15Actuales();
  const clasificaciones = paraderos.map(p => p.y_hat);
  const horas = SIM_PARAMS.horas_simulacion;
  const buses = SIM_PARAMS.buses_refuerzo;
  const capBus = SIM_PARAMS.capacidad_bus;
  const afl = paraderos.map(p => p.afluencia);
  const n = paraderos.length;

  const est = evaluarAsignacion(afl, new Array(n).fill(0), buses, capBus);
  const din = evaluarAsignacion(afl, clasificaciones, buses, capBus);
  const media = (arr, f) => arr.reduce((a, x) => a + f(x), 0) / arr.length;

  const meanEst = media(est, x => x.espera);
  const meanDyn = media(din, x => x.espera);
  const meanRejEst = media(est, x => x.pct);
  const meanRejDyn = media(din, x => x.pct);
  const totalRechEst = Math.round(est.reduce((a, x) => a + (x.pct / 100) * x.demanda, 0) * horas);
  const totalRechDyn = Math.round(din.reduce((a, x) => a + (x.pct / 100) * x.demanda, 0) * horas);
  const horasAhorradas = est.reduce((a, x, i) => a + ((x.espera - din[i].espera) / 60) * x.demanda, 0) * horas;

  return {
    horas_simulacion: horas,
    buses_refuerzo: buses,
    capacidad_bus: capBus,
    total_pasajeros_simulados: Math.floor(est.reduce((a, x) => a + x.demanda, 0) * horas),
    total_rechazados_estatico: totalRechEst,
    total_rechazados_dinamico: totalRechDyn,
    pasajeros_salvados_sobrecupo: Math.max(0, totalRechEst - totalRechDyn),
    horas_pasajero_ahorradas: horasAhorradas,
    tiempo_espera_promedio_estatico: meanEst,
    tiempo_espera_promedio_dinamico: meanDyn,
    reduccion_tiempo_espera_pct: ((meanEst - meanDyn) / meanEst) * 100.0,
    rechazo_promedio_estatico: meanRejEst,
    rechazo_promedio_dinamico: meanRejDyn,
    reduccion_rechazo_pct: ((meanRejEst - meanRejDyn) / meanRejEst) * 100.0,
    estrategias: compararEstrategiasLocal(paraderos, buses, capBus, horas),
    detalle_por_paradero: paraderos.map((p, i) => ({
      codigo: p.codigo,
      nombre: p.nombre,
      clasificacion: clasificaciones[i],
      tiempo_estatico: est[i].espera,
      tiempo_dinamico: din[i].espera,
      rechazo_estatico: est[i].pct,
      rechazo_dinamico: din[i].pct
    }))
  };
}

async function ejecutarSimulacionImpacto() {
  let sim = (!appState.cierreGranVia && appState.datosApi && appState.datosApi.simulacion_base)
    ? appState.datosApi.simulacion_base
    : null;

  if (!sim) {
    try {
      const res = await apiFetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buses_refuerzo: 4,
          capacidad_bus: 40,
          horas_simulacion: 10,
          cierre_gran_via: appState.cierreGranVia
        })
      });
      if (res.ok) {
        sim = await res.json();
      }
    } catch (err) {
      // Fallback local idéntico a motor_discreto.py
    }
  }

  if (!sim) {
    sim = calcularSimulacionLocal();
  }

  appState.simulacionActual = sim;
  actualizarKpisImpacto(sim);
  renderizarGraficaImpacto(sim.detalle_por_paradero);
  renderizarTablaImpacto(sim.detalle_por_paradero);
  renderizarTablaEstrategias(sim.estrategias || calcularSimulacionLocal().estrategias);
  actualizarResumenSidebar15();
}

// Tabla de líneas base: misma cantidad de buses de refuerzo, distinta regla de asignación
function renderizarTablaEstrategias(estrategias) {
  const tbody = document.getElementById("tbody-impact-baselines");
  if (!tbody || !estrategias) return;
  const base = estrategias[0];
  tbody.innerHTML = "";
  estrategias.forEach(e => {
    const esModelo = e.estrategia.startsWith("Perceptr");
    const evitados = base.pasajeros_rechazados - e.pasajeros_rechazados;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${esModelo ? `<strong>${e.estrategia}</strong>` : e.estrategia}</td>
      <td>${e.paraderos.join(", ") || "—"}</td>
      <td>${e.espera_media.toFixed(1)} min</td>
      <td>${e.rechazo_medio.toFixed(1)}%</td>
      <td>${Math.round(e.pasajeros_rechazados).toLocaleString("en-US")}</td>
      <td>${evitados > 0.5 ? "−" + Math.round(evitados).toLocaleString("en-US") : "—"}</td>
    `;
    if (esModelo) tr.style.color = THEME.sageHi;
    tbody.appendChild(tr);
  });
}

function actualizarKpisImpacto(sim) {
  const waitEstEl = document.getElementById("metric-wait-est");
  const waitDynEl = document.getElementById("metric-wait-dyn");
  const waitPctEl = document.getElementById("metric-wait-pct");

  const rejEstEl = document.getElementById("metric-reject-est");
  const rejDynEl = document.getElementById("metric-reject-dyn");
  const rejPctEl = document.getElementById("metric-reject-pct");

  const paxEstEl = document.getElementById("metric-pax-rej-est");
  const paxDynEl = document.getElementById("metric-pax-rej-dyn");
  const paxSavEl = document.getElementById("metric-pax-saved");

  const hrsEl = document.getElementById("metric-hours-saved");
  const totEl = document.getElementById("metric-total-pax");
  const metaEl = document.getElementById("impact-sim-meta");

  if (waitEstEl) waitEstEl.textContent = `${sim.tiempo_espera_promedio_estatico.toFixed(1)} min`;
  if (waitDynEl) waitDynEl.textContent = `${sim.tiempo_espera_promedio_dinamico.toFixed(1)} min`;
  if (waitPctEl) waitPctEl.textContent = `▼ Reducción del ${sim.reduccion_tiempo_espera_pct.toFixed(1)}%`;

  if (rejEstEl) rejEstEl.textContent = `${sim.rechazo_promedio_estatico.toFixed(1)}%`;
  if (rejDynEl) rejDynEl.textContent = `${sim.rechazo_promedio_dinamico.toFixed(1)}%`;
  if (rejPctEl) rejPctEl.textContent = `▼ Reducción del ${sim.reduccion_rechazo_pct.toFixed(1)}%`;

  if (paxEstEl) paxEstEl.textContent = sim.total_rechazados_estatico.toLocaleString("en-US");
  if (paxDynEl) paxDynEl.textContent = sim.total_rechazados_dinamico.toLocaleString("en-US");
  if (paxSavEl) paxSavEl.textContent = `+${sim.pasajeros_salvados_sobrecupo.toLocaleString("en-US")} usuarios abordaron`;

  if (hrsEl) {
    hrsEl.textContent = `${sim.horas_pasajero_ahorradas.toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })} h-pax`;
  }
  if (totEl) totEl.textContent = `${sim.total_pasajeros_simulados.toLocaleString("en-US")} pasajeros simulados`;

  if (metaEl) {
    const estadoVia = appState.cierreGranVia ? "Escenario cierre La Gran Vía" : "Escenario flujo normal";
    metaEl.textContent = `${estadoVia} · ${sim.horas_simulacion} horas pico · 4 buses de refuerzo en vacío (40 sillas/bus)`;
  }
}

function alternarMetricaImpacto() {
  appState.impactMetricMode = appState.impactMetricMode === "wait" ? "reject" : "wait";

  const labelBtn = document.getElementById("label-impact-compare");
  const btn = document.getElementById("btn-impact-compare");
  const esRechazo = appState.impactMetricMode === "reject";

  if (labelBtn) {
    labelBtn.textContent = esRechazo ? "Comparar Espera (min)" : "Comparar Rechazo (%)";
  }
  if (btn) {
    btn.classList.toggle("active", esRechazo);
  }

  if (appState.simulacionActual) {
    renderizarGraficaImpacto(appState.simulacionActual.detalle_por_paradero);
  }
}

function renderizarGraficaImpacto(paraderos) {
  const canvas = document.getElementById("chart-impact-bars");
  if (!canvas || typeof Chart === "undefined") return;

  const ctx = canvas.getContext("2d");
  const esRechazo = appState.impactMetricMode === "reject";

  const titleEl = document.getElementById("impact-chart-title");
  const subEl = document.getElementById("impact-chart-sub");
  if (titleEl) {
    titleEl.textContent = esRechazo
      ? "Comparación de Rechazo por Sobrecupo por Paradero (Estático vs. Perceptrón Dinámico)"
      : "Comparación de Tiempos de Espera por Paradero (Estático vs. Perceptrón Dinámico)";
  }
  if (subEl) {
    subEl.textContent = esRechazo
      ? "Porcentaje (%) de pasajeros rechazados por saturación en el Corredor Cra. 51B"
      : "Minutos promedio en andén durante hora pico en el Corredor Cra. 51B";
  }

  const labels = paraderos.map(p => p.codigo);
  const dataEst = paraderos.map(p => (esRechazo ? p.rechazo_estatico : p.tiempo_estatico));
  const dataDyn = paraderos.map(p => (esRechazo ? p.rechazo_dinamico : p.tiempo_dinamico));
  const yLabel = esRechazo ? "Rechazo por sobrecupo (%)" : "Tiempo medio de espera (min)";
  const unitSuffix = esRechazo ? "%" : " min";

  if (appState.chartImpact) {
    appState.chartImpact.data.labels = labels;
    appState.chartImpact.data.datasets[0].label = `Línea Base Estática (${unitSuffix.trim()})`;
    appState.chartImpact.data.datasets[1].label = `Despacho Guiado por Perceptrón (${unitSuffix.trim()})`;
    appState.chartImpact.data.datasets[0].data = dataEst;
    appState.chartImpact.data.datasets[1].data = dataDyn;
    appState.chartImpact.options.scales.y.title.text = yLabel;
    appState.chartImpact.update();
    return;
  }

  appState.chartImpact = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Línea Base Estática (${unitSuffix.trim()})`,
          data: dataEst,
          backgroundColor: THEME.terracotta,
          borderRadius: 4,
          barPercentage: 0.82
        },
        {
          label: `Despacho Guiado por Perceptrón (${unitSuffix.trim()})`,
          data: dataDyn,
          backgroundColor: THEME.sage,
          borderRadius: 4,
          barPercentage: 0.82
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: THEME.ivory, font: { family: "'JetBrains Mono', monospace", size: 11 } }
        },
        y: {
          title: {
            display: true,
            text: yLabel,
            font: { family: "'Plus Jakarta Sans', sans-serif", weight: "600", size: 12 },
            color: THEME.inkSecondary
          },
          grid: { color: "rgba(239, 236, 225, 0.08)" },
          ticks: { color: THEME.inkSecondary, font: { family: "'JetBrains Mono', monospace", size: 11 } }
        }
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: "600" },
            color: THEME.ivory,
            boxWidth: 13
          }
        }
      }
    }
  });
}

function renderizarTablaImpacto(paraderos) {
  const tbody = document.getElementById("tbody-impact-detail");
  if (!tbody) return;

  tbody.innerHTML = "";
  paraderos.forEach(p => {
    const esPrioritario = p.clasificacion === 1;
    const ahorroEspera = p.tiempo_estatico - p.tiempo_dinamico;
    const alivioRechazo = p.rechazo_estatico - p.rechazo_dinamico;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${p.codigo}</strong></td>
      <td>${p.nombre}</td>
      <td>
        <span class="stop-pill ${esPrioritario ? "red" : "blue"}">
          ${esPrioritario ? "Refuerzo prioritario" : "Ruta estándar"}
        </span>
      </td>
      <td>${p.tiempo_estatico.toFixed(1)} min</td>
      <td><strong style="color: ${THEME.sageHi};">${p.tiempo_dinamico.toFixed(1)} min</strong></td>
      <td><span class="frac-pill-dark bold" style="color: ${THEME.sageHi};">-${ahorroEspera.toFixed(1)} min</span></td>
      <td>${p.rechazo_estatico.toFixed(1)}%</td>
      <td>${p.rechazo_dinamico.toFixed(1)}%</td>
      <td><span class="frac-pill-dark bold" style="color: ${THEME.sageHi};">-${alivioRechazo.toFixed(1)}%</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// ============================================================================
// 9. EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
  // Buscador de paraderos y botón Todas
  const searchInput = document.getElementById("search-stops");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      renderizarTarjetas15(e.target.value);
    });
  }

  const btnFilterAll = document.getElementById("btn-filter-all");
  if (btnFilterAll) {
    btnFilterAll.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      renderizarTarjetas15("");
      restablecerVistaCorredor();
    });
  }

  // Toggle placa Gran Vía
  const btnToggleGranVia = document.getElementById("btn-toggle-gran-via");
  const descGranVia = document.getElementById("gran-via-desc");
  const chipGranVia = document.getElementById("gran-via-state-chip");

  if (btnToggleGranVia) {
    btnToggleGranVia.addEventListener("click", () => {
      const cierre = !appState.cierreGranVia;
      btnToggleGranVia.setAttribute("aria-pressed", String(cierre));
      btnToggleGranVia.classList.toggle("is-closed", cierre);

      if (descGranVia) {
        descGranVia.textContent = cierre
          ? "Cierre activo: Tramo Portoazul ↔ UniNorte cerrado"
          : "Flujo normal: calzada habilitada";
        descGranVia.className = cierre ? "contingency-desc closure" : "contingency-desc";
      }

      if (chipGranVia) {
        chipGranVia.textContent = cierre ? "CERRADA" : "ABIERTA";
        chipGranVia.className = `toggle-state-chip ${cierre ? "closed" : "open"}`;
      }

      recalcularRed15(cierre);
    });
  }

  // Botones Vista 2 (Grafo 6 Nodos)
  const btnResetBfs = document.getElementById("btn-reset-bfs");
  if (btnResetBfs) {
    btnResetBfs.addEventListener("click", resetearBfsVista);
  }

  document.querySelectorAll("#bfs-quick-nodes .node-chip-plaque[data-node]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-node"), 10);
      if (!Number.isNaN(idx)) activarBfsDesdeNodo(idx);
    });
  });

  const btnMatrixAdj = document.getElementById("btn-matrix-adj");
  const btnMatrixDist = document.getElementById("btn-matrix-dist");
  if (btnMatrixAdj) btnMatrixAdj.addEventListener("click", () => cambiarMatrizVista("adj"));
  if (btnMatrixDist) btnMatrixDist.addEventListener("click", () => cambiarMatrizVista("dist"));

  // Sliders Perceptrón
  const sEta = document.getElementById("slider-eta");
  const sB0 = document.getElementById("slider-b0");
  const sW1 = document.getElementById("slider-w1");
  const sW2 = document.getElementById("slider-w2");

  if (sEta) {
    sEta.addEventListener("input", (e) => {
      appState.eta = parseFloat(e.target.value);
      document.getElementById("val-eta").textContent = appState.eta.toFixed(2);
      ejecutarEntrenamientoPerceptron();
    });
  }
  if (sB0) {
    sB0.addEventListener("input", (e) => {
      appState.b0 = parseFloat(e.target.value);
      document.getElementById("val-b0").textContent = appState.b0.toFixed(2);
      ejecutarEntrenamientoPerceptron();
    });
  }
  if (sW1) {
    sW1.addEventListener("input", (e) => {
      appState.w1 = parseFloat(e.target.value);
      document.getElementById("val-w1").textContent = appState.w1.toFixed(2);
      ejecutarEntrenamientoPerceptron();
    });
  }
  if (sW2) {
    sW2.addEventListener("input", (e) => {
      appState.w2 = parseFloat(e.target.value);
      document.getElementById("val-w2").textContent = appState.w2.toFixed(2);
      ejecutarEntrenamientoPerceptron();
    });
  }

  const btnRestore = document.getElementById("btn-restore-perceptron");
  if (btnRestore) {
    btnRestore.addEventListener("click", () => {
      appState.eta = 0.50;
      appState.b0 = -1.00;
      appState.w1 = 0.00;
      appState.w2 = 0.00;
      appState.traceFilterEpoch = "all";

      if (sEta) sEta.value = "0.50";
      if (sB0) sB0.value = "-1.00";
      if (sW1) sW1.value = "0.00";
      if (sW2) sW2.value = "0.00";

      document.getElementById("val-eta").textContent = "0.50";
      document.getElementById("val-b0").textContent = "-1.00";
      document.getElementById("val-w1").textContent = "0.00";
      document.getElementById("val-w2").textContent = "0.00";

      ejecutarEntrenamientoPerceptron();
    });
  }

  // Botones Vista 4 (Impacto)
  const btnImpactCompare = document.getElementById("btn-impact-compare");
  const btnImpactToMap = document.getElementById("btn-impact-to-map");
  const btnImpactToMenu = document.getElementById("btn-impact-to-menu");

  if (btnImpactCompare) btnImpactCompare.addEventListener("click", alternarMetricaImpacto);
  if (btnImpactToMap) btnImpactToMap.addEventListener("click", () => activarVista("view-map"));
  if (btnImpactToMenu) btnImpactToMenu.addEventListener("click", () => activarVista("view-menu"));
}

// ============================================================================
// 10. RENDERIZADOR KATEX
// ============================================================================

function renderAllKaTeX() {
  if (typeof renderMathInElement === "function") {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false }
      ],
      throwOnError: false
    });
  }

  document.querySelectorAll(".katex-eq").forEach(el => {
    const formula = el.getAttribute("data-formula");
    if (formula && typeof katex !== "undefined") {
      try {
        katex.render(formula, el, {
          throwOnError: false,
          displayMode: el.classList.contains("katex-display-box")
        });
      } catch (e) {
        // Ignorar fórmula no válida
      }
    }
  });
}
