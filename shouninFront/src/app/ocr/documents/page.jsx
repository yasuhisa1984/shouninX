"use client";
import React, { useEffect, useState } from "react";

function MainComponent() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/ocr/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "GET", tenantId: "t001" }),
      });

      if (!response.ok) {
        throw new Error("OCR処理結果の取得に失敗しました");
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error(err);
      setError("OCR処理結果の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const downloadData = (format, data) => {
    try {
      const parsed = JSON.parse(data.extracted_data);
      let content, type, filename;

      if (format === "csv") {
        const items = Object.entries(parsed);
        content = items.map(([key, value]) => `${key},${value}`).join("\n");
        type = "text/csv";
        filename = `ocr-result-${data.id}.csv`;
      } else {
        content = JSON.stringify(parsed, null, 2);
        type = "application/json";
        filename = `ocr-result-${data.id}.json`;
      }

      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("データの変換に失敗しました");
      console.error("JSON parse error:", e);
    }
  };

  if (loading) return <div className="p-4">読み込み中...</div>;

  return (
    <div className="p-6">
      {error && <div className="text-red-600 mb-4 font-bold">{error}</div>}

      <h1 className="text-2xl font-bold mb-4">OCR処理済みドキュメント一覧</h1>

      <table className="min-w-full bg-white shadow rounded overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">ファイル名</th>
            <th className="px-4 py-2 text-left">アップロード日時</th>
            <th className="px-4 py-2 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">{doc.filename || "名称未設定"}</td>
              <td className="px-4 py-2">
                {doc.created_at
                  ? new Date(doc.created_at).toLocaleString()
                  : "-"}
              </td>
              <td className="px-4 py-2 space-x-2">
                <button
                  onClick={() => downloadData("csv", doc)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  CSV
                </button>
                <button
                  onClick={() => downloadData("json", doc)}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  JSON
                </button>
              </td>
            </tr>
          ))}
          {documents.length === 0 && (
            <tr>
              <td colSpan="3" className="text-center p-4 text-gray-500">
                データがありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default MainComponent;

