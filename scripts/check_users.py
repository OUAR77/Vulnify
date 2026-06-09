import sys
sys.path.insert(0, '.')
from database import SessionLocal
from models.user import User

db = SessionLocal()
users = db.query(User).all()
print(f'Total users: {len(users)}')
for u in users:
    print(f'ID: {u.id} | Name: {u.name} | Email: {u.email} | Role: {u.role} | Created: {u.created_at}')
db.close()
