const header = document.querySelector("[data-header]");
const root = document.documentElement;
const menu = document.querySelector("[data-menu]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const themeToggle = document.querySelector("[data-theme-toggle]");
const issueLinks = Array.from(document.querySelectorAll('[data-section-link][href^="#"]'));
const currentDate = document.querySelector("[data-current-date]");
const newsStrip = document.querySelector("[data-news-strip]");
const newsLabel = document.querySelector("[data-news-label]");
const tickerTrack = document.querySelector(".ticker-track");
let activeTickerIndex = null;
let focusedTickerIndex = null;
let tickerItemCount = 0;
const scriptBaseUrl = new URL(".", document.currentScript?.src || new URL("/script.js", window.location.origin).href);
const issueStrip = document.querySelector(".issue-strip");
const archiveSearch = document.querySelector("[data-archive-search]");
const archiveItems = Array.from(document.querySelectorAll("[data-archive-item]"));
const archiveOrderButtons = Array.from(document.querySelectorAll("[data-archive-order]"));
const archiveCount = document.querySelector("[data-archive-count]");
const archiveEmpty = document.querySelector("[data-archive-empty]");
const archivePagination = document.querySelector("[data-archive-pagination]");
const archivePrev = document.querySelector("[data-archive-prev]");
const archiveNext = document.querySelector("[data-archive-next]");
const archivePageStatus = document.querySelector("[data-archive-page-status]");
let issueSections = [];
let activeIssueIndex = 0;

const systemPrefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
const systemPrefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const systemTheme = systemPrefersLight ? "light" : "dark";
const themeFromUrl = new URLSearchParams(window.location.search).get("theme");
const usesLocalStaticServer = ["localhost", "127.0.0.1", "0.0.0.0", ""].includes(window.location.hostname);
const getStoredTheme = () => {
  try {
    if (getThemeStorageConsent() !== "granted") return null;
    return window.localStorage?.getItem("appealofai-theme");
  } catch {
    return null;
  }
};
const getThemeStorageConsent = () => {
  try {
    return window.localStorage?.getItem("appealofai-theme-consent");
  } catch {
    return null;
  }
};
const setStoredTheme = (theme) => {
  try {
    window.localStorage?.setItem("appealofai-theme-consent", "granted");
    window.localStorage?.setItem("appealofai-theme", theme);
  } catch {
    // Theme still works for the current page when storage is unavailable.
  }
};
const storedTheme = getStoredTheme();
const initialTheme = themeFromUrl === "light" || themeFromUrl === "dark"
  ? themeFromUrl
  : storedTheme === "light" || storedTheme === "dark"
    ? storedTheme
    : systemTheme;
root.dataset.theme = initialTheme;

const normalizeThemeToggle = () => {
  if (!themeToggle) return;
  themeToggle.classList.add("theme-toggle");
  themeToggle.replaceChildren();
  const icon = document.createElement("span");
  icon.className = "theme-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = '<svg class="moon-icon" viewBox="0 0 24 24" focusable="false"><path d="M12 3a6.2 6.2 0 0 0 9 7.6A9 9 0 1 1 12 3Z"></path></svg><svg class="sun-icon" viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"></path></svg>';
  themeToggle.append(icon);
};

normalizeThemeToggle();

const normalizePrimaryNavigation = () => {
  if (!menu) return;
  const path = window.location.pathname.replace(/\/index\.html$/i, "/");
  const isNotesPath = /\/notes(?:\.html|\/)?$/i.test(path);
  const links = Array.from(menu.querySelectorAll("a"));
  links.forEach((link) => {
    const label = link.textContent.trim().toLowerCase();
    const isCurrent = isNotesPath ? label === "notes" : label === "journal";
    if (isCurrent) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

normalizePrimaryNavigation();

document.addEventListener("gesturestart", (event) => {
  event.preventDefault();
}, { passive: false });

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

const resetInitialScroll = () => {
  if (window.location.hash) return;
  window.scrollTo(0, 0);
};

const getCleanDisplayUrl = (href) => {
  const url = new URL(href, window.location.href);
  if (url.protocol === "file:" || usesLocalStaticServer) return url.href;

  url.pathname = url.pathname
    .replace(/\/index\.html$/i, "/")
    .replace(/\/(notes|about|legal|terms|privacy)\.html$/i, "/$1")
    .replace(/\/articles\/([^/]+)\.html$/i, "/articles/$1");

  return url.href;
};

const cleanInitialUrl = () => {
  if (!window.history.replaceState) return;
  const url = new URL(window.location.href);
  if (themeFromUrl) url.searchParams.delete("theme");
  const cleanUrl = getCleanDisplayUrl(url.href);
  if (cleanUrl !== window.location.href) {
    window.history.replaceState({}, "", cleanUrl);
  }
};

const updateThemeButton = () => {
  if (!themeToggle) return;
  const isLight = root.dataset.theme === "light";
  themeToggle.setAttribute("aria-label", isLight ? "Toggle dark mode" : "Toggle light mode");
};

const showThemeStoragePrompt = () => {
  if (getThemeStorageConsent() === "granted") {
    setStoredTheme(root.dataset.theme);
    return;
  }
  if (document.querySelector("[data-theme-storage-prompt]")) return;

  const prompt = document.createElement("div");
  prompt.className = "theme-storage-prompt";
  prompt.setAttribute("data-theme-storage-prompt", "");
  prompt.setAttribute("role", "dialog");
  prompt.setAttribute("aria-live", "polite");
  prompt.innerHTML = `
    <p>Save this theme choice on this device? This uses local browser storage only, so the site can remember light or dark mode here.</p>
    <div>
      <button type="button" data-theme-save>Save</button>
      <button type="button" data-theme-once>Only now</button>
    </div>
  `;
  document.body.append(prompt);

  prompt.querySelector("[data-theme-save]")?.addEventListener("click", () => {
    setStoredTheme(root.dataset.theme);
    prompt.remove();
  });
  prompt.querySelector("[data-theme-once]")?.addEventListener("click", () => {
    prompt.remove();
  });
};

cleanInitialUrl();
updateThemeButton();
resetInitialScroll();
window.addEventListener("load", () => {
  window.requestAnimationFrame(resetInitialScroll);
}, { once: true });

const wireBackLinks = () => {
  document.querySelectorAll(".page-back a").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (window.history.length > 1) {
        event.preventDefault();
        window.history.back();
      }
    });
  });
};

