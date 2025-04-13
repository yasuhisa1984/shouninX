"use client";
import React from "react";

import { useUpload } from "../utilities/runtime-helpers";

function MainComponent() {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [upload, { loading: uploading }] = useUpload();
  const [formData, setFormData] = useState({
    name: "",
    schema_json: "{}",
  });
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchResults, setBatchResults] = useState(null);
  const [batchProgress, setBatchProgress] = useState(null);
  const [retryingResults, setRetryingResults] = useState(new Set());
  const [searchParams, setSearchParams] = useState({
    status: "",
    fileName: "",
    startDate: "",
    endDate: "",
    page: 1,
  });
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [batchHistoryParams, setBatchHistoryParams] = useState({
    templateId: "",
    status: "",
    startDate: "",
    endDate: "",
    page: 1,
  });
  const [batchHistory, setBatchHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savedConditions, setSavedConditions] = useState([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [editingConditionId, setEditingConditionId] = useState(null);
  const [isDefaultCondition, setIsDefaultCondition] = useState(false);

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
        throw new Error("テンプレートの取得に失敗しました");
      }

      const data = await response.json();
      setForms(data.forms || []);
    } catch (err) {
      console.error(err);
      setError("テンプレートの取得に失敗しました");
    }
  };

  const fetchBatchHistory = useCallback(
    async (params = batchHistoryParams) => {
      try {
        setLoadingHistory(true);
        setError(null);

        const response = await fetch("/api/list-batch-processes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: "t001",
            ...params,
          }),
        });

        if (!response.ok) {
          throw new Error("バッチ処理履歴の取得に失敗しました");
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setBatchHistory(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoadingHistory(false);
      }
    },
    [batchHistoryParams]
  );

  const handleBatchHistoryPageChange = useCallback(
    (newPage) => {
      const newParams = { ...batchHistoryParams, page: newPage };
      setBatchHistoryParams(newParams);
      fetchBatchHistory(newParams);
    },
    [batchHistoryParams, fetchBatchHistory]
  );

  useEffect(() => {
    fetchBatchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "t001",
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error("テンプレートの保存に失敗しました");
      }

      setFormData({ name: "", schema_json: "{}" });
      setIsEditing(false);
      fetchForms();
    } catch (err) {
      console.error(err);
      setError("テンプレートの保存に失敗しました");
    }
  };

  const handleEdit = (form) => {
    setSelectedForm(form);
    setFormData({
      name: form.name,
      schema_json: form.schema_json,
    });
    setIsEditing(true);
  };

  const handleDelete = async (formId) => {
    if (!confirm("このテンプレートを削除してもよろしいですか？")) {
      return;
    }

    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "DELETE",
          tenantId: "t001",
          id: formId,
        }),
      });

      if (!response.ok) {
        throw new Error("テンプレートの削除に失敗しました");
      }

      fetchForms();
    } catch (err) {
      console.error(err);
      setError("テンプレートの削除に失敗しました");
    }
  };

  const handlePreviewFile = useCallback((e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setPreviewFile(file);
      setPreviewResult(null);
    }
  }, []);

  const processPreview = useCallback(async () => {
    if (!previewFile || !formData.schema_json) return;

    try {
      setProcessing(true);
      setError(null);

      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(previewFile);
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

      const rules = JSON.parse(formData.schema_json);
      const mappedData = {};

      Object.entries(rules).forEach(([key, rule]) => {
        if (typeof rule === "string" && rule.startsWith("regex:")) {
          const regex = new RegExp(rule.replace("regex:", ""), "i");
          const match = extractedText.match(regex);
          mappedData[key] = match ? match[1] || match[0] : null;
        } else if (typeof rule === "string" && rule.startsWith("after:")) {
          const keyword = rule.replace("after:", "");
          const index = extractedText.indexOf(keyword);
          if (index !== -1) {
            const afterText = extractedText
              .slice(index + keyword.length)
              .trim();
            mappedData[key] = afterText.split("\n")[0];
          }
        }
      });

      setPreviewResult({
        rawText: extractedText,
        mappedData,
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }, [previewFile, formData.schema_json]);

  const handleBatchFiles = useCallback((e) => {
    const files = Array.from(e.target.files).filter((file) =>
      file.type.startsWith("image/")
    );
    setBatchFiles(files);
    setBatchResults(null);
  }, []);

  const processBatch = useCallback(async () => {
    if (!batchFiles.length || !selectedForm) return;

    try {
      setBatchProcessing(true);
      setError(null);

      const uploadPromises = batchFiles.map((file) => upload({ file }));
      const uploadResults = await Promise.all(uploadPromises);
      const fileUrls = uploadResults.map((result) => result.url);

      const batchResponse = await fetch("/api/batch-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "t001",
          templateId: selectedForm.id,
          fileUrls,
        }),
      });

      if (!batchResponse.ok) {
        throw new Error("バッチ処理の開始に失敗しました");
      }

      const batchData = await batchResponse.json();

      const checkProgress = async () => {
        const progressResponse = await fetch("/api/batch-ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "GET",
            tenantId: "t001",
            batchId: batchData.batchId,
          }),
        });

        if (!progressResponse.ok) {
          throw new Error("進捗の取得に失敗しました");
        }

        const progressData = await progressResponse.json();
        setBatchProgress(progressData);

        if (progressData.status === "completed") {
          setBatchResults(progressData.results);
          return;
        }

        setTimeout(checkProgress, 1000);
      };

      checkProgress();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setBatchProcessing(false);
    }
  }, [batchFiles, selectedForm, upload]);

  const exportToCsv = useCallback(async () => {
    if (!batchProgress?.batchId) return;

    try {
      const response = await fetch("/api/export-batch-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: batchProgress.batchId,
        }),
      });

      if (!response.ok) {
        throw new Error("CSVエクスポートに失敗しました");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const blob = new Blob([data.content], { type: "text/csv;charset=utf-8" });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = data.filename;

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }, [batchProgress?.batchId]);

  const retryBatchResult = useCallback(
    async (resultId) => {
      if (!batchProgress?.batchId) return;

      try {
        setRetryingResults((prev) => new Set([...prev, resultId]));
        setError(null);

        const response = await fetch("/api/retry-batch-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            batchResultId: resultId,
            tenantId: "t001",
          }),
        });

        if (!response.ok) {
          throw new Error("再処理に失敗しました");
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setBatchResults((prev) =>
          prev.map((result) =>
            result.id === resultId
              ? { ...result, status: "completed", error_message: null }
              : result
          )
        );
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setRetryingResults((prev) => {
          const next = new Set(prev);
          next.delete(resultId);
          return next;
        });
      }
    },
    [batchProgress?.batchId]
  );

  const searchBatchResults = useCallback(
    async (params = searchParams) => {
      try {
        setSearching(true);
        setError(null);

        const response = await fetch("/api/list-batch-results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: "t001",
            ...params,
          }),
        });

        if (!response.ok) {
          throw new Error("処理結果の検索に失敗しました");
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setSearchResults(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setSearching(false);
      }
    },
    [searchParams]
  );

  const handlePageChange = useCallback(
    (newPage) => {
      const newParams = { ...searchParams, page: newPage };
      setSearchParams(newParams);
      searchBatchResults(newParams);
    },
    [searchParams, searchBatchResults]
  );

  const fetchSavedConditions = useCallback(async () => {
    try {
      const response = await fetch("/api/saved-search-conditions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "GET",
          tenantId: "t001",
        }),
      });

      if (!response.ok) {
        throw new Error("保存された検索条件の取得に失敗しました");
      }

      const data = await response.json();
      setSavedConditions(data.conditions || []);
    } catch (err) {
      console.error(err);
      setError("保存された検索条件の取得に失敗しました");
    }
  }, []);

  useEffect(() => {
    const defaultCondition = savedConditions.find((c) => c.is_default);
    if (defaultCondition) {
      handleApplyCondition(defaultCondition);
    }
  }, [savedConditions]);

  const handleSaveCondition = useCallback(async () => {
    if (!saveName) return;

    try {
      const method = editingConditionId ? "PUT" : "POST";
      const response = await fetch("/api/saved-search-conditions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          tenantId: "t001",
          id: editingConditionId,
          name: saveName,
          type: "batch_history",
          conditions: batchHistoryParams,
          isDefault: isDefaultCondition,
        }),
      });

      if (!response.ok) {
        throw new Error("検索条件の保存に失敗しました");
      }

      setSaveModalOpen(false);
      setSaveName("");
      setEditingConditionId(null);
      setIsDefaultCondition(false);
      fetchSavedConditions();
    } catch (err) {
      console.error(err);
      setError("検索条件の保存に失敗しました");
    }
  }, [
    saveName,
    editingConditionId,
    batchHistoryParams,
    isDefaultCondition,
    fetchSavedConditions,
  ]);

  const handleApplyCondition = useCallback(
    (condition) => {
      setBatchHistoryParams(condition.conditions);
      fetchBatchHistory(condition.conditions);
    },
    [fetchBatchHistory]
  );

  const handleDeleteCondition = useCallback(
    async (id) => {
      if (!confirm("この検索条件を削除してもよろしいですか？")) {
        return;
      }

      try {
        const response = await fetch("/api/saved-search-conditions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "DELETE",
            tenantId: "t001",
            id,
          }),
        });

        if (!response.ok) {
          throw new Error("検索条件の削除に失敗しました");
        }

        fetchSavedConditions();
      } catch (err) {
        console.error(err);
        setError("検索条件の削除に失敗しました");
      }
    },
    [fetchSavedConditions]
  );

  const handleEditCondition = useCallback((condition) => {
    setSaveName(condition.name);
    setEditingConditionId(condition.id);
    setIsDefaultCondition(condition.is_default);
    setSaveModalOpen(true);
  }, []);

  const handleToggleDefault = useCallback(
    async (condition) => {
      try {
        const response = await fetch("/api/saved-search-conditions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "PUT",
            tenantId: "t001",
            id: condition.id,
            name: condition.name,
            type: condition.type,
            conditions: condition.conditions,
            isDefault: !condition.is_default,
          }),
        });

        if (!response.ok) {
          throw new Error("デフォルト設定の更新に失敗しました");
        }

        fetchSavedConditions();
      } catch (err) {
        console.error(err);
        setError("デフォルト設定の更新に失敗しました");
      }
    },
    [fetchSavedConditions]
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">OCRテンプレート管理</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">
            {isEditing ? "テンプレート編集" : "新規テンプレート作成"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                テンプレート名
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                抽出ルール (JSON)
              </label>
              <div className="mb-2 text-sm text-gray-600">
                ルールの形式:
                <ul className="list-disc ml-4">
                  <li>regex:パターン - 正規表現でマッチング</li>
                  <li>after:キーワード - キーワードの後の文字列を抽出</li>
                </ul>
              </div>
              <textarea
                className="w-full p-2 border rounded font-mono text-sm h-64"
                value={formData.schema_json}
                onChange={(e) =>
                  setFormData({ ...formData, schema_json: e.target.value })
                }
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                {isEditing ? "更新" : "作成"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ name: "", schema_json: "{}" });
                  }}
                >
                  キャンセル
                </button>
              )}
            </div>
          </form>

          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">テンプレ���トプレビュー</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  テスト用画像
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePreviewFile}
                  className="w-full"
                />
              </div>
              {previewFile && (
                <button
                  onClick={processPreview}
                  disabled={processing || uploading}
                  className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-gray-300"
                >
                  {processing || uploading ? (
                    <span>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      処理中...
                    </span>
                  ) : (
                    "プレビュー実行"
                  )}
                </button>
              )}
              {previewResult && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">抽出テキスト</h4>
                    <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-40">
                      {previewResult.rawText}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">マッピング結果</h4>
                    <div className="bg-gray-50 p-4 rounded">
                      {Object.entries(previewResult.mappedData).map(
                        ([key, value]) => (
                          <div key={key} className="flex py-1">
                            <div className="font-medium w-1/3">{key}:</div>
                            <div className="w-2/3">
                              {value || "(抽出できませんでした)"}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">テンプレート一覧</h2>
          <div className="space-y-4">
            {forms.map((form) => (
              <div key={form.id} className="border p-4 rounded">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold">{form.name}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(form)}
                      className="text-blue-500 hover:text-blue-600"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(form.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                <pre className="bg-gray-50 p-2 rounded text-sm overflow-auto">
                  {form.schema_json}
                </pre>
              </div>
            ))}
            {forms.length === 0 && (
              <div className="text-gray-500 text-center">
                テンプレートはまだありません
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">バッチ処理</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                テ���プレートを選択
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

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                処理対象ファイル
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleBatchFiles}
                className="w-full"
              />
              {batchFiles.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  {batchFiles.length}個のファイルが選択されています
                </div>
              )}
            </div>

            {selectedForm && batchFiles.length > 0 && (
              <button
                onClick={processBatch}
                disabled={batchProcessing || uploading}
                className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-gray-300"
              >
                {batchProcessing || uploading ? (
                  <span>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    処理中...
                  </span>
                ) : (
                  "バッチ処理開始"
                )}
              </button>
            )}

            {batchProgress && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded">
                  <div className="font-medium">処理状況</div>
                  <div className="mt-2">
                    処理済み: {batchProgress.processedFiles} /{" "}
                    {batchProgress.totalFiles}
                  </div>
                  <div className="w-full bg-gray-200 rounded h-2 mt-2">
                    <div
                      className="bg-blue-500 rounded h-2"
                      style={{
                        width: `${
                          (batchProgress.processedFiles /
                            batchProgress.totalFiles) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {batchResults && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">処理結果</h3>
                      <button
                        onClick={exportToCsv}
                        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 text-sm flex items-center gap-2"
                      >
                        <i className="fas fa-download"></i>
                        CSVエクスポート
                      </button>
                    </div>
                    <div className="space-y-2">
                      {batchResults.map((result) => (
                        <div
                          key={result.id}
                          className={`p-4 rounded ${
                            result.status === "completed"
                              ? "bg-green-50"
                              : result.status === "error"
                              ? "bg-red-50"
                              : "bg-gray-50"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">
                                {result.file_name}
                              </div>
                              <div className="text-sm mt-1">
                                状態: {result.status}
                              </div>
                              <div className="text-sm text-gray-500">
                                処理日時:{" "}
                                {new Date(result.created_at).toLocaleString()}
                              </div>
                            </div>
                            {result.status === "error" && (
                              <button
                                onClick={() => retryBatchResult(result.id)}
                                disabled={retryingResults.has(result.id)}
                                className="bg-yellow-500 text-white py-1 px-3 rounded hover:bg-yellow-600 disabled:bg-gray-300 text-sm flex items-center gap-1"
                              >
                                {retryingResults.has(result.id) ? (
                                  <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    再処理中...
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-redo"></i>
                                    再処理
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          {result.error_message && (
                            <div className="text-sm text-red-600 mt-1">
                              エラー: {result.error_message}
                            </div>
                          )}
                          {result.extracted_data && (
                            <div className="mt-2">
                              <div className="text-sm font-medium">
                                抽出データ:
                              </div>
                              <pre className="text-sm mt-1 overflow-auto">
                                {JSON.stringify(result.extracted_data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">バッチ処理履歴</h2>
            <div className="flex gap-2">
              <div className="relative">
                <select
                  className="w-64 p-2 border rounded"
                  onChange={(e) => {
                    const condition = savedConditions.find(
                      (c) => c.id === e.target.value
                    );
                    if (condition) {
                      handleApplyCondition(condition);
                    }
                  }}
                  value=""
                >
                  <option value="">保存した検索条件を選択</option>
                  {savedConditions.map((condition) => (
                    <option key={condition.id} value={condition.id}>
                      {condition.name}
                      {condition.is_default ? " (デフォルト)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  setSaveName("");
                  setEditingConditionId(null);
                  setIsDefaultCondition(false);
                  setSaveModalOpen(true);
                }}
                className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
              >
                <i className="fas fa-save mr-2"></i>
                現在の条件を保存
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-2">
              保存された検索条件:
            </div>
            <div className="flex flex-wrap gap-2">
              {savedConditions.map((condition) => (
                <div
                  key={condition.id}
                  className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded"
                >
                  <button
                    onClick={() => handleApplyCondition(condition)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {condition.name}
                    {condition.is_default && (
                      <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">
                        デフォルト
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleDefault(condition)}
                    className={`text-gray-500 hover:text-gray-700 ${
                      condition.is_default ? "text-yellow-500" : ""
                    }`}
                    title={
                      condition.is_default
                        ? "デフォルト解除"
                        : "デフォルトに設定"
                    }
                  >
                    <i className="fas fa-star"></i>
                  </button>
                  <button
                    onClick={() => handleEditCondition(condition)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleDeleteCondition(condition.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {batchHistory && (
              <div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          テンプレート
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ステータス
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          処理件数
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          成功/失敗
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          開始日時
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          更新日時
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {batchHistory.processes.map((process) => (
                        <tr key={process.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {process.template_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                process.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {process.status === "completed"
                                ? "完了"
                                : "処理中"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {process.processed_files} / {process.total_files}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-green-600">
                              {process.success_count}
                            </span>
                            {" / "}
                            <span className="text-red-600">
                              {process.error_count}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(process.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(process.updated_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSearchParams({
                                  ...searchParams,
                                  batchId: process.id,
                                  page: 1,
                                });
                                searchBatchResults({
                                  ...searchParams,
                                  batchId: process.id,
                                  page: 1,
                                });
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <i className="fas fa-search mr-1"></i>
                              詳細
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {batchHistory.pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBatchHistoryPageChange(1)}
                        disabled={batchHistory.pagination.page === 1}
                        className="px-3 py-1 rounded border hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <i className="fas fa-angle-double-left"></i>
                      </button>
                      <button
                        onClick={() =>
                          handleBatchHistoryPageChange(
                            batchHistory.pagination.page - 1
                          )
                        }
                        disabled={batchHistory.pagination.page === 1}
                        className="px-3 py-1 rounded border hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <i className="fas fa-angle-left"></i>
                      </button>
                      <span className="px-3 py-1">
                        {batchHistory.pagination.page} /{" "}
                        {batchHistory.pagination.totalPages}
                      </span>
                      <button
                        onClick={() =>
                          handleBatchHistoryPageChange(
                            batchHistory.pagination.page + 1
                          )
                        }
                        disabled={
                          batchHistory.pagination.page ===
                          batchHistory.pagination.totalPages
                        }
                        className="px-3 py-1 rounded border hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <i className="fas fa-angle-right"></i>
                      </button>
                      <button
                        onClick={() =>
                          handleBatchHistoryPageChange(
                            batchHistory.pagination.totalPages
                          )
                        }
                        disabled={
                          batchHistory.pagination.page ===
                          batchHistory.pagination.totalPages
                        }
                        className="px-3 py-1 rounded border hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <i className="fas fa-angle-double-right"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow col-span-2">
          <h2 className="text-2xl font-bold mb-4">処理結果検索</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                ステータス
              </label>
              <select
                className="w-full p-2 border rounded"
                value={searchParams.status}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    status: e.target.value,
                    page: 1,
                  }))
                }
              >
                <option value="">全て</option>
                <option value="completed">完了</option>
                <option value="error">エラー</option>
                <option value="pending">処理中</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                ファイル名
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={searchParams.fileName}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    fileName: e.target.value,
                    page: 1,
                  }))
                }
                placeholder="ファイル名で検索"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                開始日
              </label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={searchParams.startDate}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                    page: 1,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                終了日
              </label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={searchParams.endDate}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                    page: 1,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => searchBatchResults()}
              disabled={searching}
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              {searching ? (
                <span>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  検索中...
                </span>
              ) : (
                <span>
                  <i className="fas fa-search mr-2"></i>
                  検索
                </span>
              )}
            </button>
            <button
              onClick={() => {
                const defaultParams = {
                  status: "",
                  fileName: "",
                  startDate: "",
                  endDate: "",
                  page: 1,
                };
                setSearchParams(defaultParams);
                searchBatchResults(defaultParams);
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              <i className="fas fa-undo mr-2"></i>
              リセット
            </button>
          </div>

          {searchResults && (
            <div>
              <div className="space-y-2">
                {searchResults.results.map((result) => (
                  <div
                    key={result.id}
                    className={`p-4 rounded ${
                      result.status === "completed"
                        ? "bg-green-50"
                        : result.status === "error"
                        ? "bg-red-50"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{result.file_name}</div>
                        <div className="text-sm mt-1">
                          状態: {result.status}
                        </div>
                        <div className="text-sm text-gray-500">
                          処理日時:{" "}
                          {new Date(result.created_at).toLocaleString()}
                        </div>
                      </div>
                      {result.status === "error" && (
                        <button
                          onClick={() => retryBatchResult(result.id)}
                          disabled={retryingResults.has(result.id)}
                          className="bg-yellow-500 text-white py-1 px-3 rounded hover:bg-yellow-600 disabled:bg-gray-300 text-sm flex items-center gap-1"
                        >
                          {retryingResults.has(result.id) ? (
                            <>
                              <i className="fas fa-spinner fa-spin"></i>
                              再処理中...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-redo"></i>
                              再処理
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {result.error_message && (
                      <div className="text-sm text-red-600 mt-1">
                        エラー: {result.error_message}
                      </div>
                    )}
                    {result.extracted_data && (
                      <div className="mt-2">
                        <div className="text-sm font-medium">抽出データ:</div>
                        <pre className="text-sm mt-1 overflow-auto">
                          {JSON.stringify(result.extracted_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {searchResults.pagination.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={searchResults.pagination.page === 1}
                      className="px-3 py-1 rounded border hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <i className="fas fa-angle-double-left"></i>
                    </button>
                    <button
                      onClick={() =>
                        handlePageChange(searchResults.pagination.page - 1)
                      }
                      disabled={searchResults.pagination.page === 1}
                      className="px-3 py-1 rounded border hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <i className="fas fa-angle-left"></i>
                    </button>
                    <span className="px-3 py-1">
                      {searchResults.pagination.page} /{" "}
                      {searchResults.pagination.totalPages}
                    </span>
                    <button
                      onClick={() =>
                        handlePageChange(searchResults.pagination.page + 1)
                      }
                      disabled={
                        searchResults.pagination.page ===
                        searchResults.pagination.totalPages
                      }
                      className="px-3 py-1 rounded border hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <i className="fas fa-angle-right"></i>
                    </button>
                    <button
                      onClick={() =>
                        handlePageChange(searchResults.pagination.totalPages)
                      }
                      disabled={
                        searchResults.pagination.page ===
                        searchResults.pagination.totalPages
                      }
                      className="px-3 py-1 rounded border hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <i className="fas fa-angle-double-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {saveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold mb-4">
              {editingConditionId ? "検索条件を編集" : "検索条件を保存"}
            </h3>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                名前
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="検索条件の名前を入力"
              />
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={isDefaultCondition}
                  onChange={(e) => setIsDefaultCondition(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span>デフォルトの検索条件として設定</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setSaveModalOpen(false);
                  setSaveName("");
                  setEditingConditionId(null);
                  setIsDefaultCondition(false);
                }}
                className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveCondition}
                disabled={!saveName}
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainComponent;