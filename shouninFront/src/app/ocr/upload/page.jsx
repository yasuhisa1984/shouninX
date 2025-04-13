"use client";
import React from "react";

import { useUpload } from "../utilities/runtime-helpers";

function MainComponent() {
  const [upload, { loading: uploading }] = useUpload();
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await fetch("/api/forms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "GET", tenantId: "t001" }),
        });

        if (!response.ok) {
          throw new Error("フォームの取得に失敗しました");
        }

        const data = await response.json();
        setForms(data.forms || []);
      } catch (err) {
        console.error(err);
        setError("フォームの取得に失敗しました");
      }
    };

    fetchForms();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
    }
  }, []);

  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  }, []);

  const processDocument = useCallback(async () => {
    if (!file || !selectedForm) return;

    try {
      setProcessing(true);
      setError(null);

      const { url, error: uploadError } = await upload({ file });
      if (uploadError) {
        throw new Error(uploadError);
      }

      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      const visionResponse = await fetch("/integrations/gpt-vision/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "画像から全てのテキストを抽出してください。",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: base64,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!visionResponse.ok) {
        throw new Error("OCR処理に失敗しました");
      }

      const visionData = await visionResponse.json();
      const extractedText = visionData.choices[0].message.content;

      const docResponse = await fetch("/api/ocr/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "t001",
          file: base64,
          formId: selectedForm.id,
        }),
      });

      if (!docResponse.ok) {
        throw new Error("ドキュメントの保存に失敗しました");
      }

      const docData = await docResponse.json();
      setOcrResult({
        text: extractedText,
        document: docData.document,
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }, [file, selectedForm, upload]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">OCRドキュメントアップロード</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="mb-4">
              <i className="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
            </div>
            <p className="text-gray-600 mb-4">
              ドラッグ＆ドロップ、または
              <label className="text-blue-500 cursor-pointer hover:text-blue-600">
                ファイルを選択
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
            </p>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              OCRテンプレート選択
            </label>
            <select
              className="w-full p-2 border rounded"
              value={selectedForm?.id || ""}
              onChange={(e) => {
                const form = forms.find((f) => f.id === e.target.value);
                setSelectedForm(form);
              }}
            >
              <option value="">テンプレートを選択してください</option>
              {forms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-300"
            onClick={processDocument}
            disabled={!file || !selectedForm || processing || uploading}
          >
            {processing || uploading ? (
              <span>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                処理中...
              </span>
            ) : (
              "処理開始"
            )}
          </button>
        </div>

        <div>
          {preview && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">プレビュー</h3>
              <img
                src={preview}
                alt="アップロードされた画像のプレビュー"
                className="max-w-full h-auto rounded border"
              />
            </div>
          )}

          {ocrResult && (
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-2">OCR処理結果</h3>
              <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded text-sm">
                {ocrResult.text}
              </pre>
              <div className="mt-4">
                <a
                  href={`/requests/new?form=${selectedForm.id}&ocr=${ocrResult.document.id}`}
                  className="inline-block bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                >
                  申請フォームへ連携
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainComponent;