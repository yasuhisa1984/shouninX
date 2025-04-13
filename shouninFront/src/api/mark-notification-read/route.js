async function handler({ notificationIds, tenantId }) {
  if (!notificationIds || !tenantId) {
    return { error: "Notification IDs and tenant ID are required" };
  }

  const ids = Array.isArray(notificationIds)
    ? notificationIds
    : [notificationIds];
  const now = new Date().toISOString();

  const result = await sql`
    UPDATE notifications 
    SET read = true, 
        read_at = ${now}
    WHERE id = ANY(${ids})
    RETURNING id, read, read_at
  `;

  return {
    success: true,
    updatedNotifications: result,
  };
}