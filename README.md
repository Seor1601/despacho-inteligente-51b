# Proyecto Final Matemáticas Discretas — Grupo 3
## ¿A qué paraderos mandar el bus de refuerzo?
### Teoría de grafos y un perceptrón para aliviar la espera en la Carrera 51B

**Curso:** Matemáticas Discretas (MAT 4021) · Universidad del Norte · Prof. MSc. Iván Gómez  
**Grupo:** Grupo 3 — César Berrio Remolina · Gabriela Campo Sandoval · Samuel Ortega Rodríguez  
**Lenguaje:** Python 3.10+ con NumPy y Matplotlib. Los algoritmos (BFS, Freeman y perceptrón) están escritos desde cero, sin librerías de grafos ni de *machine learning*.

| Recurso | Enlace |
|---|---|
| Repositorio | https://github.com/Seor1601/despacho-inteligente-51b |
| Aplicación web (versión estática, sin instalar nada) | https://estaciondecontrolmatematicasdiscretas.netlify.app/ |
| Documento escrito (Informe) | [informe.pdf](informe.pdf) |
| Diapositivas (Sustentación) | [presentacion.pdf](presentacion.pdf) |

---

## 1. Problema

Las obras de *La Gran Vía* redujeron calzadas en el Corredor Universitario (Cra. 51B, Barranquilla – Puerto Colombia) y alargaron la espera de los buses (Sobusa, Coolitoral, Transmetro U30). El programa responde una pregunta concreta: **si hay *B* buses de refuerzo vacíos, ¿a qué paraderos conviene enviarlos?**

## 2. Cómo ejecutarlo

```bash
pip install numpy matplotlib
python main.py            # consola + figuras + aplicación web en http://localhost:8080
python main.py --sin-web  # solo la parte de consola
python -m unittest discover -s tests -v   # pruebas automáticas (14)
```

Si el puerto 8080 está ocupado, el servidor prueba con 8081 a 8089.

### Entradas y salidas

| | Contenido |
|---|---|
| **Entrada** | Lista de aristas del grafo, afluencia normalizada $x_2$ de cada paradero, si el tramo P04–P07 está cerrado, parámetros del perceptrón ($\eta$, $\mathbf{w}^{(0)}$, $b^{(0)}$) y de la simulación (sección 6). Todo está en `motor_discreto.py`. |
| **Salida (consola)** | Matrices $A$ y $D$ del caso de 6 nodos, tabla de centralidades, los 8 empates de 0.5, traza del perceptrón por época, tabla de los 15 paraderos (normal y con cierre), resultados de la simulación y tabla de líneas base. |
| **Salida (archivos)** | `grafo_red_51b.png` y `frontera_decision_perceptron.png`. |
| **Salida (web)** | Mapa de los 15 paraderos con cierre vial en vivo, BFS por capas, tablas de Freeman, entrenamiento del perceptrón e impacto con líneas base. |

La versión de Netlify no tiene servidor Python: el navegador ejecuta las mismas fórmulas (BFS, Freeman, perceptrón y simulación) en `web/app.js`. Verificamos que los valores de $C_B'$ y las tablas de la simulación coinciden con los de Python.

## 3. Datos

### 3.1 Caso de prueba con resultado conocido (6 nodos)

$G=(V,E)$ con $E=\{(v_1,v_2),(v_1,v_3),(v_2,v_4),(v_3,v_4),(v_4,v_5),(v_5,v_6)\}$. Los nodos $\{v_1,v_2,v_3,v_4\}$ forman un ciclo $C_4$ que genera caminos más cortos empatados.

| Vértice | Paradero | Afluencia $x_2$ | Etiqueta $y$ | $C_B$ | $C_B'=C_B/\binom{5}{2}$ |
|---|---|---|---|---|---|
| $v_1$ | Club Campestre | 0.20 | 0 | 0.5 | 0.05 |
| $v_2$ | Clínica Portoazul | 0.70 | 0 | 1.5 | 0.15 |
| $v_3$ | UniNorte Puerta 4 | 0.95 | 1 | 1.5 | 0.15 |
| $v_4$ | Makro / Transversal | 0.80 | 1 | 6.5 | 0.65 |
| $v_5$ | UniAtlántico / Colegios | 0.55 | 0 | 4.0 | 0.40 |
| $v_6$ | Retorno Sur 51B | 0.15 | 0 | 0.0 | 0.00 |

