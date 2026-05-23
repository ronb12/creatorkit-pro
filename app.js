(() => {
  const key = "creatorkit-pro-v1";
  const state = JSON.parse(localStorage.getItem(key) || "null") || {
    ideas: [
      { id: crypto.randomUUID(), hook: "Three mistakes killing your watch time", platform: "Reels", due: "2026-05-24" },
      { id: crypto.randomUUID(), hook: "Behind-the-scenes brand deal recap", platform: "TikTok", due: "2026-05-25" },
    ],
    deals: [
      { id: crypto.randomUUID(), brand: "GlowCo", value: 2200, stage: "Pitch Sent" },
      { id: crypto.randomUUID(), brand: "PeakFuel", value: 4300, stage: "Negotiating" },
    ],
  };
  const save = () => localStorage.setItem(key, JSON.stringify(state));

  document.head.insertAdjacentHTML("beforeend", `<style>
    body{margin:0;background:#0a0812;color:#f3eefe;font:16px/1.45 system-ui,sans-serif}main{max-width:1180px;margin:0 auto;padding:30px 20px 48px}
    .ck-grid,.cards,.list{display:grid;gap:16px}.hero,.card{background:#151026;border:1px solid #3e3169;border-radius:22px;padding:20px}
    .cards{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}.stats{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}.stat{background:#1c1433;border-radius:14px;padding:14px}
    form{display:grid;gap:10px}.row{display:grid;gap:10px;grid-template-columns:repeat(2,minmax(0,1fr))}input,select,button{font:inherit;padding:11px 12px;border-radius:12px;border:1px solid #5e4aa5}
    input,select{background:#110c1d;color:#fff}button{background:#b699ff;color:#160f29;font-weight:700;cursor:pointer}.item{background:#1c1433;border-radius:14px;padding:14px;display:grid;gap:5px}.meta{color:#cbb8f8}
    @media (max-width:760px){.row{grid-template-columns:1fr}}
  </style>`);

  const main = document.querySelector("main");

  function render() {
    const pipeline = state.deals.reduce((sum, deal) => sum + Number(deal.value), 0);
    main.innerHTML = `
      <div class="ck-grid">
        <section class="hero">
          <h1>CreatorKit Pro</h1>
          <p class="meta">Track content hooks, due dates, and brand-deal pipeline with a saved creator dashboard.</p>
          <div class="stats">
            <div class="stat"><strong>${state.ideas.length}</strong><div class="meta">Planned posts</div></div>
            <div class="stat"><strong>${state.deals.length}</strong><div class="meta">Active deals</div></div>
            <div class="stat"><strong>$${pipeline.toLocaleString()}</strong><div class="meta">Pipeline value</div></div>
          </div>
        </section>
        <section class="cards">
          <article class="card">
            <h2>Hook Lab</h2>
            <form id="ideaForm">
              <input name="hook" placeholder="Hook or content idea" required>
              <div class="row">
                <select name="platform"><option>Reels</option><option>TikTok</option><option>YouTube</option><option>Email</option></select>
                <input name="due" type="date" required>
              </div>
              <button type="submit">Save Content Idea</button>
            </form>
            <div class="list">${state.ideas.map((idea) => `<div class="item"><b>${idea.hook}</b><span>${idea.platform}</span><span class="meta">Due ${idea.due}</span></div>`).join("")}</div>
          </article>
          <article class="card">
            <h2>Brand Deals</h2>
            <form id="dealForm">
              <div class="row">
                <input name="brand" placeholder="Brand" required>
                <input name="value" type="number" min="0" placeholder="Value" required>
              </div>
              <select name="stage"><option>Researching</option><option>Pitch Sent</option><option>Negotiating</option><option>Closed</option></select>
              <button type="submit">Add Deal</button>
            </form>
            <div class="list">${state.deals.map((deal) => `<div class="item"><b>${deal.brand}</b><span>$${Number(deal.value).toLocaleString()}</span><span class="meta">${deal.stage}</span></div>`).join("")}</div>
          </article>
        </section>
      </div>`;

    document.querySelector("#ideaForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      state.ideas.unshift({
        id: crypto.randomUUID(),
        hook: String(form.get("hook")),
        platform: String(form.get("platform")),
        due: String(form.get("due")),
      });
      save();
      render();
    });

    document.querySelector("#dealForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      state.deals.unshift({
        id: crypto.randomUUID(),
        brand: String(form.get("brand")),
        value: Number(form.get("value") || 0),
        stage: String(form.get("stage")),
      });
      save();
      render();
    });
  }

  save();
  render();
})();
