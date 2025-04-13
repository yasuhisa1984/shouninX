async function handler({
  tenantId,
  templateId,
  status,
  startDate,
  endDate,
  page = 1,
  limit = 10,
}) {
  if (!tenantId) {
    return { error: "Tenant ID is required" };
  }

  try {
    let queryStr = `
      SELECT 
        bp.id,
        bp.status,
        bp.total_files,
        bp.processed_files,
        bp.created_at,
        bp.updated_at,
        ot.name as template_name,
        COUNT(CASE WHEN br.status = 'success' THEN 1 END) as success_count,
        COUNT(CASE WHEN br.status = 'error' THEN 1 END) as error_count
      FROM batch_processes bp
      JOIN ocr_templates ot ON bp.template_id = ot.id
      LEFT JOIN batch_results br ON bp.id = br.batch_id
      WHERE bp.tenant_id = $1
    `;

    const values = [tenantId];
    let paramCount = 1;

    if (templateId) {
      paramCount++;
      queryStr += ` AND bp.template_id = $${paramCount}`;
      values.push(templateId);
    }

    if (status) {
      paramCount++;
      queryStr += ` AND bp.status = $${paramCount}`;
      values.push(status);
    }

    if (startDate) {
      paramCount++;
      queryStr += ` AND bp.created_at >= $${paramCount}`;
      values.push(startDate);
    }

    if (endDate) {
      paramCount++;
      queryStr += ` AND bp.created_at <= $${paramCount}`;
      values.push(endDate);
    }

    queryStr += ` GROUP BY bp.id, bp.status, bp.total_files, bp.processed_files, bp.created_at, bp.updated_at, ot.name`;
    queryStr += ` ORDER BY bp.created_at DESC`;

    const offset = (page - 1) * limit;
    paramCount++;
    queryStr += ` LIMIT $${paramCount}`;
    values.push(limit);

    paramCount++;
    queryStr += ` OFFSET $${paramCount}`;
    values.push(offset);

    const processes = await sql(queryStr, values);

    const countQuery = `
      SELECT COUNT(DISTINCT bp.id) 
      FROM batch_processes bp 
      WHERE bp.tenant_id = $1
      ${templateId ? " AND bp.template_id = $2" : ""}
      ${status ? ` AND bp.status = $${templateId ? 3 : 2}` : ""}
    `;

    const countValues = [tenantId];
    if (templateId) countValues.push(templateId);
    if (status) countValues.push(status);

    const [{ count }] = await sql(countQuery, countValues);

    return {
      processes,
      pagination: {
        total: parseInt(count),
        page,
        limit,
        totalPages: Math.ceil(parseInt(count) / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching batch processes:", error);
    return { error: "Failed to fetch batch processes" };
  }
}