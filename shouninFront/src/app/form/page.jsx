"use client";
import React, { useEffect, useState } from "react";

function MainComponent() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [formName, setFormName] = useState("");
  const [formSchema, setFormSchema] = useState("");

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await fetch("http://localhost:8000/forms/", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(
          `フォーム一覧の取得に失敗しました [${response.status}] ${response.statusText}`
        );
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingForm ? "PUT" : "POST";
      const response = await fetch("http://localhost:8000/forms/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          tenantId: "t001",
          id: editingForm?.id,
          name: formName,
          schemaJson: JSON.parse(formSchema),
        }),
      });

      if (!response.ok) {
        throw new Error(
          `フォームの${editingForm ? "更新" : "作成"}に失敗しました`
        );
      }

      await fetchForms();
      setShowCreateModal(false);
      setEditingForm(null);
      setFormName("");
      setFormSchema("");
    } catch (err) {
      console.error(err);
      setError(`フォームの${editingForm ? "更新" : "作成"}に失敗しました`);
    }
  };

  const handleDelete = async (formId) => {
    if (!confirm("このフォームを削除してもよろしいですか？")) return;

    try {
      const response = await fetch("http://localhost:8000/forms/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("フォームの削除に失敗しました");
      }

      await fetchForms();
    } catch (err) {
      console.error(err);
      setError("フォームの削除に失敗しました");
    }
  };

  const handleEdit = (form) => {
    setEditingForm(form);
    setFormName(form.name);
    setFormSchema(form.schema_json);
    setShowCreateModal(true);
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">フォーム管理</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <i className="fas fa-plus mr-2"></i>新規作成
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                フォーム名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                作成日時
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {forms.map((form) => (
              <tr key={form.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{form.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(form.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleEdit(form)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(form.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
            {forms.length === 0 && (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                  フォームがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingForm ? "フォームを編集" : "新規フォーム作成"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingForm(null);
                  setFormName("");
                  setFormSchema("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  フォーム名
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  フォームスキーマ (JSON)
                </label>
                <textarea
                  value={formSchema}
                  onChange={(e) => setFormSchema(e.target.value)}
                  className="w-full p-2 border rounded font-mono"
                  rows="10"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {editingForm ? "更新" : "作成"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainComponent;"use client";

