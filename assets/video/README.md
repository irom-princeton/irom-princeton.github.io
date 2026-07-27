# Hero video

Drop a file at this path:

```
assets/video/hero.mp4
```

…and the home page hero will use it as a muted, autoplaying, looping
background. Until then, the hero falls back to a clean static
gradient — no broken state.

**Recommended specs**
- H.264 MP4, 1920×1080 or 1280×720
- 6–20 seconds, loops cleanly
- < 8 MB (large videos kill mobile load time)
- Visually calm (motion behind text needs to be slow / abstract; fast
  cuts compete with the title)
- No audio track needed (it autoplays muted regardless)

**Optional**: also provide `hero.webm` for ~30% smaller file size in
modern browsers — the page picks it first when present.

**Optional**: a poster frame at `assets/video/hero-poster.jpg` shows
while the video loads and is what mobile users see when autoplay is
blocked.
