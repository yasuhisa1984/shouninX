async function handler({
  method,
  tenantId,
  userId,
  delegateUserId,
  validFrom,
  validUntil,
  delegateId,
}) {
  if (!tenantId) {
    return { error: "Tenant ID is required" };
  }

  if (method === "GET") {
    const currentTime = new Date().toISOString();
    const delegates = await sql`
      SELECT * FROM approval_delegates 
      WHERE tenant_id = ${tenantId}
      AND (${userId} IS NULL OR user_id = ${userId})
      ORDER BY valid_from ASC
    `;

    return { delegates };
  }

  if (method === "POST") {
    if (!userId || !delegateUserId || !validFrom || !validUntil) {
      return { error: "Missing required fields" };
    }

    const validFromDate = new Date(validFrom);
    const validUntilDate = new Date(validUntil);

    if (validFromDate >= validUntilDate) {
      return { error: "Valid from date must be before valid until date" };
    }

    const delegate = await sql`
      INSERT INTO approval_delegates (
        tenant_id, 
        user_id, 
        delegate_user_id, 
        valid_from, 
        valid_until
      )
      VALUES (
        ${tenantId}, 
        ${userId}, 
        ${delegateUserId}, 
        ${validFrom}, 
        ${validUntil}
      )
      RETURNING *
    `;

    return { delegate: delegate[0] };
  }

  if (method === "DELETE") {
    if (!delegateId) {
      return { error: "Delegate ID is required" };
    }

    await sql`
      DELETE FROM approval_delegates 
      WHERE id = ${delegateId} 
      AND tenant_id = ${tenantId}
    `;

    return { success: true };
  }

  if (method === "PUT") {
    if (!userId) {
      return { error: "User ID is required" };
    }

    const currentTime = new Date().toISOString();
    const activeDelegate = await sql`
      SELECT * FROM approval_delegates 
      WHERE tenant_id = ${tenantId}
      AND user_id = ${userId}
      AND valid_from <= ${currentTime}
      AND valid_until >= ${currentTime}
      LIMIT 1
    `;

    return {
      hasActiveDelegate: activeDelegate.length > 0,
      activeDelegate: activeDelegate[0] || null,
    };
  }

  return { error: "Invalid method" };
}