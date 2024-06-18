from flask_sqlalchemy import SQLAlchemy  # Importación del módulo SQLAlchemy para interactuar con la base de datos
from sqlalchemy import LargeBinary



from datetime import datetime  # Importación del módulo datetime para trabajar con fechas y horas
import json  # Importación del módulo json para trabajar con datos en formato JSON
import base64  # Importación del módulo base64 para la codificación de imágenes
db = SQLAlchemy()
    


#-----------------------------------------------------------------TABLAS PARA USER Y SEGURITY_QUESTION--------------------------------------------

# Tabla de Usuarios
class User(db.Model):  # Define una clase que representa la tabla de usuarios en la base de datos
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=True)  # Nullable para permitir usuarios invitados
    password = db.Column(db.String(250), nullable=True)  # Nullable para permitir usuarios invitados
    is_active = db.Column(db.Boolean(), default=True)
    is_guest = db.Column(db.Boolean(), default=False, nullable=True)  # Indica si el usuario es un invitado
    name = db.Column(db.String(80), nullable=True)  # Nullable para permitir usuarios invitados
    last_name = db.Column(db.String(80), nullable=True)  # Nullable para permitir usuarios invitados
    username = db.Column(db.String(80), nullable=True)  # Nullable para permitir usuarios invitados
    registration_date = db.Column(db.DateTime, default=datetime.utcnow)
    last_update_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    image_url = db.Column(db.String(255), nullable=True)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id', ondelete='SET NULL'), nullable=True)
    profile_image_id = db.Column(db.Integer, db.ForeignKey('profile_image.id'), nullable=True)


    # Relación con SecurityQuestion configurada para eliminar en cascada
    security_questions = db.relationship('SecurityQuestion', back_populates='user', cascade='all, delete-orphan')
    role = db.relationship("Role")  # Relación con la tabla de módulos
    profile_image = db.relationship('ProfileImage', back_populates='user', uselist=False)  # Relación uno a uno


    # Relaciones sin eliminar en cascada para Membership History y Payments
    memberships_history = db.relationship('UserMembershipHistory', backref='user', lazy='dynamic')
    payments = db.relationship('Payment', backref='user', lazy=True)
    bookings = db.relationship('Booking', backref='user', lazy=True)
    pr_records = db.relationship('PRRecord', backref='user', lazy=True)


    #NOTA: siempre que se haga un eliminacion de base de datos se debe comentar active_membership_id y active_membership ya que tiene una relacion circular y una depende de otra


    def __repr__(self):  # Método para representar un objeto de usuario como una cadena
        return '<User %r>' % self.id
    
    def get_active_membership(self):
        # Obtener la membresía activa basada en la fecha y el estado
        return self.memberships_history.filter(
            UserMembershipHistory.end_date >= datetime.utcnow(),
            UserMembershipHistory.is_active == True
        ).first()

    def has_active_membership(self):
        # Verificar si el usuario tiene una membresía activa
        active_membership = self.get_active_membership()
        return active_membership is not None and active_membership.end_date > datetime.utcnow()

    def has_remaining_classes(self):
        # Verificar si el usuario tiene clases restantes en su membresía
        active_membership = self.get_active_membership()
        return active_membership and active_membership.remaining_classes > 0

    def consume_class(self):
        # Consumir una clase de la membresía del usuario
        active_membership = self.get_active_membership()
        if self.has_active_membership() and self.has_remaining_classes():
            active_membership.remaining_classes -= 1
            db.session.commit()
            return True
        return False

    # def activate_membership(self, membership):
    #     # Activar una membresía para el usuario
    #     self.membership = membership
    #     db.session.commit()  # Guardar los cambios en la base de datos
    
    def serialize(self):  # Método para serializar un objeto de usuario a un diccionario JSON
        active_membership = self.get_active_membership()  # Obtiene la membresía activa usando el nuevo método
        active_status = "Activa" if active_membership and active_membership.is_active else "No Activa"

        return {  # Devolver un diccionario con los atributos del usuario
            "id": self.id,
            "email": self.email,
            "image": self.image_url,
            "username": self.username,
            "is_active": self.is_active,
            "name": self.name,
            "last_name": self.last_name,
            "role": self.role.name if self.role else "N/A",  # Mostrar "N/A" si no hay rol
            "security_questions_question1": self.security_questions[0].question if self.security_questions else "N/A",
            "security_questions_answer1": self.security_questions[0].answer if self.security_questions else "N/A",
            "security_questions_question2": self.security_questions[1].question if self.security_questions else "N/A",
            "security_questions_answer2": self.security_questions[1].answer if self.security_questions else "N/A",
            "password": self.password,  # Generalmente no es buena práctica incluir la contraseña en información serializada.
            "register_date": self.registration_date.isoformat(),  # Formato ISO de la fecha
            "account_update": self.last_update_date.isoformat(),  # Formato ISO de la fecha
            "active_membership_is_active": active_membership.is_active if active_membership else "N/A",
            "active_membership_is_active": active_status,
            "membership_start_date": active_membership.start_date.isoformat() if active_membership else "N/A",
            "membership_end_date": active_membership.end_date.isoformat() if active_membership else "N/A",
            "membership_description": active_membership.membership.description if active_membership and active_membership.membership else "N/A",
            "membership_remaining_classes": active_membership.remaining_classes if active_membership else "N/A",
            "bookings": [booking.serialize() for booking in self.bookings],
            "profile_image_url": self.profile_image.img_url if self.profile_image else None,  # Añadido para la URL de la imagen de perfil
            "pr_records": [record.serialize() for record in self.pr_records]


        }

    
    
# Tabla de Asignación de Preguntas de Seguridad
class SecurityQuestion(db.Model):  # Define una clase que representa la tabla de asignación de preguntas de seguridad en la base de datos
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(255), nullable=False)  # Columna para la pregunta de seguridad
    answer = db.Column(db.String(255), nullable=False)  # Columna para la respuesta de seguridad
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)


    user = db.relationship("User", back_populates="security_questions")

    def __repr__(self):  # Método para representar un objeto de pregunta de seguridad como una cadena
        return '<SecurityQuestion %r>' % self.id
    
    def serialize(self):  # Método para serializar un objeto de pregunta de seguridad a un diccionario JSON
        return {  # Devolver un diccionario con los atributos de la pregunta de seguridad
            "id": self.id,
            "question": self.question,
            "answer": self.answer
        }


#-----------------------------------------------------------------TABLAS PARA ROLES Y PERMISOS--------------------------------------------


 #Tabla de Módulos
class Role(db.Model):  # Define una clase que representa la tabla de módulos en la base de datos
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)  # Columna para el nombre del módulo
    description = db.Column(db.String(255), nullable=False)  # Columna para la descripción del módulo

    def __repr__(self):  # Método para representar un objeto de módulo como una cadena
        return '<Role %r>' % self.id
    
    def serialize(self):  # Método para serializar un objeto de módulo a un diccionario JSON
        return {  # Devolver un diccionario con los atributos del módulo
            "id": self.id,
            "description": self.description,
            "Type_role": self.name,
            "permissions": [perm.permission.serialize() for perm in self.role_permissions]
}
    
class RolePermission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=False)
    permission_id = db.Column(db.Integer, db.ForeignKey('permission.id'), nullable=False)
    
    role = db.relationship("Role", backref=db.backref("role_permissions", lazy='dynamic'))
    permission = db.relationship("Permission", backref=db.backref("role_permissions", lazy='dynamic'))

    def __repr__(self):
        return '<RolePermission %r>' % self.id
    

class Permission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(255), nullable=True)

    def __repr__(self):
        return '<Permission %r>' % self.name

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name}



#-----------------------------------------------------------------TABLAS PARA MEMBRECIAS Y CLASES--------------------------------------------
# Tabla de Membresías
class Membership(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False)
    duration_days = db.Column(db.Integer, nullable=True)  # Duración en días
    classes_per_month = db.Column(db.Integer, nullable=True)  # Cantidad de clases por mes

    membership_history = db.relationship('UserMembershipHistory', backref='membership', lazy='dynamic')
    payments = db.relationship('Payment', backref='membership', lazy=True)

    def __repr__(self):  # Método para representar un objeto de pregunta de seguridad como una cadena
        return '<Membership %r>' % self.id
    
    def serialize(self):  # Método para serializar un objeto de pregunta de seguridad a un diccionario JSON
        return {  # Devolver un diccionario con los atributos de la pregunta de seguridad
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "duration_days": self.price,
            "classes_per_month": self.classes_per_month,
            "price": self.price
        }

# Tabla historial de Membresías del usuario
class UserMembershipHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    membership_id = db.Column(db.Integer, db.ForeignKey('membership.id'))
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime)
    remaining_classes = db.Column(db.Integer)
    is_active = db.Column(db.Boolean, default=False)

    def __repr__(self):  # Método para representar un objeto de pregunta de seguridad como una cadena
        return '<UserMembershipHistory %r>' % self.id
    
    def serialize(self):  # Método para serializar un objeto de pregunta de seguridad a un diccionario JSON
        return {  # Devolver un diccionario con los atributos de la pregunta de seguridad
            "history_membership_id": self.id,
            "membership_id": self.membership_id,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user_id else "",
            "start_date": self.start_date,
            "end_date": self.end_date,
            "remaining_classes": self.remaining_classes,
            "is_active": self.is_active
        }
    
    
# Tabla de Clases de Entrenamiento
class Training_classes(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    instructor = db.Column(db.String(100), nullable=True)
    dateTime_class = db.Column(db.DateTime)
    Class_is_active = db.Column(db.Boolean(), default=True)  # Columna para el estado de activación de la clase
    start_time = db.Column(db.Time, nullable=False)  # Hora de inicio de la clase
    duration_minutes = db.Column(db.Integer, nullable=False)  # Duración en minutos
    available_slots = db.Column(db.Integer, nullable=False)  # Cupos disponibles en la clase
    instructor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Foreign key para el instructor
    
    instructor = db.relationship("User")  # Relación con la tabla de usuarios
    bookings = db.relationship('Booking', back_populates='training_class', lazy=True)

    def __repr__(self):  # Método para representar un objeto de pregunta de seguridad como una cadena
        return '<Training_classes %r>' % self.id
    
    def serialize(self):  # Método para serializar un objeto de pregunta de seguridad a un diccionario JSON
        return {  # Devolver un diccionario con los atributos de la pregunta de seguridad
            "id": self.id,
            "name": self.name,
            "Class_is_active": self.Class_is_active,
            "dateTime_class": self.dateTime_class.isoformat(), #strftime('%Y-%m-%d %H:%M:%S') if self.dateTime_class else None,
            "start_time": self.start_time.isoformat(),      #strftime('%H:%M') if self.start_time else None,
            # "dateTime_class": self.dateTime_class,
            # "start_time": self.start_time.strftime('%H:%M'),  # Formato de hora como HH:MM
            "duration_minutes": self.duration_minutes,
            "instructor":self.instructor.name if self.instructor else "",
            "available_slots": self.available_slots,
            "description": self.description,
            "bookings": [booking.user.serialize() for booking in self.bookings if booking.user]

        }

#--------------- tabla de reservaciones------------------------
# Tabla de reservas de clases
class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    training_class_id = db.Column(db.Integer, db.ForeignKey('training_classes.id'), nullable=False)
    booking_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    status = db.Column(db.String(50), nullable=True,  default='avaible')  # Por ejemplo: 'reserved', 'completed', 'cancelled'

    training_class_id = db.Column(db.Integer, db.ForeignKey('training_classes.id'), nullable=False)
    training_class = db.relationship("Training_classes", back_populates="bookings")

    def __repr__(self):
        return '<Booking %r>' % self.id
    
    def serialize(self):
        return {
            "booking_id": self.id,
            "booking_date": self.booking_date.isoformat(),
            "booking_status": self.status,
            "booking_user_name": self.user.name,
            "booking_user_profile_image": self.user.profile_image.img_url if self.user.profile_image else None,
            "class_id": self.training_class.id if self.training_class else None,
            "class_name": self.training_class.name if self.training_class else "No Class",
            "dateTime_class": self.training_class.dateTime_class.isoformat() if self.training_class else None,
            "class_start_time": self.training_class.start_time.strftime('%H:%M') if self.training_class else None,
            "class_instructor": self.training_class.instructor.name if self.training_class and self.training_class.instructor else "No Instructor"
        }


    
# Tabla de Transacciones
class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    membership_id = db.Column(db.Integer, db.ForeignKey('membership.id'), nullable=False)
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)
    confirmation_date = db.Column(db.DateTime, default=datetime.utcnow)  # Fecha de confirmación del pago
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    transaction_reference = db.Column(db.String(255))  # Referencia externa
    currency = db.Column(db.String(3), default='USD')  # Moneda
    description = db.Column(db.String(255))  # Descripción del pago
    card_number_last4 = db.Column(db.String(4))  # Últimos cuatro dígitos del número de tarjeta
    card_type = db.Column(db.String(255))  # almacenar marca de la tarjeta
    cardholder_name = db.Column(db.String(255))  # Nombre del titular de la tarjeta

    payment_details = db.relationship('PaymentDetail', backref='payment', lazy=True)


    def __repr__(self):  # Método para representar un objeto de pregunta de seguridad como una cadena
        return '<Payment %r>' % self.id
    
    def serialize(self):  # Método para serializar un objeto de pregunta de seguridad a un diccionario JSON
        return {  # Devolver un diccionario con los atributos de la pregunta de seguridad
            "payment_id": self.id,
            "user_id": self.user.id,
            "user_name": self.user.name,
            "user_email": self.user.email,
            "payment_date": self.payment_date.isoformat(),
            "amount": self.amount,
            "currency": self.currency,
            "payment_method": self.payment_method,
            "transaction_reference": self.transaction_reference,
            "description": self.description,
            "card_number": self.card_number_last4,
            "card_type": self.card_type,
            "cardholder_name": self.cardholder_name,
            "status": self.status


        }