### 3.2 Red del corredor (15 paraderos, 20 aristas)

| Código | Paradero | Afluencia $x_2$ | $C_B'$ normal | $C_B'$ con cierre | Decisión |
|---|---|---|---|---|---|
| P01 | Circunvalar / Cra 51B | 0.40 | 0.000 | 0.000 | normal |
| P02 | Makro / Transversal 51B | 0.80 | 0.159 | 0.165 | **refuerzo** |
| P03 | Le Champ / Villa Santos | 0.50 | 0.022 | 0.090 | normal |
| P04 | Clínica Portoazul | 0.70 | 0.225 | 0.163 | normal |
| P05 | Colegio San José | 0.60 | 0.016 | 0.240 | normal |
| P06 | UniNorte Puerta 2 | 0.65 | 0.104 | 0.167 | normal |
| P07 | UniNorte Puerta 4 | 0.95 | 0.489 | 0.377 | **refuerzo** |
| P08 | Colegio Británico | 0.55 | 0.038 | 0.128 | normal |
| P09 | UniLibre (Sede Norte) | 0.85 | 0.537 | 0.537 | **refuerzo** |
| P10 | Uni. Antonio Nariño | 0.50 | 0.115 | 0.115 | normal |
| P11 | Club Campestre | 0.25 | 0.293 | 0.293 | normal |
| P12 | UniAtlántico (Km 7) | 0.90 | 0.178 | 0.178 | **refuerzo** |
| P13 | Villa Campestre Bulevar | 0.60 | 0.077 | 0.077 | normal |
| P14 | Corredor Caujaral | 0.30 | 0.152 | 0.152 | normal |
| P15 | Entrada Puerto Colombia | 0.35 | 0.000 | 0.000 | normal |

**Aristas (tramos viales no dirigidos):**
P01–P02, P02–P03, P02–P04, P03–P06, P04–P05, **P04–P07 (tramo en obra que se puede cerrar)**, P05–P07, P05–P08, P06–P07, P07–P08, P07–P09, P08–P09, P09–P10, P09–P11, P10–P12, P11–P12, P11–P13, P12–P14, P13–P14, P14–P15.

### 3.3 Qué es la afluencia y de dónde sale

$x_2\in[0,1]$ es un **índice relativo de demanda en hora pico** asignado por el grupo a cada paradero. No es un conteo medido. Se construyó comparando el tipo de lugar que atiende cada paradero (campus universitario grande, colegio, zona residencial o extremo de ruta) y se normalizó dejando el paradero más concurrido (UniNorte Puerta 4) cerca de 1. En la simulación se convierte en pasajeros por hora con $\lambda_i = 120\,x_{2,i}$.

**Limitación:** con conteos reales de pasajeros (por ejemplo, de Transmetro o del AMB) bastaría con reemplazar estos valores en `PARADEROS_15`.

### 3.4 Etiquetas del perceptrón

Las etiquetas $y$ del caso de 6 nodos (refuerzo en UniNorte P4 y Makro) son una **regla definida por el grupo**, no datos observados. El perceptrón aprende la recta que separa esa regla, y la convierte en una fórmula explícita que se puede aplicar a paraderos nuevos. Con otras etiquetas se obtendría otra frontera.

## 4. Modelo matemático

- **Grafo:** $G=(V,E)$ no dirigido y sin pesos. Vértice = paradero y arista = tramo de vía entre dos paraderos consecutivos.
- **BFS por capas:** da la matriz de distancias $D$ y el número de caminos más cortos $\sigma_{st}$.
- **Centralidades de Freeman:**
  - $C_D(v)=\sum_u A_{vu}$
  - $C_C(v)=\dfrac{n-1}{\sum_u d(v,u)}$
  - $C_B(v)=\sum_{s<t,\ s\neq v\neq t}\dfrac{\sigma_{st}(v)}{\sigma_{st}}$ y $C_B'(v)=C_B(v)/\binom{n-1}{2}$
