from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.request import RequestCreate, RequestOut
from app.services import request_service
from typing import Dict, List

router = APIRouter(prefix="/requests", tags=["requests"])

@router.post("/", response_model=RequestOut)
def create_request(request_create: RequestCreate, db: Session = Depends(get_db)):
    return request_service.create_request(db, request_create)

@router.get("/", response_model=Dict[str, List[RequestOut]])
def get_requests(db: Session = Depends(get_db)):
    requests = request_service.get_all_requests(db)
    return {"requests": requests}  # ← フロント側が data.requests で取得できるように

