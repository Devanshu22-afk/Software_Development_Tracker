from app import app, db, Employee
from werkzeug.security import generate_password_hash

# Create admin user with these credentials
admin_data = {
    'name': 'Admin User',
    'employee_id': 'admin123',
    'role': 'admin',
    'password': 'admin123',
    'is_admin': True
}

with app.app_context():
    # Check if admin already exists
    existing_admin = Employee.query.filter_by(employee_id=admin_data['employee_id']).first()
    
    if existing_admin:
        print(f"Admin user {admin_data['employee_id']} already exists")
    else:
        # Create new admin user
        admin = Employee(
            name=admin_data['name'],
            employee_id=admin_data['employee_id'],
            role=admin_data['role'],
            password_hash=generate_password_hash(admin_data['password']),
            is_admin=admin_data['is_admin']
        )
        
        db.session.add(admin)
        db.session.commit()
        print(f"Admin user {admin_data['employee_id']} created successfully")
        print(f"Use these credentials to login:")
        print(f"Employee ID: {admin_data['employee_id']}")
        print(f"Password: {admin_data['password']}") 