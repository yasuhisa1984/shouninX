# app/schemas/form.py
from pydantic import BaseModel

class FormCreate(BaseModel):
    tenant_id: str
    name: str
    schema_json: str

class FormResponse(FormCreate):
    id: str
