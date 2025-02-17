"""
Este módulo se encarga de iniciar el servidor API, cargar la base de datos y agregar los puntos finales.
"""

import os
from flask import Flask, request, jsonify, url_for, Blueprint, redirect, url_for, render_template, current_app  # Importación de Flask y funciones relacionadas
from api.models import db, User, SecurityQuestion, Role, Permission, RolePermission, Membership, Training_classes, Booking, Payment, PaymentDetail, UserMembershipHistory, MovementImages, ProfileImage, PRRecord, MessagesSend, MessageRecipient, Product, Category, ProductImage, CartItem, Order, OrderDetail, EcommercePayment, EcommercePaymentDetail, Promotion, ProductPromotion,SubCategory, Attribute, AttributeValue,ProductVariant, VariantAttribute, VariantImage    # Importación de los modelos de la base de datos
from api.utils import generate_sitemap, APIException  # Importación de funciones de utilidad y excepciones personalizadas
from flask_cors import CORS  # Importación de CORS para permitir solicitudes desde otros dominios
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity  # Importación de JWT para autenticación y autorización basada en tokens
from flask_bcrypt import generate_password_hash, check_password_hash  # Importación de bcrypt para encriptación de contraseñas
from datetime import timedelta  # Importación de timedelta para manejar intervalos de tiempo
from itsdangerous import URLSafeTimedSerializer as Serializer
from flask_mail import Mail, Message
from flask import send_file
from io import BytesIO
import base64
import paypalrestsdk
import re #biblioteca estándar de Python para trabajar con expresiones regulares
from sqlalchemy import func, create_engine
from sqlalchemy.exc import SQLAlchemyError

from datetime import datetime
from sqlalchemy.orm import joinedload




from .booking_service import require_role, create_booking, cancel_booking, process_payment, create_transaction, activate_membership, generate_confirmation_token_email, confirm_token_email, send_email, cancel_class_and_update_bookings, allowed_file, send_class_booking_email, send_class_cancellation_email, optimize_image


#------------------verificar con david --------------------------------
#Configura la aplicación para permitir cargas de archivos
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





#-------------------CONSULTAR TODOS LOS USUARIOS--------------------------------------------------------------------------
@api.route('/users', methods=['GET'])
@jwt_required() # Decorador para requerir autenticación con JWT
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
@jwt_required() # Decorador para requerir autenticación con JWT
def get_Oneuser(id):
    try:
        user=User.query.get(id)
        if not user:
            return jsonify({'message': 'No users found'}), 404
        
        response_body = user.serialize() 
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
@jwt_required() # Decorador para requerir autenticación con JWT
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
@jwt_required()  # Requiere autenticación con JWT para acceder a estas rutas
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
@jwt_required()  # Requiere autenticación con JWT para acceder a esta ruta
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


#-------------------------------------------------------CREAR  USUARIOS--------------------------------------------------------------------------

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
        # Obtener la URL base del archivo .env
        BASE_URL_FRONT = os.getenv('FRONTEND_URL')
        # html = render_template('activate.html', confirm_url=confirm_url)
        confirm_url = url_for('api.confirm_email', token=token, _external=True)
        confirm_url = f"{BASE_URL_FRONT}/ConfirmEmail?token={token}"
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

#-----------------------------------------------------actualizar el usuario-----------------------------------------------------------
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
    
#-----------------------------------------------------PARA DESACTIVAR CUENTA DE USUARIOS-----------------------------------------------------------

@api.route('/user/<int:user_id>/activate', methods=['PUT'])
@jwt_required()
@require_role('master')
def toggle_user_activation(user_id):
    data = request.get_json()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    try:
        user.is_active = data['is_active']
        db.session.commit()
        return jsonify({'message': 'User activation status updated successfully', 'is_active': user.is_active}), 200
    except Exception as e:
        db.session.rollback()
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

        if not existing_user.is_active:  # Verifica si la cuenta del usuario está activa
            return jsonify({'error': 'Account deleted or not active'}), 400  # Devuelve un error si la cuenta no está activa

        password_user_db = existing_user.password  # Extraemos la contraseña almacenada del usuario existente en la base de datos

        true_o_false = check_password_hash(password_user_db, data['password'])  # Comparamos la contraseña ingresada en el formulario con la contraseña almacenada en la base de datos, después de descifrarla

        if true_o_false:  # Si la comparación es verdadera, es decir, las contraseñas coinciden
            expires = timedelta(hours=1)  # Configuramos la duración del token de acceso
            user_id = existing_user.id  # Obtenemos el ID del usuario existente en la base de datos
            role = existing_user.role.name  # Obtenemos el rol del usuario existente en la base de datos
            access_token = create_access_token(identity=user_id, expires_delta=expires)  # Creamos un token de acceso para el usuario
            return jsonify({'access_token': access_token, 'login': True, 'role': role, 'user_id': user_id}), 200  # Devolvemos el token de acceso como respuesta exitosa
        else:  # Si la comparación de contraseñas es falsa, es decir, las contraseñas no coinciden
            return jsonify({'error': 'Incorrect password'}), 400  # Devolvemos un mensaje de error indicando que la contraseña es incorrecta

    except Exception as e:  # Captura cualquier excepción que ocurra dentro del bloque try
        return jsonify({'error': 'Error login user: ' + str(e)}), 500  # Devuelve un mensaje de error con un código de estado HTTP 500 si ocurre una excepción durante el procesamiento



#-------------------CREAR  TOKEN recuperar contraseña--------------------------------------------------------------------------

@api.route('/tokenLoginHelp', methods=['POST'])  # Define un endpoint para crear un token de ayuda para el inicio de sesión.
def create_token_login_help():  # Define la función que manejará la solicitud POST.
    try:
        data = request.json  # Obtiene los datos JSON enviados en la solicitud.
        if not data or 'email' not in data:  # Verifica si no se proporcionaron datos o si falta el email.
            return jsonify({'error': 'Email is required'}), 400  # Devuelve un error si el email no está presente en los datos.

        existing_user = User.query.filter_by(email=data['email']).first()  # Busca un usuario en la base de datos con el email proporcionado.
        if existing_user:  # Si existe un usuario con ese email:
            expires = timedelta(hours=1)  # Define el tiempo de expiración del token a 1 hora.
            email = existing_user.email  # Obtiene el email del usuario existente.
            access_token = generate_confirmation_token_email(email)  # Genera un token de acceso para el usuario.

            # Enviar email con el token
            reset_url = url_for('api.verify_reset_token', token=access_token, _external=True)  # Genera la URL de restablecimiento de contraseña.
            BASE_URL_FRONT = os.getenv('FRONTEND_URL')  # Obtiene la URL base del frontend desde las variables de entorno.
            reset_url = f"{BASE_URL_FRONT}/ResetPassword?token={access_token}"  # Construye la URL completa de restablecimiento de contraseña.
            html = f"""
            <!DOCTYPE html>
            <html>
            <head>
            </head>
            <body>
                <div style="margin: 0 auto; width: 80%; padding: 20px; border: 1px solid #ccc; border-radius: 5px; box-shadow: 0 2px 3px #ccc;">
                    <h1 style="color: #333;">Reset Your Password</h1>
                    <p>Please click the button below to reset your password:</p>
                    <a href="{reset_url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">Reset Password</a>
                </div>
            </body>
            </html>"""  # Plantilla HTML para el email de restablecimiento de contraseña.

            send_email('Password Reset Request', data['email'], html)  # Envía el email de restablecimiento de contraseña al usuario.

            return jsonify({'message': 'Password reset email sent', 'login': True}), 200  # Devuelve un mensaje de éxito si se envió el email.
        else:
            return jsonify({'error': 'Email does not exist.'}), 400  # Devuelve un error si el email no existe en la base de datos.
    
    except Exception as e:  # Captura cualquier excepción que ocurra.
        return jsonify({'error': 'Error email user: ' + str(e)}), 500  # Devuelve un mensaje de error si ocurre un problema.

@api.route('/verify_reset_token/<string:token>', methods=['POST'])  # Define un endpoint para verificar el token de restablecimiento de contraseña.
def verify_reset_token(token):  # Define la función que manejará la solicitud POST.
    try:
        email = confirm_token_email(token)  # Valida el token y obtiene el email del usuario.
        if not email:  # Si el email no se pudo obtener:
            raise ValueError("Invalid token")  # Lanza un error indicando que el token es inválido.
        user = User.query.filter_by(email=email).first()  # Busca al usuario en la base de datos por su email.
        if not user:  # Si el usuario no existe:
            return jsonify({'error': 'User not found'}), 404  # Devuelve un error indicando que el usuario no fue encontrado.

        return jsonify({'user_id': user.id}), 200  # Devuelve el ID del usuario si se encuentra.
    except Exception as e:  # Captura cualquier excepción que ocurra.
        return jsonify(message=str(e)), 400  # Devuelve un mensaje de error si ocurre un problema.


