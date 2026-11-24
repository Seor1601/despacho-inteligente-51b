"""
NÚCLEO MATEMÁTICO DISCRETO - CORREDOR UNIVERSITARIO (CRA 51B)
Asignatura: Matemáticas Discretas (MAT 4021) - Docente: MSc. Iván Gómez
Universidad del Norte, Barranquilla, Colombia

Módulo puro sin librerías de caja negra:
- Búsqueda en Anchura (BFS) por capas con multiplicidad de caminos geodésicos.
- Centralidades de Freeman (Grado C_D, Cercanía C_C, Intermediación C_B y Normalizada C_B').
- Perceptrón de Rosenblatt (1958) con función escalón de Heaviside y traza determinista.
- Modelo de Simulación Operativa de Despacho (Antes vs. Después) con líneas base justas.
- Topología dual: Subgrafo analítico de 6 nodos y Red completa de 15 paraderos reales.
"""

import numpy as np
import matplotlib.pyplot as plt
from collections import deque

# =============================================================================
# 1. DEFINICIÓN DEL CASO DE PRUEBA CONOCIDO (SUBGRAFO DIAMANTE - 6 NODOS)
# =============================================================================

PARADEROS_6 = [
    {"id": 0, "codigo": "v1", "nombre": "Club Campestre", "desc": "Acceso Norte / Villa Campestre", "afluencia": 0.20, "y": 0, "pos": (1.0, 3.0)},
    {"id": 1, "codigo": "v2", "nombre": "Clínica Portoazul", "desc": "Intersección Crítica Gran Vía", "afluencia": 0.70, "y": 0, "pos": (3.0, 4.5)},
    {"id": 2, "codigo": "v3", "nombre": "UniNorte Puerta 4", "desc": "Puente Peatonal / Demanda Máx.", "afluencia": 0.95, "y": 1, "pos": (3.0, 1.5)},
    {"id": 3, "codigo": "v4", "nombre": "Makro / Transversal", "desc": "Bypass & Conector Intermedio", "afluencia": 0.80, "y": 1, "pos": (5.5, 3.0)},
    {"id": 4, "codigo": "v5", "nombre": "UniAtlántico / Colegios", "desc": "Nodo Intercolegial Secundario", "afluencia": 0.55, "y": 0, "pos": (8.0, 3.0)},
    {"id": 5, "codigo": "v6", "nombre": "Retorno Sur 51B", "desc": "Salida hacia Puerto Colombia", "afluencia": 0.15, "y": 0, "pos": (10.5, 3.0)}
]

A_6 = np.array([
    [0, 1, 1, 0, 0, 0],  # v1
    [1, 0, 0, 1, 0, 0],  # v2
    [1, 0, 0, 1, 0, 0],  # v3
    [0, 1, 1, 0, 1, 0],  # v4
    [0, 0, 0, 1, 0, 1],  # v5
    [0, 0, 0, 0, 1, 0]   # v6
], dtype=int)


# =============================================================================
# 2. DEFINICIÓN DE LA RED ESCALADA (CORREDOR REAL - 15 PARADEROS)
# =============================================================================

