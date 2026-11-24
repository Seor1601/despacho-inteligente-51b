"""
Pruebas automáticas del motor discreto (casos con resultado conocido).

Ejecutar desde la raíz del repositorio:
    python -m unittest discover -s tests -v

Solo usa la biblioteca estándar (unittest) + NumPy.
"""

import os
import sys
import unittest
from math import comb

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor_discreto import (  # noqa: E402
    A_6, PARADEROS_6, PARADEROS_15, ARISTAS_15_BASE, obtener_grafo_15,
    calcular_distancias_y_caminos_bfs, calcular_centralidades,
    PerceptronRosenblatt, simular_impacto_despacho, comparar_estrategias,
)


def centralidades(A):
    d, s, p = calcular_distancias_y_caminos_bfs(A)
    return (d, s) + tuple(calcular_centralidades(A, d, s, p))


class TestSubgrafo6Nodos(unittest.TestCase):
    """Caso de 6 nodos resuelto a mano (informe, secciones 2 a 4)."""

    def setUp(self):
        self.D, self.sigma, self.cd, self.sum_d, self.cc, self.cb, self.cbn, self.pares = centralidades(A_6)

    def test_matriz_distancias_bfs(self):
        D_mano = np.array([
            [0, 1, 1, 2, 3, 4],
            [1, 0, 2, 1, 2, 3],
            [1, 2, 0, 1, 2, 3],
            [2, 1, 1, 0, 1, 2],
            [3, 2, 2, 1, 0, 1],
            [4, 3, 3, 2, 1, 0],
        ])
        np.testing.assert_array_equal(self.D, D_mano)

    def test_caminos_empatados(self):
        # Dos geodésicas entre v1 y v4, y entre v2 y v3
        self.assertEqual(self.sigma[0, 3], 2)
        self.assertEqual(self.sigma[1, 2], 2)
        empates = [x for x in self.pares if abs(x["fraccion"] - 0.5) < 1e-12]
        self.assertEqual(len(empates), 8)

    def test_grado_y_cercania(self):
        np.testing.assert_array_equal(self.cd, [2, 2, 2, 3, 2, 1])
        np.testing.assert_allclose(self.cc, [5 / 11, 5 / 9, 5 / 9, 5 / 7, 5 / 9, 5 / 13])

    def test_intermediacion_freeman(self):
        np.testing.assert_allclose(self.cb, [0.5, 1.5, 1.5, 6.5, 4.0, 0.0])
        np.testing.assert_allclose(self.cbn, np.array([0.5, 1.5, 1.5, 6.5, 4.0, 0.0]) / comb(5, 2))

    def test_conservacion_intermediacion(self):
        # Identidad: sum_v C_B(v) = sum_{s<t} (d(s,t) - 1)
        n = A_6.shape[0]
        esperado = sum(self.D[s, t] - 1 for s in range(n) for t in range(s + 1, n))
        self.assertAlmostEqual(float(np.sum(self.cb)), float(esperado))


class TestPerceptron(unittest.TestCase):
    """Traza a mano de las épocas 1 y 2 (informe, sección 6)."""

    def setUp(self):
        _, _, _, _, _, _, cbn, _ = centralidades(A_6)
        self.X = np.column_stack([cbn, [p["afluencia"] for p in PARADEROS_6]])
        self.y = np.array([p["y"] for p in PARADEROS_6])
        self.modelo = PerceptronRosenblatt(learning_rate=0.5, b_init=-1.0)
        self.convergio, self.epocas = self.modelo.fit(self.X, self.y)

    def test_converge_en_epoca_2(self):
        self.assertTrue(self.convergio)
        self.assertEqual(self.epocas, 2)
        self.assertEqual(self.modelo.history[0]["total_error"], 3)
        self.assertEqual(self.modelo.history[1]["total_error"], 0)

    def test_pesos_finales(self):
        np.testing.assert_allclose(self.modelo.w, [0.2, 0.6], atol=1e-12)
        self.assertAlmostEqual(self.modelo.b, -0.5)

    def test_z_de_la_muestra_4_epoca_1(self):
        z4 = self.modelo.history[0]["logs"][3]["z"]
        self.assertAlmostEqual(z4, 0.075 * 0.65 + 0.475 * 0.80 - 0.5)

    def test_clasifica_las_6_muestras(self):
        pred = [self.modelo.predict(x) for x in self.X]
        np.testing.assert_array_equal(pred, self.y)


class TestRed15Nodos(unittest.TestCase):

    def test_estructura(self):
        self.assertEqual(len(PARADEROS_15), 15)
        self.assertEqual(len(ARISTAS_15_BASE), 20)
        _, A = obtener_grafo_15(cierre_gran_via=True)
        self.assertEqual(int(A.sum()) // 2, 19)

    def test_cierre_sube_intermediacion_san_jose(self):
        _, A_n = obtener_grafo_15(False)
        _, A_c = obtener_grafo_15(True)
        cbn_n = centralidades(A_n)[6]
        cbn_c = centralidades(A_c)[6]
        self.assertAlmostEqual(round(cbn_n[4], 3), 0.016)
        self.assertAlmostEqual(round(cbn_c[4], 3), 0.240)


class TestSimulacion(unittest.TestCase):

    def setUp(self):
        _, A = obtener_grafo_15(False)
        self.cbn = centralidades(A)[6]
        self.pred = [1 if 0.2 * self.cbn[i] + 0.6 * p["afluencia"] - 0.5 >= 0 else 0
                     for i, p in enumerate(PARADEROS_15)]

    def test_sin_refuerzo_no_cambia_nada(self):
        sim = simular_impacto_despacho(PARADEROS_15, [0] * 15)
        self.assertAlmostEqual(sim["tiempo_espera_promedio_estatico"], sim["tiempo_espera_promedio_dinamico"])
        self.assertEqual(sim["pasajeros_salvados_sobrecupo"], 0)

    def test_perceptron_elige_cuatro_paraderos(self):
        codigos = [PARADEROS_15[i]["codigo"] for i in range(15) if self.pred[i]]
        self.assertEqual(codigos, ["P02", "P07", "P09", "P12"])

    def test_perceptron_no_es_peor_que_el_azar(self):
        res = {e["estrategia"]: e for e in comparar_estrategias(PARADEROS_15, self.cbn, self.pred)}
        modelo = res["Perceptrón (modelo)"]
        azar = [v for k, v in res.items() if "azar" in k][0]
        self.assertLessEqual(modelo["pasajeros_rechazados"], azar["pasajeros_rechazados"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
