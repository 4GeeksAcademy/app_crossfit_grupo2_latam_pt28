"""
1. Asegúrate de estar en el directorio base del proyecto:
Primero, navega al directorio base del proyecto: app_gestion_gym_crossfit_proyecto_final_pt28

2. Ejecución del comando desde el directorio base: Una vez que estés en el directorio base del proyecto, ejecuta:
pipenv run python src/api/print_models.py

"""

import os
import sys
from sqlalchemy import Column, ForeignKey, Integer, String, Float, DateTime, Boolean, LargeBinary, Text
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy import create_engine
from eralchemy2 import render_er
from datetime import datetime

Base = declarative_base()

# Define all your models here
# ...

class User(Base):
    __tablename__ = 'user'
    id = Column(Integer, primary_key=True)
    email = Column(String(120), unique=True, nullable=True)
    password = Column(String(250), nullable=True)
    is_active = Column(Boolean(), default=True)
    is_guest = Column(Boolean(), default=False, nullable=True)
    name = Column(String(80), nullable=True)
    last_name = Column(String(80), nullable=True)
    username = Column(String(80), nullable=True)
    registration_date = Column(DateTime, default=datetime.utcnow)
    last_update_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    image_url = Column(String(255), nullable=True)
    role_id = Column(Integer, ForeignKey('role.id', ondelete='SET NULL'), nullable=True)
    profile_image_id = Column(Integer, ForeignKey('profile_image.id'), nullable=True)
    
    security_questions = relationship('SecurityQuestion', back_populates='user', cascade='all, delete-orphan')
    role = relationship("Role")
    profile_image = relationship('ProfileImage', back_populates='user', uselist=False)
    memberships_history = relationship('UserMembershipHistory', backref='user', lazy='dynamic')
    payments = relationship('Payment', backref='user', lazy=True)
    bookings = relationship('Booking', backref='user', lazy=True)
    pr_records = relationship('PRRecord', backref='user', lazy=True)
    
    def __repr__(self):
        return '<User %r>' % self.id

class SecurityQuestion(Base):
    __tablename__ = 'security_question'
    id = Column(Integer, primary_key=True)
    question = Column(String(255), nullable=False)
    answer = Column(String(255), nullable=False)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    
    user = relationship("User", back_populates="security_questions")

    def __repr__(self):
        return '<SecurityQuestion %r>' % self.id

class Role(Base):
    __tablename__ = 'role'
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    description = Column(String(255), nullable=False)
    
    role_permissions = relationship("RolePermission", back_populates="role")

    def __repr__(self):
        return '<Role %r>' % self.id

class RolePermission(Base):
    __tablename__ = 'role_permission'
    id = Column(Integer, primary_key=True)
    role_id = Column(Integer, ForeignKey('role.id'), nullable=False)
    permission_id = Column(Integer, ForeignKey('permission.id'), nullable=False)
    
    role = relationship("Role", back_populates="role_permissions")
    permission = relationship("Permission", back_populates="role_permissions")

    def __repr__(self):
        return '<RolePermission %r>' % self.id

class Permission(Base):
    __tablename__ = 'permission'
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    description = Column(String(255), nullable=True)
    
    role_permissions = relationship("RolePermission", back_populates="permission")

    def __repr__(self):
        return '<Permission %r>' % self.name

class Membership(Base):
    __tablename__ = 'membership'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    price = Column(Float, nullable=False)
    duration_days = Column(Integer, nullable=True)
    classes_per_month = Column(Integer, nullable=True)
    
    membership_history = relationship('UserMembershipHistory', back_populates='membership')
    payments = relationship('Payment', back_populates='membership')

    def __repr__(self):
        return '<Membership %r>' % self.id

class UserMembershipHistory(Base):
    __tablename__ = 'user_membership_history'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'))
    membership_id = Column(Integer, ForeignKey('membership.id'))
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime)
    remaining_classes = Column(Integer)
    is_active = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="memberships_history")
    membership = relationship("Membership", back_populates="membership_history")

    def __repr__(self):
        return '<UserMembershipHistory %r>' % self.id

