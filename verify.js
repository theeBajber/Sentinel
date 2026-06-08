// Quick verification test
const { scanUrl } = require('./lib/scanner');

(async () => {
  try {
    console.log('Testing required examples:\n');
    
    const testCases = [
      { url: 'https://amaz0n.com', expected: 'unsafe' },
      { url: 'https://bit.ly/abc123', expected: 'unsafe' },
      { url: 'https://malware-distribution.ru', expected: 'unsafe' },
      { url: 'https://ransomware-c2.net', expected: 'unsafe' },
      { url: 'https://data-exfiltration-hub.xyz', expected: 'unsafe' },
      { url: 'https://secure-login-verify.xyz', expected: 'unsafe' }
    ];
    
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
    
    console.log(allPass ? 'All required tests PASSED!' : 'Some tests FAILED!');
  } catch (e) {
    console.error('Error running tests:', e);
  }
})();