// src/services/spider.js
const { chromium } = require('playwright');
const URL = require('url');
const logger = require('../utils/logger');

class Spider {
  constructor(targetUrl, maxDepth = 2, maxPages = 20) {
    this.baseUrl = new URL.URL(targetUrl).origin;
    this.startUrl = targetUrl;
    this.maxDepth = maxDepth;
    this.maxPages = maxPages;
    
    this.visited = new Set();
    this.queue = [{ url: targetUrl, depth: 0 }];
    
    this.discoveredUrls = new Set();
    this.discoveredForms = [];
  }

  async crawl() {
    logger.info(`[Spider] Starting deep crawl on ${this.startUrl}`);
    
    let browser;
    try {
      browser = await chromium.launch({ headless: true });
    } catch (err) {
      logger.error(`[Spider] Failed to launch browser: ${err.message}. Ensure Playwright browsers are installed.`);
      return { urls: [this.startUrl], forms: [] }; // Fallback
    }

    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    let pagesCrawled = 0;

    while (this.queue.length > 0 && pagesCrawled < this.maxPages) {
      const { url, depth } = this.queue.shift();

      if (this.visited.has(url)) continue;
      this.visited.add(url);

      if (depth > this.maxDepth) continue;

      pagesCrawled++;
      this.discoveredUrls.add(url);

      try {
        const page = await context.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        
        // Extract links
        const hrefs = await page.$$eval('a', links => links.map(a => a.href));
        
        // Extract forms
        const forms = await page.$$eval('form', forms => {
          return forms.map(f => {
            const action = f.action || window.location.href;
            const method = (f.method || 'GET').toUpperCase();
            const inputs = Array.from(f.querySelectorAll('input, select, textarea')).map(i => ({
              name: i.name,
              type: i.type || i.tagName.toLowerCase(),
            })).filter(i => i.name);
            return { action, method, inputs };
          });
        });

        forms.forEach(form => {
           this.discoveredForms.push(form);
        });

        // Add internal links to queue
        for (const href of hrefs) {
          try {
            const parsed = new URL.URL(href);
            // Only crawl same origin
            if (parsed.origin === this.baseUrl) {
              const cleanUrl = parsed.origin + parsed.pathname + parsed.search; // drop hash
              if (!this.visited.has(cleanUrl)) {
                this.queue.push({ url: cleanUrl, depth: depth + 1 });
              }
            }
          } catch (e) {
            // Invalid URL
          }
        }
        
        await page.close();
      } catch (error) {
        logger.warn(`[Spider] Failed to crawl ${url}: ${error.message}`);
      }
    }

    await browser.close();
    
    // Deduplicate forms roughly by action and method
    const uniqueForms = [];
    const seenForms = new Set();
    for (const f of this.discoveredForms) {
      const key = `${f.method}:${f.action}`;
      if (!seenForms.has(key)) {
        seenForms.add(key);
        uniqueForms.push(f);
      }
    }

    logger.info(`[Spider] Crawl finished. Found ${this.discoveredUrls.size} URLs and ${uniqueForms.length} unique forms.`);

    return {
      urls: Array.from(this.discoveredUrls),
      forms: uniqueForms
    };
  }
}

module.exports = Spider;
