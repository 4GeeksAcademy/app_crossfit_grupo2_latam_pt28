"""
Este módulo se encarga de iniciar el servidor API, cargar la base de datos y agregar los puntos finales.
"""


from flask import Flask, request, jsonify, url_for, Blueprint, redirect, url_for, render_template  # Importación de Flask y funciones relacionadas
from api.models import db, User, SecurityQuestion, Role, Permission, RolePermission, Membership, Training_classes, Booking, Payment, PaymentDetail, UserMembershipHistory  # Importación de los modelos de la base de datos
from api.utils import generate_sitemap, APIException  # Importación de funciones de utilidad y excepciones personalizadas
from flask_cors import CORS  # Importación de CORS para permitir solicitudes desde otros dominios
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity  # Importación de JWT para autenticación y autorización basada en tokens
from flask_bcrypt import generate_password_hash, check_password_hash  # Importación de bcrypt para encriptación de contraseñas
from datetime import timedelta  # Importación de timedelta para manejar intervalos de tiempo
from itsdangerous import URLSafeTimedSerializer as Serializer
from flask_mail import Mail, Message

from .booking_service import create_booking, cancel_booking, process_payment, create_transaction, activate_membership, generate_confirmation_token_email, confirm_token_email, send_email, cancel_class_and_update_bookings


#------------------verificar con david --------------------------------

from werkzeug.utils import secure_filename # importacion de secure_filename para manejar imagen



#------------------INICIALIZACION DE LA API----------------------------------------------------------------------------------

api = Blueprint('api', __name__)  # Creación de un Blueprint para agrupar las rutas relacionadas con la API
# Un Blueprint es una forma de organizar y estructurar las rutas de una aplicación Flask en grupos lógicos y modularizados. 
# Es una característica que permite dividir la aplicación en componentes más pequeños y reutilizables, 
# lo que facilita la gestión y mantenimiento del código.

# Allow CORS requests to this API
CORS(api)  # Habilitar CORS para permitir solicitudes cruzadas desde el frontend hacia la API

#-------ENCRIPTACION JWT------
#la inicialización de JWTManager está en la carpeta app.py despues de la declaración del servidor Flask
jwt = JWTManager()  # Inicialización del JWTManager para manejar la generación y verificación de tokens JWT



@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }

    return jsonify(response_body), 200




#-------------------CREAR  TOKEN LOGIN--------------------------------------------------------------------------
@api.route('master/token', methods=['POST'])  # Define un endpoint para agregar un nuevo usuario mediante una solicitud POST a la ruta '/users'
def create_token():  # Define la función que manejará la solicitud
    try:  # Inicia un bloque try para manejar posibles excepciones
        data = request.json  # Obtén los datos JSON enviados en la solicitud
        if not data:  # Verifica si no se proporcionaron datos JSON
            return jsonify({'error': 'No data provided'}), 400  # Devuelve un error con código de estado 400 si no se proporcionaron datos

        if 'email' not in data:  # Verifica si 'email' no está presente en los datos JSON
            return jsonify({'error': 'Email is required'}), 400  # Devuelve un error con código de estado 400 si 'email' no está presente

        if 'password' not in data:  # Verifica si 'password' no está presente en los datos JSON
            return jsonify({'error': 'Password is required'}), 400  # Devuelve un error con código de estado 400 si 'password' no está presente

        existing_user = User.query.filter_by(email=data['email']).first()  # Busca un usuario en la base de datos con el mismo email
        if not existing_user:  # Verifica si ya existe un usuario con el mismo email
            return jsonify({'error': 'Email does not exist.'}), 400  # Devuelve un error con código de estado 409 si ya existe un usuario con el mismo email

        password_user_db = existing_user.password  # Extraemos la contraseña almacenada del usuario existente en la base de datos

        true_o_false = check_password_hash(password_user_db, data['password'])  # Comparamos la contraseña ingresada en el formulario con la contraseña almacenada en la base de datos, después de descifrarla

        if true_o_false:  # Si la comparación es verdadera, es decir, las contraseñas coinciden
            expires = timedelta(days=1)  # Configuramos la duración del token de acceso
            user_id = existing_user.id  # Obtenemos el ID del usuario existente en la base de datos
            access_token = create_access_token(identity=user_id, expires_delta=expires)  # Creamos un token de acceso para el usuario
            return jsonify({'access_token': access_token, 'login': True, 'role':existing_user.role}), 200  # Devolvemos el token de acceso como respuesta exitosa
        else:  # Si la comparación de contraseñas es falsa, es decir, las contraseñas no coinciden
            return jsonify({'error': 'Incorrect password'}), 400  # Devolvemos un mensaje de error indicando que la contraseña es incorrecta

    except Exception as e:  # Captura cualquier excepción que ocurra dentro del bloque try
        return jsonify({'error': 'Error login user: ' + str(e)}), 500  # Devuelve un mensaje de error con un código de estado HTTP 500 si ocurre una excepción durante el procesamiento

#mandar el serializado del user y el tipo de rol que tienen

#-------------------CONSULTAR TODOS LOS USUARIOS--------------------------------------------------------------------------
@api.route('/users', methods=['GET'])
# @jwt_required() # Decorador para requerir autenticación con JWT
def get_users():
    try:
        users = User.query.all()
        if not users:
            return jsonify({'message': 'No users found'}), 404
        
        response_body = [user.serialize() for user in users]
        return jsonify(response_body), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/user/<int:id>',methods=['GET'])
# @jwt_required() # Decorador para requerir autenticación con JWT
def get_Oneuser(id):
    try:
        user=User.query.get(id)
        if not user:
            return jsonify({'message': 'No users found'}), 404
        
        response_body = [user.serialize() for user in user]
        return jsonify(response_body), 200
    except Exception as e:
        return jsonify({'error':str(e)}),500



#-------------------CONSULTAR UN USUARIO UNICO--------------------------------------------------------------------------

@api.route('/user', methods=['GET'])
@jwt_required() 
def get_user_by_email():
    try:

        current_user_id = get_jwt_identity() # Obtiene la id del usuario del token
        user = User.query.get(current_user_id) # Buscar al usuario por su ID
        if not user:
            return jsonify({'message': 'User not found'}), 404
        return jsonify(user.serialize()), 200 # Devolver los datos del usuario encontrado
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

#-------------------CREAR  USUARIOS PARA INTERFAL MASTER--------------------------------------------------------------------------
@api.route('master/users', methods=['POST'])  # Define un endpoint para agregar un nuevo usuario mediante una solicitud POST a la ruta '/users'
# @jwt_required() # Decorador para requerir autenticación con JWT
def create_new_user():  # Define la función que manejará la solicitud
    try:  # Inicia un bloque try para manejar posibles excepciones
        data = request.json  # Obtén los datos JSON enviados en la solicitud
        if not data:  # Verifica si no se proporcionaron datos JSON
            return jsonify({'error': 'No data provided'}), 400  # Devuelve un error con código de estado 400 si no se proporcionaron datos

        if 'email' not in data:  # Verifica si 'email' no está presente en los datos JSON
            return jsonify({'error': 'Email is required'}), 400  # Devuelve un error con código de estado 400 si 'email' no está presente

        if 'username' not in data:  # Verifica si 'username' no está presente en los datos JSON
            return jsonify({'error': 'Username is required'}), 400  # Devuelve un error con código de estado 400 si 'username' no está presente

        if 'password' not in data:  # Verifica si 'password' no está presente en los datos JSON
            return jsonify({'error': 'Password is required'}), 400  # Devuelve un error con código de estado 400 si 'password' no está presente

        # Verifica si se proporcionan las preguntas y respuestas de seguridad en los datos JSON
        if 'security_questions' not in data or len(data['security_questions']) != 2:
            return jsonify({'error': 'Security questions and answers are required'}), 400
        
        if 'role' not in data:  # Verifica si 'role' no está presente en los datos JSON
            return jsonify({'error': 'role is required'}), 400  # Devuelve un error con código de estado 400 si 'password' no está presente

        existing_user = User.query.filter_by(email=data['email']).first()  # Busca un usuario en la base de datos con el mismo email
        if existing_user:  # Verifica si ya existe un usuario con el mismo email
            return jsonify({'error': 'Email already exists.'}), 409  # Devuelve un error con código de estado 409 si ya existe un usuario con el mismo email

        existing_username = User.query.filter_by(username=data['username']).first()  # Busca un usuario en la base de datos con el mismo username
        if existing_username:  # Verifica si ya existe un usuario con el mismo username
            return jsonify({'error': 'Username already exists.'}), 409  # Devuelve un error con código de estado 409 si ya existe un usuario con el mismo username

        # Búsqueda del rol especificado
        role = Role.query.filter_by(name=data['role']).first()
        if not role:
            return jsonify({'error': 'Role does not exist'}), 404
        
        password_hash = generate_password_hash(data['password']).decode('utf-8')

        # Crea un nuevo usuario con los datos proporcionados                                                                      
        new_user = User(email=data['email'], password=password_hash, username=data['username'], name=data.get('name'), last_name=data.get('last_name'), is_active=True, role_id=role.id)
       
        # Agrega las preguntas y respuestas de seguridad al usuario
        for question_answer in data['security_questions']:
            new_question = SecurityQuestion(
                question=question_answer['question'],
                answer=question_answer['answer']
            )
            new_user.security_questions.append(new_question)

        db.session.add(new_user)  # Agrega el nuevo usuario a la sesión de la base de datos
        db.session.commit()  # Confirma los cambios en la base de datos
 
        return jsonify({'message': 'User created successfully', 'user_creation': True}), 201  # Devuelve un mensaje de éxito con el ID del nuevo usuario y un código de estado 201
   
    except Exception as e:  # Captura cualquier excepción que ocurra dentro del bloque try
        return jsonify({'error': 'Error in user creation: ' + str(e)}), 500  # Devuelve un mensaje de error con un código de estado HTTP 500 si ocurre una excepción durante el procesamiento


