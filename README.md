# RecoveryOS

**AI Revenue Recovery Engine**  
*Built for Hackathon Track 03: Find revenue that's slipping away and win it back.*

RecoveryOS is an autonomous agentic collections system that closes the loop on lost revenue. Instead of a fragile, monolithic LLM prompt, it utilizes a deterministic dual-pipeline architecture to detect revenue at risk, compute a recovery strategy, run it through strict compliance guardrails, and execute the action—all while maintaining an immutable audit ledger.

## 🏗 Architecture

RecoveryOS abandons the "black-box AI" approach in favor of a strictly bounded, enterprise-ready state machine. 

- **Dual-Pipeline Execution**: Two independent state machines run in parallel. The Payment Pipeline resolves fast-moving issues in minutes (failed charges, timeouts, abandoned checkouts), while the Receivables Pipeline manages slow-moving B2B cycles over days (chaser-and-promise cycles).
- **Deterministic Strategy Engine**: A pure-function scoring system evaluates failure reasons, historical success rates, and attempt counts to assign the optimal intervention (`AUTO_RETRY`, `SMART_PAYMENT_LINK`, `WHATSAPP_REMINDER`).
- **Shared Guardrail Layer**: The most critical component. Every action from both pipelines funnels through a unified compliance engine that enforces stopping rules (e.g., `MAX_RETRIES`, `CONTACT_COOLDOWN`, `OPT_OUT`). It actively prevents cross-pipeline spam (e.g., stopping a WhatsApp invoice chaser if the payment pipeline just emailed the customer 10 minutes ago).
- **Immutable Audit Ledger**: Every decision, including the input telemetry, guardrail execution results, and final output, is permanently logged to an append-only ledger for enterprise compliance.

## 🚀 The Dashboard

The UI is built as a premium, high-contrast command center (with seamless Light/Dark mode).
- **Summary**: Live tracking of Revenue at Risk, Capital Recovered (Yield %), and Guardrail Interceptions.
- **Transactions Ledger**: A complete view of every event moving through the system.
- **Drill-Down**: A terminal-style node graph showing exactly *why* the engine made a decision, complete with glowing indicators for blocked actions.

## 💻 Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS, Framer Motion (Spring Physics)
- **Database**: SQLite + Drizzle ORM
- **Icons**: Phosphor Icons

## ⚙️ Running Locally

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Initialize Database & Start Server**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Run the Demo Loop**
   - Open \`http://localhost:3000/dashboard\`
   - Click the **Database Icon** in the top navigation bar to wipe the DB and seed the edge-case synthetic data.
   - Click **Run Pipelines** to execute the batch processing. Watch the recovery yield and guardrail blocks update dynamically!
   - Click into any blocked transaction (e.g., \`tx_retry_cap\`) to view the Audit Ledger drill-down.
