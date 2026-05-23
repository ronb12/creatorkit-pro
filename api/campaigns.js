const { ensureSchema, getSql, json, readBody, seed } = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const payload = await readBody(req);
    if (!payload.brand || !payload.contactName || !payload.stage || !payload.dueDate) {
      json(res, 400, { error: "Missing required fields" });
      return;
    }

    const sql = getSql();
    await ensureSchema(sql);
    await seed(sql);

    const [campaign] = await sql`
      INSERT INTO campaigns (brand, value, stage, contact_name, due_date)
      VALUES (
        ${payload.brand},
        ${Number(payload.value || 0)},
        ${payload.stage},
        ${payload.contactName},
        ${payload.dueDate}
      )
      RETURNING *
    `;

    json(res, 201, { campaign });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
};
