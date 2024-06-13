//Este archivo contiene configuraciones específicas para el entorno de producción. 
//Incluye configuraciones para optimización de archivos, minificación y otras mejoras de rendimiento.

// Importa la función 'merge' del módulo 'webpack-merge' que se usa para combinar configuraciones de webpack.
const { merge } = require('webpack-merge');

// Importa la configuración común desde 'webpack.common.js'.
const common = require('./webpack.common.js');

// Importa el plugin 'dotenv-webpack' que carga variables de entorno desde un archivo .env.
const Dotenv = require('dotenv-webpack');

// Exporta la configuración final de webpack para el entorno de producción, combinada con la configuración común.
module.exports = merge(common, {
    // Establece el modo de webpack en 'production' para optimizaciones adecuadas para producción.
    mode: 'production',

    // Configura la salida de los archivos empaquetados.
    output: {
        // Define la ruta pública para referenciar los archivos en el servidor.
        publicPath: '/'
    },

    // Lista de plugins que se usarán en el entorno de producción.
    plugins: [
        // Plugin para cargar variables de entorno desde un archivo .env.
        new Dotenv({
            safe: true, // Verifica que todas las variables necesarias están definidas en .env.
            systemvars: true // Permite usar variables del sistema además de las definidas en el archivo .env.
        })
    ]
});
