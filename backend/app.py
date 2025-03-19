from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_socketio import SocketIO
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from datetime import datetime
import os

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://localhost/dev_tracker')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Handle Vercel's DATABASE_URL format
if os.getenv('DATABASE_URL'):
    if os.getenv('DATABASE_URL').startswith("postgres://"):
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL').replace("postgres://", "postgresql://", 1)

# Initialize CORS with WebSocket support
CORS(app, resources={
    r"/*": {"origins": "*"},
    r"/socket.io/*": {"origins": "*"}
})

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Define models directly in this file to avoid circular imports
class Employee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    employee_id = db.Column(db.String(50), unique=True, nullable=False)
    role = db.Column(db.String(20), nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    rating = db.Column(db.Float, default=5.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    projects = db.relationship('Project', backref='assigned_to', lazy=True, foreign_keys='Project.employee_id')
    notifications = db.relationship('Notification', backref='employee', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'employee_id': self.employee_id,
            'role': self.role,
            'is_admin': self.is_admin,
            'rating': self.rating
        }

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='pending')
    priority = db.Column(db.Integer, default=1)
    deadline = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Foreign keys
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    
    # Relationships
    employee = db.relationship('Employee', foreign_keys=[employee_id], backref='assigned_projects')
    creator = db.relationship('Employee', foreign_keys=[created_by], backref='created_projects')
    notifications = db.relationship('Notification', backref='project', cascade='all, delete-orphan')
    
    # Many-to-many relationship for employees who accepted the project
    accepted_by = db.relationship('Employee', 
                                secondary='project_acceptances',
                                backref=db.backref('accepted_projects', lazy='dynamic'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'created_at': self.created_at.isoformat(),
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'employee_id': self.employee_id
        }

# Association table for Project-Employee acceptances
project_acceptances = db.Table('project_acceptances',
    db.Column('project_id', db.Integer, db.ForeignKey('project.id'), primary_key=True),
    db.Column('employee_id', db.Integer, db.ForeignKey('employee.id'), primary_key=True)
)

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, accept, reject, closed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        project = Project.query.get(self.project_id)
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'project_id': self.project_id,
            'project_title': project.title if project else 'Unknown',
            'project_description': project.description if project else '',
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }

# Define routes directly in this file
@app.route('/')
def index():
    return jsonify({"message": "API is running"}), 200

@app.route('/test')
def test():
    return jsonify({"message": "Test endpoint works"}), 200

# Authentication routes
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    
    if Employee.query.filter_by(employee_id=data['employee_id']).first():
        return jsonify({'error': 'Employee ID already exists'}), 400
        
    employee = Employee(
        name=data['name'],
        employee_id=data['employee_id'],
        role=data['role'],
        password_hash=generate_password_hash(data['password'])
    )
    
    db.session.add(employee)
    db.session.commit()
    
    return jsonify({'message': 'Employee created successfully'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    employee = Employee.query.filter_by(employee_id=data['employee_id']).first()
    
    if employee and check_password_hash(employee.password_hash, data['password']):
        return jsonify(employee.to_dict())
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    # Simple stub for auth check - in a real app this would use sessions/JWT
    return jsonify({'error': 'Not authenticated'}), 401

# Project routes
@app.route('/api/projects', methods=['GET'])
def get_projects():
    employee_id_param = request.args.get('employee_id')
    
    if employee_id_param:
        # First try to treat it as a numeric ID directly
        try:
            employee_id = int(employee_id_param)
            projects = Project.query.filter_by(employee_id=employee_id).all()
        except ValueError:
            # If not a numeric ID, treat as employee_id string
            employee = Employee.query.filter_by(employee_id=employee_id_param).first()
            if employee:
                projects = Project.query.filter_by(employee_id=employee.id).all()
            else:
                projects = []
    else:
        # If no employee_id is provided, return all projects (admin view)
        projects = Project.query.all()
    
    return jsonify([project.to_dict() for project in projects])

@app.route('/api/projects/<int:project_id>/finalize-assignment', methods=['POST'])
def finalize_project_assignment(project_id):
    """
    Finalizes project assignment by selecting the highest-rated employee 
    from those who accepted the project.
    """
    project = Project.query.get_or_404(project_id)
    
    # If project is already assigned, do nothing
    if project.employee_id is not None:
        assigned_employee = Employee.query.get(project.employee_id)
        return jsonify({
            'message': 'Project is already assigned',
            'project': project.to_dict(),
            'employee': assigned_employee.to_dict() if assigned_employee else None
        }), 200
    
    # Get all employees who accepted this project
    employees_accepted = [emp for emp in project.accepted_by]
    
    if not employees_accepted:
        return jsonify({'error': 'No employees have accepted this project yet'}), 400
    
    # Find the highest rated employee
    highest_rated = max(employees_accepted, key=lambda e: e.rating)
    
    # Assign project to the highest rated employee
    project.employee_id = highest_rated.id
    project.status = 'in_progress'
    db.session.commit()
    
    # Close ALL notifications for this project, regardless of their current status
    # This prevents any further acceptances or rejections
    all_notifications = Notification.query.filter_by(
        project_id=project.id
    ).all()
    
    for notification in all_notifications:
        if notification.employee_id != highest_rated.id:
            # Set all other notifications to 'closed'
            notification.status = 'closed'
        else:
            # Set the winning employee's notification to 'assigned'
            notification.status = 'assigned'
    
    db.session.commit()
    
    # Return detailed response
    return jsonify({
        'message': f'Project assigned to {highest_rated.name} (rating: {highest_rated.rating})',
        'project': project.to_dict(),
        'employee': highest_rated.to_dict(),
        'status': 'success'
    }), 200

@app.route('/api/projects', methods=['POST'])
def create_project():
    data = request.json
    
    # Validate required fields
    if not data.get('title'):
        return jsonify({'error': 'Project title is required'}), 400
    
    # Get admin user to set as creator
    admin = Employee.query.filter_by(is_admin=True).first()
    if not admin:
        return jsonify({'error': 'No admin user found to set as project creator'}), 500
    
    # Create new project - always unassigned initially
    new_project = Project(
        title=data.get('title'),
        description=data.get('description', ''),
        priority=int(data.get('priority', 1)),
        status='pending',
        created_by=admin.id,
        deadline=datetime.fromisoformat(data.get('deadline')) if data.get('deadline') else None,
        employee_id=None  # Always unassigned initially
    )
    
    db.session.add(new_project)
    db.session.commit()
    
    # Create notifications for all non-admin employees
    non_admin_employees = Employee.query.filter_by(is_admin=False).all()
    
    notifications_created = []
    for employee in non_admin_employees:
        notification = Notification(
            employee_id=employee.id,
            project_id=new_project.id,
            status='pending'
        )
        db.session.add(notification)
        notifications_created.append({
            'employee_id': employee.id,
            'employee_name': employee.name
        })
    
    db.session.commit()
    
    return jsonify({
        'id': new_project.id,
        'title': new_project.title,
        'description': new_project.description,
        'priority': new_project.priority,
        'status': new_project.status,
        'created_at': new_project.created_at.isoformat(),
        'deadline': new_project.deadline.isoformat() if new_project.deadline else None,
        'employee_id': new_project.employee_id,
        'notifications_sent': len(notifications_created),
        'notified_employees': notifications_created
    }), 201

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    project = Project.query.get_or_404(project_id)
    data = request.get_json()
    
    if 'status' in data:
        project.status = data['status']
    if 'priority' in data:
        project.priority = data['priority']
    if 'employee_id' in data:
        project.employee_id = data['employee_id']
    if 'description' in data:
        project.description = data['description']
    if 'deadline' in data and data['deadline']:
        project.deadline = datetime.fromisoformat(data['deadline'])
    
    db.session.commit()
    
    return jsonify(project.to_dict())

# Employee routes
@app.route('/api/employees', methods=['GET'])
def get_employees():
    employees = Employee.query.all()
    return jsonify([employee.to_dict() for employee in employees])

@app.route('/api/employees/<int:employee_id>/rating', methods=['PUT'])
def update_employee_rating(employee_id):
    employee = Employee.query.get_or_404(employee_id)
    data = request.get_json()
    
    if 'rating' in data:
        # Update the employee's rating
        employee.rating = float(data['rating'])
        db.session.commit()
        return jsonify(employee.to_dict())
    
    return jsonify({'error': 'Rating not provided'}), 400

# Notification routes
@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    employee_id = request.args.get('employee_id')
    
    if not employee_id:
        return jsonify({'error': 'Employee ID is required'}), 400
    
    try:
        # Try to convert to int if it's a string
        employee_id = int(employee_id)
    except ValueError:
        # If not a valid int, return error
        return jsonify({'error': 'Invalid employee ID format'}), 400
        
    # Verify this employee exists
    employee = Employee.query.get(employee_id)
    if not employee:
        return jsonify({'error': f'Employee with ID {employee_id} not found'}), 404
    
    # Get all active notifications for this employee (pending or accept)
    # We include 'accept' status so that employees can see tasks they've already accepted
    notifications = Notification.query.filter(
        Notification.employee_id == employee_id,
        Notification.status.in_(['pending', 'accept'])  # Get both pending and accepted notifications
    ).all()
    
    # Prepare notification data with project details
    notification_data = []
    for notification in notifications:
        project = Project.query.get(notification.project_id)
        if project:
            notification_data.append({
                'id': notification.id,
                'project_id': notification.project_id,
                'project_title': project.title,
                'project_description': project.description,
                'project_priority': project.priority,
                'created_at': notification.created_at.isoformat(),
                'status': notification.status  # Include notification status
            })
    
    return jsonify(notification_data), 200

@app.route('/api/notifications/<int:notification_id>/respond', methods=['PUT'])
def respond_to_notification(notification_id):
    data = request.json
    response = data.get('response')
    
    if not response or response not in ['accept', 'reject']:
        return jsonify({'error': 'Invalid response'}), 400
    
    notification = Notification.query.get_or_404(notification_id)
    
    # Update notification status to match the response (accept/reject)
    notification.status = response
    db.session.commit()  # Commit the notification status change
    
    # Get the project associated with this notification
    project = Project.query.get(notification.project_id)
    employee = Employee.query.get(notification.employee_id)
    
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    if not employee:
        return jsonify({'error': 'Employee not found'}), 404
    
    if response == 'accept':
        # Add this employee to the project's accepted_by list
        if employee not in project.accepted_by:
            project.accepted_by.append(employee)
            db.session.commit()
        
        # IMPORTANT: DO NOT automatically assign the project to this employee
        # DO NOT close other notifications - we want to let other employees also accept the task
        # The admin will need to use the "Finalize Assignment" button to choose the highest-rated employee
    
    # If the employee rejected, just leave their notification as rejected
    # No need to do anything else as the project assignment will be handled by admin
    
    return jsonify({'message': f'Notification {response}ed successfully'}), 200

# Run the app
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5003) 