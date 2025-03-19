from app import app, db, Employee
from werkzeug.security import generate_password_hash
from datetime import datetime
from sqlalchemy import text

def seed_database():
    """Seed the database with initial data"""
    with app.app_context():
        # Use raw SQL to drop all tables with CASCADE
        db.session.execute(text("DROP SCHEMA public CASCADE"))
        db.session.execute(text("CREATE SCHEMA public"))
        db.session.commit()
        
        # Create all tables
        db.create_all()
        
        # Create admin user
        admin = Employee(
            name="Admin User",
            employee_id="admin123",
            role="Manager",
            password_hash=generate_password_hash("admin123"),
            is_admin=True,
            rating=5.0,
            created_at=datetime.utcnow()
        )
        
        # Create a regular employee
        employee = Employee(
            name="John Doe",
            employee_id="emp123",
            role="Developer",
            password_hash=generate_password_hash("emp123"),
            is_admin=False,
            rating=4.5,
            created_at=datetime.utcnow()
        )
        
        # Add users to database
        db.session.add(admin)
        db.session.add(employee)
        db.session.commit()
        
        print("Database seeded successfully!")
        print("Admin login: admin123 / admin123")
        print("Employee login: emp123 / emp123")

if __name__ == "__main__":
    seed_database() 