wireBackLinks();

const alignImageBufferedCards = () => {
  const cards = Array.from(document.querySelectorAll([
    ".home-page .top-story-card",
  ].join(", ")));
  if (!cards.length) return;

  cards.forEach((card) => card.style.removeProperty("--story-image-adjust"));

  window.requestAnimationFrame(() => {
    const rows = [];
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const row = rows.find((candidate) => Math.abs(candidate.top - rect.top) < 12);
      if (row) {
        row.cards.push(card);
        row.top = Math.min(row.top, rect.top);
      } else {
        rows.push({ top: rect.top, cards: [card] });
      }
    });

    rows.forEach(({ cards: rowCards }) => {
      const rowMetrics = rowCards.map((card) => {
        const text = card.querySelector("p");
        const cta = card.querySelector(".card-cta");
        if (!text || !cta) return null;

        return {
          card,
          freeSpace: cta.getBoundingClientRect().top - text.getBoundingClientRect().bottom,
        };
      }).filter(Boolean);

      if (!rowMetrics.length) return;
      const naturalSpace = Math.min(...rowMetrics.map((metric) => metric.freeSpace));
      const targetSpace = Math.min(naturalSpace, 18);

      rowMetrics.forEach(({ card, freeSpace }) => {
        const adjustment = Math.min(180, Math.max(0, Math.round(freeSpace - targetSpace)));
        if (adjustment > 0) {
          card.style.setProperty("--story-image-adjust", `${adjustment}px`);
        }
      });
    });
  });
};

const scheduleHomeCardAlignment = () => {
  window.requestAnimationFrame(alignImageBufferedCards);
  window.setTimeout(alignImageBufferedCards, 120);
};

scheduleHomeCardAlignment();
window.addEventListener("load", scheduleHomeCardAlignment, { once: true });
window.addEventListener("resize", scheduleHomeCardAlignment);
if (document.fonts?.ready) {
  document.fonts.ready.then(scheduleHomeCardAlignment).catch(() => {});
}

// Remove broken optional assets instead of showing empty image frames.
document.querySelectorAll("[data-fallback-remove]").forEach((image) => {
  image.addEventListener("error", () => image.remove(), { once: true });
});

const updateIssueStripWrap = () => {
  if (!issueStrip) return;
  const visibleItems = Array.from(issueStrip.children).filter((item) => {
    return window.getComputedStyle(item).display !== "none";
  });
  const firstTop = visibleItems[0]?.offsetTop ?? 0;
  const isWrapped = visibleItems.some((item) => Math.abs(item.offsetTop - firstTop) > 2);
  issueStrip.classList.toggle("is-wrapped", isWrapped);
};

// Keep sticky offsets in CSS so anchor scrolling lands below the header stack.
const getHeaderOffset = () => {
  updateIssueStripWrap();
  const height = header?.offsetHeight || 72;
  const newsbarHeight = newsStrip?.offsetHeight || 0;
  const issueStripHeight = issueStrip?.scrollHeight || 0;
  root.style.setProperty("--header-height", `${height}px`);
  root.style.setProperty("--newsbar-height", `${newsbarHeight}px`);
  root.style.setProperty("--issue-strip-height", `${issueStripHeight}px`);
  return height + newsbarHeight + issueStripHeight + 18;
};

if ("ResizeObserver" in window) {
  const stickyMetricObserver = new ResizeObserver(() => {
    window.requestAnimationFrame(() => {
      updateIssueStripWrap();
      getHeaderOffset();
    });
  });
  [header, newsStrip, issueStrip].filter(Boolean).forEach((element) => {
    stickyMetricObserver.observe(element);
  });
}

window.addEventListener("load", updateIssueStripWrap, { once: true });

const getDocumentTop = (element) => {
  return element.getBoundingClientRect().top + window.scrollY;
};

const updateScrollProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
  root.style.setProperty("--scroll-progress", `${progress * 100}%`);
};

const scrollToY = (top) => {
  window.scrollTo({
    top: Math.max(0, top),
    behavior: systemPrefersReducedMotion.matches ? "auto" : "smooth",
  });
};

const getArticleTocOffset = () => {
  const toc = document.querySelector(".article-aside");
  if (!toc || window.getComputedStyle(toc).position !== "sticky") return 0;
  return toc.offsetHeight + 18;
};

const scrollToElement = (target, options = {}) => {
  const includeArticleToc = options.includeArticleToc ?? false;
  const extraOffset = options.extraOffset ?? 0;
  const tocOffset = includeArticleToc ? getArticleTocOffset() : 0;
  scrollToY(getDocumentTop(target) - getHeaderOffset() - tocOffset - extraOffset);
};

// Carry the active theme across internal pages.
const getThemeAwareUrl = (href) => {
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname === window.location.pathname && url.hash) return null;

  if (root.dataset.theme === systemTheme) {
    url.searchParams.delete("theme");
  } else {
    url.searchParams.set("theme", root.dataset.theme);
  }
  return url.href;
};

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");
  if (!link || event.defaultPrevented) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (link.target && link.target !== "_self") return;
  if (link.hasAttribute("download")) return;

  const nextUrl = getThemeAwareUrl(link.getAttribute("href"));
  if (!nextUrl) return;

  event.preventDefault();
  window.location.assign(nextUrl);
});

