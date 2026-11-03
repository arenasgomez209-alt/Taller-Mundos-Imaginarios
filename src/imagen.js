// Paso 1: Importar los modulos nativos fs y path
const fs = require('fs');
const path = require('path');

// Paso 2: Funcion asincrona para enviar la descripcion al modelo de imagenes y guardar el archivo
async function generarImagen(descripcion, id) {
  // Validar las variables de entorno necesarias
  const apiKey = process.env.IMAGEN_API_KEY;
  const apiUrl = process.env.IMAGEN_URL;

  if (!apiKey || !apiUrl) {
    throw new Error('Faltan variables de entorno para el modelo de imagenes. Revisa tu archivo .env.');
  }

  // Paso 3: Configurar el cuerpo de la peticion segun el servicio elegido
  const cuerpoPeticion = {
    prompt: descripcion,
    width: 1024,
    height: 1024,
    steps: 4,
    seed: 0
  };

  // Si se utiliza flux.1-dev, agregamos los parametros compatibles
  if (apiUrl.includes('flux.1-dev')) {
    cuerpoPeticion.mode = 'base';
    cuerpoPeticion.cfg_scale = 3.5;
  }

  // Paso 4: Enviar la peticion con fetch nativo y timeout de 60 segundos
  const respuesta = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(cuerpoPeticion),
    signal: AbortSignal.timeout(60000)
  });

  // Paso 5: Manejar los codigos de estado HTTP de la API de imagenes
  if (respuesta.status === 401 || respuesta.status === 403) {
    throw new Error('La API key no es valida. Revisa tu archivo .env.');
  }
  if (respuesta.status === 402 || respuesta.status === 429) {
    throw new Error('Superaste el limite gratuito. Espera un momento (revisa el encabezado retry-after si existe).');
  }
  if (respuesta.status === 404 || respuesta.status === 410) {
    throw new Error('El modelo o la URL no existen. Revisa tu configuracion.');
  }
  if (!respuesta.ok) {
    throw new Error(`Error en la API de imagenes con codigo de estado ${respuesta.status}`);
  }

  // Paso 6: Procesar la respuesta JSON y extraer la imagen en base64
  const datos = await respuesta.json();
  let textoBase64 = null;

  if (datos.artifacts && datos.artifacts[0]) {
    // Validacion de finishReason SUCCESS para la API de NVIDIA
    if (datos.artifacts[0].finishReason && datos.artifacts[0].finishReason !== 'SUCCESS') {
      throw new Error(`La generacion de imagen no termino con exito: ${datos.artifacts[0].finishReason}`);
    }
    textoBase64 = datos.artifacts[0].base64;
  } else if (datos.result && datos.result.image) {
    textoBase64 = datos.result.image;
  } else {
    throw new Error('No se encontro el contenido base64 en la respuesta de la API.');
  }

  // Paso 7: Convertir el string base64 a Buffer binario y validar que no este vacio
  const bytes = Buffer.from(textoBase64, 'base64');
  if (!bytes || bytes.length === 0) {
    throw new Error('Los bytes de la imagen llegaron vacios.');
  }

  // Paso 8: Guardar los bytes en imagenes/mundo_<id>.jpg sin utf-8
  const carpetaImagenes = path.join(__dirname, '..', 'imagenes');
  if (!fs.existsSync(carpetaImagenes)) {
    fs.mkdirSync(carpetaImagenes, { recursive: true });
  }

  const rutaImagen = path.join(carpetaImagenes, `mundo_${id}.jpg`);
  fs.writeFileSync(rutaImagen, bytes);

  return rutaImagen;
}

// Paso 9: Exportar la funcion para ser requerida desde index.js
module.exports = {
  generarImagen
};
