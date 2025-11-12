# Blockchain-Powered Transparent Charity Platform

> **Transparent donations. Verifiable disbursement. Immutable accountability.**

---

## Overview

The **Blockchain-Powered Transparent Charity Platform** brings end-to-end visibility to charitable donations using **blockchain, smart contracts, and decentralized storage**.
It eliminates fraud, enhances donor trust, and ensures every rupee donated is traceable — from contribution to verified impact.

---

## The Transparency Crisis

Charitable giving suffers from serious trust and accountability issues:

* **Limited visibility:** Donors seldom see how funds are actually spent
* **Audit inefficiency:** Manual verification is slow, costly, and error-prone
* **Fraud risk:** Misuse or diversion of funds often goes undetected for months
* **Impact on funding:** Transparent organizations receive up to **62% more donations** than opaque ones (Candid study)

---

## Our Solution — End-to-End Transparency

A **multi-layered decentralized platform** enabling verifiable transactions between donors, NGOs, beneficiaries, and service providers.

### Core Components

| Module                      | Purpose                                                             |
| --------------------------- | ------------------------------------------------------------------- |
| **NGO Registry**            | Verified on-chain credentials and governance controls               |
| **Campaign Factory**        | Automated fundraising smart contract deployment                     |
| **Soulbound Tokens (SBTs)** | Non-transferable beneficiary identities to prevent duplicate claims |
| **Provider Registry**       | Verified service providers with transparent redemption tracking     |

**Key Benefit:** Every disbursement and redemption leaves an **immutable audit trail** visible to donors, regulators, and auditors in real time.

---

## System Architecture

### **Frontend Layer**

* Built with **Next.js**
* Integrated wallet connections (MetaMask / RainbowKit)
* Responsive UI for NGOs, donors, and service providers

### **Backend Services**

* **Express.js API** with **MongoDB** for caching and off-chain data
* **BlockchainSync Service** continuously monitors smart contract events
* WebSockets for **real-time updates**

### **Blockchain Layer**

* Smart contracts:

  * `CampaignFactory.sol`
  * `NGORegistry.sol`
  * `SoulboundToken.sol`
* Event-driven synchronization and automated fund disbursement

### **Decentralized Storage**

* **IPFS** for storing campaign documents, KYC proofs, and redemption evidence

---

## Smart Contract Infrastructure

| Contract                      | Functionality                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------- |
| **NGO Governance**            | Multi-signature system for fund approvals and organizational control             |
| **NGO Registry**              | On-chain directory with credential verification and reputation tracking          |
| **Campaign Factory**          | Launches campaigns with configurable goals and timelines                         |
| **Soulbound Token**           | Issues non-transferable beneficiary credentials ensuring single-claim redemption |
| **Service Provider Registry** | Manages redemption and payment settlement with verified vendors                  |

---

## Backend–Blockchain Synchronization

The backend maintains **event-driven consistency** via:

* Continuous event polling with retry logic
* MongoDB caching for fast queries
* Automated reconciliation through background jobs
* Real-time WebSocket updates
* Eventual consistency under network delays

This guarantees that data across blockchain and backend remains synchronized and auditable.

---

## User Flow

1. **NGO Registration** — Submit credentials, undergo verification, receive on-chain approval
2. **Campaign Creation** — Verified NGOs deploy campaigns with details and IPFS docs
3. **Donor Contributions** — MetaMask-based crypto donations with on-chain receipts
4. **Provider Redemption** — Registered service providers claim verified payments
5. **Analytics Dashboard** — Donors view live fund flow and impact metrics

---

## Testing & Local Development

Our testing framework ensures rapid validation and easy reproducibility for developers and auditors.

**Setup:**
```bash
# Install dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

**Commands:**

```bash
# In 1st terminal - Start local blockchain
npx hardhat node

# In 2nd terminal - Deploy contracts locally
npm run deploy:local

# In 3rd terminal - Launch frontend dev server
cd frontend
npm run dev

# In 4th terminal - Run backend server
cd ../backend
npm run dev
```

**Highlights:**

* 24 passing tests for contracts, permissions, and donation flows
* Automated smoke tests for CI/CD validation
* End-to-end verification of deployment and API health

---

## Next Steps & Partnership Opportunities

| Initiative                    | Description                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| **Community Testing Program** | Invite NGOs and donors to pilot and provide feedback        |
| **Security Audit**            | Third-party contract review to ensure production readiness  |
| **UX Refinement**             | Enhance accessibility for non-technical stakeholders        |
| **Testnet Deployment**        | Public launch on Ethereum Sepolia for real-world simulation |
| **Pilot NGO Partnerships**    | Onboard 3–5 organizations for live case studies             |

---

## Tech Stack

| Layer          | Technologies                                  |
| -------------- | --------------------------------------------- |
| **Frontend**   | Next.js, RainbowKit, Tailwind CSS / shadcn-ui |
| **Backend**    | Node.js (Express), MongoDB, WebSockets        |
| **Blockchain** | Solidity (Hardhat), Ethereum / Sepolia        |
| **Storage**    | IPFS                                          |
| **Tools**      | GitHub Actions, Jest, Hardhat test suite      |

---
