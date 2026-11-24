"""
PROYECTO FINAL - MATEMÁTICAS DISCRETAS (MAT 4021)
UNIVERSIDAD DEL NORTE - DOCENTE: MSc. IVÁN GÓMEZ
TEMA: Modelado de Redes en Grafos Geodésicos y Clasificación Lineal con Perceptrón de Rosenblatt
CASO DE ESTUDIO: Optimización del Despacho de Refuerzo en el Corredor Universitario (Cra 51B)
                 frente al impacto vial de las obras de 'La Gran Vía'.

Autores: Equipo de Investigación Estudiantil
Lenguaje: Python 3.10+ (NumPy + Matplotlib) - CERO librerías de caja negra
"""

import sys
import os
import json
import socket
import urllib.parse
import webbrowser
from http.server import HTTPServer, ThreadingHTTPServer, SimpleHTTPRequestHandler
import numpy as np
import matplotlib.pyplot as plt

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from motor_discreto import (
    PARADEROS_6, A_6,
    PARADEROS_15, ARISTAS_15_BASE, ARISTA_CIERRE_GRAN_VIA, obtener_grafo_15,
    calcular_distancias_y_caminos_bfs, calcular_centralidades,
    PerceptronRosenblatt, simular_impacto_despacho, comparar_estrategias,
    graficar_red_topologica, graficar_frontera_decision, graficar_red_15
)

WEB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")


# =============================================================================
# ENCODER JSON PARA OBJETOS NUMPY
# =============================================================================

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float64, np.float32, np.float16)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)


# =============================================================================
# SERVIDOR HTTP LOCAL Y CONTROLADOR DE API CON ENCABEZADOS ANTI-CACHÉ
# =============================================================================

class NoCacheHTTPRequestHandler(SimpleHTTPRequestHandler):
    """Manejador base con encabezados anti-caché estrictos para evitar carga de assets obsoletos."""
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


class PerceptronParametrico(PerceptronRosenblatt):
    """Subclase que conserva pesos iniciales personalizados al invocar fit() sin alterar motor_discreto.py."""
    def __init__(self, n_features=2, learning_rate=0.5, w_init=(0.0, 0.0), b_init=-1.0, max_epochs=20):
        super().__init__(n_features=n_features, learning_rate=learning_rate, b_init=b_init, max_epochs=max_epochs)
        self.w_init = np.array(w_init, dtype=float)
        self.w = self.w_init.copy()

    def reset(self):
        super().reset()
        self.w = self.w_init.copy()


