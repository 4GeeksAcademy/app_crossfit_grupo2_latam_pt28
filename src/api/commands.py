# Importamos las librerías necesarias para la funcionalidad del script
import click  # Utilizado para crear comandos de línea de comandos en Flask
from flask import current_app as app  # Permite acceder a la instancia actual de la aplicación Flask
from api.models import db, User, Role, Permission, SecurityQuestion, Training_classes, Membership, RolePermission, Booking, UserMembershipHistory, Payment  # Importamos los modelos de la base de datos
from datetime import datetime, timedelta  # Importamos funciones de tiempo para manejar fechas
from faker import Faker  # Faker es una librería para generar datos aleatorios
import random  # Librería para generar números aleatorios

fake = Faker()  # Crea una instancia de Faker para generar datos aleatorios como nombres, correos, etc.

"""
COMANDO PARA REINICIR MIGRACIONES:

rm -R -f ./migrations &&
pipenv run init &&
dropdb -h localhost -U postgres gym_db || true &&
createdb -h localhost -U postgres gym_db || true &&
psql -h localhost postgres -U gym_db -c 'CREATE EXTENSION unaccent;' || true &&
pipenv run migrate &&
pipenv run upgrade

"""


"""
Comandos de Flask para creacion de usuarios

flask create-permissions
flask create-roles-and-permissions
flask create-users
flask create-memberships
flask assign-memberships
flask assign-transactions
flask create-classes
flask create-bookings

"""

