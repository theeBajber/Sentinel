// extension/background.js
const CONFIG = {
  API_BASE: "https://sentinel-zeta-pied.vercel.app",
  SCAN_ENDPOINT: "/api/scan-url",
  LOG_ENDPOINT: "/api/logs",
  STATS_ENDPOINT: "/api/stats",
  THREATS_ENDPOINT: "/api/threats",

  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,

  API_KEY: null,
};

// State management
const state = {
  isEnabled: true,
  scanCache: new Map(),
  blockedCount: 0,
  sessionStartTime: Date.now(),
  whitelist: [],
  apiKey: null,
  bypassedUrls: new Set(),
};

// Classification config
const CLASSIFICATION = {
  SAFE: {
    status: "safe",
    color: "#8fd4b2",
    icon: "✓",
    label: "Safe",
  },
  SUSPICIOUS: {
    status: "suspicious",
    color: "#e6c38a",
    icon: "⚠",
    label: "Suspicious",
  },
  UNSAFE: {
    status: "unsafe",
    color: "#f2a7a0",
    icon: "✕",
    label: "Unsafe",
  },
};

// Initialize
browser.runtime.onInstalled.addListener(async () => {
  console.log("🛡️ Sentinel installed");

  // Initialize storage with defaults
  await browser.storage.local.set({
    enabled: true,
    stats: { blocked: 0, scanned: 0 },
    whitelist: [],
    settings: {
      autoBlock: true,
      showNotifications: true,
    },
  });

  // Prompt for API key on first install
  browser.tabs.create({ url: browser.runtime.getURL("setup.html") });
});

// Load state on startup
browser.storage.local
  .get(["enabled", "stats", "whitelist", "apiKey"])
  .then((result) => {
    state.isEnabled = result.enabled !== false;
    state.blockedCount = result.stats?.blocked || 0;
    state.whitelist = result.whitelist || [];
    state.apiKey = result.apiKey || null;

    if (!state.apiKey) {
      console.warn(
        "⚠️ No API key configured. Extension will use public endpoints.",
      );
    }
  });

/**
 * Get API headers with authentication
 */
function getHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };

  if (state.apiKey) {
    headers["X-API-Key"] = state.apiKey;
  }

  return headers;
}

/**
 * Extract domain from URL
 */
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch (e) {
    return null;
  }
}

/**
 * Check if URL is in whitelist
 */
function isWhitelisted(url) {
  const domain = getDomain(url);
  if (!domain) return false;
  return state.whitelist.some(
    (item) => domain.includes(item) || item.includes(domain),
  );
}

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(url, options, attempts = CONFIG.RETRY_ATTEMPTS) {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      // If 401, API key might be invalid
      if (response.status === 401) {
        console.error("API authentication failed");
        // Clear invalid key
        state.apiKey = null;
        browser.storage.local.remove("apiKey");
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise((r) => setTimeout(r, CONFIG.RETRY_DELAY * (i + 1)));
    }
  }
}

/**
 * Scan URL via Sentinel API
 */
async function scanUrl(url) {
  // Check cache first
  const cached = state.scanCache.get(url);
  if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
    return cached.result;
  }

  try {
    const response = await fetchWithRetry(
      `${CONFIG.API_BASE}${CONFIG.SCAN_ENDPOINT}`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ url }),
      },
    );

    const result = await response.json();

    // Cache result
    state.scanCache.set(url, {
      result,
      timestamp: Date.now(),
    });

    return result;
  } catch (error) {
    console.error("Scan failed:", error);
    // Fail open for better UX (or closed for strict security)
    return {
      status: "error",
      verdict: "safe",
      score: 0,
      reasons: ["API unavailable - allowing access"],
      error: error.message,
    };
  }
}

/**
 * Log scan to API (async, fire-and-forget)
 */
