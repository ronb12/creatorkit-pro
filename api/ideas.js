const { ensureSchema, getSql, json, readBody, seed } = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const payload = await readBody(req);
    if (!payload.title || !payload.platform || !payload.hook || !payload.status || !payload.dueDate) {
      json(res, 400, { error: "Missing required fields" });
      return;
    }

    const sql = getSql();
    await ensureSchema(sql);
    await seed(sql);

    const [idea] = await sql`
      INSERT INTO content_ideas (title, platform, hook, status, due_date)
      VALUES (${payload.title}, ${payload.platform}, ${payload.hook}, ${payload.status}, ${payload.dueDate})
      RETURNING *
    `;

    json(res, 201, { idea });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
};
