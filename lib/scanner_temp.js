// lib/scanner.ts
const punycode = require("./punycode-polyfill");

export type ScanResult = {
  verdict: "safe" | "suspicious" | "unsafe";
  score: number;
  reasons: string[];
  matchedThreatIds?: string[];
  threatType?: string;
  confidence?: number;
};

const TRUSTED_DOMAINS = new Set([
  "google.com",
  "youtube.com",
  "googleapis.com",
  "googleusercontent.com",
  "gstatic.com",
  "google-analytics.com",
  "googletagmanager.com",
  "googleadservices.com",
  "youtu.be",
  "microsoft.com",
  "windows.net",
  "azureedge.net",
  "office.com",
  "live.com",
  "outlook.com",
  "hotmail.com",
  "msn.com",
  "skype.com",
  "bing.com",
  "microsoftonline.com",
  "apple.com",
  "icloud.com",
  "me.com",
  "apple-dns.net",
  "cdn-apple.com",
  "amazon.com",
  "amazonaws.com",
  "cloudfront.net",
  "media-amazon.com",
  "ssl-images-amazon.com",
  "facebook.com",
  "fbcdn.net",
  "facebook.net",
  "fb.com",
  "instagram.com",
  "whatsapp.com",
  "twitter.com",
  "x.com",
  "t.co",
  "twimg.com",
  "linkedin.com",
  "licdn.com",
  "netflix.com",
  "nflxext.com",
  "nflximg.net",
  "nflxvideo.net",
  "spotify.com",
  "spotifycdn.com",
  "scdn.co",
  "dropbox.com",
  "dropboxstatic.com",
  "dropboxusercontent.com",
  "paypal.com",
  "paypalobjects.com",
  "github.com",
  "githubassets.com",
  "githubusercontent.com",
  "stackoverflow.com",
  "stack.imgur.com",
  "reddit.com",
  "redd.it",
  "redditmedia.com",
  "wikipedia.org",
  "wikimedia.org",
  "openai.com",
  "chatgpt.com",
  "chat.com",
  "oaistatic.com",
  "oaiusercontent.com",
  "anthropic.com",
  "claude.ai",
  "poe.com",
  "pinterest.com",
  "pinimg.com",
  "pin.it",
  "tiktok.com",
  "tiktokcdn.com",
  "discord.com",
  "discordapp.com",
  "discord.gg",
  "vercel.app",
  "vercel.com",
  "netlify.app",
  "netlify.com",
  "herokuapp.com",
  "cloudflare.com",
  "workers.dev",
  "pages.dev",
  "firebaseapp.com",
  "firebaseio.com",
  "github.io",
  "gitlab.io",
  "medium.com",
  "substack.com",
  "hashnode.dev",
  "dev.to",
  "producthunt.com",
  "shopify.com",
  "myshopify.com",
  "bigcommerce.com",
  "stripe.com",
  "stripe.network",
  "jsdelivr.net",
  "unpkg.com",
  "cdnjs.cloudflare.com",
  "bootstrapcdn.com",
  "fontawesome.com",
]);

function isTrustedDomain(hostname: string): boolean {
  const parts = hostname.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const domain = parts.slice(i).join(".");
    if (TRUSTED_DOMAINS.has(domain)) return true;
  }
  return TRUSTED_DOMAINS.has(hostname);
}

