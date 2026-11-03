# Mundos Imaginarios IA - Taller SENA

Programa de consola en Node.js que genera bocetos visuales de mundos imaginarios para estudios de videojuegos. A partir de una situación, un mundo y 5 colores recibidos por argumentos de consola, el programa genera un archivo de datos estructurado (JSON), consulta un modelo de lenguaje de IA para redactar la descripción artística de la escena en inglés, y luego envía esa descripción a un modelo de generación visual para crear y guardar la imagen final en formato JPG.

---

## 1. Características Principales

- **Entorno Nativo Moderno:** Desarrollado sin frameworks, sin librerías pesadas (sin Axios, sin Dotenv, sin SDKs externos). Utiliza Node.js 20.12+ con `process.loadEnvFile()` y `fetch` nativo.
- **Identificadores Únicos y Deterministas:** Emplea `object-hash` para crear un identificador ID de 8 caracteres basado únicamente en la situación, el mundo y los colores.
- **Ahorro de Cuota y Caché Inteligente:** Antes de llamar a los modelos de IA, verifica si los archivos de texto o imagen ya existen con `fs.existsSync`. Si ya existen, reutiliza su contenido y ahorra créditos gratuitos.
- **Manejo Seguro de Secretos:** Las claves de API se cargan desde `.env` y nunca se exponen en el código ni en los mensajes de consola.

---

## 2. Estructura del Proyecto

```text
mundos-ia/
├── data/                         # Archivos JSON guardados por mundo (<id>.json)
├── descripciones/                # Descripciones en texto generadas por el LLM (<id>.txt)
├── imagenes/                     # Imágenes finales generadas por el modelo visual (<id>.jpg)
├── src/
│   ├── index.js                  # Orquesta los 3 pasos y gestiona errores globales
│   ├── mundo.js                  # Valida argumentos, calcula el ID y guarda/lee el JSON
│   ├── texto.js                  # Realiza el fetch al modelo de lenguaje (Mistral Large)
│   └── imagen.js                 # Realiza el fetch al modelo de imágenes (FLUX.1)
├── .env                          # Credenciales reales (protegido por .gitignore)
├── .env.example                  # Plantilla de variables de entorno para Git
├── .gitignore                    # Reglas de exclusión para Git
├── EXPLICACION.md                # Guía pedagógica detallada paso a paso
├── package.json                  # Metadatos del proyecto y scripts
└── README.md                     # Documentación principal del taller
```

---

## 3. Servicios y APIs Utilizadas

