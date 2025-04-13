"use client";
import React from "react";

function MainComponent() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (
      selectedFile &&
      (selectedFile.type === "application/pdf" ||
        selectedFile.type.startsWith("image/"))
    ) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("PDFまたは画像ファイルを選択してください");
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setProcessing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tenantId", "t001");

    try {
      const response = await fetch("/api/ocr/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `OCR処理に失敗しました [${response.status}] ${response.statusText}`
        );
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = (format) => {
    if (!result) return;

    let content;
    let type;
    let filename;

    if (format === "csv") {
      const items = Object.entries(result.mappedFormData);
      content = items.map(([key, value]) => `${key},${value}`).join("\n");
      type = "text/csv";
      filename = `ocr-result-${Date.now()}.csv`;
    } else {
      content = JSON.stringify(result.mappedFormData, null, 2);
      type = "application/json";
      filename = `ocr-result-${Date.now()}.json`;
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
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">OCR文書処理</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">ファイルアップロード</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">
                PDFまたは画像ファイルを選択
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!file || processing}
              className={`w-full py-2 px-4 rounded text-white ${
                !file || processing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {processing ? (
                <span>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  処理中...
                </span>
              ) : (
                <span>
                  <i className="fas fa-upload mr-2"></i>
                  アップロード
                </span>
              )}
            </button>
          </form>
        </div>

        {result && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">処理結果</h2>
              <div className="space-x-2">
                <button
                  onClick={() => downloadResult("json")}
                  className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600"
                >
                  <i className="fas fa-download mr-1"></i>
                  JSON
                </button>
                <button
                  onClick={() => downloadResult("csv")}
                  className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600"
                >
                  <i className="fas fa-download mr-1"></i>
                  CSV
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">抽出データ</h3>
                <pre className="bg-gray-50 p-4 rounded overflow-x-auto">
                  {JSON.stringify(result.mappedFormData, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;