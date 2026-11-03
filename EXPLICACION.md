# Guía Pedagógica y Explicación Detallada del Proyecto
## Taller: Mundos Imaginarios con Node.js e Inteligencia Artificial
**Instructor SENA - Regional / Centro de Formación**

---

## 1. Introducción al Taller

¡Bienvenido, aprendiz! En este taller consolidamos todo lo aprendido en las sesiones 0 a 5 de Node.js. El objetivo principal es construir una herramienta de consola profesional (`mundos-ia`) que automatiza el flujo creativo de un estudio de videojuegos:
1. Recibe por parámetros de terminal una **situación**, un **nombre de mundo** y **5 colores**.
2. Almacena la información en un archivo estructurado `data/mundo_<id>.json`.
3. Consulta una API de Inteligencia Artificial de texto (NVIDIA Mistral Large) para redactar un prompt en inglés y lo guarda en `descripciones/mundo_<id>.txt`.
4. Envía esa descripción a una API de Inteligencia Artificial de imagen (NVIDIA FLUX.1) para generar y guardar el arte conceptual en `imagenes/mundo_<id>.jpg`.
5. Si los archivos ya existen, **reutiliza el contenido local** para no gastar créditos gratuitos.

---

## 2. Mapa de Conceptos Vistos en Clase y su Aplicación

| Tema del Taller | Módulo de Node.js / Recurso | ¿Dónde y para qué se usa? |
|---|---|---|
| **Lectura de argumentos** | `process.argv` | En `src/index.js` y `src/mundo.js` para capturar los 7 parámetros de entrada. |
| **Sistema modular** | `require` / `module.exports` | CommonJS para separar la lógica en `mundo.js`, `texto.js`, `imagen.js` e `index.js`. |
| **Rutas relativas seguras** | `path.join(__dirname, ...)` | Construir rutas independientes del directorio donde se ejecute el comando. |
| **Persistencia de archivos** | `fs.writeFileSync`, `fs.readFileSync` | Guardar y leer los archivos `.json`, `.txt` e imágenes binarias en disco. |
| **Comprobación de existencia** | `fs.existsSync`, `fs.mkdirSync` | Crear carpetas si no existen y verificar si ya existe la descripción o la imagen (caché). |
| **Identificador determinista** | Paquete `object-hash` | Calcular un hash único de 8 caracteres con `{ situacion, mundo, colores }` sin fecha. |
| **Variables de entorno** | `process.loadEnvFile()` | Cargar las credenciales desde el archivo `.env` de forma nativa en Node 20.12+. |
| **Peticiones HTTP asíncronas** | `fetch` nativo + `AbortSignal.timeout` | Consumir las APIs REST de NVIDIA NIM con control de tiempo de espera sin librerías externas. |
| **Conversión binaria** | `Buffer.from(textoBase64, 'base64')` | Transformar el texto base64 devuelto por la API en un Buffer de imagen JPG real. |
| **Control de errores** | `try / catch` + `process.exitCode = 1` | Capturar excepciones, mostrar mensajes claros en español y salir limpiamente. |

---

## 3. Desglose Archivo por Archivo (Bloque por Bloque)

### A. Archivo `src/mundo.js`
*Responsabilidad:* Recibir los argumentos, validar los requerimientos de entrada, generar el ID único del mundo y guardar/leer el archivo JSON.

* **Bloque 1 (Importación de dependencias):**  
  Carga los módulos nativos `fs` y `path`, junto con el paquete externo `object-hash`.  
  Permite interactuar con el disco, manejar rutas y generar hashes alfanuméricos.

* **Bloque 2 (Validación de cantidad y contenido de argumentos):**  
  Verifica que el arreglo `args` contenga exactamente 7 elementos y que ninguno esté vacío o solo con espacios.  
  Si la validación falla, lanza un error con un ejemplo didáctico de cómo invocar el comando.

* **Bloque 3 (Validación de colores únicos):**  
  Normaliza cada color a minúsculas y comprueba mediante un ciclo que no haya repetidos.  
  Garantiza que la paleta artística del mundo imaginario tenga 5 tonos completamente diferenciados.

* **Bloque 4 (Cálculo del ID único con `object-hash`):**  
  Calcula el hash SHA sobre un objeto que solo contiene situación, mundo y colores, tomando los primeros 8 caracteres.  
  No incluye la fecha para que el hash sea determinista y permita reutilizar archivos generados anteriormente.

