#!/bin/bash

PROJECT_NAME="cms_approval_saas"
mkdir -p $PROJECT_NAME/app/{routers,models,schemas,services,core}
cd $PROJECT_NAME

# .envファイル作成
cat <<EOF > .env
DATABASE_URL=mysql+pymysql://root:password@db:3306/approval_db
EOF

# Dockerfile作成
cat <<EOF > Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app ./app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
EOF

# requirements.txt作成
cat <<EOF > requirements.txt
fastapi
uvicorn[standard]
sqlalchemy
pymysql
python-dotenv
EOF

# docker-compose.yml作成
cat <<EOF > docker-compose.yml
version: "3.8"
services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: approval_db
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql

  app:
    build: .
    volumes:
      - .:/app
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      - db

volumes:
  db_data:
EOF

# main.py 作成
cat <<EOF > app/main.py
from fastapi import FastAPI
from app.routers import form

app = FastAPI()
app.include_router(form.router)

@app.get("/")
def root():
    return {"message": "Hello CMS SaaS"}
EOF

# formルーター作成
cat <<EOF > app/routers/form.py
from fastapi import APIRouter

router = APIRouter(prefix="/forms", tags=["forms"])

@router.get("/")
def get_forms():
    return {"forms": []}
EOF

echo "✅ プロジェクト '$PROJECT_NAME' を作成しました！"
echo "次のコマンドを実行してください："
echo "  cd $PROJECT_NAME"
echo "  docker-compose up --build"