class Training_classes(Base):
    __tablename__ = 'training_classes'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    instructor = Column(String(100), nullable=True)
    dateTime_class = Column(DateTime)
    Class_is_active = Column(Boolean, default=True)
    start_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    available_slots = Column(Integer, nullable=False)
    instructor_id = Column(Integer, ForeignKey('user.id'), nullable=True)
    
    bookings = relationship('Booking', back_populates='training_class')

    def __repr__(self):
        return '<Training_classes %r>' % self.id

class Booking(Base):
    __tablename__ = 'booking'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    training_class_id = Column(Integer, ForeignKey('training_classes.id'), nullable=False)
    booking_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    status = Column(String(50), nullable=True, default='avaible')
    
    training_class = relationship("Training_classes", back_populates="bookings")

    def __repr__(self):
        return '<Booking %r>' % self.id

class Payment(Base):
    __tablename__ = 'payment'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    membership_id = Column(Integer, ForeignKey('membership.id'), nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow)
    confirmation_date = Column(DateTime, default=datetime.utcnow)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    transaction_reference = Column(String(255))
    currency = Column(String(3), default='USD')
    description = Column(String(255))
    card_number_last4 = Column(String(4))
    card_type = Column(String(255))
    cardholder_name = Column(String(255))
    
    payment_details = relationship('PaymentDetail', back_populates='payment')

    def __repr__(self):
        return '<Payment %r>' % self.id

class PaymentDetail(Base):
    __tablename__ = 'payment_detail'
    id = Column(Integer, primary_key=True)
    payment_id = Column(Integer, ForeignKey('payment.id'), nullable=False)
    product_id = Column(Integer, nullable=False)
    product_description = Column(String(255))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    tax_amount = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, nullable=False, default=0.0)

    def __repr__(self):
        return '<PaymentDetail %r>' % self.id

class MovementImages(Base):
    __tablename__ = 'movement_images'
    id = Column(Integer, primary_key=True)
    name = Column(String(128), nullable=False)
    description = Column(String(255), nullable=True)
    img_data = Column(LargeBinary, nullable=False)

    def __repr__(self):
        return '<MovementImages %r>' % self.id

class ProfileImage(Base):
    __tablename__ = 'profile_image'
    id = Column(Integer, primary_key=True)
    img_data = Column(LargeBinary, nullable=False)
    
    user = relationship('User', back_populates='profile_image', uselist=False)

    def __repr__(self):
        return '<ProfileImage %r>' % self.id

class PRRecord(Base):
    __tablename__ = 'pr_record'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    movement_id = Column(Integer, nullable=False)
    value = Column(Float, nullable=True)
    time = Column(Float, nullable=True)
    kg = Column(Float, nullable=True)
    lb = Column(Float, nullable=True)
    unit = Column(String(50), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return '<PRRecord %r>' % self.id

class MessagesSend(Base):
    __tablename__ = 'messages_send'
    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    title = Column(String(255), nullable=True)
    body = Column(String(255), nullable=False)
    send_time = Column(DateTime, default=datetime.utcnow)
    
    sender = relationship("User", foreign_keys=[sender_id], backref="sent_messages")

    def __repr__(self):
        return '<MessagesSend %r>' % self.id

class MessageRecipient(Base):
    __tablename__ = 'message_recipient'
    message_id = Column(Integer, ForeignKey('messages_send.id'), primary_key=True)
    recipient_id = Column(Integer, ForeignKey('user.id'), primary_key=True)
    read = Column(Boolean, default=False)
    
    message = relationship("MessagesSend", backref="message_recipients")
    recipient = relationship("User", foreign_keys=[recipient_id], backref="recipient_entries")

    def __repr__(self):
        return '<MessageRecipient %r>' % (self.message_id, self.recipient_id)


class SubCategory(Base):
    __tablename__ = 'subcategory'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey('category.id'), nullable=False)
    
    category = relationship('Category', backref='subcategories')

    def __repr__(self):
        return '<SubCategory %r>' % self.id

