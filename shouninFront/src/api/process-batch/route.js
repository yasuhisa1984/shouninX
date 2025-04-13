async function handler() {
  try {
    const pendingResults = await sql`
      SELECT br.*, bp.template_id, ot.rules
      FROM batch_results br
      JOIN batch_processes bp ON br.batch_id = bp.id
      JOIN ocr_templates ot ON bp.template_id = ot.id
      WHERE br.status = 'pending'
      LIMIT 1
    `;

    if (pendingResults.length === 0) {
      return { status: "no_pending_tasks" };
    }

    const result = pendingResults[0];

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
                  url: result.file_name,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!visionResponse.ok) {
      throw new Error("Vision API request failed");
    }

    const visionData = await visionResponse.json();
    const extractedText = visionData.choices[0].message.content;

    const rules = JSON.parse(result.rules);
    const extractedData = {};

    for (const [field, pattern] of Object.entries(rules)) {
      const regex = new RegExp(pattern);
      const match = extractedText.match(regex);
      extractedData[field] = match ? match[1] : null;
    }

    await sql`
      UPDATE batch_results 
      SET 
        status = 'completed',
        raw_text = ${extractedText},
        extracted_data = ${JSON.stringify(extractedData)},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${result.id}
    `;

    await sql`
      UPDATE batch_processes
      SET 
        processed_files = processed_files + 1,
        status = CASE 
          WHEN processed_files + 1 >= total_files THEN 'completed'
          ELSE status 
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${result.batch_id}
    `;

    return {
      status: "success",
      resultId: result.id,
      extractedData,
    };
  } catch (error) {
    if (error.resultId) {
      await sql`
        UPDATE batch_results
        SET 
          status = 'error',
          error_message = ${error.message},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${error.resultId}
      `;
    }

    return {
      status: "error",
      error: error.message,
    };
  }
}