# 🌱 Sprout — Carbon Footprint Tracker

> *Rooting for a sustainable future, one habit at a time.*

**Sprout** is an AI-powered carbon footprint tracker that helps individuals measure, understand, and reduce their daily environmental impact. Log activities, chat with an AI eco-agent, grow your virtual garden, and compete in a global leaderboard — all in one premium web experience.

🌐 **Live App**: [https://carbon-footprint-912406073113.us-central1.run.app](https://carbon-footprint-912406073113.us-central1.run.app)

---

## ✨ Features

### 🤖 AI Eco-Agent (Gemini 2.5 Flash + LangGraph)
- Conversational activity logging — just describe what you did
- Multimodal: upload **receipts**, scan **barcodes**, or **share your screen** for AI analysis
- Automatic carbon footprint extraction and Firestore logging
- Context-aware: knows your history and provides personalized advice
- Powered by a **LangGraph** state machine for extensible agentic workflows

### 🧮 Manual Carbon Calculator
- Log **7 categories**: Transport, Energy, Food, Shopping, Digital, Waste, Positive Actions
- 30+ sub-categories with scientifically-sourced emission factors (IPCC, EPA)
- Live CO₂ preview as you type
- Quick-log presets for common activities
- Streak and weekly progress tracking

### 🌳 Virtual Eco-Garden
- 4 growth stages based on Leaf Points earned
- Progress bar to next stage with point requirements
- Visual feedback reinforcing positive environmental habits

### 🏆 Community & Leaderboard
- Real-time global leaderboard of top eco-warriors
- User levels, leaf points, and active day streaks

### 🎮 Eco Quest Game
- Interactive browser game to raise carbon awareness
- Points earned in-game contribute to Leaf Points

### 🗺️ Green Map
- Leaflet-powered interactive map
- Find nearby EV charging stations, recycling centers, parks, and eco-spots

### 📚 Learning Hub (The Field Guide)
- Curated videos and articles on carbon footprints, greenhouse gases, and sustainability
- Category filtering: Carbon Basics, Global Warming, Renewable Energy, and more

### 💡 Personalized Eco-Tips
- Recommendations generated from your actual logged activity patterns
- Identifies your highest-impact categories and suggests targeted changes

### 🎯 Challenges & Badges
- Activity-based badge system (First Step, Eco Warrior, Planet Saver, etc.)
- Meatless Week challenge with live progress tracking

---

## 🏗️ Architecture

```
src/
├── agent/
│   └── graph.js          # LangGraph state machine (Gemini 2.5 Flash)
├── components/
│   ├── AIAgentPanel.jsx  # Multimodal AI chat interface
│   ├── AuthModal.jsx     # Google + Email/Password auth
│   ├── Calculator.jsx    # Manual emission calculator
│   ├── Challenges.jsx    # Badges and active challenges
│   ├── Community.jsx     # Global leaderboard
│   ├── ContentPanel.jsx  # Main routing/nav hub
│   ├── EcoGarden.jsx     # Virtual plant growth
│   ├── Game.jsx          # Eco Quest game
│   ├── GreenMap.jsx      # Leaflet interactive map
│   ├── LearningHub.jsx   # Educational content hub
│   └── Recommendations.jsx # Personalized eco-tips
├── firebase.js           # Firebase app initialization
├── audio.js              # UI sound effects
└── index.css             # Global styles and animations
```

### Key Technology Decisions

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 19 + Vite | Fast HMR, modern React features |
| AI Agent | Gemini 2.5 Flash + LangGraph | State graph enables extensible tool-calling |
| Database | Firebase Firestore | Real-time sync, offline support |
| Auth | Firebase Auth | Google + email, secure token management |
| Maps | React Leaflet | Open-source, no API key required |
| Charts | Recharts | Declarative, responsive chart components |
| Styling | Tailwind CSS (CDN) | Rapid utility-first styling with custom theme |

---

## 🔐 Security

- Firebase API keys scoped to authorized domains only
- **Infrastructure as Code:** `firestore.rules` enforces rule that restricts all reads/writes to authenticated users' own data (`request.auth.uid == userId`)
- Input sanitization: all user-generated text is trimmed and length-capped before Firestore writes
- `minLength` and `maxLength` enforced on all form inputs
- Gemini API keys stored in `.env.local` (never committed to version control)
- Environment variable rotation supported via comma-separated key list with round-robin selection

---

## ♿ Accessibility

- Semantic HTML5 landmarks: `<header>`, `<main>`, `<nav>`, `<footer>`
- Skip-to-content link for keyboard users
- All interactive elements have explicit `aria-label` or visible label associations (`htmlFor`/`id`)
- Error messages use `role="alert"` and `aria-live="polite"` for screen reader announcements
- `autocomplete` attributes on all auth form inputs
- Decorative icons marked `aria-hidden="true"`
- **Canvas A11y:** The HTML5 Canvas (`eco-quest.html`) includes `aria-label`, `role="img"`, and a visually hidden text fallback (`<div className="visually-hidden">`) describing game mechanics for screen readers.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

- **14 test suites**, **30+ tests** covering all components
- **Strict 80% Threshold:** `vitest.config.js` enforces a strict 80% coverage floor for statements, branches, functions, and lines.
- `coverage.test.jsx` ensures all modular UI components (like `ChatBubble.jsx`) are structurally mounted.
- Pure unit tests for emission calculation logic (no mocking required)
- Integration tests for form interactions, tab switching, user input
- Mocked Firebase and LangChain for isolated component testing

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Add your Firebase and Gemini API keys

# Start dev server
npm run dev

# Build for production
npm run build
```

### Required Environment Variables

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GEMINI_API_KEYS=key1,key2  # comma-separated for round-robin rotation
```

---

## ☁️ Deployment

Deployed on **Google Cloud Run** with container-based serving:

```bash
# Build and deploy
gcloud run deploy carbon-footprint \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 🌍 Emission Factors

Emission factors are sourced from peer-reviewed datasets:
- **Transport**: IPCC AR5 / UK DEFRA 2023 emission factors
- **Food**: Poore & Nemecek (2018), Science — "Reducing food's environmental impacts"
- **Energy**: US EPA eGRID 2022 (0.39 kg CO₂e/kWh for grid electricity)
- **Digital**: The Shift Project, Carbon Trust estimates

---

*Built with 💚 for a greener planet.*