async function logScan(url, result, details = {}) {
  try {
    await fetch(`${CONFIG.API_BASE}${CONFIG.LOG_ENDPOINT}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        url,
        verdict: result.verdict || result.status,
        score: result.score || 0,
        reasons: result.reasons || [],
        threatType: result.threatType,
        confidence: result.confidence,
        tabId: details.tabId,
        timestamp: new Date().toISOString(),
        source: "extension",
      }),
    });
  } catch (e) {
    // Silent fail for logging
    console.debug("Log failed:", e);
  }
}

/**
 * Show notification
 */
function showNotification(title, message, type = "basic") {
  browser.storage.local.get(["settings"]).then((result) => {
    if (result.settings?.showNotifications !== false) {
      browser.notifications.create({
        type,
        iconUrl: "icons/icon128.png",
        title,
        message,
      });
    }
  });
}

/**
 * Update badge
 */
function updateBadge(verdict, tabId) {
  const config = CLASSIFICATION[verdict.toUpperCase()] || CLASSIFICATION.SAFE;

  browser.browserAction.setBadgeText({
    text: config.icon,
    tabId,
  });

  browser.browserAction.setBadgeBackgroundColor({
    color: config.color,
    tabId,
  });

  browser.browserAction.setTitle({
    title: `Sentinel: ${config.label}`,
    tabId,
  });
}

/**
 * Main request interceptor - BLOCKS unsafe URLs
 */
browser.webRequest.onBeforeRequest.addListener(
  (details) => {
    // SYNCHRONOUS CHECKS FIRST - must return immediately
    if (!state.isEnabled) return;
    if (details.type !== "main_frame") return;

    const url = details.url;

    // Skip internal URLs (sync)
    if (
      url.startsWith("about:") ||
      url.startsWith("moz-extension:") ||
      url.startsWith("chrome-extension:") ||
      url.startsWith("file:")
    ) {
      return;
    }

    const domain = getDomain(url);

    // SYNC: Check session bypass (immediate allow)
    if (domain && state.bypassedUrls.has(domain)) {
      console.log(`Session bypass active for: ${domain}`);
      return; // Allow through
    }

    // SYNC: Check for bypass param (redirect immediately)
    const bypassRegex = /[?&]sentinel_bypass=1/;
    if (bypassRegex.test(url)) {
      console.log(`Bypass param detected for: ${domain}`);

      // Add to session bypass
      if (domain) {
        state.bypassedUrls.add(domain);
        setTimeout(() => state.bypassedUrls.delete(domain), 5 * 60 * 1000);
      }

      // Strip and redirect (synchronous)
      let cleanUrl = url
        .replace(/[?&]sentinel_bypass=1/, "")
        .replace("?&", "?")
        .replace(/\?$/, "");

      if (cleanUrl !== url) {
        return { redirectUrl: cleanUrl };
      }
      return;
    }

    // SYNC: Check whitelist (immediate allow)
    if (isWhitelisted(url)) {
      updateBadge("safe", details.tabId);
      return;
    }

    // ASYNC: Scan and block (handled separately)
    handleAsyncScan(details, url, domain);

    // Return undefined to let request continue initially
    // The async scan will redirect if needed
  },
  { urls: ["<all_urls>"], types: ["main_frame"] },
  ["blocking"],
);

// Separate async function for scanning
async function handleAsyncScan(details, url, domain) {
  try {
    const result = await scanUrl(url);
    const verdict = result.verdict || result.status || "safe";

    updateBadge(verdict, details.tabId);
    logScan(url, result, { tabId: details.tabId });

    if (verdict === "unsafe" || verdict === "malicious") {
      state.blockedCount++;

      browser.storage.local.get(["stats"]).then((data) => {
        const stats = data.stats || { blocked: 0, scanned: 0 };
        stats.blocked = state.blockedCount;
        browser.storage.local.set({ stats });
      });

      showNotification(
        "🛡️ Threat Blocked",
        `Sentinel prevented access to: ${domain}`,
      );

      const blockedUrl =
        browser.runtime.getURL("blocked.html") +
        "?u=" +
        encodeURIComponent(url) +
        "&score=" +
        encodeURIComponent(result.confidence || result.score || "95") +
        "&reasons=" +
        encodeURIComponent(
          JSON.stringify(result.reasons || ["Phishing detected"]),
        ) +
        "&tabId=" +
        details.tabId;

      // Use tabs.update to redirect since we're async
      browser.tabs.update(details.tabId, { url: blockedUrl });
    }

    if (verdict === "suspicious") {
      showNotification(
        "⚠️ Suspicious Site",
        `Caution: ${domain} flagged as suspicious`,
      );
    }
  } catch (error) {
    console.error("Scan error:", error);
  }
}

/**
 * Handle tab updates
 */
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" && tab.url) {
    browser.browserAction.setBadgeText({ text: "", tabId });
  }
});

/**
 * Message handler for popup
 */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message.action) {
      case "getStatus":
        sendResponse({
          enabled: state.isEnabled,
          blockedCount: state.blockedCount,
          apiKeyConfigured: !!state.apiKey,
          sessionStartTime: state.sessionStartTime,
        });
        break;

      case "toggle":
        state.isEnabled = !state.isEnabled;
        await browser.storage.local.set({ enabled: state.isEnabled });
        sendResponse({ enabled: state.isEnabled });
        break;

      case "scanUrl":
        try {
          const result = await scanUrl(message.url);
          sendResponse(result);
        } catch (error) {
          sendResponse({ error: error.message });
        }
        break;

      case "whitelist":
        const domain = getDomain(message.url);
        if (domain && !state.whitelist.includes(domain)) {
          state.whitelist.push(domain);
          await browser.storage.local.set({ whitelist: state.whitelist });
        }
        sendResponse({ success: true });
        break;

      case "getWhitelist":
        sendResponse({ whitelist: state.whitelist });
        break;

      case "setApiKey":
        state.apiKey = message.apiKey;
        await browser.storage.local.set({ apiKey: message.apiKey });
        sendResponse({ success: true });
        break;

      case "openDashboard":
        browser.tabs.create({ url: CONFIG.API_BASE });
        break;
      case "tempBypass":
        const bypassDomain = getDomain(message.url);
        if (bypassDomain) {
          state.bypassedUrls.add(bypassDomain);
          // Auto-expire after 5 minutes
          setTimeout(
            () => {
              state.bypassedUrls.delete(bypassDomain);
            },
            5 * 60 * 1000,
          );
        }
        sendResponse({ success: true });
        break;
    }
  })();
  return true; // Async response
});

console.log("🛡️ Sentinel background script loaded");