PARADEROS_15 = [
    {"id": 0,  "codigo": "P01", "nombre": "Circunvalar / Cra 51B",  "desc": "Acceso Sur Barranquilla / Entrada Troncal",  "afluencia": 0.40, "lat": 11.0112, "lon": -74.8385, "x": 0.5,  "y": 3.0},
    {"id": 1,  "codigo": "P02", "nombre": "Makro / Transversal 51B", "desc": "Bypass Arterial y enlace con Cra 53",       "afluencia": 0.80, "lat": 11.0145, "lon": -74.8428, "x": 1.8,  "y": 3.0},
    {"id": 2,  "codigo": "P03", "nombre": "Le Champ / Villa Santos", "desc": "Ruta Alterna Occidental Villa Santos",      "afluencia": 0.50, "lat": 11.0162, "lon": -74.8465, "x": 3.2,  "y": 4.5},
    {"id": 3,  "codigo": "P04", "nombre": "Clínica Portoazul",       "desc": "Frente de Obras Gran Vía / Av. Las Dunas",   "afluencia": 0.70, "lat": 11.0178, "lon": -74.8505, "x": 3.2,  "y": 1.5},
    {"id": 4,  "codigo": "P05", "nombre": "Colegio San José",        "desc": "Acceso Escolar y Desvío Sur",                "afluencia": 0.60, "lat": 11.0172, "lon": -74.8548, "x": 4.8,  "y": 1.2},
    {"id": 5,  "codigo": "P06", "nombre": "UniNorte Puerta 2",       "desc": "Acceso Administrativo y Deportivo",          "afluencia": 0.65, "lat": 11.0190, "lon": -74.8495, "x": 4.8,  "y": 4.8},
    {"id": 6,  "codigo": "P07", "nombre": "UniNorte Puerta 4",       "desc": "Puente Peatonal / Demanda Pico Máxima",      "afluencia": 0.95, "lat": 11.0202, "lon": -74.8512, "x": 6.2,  "y": 3.0},
    {"id": 7,  "codigo": "P08", "nombre": "Colegio Británico",       "desc": "Enlace Escolar Intermedio Calle 130",        "afluencia": 0.55, "lat": 11.0215, "lon": -74.8540, "x": 7.6,  "y": 3.0},
    {"id": 8,  "codigo": "P09", "nombre": "UniLibre (Sede Norte)",   "desc": "Campus Universitario Norte / Alta Demanda",  "afluencia": 0.85, "lat": 11.0232, "lon": -74.8582, "x": 9.0,  "y": 3.0},
    {"id": 9,  "codigo": "P10", "nombre": "Uni. Antonio Nariño (UAN)","desc": "Nodo Universitario Intermedio",              "afluencia": 0.50, "lat": 11.0250, "lon": -74.8620, "x": 10.4, "y": 2.0},
    {"id": 10, "codigo": "P11", "nombre": "Club Campestre",          "desc": "Retorno Norte Villa Campestre",              "afluencia": 0.25, "lat": 11.0265, "lon": -74.8665, "x": 10.4, "y": 4.0},
    {"id": 11, "codigo": "P12", "nombre": "UniAtlántico (Km 7)",     "desc": "Sede Regional Troncal / Afluencia Masiva",    "afluencia": 0.90, "lat": 11.0185, "lon": -74.8690, "x": 11.8, "y": 2.0},
    {"id": 12, "codigo": "P13", "nombre": "Villa Campestre Bulevar", "desc": "Sector Residencial y Comercial 51B",         "afluencia": 0.60, "lat": 11.0255, "lon": -74.8550, "x": 11.8, "y": 4.0},
    {"id": 13, "codigo": "P14", "nombre": "Corredor Caujaral",       "desc": "Intersección Lagos de Caujaral y Retorno",   "afluencia": 0.30, "lat": 11.0220, "lon": -74.8800, "x": 13.4, "y": 3.0},
    {"id": 14, "codigo": "P15", "nombre": "Entrada Puerto Colombia", "desc": "Glorieta de Acceso Intermunicipal / Playa", "afluencia": 0.35, "lat": 11.0200, "lon": -74.8950, "x": 14.8, "y": 3.0}
]

# Aristas base del Corredor Real (15 nodos)
ARISTAS_15_BASE = [
    (0, 1),   # Circunvalar <-> Makro
    (1, 2),   # Makro <-> Le Champ (bypass norte)
    (1, 3),   # Makro <-> Portoazul (arteria principal sur)
    (2, 5),   # Le Champ <-> UniNorte Puerta 2
    (3, 4),   # Portoazul <-> San José
    (3, 6),   # Portoazul <-> UniNorte Puerta 4 (TRAMO CRÍTICO DE OBRAS 'LA GRAN VÍA')
    (4, 6),   # San José <-> UniNorte Puerta 4
    (4, 7),   # San José <-> Británico
    (5, 6),   # UniNorte Puerta 2 <-> UniNorte Puerta 4
    (6, 7),   # UniNorte Puerta 4 <-> Británico
    (6, 8),   # UniNorte Puerta 4 <-> UniLibre
    (7, 8),   # Británico <-> UniLibre
    (8, 9),   # UniLibre <-> UAN
    (8, 10),  # UniLibre <-> Club Campestre
    (9, 11),  # UAN <-> UniAtlántico
    (10, 11), # Club Campestre <-> UniAtlántico
    (10, 12), # Club Campestre <-> Villa Campestre Bulevar
    (11, 13), # UniAtlántico <-> Caujaral
    (12, 13), # Villa Campestre <-> Caujaral
    (13, 14)  # Caujaral <-> Entrada Puerto Colombia
]

# Arista del tramo crítico en obras que puede cerrarse
ARISTA_CIERRE_GRAN_VIA = (3, 6)  # Portoazul <-> UniNorte Puerta 4

def construir_matriz_adyacencia(n_nodos, aristas):
    """Construye una matriz de adyacencia binaria simétrica a partir de aristas no dirigidas."""
    A = np.zeros((n_nodos, n_nodos), dtype=int)
    for u, v in aristas:
        A[u, v] = 1
        A[v, u] = 1
    return A