* **Bloque 5 (Función `guardarMundo`):**  
  Crea la carpeta `data/` si no existe y guarda el objeto serializado con `JSON.stringify(..., null, 2)`.  
  Devuelve la ruta absoluta del archivo creado para su posterior consulta.

* **Bloque 6 (Función `leerMundo`):**  
  Lee el archivo `.json` desde el disco mediante `fs.readFileSync` con codificación UTF-8.  
  Transforma la cadena de texto a un objeto JavaScript con `JSON.parse` cumpliendo la regla de no reutilizar variables de memoria.

* **Bloque 7 (Exportación CommonJS):**  
  Expone las funciones `crearMundo`, `guardarMundo` y `leerMundo` a través de `module.exports`.  
  Permite que `index.js` las consuma de forma limpia y desacoplada.

---

### B. Archivo `src/texto.js`
*Responsabilidad:* Enviar los datos del mundo en formato JSON a la API del modelo de lenguaje (Mistral Large) y guardar la descripción generada.

* **Bloque 1 (Importación y validación de variables de entorno):**  
  Importa `fs` y `path`, y verifica que `TEXTO_API_KEY`, `TEXTO_URL` y `TEXTO_MODELO` estén configuradas.  
  Previene fallos en tiempo de ejecución avisando al usuario si olvidó configurar su `.env`.

* **Bloque 2 (Configuración del System Prompt):**  
  Define el mensaje de sistema instruyendo a la IA a describir una imagen en un solo párrafo en inglés de 80 a 120 palabras.  
  Exige mencionar los 5 colores obligatorios y prohíbe títulos, markdown o texto escrito dentro del lienzo visual.

* **Bloque 3 (Consumo HTTP con `fetch` nativo):**  
  Envía una solicitud POST con el cuerpo serializado y una señal de cancelación `AbortSignal.timeout(30000)`.  
  Asegura que el programa no quede bloqueado indefinidamente si el servicio de IA tarda más de 30 segundos.

* **Bloque 4 (Manejo de códigos de estado HTTP):**  
  Evalúa los códigos HTTP (401/403 para credenciales inválidas, 402/429 para cuotas, 404/410 para rutas o modelos extintos).  
  Lanza errores descriptivos en español acordes a la rúbrica del taller antes de procesar el cuerpo.

* **Bloque 5 (Procesamiento y validación del texto recibido):**  
  Extrae el texto de `datos.choices[0].message.content`, comprueba que no llegue vacío y aplica `slice(0, 1500)` si supera el límite.  
  Crea la carpeta `descripciones/` y guarda el texto en `descripciones/mundo_<id>.txt` retornando la descripción.

---

### C. Archivo `src/imagen.js`
*Responsabilidad:* Enviar la descripción artística del mundo al modelo de difusión visual (FLUX.1) y guardar el archivo binario JPG.

* **Bloque 1 (Importación y validación del entorno de imagen):**  
  Carga `fs` y `path`, y comprueba la existencia de `IMAGEN_API_KEY` e `IMAGEN_URL` en las variables de entorno.  
  Garantiza que la clave y la URL de NVIDIA NIM estén disponibles antes de emitir la petición de red.

* **Bloque 2 (Construcción del Payload para FLUX):**  
  Configura dimensiones estándar de 1024x1024, semilla en 0 (aleatoria) y pasos rápidos de generación.  
  Añade los parámetros compatibles (`mode` y `cfg_scale`) si se utiliza la versión `flux.1-dev`.

* **Bloque 3 (Envío con `fetch` y timeout de 60 segundos):**  
  Realiza la petición POST a la API de imágenes aplicando `AbortSignal.timeout(60000)`.  
  Otorga un margen de tiempo superior a la petición de texto debido al alto consumo computacional de la síntesis de imagen.

* **Bloque 4 (Validación de respuesta y extracción de Base64):**  
  Valida códigos HTTP y verifica que `finishReason` sea `"SUCCESS"` en el arreglo `artifacts`.  
  Extrae la cadena de caracteres en formato base64 que codifica la imagen JPEG devuelta por la API.

