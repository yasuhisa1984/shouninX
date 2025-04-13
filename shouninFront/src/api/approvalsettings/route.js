async function handler({ method, tenantId, formId, body }) {
  if (!tenantId) {
    return { error: "Tenant ID is required" };
  }

  if (method === "GET") {
    if (!formId) {
      const approvalSettings = await sql`
        SELECT 
          forms.id as form_id,
          forms.name as form_name,
          approval_steps.step_number,
          approval_steps.approver_id
        FROM forms
        LEFT JOIN approval_steps ON forms.id = approval_steps.form_id
        WHERE forms.tenant_id = ${tenantId}
        ORDER BY forms.id, approval_steps.step_number
      `;
      return { settings: approvalSettings };
    }

    const approvalSettings = await sql`
      SELECT 
        forms.id as form_id,
        forms.name as form_name,
        approval_steps.step_number,
        approval_steps.approver_id
      FROM forms
      LEFT JOIN approval_steps ON forms.id = approval_steps.form_id
      WHERE forms.tenant_id = ${tenantId}
      AND forms.id = ${formId}
      ORDER BY approval_steps.step_number
    `;
    return { settings: approvalSettings };
  }

  if (method === "POST") {
    if (!formId || !body?.steps || !Array.isArray(body.steps)) {
      return { error: "Form ID and steps array are required" };
    }

    const result = await sql.transaction(async (sql) => {
      await sql`
        DELETE FROM approval_steps 
        WHERE form_id = ${formId} 
        AND tenant_id = ${tenantId}
      `;

      const insertedSteps = await Promise.all(
        body.steps.map(
          (step, index) =>
            sql`
            INSERT INTO approval_steps (
              tenant_id, 
              form_id, 
              step_number, 
              approver_id
            )
            VALUES (
              ${tenantId}, 
              ${formId}, 
              ${index + 1}, 
              ${step.approverId}
            )
            RETURNING *
          `
        )
      );

      return insertedSteps;
    });

    return { settings: result };
  }

  if (method === "PUT") {
    if (!formId || !body?.steps || !Array.isArray(body.steps)) {
      return { error: "Form ID and steps array are required" };
    }

    const result = await sql.transaction(async (sql) => {
      await sql`
        DELETE FROM approval_steps 
        WHERE form_id = ${formId} 
        AND tenant_id = ${tenantId}
      `;

      const updatedSteps = await Promise.all(
        body.steps.map(
          (step, index) =>
            sql`
            INSERT INTO approval_steps (
              tenant_id, 
              form_id, 
              step_number, 
              approver_id
            )
            VALUES (
              ${tenantId}, 
              ${formId}, 
              ${index + 1}, 
              ${step.approverId}
            )
            RETURNING *
          `
        )
      );

      return updatedSteps;
    });

    return { settings: result };
  }

  if (method === "DELETE") {
    if (!formId) {
      return { error: "Form ID is required" };
    }

    await sql`
      DELETE FROM approval_steps 
      WHERE form_id = ${formId} 
      AND tenant_id = ${tenantId}
    `;

    return { success: true };
  }

  return { error: "Invalid method" };
}

