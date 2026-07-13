/**
 * Detect programming language from file extension and/or code content
 */

const LANGUAGE_MAP = {
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  pyw: 'python',
  php: 'php',
  phtml: 'php',
  cs: 'csharp',
  rb: 'ruby',
  rake: 'ruby',
  go: 'go',
  java: 'java',
  vue: 'javascript',
};

const LANGUAGE_PATTERNS = {
  javascript: {
    keywords: /(?:require|module\.exports|const|let|var|=>|function)/i,
    indicators: ['require(', 'module.exports', '=>', 'const ', 'let ', 'var '],
  },
  typescript: {
    keywords: /(?:interface|type\s|:\s*string|:\s*number|as\s+\w+)/i,
    indicators: ['interface ', 'type ', ': string', ': number', 'as '],
  },
  python: {
    keywords: /(?:def\s|import\s|print\(|if\s+__name__|from\s+\w+\s+import)/i,
    indicators: ['def ', 'import ', 'print(', 'if __name__', 'from '],
  },
  php: {
    keywords: /(?:<\?php|\$\w+|echo\s|function\s|->\w+\()/i,
    indicators: ['<?php', '$', 'echo ', 'function ', '->'],
  },
  csharp: {
    keywords: /(?:using\s|namespace\s|public\s+class|\[Attribute)/i,
    indicators: ['using ', 'namespace ', 'public class ', '[Attribute'],
  },
  ruby: {
    keywords: /(?:def\s|end\b|require\s|puts\s|attr_accessor)/i,
    indicators: ['def ', 'end', 'require ', 'puts ', 'attr_accessor'],
  },
  go: {
    keywords: /(?:package\s|import\s*\(|func\s|:=)/i,
    indicators: ['package ', 'import (', 'func ', ':='],
  },
  java: {
    keywords: /(?:public\s+class|import\s+java|System\.out|@Override)/i,
    indicators: ['public class', 'import java', 'System.out', '@Override'],
  },
};

/**
 * Detect language from file extension
 * @param {string} filename - File name with extension
 * @returns {string|null} - Language name or null
 */
function detectByExtension(filename) {
  if (!filename) return null;
  const ext = filename.split('.').pop()?.toLowerCase();
  return LANGUAGE_MAP[ext] || null;
}

/**
 * Detect language from code content using keyword patterns
 * @param {string} code - Source code
 * @returns {string|null} - Language name or null
 */
function detectByContent(code) {
  if (!code || code.length < 10) return null;

  const scores = {};

  // Score each language based on pattern matches
  Object.entries(LANGUAGE_PATTERNS).forEach(([lang, { keywords, indicators }]) => {
    scores[lang] = 0;

    // Check keyword regex (weight: 2)
    const keywordMatches = code.match(keywords);
    if (keywordMatches) {
      scores[lang] += keywordMatches.length * 2;
    }

    // Check indicators (weight: 1)
    indicators.forEach((indicator) => {
      const count = (code.match(new RegExp(indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      scores[lang] += count;
    });
  });

  // Return language with highest score
  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[1] > 0 ? entries[0][0] : null;
}

/**
 * Detect language from extension with fallback to content analysis
 * @param {string} filename - File name (may be empty)
 * @param {string} code - Source code
 * @returns {string|null} - Detected language
 */
function detectLanguage(filename, code) {
  // Try extension first
  if (filename) {
    const extLang = detectByExtension(filename);
    if (extLang) return extLang;
  }

  // Fall back to content analysis
  if (code) {
    const contentLang = detectByContent(code);
    if (contentLang) return contentLang;
  }

  return null;
}

/**
 * Validate if a language is supported
 * @param {string} language - Language name
 * @returns {boolean}
 */
function isSupported(language) {
  return Object.values(LANGUAGE_MAP).includes(language?.toLowerCase());
}

/**
 * Get list of supported languages
 * @returns {string[]}
 */
function getSupportedLanguages() {
  return [...new Set(Object.values(LANGUAGE_MAP))];
}

module.exports = {
  detectLanguage,
  detectByExtension,
  detectByContent,
  isSupported,
  getSupportedLanguages,
};
