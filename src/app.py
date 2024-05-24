"""
Este módulo se encarga de iniciar el servidor de la API, cargar la base de datos y agregar los puntos finales
"""

# Importar los módulos necesarios
import os  # Importar el módulo os para interactuar con el sistema operativo
from flask import Flask, request, jsonify, url_for, send_from_directory, redirect, render_template  # Importar clases y funciones de Flask para crear y gestionar la aplicación web
from flask_migrate import Migrate  # Importar Migrate para facilitar la migración de la base de datos
from flask_swagger import swagger  # Importar swagger para generar documentación de la API
from api.utils import APIException, generate_sitemap  # Importar clases y funciones definidas en otros archivos del proyecto
from api.models import db  # Importar la instancia de la base de datos
from api.routes import api  # Importar el objeto Blueprint para los endpoints de la API
from api.admin import setup_admin  # Importar la función para configurar el panel de administración
from api.commands import setup_commands  # Importar la función para configurar comandos de Flask


#------------------verificar con david --------------------------------
from werkzeug.utils import secure_filename # importacion de secure_filename para manejar imagen

UPLOAD_FOLDER = '/path/to/the/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}




# Importar JWTManager para manejar la autenticación JWT
from flask_jwt_extended import JWTManager

# Importar dangeus y flask_email para manejar el envio de email
from itsdangerous import URLSafeTimedSerializer as Serializer
from flask_mail import Mail, Message

# Configurar el entorno de desarrollo o producción y el directorio para archivos estáticos
ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"  # Configurar el entorno según la variable de entorno FLASK_DEBUG

static_file_dir = os.path.join(os.path.dirname(
    os.path.realpath(__file__)), '../public/')  # Establecer la ruta del directorio de archivos estáticos

# Crear la instancia de la aplicación Flask
app = Flask(__name__)  # Inicializar la aplicación Flask
app.url_map.strict_slashes = False  # Configurar para permitir rutas sin barra al final

# Inicializar JWTManager y configurar la clave secreta
jwt = JWTManager(app)  # Inicializar JWTManager con la aplicación Flask
app.config["JWT_SECRET_KEY"] = os.getenv("KEY_JWT")  # Definir la clave secreta para JWT  se obtiene desde el archivo .env (debes cambiarla por una clave segura)

#---------------------------------PARA LA CARGA DE IMAGENES---------------------------------------------------------------------
#Configuración en tu aplicación Flask:
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # por ejemplo, 16 megabytes


#------------------------seccion de envio de email----------------------------------------------
app.config['SECRET_KEY'] = os.getenv("EMAIL_ENCRYPTION_KEY")
app.config['SECURITY_PASSWORD_SALT'] = os.getenv("EMAIL_ENCRYPTION_PASSWORD")

#configuracion de email
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USERNAME'] = os.getenv("EMAIL_FOR_SEND")
app.config['MAIL_PASSWORD'] = os.getenv("PASSWORD_SEND_EMAIL")
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True


mail = Mail(app)


#------------------verificar con david --------------------------------
app.config['UPLOAD_FOLDER'] = 'path/to/upload/directory'  # Asegúrate de que este directorio exista y tenga permisos adecuados
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB de tamaño máximo de archivo
# ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}


# Configurar la base de datos
db_url = os.getenv("DATABASE_URL")  # Obtener la URL de la base de datos de las variables de entorno
if db_url is not None:  # Verificar si se proporcionó una URL de base de datos
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace(  # Configurar la URL de la base de datos para SQLAlchemy
        "postgres://", "postgresql://")  # Reemplazar el prefijo de la URL para PostgreSQL
else:  # Si no se proporciona una URL de base de datos, utilizar una base de datos SQLite en memoria
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/test.db"  # Configurar la URI de la base de datos SQLite

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Desactivar el seguimiento de modificaciones de SQLAlchemy
MIGRATE = Migrate(app, db, compare_type=True)  # Inicializar la migración de la base de datos

db.init_app(app)  # Inicializar la base de datos con la aplicación Flask

# Agregar el panel de administración
setup_admin(app)  # Configurar el panel de administración de Flask-Admin

# Configurar comandos de Flask
setup_commands(app)  # Configurar comandos personalizados de Flask

# Agregar todos los endpoints de la API con el prefijo "api"
app.register_blueprint(api, url_prefix='/api')  # Registrar el Blueprint de la API con el prefijo de URL "/api"

# Manejar/serializar errores como un objeto JSON
@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code  # Retornar el error como un objeto JSON con el código de estado correspondiente

# Generar un mapa del sitio con todos los endpoints
@app.route('/')
def sitemap():
    if ENV == "development":  # Verificar si el entorno es de desarrollo
        return generate_sitemap(app)  # Generar el mapa del sitio en modo desarrollo
    return send_from_directory(static_file_dir, 'index.html')  # Servir el archivo index.html desde el directorio de archivos estáticos

# Cualquier otro endpoint intentará servirlo como un archivo estático
@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    if not os.path.isfile(os.path.join(static_file_dir, path)):  # Verificar si el archivo solicitado no existe
        path = 'index.html'  # Establecer el archivo predeterminado como index.html
    response = send_from_directory(static_file_dir, path)  # Servir el archivo desde el directorio de archivos estáticos
    response.cache_control.max_age = 0  # Evitar el almacenamiento en caché del archivo
    return response  # Retornar la respuesta

# Este bloque se ejecuta solo si se ejecuta `$ python src/main.py`
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))  # Obtener el puerto del entorno o utilizar el puerto 3001 de forma predeterminada
    app.run(host='0.0.0.0', port=PORT, debug=True)  # Ejecutar la aplicación en el host 0.0.0.0 y el puerto especificado, con modo de depuración activado