def obtener_grafo_15(cierre_gran_via=False):
    """
    Retorna la lista de aristas y matriz de adyacencia para la red de 15 paraderos,
    permitiendo simular el cierre de la calzada de obras en La Gran Vía.
    """
    if cierre_gran_via:
        aristas = [e for e in ARISTAS_15_BASE if e != ARISTA_CIERRE_GRAN_VIA and (e[1], e[0]) != ARISTA_CIERRE_GRAN_VIA]
    else:
        aristas = list(ARISTAS_15_BASE)
    A = construir_matriz_adyacencia(len(PARADEROS_15), aristas)
    return aristas, A


# =============================================================================
# 3. ALGORITMO BFS POR CAPAS Y MULTIPLICIDAD DE CAMINOS GEODÉSICOS
# =============================================================================

def calcular_distancias_y_caminos_bfs(adj_matrix):
    """
    Calcula la matriz de distancias geodésicas D y la multiplicidad de caminos
    más cortos sigma_st mediante BFS exhaustivo por capas para cada par de nodos.
    Registra minuciosamente la lista de predecesores para reconstruir todas las geodésicas.
    """
    n = adj_matrix.shape[0]
    dist_matrix = np.full((n, n), fill_value=np.inf)
    sigma = np.zeros((n, n), dtype=int)
    predecessors = [[[] for _ in range(n)] for _ in range(n)]

    for s in range(n):
        dist_matrix[s, s] = 0
        sigma[s, s] = 1
        queue = deque([s])
        
        while queue:
            u = queue.popleft()
            for v in range(n):
                if adj_matrix[u, v] == 1:
                    # Descubrimiento de nuevo camino geodésico mínimo
                    if dist_matrix[s, v] == np.inf:
                        dist_matrix[s, v] = dist_matrix[s, u] + 1
                        sigma[s, v] = sigma[s, u]
                        predecessors[s][v].append(u)
                        queue.append(v)
                    # Descubrimiento de camino concurrente de IGUAL longitud mínima (empate)
                    elif dist_matrix[s, v] == dist_matrix[s, u] + 1:
                        sigma[s, v] += sigma[s, u]
                        predecessors[s][v].append(u)
                        
    # Preservar tipo float seguro para dist_matrix si existen nodos inalcanzables (np.inf)
    if not np.any(np.isinf(dist_matrix)):
        dist_matrix_ret = dist_matrix.astype(int)
    else:
        dist_matrix_ret = dist_matrix
    return dist_matrix_ret, sigma, predecessors


# =============================================================================
# 4. CÁLCULO AXIOMÁTICO DE CENTRALIDADES DE FREEMAN (C_D, C_C, C_B, C_B')
# =============================================================================

def calcular_centralidades(adj_matrix, dist_matrix, sigma, predecessors):
    """
    Calcula Grado (C_D), Cercanía (C_C), Intermediación (C_B) y normalizada (C_B').
    Aplica la fórmula formal de Freeman para grafos no dirigidos:
    C_B(v) = sum_{s < t, s != v != t} (sigma_st(v) / sigma_st)
    Normalización: C_B'(v) = C_B(v) / ( (n-1)(n-2)/2 )
    Maneja rigurosamente caminos empatados (fracciones sigma_st(v)/sigma_st).
    """
    n = adj_matrix.shape[0]
    c_d = np.sum(adj_matrix, axis=1)
    
    # Cercanía: (n - 1) / sum(d(v, u))
    sum_dist = np.sum(dist_matrix, axis=1)
    with np.errstate(divide='ignore', invalid='ignore'):
        c_c = np.where(sum_dist > 0, (n - 1) / sum_dist, 0.0)
    
    # Intermediación de Freeman
    c_b = np.zeros(n, dtype=float)
    pares_evaluados = []
    
    for s in range(n):
        for t in range(s + 1, n):
            # Reconstruir todos los caminos geodésicos entre s y t
            todos_caminos = []
            
            def reconstruir(nodo_actual, camino_parcial):
                if nodo_actual == s:
                    todos_caminos.append(camino_parcial[::-1])
                    return
                for p in predecessors[s][nodo_actual]:
                    reconstruir(p, camino_parcial + [p])
            
            if dist_matrix[s, t] < np.inf and dist_matrix[s, t] > 0:
                reconstruir(t, [t])
                num_geodesicas = len(todos_caminos)
                
                if num_geodesicas > 0:
                    for v in range(n):
                        if v != s and v != t:
                            caminos_con_v = sum(1 for cam in todos_caminos if v in cam)
                            if caminos_con_v > 0:
                                fraccion = caminos_con_v / num_geodesicas
                                c_b[v] += fraccion
                                pares_evaluados.append({
                                    "par": (s, t),
                                    "nodo": v,
                                    "caminos_con_v": caminos_con_v,
                                    "total_geodesicas": num_geodesicas,
                                    "fraccion": fraccion,
                                    "rutas": todos_caminos
                                })

    # Normalización combinatoria sobre C(n-1, 2) = (n-1)(n-2)/2
    max_posibles_pares = ((n - 1) * (n - 2)) / 2 if n > 2 else 1.0
    c_b_norm = c_b / max_posibles_pares
    
    return c_d, sum_dist, c_c, c_b, c_b_norm, pares_evaluados


