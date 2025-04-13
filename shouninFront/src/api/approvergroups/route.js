async function handler({
  method,
  tenantId,
  groupId,
  name,
  description,
  members,
  userId,
}) {
  if (!tenantId) {
    return { error: "テナントIDが必要です" };
  }

  try {
    switch (method) {
      case "GET": {
        const groups = await sql`
          SELECT 
            ag.*,
            COALESCE(
              json_agg(
                json_build_object(
                  'user_id', agm.user_id
                )
              ) FILTER (WHERE agm.user_id IS NOT NULL),
              '[]'
            ) as members
          FROM approver_groups ag
          LEFT JOIN approver_group_members agm ON ag.id = agm.group_id
          WHERE ag.tenant_id = ${tenantId}
          GROUP BY ag.id
          ORDER BY ag.created_at DESC
        `;
        return { groups };
      }

      case "POST": {
        if (!name) {
          return { error: "グループ名が必要です" };
        }

        const result = await sql.transaction(async (sql) => {
          const [group] = await sql`
            INSERT INTO approver_groups (tenant_id, name, description)
            VALUES (${tenantId}, ${name}, ${description})
            RETURNING *
          `;

          if (members && members.length > 0) {
            await sql`
              INSERT INTO approver_group_members (group_id, user_id)
              SELECT ${group.id}, unnest(${members}::text[])
            `;
          }

          return group;
        });

        return { group: result };
      }

      case "PUT": {
        if (!groupId) {
          return { error: "グループIDが必要です" };
        }

        const result = await sql.transaction(async (sql) => {
          const [group] = await sql`
            UPDATE approver_groups
            SET 
              name = ${name},
              description = ${description}
            WHERE id = ${groupId}
            AND tenant_id = ${tenantId}
            RETURNING *
          `;

          if (members) {
            await sql`
              DELETE FROM approver_group_members
              WHERE group_id = ${groupId}
            `;

            if (members.length > 0) {
              await sql`
                INSERT INTO approver_group_members (group_id, user_id)
                SELECT ${groupId}, unnest(${members}::text[])
              `;
            }
          }

          return group;
        });

        return { group: result };
      }

      case "DELETE": {
        if (!groupId) {
          return { error: "グループIDが必要です" };
        }

        await sql`
          DELETE FROM approver_groups
          WHERE id = ${groupId}
          AND tenant_id = ${tenantId}
        `;

        return { success: true };
      }

      case "ADD_MEMBER": {
        if (!groupId || !userId) {
          return { error: "グループIDとユーザーIDが必要です" };
        }

        const [member] = await sql`
          INSERT INTO approver_group_members (group_id, user_id)
          VALUES (${groupId}, ${userId})
          RETURNING *
        `;

        return { member };
      }

      case "REMOVE_MEMBER": {
        if (!groupId || !userId) {
          return { error: "グループIDとユーザーIDが必要です" };
        }

        await sql`
          DELETE FROM approver_group_members
          WHERE group_id = ${groupId}
          AND user_id = ${userId}
        `;

        return { success: true };
      }

      default:
        return { error: "無効なメソッドです" };
    }
  } catch (error) {
    console.error("承認者グループ管理エラー:", error);
    return { error: "操作に失敗しました" };
  }
}