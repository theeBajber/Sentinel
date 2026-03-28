// extension/background.js
const API_BASE_DEFAULT = "http://localhost:3000";

// Local cache
const urlCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;
const TRUSTED_DOMAINS = new Set([
  "google.com",
  "youtube.com",
  "github.com",
  "stackoverflow.com",
  "openai.com",
  "chatgpt.com",
  "chat.com",
  "pinterest.com",
  "reddit.com",
  "twitter.com",
  "x.com",
  "facebook.com",
  "amazon.com",
  "microsoft.com",
  "apple.com",
  "netflix.com",
]);

// Check if domain is trusted
function isTrustedDomain(hostname) {
  const parts = hostname.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const domain = parts.slice(i).join(".");
    if (TRUSTED_DOMAINS.has(domain)) return true;
  }
  return TRUSTED_DOMAINS.has(hostname);
}

// Get API base from storage
async function getApiBase() {
  try {
    const items = await browser.storage.sync.get({ apiBase: API_BASE_DEFAULT });
    return items.apiBase || API_BASE_DEFAULT;
  } catch (e) {
    return API_BASE_DEFAULT;
  }
}

// Quick local check
function quickCheck(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Immediately trust known domains
    if (isTrustedDomain(hostname)) {
      return {
        verdict: "safe",
        score: 0,
        reasons: ["Trusted domain"],
        cached: true,
      };
    }

    // Quick heuristics only
    const reasons = [];
    let score = 0;

    if (hostname.length > 60) {
      reasons.push("Long hostname");
      score += 5;
    }

    if (/[0-9]{6,}/.test(url)) {
      reasons.push("Suspicious numeric pattern");
      score += 5;
    }

    // Only flag obvious bad patterns locally
    const badPatterns = [
      /(paypal|apple|google|microsoft|amazon|facebook)-?(secure|login|verify|update)\.(tk|ml|ga|cf)/i,
      /(secure|login|verify|update)-?(paypal|apple|google|microsoft|amazon|facebook)/i,
    ];

    for (const pattern of badPatterns) {
      if (pattern.test(hostname)) {
        reasons.push("Phishing pattern detected");
        score += 50;
      }
    }

    if (score >= 50)
      return { verdict: "unsafe", score, reasons, cached: false };
    if (score >= 20)
      return { verdict: "suspicious", score, reasons, cached: false };

    return {
      verdict: "safe",
      score,
      reasons: ["Quick check passed"],
      cached: false,
    };
  } catch (e) {
    return {
      verdict: "suspicious",
      score: 30,
      reasons: ["Invalid URL"],
      cached: false,
    };
  }
}

// Cache helpers
function getCachedResult(url) {
  const cached = urlCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }
  return null;
}

function cacheResult(url, result) {
  urlCache.set(url, { result, timestamp: Date.now() });
}

// Main scan function
async function scanUrl(url, tabId) {
  try {
    // Check cache first
    let result = getCachedResult(url);

    if (!result) {
      // Quick local check first
      result = quickCheck(url);

      if (!result.cached) {
        cacheResult(url, result);
      }
    }

    // Update badge immediately based on local check
    updateBadge(tabId, result.verdict);

    // Block immediately if unsafe
    if (result.verdict === "unsafe") {
      blockTab(tabId, url, result);
      return;
    }

    // Server verification for non-trusted domains
    if (!result.cached) {
      verifyWithServer(url, tabId, result);
    }
  } catch (e) {
    console.error("Scan error:", e);
  }
}

function updateBadge(tabId, verdict) {
  const actionApi = browser.browserAction || browser.action;
  const colors = { safe: "#10b981", suspicious: "#f59e0b", unsafe: "#ef4444" };
  const icons = { safe: "", suspicious: "!", unsafe: "✕" };

  actionApi.setBadgeText({ tabId, text: icons[verdict] || "" });
  actionApi.setBadgeBackgroundColor({
    tabId,
    color: colors[verdict] || "#6b7280",
  });
}

function blockTab(tabId, url, result) {
  const params = new URLSearchParams({
    u: url,
    score: result.score.toString(),
    reasons: encodeURIComponent(JSON.stringify(result.reasons)),
  });

  browser.tabs.update(tabId, {
    url: browser.runtime.getURL(`blocked.html?${params.toString()}`),
  });
}

async function verifyWithServer(url, tabId, localResult) {
  try {
    const apiBase = await getApiBase();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${apiBase}/api/scan-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error("Server error");

    const serverResult = await res.json();
    cacheResult(url, serverResult);

    // Update if server found it unsafe
    if (serverResult.verdict === "unsafe" && localResult.verdict !== "unsafe") {
      blockTab(tabId, url, serverResult);
    } else {
      updateBadge(tabId, serverResult.verdict);
    }
  } catch (e) {
    // Keep local result on server error
    console.warn("Server verification failed:", e);
  }
}

// Event listeners
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && /^https?:/.test(changeInfo.url)) {
    scanUrl(changeInfo.url, tabId);
  }
});

browser.tabs.onActivated.addListener((activeInfo) => {
  browser.tabs.get(activeInfo.tabId).then((tab) => {
    if (tab.url && /^https?:/.test(tab.url)) {
      scanUrl(tab.url, activeInfo.tabId);
    }
  });
});

// Context menu
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "scan-link",
    title: "Scan with SentinelPhish",
    contexts: ["link"],
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "scan-link" && info.linkUrl) {
    const result = await quickCheck(info.linkUrl);

    if (result.verdict === "unsafe") {
      browser.tabs.create({
        url: browser.runtime.getURL(
          `blocked.html?u=${encodeURIComponent(info.linkUrl)}&score=${result.score}`,
        ),
      });
    } else {
      browser.notifications.create({
        type: "basic",
        title: "SentinelPhish Scan",
        message: `${result.verdict.toUpperCase()}: ${result.score}/100 risk score`,
      });
    }
  }
});
