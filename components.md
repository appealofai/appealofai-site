# Shared UI contract

This is a static editorial site, so repeated markup still appears in page files. The visual source of truth is centralized:

- `style.css` owns the UI for navigation, theme buttons, newsbars, cards, article rails, back buttons, CTAs, note boxes, sources and footers.
- `script.js` normalizes runtime behavior for the theme toggle, newsbar carousel, archive search/order, back buttons, source highlights and article-section state.
- `content/articles.json` is the active article index for the dynamic newsbar and notes listing.

## Article page requirements

Each article page should use the same recurring class names:

- Header: `.site-header`, `.site-nav`, `[data-theme-toggle]`
- Newsbar: `.newsbar`, `[data-news-strip]`, `[data-news-label]`, `.ticker-track`
- Back links: `.page-back`
- Contents rail: `.article-aside`
- Body: `.article-page`, `.article-shell`, `.article-body`
- CTA links inside cards: `.card-cta`
- Footer: `.site-footer`

Do not add per-article button styles, footer styles or ticker logic. If one article needs a UI correction, fix the shared class in `style.css` or shared behavior in `script.js` so every article receives the same treatment.

## No-JS fallback

No-JS pages may keep their inline fallback blocks, but the authoritative fallback styling is centralized in `style.css` through `body:has(.no-js-banner)`. That keeps old article pages from drifting when the shared fallback changes.

## Article assets

Active article folders use:

```text
articles/article-slug/
  index.html
  images/
    wide.webp
    square.webp
    portrait.webp
```

The page should choose the best crop for the available layout instead of forcing one universal image ratio.
