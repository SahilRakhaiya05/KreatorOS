// KreatorOS Instagram Capture Popup Script
const apiOrigin = typeof KREATOROS_CAPTURE_CONFIG !== "undefined" && KREATOROS_CAPTURE_CONFIG.API_ORIGIN 
  ? KREATOROS_CAPTURE_CONFIG.API_ORIGIN.replace(/\/+$/, "")
  : "http://localhost:3000";

// Check authentication status and initialize popup
async function checkAuth() {
  const loadingEl = document.getElementById("auth-loading");
  const signedOutEl = document.getElementById("auth-signed-out");
  const signedInEl = document.getElementById("auth-signed-in");
  const usernameEl = document.getElementById("username");
  const roleBadgeEl = document.getElementById("role-badge");
  const avatarEl = document.getElementById("avatar");
  const linkLibraryEl = document.getElementById("link-library");

  try {
    const res = await fetch(`${apiOrigin}/api/me`, {
      credentials: "include",
      headers: {
        "X-KreatorOS-Source": "chrome-extension"
      }
    });

    if (!res.ok) {
      throw new Error("Unauthorized");
    }

    const body = await res.json();
    if (!body.ok || !body.data?.user) {
      throw new Error("No user session found");
    }

    const { user, profile } = body.data;
    loadingEl.style.display = "none";
    signedOutEl.style.display = "none";
    signedInEl.style.display = "flex";

    // Set user info
    const fullName = profile?.full_name || user.email || "User";
    usernameEl.textContent = fullName;

    // Generate initials for avatar
    const initials = fullName
      .split(" ")
      .map(n => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
    avatarEl.textContent = initials || "KO";

    // Detect user role to set corresponding view-library link & badge UI
    const accountType = profile?.account_type || "user";
    if (accountType === "user" || accountType === "client") {
      roleBadgeEl.textContent = "PORTAL CLIENT";
      roleBadgeEl.style.background = "rgba(59, 130, 246, 0.1)"; // Slate blue glass badge
      roleBadgeEl.style.color = "#60a5fa";
      roleBadgeEl.style.border = "1px solid rgba(59, 130, 246, 0.2)";
      linkLibraryEl.href = `${apiOrigin}/portal/instagram`;
    } else {
      roleBadgeEl.textContent = accountType.toUpperCase();
      roleBadgeEl.style.background = "rgba(16, 185, 129, 0.1)";
      roleBadgeEl.style.color = "#34d399";
      roleBadgeEl.style.border = "1px solid rgba(16, 185, 129, 0.2)";
      linkLibraryEl.href = `${apiOrigin}/creator/instagram`;
    }

    // Populate recent saves list
    loadRecentCaptures();

  } catch (err) {
    console.error("Auth check failed:", err);
    loadingEl.style.display = "none";
    signedInEl.style.display = "none";
    signedOutEl.style.display = "flex";
    linkLibraryEl.href = `${apiOrigin}/login`;
  }
}

// Redirect client to login
document.getElementById("btn-login").addEventListener("click", () => {
  chrome.tabs.create({ url: `${apiOrigin}/login` });
});

// Trigger saving the active Instagram post
document.getElementById("btn-capture").addEventListener("click", async () => {
  const btn = document.getElementById("btn-capture");
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab) {
      showButtonStatus(btn, "Error: No active tab found", "error");
      return;
    }

    // Check if the tab is actually on Instagram
    let isInsta = false;
    try {
      isInsta = /(^|\.)instagram\.com$/i.test(new URL(activeTab.url).hostname);
    } catch {
      isInsta = false;
    }

    if (!isInsta) {
      showButtonStatus(btn, "Open an Instagram post first", "error");
      return;
    }

    // Update button visual to reflect loading state
    btn.textContent = "Saving to KreatorOS...";
    btn.disabled = true;

    // Communicate with content script on active tab
    chrome.tabs.sendMessage(activeTab.id, { type: "KREATOROS_TRIGGER_CAPTURE" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("Message delivery failed:", chrome.runtime.lastError);
        showButtonStatus(btn, "Refresh Instagram tab and retry", "error");
        return;
      }

      if (response && response.ok) {
        showButtonStatus(btn, "Saved successfully!", "success");
        setTimeout(loadRecentCaptures, 1000);
      } else {
        showButtonStatus(btn, "Failed to save post", "error");
      }
    });
  });
});

// Set button visual feedback
function showButtonStatus(btn, text, statusType) {
  btn.textContent = text;
  btn.disabled = false;
  
  if (statusType === "error") {
    btn.style.background = "#ef4444";
    btn.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.2)";
  } else if (statusType === "success") {
    btn.style.background = "#10b981";
    btn.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.2)";
  }

  setTimeout(() => {
    btn.textContent = "Save Active Post";
    btn.style.background = "";
    btn.style.boxShadow = "";
  }, 3000);
}

// Fetch and display recently saved items
async function loadRecentCaptures() {
  const container = document.getElementById("recent-container");
  const listEl = document.getElementById("recent-list");

  try {
    const res = await fetch(`${apiOrigin}/api/import/instagram`, {
      credentials: "include",
      headers: {
        "X-KreatorOS-Source": "chrome-extension"
      }
    });

    if (!res.ok) throw new Error("Could not fetch captures");

    const body = await res.json();
    if (body.ok && body.data?.captures && body.data.captures.length > 0) {
      container.style.display = "block";
      listEl.innerHTML = "";

      const recents = body.data.captures.slice(0, 3);
      recents.forEach(cap => {
        const item = document.createElement("div");
        item.className = "recent-item";
        item.style.cursor = "pointer";

        // Thumbnail element
        const img = document.createElement("img");
        img.className = "recent-img";
        img.src = cap.thumbnail_url || "icon-32.png";
        img.alt = cap.username || "Instagram Swipe";
        img.onerror = () => {
          img.src = "icon-32.png";
        };
        
        // Metadata wrapper
        const txtWrapper = document.createElement("div");
        txtWrapper.style.flex = "1";
        txtWrapper.style.minWidth = "0";

        const titleText = cap.hook || cap.title || "Instagram Post";
        const title = document.createElement("div");
        title.style.fontWeight = "600";
        title.style.overflow = "hidden";
        title.style.textOverflow = "ellipsis";
        title.style.whiteSpace = "nowrap";
        title.textContent = titleText;

        const author = document.createElement("div");
        author.style.fontSize = "10px";
        author.style.color = "#9ca3af";
        author.textContent = cap.username ? `@${cap.username}` : "Instagram";

        txtWrapper.appendChild(title);
        txtWrapper.appendChild(author);

        item.appendChild(img);
        item.appendChild(txtWrapper);

        // Click to view active post url
        item.addEventListener("click", () => {
          chrome.tabs.create({ url: cap.url || cap.canonical_url });
        });

        listEl.appendChild(item);
      });
    } else {
      container.style.display = "none";
    }
  } catch (err) {
    console.error("Failed to load recent captures:", err);
    container.style.display = "none";
  }
}

// Check authorization on popup loading
document.addEventListener("DOMContentLoaded", checkAuth);