# =============================================================================
# 5. PERCEPTRÓN SIMPLE DE ROSENBLATT (1958) DESDE CERO
# =============================================================================

class PerceptronRosenblatt:
    """
    Clasificador Lineal Discreto de Rosenblatt (1958).
    Función de activación: Escalón Heaviside phi(z) in {0, 1}.
    Regla de actualización discreta:
      e = y - y_hat
      Delta_w = eta * e * x
      Delta_b = eta * e
    Inicialización por defecto: w = [0.0, 0.0]^T, b = -1.0 (inercia operativa).
    """
    def __init__(self, n_features=2, learning_rate=0.5, b_init=-1.0, max_epochs=20):
        self.eta = learning_rate
        self.max_epochs = max_epochs
        self.b_init = b_init
        self.w = np.zeros(n_features, dtype=float)
        self.b = float(b_init)
        self.history = []

    def reset(self):
        self.w = np.zeros(len(self.w), dtype=float)
        self.b = float(self.b_init)
        self.history = []

    def activation(self, z):
        return 1 if z >= 0.0 else 0

    def predict(self, x):
        z = np.dot(self.w, x) + self.b
        return self.activation(z)

    def fit(self, X, y):
        self.reset()
        n_samples = X.shape[0]
        convergencia = False
        
        for epoch in range(1, self.max_epochs + 1):
            total_error = 0
            epoch_logs = []
            
            for i in range(n_samples):
                xi = X[i]
                yi = int(y[i])
                zi = float(np.dot(self.w, xi) + self.b)
                y_hat = self.activation(zi)
                error = yi - y_hat
                
                # Regla de actualización
                delta_w = self.eta * error * xi
                delta_b = self.eta * error
                
                self.w = self.w + delta_w
                self.b = self.b + delta_b
                total_error += abs(error)
                
                epoch_logs.append({
                    "sample_idx": i,
                    "x": xi.copy(),
                    "y_true": yi,
                    "z": zi,
                    "y_hat": y_hat,
                    "error": error,
                    "delta_w": delta_w.copy(),
                    "delta_b": delta_b,
                    "w": self.w.copy(),
                    "b": self.b
                })
                
            self.history.append({
                "epoch": epoch,
                "total_error": total_error,
                "logs": epoch_logs,
                "final_w": self.w.copy(),
                "final_b": self.b
            })
            
            if total_error == 0:
                convergencia = True
                break
                
        return convergencia, len(self.history)

    def obtener_ecuacion_frontera(self):
        """
        Retorna la pendiente m y corte k de la recta x2 = m * x1 + k.
        Si la recta es vertical (w2 ~= 0 pero w1 != 0), retorna (None, -b / w1).
        Si ambos pesos son nulos (w1 ~= 0 y w2 ~= 0), retorna (None, None).
        """
        w1, w2 = self.w
        b = self.b
        if abs(w2) >= 1e-9:
            m = -w1 / w2
            k = -b / w2
            return m, k
        elif abs(w1) >= 1e-9:
            return None, -b / w1
        else:
            return None, None


# =============================================================================
# 6. MODELO DE SIMULACIÓN DE IMPACTO (ANTES VS. DESPUÉS) Y LÍNEAS BASE
# =============================================================================
#
# Modelo de flujo horario por paradero (determinista, sin aleatoriedad).
# Todos los escenarios usan EXACTAMENTE la misma fórmula; lo único que cambia
# entre ellos es a qué paraderos se asignan los buses de refuerzo.
#
#   Demanda:            lambda_i = TASA_MAX_PAX_H * x2_i             [pasajeros/hora]
#   Cupo regular libre: K_i = BUSES_H * CAP_BUS * r_i * F_PARADA      [sillas/hora]
#       r_i = clip(1 - OCUP_PREVIA * x2_i, R_MIN, R_MAX)   fracción de sillas que
#             llegan libres (los buses vienen ocupados desde paraderos previos);
#             para los dos primeros paraderos (inicio de ruta) se usa x2 = 0.2.
#       F_PARADA: fracción de los buses de la ruta que efectivamente se detiene.
#   Refuerzo:           cada bus vacío aporta CAP_BUS sillas/hora al paradero
#                       asignado (B buses repartidos por igual entre los elegidos).
#   Rechazo:            p_i = max(0, lambda_i - (K_i + refuerzo_i)) / lambda_i
#   Espera:             W_i = HEADWAY_MIN + p_i * ESPERA_EXTRA_MIN   [minutos]
#                       (quien no cabe espera, en promedio, parte del siguiente ciclo)
#
# Los valores de los parámetros son SUPUESTOS del grupo (no medidos); se dejan
# explícitos para que cualquiera pueda cambiarlos y repetir el experimento.