class AcademicAppHandler(NoCacheHTTPRequestHandler):
    """Manejador HTTP que sirve el frontend web estático y expone endpoints JSON."""

    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".svg": "image/svg+xml",
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/data":
            self.enviar_datos_completos()
        elif parsed.path == "/api/recalculate":
            query_params = urllib.parse.parse_qs(parsed.query)
            es_cierre = query_params.get("cierre", ["false"])[0].lower() in ["true", "1", "yes"]
            self.manejar_recalculo_red(es_cierre)
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/train-perceptron":
            self.manejar_entrenamiento_perceptron()
        elif self.path == "/api/simulate":
            self.manejar_simulacion_impacto()
        else:
            self.send_error(404, "Endpoint no encontrado")

    def enviar_datos_completos(self):
        """Genera el payload unificado con las métricas del grafo de 6 y 15 nodos."""
        try:
            # 1. Caso 6 nodos
            dist_6, sigma_6, pred_6 = calcular_distancias_y_caminos_bfs(A_6)
            cd_6, sum_d_6, cc_6, cb_6, cb_norm_6, pares_6 = calcular_centralidades(A_6, dist_6, sigma_6, pred_6)
            
            X_6 = np.zeros((6, 2), dtype=float)
            y_6 = np.array([p["y"] for p in PARADEROS_6], dtype=int)
            for i in range(6):
                X_6[i, 0] = cb_norm_6[i]
                X_6[i, 1] = PARADEROS_6[i]["afluencia"]
                
            p_base = PerceptronRosenblatt(n_features=2, learning_rate=0.5, b_init=-1.0, max_epochs=20)
            p_base.fit(X_6, y_6)

            # 2. Caso 15 nodos (Normal y Cierre)
            aristas_n, A_n = obtener_grafo_15(cierre_gran_via=False)
            dist_n, sig_n, pred_n = calcular_distancias_y_caminos_bfs(A_n)
            cd_n, sum_n, cc_n, cb_n, cb_norm_n, _ = calcular_centralidades(A_n, dist_n, sig_n, pred_n)
            preds_n = [p_base.predict(np.array([cb_norm_n[i], PARADEROS_15[i]["afluencia"]])) for i in range(15)]

            aristas_c, A_c = obtener_grafo_15(cierre_gran_via=True)
            dist_c, sig_c, pred_c = calcular_distancias_y_caminos_bfs(A_c)
            cd_c, sum_c, cc_c, cb_c, cb_norm_c, _ = calcular_centralidades(A_c, dist_c, sig_c, pred_c)
            preds_c = [p_base.predict(np.array([cb_norm_c[i], PARADEROS_15[i]["afluencia"]])) for i in range(15)]

            sim_n = simular_impacto_despacho(PARADEROS_15, preds_n, horas_simulacion=10, buses_refuerzo=4)
            sim_n["estrategias"] = comparar_estrategias(PARADEROS_15, cb_norm_n, preds_n)

            payload = {
                "paraderos_6": PARADEROS_6,
                "A_6": A_6,
                "dist_6": dist_6,
                "centralidades_6": {
                    "cd": cd_6, "sum_dist": sum_d_6, "cc": cc_6, "cb": cb_6, "cb_norm": cb_norm_6
                },
                "pares_empate_6": [p for p in pares_6 if p["fraccion"] == 0.5],
                "perceptron_6": {
                    "w": p_base.w,
                    "b": p_base.b,
                    "epochs": len(p_base.history),
                    "history": p_base.history
                },
                "paraderos_15": PARADEROS_15,
                "aristas_15_base": ARISTAS_15_BASE,
                "arista_cierre": ARISTA_CIERRE_GRAN_VIA,
                "centralidades_15_normal": {
                    "cd": cd_n, "cc": cc_n, "cb_norm": cb_norm_n, "predicciones": preds_n
                },
                "centralidades_15_cierre": {
                    "cd": cd_c, "cc": cc_c, "cb_norm": cb_norm_c, "predicciones": preds_c
                },
                "simulacion_base": sim_n
            }

            body = json.dumps(payload, cls=NumpyEncoder).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            self.send_error(500, f"Error generando datos: {str(e)}")

    def manejar_entrenamiento_perceptron(self):
        try:
            content_len = int(self.headers.get('Content-Length', 0))
            raw_data = self.rfile.read(content_len)
            params = json.loads(raw_data.decode('utf-8'))

            eta = float(params.get("eta", 0.50))
            b_init = float(params.get("b_init", -1.00))
            w_init_param = params.get("w_init")
            if isinstance(w_init_param, (list, tuple)) and len(w_init_param) >= 2:
                w1_init = float(w_init_param[0])
                w2_init = float(w_init_param[1])
            else:
                w1_init = float(params.get("w1_init", 0.00))
                w2_init = float(params.get("w2_init", 0.00))
            max_epochs = int(params.get("max_epochs", 20))

            dist_6, sigma_6, pred_6 = calcular_distancias_y_caminos_bfs(A_6)
            _, _, _, _, cb_norm_6, _ = calcular_centralidades(A_6, dist_6, sigma_6, pred_6)
            
            X = np.zeros((6, 2), dtype=float)
            y = np.array([p["y"] for p in PARADEROS_6], dtype=int)
            for i in range(6):
                X[i, 0] = cb_norm_6[i]
                X[i, 1] = PARADEROS_6[i]["afluencia"]

            perceptron = PerceptronParametrico(
                n_features=2,
                learning_rate=eta,
                w_init=(w1_init, w2_init),
                b_init=b_init,
                max_epochs=max_epochs,
            )
            convergencia, epocas = perceptron.fit(X, y)
            m, k = perceptron.obtener_ecuacion_frontera()

            resp = {
                "convergencia": convergencia,
                "epocas": epocas,
                "w": perceptron.w,
                "b": perceptron.b,
                "pendiente_m": m,
                "corte_k": k,
                "history": perceptron.history
            }

            body = json.dumps(resp, cls=NumpyEncoder).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (ValueError, json.JSONDecodeError) as e:
            self.send_error(400, f"Parámetros inválidos: {str(e)}")
        except Exception as e:
            self.send_error(500, f"Error en entrenamiento: {str(e)}")

    def manejar_recalculo_red(self, es_cierre=False):
        """Recalcula en tiempo real las distancias BFS y centralidades de la red de 15 paradas."""
        try:
            aristas, A_15 = obtener_grafo_15(cierre_gran_via=es_cierre)
            dist_15, sig_15, pred_15 = calcular_distancias_y_caminos_bfs(A_15)
            cd_15, sum_15, cc_15, cb_15, cb_norm_15, _ = calcular_centralidades(A_15, dist_15, sig_15, pred_15)

            # Clasificación canónica del perceptrón: 0.20 * cb + 0.60 * afl - 0.50 >= 0
            preds = [1 if (0.20 * cb_norm_15[i] + 0.60 * PARADEROS_15[i]["afluencia"] - 0.50 >= 0) else 0 for i in range(15)]

            resp = {
                "cierre_gran_via": es_cierre,
                "aristas": aristas,
                "cd": cd_15,
                "sum_dist": sum_15,
                "cc": cc_15,
                "cb": cb_15,
                "cb_norm": cb_norm_15,
                "predicciones": preds
            }

            body = json.dumps(resp, cls=NumpyEncoder).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            self.send_error(500, f"Error recalculando red: {str(e)}")

    def manejar_simulacion_impacto(self):
        try:
            content_len = int(self.headers.get('Content-Length', 0))
            raw_data = self.rfile.read(content_len)
            params = json.loads(raw_data.decode('utf-8'))

            buses = int(params.get("buses_refuerzo", 4))
            cap = int(params.get("capacidad_bus", 40))
            horas = int(params.get("horas_simulacion", 10))
            es_cierre = bool(params.get("cierre_gran_via", False))

            _, A_15 = obtener_grafo_15(cierre_gran_via=es_cierre)
            d_15, s_15, p_15 = calcular_distancias_y_caminos_bfs(A_15)
            _, _, _, _, cb_norm_15, _ = calcular_centralidades(A_15, d_15, s_15, p_15)

            # Predicciones personalizadas si fueron enviadas por el cliente, de lo contrario canónicas
            preds = params.get("predicciones")
            if not preds or len(preds) != 15:
                preds = [1 if (0.20 * cb_norm_15[i] + 0.60 * PARADEROS_15[i]["afluencia"] - 0.50 >= 0) else 0 for i in range(15)]

            sim = simular_impacto_despacho(PARADEROS_15, preds, horas_simulacion=horas, buses_refuerzo=buses, capacidad_bus=cap)
            sim["estrategias"] = comparar_estrategias(PARADEROS_15, cb_norm_15, preds, horas_simulacion=horas,
                                                      buses_refuerzo=buses, capacidad_bus=cap)

            body = json.dumps(sim, cls=NumpyEncoder).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (ValueError, json.JSONDecodeError) as e:
            self.send_error(400, f"Parámetros inválidos: {str(e)}")
        except Exception as e:
            self.send_error(500, f"Error en simulación: {str(e)}")

    def log_message(self, format, *args):
        # Silenciar logs ruidosos de peticiones estáticas en consola para mantener la salida limpia
        pass


