"use client";
import React from "react";

function MainComponent() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/ocr_documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "GET",
          tenantId: "t001",
        }),
      });

      if (!response.ok) {
        throw new Error(
          `OCRドキュメントの取得に失敗しました [${response.status}] ${response.statusText}`
        );
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error(err);
      setError("OCRドキュメントの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await fetch("/api/export_batch_results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedDocument.id,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error("エクスポートに失敗しました");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ocr-result-${selectedDocument.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setShowExportModal(false);
    } catch (err) {
      console.error(err);
      setError("エクスポートに失敗しました");
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">OCRドキュメント一覧</h1>
        <a
          href="/ocr/upload"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <i className="fas fa-upload mr-2"></i>新規アップロード
        </a>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ファイル名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                処理日時
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{doc.filename}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      doc.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : doc.status === "failed"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {doc.status === "completed"
                      ? "完了"
                      : doc.status === "failed"
                      ? "失敗"
                      : "処理中"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(doc.processed_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <a
                    href={`/ocr/${doc.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <i className="fas fa-eye"></i>
                  </a>
                  {doc.status === "completed" && (
                    <button
                      onClick={() => {
                        setSelectedDocument(doc);
                        setShowExportModal(true);
                      }}
                      className="text-green-600 hover:text-green-900"
                    >
                      <i className="fas fa-download"></i>
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  OCR処理済みドキュメントがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">エクスポート形式を選択</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => handleExport("csv")}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                CSV形式
              </button>
              <button
                onClick={() => handleExport("xlsx")}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Excel形式
              </button>
              <button
                onClick={() => handleExport("json")}
                className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              >
                JSON形式
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainComponent;