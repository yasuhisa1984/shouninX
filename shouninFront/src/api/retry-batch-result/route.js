async function handler({ batchResultId, tenantId }) {
  if (!batchResultId || !tenantId) {
    return { error: "バッチ結果IDとテナントIDは必須です" };
  }

  try {
    const [batchResult] = await sql`
      SELECT br.*, bp.template_id
      FROM batch_results br
      JOIN batch_processes bp ON br.batch_id = bp.id
      WHERE br.id = ${batchResultId}
    `;

    if (!batchResult) {
      return { error: "バッチ結果が見つかりません" };
    }

    const visionResponse = await fetch("/integrations/gpt-vision/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "画像から全てのテキストを抽出してください。",
              },
              {
                type: "image_url",
                image_url: {
                  url: batchResult.file_name,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!visionResponse.ok) {
      throw new Error("OCR処理に失敗しました");
    }

    const visionData = await visionResponse.json();
    const extractedText = visionData.choices[0].message.content;

    await sql`
      UPDATE batch_results
      SET 
        status = 'completed',
        raw_text = ${extractedText},
        extracted_data = ${JSON.stringify({ text: extractedText })},
        error_message = null,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${batchResultId}
    `;

    await sql`
      INSERT INTO activity_logs (
        tenant_id,
        action_type,
        actor_id,
        details
      ) VALUES (
        ${tenantId},
        'batch_result_retry',
        'system',
        ${JSON.stringify({ batchResultId })}
      )
    `;

    return {
      success: true,
      batchResultId,
      status: "completed",
    };
  } catch (error) {
    await sql`
      UPDATE batch_results
      SET 
        status = 'failed',
        error_message = ${error.message},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${batchResultId}
    `;

    return {
      error: "再処理に失敗しました",
      details: error.message,
    };
  }
}