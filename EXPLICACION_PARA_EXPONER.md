# Guía sencilla para explicar VotoIA al profesor

Esta es una guía para comprender el código y defender decisiones técnicas. **Las conclusiones estadísticas se escribirán después del entrenamiento real.**

## ¿Cuál es el problema de clasificación?

En la cédula ficticia del PDF hay cuatro elecciones en columnas y ocho organizaciones por columna. Una persona puede dibujar cruces y aspas de formas distintas; algunas cruzan dentro del recuadro, otras fuera. La **red clasifica la forma y ubicación de una marca manuscrita**, no a qué partido pertenece ni quién ganó. El conteo por partido se hace con Python, usando la casilla que el usuario seleccionó.

**Respuesta para «¿por qué dibujar en lugar de seleccionar un menú?»**: para recolectar escritura real de diferentes personas y evaluar cómo la red reconoce trazos variables y confusos. El objetivo es entrenar un clasificador de dibujos y estudiar sus errores. Un menú no proporciona dibujos manuscritos con los cuales evaluar la red.

## Cómo se conecta con el código del profesor

| Elemento | En `letras_uni` | En VotoIA |
|---|---|---|
| `main.py` | Flask recibe dibujos de U, N, I | Flask recibe las cuatro categorías de marcas |
| `myCanvas` | 200 × 200 para dibujar letra | 200 × 200 para dibujar una marca dentro/fuera de un cuadro |
| Borrar | `clearRect` | limpia el dibujo seleccionado y vuelve a dibujar el marco |
| Enviar | canvas → base64 → `POST /upload` | el mismo flujo, con nombre de clase elegido manualmente |
| Directorios | carpetas `U`, `N`, `I` | carpetas `aspa_valida`, `cruz_valida`, etc. |
| ResNet50 | pesos ImageNet para clasificar imagen de ejemplo | los mismos pesos para extraer características y nuevas capas para cuatro clases |

El original se conserva en `referencia_profesor/main_original.py`, para poder compararlo directamente.

## Breve explicación del servidor Flask

- `@app.get('/')`: carga la pantalla sencilla: categoría, canvas, borrar y guardar.
- `@app.post('/upload')`: recibe `myImage` y la categoría `numero`, decodifica el PNG de base64, verifica su tamaño (200×200) y lo guarda en `dataset/categoria/`.
- `@app.post('/api/registrar-voto')`: al tener un modelo ya entrenado, evalúa marcas seleccionadas por el usuario y registra cada columna como válida provisional, blanca o pendiente.
- `@app.post('/api/revisar')`: un compañero revisa los casos pendientes.
- `@app.get('/api/resultados')`: cuenta el número de votos en cada columna, sin utilizar una nueva red.

## Explicación de entrenamiento sin tecnicismos innecesarios

1. Comprimimos manualmente dataset/ y subimos el ZIP de las cuatro carpetas a Colab.
2. Convertimos cada PNG de 200×200 a RGB de 224×224, tamaño utilizado por ResNet50 en clase.
3. Usamos `preprocess_input` porque así lo hace el profesor al usar ResNet50 preentrenada.
4. Dividimos las imágenes en entrenamiento (70%), validación (15%) y prueba (15%).
5. Cargamos `ResNet50(weights='imagenet', include_top=False)`. **`include_top=False`** significa que quitamos su última capa, diseñada para 1000 clases distintas de nuestras marcas.
6. `base.trainable = False` conserva los pesos ya aprendidos; entrenamos solo la parte que añadimos, simplificando la práctica.
7. `GlobalAveragePooling2D` resume los mapas de características, como se explicó en el notebook del profesor.
8. `Dense(64, activation='relu')` combina las características.
9. `Dense(4, activation='softmax')` produce cuatro puntuaciones (una por categoría).
10. `model.fit()` ajusta pesos a partir de las imágenes reales; `model.predict()` clasifica dibujos nuevos.

**Por qué no entrenamos desde cero:** una red grande necesita muchos datos y tiempo; utilizar una ResNet50 preentrenada coincide con lo mostrado en clase.

## ¿Qué significan las métricas?

- **Accuracy**: proporción total de imágenes correctamente clasificadas.
- **Precisión**: de las imágenes clasificadas como una categoría, cuántas pertenecían realmente a ella.
- **Recall**: de los ejemplos reales de una categoría, cuántos encontró el modelo.
- **F1-score**: resumen de precisión y recall.
- **Matriz de confusión**: tabla que muestra qué clases se confunden con otras.

No afirmar que el modelo es mejor que personas hasta hacer un estudio con ambos. El valor de softmax de 0.80 es un umbral académico inicial, no una prueba de validez electoral.

## División posible para la exposición

- Persona 1: problema, cédula y justificación del dibujo.
- Persona 2: servidor Flask, canvas, etiquetado manual y dataset.
- Persona 3: notebook, ResNet50 y cambios respecto al código del profesor.
- Persona 4: métricas, casos que pasan a revisión humana y limitaciones.

**Todos deben conocer la idea general**, porque el profesor puede preguntar por cualquier archivo.

## Advertencias para no prometer demasiado

- La aplicación clasifica dibujos digitales de un canvas, **no** analiza fotografías de cédulas físicas.
- No se entrenó con datos hasta que ustedes ejecuten el notebook.
- Los cuatro cargos son independientes. Un partido ganador en una columna no implica ganarlo en las demás.
- Los votos ambiguos se revisan manualmente; la clasificación no determina efectos electorales reales.
- Es un simulador educativo. No se debe presentar como herramienta utilizada o aprobada por una autoridad electoral.
