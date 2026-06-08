// Simple test without module system issues
const fs = require('fs');
const path = require('path');

// Read the files and manually create the scanner logic
const punycodePath = path.join(__dirname, 'lib', 'punycode-polyfill.ts');
const scannerPath = path.join(__dirname, 'lib', 'scanner.ts');

// Read and convert punycode
let punycode = fs.readFileSync(punycodePath, 'utf8');
punycode = punycode.replace(/export const punycode = {/, 'var punycode = {');
punycode = punycode.replace(/toASCII\(input: string\): string {/, 'toASCII(input) {');
punycode = punycode.replace(/toUnicode\(input: string\): string {/, 'toUnicode(input) {');
punycode = punycode.replace(/}: string/g, '}');

// Read and convert scanner
let scanner = fs.readFileSync(scannerPath, 'utf8');

// Remove type annotations and exports
scanner = scanner.replace(/export type ScanResult = \{[\s\S]*?\};/, '');
scanner = scanner.replace(/export async function scanUrl\(inputUrl: string\): Promise<ScanResult> \{/, 'function scanUrl(inputUrl) {');
scanner = scanner.replace(/export /g, '');
scanner = scanner.replace(/const TRUSTED_DOMAINS = new Set\(\[/g, 'var TRUSTED_DOMAINS = new Set([');
scanner = scanner.replace(/function isTrustedDomain\(hostname: string\): boolean \{/, 'function isTrustedDomain(hostname) {');
scanner = scanner.replace(/function deobfuscateHostname\(hostname: string\): string \{/, 'function deobfuscateHostname(hostname) {');
scanner = scanner.replace(/const BRAND_VARIATIONS: Record<string, string\[\]>\ = \{/g, 'var BRAND_VARIATIONS = {');
scanner = scanner.replace(/const HIGH_RISK_HOSTNAME_KEYWORDS: string\[\] = \[/g, 'var HIGH_RISK_HOSTNAME_KEYWORDS = [');
scanner = scanner.replace(/const SUSPICIOUS_KEYWORDS: string\[\] = \[/g, 'var SUSPICIOUS_KEYWORDS = [');
scanner = scanner.replace(/const URL_SHORTENERS: string\[\] = \[/g, 'var URL_SHORTENERS = [');
scanner = scanner.replace(/const SUSPICIOUS_TLDS: string\[\] = \[/g, 'var SUSPICIOUS_TLDS = [');
scanner = scanner.replace(/const CAUTION_TLDS: string\[\] = \[/g, 'var CAUTION_TLDS = [');
scanner = scanner.replace(/function normalizeUrl\(url: string\): string \{/, 'function normalizeUrl(url) {');
scanner = scanner.replace(/let verdict: ScanResult\["verdict"\] = "safe";/, 'var verdict = "safe";');
scanner = scanner.replace(/return \{/g, 'return {');
scanner = scanner.replace(/verdict:/g, 'verdict:');
scanner = scanner.replace(/score:/g, 'score:');
scanner = scanner.replace(/reasons:/g, 'reasons:');
scanner = scanner.replace(/threatType:/g, 'threatType:');
scanner = scanner.replace(/confidence:/g, 'confidence:');

// Add a wrapper to make it work
const wrapper = `
var punycode = { toASCII: function(input) { if (/^[\\x00-\\x7F]+$/.test(input)) return input; try { return new URL(\`http://\${input}\`).hostname; } catch { return input; } }, toUnicode: function(input) { try { return new URL(\`http://\${input}\`).hostname; } catch { return input; } } };

${punycode}

${scanner}

// Simple test
function testUrl(url) {
  try {
    return scanUrl(url);
  } catch (e) {
    return { verdict: "error", score: 0, reasons: [e.message] };
  }
}

// Test cases
const testCases = [
  { url: 'https://amaz0n.com', expected: 'unsafe' },
  { url: 'https://bit.ly/abc123', expected: 'unsafe' },
  { url: 'https://malware-distribution.ru', expected: 'unsafe' },
  { url: 'https://ransomware-c2.net', expected: 'unsafe' },
  { url: 'https://data-exfiltration-hub.xyz', expected: 'unsafe' },
  { url: 'https://secure-login-verify.xyz', expected: 'unsafe' },
  { url: 'https://google.com', expected: 'safe' }
];

console.log('Testing URL scanner...\n');
let allPass = true;

for (const { url, expected } of testCases) {
  const result = testUrl(url);
  const pass = result.verdict === expected;
  allPass = allPass && pass;
  
  console.log(\${pass ? '✓' : '✗'} \${url});
  console.log(\`  Score: \${result.score}, Verdict: \${result.verdict} (expected: \${expected})\`);
  console.log(\`  Reasons: \${result.reasons.join(', ')}\n\`);
}

console.log(allPass ? 'All tests PASSED!' : 'Some tests FAILED!');
`;

// Write to temp file and execute
const tempPath = path.join(__dirname, 'lib', 'scanner_test.js');
fs.writeFileSync(tempPath, wrapper);

// Execute the test
const { execSync } = require('child_process');
const output = execSync(`node \${tempPath}`, { encoding: 'utf8' });
console.log(output);

// Clean up
fs.unlinkSync(tempPath);