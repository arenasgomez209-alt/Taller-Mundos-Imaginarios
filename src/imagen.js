// Paso 1: Importar los modulos nativos fs y path
const fs = require('fs');
const path = require('path');

// Paso 2: Funcion asincrona para enviar la descripcion al modelo de imagenes y guardar el archivo
async function generarImagen(descripcion, id) {
  const apiKey = process.env.IMAGEN_API_KEY;
  const apiUrl = process.env.IMAGEN_URL;

  if (!apiUrl) {
    throw new Error('Falta la variable IMAGEN_URL en tu archivo .env.');
  }

  let bytes = null;

  // Paso 3: Soporte para Opcion C de la guia (Pollinations - Rapido y sin clave)
  if (apiUrl.includes('pollinations')) {
    const promptCodificado = encodeURIComponent(descripcion);
    const urlGet = `${apiUrl.replace(/\/$/, '')}/${promptCodificado}?width=1024&height=1024&model=flux&nologo=true`;

    const respuesta = await fetch(urlGet, {
      method: 'GET',
      signal: AbortSignal.timeout(60000)
    });

    if (respuesta.status === 402 || respuesta.status === 429) {
      throw new Error('Superaste el limite gratuito. Espera un momento (revisa el encabezado retry-after si existe).');
    }
    if (!respuesta.ok) {
      throw new Error(`Error en la API de imagenes con codigo de estado ${respuesta.status}`);
    }

    // Obtener los bytes directamente como indica la guia en la pagina 10
    const bufferArray = await respuesta.arrayBuffer();
    bytes = Buffer.from(bufferArray);
  } else {
    // Paso 4: Soporte para Opcion A de la guia (NVIDIA FLUX POST con API Key)
    if (!apiKey) {
      throw new Error('Falta la variable IMAGEN_API_KEY en tu archivo .env.');
    }

    const cuerpoPeticion = {
      prompt: descripcion,
      width: 1024,
      height: 1024,
      steps: 4,
      seed: 0
    };

    if (apiUrl.includes('flux.1-dev')) {
      cuerpoPeticion.mode = 'base';
      cuerpoPeticion.cfg_scale = 3.5;
      cuerpoPeticion.steps = 50;
    }

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

    const datos = await respuesta.json();
    let textoBase64 = null;

    if (datos.artifacts && datos.artifacts[0]) {
      if (datos.artifacts[0].finishReason && datos.artifacts[0].finishReason !== 'SUCCESS') {
        throw new Error(`La generacion de imagen no termino con exito: ${datos.artifacts[0].finishReason}`);
      }
      textoBase64 = datos.artifacts[0].base64;
    } else if (datos.result && datos.result.image) {
      textoBase64 = datos.result.image;
    } else {
      throw new Error('No se encontro el contenido base64 en la respuesta de la API.');
    }

    bytes = Buffer.from(textoBase64, 'base64');
  }

  // Paso 5: Validar que los bytes no esten vacios
  if (!bytes || bytes.length === 0) {
    throw new Error('Los bytes de la imagen llegaron vacios.');
  }

  // Paso 6: Guardar los bytes en imagenes/mundo_<id>.jpg sin utf-8
  const carpetaImagenes = path.join(__dirname, '..', 'imagenes');
  if (!fs.existsSync(carpetaImagenes)) {
    fs.mkdirSync(carpetaImagenes, { recursive: true });
  }

  const rutaImagen = path.join(carpetaImagenes, `mundo_${id}.jpg`);
  fs.writeFileSync(rutaImagen, bytes);

  return rutaImagen;
}

// Paso 7: Exportar la funcion
module.exports = {
  generarImagen
};