// Render the current issue date in the small metadata strip.
const formatIssueDate = () => {
  if (!currentDate) return;
  currentDate.textContent = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
};

// Downgrade stale breaking-style labels automatically.
const updateNewsLabel = () => {
  if (!newsStrip || !newsLabel) return;
  const lastUpdated = new Date(newsStrip.dataset.lastUpdated);
  if (Number.isNaN(lastUpdated.getTime())) return;

  const ageInHours = (Date.now() - lastUpdated.getTime()) / 36e5;
  if (newsStrip.dataset.breaking === "true" && ageInHours <= 36) {
    newsLabel.textContent = "Update";
    newsStrip.dataset.status = "breaking";
  } else if (ageInHours <= 168) {
    newsLabel.textContent = "Notes";
    newsStrip.dataset.status = "latest";
  } else {
    newsLabel.textContent = "Archive";
    newsStrip.dataset.status = "archive";
  }
};

formatIssueDate();
updateNewsLabel();

// Load the lightweight content index and use it as the notes ticker source.
const getContentFeedUrl = () => {
  return new URL("content/articles.json", scriptBaseUrl);
};

const getSiteRelativeUrl = (href) => {
  return new URL(href.replace(/^\//, ""), scriptBaseUrl).href;
};

const getArticleSlugFromUrl = (href) => {
  try {
    const url = new URL(href, window.location.href);
    const match = url.pathname.match(/\/articles\/([^/]+)\//);
    return match ? match[1] : "";
  } catch {
    return "";
  }
};

const articleImageExtensions = ["png", "webp", "jpg", "jpeg"];
const articleImageCache = new Map();

const probeImageUrl = (url) => new Promise((resolve) => {
  const image = new Image();
  image.onload = () => resolve(url);
  image.onerror = () => resolve("");
  image.src = url;
});

const getArticleImageUrl = (slug, variant = "wide") => {
  const key = `${slug}:${variant}`;
  if (!articleImageCache.has(key)) {
    articleImageCache.set(key, (async () => {
      const variants = [variant, "wide", "square", "portrait"]
        .filter((value, index, values) => value && values.indexOf(value) === index);

      for (const imageVariant of variants) {
        const base = `articles/${slug}/images/${imageVariant}`;
        for (const extension of articleImageExtensions) {
          const url = getSiteRelativeUrl(`${base}.${extension}`);
          const foundUrl = await probeImageUrl(url);
          if (foundUrl) return foundUrl;
        }
      }
      return "";
    })());
  }
  return articleImageCache.get(key);
};

const setArticleImageSlot = (element, slug, variant = "wide") => {
  if (!element || !slug) return;
  if (element.dataset.imagePosition) {
    element.style.setProperty("--article-image-position", element.dataset.imagePosition);
  }
  const expectedUrl = getSiteRelativeUrl(`articles/${slug}/images/${variant}.png`);
  element.style.setProperty("--article-image", `url("${expectedUrl}")`);
  getArticleImageUrl(slug, variant).then((url) => {
    if (!url || !element.isConnected || url === expectedUrl) return;
    element.style.setProperty("--article-image", `url("${url}")`);
  });
};

const hydrateArticleImageSlots = () => {
  document.querySelectorAll('a[href*="articles/"]').forEach((link) => {
    const slug = getArticleSlugFromUrl(link.href);
    if (
      link.classList.contains("hero-lead-card")
      || link.classList.contains("top-story-card")
    ) {
      setArticleImageSlot(link, slug, "wide");
    }

    if (link.classList.contains("edition-row")) {
      setArticleImageSlot(link, slug, "square");
    }
  });

  const currentSlug = getArticleSlugFromUrl(window.location.href);
  document.querySelectorAll(".image-brief").forEach((figure) => {
    setArticleImageSlot(figure, currentSlug, "wide");
  });
};

const getTickerTitle = (item) => {
  const title = item.tickerTitle || item.title || "";
  return title.length > 62 ? `${title.slice(0, 59).trim()}...` : title;
};

const renderTickerFromArticles = (items = []) => {
  if (!newsStrip || !tickerTrack || !items.length) return;

  const now = Date.now();
  const maxAgeInDays = 21;
  const activeItems = items
    .filter((item) => item.status === "published")
    .filter((item) => item.tickerTitle !== false)
    .map((item) => ({
      ...item,
      timestamp: new Date(item.updated || item.date).getTime(),
    }))
    .filter((item) => !Number.isNaN(item.timestamp))
    .sort((a, b) => b.timestamp - a.timestamp);

  const currentItems = activeItems.filter((item) => (now - item.timestamp) / 864e5 <= maxAgeInDays);
  const tickerItems = (currentItems.length >= 3 ? currentItems : activeItems).slice(0, 6);
  if (!tickerItems.length) return;

  const newest = tickerItems[0];
  newsStrip.dataset.lastUpdated = new Date(newest.timestamp).toISOString();
  updateNewsLabel();

  tickerItemCount = tickerItems.length;
  activeTickerIndex = null;
  focusedTickerIndex = null;
  const repeatedItems = tickerItems.length > 1
    ? [...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems]
    : tickerItems;
  tickerTrack.replaceChildren(...repeatedItems.map((item, index) => {
    const element = item.url ? document.createElement("a") : document.createElement("span");
    const label = document.createElement("span");
    label.className = "ticker-text";
    label.textContent = getTickerTitle(item);
    element.dataset.tickerIndex = String(index % tickerItems.length);
    element.append(label);
    if (item.url) element.href = getSiteRelativeUrl(item.url);
    return element;
  }));
  tickerTrack.scrollLeft = tickerItems.length > 1 ? tickerTrack.scrollWidth / 4 : 0;
  updateTickerSelection();
  setupTickerMotion();
};

const loadArticleFeed = async () => {
  if (!newsStrip || !tickerTrack) return;

  try {
    const response = await fetch(getContentFeedUrl(), { cache: "no-cache" });
    if (!response.ok) return;
    const feed = await response.json();
    renderTickerFromArticles(feed.items);
  } catch {
    updateNewsLabel();
  }
};

loadArticleFeed();
hydrateArticleImageSlots();

const ensureTickerItemIndexes = () => {
  if (!tickerTrack) return;
  const items = Array.from(tickerTrack.querySelectorAll("a, span"));
  if (!items.length || items.some((item) => item.dataset.tickerIndex)) return;

  const tickerItems = items.filter((item) => item.parentElement === tickerTrack);
  tickerItemCount = tickerItems.length;
  const sourceItems = tickerItems.map((item) => ({
    text: item.textContent.trim(),
    href: item instanceof HTMLAnchorElement ? item.getAttribute("href") : "",
  }));
  const repeatedItems = tickerItemCount > 1
    ? [...sourceItems, ...sourceItems, ...sourceItems, ...sourceItems]
    : sourceItems;
  tickerTrack.replaceChildren(...repeatedItems.map((item, index) => {
    const element = item.href ? document.createElement("a") : document.createElement("span");
    const label = document.createElement("span");
    label.className = "ticker-text";
    label.textContent = item.text;
    element.append(label);
    element.dataset.tickerIndex = String(index % tickerItemCount);
    if (item.href) element.href = item.href;
    return element;
  }));
  updateTickerSelection();
};

const updateTickerSelection = () => {
  if (!tickerTrack) return;
  const items = Array.from(tickerTrack.querySelectorAll("[data-ticker-index]"));
  if (!items.length) return;

  items.forEach((item) => {
    const isActive = activeTickerIndex !== null && Number(item.dataset.tickerIndex) === activeTickerIndex;
    if (isActive) {
      item.setAttribute("aria-current", "true");
    } else {
      item.removeAttribute("aria-current");
    }
  });
};

const setupTickerMotion = () => {
  if (!tickerTrack) return;
  ensureTickerItemIndexes();
  if (tickerTrack.dataset.motionReady === "true") return;
  tickerTrack.dataset.motionReady = "true";
  tickerTrack.classList.add("is-carousel");

  let carouselResumeTimer = 0;
  let carouselPanTimers = [];
  let tickerAutoFrame = 0;
  let tickerAutoTime = 0;
  let tickerPointerInside = false;
  let tickerPointerDown = false;
  let tickerAutoResumeAt = 0;
  let tickerLastScrollLeft = tickerTrack.scrollLeft;
  let tickerLastMovementAt = performance.now();
  let tickerCurrentSpeed = 0;
  let tickerReadPanFrame = 0;
  const tickerBaseSpeed = 0.048;
  const tickerReducedSpeed = 0.016;
  const hoverRampDuration = 3000;
  let hoverRampStartedAt = performance.now();
  let hoverRampFrom = 1;
  let hoverRampTo = 1;
  let hoverSpeedFactor = 1;
  const progress01 = (value) => Math.max(0, Math.min(1, value));
  const clearCarouselTimers = () => {
    carouselPanTimers.forEach((timer) => window.clearTimeout(timer));
    carouselPanTimers = [];
    if (tickerReadPanFrame) {
      window.cancelAnimationFrame(tickerReadPanFrame);
      tickerReadPanFrame = 0;
    }
  };
  const animateTickerScrollTo = (target, duration = 5200) => {
    if (systemPrefersReducedMotion.matches) {
      tickerTrack.scrollLeft = target;
      return;
    }

    if (tickerReadPanFrame) window.cancelAnimationFrame(tickerReadPanFrame);
    const start = tickerTrack.scrollLeft;
    const distance = target - start;
    if (Math.abs(distance) < 1) return;

    const startedAt = performance.now();
    const easeInOut = (progress) => progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    const step = (time) => {
      const progress = Math.min(1, (time - startedAt) / duration);
      tickerTrack.scrollLeft = start + distance * easeInOut(progress);
      if (progress < 1) {
        tickerReadPanFrame = window.requestAnimationFrame(step);
      } else {
        tickerReadPanFrame = 0;
      }
    };

    tickerReadPanFrame = window.requestAnimationFrame(step);
  };
  const getCarouselTickerItems = () => Array.from(tickerTrack.querySelectorAll("[data-ticker-index]"));
  const getLoopDistance = () => {
    return tickerItemCount > 1 ? tickerTrack.scrollWidth / 4 : Math.max(0, tickerTrack.scrollWidth - tickerTrack.clientWidth);
  };
  const normalizeTickerScroll = () => {
    const loopDistance = getLoopDistance();
    if (loopDistance <= 1) return;
    while (tickerTrack.scrollLeft >= loopDistance * 2) {
      tickerTrack.scrollLeft -= loopDistance;
    }
    while (tickerTrack.scrollLeft < loopDistance) {
      tickerTrack.scrollLeft += loopDistance;
    }
  };
  const getCenterTickerItem = () => {
    const trackRect = tickerTrack.getBoundingClientRect();
    const trackCenter = trackRect.left + trackRect.width / 2;
    return getCarouselTickerItems().reduce((best, item) => {
      const rect = item.getBoundingClientRect();
      const visible = Math.max(0, Math.min(rect.right, trackRect.right) - Math.max(rect.left, trackRect.left));
      if (!visible) return best;
      const distance = Math.abs(rect.left + rect.width / 2 - trackCenter);
      return distance < best.distance ? { item, distance } : best;
    }, { item: null, distance: Number.POSITIVE_INFINITY }).item || getCarouselTickerItems()[0] || null;
  };
  const getEdgeTickerItem = (direction = 1) => {
    const trackRect = tickerTrack.getBoundingClientRect();
    const visibleItems = getCarouselTickerItems()
      .map((item) => {
        const text = item.querySelector(".ticker-text") || item;
        const rect = text.getBoundingClientRect();
        return {
          item,
          left: rect.left,
          right: rect.right,
          visibleWidth: Math.min(rect.right, trackRect.right) - Math.max(rect.left, trackRect.left),
        };
      })
      .filter((entry) => entry.visibleWidth > 6);

    if (!visibleItems.length) return getCenterTickerItem();

    return (direction > 0
      ? visibleItems.sort((a, b) => a.left - b.left)
      : visibleItems.sort((a, b) => b.right - a.right))[0].item;
  };
  const getTickerReadableLeft = () => {
    const trackRect = tickerTrack.getBoundingClientRect();
    return Math.min(trackRect.right - 24, trackRect.left + 2);
  };
  const getTickerTargetForItem = (item) => {
    if (!item) return;
    const text = item.querySelector(".ticker-text") || item;
    const textRect = text.getBoundingClientRect();
    return tickerTrack.scrollLeft + textRect.left - getTickerReadableLeft();
  };
  const normalizeTickerTarget = (target, direction = 0) => {
    const loopDistance = getLoopDistance();
    let nextTarget = target;
    if (loopDistance > 1) {
      while (nextTarget < loopDistance) nextTarget += loopDistance;
      while (nextTarget >= loopDistance * 2) nextTarget -= loopDistance;
      if (direction > 0 && nextTarget <= tickerTrack.scrollLeft + 2) nextTarget += loopDistance;
      if (direction < 0 && nextTarget >= tickerTrack.scrollLeft - 2) nextTarget -= loopDistance;
    }
    const maxScroll = Math.max(0, tickerTrack.scrollWidth - tickerTrack.clientWidth);
    return Math.min(maxScroll, Math.max(0, nextTarget));
  };
  const scrollTickerItemToStart = (item, behavior = "smooth", preferredTarget = null) => {
    if (!item) return;
    const target = preferredTarget === null
      ? normalizeTickerTarget(getTickerTargetForItem(item))
      : preferredTarget;
    if (behavior === "auto") {
      stopTickerReadPan();
      tickerTrack.scrollLeft = target;
    } else {
      animateTickerScrollTo(target, 760);
    }
  };
  const getTickerMoveByIndex = (index, direction = 1) => {
    const normalizedIndex = (index + tickerItemCount) % tickerItemCount;
    const getMatchingItems = () => getCarouselTickerItems()
      .filter((item) => Number(item.dataset.tickerIndex) === normalizedIndex);
    const items = getMatchingItems();
    if (!items.length) return null;

    const moves = items.map((item) => {
      const rawTarget = getTickerTargetForItem(item);
      return {
        item,
        rawTarget,
        target: normalizeTickerTarget(rawTarget, direction),
      };
    });
    const best = moves
      .sort((a, b) => Math.abs(a.target - tickerTrack.scrollLeft) - Math.abs(b.target - tickerTrack.scrollLeft))[0];
    return best || { item: items[0], target: normalizeTickerTarget(getTickerTargetForItem(items[0]), direction) };
  };
  const gentlyPanLongTickerItem = (item) => {
    const text = item?.querySelector(".ticker-text") || item;
    if (!text || text.getBoundingClientRect().width <= tickerTrack.clientWidth - 24) return;
    const trackRect = tickerTrack.getBoundingClientRect();
    const textRect = text.getBoundingClientRect();
    const maxScroll = Math.max(0, tickerTrack.scrollWidth - tickerTrack.clientWidth);
    const rightTarget = Math.min(maxScroll, Math.max(0, tickerTrack.scrollLeft + textRect.right - trackRect.right + 12));
    carouselPanTimers.push(window.setTimeout(() => {
      animateTickerScrollTo(rightTarget, 7200);
    }, 1800));
    carouselPanTimers.push(window.setTimeout(() => {
      animateTickerScrollTo(Math.max(0, tickerTrack.scrollLeft + text.getBoundingClientRect().left - tickerTrack.getBoundingClientRect().left), 3600);
    }, 10600));
  };
  const clearTickerFocus = () => {
    clearCarouselTimers();
    activeTickerIndex = null;
    focusedTickerIndex = null;
    updateTickerSelection();
    tickerAutoResumeAt = performance.now() + 1250;
  };
  const holdTickerAutoFlow = (delay = 2200) => {
    tickerAutoResumeAt = Math.max(tickerAutoResumeAt, performance.now() + delay);
  };
  const scheduleTickerRelease = (delay = 6200) => {
    window.clearTimeout(carouselResumeTimer);
    carouselResumeTimer = window.setTimeout(() => {
      if (tickerPointerInside || tickerPointerDown) {
        scheduleTickerRelease(7600);
        return;
      }
      clearTickerFocus();
    }, delay);
  };
  const focusReadableTickerItem = (direction = 1) => {
    window.clearTimeout(carouselResumeTimer);
    clearCarouselTimers();
    normalizeTickerScroll();
    const currentItem = focusedTickerIndex === null ? getCenterTickerItem() : null;
    const currentIndex = focusedTickerIndex === null
      ? Number(currentItem?.dataset.tickerIndex) || 0
      : focusedTickerIndex;
    const nextIndex = (currentIndex + direction + tickerItemCount) % tickerItemCount;
    const activeMove = getTickerMoveByIndex(nextIndex, direction);
    const activeItem = activeMove?.item || currentItem;
    if (!activeItem) return;

    activeTickerIndex = Number(activeItem.dataset.tickerIndex) || 0;
    focusedTickerIndex = activeTickerIndex;
    updateTickerSelection();
    scrollTickerItemToStart(activeItem, systemPrefersReducedMotion.matches ? "auto" : "smooth", activeMove?.target ?? null);
    holdTickerAutoFlow(tickerPointerInside || tickerPointerDown ? 15000 : 12500);
    scheduleTickerRelease(tickerPointerInside || tickerPointerDown ? 15000 : 12500);
  };
  const runTickerAutoFlow = (time) => {
    if (!tickerAutoTime) tickerAutoTime = time;
    const delta = Math.min(64, time - tickerAutoTime);
    tickerAutoTime = time;

    if (activeTickerIndex === null && !tickerPointerDown) {
      const maxScroll = Math.max(0, tickerTrack.scrollWidth - tickerTrack.clientWidth);
      if (maxScroll > 1) {
        const baseSpeed = systemPrefersReducedMotion.matches ? tickerReducedSpeed : tickerBaseSpeed;
        const hoverProgress = progress01((time - hoverRampStartedAt) / hoverRampDuration);
        hoverSpeedFactor = hoverRampFrom + (hoverRampTo - hoverRampFrom) * hoverProgress;
        let nextSpeed = baseSpeed * hoverSpeedFactor;
        if (!tickerPointerInside && time < tickerAutoResumeAt) {
          nextSpeed = 0;
        } else if (systemPrefersReducedMotion.matches) {
          nextSpeed = tickerPointerInside ? 0 : tickerReducedSpeed;
        } else if (tickerPointerInside && hoverSpeedFactor <= 0.001) {
          nextSpeed = 0;
        }
        tickerCurrentSpeed = Math.max(0, nextSpeed);
        if (tickerCurrentSpeed < 0.00002) tickerCurrentSpeed = 0;
        tickerTrack.scrollLeft += delta * tickerCurrentSpeed;
        if (Math.abs(tickerTrack.scrollLeft - tickerLastScrollLeft) > 0.2) {
          tickerLastMovementAt = time;
          tickerLastScrollLeft = tickerTrack.scrollLeft;
        } else if (tickerCurrentSpeed > 0.00002 && !tickerPointerInside && time - tickerLastMovementAt > 1800) {
          tickerTrack.scrollLeft += 1;
          tickerLastMovementAt = time;
          tickerLastScrollLeft = tickerTrack.scrollLeft;
        }
        const loopDistance = getLoopDistance();
        if (loopDistance > 1 && tickerTrack.scrollLeft >= loopDistance * 2) {
          tickerTrack.scrollLeft -= loopDistance;
          tickerLastScrollLeft = tickerTrack.scrollLeft;
        } else if (loopDistance > 1 && tickerTrack.scrollLeft < loopDistance) {
          tickerTrack.scrollLeft += loopDistance;
          tickerLastScrollLeft = tickerTrack.scrollLeft;
        }
      }
    }

    tickerAutoFrame = window.requestAnimationFrame(runTickerAutoFlow);
  };

  if (!tickerAutoFrame) {
    normalizeTickerScroll();
    tickerLastScrollLeft = tickerTrack.scrollLeft;
    tickerAutoFrame = window.requestAnimationFrame(runTickerAutoFlow);
  }
};

setupTickerMotion();

// Archive search, ordering and pagination.
if (archiveItems.length) {
  const archiveList = archiveItems[0].parentElement;
  if (archiveList) archiveList.dataset.archiveList = "true";
  const archivePageSize = 5;
  let archivePage = 1;
  let archiveSort = "newest";

  const getArchiveTimestamp = (item) => {
    const timestamp = new Date(item.dataset.date || "").getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  const sortArchiveItems = (activeSort) => {
    if (!archiveList) return [];
    const sortedItems = [...archiveItems].sort((a, b) => {
      const diff = getArchiveTimestamp(b) - getArchiveTimestamp(a);
      return activeSort === "oldest" ? -diff : diff;
    });

    sortedItems.forEach((item) => archiveList.insertBefore(item, archiveEmpty || archivePagination || null));
    return sortedItems;
  };

  const formatArchiveCount = (visibleCount, shownCount, query, pageStart) => {
    if (!visibleCount) return "No notes found.";
    const orderLabel = archiveSort === "oldest" ? "oldest first" : "newest first";
    const rangeStart = pageStart + 1;
    const rangeEnd = pageStart + shownCount;
    if (query) {
      return `Showing ${rangeStart}-${rangeEnd} of ${visibleCount} ${visibleCount === 1 ? "match" : "matches"} for "${query}", ${orderLabel}.`;
    }
    return `Showing ${rangeStart}-${rangeEnd} of ${visibleCount} notes, ${orderLabel}.`;
  };

  const normalizeArchiveSearchText = (value) => value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const updateArchive = () => {
    const query = archiveSearch?.value.trim() || "";
    const queryTokens = normalizeArchiveSearchText(query).split(" ").filter(Boolean);
    const activeSort = archiveSort;
    const visibleItems = [];
    const matchingItems = [];
    let visibleCount = 0;

    archiveList?.classList.add("is-updating");
    const sortedItems = sortArchiveItems(activeSort);

    sortedItems.forEach((item) => {
      const text = [
        item.textContent,
        item.dataset.topics,
        item.dataset.date,
        item.dataset.dateLabel,
      ].join(" ");
      const searchableText = normalizeArchiveSearchText(text);
      const matchesSearch = !queryTokens.length
        || queryTokens.every((token) => searchableText.includes(token));
      if (matchesSearch) matchingItems.push(item);
    });

    const pageCount = Math.max(1, Math.ceil(matchingItems.length / archivePageSize));
    archivePage = Math.min(Math.max(archivePage, 1), pageCount);
    const pageStart = (archivePage - 1) * archivePageSize;
    const shownItems = matchingItems.slice(pageStart, pageStart + archivePageSize);

    archiveItems.forEach((item) => {
      const isVisible = shownItems.includes(item);
      item.hidden = !isVisible;
      item.classList.remove("is-appearing");
      if (isVisible) {
        visibleCount += 1;
        visibleItems.push(item);
      }
    });

    if (archiveEmpty) archiveEmpty.hidden = matchingItems.length > 0;
    if (archivePagination) {
      const hasPages = matchingItems.length > archivePageSize;
      archivePagination.hidden = !hasPages;
      if (archivePrev) archivePrev.disabled = archivePage <= 1;
      if (archiveNext) archiveNext.disabled = archivePage >= pageCount;
      if (archivePageStatus) archivePageStatus.textContent = `Page ${archivePage} of ${pageCount}`;
    }
    if (archiveCount) {
      archiveCount.classList.remove("is-changing");
      void archiveCount.offsetWidth;
      archiveCount.textContent = formatArchiveCount(matchingItems.length, visibleCount, query, pageStart);
      archiveCount.classList.add("is-changing");
    }

    requestAnimationFrame(() => {
      visibleItems.forEach((item, index) => {
        window.setTimeout(() => item.classList.add("is-appearing"), Math.min(index * 24, 120));
      });
      window.setTimeout(() => archiveList?.classList.remove("is-updating"), 280);
    });
  };

  archiveSearch?.addEventListener("input", () => {
    archivePage = 1;
    updateArchive();
  });
  archiveOrderButtons.forEach((button) => {
    button.addEventListener("click", () => {
      archiveSort = button.dataset.archiveOrder || "newest";
      archivePage = 1;
      archiveOrderButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      updateArchive();
    });
  });
  archivePrev?.addEventListener("click", () => {
    archivePage -= 1;
    updateArchive();
  });
  archiveNext?.addEventListener("click", () => {
    archivePage += 1;
    updateArchive();
  });

  updateArchive();
}

// Keep the header stack visually stable; only scroll progress changes.
if (header) {
  const updateHeader = () => {
    updateScrollProgress();
  };

  updateHeader();
  getHeaderOffset();
  window.addEventListener("scroll", updateHeader, { passive: true });
  window.addEventListener("resize", () => {
    getHeaderOffset();
    updateHeader();
  });
} else {
  updateScrollProgress();
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("resize", updateScrollProgress);
}

// Primary navigation helpers.
const closeMenu = () => {
  if (!menu || !menuToggle) return;
  menu.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open menu");
};

const updateNavOverflow = () => {
  if (!header || !menu) return;
  const hasOverflow = menu.scrollWidth > menu.clientWidth + 2;
  const hasMoreLeft = menu.scrollLeft > 2;
  const hasMoreRight = menu.scrollLeft + menu.clientWidth < menu.scrollWidth - 2;

  header.classList.toggle("has-nav-overflow", hasOverflow);
  header.classList.toggle("has-nav-more-left", hasOverflow && hasMoreLeft);
  header.classList.toggle("has-nav-more-right", hasOverflow && hasMoreRight);
};

const keepNavItemVisible = (item) => {
  if (!menu || !item || menu.scrollWidth <= menu.clientWidth) return;
  const padding = 24;
  const itemLeft = item.offsetLeft;
  const itemRight = itemLeft + item.offsetWidth;
  const viewLeft = menu.scrollLeft;
  const viewRight = viewLeft + menu.clientWidth;
  let nextLeft = viewLeft;

  if (itemLeft < viewLeft + padding) {
    nextLeft = itemLeft - padding;
  } else if (itemRight > viewRight - padding) {
    nextLeft = itemRight - menu.clientWidth + padding;
  }

  const maxLeft = menu.scrollWidth - menu.clientWidth;
  const clampedLeft = Math.max(0, Math.min(maxLeft, nextLeft));
  if (Math.abs(clampedLeft - viewLeft) < 1) return;

  menu.scrollTo({
    left: clampedLeft,
    behavior: systemPrefersReducedMotion.matches ? "auto" : "smooth",
  });
};

if (menu && menuToggle) {
  updateNavOverflow();
  menu.addEventListener("scroll", updateNavOverflow, { passive: true });
  window.addEventListener("resize", updateNavOverflow);

  menu.addEventListener("wheel", (event) => {
    if (menu.scrollWidth <= menu.clientWidth) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    event.preventDefault();
    menu.scrollBy({
      left: event.deltaY,
      behavior: "auto",
    });
  }, { passive: false });

  menuToggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!menu.classList.contains("is-open")) return;
    if (menu.contains(event.target) || menuToggle.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    updateThemeButton();
    showThemeStoragePrompt();
  });
}

// Active page state for the top navigation.
const markCurrentPage = () => {
  const path = window.location.pathname.replace(/\/index\.html$/i, "/");
  const isNotesPath = /\/notes(?:\.html|\/)?$/i.test(path);
  let currentLink = null;

  document.querySelectorAll(".site-nav a").forEach((link) => {
    const label = link.textContent.trim().toLowerCase();
    const isCurrent = isNotesPath ? label === "notes" : label === "journal";
    if (isCurrent) {
      link.setAttribute("aria-current", "page");
      currentLink = link;
    } else {
      link.removeAttribute("aria-current");
    }
  });

  keepNavItemVisible(currentLink);
  updateNavOverflow();
};

markCurrentPage();
normalizePrimaryNavigation();

// Reader controls use actual page sections; no visible section rail is needed.
issueSections = issueLinks.length
  ? issueLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean)
  : [];

if (issueLinks.length || issueSections.length) {
  const setActiveLink = (id) => {
    issueLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${id}`;
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const updateActiveSection = () => {
    const marker = window.scrollY + getHeaderOffset() + 2;
    const active = issueSections.reduce((current, section) => {
      return getDocumentTop(section) <= marker ? section : current;
    }, issueSections[0]);

    if (active) {
      activeIssueIndex = issueSections.indexOf(active);
      setActiveLink(active.id);
    }
  };

  issueLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;

      event.preventDefault();
      closeMenu();
      scrollToElement(target);
      setActiveLink(target.id);
    });
  });

  updateActiveSection();
  window.addEventListener("scroll", updateActiveSection, { passive: true });
  window.addEventListener("resize", updateActiveSection);
}

const articleToc = document.querySelector(".article-aside");
if (articleToc) {
  const tocLinks = Array.from(articleToc.querySelectorAll('a[href^="#"]'));
  const tocTargets = tocLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (!issueSections.length && tocTargets.length) {
    issueSections = tocTargets;
  }

  const setActiveTocLink = (targetId) => {
    tocLinks.forEach((link) => {
      if (link.getAttribute("href") === `#${targetId}`) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const updateActiveToc = () => {
    if (!tocTargets.length) return;
    const pageBottom = window.scrollY + window.innerHeight;
    const isNearBottom = pageBottom >= document.documentElement.scrollHeight - 80;
    if (isNearBottom) {
      setActiveTocLink(tocTargets[tocTargets.length - 1].id);
      return;
    }

    const marker = window.scrollY + window.innerHeight * 0.5;
    const activeTarget = tocTargets.reduce((current, target) => {
      return getDocumentTop(target) <= marker ? target : current;
    }, tocTargets[0]);
    if (activeTarget?.id) {
      activeIssueIndex = tocTargets.indexOf(activeTarget);
      setActiveTocLink(activeTarget.id);
    }
  };

  tocLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      scrollToElement(target, { includeArticleToc: true, extraOffset: 8 });
      setActiveTocLink(target.id);
    });
  });

  updateActiveToc();
  window.addEventListener("scroll", updateActiveToc, { passive: true });
  window.addEventListener("resize", updateActiveToc);
}