// Deobfuscate common leetspeak and symbol substitutions
function deobfuscateHostname(hostname: string): string {
  return hostname
    .replace(/0/g, "o")
    .replace(/1/g, "l")
    .replace(/!/g, "l")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/\$/g, "s")
    .replace(/6/g, "b")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/9/g, "g")
    .replace(/@/g, "a")
    .replace(/\\/g, "/")
    .replace(/\|/g, "i")
    .replace(/\+/g, "t")
    .replace(/\(/g, "c")
    .replace(/\)/g, "c")
    .replace(/\[/g, "c")
    .replace(/\]/g, "c")
    .replace(/\{/g, "c")
    .replace(/\}/g, "c")
    .replace(/\?/g, "")
    .replace(/~/g, "")
    .replace(/`/g, "")
    .replace(/"/g, "")
    .replace(/'/g, "");
}

const BRAND_VARIATIONS: Record<string, string[]> = {
  google: [
    "google.com",
    "youtube.com",
    "googleapis.com",
    "googleusercontent.com",
    "gstatic.com",
    "youtu.be",
  ],
  microsoft: [
    "microsoft.com",
    "windows.net",
    "azureedge.net",
    "office.com",
    "live.com",
    "outlook.com",
    "bing.com",
  ],
  apple: ["apple.com", "icloud.com", "me.com", "cdn-apple.com"],
  amazon: ["amazon.com", "amazonaws.com", "cloudfront.net", "media-amazon.com"],
  facebook: [
    "facebook.com",
    "fbcdn.net",
    "fb.com",
    "instagram.com",
    "whatsapp.com",
  ],
  twitter: ["twitter.com", "x.com", "t.co", "twimg.com"],
  netflix: ["netflix.com", "nflxext.com", "nflximg.net"],
  spotify: ["spotify.com", "spotifycdn.com", "scdn.co"],
  dropbox: ["dropbox.com", "dropboxstatic.com"],
  paypal: ["paypal.com", "paypalobjects.com"],
  openai: ["openai.com", "chatgpt.com", "chat.com", "oaistatic.com"],
  pinterest: ["pinterest.com", "pinimg.com", "pin.it"],
  chatgpt: ["chatgpt.com", "chat.com", "openai.com"],
};

// High-risk hostname keywords (malware, phishing, etc.)
const HIGH_RISK_HOSTNAME_KEYWORDS = [
  "malware",
  "ransomware",
  "phishing",
  "exfiltration",
  "credential",
  "steal",
  "fraud",
  "scam",
  "virus",
  "trojan",
  "spyware",
  "exploit",
  "botnet",
  "c2",
  "commandandcontrol",
  "keylogger",
];

// Suspicious hostname/path keywords (often used in phishing)
const SUSPICIOUS_KEYWORDS = [
  "secure",
  "login",
  "verify",
  "update",
  "confirm",
  "signin",
  "password",
  "payment",
  "wallet",
  "crypto",
  "account",
  "reset",
  "auth",
  "support",
  "billing",
  "security",
  "helpdesk",
  "ticket",
  "protect",
  "safe",
];

// URL shorteners (high-risk)
const URL_SHORTENERS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "short.link",
  "tiny.one",
  "buff.ly",
];

// Suspicious TLDs (aggressive scoring)
const SUSPICIOUS_TLDS = [".tk", ".ml", ".ga", ".cf"];

// Caution TLDs (moderate scoring)
const CAUTION_TLDS = [
  ".xyz",
  ".top",
  ".click",
  ".download",
  ".work",
  ".date",
  ".party",
  ".link",
  ".review",
  ".country",
  ".stream",
  ".fit",
  ".gdn",
];

export async function scanUrl(inputUrl: string): Promise<ScanResult> {
  const normalizedUrl = normalizeUrl(inputUrl);
  const urlObj = new URL(normalizedUrl);
  const hostname = urlObj.hostname.toLowerCase();

  if (isTrustedDomain(hostname)) {
    return {
      verdict: "safe",
      score: 0,
      reasons: ["Verified trusted domain"],
      confidence: 100,
    };
  }

  const reasons: string[] = [];
  let score = 0;

  const u = new URL(normalizedUrl);
  const asciiHostname = punycode.toASCII(hostname);
  const deobfuscatedHostname = deobfuscateHostname(asciiHostname);
  const pathname = u.pathname.toLowerCase();
  const search = u.search.toLowerCase();

  // Long subdomain chain
  if (hostname.split(".").length > 5) {
    reasons.push("Long subdomain chain");
    score += 8;
  }

  // Very long hostname
  if (hostname.length > 60) {
    reasons.push("Very long hostname");
    score += 5;
  }

  // Long digit sequences in URL
  if (/[0-9]{6,}/.test(normalizedUrl)) {
    reasons.push("Long digit sequences in URL");
    score += 5;
  }

  // Repeated separators in hostname
  if (/[\-_.]{4,}/.test(hostname)) {
    reasons.push("Repeated separators in hostname");
    score += 6;
  }

  // Control/surrogate characters detected
  if (/[\p{Cc}\p{Cs}]/u.test(normalizedUrl)) {
    reasons.push("Control/surrogate characters detected");
    score += 20;
  }

  // Mixed script hostname (possible homograph attack)
  if (/[\u0400-\u04FF]/.test(hostname) && /[a-zA-Z]/.test(hostname)) {
    reasons.push("Mixed script hostname (possible homograph attack)");
    score += 35;
  }

  // Brand impersonation and typo-squatting detection
  const brandWords = Object.keys(BRAND_VARIATIONS);
  for (const brand of brandWords) {
    // Check if brand appears in deobfuscated hostname
    if (deobfuscatedHostname.includes(brand)) {
      const variations = BRAND_VARIATIONS[brand] || [];
      // Check if the original hostname matches any legitimate variation
      const isLegit = variations.some((d) => hostname === d || hostname.endsWith("." + d));
      if (isLegit) continue;

      // If we get here, the hostname contains the brand (after deobfuscation)
      // but is not a legitimate domain - this is suspicious
      reasons.push(`Brand impersonation detected: ${brand}`);
      score += 50; // Increased from 40 to 50
      
      // Additional score if obfuscation was detected (indicating intentional obfuscation)
      if (deobfuscatedHostname !== asciiHostname) {
        reasons.push("Obfuscated hostname detected");
        score += 15;
      }
    }
  }

  // High-risk hostname keywords
  for (const keyword of HIGH_RISK_HOSTNAME_KEYWORDS) {
    if (deobfuscatedHostname.includes(keyword)) {
      reasons.push(`High-risk hostname keyword: ${keyword}`);
      score += 20;
    }
  }

  // Suspicious hostname keywords
  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (deobfuscatedHostname.includes(keyword)) {
      reasons.push(`Suspicious hostname keyword: ${keyword}`);
      score += 10;
    }
  }

  // Non-HTTPS protocol
  if (u.protocol !== "https:") {
    reasons.push("Non-HTTPS protocol");
    score += 10;
  }

  // URL shortener detection (high-risk)
  for (const shortener of URL_SHORTENERS) {
    if (hostname.includes(shortener)) {
      reasons.push(`URL shortening service: ${shortener}`);
      score += 25; // Increased from 15 to 25 for high-risk
    }
  }

  // Suspicious TLDs (aggressive)
  for (const tld of SUSPICIOUS_TLDS) {
    if (hostname.endsWith(tld)) {
      reasons.push(`Suspicious free TLD: ${tld}`);
      score += 30; // Increased from 20 to 30
    }
  }

  // Caution TLDs (moderate)
  for (const tld of CAUTION_TLDS) {
    if (hostname.endsWith(tld)) {
      reasons.push(`Uncommon TLD: ${tld}`);
      score += 12; // Increased from 8 to 12
    }
  }

  // IP address used as hostname
  if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname)) {
    reasons.push("IP address used as hostname");
    score += 25;
  }

  // Suspicious path patterns
  const phishingPathPatterns = [
    /\/(secure|login|account|verify|update|confirm)\/?$/i,
    /\/(banking|payment|wallet|crypto)\/login/i,
    /\/(signin|password|reset|auth)\/?/i,
    /\/(wallet|crypto|payment)\/?/i,
  ];

  for (const pattern of phishingPathPatterns) {
    if (pattern.test(pathname)) {
      reasons.push("Suspicious path pattern");
      score += 15;
    }
  }

  // Suspicious path/query keywords
  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (pathname.includes(`/${keyword}/`) || pathname.endsWith(`/${keyword}`)) {
      reasons.push(`Suspicious path keyword: ${keyword}`);
      score += 8;
    }
    if (search.includes(`${keyword}=`) || search.includes(`&${keyword}=`)) {
      reasons.push(`Suspicious query keyword: ${keyword}`);
      score += 6;
    }
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  // Adjust verdict thresholds
  let verdict: ScanResult["verdict"] = "safe";
  if (score >= 65) verdict = "unsafe";
  else if (score >= 30) verdict = "suspicious";

  return {
    verdict,
    score,
    reasons: reasons.length ? reasons : ["No suspicious indicators detected"],
    threatType:
      score >= 65
        ? "Heuristic Match"
        : score >= 30
          ? "Suspicious Pattern"
          : undefined,
    confidence: score >= 65 ? 85 : score >= 30 ? 60 : 90,
  };
}

function normalizeUrl(url: string): string {
  // If URL doesn't have a protocol, prepend https://
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString();
  } catch {
    return url;
  }
}
module.exports = { scanUrl };