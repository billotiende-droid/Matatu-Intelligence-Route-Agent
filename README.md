# Matatu Route Intelligence Agent (Mzee Intelligent Router)

An AI-powered transit intelligence platform designed to aid commuters and planners navigating Nairobi's intricate public transportation network. The platform features **Mzee**, an intelligent, sheng/swahili-fluent routing companion that integrates transit timetables, real-time crowdsourcing, and climate/social delay parameters.

---

## 🏗️ Project Architecture

The application adopts a standard **Full-Stack (Client-Server)** development topology, bundling an Express-powered Node.js backend proxy with a modern React SPA frontend:

```text
├── server.ts                 # Full-stack backend entry point (Express, APIs, Agent execution)
├── metadata.json             # AI Studio Applet permissions and capability registry
├── package.json              # Dependency catalog and build scripts
├── vite.config.ts            # Vite asset loader and Tailwind configuration
├── src/                      # Client-side React Application
│   ├── main.tsx              # Front-end bootstrap script
│   ├── App.tsx               # Primary user dashboard interface containing all views
│   └── index.css             # Unified styling pipeline with custom font variables
└── dist/                     # Production compilation target (static bundle & server.cjs)
```

### Server Side (`server.ts`)
- **Transit Knowledge Database**: Registers static transit corridors for key Nairobi regions (Rongai, Ngong, Karen, Kikuyu, Embakasi, JKIA, Kiambu, Kasarani, Buruburu).
- **Mzee Agent API**: Handles dynamic chat routing and prompts. Proxies requests to Gemini server-side via the `@google/genai` TypeScript SDK, safeguarding private API keys.
- **Simulation and Crowdsourcing Handler**: Simulates live transit events (congestion, rainy season, police crackdowns) and stores temporary crowdsourced passenger warnings.

### Client Side (`src/`)
- **Responsive Bento Dashboard**: Built around desktop-first modular grid panels ensuring extreme readability on both high-definition widescreen displays and compact mobile devices.
- **Interactive Router controls**: Custom sliders and dropdown presets for time of day, weather, and budget parameters to formulate transit queries.
- **Smooth Motions**: Dynamic interface transitions managed directly by `motion/react`.

---

## 🛠️ Technological Stack

- **Backend Platform**: Node.js & Express.js
- **Frontend Framework**: React 19 & TypeScript
- **Interactive Maps Pipeline**: `@vis.gl/react-google-maps` (with unified WebGL/Polyline overlays)
- **Styling Engine**: Tailwind CSS v4 & Lucide Icons
- **Animation System**: Motion (`motion/react`)
- **LLM/API Client**: `@google/genai` (utilizing Gemini models)
- **Production Bundler**: `esbuild` (compiles server-side Node modules to self-contained CommonJS paths) & `Vite` (compiles front-end assets)

---

## ✨ Features

- **Multi-Engine Interactive Route Map**:
  - **Schematic Native Vector View (Default & Offline-Proof)**: A custom client-side reactive schematic tracker. Draws precise stage-to-stage connections, transit hops (labeled as Walk 👟 or specific Matatu Routes 🚌), and coordinate paths. This layer functions without a Google Maps API credential or configuration dependency.
  - **Directions Embed Mode**: Houses a robust Google Maps v1 directions framework with custom-bound starting and end stages matching exact Nairobi metropolitan constraints.
  - **WebGL Live Map**: Harnesses high-performance vector rendering and dynamic Polylines to automatically scale and center viewports on route hop coordinates. Utilizes modern Google Cloud advanced HTML markers (color-coded pins indicating Emerald for Origin, Red for Destination, and Blue for transit connections).
- **Mzee Chat Box**: Interactive transit routing engine. Mzee converses in English, Swahili, or Nairobi Sheng, delivering step-by-step connection sequences, route indices (e.g. Route 23, Route 111), and estimated pricing.
- **Crowdsourcing Webhook Platform**: Passengers can submit live transit interruptions or fare fluctuations directly.
- **Environmental Presets Selector**: Commuters can simulate environmental presets such as "Drizzle/Heavy Mud Season", "National Holiday Rush", or "Transit Crackdown" to observe routing durability.
- **Dynamic Key Distribution**: Dynamic runtime security logic pipes API secret credentials down on first initialization through `/api/system/status`, shielding valuable API keys (`GOOGLE_MAPS_PLATFORM_KEY` and `AFRICAS_TALKING_API_KEY`) from browser exposure or hardcoded front-end assets.
- **Vibrant Matatu Network Register**: Extracted comprehensively from credible journalistic audits (including *Tuko.co.ke* route archives) detailing base stages of Kangemi, Westlands, Karen, Kasarani, and beyond.

---

## 🚀 Setting Up & Running the Application

Ensure you have **Node.js v18 or later** installed.

### 1. Retrieve Dependencies
Before compiling or starting the applet, download the prerequisite packages:
```bash
npm install
```

### 2. Configure Environment Secrets
Create a `.env` file at the project root folder. If using Mzee's Gemini AI capabilities, add your API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Launch Development Server
Starts the Node development environment. The server listens exclusively on port `3000`:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your web browser.

### 4. Build for Production Execution
Compiles client-side scripts to static directories and bundles server configurations into a singular distribution path (`dist/server.cjs`):
```bash
npm run build
```

### 5. Start Production Server
Executes the fully compiled bundle:
```bash
npm run start
```