function MainComponent() {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [approvalSteps, setApprovalSteps] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "GET", tenantId: "t001" }),
      });

      if (!response.ok) {
        throw new Error("フォーム一覧の取得に失敗しました");
      }

      const data = await response.json();
      setForms(data.forms || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("フォーム一覧の取得に失敗しました");
      setLoading(false);
    }
  };

  const addApprovalStep = () => {
    setApprovalSteps([
      ...approvalSteps,
      {
        id: Date.now(),
        approvers: [],
        approverGroupId: null,
        order: approvalSteps.length + 1,
        approvalType: "all",
        deadline: null,
        delegateUserId: null,
        conditions: null,
      },
    ]);
  };

  const removeApprovalStep = (stepId) => {
    setApprovalSteps(approvalSteps.filter((step) => step.id !== stepId));
  };

  const moveApprovalStep = (stepId, direction) => {
    const stepIndex = approvalSteps.findIndex((step) => step.id === stepId);
    if (
      (direction === "up" && stepIndex === 0) ||
      (direction === "down" && stepIndex === approvalSteps.length - 1)
    )
      return;

    const newSteps = [...approvalSteps];
    const temp = newSteps[stepIndex];
    newSteps[stepIndex] = newSteps[stepIndex + (direction === "up" ? -1 : 1)];
    newSteps[stepIndex + (direction === "up" ? -1 : 1)] = temp;
    setApprovalSteps(newSteps);
  };

  const updateStep = (stepId, field, value) => {
    setApprovalSteps(
      approvalSteps.map((step) =>
        step.id === stepId ? { ...step, [field]: value } : step
      )
    );
  };

  const saveApprovalFlow = async () => {
    if (!selectedForm) return;

    try {
      const response = await fetch("/api/approval_settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "t001",
          formId: selectedForm.id,
          approvalSteps,
        }),
      });

      if (!response.ok) {
        throw new Error("承認フロー設定の保存に失敗しました");
      }

      setError(null);
    } catch (err) {
      console.error(err);
      setError("承認フロー設定の保存に失敗しました");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">承認フロー設定</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">フォーム選択</h2>
          <div className="space-y-4">
            {forms.map((form) => (
              <div
                key={form.id}
                className={`border p-4 rounded cursor-pointer transition-colors ${
                  selectedForm?.id === form.id
                    ? "border-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedForm(form)}
              >
                <div className="font-medium">{form.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">承認ステップ設定</h2>
            <button
              onClick={addApprovalStep}
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
              disabled={!selectedForm}
            >
              <i className="fas fa-plus mr-2"></i>
              ステップを追加
            </button>
          </div>

          {!selectedForm ? (
            <div className="text-gray-500 text-center py-8">
              左側のリストからフォームを選択してください
            </div>
          ) : (
            <div className="space-y-4">
              {approvalSteps.map((step, index) => (
                <div key={step.id} className="border p-4 rounded bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <div className="font-medium">ステップ {index + 1}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveApprovalStep(step.id, "up")}
                        disabled={index === 0}
                        className="text-gray-600 hover:text-gray-800 disabled:text-gray-400"
                      >
                        <i className="fas fa-arrow-up"></i>
                      </button>
                      <button
                        onClick={() => moveApprovalStep(step.id, "down")}
                        disabled={index === approvalSteps.length - 1}
                        className="text-gray-600 hover:text-gray-800 disabled:text-gray-400"
                      >
                        <i className="fas fa-arrow-down"></i>
                      </button>
                      <button
                        onClick={() => removeApprovalStep(step.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 mb-2">
                        承認者設定
                      </label>
                      <select
                        multiple
                        className="w-full p-2 border rounded"
                        value={step.approvers}
                        onChange={(e) =>
                          updateStep(
                            step.id,
                            "approvers",
                            Array.from(
                              e.target.selectedOptions,
                              (option) => option.value
                            )
                          )
                        }
                      >
                        <option value="user1">承認者1</option>
                        <option value="user2">承認者2</option>
                        <option value="user3">承認者3</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2">
                        承認者グループ
                      </label>
                      <select
                        className="w-full p-2 border rounded"
                        value={step.approverGroupId || ""}
                        onChange={(e) =>
                          updateStep(step.id, "approverGroupId", e.target.value)
                        }
                      >
                        <option value="">選択してください</option>
                        <option value="group1">グループ1</option>
                        <option value="group2">グループ2</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2">
                        承認タイプ
                      </label>
                      <select
                        className="w-full p-2 border rounded"
                        value={step.approvalType}
                        onChange={(e) =>
                          updateStep(step.id, "approvalType", e.target.value)
                        }
                      >
                        <option value="all">全員承認</option>
                        <option value="majority">過半数承認</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2">
                        承認期限
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full p-2 border rounded"
                        value={step.deadline || ""}
                        onChange={(e) =>
                          updateStep(step.id, "deadline", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2">
                        代理承認者
                      </label>
                      <select
                        className="w-full p-2 border rounded"
                        value={step.delegateUserId || ""}
                        onChange={(e) =>
                          updateStep(step.id, "delegateUserId", e.target.value)
                        }
                      >
                        <option value="">選択してください</option>
                        <option value="user1">ユーザー1</option>
                        <option value="user2">ユーザー2</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2">
                        承認条件
                      </label>
                      <textarea
                        className="w-full p-2 border rounded"
                        placeholder='例: {"field": "amount", "operator": ">", "value": 10000}'
                        value={
                          step.conditions ? JSON.stringify(step.conditions) : ""
                        }
                        onChange={(e) => {
                          try {
                            const conditions = e.target.value
                              ? JSON.parse(e.target.value)
                              : null;
                            updateStep(step.id, "conditions", conditions);
                          } catch (err) {
                            // JSON解析エラーは無視
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {approvalSteps.length > 0 && (
                <button
                  onClick={saveApprovalFlow}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mt-4"
                >
                  <i className="fas fa-save mr-2"></i>
                  設定を保存
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}