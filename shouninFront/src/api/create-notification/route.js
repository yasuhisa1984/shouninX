async function handler({ userId, type, title, content, metadata = {} }) {
  if (!userId || !type || !title || !content) {
    return { error: "Missing required fields" };
  }

  const [preferences] = await sql`
    SELECT * FROM notification_preferences 
    WHERE user_id = ${userId}
  `;

  const [user] = await sql`
    SELECT email FROM auth_users 
    WHERE id = ${userId}
  `;

  if (preferences?.system_notifications) {
    await sql`
      INSERT INTO notifications (
        user_id, type, title, content, metadata
      ) VALUES (
        ${userId}, ${type}, ${title}, ${content}, ${metadata}
      )
    `;
  }

  if (preferences?.email_notifications && user?.email) {
    const emailContent = {
      to: user.email,
      subject: title,
      text: content,
    };

    await fetch("https://api.resend.com/v1/email/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailContent),
    });
  }

  if (preferences?.deadline_alerts && metadata.deadline) {
    const deadline = new Date(metadata.deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil(
      (deadline - now) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDeadline <= 3) {
      await sql`
        INSERT INTO notifications (
          user_id, type, title, content, metadata
        ) VALUES (
          ${userId}, 
          'deadline_alert', 
          'Deadline Approaching', 
          ${`${title} is due in ${daysUntilDeadline} days`}, 
          ${metadata}
        )
      `;
    }
  }

  return { success: true };
}