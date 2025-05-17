# DON'T CHANGE THIS !!!
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS # Import CORS

# Import db instance and all models to ensure they are registered with SQLAlchemy
from src.models import db
from src.models.user_model import User
from src.models.class_model import Class
from src.models.enrollment_model import Enrollment
from src.models.attendance_model import Attendance
from src.models.memorization_progress_model import MemorizationProgress
from src.models.lesson_model import Lesson
from src.models.quiz_model import Quiz
from src.models.question_model import Question
from src.models.quiz_attempt_model import QuizAttempt
from src.models.student_answer_model import StudentAnswer
from src.models.payment_model import Payment

# Import all blueprints
from src.routes.user_routes import user_bp
from src.routes.attendance_routes import attendance_bp
from src.routes.memorization_routes import memorization_bp
from src.routes.lesson_routes import lesson_bp
from src.routes.quiz_routes import quiz_bp
from src.routes.payment_routes import payment_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Enable CORS for all routes and origins (for development)
CORS(app) 

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'a_very_secure_default_secret_key_for_dev_only')

# Database Configuration (PostgreSQL)
# Ensure you have psycopg2-binary installed: pip install psycopg2-binary
# Default to Railway PostgreSQL environment variables if available, else local defaults
DB_USER = os.getenv('PGUSER', 'postgres')
DB_PASSWORD = os.getenv('PGPASSWORD', 'password')
DB_HOST = os.getenv('PGHOST', 'localhost')
DB_PORT = os.getenv('PGPORT', '5432')
DB_NAME = os.getenv('PGDATABASE', 'islamic_studies_mvp')

app.config['SQLALCHEMY_DATABASE_URI'] = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize DB
db.init_app(app)

# Create database tables if they don't exist
with app.app_context():
    db.create_all()

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api/users')
app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
app.register_blueprint(memorization_bp, url_prefix='/api/memorization')
app.register_blueprint(lesson_bp, url_prefix='/api/lessons')
app.register_blueprint(quiz_bp, url_prefix='/api/quizzes')
app.register_blueprint(payment_bp, url_prefix='/api/payments')

# Basic route for serving static files (e.g. index.html for a React app if served together)
# This part might be handled by Vercel for the frontend, but good for local dev or combined deployment.
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            # If no index.html, perhaps a simple API welcome message
            return jsonify({"message": "Welcome to the Islamic Studies Platform API"}), 200

if __name__ == '__main__':
    # Make sure to install psycopg2-binary: pip install psycopg2-binary flask-cors
    app.run(host='0.0.0.0', port=os.getenv('PORT', 5000), debug=True)

