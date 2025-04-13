async function handler({ method, id, tenantId, body }) {
  if (!tenantId) {
    return { error: "Tenant ID is required" };
  }

  if (method === "GET" && id) {
    const [document] = await sql`
      SELECT * FROM ocr_documents 
      WHERE id = ${id} 
      AND tenant_id = ${tenantId}
    `;

    if (!document) {
      return { error: "Document not found" };
    }

    return { document };
  }

  if (method === "GET") {
    const documents = await sql`
      SELECT * FROM ocr_documents 
      WHERE tenant_id = ${tenantId} 
      ORDER BY created_at DESC
    `;

    return { documents };
  }

  if (method === "POST") {
    if (!body?.file) {
      return { error: "File is required" };
    }

    const { url, error: uploadError } = await upload({
      base64: body.file,
    });

    if (uploadError) {
      return { error: uploadError };
    }

    const rawText = "Sample extracted text";
    const extractedData = { text: rawText };

    const [document] = await sql`
      INSERT INTO ocr_documents (
        tenant_id, 
        filename,
        raw_text,
        extracted_data
      )
      VALUES (
        ${tenantId},
        ${url},
        ${rawText},
        ${JSON.stringify(extractedData)}
      )
      RETURNING *
    `;

    return { document };
  }

  return { error: "Method not allowed" };
}