* **Bloque 5 (Conversión a Buffer binario y guardado en disco):**  
  Convierte la cadena base64 en datos binarios crudos mediante `Buffer.from(textoBase64, 'base64')`.  
  Crea la carpeta `imagenes/` y escribe el archivo `mundo_<id>.jpg` con `fs.writeFileSync` **sin** pasar codificación UTF-8.

---

### D. Archivo `src/index.js`
*Responsabilidad:* Orquestador principal del flujo del programa, control de caché y captura de errores sin trazas confusas.

* **Bloque 1 (Carga de variables de entorno):**  
  Ejecuta `process.loadEnvFile()` al inicio del ciclo de vida de la aplicación.  
  Lee las variables del archivo local `.env` sin necesidad del paquete externo `dotenv`.

* **Bloque 2 (Importación modular):**  
  Importa las funciones exportadas de `mundo.js`, `texto.js` e `imagen.js`.  
  Mantiene el código desacoplado y facilita el mantenimiento y prueba individual de cada componente.

* **Bloque 3 (Orquestación del Paso 1 - Creación y Lectura JSON):**  
  Lee `process.argv.slice(2)`, invoca `crearMundo` y guarda el archivo con `guardarMundo`.  
  Vuelve a leer el archivo desde el disco con `leerMundo` para cumplir estrictamente el requisito pedagógico.

* **Bloque 4 (Orquestación del Paso 2 - Ahorro de Cuota de Texto):**  
  Comprueba con `fs.existsSync` si `descripciones/mundo_<id>.txt` ya existe en el disco.  
  Si existe, lo lee directamente e informa al usuario; de lo contrario, consume la API de texto y guarda el archivo.

* **Bloque 5 (Orquestación del Paso 3 - Ahorro de Cuota de Imagen):**  
  Comprueba con `fs.existsSync` si `imagenes/mundo_<id>.jpg` ya existe en el disco.  
  Si existe, avisa que se reutilizó; si no, lee el archivo `.txt` guardado y genera la imagen correspondiente.

* **Bloque 6 (Captura y traducción de errores en español):**  
  El bloque `catch` traduce errores de timeout (`TimeoutError`) y de conexión (`TypeError`) a mensajes claros.  
  Asigna `process.exitCode = 1` para indicar fallo en el sistema operativo sin emitir trazas técnicas desagradables.

---

## 4. Guía para las Evidencias del Taller (Entregables)

Para completar los entregables solicitados en la sección 6 de la guía del SENA:

1. **Ejecución de 2 mundos distintos:**
   ```bash
   # Mundo 1
   npm start -- "Una tormenta electrica amenaza la ciudad flotante" "Aeropolis, islas flotantes sobre nubes" rojo azul verde dorado violeta

   # Mundo 2
   npm start -- "Una civilizacion submarina descubre tecnologia luminosa" "Atlantis Profunda, fosas abisales" turquesa esmeralda violeta cian plata
   ```
   *Captura:* Toma captura de la terminal mostrando los mensajes de los pasos 1, 2 y 3.

2. **Reutilización de archivos (Caché):**
   Ejecuta exactamente el mismo comando del Mundo 1 por segunda vez:
   ```bash
   npm start -- "Una tormenta electrica amenaza la ciudad flotante" "Aeropolis, islas flotantes sobre nubes" rojo azul verde dorado violeta
   ```
   *Captura:* Toma captura donde se observe el mensaje: `Paso 2: la descripcion ya existia...` y `Paso 3: la imagen ya existia...`.

3. **Provocar 3 errores controlados:**
   - **Error 1 (Clave inválida):** Modifica en tu archivo `.env` la variable `TEXTO_API_KEY=clave_falsa`. Ejecuta un mundo nuevo y captura el mensaje: `"La API key no es valida. Revisa tu archivo .env."`.
   - **Error 2 (Modelo inexistente):** Cambia en `.env` la variable `TEXTO_MODELO=modelo_inexistente`. Ejecuta y captura: `"El modelo o la URL no existen. Revisa tu configuracion."`.
   - **Error 3 (Sin conexión):** Desconecta temporalmente el internet o cambia la URL a `https://servidor-falso-inexistente.com` y captura: `"No se pudo conectar. Revisa tu internet o la URL."`.

4. **Verificación de Seguridad en Git:**
   Ejecuta:
   ```bash
   git ls-files
   ```
   *Captura:* Confirma que el archivo `.env` **no** aparece en la lista de archivos controlados por Git.

