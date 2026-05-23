(() => {
  const app = document.querySelector("#app");
  const state = {
    activeTab: "studio",
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
  const tabs = [...document.querySelectorAll(".subnav-tab")];

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

  function bindTabs() {
    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === state.activeTab);
      tab.onclick = () => {
        state.activeTab = tab.dataset.tab;
        render();
      };
    });
  }

  function renderStudio() {
    const nextIdea = state.ideas[0];
    return `
      <section class="split-layout">
        <article class="panel spotlight">
          <span class="muted">Next publish target</span>
          ${nextIdea ? `
            <h2>${nextIdea.title}</h2>
            <p>${nextIdea.hook}</p>
            <div class="spotlight-grid">
              <div><span class="muted">Platform</span><strong>${nextIdea.platform}</strong></div>
              <div><span class="muted">Status</span><strong>${nextIdea.status}</strong></div>
              <div><span class="muted">Due</span><strong>${formatDate(nextIdea.due_date)}</strong></div>
              <div><span class="muted">Ideas queued</span><strong>${state.ideas.length}</strong></div>
            </div>
          ` : `<div class="empty">No idea is queued for production yet.</div>`}
        </article>
        <article class="panel">
          <h2>Studio Intake</h2>
          <p class="muted">Capture the next concept without dropping into the rest of the system.</p>
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
        </article>
      </section>
      <section class="panel">
        <h2>Idea Queue</h2>
        <div class="collection compact-cards">
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
      </section>
    `;
  }

  function renderPipeline() {
    return `
      <section class="split-layout">
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
        </article>
        <article class="panel stage-board">
          <h2>Pipeline Board</h2>
          <div class="stage-columns">
            ${["Researching", "Pitch Sent", "Negotiating", "Contract Review", "Closed"].map((stage) => `
              <div class="stage-column">
                <h3>${stage}</h3>
                ${renderCollection(
                  state.campaigns.filter((campaign) => campaign.stage === stage),
                  (campaign) => `
                    <div class="card slim">
                      <strong>${campaign.brand}</strong>
                      <p>${money.format(campaign.value)} • ${campaign.contact_name}</p>
                      <span class="muted">${formatDate(campaign.due_date)}</span>
                    </div>
                  `,
                  "No campaigns"
                )}
              </div>
            `).join("")}
          </div>
        </article>
      </section>
    `;
  }

  function renderDeliverables() {
    return `
      <section class="split-layout">
        <article class="panel">
          <h2>Deliverables</h2>
          <p class="muted">Keep sponsored clips, cutdowns, and publish dates tied to live campaigns.</p>
          <form id="deliverableForm">
            <select name="campaignId">
              <option value="">Standalone deliverable</option>
              ${state.campaigns.map((campaign) => `<option value="${campaign.id}">${campaign.brand}</option>`).join("")}
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
        </article>
        <article class="panel">
          <h2>Fulfillment Queue</h2>
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
  }

  function renderCalendar() {
    const allItems = [
      ...state.ideas.map((idea) => ({ type: "Idea", title: idea.title, date: idea.due_date, meta: `${idea.platform} • ${idea.status}` })),
      ...state.campaigns.map((campaign) => ({ type: "Campaign", title: campaign.brand, date: campaign.due_date, meta: campaign.stage })),
      ...state.deliverables.map((item) => ({ type: "Deliverable", title: item.label, date: item.publish_date, meta: `${item.channel} • ${item.status}` })),
    ].sort((a, b) => String(a.date).localeCompare(String(b.date)));

    return `
      <section class="panel">
        <h2>Production Calendar</h2>
        <p class="muted">A single timeline across content, sponsor work, and delivery dates.</p>
        <div class="calendar-list">
          ${renderCollection(
            allItems,
            (item) => `
              <article class="calendar-item">
                <div>
                  <span class="pill">${item.type}</span>
                  <strong>${item.title}</strong>
                  <p>${item.meta}</p>
                </div>
                <span class="muted">${formatDate(item.date)}</span>
              </article>
            `,
            "No scheduled work is on the calendar yet."
          )}
        </div>
      </section>
    `;
  }

  function render() {
    let view = renderStudio();
    if (state.activeTab === "pipeline") view = renderPipeline();
    if (state.activeTab === "deliverables") view = renderDeliverables();
    if (state.activeTab === "calendar") view = renderCalendar();

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

      ${view}
    `;

    bindTabs();
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
