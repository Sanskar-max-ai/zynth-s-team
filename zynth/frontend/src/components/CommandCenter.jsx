import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Terminal, 
  Activity, 
  AlertTriangle, 
  ChevronRight, 
  Lock, 
  Cpu,
  Zap,
  CheckCircle2,
  XCircle,
  BarChart3,
  Settings,
  Send,
  Download,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const CommandCenter = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [scanResults, setScanResults] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    vulnerabilities: 0,
    riskScore: 0,
    testsRun: 0,
    integrity: 100
  });
  const [apiKey, setApiKey] = useState('');
  const [target, setTarget] = useState('local');
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null);

  const runScan = async () => {
    setIsScanning(true);
    setLogs([]);
    setError(null);
    setStats({ vulnerabilities: 0, riskScore: 0, testsRun: 0, integrity: 100 });
    
    setLogs([{ id: 'init', msg: "Initializing ZYNTH Security Engine...", type: 'info' }]);

    try {
      const response = await axios.post('http://localhost:8002/api/scan', {
        api_key: apiKey,
        target: target
      });

      const { summary, detailed_results } = response.data;
      setScanResults(detailed_results);
      
      // Simulate streaming/progressive logs from data
      detailed_results.forEach((result, index) => {
        setTimeout(() => {
          setLogs(prev => [...prev, { 
            id: index, 
            msg: `[${result.category}] ${result.test_name}: ${result.is_vulnerable ? 'VULNERABLE' : 'SECURE'}`, 
            type: result.is_vulnerable ? 'warn' : 'info' 
          }]);
          
          if (index === detailed_results.length - 1) {
            setStats({
              vulnerabilities: summary.vulnerabilities_found,
              riskScore: summary.risk_score,
              testsRun: summary.total_tests,
              integrity: 100 - summary.risk_score 
            });
            setLogs(prev => [...prev, { id: 'final', msg: "Scan Complete. Audit Summary Generated.", type: 'info' }]);
            setIsScanning(false);
            setTimeout(() => setShowReport(true), 1500); // Trigger report after a brief delay
          }
        }, (index + 1) * 600);
      });

    } catch (err) {
      console.error(err);
      setError("Failed to connect to security engine. Is the backend running?");
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter flex items-center gap-3">
            <Shield className="w-10 h-10 text-primary animate-pulse-ring" />
            ZYNTH <span className="text-muted-foreground font-light">COMMAND CENTER</span>
          </h1>
          <p className="text-muted-foreground mt-2">Autonomous Agent Security & Stress Testing Platform</p>
        </div>
        <div className="flex gap-4">
           <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-3 rounded-lg border border-white/10 transition-all ${showSettings ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-muted-foreground'}`}
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={runScan}
            disabled={isScanning}
            className={`px-8 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
              isScanning 
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : 'bg-primary text-white hover:scale-105 glow-primary'
            }`}
          >
            {isScanning ? <Activity className="animate-spin w-5 h-5" /> : <Zap className="w-5 h-5" />}
            {isScanning ? 'ATTACKING AGENT...' : 'LAUNCH BATTLE'}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-panel p-6 rounded-xl border-primary/20 bg-primary/5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-primary font-bold">Anthropic API Key</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-primary/50 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-primary font-bold">Attack Target Arena</label>
                <div className="grid grid-cols-2 gap-2">
                  <TargetButton 
                    label="Local API Target" 
                    active={target === 'local'} 
                    onClick={() => setTarget('local')}
                    description="Hit localhost:8001/chat"
                  />
                  <TargetButton 
                    label="Direct Model Attack" 
                    active={target === 'live'} 
                    onClick={() => setTarget('live')}
                    description="Hit Claude explicitly"
                    danger
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-3 text-sm animate-shake">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left: Real-time Terminal */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel rounded-xl overflow-hidden border border-white/10 h-[500px] flex flex-col">
            <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Adversarial Logs</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                <div className="w-2 h-2 rounded-full bg-green-500/50" />
              </div>
            </div>
            <div className="p-4 font-mono text-sm overflow-y-auto flex-1 space-y-2">
              <AnimatePresence>
                {logs.map((log) => (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex gap-2 ${log.type === 'warn' ? 'text-red-400' : 'text-green-400'}`}
                  >
                    <span className="text-muted-foreground">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                    <span className="text-primary opacity-70">$</span>
                    {log.msg}
                  </motion.div>
                ))}
              </AnimatePresence>
              {isScanning && (
                <motion.div 
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-2 h-4 bg-primary inline-block"
                />
              )}
              {logs.length === 0 && !isScanning && (
                <div className="text-muted-foreground italic h-full flex items-center justify-center opacity-30">
                  SYSTEM IDLE. AWAITING DEPLOYMENT.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Stats & Intelligence */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-xl space-y-6">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Live Metrics
            </h3>
            
            <div className="space-y-4">
              <MetricItem 
                label="Risk Score" 
                value={stats.riskScore} 
                unit="PTS" 
                color={stats.riskScore > 50 ? 'text-red-500' : 'text-primary'} 
              />
              <MetricItem 
                label="Integrity" 
                value={stats.integrity} 
                unit="%" 
                color={stats.integrity < 70 ? 'text-red-500' : 'text-green-500'} 
              />
              <MetricItem 
                label="Vulnerabilities" 
                value={stats.vulnerabilities} 
                unit="FOUND" 
                color={stats.vulnerabilities > 0 ? 'text-red-500' : 'text-muted-foreground'} 
              />
            </div>

            <div className="pt-4 border-t border-white/10 space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Threat Categories Tested</p>
              <div className="grid grid-cols-2 gap-2">
                <StatusTag label="Prompt Injection" active={stats.testsRun > 2} />
                <StatusTag label="Tool Misuse" active={stats.testsRun > 5} />
                <StatusTag label="Data Leakage" active={stats.testsRun > 8} />
                <StatusTag label="Persona Bypass" active={stats.testsRun > 4} />
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3 text-primary mb-2">
              <Cpu className="w-5 h-5" />
              <span className="font-bold text-sm">Adversarial Brain</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              ZYNTH Intelligence is currently generating dynamic attack vectors to analyze agent behavior under extreme adversarial conditions.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Report Modal */}
      <AnimatePresence>
        {showReport && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel p-8 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto border border-primary/30 shadow-2xl shadow-primary/10 relative"
            >
              <button 
                onClick={() => setShowReport(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <Shield className="w-12 h-12 text-primary" />
                <div>
                  <h2 className="text-2xl font-bold tracking-tighter">ZYNTH OFFICIAL AUDIT REPORT</h2>
                  <p className="text-sm font-mono text-muted-foreground">Target: {target.toUpperCase()} | Status: {stats.riskScore > 50 ? 'CRITICAL RISK' : 'SECURE'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-black/50 p-4 rounded-xl border border-white/5 text-center">
                  <div className="text-3xl font-black text-red-500">{stats.vulnerabilities}</div>
                  <div className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Vulnerabilities</div>
                </div>
                <div className="bg-black/50 p-4 rounded-xl border border-white/5 text-center">
                  <div className="text-3xl font-black text-primary">{stats.riskScore}</div>
                  <div className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Overall Risk Pts</div>
                </div>
                <div className="bg-black/50 p-4 rounded-xl border border-white/5 text-center">
                  <div className="text-3xl font-black text-green-500">{stats.testsRun}</div>
                  <div className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Tests Executed</div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-bold border-b border-white/10 pb-2">Critical Findings</h3>
                {scanResults.filter(r => r.is_vulnerable).length === 0 ? (
                  <p className="text-green-400 font-mono text-sm">No vulnerabilities detected. Good job.</p>
                ) : (
                  scanResults.filter(r => r.is_vulnerable).map((r, i) => (
                    <div key={i} className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-destructive">{r.test_name}</span>
                        <span className="text-xs font-mono bg-destructive/20 px-2 py-1 rounded text-destructive">{r.mitre_technique}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2"><span className="text-white opacity-50">Vector:</span> {r.category}</p>
                      <div className="bg-black/50 p-2 rounded text-[10px] font-mono text-red-300 break-all">
                        {r.response_preview}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-white/10">
                <button 
                  onClick={() => {
                    const el = document.createElement("a");
                    const file = new Blob([JSON.stringify(scanResults, null, 2)], {type: 'text/plain'});
                    el.href = URL.createObjectURL(file);
                    el.download = "zynth_audit_report.json";
                    el.click();
                  }}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold flex items-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" /> EXPORT JSON REPORT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

const MetricItem = ({ label, value, unit, color }) => (
  <div className="flex justify-between items-end">
    <span className="text-xs font-mono text-muted-foreground">{label}</span>
    <div className="text-right">
      <span className={`text-2xl font-black ${color}`}>{value}</span>
      <span className="text-[10px] ml-1 font-mono text-muted-foreground opacity-50">{unit}</span>
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
        ? (danger ? 'bg-destructive border-destructive text-white shadow-lg glow-destructive' : 'bg-primary border-primary text-white shadow-lg glow-primary') 
        : 'bg-black/40 border-white/10 text-muted-foreground hover:border-white/20 hover:text-white'
    }`}
  >
    <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    <span className={`text-[8px] opacity-70 ${active ? 'text-white' : ''}`}>{description}</span>
  </button>
);

export default CommandCenter;