#estructura para de datos que le debe legar a POST, PUT
# { 
# "email": "aaaa@gmail.com",
# "name": "aaaa", 
# "last_name": "bbbb", 
# "username": "aaabbb", 
# "password": "11",
# "role": "Administrador (Admin)",
# "security_questions": [ 
# {"question": "perro", "answer": "nava"}, 
# {"question": "gato", "answer": "no"}]
# }


#------ actualizar el usuario---------
@api.route('/users/<int:user_id>', methods=['PUT'])  # Define un endpoint para actualizar un usuario mediante una solicitud PUT
@jwt_required() # Requiere autenticación con JWT para acceder a esta ruta
def update_user(user_id):  # Define la función para manejar las solicitudes PUT de actualización de usuario, con el parámetro de ID de usuario
    try:  # Inicia un bloque try-except para manejar posibles errores durante la ejecución

        data = request.json  # Obtén los datos JSON enviados en la solicitud
        if not data:  # Verifica si no se proporcionaron datos JSON
            return jsonify({'error': 'No data provided'}), 400  # Devuelve un error con código de estado 400 si no se proporcionaron datos
        
        user = User.query.get(user_id) # Busca al usuario por su ID

        if not user:  # Verifica si el usuario no fue encontrado en la base de datos
            return jsonify({'error': 'User not found'}), 404  # Devuelve un error con código de estado 404 si el usuario no fue encontrado
    
        for key, value in data.items():  # Itera sobre cada par llave-valor en el JSON recibido
            # Verifica si el usuario tiene un atributo con el nombre de la llave
            if hasattr(user, key):  # Si el usuario tiene un atributo con el nombre de la llave
                if  key == 'password': # Verifica si el atributo es 'password'
                    # Hashea la nueva contraseña y la asigna al atributo correspondiente del usuario
                    password_hash = generate_password_hash(value).decode('utf-8') # Hashea la nueva contraseña
                    setattr(user, key, password_hash) # Asigna la contraseña hasheada al atributo correspondiente del usuario
                elif key == 'role':  # Verifica si el atributo es 'role'
                    # Busca el objeto Role utilizando el nombre proporcionado en `value`
                    role = Role.query.filter_by(name=value).first()
                    if role:
                        setattr(user, key, role)
                    else:
                        return jsonify({'error': 'Role not found'}), 404
                elif key == 'security_questions':  # Verifica si el atributo es 'security_questions'
                    # Elimina las preguntas de seguridad existentes y añade las nuevas
                    SecurityQuestion.query.filter_by(user_id=user.id).delete()
                    new_questions = [
                        SecurityQuestion(question=q['question'], answer=q['answer'], user=user)
                        for q in value
                    ]
                    user.security_questions = new_questions
                else:
                    # Para otros campos, asigna el valor directamente al atributo correspondiente del usuario
                    setattr(user, key, value)

        db.session.commit()  # Confirma los cambios en la base de datos
        return jsonify({'message': 'User updated successfully'})  # Devuelve un mensaje de éxito indicando que el usuario se actualizó correctamente
    
    except Exception as e:  # Captura cualquier excepción que ocurra durante la ejecución
        return jsonify({'error': str(e)}), 500  # Devuelve un mensaje de error con el código de estado 500 (Internal Server Error)



#-------------------CONSULTAR LOS ROLES PARA INTERFAS MASTER--------------------------------------------------------------------------
#------todos los ROLE-------
@api.route('master/roles', methods=['GET'])  # Define una ruta para obtener todos los roles
@api.route('master/roles/<int:roles_id>', methods=['GET'])  # Define una ruta para obtener un rol específico por su ID
# @jwt_required() # Decorador para requerir autenticación con JWT
def get_roles(roles_id=None):  # Define una función para manejar las solicitudes GET relacionadas con los roles
    try:  # Inicia un bloque de manejo de excepciones para capturar posibles errores
        if roles_id:  # Comprueba si se proporcionó un ID de roles específico
            # Buscar un permiso específico por su ID
            roles_id = Role.query.get(roles_id)  # Busca el rol en la base de datos por su ID
            if not roles_id:  # Comprueba si el rol no se encontró en la base de datos
                return jsonify({'error': 'Permission not found'}), 404  # Devuelve un mensaje de error si el rol no se encontró
            return jsonify(roles_id.serialize()), 200  # Devuelve los detalles del rol si se encuentra correctamente

        roles = Role.query.all()  # Obtiene todos los roles de la base de datos
        roles_data = []  # Inicializa una lista para almacenar los datos de los roles
        for role in roles:  # Itera sobre cada rol obtenido de la base de datos
            role_permissions = role.role_permissions  # Obtiene los permisos asociados con el rol actual
            permissions_list = [  # Inicializa una lista para almacenar los detalles de los permisos asociados
                {
                    'id': rp.permission.id,  # ID del permiso
                    'name': rp.permission.name,  # Nombre del permiso
                    'description': rp.permission.description  # Descripción del permiso
                } for rp in role_permissions  # Itera sobre cada permiso asociado al rol
            ]
            role_data = {  # Define un diccionario con los detalles del rol actual
                'id': role.id,  # ID del rol
                'name': role.name,  # Nombre del rol
                'description': role.description,  # Descripción del rol
                'permissions': permissions_list  # Lista de permisos asociados al rol
            }
            roles_data.append(role_data)  # Agrega los detalles del rol a la lista de datos de roles

        return jsonify({'roles': roles_data}), 200  # Devuelve todos los roles con sus detalles y permisos asociados

    except Exception as e:  # Captura cualquier excepción que ocurra durante el procesamiento
        return jsonify({'error': 'Error retrieving roles: ' + str(e)}), 500  # Devuelve un mensaje de error con detalles si ocurre un error durante la recuperación de roles

    
 #-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------  
#estructura para de datos que le debe legar a POST, PUT
# {
#     "name": "Gerente de Gimnasio",
#     "description": "Responsable de la gestión diaria del gimnasio, incluyendo personal, finanzas y operaciones.",
#     "permissions": [1, 2, 3] --> ESTE ES EL ID DE LOS PERMISOS (SI EXISTEN)
# }


#------CREACION DE NUEVO ROLE----------------------------

@api.route('/master/roles', methods=['POST'])  # Define el endpoint para crear roles y asignar permisos. Se usa el método POST.
# @jwt_required() # Comentado aquí, pero este decorador requeriría autenticación con JWT para acceder a este endpoint.
def create_roles_with_permissions():  # Función que maneja la solicitud POST para crear roles y asignar permisos.
    try:
        data = request.json  # Obtiene los datos enviados en formato JSON.
        if not data:
            return jsonify({'error': 'No data provided'}), 400  # Retorna un mensaje de error si no se proporcionaron datos y un código de estado HTTP 400.

        # Preparar los datos para siempre trabajar con una lista.
        if isinstance(data, dict):  # Si es un solo objeto, conviértelo en una lista.
            data = [data]

        if not isinstance(data, list):
            return jsonify({'error': 'Expected a list or a single object of roles'}), 400  # Retorna un mensaje de error si los datos no son una lista ni un objeto.

        created_roles = []  # Lista para almacenar los roles creados.
        for item in data:  # Itera sobre cada elemento en los datos recibidos.
            # Verifica que cada rol tenga nombre, descripción y permisos.
            if 'name' not in item or 'description' not in item:
                return jsonify({'error': 'Name and description are required for each role'}), 400  # Retorna un mensaje de error si falta el nombre o la descripción.
            if 'permissions' not in item or not isinstance(item['permissions'], list):
                return jsonify({'error': 'Permissions list is required and must be an array for each role'}), 400  # Retorna un mensaje de error si faltan los permisos o no son una lista.

            if Role.query.filter_by(name=item['name']).first():
                continue  # Omitir la creación si el rol ya existe.

            new_role = Role(name=item['name'], description=item['description'])  # Crea una nueva instancia de Role.
            db.session.add(new_role)
            db.session.flush()  # Flush para obtener el ID del rol antes de commit.

            # Asignar permisos al rol.
            for permission_id in item['permissions']:
                permission = Permission.query.get(permission_id)
                if not permission:
                    db.session.rollback()
                    return jsonify({'error': f'Permission ID {permission_id} not found'}), 404  # Retorna un error si no se encuentra algún permiso.

                new_role_permission = RolePermission(role_id=new_role.id, permission_id=permission.id)  # Crea una nueva relación entre rol y permiso.
                db.session.add(new_role_permission)

            db.session.commit()  # Guarda los cambios en la base de datos.
            created_roles.append({'role_name': item['name'], 'role_id': new_role.id})  # Agrega el rol creado a la lista de roles creados.

        return jsonify({'message': 'Roles and permissions created successfully', 'roles': created_roles}), 201  # Retorna un mensaje de éxito y los roles creados con un código de estado HTTP 201.

    except Exception as e:
        db.session.rollback()  # Realiza un rollback en la base de datos para evitar inconsistencias debido al error.
        return jsonify({'error': 'Error in creating roles with permissions: ' + str(e)}), 500  # Retorna un mensaje de error con el código de estado HTTP 500 (Error Interno del Servidor).



