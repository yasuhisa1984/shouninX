# app/schemas/request.py

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RequestCreate(BaseModel):
    tenant_id: str
    form_id: str
    data_json: str  # JSON文字列（バリデーションなどは後から追加）

class RequestOut(BaseModel):
    id: str
    tenant_id: str
    form_id: str
    data_json: str
    created_at: datetime

    class Config:
        orm_mode = True
