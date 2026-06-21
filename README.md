# Sprout: Smart Carbon Footprint Assistant 🌱

Sprout is an intelligent, eco-friendly lifestyle companion built to track, gamify, and reduce your carbon footprint. It seamlessly blends manual tracking with an advanced AI Agent capable of visually scanning receipts and barcodes to automatically deduce emissions.

## 🏆 Challenge Vertical
**Smart Carbon Footprint Assistant / Eco-friendly Tracker**

## 🧠 Approach & Logic
Our approach hinges on removing the friction from environmental tracking while maintaining scientific accuracy and user engagement. 

- **AI-Powered Input:** Instead of manually searching for emission factors, the built-in AI Agent (powered by LangChain and Google Gemini 1.5) uses a ReAct pattern to chat with users, interpret unstructured text (e.g., "I flew to New York"), scan physical receipts, and parse barcodes. It autonomously classifies these activities and calculates accurate CO₂ equivalents.
- **Real-Time Data Pipeline:** We use Firebase Firestore as our backend. The app utilizes real-time `onSnapshot` listeners so that any activity logged via the AI Agent immediately updates the global dashboard, the gamified Eco-Garden, the monthly budget in Analytics, and the community leaderboard.
- **Extensible Gamification Engine:** User behavior is mapped to "Leaf Points". The logic dynamically awards achievement badges based on specific user actions (e.g., logging vegetarian meals unlocks a "Meatless Week" progress bar, while consistent daily logging builds a streak).

## ⚙️ How the Solution Works
1. **The Core Dashboard:** Users are greeted with an OLED-friendly (Dark Mode) UI built using React and TailwindCSS. The `ContentPanel` acts as the router, swapping between the Calculator, Map, Analytics, and Learning Hub.
2. **Manual & AI Logging:** Users can manually log activities via the `Calculator` (using predefined emission factors for transport, food, energy, etc.), or they can open the floating `AIAgentPanel`. The agent can accept text, image uploads (receipts), or webcam captures (barcodes), run them through the Gemini Vision model, and automatically write structured data to Firestore.
3. **Analytics & Budgeting:** The `Analytics` component aggregates real-time data, comparing it against a user-defined monthly CO₂ budget (default 500kg), visualizing trends via Recharts.
4. **Community & Map:** Users can see global rankings on the Leaderboard. The `GreenMap` uses the Overpass API to dynamically fetch and display nearby eco-friendly spots (parks, EV chargers, recycling centers, thrift stores) based on the user's geolocation.

## 🔒 Security (Firebase Setup)
While the frontend accesses Firebase using keys stored securely in `.env.local` (safe for Vite apps), a production deployment of Sprout requires configuring Firestore Security Rules to ensure data integrity:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /activities/{activityId} {
      // Users can only read/write their own activities
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## 🤔 Assumptions Made
- **Emission Factors:** The predefined emission factors (e.g., 0.19 kg CO₂/km for petrol cars, 2.5 kg CO₂ for a beef meal) are broad global averages intended for gamification, not enterprise carbon accounting.
- **Hardware Availability:** The barcode scanner and screen-share tools assume the user's browser has access to a webcam (`getUserMedia`) and screen capture (`getDisplayMedia`) APIs.
- **Environment Context:** We assume the Overpass API is available for the GreenMap feature; if the user's network blocks it, the map gracefully degrades to a generic view.

## 🚀 Running Locally
1. Clone the repository.
2. Run `npm install`.
3. Create a `.env.local` with your `VITE_FIREBASE_*` and `VITE_GEMINI_API_KEYS`.
4. Run `npm run dev`.
5. Run `npm run test` to execute the Vitest suite.
