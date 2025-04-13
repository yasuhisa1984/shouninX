"use client";
import React from "react";

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
    let content;
    let type;
    let filename;

    if (format === "csv") {
      const items = Object.entries(JSON.parse(data.extracted_data));
      content = items.map(([key, value]) => `${key},${value}`).join("\n");
      type = "text/csv";
      filename = `ocr-result-${data.id}.csv`;
    } else {
      content = JSON.stringify(JSON.parse(data.extracted_data), null, 2);
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
  };

  if (loading) {
    return <></>;
  }

  return <></>;
}

export default MainComponent;