# Tabla de Detalles de la Transacción #aun no defino que deberia ir aca
class PaymentDetail(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    payment_id = db.Column(db.Integer, db.ForeignKey('payment.id'), nullable=False)
    product_id = db.Column(db.Integer, nullable=False)  # ID del producto o servicio
    product_description = db.Column(db.String(255))
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    subtotal = db.Column(db.Float, nullable=False)
    tax_amount = db.Column(db.Float, nullable=False, default=0.0)
    discount_amount = db.Column(db.Float, nullable=False, default=0.0)

    def __repr__(self):  # Método para representar un objeto de pregunta de seguridad como una cadena
        return '<PaymentDetail %r>' % self.id


# Tabla para cargar imagenes de movimientos disponibles en la app
class MovementImages(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text, nullable=True)
    img_data = db.Column(LargeBinary, nullable=False)

    def __repr__(self):  # Método para representar un objeto de pregunta de seguridad como una cadena
        return '<MovementImages %r>' % self.id
    
    def serialize(self):  # Método para serializar un objeto de pregunta de seguridad a un diccionario JSON
        return {  # Devolver un diccionario con los atributos de la pregunta de seguridad
            "img_id": self.id,
            "name": self.name,
            "description": self.description
        }

# Tabla para cargar la imagen de perfil de usuario
class ProfileImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    img_data = db.Column(LargeBinary, nullable=False)
    
    user = db.relationship('User', back_populates='profile_image', uselist=False)  # Relación uno a uno

    @property
    def img_url(self):
        return f"data:image/jpeg;base64,{base64.b64encode(self.img_data).decode('utf-8')}"

    def __repr__(self):
        return '<ProfileImage %r>' % self.id

    def serialize(self):
        return {
            "img_id": self.id,
            "img_url": self.img_url
        }
    


# Tabla para almacenar los registros de PR/RM de los usuarios
class PRRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    movement_id = db.Column(db.Integer, nullable=False)
    value = db.Column(db.Float, nullable=True)
    time = db.Column(db.Float, nullable=True)  # En minutos
    kg = db.Column(db.Float, nullable=True)
    lb = db.Column(db.Float, nullable=True)
    unit = db.Column(db.String(50), nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)


    def __repr__(self):
        return '<PRRecord %r>' % self.id
    
    def serialize(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "movement_id": self.movement_id,
            "value": self.value,
            "time": self.time,
            "kg": self.kg,
            "lb": self.lb,
            "unit": self.unit,
            "date": self.date.isoformat()  # Mantén la fecha completa
        }


class MessagesSend(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    title = db.Column(db.String(255), nullable=True)
    body = db.Column(db.Text, nullable=False)
    send_time = db.Column(db.DateTime, default=datetime.utcnow)

    sender = db.relationship("User", foreign_keys=[sender_id], backref=db.backref("sent_messages", lazy='dynamic'))


    def __repr__(self):
        return '<MessagesSend %r>' % self.id

    def serialize(self):
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "title": self.title,
            "body": self.body,
            "send_time": self.send_time.isoformat(),
        }


class MessageRecipient(db.Model):
    message_id = db.Column(db.Integer, db.ForeignKey('messages_send.id'), primary_key=True)
    recipient_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    read = db.Column(db.Boolean, default=False)

    message = db.relationship("MessagesSend", backref=db.backref("message_recipients", lazy='dynamic'))
    recipient = db.relationship("User", foreign_keys=[recipient_id], backref=db.backref("recipient_entries", lazy='dynamic'))

    def __repr__(self):
        return '<MessageRecipient %r>' % (self.message_id, self.recipient_id)



#-----------------------------------------------------------------TABLAS PARA EL E-COMMERS--------------------------------------------

class SubCategory(db.Model):
    __tablename__ = 'subcategory'  # Asegura que el nombre de la tabla sea 'subcategory'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    
    category = db.relationship('Category', backref='subcategories')

    def __repr__(self):
        return '<SubCategory %r>' % self.id

    def serialize(self):
        return {
            "subcategory_id": self.id,
            "subcategory_name": self.name,
            "subcategory_description": self.description,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else "N/A",
        }

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))
    is_active = db.Column(db.Boolean, default=True)

    category = db.relationship('Category', backref='products')
    images = db.relationship('ProductImage', backref='product', lazy='dynamic')

    def __repr__(self):
        return '<Product %r>' % self.id

    def serialize(self):
        return {
            "product_id": self.id,
            "product_name": self.name,
            "product_description": self.description,
            "product_price": self.price,
            "product_stock": self.stock,
            "product_category": self.category.name if self.category else "N/A",
        }