class Product(Base):
    __tablename__ = 'product'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False)
    subcategory_id = Column(Integer, ForeignKey('subcategory.id'))
    is_active = Column(Boolean, default=True)
    
    subcategory = relationship('SubCategory', backref='products')
    images = relationship('ProductImage', backref='product', lazy='dynamic')

    def __repr__(self):
        return '<Product %r>' % self.id

class Category(Base):
    __tablename__ = 'category'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    def __repr__(self):
        return '<Category %r>' % self.id


class ProductImage(Base):
    __tablename__ = 'product_image'
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey('product.id'), nullable=False)
    image_data = Column(LargeBinary, nullable=False)

    def __repr__(self):
        return '<ProductImage %r>' % self.id

class CartItem(Base):
    __tablename__ = 'cart_item'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('product.id'), nullable=False)
    quantity = Column(Integer, default=1)
    
    user = relationship('User', backref='cart_items')
    product = relationship('Product', backref='cart_items')

    def __repr__(self):
        return '<CartItem %r>' % self.id

class Order(Base):
    __tablename__ = 'order'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=True)
    session_id = Column(String(255), nullable=True)
    order_date = Column(DateTime, default=datetime.utcnow)
    total = Column(Float, nullable=False)
    status = Column(String(50), default='Pending')
    shipping_type = Column(String(50), nullable=False)
    shipping_address = Column(String(255), nullable=True)
    estimated_delivery_date = Column(DateTime, nullable=True)

    user = relationship('User', backref='orders')

    def __repr__(self):
        return '<Order %r>' % self.id

class OrderDetail(Base):
    __tablename__ = 'order_detail'
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('order.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('product.id'), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)

    order = relationship('Order', backref='order_details')
    product = relationship('Product', backref='order_details')

    def __repr__(self):
        return '<OrderDetail %r>' % self.id

class EcommercePayment(Base):
    __tablename__ = 'ecommerce_payment'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=True)
    order_id = Column(Integer, ForeignKey('order.id'), nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    transaction_reference = Column(String(255), nullable=True)
    shipping_type = Column(String(50), nullable=False)
    shipping_address = Column(String(255), nullable=True)
    estimated_delivery_date = Column(DateTime, nullable=True)

    user = relationship('User', backref='ecommerce_payments')
    order = relationship('Order', backref='ecommerce_payments')

    def __repr__(self):
        return '<EcommercePayment %r>' % self.id

class EcommercePaymentDetail(Base):
    __tablename__ = 'ecommerce_payment_detail'
    id = Column(Integer, primary_key=True)
    payment_id = Column(Integer, ForeignKey('ecommerce_payment.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('product.id'), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    
    payment = relationship('EcommercePayment', backref='details')
    product = relationship('Product', backref='payment_details')

    def __repr__(self):
        return '<EcommercePaymentDetail %r>' % self.id

class Promotion(Base):
    __tablename__ = 'promotion'
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    discount_percentage = Column(Float, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)

    def __repr__(self):
        return '<Promotion %r>' % self.id

class ProductPromotion(Base):
    __tablename__ = 'product_promotion'
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey('product.id'), nullable=False)
    promotion_id = Column(Integer, ForeignKey('promotion.id'), nullable=False)

    product = relationship('Product', backref='product_promotions')
    promotion = relationship('Promotion', backref='product_promotions')

    def __repr__(self):
        return '<ProductPromotion %r>' % self.id

# Generate the diagram
try:
    result = render_er(Base, 'diagram.png')
    print("Success! Check the diagram.png file")
except Exception as e:
    print("There was a problem generating the diagram")
    raise e