# =============================================================================
# EJECUCIÓN MATEMÁTICA EN CONSOLA (RÚBRICA DE EVALUACIÓN)
# =============================================================================

def ejecutar_demostracion_6_nodos():
    """Ejecuta la prueba analítica con resultado conocido (Subgrafo Diamante de 6 nodos)."""
    print("\n" + "=" * 80)
    print("FASE 1: SUBGRAFO DE PRUEBA CON RESULTADO CONOCIDO (6 PARADEROS - RÚBRICA)")
    print("=" * 80)
    
    N = len(PARADEROS_6)
    
    # 1. Matriz de Adyacencia
    print("\n--- 1.1. MATRIZ DE ADYACENCIA BINARIA A(G) ---")
    encabezado = "      " + "  ".join([f"v{i+1}" for i in range(N)])
    print(encabezado)
    for i in range(N):
        fila = f"v{i+1}   [" + "   ".join(map(str, A_6[i])) + "]"
        print(fila)

    # 2. Matriz de Distancias Geodésicas D
    dist_matrix, sigma, predecessors = calcular_distancias_y_caminos_bfs(A_6)
    print("\n--- 1.2. MATRIZ DE DISTANCIAS GEODÉSICAS D (MEDIANTE BFS POR CAPAS) ---")
    print(encabezado)
    for i in range(N):
        fila = f"v{i+1}   [" + "   ".join(map(str, dist_matrix[i])) + "]"
        print(fila)

    # 3. Centralidades de Freeman
    c_d, sum_dist, c_c, c_b, c_b_norm, pares_eval = calcular_centralidades(A_6, dist_matrix, sigma, predecessors)
    
    print("\n--- 1.3. TABLA CONSOLIDADA DE MÉTRICAS DE CENTRALIDAD ---")
    print(f"{'Nodo':<6} {'Paradero':<22} {'Grado (CD)':<12} {'Dist Sum':<10} {'Cercanía (CC)':<15} {'Intermed (CB)':<15} {'CB Normalizado (CB\')':<20}")
    print("-" * 105)
    for i in range(N):
        p = PARADEROS_6[i]
        print(f"{p['codigo']:<6} {p['nombre']:<22} {c_d[i]:<12} {sum_dist[i]:<10} {c_c[i]:<15.3f} {c_b[i]:<15.2f} {c_b_norm[i]:<20.2f}")
    print("-" * 105)
    print("Nota: C_B'(v) normalizado sobre C(n-1, 2) = C(5, 2) = 10 pares no dirigidos.")

    # 4. Desglose analítico de caminos empatados
    print("\n--- 1.4. DESGLOSE MATEMÁTICO DE CAMINOS EMPATADOS (FRACCIONES 0.50) ---")
    pares_empate = [item for item in pares_eval if item["fraccion"] == 0.5]
    print(f"{'Par (s, t)':<16} {'Geodésicas sigma_st':<20} {'Pasa por v':<14} {'sigma_st(v)':<12} {'Aporte fraccionario':<22}")
    print("-" * 84)
    for item in pares_empate:
        s_nom = PARADEROS_6[item["par"][0]]["codigo"]
        t_nom = PARADEROS_6[item["par"][1]]["codigo"]
        v_nom = PARADEROS_6[item["nodo"]]["codigo"]
        print(f"Par ({s_nom}, {t_nom}){' ':<6} {item['total_geodesicas']:<20} {v_nom:<14} {item['caminos_con_v']:<12} {item['fraccion']:<22.2f}")
    print("-" * 84)
    print("Demostración de suma analítica de intermediación C_B(v):")
    print("  • v1 (Campestre):   0.50 (del par v2, v3) = 0.50 -> C_B' = 0.50/10 = 0.05")
    print("  • v2 (Portoazul):   0.50 + 0.50 + 0.50 (pares v1-v4, v1-v5, v1-v6) = 1.50 -> C_B' = 0.15")
    print("  • v3 (UniNorte):    0.50 + 0.50 + 0.50 (pares v1-v4, v1-v5, v1-v6) = 1.50 -> C_B' = 0.15")
    print("  • v4 (Makro):       0.50 (par v2, v3) + 6 * 1.0 (rutas únicas arteriales) = 6.50 -> C_B' = 0.65")
    print("  • v5 (UniAtlántico): 4 * 1.0 (todos los caminos hacia v6) = 4.00 -> C_B' = 0.40")
    print("  • v6 (Retorno Sur): Vértice hoja terminal (grado 1) = 0.00 -> C_B' = 0.00")

    # 5. Entrenamiento del Perceptrón
    X = np.zeros((N, 2), dtype=float)
    y = np.array([p["y"] for p in PARADEROS_6], dtype=int)
    for i in range(N):
        X[i, 0] = c_b_norm[i]
        X[i, 1] = PARADEROS_6[i]["afluencia"]

    print("\n--- 1.5. ENTRENAMIENTO DETERMINISTA DEL PERCEPTRÓN DE ROSENBLATT (eta = 0.5) ---")
    print("Inicialización: w = [0.0, 0.0]^T, b = -1.0 (Umbral de inercia operativa)")
    perceptron = PerceptronRosenblatt(n_features=2, learning_rate=0.5, b_init=-1.0, max_epochs=20)
    convergencia, total_epocas = perceptron.fit(X, y)

    for hist in perceptron.history:
        ep = hist["epoch"]
        err = hist["total_error"]
        print(f"\n=== ÉPOCA {ep} (Error Total = {err}) ===")
        print(f"{'Muestra':<8} {'x = [CB\', Afl]':<18} {'y':<4} {'z':<12} {'y_hat':<6} {'e':<6} {'Delta w':<20} {'Nuevo w':<20} {'Nuevo b':<10}")
        print("-" * 110)
        for log in hist["logs"]:
            idx = log["sample_idx"] + 1
            x_str = f"[{log['x'][0]:.2f}, {log['x'][1]:.2f}]"
            z_val = log["z"]
            y_t = log["y_true"]
            y_h = log["y_hat"]
            e = log["error"]
            dw = log["delta_w"]
            dw_str = f"[{dw[0]:+.3f}, {dw[1]:+.3f}]"
            w_str = f"[{log['w'][0]:.3f}, {log['w'][1]:.3f}]"
            b_val = log["b"]
            print(f"p_{idx:<6} {x_str:<18} {y_t:<4} {z_val:<12.3f} {y_h:<6} {e:<6} {dw_str:<20} {w_str:<20} {b_val:<10.3f}")

    if convergencia:
        w1, w2 = perceptron.w
        b = perceptron.b
        m, k = perceptron.obtener_ecuacion_frontera()
        print(f"\nConvergencia exacta alcanzada en época {total_epocas} con error total = 0")
        print(f"Vector de pesos aprendido: w = [{w1:.4f}, {w2:.4f}]^T, Sesgo b = {b:.4f}")
        print(f"Frontera de decisión lineal: {w1:.4f} * CB' + {w2:.4f} * Afluencia {b:+.4f} = 0")
        print(f"Frontera en el plano R^2: Afluencia = ({m:.4f}) * CB' + ({k:.4f})")

    # 6. Generación de gráficos en fondo blanco para el documento LaTeX
    graficar_red_topologica(A_6, c_b_norm, PARADEROS_6, y, "grafo_red_51b.png")
    graficar_frontera_decision(X, y, perceptron, PARADEROS_6, "frontera_decision_perceptron.png")
    plt.close('all')
    print("\nGráficos exportados exitosamente en fondo blanco: 'grafo_red_51b.png' y 'frontera_decision_perceptron.png'")
    
    return perceptron


