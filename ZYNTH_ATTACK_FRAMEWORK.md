# ZYNTH AUTONOMOUS ATTACK MATRIX (ZAAM)

This document serves as the official cyber-warfare blueprint for ZYNTH. It outlines every advanced threat category the platform is designed to test for. We are not building a simple prompt injector; we are building an infrastructural weapon to test the entire surface area of an AI Agent.

## 💥 1. Infrastructure Exfiltration (The Tools)
These attacks target the databases, APIs, and file systems the AI is connected to.
- **LLM-Assisted SQL Injection**: Tricking the agent into forming a malicious SQL string and pushing it to its database tool (e.g., `DROP TABLE users`).
- **Server-Side Request Forgery (SSRF)**: Forcing the agent to use a web-browsing or API tool to access internal, protected meta-data servers (e.g., AWS IAM keys).
- **The Confused Deputy (Auth Bypass)**: The agent possesses admin API keys. ZYNTH manipulates the agent into executing authenticated API calls on behalf of an unprivileged attacker.

## 🧠 2. Cognitive Subversion (The Brain)
These attacks target the LLM's memory, context, and fundamental logic.
- **Alignment Drifting (Goal Hijacking)**: A long-con, multi-turn attack that slowly shifts the agent's definition of "helpful" until it willingly executes malicious commands.
- **Cognitive Denial of Service (C-DoS)**: Flooding the agent's context window with precisely calculated filler text to push its core safety instructions out of memory (inducing amnesia).
- **Temporal/Logic Traps**: Trapping the AI in an infinite reasoning loop where it talks to itself or uses a tool repeatedly to drain the company's API credit balance (Economic DoS / E-DoS).

## 🗄️ 3. Knowledge Base Poisoning (The Data)
These attacks target the Vector Databases and RAG (Retrieval-Augmented Generation) systems.
- **Toxic Embeddings (RAG Poisoning)**: Hiding malicious instructions inside normal-looking PDFs or text files. When the AI indexes these documents into its memory, its foundation becomes corrupted.
- **Sleepers**: Data that lays dormant in the system until a specific keyword is spoken by an innocent user, triggering the agent to act maliciously.

## 🎭 4. Multi-Modal Exploits (The Senses)
These attacks test models that can see and hear.
- **Visual Steganography**: Embedding destructive commands in the invisible adversarial noise of an uploaded image. The human sees a cat; the AI reads "delete user data".
- **Audio Overrides**: Micro-frequencies in voice inputs that hijack the voice-to-text transcriber to inject unauthorized commands.

## 📦 5. Software Supply Chain (The Code)
- **Phantom Package Hallucination**: Coercing a coding agent into suggesting a non-existent Python package to a developer. The attacker registers that package maliciously on PyPI, compromising the developer's laptop.

---
*If an AI Agent is connected to the real world, ZYNTH will find the crack in its armor.*
