from app import app, db, Project, Notification, project_acceptances
from sqlalchemy import text

def clear_projects():
    """Clear all projects, notifications, and project-employee relationships from the database"""
    with app.app_context():
        print("Clearing all projects and related data...")
        
        # Delete all records from project_acceptances table
        db.session.execute(text("DELETE FROM project_acceptances"))
        db.session.commit()
        print("Cleared project acceptances")
        
        # Delete all notifications
        Notification.query.delete()
        db.session.commit()
        print("Cleared notifications")
        
        # Delete all projects
        Project.query.delete()
        db.session.commit()
        print("Cleared projects")
        
        print("All projects and related data have been cleared successfully!")

if __name__ == "__main__":
    clear_projects() 