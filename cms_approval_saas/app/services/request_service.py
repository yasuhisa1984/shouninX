# app/services/request_service.py

from sqlalchemy.orm import Session, joinedload
from app.models.request_model import Request
from app.schemas.request import RequestCreate

def create_request(db: Session, request_create: RequestCreate) -> Request:
    request = Request(**request_create.dict())
    db.add(request)
    db.commit()
    db.refresh(request)
    return request

def get_all_requests(db: Session):
    requests = db.query(Request).options(joinedload(Request.form)).all()
    return [
        {
            "id": r.id,
            "tenant_id": r.tenant_id,
            "form_id": r.form_id,
            "data_json": r.data_json,
            "created_at": r.created_at,
            "form_name": r.form.name if r.form else None,
        }
        for r in requests
    ]
