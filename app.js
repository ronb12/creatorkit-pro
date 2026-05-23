(() => {
  const app = document.querySelector("#app");
  const state = {
    ideas: [],
    campaigns: [],
    deliverables: [],
    stats: {
      totalIdeas: 0,
      pipelineValue: 0,
      activeCampaigns: 0,
      dueThisWeek: 0,
    },
  };

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  function formatDate(value) {
    return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  async function request(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || "Request failed");
    }

    return response.json();
  }

  function bindForms() {
    document.querySelector("#ideaForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      await request("/api/ideas", {
        title: String(form.get("title")),
        platform: String(form.get("platform")),
        hook: String(form.get("hook")),
        status: String(form.get("status")),
        dueDate: String(form.get("dueDate")),
      });
      event.currentTarget.reset();
      await load();
    });

    document.querySelector("#campaignForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      await request("/api/campaigns", {
        brand: String(form.get("brand")),
        value: Number(form.get("value") || 0),
        stage: String(form.get("stage")),
        contactName: String(form.get("contactName")),
        dueDate: String(form.get("dueDate")),
      });
      event.currentTarget.reset();
      await load();
    });

    document.querySelector("#deliverableForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      await request("/api/deliverables", {
        campaignId: String(form.get("campaignId")) || null,
        label: String(form.get("label")),
        channel: String(form.get("channel")),
        status: String(form.get("status")),
        publishDate: String(form.get("publishDate")),
      });
      event.currentTarget.reset();
      await load();
    });
  }

  function renderCollection(items, mapper, emptyText) {
    if (!items.length) {
      return `<div class="empty">${emptyText}</div>`;
    }

    return items.map(mapper).join("");
  }

  function render() {
    app.innerHTML = `
      <section class="metrics">
        <article class="metric">
          <span class="muted">Planned content</span>
          <strong>${state.stats.totalIdeas}</strong>
          <span class="muted">Ideas and scripts in motion</span>
        </article>
        <article class="metric">
          <span class="muted">Pipeline value</span>
          <strong>${money.format(state.stats.pipelineValue)}</strong>
          <span class="muted">Across active brand campaigns</span>
        </article>
        <article class="metric">
          <span class="muted">Active campaigns</span>
          <strong>${state.stats.activeCampaigns}</strong>
          <span class="muted">Open sponsor conversations</span>
        </article>
        <article class="metric">
          <span class="muted">Due this week</span>
          <strong>${state.stats.dueThisWeek}</strong>
          <span class="muted">Upcoming content deadlines</span>
        </article>
      </section>

      <section class="board">
        <article class="panel">
          <h2>Content Pipeline</h2>
          <p class="muted">Capture hooks, assign platforms, and keep production dates visible.</p>
          <form id="ideaForm">
            <input name="title" placeholder="Content title" required>
            <textarea name="hook" placeholder="Opening hook or angle" required></textarea>
            <div class="row">
              <select name="platform">
                <option>Instagram Reels</option>
                <option>TikTok</option>
                <option>YouTube Shorts</option>
                <option>Email</option>
              </select>
              <select name="status">
                <option>Script Draft</option>
                <option>Editing</option>
                <option>Scheduled</option>
                <option>Published</option>
              </select>
            </div>
            <input name="dueDate" type="date" required>
            <button type="submit">Save content item</button>
          </form>
          <div class="collection">
            ${renderCollection(
              state.ideas,
              (idea) => `
                <div class="card">
                  <strong>${idea.title}</strong>
                  <span class="pill">${idea.platform}</span>
                  <p>${idea.hook}</p>
                  <span class="muted">${idea.status} • due ${formatDate(idea.due_date)}</span>
                </div>
              `,
              "No ideas are in the production queue yet."
            )}
          </div>
        </article>

        <article class="panel">
          <h2>Brand Campaigns</h2>
          <p class="muted">Track deal stage, owner contact, deadline, and pipeline value.</p>
          <form id="campaignForm">
            <div class="row">
              <input name="brand" placeholder="Brand name" required>
              <input name="contactName" placeholder="Primary contact" required>
            </div>
            <div class="row">
              <input name="value" type="number" min="0" placeholder="Campaign value">
              <input name="dueDate" type="date" required>
            </div>
            <select name="stage">
              <option>Researching</option>
              <option>Pitch Sent</option>
              <option>Negotiating</option>
              <option>Contract Review</option>
              <option>Closed</option>
            </select>
            <button type="submit">Add campaign</button>
          </form>
          <div class="collection">
            ${renderCollection(
              state.campaigns,
              (campaign) => `
                <div class="card">
                  <strong>${campaign.brand}</strong>
                  <span class="pill">${campaign.stage}</span>
                  <p>${money.format(campaign.value)} • contact ${campaign.contact_name}</p>
                  <span class="muted">Decision target ${formatDate(campaign.due_date)}</span>
                </div>
              `,
              "No campaigns are being tracked yet."
            )}
          </div>
        </article>

        <article class="panel">
          <h2>Deliverables</h2>
          <p class="muted">Keep sponsored clips, cutdowns, and publish dates tied to live campaigns.</p>
          <form id="deliverableForm">
            <select name="campaignId">
              <option value="">Standalone deliverable</option>
              ${state.campaigns
                .map((campaign) => `<option value="${campaign.id}">${campaign.brand}</option>`)
                .join("")}
            </select>
            <input name="label" placeholder="Deliverable name" required>
            <div class="row">
              <select name="channel">
                <option>TikTok</option>
                <option>Instagram Stories</option>
                <option>Instagram Reels</option>
                <option>YouTube Shorts</option>
              </select>
              <select name="status">
                <option>Shot List Ready</option>
                <option>Needs Review</option>
                <option>Scheduled</option>
                <option>Delivered</option>
              </select>
            </div>
            <input name="publishDate" type="date" required>
            <button type="submit">Add deliverable</button>
          </form>
          <div class="collection">
            ${renderCollection(
              state.deliverables,
              (item) => `
                <div class="card">
                  <strong>${item.label}</strong>
                  <span class="pill">${item.channel}</span>
                  <p>${item.brand || "Standalone"} • ${item.status}</p>
                  <span class="muted">Publish ${formatDate(item.publish_date)}</span>
                </div>
              `,
              "No deliverables are queued yet."
            )}
          </div>
        </article>
      </section>
    `;

    bindForms();
  }

  async function load() {
    app.innerHTML = '<div class="loading-card">Refreshing creator workspace...</div>';
    const response = await fetch("/api/bootstrap");
    if (!response.ok) {
      throw new Error("Failed to load CreatorKit Pro");
    }

    const payload = await response.json();
    state.ideas = payload.ideas;
    state.campaigns = payload.campaigns;
    state.deliverables = payload.deliverables;
    state.stats = payload.stats;
    render();
  }

  load().catch((error) => {
    app.innerHTML = `<div class="loading-card">CreatorKit Pro could not load: ${error.message}</div>`;
  });
})();