1. **Modelo de Lenguaje (Texto):**  
   - **Servicio:** NVIDIA NIM / Mistral AI  
   - **Modelo:** `mistralai/mistral-large-4-1t-a52b` (o compatible OpenAI en `https://integrate.api.nvidia.com/v1/chat/completions`)  
   - **Documentación:** [NVIDIA API Catalog](https://build.nvidia.com/)
2. **Modelo de Generación Visual (Imagen):**  
   - **Servicio:** Black Forest Labs / NVIDIA NIM  
   - **Modelo:** `black-forest-labs/flux.1-dev` (o `flux.1-schnell`)  
   - **Documentación:** [NVIDIA FLUX Model](https://build.nvidia.com/black-forest-labs/flux1-dev)

---

## 4. Instalación y Configuración

### Requisitos Previos
- Node.js versión 20.12 o superior (`node -v`).
- npm instalado (`npm -v`).

### Pasos de Configuración
1. Clonar el repositorio o ubicarse en la carpeta raíz del proyecto.
2. Instalar la única dependencia externa permitida (`object-hash`):
   ```bash
   npm install
   ```
3. Configurar las variables de entorno:
   Copiar el archivo `.env.example` a un nuevo archivo llamado `.env`:
   ```bash
   cp .env.example .env
   ```
4. Abrir `.env` y colocar las claves reales:
   ```env
   TEXTO_API_KEY=tu_clave_de_nvidia
   TEXTO_URL=https://integrate.api.nvidia.com/v1/chat/completions
   TEXTO_MODELO=mistralai/mistral-large-4-1t-a52b
   IMAGEN_API_KEY=tu_clave_de_nvidia
   IMAGEN_URL=https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev
   ```

---

## 5. Modo de Uso

El programa recibe exactamente 7 argumentos:
1. `"<situación>"` (entre comillas)
2. `"<mundo>"` (entre comillas)
3. `<color1>`
4. `<color2>`
5. `<color3>`
6. `<color4>`
7. `<color5>`

### Ejemplo de Ejecución:
```bash
npm start -- "Una tormenta electrica amenaza la ciudad flotante" "Aeropolis, un archipielago de islas que flotan sobre las nubes" rojo azul verde dorado violeta
```

### Salida esperada en consola (Primera ejecución):
```text
Paso 1: mundo guardado en data/mundo_4bec90d8.json
Paso 2: descripcion guardada en descripciones/mundo_4bec90d8.txt
Paso 3: imagen guardada en imagenes/mundo_4bec90d8.jpg
Listo. Revisa la carpeta imagenes/
```

### Salida esperada en consola (Segunda ejecución con los mismos datos):
```text
Paso 1: mundo guardado en data/mundo_4bec90d8.json
Paso 2: la descripcion ya existia, no se llamo al modelo de texto.
Paso 3: la imagen ya existia, no se llamo al modelo de imagenes.
Listo. Revisa la carpeta imagenes/
```

---

## 6. Experimento con .gitignore y Publicación (`npm publish --dry-run`)

Siguiendo la Parte 6 de la guía del taller, se realizó la prueba de simulación de publicación en npm:

1. **Con archivo `.gitignore` activo:**  
   Al ejecutar `npm publish --dry-run`, npm respeta las reglas de `.gitignore`. Los archivos y carpetas sensibles (`.env`, `node_modules/`, `data/`, `descripciones/`, `imagenes/`) son ignorados por completo y quedan fuera del paquete.
2. **Renombrando `.gitignore` a `.gitignore.off`:**  
   Al repetir la simulación sin el archivo `.gitignore`, npm incluye automáticamente el archivo `.env` con las claves secretas y todas las carpetas generadas.  
   **¿Por qué es peligroso?**  
   Si se publica un paquete sin un `.gitignore` o `.npmignore` adecuado, las claves privadas de producción y las API keys quedan expuestas públicamente a nivel mundial en el registro de npm, permitiendo que terceros consuman tus créditos o vulneren tus servicios.

---

## 7. Preguntas de Reflexión (Sesiones 0 a 5)

### 1. ¿Por qué el id se calcula sin la fecha? ¿Qué pasaría si la incluyeras?
El `id` se calcula utilizando un hash únicamente sobre la situación, el nombre del mundo y los cinco colores para que sea **determinista**. Esto garantiza que si el usuario introduce los mismos datos en momentos distintos, el ID resultante sea exactamente idéntico. Si incluyéramos la fecha (`creadoEn`), el hash cambiaría en cada milisegundo de ejecución, produciendo un nuevo ID cada vez y haciendo imposible reutilizar los archivos de texto e imagen ya generados, agotando innecesariamente la cuota gratuita de las APIs.

### 2. ¿Por qué se le pide al modelo de texto la descripción en inglés? Si puedes, prueba con una en español y compara las imágenes.
Los modelos de generación de imágenes por difusión (como FLUX o Stable Diffusion) fueron entrenados mayoritariamente con bancos de imágenes etiquetados en idioma inglés. Al proporcionar la descripción en inglés, el modelo interpreta con mayor precisión los conceptos artísticos, las composiciones de luz, los planos y los nombres de los colores, logrando una representación visual mucho más fiel y detallada que con prompts en otros idiomas.

### 3. ¿Qué diferencia hay entre una respuesta JSON de texto y una respuesta con los bytes de una imagen? ¿Qué es base64?
Una respuesta JSON de texto contiene caracteres estructurados en formato legible (UTF-8) organizados en claves y valores, los cuales se parsean directamente como cadenas u objetos. Por el contrario, una imagen es un archivo binario compuesto por una secuencia de bytes arbitrarios (0 a 255) que representan píxeles comprimidos. **Base64** es un esquema de codificación que permite representar datos binarios crudos utilizando únicamente 64 caracteres ASCII imprimibles, lo cual permite transportar imágenes de forma segura dentro de respuestas de texto o JSON sin que se corrompan por problemas de codificación.

### 4. ¿Qué pasaría si guardas la imagen con `'utf-8'`? ¿Por qué?
Si intentas guardar los bytes de una imagen usando la codificación `'utf-8'` en `fs.writeFileSync(ruta, datos, 'utf-8')`, Node.js interpretará la secuencia de bytes binarios como texto y reemplazará secuencias de bytes inválidas según la especificación Unicode con caracteres de reemplazo (como `\uFFFD`). Esto altera de forma irreversible la cabecera y el cuerpo del archivo JPG o PNG, corrompiendo la estructura binaria y haciendo que el visor de imágenes no pueda abrir el archivo.

### 5. ¿Qué pasos consumen cuota gratuita y cómo evitaste repetirlos?
Los pasos que consumen cuota son el **Paso 2** (la llamada HTTP al modelo de lenguaje para generar la descripción) y el **Paso 3** (la llamada HTTP al modelo de imágenes para sintetizar la fotografía). Se evitó repetirlos implementando una verificación previa con `fs.existsSync` sobre las rutas `descripciones/mundo_<id>.txt` e `imagenes/mundo_<id>.jpg`: si el archivo ya existe en el disco, el programa salta la petición a la red y lee directamente el contenido local.

### 6. Si usaste IA: ¿qué fue lo más difícil de pedirle y qué parte tuviste que corregir tú?
Lo más desafiante fue restringir a la IA para que respetara estrictamente el límite de herramientas vistas en clase (evitando que importara librerías como Axios, Dotenv o frameworks no permitidos) y calibrar el prompt del sistema para que devolviera un único párrafo conciso en inglés respetando los cinco colores exactos sin agregar títulos ni adornos markdown. 