class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return '<Category %r>' % self.id

    def serialize(self):
        return {
            "category_id": self.id,
            "category_name": self.name,
            "category_description": self.description
        }
    


class ProductImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    image_data = db.Column(LargeBinary, nullable=False)
    
    def image_url(self):
        return f"data:image/jpeg;base64,{base64.b64encode(self.image_data).decode('utf-8')}"

    def __repr__(self):
        return '<ProductImage %r>' % self.id

    def serialize(self):
        return {
            "image_id": self.id,
            "product_id": self.product_id,
            "image_url": self.image_url(),
        }


class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)

    user = db.relationship('User', backref='cart_items')
    product = db.relationship('Product', backref='cart_items')

    def __repr__(self):
        return '<CartItem %r>' % self.id

    def serialize(self):
        return {
            "cart_item_id": self.id,
            "user_id": self.user_id,
            "product_id": self.product_id,
            "quantity": self.quantity,
            "product": self.product.serialize()
        }


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    session_id = db.Column(db.String(255), nullable=True)  # Para invitados
    order_date = db.Column(db.DateTime, default=datetime.utcnow)
    total = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='Pending')
    shipping_type = db.Column(db.String(50), nullable=False)  # Ej: 'Standard', 'Express', 'In-store pickup'
    shipping_address = db.Column(db.String(255), nullable=True)  # Nullable si es retiro en tienda
    estimated_delivery_date = db.Column(db.DateTime, nullable=True)  # Fecha estimada de entrega, si aplica

    user = db.relationship('User', backref='orders')

    def __repr__(self):
        return '<Order %r>' % self.id

    def serialize(self):
        return {
            "order_id": self.id,
            "user_id": self.user_id,
            "session_id": self.session_id,
            "order_date": self.order_date.isoformat(),
            "total": self.total,
            "status": self.status,
            "shipping_type": self.shipping_type,
            "shipping_address": self.shipping_address,
            "estimated_delivery_date": self.estimated_delivery_date.isoformat() if self.estimated_delivery_date else None,
            "user": self.user.serialize() if self.user else None,
            "order_details": [detail.serialize() for detail in self.order_details]
        }


