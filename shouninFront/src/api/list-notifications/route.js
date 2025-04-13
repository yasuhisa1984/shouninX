async function handler({ readStatus, type, page = 1, limit = 10, userId }) {
  const offset = (page - 1) * limit;
  let queryParams = [];
  let conditions = ["1=1"];
  let paramCount = 1;

  if (userId) {
    conditions.push(`user_id = $${paramCount}`);
    queryParams.push(userId);
    paramCount++;
  }

  if (readStatus !== undefined) {
    conditions.push(`read = $${paramCount}`);
    queryParams.push(readStatus);
    paramCount++;
  }

  if (type) {
    conditions.push(`type = $${paramCount}`);
    queryParams.push(type);
    paramCount++;
  }

  const whereClause = conditions.join(" AND ");

  const [notifications, countResult] = await sql.transaction([
    sql(
      `
      SELECT * FROM notifications 
      WHERE ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `,
      [...queryParams, limit, offset]
    ),

    sql(
      `
      SELECT COUNT(*) as total 
      FROM notifications 
      WHERE ${whereClause}
    `,
      queryParams
    ),
  ]);

  const total = parseInt(countResult[0].total);
  const totalPages = Math.ceil(total / limit);

  return {
    notifications,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
    },
  };
}