# Editing the site content

All content is plain **YAML files in `data/`** — one file per section. There is
**no build step**: edit the file, and (if the entry has an image) drop the image
into that section's media folder using the expected filename. Reordering is just
moving lines up or down within the file.

| Section        | Text file (edit this)   | Media folder / notes                                  |
| -------------- | ----------------------- | ----------------------------------------------------- |
| Publications   | `data/publications.yml` | `assets/img/publications/<id>.png` (name = the `id`)  |
| People         | `data/people.yml`       | `assets/img/people/<lastname>_<firstname>.jpg`        |
| News           | `data/news.yml`         | inline image links in the body (optional)             |
| Press          | `data/press.yml`        | —                                                     |
| Software       | `data/software.yml`     | —                                                     |
| Courses        | `data/courses.yml`      | —                                                     |
| Research       | `data/research.yml`     | `assets/research/` (page-specific media)              |
| Facilities/etc | `data/facilities.yml` … | —                                                     |

## Add a publication

1. Add an entry to `data/publications.yml`. Give it a unique `id` (that id is
   how research areas and software repos cross-reference it).
2. Save the thumbnail as `assets/img/publications/<id>.png` (or `.jpg`). No
   image? Omit the `thumbnail:` field and it shows a clean initials tile.
3. Order: publications are grouped by `year` automatically; within a year they
   appear in the order listed in the file, so just place the entry where you
   want it.

## Add a lab member

1. Add an entry to the right list in `data/people.yml`
   (`postdocs`, `phd_students`, `undergrads`).
2. Save the headshot as `assets/img/people/<lastname>_<firstname>.jpg` and set
   `photo:` to that path. Order = position in the list.
3. When someone graduates, move their entry down into `alumni:` (alumni are
   name-only — no photo needed).

## Add a news item

1. Add an entry to the top of `data/news.yml`:
   ```yaml
   - date: "2026-08"
     body: |
       Your text. **Bold**, [links](https://…), and "- " bullet lines all work.
   ```
2. News is shown newest-first; ordering follows the file.

## Sanity check

There's no build, but if you want to confirm nothing points at a missing image:

```bash
python3 - <<'PY'
import yaml, os
for f,key,folder in [("publications","thumbnail",None),("people","photo",None)]:
    d=yaml.safe_load(open(f"data/{f}.yml"))
    items=[]
    if isinstance(d,dict):
        for v in d.values():
            items += v if isinstance(v,list) else [v]
    else: items=d
    for it in items:
        p=isinstance(it,dict) and it.get(key)
        if p and not os.path.exists(p): print("MISSING:", p)
print("ok")
PY
```

`_backup_data/` holds the pre-reorganization snapshots; delete it once you're
confident everything looks right.
