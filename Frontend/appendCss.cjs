const fs = require('fs');

const navbarCss = `
.megaMenuWrapper { position: absolute; top: 100%; left: 0; right: 0; padding-top: 10px; z-index: 50; }
.megaMenu { background: var(--bg); border: 1px solid var(--border-soft); border-radius: 12px; display: flex; box-shadow: 0 10px 40px rgba(0,0,0,0.5); overflow: hidden; }
.megaSidebar { width: 220px; background: rgba(0,0,0,0.2); padding: 20px 0; display: flex; flex-direction: column; border-right: 1px solid var(--border-soft); }
.megaSidebarItem { padding: 10px 24px; cursor: pointer; color: var(--text-muted); font-weight: 500; font-size: 0.9rem; transition: all 0.2s; }
.megaSidebarItem:hover, .megaSidebarActive { background: rgba(255,255,255,0.05); color: var(--primary); border-left: 2px solid var(--primary); }
.exploreAll { padding: 10px 24px; margin-top: 20px; color: var(--primary); font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.exploreAll:hover { text-decoration: underline; }
.megaContent { flex: 1; padding: 24px; display: flex; flex-wrap: wrap; align-content: flex-start; }
.toolGrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; width: 100%; }
.toolItem { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; transition: background 0.2s; text-decoration: none; }
.toolItem:hover { background: rgba(255,255,255,0.05); }
.toolIcon { width: 40px; height: 40px; border-radius: 8px; background: rgba(1, 63, 246, 0.1); }
.toolName { font-weight: 600; font-size: 0.95rem; color: var(--text); display: flex; align-items: center; gap: 8px; }
.freeBadge { font-size: 9px; padding: 2px 6px; background: rgba(16, 185, 129, 0.15); color: #10B981; border-radius: 100px; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 700; }
.proBadge { font-size: 9px; padding: 2px 6px; background: rgba(99, 102, 241, 0.15); color: #818CF8; border-radius: 100px; border: 1px solid rgba(99, 102, 241, 0.3); font-weight: 700; }
.megaFeatures { width: 260px; background: rgba(1, 63, 246, 0.05); padding: 24px; border-left: 1px solid var(--border-soft); display: flex; flex-direction: column; gap: 12px; }
.featureTitle { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--secondary); font-weight: 700; margin-bottom: 8px; }
.featureLink { font-size: 0.9rem; color: var(--text-muted); cursor: pointer; transition: color 0.2s; display: flex; align-items: center; justify-content: space-between; }
.featureLink:hover { color: var(--text); }
.featureDot { width: 6px; height: 6px; background: var(--primary); border-radius: 50%; margin-left: auto; margin-right: 8px; }
`;

const landingCss = `
.trustBanner { background: rgba(59, 130, 246, 0.1); color: var(--text-secondary); text-align: center; padding: 10px; font-size: 0.85rem; font-weight: 500; border-bottom: 1px solid var(--border-soft); }
.heroAppMockup { margin: 60px auto 0; max-width: 900px; height: 500px; background: var(--surface); border: 1px solid var(--border-soft); border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.6); overflow: hidden; display: flex; flex-direction: column; animation: fadeInUp 0.8s ease both; }
.mockupHeader { height: 40px; background: rgba(0,0,0,0.3); border-bottom: 1px solid var(--border-soft); display: flex; align-items: center; padding: 0 16px; gap: 16px; }
.mockupDots { display: flex; gap: 6px; }
.mockupDots span { width: 10px; height: 10px; border-radius: 50%; background: #4A5568; }
.mockupDots span:nth-child(1) { background: #EF4444; }
.mockupDots span:nth-child(2) { background: #FBBF24; }
.mockupDots span:nth-child(3) { background: #10B981; }
.mockupUrl { background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 4px; font-size: 0.75rem; color: var(--text-muted); flex: 1; text-align: center; font-family: monospace; }
.mockupBody { display: flex; flex: 1; }
.mockupSidebar { width: 220px; border-right: 1px solid var(--border-soft); background: rgba(0,0,0,0.1); }
.mockupContent { flex: 1; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.mockupCard { height: 80px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px dashed var(--border-soft); }
.mockupRow { display: flex; gap: 20px; }
.mockupMetric { flex: 1; height: 100px; background: rgba(255,255,255,0.02); border-radius: 8px; }
.mockupChart { flex: 1; background: rgba(16,185,129,0.03); border-radius: 8px; border: 1px solid rgba(16,185,129,0.1); }
.personas { padding: 80px 0; background: var(--bg-deep); }
.personaGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 40px; }
.personaCard { background: var(--surface); padding: 32px; border-radius: 12px; border: 1px solid var(--border-soft); transition: all 0.3s; }
.personaCard:hover { transform: translateY(-5px); border-color: rgba(255,255,255,0.15); }
.personaCard h3 { margin: 16px 0; font-size: 1.25rem; color: var(--text); }
.personaCard ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.personaCard li { display: flex; align-items: center; gap: 10px; color: var(--text-muted); font-size: 0.95rem; }
.personaCard li svg { color: var(--success); }
.pricing { padding: 80px 0; }
.tableWrapper { overflow-x: auto; margin-top: 40px; }
.priceTable { width: 100%; border-collapse: collapse; text-align: left; background: var(--surface); border-radius: 12px; overflow: hidden; }
.priceTable th { background: var(--surface-2); padding: 16px 24px; font-weight: 600; color: var(--text); border-bottom: 1px solid var(--border-soft); }
.priceTable td { padding: 16px 24px; color: var(--text-muted); border-bottom: 1px solid var(--border-soft); }
.priceTable tr:last-child td { border-bottom: none; }
.priceTable th:not(:first-child), .priceTable td:not(:first-child) { text-align: center; }
.trustFooter { font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }
`;

fs.appendFileSync('src/components/layout/Navbar.module.css', navbarCss);
fs.appendFileSync('src/pages/Landing.module.css', landingCss);

console.log('Successfully appended CSS');
