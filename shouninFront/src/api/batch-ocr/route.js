async function handler({ method, tenantId, templateId, fileUrls, batchId }) {
  if (!tenantId) {
    return { error: "Tenant ID is required" };
  }

  if (method === "POST") {
    if (
      !templateId ||
      !fileUrls ||
      !Array.isArray(fileUrls) ||
      fileUrls.length === 0
    ) {
      return { error: "Template ID and file URLs array are required" };
    }

    const batchProcess = await sql`
      INSERT INTO batch_processes (tenant_id, template_id, total_files)
      VALUES (${tenantId}, ${templateId}, ${fileUrls.length})
      RETURNING *
    `;

    const batchResults = await Promise.all(
      fileUrls.map(async (fileUrl) => {
        const result = await sql`
          INSERT INTO batch_results (batch_id, file_name, status)
          VALUES (${batchProcess[0].id}, ${fileUrl}, 'pending')
          RETURNING *
        `;
        return result[0];
      })
    );

    return {
      batchId: batchProcess[0].id,
      status: batchProcess[0].status,
      totalFiles: batchProcess[0].total_files,
      processedFiles: batchProcess[0].processed_files,
      results: batchResults,
    };
  }

  if (method === "GET") {
    if (!batchId) {
      return { error: "Batch ID is required" };
    }

    const batchProcess = await sql`
      SELECT * FROM batch_processes 
      WHERE id = ${batchId} AND tenant_id = ${tenantId}
    `;

    if (batchProcess.length === 0) {
      return { error: "Batch process not found" };
    }

    const batchResults = await sql`
      SELECT * FROM batch_results 
      WHERE batch_id = ${batchId}
      ORDER BY created_at ASC
    `;

    return {
      batchId: batchProcess[0].id,
      status: batchProcess[0].status,
      totalFiles: batchProcess[0].total_files,
      processedFiles: batchProcess[0].processed_files,
      results: batchResults,
    };
  }

  return { error: "Invalid method" };
}