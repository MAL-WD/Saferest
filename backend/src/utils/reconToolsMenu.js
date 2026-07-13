// src/utils/reconToolsMenu.js
// Menu structure for Recon Tools organized by category

const RECON_TOOLS_MENU = {
  webRecon: {
    category: 'Web Recon',
    tools: [
      {
        id: 'dns-lookup',
        name: 'DNS Lookup',
        description: 'Passive DNS reconnaissance and DNS record enumeration',
        icon: 'globe',
        endpoint: '/api/recon/dns-lookup',
      },
      {
        id: 'website-recon',
        name: 'Website Recon',
        description: 'Website fingerprinting and technology detection',
        icon: 'monitor',
        endpoint: '/api/recon/website-recon',
      },
      {
        id: 'url-fuzzer',
        name: 'URL Fuzzer',
        description: 'Directory and endpoint discovery through fuzzing',
        icon: 'search',
        endpoint: '/api/recon/url-fuzzer',
      },
    ],
  },
  networkRecon: {
    category: 'Network & Cloud Recon',
    tools: [
      {
        id: 'subdomain-finder',
        name: 'Subdomain Finder',
        description:
          'Discover hostnames via optional Subfinder CLI plus passive feeds and historical DNS when configured',
        icon: 'target',
        endpoint: '/api/recon/subdomain-finder',
        appPath: '/subdomain-finder',
      },
      {
        id: 'port-scanner',
        name: 'Port Scanner',
        description: 'Identify open ports and services',
        icon: 'network',
        endpoint: '/api/recon/port-scanner',
      },
    ],
  },
};

module.exports = { RECON_TOOLS_MENU };
