//Este archivo contiene configuraciones comunes que se comparten tanto en el entorno de desarrollo como en el de producción. 
//Incluye configuraciones básicas como entradas y salidas, reglas para cargadores (loaders) y plugins que son necesarios en ambos entornos


// Importa el módulo 'webpack' que se utiliza para empaquetar los archivos del proyecto.
const webpack = require('webpack');

// Importa el módulo 'path' que proporciona utilidades para trabajar con rutas de archivos y directorios.
const path = require('path');

// Importa el plugin 'html-webpack-plugin' que simplifica la creación de archivos HTML para servir tus paquetes.
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Importa el plugin 'dotenv-webpack' que carga variables de entorno desde un archivo .env.
const Dotenv = require('dotenv-webpack');

// Exporta la configuración común de webpack.
module.exports = {
  // Define el punto de entrada para la aplicación, desde donde webpack comenzará a empaquetar.
  entry: [
    './src/front/js/index.js'
  ],

  // Configura la salida de los archivos empaquetados.
  output: {
    // Nombre del archivo de salida.
    filename: 'bundle.js',
    // Ruta del directorio donde se colocarán los archivos de salida.
    path: path.resolve(__dirname, 'public'),
    // Ruta pública para referenciar los archivos en el servidor.
    publicPath: '/'
  },

  // Configuración de los módulos y reglas de carga.
  module: {
    rules: [
      {
        // Aplica esta regla a archivos que terminan en .js o .jsx.
        test: /\.(js|jsx)$/,
        // Excluye el directorio 'node_modules' para no procesar archivos de dependencias.
        exclude: /node_modules/,
        // Usa 'babel-loader' para transpilar archivos JavaScript.
        use: ['babel-loader']
      },
      {
        // Aplica esta regla a archivos que terminan en .css o .scss.
        test: /\.(css|scss)$/,
        // Usa 'style-loader' y 'css-loader' para procesar archivos CSS.
        use: [{
          loader: "style-loader" // crea nodos de estilo a partir de cadenas JS
        }, {
          loader: "css-loader" // traduce CSS en CommonJS
        }]
      }, // solo archivos CSS
      {
        // Aplica esta regla a archivos de imágenes (png, svg, jpg, gif, jpeg, webp).
        test: /\.(png|svg|jpg|gif|jpeg|webp)$/,
        // Usa 'file-loader' para manejar archivos de imagen.
        use: {
          loader: 'file-loader',
          options: { name: '[name].[ext]' } // conserva el nombre y extensión original del archivo.
        }
      }, // para imágenes
      {
        // Aplica esta regla a archivos de audio (mp3, wav).
        test: /\.(mp3|wav)$/, // Manejo de archivos de audio
        // Usa 'file-loader' para manejar archivos de audio.
        use: {
          loader: 'file-loader',
          options: { name: 'sounds/[name].[ext]' } // guarda los archivos de audio en el directorio 'sounds' conservando su nombre y extensión original.
        }
      }, // para archivos de audio
      {
        // Aplica esta regla a archivos de fuentes (woff, woff2, ttf, eot, svg).
        test: /\.woff($|\?)|\.woff2($|\?)|\.ttf($|\?)|\.eot($|\?)|\.svg($|\?)/,
        // Usa 'file-loader' para manejar archivos de fuentes.
        use: ['file-loader']
      } // para fuentes
    ]
  },

  // Configura cómo se resolverán las extensiones de los archivos importados.
  resolve: {
    // Permite importar archivos sin especificar su extensión si coincide con alguna de estas.
    extensions: ['*', '.js']
  },

  // Lista de plugins a usar en la configuración.
  plugins: [
    // Plugin para generar automáticamente un archivo HTML que incluye todos los bundles generados por webpack.
    new HtmlWebpackPlugin({
      // Define un favicon para la aplicación.
      favicon: '4geeks.ico',
      // Plantilla HTML a utilizar.
      template: 'template.html'
    }),
    // Plugin para cargar variables de entorno desde un archivo .env.
    new Dotenv({
      safe: true, // Verifica que todas las variables necesarias están definidas en .env.
      systemvars: true // Permite usar variables del sistema además de las definidas en el archivo .env.
    })
  ]
};
