async function handler({
  method,
  tenantId,
  id,
  type,
  name,
  conditions,
  isDefault,
}) {
  if (!tenantId) {
    return { error: "Tenant ID is required" };
  }

  // デフォルト設定を更新する関数
  async function updateDefaultStatus(conditionId, shouldBeDefault, client) {
    if (shouldBeDefault) {
      // 同じタイプの他のデフォルトをfalseに設定
      await client`
        UPDATE saved_search_conditions 
        SET is_default = false 
        WHERE tenant_id = ${tenantId} 
        AND type = ${type} 
        AND id != ${conditionId}
      `;
    }

    // 指定された条件のデフォルト状態を更新
    await client`
      UPDATE saved_search_conditions 
      SET is_default = ${shouldBeDefault} 
      WHERE id = ${conditionId} 
      AND tenant_id = ${tenantId}
    `;
  }

  if (method === "GET" && id) {
    const [condition] = await sql`
      SELECT * FROM saved_search_conditions 
      WHERE id = ${id} 
      AND tenant_id = ${tenantId}
    `;

    return condition
      ? { condition }
      : { error: "Saved search condition not found" };
  }

  if (method === "GET") {
    const conditions = await sql`
      SELECT * FROM saved_search_conditions 
      WHERE tenant_id = ${tenantId} 
      ORDER BY is_default DESC, created_at DESC
    `;

    return { conditions };
  }

  if (method === "POST") {
    if (!name || !type || !conditions) {
      return { error: "Name, type, and conditions are required" };
    }

    // トランザクションを使用して、デフォルト設定を安全に処理
    const savedCondition = await sql.begin(async (sql) => {
      const [condition] = await sql`
        INSERT INTO saved_search_conditions (
          tenant_id, 
          name, 
          type, 
          conditions,
          is_default
        )
        VALUES (
          ${tenantId}, 
          ${name}, 
          ${type}, 
          ${conditions},
          ${isDefault || false}
        )
        RETURNING *
      `;

      if (isDefault) {
        await updateDefaultStatus(condition.id, true, sql);
      }

      return condition;
    });

    return { condition: savedCondition };
  }

  if (method === "PUT") {
    if (!id || !name || !type || !conditions) {
      return { error: "ID, name, type, and conditions are required" };
    }

    // トランザクションを使用して、デフォルト設定を安全に処理
    const updatedCondition = await sql
      .begin(async (sql) => {
        const [condition] = await sql`
        UPDATE saved_search_conditions 
        SET 
          name = ${name},
          type = ${type},
          conditions = ${conditions},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id} 
        AND tenant_id = ${tenantId}
        RETURNING *
      `;

        if (!condition) {
          throw new Error("Saved search condition not found");
        }

        // デフォルト状態が変更された場合のみ更新
        if (isDefault !== undefined && condition.is_default !== isDefault) {
          await updateDefaultStatus(condition.id, isDefault, sql);
        }

        // 最新の状態を取得
        const [updated] = await sql`
        SELECT * FROM saved_search_conditions
        WHERE id = ${id}
      `;

        return updated;
      })
      .catch((error) => {
        throw error;
      });

    return updatedCondition
      ? { condition: updatedCondition }
      : { error: "Saved search condition not found" };
  }

  if (method === "DELETE") {
    if (!id) {
      return { error: "ID is required" };
    }

    const [deletedCondition] = await sql`
      DELETE FROM saved_search_conditions 
      WHERE id = ${id} 
      AND tenant_id = ${tenantId}
      RETURNING *
    `;

    return deletedCondition
      ? { message: "Saved search condition deleted successfully" }
      : { error: "Saved search condition not found" };
  }

  return { error: "Invalid method" };
}