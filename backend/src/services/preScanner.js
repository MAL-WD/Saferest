/**
 * Pre-scan code for obvious patterns before sending to Gemini
 * Returns quick findings for instant feedback
 */

const PRESCAN_PATTERNS = [
  // Hardcoded Secrets - CRITICAL
  {
    name: 'Hardcoded AWS Key',
    regex: /AKIA[0-9A-Z]{16}/,
    severity: 'critical',
    category: 'Hardcoded Secret',
    owaspCategory: 'A02:2021',
    cwe: 'CWE-798',
    title: 'AWS Access Key Found in Code',
    description: 'AWS access key exposed in source code. This should never be hardcoded.',
  },
  {
    name: 'Hardcoded Password',
    regex: /password\s*[=:]\s*['"][^'"]{4,}['"]/i,
    severity: 'critical',
    category: 'Hardcoded Secret',
    owaspCategory: 'A02:2021',
    cwe: 'CWE-798',
    title: 'Password Hardcoded in Source',
    description: 'Database or application password found in source code.',
  },
  {
    name: 'Hardcoded API Key',
    regex: /api[_-]?key\s*[:=]\s*['"][^'"]{8,}['"]/i,
    severity: 'critical',
    category: 'Hardcoded Secret',
    owaspCategory: 'A02:2021',
    cwe: 'CWE-798',
    title: 'API Key Hardcoded',
    description: 'API key exposed in source code. Should use environment variables.',
  },
  {
    name: 'GitHub/Stripe Token',
    regex: /(?:ghp_|sk_live_|pk_live_)[a-zA-Z0-9]{20,}/,
    severity: 'critical',
    category: 'Hardcoded Secret',
    owaspCategory: 'A02:2021',
    cwe: 'CWE-798',
    title: 'GitHub or Payment Token Exposed',
    description: 'GitHub PAT or Stripe API key found in source code.',
  },

  // Injection - HIGH
  {
    name: 'SQL String Concatenation or Template Literal',
    regex: /(?:["']\s*\+\s*(?:req\.|params\.|query\.|user_input|request\.)|`[^`]*\$\{(?:req\.|params\.|query\.)[^}]*\}[^`]*`\s*(?:\)|;)?)/i,
    severity: 'high',
    category: 'SQL Injection',
    owaspCategory: 'A03:2021',
    cwe: 'CWE-89',
    title: 'Possible SQL Injection via String Interpolation/Concatenation',
    description: 'SQL query constructed using untrusted input. Use parameterized queries.',
  },
  {
    name: 'eval() Call',
    regex: /\beval\s*\(/,
    severity: 'high',
    category: 'Code Injection',
    owaspCategory: 'A03:2021',
    cwe: 'CWE-95',
    title: 'eval() Function Detected',
    description: 'eval() can execute arbitrary code. Avoid using it.',
  },
  {
    name: 'exec() Call',
    regex: /\bexec\s*\(/,
    severity: 'high',
    category: 'Code Injection',
    owaspCategory: 'A03:2021',
    cwe: 'CWE-95',
    title: 'exec() Function Detected',
    description: 'exec() executes arbitrary code. Avoid using it.',
  },
  {
    name: 'OS Command Injection Risk',
    regex: /(?:shell\s*=\s*True|subprocess\.call|os\.system|child_process\.exec)/i,
    severity: 'high',
    category: 'Command Injection',
    owaspCategory: 'A03:2021',
    cwe: 'CWE-78',
    title: 'Possible Command Injection Vulnerability',
    description: 'OS command execution detected. Validate all user inputs.',
  },
  {
    name: 'Dangerous Deserialization',
    regex: /(?:pickle\.loads|yaml\.load\(|unserialize\()/i,
    severity: 'critical',
    category: 'Insecure Deserialization',
    owaspCategory: 'A08:2021',
    cwe: 'CWE-502',
    title: 'Unsafe Deserialization Detected',
    description: 'Using unsafe deserialization with untrusted data.',
  },

  // Crypto - MEDIUM/HIGH
  {
    name: 'Weak Hash Algorithm',
    regex: /\b(?:md5|sha1)\s*\(|createHash\(['"](?:md5|sha1)['"]\)/i,
    severity: 'medium',
    category: 'Weak Cryptography',
    owaspCategory: 'A02:2021',
    cwe: 'CWE-327',
    title: 'Weak Hash Function Used',
    description: 'MD5 and SHA1 are cryptographically broken. Use SHA256, bcrypt, or Argon2.',
  },
  {
    name: 'SSL Verification Disabled',
    regex: /(?:verify\s*=\s*False|rejectUnauthorized\s*:\s*false|InsecureRequestWarning)/i,
    severity: 'high',
    category: 'SSL/TLS Configuration',
    owaspCategory: 'A02:2021',
    cwe: 'CWE-295',
    title: 'SSL/TLS Verification Disabled',
    description: 'Certificate verification disabled. Leaves connection vulnerable to MITM attacks.',
  },

  // Data Exposure - LOW/MEDIUM
  {
    name: 'Insecure HTTP URL',
    regex: /http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/,
    severity: 'medium',
    category: 'Insecure Transport',
    owaspCategory: 'A02:2021',
    cwe: 'CWE-295',
    title: 'Unencrypted HTTP Used',
    description: 'Use HTTPS instead of HTTP for remote connections.',
  },
  {
    name: 'Sensitive Data in console.log',
    regex: /console\.log\s*\([^)]*(?:password|token|secret|apiKey|credential)[^)]*\)/i,
    severity: 'low',
    category: 'Sensitive Data Exposure',
    owaspCategory: 'A09:2021',
    cwe: 'CWE-532',
    title: 'Sensitive Data Logged to Console',
    description: 'Passwords or tokens logged to console. Remove before production.',
  },

  // Other Issues
  {
    name: 'Path Traversal Risk',
    regex: /(?:['"]\.\.\/|['"]\.\.\\|path\s*=\s*['"]\.\.\/|path\s*=\s*['"]\.\.\\(?![\w])|\breadFileSync\s*\([^)]*(?:req\.|params\.|query\.)[^)]*\))/i,
    severity: 'medium',
    category: 'Path Traversal',
    owaspCategory: 'A01:2021',
    cwe: 'CWE-22',
    title: 'Path Traversal / LFI Pattern Detected',
    description: 'Unvalidated user input used in file system operations.',
  },
  {
    name: 'Reflected XSS',
    regex: /\b(?:res\.send|res\.write|document\.write|innerHTML)\s*\([^)]*(?:req\.|params\.|query\.|user_input)[^)]*\)/i,
    severity: 'high',
    category: 'Cross-Site Scripting (XSS)',
    owaspCategory: 'A03:2021',
    cwe: 'CWE-79',
    title: 'Possible Reflected XSS',
    description: 'Untrusted user input written directly to response/DOM without sanitization.',
  },
  {
    name: 'Weak Random',
    regex: /(?:Math\.random\(\)|rand\(\)|random\.random\(\))\s*[*]/,
    severity: 'low',
    category: 'Weak Cryptography',
    owaspCategory: 'A02:2021',
    cwe: 'CWE-338',
    title: 'Weak Random Number Generator',
    description: 'Math.random() or similar used for security purposes. Use crypto-safe random.',
  },
  {
    name: 'TODO Security Note',
    regex: /(?:TODO|FIXME|HACK)[^\n]*(?:auth|security|password|inject|csrf|xss|sql)[^\n]*/i,
    severity: 'info',
    category: 'Code Quality',
    owaspCategory: 'A04:2021',
    cwe: 'CWE-391',
    title: 'Security TODO/FIXME Found',
    description: 'Code contains security-related TODO or FIXME comments.',
  },
];

/**
 * Run pre-scan on code to detect obvious patterns
 * @param {string} code - Source code to scan
 * @returns {Array} - Array of pre-scan findings
 */
function preScan(code) {
  const findings = [];

  PRESCAN_PATTERNS.forEach((pattern) => {
    const matches = code.match(new RegExp(pattern.regex, 'gm')) || [];

    if (matches.length > 0) {
      // Find line numbers for each match
      const lines = code.split('\n');
      let charCount = 0;

      matches.forEach((match) => {
        let currentChar = 0;
        for (let i = 0; i < lines.length; i++) {
          const lineLength = lines[i].length + 1; // +1 for newline
          if (charCount + lineLength > code.indexOf(match, charCount)) {
            findings.push({
              pattern: pattern.name,
              line: i + 1,
              severity: pattern.severity,
              category: pattern.category,
              owaspCategory: pattern.owaspCategory,
              cwe: pattern.cwe,
              title: pattern.title,
              description: pattern.description,
              snippet: match.substring(0, 50),
            });
            charCount += lineLength;
            break;
          }
          charCount += lineLength;
        }
      });
    }
  });

  return findings;
}

/**
 * Format pre-scan findings for Claude prompt
 * @param {Array} findings - Pre-scan findings
 * @returns {string} - Formatted string for prompt
 */
function formatForPrompt(findings) {
  if (!findings || findings.length === 0) {
    return '(none)';
  }

  return findings
    .map((f) => `- [${f.severity.toUpperCase()}] ${f.title} (${f.cwe}) at line ${f.line}`)
    .join('\n');
}

module.exports = {
  preScan,
  formatForPrompt,
  PRESCAN_PATTERNS,
};