const sourceFootnotes = Array.from(document.querySelectorAll('.article-body sup a[href^="#source-"]'));
if (sourceFootnotes.length) {
  const highlightSource = (source) => {
    source.classList.remove("is-source-highlight");
    void source.offsetWidth;
    source.classList.add("is-source-highlight");
    window.setTimeout(() => source.classList.remove("is-source-highlight"), 1900);
  };

  sourceFootnotes.forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;

      event.preventDefault();
      scrollToElement(target, { includeArticleToc: true, extraOffset: 12 });
      highlightSource(target);
      target.setAttribute("tabindex", "-1");
      window.setTimeout(() => target.focus({ preventScroll: true }), systemPrefersReducedMotion.matches ? 0 : 320);
      window.history.replaceState(null, "", link.getAttribute("href"));
    });
  });

  if (window.location.hash.startsWith("#source-")) {
    const initialSource = document.querySelector(window.location.hash);
    if (initialSource) {
      window.setTimeout(() => {
        scrollToElement(initialSource, { includeArticleToc: true, extraOffset: 12 });
        highlightSource(initialSource);
      }, 260);
    }
  }
}

// Floating reader controls for section-level movement.
const createReaderControls = () => {
  const controls = document.createElement("div");
  controls.className = "reader-controls";
  controls.setAttribute("data-reader-controls", "");
  controls.setAttribute("aria-label", "Reader controls");

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.className = "reader-control";
  previousButton.setAttribute("data-previous-section", "");
  previousButton.setAttribute("aria-label", "Previous section");
  previousButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 19V5M5 12l7-7 7 7"></path></svg>';

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.className = "reader-control";
  nextButton.setAttribute("data-next-section", "");
  nextButton.setAttribute("aria-label", "Next section");
  nextButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12l7 7 7-7"></path></svg>';

  const topButton = document.createElement("button");
  topButton.type = "button";
  topButton.className = "reader-control";
  topButton.setAttribute("data-scroll-top", "");
  topButton.setAttribute("aria-label", "Back to top");
  topButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 7h14M12 19V7M7 12l5-5 5 5"></path></svg>';

  const bottomButton = document.createElement("button");
  bottomButton.type = "button";
  bottomButton.className = "reader-control";
  bottomButton.setAttribute("data-scroll-bottom", "");
  bottomButton.setAttribute("aria-label", "Go to end");
  bottomButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 17h14M12 5v12M7 12l5 5 5-5"></path></svg>';

  controls.append(topButton);
  if (issueSections.length) {
    controls.append(previousButton);
    controls.append(nextButton);
  }
  controls.append(bottomButton);
  document.body.append(controls);

  const updateControls = () => {
    const isVisible = window.scrollY > Math.max(360, window.innerHeight * 0.45);
    const isNearBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 120;
    controls.classList.toggle("is-visible", isVisible);
    previousButton.disabled = activeIssueIndex <= 0;
    nextButton.disabled = !issueSections.length || activeIssueIndex >= issueSections.length - 1;
    bottomButton.disabled = isNearBottom;
  };

  previousButton.addEventListener("click", () => {
    if (!issueSections.length) return;
    const target = issueSections[Math.max(0, activeIssueIndex - 1)];
    if (target) scrollToElement(target, { includeArticleToc: Boolean(articleToc), extraOffset: articleToc ? 8 : 0 });
  });

  nextButton.addEventListener("click", () => {
    if (!issueSections.length) return;
    const target = issueSections[Math.min(issueSections.length - 1, activeIssueIndex + 1)];
    if (target) scrollToElement(target, { includeArticleToc: Boolean(articleToc), extraOffset: articleToc ? 8 : 0 });
  });

  topButton.addEventListener("click", () => scrollToY(0));
  bottomButton.addEventListener("click", () => {
    scrollToY(document.documentElement.scrollHeight - window.innerHeight);
  });

  updateControls();
  window.addEventListener("scroll", updateControls, { passive: true });
  window.addEventListener("resize", updateControls);
};

createReaderControls();
