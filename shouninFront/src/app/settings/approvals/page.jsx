"use client";
import React, { useEffect, useState } from "react";

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
    } catch (err) {
      console.error(err);
      setError("フォーム一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const addApprovalStep = () => {
    setApprovalSteps([
      ...approvalSteps,
      { id: Date.now(), approvers: [], order: approvalSteps.length + 1 },
    ]);
  };

  const removeApprovalStep = (stepId) => {
    setApprovalSteps(approvalSteps.filter((step) => step.id !== stepId));
  };

  const moveApprovalStep = (stepId, direction) => {
    const index = approvalSteps.findIndex((step) => step.id === stepId);
    const swapIndex = direction === "up" ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= approvalSteps.length) return;

    const updated = [...approvalSteps];
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    setApprovalSteps(updated);
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

      if (!response.ok) throw new Error();

      setError(null);
      alert("保存に成功しました！");
    } catch {
      setError("承認フロー設定の保存に失敗しました");
    }
  };

  if (loading) return <div className="p-4">読み込み中...</div>;

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 text-red-600 font-bold">{error}</div>
      )}

      <div className="mb-4">
        <label className="block mb-2 font-semibold">対象フォーム選択</label>
        <select
          className="p-2 border rounded"
          onChange={(e) => {
            const selected = forms.find((f) => f.id === e.target.value);
            setSelectedForm(selected);
            setApprovalSteps([]); // フォーム切り替え時にリセット
          }}
        >
          <option value="">フォームを選択してください</option>
          {forms.map((form) => (
            <option key={form.id} value={form.id}>
              {form.name}
            </option>
          ))}
        </select>
      </div>

      {selectedForm && (
        <>
          <h2 className="text-xl font-bold mb-2">承認ステップ設定</h2>

          <button
            onClick={addApprovalStep}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            ステップを追加
          </button>

          <ul className="space-y-3">
            {approvalSteps.map((step, index) => (
              <li
                key={step.id}
                className="border p-3 rounded flex justify-between items-center"
              >
                <div>ステップ {index + 1}</div>
                <div className="space-x-2">
                  <button
                    onClick={() => moveApprovalStep(step.id, "up")}
                    className="text-sm bg-gray-200 px-2 py-1 rounded"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveApprovalStep(step.id, "down")}
                    className="text-sm bg-gray-200 px-2 py-1 rounded"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeApprovalStep(step.id)}
                    className="text-sm bg-red-500 text-white px-2 py-1 rounded"
                  >
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <button
              onClick={saveApprovalFlow}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              保存する
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default MainComponent;

