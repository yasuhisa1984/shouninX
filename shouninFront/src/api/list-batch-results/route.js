async function handler({
  tenantId,
  status,
  startDate,
  endDate,
  fileName,
  page = 1,
  limit = 10,
}) {
  if (!tenantId) {
    return { error: "Tenant ID is required" };
  }

  try {
    let queryParts = ["FROM batch_results br"];
    queryParts.push("JOIN batch_processes bp ON br.batch_id = bp.id");
    queryParts.push("WHERE bp.tenant_id = $1");

    const values = [tenantId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      queryParts.push(`AND br.status = $${paramCount}`);
      values.push(status);
    }

    if (fileName) {
      paramCount++;
      queryParts.push(`AND br.file_name ILIKE $${paramCount}`);
      values.push(`%${fileName}%`);
    }

    if (startDate) {
      paramCount++;
      queryParts.push(`AND br.created_at >= $${paramCount}`);
      values.push(startDate);
    }

    if (endDate) {
      paramCount++;
      queryParts.push(`AND br.created_at <= $${paramCount}`);
      values.push(endDate);
    }

    const offset = (page - 1) * limit;
    paramCount++;
    values.push(limit);
    paramCount++;
    values.push(offset);

    const countQuery = `SELECT COUNT(*) as total ${queryParts.join(" ")}`;
    const dataQuery = `
      SELECT 
        br.id,
        br.file_name,
        br.status,
        br.raw_text,
        br.extracted_data,
        br.error_message,
        br.created_at,
        br.updated_at,
        bp.template_id
      ${queryParts.join(" ")}
      ORDER BY br.created_at DESC
      LIMIT $${paramCount - 1}
      OFFSET $${paramCount}
    `;

    const [countResult, results] = await sql.transaction([
      sql(countQuery, values),
      sql(dataQuery, values),
    ]);

    return {
      results,
      pagination: {
        total: parseInt(countResult[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(parseInt(countResult[0].total) / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching batch results:", error);
    return { error: "Failed to fetch batch results" };
  }
}