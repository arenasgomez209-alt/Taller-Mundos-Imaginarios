// Paso 1: Importar los modulos nativos de Node.js y la libreria object-hash
const fs = require('fs');
const path = require('path');
const objectHash = require('object-hash');

// Paso 2: Funcion para validar los argumentos de consola y crear el objeto del mundo
function crearMundo(args) {
  // Validacion 1: Verificar que lleguen exactamente 7 argumentos
  if (!args || args.length !== 7) {
    throw new Error(
      'Deben llegar exactamente 7 argumentos (situacion, mundo y 5 colores).\n' +
      'Ejemplo de uso:\n' +
      'npm start -- "Una tormenta electrica amenaza la ciudad" "Aeropolis" rojo azul verde dorado violeta'
    );
  }

  // Validacion 2: Comprobar que ningun argumento este vacio o tenga solo espacios
  for (let i = 0; i < args.length; i++) {
    if (!args[i] || args[i].trim() === '') {
      throw new Error('Ningun argumento puede estar vacio ni contener solo espacios.');
    }
  }

  const situacion = args[0].trim();
  const mundoNombre = args[1].trim();
  const colores = [
    args[2].trim(),
    args[3].trim(),
    args[4].trim(),
    args[5].trim(),
    args[6].trim()
  ];

  // Validacion 3: Verificar que los 5 colores sean distintos (sin distinguir mayusculas/minusculas)
  const coloresRevisados = [];
  for (let i = 0; i < colores.length; i++) {
    const colorMin = colores[i].toLowerCase();
    if (coloresRevisados.includes(colorMin)) {
      throw new Error(`Los 5 colores deben ser distintos. El color "${colores[i]}" esta repetido.`);
    }
    coloresRevisados.push(colorMin);
  }

  // Calcular el id unico de 8 caracteres sin incluir creadoEn para poder reutilizarlo
  const datosParaHash = {
    situacion: situacion,
    mundo: mundoNombre,
    colores: colores
  };
  const id = objectHash(datosParaHash).slice(0, 8);

  // Retornar el objeto con la estructura requerida
  return {
    id: id,
    situacion: situacion,
    mundo: mundoNombre,
    colores: colores,
    creadoEn: new Date().toISOString()
  };
}

// Paso 3: Funcion para guardar el objeto mundo en la carpeta data/
function guardarMundo(mundo) {
  const carpetaData = path.join(__dirname, '..', 'data');

  // Si la carpeta data/ no existe, la creamos
  if (!fs.existsSync(carpetaData)) {
    fs.mkdirSync(carpetaData, { recursive: true });
  }

  // Guardamos el archivo JSON con formato indentado de 2 espacios
  const rutaArchivo = path.join(carpetaData, `mundo_${mundo.id}.json`);
  fs.writeFileSync(rutaArchivo, JSON.stringify(mundo, null, 2));

  return rutaArchivo;
}

// Paso 4: Funcion para leer un archivo JSON guardado
function leerMundo(ruta) {
  const contenido = fs.readFileSync(ruta, 'utf-8');
  return JSON.parse(contenido);
}

// Paso 5: Exportar las funciones para utilizarlas en otros modulos
module.exports = {
  crearMundo,
  guardarMundo,
  leerMundo
};

