import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ui/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

import Landing      from './pages/Landing';
import Login        from './pages/auth/Login';
import Register     from './pages/auth/Register';
import Dashboard    from './pages/Dashboard';
import Targets      from './pages/Targets';
import WebsiteScan from './pages/WebsiteScan';
import NewScanHub from './pages/NewScanHub';
import ScanLive     from './pages/ScanLive';

import ScanResults  from './pages/ScanResults';
import ScansIndex   from './pages/ScansIndex';
import Settings     from './pages/Settings';
import EmailScan    from './pages/EmailScan';
import CodeScan     from './pages/CodeScan';
import TrafficAnalysis from './pages/TrafficAnalysis';
import Scores       from './pages/Scores';
import FirewallAdvisor from './pages/FirewallAdvisor';
import GlobalFindings from './pages/GlobalFindings';
import AttackSurface from './pages/AttackSurface';
import PortScanner from './pages/PortScanner';
import SubdomainFinder from './pages/SubdomainFinder';
import SubdomainFinderResults from './pages/SubdomainFinderResults';
import MaliciousURLDetection from './pages/MaliciousURLDetection';
import PcapScan from './pages/PcapScan';
import Automation from './pages/Automation';
import Reports from './pages/Reports';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"         element={<Landing />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected app — dashboard shell with sidebar */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard"       element={<Dashboard />} />
          <Route path="/targets"         element={<Targets />} />
          <Route path="/scans"           element={<ScansIndex />} />
          <Route path="/website-scan"    element={<WebsiteScan />} />
          <Route path="/scans/new"       element={<NewScanHub />} />
          <Route path="/scans/:id/live"  element={<ScanLive />} />
          <Route path="/scans/:id"       element={<ScanResults />} />
          <Route path="/settings"        element={<Settings />} />
          <Route path="/findings"        element={<GlobalFindings />} />
          <Route path="/automation"      element={<Automation />} />
          <Route path="/reports"         element={<Reports />} />
          <Route path="/email-scan"      element={<EmailScan />} />
          <Route path="/code-scan"       element={<CodeScan />} />
          <Route path="/traffic"         element={<TrafficAnalysis />} />
          <Route path="/scores"         element={<Scores />} />
          <Route path="/firewall"        element={<FirewallAdvisor />} />
          <Route path="/attack-surface"  element={<AttackSurface />} />
          <Route path="/port-scanner"    element={<PortScanner />} />
          <Route path="/subdomain-finder/results" element={<SubdomainFinderResults />} />
          <Route path="/subdomain-finder" element={<SubdomainFinder />} />
          <Route path="/malicious-url"   element={<MaliciousURLDetection />} />
          <Route path="/pcap-scan"       element={<PcapScan />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
