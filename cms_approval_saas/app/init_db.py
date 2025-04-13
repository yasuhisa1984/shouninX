# app/init_db.py
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))  # ← カレントディレクトリを追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # ← app の親も追加

from app.core.database import engine, Base
from app.models.request_model import Request
from app.models.form_model import Form

print("Creating all tables...")
Base.metadata.create_all(bind=engine)
print("Done.")