# endpoint para cambiar contraseña con token de email
@api.route('/reset_password', methods=['PUT'])  # Define un endpoint para restablecer la contraseña del usuario.
def reset_password():  # Define la función que manejará la solicitud PUT.
    try:
        data = request.json  # Obtiene los datos JSON enviados en la solicitud.
        if not data or 'user_id' not in data or 'password' not in data:  # Verifica si no se proporcionaron datos, o si faltan el ID del usuario o la contraseña.
            return jsonify({'error': 'User ID and password must be provided'}), 400  # Devuelve un error si faltan datos.

        user_id = data['user_id']  # Obtiene el ID del usuario de los datos.
        user = User.query.get(user_id)  # Busca al usuario en la base de datos por su ID.

        if not user:  # Si el usuario no existe:
            return jsonify({'error': 'User not found'}), 404  # Devuelve un error indicando que el usuario no fue encontrado.

        password_hash = generate_password_hash(data['password']).decode('utf-8')  # Genera el hash de la nueva contraseña.
        user.password = password_hash  # Actualiza la contraseña del usuario.
        db.session.commit()  # Guarda los cambios en la base de datos.
        return jsonify({'message': 'Password updated successfully'}), 200  # Devuelve un mensaje de éxito si la contraseña se actualizó correctamente.

    except Exception as e:  # Captura cualquier excepción que ocurra.
        return jsonify({'error': str(e)}), 500  # Devuelve un mensaje de error si ocurre un problema.




#--------------------------------------------------ENPOINT PARA LA CONSULTA DE Y CREACION DE RESERVAS DE CLASE-----------------------------------
#Consultar reservas (GET)
@api.route('/booking', methods=['GET'])  # Define el endpoint para obtener todas las reservas.
@jwt_required() # Decorador comentado que requeriría autenticación con JWT para acceder a este endpoint.
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
            # Enviar email de confirmación de reserva
            send_class_booking_email(user.email, user.username, booking_id, training_class_id)
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
            booking = Booking.query.get(booking_id)
            send_class_cancellation_email(booking.user.email, booking.user.username, booking.training_class_id)
            return jsonify({'message': message, 'status_cancele':True }), 200

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



@api.route('/cancel_class/<int:class_id>', methods=['PUT'])
@jwt_required()  
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
@jwt_required() # Decorador para requerir autenticación con JWT, asegurando que solo usuarios autenticados puedan acceder a esta información.
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
@jwt_required() # Comentado aquí, pero este decorador requeriría autenticación con JWT para acceder a este endpoint.
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

#-------------------------------------------------ENPOINT PARA LA CARGA DE ARCHIVOS-----------------------------------------------------------

# Define una ruta de API para subir imágenes utilizando el método POST
@api.route('/upload_img', methods=['POST'])
@jwt_required()  # Decorador para requerir autenticación con JWT, asegurando que solo usuarios autenticados puedan realizar compras.
def upload_img():
    # Verifica si el archivo está presente en la solicitud
    if 'file' not in request.files:
        # Si no hay archivo, retorna un mensaje de error en formato JSON con un código de estado 400
        return jsonify({'error': 'No file part'}), 400
    
    # Obtiene el archivo de la solicitud
    file = request.files['file']
    
    # Verifica si el nombre del archivo está vacío, lo que indica que no se seleccionó ningún archivo
    if file.filename == '':
        # Si no se seleccionó archivo, retorna un mensaje de error en formato JSON con un código de estado 400
        return jsonify({'error': 'No selected file'}), 400
    
    # Verifica si el archivo está presente y tiene un formato permitido
    if file and allowed_file(file.filename):
        # Lee los datos del archivo
        file_data = file.read()
        
        # Crea un nuevo registro en la base de datos con los datos del archivo
        new_img = MovementImages(
            name=request.form['name'],  # Obtiene el nombre del formulario
            description=request.form['description'],  # Obtiene la descripción del formulario
            img_data=file_data  # Almacena los datos del archivo
        )
        
        # Añade el nuevo registro a la sesión de la base de datos
        db.session.add(new_img)
        
        # Guarda los cambios en la base de datos
        db.session.commit()
        
        # Retorna un mensaje de éxito en formato JSON con un código de estado 200
        return jsonify({'message': 'File uploaded successfully'}), 200
    
    # Si el archivo no tiene un formato permitido, retorna un mensaje de error en formato JSON con un código de estado 400
    return jsonify({'error': 'Invalid file format'}), 400

# Define una ruta de API para obtener imágenes con paginación utilizando el método GET
@api.route('/images', methods=['GET'])
@jwt_required()  # Decorador para requerir autenticación con JWT, asegurando que solo usuarios autenticados puedan realizar compras.
def get_images():
    # Obtiene el número de página de los parámetros de la solicitud, por defecto es 1
    page = request.args.get('page', 1, type=int)
    # Obtiene el número de elementos por página de los parámetros de la solicitud, por defecto es 10
    per_page = request.args.get('per_page', 10, type=int)
    
    try:
        # Consulta las imágenes en la base de datos con paginación
        images = MovementImages.query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Prepara los resultados en un formato JSON adecuado
        results = [{
            'name': img.name,  # Nombre de la imagen
            'description': img.description,  # Descripción de la imagen
            'img_url': f"data:image/gif;base64,{base64.b64encode(img.img_data).decode('utf-8')}"  # Codifica los datos de la imagen en base64
        } for img in images.items]
        
        # Retorna los resultados en formato JSON con un código de estado 200
        return jsonify(results), 200
    except Exception as e:
        # Si ocurre una excepción, retorna un mensaje de error en formato JSON con un código de estado 500
        return jsonify({'error': str(e)}), 500

# Define una ruta de API para obtener todas las imágenes sin paginación utilizando el método GET
@api.route('/all_images', methods=['GET'])
@jwt_required()  # Decorador para requerir autenticación con JWT, asegurando que solo usuarios autenticados puedan realizar compras.
def get_all_images():
    # Consulta todas las imágenes en la base de datos
    images = MovementImages.query.all()
    
    # Prepara los resultados en un formato JSON adecuado
    results = [{
        'name': img.name,  # Nombre de la imagen
        'description': img.description,  # Descripción de la imagen
        'img_url': f"data:image/gif;base64,{base64.b64encode(img.img_data).decode('utf-8')}"  # Codifica los datos de la imagen en base64
    } for img in images]
    
    # Retorna los resultados en formato JSON con un código de estado 200
    return jsonify(results), 200


#-------------------------------------------------ENPOINT PARA LA CARGA DE IMAGEN DE PERFIL-----------------------------------------------------------

# Define una ruta de API para subir imágenes utilizando el método POST
@api.route('/upload_img_profile', methods=['POST'])
@jwt_required()  # Decorador para requerir autenticación con JWT
def upload_img_profile():
    try:
        # Verifica si el archivo está presente en la solicitud
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']  # Obtiene el archivo de la solicitud
        
        if file.filename == '':  # Verifica si no se seleccionó ningún archivo
            return jsonify({'error': 'No selected file'}), 400
        
        user_id = get_jwt_identity()  # Obtiene el ID del usuario desde el token
        user = User.query.get(user_id)  # Busca al usuario por su ID
        if not user:
            return jsonify({'error': 'User not found'}), 404  # Si el usuario no existe, devuelve error
        
        if file and allowed_file(file.filename):  # Verifica si el archivo está presente y tiene un formato permitido
            file_data = file.read()  # Lee los datos del archivo
            
            new_img = ProfileImage(img_data=file_data)  # Crea un nuevo registro en la base de datos con los datos del archivo
            db.session.add(new_img)
            user.profile_image = new_img
            db.session.commit()  # Guarda los cambios en la base de datos
            
            return jsonify({'message': 'File uploaded successfully'}), 200
        
        return jsonify({'error': 'Invalid file format'}), 400  # Si el archivo no tiene un formato permitido, retorna un mensaje de error
    except Exception as e:
        db.session.rollback()  # Realiza un rollback en la base de datos para evitar inconsistencias debido al error
        return jsonify({'error': str(e)}), 500  # Retorna un mensaje de error con el código de estado HTTP 500

# Define una ruta de API para actualizar imágenes utilizando el método PUT
@api.route('/update_profile_image', methods=['PUT'])
@jwt_required()  # Decorador para requerir autenticación con JWT
def update_profile_image():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        user_id = get_jwt_identity()  # Obtiene el ID del usuario desde el token
        user = User.query.get(user_id)  # Busca al usuario por su ID
        if not user:
            return jsonify({'error': 'User not found'}), 404  # Si el usuario no existe, devuelve error
        
        if file and allowed_file(file.filename):  # Verifica si el archivo está presente y tiene un formato permitido
            file_data = file.read()  # Lee los datos del archivo

        if user.profile_image:
            user.profile_image.img_data = file_data
        else:
            new_image = ProfileImage(img_data=file_data)
            db.session.add(new_image)
            user.profile_image = new_image
        db.session.commit()  # Guarda los cambios en la base de datos
        return jsonify({'message': 'Profile image updated successfully'}), 200
    except Exception as e:
        db.session.rollback()  # Realiza un rollback en la base de datos para evitar inconsistencias debido al error
        return jsonify({'error': str(e)}), 500  # Retorna un mensaje de error con el código de estado HTTP 500

