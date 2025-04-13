# app/services/request_service.py

from sqlalchemy.orm import Session
from app.models.request_model import Request
from app.schemas.request import RequestCreate

def create_request(db: Session, request_create: RequestCreate) -> Request:
    request = Request(**request_create.dict())
    db.add(request)
    db.commit()
    db.refresh(request)
    return request

def get_all_requests(db: Session):
    return db.query(Request).all()
