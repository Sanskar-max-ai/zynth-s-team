import React, { useState, useEffect } from 'react';
import { 
  Shield, Terminal, Activity, AlertTriangle, 
  ChevronRight, Lock, Cpu, Zap, CheckCircle2, 
  XCircle, BarChart3, Settings, Send, Download, 
  FileText, Copy, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const MetricItem = ({ label, value, unit, color, trend }) => (
  <div className="flex justify-between items-end font-mono">
    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</span>
    <div className="text-right">
      <span className={`text-2xl font-black ${color}`}>{value}</span>
      <span className="text-[10px] ml-1 opacity-50">{unit}</span>
      {trend !== undefined && (
        <div className={`text-[9px] mt-1 ${trend > 0 ? 'text-red-400' : trend < 0 ? 'text-green-400' : 'text-muted-foreground/50'}`}>
          {trend === 0 ? 'STABLE' : `${trend > 0 ? '▲' : '▼'} ${Math.abs(trend)} PT`}
        </div>
      )}
    </div>
  </div>
);

const StatusTag = ({ label, active }) => (
  <div className={`p-2 rounded border text-[9px] font-mono tracking-tighter uppercase transition-all duration-500 ${
    active ? 'border-primary/50 text-primary bg-primary/10' : 'border-white/5 text-muted-foreground/30'
  }`}>
    {active ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : <Lock className="w-3 h-3 inline mr-1 opacity-20" />}
    {label}
  </div>
);

const TargetButton = ({ label, active, onClick, description, danger }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-start p-3 rounded-lg border transition-all text-left ${
      active 
        ? (danger ? 'bg-destructive border-destructive text-white shadow-lg' : 'bg-primary border-primary text-white shadow-lg') 
        : 'bg-black/40 border-white/10 text-muted-foreground hover:bg-white/5'
    }`}
  >
    <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    <span className="text-[8px] opacity-60 font-mono italic">{description}</span>
  </button>
);

const CommandCenter = ({ onLogout, token }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [scanResults, setScanResults] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ vulnerabilities: 0, riskScore: 0, testsRun: 0, integrity: 100, trend: 0 });
  const [apiKey, setApiKey] = useState('');
  const [target, setTarget] = useState('local');
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('audit');
  const [firewallLogs, setFirewallLogs] = useState([]);
  const [copiedPatchIndex, setCopiedPatchIndex] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const historyRes = await axios.get(`${API_BASE_URL}/api/history`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
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
          setFirewallLogs(res.data.reverse());
        } catch (e) { console.error(e); }
      };
      fetchLogs();
      interval = setInterval(fetchLogs, 2000);
    }
    return () => clearInterval(interval);
  }, [activeTab, token]);

  const runScan = async () => {
    setIsScanning(true);
    setLogs([{ id: 'init', msg: "Initializing ZYNTH Security Engine...", type: 'info' }]);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/scan`, { api_key: apiKey, target }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const { summary, detailed_results } = response.data;
      setScanResults(detailed_results);
      let delay = 0;
      detailed_results.forEach((r, i) => {
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
          if (i === detailed_results.length - 1) {
            setStats({ ...summary, integrity: 100 - summary.risk_score, vulnerabilities: summary.vulnerabilities_found, testsRun: summary.total_tests });
            setIsScanning(false);
            setTimeout(() => setShowReport(true), 1500);
          }
        }, delay);
      });
    } catch (err) { setError("Backend disconnected."); setIsScanning(false); }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("ZYNTH AUDIT REPORT", 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [["Test", "Category", "Status"]],
      body: scanResults.map(r => [r.test_name, r.category, r.is_vulnerable ? "VULNERABLE" : "SECURE"])
    });
    doc.save("audit.pdf");
  };

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto space-y-8 text-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-2 italic">
            <Shield className="w-10 h-10 text-primary" /> ZYNTH CC
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-50">Multi-Tenant Adversarial Arena</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowSettings(!showSettings)} className="p-3 rounded-lg border border-white/10 hover:bg-white/5"><Settings className="w-5 h-5" /></button>
          <button onClick={onLogout} className="p-3 rounded-lg border border-white/10 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Lock className="w-5 h-5" /></button>
          <button onClick={runScan} disabled={isScanning} className="px-8 py-3 rounded-lg bg-primary font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
            {isScanning ? 'ATTACKING...' : 'LAUNCH ATTACK'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="glass-panel p-6 rounded-xl border-primary/20 bg-primary/5 grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-primary tracking-widest">API Key</label>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full bg-black/40 border border-white/10 p-2 rounded text-sm" placeholder="sk-..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-primary tracking-widest">Arena</label>
                <div className="flex gap-2">
                  <TargetButton label="Local" active={target === 'local'} onClick={() => setTarget('local')} description="Local Host" />
                  <TargetButton label="Live" active={target === 'live'} onClick={() => setTarget('live')} description="Claude-3" danger />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="flex gap-6 border-b border-white/5 pb-2">
            <button onClick={() => setActiveTab('audit')} className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'audit' ? 'text-primary border-b border-primary' : 'text-muted-foreground'}`}>Logs</button>
            <button onClick={() => setActiveTab('firewall')} className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'firewall' ? 'text-purple-400 border-b border-purple-400' : 'text-muted-foreground'}`}>Firewall</button>
          </div>
          <div className="glass-panel rounded-xl h-[450px] flex flex-col overflow-hidden border border-white/5">
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs space-y-1">
              {activeTab === 'audit' ? (
                logs.map(l => (
                  <div key={l.id} className={l.type === 'warn' ? 'text-red-400' : l.type === 'brain' ? 'text-purple-400' : 'text-green-400'}>
                    <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span> {l.msg}
                  </div>
                ))
              ) : (
                firewallLogs.map(f => (
                  <div key={f.id} className="p-2 bg-white/5 rounded border border-white/5 mb-2">
                    <div className="flex justify-between mb-1 opacity-50"><span>{f.timestamp}</span><span className={f.action === 'BLOCK' ? 'text-red-500' : 'text-green-500'}>{f.action}</span></div>
                    <div className="truncate opacity-90">"{f.payload_snippet}"</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-xl space-y-6">
            <MetricItem label="Risk Score" value={stats.riskScore} unit="PTS" color="text-red-500" trend={stats.trend} />
            <MetricItem label="Integrity" value={stats.integrity} unit="%" color="text-green-500" />
            <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-2">
              <StatusTag label="Inject" active={stats.testsRun > 0} />
              <StatusTag label="Leak" active={stats.testsRun > 3} />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-panel p-8 rounded-2xl max-w-xl w-full border border-primary/20">
              <h2 className="text-xl font-bold mb-6">SCAN COMPLETE</h2>
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {scanResults.map((r, i) => (
                  <div key={i} className={`p-4 rounded border ${r.is_vulnerable ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                    <div className="font-bold text-sm mb-1">{r.test_name}</div>
                    <div className="text-[10px] opacity-50">{r.category}</div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setShowReport(false)} className="px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-xs font-bold">CLOSE</button>
                <button onClick={exportPDF} className="px-4 py-2 rounded bg-primary text-white text-xs font-bold">PDF</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommandCenter;
