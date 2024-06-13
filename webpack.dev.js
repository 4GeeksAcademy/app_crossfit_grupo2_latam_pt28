//Este archivo contiene configuraciones específicas para el entorno de desarrollo. 
//Incluye configuraciones para el servidor de desarrollo, el hot module replacement (HMR) y otras herramientas que facilitan el desarrollo.

// Importa el módulo 'webpack' que se utiliza para empaquetar los archivos del proyecto.
const webpack = require('webpack');

// Importa el módulo 'path' que proporciona utilidades para trabajar con rutas de archivos y directorios.
const path = require('path');

// Importa la función 'merge' del módulo 'webpack-merge' que se usa para combinar configuraciones de webpack.
const { merge } = require('webpack-merge');

// Importa la configuración común desde 'webpack.common.js'.
const common = require('./webpack.common.js');

// Define el puerto en el que el servidor de desarrollo escuchará.
const port = 3000;

// Define la URL pública para WebSocket, inicialmente configurada para localhost en el puerto especificado.
let publicUrl = `ws://localhost:${port}/ws`;

// Condición específica para entornos GitHub (Gitpod).
if (process.env.GITPOD_WORKSPACE_URL) {
  // Divide la URL del workspace en el esquema (http, https) y el host.
  const [schema, host] = process.env.GITPOD_WORKSPACE_URL.split('://');
  // Configura la URL pública para WebSocket usando 'wss' (WebSocket Secure) y el puerto adecuado para Gitpod.
  publicUrl = `wss://${port}-${host}/ws`;
}

// Condición específica para entornos GitHub Codespaces.
if (process.env.CODESPACE_NAME) {
  // Configura la URL pública para WebSocket usando 'wss' (WebSocket Secure) y el nombre del Codespace.
  publicUrl = `wss://${process.env.CODESPACE_NAME}-${port}.app.github.dev/ws`;
}

// Exporta la configuración final de webpack combinada con la configuración común.
// La función 'merge' combina el objeto común con las configuraciones específicas del entorno de desarrollo.
module.exports = merge(common, {
  // Establece el modo de webpack en 'development' para optimizaciones adecuadas para desarrollo.
  mode: 'development',

  // Establece una herramienta de mapeo de origen barato para facilitar la depuración.
  devtool: 'cheap-module-source-map',

  // Configuración del servidor de desarrollo.
  devServer: {
    // Especifica el puerto en el que el servidor de desarrollo escuchará.
    port,

    // Habilita la actualización de módulos en caliente, permitiendo recargar módulos en tiempo real sin recargar la página completa.
    hot: true,

    // Permite que el servidor acepte solicitudes desde cualquier host.
    allowedHosts: "all",

    // Permite la navegación HTML5 History API redirigiendo todas las solicitudes al índice HTML.
    historyApiFallback: true,

    // Configura el directorio estático desde donde el servidor servirá archivos.
    static: {
      directory: path.resolve(__dirname, "public"), // Sirve desde el directorio correcto
    },

    // Configura el cliente del servidor para usar la URL de WebSocket especificada.
    client: {
      webSocketURL: publicUrl
    },
  },

  // Lista de plugins que se usarán en el entorno de desarrollo.
  plugins: [
    // Plugin para permitir la actualización de módulos en caliente.
    new webpack.HotModuleReplacementPlugin()
  ]
});
