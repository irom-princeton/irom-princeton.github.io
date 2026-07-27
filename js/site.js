/* ─────────────────────────────────────────────────────────────
   IRoM Lab — site script.
   Loads YAML data files and renders pages from them.
   ───────────────────────────────────────────────────────────── */

const DATA = {};
const DATA_FILES = [
  "lab", "people", "publications", "research",
  "news", "press", "courses", "software", "facilities", "join"
];

/* ─── Loader ─── */

async function loadAll() {
  await Promise.all(DATA_FILES.map(async (name) => {
    try {
      const res = await fetch(`data/${name}.yml`, { cache: "no-cache" });
      if (!res.ok) throw new Error(`Failed to load data/${name}.yml`);
      const text = await res.text();
      DATA[name] = jsyaml.load(text);
    } catch (err) {
      console.error(err);
      DATA[name] = null;
    }
  }));
}

/* ─── Helpers ─── */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

/** Convert simple markdown subset: links, bold, italic, bullet lists.
    Single newlines soft-wrap (join with space); blank lines start a new paragraph. */
function md(text) {
  if (!text) return "";
  let s = escapeHTML(text);
  // \* escapes a literal asterisk (e.g. co-first-author markers); swap it out
  // for a sentinel so the italic/bold passes below don't eat it.
  const STAR_SENTINEL = "";
  s = s.replace(/\\\*/g, STAR_SENTINEL);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>');

  const lines = s.split("\n");
  const parts = [];
  let bullets = [];
  let para = [];
  let pendingBreak = false;
  const flushBullets = () => {
    if (bullets.length) {
      if (pendingBreak && parts.length) parts.push("");
      parts.push(bullets.map(b => `<span class="md-item">📄 ${b}</span>`).join("<br>"));
      bullets = [];
      pendingBreak = false;
    }
  };
  const flushPara = () => {
    if (para.length) {
      if (pendingBreak && parts.length) parts.push("");
      parts.push(para.join(" "));
      para = [];
      pendingBreak = false;
    }
  };
  for (const line of lines) {
    const m = line.match(/^- (.*)$/);
    if (m) { flushPara(); bullets.push(m[1]); }
    else if (line.trim() === "") { flushBullets(); flushPara(); pendingBreak = true; }
    else { flushBullets(); para.push(line.trim()); }
  }
  flushBullets();
  flushPara();
  return parts.join("<br>").split(STAR_SENTINEL).join("*");
}

function formatDate(d) {
  if (!d) return "";
  const s = String(d);
  // "YYYY-MM" or "YYYY-MM-DD"
  const m = s.match(/^(\d{4})-(\d{2})/);
  if (!m) return s;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monIdx = parseInt(m[2], 10) - 1;
  if (monIdx < 0 || monIdx > 11) return s;
  return `${months[monIdx]} '${m[1].slice(2)}`;
}

function fmtAuthors(authors, pi = "Anirudha Majumdar") {
  return authors.map(a => {
    const safe = escapeHTML(a);
    return a === pi ? `<span class="pi">${safe}</span>` : safe;
  }).join(", ");
}

/** Trim "International Conference on Robot Learning (CoRL)" → "CoRL".
    Falls back to the full string when no parenthesized acronym exists. */
function shortVenue(venue) {
  if (!venue) return "";
  const m = venue.match(/\(([^)]+)\)\s*$/);
  return m ? m[1].trim() : venue;
}

/* ─── Header / nav (shared) ─── */

function renderHeader(activePage) {
  const lab = DATA.lab;
  if (!lab) return;
  const host = $("#site-header");
  if (!host) return;

  const inner = el("div", { class: "site-header__inner" });
  const brand = el("a", {
    class: "site-header__brand",
    href: "index.html",
    "aria-label": lab.short_name || lab.name
  });
  brand.appendChild(el("img", {
    src: "assets/img/logos/irom_lab_logo.png",
    alt: lab.short_name || lab.name
  }));
  inner.appendChild(brand);

  const toggle = el("button", {
    class: "nav-toggle",
    "aria-label": "Toggle navigation",
    onclick: () => $(".site-nav").classList.toggle("is-open")
  }, "☰");
  inner.appendChild(toggle);

  const nav = el("nav", { class: "site-nav" });
  for (const item of lab.nav) {
    const isActive = (activePage && item.href === activePage);
    nav.appendChild(el("a", {
      href: item.href,
      class: isActive ? "is-active" : null
    }, item.label));
  }
  inner.appendChild(nav);
  host.appendChild(inner);
}

