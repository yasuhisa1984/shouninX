async function handler({ method, body, tenant_id, id }) {
  switch (method) {
    case "GET":
      const forms = await sql`
        SELECT * FROM forms 
        WHERE tenant_id = ${tenant_id} 
        ORDER BY created_at DESC
      `;
      return { forms };

    case "POST":
      const { name, schema_json } = body;
      const [newForm] = await sql`
        INSERT INTO forms (tenant_id, name, schema_json)
        VALUES (${tenant_id}, ${name}, ${schema_json})
        RETURNING *
      `;
      return { form: newForm };

    case "PUT":
      const { name: updatedName, schema_json: updatedSchema } = body;
      const [updatedForm] = await sql`
        UPDATE forms 
        SET name = ${updatedName}, 
            schema_json = ${updatedSchema}
        WHERE id = ${id} 
        AND tenant_id = ${tenant_id}
        RETURNING *
      `;
      return { form: updatedForm };

    default:
      return null;
  }
}