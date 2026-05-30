(() => {
  const BUTTON_ID = "kreatoros-capture-floating-button";
  const TOAST_ID = "kreatoros-capture-toast";
  const ACTIVE_ROUTES = ["/p/", "/reel/", "/reels/", "/tv/", "/stories/"];
  const TEXT_LIMIT = 12000;

  function isInstagram() {
    return /(^|\.)instagram\.com$/i.test(window.location.hostname);
  }

  function getSupportedPageType() {
    const path = window.location.pathname;
    if (/^\/reels?(\/|$)/i.test(path)) return "reel";
    if (/^\/p\/[^/]+/i.test(path)) return "post";
    if (/^\/tv\/[^/]+/i.test(path)) return "igtv";
    if (/^\/stories\/[^/]+\/[^/]+/i.test(path)) return "story";
    if (/^\/[^/]+\/$/i.test(path)) return "profile";
    return "instagram_page";
  }

  function shouldShowButton() {
    if (!isInstagram()) return false;
    const path = window.location.pathname;
    return ACTIVE_ROUTES.some((route) => path.startsWith(route)) || path === "/reels";
  }

  function getMetaBySelector(selector, attr = "content") {
    const el = document.querySelector(selector);
    return el ? el.getAttribute(attr) || null : null;
  }

  function getAllMeta() {
    const metas = {};
    document.querySelectorAll("meta").forEach((meta) => {
      const key = meta.getAttribute("property") || meta.getAttribute("name") || meta.getAttribute("itemprop");
      const content = meta.getAttribute("content");
      if (key && content && !metas[key]) metas[key] = content;
    });
    return metas;
  }

  function normalizeWhitespace(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function getCanonicalUrl() {
    try {
      const url = new URL(window.location.href);
      url.search = "";
      url.hash = "";
      return url.toString();
    } catch {
      return window.location.href;
    }
  }

  function getShortcodeFromUrl() {
    const match = window.location.pathname.match(/^\/(p|reels?|tv)\/([^/?#]+)/i);
    return match ? match[2] : null;
  }

  function getStoryInfoFromUrl() {
    const match = window.location.pathname.match(/^\/stories\/([^/]+)\/([^/?#]+)/i);
    if (!match) return null;
    return { username: decodeURIComponent(match[1]), storyId: decodeURIComponent(match[2]) };
  }

  function extractUsernameFromText(value) {
    if (!value) return null;
    const text = normalizeWhitespace(value);
    
    // Look for parenthesized @username or username (e.g. "(@sahilrakhaiya05)")
    const parenMatch = text.match(/\(\s*@?([A-Za-z0-9._]{1,30})\s*\)/);
    if (parenMatch?.[1] && parenMatch[1].toLowerCase() !== "instagram") {
      return parenMatch[1];
    }

    // Look for any "@username" mention
    const atMatch = text.match(/(?:^|\s)@([A-Za-z0-9._]{1,30})/);
    if (atMatch?.[1] && atMatch[1].toLowerCase() !== "instagram") {
      return atMatch[1];
    }

    const patterns = [
      /^@?([A-Za-z0-9._]{1,30})\s+on Instagram/i,
      /Instagram\s+photo\s+by\s+@?([A-Za-z0-9._]{1,30})/i,
      /Instagram\s+video\s+by\s+@?([A-Za-z0-9._]{1,30})/i,
      /See\s+Instagram\s+photos\s+and\s+videos\s+from\s+@?([A-Za-z0-9._]{1,30})/i,
      /^([A-Za-z0-9._]{1,30})\s+\(/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1] && match[1].toLowerCase() !== "instagram") return match[1];
    }
    return null;
  }

  function getLikelyUsername() {
    const story = getStoryInfoFromUrl();
    if (story?.username) return story.username;

    // 1. Scan page title or metadata text FIRST, since Instagram includes it there
    const titleCandidates = [
      document.title,
      getMetaBySelector('meta[property="og:title"]'),
      getMetaBySelector('meta[name="twitter:title"]')
    ];

    for (const candidate of titleCandidates) {
      const username = extractUsernameFromText(candidate);
      if (username) return username;
    }

    // 2. Scan DOM links inside article or main or whole page to find profile links
    const domCandidates = Array.from(document.querySelectorAll('a[href]'))
      .map((a) => {
        try {
          const hrefAttr = a.getAttribute("href");
          if (!hrefAttr) return null;
          const url = new URL(hrefAttr, window.location.origin);
          const parts = url.pathname.split("/").filter(Boolean);
          if (parts.length === 1) {
            const username = parts[0];
            if (/^[A-Za-z0-9._]{1,30}$/.test(username)) {
              const lower = username.toLowerCase();
              const systemPaths = [
                "explore", "reels", "reel", "p", "tv", "stories", "accounts", "emails", 
                "developer", "about", "blog", "jobs", "help", "api", "privacy", "terms", 
                "directory", "suggested", "login", "signup"
              ];
              if (!systemPaths.includes(lower)) {
                return username;
              }
            }
          }
        } catch (e) {}
        return null;
      })
      .filter(Boolean);

    if (domCandidates.length > 0) {
      return domCandidates[0];
    }

    return null;
  }

  function getLikelyCaption() {
    // Prioritize active DOM article text
    const article = document.querySelector("article");
    if (article) {
      const articleText = normalizeWhitespace(article.innerText || "");
      if (articleText.length > 10) return articleText.slice(0, 4000);
    }

    const metaDescription = getMetaBySelector('meta[property="og:description"]') || getMetaBySelector('meta[name="description"]');
    const twitterDescription = getMetaBySelector('meta[name="twitter:description"]');

    for (const candidate of [metaDescription, twitterDescription].filter(Boolean)) {
      const cleaned = normalizeWhitespace(candidate);
      if (cleaned.length > 20) return cleaned;
    }

    return null;
  }

  function getVisibleTextSample() {
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll("script, style, noscript, svg, canvas, iframe").forEach((el) => el.remove());
    return normalizeWhitespace(clone.innerText || "").slice(0, TEXT_LIMIT);
  }

  function getImages() {
    const urls = new Set();
    
    // Prioritize images inside the active article DOM elements
    document.querySelectorAll("article img, main img").forEach((img) => {
      const src = img.currentSrc || img.src;
      if (src && /^https?:\/\//i.test(src)) urls.add(src);
    });

    // Fall back to og metadata
    [
      getMetaBySelector('meta[property="og:image"]'),
      getMetaBySelector('meta[name="twitter:image"]'),
      getMetaBySelector('meta[property="og:image:secure_url"]')
    ].forEach((url) => url && urls.add(url));

    return Array.from(urls).slice(0, 12);
  }

  function getVideos() {
    const urls = new Set();

    // Prioritize active video elements inside the DOM
    document.querySelectorAll("article video, main video").forEach((video) => {
      const src = video.currentSrc || video.src;
      if (src && /^https?:\/\//i.test(src)) urls.add(src);
      video.querySelectorAll("source").forEach((source) => {
        if (source.src && /^https?:\/\//i.test(source.src)) urls.add(source.src);
      });
    });

    // Fall back to og metadata
    [
      getMetaBySelector('meta[property="og:video"]'),
      getMetaBySelector('meta[property="og:video:url"]'),
      getMetaBySelector('meta[property="og:video:secure_url"]')
    ].forEach((url) => url && urls.add(url));

    return Array.from(urls).slice(0, 8);
  }

  function getJsonLd() {
    const items = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      const text = script.textContent?.trim();
      if (!text) return;
      try {
        items.push(JSON.parse(text));
      } catch {
        items.push({ parseError: true, raw: text.slice(0, 2000) });
      }
    });
    return items;
  }

  function getOpenGraphData() {
    return {
      title: getMetaBySelector('meta[property="og:title"]'),
      description: getMetaBySelector('meta[property="og:description"]'),
      image: getMetaBySelector('meta[property="og:image"]'),
      video: getMetaBySelector('meta[property="og:video"]'),
      url: getMetaBySelector('meta[property="og:url"]'),
      type: getMetaBySelector('meta[property="og:type"]'),
      siteName: getMetaBySelector('meta[property="og:site_name"]')
    };
  }

  function getTwitterCardData() {
    return {
      card: getMetaBySelector('meta[name="twitter:card"]'),
      title: getMetaBySelector('meta[name="twitter:title"]'),
      description: getMetaBySelector('meta[name="twitter:description"]'),
      image: getMetaBySelector('meta[name="twitter:image"]')
    };
  }

  function getLikesAndComments() {
    const ogDesc = getMetaBySelector('meta[property="og:description"]') || getMetaBySelector('meta[name="description"]') || "";
    const likesMatch = ogDesc.match(/([\d.,]+[KMB]?)\s+likes/i);
    const commentsMatch = ogDesc.match(/([\d.,]+[KMB]?)\s+comments/i);
    
    let likes = likesMatch ? likesMatch[1] : null;
    let comments = commentsMatch ? commentsMatch[1] : null;

    if (!likes) {
      // Fallback search of DOM elements for likes
      const likesEl = Array.from(document.querySelectorAll("span, a, div"))
        .find(el => /^[0-9,.]+[KMB]?\s+likes$/i.test(el.textContent?.trim() || ""));
      if (likesEl) {
        const match = likesEl.textContent.trim().match(/^([0-9,.]+[KMB]?)/i);
        if (match) likes = match[1];
      }
    }

    if (!comments) {
      // Fallback search of DOM elements for comments
      const commentsEl = Array.from(document.querySelectorAll("span, a, div"))
        .find(el => /^[0-9,.]+[KMB]?\s+comments$/i.test(el.textContent?.trim() || ""));
      if (commentsEl) {
        const match = commentsEl.textContent.trim().match(/^([0-9,.]+[KMB]?)/i);
        if (match) comments = match[1];
      }
    }

    return {
      likes: likes || "N/A",
      comments: comments || "N/A",
      views: "N/A"
    };
  }

  function collectInstagramPayload() {
    const story = getStoryInfoFromUrl();
    const openGraph = getOpenGraphData();
    const twitter = getTwitterCardData();
    const images = getImages();
    const canonicalUrl = getCanonicalUrl();
    const metrics = getLikesAndComments();

    return {
      event: "instagram.capture.v1",
      source: "chrome-extension",
      extension: { name: "KreatorOS Instagram Capture", version: "1.0.0" },
      page: {
        url: window.location.href,
        canonicalUrl,
        title: document.title || null,
        referrer: document.referrer || null,
        capturedAt: new Date().toISOString(),
        language: document.documentElement.lang || getMetaBySelector('meta[property="og:locale"]') || null,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio || 1
        }
      },
      instagram: {
        platform: "instagram",
        type: getSupportedPageType(),
        shortcode: getShortcodeFromUrl(),
        username: getLikelyUsername(),
        storyId: story?.storyId || null,
        caption: getLikelyCaption(),
        thumbnailUrl: images[0] || openGraph.image || twitter.image || null,
        mediaImageUrls: images,
        mediaVideoUrls: getVideos(),
        openGraph,
        twitter,
        jsonLd: getJsonLd(),
        allMeta: getAllMeta(),
        metrics
      },
      raw: {
        visibleTextSample: getVisibleTextSample(),
        htmlLength: document.documentElement.outerHTML.length
      }
    };
  }

  function removeToast() {
    document.getElementById(TOAST_ID)?.remove();
  }

  function showToast(message, state = "normal") {
    removeToast();
    const toast = document.createElement("div");
    toast.id = TOAST_ID;
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.right = "22px";
    toast.style.bottom = "90px";
    toast.style.zIndex = "2147483647";
    toast.style.maxWidth = "320px";
    toast.style.padding = "10px 14px";
    toast.style.borderRadius = "999px";
    toast.style.fontFamily = "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    toast.style.fontSize = "13px";
    toast.style.lineHeight = "1.35";
    toast.style.fontWeight = "650";
    toast.style.boxShadow = "0 14px 40px rgba(0,0,0,.32)";
    toast.style.background = state === "error" ? "#b91c1c" : state === "success" ? "#047857" : "#111827";
    toast.style.color = "white";
    toast.style.pointerEvents = "none";
    document.documentElement.appendChild(toast);
    window.setTimeout(removeToast, state === "error" ? 4200 : 2200);
  }

  function setButtonLoading(isLoading) {
    const button = document.getElementById(BUTTON_ID);
    if (!button) return;
    button.disabled = isLoading;
    button.style.opacity = isLoading ? "0.72" : "1";
    button.textContent = isLoading ? "..." : "K";
  }

  function sendPayloadToBackground(payload) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "KREATOROS_CAPTURE_INSTAGRAM", payload }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response?.ok) {
          reject(new Error(response?.error || "Failed to send to KreatorOS"));
          return;
        }
        resolve(response.data || { ok: true });
      });
    });
  }

  async function captureAndSend() {
    if (!isInstagram()) {
      showToast("This works only on Instagram pages", "error");
      return;
    }
    if (!shouldShowButton()) {
      showToast("Open a reel, post, TV, or story page first", "error");
      return;
    }

    setButtonLoading(true);
    showToast("Saving to KreatorOS...");

    try {
      const result = await sendPayloadToBackground(collectInstagramPayload());
      const savedId = result?.data?.id || result?.id;
      showToast(savedId ? "Saved to KreatorOS" : "Saved to KreatorOS", "success");
    } catch (error) {
      console.error("[KreatorOS] Capture failed", error);
      showToast(error.message || "Failed to save", "error");
    } finally {
      setButtonLoading(false);
    }
  }

  function createButton() {
    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.title = "Save this Instagram item to KreatorOS";
    button.setAttribute("aria-label", "Save to KreatorOS");
    button.textContent = "K";
    button.style.position = "fixed";
    button.style.right = "22px";
    button.style.bottom = "28px";
    button.style.zIndex = "2147483647";
    button.style.width = "52px";
    button.style.height = "52px";
    button.style.borderRadius = "999px";
    button.style.border = "1px solid rgba(255,255,255,.22)";
    button.style.background = "linear-gradient(135deg, #111827, #000000)";
    button.style.color = "#ffffff";
    button.style.fontSize = "21px";
    button.style.lineHeight = "1";
    button.style.fontWeight = "800";
    button.style.cursor = "pointer";
    button.style.display = "grid";
    button.style.placeItems = "center";
    button.style.boxShadow = "0 14px 38px rgba(0,0,0,.38)";
    button.style.transition = "transform .15s ease, opacity .15s ease";
    button.addEventListener("mouseenter", () => {
      button.style.transform = "translateY(-2px) scale(1.035)";
    });
    button.addEventListener("mouseleave", () => {
      button.style.transform = "translateY(0) scale(1)";
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      captureAndSend();
    });
    return button;
  }

  function syncButtonVisibility() {
    const existing = document.getElementById(BUTTON_ID);
    const visible = shouldShowButton();
    if (visible && !existing) document.documentElement.appendChild(createButton());
    if (!visible && existing) existing.remove();
  }

  function watchSpaNavigation() {
    let lastUrl = window.location.href;
    window.setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        window.setTimeout(syncButtonVisibility, 350);
      }
    }, 600);

    const observer = new MutationObserver(syncButtonVisibility);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "KREATOROS_TRIGGER_CAPTURE") {
      captureAndSend();
      sendResponse({ ok: true });
    }
    return false;
  });

  syncButtonVisibility();
  watchSpaNavigation();
})();