SIM_PARAMS = {
    "tasa_max_pax_h": 120.0,     # pasajeros/hora en un paradero con afluencia 1.0
    "buses_regulares_h": 4.0,    # frecuencia regular: 1 bus cada 15 min
    "capacidad_bus": 40,         # sillas por bus
    "ocupacion_previa": 0.7,     # cuánto se llena el bus antes de llegar, según x2
    "r_min": 0.15,
    "r_max": 0.95,
    "fraccion_parada": 0.4,      # fracción de buses regulares que se detienen
    "headway_min": 15.0,         # espera base = intervalo entre buses
    "espera_extra_min": 35.0,    # espera adicional de un pasajero rechazado
    "horas_simulacion": 10,
    "buses_refuerzo": 4,
}


def _evaluar_asignacion(afluencias, seleccion, buses_refuerzo, capacidad_bus, params):
    """Aplica el modelo de flujo a una asignación binaria de refuerzos.
    Retorna vectores (demanda, rechazo %, espera min) por paradero."""
    afl = np.asarray(afluencias, dtype=float)
    n = len(afl)
    demanda = afl * params["tasa_max_pax_h"]
    x_ocup = np.array([afl[i] if i > 1 else 0.2 for i in range(n)])
    r = np.clip(1.0 - params["ocupacion_previa"] * x_ocup, params["r_min"], params["r_max"])
    cupo_regular = params["buses_regulares_h"] * capacidad_bus * r * params["fraccion_parada"]

    sel = np.asarray(seleccion, dtype=int)
    k = int(sel.sum())
    refuerzo = sel * (buses_refuerzo * capacidad_bus / k) if k > 0 else np.zeros(n)

    rechazados = np.maximum(0.0, demanda - (cupo_regular + refuerzo))
    pct_rechazo = np.where(demanda > 0, rechazados / demanda * 100.0, 0.0)
    espera = params["headway_min"] + (pct_rechazo / 100.0) * params["espera_extra_min"]
    return demanda, pct_rechazo, espera


def simular_impacto_despacho(paraderos, clasificaciones, horas_simulacion=10, buses_refuerzo=4,
                             capacidad_bus=40, params=None):
    """
    Compara el despacho actual (Antes: sin refuerzos) contra el despacho guiado por
    el perceptrón (Después: los `buses_refuerzo` se reparten entre los paraderos con y=1).
    Ambos escenarios usan la misma fórmula (ver encabezado de la sección 6).
    """
    p = dict(SIM_PARAMS if params is None else params)
    n = len(paraderos)
    afl = [q["afluencia"] for q in paraderos]

    dem, rej_est, esp_est = _evaluar_asignacion(afl, [0] * n, buses_refuerzo, capacidad_bus, p)
    _, rej_din, esp_din = _evaluar_asignacion(afl, clasificaciones, buses_refuerzo, capacidad_bus, p)

    total_pasajeros = int(np.sum(dem) * horas_simulacion)
    total_rechazo_est = int(round(np.sum(rej_est / 100.0 * dem) * horas_simulacion))
    total_rechazo_din = int(round(np.sum(rej_din / 100.0 * dem) * horas_simulacion))
    horas_ahorradas = float(np.sum((esp_est - esp_din) / 60.0 * dem) * horas_simulacion)

    return {
        "horas_simulacion": int(horas_simulacion),
        "buses_refuerzo": int(buses_refuerzo),
        "capacidad_bus": int(capacidad_bus),
        "parametros": p,
        "total_pasajeros_simulados": total_pasajeros,
        "total_rechazados_estatico": total_rechazo_est,
        "total_rechazados_dinamico": total_rechazo_din,
        "pasajeros_salvados_sobrecupo": max(0, total_rechazo_est - total_rechazo_din),
        "horas_pasajero_ahorradas": horas_ahorradas,
        "tiempo_espera_promedio_estatico": float(np.mean(esp_est)),
        "tiempo_espera_promedio_dinamico": float(np.mean(esp_din)),
        "reduccion_tiempo_espera_pct": float((np.mean(esp_est) - np.mean(esp_din)) / np.mean(esp_est) * 100.0),
        "rechazo_promedio_estatico": float(np.mean(rej_est)),
        "rechazo_promedio_dinamico": float(np.mean(rej_din)),
        "reduccion_rechazo_pct": float((np.mean(rej_est) - np.mean(rej_din)) / np.mean(rej_est) * 100.0),
        "detalle_por_paradero": [
            {
                "codigo": paraderos[i]["codigo"],
                "nombre": paraderos[i]["nombre"],
                "clasificacion": int(clasificaciones[i]),
                "tiempo_estatico": float(esp_est[i]),
                "tiempo_dinamico": float(esp_din[i]),
                "rechazo_estatico": float(rej_est[i]),
                "rechazo_dinamico": float(rej_din[i]),
            }
            for i in range(n)
        ],
    }