def setup_commands(app):
    @app.cli.command("create-permissions")
    def create_permissions():
        """Crear permisos base para la aplicación."""
        print("Creating permissions...")
        permissions = [
            {"name": "gestionar usuarios", "description": "Crear, editar, eliminar usuarios"},
            {"name": "gestionar membresias", "description": "Activar o desactivar membrecías"},
            {"name": "ver reportes", "description": "Acceso a los reportes de ingresos y egresos"},
            {"name": "configuraciones de gimnasio", "description": "Cambiar horarios de apertura, precios, etc."},
            {"name": "acceder a perfiles de miembros", "description": "Ver información detallada de todos los miembros"},
            {"name": "gestion de clases", "description": "Crear, editar, eliminar clases programadas"},
            {"name": "registro de proceso", "description": "Registrar y ver el progreso personal en ejercicios y metas"},
            {"name": "acceso a clases", "description": "Capacidad de reserva de clases grupales"}
        ]
        for perm in permissions:
            p = Permission(name=perm['name'], description=perm['description'])
            db.session.add(p)
        db.session.commit()
        print("Permissions created.")

    @app.cli.command("create-roles-and-permissions")
    def create_roles_and_permissions():
        """Crear roles y asignar permisos a estos roles."""
        print("Creating roles and permissions...")
        roles = [
            {"name": "master", "description": "Tiene acceso completo a todas las funciones y datos del sistema."},
            {"name": "admin", "description": "Gestiona todas las funciones administrativas del gimnasio."},
            {"name": "coach", "description": "Responsable de dirigir clases y entrenar a los miembros."},
            {"name": "receptionist", "description": "Maneja la recepción y la atención al cliente."},
            {"name": "athlete", "description": "Cliente regular que utiliza las instalaciones para entrenamiento."}
        ]
        for role in roles:
            r = Role(name=role['name'], description=role['description'])
            db.session.add(r)
            db.session.commit()  # Guarda el rol para obtener su ID y poder asignar permisos
        # Asignar todos los permisos a cada rol adecuadamente
        for role in Role.query.all():
            for perm in Permission.query.all():
                rp = RolePermission(role_id=role.id, permission_id=perm.id)
                db.session.add(rp)
        db.session.commit()
        print("Roles and permissions created.")

    @app.cli.command("create-users")
    def create_users():
        """Crear usuarios maestro y atletas en la base de datos."""
        print("Creating users...")
        master_user = User(
            email="usuariomaster@gmail.com",
            name="Master",
            last_name="Usuario",
            username="masteruser",
            password="11",
            is_active=True,
            role_id=1  # ID de rol 'master'
        )
        db.session.add(master_user)
        db.session.commit()
        for i in range(1, 6):
            user = User(
                email=f"usuario{i}@example.com",
                name=fake.first_name(),
                last_name=fake.last_name(),
                username=f"usuario{i}",
                password="secure_password",
                is_active=True,
                role_id=5  # ID de rol 'athlete'
            )
            db.session.add(user)
            db.session.commit()
            # Agrega preguntas de seguridad para cada usuario
            sq1 = SecurityQuestion(question="¿Nombre de tu primera mascota?", answer="Nala", user_id=user.id)
            sq2 = SecurityQuestion(question="¿Ciudad de nacimiento?", answer="Ciudad", user_id=user.id)
            db.session.add(sq1)
            db.session.add(sq2)
        print("Users created.")

    @app.cli.command("create-memberships")
    def create_memberships():
        """Crear diferentes tipos de membresías."""
        print("Creating memberships...")
        memberships = [
            {"name": "Gold Membership", "description": "Access to all classes and facilities.", "price": 50.00, "duration_days": 20, "classes_per_month": 10},
            {"name": "Silver Membership", "description": "Access to gym and 5 classes per month.", "price": 30.00, "duration_days": 10, "classes_per_month": 5},
            {"name": "Platinum Membership", "description": "Unlimited access to all classes and spa facilities.", "price": 70.00, "duration_days": 30, "classes_per_month": 20}
        ]
        for mem in memberships:
            membership = Membership(**mem)
            db.session.add(membership)
        db.session.commit()
        print("Memberships created.")

    @app.cli.command("assign-memberships")
    def assign_memberships():
        """Asignar membresías a los usuarios."""
        print("Assigning memberships to users...")
        membership_list = Membership.query.all()
        users = User.query.filter(User.role_id == 5).all()  # Supongamos que '5' es el ID de rol para 'atletas'
        for user in users:
            selected_membership = random.choice(membership_list)
            start_date = datetime.now()
            end_date = start_date + timedelta(days=selected_membership.duration_days)
            membership_history = UserMembershipHistory(
                user_id=user.id,
                membership_id=selected_membership.id,
                start_date=start_date,
                end_date=end_date,
                remaining_classes=selected_membership.classes_per_month,
                is_active=True
            )
            db.session.add(membership_history)
        db.session.commit()
        print("Memberships assigned to users.")

    @app.cli.command("assign-transactions")
    def assign_transactions():
        """Asignar transacciones a las compras de membresías de los usuarios."""
        print("Assigning transactions to memberships...")
        users = User.query.all()  # Obtén todos los usuarios
        for user in users:
            if user.memberships_history:
                for membership_history in user.memberships_history:
                    # Asegurarse de que solo se creen pagos para membresías activas sin transacciones previas
                    if membership_history.is_active and not any(payment.membership_id == membership_history.membership_id for payment in user.payments):
                        payment = Payment(
                            user_id=user.id,
                            membership_id=membership_history.membership_id,
                            amount=membership_history.membership.price,  # Usa el precio de la membresía
                            payment_date=datetime.utcnow(),
                            confirmation_date=datetime.utcnow(),
                            payment_method="credit_card",  # Supongamos método de pago
                            card_type="visa",
                            status="completed",  # Estado del pago
                            transaction_reference=f"TRANS{user.id}{membership_history.id}",  # Referencia de transacción simple
                            description=f"Payment for {membership_history.membership.name}"
                        )
                        db.session.add(payment)
                        print(f"Transaction assigned to {user.name} for membership {membership_history.membership.name}")
        db.session.commit()
        print("All transactions assigned successfully.")

    @app.cli.command("create-classes")
    def create_classes():
        """Crear clases programadas para una semana."""
        print("Creating classes...")
        start_date = datetime.now()
        for i in range(7):
            for hour in range(8, 20, 2):  # De 8 a 18 cada dos horas
                class_info = {
                    "name": f"CrossFit Level {i}",
                    "description": "Clase de CrossFit",
                    "dateTime_class": start_date + timedelta(days=i, hours=hour - start_date.hour),
                    "start_time": f"{hour}:00",
                    "duration_minutes": 60,
                    "available_slots": 20
                }
                training_class = Training_classes(**class_info)
                db.session.add(training_class)
        db.session.commit()
        print("Classes created.")

    @app.cli.command("create-bookings")
    def create_bookings():
        """Crear reservas para las clases creadas y descontar clases disponibles."""
        print("Creating bookings...")
        users = User.query.filter(User.role_id == 5).all()  # Todos los usuarios atletas
        classes = Training_classes.query.all()
        for training_class in classes:
            if not users:
                print("No users available for bookings.")
                return  # Salir si no hay usuarios
            num_bookings = random.randint(1, min(len(users), training_class.available_slots))  # Ajusta aquí para no superar el número de usuarios
            booked_users = random.sample(users, num_bookings)  # Usuarios aleatorios para reservas
            for user in booked_users:
                active_membership = user.get_active_membership()
                if active_membership and active_membership.remaining_classes > 0:
                    booking = Booking(
                        user_id=user.id,
                        training_class_id=training_class.id,
                        booking_date=datetime.now(),
                        status='reserved'
                    )
                    db.session.add(booking)
                    # Descontar una clase de la membresía activa del usuario
                    active_membership.remaining_classes -= 1
                else:
                    print(f"No remaining classes for user {user.id}")
        db.session.commit()
        print("Bookings created.")


    @app.cli.command("insert-test-data")
    def insert_test_data():
        """Insertar todos los datos de prueba en la base de datos de manera secuencial y ordenada."""
        create_permissions()
        create_roles_and_permissions()
        create_users()
        create_memberships()
        assign_memberships()
        assign_transactions()  
        create_classes()
        create_bookings()
        print("All test data created successfully!")



