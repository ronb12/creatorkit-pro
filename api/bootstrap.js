const { ensureSchema, getSql, json, seed } = require("./_db");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const sql = getSql();
    await ensureSchema(sql);
    await seed(sql);

    const [ideas, campaigns, deliverables] = await Promise.all([
      sql`SELECT * FROM content_ideas ORDER BY due_date ASC, created_at DESC`,
      sql`SELECT * FROM campaigns ORDER BY due_date ASC, created_at DESC`,
      sql`
        SELECT deliverables.*, campaigns.brand
        FROM deliverables
        LEFT JOIN campaigns ON campaigns.id = deliverables.campaign_id
        ORDER BY publish_date ASC, deliverables.created_at DESC
      `,
    ]);

    const pipelineValue = campaigns.reduce((sum, campaign) => sum + Number(campaign.value), 0);
    const dueThisWeek = ideas.filter((idea) => {
      const due = new Date(idea.due_date);
      const now = new Date();
      const diff = due.getTime() - now.getTime();
      return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    json(res, 200, {
      ideas,
      campaigns,
      deliverables,
      stats: {
        totalIdeas: ideas.length,
        pipelineValue,
        activeCampaigns: campaigns.filter((campaign) => campaign.stage !== "Closed").length,
        dueThisWeek,
      },
    });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
};
