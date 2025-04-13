async function handler({ method, body, query, tenantId }) {
  switch (method) {
    case "GET": {
      const requests = await sql`
        SELECT 
          r.*,
          f.name as form_name,
          f.schema_json as form_schema
        FROM requests r
        JOIN forms f ON r.form_id = f.id
        WHERE r.tenant_id = ${tenantId}
        ORDER BY r.created_at DESC
      `;
      return { requests };
    }

    case "POST": {
      const { formId, dataJson } = body;
      const request = await sql`
        INSERT INTO requests (
          tenant_id,
          form_id,
          data_json
        ) VALUES (
          ${tenantId},
          ${formId},
          ${dataJson}
        )
        RETURNING *
      `;
      return { request: request[0] };
    }

    case "PUT": {
      const { requestId, status, currentStep, dataJson } = body;

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (status) {
        updates.push(`status = $${paramCount}`);
        values.push(status);
        paramCount++;
      }

      if (currentStep) {
        updates.push(`current_step = $${paramCount}`);
        values.push(currentStep);
        paramCount++;
      }

      if (dataJson) {
        updates.push(`data_json = $${paramCount}`);
        values.push(dataJson);
        paramCount++;
      }

      values.push(requestId);
      values.push(tenantId);

      const request = await sql(
        `UPDATE requests 
        SET ${updates.join(", ")}, 
        updated_at = CURRENT_TIMESTAMP 
        WHERE id = $${paramCount} 
        AND tenant_id = $${paramCount + 1}
        RETURNING *`,
        values
      );

      return { request: request[0] };
    }

    default:
      return null;
  }
}