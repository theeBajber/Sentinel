// Test the final scanner logic
function deobfuscateHostname(hostname) {
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

function punycodeToASCII(hostname) {
  // Simple implementation - if it's already ASCII, return as-is
  if (/^[\x00-\x7F]+$/.test(hostname)) {
    return hostname;
  }
  // For non-ASCII, we'd use punycode but for our test cases, ASCII is fine
  return hostname;
}

function isTrustedDomain(hostname) {
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

  const parts = hostname.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const domain = parts.slice(i).join(".");
    if (TRUSTED_DOMAINS.has(domain)) return true;
  }
  return TRUSTED_DOMAINS.has(hostname);
}

function scanUrlLogic(inputUrl) {
  // Normalize URL
  let url = inputUrl;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  
  try {
    const u = new URL(url);
    u.hash = "";
    url = u.toString();
  } catch {
    // If URL parsing fails, return unsafe
    return {
      verdict: "unsafe",
      score: 100,
      reasons: ["Invalid URL"],
      threatType: "Heuristic Match",
      confidence: 90
    };
  }
  
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.toLowerCase();
  const pathname = urlObj.pathname.toLowerCase();
  const search = urlObj.search.toLowerCase();

  if (isTrustedDomain(hostname)) {
    return {
      verdict: "safe",
      score: 0,
      reasons: ["Verified trusted domain"],
      threatType: undefined,
      confidence: 100
    };
  }

  const reasons = [];
  let score = 0;

  const asciiHostname = punycodeToASCII(hostname);
  const deobfuscatedHostname = deobfuscateHostname(asciiHostname);

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
  if (/[0-9]{6,}/.test(url)) {
    reasons.push("Long digit sequences in URL");
    score += 5;
  }

  // Repeated separators in hostname
  if (/[\-_.]{4,}/.test(hostname)) {
    reasons.push("Repeated separators in hostname");
    score += 6;
  }

  // Control/surrogate characters detected (simplified)
  if (/[\x00-\x1F\x7F-\x9F]/.test(url)) {
    reasons.push("Control/surrogate characters detected");
    score += 20;
  }

  // Mixed script hostname (possible homograph attack) - simplified
  if (/[^\x00-\x7F]/.test(hostname) && /[a-zA-Z]/.test(hostname)) {
    reasons.push("Mixed script hostname (possible homograph attack)");
    score += 35;
  }

  // Brand impersonation and typo-squatting detection
  const BRAND_VARIATIONS = {
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

  const brandWords = Object.keys(BRAND_VARIATIONS);
  for (const brand of brandWords) {
    if (deobfuscatedHostname.includes(brand)) {
      const variations = BRAND_VARIATIONS[brand] || [];
      const isLegit = variations.some((d) => hostname === d || hostname.endsWith("." + d));
      if (isLegit) continue;

      reasons.push(`Brand impersonation detected: ${brand}`);
      score += 50;
      
      if (deobfuscatedHostname !== asciiHostname) {
        reasons.push("Obfuscated hostname detected");
        score += 15;
      }
    }
  }

  // High-risk hostname keywords - INCREASED SCORE
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

  for (const keyword of HIGH_RISK_HOSTNAME_KEYWORDS) {
    if (deobfuscatedHostname.includes(keyword)) {
      reasons.push(`High-risk hostname keyword: ${keyword}`);
      score += 65; // Increased from 30 to 65
    }
  }

  // Suspicious hostname/path keywords - INCREASED SCORE
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

  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (deobfuscatedHostname.includes(keyword)) {
      reasons.push(`Suspicious hostname keyword: ${keyword}`);
      score += 20; // Increased from 10 to 20
    }
  }

  // Non-HTTPS protocol
  if (urlObj.protocol !== "https:") {
    reasons.push("Non-HTTPS protocol");
    score += 10;
  }

  // URL shortener detection (high-risk) - INCREASED SCORE
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

  for (const shortener of URL_SHORTENERS) {
    if (hostname.includes(shortener)) {
      reasons.push(`URL shortening service: ${shortener}`);
      score += 65; // Increased from 25 to 65
    }
  }

  // Suspicious TLDs (aggressive)
  const SUSPICIOUS_TLDS = [".tk", ".ml", ".ga", ".cf"];
  for (const tld of SUSPICIOUS_TLDS) {
    if (hostname.endsWith(tld)) {
      reasons.push(`Suspicious free TLD: ${tld}`);
      score += 30; // Increased from 20 to 30
    }
  }

  // Caution TLDs (moderate)
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

  // Adjust verdict thresholds (as per requirements)
  let verdict = "safe";
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
    confidence: score >= 65 ? 85 : score >= 30 ? 60 : 90
  };
}

// Test the logic with the required examples
const testUrls = [
  "https://amaz0n.com",
  "https://bit.ly/abc123",
  "https://malware-distribution.ru",
  "https://ransomware-c2.net",
  "https://data-exfiltration-hub.xyz",
  "https://secure-login-verify.xyz",
  "https://google.com",
  "https://example.com"
];

console.log('Testing FINAL URL scanner logic...\n');

for (const url of testUrls) {
  const result = scanUrlLogic(url);
  console.log(`${url}:`);
  console.log(`  Score: ${result.score}`);
  console.log(`  Verdict: ${result.verdict}`);
  console.log(`  Reasons: ${result.reasons.join(', ')}`);
  console.log();
}