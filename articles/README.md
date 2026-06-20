# Article folders

Each published article lives in its own folder:

```text
articles/
  article-slug/
    index.html
    images/
      wide.webp
      wide.png
      wide.jpg
      wide.jpeg
      square.webp
      square.png
      square.jpg
      square.jpeg
      portrait.webp
      portrait.png
      portrait.jpg
      portrait.jpeg
```

Use `index.html` for the article page so public links can stay clean:

```text
/articles/article-slug/
```

The `images` folder is prepared for three optional crop families:

- `wide.webp`, `wide.png`, `wide.jpg` or `wide.jpeg` for horizontal cards, hero cards and the article image slot.
- `square.webp`, `square.png`, `square.jpg` or `square.jpeg` for Notes rows, compact cards and balanced grids. Notes rows fill the preview frame and preserve the image ratio.
- `portrait.webp`, `portrait.png`, `portrait.jpg` or `portrait.jpeg` for narrow editorial crops when a vertical image works better.

Only `wide` is required for the current layout. Add `square` when a Notes row
should use a better preview crop. If a requested crop is missing, the site
falls back to another available crop.

The site checks image files in this order: `webp`, `png`, `jpg`, `jpeg`.
PNG is fine for launch, especially for designed graphics. WebP is still a good
later optimization when file size starts to matter.

Keep the same visual subject across all crops. The page layout can then choose
the crop that fits the available space without forcing one image ratio into
every card.

If a Notes preview needs a specific crop focus, add `data-image-position` to the
matching `.edition-row` in `notes.html`, for example `left top`, `center` or
`right center`.

Do not add README files inside individual article or image folders. Keep article
folder rules here so the structure stays easy to maintain.
