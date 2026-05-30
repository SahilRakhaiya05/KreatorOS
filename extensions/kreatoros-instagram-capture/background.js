importScripts("config.js");

const EXTENSION_NAME = "KreatorOS Instagram Capture";

function cleanOrigin(origin) {
  if (!origin || typeof origin !== "string") return "";
  return origin.trim().replace(/\/+$/, "");
}

function cleanPath(path) {
  const value = typeof path === "string" && path.trim() ? path.trim() : "/api/import/instagram";
  return value.startsWith("/") ? value : `/${value}`;
}

function isAllowedOrigin(origin) {
  return /^https?:\/\//i.test(origin);
}

async function getStoredConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["KREATOROS_API_ORIGIN"], (items) => resolve(items || {}));
  });
}

async function resolveEndpoint() {
  const stored = await getStoredConfig();
  const origin = cleanOrigin(stored.KREATOROS_API_ORIGIN) || cleanOrigin(KREATOROS_CAPTURE_CONFIG.API_ORIGIN);
  const endpointPath = cleanPath(KREATOROS_CAPTURE_CONFIG.ENDPOINT_PATH);

  if (!origin || !isAllowedOrigin(origin)) {
    throw new Error("Open extension/config.js and set API_ORIGIN to your KreatorOS site.");
  }

  return `${origin}${endpointPath}`;
}

async function postToServer(capturePayload) {
  const endpoint = await resolveEndpoint();
  const res = await fetch(endpoint, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-KreatorOS-Source": "chrome-extension",
      "X-KreatorOS-Version": KREATOROS_CAPTURE_CONFIG.VERSION || "1.0.0"
    },
    body: JSON.stringify(capturePayload)
  });

  const text = await res.text();
  let responseBody = null;
  try {
    responseBody = text ? JSON.parse(text) : null;
  } catch {
    responseBody = { raw: text };
  }

  if (!res.ok) {
    throw new Error(responseBody?.error?.message || responseBody?.error || responseBody?.message || `Server returned ${res.status}`);
  }

  return responseBody || { ok: true };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "KREATOROS_CAPTURE_INSTAGRAM") return false;

  postToServer(message.payload)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => {
      console.error(`[${EXTENSION_NAME}]`, error);
      sendResponse({ ok: false, error: error.message || "Unknown error" });
    });

  return true;
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "KREATOROS_TRIGGER_CAPTURE" }, () => {
    if (chrome.runtime.lastError) {
      console.warn(`[${EXTENSION_NAME}] Content script unavailable:`, chrome.runtime.lastError.message);
    }
  });
});
