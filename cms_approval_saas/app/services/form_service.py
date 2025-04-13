def get_form_by_id(db: Session, form_id: str):
    return db.query(Form).filter(Form.id == form_id).first()
