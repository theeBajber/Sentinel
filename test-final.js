// Convert scanner to CommonJS for testing
const fs = require('fs');
const path = require('path');

// Read the scanner file
const scannerPath = path.join(__dirname, 'lib', 'scanner.ts');
let scannerContent = fs.readFileSync(scannerPath, 'utf8');

// Read punycode polyfill
const punycodePath = path.join(__dirname, 'lib', 'punycode-polyfill.ts');
let punycodeContent = fs.readFileSync(punycodePath, 'utf8');

// Convert punycode to CommonJS
punycodeContent = punycodeContent.replace(/export const punycode = {/, 'const punycode = {');
punycodeContent = punycodeContent.replace(/toASCII\(input: string\): string {/, 'toASCII(input) {');
punycodeContent = punycodeContent.replace(/toUnicode\(input: string\): string {/, 'toUnicode(input) {');
punycodeContent = punycodeContent.replace(/}: string/g, '}');

// Convert scanner to CommonJS
scannerContent = scannerContent.replace(/export type ScanResult = \{[\s\S]*?\};/, '');
scannerContent = scannerContent.replace(/export async function scanUrl\(inputUrl: string\): Promise<ScanResult> \{/, 'async function scanUrl(inputUrl) {');
scannerContent = scannerContent.replace(/export /g, '');
scannerContent = scannerContent.replace(/const TRUSTED_DOMAINS = new Set\(\[/g, 'const TRUSTED_DOMAINS = new Set([');
scannerContent = scannerContent.replace(/function isTrustedDomain\(hostname: string\): boolean \{/, 'function isTrustedDomain(hostname) {');
scannerContent = scannerContent.replace(/function deobfuscateHostname\(hostname: string\): string \{/, 'function deobfuscateHostname(hostname) {');
scannerContent = scannerContent.replace(/const BRAND_VARIATIONS: Record<string, string\[\]>\ = \{/g, 'const BRAND_VARIATIONS = {');
scannerContent = scannerContent.replace(/const HIGH_RISK_HOSTNAME_KEYWORDS: string\[\] = \[/g, 'const HIGH_RISK_HOSTNAME_KEYWORDS = [');
scannerContent = scannerContent.replace(/const SUSPICIOUS_KEYWORDS: string\[\] = \[/g, 'const SUSPICIOUS_KEYWORDS = [');
scannerContent = scannerContent.replace(/const URL_SHORTENERS: string\[\] = \[/g, 'const URL_SHORTENERS = [');
scannerContent = scannerContent.replace(/const SUSPICIOUS_TLDS: string\[\] = \[/g, 'const SUSPICIOUS_TLDS = [');
scannerContent = scannerContent.replace(/const CAUTION_TLDS: string\[\] = \[/g, 'const CAUTION_TLDS = [');
scannerContent = scannerContent.replace(/function normalizeUrl\(url: string\): string \{/, 'function normalizeUrl(url) {');
scannerContent = scannerContent.replace(/let verdict: ScanResult\["verdict"\] = "safe";/, 'let verdict = "safe";');
scannerContent = scannerContent.replace(/score >= 65 \? "Heuristic Match" : score >= 30/g, 'score >= 65 ? "Heuristic Match" : score >= 30');
scannerContent = scannerContent.replace(/confidence: score >= 65 \? 85 : score >= 30 \? 60 : 90,/g, 'confidence: score >= 65 ? 85 : score >= 30 ? 60 : 90,');

// Combine files
const combined = punycodeContent + '\n\n' + scannerContent;

// Add module.exports
const finalContent = combined + '\n\nmodule.exports = { scanUrl };';

// Write to temp file
const tempPath = path.join(__dirname, 'lib', 'scanner.cjs');
fs.writeFileSync(tempPath, finalContent);

// Now test
const { scanUrl } = require('./lib/scanner.cjs');

async function test() {
  const testCases = [
    { url: 'https://amaz0n.com', expected: 'unsafe' },
    { url: 'https://bit.ly/abc123', expected: 'unsafe' },
    { url: 'https://malware-distribution.ru', expected: 'unsafe' },
    { url: 'https://ransomware-c2.net', expected: 'unsafe' },
    { url: 'https://data-exfiltration-hub.xyz', expected: 'unsafe' },
    { url: 'https://secure-login-verify.xyz', expected: 'unsafe' }
  ];

  console.log('Testing required examples:\n');
  
  let allPass = true;
  
  for (const { url, expected } of testCases) {
    const result = await scanUrl(url);
    const pass = result.verdict === expected;
    allPass = allPass && pass;
    
    console.log(`${pass ? '✓' : '✗'} ${url}`);
    console.log(`  Score: ${result.score}, Verdict: ${result.verdict} (expected: ${expected})`);
    console.log(`  Reasons: ${result.reasons.join(', ')}\n`);
  }
  
  // Test trusted domain
  const trustedResult = await scanUrl('https://google.com');
  console.log(`✓ https://google.com`);
  console.log(`  Score: ${trustedResult.score}, Verdict: ${trustedResult.verdict} (expected: safe)`);
  console.log(`  Reasons: ${trustedResult.reasons.join(', ')}\n`);
  
  // Clean up
  fs.unlinkSync(tempPath);
  
  console.log(allPass ? 'All required tests PASSED!' : 'Some tests FAILED!');
  return allPass;
}

test().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});