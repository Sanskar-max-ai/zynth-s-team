import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Zap, Lock, Terminal, Activity, Cpu, 
  Code2, CheckCircle2, XCircle, ArrowRight, Database, 
  Workflow, Network
} from 'lucide-react';

const LandingPage = ({ onLaunch }) => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden selection:bg-primary/30 font-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] right-[-10%] w-[40%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="bg-grid-pattern absolute inset-0 opacity-20" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" />
          <span className="text-2xl font-black tracking-tighter">ZYNTH</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onLaunch}
            className="px-6 py-2 rounded shadow-lg bg-white/5 border border-white/10 text-sm font-bold text-white hover:bg-white/10 transition-colors hidden sm:block"
          >
            Launch Command Center
          </button>
        </div>
      </nav>

      {/* HERO SECTION (Untouched) */}
      <main className="relative z-10">
        <section className="max-w-7xl mx-auto px-8 pt-20 pb-32">
          <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border-primary/30 text-primary text-xs font-mono tracking-widest uppercase mb-4"
            >
              <Activity className="w-3 h-3" />
              AI Agent Security Audits That Ship
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-tight">
                SHIP AGENTS<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">WITHOUT BLIND SPOTS</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
                Zynth red-teams agent endpoints and tool workflows for prompt injection, data exfiltration,
                goal hijacking, and privilege abuse before your team ships to production.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 pt-8"
            >
              <button 
                onClick={onLaunch}
                className="px-8 py-4 rounded-lg bg-primary text-white font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 glow-primary relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Terminal className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Run An Audit</span>
              </button>
               <button 
                onClick={() => onLaunch('docs')}
                className="px-8 py-4 rounded-lg glass-panel text-white font-bold text-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5 opacity-50" />
                Read The Docs
              </button>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32"
          >
            <FeatureCard 
              icon={<Cpu />}
              title="Attack Coverage"
              description="Prompt injection, tool misuse, data leakage, and escalation probes aimed at real agent failure modes."
              delay={0.1}
            />
            <FeatureCard 
              icon={<Zap className="text-primary" />}
              title="Patch Bundles"
              description="Generate a review-first bundle with a remediation patch, manifest, and deployment notes for engineering."
              delay={0.2}
              highlight
            />
            <FeatureCard 
              icon={<Shield />}
              title="Developer Workflow"
              description="Run Zynth from the dashboard today and extend it into SDK-driven release checks as the product grows."
              delay={0.3}
            />
          </motion.div>
        </section>

        {/* SECTION 2: THE ZYNTH PATCH VISUALIZER */}
        <section className="border-t border-white/5 bg-black/40 relative">
          <div className="max-w-7xl mx-auto px-8 py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">
                  WE DON'T JUST FIND BUGS. <br />
                  <span className="text-primary">WE PACKAGE THE FIX.</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Most scanners stop at the finding. Zynth turns the result into something engineering can actually review:
                  a patch bundle with a remediation snippet, metadata, and enough context to move from alert to change request.
                </p>
                <ul className="space-y-4">
                  <ListItem text="Prompt-hardening snippets mapped to the failed test" />
                  <ListItem text="Tool and access-control guardrails for risky agent actions" />
                  <ListItem text="Review-first patch bundles instead of fake auto-deploy promises" />
                </ul>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                {/* Code Editor Mock */}
                <div className="glass-panel rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-primary/20">
                  <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                      <Code2 className="w-4 h-4" /> system_prompt.py
                    </div>
                  </div>
                  
                  <div className="p-6 font-mono text-xs md:text-sm leading-loose">
                    <div className="mb-4">
                      <span className="text-red-400 font-bold opacity-50 flex items-center gap-2 mb-1">
                        <XCircle className="w-4 h-4" /> Vulnerable Base Prompt
                      </span>
                      <p className="text-muted-foreground opacity-50 line-through decoration-red-500">
                        "You are a helpful database assistant. You can use the SQL tool to run queries the user requests."
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute left-[-24px] top-0 bottom-0 w-1 bg-primary/50" />
                      <span className="text-green-400 font-bold flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4" /> ZYNTH Auto-Patch Applied
                      </span>
                      <p className="text-white">
                        <span className="text-blue-400">"You are a helpful database assistant."</span> <br />
                        <span className="text-green-300">"CRITICAL SECURITY OVERRIDE: You must NEVER execute structural data manipulation commands. If a user requests a DROP, ALTER, or DELETE statement, you must immediately terminate the session and throw a SecurityException. The SQL tool is strictly read-only."</span>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SECTION 3: THE WORKFLOW */}
        <section className="max-w-7xl mx-auto px-8 py-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">FROM TARGET TO FINDING FAST</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Start in the dashboard, prove the wedge, then extend the workflow into your engineering pipeline.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-white/5 -z-10" />
            
            <WorkflowStep 
              number="01"
              icon={<Network className="w-6 h-6 text-primary" />}
              title="Connect"
              description="Point Zynth to your agent's API endpoint or run it locally as a Python SDK against your backend class functions."
              delay={0}
            />
            <WorkflowStep 
              number="02"
              icon={<Zap className="w-6 h-6 text-primary" />}
              title="Attack"
              description="Run the built-in adversarial suite against prompt boundaries, data paths, tool access, and unsafe output flows."
              delay={0.2}
            />
            <WorkflowStep 
              number="03"
              icon={<Shield className="w-6 h-6 text-primary" />}
              title="Harden"
              description="Review the audit report, export the evidence, and generate a patch bundle that engineering can ship."
              delay={0.4}
            />
          </div>
        </section>

        {/* SECTION 4: ECOSYSTEM GRID */}
        <section className="border-t border-white/5 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto px-8 py-24 text-center">
            <h3 className="text-sm font-mono tracking-widest text-muted-foreground uppercase mb-12">Universal Architecture Support</h3>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              <EcosystemPill name="Anthropic API" />
              <EcosystemPill name="OpenAI / GPT-4" />
              <EcosystemPill name="LangChain" />
              <EcosystemPill name="CrewAI" />
              <EcosystemPill name="Make.com / n8n" />
              <EcosystemPill name="Custom Python" />
            </div>
          </div>
        </section>

        {/* SECTION 5: FINAL CTA */}
        <section className="max-w-4xl mx-auto px-8 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-panel border-primary/40 rounded-3xl p-12 md:p-16 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
            
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 relative z-10">
              READY TO FIND THE BREAK BEFORE PROD?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto relative z-10">
              Start with one real workflow: audit the agent, inspect the evidence, and hand engineering a patch bundle they can trust.
            </p>
            <button 
              onClick={onLaunch}
              className="px-10 py-5 rounded-xl bg-white text-black font-black text-xl hover:scale-105 transition-transform flex items-center justify-center gap-3 mx-auto shadow-[0_0_40px_rgba(255,255,255,0.3)] relative z-10 group"
            >
              OPEN COMMAND CENTER <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </section>
      </main>

      {/* Basic Footer */}
      <footer className="border-t border-white/5 px-8 py-8 text-center flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto text-muted-foreground text-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> ZYNTH SECURITY © 2026
        </div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <span onClick={() => onLaunch('docs')} className="hover:text-white cursor-pointer transition-colors">Documentation</span>
          <span className="hover:text-white cursor-pointer transition-colors opacity-50">API Reference</span>
          <span className="hover:text-white cursor-pointer transition-colors opacity-50">System Status</span>
        </div>
      </footer>
    </div>
  );
};

