// Paso 1: Importar los modulos nativos fs y path
const fs = require('fs');
const path = require('path');

// Paso 2: Funcion asincrona para pedir la descripcion al modelo de texto
async function describirMundo(mundo) {
  // Validar que las variables de entorno necesarias esten definidas
  const apiKey = process.env.TEXTO_API_KEY;
  const apiUrl = process.env.TEXTO_URL;
  const modelo = process.env.TEXTO_MODELO;

  if (!apiKey || !apiUrl || !modelo) {
    throw new Error('Faltan variables de entorno para el modelo de texto. Revisa tu archivo .env.');
  }

  // Paso 3: Definir el mensaje de sistema con instrucciones claras de arte conceptual
  const mensajeSistema =
    'You are a senior concept artist for a video game studio. ' +
    'Write a cinematic, highly detailed visual image prompt of an imaginary world in a single paragraph in English, ' +
    'between 80 and 120 words. Describe scene, scale, architecture, lighting, weather effects, composition, and artistic style. ' +
    'You MUST translate all 5 given colors to English and explicitly apply each color to a specific element of the scene. ' +
    'DO NOT USE MARKDOWN, DO NOT USE ASTERISKS (**), DO NOT USE BULLET POINTS, DO NOT USE TITLES, and no text written inside the image. Plain text only.';

  // Paso 4: Preparar la peticion POST con fetch nativo y timeout de 30 segundos
  const cuerpoPeticion = {
    model: modelo,
    messages: [
      { role: 'system', content: mensajeSistema },
      { role: 'user', content: JSON.stringify(mundo) }
    ],
    temperature: 0.7,
    max_tokens: 300
  };

  const respuesta = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(cuerpoPeticion),
    signal: AbortSignal.timeout(60000)
  });

  // Paso 5: Manejar los codigos de estado HTTP de la API
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
    throw new Error(`Error en la API de texto con codigo de estado ${respuesta.status}`);
  }

  // Paso 6: Procesar la respuesta JSON y extraer la descripcion
  const datos = await respuesta.json();
  let descripcion =
    datos.choices &&
    datos.choices[0] &&
    datos.choices[0].message &&
    datos.choices[0].message.content;

  if (!descripcion || descripcion.trim() === '') {
    throw new Error('La respuesta del modelo de texto llego vacia.');
  }

  descripcion = descripcion.trim();

  // Si supera 1500 caracteres, recortar con slice y avisar al usuario
  if (descripcion.length > 1500) {
    console.log('Aviso: la descripcion supero los 1500 caracteres y fue recortada.');
    descripcion = descripcion.slice(0, 1500);
  }

  // Paso 7: Guardar la descripcion en descripciones/mundo_<id>.txt
  const carpetaDescripciones = path.join(__dirname, '..', 'descripciones');
  if (!fs.existsSync(carpetaDescripciones)) {
    fs.mkdirSync(carpetaDescripciones, { recursive: true });
  }

  const rutaArchivo = path.join(carpetaDescripciones, `mundo_${mundo.id}.txt`);
  fs.writeFileSync(rutaArchivo, descripcion, 'utf-8');

  return descripcion;
}

// Paso 8: Exportar la funcion para ser utilizada por el index.js
module.exports = {
  describirMundo
};

