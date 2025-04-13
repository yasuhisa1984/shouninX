async function handler({
  userId,
  emailNotifications,
  systemNotifications,
  deadlineAlerts,
}) {
  if (!userId) {
    return { error: "User ID is required" };
  }

  try {
    const result = await sql`
      INSERT INTO notification_preferences (
        user_id, 
        email_notifications, 
        system_notifications, 
        deadline_alerts
      )
      VALUES (
        ${userId}, 
        ${emailNotifications}, 
        ${systemNotifications}, 
        ${deadlineAlerts}
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET
        email_notifications = ${emailNotifications},
        system_notifications = ${systemNotifications},
        deadline_alerts = ${deadlineAlerts},
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    return { success: true, preferences: result[0] };
  } catch (error) {
    return { error: "Failed to update notification preferences" };
  }
}