def _top_k(valores, k):
    """Selecciona los k índices de mayor valor (desempate por menor índice)."""
    orden = sorted(range(len(valores)), key=lambda i: (-valores[i], i))[:k]
    return [1 if i in orden else 0 for i in range(len(valores))]


def comparar_estrategias(paraderos, cb_norm, clasificaciones, horas_simulacion=10,
                         buses_refuerzo=4, capacidad_bus=40, params=None):
    """
    Línea base justa: todas las estrategias reparten la MISMA cantidad de buses de
    refuerzo con la MISMA fórmula. Así se separa el efecto de 'agregar buses' del
    efecto de 'elegir bien dónde ponerlos'.

    Estrategias:
      - Sin refuerzo (situación actual).
      - Perceptrón (paraderos con y_hat = 1).
      - Top-k por afluencia (k = número de paraderos que eligió el perceptrón).
      - Top-k por intermediación C_B'.
      - Reparto uniforme entre los 15 paraderos.
      - Al azar: valor esperado EXACTO sobre todas las combinaciones de k paraderos.
    """
    from itertools import combinations

    p = dict(SIM_PARAMS if params is None else params)
    n = len(paraderos)
    afl = [q["afluencia"] for q in paraderos]
    k = max(1, int(sum(clasificaciones)))

    def metricas(sel):
        dem, rej, esp = _evaluar_asignacion(afl, sel, buses_refuerzo, capacidad_bus, p)
        return float(np.mean(esp)), float(np.mean(rej)), float(np.sum(rej / 100.0 * dem) * horas_simulacion)

    estrategias = [
        ("Sin refuerzo (actual)", [0] * n),
        ("Perceptrón (modelo)", list(clasificaciones)),
        (f"Top-{k} por afluencia", _top_k(afl, k)),
        (f"Top-{k} por intermediación C_B'", _top_k(list(cb_norm), k)),
        ("Repartir entre los 15", [1] * n),
    ]
    resultados = []
    for nombre, sel in estrategias:
        esp, rej, pax = metricas(sel)
        resultados.append({
            "estrategia": nombre,
            "paraderos": [paraderos[i]["codigo"] for i in range(n) if sel[i]],
            "espera_media": esp,
            "rechazo_medio": rej,
            "pasajeros_rechazados": pax,
        })

    combos = list(combinations(range(n), k))
    acumulado = np.zeros(3)
    for c in combos:
        sel = [1 if i in c else 0 for i in range(n)]
        acumulado += np.array(metricas(sel))
    acumulado /= len(combos)
    resultados.append({
        "estrategia": f"{k} paraderos al azar (promedio exacto)",
        "paraderos": [f"{len(combos)} combinaciones"],
        "espera_media": float(acumulado[0]),
        "rechazo_medio": float(acumulado[1]),
        "pasajeros_rechazados": float(acumulado[2]),
    })
    return resultados


# =============================================================================
# 7. GENERACIÓN DE VISUALIZACIONES EN ALTA RESOLUCIÓN
# =============================================================================

