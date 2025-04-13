async function handler({ batchId }) {
  if (!batchId) {
    return { error: "バッチIDが必要です" };
  }

  try {
    const results = await sql`
      SELECT 
        br.file_name,
        br.status,
        br.extracted_data,
        br.error_message,
        br.created_at
      FROM batch_results br
      WHERE br.batch_id = ${batchId}
      ORDER BY br.created_at ASC
    `;

    if (results.length === 0) {
      return { error: "バッチ処理結果が見つかりません" };
    }

    const headers = [
      "ファイル名",
      "ステータス",
      "抽出データ",
      "エラーメッセージ",
      "作成日時",
    ];

    const rows = results.map((result) => [
      result.file_name,
      result.status,
      result.extracted_data ? JSON.stringify(result.extracted_data) : "",
      result.error_message || "",
      new Date(result.created_at).toLocaleString("ja-JP"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const bom = "\uFEFF";
    const csvWithBom = bom + csvContent;

    return {
      content: csvWithBom,
      filename: `batch-results-${batchId}-${
        new Date().toISOString().split("T")[0]
      }.csv`,
      contentType: "text/csv",
    };
  } catch (error) {
    console.error("CSV出力エラー:", error);
    return { error: "CSV出力中にエラーが発生しました" };
  }
}