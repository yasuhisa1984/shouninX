# app/seed_data.py
from app.core.database import SessionLocal, engine, Base
from app.models.form_model import Form
from app.models.request_model import Request
from datetime import datetime
import uuid

# DB初期化（必要なら）
Base.metadata.create_all(bind=engine)



# DBセッション開始
db = SessionLocal()

# 既存のデータを消す（開発用）
db.query(Request).delete()
db.query(Form).delete()
db.commit()

# 初期フォームを作成
form_id = str(uuid.uuid4())
form = Form(
    id=form_id,
    tenant_id="t001",
    name="見積申請",
    schema_json='{"金額":"input", "用途":"input"}'
)
db.add(form)
db.commit()

# 初期申請データ
request = Request(
    id=str(uuid.uuid4()),
    tenant_id="t001",
    form_id=form_id,
    data_json='{"金額":"10000", "用途":"広告費"}',
    created_at=datetime.utcnow()
)
db.add(request)
db.commit()

db.close()

print("✅ 初期データの投入が完了しました！")