def graficar_red_topologica(adj_matrix, c_b_norm, paraderos, y_labels, filename="grafo_red_51b.png"):
    """Genera el diagrama topológico de la subred diamante de 6 nodos en estilo editorial claro."""
    fig, ax = plt.subplots(figsize=(10, 6), dpi=300)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')
    pos = {p["id"]: np.array(p["pos"]) for p in paraderos}
    n = adj_matrix.shape[0]

    for i in range(n):
        for j in range(i + 1, n):
            if adj_matrix[i, j] == 1:
                p1, p2 = pos[i], pos[j]
                es_tramo_obras = (i, j) in [(0, 1), (1, 3), (0, 2), (2, 3)]
                color_linea = '#D97706' if es_tramo_obras else '#64748B'
                estilo_linea = '--' if es_tramo_obras else '-'
                ancho = 2.2 if es_tramo_obras else 1.8
                ax.plot([p1[0], p2[0]], [p1[1], p2[1]], color=color_linea, 
                        linestyle=estilo_linea, linewidth=ancho, zorder=1)

    for p in paraderos:
        i = p["id"]
        coord = pos[i]
        es_critico = y_labels[i] == 1
        color_nodo = '#DC2626' if es_critico else '#2563EB'
        
        circulo = plt.Circle(coord, 0.50, facecolor=color_nodo, edgecolor='#0F172A', linewidth=1.8, zorder=2)
        ax.add_patch(circulo)
        ax.text(coord[0], coord[1], p["codigo"], color='white', weight='bold', fontsize=11, ha='center', va='center', zorder=3)
        
        y_offset = 0.85 if i in [0, 1, 3, 4, 5] else -0.85
        etiqueta = f"{p['nombre']}\n$C_B'={c_b_norm[i]:.2f}$ · Demanda={p['afluencia']:.2f}\n{'Refuerzo prioritario' if es_critico else 'Ruta normal'}"
        caja_color = '#FEF2F2' if es_critico else '#EFF6FF'
        borde_color = '#F87171' if es_critico else '#93C5FD'
        
        ax.text(coord[0], coord[1] + y_offset, etiqueta, fontsize=8.5, ha='center', va='center', weight='bold',
                color='#0F172A',
                bbox=dict(boxstyle='round,pad=0.35', facecolor=caja_color, edgecolor=borde_color, alpha=0.95), zorder=4)

    ax.text(3.0, 3.0, "Zona de obras 'La Gran Vía'\n(Estructura Diamante C4)", 
            color='#92400E', fontsize=8.5, ha='center', va='center', weight='bold',
            bbox=dict(boxstyle='round,pad=0.35', facecolor='#FEF3C7', edgecolor='#F59E0B', alpha=0.9))

    ax.set_xlim(-0.2, 12.0)
    ax.set_ylim(0.0, 6.0)
    ax.set_aspect('equal')
    ax.axis('off')
    ax.set_title("Topología de la Red: Subgrafo de Prueba (6 Nodos - Cra. 51B)\n"
                 "Intermediación Geodésica de Freeman y Asignación de Despacho", 
                 fontsize=11, weight='bold', pad=15, color='#0F172A')
    plt.tight_layout()
    if filename:
        plt.savefig(filename, dpi=300, facecolor='#FFFFFF')
    return fig


def graficar_frontera_decision(X, y, perceptron, paraderos, filename="frontera_decision_perceptron.png"):
    """Grafica el espacio bidimensional R^2 y la recta frontera de decisión en estilo editorial claro."""
    fig, ax = plt.subplots(figsize=(8, 6), dpi=300)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')
    w1, w2 = perceptron.w
    b = perceptron.b
    
    x_min, x_max = -0.05, max(0.85, np.max(X[:, 0]) + 0.1)
    y_min, y_max = 0.0, 1.15
    xx, yy = np.meshgrid(np.linspace(x_min, x_max, 300), np.linspace(y_min, y_max, 300))
    grid_points = np.c_[xx.ravel(), yy.ravel()]
    z_grid = np.dot(grid_points, perceptron.w) + b
    preds_grid = (z_grid >= 0).reshape(xx.shape)
    
    ax.contourf(xx, yy, preds_grid, levels=[-0.5, 0.5, 1.5], colors=['#EFF6FF', '#FEF2F2'], alpha=0.6)
    
    x_line = np.linspace(x_min, x_max, 200)
    if abs(w2) > 1e-9:
        y_line = -(w1 * x_line + b) / w2
        ax.plot(x_line, y_line, color='#DC2626', linewidth=2.0, linestyle='-', 
                label=f'Frontera lineal: ${w1:.2f}x_1 + {w2:.2f}x_2 {b:+.2f} = 0$')
    
    for i, p in enumerate(paraderos):
        xi, yi = X[i, 0], X[i, 1]
        clase = y[i]
        color_punto = '#DC2626' if clase == 1 else '#2563EB'
        marcador = 's' if clase == 1 else 'o'
        
        ax.scatter(xi, yi, color=color_punto, s=100, marker=marcador, edgecolor='#0F172A', linewidth=1.5, zorder=5)
        ax.annotate(f"{p['codigo']} ({p['nombre']})", (xi, yi), 
                    xytext=(xi + 0.02, yi + 0.03),
                    fontsize=8.5, weight='bold', color='#0F172A',
                    bbox=dict(boxstyle='round,pad=0.2', facecolor='white', edgecolor='#CBD5E1', alpha=0.9),
                    zorder=6)

    ax.scatter([], [], color='#DC2626', marker='s', s=80, label='Refuerzo prioritario ($y=1$)')
    ax.scatter([], [], color='#2563EB', marker='o', s=80, label='Ruta normal ($y=0$)')
    
    ax.set_xlim(x_min, x_max)
    ax.set_ylim(y_min, y_max)
    ax.set_xlabel(r"Intermediación normalizada de Freeman ($C_B'$)", fontsize=10, weight='bold', color='#0F172A')
    ax.set_ylabel(r"Demanda normalizada de pasajeros ($x_2$)", fontsize=10, weight='bold', color='#0F172A')
    ax.set_title(r"Espacio de Características $\mathbb{R}^2$ y Frontera de Decisión Lineal" + "\n" +
                 rf"Perceptrón de Rosenblatt ($\eta = {perceptron.eta}$ · Convergencia en Época {len(perceptron.history)})", 
                 fontsize=11, weight='bold', pad=12, color='#0F172A')
    ax.grid(True, linestyle=':', alpha=0.5, color='#CBD5E1')
    ax.legend(loc='lower right', frameon=True, facecolor='white', framealpha=0.95, edgecolor='#E2E8F0')
    plt.tight_layout()
    if filename:
        plt.savefig(filename, dpi=300, facecolor='#FFFFFF')
    return fig