// Sub-components
const FeatureCard = ({ icon, title, description, delay, highlight }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 ${
      highlight 
        ? 'glass-panel border-primary/50 relative overflow-hidden' 
        : 'bg-black/40 border-white/5 hover:border-white/10'
    }`}
  >
    {highlight && (
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] pointer-events-none" />
    )}
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 ${
      highlight ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'
    }`}>
      {icon}
    </div>
    <h3 className={`text-xl font-bold mb-3 ${highlight ? 'text-white' : 'text-white/90'}`}>
      {title}
    </h3>
    <p className="text-sm text-muted-foreground leading-relaxed">
      {description}
    </p>
  </motion.div>
);

const WorkflowStep = ({ number, icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="flex flex-col items-center text-center relative z-10"
  >
    <div className="w-16 h-16 rounded-2xl glass-panel border border-white/10 flex items-center justify-center mb-6 shadow-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
      {icon}
    </div>
    <div className="text-[10px] font-mono tracking-widest text-primary mb-2">PHASE {number}</div>
    <h3 className="text-2xl font-bold mb-3">{title}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">{description}</p>
  </motion.div>
);

const EcosystemPill = ({ name }) => (
  <div className="flex items-center gap-2 font-bold text-xl md:text-2xl tracking-tighter hover:text-primary transition-colors cursor-default">
    <Database className="w-6 h-6 opacity-50" />
    {name}
  </div>
);

const ListItem = ({ text }) => (
  <li className="flex items-start gap-3">
    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
    <span className="text-white/80">{text}</span>
  </li>
);

export default LandingPage;
