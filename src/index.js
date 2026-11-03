// Paso 1: Cargar variables de entorno de forma nativa con Node.js 20.12+
try {
  process.loadEnvFile();
} catch (error) {
  // Si no existe el archivo .env, continua para que las validaciones informen al usuario
}

// Paso 2: Importar los modulos nativos y las funciones de nuestros modulos locales
const fs = require('fs');
const path = require('path');
const { crearMundo, guardarMundo, leerMundo } = require('./mundo');
const { describirMundo } = require('./texto');
const { generarImagen } = require('./imagen');

// Paso 3: Definir la funcion principal asincrona para orquestar los 3 pasos
async function main() {
  try {
    // Paso 4: Obtener argumentos de consola con process.argv (omitir los dos primeros)
    const args = process.argv.slice(2);

    // PASO 1 DEL TALLER: Crear y guardar el mundo en JSON
    const mundo = crearMundo(args);
    const rutaJSON = guardarMundo(mundo);
    console.log(`Paso 1: mundo guardado en data/mundo_${mundo.id}.json`);

    // Leer el JSON desde el disco como exige la guia (no reutilizar la variable en memoria)
    const mundoGuardado = leerMundo(rutaJSON);

    // PASO 2 DEL TALLER: Generar o reutilizar la descripcion de texto
    const rutaTexto = path.join(__dirname, '..', 'descripciones', `mundo_${mundo.id}.txt`);
    let descripcion = '';

    if (fs.existsSync(rutaTexto)) {
      console.log('Paso 2: la descripcion ya existia, no se llamo al modelo de texto.');
      descripcion = fs.readFileSync(rutaTexto, 'utf-8');
    } else {
      descripcion = await describirMundo(mundoGuardado);
      console.log(`Paso 2: descripcion guardada en descripciones/mundo_${mundo.id}.txt`);
    }

    // PASO 3 DEL TALLER: Generar o reutilizar la imagen resultante
    const rutaImagen = path.join(__dirname, '..', 'imagenes', `mundo_${mundo.id}.jpg`);

    if (fs.existsSync(rutaImagen)) {
      console.log('Paso 3: la imagen ya existia, no se llamo al modelo de imagenes.');
    } else {
      // Leemos la descripcion directamente desde el archivo .txt guardado
      const textoGuardado = fs.readFileSync(rutaTexto, 'utf-8');
      await generarImagen(textoGuardado, mundo.id);
      console.log(`Paso 3: imagen guardada en imagenes/mundo_${mundo.id}.jpg`);
    }

    // Mensaje de exito final
    console.log('Listo. Revisa la carpeta imagenes/');
  } catch (error) {
    // Paso 5: Manejo claro de errores en espanol segun la tabla de la guia
    if (error.name === 'TimeoutError') {
      console.error('El servicio tardo demasiado en responder.');
    } else if (error.name === 'TypeError') {
      console.error('No se pudo conectar. Revisa tu internet o la URL.');
    } else {
      console.error(error.message);
    }

    // Terminar con codigo de salida 1 sin mostrar trazas tecnicas confusas
    process.exitCode = 1;
  }
}

// Paso 6: Ejecutar la funcion principal
main();