- **Perceptrón de Rosenblatt:** $\mathbf{x}=[C_B',x_2]^\top$, $\hat y=\mathbb{1}[\mathbf{w}^\top\mathbf{x}+b\ge 0]$ y, cuando se equivoca, $\Delta\mathbf{w}=\eta(y-\hat y)\mathbf{x}$, $\Delta b=\eta(y-\hat y)$. Con $\eta=0.5$, $\mathbf{w}^{(0)}=\mathbf{0}$ y $b^{(0)}=-1$ converge en la época 2: $0.2\,C_B'+0.6\,x_2-0.5=0$.

> **Sobre la convergencia:** el teorema de Novikoff garantiza que el perceptrón termina en un número finito de actualizaciones si los datos son linealmente separables. No dice que lo haga en la época 2. Que haya convergido solo muestra que **estos 6 puntos con estas etiquetas** son separables.

> **Supuesto de la intermediación:** $C_B$ asume que se viaja entre todos los pares de paraderos por el camino más corto. Los viajes reales siguen las rutas de cada empresa y tienen orígenes y destinos desiguales. Una mejora sería ponderar cada par $(s,t)$ con una matriz origen-destino.

### Algoritmos y complejidad ($n$ vértices, $m$ aristas)

```
BFS-CAPAS(A, s):                          # O(n^2) con matriz de adyacencia
    d[s] ← 0 ; σ[s] ← 1 ; cola ← [s]
    mientras cola no vacía:
        u ← sacar(cola)
        para cada v con A[u][v] = 1:
            si d[v] = ∞:        d[v] ← d[u]+1 ; σ[v] ← σ[u] ; meter(cola, v)
            si d[v] = d[u]+1:   σ[v] ← σ[v] + σ[u]        (empate de geodésicas)

INTERMEDIACIÓN(A):
    para cada s: BFS-CAPAS(A, s)                          # O(n^3) en total
    para cada par s<t y cada v ∉ {s,t}:
        si d[s][v] + d[v][t] = d[s][t]:  C_B[v] += σ[s][v]·σ[v][t] / σ[s][t]

PERCEPTRÓN(X, y):                          # O(épocas · N · 2)
    repetir hasta error = 0 (máx. 20 épocas):
        para cada (x_i, y_i): ŷ ← [w·x_i + b ≥ 0] ; e ← y_i − ŷ ; w ← w + η e x_i ; b ← b + η e
```

Para $n=15$ todo se calcula en milisegundos. La versión en Python reconstruye explícitamente cada geodésica para mostrar los empates. La versión web usa la identidad $\sigma_{st}(v)=\sigma_{sv}\sigma_{vt}$ y ambas dan el mismo resultado.

## 5. Validación con resultado conocido

`tests/test_motor.py` comprueba automáticamente, contra el cálculo hecho a mano:

- La matriz $D$, $\sigma_{v_1v_4}=\sigma_{v_2v_3}=2$ y los 8 aportes de 0.5.
- $C_D$, $C_C$, $C_B=[0.5,1.5,1.5,6.5,4,0]$ y la identidad $\sum_v C_B(v)=\sum_{s<t}(d(s,t)-1)$.
- El perceptrón: 3 errores en la época 1, 0 en la época 2, $\mathbf{w}=[0.2,0.6]$, $b=-0.5$ y $z_4=-0.071$.
- La red de 15 nodos: 20 aristas, 19 con el cierre, y $C_B'$ de San José de 0.016 a 0.240.
- La simulación: sin refuerzo no cambia nada, y el perceptrón no es peor que repartir al azar.

## 6. Simulación de impacto (antes vs. después)

Modelo de flujo **determinista** por paradero y por hora. **Todos los escenarios usan la misma fórmula**; lo único que cambia es a qué paraderos van los buses de refuerzo.

| Parámetro (`SIM_PARAMS`) | Valor | Significado |
|---|---|---|
| `tasa_max_pax_h` | 120 | pasajeros/hora en un paradero con $x_2=1$ |
| `buses_regulares_h` | 4 | frecuencia regular (1 bus cada 15 min) |
| `capacidad_bus` | 40 | sillas por bus |
| `ocupacion_previa` | 0.7 | sillas libres al llegar: $r_i=\text{clip}(1-0.7\,x_2,\ 0.15,\ 0.95)$ |
| `fraccion_parada` | 0.4 | fracción de buses regulares que se detiene |
| `headway_min` / `espera_extra_min` | 15 / 35 | espera $W_i = 15 + 35\,p_i$, donde $p_i$ es la fracción rechazada |
| `buses_refuerzo` | 4 | cada uno aporta 40 sillas/hora al paradero asignado |
| `horas_simulacion` | 10 | horas de operación evaluadas (supuesto); solo escala los totales, no cambia los porcentajes |

Rechazo: $p_i=\max\!\big(0,\ \lambda_i-(K_i+R_i)\big)/\lambda_i$, donde $K_i=4\cdot 40\cdot r_i\cdot 0.4$ es el cupo regular y $R_i$ son las sillas de refuerzo. Los valores son **supuestos del grupo** y se pueden cambiar en `motor_discreto.py`.

### Resultados y línea base justa (mismos 4 buses, misma fórmula)

| Estrategia | Paraderos reforzados | Espera media | Rechazo medio | Rechazados en 10 h |
|---|---|---|---|---|
| Sin refuerzo (actual) | — | 28.8 min | 39.4 % | 5 216 |
| **Perceptrón** | P02, P07, P09, P12 | **25.2 min** | **29.2 %** | **3 616** |
| Top-4 por afluencia | P02, P07, P09, P12 | 25.2 min | 29.2 % | 3 616 |
| Top-4 por intermediación $C_B'$ | P04, P07, P09, P11 | 26.0 min | 31.3 % | 4 016 |
| Repartir entre los 15 | todos | 25.3 min | 29.5 % | 4 043 |
| 4 paraderos al azar (promedio exacto de las 1 365 combinaciones) | — | 26.0 min | 31.4 % | 4 221 |

**Cómo leer la tabla:**

- Frente a no hacer nada, la regla del perceptrón reduce la espera media un **12.4 %** y los pasajeros rechazados un **30.7 %** (1 600 personas más logran subir en 10 h).
- Frente a enviar los mismos buses a 4 paraderos al azar, evita **605 rechazos más**. Frente a repartirlos entre todos, evita **427 más**.
- **Con estos datos, el perceptrón elige los mismos 4 paraderos que la regla "mayor afluencia".** En este escenario la intermediación no cambia la decisión. Sí la cambiaría en paraderos con afluencia parecida y centralidad distinta. Por ejemplo, con el cierre vial San José queda en $z=-0.092$, y bastaría una afluencia de 0.76 para que lo marcara.
- El simulador **no modela la red**: cada paradero se evalúa por separado. Por eso no puede premiar la centralidad. Un modelo que propague la ocupación de los buses a lo largo de las rutas sería el siguiente paso.

## 7. Escenario de cierre vial

Al quitar la arista P04–P07, el BFS se recalcula y la intermediación se redistribuye. Las mayores subidas son las de San José (0.016 → 0.240), Británico (0.038 → 0.128) y Le Champ (0.022 → 0.090). Aun así, el perceptrón mantiene los mismos 4 paraderos de refuerzo.

## 8. Limitaciones

1. La afluencia es un índice estimado por el grupo, no un conteo.
2. Las etiquetas $y$ del entrenamiento son una regla del grupo, y el entrenamiento usa solo 6 muestras.
3. El grafo no tiene pesos (no usa tiempos de viaje) y las coordenadas de los paraderos son aproximadas.
4. La intermediación supone viajes uniformes entre todos los pares por el camino más corto.
5. El simulador es estático, evalúa cada paradero por separado y sus parámetros son supuestos.

## 9. Estructura del repositorio

```
├── main.py              # Punto de entrada: consola, figuras y servidor web (localhost:8080)
├── motor_discreto.py    # BFS, Freeman, perceptrón, simulación y líneas base
├── tests/
│   └── test_motor.py    # 14 pruebas automáticas (unittest)
└── web/
    ├── index.html       # Interfaz (Leaflet, Chart.js, KaTeX por CDN)
    ├── app.js           # Mismas fórmulas en el navegador + visualización
    ├── styles.css
    └── assets/          # Ilustraciones de la interfaz
```

## 10. Referencias

- Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C. (2009). *Introduction to algorithms* (3.ª ed.). MIT Press.
- Freeman, L. C. (1977). A set of measures of centrality based on betweenness. *Sociometry, 40*(1), 35–41. https://doi.org/10.2307/3033543
- Novikoff, A. B. J. (1962). On convergence proofs on perceptrons. *Proceedings of the Symposium on the Mathematical Theory of Automata, 12*, 615–622.
- Rosenblatt, F. (1958). The perceptron: A probabilistic model for information storage and organization in the brain. *Psychological Review, 65*(6), 386–408. https://doi.org/10.1037/h0042519
