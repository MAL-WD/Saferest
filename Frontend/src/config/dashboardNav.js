import {
  PortScannerIcon,
  SubdomainFinderIcon,
  WebsiteScannerIcon,
  EmailScannerIcon,
  CodeScannerIcon,
  NetworkScannerIcon,
  MaliciousUrlIcon,
} from '../components/ui/Icons';

export const MAIN_NAV = [
  { label: 'Dashboard', to: '/dashboard', icon: 'dashboard' },
  { label: 'Assets', to: '/targets', icon: 'assets', badgeKey: 'assets' },
  { label: 'Scans', to: '/scans', icon: 'scans', badgeKey: 'scans' },
  { label: 'Findings', to: '/findings', icon: 'findings' },
  { label: 'Automation', to: '/automation', icon: 'automation', comingSoon: true },
  { label: 'Reports', to: '/reports', icon: 'reports' },
  { label: 'Settings', to: '/settings', icon: 'settings' },
];

/** Pentest-Tools-style categories — only tools we actually ship */
export const TOOL_CATEGORIES = [
  {
    id: 'recon',
    label: 'Reconnaissance',
    accent: '#013ff6',
    items: [
      { name: 'Subdomain Finder', to: '/subdomain-finder', isFree: true, customIcon: SubdomainFinderIcon },
      { name: 'Port Scanner', to: '/port-scanner', isFree: true, customIcon: PortScannerIcon },
    ],
  },
  {
    id: 'vuln',
    label: 'Vulnerability Scanners',
    accent: '#f59e0b',
    items: [
      { name: 'Website Scanner', to: '/website-scan', isFree: false, customIcon: WebsiteScannerIcon },
      { name: 'Email Scanner', to: '/email-scan', isFree: true, customIcon: EmailScannerIcon },
      { name: 'Code Scanner', to: '/code-scan', isFree: false, customIcon: CodeScannerIcon },
      { name: 'Network Scanner', to: '/pcap-scan', isFree: false, customIcon: NetworkScannerIcon },
      { name: 'Malicious URL', to: '/malicious-url', isFree: true, customIcon: MaliciousUrlIcon },
    ],
  },
];

/** @deprecated use TOOL_CATEGORIES */
export const TOOL_GROUPS = TOOL_CATEGORIES.map((c) => ({
  group: c.label,
  items: c.items,
}));

export const TOP_PILLS = [
  { label: 'Overview', to: '/dashboard', icon: 'overview' },
  { label: 'Findings', to: '/findings', icon: 'findings' },
  { label: 'Scans', to: '/scans', icon: 'scans', badgeKey: 'running' },
  { label: 'Reports', to: '/reports', icon: 'reports' },
];

export const QUICK_TOOLS = [
  { name: 'Website Scanner', to: '/website-scan', desc: 'Full web app scan', color: '#f59e0b', category: 'vuln', icon: WebsiteScannerIcon },
  { name: 'Port Scanner', to: '/port-scanner', desc: 'Open ports & services', color: '#013ff6', category: 'recon', icon: PortScannerIcon },
  { name: 'Code Scanner', to: '/code-scan', desc: 'AI source review', color: '#f59e0b', category: 'vuln', icon: CodeScannerIcon },
  { name: 'Subdomain Finder', to: '/subdomain-finder', desc: 'Discover subdomains', color: '#013ff6', category: 'recon', icon: SubdomainFinderIcon },
  { name: 'Email Scanner', to: '/email-scan', desc: 'SPF, DKIM, DMARC', color: '#f59e0b', category: 'vuln', icon: EmailScannerIcon },
];
