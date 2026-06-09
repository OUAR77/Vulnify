import sys
sys.path.insert(0, '.')
from database import SessionLocal
from models.user import User
from modules.auth import verify_password

db = SessionLocal()
u = db.query(User).filter(User.role == 'admin').first()
if u:
    print(f'ID: {u.id}')
    print(f'Email: {u.email}')
    print(f'Role: {u.role}')
    print(f'Verified: {u.is_verified}')
    print(f'Password "admin123456" matches: {verify_password("admin123456", u.password)}')
    print(f'Password "Admin123456" matches: {verify_password("Admin123456", u.password)}')
else:
    print('No admin user found')
db.close()
