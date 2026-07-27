# Intelligent Robot Motion Lab — Website

A static, data-driven redesign of the IRoM Lab website. Everything
visible on the site is rendered at page-load time from YAML files in
[`data/`](data/) — so **maintenance happens in one place**.

```
.
├── index.html  research.html  publications.html  people.html
├── software.html  teaching.html  press.html  facilities.html
│
├── data/                     ← single source of truth (edit YAML here)
│   ├── lab.yml               lab name, PI, navigation
│   ├── people.yml            PI, postdocs, PhDs, undergrads, alumni
│   ├── publications.yml      every paper, preprint, thesis, tech report
│   ├── research.yml          research themes — reference pubs by id
│   ├── news.yml              homepage announcements
│   ├── press.yml             media coverage
│   ├── courses.yml           teaching
│   ├── software.yml          GitHub repos
│   └── facilities.yml        lab space & equipment
│
├── assets/img/{logos,people,projects,lab}/    ← images live here
├── css/site.css              all styles (one file)
└── js/site.js                YAML loader + page renderers
```

No build step. No framework. Just open the HTML files in a browser
(after starting a local server — see below).

---

## Run it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

A server is required (not `file://`) because the pages `fetch()` the
YAML data files at runtime.

## Deploy

GitHub Pages serves this repo as-is — push to the configured branch and
it's live. There's nothing to build.

---

## How to add things

### A new publication

Open `data/publications.yml` and append an entry. The only required
fields are `id`, `title`, `authors`, `venue`, `year`:

```yaml
- id: my_new_paper
  title: "My New Paper Title"
  authors: ["Jane Doe", "Anirudha Majumdar"]
  venue: "Conference on Robot Learning (CoRL)"
  year: 2026
  links:
    arxiv: "https://arxiv.org/abs/..."
    project: "https://my-project-page.github.io/"
    code: "https://github.com/.../..."
    video: "https://www.youtube.com/watch?v=..."
  thumbnail: "assets/img/projects/my_paper.png"   # optional
  awards: ["Best Paper Award"]                    # optional
```

That's it — the paper now appears on `publications.html`, sorted into
its year, with the right buttons rendered for each link you provided.

The PI's name (currently "Anirudha Majumdar") is automatically
bolded in the author list — no manual `<strong>` needed.

**If the paper belongs to a research area**, also add its `id` to the
`publications:` list of the matching area in `data/research.yml`.

### A new person

Open `data/people.yml`, find the right group (`postdocs`,
`phd_students`, `undergrads`, or an `alumni.*` list) and append:

```yaml
- name: "New PhD Student"
  department: "Mechanical and Aerospace Engineering"
  website: "https://their-site.github.io/"     # optional
  photo: "assets/img/people/newperson.jpg"      # optional
```

If `photo` is omitted, a stylish initials avatar is generated automatically.

### A news item

Open `data/news.yml` and **prepend** (newest first):

```yaml
- date: "2026-06"
  body: |
    Congratulations to **Dr. So-and-So** for their defense! Their
    paper [Project X](https://project-x.github.io/) is now public.
```

`body` supports Markdown for `**bold**`, `*italic*`, and
`[links](url)`.

### A new research area

Open `data/research.yml`:

```yaml
- id: my_new_area
  title: "My New Research Direction"
  short: "Short Label"
  description: |
    A paragraph (or several) describing the area. Markdown links work.
  publications: [pub_id_1, pub_id_2, pub_id_3]
```

The `publications` list references the `id`s in
`data/publications.yml` — **no duplication**. If you add a new paper
to that area, just append its id here.

### A new course, software repo, press hit, or facility

Same pattern — open the matching YAML file in `data/` and add an entry.
Every page on the site picks up the change on the next reload.

---

## Adding an image

Drop the file into the right `assets/img/` subdirectory:

| What            | Where                       |
| --------------- | --------------------------- |
| Person photo    | `assets/img/people/`        |
| Paper thumbnail | `assets/img/projects/`      |
| Logo            | `assets/img/logos/`         |
| Lab/facility    | `assets/img/lab/`           |

Then reference the path in the corresponding YAML field
(`photo:`, `thumbnail:`, etc.). Recommended sizes:

- Person photos: square, ≥ 400×400 px, JPEG.
- Paper thumbnails: 16:10 ratio, ≥ 800 px wide, PNG or JPEG.

---

## Design notes

- **Type**: Source Serif 4 for headings, Inter for body, JetBrains
  Mono for dates/codes. All loaded from Google Fonts.
- **Color**: Princeton orange (`#E77500`) as accent; charcoal text on
  a warm off-white (`#fbfaf7`) background.
- **Layout**: Max container 1120 px; 760 px max for body text.
- **Header**: sticky, translucent with backdrop blur (frosted glass).
- **Publication cards**: 220 px thumbnail on the left, title /
  authors / venue / link buttons stacked on the right.
- **Buttons**: each link type has its own color (arXiv red, project
  orange, code black, video red, blog blue, journal slate) so they're
  scannable at a glance.

All visual tokens are CSS custom properties at the top of
`css/site.css` — edit them in one place to retheme.

---

## File-by-file cheat sheet

| File                            | Purpose                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| `index.html`                    | Home page (hero, highlights, news)                          |
| `research.html`                 | Research themes from `research.yml`                         |
| `publications.html`             | Year-grouped pubs with search + filters                     |
| `people.html`                   | PI card + grids of postdocs / PhDs / undergrads + alumni    |
| `software.html`                 | Grid of GitHub repos                                        |
| `teaching.html`                 | Courses                                                     |
| `press.html`                    | Press coverage                                              |
| `facilities.html`               | Lab facilities                                              |
| `css/site.css`                  | All styling                                                 |
| `js/site.js`                    | YAML loader + page renderers                                |

The HTML files are intentionally near-empty shells — they declare
which page to render via `<body data-page="…">`, mount points for
header/footer/content, and load the CSS and JS. **You should not need
to edit them** when adding content.

---

## Credits

Visual inspiration drawn from
[CMU IntentLab](https://cmu-intentlab.github.io/) and
[Stanford REAL Lab](https://real.stanford.edu/lab.html).

Built for the Intelligent Robot Motion Lab at Princeton University.