#------EDICION DE  ROLE----------------------------

@api.route('master/roles/<int:role_id>', methods=['PUT'])  # Define una ruta para actualizar un rol específico mediante su ID
@jwt_required()  # Decorador para requerir autenticación con JWT
def update_role(role_id):  # Define una función para manejar las solicitudes PUT relacionadas con la actualización de roles
    try:  # Inicia un bloque de manejo de excepciones para capturar posibles errores
        data = request.json  # Obtiene los datos JSON de la solicitud
        if not data:  # Comprueba si no se proporcionaron datos en la solicitud
            return jsonify({'error': 'No data provided'}), 400  # Devuelve un mensaje de error si no se proporcionaron datos
        
        role = Role.query.get(role_id)  # Obtiene el rol correspondiente al ID proporcionado
        if not role:  # Comprueba si el rol no se encontró en la base de datos
            return jsonify({'error': 'Role not found'}), 404  # Devuelve un mensaje de error si el rol no se encontró
        
        if 'name' in data:  # Comprueba si se proporcionó el nombre del rol en los datos de la solicitud
            role.name = data['name']  # Actualiza el nombre del rol con el valor proporcionado
        if 'description' in data:  # Comprueba si se proporcionó la descripción del rol en los datos de la solicitud
            role.description = data['description']  # Actualiza la descripción del rol con el valor proporcionado

        # Actualizar permisos si se proporcionan en la solicitud
        if 'permissions' in data and isinstance(data['permissions'], list):  # Comprueba si se proporcionó una lista de permisos en los datos de la solicitud
            # Eliminar todos los permisos existentes asociados al rol
            RolePermission.query.filter_by(role_id=role.id).delete()
            # Agregar nuevos permisos al rol
            for permission_id in data['permissions']:  # Itera sobre los IDs de permisos proporcionados
                permission = Permission.query.get(permission_id)  # Obtiene el permiso correspondiente al ID de la base de datos
                if not permission:  # Comprueba si el permiso no se encontró en la base de datos
                    db.session.rollback()  # Revierte la transacción de la base de datos
                    return jsonify({'error': f'Permission ID {permission_id} not found'}), 404  # Devuelve un mensaje de error si el permiso no se encontró
                new_role_permission = RolePermission(role_id=role.id, permission_id=permission.id)  # Crea una nueva asignación de permiso para el rol
                db.session.add(new_role_permission)  # Agrega la asignación de permiso a la sesión de base de datos

        db.session.commit()  # Realiza commit de la transacción en la base de datos

        return jsonify({'message': 'Role updated successfully'}), 200  # Devuelve un mensaje de éxito después de actualizar el rol correctamente

    except Exception as e:  # Captura cualquier excepción que ocurra durante el procesamiento
        db.session.rollback()  # Revierte la transacción de la base de datos en caso de error
        return jsonify({'error': 'Error updating role: ' + str(e)}), 500  # Devuelve un mensaje de error con detalles si ocurre un error durante la actualización del rol


#------ELIMINAR ROLE POR ID----------------------------

@api.route('master/roles/<int:role_id>', methods=['DELETE'])  # Define una ruta para eliminar un rol específico mediante su ID
@jwt_required()  # Decorador para requerir autenticación con JWT
def delete_role(role_id):  # Define una función para manejar las solicitudes DELETE relacionadas con la eliminación de roles
    try:  # Inicia un bloque de manejo de excepciones para capturar posibles errores
        role = Role.query.get(role_id)  # Obtiene el rol correspondiente al ID proporcionado
        if not role:  # Comprueba si el rol no se encontró en la base de datos
            return jsonify({'error': 'Role not found'}), 404  # Devuelve un mensaje de error si el rol no se encontró
        
        # Actualizar usuarios que tienen este rol a un rol predeterminado o nulo
        default_role_id = 1  # Asumiendo que 1 es el ID de un rol por defecto (SE DEBE ESTABLECER EN NULL)
        users_with_role = User.query.filter_by(role_id=role_id).all()  # Obtiene todos los usuarios que tienen el rol especificado
        for user in users_with_role:  # Itera sobre los usuarios con el rol especificado
            user.role_id = default_role_id  # Actualiza el ID del rol del usuario al rol predeterminado o nulo
        
        # Eliminar asociaciones de permisos
        RolePermission.query.filter_by(role_id=role.id).delete()  # Elimina todas las asociaciones de permisos relacionadas con el rol
        # Eliminar el rol
        db.session.delete(role)  # Elimina el rol de la base de datos
        db.session.commit()  # Realiza commit de la transacción en la base de datos

        return jsonify({'message': 'Role deleted successfully'}), 200  # Devuelve un mensaje de éxito después de eliminar el rol correctamente

    except Exception as e:  # Captura cualquier excepción que ocurra durante el procesamiento
        db.session.rollback()  # Revierte la transacción de la base de datos en caso de error
        return jsonify({'error': 'Error deleting role: ' + str(e)}), 500  # Devuelve un mensaje de error con detalles si ocurre un error durante la eliminación del rol

    
#------------------------------------------- PERMISOS ------------------------------------------------------------------
#------------------ CREAR PERMISO---------------
@api.route('/master/permissions', methods=['POST'])  # Define el endpoint para crear nuevos permisos.
# @jwt_required() # Comentado aquí, pero este decorador requeriría autenticación con JWT para acceder a este endpoint.
def create_permissions():
    try:
        data = request.json  # Obtiene los datos enviados en formato JSON.
        if not data:
            return jsonify({'error': 'No data provided'}), 400  # Retorna un mensaje de error si no se proporcionaron datos.

        if isinstance(data, dict):  # Si los datos son un solo objeto, conviértelos en una lista.
            data = [data]

        if not isinstance(data, list):  # Verifica si los datos son una lista.
            return jsonify({'error': 'Expected a list or a single object of permissions'}), 400

        created_permissions = []  # Lista para almacenar los permisos creados.
        duplicate_permissions = []  # Lista para almacenar los nombres de los permisos duplicados.
        for item in data:
            if 'name' not in item or not item['name'].strip():  # Verifica que cada permiso tenga un nombre.
                return jsonify({'error': 'Name is required for each permission'}), 400

            description = item.get('description', '').strip()  # Obtiene la descripción del permiso, si existe.
            existing_permission = Permission.query.filter_by(name=item['name']).first()  # Busca si el permiso ya existe.

            if existing_permission:  # Si el permiso ya existe, lo añade a la lista de duplicados.
                duplicate_permissions.append(item['name'])
                continue  # Continúa con el siguiente item sin crear un duplicado.

            new_permission = Permission(name=item['name'], description=description)  # Crea una nueva instancia de Permission.
            db.session.add(new_permission)
            db.session.flush()  # Asigna un ID antes del commit final.
            created_permissions.append({'name': item['name'], 'id': new_permission.id})  # Añade el nuevo permiso a la lista de creados.

        db.session.commit()  # Confirma todos los cambios en la base de datos.

        response = {
            'message': 'Permissions created successfully',
            'permissions': created_permissions
        }
        if duplicate_permissions:  # Si hay duplicados, añade una nota al respecto en la respuesta.
            response['duplicate'] = f"The following permissions already existed and were not created: {', '.join(duplicate_permissions)}"

        return jsonify(response), 201  # Retorna los detalles de los permisos creados y los duplicados, si los hay.

    except Exception as e:  # Captura cualquier excepción que ocurra durante la ejecución.
        db.session.rollback()  # Realiza un rollback para mantener la consistencia de la base de datos.
        return jsonify({'error': str(e)}), 500  # Retorna un mensaje de error con el código de estado HTTP 500 (Error Interno del Servidor).


#------------------ CONSULTAR PERMISO O TODOS LOS PERMISOS---------------

