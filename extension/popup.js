let currentTab = null;
let isEnabled = true;
let apiKeyConfigured = false;

const elements = {
  statusCard: document.getElementById("statusCard"),
  statusBadge: document.getElementById("statusBadge"),
  statusText: document.getElementById("statusText"),
  toggleSwitch: document.getElementById("toggleSwitch"),
  blockedCount: document.getElementById("blockedCount"),
  sessionTime: document.getElementById("sessionTime"),
  currentUrl: document.getElementById("currentUrl"),
  siteStatus: document.getElementById("siteStatus"),
  whitelistBtn: document.getElementById("whitelistBtn"),
  dashboardBtn: document.getElementById("dashboardBtn"),
  scanBtn: document.getElementById("scanBtn"),
  siteCard: document.getElementById("siteCard"),
  apiKeyBanner: null, // Will create dynamically
};
async function init() {
  // Get current tab
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  currentTab = tabs[0];

  // Load state from background
  const response = await browser.runtime.sendMessage({ action: "getStatus" });
  isEnabled = response.enabled;
  apiKeyConfigured = response.apiKeyConfigured;

  // Show API key warning if not configured
  if (!apiKeyConfigured) {
    showApiKeyWarning();
  }

  // Update UI
  updateToggleState(isEnabled);
  elements.blockedCount.textContent = response.blockedCount || 0;

  // Calculate session time
  const sessionTime = Math.floor(
    (Date.now() - response.sessionStartTime) / 60000,
  );
  elements.sessionTime.textContent = sessionTime + "m";

  // Display current URL
  if (currentTab?.url) {
    const url = new URL(currentTab.url);
    elements.currentUrl.textContent = url.hostname;

    // Skip internal pages
    if (url.protocol.startsWith("http")) {
      scanCurrentPage();
    } else {
      elements.siteStatus.className = "site-status";
      elements.siteStatus.textContent = "Internal Page";
      elements.siteCard.style.opacity = "0.5";
    }
  }

  // Setup event listeners
  setupEventListeners();
}

/**
 * Show API key warning banner
 */
function showApiKeyWarning() {
  const banner = document.createElement("div");
  banner.className = "api-key-warning";
  banner.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #ffb4ab20, #ffb4ab10);
      border: 1px solid var(--color-accent-rose);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
      font-size: 12px;
    ">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span>⚠️</span>
        <strong style="color: var(--color-accent-rose);">API Key Not Configured</strong>
      </div>
      <p style="color: var(--color-text-muted); margin-bottom: 8px;">
        Extension is running in public mode with limited features.
      </p>
      <button id="setupApiKey" style="
        background: var(--color-accent-rose);
        color: var(--color-bg-primary);
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
      ">Configure API Key</button>
    </div>
  `;

  const container = document.querySelector(".container");
  container.insertBefore(banner, container.children[1]);

  document.getElementById("setupApiKey").addEventListener("click", () => {
    browser.tabs.create({ url: browser.runtime.getURL("setup.html") });
    window.close();
  });
}

/**
 * Update toggle visual state
 */
function updateToggleState(enabled) {
  isEnabled = enabled;

  if (enabled) {
    elements.toggleSwitch.classList.add("active");
    elements.statusCard.classList.remove("inactive");
    elements.statusCard.classList.add("active");
    elements.statusBadge.classList.remove("inactive");
    elements.statusBadge.classList.add("active");
    elements.statusText.textContent = "Active";
  } else {
    elements.toggleSwitch.classList.remove("active");
    elements.statusCard.classList.remove("active");
    elements.statusCard.classList.add("inactive");
    elements.statusBadge.classList.remove("active");
    elements.statusBadge.classList.add("inactive");
    elements.statusText.textContent = "Paused";
  }
}

/**
 * Scan current page
 */
async function scanCurrentPage() {
  if (!currentTab?.url) return;

  elements.siteStatus.className = "site-status scanning";
  elements.siteStatus.innerHTML = '<span class="loading"></span> Scanning...';
  elements.whitelistBtn.classList.add("hidden");

  try {
    const result = await browser.runtime.sendMessage({
      action: "scanUrl",
      url: currentTab.url,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    const verdict = result.verdict || result.status || "safe";

    // Update status display
    elements.siteStatus.className = `site-status ${verdict}`;

    const statusConfig = {
      safe: { icon: "✓", text: "Safe" },
      suspicious: { icon: "⚠", text: "Suspicious" },
      unsafe: { icon: "✕", text: "Unsafe" },
      error: { icon: "?", text: "Unknown" },
    };

    const config = statusConfig[verdict] || statusConfig.error;
    elements.siteStatus.textContent = `${config.icon} ${config.text}`;

    // Show whitelist button for safe sites
    if (verdict === "safe") {
      elements.whitelistBtn.classList.remove("hidden");
    }
  } catch (error) {
    elements.siteStatus.className = "site-status";
    elements.siteStatus.textContent = "Scan Failed";
    console.error("Scan error:", error);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Toggle protection
  elements.toggleSwitch.addEventListener("click", async () => {
    const response = await browser.runtime.sendMessage({ action: "toggle" });
    updateToggleState(response.enabled);
  });

  // Open dashboard
  elements.dashboardBtn.addEventListener("click", () => {
    browser.runtime.sendMessage({ action: "openDashboard" });
    window.close();
  });

  // Scan button
  elements.scanBtn.addEventListener("click", () => {
    scanCurrentPage();
  });

  // Whitelist button
  elements.whitelistBtn.addEventListener("click", async () => {
    if (currentTab?.url) {
      await browser.runtime.sendMessage({
        action: "whitelist",
        url: currentTab.url,
      });
      elements.whitelistBtn.textContent = "✓ Whitelisted";
      elements.whitelistBtn.disabled = true;
      setTimeout(() => window.close(), 1000);
    }
  });
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", init);
