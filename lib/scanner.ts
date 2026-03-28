// lib/scanner.ts
import { punycode } from "./punycode-polyfill";

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
  const pathname = u.pathname.toLowerCase();

  if (hostname.split(".").length > 5) {
    reasons.push("Long subdomain chain");
    score += 8;
  }

  if (hostname.length > 60) {
    reasons.push("Very long hostname");
    score += 5;
  }

  if (/[0-9]{6,}/.test(normalizedUrl)) {
    reasons.push("Long digit sequences in URL");
    score += 5;
  }

  if (/[\-_.]{4,}/.test(hostname)) {
    reasons.push("Repeated separators in hostname");
    score += 6;
  }

  if (/[\p{Cc}\p{Cs}]/u.test(normalizedUrl)) {
    reasons.push("Control/surrogate characters detected");
    score += 20;
  }

  if (/[\u0400-\u04FF]/.test(hostname) && /[a-zA-Z]/.test(hostname)) {
    reasons.push("Mixed script hostname (possible homograph attack)");
    score += 35;
  }

  const brandWords = Object.keys(BRAND_VARIATIONS);
  for (const brand of brandWords) {
    if (asciiHostname.includes(brand)) {
      const variations = BRAND_VARIATIONS[brand] || [];
      const isLegit = variations.some((d) => hostname.endsWith(d));
      if (isLegit) continue;

      const suspiciousPatterns = [
        new RegExp(
          `${brand}-(secure|login|account|verify|update|confirm|auth|signin|password)`,
          "i",
        ),
        new RegExp(
          `(secure|login|account|verify|update|confirm|auth|signin|password)-${brand}`,
          "i",
        ),
        new RegExp(`${brand}\\d+`, "i"),
        new RegExp(
          `${brand}[a-z]{1,2}\\.(tk|ml|ga|cf|top|xyz|click|download|work|date)`,
          "i",
        ),
      ];

      const hasSuspiciousPattern = suspiciousPatterns.some((p) =>
        p.test(asciiHostname),
      );

      if (hasSuspiciousPattern) {
        reasons.push(`Brand impersonation detected: ${brand}`);
        score += 40;
      }
    }
  }

  if (u.protocol !== "https:") {
    reasons.push("Non-HTTPS protocol");
    score += 10;
  }

  const shorteners = [
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "goo.gl",
    "ow.ly",
    "is.gd",
    "short.link",
  ];
  for (const shortener of shorteners) {
    if (hostname.includes(shortener)) {
      reasons.push(`URL shortening service: ${shortener}`);
      score += 15;
    }
  }

  const suspiciousTlds = [".tk", ".ml", ".ga", ".cf"];
  for (const tld of suspiciousTlds) {
    if (hostname.endsWith(tld)) {
      reasons.push(`Suspicious free TLD: ${tld}`);
      score += 20;
    }
  }

  const cautionTlds = [
    ".click",
    ".download",
    ".top",
    ".xyz",
    ".work",
    ".date",
    ".party",
    ".link",
  ];
  for (const tld of cautionTlds) {
    if (hostname.endsWith(tld)) {
      reasons.push(`Uncommon TLD: ${tld}`);
      score += 8;
    }
  }

  if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname)) {
    reasons.push("IP address used as hostname");
    score += 25;
  }

  const phishingPathPatterns = [
    /\/(secure|login|account|verify|update|confirm)\/?$/i,
    /\/(banking|payment|wallet|crypto)\/login/i,
  ];

  for (const pattern of phishingPathPatterns) {
    if (pattern.test(pathname)) {
      reasons.push("Suspicious path pattern");
      score += 15;
    }
  }

  score = Math.max(0, Math.min(100, score));

  let verdict: ScanResult["verdict"] = "safe";
  if (score >= 75) verdict = "unsafe";
  else if (score >= 40) verdict = "suspicious";

  return {
    verdict,
    score,
    reasons: reasons.length ? reasons : ["No suspicious indicators detected"],
    threatType:
      score >= 75
        ? "Heuristic Match"
        : score >= 40
          ? "Suspicious Pattern"
          : undefined,
    confidence: score >= 75 ? 85 : score >= 40 ? 60 : 90,
  };
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString();
  } catch {
    return url;
  }
}