@api.route('master/permissions', methods=['GET'])  # Define una ruta para manejar solicitudes GET a '/master/permissions'
@api.route('master/permissions/<int:permission_id>', methods=['GET'])  # Define otra ruta para manejar solicitudes GET a '/master/permissions/<int:permission_id>', donde <int:permission_id> es una variable para el ID del permiso
# @jwt_required()  # Requiere autenticación con JWT para acceder a estas rutas
def get_permissions(permission_id=None):  # Define la función para manejar las solicitudes GET de permisos, con un parámetro opcional de ID de permiso
    try:  # Inicia un bloque try-except para manejar posibles errores durante la ejecución
        if permission_id:  # Comprueba si se proporcionó un ID de permiso
            # Busca un permiso específico por su ID
            permission = Permission.query.get(permission_id)
            if not permission:  # Si no se encuentra el permiso
                return jsonify({'error': 'Permission not found'}), 404  # Devuelve un mensaje de error con el código de estado 404 (Not Found)
            return jsonify(permission.serialize()), 200  # Si se encuentra el permiso, devuelve sus datos serializados con el código de estado 200 (OK)
        else:  # Si no se proporcionó un ID de permiso
            # Obtiene todos los permisos de la base de datos
            permissions = Permission.query.all()
            return jsonify([perm.serialize() for perm in permissions]), 200  # Devuelve todos los permisos serializados con el código de estado 200 (OK)

    except Exception as e:  # Captura cualquier excepción que ocurra durante la ejecución
        return jsonify({'error': str(e)}), 500  # Devuelve un mensaje de error con el código de estado 500 (Internal Server Error)



#------------------ eliminar PERMISOS---------------

@api.route('master/permissions/<int:permission_id>', methods=['DELETE'])  # Define una ruta para manejar solicitudes DELETE a '/master/permissions/<int:permission_id>'
# @jwt_required()  # Requiere autenticación con JWT para acceder a esta ruta
def delete_permission(permission_id):  # Define la función para manejar las solicitudes DELETE de permisos, con el parámetro de ID de permiso
    try:  # Inicia un bloque try-except para manejar posibles errores durante la ejecución
        permission = Permission.query.get(permission_id)  # Busca el permiso con el ID proporcionado
        if not permission:  # Si no se encuentra el permiso
            return jsonify({'error': 'Permission not found'}), 404  # Devuelve un mensaje de error con el código de estado 404 (Not Found)

        # Verifica si el permiso está siendo utilizado en alguna parte antes de eliminarlo
        role_permissions = RolePermission.query.filter_by(permission_id=permission_id).all()
        if role_permissions:  # Si el permiso está asignado a algún rol
            # Rechaza la solicitud de eliminación y devuelve un mensaje explicativo
            return jsonify({
                'error': 'Cannot delete permission because it is in use',
                'detail': 'This permission is currently assigned to one or more roles.'
            }), 403  # Código 403 Forbidden es adecuado aquí

        # Si no hay roles utilizando este permiso, procede con la eliminación
        db.session.delete(permission)  # Elimina el permiso de la base de datos
        db.session.commit()  # Confirma los cambios en la base de datos
        return jsonify({'message': 'Permission deleted successfully'}), 200  # Devuelve un mensaje de éxito con el código de estado 200 (OK)

    except Exception as e:  # Captura cualquier excepción que ocurra durante la ejecución
        db.session.rollback()  # Realiza un rollback para evitar inconsistencias en la base de datos
        return jsonify({'error': 'Error deleting permission: ' + str(e)}), 500  # Devuelve un mensaje de error con el código de estado 500 (Internal Server Error)


#------ actualizar el usuario---------
@api.route('/singup/user', methods=['PUT'])  # Define un endpoint para actualizar un personaje mediante una solicitud PUT
@jwt_required() 
def update_comun_user():
    try:

        data = request.json  # Obtén los datos JSON enviados en la solicitud
        if not data:  # Verifica si no se proporcionaron datos JSON
            return jsonify({'error': 'No data provided'}), 400  # Devuelve un error con código de estado 400 si no se proporcionaron datos
        
        current_user_id = get_jwt_identity() # Obtiene la id del usuario del token  # Busca el usuaerio en la base de datos utilizando su ID
        user = User.query.get(current_user_id) # Buscar al usuario por su ID

        if not user:  # Verifica si el user no fue encontrado en la base de datos
            return jsonify({'error': 'User not found'}), 404  # Devuelve un error con código de estado 404 si el user no fue encontrado
    
        # Iterar sobre cada campo en el JSON y actualizar el user si corresponde
        for key, value in data.items():  #items() para iterar sobre cada par llave-valor en el JSON recibido
            # Verificar si el campo existe en la clase Character
            if hasattr(user, key):  # Verifica si el user tiene un atributo con el nombre de la llave
                if  key == 'password': #verificamos si unos de los atributos es password la hasheamos para luego incluirtla
                    password_hash = generate_password_hash(value).decode('utf-8') #hasheamos la nueva contraseña
                    setattr(user, key, password_hash) # iteramos sobre la llave 'password' y le asigamos la nueva contraseña hasheada
                else:
                    # Para otros campos, asignar el valor directamente al atributo correspondiente del usuario
                    setattr(user, key, value)

        db.session.commit()  # Confirma los cambios en la base de datos
        return jsonify({'message': 'Password updated successfully'})  # Devuelve un mensaje de éxito indicando que el personaje se actualizó correctamente
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500



