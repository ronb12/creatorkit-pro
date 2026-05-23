const { neon } = require("@neondatabase/serverless");

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  return neon(process.env.DATABASE_URL);
}

async function ensureSchema(sql) {
  await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
  await sql`
    CREATE TABLE IF NOT EXISTS content_ideas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      platform TEXT NOT NULL,
      hook TEXT NOT NULL,
      status TEXT NOT NULL,
      due_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      brand TEXT NOT NULL,
      value NUMERIC(10, 2) NOT NULL DEFAULT 0,
      stage TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      due_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS deliverables (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
      label TEXT NOT NULL,
      channel TEXT NOT NULL,
      status TEXT NOT NULL,
      publish_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

async function seed(sql) {
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM content_ideas`;
  if (count > 0) {
    return;
  }

  const [campaign] = await sql`
    INSERT INTO campaigns (brand, value, stage, contact_name, due_date)
    VALUES ('Northstar Hydration', 4200, 'Negotiating', 'Amaya Cruz', CURRENT_DATE + 5)
    RETURNING id
  `;

  await sql`
    INSERT INTO content_ideas (title, platform, hook, status, due_date)
    VALUES
      ('Morning routine Reel', 'Instagram Reels', 'What changed after I simplified my creator stack', 'Script Draft', CURRENT_DATE + 1),
      ('Brand case study short', 'TikTok', 'The exact pitch structure that closed a 4-figure campaign', 'Editing', CURRENT_DATE + 2),
      ('Weekly sponsor recap', 'YouTube Shorts', 'Breaking down CPM, retention, and watch-time wins', 'Scheduled', CURRENT_DATE + 4)
  `;

  await sql`
    INSERT INTO deliverables (campaign_id, label, channel, status, publish_date)
    VALUES
      (${campaign.id}, 'UGC product walkthrough', 'TikTok', 'Needs Review', CURRENT_DATE + 3),
      (${campaign.id}, 'Usage clip pack', 'Instagram Stories', 'Shot List Ready', CURRENT_DATE + 2)
  `;
}

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

module.exports = { ensureSchema, getSql, json, readBody, seed };
