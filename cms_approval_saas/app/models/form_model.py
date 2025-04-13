# app/models/form_model.py
from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Form(Base):
    __tablename__ = "forms"

    id = Column(String(36), primary_key=True)
    tenant_id = Column(String(36), nullable=False)
    name = Column(String(255), nullable=False)
    schema_json = Column(Text, nullable=False)

    requests = relationship("Request", back_populates="form")  # ← OK（文字列）