class OrderDetail(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)

    order = db.relationship('Order', backref='order_details')
    product = db.relationship('Product', backref='order_details')

    def __repr__(self):
        return '<OrderDetail %r>' % self.id

    def serialize(self):
        return {
            "order_detail_id": self.id,
            "order_id": self.order_id,
            "product_id": self.product_id,
            "quantity": self.quantity,
            "price": self.price,
            "product": self.product.serialize()
        }


class EcommercePayment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Null si es un invitado
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)  # Relacionado con una orden específica
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)  # Ej: 'Credit Card', 'PayPal'
    status = db.Column(db.String(50), nullable=False)  # Ej: 'Completed', 'Pending', 'Failed'
    transaction_reference = db.Column(db.String(255), nullable=True)  # Referencia de la transacción en el sistema de pagos
    shipping_type = db.Column(db.String(50), nullable=False)  # Ej: 'Standard', 'Express', 'In-store pickup'
    shipping_address = db.Column(db.String(255), nullable=True)  # Nullable si es retiro en tienda
    estimated_delivery_date = db.Column(db.DateTime, nullable=True)  # Fecha estimada de entrega, si aplica

    user = db.relationship('User', backref='ecommerce_payments')
    order = db.relationship('Order', backref='ecommerce_payments')

    def __repr__(self):
        return '<EcommercePayment %r>' % self.id

    def serialize(self):
        return {
            "payment_id": self.id,
            "user_id": self.user_id,
            "order_id": self.order_id,
            "payment_date": self.payment_date.isoformat(),
            "amount": self.amount,
            "payment_method": self.payment_method,
            "status": self.status,
            "transaction_reference": self.transaction_reference,
            "shipping_type": self.shipping_type,
            "shipping_address": self.shipping_address,
            "estimated_delivery_date": self.estimated_delivery_date.isoformat() if self.estimated_delivery_date else None,
            "user": self.user.serialize() if self.user else None,
            "order": self.order.serialize()
        }


class EcommercePaymentDetail(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    payment_id = db.Column(db.Integer, db.ForeignKey('ecommerce_payment.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)  # Precio por unidad al momento de la compra
    subtotal = db.Column(db.Float, nullable=False)  # Calculado como price * quantity

    payment = db.relationship('EcommercePayment', backref='details')
    product = db.relationship('Product', backref='payment_details')

    def __repr__(self):
        return '<EcommercePaymentDetail %r>' % self.id

    def serialize(self):
        return {
            "payment_detail_id": self.id,
            "payment_id": self.payment_id,
            "product_id": self.product_id,
            "quantity": self.quantity,
            "price": self.price,
            "subtotal": self.subtotal,
            "product": self.product.serialize()
        }


class Promotion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    discount_percentage = db.Column(db.Float, nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    def __repr__(self):
        return '<Promotion %r>' % self.id

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'discount_percentage': self.discount_percentage,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'is_active': self.is_active
        }


class ProductPromotion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    promotion_id = db.Column(db.Integer, db.ForeignKey('promotion.id'), nullable=False)

    product = db.relationship('Product', backref='product_promotions')
    promotion = db.relationship('Promotion', backref='product_promotions')

    def __repr__(self):
        return '<ProductPromotion %r>' % self.id

    def serialize(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'promotion_id': self.promotion_id,
            'product': self.product.serialize(),
            'promotion': self.promotion.serialize()
        }
