#!/usr/bin/env python3
"""
Frontend Web Application for Admin Dashboard
Runs on localhost:8000
"""

from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from functools import wraps
import os
from datetime import timedelta
from database import init_db, get_user, create_user, get_all_students, get_all_instructors, delete_user

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-in-production'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)

# Initialize database
init_db()

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function


@app.before_request
def before_request():
    session.permanent = True
    app.permanent_session_lifetime = timedelta(hours=24)


@app.route('/login', methods=['GET', 'POST'])
def login():
    """Admin login page"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = get_user(username, 'admin')
        
        if user and user['password'] == password:
            session['admin_id'] = user['id']
            session['admin_username'] = user['username']
            return redirect(url_for('dashboard'))
        else:
            return render_template('login.html', error='Invalid username or password')
    
    return render_template('login.html')


@app.route('/logout')
def logout():
    """Logout admin"""
    session.clear()
    return redirect(url_for('login'))


@app.route('/')
@login_required
def dashboard():
    """Admin dashboard"""
    students = get_all_students()
    instructors = get_all_instructors()
    admin_username = session.get('admin_username', 'Admin')
    
    return render_template('dashboard.html', 
                         admin_username=admin_username,
                         students=students,
                         instructors=instructors,
                         student_count=len(students),
                         instructor_count=len(instructors))


@app.route('/create-student', methods=['GET', 'POST'])
@login_required
def create_student():
    """Create new student account"""
    if request.method == 'POST':
        try:
            username = request.form.get('username')
            password = request.form.get('password')
            email = request.form.get('email')
            first_name = request.form.get('first_name')
            last_name = request.form.get('last_name')
            
            # Validate input
            if not all([username, password, email, first_name, last_name]):
                return render_template('create_student.html', error='All fields are required')
            
            if len(password) < 6:
                return render_template('create_student.html', error='Password must be at least 6 characters')
            
            # Check if username exists
            if get_user(username, 'student'):
                return render_template('create_student.html', error='Username already exists')
            
            # Create user
            create_user(username, password, 'student', email, first_name, last_name)
            return render_template('create_student.html', 
                                 success=f'Student {first_name} {last_name} created successfully!')
        except Exception as e:
            return render_template('create_student.html', error=str(e))
    
    return render_template('create_student.html')


@app.route('/create-instructor', methods=['GET', 'POST'])
@login_required
def create_instructor():
    """Create new instructor account"""
    if request.method == 'POST':
        try:
            username = request.form.get('username')
            password = request.form.get('password')
            email = request.form.get('email')
            first_name = request.form.get('first_name')
            last_name = request.form.get('last_name')
            department = request.form.get('department')
            
            # Validate input
            if not all([username, password, email, first_name, last_name, department]):
                return render_template('create_instructor.html', error='All fields are required')
            
            if len(password) < 6:
                return render_template('create_instructor.html', error='Password must be at least 6 characters')
            
            # Check if username exists
            if get_user(username, 'instructor'):
                return render_template('create_instructor.html', error='Username already exists')
            
            # Create user
            create_user(username, password, 'instructor', email, first_name, last_name, department)
            return render_template('create_instructor.html', 
                                 success=f'Instructor {first_name} {last_name} created successfully!')
        except Exception as e:
            return render_template('create_instructor.html', error=str(e))
    
    return render_template('create_instructor.html')


@app.route('/api/delete-user', methods=['POST'])
@login_required
def api_delete_user():
    """API endpoint to delete a user"""
    try:
        data = request.json
        user_id = data.get('user_id')
        user_type = data.get('user_type')
        
        if not user_id or not user_type:
            return jsonify({'status': 'error', 'message': 'Invalid parameters'}), 400
        
        delete_user(user_id)
        return jsonify({'status': 'success', 'message': f'{user_type.capitalize()} deleted successfully'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8000, debug=True)