function renderFooter() {
  const lab = DATA.lab;
  if (!lab) return;
  const host = $("#site-footer");
  if (!host) return;
  const wrap = el("div", { class: "container" });
  const year = new Date().getFullYear();
  wrap.appendChild(el("div", {},
    `© ${year} ${lab.footer.copyright_holder}`));
  const linksWrap = el("div", {});
  if (lab.social?.github) {
    linksWrap.appendChild(el("a", { href: lab.social.github, target: "_blank", rel: "noopener" }, "GitHub"));
    linksWrap.appendChild(document.createTextNode("  ·  "));
  }
  if (lab.social?.google_scholar) {
    linksWrap.appendChild(el("a", { href: lab.social.google_scholar, target: "_blank", rel: "noopener" }, "Google Scholar"));
  }
  wrap.appendChild(linksWrap);
  host.appendChild(wrap);
}

/* ─── Publication renderer ─── */

function pubLinkButtons(links = {}) {
  const order = ["arxiv","pdf","project","code","video","blog","journal","demo"];
  const labels = {
    arxiv:"arXiv", pdf:"PDF", project:"Project", code:"Code",
    video:"Video", blog:"Blog", journal:"Journal", demo:"Demo"
  };
  return order.filter(k => links[k]).map(k =>
    el("a", {
      href: links[k], target: "_blank", rel: "noopener",
      class: `btn btn--${k}`
    }, labels[k])
  );
}

function renderPubCard(p, opts = {}) {
  const compact = !!opts.compact;
  const card = el("article", { class: `pub${compact ? " pub--compact" : ""}` });

  if (!compact) {
    const thumb = el("div", { class: "pub__thumb" });
    if (p.thumbnail) {
      thumb.appendChild(el("img", { src: p.thumbnail, alt: "", loading: "lazy" }));
    } else {
      thumb.classList.add("pub__thumb--empty");
      const initials = (p.title || "").split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase();
      thumb.appendChild(document.createTextNode(initials));
    }
    card.appendChild(thumb);
  }

  const body = el("div", { class: "pub__body" });

  const titleLink = p.links?.project || p.links?.arxiv || p.links?.pdf || p.links?.journal || "#";
  const title = el("h3", { class: "pub__title" },
    el("a", { href: titleLink, target: "_blank", rel: "noopener" }, p.title)
  );
  body.appendChild(title);

  body.appendChild(el("p", {
    class: "pub__authors",
    html: fmtAuthors(p.authors || [])
  }));

  const isPreprint = p.status === "Under Review" || p.venue === "Preprint";
  const venueLabel = isPreprint ? "Under review" : (p.venue || "");
  if (venueLabel || p.year) {
    body.appendChild(el("p", { class: "pub__venue" },
      venueLabel ? el("span", {}, venueLabel) : null,
      venueLabel && p.year ? document.createTextNode(", ") : null,
      p.year ? el("span", { class: "year" }, String(p.year)) : null
    ));
  }

  if (p.awards?.length) {
    const aw = el("div", { class: "pub__awards" });
    for (const a of p.awards) aw.appendChild(el("span", { class: "award" }, a));
    body.appendChild(aw);
  }

  if (p.notes) {
    body.appendChild(el("p", { class: "pub__notes" }, p.notes));
  }

  const links = pubLinkButtons(p.links);
  if (links.length) {
    const lw = el("div", { class: "pub__links" });
    links.forEach(l => lw.appendChild(l));
    body.appendChild(lw);
  }

  card.appendChild(body);
  return card;
}

/* ─── Page renderers ─── */

function renderHome() {
  const lab = DATA.lab;
  // Hero is static HTML — only patch the tagline from data if present.
  const tagEl = $("#hero-tag");
  if (tagEl && lab?.tagline) tagEl.textContent = lab.tagline;
  initHeroVideo();

  // News with collapse: show first 6, "Show more" reveals the rest
  const newsHost = $("#news");
  if (newsHost && DATA.news) {
    const INITIAL = 6;
    const items = DATA.news;
    newsHost.innerHTML = "";
    const ul = el("ul", { class: "news" });
    items.forEach((n, i) => {
      const li = el("li", {
        class: i >= INITIAL ? "news-extra" : null,
        hidden: i >= INITIAL ? true : null,
      },
        el("span", { class: "date" }, formatDate(n.date)),
        el("div", { class: "body", html: md(n.body) })
      );
      ul.appendChild(li);
    });
    newsHost.appendChild(ul);

    const btn = $("#news-toggle");
    if (btn) {
      const hidden = items.length - INITIAL;
      if (hidden > 0) {
        btn.hidden = false;
        btn.textContent = `Show ${hidden} more news ↓`;
        let expanded = false;
        btn.addEventListener("click", () => {
          expanded = !expanded;
          $$(".news-extra", newsHost).forEach(li => { li.hidden = !expanded; });
          btn.textContent = expanded
            ? "Show less ↑"
            : `Show ${hidden} more news ↓`;
        });
      }
    }
  }
}

