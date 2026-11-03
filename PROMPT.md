# PROMPT.md - Registro del Prompt y Contexto del Proyecto

## 1. Prompt Inicial de Instrucción para la IA

```text
Actúa como un instructor de Node.js para principiantes del SENA.
Quiero construir un programa de consola llamado "mundos-ia".

CONTEXTO: solo conozco estos temas: process.argv, módulos con require,
el módulo nativo fs (writeFileSync, readFileSync, existsSync, mkdirSync),
path, npm (init, install, scripts), el paquete object-hash, variables de
entorno con .env y process.loadEnvFile, async/await con try/catch y el fetch
nativo de Node.

OBJETIVO:
1. Recibir por parámetros una situación, un mundo y 5 colores, y guardarlos
   en un objeto JSON en data/mundo_<id>.json.
2. Leer ese JSON y enviarlo con fetch a la API de un modelo de lenguaje para
   que genere la descripción de una imagen. Guardarla en
   descripciones/mundo_<id>.txt.
3. Enviar esa descripción con fetch a la API de un modelo de imágenes y
   guardar la imagen en imagenes/mundo_<id>.jpg.

RESTRICCIONES:
- No uses dotenv, axios, SDK de proveedores, readline, commander ni frameworks.
- Código simple, con comentarios en español numerados ("paso 1", "paso 2"...).
- Las API keys se leen del archivo .env y nunca se escriben en el código.
- Si el .txt o la imagen ya existen, no vuelvas a llamar a las APIs.
- Divide el código en src/index.js, src/mundo.js, src/texto.js y src/imagen.js.
```

## 2. Configuración de Credenciales (Sin Secretos Reales)

Las claves se configuran en el archivo `.env` local (el cual está protegido por `.gitignore` y **nunca** se sube al repositorio):

```env
TEXTO_API_KEY=<TU_NVIDIA_API_KEY>
TEXTO_URL=https://integrate.api.nvidia.com/v1/chat/completions
TEXTO_MODELO=nvidia/nemotron-3.5-bolt-e4b
IMAGEN_API_KEY=<TU_NVIDIA_API_KEY>
IMAGEN_URL=https://image.pollinations.ai/prompt
```

## 3. Notas de Implementación

- Cumple al 100% las restricciones del SENA: sin librerías externas no autorizadas (única permitida: `object-hash`).
- Utiliza Node.js 20.12+ nativo para cargar variables (`process.loadEnvFile()`) y peticiones HTTP (`fetch`).
- Implementa ahorro de cuota mediante caché con `fs.existsSync`.
