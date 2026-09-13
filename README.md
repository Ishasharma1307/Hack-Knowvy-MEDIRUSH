# MediRush — Intelligent Multi-Pharmacy Medicine Fulfilment Platform

[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Gemini API](https://img.shields.io/badge/Gemini_API-2.5_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![OpenStreetMap](https://img.shields.io/badge/Maps-Leaflet_OSM-77B829?logo=openstreetmap&logoColor=white)](https://leafletjs.com/)

> **"MediRush doesn't find the pharmacy with the most medicines. It finds the fastest combination of pharmacies to fulfil the patient's COMPLETE medicine request."**

---

## 💡 Real-World Problem

When a patient needs multiple medications on a prescription, a single local pharmacy rarely has all of them in stock. The traditional experience forces the patient to:
- Call different medical stores manually
- Wait in lines only to find missing items
- Accept deliveries from distant mega-warehouses taking 40+ minutes, or receive incomplete orders.

---

## ⚡ Our Innovation

MediRush introduces a **two-tier intelligence and optimization pipeline**:

```
PATIENT PRESCRIPTION (Natural Language / Text)
                     ↓
        GEMINI INTELLIGENCE LAYER
  (Extracts drug taxonomy, quantities, and clinical urgency)
                     ↓
        STRUCTURED MEDICINE REQUEST
  (User reviews and confirms medicine cards & units)
                     ↓
      SMART FULFILMENT ENGINE (Deterministic)
  (Combinatorial subset optimization across local pharmacy network)
                     ↓
         PARALLEL MULTI-HUB DISPATCH
  (Concurrent delivery achieving 100% fulfilment in ~14 mins)
```

### The Benchmark Optimization Case
- **Patient Prescription (5 Medicines):**
  1. *Dolo 650*
  2. *Pantoprazole*
  3. *Azithromycin*
  4. *ORS*
  5. *Cetirizine*
- **Single Pharmacy Baseline:**
  - A distant mega-store (5.6 km away) has items, but prep queues and traffic mean delivery takes **~30 min**.
- **MediRush Smart Engine:**
  - Dispatches **CityCare Pharmacy** (1.2 km away, 3 items) and **QuickCare Pharmacy** (1.8 km away, 2 items) simultaneously.
  - **Outcome:** Complete prescription fulfilled in **14 min**, saving **16 min (53% faster)**.

---

## 🛡️ Medical Safety Guardrails

- **Zero Clinical Hallucination:** Gemini is strictly an *interpretation layer* that structures only the items explicitly requested by the patient. It never prescribes drugs, changes prescriptions, or diagnoses diseases.
- **Emergency Care Advisory:** Requests indicating acute emergency symptoms (severe chest pain, breathing difficulty, acute trauma) trigger an immediate **108 / 112 Emergency Care Advisory** directing patients to medical emergency services rather than waiting for delivery.
- **Mandatory User Confirmation:** Extracted prescriptions are always displayed as editable cards (quantity, unit, drug name) before any order routing begins.
- **Offline NLP Failsafe:** Operates reliably with zero blank screens even without an API key or when network connectivity drops.

---

## 📂 Repository Architecture

```
src/
├── types/
│   ├── index.ts                     # Core domain types
│   └── pharmacy.ts                  # Pharmacy, inventory, and geolocation contracts
├── utils/
│   ├── distance.ts                  # Haversine distance calculator (km)
│   └── medicineNormalization.ts     # Safe clinical drug string normalizer
├── services/
│   ├── ai/
│   │   ├── geminiService.ts         # Gemini 2.5 Flash structured parser & reasoning
│   │   └── fallbackParser.ts        # Built-in offline clinical NLP rules engine
│   ├── pharmacy/
│   │   ├── pharmacyProvider.ts      # PharmacyDataProvider interface
│   │   └── demoPharmacyProvider.ts  # Calibrated 6-pharmacy network dataset
│   ├── fulfilment/
│   │   ├── types.ts                 # EngineInput, FulfilmentPlan, EngineResult
│   │   ├── scoring.ts               # Parallel ETA & multi-factor ranking
│   │   ├── baseline.ts              # Single-pharmacy naive benchmark evaluator
│   │   └── smartFulfilmentEngine.ts # Combinatorial optimizer (Priorities 1-4)
│   └── supabase/
│       └── client.ts                # Supabase persistence layer with local fallback
├── components/
│   ├── layout/                      # Header & Footer
│   ├── map/                         # Leaflet + OpenStreetMap visualizer (MediMap)
│   └── modal/                       # Settings & API Key modal
├── pages/
│   ├── LandingPage.tsx              # Hero, pipeline diagram & 1-click judge presets
│   ├── RequestPage.tsx              # Natural language prompt & manual medicine entry
│   ├── UnderstandingPage.tsx        # Editable confirmation cards & data contract preview
│   ├── ResultsPage.tsx              # Hero 14-min result, comparison card & map
│   └── TrackingPage.tsx             # Live concurrent courier dispatch simulator
└── test/
    └── engine.test.ts               # Automated 5-test unit test suite
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 2. Installation
```bash
git clone https://github.com/Ishasharma1307/Hack-Knowvy-MEDIRUSH.git
cd Hack-Knowvy-MEDIRUSH
npm install
```

### 3. Running Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Running the Engine Test Suite
To run the automated verification of the 5 core optimization test cases:
```bash
npx tsx src/test/engine.test.ts
```

### 5. Production Build
```bash
npm run build
```

---

## ⚙️ Environment Variables (Optional)

Create a `.env` file in the root directory if you wish to use a live Gemini API key or Supabase database:

```env
# Optional: Google Gemini API Key (built-in offline NLP engine works automatically if omitted)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Supabase configuration (local demo dataset is active by default)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 👥 Hackathon Team & Credits

Built with ❤️ for **Hack-Knowvy** | MediRush MVP.
