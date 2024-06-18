  
import os
from flask_admin import Admin
from .models import db, User, SecurityQuestion, Role, Permission, RolePermission, Membership, Training_classes, Booking, Payment, PaymentDetail, UserMembershipHistory, MovementImages, ProfileImage, PRRecord, MessagesSend, MessageRecipient,Product, Category, ProductImage, CartItem, Order, OrderDetail, EcommercePayment, EcommercePaymentDetail, Promotion, ProductPromotion, SubCategory
from flask_admin.contrib.sqla import ModelView

def setup_admin(app):
    app.secret_key = os.environ.get('FLASK_APP_KEY', 'sample key')
    app.config['FLASK_ADMIN_SWATCH'] = 'cerulean'
    admin = Admin(app, name='4Geeks Admin', template_mode='bootstrap3')

    
    # Add your models here, for example this is how we add a the User model to the admin
    admin.add_view(ModelView(User, db.session))
    admin.add_view(ModelView(SecurityQuestion, db.session))
    admin.add_view(ModelView(Role, db.session))
    admin.add_view(ModelView(Permission, db.session))
    admin.add_view(ModelView(RolePermission, db.session))
    admin.add_view(ModelView(Membership, db.session))
    admin.add_view(ModelView(Training_classes, db.session))
    admin.add_view(ModelView(Booking, db.session))
    admin.add_view(ModelView(Payment, db.session))
    admin.add_view(ModelView(PaymentDetail, db.session))
    admin.add_view(ModelView(UserMembershipHistory, db.session))
    admin.add_view(ModelView(MovementImages, db.session))
    admin.add_view(ModelView(ProfileImage, db.session))
    admin.add_view(ModelView(PRRecord, db.session))
    admin.add_view(ModelView(MessagesSend, db.session))
    admin.add_view(ModelView(MessageRecipient, db.session))
    admin.add_view(ModelView(Product, db.session))
    admin.add_view(ModelView(Category, db.session))
    admin.add_view(ModelView(ProductImage, db.session))
    admin.add_view(ModelView(CartItem, db.session))
    admin.add_view(ModelView(Order, db.session))
    admin.add_view(ModelView(OrderDetail, db.session))
    admin.add_view(ModelView(EcommercePayment, db.session))
    admin.add_view(ModelView(EcommercePaymentDetail, db.session))
    admin.add_view(ModelView(Promotion, db.session))
    admin.add_view(ModelView(ProductPromotion, db.session))
    admin.add_view(ModelView(SubCategory, db.session))








    # You can duplicate that line to add mew models
    # admin.add_view(ModelView(YourModelName, db.session))