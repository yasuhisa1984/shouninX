async function handler({ method, tenantId, body }) {
  if (!tenantId) {
    return { error: "Tenant ID is required" };
  }

  const session = getSession();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  if (method === "GET") {
    if (body?.listUsers) {
      const users = await sql`
        SELECT 
          u.email,
          u.name as display_name,
          p.department,
          p.position,
          p.contact_info
        FROM auth_users u
        LEFT JOIN user_profiles p ON u.email = p.user_id
        WHERE p.tenant_id = ${tenantId}
        ORDER BY u.name
      `;
      return { users };
    }

    const [profile] = await sql`
      SELECT 
        u.email,
        u.name as display_name,
        p.department,
        p.position,
        p.contact_info
      FROM auth_users u
      LEFT JOIN user_profiles p ON u.email = p.user_id
      WHERE u.email = ${session.user.email}
      AND p.tenant_id = ${tenantId}
    `;

    return { profile };
  }

  if (method === "PUT") {
    if (!body) {
      return { error: "Request body is required" };
    }

    const { displayName, department, position, contactInfo } = body;

    const [updatedProfile] = await sql.transaction(async (sql) => {
      await sql`
        UPDATE auth_users 
        SET name = ${displayName}
        WHERE email = ${session.user.email}
      `;

      const [profile] = await sql`
        INSERT INTO user_profiles (
          tenant_id,
          user_id,
          department,
          position,
          contact_info
        )
        VALUES (
          ${tenantId},
          ${session.user.email},
          ${department},
          ${position},
          ${contactInfo}
        )
        ON CONFLICT (tenant_id, user_id) 
        DO UPDATE SET
          department = EXCLUDED.department,
          position = EXCLUDED.position,
          contact_info = EXCLUDED.contact_info
        RETURNING *
      `;

      return [profile];
    });

    return { profile: updatedProfile };
  }

  return { error: "Method not allowed" };
}