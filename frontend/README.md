# Education Portal Frontend

A Flask-based admin dashboard for managing student and instructor accounts.

## Features

- **Admin Login**: Secure authentication for administrators
- **Student Management**: Create and manage student accounts
- **Instructor Management**: Create and manage instructor accounts with department assignment
- **Dashboard**: View statistics and manage all users
- **Responsive Design**: Works on desktop and mobile devices

## Installation

1. Make sure you have Python 3.7+ installed

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Run the Flask application:
```bash
python app.py
```

3. Open your browser and go to:
```
http://localhost:8000
```

## Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: Change these credentials in production!

## Usage

### Login
1. Enter admin username and password
2. Click "Sign In"

### Dashboard
After login, you'll see:
- Quick statistics (Student count, Instructor count, Admin count)
- All created student accounts with email, name, and join date
- All created instructor accounts with department and join date
- Delete functionality for removing accounts

### Create Student Account
1. Click "Create Student Account" button
2. Fill in the form:
   - First Name
   - Last Name
   - Username (must be unique)
   - Email
   - Password (minimum 6 characters)
3. Click "Create Student Account"

### Create Instructor Account
1. Click "Create Instructor Account" button
2. Fill in the form:
   - First Name
   - Last Name
   - Username (must be unique)
   - Email
   - Department
   - Password (minimum 6 characters)
3. Click "Create Instructor Account"

## Database

The application uses SQLite for data storage. The database file (`users.db`) is automatically created in the `frontend` directory on first run.

### Database Tables

**users** table contains:
- id: Unique identifier
- username: Unique username
- password: User password (plaintext - should be hashed in production)
- user_type: 'admin', 'student', or 'instructor'
- email: User email address
- first_name: User's first name
- last_name: User's last name
- department: Department (for instructors only)
- created_at: Account creation timestamp
- is_active: Account status

## File Structure

```
frontend/
├── app.py                  # Main Flask application
├── database.py             # Database management and models
├── requirements.txt        # Python dependencies
├── users.db               # SQLite database (auto-created)
├── static/
│   └── style.css          # CSS styling
└── templates/
    ├── login.html         # Admin login page
    ├── dashboard.html     # Admin dashboard
    ├── create_student.html    # Create student form
    └── create_instructor.html  # Create instructor form
```

## Security Notes

⚠️ **This is a development/educational application. For production use:**

1. **Hash passwords**: Use libraries like `bcrypt` or `argon2` to hash passwords
2. **Change secret key**: Modify `app.secret_key` in `app.py`
3. **Enable HTTPS**: Use SSL/TLS certificates
4. **Use environment variables**: Store sensitive data in environment variables
5. **Add CSRF protection**: Implement CSRF tokens
6. **Input validation**: Add more robust validation
7. **Rate limiting**: Implement rate limiting for login attempts
8. **Access control**: Implement role-based access control (RBAC)

## Troubleshooting

### Port 8000 already in use
Change the port in the last line of `app.py`:
```python
app.run(host='127.0.0.1', port=8001, debug=True)
```

### Module not found errors
Ensure you've installed all requirements:
```bash
pip install -r requirements.txt
```

### Database errors
Delete `users.db` and restart the application to reset the database

## License

This project is part of the Education Portal initiative.
