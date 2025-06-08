# Software Development Tracker

A real-time web application for tracking software development projects, managing employees, and handling project assignments with a rating system.

## Features

- **Authentication System**
  - Separate login for Admin and Employees
  - Employee registration with role selection
  - Secure password handling

- **Admin Dashboard**
  - Create and manage projects
  - Assign projects to employees
  - Monitor project status
  - View employee ratings
  - Real-time project updates

- **Employee Dashboard**
  - View assigned projects
  - Update project status
  - Real-time project notifications
  - Accept/reject project assignments
  - View personal rating

- **Real-time Notifications**
  - WebSocket integration for instant updates
  - Project assignment notifications
  - Status change alerts

## Tech Stack

- **Frontend:**
  - React.js
  - Material-UI
  - Socket.IO Client
  - Axios

- **Backend:**
  - Python Flask
  - Flask-SQLAlchemy
  - Flask-SocketIO
  - Flask-Login
  - PostgreSQL

## Prerequisites

- Python 3.8+
- Node.js 14+
- PostgreSQL
- npm or yarn

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd software-dev-tracker
   ```

2. **Backend Setup**
   ```bash
   # Create and activate virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate

   # Install dependencies
   cd backend
   pip install -r requirements.txt

   # Set up environment variables
   cp .env.example .env
   # Edit .env with your database credentials and secret key

   # Initialize database
   flask db init
   flask db migrate
   flask db upgrade
   ```

3. **Frontend Setup**
   ```bash
   # Install dependencies
   cd frontend
   npm install

   # Set up environment variables
   cp .env.example .env
   # Edit .env with your backend API URL
   ```

4. **Start the Application**
   ```bash
   # Start backend server (from backend directory)
   flask run

   # Start frontend development server (from frontend directory)
   npm start
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Database Schema

### Employee
- id (Primary Key)
- name
- employee_id (Unique)
- role (developer/tester)
- password_hash
- is_admin
- rating
- created_at

### Project
- id (Primary Key)
- title
- description
- status
- priority
- created_at
- deadline
- employee_id (Foreign Key)
- created_by (Foreign Key)

### Rating
- id (Primary Key)
- employee_id (Foreign Key)
- project_id (Foreign Key)
- rating
- comment
- created_at
- created_by (Foreign Key)

## API Endpoints

### Authentication
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/logout

### Projects
- GET /api/projects
- POST /api/projects
- PUT /api/projects/:id
- GET /api/projects/:id

### Employees
- GET /api/employees
- GET /api/employees/:id
- PUT /api/employees/:id

### Ratings
- POST /api/ratings
- GET /api/ratings/employee/:id

## WebSocket Events

### Client to Server
- project_response
- status_update

### Server to Client
- new_project
- project_updated
- project_accepted
- project_rejected

### Screenshots:-
![image](https://github.com/user-attachments/assets/a5c2b0f9-8291-4a61-8bb8-d7afdd00508c)


## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
