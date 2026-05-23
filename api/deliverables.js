const { ensureSchema, getSql, json, readBody, seed } = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const payload = await readBody(req);
    if (!payload.label || !payload.channel || !payload.status || !payload.publishDate) {
      json(res, 400, { error: "Missing required fields" });
      return;
    }

    const sql = getSql();
    await ensureSchema(sql);
    await seed(sql);

    const [deliverable] = await sql`
      INSERT INTO deliverables (campaign_id, label, channel, status, publish_date)
      VALUES (
        ${payload.campaignId || null},
        ${payload.label},
        ${payload.channel},
        ${payload.status},
        ${payload.publishDate}
      )
      RETURNING *
    `;

    json(res, 201, { deliverable });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
};
