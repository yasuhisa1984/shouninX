async function handler({ method, id, tenantId, body }) {
  if (!tenantId) {
    return { error: "Tenant ID is required" };
  }

  if (method === "GET" && id) {
    const [approvalStep] = await sql`
      SELECT 
        approval_steps.*,
        requests.data_json as request_data,
        forms.name as form_name,
        forms.schema_json as form_schema
      FROM approval_steps
      JOIN requests ON approval_steps.request_id = requests.id
      JOIN forms ON requests.form_id = forms.id
      WHERE approval_steps.id = ${id}
      AND approval_steps.tenant_id = ${tenantId}
    `;

    if (!approvalStep) {
      return { error: "Approval step not found" };
    }

    return { approvalStep };
  }

  if (method === "GET") {
    const pendingApprovals = await sql`
      SELECT 
        approval_steps.*,
        requests.data_json as request_data,
        forms.name as form_name,
        forms.schema_json as form_schema
      FROM approval_steps
      JOIN requests ON approval_steps.request_id = requests.id
      JOIN forms ON requests.form_id = forms.id
      WHERE approval_steps.tenant_id = ${tenantId}
      AND approval_steps.status = 'pending'
      ORDER BY approval_steps.created_at ASC
    `;

    return { approvals: pendingApprovals };
  }

  if (method === "POST") {
    if (!body?.stepId || !body?.status || !body?.approverId) {
      return { error: "Step ID, status and approver ID are required" };
    }

    if (!["approved", "rejected"].includes(body.status)) {
      return { error: "Invalid status. Must be 'approved' or 'rejected'" };
    }

    const [updatedStep] = await sql.transaction(async (sql) => {
      const [step] = await sql`
        UPDATE approval_steps
        SET 
          status = ${body.status},
          approver_id = ${body.approverId},
          comment = ${body.comment || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${body.stepId}
        AND tenant_id = ${tenantId}
        RETURNING *
      `;

      if (!step) {
        throw new Error("Approval step not found");
      }

      if (body.status === "approved") {
        await sql`
          UPDATE requests
          SET 
            current_step = current_step + 1,
            status = CASE 
              WHEN current_step >= (
                SELECT COUNT(*) 
                FROM approval_steps 
                WHERE request_id = ${step.request_id}
              ) THEN 'completed'
              ELSE 'pending'
            END
          WHERE id = ${step.request_id}
        `;
      } else {
        await sql`
          UPDATE requests
          SET status = 'rejected'
          WHERE id = ${step.request_id}
        `;
      }

      await sql`
        INSERT INTO activity_logs (
          tenant_id,
          request_id,
          action_type,
          actor_id,
          details
        )
        VALUES (
          ${tenantId},
          ${step.request_id},
          ${body.status === "approved" ? "approval" : "rejection"},
          ${body.approverId},
          ${JSON.stringify({ comment: body.comment })}
        )
      `;

      return [step];
    });

    return { step: updatedStep };
  }

  return { error: "Method not allowed" };
}