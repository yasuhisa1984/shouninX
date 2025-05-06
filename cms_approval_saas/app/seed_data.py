from app.core.database import SessionLocal
from app.models.approval_model import ApprovalRoute, ApprovalMember, ApprovalStatus
from app.models.request_model import Request
from app.models.form_model import Form
from uuid import uuid4
from datetime import datetime

db = SessionLocal()

# === 1. フォーム作成 ===
form_id = str(uuid4())
form = Form(
    id=form_id,
    tenant_id="t001",
    name="経費申請フォーム",
    schema_json='{"金額": "input", "用途": "input"}'
)
db.add(form)

# === 2. リクエスト作成 ===
request_id = str(uuid4())
req = Request(
    id=request_id,
    tenant_id="t001",
    form_id=form_id,
    data_json='{"金額": "5000", "用途": "出張費"}',
    created_at=datetime.utcnow()
)
db.add(req)

# === 3. 承認ルート（3ステップ） ===

# ステップ1（AND）
route1_id = str(uuid4())
route1 = ApprovalRoute(
    id=route1_id,
    request_id=request_id,
    step=1,
    condition_type="AND"
)
db.add(route1)
db.add_all([
    ApprovalMember(id=str(uuid4()), route_id=route1_id, user_id="tsuji@cynd.co.jp"),
    ApprovalMember(id=str(uuid4()), route_id=route1_id, user_id="ikeda@cynd.co.jp")
])

# ステップ2（OR）
route2_id = str(uuid4())
route2 = ApprovalRoute(
    id=route2_id,
    request_id=request_id,
    step=2,
    condition_type="OR"
)
db.add(route2)
db.add_all([
    ApprovalMember(id=str(uuid4()), route_id=route2_id, user_id="suwabe@cynd.co.jp"),
    ApprovalMember(id=str(uuid4()), route_id=route2_id, user_id="鈴木雅代")
])

# ステップ3（AND）
route3_id = str(uuid4())
route3 = ApprovalRoute(
    id=route3_id,
    request_id=request_id,
    step=3,
    condition_type="AND"
)
db.add(route3)
db.add_all([
    ApprovalMember(id=str(uuid4()), route_id=route3_id, user_id="naoya.takahashi@cynd.co.jp"),
    ApprovalMember(id=str(uuid4()), route_id=route3_id, user_id="奥脇隆司")
])

# === 4. 一部ステータス追加（ORの通過例） ===
db.add_all([
    ApprovalStatus(
        id=str(uuid4()),
        route_id=route1_id,
        user_id="tsuji@cynd.co.jp",
        status="approved",
        comment="問題ありません",
        acted_at=datetime.utcnow()
    ),
    ApprovalStatus(
        id=str(uuid4()),
        route_id=route1_id,
        user_id="ikeda@cynd.co.jp",
        status="approved",
        acted_at=datetime.utcnow()
    ),
    ApprovalStatus(
        id=str(uuid4()),
        route_id=route2_id,
        user_id="suwabe@cynd.co.jp",
        status="approved",
        acted_at=datetime.utcnow()
    )
])

db.commit()
db.close()

print("✔ モックデータ挿入完了")