#-------------------CREAR  USUARIO COMUN--------------------------------------------------------------------------
@api.route('/singup/user', methods=['POST'])  # Define un endpoint para agregar un nuevo usuario mediante una solicitud POST a la ruta '/users'
def create_new_normal_user():  # Define la función que manejará la solicitud
    try:  # Inicia un bloque try para manejar posibles excepciones
        data = request.json  # Obtén los datos JSON enviados en la solicitud
        if not data:  # Verifica si no se proporcionaron datos JSON
            return jsonify({'error': 'No data provided'}), 400  # Devuelve un error con código de estado 400 si no se proporcionaron datos

        if 'email' not in data:  # Verifica si 'email' no está presente en los datos JSON
            return jsonify({'error': 'Email is required'}), 400  # Devuelve un error con código de estado 400 si 'email' no está presente

        if 'username' not in data:  # Verifica si 'username' no está presente en los datos JSON
            return jsonify({'error': 'Username is required'}), 400  # Devuelve un error con código de estado 400 si 'username' no está presente

        if 'password' not in data:  # Verifica si 'password' no está presente en los datos JSON
            return jsonify({'error': 'Password is required'}), 400  # Devuelve un error con código de estado 400 si 'password' no está presente

        # Verifica si se proporcionan las preguntas y respuestas de seguridad en los datos JSON
        if 'security_questions' not in data or len(data['security_questions']) != 2:
            return jsonify({'error': 'Security questions and answers are required'}), 400
        
        if 'role' not in data:  # Verifica si 'role' no está presente en los datos JSON
            return jsonify({'error': 'role is required'}), 400  # Devuelve un error con código de estado 400 si 'password' no está presente


        existing_user = User.query.filter_by(email=data['email']).first()  # Busca un usuario en la base de datos con el mismo email
        if existing_user:  # Verifica si ya existe un usuario con el mismo email
            return jsonify({'error': 'Email already exists.'}), 409  # Devuelve un error con código de estado 409 si ya existe un usuario con el mismo email

        existing_username = User.query.filter_by(username=data['username']).first()  # Busca un usuario en la base de datos con el mismo username
        if existing_username:  # Verifica si ya existe un usuario con el mismo username
            return jsonify({'error': 'Username already exists.'}), 409  # Devuelve un error con código de estado 409 si ya existe un usuario con el mismo username

        # Búsqueda del rol especificado
        role = Role.query.filter_by(name=data['role']).first()
        if not role:
            return jsonify({'error': 'Role does not exist'}), 404

        password_hash = generate_password_hash(data['password']).decode('utf-8')

        new_user = User(email=data['email'], password=password_hash, username=data['username'], name=data.get('name'), last_name=data.get('last_name'), role=role)
       
        # Agrega las preguntas y respuestas de seguridad al usuario
        for question_answer in data['security_questions']:
            new_question = SecurityQuestion(
                question=question_answer['question'],
                answer=question_answer['answer']
            )
            new_user.security_questions.append(new_question)
    

        # Generación del token y envío del correo electrónico
        token = generate_confirmation_token_email(new_user.email)
        # html = render_template('activate.html', confirm_url=confirm_url)
        confirm_url = url_for('api.confirm_email', token=token, _external=True)
        confirm_url = f"https://fantastic-xylophone-wrr5p4xqpjxj35x7-3000.app.github.dev/ConfirmEmail?token={token}"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
        </head>
        <body>
            <div style="margin: 0 auto; width: 80%; padding: 20px; border: 1px solid #ccc; border-radius: 5px; box-shadow: 0 2px 3px #ccc;">
                <h1 style="color: #333;">Confirm Your Email</h1>
                <p>Thank you for registering! Please click the button below to activate your account:</p>
                <a href="{confirm_url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">Activate Account</a>
            </div>
        </body>
        </html>"""

        send_email('Confirm Your Email', new_user.email, html)  # Envía el email de confirmación.

        db.session.add(new_user)  # Agrega el nuevo usuario a la base de datos.
        db.session.commit()  # Guarda los cambios en la base de datos.

        return jsonify({'message': 'Please confirm your email address to complete the registration', 'create': True}), 201  # Devuelve un mensaje solicitando la confirmación del email.

    except Exception as e:  # Captura cualquier excepción que ocurra durante el proceso.
        return jsonify({'error': 'Error in user creation: ' + str(e)}), 500  # Devuelve un mensaje de error si ocurre un problema.

#------ actualizar el usuario---------
@api.route('/user', methods=['PUT'])
@jwt_required()
def update_data_user():
    try:
        user_id = get_jwt_identity()
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Flag para detectar si las preguntas de seguridad están siendo actualizadas
        security_questions_updated = 'security_questions' in data and data['security_questions']

        for key, value in data.items():
            if hasattr(user, key):
                if key == 'password' and value:
                    password_hash = generate_password_hash(value).decode('utf-8')
                    setattr(user, key, password_hash)
                elif key == 'role' and value:
                    role = Role.query.filter_by(name=value).first()
                    if role:
                        setattr(user, key, role)
                    else:
                        return jsonify({'error': 'Role not found'}), 404
                elif key == 'security_questions' and security_questions_updated:
                    # Primero elimina las preguntas antiguas solo si se están actualizando
                    SecurityQuestion.query.filter_by(user_id=user.id).delete()
                    new_questions = [
                        SecurityQuestion(question=q['question'], answer=q['answer'], user=user)
                        for q in value
                    ]
                    user.security_questions = new_questions
                elif key != 'security_questions':
                    setattr(user, key, value)

        db.session.commit()
        return jsonify({'message': 'User updated successfully'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


#--------------------- activacion de cuenta via email----------------
@api.route('/confirm/<string:token>', methods=['POST'])  # Define un endpoint para confirmar un email usando un token. El método permitido es POST.
def confirm_email(token):  # Función que maneja la solicitud POST para confirmar el email.
    try:  # Inicia un bloque try para manejar posibles excepciones.
        email = confirm_token_email(token)  # Intenta decodificar el token para obtener el email.
        if not email:  # Verifica si el email no se pudo obtener (i.e., token inválido o vacío).
            raise ValueError("El email no puede estar vacío")  # Lanza un ValueError si el email está vacío.

        user = User.query.filter_by(email=email).first_or_404()  # Busca al usuario por email en la base de datos; devuelve 404 si no se encuentra.
        if user.is_active:  # Verifica si la cuenta del usuario ya está activa.
            return jsonify(message='Account already confirmed. Please login.'), 400  # Devuelve un mensaje indicando que la cuenta ya está confirmada y un código de estado HTTP 400.

        else:  # Si la cuenta del usuario no está activa:
            user.is_active = True  # Establece el estado de la cuenta del usuario a activo.
            db.session.commit()  # Guarda los cambios en la base de datos.
            return jsonify({'message':'You have confirmed your account. Thanks!', 'confirm_email':True}), 200  # Devuelve un mensaje de éxito y confirma que el email ha sido verificado, con un código de estado HTTP 200.
    
    except:  # Bloque except que captura cualquier excepción no manejada en el bloque try.
        return jsonify(message='The confirmation link is invalid or has expired.'), 400  # Devuelve un mensaje indicando que el enlace de confirmación es inválido o ha expirado, con un código de estado HTTP 400.


#-------------------VALIDAR TOKEN  --------------------------------------------------------------------------

@api.route('/validate-token', methods=['GET'])
@jwt_required()
def validate_token():
    try:
        user_id = get_jwt_identity()  # Obtiene el ID del usuario desde el token
        user = User.query.get(user_id)  # Busca al usuario por su ID

        if not user:
            return jsonify({'error': 'User not found'}), 404  # Si el usuario no existe, devuelve error

        # Devuelve la información básica del usuario para confirmar que el token es válido
        user_info = {
            'id': user.id,
            'email': user.email
        }
        return jsonify({'message': 'Token is valid', 'user': user_info}), 200  # Devuelve un mensaje de éxito y la información del usuario

    except Exception as e:
        return jsonify({'error': str(e)}), 500  # En caso de error, devuelve un error interno del servidor

#-------------------CREAR  TOKEN LOGIN--------------------------------------------------------------------------
@api.route('/token', methods=['POST'])  # Define un endpoint para agregar un nuevo usuario mediante una solicitud POST a la ruta '/users'
def create_normal_user_token():  # Define la función que manejará la solicitud
    try:  # Inicia un bloque try para manejar posibles excepciones
        data = request.json  # Obtén los datos JSON enviados en la solicitud
        if not data:  # Verifica si no se proporcionaron datos JSON
            return jsonify({'error': 'No data provided'}), 400  # Devuelve un error con código de estado 400 si no se proporcionaron datos

        if 'email' not in data:  # Verifica si 'email' no está presente en los datos JSON
            return jsonify({'error': 'Email is required'}), 400  # Devuelve un error con código de estado 400 si 'email' no está presente

        if 'password' not in data:  # Verifica si 'password' no está presente en los datos JSON
            return jsonify({'error': 'Password is required'}), 400  # Devuelve un error con código de estado 400 si 'password' no está presente

        existing_user = User.query.filter_by(email=data['email']).first()  # Busca un usuario en la base de datos con el mismo email
        if not existing_user:  # Verifica si ya existe un usuario con el mismo email
            return jsonify({'error': 'Email does not exist.'}), 400  # Devuelve un error con código de estado 409 si ya existe un usuario con el mismo email

        password_user_db = existing_user.password  # Extraemos la contraseña almacenada del usuario existente en la base de datos

        true_o_false = check_password_hash(password_user_db, data['password'])  # Comparamos la contraseña ingresada en el formulario con la contraseña almacenada en la base de datos, después de descifrarla

        if true_o_false:  # Si la comparación es verdadera, es decir, las contraseñas coinciden
            expires = timedelta(days=1)  # Configuramos la duración del token de acceso
            user_id = existing_user.id  # Obtenemos el ID del usuario existente en la base de datos
            role = existing_user.role.name  # Obtenemos el ID del usuario existente en la base de datos
            access_token = create_access_token(identity=user_id, expires_delta=expires)  # Creamos un token de acceso para el usuario
            return jsonify({'access_token': access_token, 'login': True, 'role':role}), 200  # Devolvemos el token de acceso como respuesta exitosa
        else:  # Si la comparación de contraseñas es falsa, es decir, las contraseñas no coinciden
            return jsonify({'error': 'Incorrect password'}), 400  # Devolvemos un mensaje de error indicando que la contraseña es incorrecta

    except Exception as e:  # Captura cualquier excepción que ocurra dentro del bloque try
        return jsonify({'error': 'Error login user: ' + str(e)}), 500  # Devuelve un mensaje de error con un código de estado HTTP 500 si ocurre una excepción durante el procesamiento



#-------------------CREAR  TOKEN recuperar contraseña--------------------------------------------------------------------------
@api.route('/tokenLoginHelp', methods=['POST'])  # Define un endpoint para agregar un nuevo usuario mediante una solicitud POST a la ruta '/users'
def create_token_login_help():  # Define la función que manejará la solicitud
    try:  # Inicia un bloque try para manejar posibles excepciones
        data = request.json  # Obtén los datos JSON enviados en la solicitud
        if not data:  # Verifica si no se proporcionaron datos JSON
            return jsonify({'error': 'No data provided'}), 400  # Devuelve un error con código de estado 400 si no se proporcionaron datos

        if 'email' not in data:  # Verifica si 'email' no está presente en los datos JSON
            return jsonify({'error': 'Email is required'}), 400  # Devuelve un error con código de estado 400 si 'email' no está presente

        existing_user = User.query.filter_by(email=data['email']).first()  # Busca un usuario en la base de datos con el mismo email
        if existing_user:  # Si la comparación es verdadera, es decir, el email coinciden
            expires = timedelta(hours=1)  # Configuramos la duración del token de acceso
            user_id = existing_user.id  # Obtenemos el ID del usuario existente en la base de datos
            access_token = create_access_token(identity=user_id, expires_delta=expires)  # Creamos un token de acceso para el usuario
            return jsonify({'access_token': access_token, 'login': True}), 200  # Devolvemos el token de acceso como respuesta exitosa
        else:  # Si la comparación de contraseñas es falsa, es decir, las contraseñas no coinciden
            return jsonify({'error': 'Email does not exist.'}), 400  # Devuelve un error con código de estado 400 si ya existe un usuario con el mismo email
    
    except Exception as e:  # Captura cualquier excepción que ocurra dentro del bloque try
        return jsonify({'error': 'Error email user: ' + str(e)}), 500  # Devuelve un mensaje de error con un código de estado HTTP 500 si ocurre una excepción durante el procesamiento



#--------------------------------------------------ENPOINT PARA LA CONSULTA DE Y CREACION DE RESERVAS DE CLASE-----------------------------------
#Consultar reservas (GET)
@api.route('/booking', methods=['GET'])  # Define el endpoint para obtener todas las reservas.
# @jwt_required() # Decorador comentado que requeriría autenticación con JWT para acceder a este endpoint.
def get_booking():  # Función que maneja la solicitud GET.
    try:
        all_booking = Booking.query.all()  # Consulta todas las reservas existentes en la base de datos.
        if not all_booking:  # Verifica si no se encontraron reservas.
            return jsonify({'message': 'No booking found'}), 404  # Retorna un mensaje indicando que no se encontraron reservas y un código de estado HTTP 404.
        
        response_body = [booking.serialize() for booking in all_booking]  # Serializa cada reserva para la respuesta.
        return jsonify(response_body), 200  # Retorna la lista de reservas serializadas y un código de estado HTTP 200.

    except Exception as e:  # Captura cualquier excepción que ocurra durante la ejecución.
        return jsonify({'error': str(e)}), 500  # Retorna un mensaje de error con el código de estado HTTP 500 (Error Interno del Servidor).



#Endpoint para Crear una Reserva:
@api.route('/book_class', methods=['POST'])  # Define el endpoint para reservar una clase.
@jwt_required()  # Decorador para requerir autenticación con JWT, asegurando que solo usuarios autenticados puedan hacer reservas.
def book_class():  # Función que maneja la solicitud POST para crear una reserva.
    try:
        user_id = get_jwt_identity()  # Obtiene el ID del usuario autenticado a partir del token JWT.
        training_class_id = request.json.get('training_class_id')  # Extrae el ID de la clase de entrenamiento de la solicitud.

        if not training_class_id:  # Verifica si no se proporcionó el ID de la clase.
            return jsonify({'error': 'Training class ID is required'}), 400  # Retorna un mensaje de error si falta el ID de la clase y un código de estado HTTP 400.

        user = User.query.get(user_id)  # Busca al usuario en la base de datos usando el ID obtenido.
        if not (user.has_active_membership() and user.has_remaining_classes()):  # Verifica si el usuario tiene una membresía activa y clases restantes.
            return jsonify({'error': "No active membership or no remaining classes"}), 400  # Retorna un error si el usuario no cumple con los requisitos para reservar.
        
        if not user.consume_class():  # Intenta consumir una clase del saldo disponible del usuario.
            return jsonify({'error': "No classes left to book"}), 400  # Retorna un error si no quedan clases disponibles para reservar.
        
        success, message, booking_id = create_booking(user_id, training_class_id)  # Intenta crear la reserva y recibe un estado de éxito y un mensaje.
        if success:
            return jsonify({'status_booking': True, 'message': message, 'booking_id': booking_id}), 200  # Si la reserva es exitosa, retorna un mensaje de éxito y un código de estado HTTP 200.
        else:
            return jsonify({'status_booking': False,'error': message}), 400  # Si falla la reserva, retorna un mensaje de error y un código de estado HTTP 400.
        
    except Exception as e:  # Captura cualquier excepción que ocurra durante la ejecución.
        db.session.rollback()  # Realiza un rollback para evitar inconsistencias en la base de datos debido al error.
        return jsonify({'error': 'Error booking class: ' + str(e)}), 500  # Retorna un mensaje de error con el código de estado HTTP 500.


    
#Endpoint para Cancelar una Reserva:
@api.route('/cancel_booking/<int:booking_id>', methods=['DELETE'])  # Define el endpoint para cancelar una reserva específica. Se usa el método DELETE.
@jwt_required()  # Decorador para requerir autenticación con JWT, asegurando que solo usuarios autenticados puedan cancelar reservas.
def cancel_booking_endpoint(booking_id):  # Función que maneja la solicitud DELETE para cancelar una reserva.
    try:
        success, message = cancel_booking(booking_id)  # Llama a una función para intentar cancelar la reserva identificada por `booking_id`.
        if success:
            return jsonify({'message': message, 'status_cancele':True }), 200  # Si la cancelación es exitosa, retorna un mensaje de éxito y un código de estado HTTP 200.
        else:
            return jsonify({'error': message, 'status_cancele':False }), 400  # Si la cancelación falla, retorna un mensaje de error y un código de estado HTTP 400.
    
    except Exception as e:  # Captura cualquier excepción que ocurra durante la ejecución.
        db.session.rollback()  # Realiza un rollback en la base de datos para evitar inconsistencias como resultado del error.
        return jsonify({'error': 'error canceling class: ' + str(e)}), 500  # Devuelve un mensaje de error con el código de estado HTTP 500 (Error Interno del Servidor).


#-------------------------------------------------ENPOINT PARA LAS CLASES-----------------------------------------------------------
#Consultar clases (GET)
@api.route('/training_classes', methods=['GET'])  # Define el endpoint para obtener todas las clases de entrenamiento disponibles. Se usa el método GET.
# @jwt_required() # este decorador requeriría autenticación con JWT para acceder a este endpoint.
def get_training_classes():  # Función que maneja la solicitud GET para obtener clases de entrenamiento.
    try:
        classes = Training_classes.query.all()  # Consulta todas las clases de entrenamiento existentes en la base de datos.
        if not classes:  # Verifica si no se encontraron clases.
            return jsonify({'message': 'No training_classes found'}), 404  # Retorna un mensaje indicando que no se encontraron clases y un código de estado HTTP 404.
        
        response_body = [training_classes.serialize() for training_classes in classes]  # Serializa cada clase de entrenamiento para la respuesta.
        return jsonify(response_body), 200  # Retorna la lista de clases de entrenamiento serializadas y un código de estado HTTP 200.

    except Exception as e:  # Captura cualquier excepción que ocurra durante la ejecución.
        return jsonify({'error': str(e)}), 500  # Retorna un mensaje de error con el código de estado HTTP 500 (Error Interno del Servidor).



#Crear  clases (POST)
@api.route('/training_classes', methods=['POST'])  # Define el endpoint para crear nuevas clases de entrenamiento. Se usa el método POST.
@jwt_required()  # Decorador para requerir autenticación con JWT, asegurando que solo usuarios autenticados puedan crear clases.
def create_training_classes():  # Función que maneja la solicitud POST para crear clases de entrenamiento.
    data = request.get_json()  # Obtiene los datos enviados en formato JSON.
    if not data:  # Verifica si no se proporcionaron datos.
        return jsonify({'error': 'No input data provided'}), 400  # Retorna un mensaje de error si no se proporcionaron datos y un código de estado HTTP 400.

    if isinstance(data, dict):  # Si los datos son un solo objeto, conviértelos en una lista para manejarlos de manera uniforme.
        data = [data]

    created_classes = []  # Lista para almacenar las instancias de las clases creadas.
    errors = []  # Lista para almacenar los errores que puedan ocurrir.
    for item in data:  # Itera sobre cada elemento de los datos recibidos.
        name = item.get('name')
        description = item.get('description')
        instructor_id = item.get('instructor_id')
        dateTime_class = item.get('dateTime_class')
        start_time = item.get('start_time')
        duration_minutes = item.get('duration_minutes')
        available_slots = item.get('available_slots')

        # Verifica que todos los campos necesarios están presentes.
        if not all([name, dateTime_class, start_time, duration_minutes, available_slots]):
            errors.append({'error': 'Missing data for class', 'class_info': item})  # Agrega un error si falta algún dato.
            continue

        try:
            new_class = Training_classes(
                name=name,
                description=description,
                instructor_id=instructor_id,
                dateTime_class=dateTime_class,
                start_time=start_time,
                duration_minutes=duration_minutes,
                available_slots=available_slots
            )
            db.session.add(new_class)  # Agrega la nueva clase a la sesión de la base de datos.
            created_classes.append(new_class)  # Agrega la clase creada a la lista de clases creadas.
        except Exception as e:
            errors.append({'error': str(e), 'class_info': item})  # Agrega un error si ocurre una excepción durante la creación.
            db.session.rollback()  # Realiza un rollback para evitar inconsistencias en la base de datos.
            continue

    db.session.commit()  # Guarda los cambios en la base de datos si todo fue correcto.
    
    if errors:
        # Retorna un estado 207 Multi-Status si hubo errores pero algunas clases se crearon correctamente.
        return jsonify({'errors': errors, 'created_classes': [{'class_id': cls.id, 'name': cls.name} for cls in created_classes]}), 207

    # Retorna un mensaje de éxito y la lista de clases creadas si no hubo errores.
    return jsonify({'message': 'Training classes created successfully', 'created_classes': [{'class_id': cls.id, 'name': cls.name} for cls in created_classes]}), 201


#Modificar una clase existente (PUT)
# {
#     "name": "Yoga Advanced",
#     "description": "A class for advanced yoga practitioners.",
#     "instructor_id": 2,
#     "dateTime_class": "2024-06-15T08:00:00",
#     "start_time": "08:00:00",
#     "duration_minutes": 90,
#     "available_slots": 15,
# }
@api.route('/training_classes/<int:class_id>', methods=['PUT'])
@jwt_required()
def update_training_class(class_id):
    try:
        data = request.get_json()  # Asegúrate de que esto esté importado y configurado correctamente.
        if not data:
            return jsonify({'error': 'No data provided'}), 400  # Mensaje claro sobre la falta de datos.

        training_class = Training_classes.query.get(class_id)  # Recupera la clase usando el ID.
        if not training_class:
            return jsonify({'error': 'Training class not found'}), 404  # Error si la clase no se encuentra.

        # Itera sobre cada campo en el JSON y actualiza la clase si corresponde.
        for key, value in data.items():
            if hasattr(training_class, key):  # Comprueba si la clase tiene un atributo con el nombre de la llave.
                setattr(training_class, key, value)  # Establece el valor solo si la clase tiene ese atributo.

        db.session.commit()  # Confirma los cambios en la base de datos.
        return jsonify({'message': 'Training class updated successfully'}), 200  # Retorna un mensaje de éxito.

    except Exception as e:
        db.session.rollback()  # Asegúrate de revertir cualquier cambio si ocurre un error.
        return jsonify({'error': 'Error updating training class: ' + str(e)}), 500  # Mensaje de error con el error específico.



#CANCELAR una clase existente (PUT)
@api.route('/cancel_class/<int:class_id>', methods=['PUT'])
# @jwt_required()
def cancel_class(class_id):
    # Buscar la clase por ID
    training_class = Training_classes.query.get(class_id)
    if not training_class:
        return jsonify({'error': 'Class not found'}), 404

    # Verificar si la clase ya está cancelada
    if not training_class.Class_is_active:
        return jsonify({'error': 'Class is already cancelled'}), 400

    # Cancelar la clase y actualizar las reservas y clases de los usuarios
    success, message = cancel_class_and_update_bookings(training_class)
    if success:
        return jsonify({'message': message}), 200
    else:
        return jsonify({'error': message}), 400



#Eliminar una clase (DELETE)
@api.route('/training_classes/<int:class_id>', methods=['DELETE'])  # Define el endpoint para eliminar una clase de entrenamiento específica. Se usa el método DELETE.
@jwt_required()  # Decorador para requerir autenticación con JWT, asegurando que solo usuarios autenticados puedan eliminar clases.
def delete_training_class(class_id):  # Función que maneja la solicitud DELETE para eliminar una clase de entrenamiento.
    # Obtener la clase a eliminar
    training_class = Training_classes.query.get(class_id)  # Busca la clase de entrenamiento en la base de datos usando el ID proporcionado.
    if not training_class:  # Comprueba si la clase no se encontró en la base de datos.
            return jsonify({'error': 'training_classes not found'}), 404  # Devuelve un mensaje de error si la clase no se encontró y un código de estado HTTP 404.

    try:
        db.session.delete(training_class)  # Elimina la clase de entrenamiento de la base de datos.
        db.session.commit()  # Guarda los cambios en la base de datos.
        return jsonify({'message': 'Training class deleted successfully'}), 200  # Retorna un mensaje de éxito y un código de estado HTTP 200.
    except Exception as e:
        db.session.rollback()  # Realiza un rollback en la base de datos para evitar inconsistencias debido al error.
        return jsonify({'error': str(e)}), 500  # Retorna un mensaje de error con el código de estado HTTP 500 (Error Interno del Servidor).


#-------------------------------------------------ENPOINT PARA LAS MEMBRESIAS-----------------------------------------------------------
#Consultar todas las MEMBRESIA (GET)
@api.route('/memberships', methods=['GET'])  # Define el endpoint para obtener todas las membresías disponibles. Se usa el método GET.
@jwt_required() # Comentado aquí, pero este decorador requeriría autenticación con JWT para acceder a este endpoint.
def get_memberships():  # Función que maneja la solicitud GET para obtener membresías.
    try:
        memberships = Membership.query.all()  # Consulta todas las membresías existentes en la base de datos.
        if not memberships:  # Verifica si no se encontraron membresías.
            return jsonify({'message': 'No memberships found'}), 404  # Retorna un mensaje indicando que no se encontraron membresías y un código de estado HTTP 404.
        
        response_body = [membership.serialize() for membership in memberships]  # Serializa cada membresía para la respuesta.
        return jsonify(response_body), 200  # Retorna la lista de membresías serializadas y un código de estado HTTP 200.

    except Exception as e:  # Captura cualquier excepción que ocurra durante la ejecución.
        return jsonify({'error': str(e)}), 500  # Retorna un mensaje de error con el código de estado HTTP 500 (Error Interno del Servidor).

#Consultar historial de MEMBRESIA (GET)
@api.route('/histoy_memberships', methods=['GET'])  # Define el endpoint para obtener el historial de membresías. Se usa el método GET.
# @jwt_required() # Decorador para requerir autenticación con JWT, asegurando que solo usuarios autenticados puedan acceder a esta información.
def get_histoy_memberships():  # Función que maneja la solicitud GET para obtener el historial de membresías.
    try:
        histoy_memberships = UserMembershipHistory.query.all()  # Consulta todo el historial de membresías en la base de datos.
        if not histoy_memberships:  # Verifica si no se encontraron registros en el historial.
            return jsonify({'message': 'No memberships found'}), 404  # Retorna un mensaje indicando que no se encontraron registros y un código de estado HTTP 404.
        
        response_body = [all_history.serialize() for all_history in histoy_memberships]  # Serializa cada registro del historial para la respuesta.
        return jsonify(response_body), 200  # Retorna la lista del historial de membresías serializado y un código de estado HTTP 200.

    except Exception as e:  # Captura cualquier excepción que ocurra durante la ejecución.
        return jsonify({'error': str(e)}), 500  # Retorna un mensaje de error con el código de estado HTTP 500 (Error Interno del Servidor).


#Crear una MEMBRESIA  (POST)
@api.route('/memberships', methods=['POST'])  # Define el endpoint para crear nuevas membresías.
# @jwt_required() # Comentado aquí, pero este decorador requeriría autenticación con JWT para acceder a este endpoint.
def create_memberships():
    data = request.get_json()  # Obtiene los datos enviados en formato JSON.
    if not data:
        return jsonify({'error': 'No input data provided'}), 400  # Retorna un mensaje de error si no se proporcionaron datos.

    if isinstance(data, dict):  # Si los datos son un solo objeto, conviértelos en una lista.
        data = [data]

    if not isinstance(data, list):  # Verifica si los datos son una lista.
        return jsonify({'error': 'Expected a list or a single object of memberships'}), 400

    created_memberships = []  # Lista para almacenar las membresías creadas.
    errors = []  # Lista para almacenar errores durante la creación.
    for item in data:
        # Extrae y verifica los campos necesarios para crear una membresía.
        name = item.get('name')
        description = item.get('description')
        price = item.get('price')
        duration_days = item.get('duration_days')
        classes_per_month = item.get('classes_per_month')

        # Verifica que los campos obligatorios estén presentes.
        if not all([name, description, price]):
            errors.append({'error': 'Missing data', 'membership_info': item})
            continue  # Si falta información, añade un error y continúa con el siguiente item.

        try:
            # Crea una nueva instancia de Membership y la añade a la base de datos.
            new_membership = Membership(
                name=name,
                description=description,
                price=price,
                duration_days=duration_days,
                classes_per_month=classes_per_month
            )
            db.session.add(new_membership)
            created_memberships.append(new_membership)  # Añade la membresía creada a la lista de creadas.
        except Exception as e:
            errors.append({'error': str(e), 'membership_info': item})  # Añade un error si hay excepciones durante la creación.
            db.session.rollback()
            continue  # Realiza un rollback y continúa con el siguiente item.

    db.session.commit()  # Confirma todos los cambios en la base de datos.
    
    # Genera la respuesta final basada en si hubo errores o no.
    if errors:
        return jsonify({'errors': errors, 'created_memberships': [{'membership_id': m.id, 'name': m.name} for m in created_memberships]}), 207  # HTTP 207 Multi-Status si hubo errores pero también se crearon algunas membresías.

    return jsonify({'message': 'Memberships created successfully', 'created_memberships': [{'membership_id': m.id, 'name': m.name} for m in created_memberships]}), 201  # HTTP 201 Created si todas las membresías se crearon exitosamente sin errores.

    
#Modificar una MEMBRESIA existente (PUT)
@api.route('/memberships/<int:membership_id>', methods=['PUT'])  # Define el endpoint para actualizar una membresía específica. Se usa el método PUT.
@jwt_required()  # Decorador para requerir autenticación con JWT, asegurando que solo usuarios autenticados puedan actualizar membresías.
def update_membership(membership_id):  # Función que maneja la solicitud PUT para actualizar una membresía.
    data = request.get_json()  # Obtiene los datos enviados en formato JSON.
    membership = Membership.query.get_or_404(membership_id)  # Busca la membresía en la base de datos usando el ID proporcionado o retorna un error 404 si no se encuentra.

    try:
        # Actualiza los campos de la membresía si están presentes en los datos recibidos.
        if 'name' in data:
            membership.name = data['name']  # Actualiza el nombre de la membresía.
        if 'description' in data:
            membership.description = data['description']  # Actualiza la descripción de la membresía.
        if 'price' in data:
            membership.price = data['price']  # Actualiza el precio de la membresía.
        if 'duration_days' in data:
            membership.duration_days = data['duration_days']  # Actualiza la duración en días de la membresía.
        if 'classes_per_month' in data:
            membership.classes_per_month = data['classes_per_month']  # Actualiza el número de clases permitidas por mes bajo esta membresía.

        db.session.commit()  # Guarda los cambios en la base de datos.
        return jsonify({'message': 'Membership updated successfully'}), 200  # Retorna un mensaje de éxito y un código de estado HTTP 200.
    except Exception as e:
        db.session.rollback()  # Realiza un rollback en la base de datos para evitar inconsistencias debido al error.
        return jsonify({'error': str(e)}), 500  # Retorna un mensaje de error con el código de estado HTTP 500 (Error Interno del Servidor).



#ELIMINAR una MEMBRESIA existente (DELETE)
@api.route('/memberships/<int:membership_id>', methods=['DELETE'])  # Define el endpoint para eliminar una membresía específica. Se usa el método DELETE.
@jwt_required()  # Decorador para requerir autenticación con JWT, asegurando que solo usuarios autenticados puedan eliminar membresías.
def delete_membership(membership_id):  # Función que maneja la solicitud DELETE para eliminar una membresía.
    membership = Membership.query.get_or_404(membership_id)  # Busca la membresía en la base de datos usando el ID proporcionado o retorna un error 404 si no se encuentra.
    # La verificación 'if not membership' es redundante debido a que 'get_or_404()' ya maneja la ausencia de la membresía.

    try:
        db.session.delete(membership)  # Elimina la membresía de la base de datos.
        db.session.commit()  # Guarda los cambios en la base de datos.
        return jsonify({'message': 'Membership deleted successfully'}), 200  # Retorna un mensaje de éxito y un código de estado HTTP 200.
    except Exception as e:
        db.session.rollback()  # Realiza un rollback en la base de datos para evitar inconsistencias debido al error.
        return jsonify({'error': str(e)}), 500  # Retorna un mensaje de error con el código de estado HTTP 500 (Error Interno del Servidor).





#-------------------------------------------------ENPOINT PARA LA COMPRA DE MEMBRESIAS-----------------------------------------------------------
#cuerpo de la solicitud
# {
#     "membership_id": 2, #id del plan de membresia
#     "payment_data": {
#         "amount": 150.00, #monto
#         "payment_method": "credit_card" #metodo de pago "credit_card", "cash" ...
#     }
# }


@api.route('/purchase_membership', methods=['POST'])  # Define el endpoint para la compra de una membresía. Se usa el método POST.
@jwt_required()  # Decorador para requerir autenticación con JWT, asegurando que solo usuarios autenticados puedan realizar compras.
def purchase_membership():  # Función que maneja la solicitud POST para comprar una membresía.
    
    user_id = get_jwt_identity()  # Obtiene el ID del usuario autenticado a partir del token JWT.
    
    data = request.get_json()  # Obtiene los datos enviados en formato JSON.
    if not data:  # Verifica si no se proporcionaron datos.
        return jsonify({'error': 'No data provided'}), 400  # Retorna un mensaje de error si no se proporcionaron datos y un código de estado HTTP 400.

    membership_id = request.json.get('membership_id')  # Obtiene el ID de la membresía de los datos de la solicitud.
    payment_data = request.json.get('payment_data')  # Obtiene los datos de pago, que deben incluir 'amount' y 'payment_method'.

    # Validación básica de la presencia de datos necesarios.
    if not membership_id or not payment_data:
        return jsonify({'error': 'Missing required parameters'}), 400  # Retorna un mensaje de error si faltan parámetros requeridos y un código de estado HTTP 400.

    membership = Membership.query.get(membership_id)  # Busca la membresía en la base de datos usando el ID proporcionado.
    if not membership:
        return jsonify({'error': 'Membership not found'}), 404  # Retorna un mensaje de error si la membresía no se encuentra y un código de estado HTTP 404.

    try:
        # Procesamiento de pago diferenciado por método.
        if payment_data['payment_method'] == 'cash':
            message = 'Payment recorded, pending verification'  # Mensaje para pagos en efectivo.
            result = True  # Asumimos que el pago en efectivo siempre es exitoso.
        else:
            result, message = process_payment(payment_data)  # Procesa el pago con otros métodos.

        if result:
            payment = create_transaction(user_id, membership_id, payment_data)  # Crea una transacción de pago.
            activate_membership(user_id, membership_id, membership.duration_days, membership.classes_per_month)  # Activa la membresía para el usuario.
            return jsonify({'message': 'Purchase successful', 'payment': payment.id}), 200  # Retorna un mensaje de éxito y el ID del pago con un código de estado HTTP 200.
        else:
            return jsonify({'error': message}), 400  # Retorna un mensaje de error si el proceso de pago falla y un código de estado HTTP 400.

    except Exception as e:
        db.session.rollback()  # Realiza un rollback en la base de datos para evitar inconsistencias debido al error.
        return jsonify({'error': 'Purchase failed: ' + str(e)}), 500  # Retorna un mensaje de error con el código de estado HTTP 500 (Error Interno del Servidor).


#-------------------------------------------------ENPOINT PARA LA COMPRA DE MEMBRESIAS MODULO ADMIN-----------------------------------------------------------

@api.route('/purchase_membership_admin/<string:user_email>', methods=['POST'])  # Define el endpoint para la compra de una membresía. Se usa el método POST.
@jwt_required()  # Decorador para requerir autenticación con JWT, asegurando que solo usuarios autenticados puedan realizar compras.
def purchase_membership_admin(user_email):  # Función que maneja la solicitud POST para comprar una membresía.

    user = User.query.filter_by(email=user_email).first()  # Obtiene el objeto usuario usando el email
    if not user:  # Verifica si el usuario existe
        return jsonify({'error': 'User not found'}), 404
    
    user_id = user.id  # Obtiene el ID del usuario
    
    data = request.get_json()  # Obtiene los datos enviados en formato JSON.
    if not data:  # Verifica si no se proporcionaron datos.
        return jsonify({'error': 'No data provided'}), 400  # Retorna un mensaje de error si no se proporcionaron datos y un código de estado HTTP 400.

    membership_id = request.json.get('membership_id')  # Obtiene el ID de la membresía de los datos de la solicitud.
    payment_data = request.json.get('payment_data')  # Obtiene los datos de pago, que deben incluir 'amount' y 'payment_method'.

    # Validación básica de la presencia de datos necesarios.
    if not membership_id or not payment_data:
        return jsonify({'error': 'Missing required parameters'}), 400  # Retorna un mensaje de error si faltan parámetros requeridos y un código de estado HTTP 400.

    membership = Membership.query.get(membership_id)  # Busca la membresía en la base de datos usando el ID proporcionado.
    if not membership:
        return jsonify({'error': 'Membership not found'}), 404  # Retorna un mensaje de error si la membresía no se encuentra y un código de estado HTTP 404.

    try:
        # Procesamiento de pago diferenciado por método.
        if payment_data['payment_method'] == 'cash':
            message = 'Payment recorded, pending verification'  # Mensaje para pagos en efectivo.
            result = True  # Asumimos que el pago en efectivo siempre es exitoso.
        else:
            result, message = process_payment(payment_data)  # Procesa el pago con otros métodos.

        if result:
            payment = create_transaction(user_id, membership_id, payment_data)  # Crea una transacción de pago.
            activate_membership(user_id, membership_id, membership.duration_days, membership.classes_per_month)  # Activa la membresía para el usuario.
            return jsonify({'message': 'Purchase successful', 'payment': payment.id}), 200  # Retorna un mensaje de éxito y el ID del pago con un código de estado HTTP 200.
        else:
            return jsonify({'error': message}), 400  # Retorna un mensaje de error si el proceso de pago falla y un código de estado HTTP 400.

    except Exception as e:
        db.session.rollback()  # Realiza un rollback en la base de datos para evitar inconsistencias debido al error.
        return jsonify({'error': 'Purchase failed: ' + str(e)}), 500  # Retorna un mensaje de error con el código de estado HTTP 500 (Error Interno del Servidor).