def ejecutar_demostracion_15_nodos(perceptron):
    """Ejecuta el análisis a escala real del Corredor Universitario (15 paraderos)."""
    print("\n" + "=" * 80)
    print("FASE 2: RED ESCALADA DEL CORREDOR UNIVERSITARIO (15 PARADEROS REALES)")
    print("=" * 80)
    
    # Caso A: Flujo Normal
    aristas_norm, A_norm = obtener_grafo_15(cierre_gran_via=False)
    d_norm, s_norm, p_norm = calcular_distancias_y_caminos_bfs(A_norm)
    cd_n, _, cc_n, cb_n, cb_norm_n, _ = calcular_centralidades(A_norm, d_norm, s_norm, p_norm)

    # Caso B: Cierre Vial en Obras de La Gran Vía
    aristas_cierre, A_cierre = obtener_grafo_15(cierre_gran_via=True)
    d_cie, s_cie, p_cie = calcular_distancias_y_caminos_bfs(A_cierre)
    cd_c, _, cc_c, cb_c, cb_norm_c, _ = calcular_centralidades(A_cierre, d_cie, s_cie, p_cie)

    print(f"\n{'Cód':<5} {'Paradero':<26} {'Afl':<6} {'CB\' Normal':<12} {'CB\' Cierre':<12} {'Delta CB\'':<12} {'Acción Perceptrón':<24}")
    print("-" * 102)
    
    preds_normal = []
    for i, p in enumerate(PARADEROS_15):
        x_vec = np.array([cb_norm_n[i], p["afluencia"]])
        y_hat = perceptron.predict(x_vec)
        preds_normal.append(y_hat)
        delta_cb = cb_norm_c[i] - cb_norm_n[i]
        estado = "Refuerzo prioritario (y=1)" if y_hat == 1 else "Ruta normal (y=0)"
        print(f"{p['codigo']:<5} {p['nombre']:<26} {p['afluencia']:<6.2f} {cb_norm_n[i]:<12.3f} {cb_norm_c[i]:<12.3f} {delta_cb:<+12.3f} {estado:<24}")
    print("-" * 102)
    
    # Simulación de impacto operativo
    print("\n--- 2.1. EVALUACIÓN DE IMPACTO OPERATIVO: ANTES VS. DESPUÉS ---")
    sim = simular_impacto_despacho(PARADEROS_15, preds_normal, horas_simulacion=10, buses_refuerzo=4)
    print(f"Ventana de Simulación Evaluada: {sim['horas_simulacion']} horas pico continuas")
    print(f"Pasajeros Totales Movilizados: {sim['total_pasajeros_simulados']:,} usuarios")
    print(f"Tiempo Medio de Espera (Estático Tradicional): {sim['tiempo_espera_promedio_estatico']:.1f} minutos")
    print(f"Tiempo Medio de Espera (Dinámico con IA Discreta): {sim['tiempo_espera_promedio_dinamico']:.1f} minutos")
    print(f">> REDUCCIÓN LOGRADA EN TIEMPO DE ESPERA: {sim['reduccion_tiempo_espera_pct']:.1f}%")
    print(f">> HORAS-HOMBRE DE ESPERA AHORRADAS EN EL CORREDOR: {sim['horas_pasajero_ahorradas']:.1f} horas-pasajero\n")
    print(f"Tasa de Pasajeros Rechazados por Sobrecupo (Estático): {sim['rechazo_promedio_estatico']:.1f}%")
    print(f"Tasa de Pasajeros Rechazados por Sobrecupo (Dinámico): {sim['rechazo_promedio_dinamico']:.1f}%")
    print(f">> REDUCCIÓN EN TASA DE SOBRECUPO: {sim['reduccion_rechazo_pct']:.1f}%")
    print(f">> PASAJEROS ADICIONALES QUE LOGRAN ABORDAR: +{sim['pasajeros_salvados_sobrecupo']:,}")
    print("Nota: 'Antes' y 'Después' usan la misma fórmula; solo cambia dónde se ponen los 4 buses de refuerzo.")
    print("-" * 102)

    # Línea base justa: misma cantidad de buses, distintas reglas de asignación
    print("\n--- 2.2. COMPARACIÓN CONTRA LÍNEAS BASE (MISMOS 4 BUSES, MISMA FÓRMULA) ---")
    print(f"{'Estrategia':<42} {'Espera (min)':>13} {'Rechazo (%)':>12} {'Rechazados (10 h)':>18}   Paraderos")
    print("-" * 110)
    for e in comparar_estrategias(PARADEROS_15, cb_norm_n, preds_normal):
        print(f"{e['estrategia']:<42} {e['espera_media']:>13.1f} {e['rechazo_medio']:>12.1f} "
              f"{e['pasajeros_rechazados']:>18,.0f}   {', '.join(e['paraderos'])}")
    print("-" * 110)

    # Escenario de cierre: qué paraderos elegiría el perceptrón
    preds_cierre = [perceptron.predict(np.array([cb_norm_c[i], PARADEROS_15[i]["afluencia"]])) for i in range(15)]
    sel_cierre = [PARADEROS_15[i]["codigo"] for i in range(15) if preds_cierre[i] == 1]
    print(f"\nCon cierre Portoazul–UniNorte P4 el perceptrón elige: {', '.join(sel_cierre)}")
    z_sj = 0.2 * cb_norm_c[4] + 0.6 * PARADEROS_15[4]["afluencia"] - 0.5
    print(f"Colegio San José (P05): C_B' {cb_norm_n[4]:.3f} -> {cb_norm_c[4]:.3f}, z = {z_sj:+.3f} (queda bajo la frontera)")


