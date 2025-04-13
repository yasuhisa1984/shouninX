"use client";
import React, { useCallback, useEffect, useState } from "react";

function MainComponent() {
  const [forms, setForms] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchForms = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8000/forms/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
       console.log("フォームレスポンス:", response.status);

      if (!response.ok) {
        throw new Error(`フォーム一覧取得失敗 [${response.status}] ${response.statusText}`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.forms)) {
        throw new Error("フォーム一覧取得失敗：不正なレスポンス形式");
      }

      setForms(data.forms);
    } catch (err) {
      console.error("フォーム一覧取得エラー:", err);
      setError(err.message);
      setForms([]);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8000/requests/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`申請一覧取得失敗 [${response.status}] ${response.statusText}`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.requests)) {
        throw new Error("申請一覧取得失敗：不正なレスポンス形式");
      }

      setRequests(data.requests);
    } catch (err) {
      console.error("申請一覧取得エラー:", err);
      setError(err.message);
      setRequests([]);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchForms(), fetchRequests()]);
      } catch (err) {
        console.error("初期化エラー:", err);
        setError("データの読み込みに失敗しました。ページを更新してください。");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [fetchForms, fetchRequests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedForm) return;

    setError(null);
    try {
      const response = await fetch("http://localhost:8000/requests/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: "t001", // 👈 修正済
          form_id: selectedForm.id, // 👈 修正済
          data_json: JSON.stringify(formData), // 👈 修正済
        }),
      });

      if (!response.ok) {
        throw new Error(`申請送信失敗 [${response.status}] ${response.statusText}`);
      }

      const data = await response.json();
      if (!data || !data.id) {
        throw new Error("申請送信失敗：レスポンスが不正です");
      }

      setFormData({});
      setSelectedForm(null);
      await fetchRequests();
    } catch (err) {
      console.error("申請送信エラー:", err);
      setError(err.message);
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
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center justify-between">
          <div className="flex-1">{error}</div>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-700 hover:text-red-900"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* 新規申請フォーム */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">新規申請</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">フォームを選択</label>
              <select
                className="w-full p-2 border rounded"
                value={selectedForm?.id || ""}
                onChange={(e) => {
                  const form = forms.find((f) => f.id === e.target.value);
                  setSelectedForm(form);
                  setFormData({});
                }}
              >
                <option value="">選択してください</option>
                {forms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedForm && (
              <div className="space-y-4">
                {Object.entries(JSON.parse(selectedForm.schema_json)).map(
                  ([field, type]) => (
                    <div key={field}>
                      <label className="block text-gray-700 mb-2">{field}</label>
                      <input
                        type={type}
                        className="w-full p-2 border rounded"
                        value={formData[field] || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [field]: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  )
                )}
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                >
                  申請する
                </button>
              </div>
            )}
          </form>
        </div>

        {/* 申請一覧表示 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">申請一覧</h2>
            <button
              onClick={fetchRequests}
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              更新
            </button>
          </div>
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border p-4 rounded hover:bg-gray-50 transition-colors"
              >
                <div className="font-bold">{request.form_name}</div>
                <div className="text-sm text-gray-600">
                  {new Date(request.created_at).toLocaleString()}
                </div>
                <div className="mt-2">
                  {Object.entries(JSON.parse(request.data_json || "{}")).map(
                    ([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium">{key}:</span> {value}
                      </div>
                    )
                  )}
                </div>
                <div className="mt-2 text-sm">
                  <span
                    className={`px-2 py-1 rounded ${
                      request.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : request.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {request.status === "approved"
                      ? "承認済み"
                      : request.status === "rejected"
                      ? "却下"
                      : "承認待ち"}
                  </span>
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="text-gray-500 text-center py-8">
                申請はまだありません
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;