""""
    1. Definición de Comandos
    Cada función decorada con @app.cli.command() define un comando que puede ser ejecutado desde la línea de comandos. Esto permite realizar tareas específicas como crear usuarios, roles, permisos, etc.

    2. Comandos Específicos
    
    create-permissions
    Propósito: Crear permisos básicos en la base de datos que serán usados para controlar el acceso a diferentes funciones de la aplicación.
    Proceso:
    Define una lista de permisos con su nombre y descripción.
    Itera sobre esta lista, creando instancias del modelo Permission y guardándolas en la base de datos.

    create-roles-and-permissions
    Propósito: Establecer roles y asignar los permisos creados a estos roles.
    Proceso:
    Define una lista de roles con su descripción.
    Por cada rol, crea una instancia y la guarda en la base de datos.
    Una vez que todos los roles están creados y guardados, asigna permisos a cada rol. Esto se hace iterando sobre todos los permisos y roles, y creando relaciones a través del modelo RolePermission.
    
    create-users
    Propósito: Crear usuarios de prueba, incluyendo un usuario maestro y varios usuarios con el rol de atleta.
    Proceso:
    Crea un usuario maestro con un rol específico.
    Crea varios usuarios atletas, usando la biblioteca faker para generar nombres y apellidos ficticios.
    A cada usuario atleta, se le asignan preguntas de seguridad.
    
    create-memberships
    Propósito: Crear diferentes tipos de membresías que los usuarios pueden adquirir.
    Proceso:
    Define una lista de membresías con detalles como nombre, descripción, precio, duración y clases permitidas por mes.
    Crea y guarda cada membresía en la base de datos.
    
    assign-memberships
    Propósito: Asignar membresías a los usuarios atletas.
    Proceso:
    Obtiene todos los usuarios con rol de atleta y todas las membresías disponibles.
    Asigna aleatoriamente una membresía a cada usuario atleta, estableciendo fechas de inicio y fin basadas en la duración de la membresía.

    assign_transactions
    Propósito: Asigna transacciones a las compras de membresías.
    Proceso:
    Recorre todos los usuarios y sus historiales de membresía.
    Para cada membresía activa de un usuario, verifica si ya existe una transacción. Si no existe, crea una nueva transacción.
    Utiliza detalles como el precio de la membresía para el monto del pago y establece detalles de referencia y descripción basados en datos de la membresía.
    Almacena cada pago en la base de datos.
    
    create-classes
    Propósito: Crear clases programadas que los usuarios pueden reservar.
    Proceso:
    Programa clases para cada día de la semana en intervalos de dos horas.
    Guarda cada clase en la base de datos.
    
    create-bookings
    Propósito: Crear reservas para las clases.
    Proceso:
    Obtiene todos los usuarios atletas y todas las clases creadas.
    Para cada clase, selecciona un número aleatorio de usuarios y crea una reserva para cada uno.
    Maneja adecuadamente la cantidad de usuarios para evitar errores cuando hay más reservas posibles que usuarios.
    insert-test-data
    Propósito: Ejecutar todos los comandos anteriores en secuencia para poblar la base de datos con datos de prueba.
    Proceso:
    Llama secuencialmente a cada uno de los comandos definidos anteriormente.
    
    3. Ejecución de Comandos
    Para ejecutar cualquier comando, utilizas la interfaz de línea de comandos de Flask con el prefijo flask, por ejemplo:
"""