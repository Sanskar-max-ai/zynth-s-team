import React, { useState, useEffect } from 'react';
import { 
  Shield, Terminal, Activity, AlertTriangle, 
  ChevronRight, Lock, Cpu, Zap, CheckCircle2, 
  XCircle, BarChart3, Settings, Send, Download, 
  FileText, Copy, Check, BookOpen, ShieldAlert,
  LayoutDashboard, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002';

const TARGET_CONFIG = {
  mock: {
    label: 'Demo Agent',
    description: 'Full adversarial suite against the built-in simulated vulnerable target.',
    requiresApiKey: false,
    requiresEndpoint: false,
  },
  local: {
    label: 'Local Sandbox',
    description: 'Targets the local sandbox agent running on http://localhost:8001/chat.',
    requiresApiKey: false,
    requiresEndpoint: false,
  },
  gandalf: {
    label: 'Gandalf',
    description: 'Limited external challenge scan against Lakera Gandalf.',
    requiresApiKey: false,
    requiresEndpoint: false,
  },
  live: {
    label: 'Anthropic API',
    description: 'Direct live-model red-team run using your Anthropic API key.',
    requiresApiKey: true,
    requiresEndpoint: false,
  },
  custom: {
    label: 'Custom API',
    description: 'Audit your own JSON API endpoint with a quick attack suite.',
    requiresApiKey: false,
    requiresEndpoint: true,
  },
};

const getInitials = (email) => {
  if (!email) return 'ZT';
  return email
    .split('@')[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2);
};

const SidebarLink = ({ active, icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
      active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`}
  >
    <span className={active ? 'text-white' : 'text-slate-500'}>{icon}</span>
    {label}
  </button>
);

const StatCard = ({ label, value, unit, color }) => (
  <div className="p-6 bg-[#151921] border border-slate-800 rounded-2xl shadow-xl space-y-1">
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
    <div className="flex items-baseline gap-1.5">
      <span className={`text-3xl font-black italic tracking-tighter ${color}`}>{value}</span>
      <span className="text-xs text-slate-600 font-bold uppercase">{unit}</span>
    </div>
  </div>
);

const TargetPill = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
      active ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-slate-800/50 border-slate-800 text-slate-500 hover:border-slate-700'
    }`}
  >
    {label}
  </button>
);

const ArsenalItem = ({ title, desc, level }) => (
  <div className="p-5 bg-black/20 border border-slate-800 rounded-2xl group hover:border-slate-700 transition-all">
    <div className="flex justify-between items-center mb-1">
      <h4 className="text-sm font-bold text-slate-200">{title}</h4>
      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${level === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
        {level}
      </span>
    </div>
    <p className="text-[11px] text-slate-500">{desc}</p>
  </div>
);

const DocLink = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-indigo-600/10 text-white border border-indigo-500/20 shadow-lg' : 'text-muted-foreground hover:bg-white/5'}`}
  >
    <div className={`${active ? 'text-indigo-400' : 'text-muted-foreground'}`}>{icon || <BookOpen className="w-4 h-4" />}</div>
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const CommandCenter = ({ onLogout, token }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [scanResults, setScanResults] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ vulnerabilities: 0, riskScore: 0, testsRun: 0, integrity: 100, trend: 0 });
  const [apiKey, setApiKey] = useState('');
  const [target, setTarget] = useState('mock');
  const [targetEndpoint, setTargetEndpoint] = useState('');
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('audit');
  const [docSection, setDocSection] = useState('getting-started');
  const [firewallLogs, setFirewallLogs] = useState([]);
  const [copiedPatchIndex, setCopiedPatchIndex] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [historyRes, profileRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/history`, { headers }),
          axios.get(`${API_BASE_URL}/api/auth/me`, { headers }),
        ]);
        setProfile(profileRes.data);
        if (historyRes.data && historyRes.data.length > 0) {
          const last = historyRes.data[historyRes.data.length - 1];
          setStats(prev => ({
            ...prev,
            riskScore: last.risk_score,
            vulnerabilities: last.vulnerabilities,
            testsRun: last.total_tests,
            trend: last.trend,
            integrity: 100 - last.risk_score
          }));
        }
      } catch (e) { console.error(e); }
    };
    fetchData();

    let interval;
    if (activeTab === 'firewall') {
      const fetchLogs = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/firewall/logs`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          setFirewallLogs([...(res.data || [])].reverse());
        } catch (e) { console.error(e); }
      };
      fetchLogs();
      interval = setInterval(fetchLogs, 2000);
    }
    return () => clearInterval(interval);
  }, [activeTab, token]);

  useEffect(() => {
    const handleRemoteNav = (e) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('zynth-nav', handleRemoteNav);
    return () => window.removeEventListener('zynth-nav', handleRemoteNav);
  }, []);

  const runScan = async () => {
    setIsScanning(true);
    setError(null);
    setShowReport(false);
    setLogs([{ id: 'init', msg: `Launching ${TARGET_CONFIG[target].label} audit...`, type: 'info' }]);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/scan`, {
        api_key: apiKey.trim() || undefined,
        target,
        target_endpoint: targetEndpoint.trim() || undefined,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const { summary, detailed_results } = response.data;
      setScanResults(detailed_results);
      let delay = 0;
      const previewResults = detailed_results.slice(0, 18);
      if (previewResults.length === 0) {
        setStats({ ...summary, integrity: 100 - summary.risk_score, vulnerabilities: summary.vulnerabilities_found, testsRun: summary.total_tests });
        setIsScanning(false);
        setShowReport(true);
        return;
      }
      previewResults.forEach((r, i) => {
        delay += 600;
        setTimeout(() => setLogs(p => [...p, { id: `t-${i}`, msg: `[${r.category}] Testing: ${r.test_name}...`, type: 'info' }]), delay);
        if (r.adversarial_thoughts) {
          r.adversarial_thoughts.forEach((t, ti) => {
            delay += 800;
            setTimeout(() => setLogs(p => [...p, { id: `brain-${i}-${ti}`, msg: `BRAIN: ${t}`, type: 'brain' }]), delay);
          });
        }
        delay += 500;
        setTimeout(() => {
          setLogs(p => [...p, { id: `res-${i}`, msg: `[${r.category}] Status: ${r.is_vulnerable ? 'VULNERABLE' : 'SECURE'}`, type: r.is_vulnerable ? 'warn' : 'info' }]);
          if (i === previewResults.length - 1) {
            setStats({ ...summary, integrity: 100 - summary.risk_score, vulnerabilities: summary.vulnerabilities_found, testsRun: summary.total_tests });
            setIsScanning(false);
            setTimeout(() => setShowReport(true), 1500);
          }
        }, delay);
      });
      if (detailed_results.length > previewResults.length) {
        setTimeout(() => {
          setLogs(p => [...p, { id: 'more', msg: `Showing ${previewResults.length} live entries. Full findings are available in the report.`, type: 'info' }]);
        }, delay + 250);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Backend disconnected.");
      setIsScanning(false);
    }
  };

  const exportPDF = async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const doc = new jsPDF();
    doc.text("ZYNTH AUDIT REPORT", 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [["Test", "Category", "Status"]],
      body: scanResults.map(r => [r.test_name, r.category, r.is_vulnerable ? "VULNERABLE" : "SECURE"])
    });
    doc.save("audit.pdf");
  };

  const activeTargetConfig = TARGET_CONFIG[target];
  const isScanReady =
    !isScanning &&
    (!activeTargetConfig.requiresApiKey || Boolean(apiKey.trim())) &&
    (!activeTargetConfig.requiresEndpoint || Boolean(targetEndpoint.trim()));

  return (
    <div className="flex h-screen bg-[#0B0E14] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden">
      {error && (
        <div className="fixed top-6 right-6 z-[100] p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-3 text-sm animate-shake shadow-2xl backdrop-blur-md">
          <AlertTriangle className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-4 opacity-50 hover:opacity-100">×</button>
        </div>
      )}
      {/* PROFESSIONAL SIDEBAR */}
      <aside className="w-64 border-r border-slate-800 bg-[#0F1219] flex flex-col z-20">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white italic">ZYNTH</span>
          </div>

          <nav className="space-y-1">
            <SidebarLink 
              active={activeTab === 'audit'} 
              onClick={() => setActiveTab('audit')} 
              icon={<LayoutDashboard className="w-4 h-4" />} 
              label="Audit Dashboard" 
            />
            <SidebarLink 
              active={activeTab === 'firewall'} 
              onClick={() => setActiveTab('firewall')} 
              icon={<Activity className="w-4 h-4" />} 
              label="Live Firewall" 
            />
            <SidebarLink 
              active={activeTab === 'docs'} 
              onClick={() => setActiveTab('docs')} 
              icon={<BookOpen className="w-4 h-4" />} 
              label="Documentation" 
            />
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <button 
            onClick={() => setActiveTab('docs')}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            Setup Guide
          </button>
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                {getInitials(profile?.email)}
              </div>
              <div className="text-[10px] min-w-0">
                <p className="text-white font-medium leading-tight truncate">{profile?.email || 'Signed-in workspace'}</p>
                <p className="text-slate-500">Workspace #{profile?.workspace_id ?? '--'}</p>
              </div>
            </div>
            <button onClick={onLogout} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0B0E14] relative">
        {/* TOP BAR */}
        <header className="h-16 border-b border-slate-800 bg-[#0F1219]/50 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
              {activeTab === 'audit' ? 'Security Audit' : activeTab === 'firewall' ? 'Active Defense' : 'Knowledge Base'}
            </h2>
            <div className="h-4 w-[1px] bg-slate-800" />
            <span className="text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Engine Online
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={runScan}
              disabled={!isScanReady}
              className={`px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-900/40 hover:bg-indigo-500 transition-all disabled:opacity-50 ${isScanning ? 'cursor-not-allowed' : ''}`}
            >
              {isScanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              {isScanning ? 'RUNNING AUDIT' : 'START AUDIT'}
            </button>
          </div>
        </header>

        {/* CONTENT VIEW */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto h-full"
            >
              {activeTab === 'audit' && (
                <div className="space-y-8">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <StatCard label="Overall Risk" value={`${stats.riskScore}`} unit="pts" color="text-red-400" />
                    <StatCard label="Integrity" value={`${stats.integrity}`} unit="%" color="text-green-400" />
                    <StatCard label="Critical Threats" value={`${stats.vulnerabilities}`} unit="found" color="text-orange-400" />
                    <StatCard label="Total Tests" value={`${stats.testsRun}`} unit="completed" color="text-slate-400" />
                  </div>

                  {/* Main Grid: Logs + Target Selection */}
                  <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                      <div className="bg-[#151921] rounded-2xl border border-slate-800 p-1 overflow-hidden shadow-2xl">
                        <div className="px-5 py-3 border-b border-slate-800 flex justify-between items-center">
                          <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase">Live Audit Stream</h3>
                            <p className="text-[11px] text-slate-500 mt-1">{activeTargetConfig.label}: {activeTargetConfig.description}</p>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-slate-700" />
                            <div className="w-2 h-2 rounded-full bg-slate-700" />
                            <div className="w-2 h-2 rounded-full bg-slate-700" />
                          </div>
                        </div>
                        <div className="h-[400px] overflow-y-auto p-6 font-mono text-xs space-y-2 bg-[#0F1219]/50 custom-scrollbar">
                          {logs.map(l => (
                            <div key={l.id} className="flex gap-3 animate-in fade-in duration-300 border-l border-slate-800 pl-4 ml-2">
                              <span className={l.type === 'warn' ? 'text-red-400' : l.type === 'brain' ? 'text-purple-400' : 'text-indigo-400'}>
                                {l.type === 'warn' ? '!' : l.type === 'brain' ? 'λ' : '>'}
                              </span>
                              <span className={l.type === 'brain' ? 'text-slate-500 italic' : 'text-slate-300'}>{l.msg}</span>
                            </div>
                          ))}
                          {logs.length === 0 && !isScanning && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600">
                              <Terminal className="w-12 h-12 mb-4 opacity-10" />
                              <p className="uppercase tracking-widest text-[10px] font-bold">Choose a target and run an audit</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-12 lg:col-span-4 space-y-6">
                      <div className="p-6 rounded-2xl bg-[#151921] border border-slate-800 space-y-6">
                        <div>
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Audit Setup</h3>
                          <p className="text-[11px] text-slate-500 mt-2">
                            Keep the first workflow simple: choose a target, run the audit, review findings, then generate a patch bundle.
                          </p>
                        </div>
                        <div className="space-y-4">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Target Mode</label>
                          <div className="grid grid-cols-2 gap-2">
                            <TargetPill label="Mock" active={target === 'mock'} onClick={() => setTarget('mock')} />
                            <TargetPill label="Local" active={target === 'local'} onClick={() => setTarget('local')} />
                            <TargetPill label="Gandalf" active={target === 'gandalf'} onClick={() => setTarget('gandalf')} />
                            <TargetPill label="Live AI" active={target === 'live'} onClick={() => setTarget('live')} />
                            <TargetPill label="Custom API" active={target === 'custom'} onClick={() => setTarget('custom')} />
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-[#0F1219] p-4">
                          <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-2">Current Mode</p>
                          <h4 className="text-sm font-bold text-white">{activeTargetConfig.label}</h4>
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed">{activeTargetConfig.description}</p>
                        </div>
                        {activeTargetConfig.requiresApiKey && (
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Anthropic API Key</label>
                            <input
                              type="password"
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              placeholder="sk-ant-..."
                              className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:border-indigo-500/50 outline-none transition-all"
                            />
                          </div>
                        )}
                        {activeTargetConfig.requiresEndpoint && (
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Custom Endpoint</label>
                            <input
                              type="text"
                              value={targetEndpoint}
                              onChange={(e) => setTargetEndpoint(e.target.value)}
                              placeholder="https://your-agent-api.com/chat"
                              className="w-full bg-black/40 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:border-indigo-500/50 outline-none transition-all"
                            />
                          </div>
                        )}
                        {!activeTargetConfig.requiresApiKey && !activeTargetConfig.requiresEndpoint && (
                          <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                            <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-2">Ready Mode</p>
                            <p className="text-xs text-slate-300">This mode can run immediately. No extra credentials are required.</p>
                          </div>
                        )}
                        <div className="pt-6 border-t border-slate-800 space-y-4">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Export Report</label>
                          <button 
                            onClick={exportPDF}
                            disabled={scanResults.length === 0}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition-all border border-slate-700 disabled:opacity-50"
                          >
                            <Download className="w-4 h-4" /> Download Security Audit
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'firewall' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <h2 className="text-2xl font-black italic text-indigo-400 uppercase tracking-tighter">Active Interception</h2>
                      <p className="text-sm text-slate-500">Monitoring all inbound requests for adversarial signatures.</p>
                    </div>
                    <div className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                      FILTERING ENABLED
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {firewallLogs.length === 0 ? (
                      <div className="py-32 flex flex-col items-center text-slate-600 opacity-20">
                        <Activity className="w-16 h-16 mb-4" />
                        <p className="font-bold uppercase tracking-widest text-sm">Quiet on the front</p>
                      </div>
                    ) : (
                      firewallLogs.map(f => (
                        <div key={f.id} className="group p-5 bg-[#151921] rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${f.action === 'BLOCK' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                            {f.action === 'BLOCK' ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{f.source}</span>
                              <span className="text-[10px] text-slate-500 tabular-nums">{f.timestamp}</span>
                            </div>
                            <p className="text-sm font-mono text-slate-400 truncate mb-3 italic">"{f.payload_snippet}"</p>
                            <div className="flex gap-2">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-[9px] font-bold text-slate-400 uppercase">{f.category}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${f.action === 'BLOCK' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{f.action}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'docs' && (
                <div className="bg-[#151921] rounded-3xl border border-slate-800 min-h-[calc(100vh-200px)] flex flex-col lg:flex-row">
                  <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-800 p-6 space-y-1">
                    <DocLink label="Getting Started" active={docSection === 'getting-started'} onClick={() => setDocSection('getting-started')} />
                    <DocLink label="Attack Arsenal" active={docSection === 'arsenal'} onClick={() => setDocSection('arsenal')} />
                    <DocLink label="Patch Bundles" active={docSection === 'remediation'} onClick={() => setDocSection('remediation')} />
                    <DocLink label="Developer SDK" active={docSection === 'sdk'} onClick={() => setDocSection('sdk')} />
                  </div>
                  <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
                    {docSection === 'getting-started' && (
                      <div className="max-w-2xl space-y-6">
                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-8">The Core Wedge</h2>
                        <p className="text-slate-400 leading-relaxed text-lg font-light">
                          Zynth is strongest when it stays focused on one job: catch AI-agent security failures before teams ship them.
                          The loop is simple and real: choose a target, run an adversarial audit, review the findings, then generate a review-first patch bundle.
                        </p>
                        <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                          <h4 className="text-indigo-400 font-bold mb-2 uppercase tracking-widest text-xs">What Good Looks Like</h4>
                          <p className="text-sm text-slate-300 italic">"Point Zynth at an agent. Find the break. Hand engineering a patch bundle they can ship."</p>
                        </div>
                      </div>
                    )}
                    {docSection === 'arsenal' && (
                      <div className="max-w-2xl space-y-8">
                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-4">The Arsenal</h2>
                        <div className="grid gap-4">
                          <ArsenalItem title="Constraint Evasion" desc="Forcing the agent to ignore pre-configured safety instructions." level="High" />
                          <ArsenalItem title="Goal Hijacking" desc="Redirection of agent intent towards unintended malicious tasks." level="Critical" />
                          <ArsenalItem title="Data Exfiltration" desc="Stealing keys or PII through steganographic markdown encoding." level="High" />
                        </div>
                      </div>
                    )}
                    {docSection === 'sdk' && (
                      <div className="max-w-2xl space-y-6">
                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-4">Developer SDK</h2>
                        <p className="text-slate-400 leading-relaxed text-sm">
                          The repo now exposes a working local SDK. Install from the project root while the hosted package distribution is being prepared.
                        </p>
                        <pre className="bg-black p-6 rounded-2xl border border-slate-800 font-mono text-sm leading-8 text-indigo-400 overflow-x-auto">
{`pip install -e .

from zynth import Client

client = Client(target="mock")
report = client.scan(full_scan=True, use_llm_judge=False)

print(report.risk_score)
print(len(report.vulnerabilities))`}
                        </pre>
                      </div>
                    )}
                    {docSection === 'remediation' && (
                      <div className="max-w-2xl space-y-6">
                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-4">Patch Bundles</h2>
                        <p className="text-slate-400 leading-relaxed text-sm">
                          Zynth now generates a real patch bundle on disk instead of pretending to fully deploy code into your environment.
                          Each bundle includes the generated patch, a manifest, and a short README so engineering can review before rollout.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      {/* Audit Report Modal */}
      <AnimatePresence>
        {showReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="glass-panel p-8 rounded-2xl max-w-2xl w-full border border-primary/20 bg-black/90 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowReport(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <Shield className="w-12 h-12 text-primary" />
                <div>
                  <h2 className="text-2xl font-black tracking-tighter italic">AUDIT COMPLETED</h2>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Zynth Enterprise Security Verification</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {scanResults.map((r, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${r.is_vulnerable ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <div className="font-bold text-sm flex items-center gap-2">
                         {r.is_vulnerable ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                         {r.test_name}
                       </div>
                       <div className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase ${r.is_vulnerable ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                         {r.is_vulnerable ? 'Vulnerable' : 'Secure'}
                       </div>
                    </div>
                    <div className="flex justify-between items-center text-[9px] opacity-50 mb-3 uppercase tracking-widest font-mono">
                      <span>{r.category}</span>
                      <span>{r.mitre_technique}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {r.evidence || 'No evidence recorded.'}
                    </p>
                    
                    {r.is_vulnerable && r.remediation_patch && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="text-[10px] font-bold text-primary mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="w-3 h-3" /> ZYNTH PATCH BUNDLE:
                          </div>
                          <button 
                            onClick={async () => {
                              try {
                                setCopiedPatchIndex(i + 100); // Temporary loading state
                                await axios.post(`${API_BASE_URL}/api/patch/apply`, {
                                  test_id: r.test_name,
                                  target: target,
                                  patch_code: r.remediation_patch
                                }, {
                                  headers: token ? { Authorization: `Bearer ${token}` } : {}
                                });
                                setCopiedPatchIndex(i + 200); // Success state
                                setTimeout(() => setCopiedPatchIndex(null), 3000);
                              } catch (e) {
                                console.error(e);
                                setCopiedPatchIndex(null);
                              }
                            }}
                            className="bg-green-500/10 hover:bg-green-500/20 text-green-400 px-2 py-1 rounded transition-all flex items-center gap-1.5 border border-green-500/20"
                          >
                            <Zap className="w-3 h-3" />
                            {copiedPatchIndex === i + 200 ? 'BUNDLE READY' : 'GENERATE BUNDLE'}
                          </button>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(r.remediation_patch);
                              setCopiedPatchIndex(i);
                              setTimeout(() => setCopiedPatchIndex(null), 2000);
                            }}
                            className="bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded transition-all flex items-center gap-1.5"
                          >
                            <Copy className="w-3 h-3" />
                            {copiedPatchIndex === i ? 'COPIED' : 'COPY PATCH'}
                          </button>
                        </div>
                        <pre className="bg-black/60 p-4 rounded-lg text-[10px] font-mono text-green-400 overflow-x-auto border border-green-500/10 shadow-inner">
                          <code>{r.remediation_patch}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  onClick={() => setShowReport(false)} 
                  className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold transition-colors"
                >
                  CLOSE
                </button>
                <button 
                  onClick={exportPDF} 
                  className="px-6 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:glow-primary transition-all"
                >
                  DOWNLOAD PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
};

export default CommandCenter;
