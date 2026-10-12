# VotoIA — versión sencilla

Proyecto universitario para clasificar marcas dibujadas a mano. Recolecta los PNG localmente y entrena en Google Colab.

## Ejecutar en Windows y VS Code

Abre esta carpeta en VS Code. En la terminal PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe main.py
```

Abre http://127.0.0.1:5000. Mantén la terminal abierta; Ctrl+C detiene el servidor. No necesitas TensorFlow para recolectar.

## Recolectar dibujos

1. Selecciona la categoría y dibuja en el lienzo.
2. Pulsa **Guardar dibujo**. El lienzo se limpia para continuar.
3. Pulsa **Borrar** si quieres corregirlo antes de guardar.

Cambiar la categoría limpia el lienzo. Se rechazan dibujos vacíos y se muestran los conteos. Las carpetas se crean automáticamente, igual que las carpetas de letras del proyecto del profesor:

```text
dataset/
├── aspa_valida/
├── cruz_valida/
├── interseccion_fuera/
└── marca_diferente/
```

| Categoría | Qué dibujar |
|---|---|
| `aspa_valida` | X con intersección dentro del recuadro |
| `cruz_valida` | + con intersección dentro del recuadro |
| `interseccion_fuera` | X o + con intersección fuera del recuadro |
| `marca_diferente` | Círculo, visto, garabato u otra marca |

Cada dibujo es un PNG de 200 × 200 con fondo blanco, marco negro y nombre único. El marco permite aprender si la intersección está dentro o fuera.

Reúne 500–1000 dibujos originales por categoría, de varias personas. Revisa las imágenes en el Explorador y elimina manualmente los ejemplos incorrectos. Recarga la página para actualizar los conteos. `data/muestras.csv` registra la categoría y la fecha; el notebook no depende de él. Si borras un PNG manualmente, su fila permanece en ese registro.

## Comprimir manualmente y entrenar en Colab

1. Abre la carpeta del proyecto en el Explorador de Windows.
2. Haz clic derecho sobre **dataset** → **Comprimir en archivo ZIP**. También puede aparecer **Enviar a → Carpeta comprimida (en zip)**.
3. Abre Google Colab y carga `notebooks/Entrenamiento_VotoIA_ResNet50.ipynb`.
4. Habilita una GPU en **Entorno de ejecución → Cambiar tipo de entorno de ejecución**.
5. Ejecuta las celdas en orden y sube tu `dataset.zip` en la celda de carga.
6. Entrena y revisa las curvas, accuracy, precision, recall, F1 y matriz de confusión.
7. Descarga `modelo_voto.keras` y `classes.json` y cópialos a `models/`.

Sube el ZIP de **dataset**, no el ZIP del código del proyecto. El notebook acepta `dataset/` con las cuatro subcarpetas o las cuatro carpetas directamente en el ZIP.

La página ya no genera ZIP ni archivos X.npy/y.npy. El entrenamiento usa directamente los PNG por categoría.

## Simulación después de entrenar

Se mantienen **Simulación**, **Revisión** y **Resultados**. La cédula aparece en la simulación, donde seleccionas una casilla y dibujas su marca.

Para usar el modelo en tu PC, instala además:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-ml.txt
```

Reinicia `main.py` después de copiar el modelo. Sin el modelo se pueden recolectar dibujos, pero no se predicen marcas. Los casos pendientes se revisan manualmente.

## Archivos principales

- `main.py`: servidor Flask, guardado de PNG y simulación.
- `config.py`: categorías y configuración de cédula.
- `templates/recolectar.html` y `static/recolectar.js`: página sencilla de recolección.
- `templates/index.html` y `static/app.js`: simulación.
- `notebooks/Entrenamiento_VotoIA_ResNet50.ipynb`: entrenamiento en Colab.
- `referencia_profesor/main_original.py`: original conservado para comparación.
- `EXPLICACION_PARA_EXPONER.md`: guía para explicar el proyecto.

## Verificar el código

```powershell
.\.venv\Scripts\python.exe scripts/validar_archivos.py
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Práctica educativa con dibujos digitales y cédula ficticia. Las métricas se obtienen al entrenar. No analiza fotografías de cédulas físicas ni determina legalmente la validez de un voto.