function renderResearch() {
  const host = $("#research-areas");
  if (!host || !DATA.research) return;
  host.innerHTML = "";

  // Accept either the legacy top-level list or the new {intro, areas, outro} object.
  const r = DATA.research;
  const areas = Array.isArray(r) ? r : (r.areas || []);
  const intro = !Array.isArray(r) && r.intro;
  const outro = !Array.isArray(r) && r.outro;

  if (intro) {
    host.appendChild(el("section", { class: "research-intro" },
      el("div", { html: md(intro.trim()) })));
  }

  const pubMap = new Map((DATA.publications || []).map(p => [p.id, p]));
  areas.forEach((area, idx) => {
    const sec = el("section", { class: "research-area", id: area.id });
    sec.appendChild(el("div", { class: "research-area__head" },
      el("div", {},
        el("span", { class: "num" }, area.num || `Area ${String(idx + 1).padStart(2, "0")}`),
        el("h2", {}, area.title)
      ),
      el("div", {}, el("p", { html: md(area.description.trim()) }))
    ));

    const ids = area.highlights || (area.publications || []).slice(0, 4);
    const pubs = ids.map(id => pubMap.get(id)).filter(Boolean);
    if (pubs.length) {
      sec.appendChild(el("h3", { class: "research-area__sub" }, "Representative publications"));
      pubs.forEach(p => sec.appendChild(renderPubCard(p, { compact: true })));
      sec.appendChild(el("p", { class: "research-area__more" },
        el("a", { href: "publications.html" }, "See all publications →")));
    }
    host.appendChild(sec);
  });

  if (outro) {
    host.appendChild(el("section", { class: "research-outro" },
      el("div", { html: md(outro.trim()) })));
  }
}

