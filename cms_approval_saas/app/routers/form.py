from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.form import FormCreate, FormResponse
from app.models.form_model import Form
from app.core.database import get_db, SessionLocal
from typing import Dict, List
import uuid

router = APIRouter(prefix="/forms", tags=["forms"])

# dbセッション取得用（本番では app/core/database.py の get_db を使うとスマート）
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=Dict[str, List[FormResponse]])
def get_forms(db: Session = Depends(get_db)):
    forms = db.query(Form).all()
    return {"forms": forms}  # ← フロント側の data.forms に対応！

@router.post("/", response_model=FormResponse)
def create_form(form: FormCreate, db: Session = Depends(get_db)):
    db_form = Form(id=str(uuid.uuid4()), **form.dict())
    db.add(db_form)
    db.commit()
    db.refresh(db_form)
    return db_form

@router.get("/{form_id}", response_model=FormResponse)
def get_form_by_id(form_id: str, db: Session = Depends(get_db)):
    form = db.query(Form).filter(Form.id == form_id).first()
    if form is None:
        raise HTTPException(status_code=404, detail="form not found")
    return form