# Define una ruta de API para eliminar imágenes utilizando el método DELETE
@api.route('/delete_profile_image', methods=['DELETE'])
@jwt_required()  # Decorador para requerir autenticación con JWT
def delete_profile_image():
    try:
        user_id = get_jwt_identity()  # Obtiene el ID del usuario desde el token
        user = User.query.get(user_id)  # Busca al usuario por su ID
        if not user:
            return jsonify({'error': 'User not found'}), 404  # Si el usuario no existe, devuelve error
        
        if user.profile_image:
            db.session.delete(user.profile_image)
            db.session.commit()  # Guarda los cambios en la base de datos
        return jsonify({'message': 'Profile image deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()  # Realiza un rollback en la base de datos para evitar inconsistencias debido al error
        return jsonify({'error': str(e)}), 500  # Retorna un mensaje de error con el código de estado HTTP 500


    
#-------------------------------------------------ENPOINT PARA LA CARGA DE PAYMENTS-----------------------------------------------------------
@api.route('/Payments', methods=['GET'])
@jwt_required() # Decorador para requerir autenticación con JWT
def get_all_payments():
    try:
        users = Payment.query.all()
        if not users:
            return jsonify({'message': 'No Payments found'}), 404
        
        response_body = [user.serialize() for user in users]
        return jsonify(response_body), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

#-------------------------------------------------ENPOINT PARA lA TABLA DE PRS-----------------------------------------------------------

@api.route('/pr_records', methods=['POST'])
@jwt_required()
def create_pr_record():
    try:
        data = request.get_json()  # Obtiene los datos del cuerpo de la solicitud en formato JSON
        current_app.logger.debug(f"Data received: {data}")  # Loggea los datos recibidos para depuración
        
        user_id = get_jwt_identity()  # Obtiene el ID del usuario desde el token de JWT

        new_record = PRRecord(  # Crea una nueva instancia del modelo PRRecord
            user_id=user_id,
            movement_id=data['movement_id'],
            value=data.get('value', None),
            time=data.get('time', None),
            kg=data.get('kg', None),
            lb=data.get('lb', None),
            unit=data['unit']
        )
        db.session.add(new_record)  # Agrega el nuevo registro a la sesión de la base de datos
        db.session.commit()  # Confirma los cambios en la base de datos
        return jsonify(new_record.serialize()), 201  # Retorna el nuevo registro serializado con un estado 201 (Creado)
    except Exception as e:
        db.session.rollback()  # Revierte cualquier cambio si ocurre un error
        current_app.logger.error(f"Error creating PR record: {e}")  # Loggea el error para depuración
        return jsonify({'error': str(e)}), 500  # Retorna un mensaje de error con el estado 500 (Error Interno del Servidor)

@api.route('/pr_records/<int:id>', methods=['PUT'])
@jwt_required()
def update_pr_record(id):
    try:
        data = request.get_json()  # Obtiene los datos del cuerpo de la solicitud en formato JSON
        if not data:
            return jsonify({'error': 'No data provided'}), 400  # Retorna un mensaje claro si no se proporcionan datos

        current_user_id = get_jwt_identity()  # Obtiene el ID del usuario del token de JWT

        # Recupera el registro PR usando el ID y verifica que pertenezca al usuario actual
        record = PRRecord.query.filter_by(id=id, user_id=current_user_id).first()
        if not record:
            return jsonify({'error': 'PR not found'}), 404  # Retorna un error si el registro PR no se encuentra

        # Itera sobre cada campo en el JSON y actualiza el registro PR si corresponde
        for key, value in data.items():
            if hasattr(record, key):  # Comprueba si el registro PR tiene un atributo con el nombre de la llave
                setattr(record, key, value)  # Establece el valor solo si el registro PR tiene ese atributo

        db.session.commit()  # Confirma los cambios en la base de datos
        return jsonify({'message': 'PR updated successfully', 'record': record.serialize()}), 200  # Retorna un mensaje de éxito
    except Exception as e:
        db.session.rollback()  # Revierte cualquier cambio si ocurre un error
        current_app.logger.error(f"Error updating PR record: {e}")  # Loggea el error para depuración
        return jsonify({'error': 'Error updating PR: ' + str(e)}), 500  # Retorna un mensaje de error con el estado 500 (Error Interno del Servidor)

@api.route('/pr_records/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_pr_record(id):
    try:
        current_user_id = get_jwt_identity()  # Obtiene el ID del usuario del token de JWT

        # Recupera el registro PR usando el ID y verifica que pertenezca al usuario actual
        record = PRRecord.query.filter_by(id=id, user_id=current_user_id).first()
        if not record:
            return jsonify({'error': 'PR not found or unauthorized access'}), 404  # Retorna un error si el registro PR no se encuentra o no pertenece al usuario

        db.session.delete(record)  # Elimina el registro de la sesión de la base de datos
        db.session.commit()  # Confirma los cambios en la base de datos
        return '', 204  # Retorna una respuesta vacía con el estado 204 (Sin Contenido)
    except Exception as e:
        db.session.rollback()  # Revierte cualquier cambio si ocurre un error
        current_app.logger.error(f"Error deleting PR record: {e}")  # Loggea el error para depuración
        return jsonify({'error': 'Error deleting PR: ' + str(e)}), 500  # Retorna un mensaje de error con el estado 500 (Error Interno del Servidor)

@api.route('/pr_records/movement/<int:movement_id>', methods=['DELETE'])
@jwt_required()
def delete_pr_record_movement(movement_id):
    try:
        current_user_id = get_jwt_identity()  # Obtiene el ID del usuario del token de JWT

        # Recupera el registro PR usando el ID y verifica que pertenezca al usuario actual
        record = PRRecord.query.filter_by(movement_id=movement_id, user_id=current_user_id).first()
        if not record:
            return jsonify({'error': 'PR not found or unauthorized access'}), 404  # Retorna un error si el registro PR no se encuentra o no pertenece al usuario

        db.session.delete(record)  # Elimina el registro de la sesión de la base de datos
        db.session.commit()  # Confirma los cambios en la base de datos
        return '', 204  # Retorna una respuesta vacía con el estado 204 (Sin Contenido)
    except Exception as e:
        db.session.rollback()  # Revierte cualquier cambio si ocurre un error
        current_app.logger.error(f"Error deleting PR record: {e}")  # Loggea el error para depuración
        return jsonify({'error': 'Error deleting PR: ' + str(e)}), 500  # Retorna un mensaje de error con el estado 500 (Error Interno del Servidor)

@api.route('/pr_records/user', methods=['GET'])
@jwt_required() 
def get_user_pr_records_prueba():
    try:
        current_user_id = get_jwt_identity()  # Obtiene el ID del usuario del token de JWT
        records = PRRecord.query.filter_by(user_id=current_user_id).all()  # Recupera todos los registros PR del usuario
        return jsonify([record.serialize() for record in records]), 200  # Retorna los registros serializados con un estado 200 (OK)
    except Exception as e:
        current_app.logger.error(f"Error fetching PR records: {e}")  # Loggea el error para depuración
        return jsonify({'error': str(e)}), 500  # Retorna un mensaje de error con el estado 500 (Error Interno del Servidor)
    




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

@api.route('/admin_purchase_membership', methods=['POST'])
@jwt_required()
def admin_purchase_membership():
    try:
        data = request.get_json()  # Obtiene los datos enviados en formato JSON
        if not data:
            return jsonify({'error': 'No data provided'}), 400  # Retorna un mensaje de error si no se proporcionaron datos

        email = data.get('email')  # Obtiene el email del usuario de los datos de la solicitud
        membership_id = data.get('membership_id')  # Obtiene el ID de la membresía de los datos de la solicitud
        payment_data = data.get('payment_data')  # Obtiene los datos de pago

        # Validación básica de la presencia de datos necesarios
        if not email or not membership_id or not payment_data:
            return jsonify({'error': 'Missing required parameters'}), 400  # Retorna un mensaje de error si faltan parámetros requeridos

        user = User.query.filter_by(email=email).first()  # Busca al usuario en la base de datos usando el email proporcionado
        if not user:
            return jsonify({'error': 'User not found'}), 404  # Retorna un mensaje de error si el usuario no se encuentra

        membership = Membership.query.get(membership_id)  # Busca la membresía en la base de datos usando el ID proporcionado
        if not membership:
            return jsonify({'error': 'Membership not found'}), 404  # Retorna un mensaje de error si la membresía no se encuentra

        # Procesamiento de pago diferenciado por método
        if payment_data['payment_method'] == 'cash':
            message = 'Payment recorded, pending verification'  # Mensaje para pagos en efectivo
            result = True  # Asumimos que el pago en efectivo siempre es exitoso
        else:
            result, message = process_payment(payment_data)  # Procesa el pago con otros métodos

        if result:
            payment = create_transaction(user.id, membership_id, payment_data)  # Crea una transacción de pago
            activate_membership(user.id, membership_id, membership.duration_days, membership.classes_per_month)  # Activa la membresía para el usuario
            return jsonify({'message': 'Purchase successful', 'payment': payment.id}), 200  # Retorna un mensaje de éxito y el ID del pago con un código de estado HTTP 200
        else:
            return jsonify({'error': message}), 400  # Retorna un mensaje de error si el proceso de pago falla

    except Exception as e:
        db.session.rollback()  # Realiza un rollback en la base de datos para evitar inconsistencias debido al error
        return jsonify({'error': 'Purchase failed: ' + str(e)}), 500  # Retorna un mensaje de error con el código de estado HTTP 500 (Error Interno del Servidor)


#-------------------------------------------------ENPOINT PARA INTEGRACION CON PAYPAL-----------------------------------------------------------

@api.route('/paypal_payment', methods=['POST'])
@jwt_required()  # Requiere que el usuario esté autenticado con JWT
def create_paypal_payment():
    data = request.get_json()  # Obtiene los datos JSON de la solicitud
    membership_id = data.get('membership_id')  # Extrae el ID de la membresía de los datos
    membership = Membership.query.get(membership_id)  # Busca la membresía en la base de datos

    if not membership:  # Si no se encuentra la membresía
        return jsonify({'error': 'Membership not found'}), 404  # Devuelve un error 404

    # Crea un objeto de pago de PayPal
    payment = paypalrestsdk.Payment({
        "intent": "sale",  # Define la intención del pago como una venta
        "payer": {
            "payment_method": "paypal"  # Define el método de pago como PayPal
        },
        "redirect_urls": {  # URLs de redirección para después del pago
            "return_url": f"{os.getenv('FRONTEND_URL')}/paypal_payment/execute?membership_id={membership_id}",  # URL de retorno en caso de éxito
            "cancel_url": f"{os.getenv('FRONTEND_URL')}/paypal_payment/cancel"  # URL de cancelación
        },
        "transactions": [{  # Detalles de la transacción
            "item_list": {
                "items": [{  # Lista de ítems en la transacción
                    "name": membership.name,  # Nombre del ítem
                    "sku": "item",  # SKU del ítem
                    "price": str(membership.price),  # Precio del ítem
                    "currency": "USD",  # Moneda de la transacción
                    "quantity": 1  # Cantidad de ítems
                }]
            },
            "amount": {  # Monto total de la transacción
                "total": str(membership.price),  # Total de la transacción
                "currency": "USD"  # Moneda de la transacción
            },
            "description": f"Purchase of {membership.name} membership"  # Descripción de la transacción
        }]
    })

    if payment.create():  # Intenta crear el pago en PayPal.
        approval_url = next(link.href for link in payment.links if link.rel == "approval_url")  # Obtiene la URL de aprobación
        return jsonify({'approval_url': approval_url})  # Devuelve la URL de aprobación en formato JSON
    else:
        return jsonify({'error': payment.error}), 500  # Devuelve un error 500 en caso de falla



@api.route('/paypal_payment/execute', methods=['GET'])
@jwt_required()  # Requiere que el usuario esté autenticado con JWT
def execute_paypal_payment():
    payment_id = request.args.get('paymentId')  # Obtiene el ID del pago de los parámetros de la URL
    payer_id = request.args.get('PayerID')  # Obtiene el ID del pagador de los parámetros de la URL
    membership_id = request.args.get('membership_id')  # Obtiene el ID de la membresía de los parámetros de la URL

    try:
        payment = paypalrestsdk.Payment.find(payment_id)  # Busca el pago en PayPal
        print(f"Payment found: {payment}")  # Imprime el pago encontrado para depuración

        if payment.execute({"payer_id": payer_id}):  # Ejecuta el pago
            user_id = get_jwt_identity()  # Obtiene el ID del usuario autenticado

            # Obtener detalles de la transacción
            transaction = payment.transactions[0]  # Obtiene la primera transacción del pago
            amount = transaction.amount.total  # Obtiene el monto total de la transacción
            currency = transaction.amount.currency  # Obtiene la moneda de la transacción
            description = transaction.description  # Obtiene la descripción de la transacción

            # Crear la transacción en la base de datos
            payment_data = {
                'amount': amount,
                'payment_method': 'paypal',
                'currency': currency,
                'description': description,
                'transaction_reference': payment_id  
            }
            payment_record = create_transaction(user_id, membership_id, payment_data)  # Crea la transacción en la base de datos

            # Activar la membresía del usuario
            membership = Membership.query.get(membership_id)  # Busca la membresía en la base de datos
            if membership:
                start_date, end_date = activate_membership(user_id, membership_id, membership.duration_days, membership.classes_per_month)
                message = (f'Payment executed and membership activated successfully! '
                           f'Duration: {membership.duration_days} days, '
                           f'Classes per month: {membership.classes_per_month}, '
                           f'Start date: {start_date}, '
                           f'End date: {end_date}')
                return jsonify({
                    'message': 'Payment executed and membership activated successfully!',
                    'duration_days': membership.duration_days,
                    'classes_per_month': membership.classes_per_month,
                    'start_date': start_date,
                    'end_date': end_date
                }), 200
            else:
                return jsonify({'error': 'Membership not found'}), 404

        else:
            return jsonify({'error': payment.error}), 400

    except Exception as e:
        print(f"Error in execute_paypal_payment: {e}")  # Imprime el error para depuración
        return jsonify({'error': str(e)}), 500  # Devuelve un error 500 en caso de excepción
        

@api.route('/paypal_payment/cancel', methods=['GET'])
def cancel_paypal_payment():
    return jsonify({'message': 'Payment cancelled'})  # Devuelve un mensaje de cancelación en formato JSON


#-------------------------------------------------ENPOINT PARA INTEGRACION CON PAYPAL MODULO ADMIN-----------------------------------------------------------
@api.route('/paypal_payment_admin', methods=['POST'])
@jwt_required()  # Requiere que el usuario esté autenticado con JWT
def create_paypal_payment_admin():
    data = request.get_json()  # Obtiene los datos JSON de la solicitud
    email = data.get('email')  # Extrae el email del usuario de los datos
    membership_id = data.get('membership_id')  # Extrae el ID de la membresía de los datos

    # Buscar el usuario por email
    user = User.query.filter_by(email=email).first()
    if not user:  # Si no se encuentra el usuario
        return jsonify({'error': 'User not found'}), 404  # Devuelve un error 404

    membership = Membership.query.get(membership_id)  # Busca la membresía en la base de datos
    if not membership:  # Si no se encuentra la membresía
        return jsonify({'error': 'Membership not found'}), 404  # Devuelve un error 404

    # Crea un objeto de pago de PayPal
    payment = paypalrestsdk.Payment({
        "intent": "sale",  # Define la intención del pago como una venta
        "payer": {
            "payment_method": "paypal"  # Define el método de pago como PayPal
        },
        "redirect_urls": {  # URLs de redirección para después del pago
            "return_url": f"{os.getenv('FRONTEND_URL')}/paypal_payment/execute_admin?membership_id={membership_id}&user_id={user.id}",  # URL de retorno en caso de éxito
            "cancel_url": f"{os.getenv('FRONTEND_URL')}/paypal_payment/cancel"  # URL de cancelación
        },
        "transactions": [{  # Detalles de la transacción
            "item_list": {
                "items": [{  # Lista de ítems en la transacción
                    "name": membership.name,  # Nombre del ítem
                    "sku": "item",  # SKU del ítem
                    "price": str(membership.price),  # Precio del ítem
                    "currency": "USD",  # Moneda de la transacción
                    "quantity": 1  # Cantidad de ítems
                }]
            },
            "amount": {  # Monto total de la transacción
                "total": str(membership.price),  # Total de la transacción
                "currency": "USD"  # Moneda de la transacción
            },
            "description": f"Purchase of {membership.name} membership"  # Descripción de la transacción
        }]
    })

    if payment.create():  # Intenta crear el pago en PayPal.
        approval_url = next(link.href for link in payment.links if link.rel == "approval_url")  # Obtiene la URL de aprobación
        return jsonify({'approval_url': approval_url})  # Devuelve la URL de aprobación en formato JSON
    else:
        return jsonify({'error': payment.error}), 500  # Devuelve un error 500 en caso de falla


@api.route('/paypal_payment/execute_admin', methods=['GET'])
@jwt_required()  # Requiere que el usuario esté autenticado con JWT
def execute_paypal_payment_admin():
    payment_id = request.args.get('paymentId')  # Obtiene el ID del pago de los parámetros de la URL
    payer_id = request.args.get('PayerID')  # Obtiene el ID del pagador de los parámetros de la URL
    membership_id = request.args.get('membership_id')  # Obtiene el ID de la membresía de los parámetros de la URL
    user_id = request.args.get('user_id')  # Obtiene el ID del usuario de los parámetros de la URL

    try:
        payment = paypalrestsdk.Payment.find(payment_id)  # Busca el pago en PayPal
        print(f"Payment found: {payment}")  # Imprime el pago encontrado para depuración

        if payment.execute({"payer_id": payer_id}):  # Ejecuta el pago
            # Obtener detalles de la transacción
            transaction = payment.transactions[0]  # Obtiene la primera transacción del pago
            amount = transaction.amount.total  # Obtiene el monto total de la transacción
            currency = transaction.amount.currency  # Obtiene la moneda de la transacción
            description = transaction.description  # Obtiene la descripción de la transacción

            # Crear la transacción en la base de datos
            payment_data = {
                'amount': amount,
                'payment_method': 'paypal',
                'currency': currency,
                'description': description,
                'transaction_reference': payment_id  
            }
            payment_record = create_transaction(user_id, membership_id, payment_data)  # Crea la transacción en la base de datos

            # Activar la membresía del usuario
            membership = Membership.query.get(membership_id)  # Busca la membresía en la base de datos
            if membership:
                start_date, end_date = activate_membership(user_id, membership_id, membership.duration_days, membership.classes_per_month)
                message = (f'Payment executed and membership activated successfully! '
                           f'Duration: {membership.duration_days} days, '
                           f'Classes per month: {membership.classes_per_month}, '
                           f'Start date: {start_date}, '
                           f'End date: {end_date}')
                return jsonify({
                    'message': 'Payment executed and membership activated successfully!',
                    'duration_days': membership.duration_days,
                    'classes_per_month': membership.classes_per_month,
                    'start_date': start_date,
                    'end_date': end_date
                }), 200
            else:
                return jsonify({'error': 'Membership not found'}), 404

        else:
            return jsonify({'error': payment.error}), 400

    except Exception as e:
        print(f"Error in execute_paypal_payment: {e}")  # Imprime el error para depuración
        return jsonify({'error': str(e)}), 500  # Devuelve un error 500 en caso de excepción


#-------------------------------------------------ENPOINT PARA GRAFICO FRECUENCIA DE CLASES------------------------------------------------------------------------------------

# Endpoint para frecuencia de reservaciones por horario de clase
@api.route('/class-reservation-frequency', methods=['GET'])
def get_class_reservation_frequency():
    try:
        # Obtiene el parámetro 'filter_by' de la solicitud, con valor por defecto 'all' si no se proporciona
        filter_by = request.args.get('filter_by', 'all')
        # Obtiene el parámetro 'reservation_type' de la solicitud, con valor por defecto 'all' si no se proporciona
        reservation_type = request.args.get('reservation_type', 'all')

        # Determina la columna por la cual se agruparán los resultados basado en el filtro
        if filter_by == 'date':
            # Agrupa por fecha en formato 'YYYY-MM-DD'
            group_by_column = func.to_char(Training_classes.dateTime_class, 'YYYY-MM-DD')
        elif filter_by == 'time':
            # Agrupa por hora en formato de 24 horas 'HH24'
            group_by_column = func.to_char(Training_classes.dateTime_class, 'HH24')
        elif filter_by == 'day':
            # Agrupa por día de la semana, e.g., 'Monday'
            group_by_column = func.to_char(Training_classes.dateTime_class, 'Day')
        else:
            # Si no se especifica filtro, agrupa por la fecha y hora exacta de la clase
            group_by_column = Training_classes.dateTime_class

        # Construye la consulta para obtener la frecuencia de reservas agrupada por la columna especificada
        query = db.session.query(
            group_by_column.label('class_time'),  # Alias 'class_time' para la columna agrupada
            db.func.count(Booking.id).label('frequency')  # Cuenta el número de reservas y lo alias como 'frequency'
        ).join(Booking)  # Une la tabla de clases con la tabla de reservas

        # Si el tipo de reserva no es 'all', aplica el filtro para el tipo de reserva especificado
        if reservation_type != 'all':
            query = query.filter(Booking.status == reservation_type)

        # Agrupa los resultados por la columna especificada y ordena por la misma columna
        query = query.group_by(group_by_column).order_by(group_by_column)

        # Ejecuta la consulta y obtiene todos los resultados
        result = query.all()
        # Convierte los resultados en una lista de diccionarios con las claves 'class_time' y 'frequency'
        data = [{'class_time': r.class_time, 'frequency': r.frequency} for r in result]
        # Devuelve los datos en formato JSON con código de estado 200 (OK)
        return jsonify(data), 200
    except Exception as e:
        # En caso de una excepción, devuelve un mensaje de error en formato JSON con código de estado 500 (Internal Server Error)
        return jsonify({'error': str(e)}), 500


#-------------------------------------------------ENPOINT PARA EL ENVIO DE MENSAJES------------------------------------------------------------------------------------


@api.route('/messages/send', methods=['POST'])  # Define la ruta del endpoint y el método HTTP permitido
@jwt_required()  # Decorador que requiere que el usuario esté autenticado para acceder a este endpoint
def send_message():
    user_id = get_jwt_identity()  # Obtiene el ID del usuario autenticado desde el token JWT
    data = request.get_json()  # Extrae los datos JSON enviados en la petición
    print("Received data:", data)  # Imprime los datos recibidos para depuración

    recipients = data.get('recipients')  # Obtiene la lista de correos de los destinatarios desde los datos recibidos
    title = data.get('title')  # Obtiene el título del mensaje desde los datos recibidos
    content = data.get('content')  # Obtiene el contenido del mensaje desde los datos recibidos

    # Verifica que todos los campos necesarios estén presentes
    if not recipients or not title or not content:
        return jsonify({'error': 'All fields are required'}), 400  # Retorna un error 400 si falta algún campo

    recipients_not_found = []  # Lista para guardar los correos de destinatarios no encontrados
    try:
        new_message = MessagesSend(
            sender_id=user_id,  # ID del remitente
            title=title,  # Título del mensaje
            body=content,  # Contenido del mensaje
            send_time=datetime.utcnow()  # Fecha y hora de envío del mensaje
        )
        db.session.add(new_message)  # Añade el mensaje nuevo a la sesión de la base de datos
        db.session.flush()  # Realiza un flush para obtener el ID del mensaje antes de commitear

        # Recorre la lista de correos de los destinatarios
        for email in recipients:
            recipient = User.query.filter_by(email=email).first()  # Busca al usuario destinatario por correo
            if recipient:
                new_message_recipient = MessageRecipient(
                    message_id=new_message.id,  # ID del mensaje
                    recipient_id=recipient.id,  # ID del destinatario
                    read=False  # Establece el mensaje como no leído
                )
                db.session.add(new_message_recipient)  # Añade el destinatario del mensaje a la sesión de la base de datos
            else:
                recipients_not_found.append(email)  # Añade el correo a la lista de no encontrados si no existe el usuario

        # Verifica si hay destinatarios no encontrados
        if recipients_not_found:
            db.session.rollback()  # Revierte cambios en caso de error
            return jsonify({'error': 'Recipients not found', 'emails': recipients_not_found}), 404  # Retorna un error 404

        db.session.commit()  # Confirma los cambios en la base de datos
        return jsonify({'message': 'Message sent successfully'}), 201  # Retorna un mensaje de éxito

    except Exception as e:
        db.session.rollback()  # Revierte cambios en caso de excepción
        print(e)  # Imprime el error en consola
        return jsonify({'error': str(e)}), 500  # Retorna un error 500



@api.route('/messages', methods=['GET'])  # Define la ruta del endpoint y el método HTTP permitido para obtener mensajes
@jwt_required()  # Decorador que requiere que el usuario esté autenticado para acceder a este endpoint
def get_messages():
    user_id = get_jwt_identity()  # Obtiene el ID del usuario autenticado desde el token JWT

    try:
        # Utiliza joinedload para optimizar la carga de relaciones y evitar múltiples consultas
        received_messages = (MessageRecipient.query
                             .join(MessagesSend)  # Realiza un join con la tabla de mensajes enviados
                             .options(joinedload(MessageRecipient.message).joinedload(MessagesSend.sender))  # Pre-carga las relaciones de mensaje y remitente
                             .filter(MessageRecipient.recipient_id == user_id)  # Filtra los mensajes por el ID del destinatario
                             .all())  # Obtiene todos los mensajes que coincidan con el filtro

        # Prepara la lista de mensajes recibidos con toda la información necesaria
        result = [{
            "id": mr.message.id,  # ID del mensaje
            "from": mr.message.sender.username,  # Nombre de usuario del remitente
            "title": mr.message.title,  # Título del mensaje
            "send_time": mr.message.send_time.isoformat(),  # Fecha y hora del mensaje formateada como ISO
            "content": mr.message.body,  # Contenido del mensaje
            "read": mr.read  # Estado de lectura del mensaje
        } for mr in received_messages]  # Itera sobre cada mensaje recibido para formar el resultado

        return jsonify({"received": result}), 200  # Devuelve la lista de mensajes como respuesta JSON con un código de estado 200

    except Exception as e:
        # Manejo de errores para capturar cualquier excepción durante la consulta o procesamiento
        db.session.rollback()  # Revierte la transacción de base de datos en caso de error
        print(f"Error retrieving messages: {str(e)}")  # Imprime el error en consola
        return jsonify({'error': 'Unable to retrieve messages', 'details': str(e)}), 500  # Devuelve un error 500 con detalles del error


@api.route('/messages/read', methods=['POST'])  # Define la ruta y el método HTTP para marcar mensajes como leídos
@jwt_required()  # Asegura que el usuario esté autenticado para acceder a esta funcionalidad
def mark_as_read():
    data = request.get_json()  # Obtiene los datos enviados en la solicitud JSON
    message_id = data.get('message_id')  # Extrae el ID del mensaje de los datos de la solicitud
    user_id = get_jwt_identity()  # Obtiene el ID del usuario autenticado desde el token JWT
    
    # Busca el registro de MessageRecipient que coincida con el ID del mensaje y el ID del destinatario
    message_recipient = MessageRecipient.query.filter_by(message_id=message_id, recipient_id=user_id).first()
    if message_recipient:
        message_recipient.read = True  # Marca el mensaje como leído
        db.session.commit()  # Guarda los cambios en la base de datos
        return jsonify({"message": "Message marked as read"}), 200  # Retorna un mensaje de éxito
    return jsonify({"error": "Message not found"}), 404  # Retorna un mensaje de error si no se encuentra el registro

@api.route('/messages/unread', methods=['GET'])  # Define la ruta y el método HTTP para consultar mensajes no leídos
@jwt_required()  # Requiere autenticación para acceder a este endpoint
def check_unread_messages():
    current_user_id = get_jwt_identity()  # Obtiene el ID del usuario autenticado desde el token JWT
    # Cuenta los mensajes no leídos para el usuario autenticado
    unread_count = MessageRecipient.query.filter_by(recipient_id=current_user_id, read=False).count()
    return jsonify({"hasUnread": unread_count > 0})  # Retorna si hay o no mensajes sin leer


#-------------------------------------------------ENPOINT PARA EL ENVIO DE CORREO DE CONTACTO------------------------------------------------------------------------------------

@api.route('/contact', methods=['POST'])  # Define la ruta y el método aceptado
def handle_contact_form():
    try:
        data = request.json  # Obtiene los datos JSON enviados con la petición
        if not data:
            # Devuelve un mensaje de error si no se proporcionan datos
            return jsonify({'error': 'No data provided'}), 400
        
        # Validación informacion maliciosa
        errors = {}
        if 'firstName' not in data or not data['firstName'].strip():
            errors['firstName'] = 'First name is required'
        if 'email' not in data or not data['email']:
            errors['email'] = 'Email is required'
        elif not re.match(r"[^@]+@[^@]+\.[^@]+", data['email']):
            errors['email'] = 'Email is invalid'

        if errors:
            return jsonify({'errors': errors}), 400

        # Lista de campos requeridos para procesar la solicitud
        required_fields = ['firstName', 'lastName', 'email']
        if not all(field in data for field in required_fields):
            # Verifica si todos los campos requeridos están presentes en los datos
            return jsonify({'error': 'Missing required fields'}), 400

        EMIL_CONTACT = os.getenv('EMAIL_FOR_CONTACT')
        # Crea el contenido del correo electrónico en formato HTML
        html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
            </head>
            <body>
                <div style="margin: 0 auto; width: 80%; padding: 20px; border: 1px solid #ccc; border-radius: 5px; box-shadow: 0 2px 3px #ccc;">
                    <h1 style="color: #333;">New Contact Request</h1>
                    <ul>
                        <li><p><strong>Name:</strong> {data['firstName']} {data['lastName']}</p></li>
                        <li><p><strong>Email:</strong> {data['email']}</p></li>
                    </ul>
                    <p>contact later!</p>
                </div>
            </body>
            </html>
            """

        # Envía el correo electrónico utilizando una función de ayuda 'send_email'
        send_email('New Contact Request', EMIL_CONTACT, html_content)

        # Retorna un mensaje de éxito si todo es correcto
        return jsonify({'message': 'Contact request sent successfully'}), 200

    except Exception as e:
        # Retorna un mensaje de error si ocurre algún problema durante el proceso
        return jsonify({'error': 'Failed to send contact request: ' + str(e)}), 500







#-------------------------------------------------ENPOINT PARA EL E-COMMERS------------------------------------------------------------------------------------


@api.route('/admin/dashboard', methods=['GET'])  # Define una ruta de la API en Flask para la URL '/admin/dashboard' y especifica que solo acepta métodos GET.
# @jwt_required()  # Requiere que el usuario esté autenticado con un JWT (JSON Web Token) para acceder a esta ruta.
# @require_role('admin')  # Requiere que el usuario tenga el rol de 'admin' para acceder a esta ruta.
def get_dashboard_statistics():  # Define la función que maneja la lógica de esta ruta.
    try:  # Intenta ejecutar el siguiente bloque de código.
        # Calcula el total de ventas sumando todos los montos en la tabla EcommercePayment.
        total_sales = db.session.query(func.sum(EcommercePayment.amount)).scalar() or 0

        # Obtiene los 5 productos más vendidos:
        # 1. Selecciona el nombre del producto y la cantidad total vendida.
        # 2. Realiza una unión con la tabla OrderDetail para relacionar productos y detalles de pedidos.
        # 3. Agrupa por nombre de producto.
        # 4. Ordena los resultados por la cantidad total vendida en orden descendente.
        # 5. Limita los resultados a los 5 productos más vendidos.
        top_products = db.session.query(
            Product.name, func.sum(OrderDetail.quantity).label('total_sold')
        ).join(OrderDetail).group_by(Product.name).order_by(func.sum(OrderDetail.quantity).desc()).limit(5).all()

        # Obtiene los niveles de stock de todos los productos:
        # 1. Selecciona el nombre del producto y su nivel de stock.
        # 2. Ordena los resultados por nivel de stock en orden ascendente.
        stock_levels = db.session.query(Product.name, Product.stock).order_by(Product.stock).all()

        # Crea una respuesta en formato JSON con las estadísticas:
        # 1. 'total_sales': total de ventas.
        # 2. 'top_products': lista de los 5 productos más vendidos con su nombre y cantidad total vendida.
        # 3. 'stock_levels': lista de productos con su nombre y nivel de stock.
        response = {
            'total_sales': total_sales,
            'top_products': [{'name': prod.name, 'total_sold': prod.total_sold} for prod in top_products],
            'stock_levels': [{'name': prod.name, 'stock': prod.stock} for prod in stock_levels]
        }

        # Devuelve la respuesta en formato JSON con un código de estado HTTP 200 (OK).
        return jsonify(response), 200

    except Exception as e:  # Si ocurre alguna excepción en el bloque try, se captura aquí.
        # Devuelve una respuesta en formato JSON con el mensaje de error y un código de estado HTTP 500 (Internal Server Error).
        return jsonify({'error': str(e)}), 500

#-------------------------------------------------Gestión de Productos------------------------------------------------------------------------------------
"""
Crear Producto
"""
@api.route('/products', methods=['POST'])
@jwt_required()
def create_product():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    name = data.get('name')
    brand = data.get('brand')
    description = data.get('description', '')
    purchase_price = data.get('purchase_price', 0.0)
    price = data.get('price', 0.0)
    subcategory_id = data.get('subcategory_id')
    is_active = data.get('is_active', True)
    variants = data.get('variants', [])

    # Validación de tipo y formato
    if not isinstance(name, str) or not name.strip():
        return jsonify({'error': 'Invalid name'}), 400
    if not isinstance(brand, str) or not brand.strip():
        return jsonify({'error': 'Invalid brand'}), 400
    if not isinstance(purchase_price, (int, float)) or purchase_price < 0:
        return jsonify({'error': 'Invalid purchase_price'}), 400
    if not isinstance(price, (int, float)) or price < 0:
        return jsonify({'error': 'Invalid price'}), 400
    if subcategory_id and (not isinstance(subcategory_id, int) or subcategory_id <= 0):
        return jsonify({'error': 'Invalid subcategory ID'}), 400

    try:
        new_product = Product(
            name=name.strip(),
            brand=brand.strip(),
            description=description,
            purchase_price=purchase_price,
            price=price,
            stock=0,  # No se asigna stock directamente en la creación del producto
            subcategory_id=subcategory_id,
            is_active=is_active
        )
        db.session.add(new_product)
        db.session.flush()

        total_variant_stock = 0
        for variant in variants:
            new_variant = ProductVariant(
                product_id=new_product.id,
                sku=variant.get('sku', ''),
                price=variant.get('price', 0.0),
                stock=variant.get('stock', 0)
            )
            total_variant_stock += variant.get('stock', 0)
            db.session.add(new_variant)
            db.session.flush()

            for attribute in variant.get('attributes', []):
                new_variant_attribute = VariantAttribute(
                    variant_id=new_variant.id,
                    attribute_id=attribute.get('attribute_id'),
                    attribute_value_id=attribute.get('attribute_value_id')
                )
                db.session.add(new_variant_attribute)

        db.session.commit()
        return jsonify({'message': 'Product created successfully', 'product': new_product.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500





"""
Actualizar Producto
"""
@api.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    name = data.get('name')
    brand = data.get('brand')
    description = data.get('description', '')
    purchase_price = data.get('purchase_price', 0.0)
    price = data.get('price', 0.0)
    subcategory_id = data.get('subcategory_id')
    is_active = data.get('is_active', True)

    # Validación de tipo y formato
    if not isinstance(name, str) or not name.strip():
        return jsonify({'error': 'Invalid name'}), 400
    if not isinstance(brand, str) or not brand.strip():
        return jsonify({'error': 'Invalid brand'}), 400
    if not isinstance(purchase_price, (int, float)) or purchase_price < 0:
        return jsonify({'error': 'Invalid purchase_price'}), 400
    if not isinstance(price, (int, float)) or price < 0:
        return jsonify({'error': 'Invalid price'}), 400
    if subcategory_id and (not isinstance(subcategory_id, int) or subcategory_id <= 0):
        return jsonify({'error': 'Invalid subcategory ID'}), 400

    try:
        if name:
            product.name = name.strip()
        if brand:
            product.brand = brand.strip()
        if description:
            product.description = description
        if purchase_price is not None:
            product.purchase_price = purchase_price
        if price is not None:
            product.price = price
        if subcategory_id is not None:
            product.subcategory_id = subcategory_id
        if is_active is not None:
            product.is_active = is_active

        # No actualizamos el stock aquí directamente
        db.session.commit()

        return jsonify({'message': 'Product updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500






"""
Eliminar Producto
"""

@api.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    try:
        # Eliminar imágenes asociadas al producto
        product_images = ProductImage.query.filter_by(product_id=product_id).all()
        for image in product_images:
            db.session.delete(image)

        # Eliminar variantes asociadas al producto
        variants = ProductVariant.query.filter_by(product_id=product_id).all()
        for variant in variants:
            variant_images = VariantImage.query.filter_by(variant_id=variant.id).all()
            for image in variant_images:
                db.session.delete(image)

            # Eliminar atributos de variantes
            variant_attributes = VariantAttribute.query.filter_by(variant_id=variant.id).all()
            for attribute in variant_attributes:
                db.session.delete(attribute)
            
            db.session.delete(variant)

        # Eliminar el producto
        db.session.delete(product)
        db.session.commit()
        
        return jsonify({'message': 'Product deleted successfully'}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error: ' + str(e)}), 500


"""
Obtener Productos
"""
@api.route('/products', methods=['GET'])
# @jwt_required()
def get_products():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    products = Product.query.paginate(page=page, per_page=per_page, error_out=False)
    response = {
        'products': [product.serialize() for product in products.items],
        'total': products.total,
        'pages': products.pages,
        'current_page': products.page
    }
    return jsonify(response), 200

# @api.route('/products', methods=['GET'])
# @jwt_required()
# def get_products():
#     products = Product.query.all()
#     response = [product.serialize() for product in products]
#     return jsonify(response), 200

"""
busqueda de Productos
"""
@api.route('/products/search', methods=['GET'])
@jwt_required()
def search_products():
    query = request.args.get('query', '')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    products = Product.query.filter(Product.name.ilike(f'%{query}%'))
    if min_price is not None:
        products = products.filter(Product.price >= min_price)
    if max_price is not None:
        products = products.filter(Product.price <= max_price)
    products = products.all()
    response = [product.serialize() for product in products]
    return jsonify(response), 200



#-------------------------------------------------Gestión de categorias------------------------------------------------------------------------------------

"""
Crear Categoría
"""
@api.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    name = data.get('name')
    description = data.get('description')

    if not isinstance(name, str) or not name.strip():
        return jsonify({'error': 'Invalid name'}), 400

    try:
        new_category = Category(
            name=name.strip(),
            description=description.strip() if description else None
        )
        db.session.add(new_category)
        db.session.commit()
        return jsonify({'message': 'Category created successfully', 'category': new_category.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



"""
Actualizar Categoría
"""
@api.route('/categories/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    data = request.get_json()
    category = Category.query.get(category_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    for key, value in data.items():
        if hasattr(category, key):
            setattr(category, key, value)

    db.session.commit()
    return jsonify({'message': 'Category updated successfully'}), 200

"""
Eliminar Categoría
"""
@api.route('/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Category deleted successfully'}), 200

"""
Obtener Categorías
"""
@api.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    categories = Category.query.all()
    response = [category.serialize() for category in categories]
    return jsonify(response), 200

#-------------------------------------------------Gestión de sub-categorias------------------------------------------------------------------------------------

"""
Crear Sub-Categoría
"""
@api.route('/subcategories', methods=['POST'])
@jwt_required()
def create_subcategory():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    name = data.get('name')
    description = data.get('description')
    category_id = data.get('category_id')

    if not all([name, category_id]):
        return jsonify({'error': 'Missing data'}), 400

    new_subcategory = SubCategory(
        name=name,
        description=description,
        category_id=category_id
    )
    db.session.add(new_subcategory)
    db.session.commit()

    return jsonify({'message': 'SubCategory created successfully', 'subcategory': new_subcategory.id}), 201

"""
Actualizar Sub-Categoría
"""

@api.route('/subcategories/<int:subcategory_id>', methods=['PUT'])
@jwt_required()
def update_subcategory(subcategory_id):
    data = request.get_json()
    subcategory = SubCategory.query.get(subcategory_id)
    if not subcategory:
        return jsonify({'error': 'SubCategory not found'}), 404

    for key, value in data.items():
        if hasattr(subcategory, key):
            setattr(subcategory, key, value)

    db.session.commit()
    return jsonify({'message': 'SubCategory updated successfully'}), 200

"""
eliminar Sub-Categoría
"""

@api.route('/subcategories/<int:subcategory_id>', methods=['DELETE'])
@jwt_required()
def delete_subcategory(subcategory_id):
    subcategory = SubCategory.query.get(subcategory_id)
    if not subcategory:
        return jsonify({'error': 'SubCategory not found'}), 404

    db.session.delete(subcategory)
    db.session.commit()
    return jsonify({'message': 'SubCategory deleted successfully'}), 200

"""
obtener Sub-Categoría
"""

@api.route('/subcategories', methods=['GET'])
@jwt_required()
def get_subcategories():
    subcategories = SubCategory.query.all()
    response = [subcategory.serialize() for subcategory in subcategories]
    return jsonify(response), 200



#-------------------------------------------------Gestión de inventarios------------------------------------------------------------------------------------
"""
Actualizar Inventario
"""
@api.route('/products/<int:product_id>/stock', methods=['PUT'])
@jwt_required()
def update_stock(product_id):
    data = request.get_json()
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    stock = data.get('stock')
    if stock is None:
        return jsonify({'error': 'Stock value is required'}), 400

    product.stock = stock
    db.session.commit()
    return jsonify({'message': 'Stock updated successfully'}), 200

#-------------------------------------------------Gestión de Pedidos y Pagos------------------------------------------------------------------------------------

"""
Crear Pedido
"""
@api.route('/orders', methods=['POST'])
@jwt_required()
def create_order():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or 'items' not in data:
        return jsonify({'error': 'No data or items provided'}), 400

    items = data['items']
    shipping_type = data.get('shipping_type')
    shipping_address = data.get('shipping_address')

    if not items or not shipping_type:
        return jsonify({'error': 'Missing items or shipping type'}), 400

    try:
        total = sum(item['price'] * item['quantity'] for item in items)
        new_order = Order(
            user_id=user_id,
            total=total,
            shipping_type=shipping_type,
            shipping_address=shipping_address
        )
        db.session.add(new_order)
        db.session.flush()  # Get the order ID before commit

        for item in items:
            product = Product.query.get(item['product_id'])
            if not product or product.stock < item['quantity']:
                db.session.rollback()
                return jsonify({'error': 'Product not found or insufficient stock'}), 400

            product.stock -= item['quantity']
            order_detail = OrderDetail(
                order_id=new_order.id,
                product_id=item['product_id'],
                quantity=item['quantity'],
                price=item['price']
            )
            db.session.add(order_detail)

        db.session.commit()
        return jsonify({'message': 'Order created successfully', 'order': new_order.id}), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error: ' + str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Unexpected error: ' + str(e)}), 500

"""
Actualizar Estado del Pedido
"""
@api.route('/orders/<int:order_id>', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    data = request.get_json()
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    status = data.get('status')
    if not status:
        return jsonify({'error': 'Status is required'}), 400

    order.status = status
    db.session.commit()
    return jsonify({'message': 'Order status updated successfully'}), 200

"""
Obtener Pedidos

"""
@api.route('/orders', methods=['GET'])
@jwt_required()
def get_orders():
    orders = Order.query.all()
    response = [order.serialize() for order in orders]
    return jsonify(response), 200


#-------------------------------------------------Gestión de Pagos------------------------------------------------------------------------------------

"""
Crear Pago
"""
@api.route('/ecommerce-payments', methods=['POST'])
@jwt_required()
def create_ecommerce_payment():
    user_id = get_jwt_identity()
    data = request.get_json()

    order_id = data.get('order_id')
    amount = data.get('amount')
    payment_method = data.get('payment_method')
    status = data.get('status')
    transaction_reference = data.get('transaction_reference')
    shipping_type = data.get('shipping_type')
    shipping_address = data.get('shipping_address')
    estimated_delivery_date = data.get('estimated_delivery_date')

    if not all([order_id, amount, payment_method, status, shipping_type]):
        return jsonify({'error': 'Missing data'}), 400

    new_payment = EcommercePayment(
        user_id=user_id,
        order_id=order_id,
        amount=amount,
        payment_method=payment_method,
        status=status,
        transaction_reference=transaction_reference,
        shipping_type=shipping_type,
        shipping_address=shipping_address,
        estimated_delivery_date=estimated_delivery_date
    )
    db.session.add(new_payment)
    db.session.commit()

    return jsonify({'message': 'Payment created successfully', 'payment': new_payment.id}), 201

"""
Obtener Pagos
"""

@api.route('/ecommerce-payments', methods=['GET'])
@jwt_required()
def get_ecommerce_payments():
    payments = EcommercePayment.query.all()
    response = [payment.serialize() for payment in payments]
    return jsonify(response), 200


#-------------------------------------------------Gestión de Promociones------------------------------------------------------------------------------------

"""
Crear Promoción
"""
@api.route('/promotions', methods=['POST'])
@jwt_required()
def create_promotion():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    name = data.get('name')
    description = data.get('description')
    discount_percentage = data.get('discount_percentage')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    is_active = data.get('is_active', True)

    if not all([name, discount_percentage, start_date, end_date]):
        return jsonify({'error': 'Missing data'}), 400

    try:
        new_promotion = Promotion(
            name=name,
            description=description,
            discount_percentage=discount_percentage,
            start_date=start_date,
            end_date=end_date,
            is_active=is_active
        )
        db.session.add(new_promotion)
        db.session.commit()
        return jsonify({'message': 'Promotion created successfully', 'promotion': new_promotion.id}), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error: ' + str(e)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Unexpected error: ' + str(e)}), 500


"""
Actualizar Promoción
"""
@api.route('/promotions/<int:promotion_id>', methods=['PUT'])
@jwt_required()
def update_promotion(promotion_id):
    data = request.get_json()
    promotion = Promotion.query.get(promotion_id)
    if not promotion:
        return jsonify({'error': 'Promotion not found'}), 404

    for key, value in data.items():
        if hasattr(promotion, key):
            setattr(promotion, key, value)

    db.session.commit()
    return jsonify({'message': 'Promotion updated successfully'}), 200

"""
Eliminar Promoción
"""
@api.route('/promotions/<int:promotion_id>', methods=['DELETE'])
@jwt_required()
def delete_promotion(promotion_id):
    promotion = Promotion.query.get(promotion_id)
    if not promotion:
        return jsonify({'error': 'Promotion not found'}), 404

    db.session.delete(promotion)
    db.session.commit()
    return jsonify({'message': 'Promotion deleted successfully'}), 200

"""
Obtener Promociones
"""
@api.route('/promotions', methods=['GET'])
@jwt_required()
def get_promotions():
    promotions = Promotion.query.all()
    response = [promotion.serialize() for promotion in promotions]
    return jsonify(response), 200

"""
Asociar Producto con Promoción
"""
@api.route('/product-promotions', methods=['POST'])
@jwt_required()
def create_product_promotion():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    product_id = data.get('product_id')
    promotion_id = data.get('promotion_id')

    if not all([product_id, promotion_id]):
        return jsonify({'error': 'Missing data'}), 400

    new_product_promotion = ProductPromotion(
        product_id=product_id,
        promotion_id=promotion_id
    )
    db.session.add(new_product_promotion)
    db.session.commit()

    return jsonify({'message': 'ProductPromotion created successfully', 'product_promotion': new_product_promotion.id}), 201

"""
Eliminar Asociación de Producto con Promoción
"""
@api.route('/product-promotions/<int:product_promotion_id>', methods=['DELETE'])
@jwt_required()
def delete_product_promotion(product_promotion_id):
    product_promotion = ProductPromotion.query.get(product_promotion_id)
    if not product_promotion:
        return jsonify({'error': 'ProductPromotion not found'}), 404

    db.session.delete(product_promotion)
    db.session.commit()
    return jsonify({'message': 'ProductPromotion deleted successfully'}), 200


#-------------------------------------------------Gestión de imagen de produecto------------------------------------------------------------------------------------
"""
Carga de imagen producto
"""
@api.route('/upload_product_image/<int:product_id>', methods=['POST'])
@jwt_required()
def upload_product_image(product_id):
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({'error': 'No selected file or invalid file type'}), 400

        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        # Optimizar la imagen
        optimized_image_data = optimize_image(file)

        # Aquí guardarías optimized_image_data en la base de datos
        new_image = ProductImage(product_id=product.id, image_data=optimized_image_data)
        db.session.add(new_image)
        db.session.commit()
        return jsonify({'message': 'Product image uploaded successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

    
"""
actualizar imagen producto
"""
@api.route('/update_product_image/<int:image_id>', methods=['PUT'])
@jwt_required()
def update_product_image(image_id):
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        image = ProductImage.query.get(image_id)
        if not image:
            return jsonify({'error': 'Image not found'}), 404

        if file and allowed_file(file.filename):
            file_data = file.read()
            image.image_data = file_data
            db.session.commit()
            return jsonify({'message': 'Product image updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

"""
eliminar imagen producto
"""
@api.route('/delete_product_image/<int:image_id>', methods=['DELETE'])
@jwt_required()
def delete_product_image(image_id):
    try:
        image = ProductImage.query.get(image_id)
        if not image:
            return jsonify({'error': 'Image not found'}), 404

        db.session.delete(image)
        db.session.commit()
        return jsonify({'message': 'Product image deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



@api.route('/upload_variant_image/<int:variant_id>', methods=['POST'])
@jwt_required()
def upload_variant_image(variant_id):
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({'error': 'No selected file or invalid file type'}), 400

        variant = ProductVariant.query.get(variant_id)
        if not variant:
            return jsonify({'error': 'Variant not found'}), 404

        # Optimizar la imagen
        optimized_image_data = optimize_image(file)

        # Aquí guardarías optimized_image_data en la base de datos
        new_image = VariantImage(variant_id=variant.id, image_data=optimized_image_data)
        db.session.add(new_image)
        db.session.commit()
        return jsonify({'message': 'Variant image uploaded successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api.route('/delete_variant_image/<int:image_id>', methods=['DELETE'])
@jwt_required()
def delete_variant_image(image_id):
    try:
        image = VariantImage.query.get(image_id)
        if not image:
            return jsonify({'error': 'Image not found'}), 404

        db.session.delete(image)
        db.session.commit()
        return jsonify({'message': 'Variant image deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

#-------------------------------------------------crear variante del producto------------------------------------------------------------------------------------

# Crear variante de producto
@api.route('/api/products/<int:product_id>/variants', methods=['POST'])
@jwt_required()
def create_product_variant(product_id):
    data = request.get_json()
    if not data or 'sku' not in data or 'price' not in data or 'stock' not in data:
        return jsonify({'error': 'No data or required fields provided'}), 400

    new_variant = ProductVariant(
        product_id=product_id,
        sku=data['sku'],
        price=data['price'],
        stock=data['stock']
    )
    try:
        db.session.add(new_variant)
        db.session.flush()

        for attr in data.get('attributes', []):
            new_attr = VariantAttribute(
                variant_id=new_variant.id,
                attribute_id=attr['attribute_id'],
                attribute_value_id=attr['attribute_value_id']
            )
            db.session.add(new_attr)

        db.session.commit()
        return jsonify({'message': 'Product variant created successfully', 'variant': new_variant.serialize()}), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error: ' + str(e)}), 500

# Actualizar variante de producto
@api.route('/products/variants/<int:variant_id>', methods=['PUT'])
@jwt_required()
def update_product_variant(variant_id):
    data = request.get_json()
    variant = ProductVariant.query.get(variant_id)
    if not variant:
        return jsonify({'error': 'Variant not found'}), 404

    sku = data.get('sku')
    price = data.get('price')
    stock = data.get('stock')

    if sku:
        variant.sku = sku
    if price is not None:
        variant.price = price
    if stock is not None:
        variant.stock = stock

    # Actualizar atributos de la variante
    existing_attributes = {attr.attribute_id: attr for attr in variant.attributes}

    for attr in data.get('attributes', []):
        attribute_id = attr['attribute_id']
        attribute_value_id = attr['attribute_value_id']
        
        if attribute_id in existing_attributes:
            # Si el atributo ya existe, actualízalo
            existing_attributes[attribute_id].attribute_value_id = attribute_value_id
        else:
            # Si el atributo no existe, créalo
            new_attr = VariantAttribute(
                variant_id=variant.id,
                attribute_id=attribute_id,
                attribute_value_id=attribute_value_id
            )
            db.session.add(new_attr)

    db.session.commit()
    return jsonify({'message': 'Variant updated successfully'}), 200

    

# Eliminar variante de producto
@api.route('/products/variants/<int:variant_id>', methods=['DELETE'])
@jwt_required()
def delete_product_variant(variant_id):
    variant = ProductVariant.query.get(variant_id)
    if not variant:
        return jsonify({'error': 'Variant not found'}), 404

    try:
        # Eliminar atributos y valores asociados
        variant_attributes = VariantAttribute.query.filter_by(variant_id=variant_id).all()
        for attr in variant_attributes:
            db.session.delete(attr)

        # Eliminar imágenes asociadas
        variant_images = VariantImage.query.filter_by(variant_id=variant_id).all()
        for image in variant_images:
            db.session.delete(image)

        db.session.delete(variant)
        db.session.commit()
        return jsonify({'message': 'Variant and associated attributes and images deleted successfully'}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error: ' + str(e)}), 500
    
# Eliminar atributo de variante
@api.route('/products/variants/<int:variant_id>/attributes/<int:attribute_id>', methods=['DELETE'])
@jwt_required()
def delete_variant_attribute(variant_id, attribute_id):
    variant_attribute = VariantAttribute.query.filter_by(variant_id=variant_id, attribute_id=attribute_id).first()
    if not variant_attribute:
        return jsonify({'error': 'Variant attribute not found'}), 404

    try:
        db.session.delete(variant_attribute)
        db.session.commit()
        return jsonify({'message': 'Variant attribute deleted successfully'}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error: ' + str(e)}), 500
    
# Obtener variantes de producto
@api.route('/api/products/<int:product_id>/variants', methods=['GET'])
@jwt_required()
def get_product_variants(product_id):
    variants = ProductVariant.query.filter_by(product_id=product_id).all()
    return jsonify([var.serialize() for var in variants]), 200

#-------------------------------------------------crear atributos del producto------------------------------------------------------------------------------------

# Crear atributo
@api.route('/attributes', methods=['POST'])
@jwt_required()
def create_attribute():
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({'error': 'No data or name provided'}), 400

    new_attribute = Attribute(name=data['name'])
    try:
        db.session.add(new_attribute)
        db.session.commit()
        return jsonify({'message': 'Attribute created successfully', 'attribute': new_attribute.serialize()}), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error: ' + str(e)}), 500

# Crear valor de atributo
@api.route('/attributes/<int:attribute_id>/values', methods=['POST'])
@jwt_required()
def create_attribute_value(attribute_id):
    data = request.get_json()
    if not data or 'value' not in data:
        return jsonify({'error': 'No data or value provided'}), 400

    new_value = AttributeValue(attribute_id=attribute_id, value=data['value'])
    try:
        db.session.add(new_value)
        db.session.commit()
        return jsonify({'message': 'Attribute value created successfully', 'value': new_value.serialize()}), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error: ' + str(e)}), 500

# Obtener atributos
@api.route('/attributes', methods=['GET'])
@jwt_required()
def get_attributes():
    attributes = Attribute.query.all()
    return jsonify([attr.serialize() for attr in attributes]), 200

# Obtener valores de atributo
@api.route('/attributes/<int:attribute_id>/values', methods=['GET'])
@jwt_required()
def get_attribute_values(attribute_id):
    values = AttributeValue.query.filter_by(attribute_id=attribute_id).all()
    return jsonify([val.serialize() for val in values]), 200


@api.route('/attributes/<int:attribute_id>', methods=['PUT'])
@jwt_required()
def update_attribute(attribute_id):
    data = request.get_json()
    attribute = Attribute.query.get(attribute_id)
    if not attribute:
        return jsonify({'error': 'Attribute not found'}), 404

    name = data.get('name')
    if not name or not isinstance(name, str):
        return jsonify({'error': 'Invalid name'}), 400

    attribute.name = name.strip()
    try:
        db.session.commit()
        return jsonify({'message': 'Attribute updated successfully', 'attribute': attribute.serialize()}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error: ' + str(e)}), 500

@api.route('/attributes/<int:attribute_id>', methods=['DELETE'])
@jwt_required()
def delete_attribute(attribute_id):
    attribute = Attribute.query.get(attribute_id)
    if not attribute:
        return jsonify({'error': 'Attribute not found'}), 404

    try:
        db.session.delete(attribute)
        db.session.commit()
        return jsonify({'message': 'Attribute deleted successfully'}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error: ' + str(e)}), 500