def iniciar_servidor_web(puerto=8080):
    """Inicia el servidor HTTP local y abre automáticamente la interfaz web en el navegador."""
    # Reutilizar dirección en caso de reinicio rápido y atender peticiones concurrentes
    class CustomServer(ThreadingHTTPServer):
        allow_reuse_address = True
        daemon_threads = True

    httpd = None
    puerto_seleccionado = puerto
    for p in range(puerto, puerto + 10):
        try:
            server_address = ('', p)
            httpd = CustomServer(server_address, AcademicAppHandler)
            puerto_seleccionado = p
            break
        except OSError:
            continue

    if httpd is None:
        raise OSError(f"No se pudo enlazar ningún puerto entre {puerto} y {puerto + 9}")

    url = f"http://localhost:{puerto_seleccionado}"
    print("\n" + "=" * 80)
    print(f"APLICACIÓN WEB ACADÉMICA INICIADA EN: {url}")
    print("Abriendo navegador automáticamente... (Presione Ctrl+C para detener)")
    print("=" * 80 + "\n")

    webbrowser.open(url)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor web finalizado por el usuario.")
    finally:
        httpd.server_close()


def main():
    print("=" * 80)
    print("SISTEMA INTELIGENTE DE PRIORIZACIÓN DE DESPACHO - CORREDOR CRA. 51B")
    print("MATEMÁTICAS DISCRETAS (MAT 4021) - UNIVERSIDAD DEL NORTE")
    print("Algoritmos: BFS Geodésico + Centralidades Freeman + Perceptrón Rosenblatt")
    print("=" * 80)
    
    # 1. Ejecutar demostración analítica de 6 nodos (desk test de la rúbrica)
    perceptron = ejecutar_demostracion_6_nodos()
    
    # 2. Ejecutar demostración a escala real de 15 nodos (Corredor Cra. 51B)
    ejecutar_demostracion_15_nodos(perceptron)
    
    # 3. Iniciar el servidor web local y abrir el navegador en localhost:8080
    #    (python main.py --sin-web ejecuta solo la parte de consola)
    if "--sin-web" in sys.argv:
        return
    iniciar_servidor_web(puerto=8080)


if __name__ == "__main__":
    main()