def graficar_red_15(aristas, c_b_norm, paraderos, y_labels, cierre_gran_via=False, filename=None):
    """Genera la visualización interactiva y estilizada de los 15 paraderos del Corredor Universitario."""
    fig, ax = plt.subplots(figsize=(14, 7), dpi=200)
    pos = {p["id"]: np.array([p["x"], p["y"]]) for p in paraderos}
    
    # Dibujar aristas
    for u, v in aristas:
        p1, p2 = pos[u], pos[v]
        es_bypass = (u, v) in [(1, 2), (2, 5), (5, 6)] or (v, u) in [(1, 2), (2, 5), (5, 6)]
        color_linea = '#2563EB' if es_bypass else '#475569'
        estilo = '--' if es_bypass else '-'
        ancho = 2.4 if es_bypass else 1.8
        ax.plot([p1[0], p2[0]], [p1[1], p2[1]], color=color_linea, linestyle=estilo, linewidth=ancho, zorder=1)

    # Si hay cierre vial, dibujar la arista cerrada en rojo punteado con X
    if cierre_gran_via:
        u_c, v_c = ARISTA_CIERRE_GRAN_VIA
        p1, p2 = pos[u_c], pos[v_c]
        ax.plot([p1[0], p2[0]], [p1[1], p2[1]], color='#DC2626', linestyle=':', linewidth=3.0, zorder=2)
        mid_x, mid_y = (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2
        ax.text(mid_x, mid_y, "Cierre vial\nLa Gran Vía", color='#B91C1C', weight='bold', fontsize=8.5,
                ha='center', va='center', bbox=dict(boxstyle='round,pad=0.3', facecolor='#FEE2E2', edgecolor='#DC2626'))

    # Dibujar nodos
    for p in paraderos:
        i = p["id"]
        coord = pos[i]
        es_critico = y_labels[i] == 1
        color_nodo = '#DC2626' if es_critico else '#0284C7'
        
        circulo = plt.Circle(coord, 0.45, facecolor=color_nodo, edgecolor='#0F172A', linewidth=1.8, zorder=3)
        ax.add_patch(circulo)
        ax.text(coord[0], coord[1], p["codigo"], color='white', weight='bold', fontsize=9, ha='center', va='center', zorder=4)
        
        # Etiqueta alterna arriba / abajo para legibilidad
        y_off = 0.70 if i % 2 == 0 else -0.70
        etiqueta = f"{p['nombre']}\n$C_B'={c_b_norm[i]:.2f}$ · Demanda={p['afluencia']:.2f}\n{'Refuerzo prioritario' if es_critico else 'Ruta normal'}"
        box_bg = '#FEF2F2' if es_critico else '#F0F9FF'
        box_border = '#F87171' if es_critico else '#38BDF8'
        
        ax.text(coord[0], coord[1] + y_off, etiqueta, fontsize=7.2, ha='center', va='center', weight='bold',
                color='#0F172A',
                bbox=dict(boxstyle='round,pad=0.3', facecolor=box_bg, edgecolor=box_border, alpha=0.92), zorder=5)

    estado_obras = "Estado: Cierre activo en La Gran Vía (Tramo Portoazul – UniNorte)" if cierre_gran_via else "Estado: Flujo normal en ambas calzadas"
    ax.set_title(f"Red del Corredor Universitario (Cra. 51B - 15 Paraderos)\n{estado_obras}",
                 fontsize=11, weight='bold', pad=15, color='#0F172A')
    ax.set_xlim(-0.5, 16.0)
    ax.set_ylim(-0.2, 6.2)
    ax.set_aspect('equal')
    ax.axis('off')
    plt.tight_layout()
    if filename:
        plt.savefig(filename, dpi=300)
    return fig
