"""
Database initialization and management
"""

import sqlite3
import os
from datetime import datetime

# Get the directory where this file is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'users.db')


def get_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database with tables"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            user_type TEXT NOT NULL,
            email TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            department TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1
        )
    ''')
    
    # Create default admin account if it doesn't exist
    cursor.execute('SELECT * FROM users WHERE username = ? AND user_type = ?', ('admin', 'admin'))
    if not cursor.fetchone():
        cursor.execute('''
            INSERT INTO users (username, password, user_type, email, first_name, last_name)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ('admin', 'admin123', 'admin', 'admin@school.edu', 'Admin', 'User'))
    
    conn.commit()
    conn.close()


def get_user(username, user_type=None):
    """Get user by username and optionally by type"""
    conn = get_connection()
    cursor = conn.cursor()
    
    if user_type:
        cursor.execute('SELECT * FROM users WHERE username = ? AND user_type = ?', (username, user_type))
    else:
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
    
    user = cursor.fetchone()
    conn.close()
    
    return dict(user) if user else None


def create_user(username, password, user_type, email, first_name, last_name, department=None):
    """Create a new user"""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO users (username, password, user_type, email, first_name, last_name, department)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (username, password, user_type, email, first_name, last_name, department))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        raise Exception('Username already exists')
    finally:
        conn.close()


def get_all_students():
    """Get all student accounts"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE user_type = ? ORDER BY created_at DESC', ('student',))
    students = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return students


def get_all_instructors():
    """Get all instructor accounts"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE user_type = ? ORDER BY created_at DESC', ('instructor',))
    instructors = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return instructors


def delete_user(user_id):
    """Delete a user by ID"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
    conn.commit()
    conn.close()


def update_user(user_id, **kwargs):
    """Update user information"""
    conn = get_connection()
    cursor = conn.cursor()
    
    allowed_fields = ['password', 'email', 'first_name', 'last_name', 'department', 'is_active']
    updates = {k: v for k, v in kwargs.items() if k in allowed_fields}
    
    if not updates:
        conn.close()
        return False
    
    set_clause = ', '.join([f'{k} = ?' for k in updates.keys()])
    values = list(updates.values()) + [user_id]
    
    cursor.execute(f'UPDATE users SET {set_clause} WHERE id = ?', values)
    conn.commit()
    conn.close()
    return True