function renderPublications() {
  const host = $("#publications-list");
  if (!host || !DATA.publications) return;

  // Filter / search infra
  const search = $("#pub-search");
  const filters = $("#pub-filters");

  // Build year groups, segregating preprints and theses
  function build() {
    host.innerHTML = "";
    const q = (search?.value || "").trim().toLowerCase();
    const activeFilter = $(".chip.is-on")?.dataset.filter || "all";

    const matches = DATA.publications.filter(p => {
      if (activeFilter !== "all" && p.status === "Under Review") return false;
      if (activeFilter === "conference" && (p.type || "conference") !== "conference") return false;
      if (activeFilter === "journal"    && p.type !== "journal") return false;
      if (activeFilter === "theses"     && p.type !== "thesis") return false;
      if (activeFilter === "reports"    && p.type !== "tech_report") return false;
      if (!q) return true;
      const hay = [
        p.title, p.venue,
        ...(p.authors || []),
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });

    // Group by year, newest first
    const byYear = new Map();
    for (const p of matches) {
      const y = p.year || "Other";
      if (!byYear.has(y)) byYear.set(y, []);
      byYear.get(y).push(p);
    }
    const years = Array.from(byYear.keys()).sort((a,b) => b - a);

    if (!matches.length) {
      host.appendChild(el("p", { class: "loading" }, "No publications match your filters."));
      return;
    }

    years.forEach(year => {
      const pubs = byYear.get(year);
      host.appendChild(el("div", { class: "year-band" },
        el("h2", {}, String(year)),
        el("span", { class: "count" }, `${pubs.length} ${pubs.length === 1 ? "paper" : "papers"}`)
      ));
      pubs.forEach(p => host.appendChild(renderPubCard(p)));
    });
  }

  if (search) search.addEventListener("input", build);
  if (filters) {
    $$(".chip", filters).forEach(chip => {
      chip.addEventListener("click", () => {
        $$(".chip", filters).forEach(c => c.classList.remove("is-on"));
        chip.classList.add("is-on");
        build();
      });
    });
  }

  // Honour ?filter=… and ?q=… in the URL on initial load
  const params = new URLSearchParams(location.search);
  const initialFilter = params.get("filter");
  if (initialFilter && filters) {
    const target = $(`.chip[data-filter="${initialFilter}"]`, filters);
    if (target) {
      $$(".chip", filters).forEach(c => c.classList.remove("is-on"));
      target.classList.add("is-on");
    }
  }
  const initialQ = params.get("q");
  if (initialQ && search) search.value = initialQ;

  build();
}

function renderPeople() {
  const host = $("#people");
  if (!host || !DATA.people) return;
  host.innerHTML = "";

  const people = DATA.people;

  // PI card
  if (people.pi) {
    const pi = people.pi;
    const card = el("section", { class: "pi-card" });
    const photo = el("div", { class: "pi-card__photo" });
    if (pi.photo) photo.appendChild(el("img", { src: pi.photo, alt: pi.name }));
    else photo.appendChild(el("div", { class: "person__initials" },
      pi.name.split(" ").map(w => w[0]).slice(0, 2).join("")));
    card.appendChild(photo);
    const body = el("div", {});
    body.appendChild(el("h2", {}, pi.name));
    body.appendChild(el("p", { class: "meta" }, pi.title));
    (pi.affiliations || []).forEach(a => body.appendChild(el("p", { class: "meta" }, a)));
    body.appendChild(el("p", { class: "meta" }, "📧 ", el("strong", {}, pi.email)));
    if (pi.office) body.appendChild(el("p", { class: "meta" }, "📍 ", pi.office));
    if (pi.website) body.appendChild(el("p", { class: "meta" },
      el("a", { href: pi.website, target: "_blank", rel: "noopener" }, "Personal website ↗")
    ));
    card.appendChild(body);
    host.appendChild(card);
  }

  const graduate = [
    ...(people.postdocs     || []).map(p => ({ ...p, role: p.role || "Postdoctoral Researcher" })),
    ...(people.phd_students || []).map(p => ({ ...p, role: p.role || "PhD Student" })),
  ];
  const undergraduate = (people.undergrads || []).map(p => ({ ...p, role: p.role || "Undergraduate" }));

  const renderMemberGroup = (title, list) => {
    if (!list.length) return;
    host.appendChild(el("h2", {}, title));
    const grid = el("ul", { class: "people-grid" });
    list.forEach(p => grid.appendChild(personCard(p)));
    host.appendChild(grid);
  };
  renderMemberGroup("Graduate Students", graduate);
  renderMemberGroup("Undergraduate Students", undergraduate);

  // Alumni
  if (people.alumni) {
    host.appendChild(el("h2", {}, "Alumni"));
    const a = people.alumni;
    const renderAlumniGroup = (title, list, simple = false) => {
      if (!list?.length) return;
      const sec = el("section", { class: "alumni-section" });
      sec.appendChild(el("h3", {}, title));
      if (simple) {
        const para = el("p", { class: "alumni-undergrad" });
        list.forEach((entry, i) => {
          const name = typeof entry === "string" ? entry : entry.name;
          const next = (typeof entry === "object" && entry.next) ? entry.next : null;
          if (i > 0) para.appendChild(document.createTextNode(" · "));
          const span = el("span", { class: "alum" });
          span.appendChild(document.createTextNode(name));
          if (next) span.appendChild(el("span", { class: "next" }, " → " + next));
          para.appendChild(span);
        });
        sec.appendChild(para);
      } else {
        const ul = el("ul", { class: "alumni-list" });
        list.forEach(person => {
          const li = el("li", {});
          if (person.website) li.appendChild(el("a", { href: person.website, target: "_blank", rel: "noopener" }, person.name));
          else li.appendChild(document.createTextNode(person.name));
          if (person.next) li.appendChild(el("span", { class: "next" }, "→ " + person.next));
          ul.appendChild(li);
        });
        sec.appendChild(ul);
      }
      host.appendChild(sec);
    };
    renderAlumniGroup("PhD",          a.phd);
    renderAlumniGroup("Postdoctoral", a.postdoc);
    renderAlumniGroup("Masters",      a.masters);
    renderAlumniGroup("Undergraduate", a.undergrad);
  }
}

/** Drive the hero video: ordered playlist 1→2→3→4, looping, with
    prev/next arrows the user can click to step through clips. */
function initHeroVideo() {
  const video = $(".hero-video__media");
  if (!video) return;
  const raw = video.dataset.playlist || "";
  const playlist = raw.split(",").map(s => s.trim()).filter(Boolean);
  if (!playlist.length) return;

  const posLabel = $("#hero-pos");
  let idx = 0;

  const playAt = (i) => {
    idx = ((i % playlist.length) + playlist.length) % playlist.length;
    video.src = playlist[idx];
    video.load();
    const p = video.play();
    if (p && typeof p.catch === "function") p.catch(() => {}); // ignore autoplay block
    if (posLabel) posLabel.textContent = `${idx + 1} / ${playlist.length}`;
  };

  video.addEventListener("ended", () => playAt(idx + 1));
  // If a clip fails to load, hop to the next instead of stalling
  video.addEventListener("error", () => playAt(idx + 1));

  $$(".hero-arrow").forEach(btn => {
    const step = parseInt(btn.dataset.step, 10) || 1;
    btn.addEventListener("click", () => playAt(idx + step));
  });

  playAt(0);
}

function personCard(p) {
  const li = el("li", { class: "person" });
  const photo = el("div", { class: "person__photo" });
  if (p.photo) {
    photo.appendChild(el("img", { src: p.photo, alt: p.name, loading: "lazy" }));
  } else {
    const initials = p.name
      .split(/\s+/)
      .map(w => (w.match(/[A-Za-z]/) || [""])[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
    photo.appendChild(el("div", { class: "person__initials" }, initials));
  }
  li.appendChild(photo);
  const nameEl = el("p", { class: "person__name" });
  if (p.website) nameEl.appendChild(el("a", { href: p.website, target: "_blank", rel: "noopener" }, p.name));
  else nameEl.appendChild(document.createTextNode(p.name));
  li.appendChild(nameEl);
  if (p.role || p.department) {
    li.appendChild(el("p", { class: "person__role" }, p.role || p.department));
  }
  if (p.role && p.department && p.role !== p.department) {
    li.appendChild(el("p", { class: "person__role" }, p.department));
  }
  return li;
}

function renderSoftware() {
  const host = $("#software");
  if (!host || !DATA.software) return;
  host.innerHTML = "";
  const repos = (DATA.software.repos || []).slice(0, 9);

  // Org link with GitHub mark, pinned to the top of the list.
  if (DATA.software.org_url) {
    const handle = "@" + DATA.software.org_url.replace(/\/+$/, "").split("/").pop();
    const ghMark = '<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.76-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path></svg>';
    host.appendChild(el("a", { class: "repo-org", href: DATA.software.org_url, target: "_blank", rel: "noopener" },
      el("span", { class: "repo-org__mark", html: ghMark }),
      el("span", {}, handle),
      el("span", { class: "repo-org__arrow" }, "↗")
    ));
  }

  const grid = el("div", { class: "repo-grid" });
  repos.forEach(r => {
    const card = el("a", { class: "repo", href: r.url, target: "_blank", rel: "noopener" });
    card.appendChild(el("h3", { class: "repo__name" }, r.name));
    if (r.description) card.appendChild(el("p", { class: "repo__desc" }, r.description));
    const meta = el("p", { class: "repo__meta" });
    if (r.language) meta.appendChild(el("span", { class: "lang" }, r.language));
    // Star count placeholder — populated async from GitHub API
    const starsEl = el("span", { class: "repo__stars", "data-repo": r.url }, "");
    meta.appendChild(starsEl);
    if (r.paper) {
      const p = (DATA.publications || []).find(x => x.id === r.paper);
      if (p) {
        const isPreprint = p.status === "Under Review" || p.venue === "Preprint";
        const venue = isPreprint ? "" : shortVenue(p.venue);
        const label = [venue, p.year].filter(Boolean).join(" ");
        if (label) meta.appendChild(el("span", {}, "📄 " + label));
      }
    }
    card.appendChild(meta);
    grid.appendChild(card);
  });
  host.appendChild(grid);
  fetchGithubStars();
}

/** Populate each .repo__stars span with the live GitHub star count.
    Uses Promise.allSettled so one repo's failure doesn't block others. */
function fetchGithubStars() {
  const targets = $$(".repo__stars");
  targets.forEach(async (span) => {
    const url = span.dataset.repo || "";
    const m = url.match(/github\.com\/([^/]+)\/([^/?#]+)/);
    if (!m) return;
    const [, owner, repo] = m;
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`,
                              { headers: { "Accept": "application/vnd.github+json" } });
      if (!res.ok) return;
      const data = await res.json();
      const stars = data.stargazers_count;
      if (typeof stars !== "number") return;
      span.textContent = "★ " + stars.toLocaleString();
      span.title = `${stars.toLocaleString()} stargazers on GitHub`;
    } catch (_) { /* swallow — leave the cell empty */ }
  });
}

function renderTeaching() {
  const host = $("#teaching");
  if (!host || !DATA.courses) return;
  host.innerHTML = "";
  DATA.courses.forEach(c => {
    const sec = el("article", { class: "course" });
    if (c.numbers?.length) {
      const nums = el("div", { class: "course__nums" });
      c.numbers.forEach(n => nums.appendChild(el("code", {}, n)));
      sec.appendChild(nums);
    }
    sec.appendChild(el("h3", { class: "course__title" },
      c.url ? el("a", { href: c.url, target: "_blank", rel: "noopener" }, c.title) : c.title
    ));
    if (c.semester) sec.appendChild(el("p", { class: "course__sem" }, c.semester));
    if (c.description) sec.appendChild(el("p", {}, c.description.trim()));
    host.appendChild(sec);
  });
}

function renderPress() {
  const host = $("#press");
  if (!host || !DATA.press) return;
  host.innerHTML = "";
  const ul = el("ul", { class: "press-list" });
  DATA.press.forEach(item => {
    const li = el("li", {});
    li.appendChild(el("span", { class: "date" }, formatDate(item.date)));
    const title = el("span", { class: "title" },
      item.url ? el("a", { href: item.url, target: "_blank", rel: "noopener" }, item.title) : item.title
    );
    li.appendChild(title);
    li.appendChild(el("span", { class: "outlet" }, item.outlet));
    ul.appendChild(li);
  });
  host.appendChild(ul);
}

function renderFacilities() {
  const host = $("#facilities");
  if (!host || !DATA.facilities) return;
  host.innerHTML = "";
  const f = DATA.facilities;
  if (f.primary) {
    const sec = el("section", { class: "facility" });
    sec.appendChild(el("div", {},
      el("h2", {}, f.primary.name),
      el("div", { html: md(f.primary.description.trim()) })
    ));
    if (f.primary.image) {
      sec.appendChild(el("img", { src: f.primary.image, alt: f.primary.name }));
    }
    host.appendChild(sec);
  }
  if (f.secondary?.length) {
    f.secondary.forEach(s => {
      const sec = el("section", { class: s.image ? "facility" : null });
      sec.appendChild(el("div", {},
        el("h3", {}, s.name),
        el("div", { html: md(s.description.trim()) })
      ));
      if (s.image) {
        sec.appendChild(el("img", { src: s.image, alt: s.name }));
      }
      host.appendChild(sec);
    });
  }
  if (f.shared?.description) {
    const sec = el("section", {});
    sec.appendChild(el("h3", {}, "Shared University Facilities"));
    sec.appendChild(el("div", { html: md(f.shared.description.trim()) }));
    if (f.shared.link) {
      sec.appendChild(el("p", {},
        el("a", { href: f.shared.link, target: "_blank", rel: "noopener" },
          "Princeton Robotics facilities ↗")));
    }
    host.appendChild(sec);
  }
}

function renderJoin() {
  const host = $("#join");
  if (!host || !DATA.join) return;
  host.innerHTML = "";
  const j = DATA.join;
  if (j.intro) host.appendChild(el("p", { class: "join-intro", html: md(j.intro.trim()) }));
  (j.sections || []).forEach(s => {
    const sec = el("section", { class: "join-section" });
    sec.appendChild(el("h2", {}, s.title));
    sec.appendChild(el("div", { html: md((s.body || "").trim()) }));
    host.appendChild(sec);
  });
  if (j.contact?.email) {
    host.appendChild(el("p", { class: "join-contact" },
      (j.contact.text || "Email") + " ",
      el("strong", {}, j.contact.email)
    ));
  }
}

/* ─── Boot ─── */

async function boot() {
  await loadAll();
  const page = document.body.dataset.page;
  renderHeader(page ? `${page}.html` : "index.html");

  switch (page) {
    case "index":        renderHome();         break;
    case "research":     renderResearch();     break;
    case "publications": renderPublications(); break;
    case "people":       renderPeople();       break;
    case "software":     renderSoftware();     break;
    case "teaching":     renderTeaching();     break;
    case "press":        renderPress();        break;
    case "facilities":   renderFacilities();   break;
    case "join":         renderJoin();         break;
  }
  renderFooter();
}

document.addEventListener("DOMContentLoaded", boot);
