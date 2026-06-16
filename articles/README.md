# Article folders

Each active article lives in its own folder:

```text
articles/
  article-slug/
    index.html
    images/
      wide.webp
      square.webp
      portrait.webp
```

Use `index.html` for the article page so public links can stay clean:

```text
/articles/article-slug/
```

The `images` folder is prepared for three crop families:

- `wide.webp` or `wide.jpg` for horizontal cards, Notes rows, hero cards and the article image slot. This is the slot the current site consumes automatically.
- `square.webp` or `square.jpg` for compact cards and balanced grids.
- `portrait.webp` or `portrait.jpg` for narrow/mobile crops when a vertical image works better.

Keep the same visual subject across all three crops. The page layout can then choose the crop that fits the available space without forcing one image ratio into every card.
