# Sprout: Carbon Footprint Tracker

Sprout is a comprehensive, interactive carbon footprint tracking dashboard designed to empower users to understand, reduce, and offset their environmental impact. Built with a nature-inspired design system, Sprout combines robust tracking tools with engaging gamification and AI-driven insights to make sustainable living accessible and rewarding.

## Comprehensive Technology Stack & Implementation Details

This project leverages a modern, full-stack architecture to deliver a seamless, high-performance, and scalable experience. Below is a detailed breakdown of the technologies used and how they are implemented within the system.

### 1. Frontend Architecture: React & Vite
- **Implementation**: The user interface is built as a Single Page Application (SPA) using **React**. We utilized functional components and React Hooks (`useState`, `useEffect`, `useContext`) to manage complex, modular state across different panels (e.g., Calculator, Eco-Garden, and Analytics).
- **Build Tool**: **Vite** is used as the frontend build tool, providing a significantly faster Hot Module Replacement (HMR) during development compared to traditional bundlers like Webpack, and outputting highly optimized, minified static assets for production.
- **Routing & State Management**: The application implements localized and global state to ensure a smooth, app-like experience without full-page reloads, making transitions between the map, challenges, and dashboard instantaneous and highly responsive.

### 2. Backend & State Persistence: Firebase
Firebase acts as the backend-as-a-service (BaaS), handling all server-side operations securely.
- **Firebase Authentication**: Handles secure user onboarding, login, and session management. It ensures that user data is kept private and securely linked to unique IDs.
- **Cloud Firestore**: A NoSQL, real-time database used for persisting application state.
  - **Implementation**: Firestore collections store user profiles, calculated carbon footprints, completed challenges, and the state of the "Eco-Garden" gamification system. When a user completes a task or updates their footprint, the data is synced in real-time between the React frontend and Firestore, guaranteeing that data is safely preserved across sessions.

### 3. AI Agent Integration: LangChain & LangGraph
One of the core innovations of Sprout is the integrated, intelligent AI sustainability assistant.
- **Implementation**: The AI system is orchestrated using **LangChain** and **LangGraph**. This allows the AI to execute stateful, multi-step reasoning processes rather than simple one-off responses.
- **Context-Aware Assistance**: Instead of a generic chat interface, the LangGraph-powered agent is deeply integrated with the user's actual dashboard data. It understands the user's specific carbon footprint metrics, recent challenge completions, and overall progress. This allows the agent to provide highly tailored, contextual advice on how to reduce emissions and optimize daily habits.

### 4. UI/UX & Styling: Vanilla CSS & "Stitch" Design System
- **Implementation**: We implemented a bespoke, nature-inspired design system entirely from scratch using **Vanilla CSS**. This completely bypasses heavy CSS frameworks, ensuring a lightweight and incredibly fast-loading UI.
- **Design Philosophy**: The application embraces modern UI trends including soft glassmorphism, dynamic micro-animations on hover states, and smooth progress bar transitions. The color palette utilizes sophisticated, earthy tones with distinct color-coded indicators for warnings, successes, and gamified rewards. This unified aesthetic ensures an immersive, premium, and professional user experience.

## Features

- **Carbon Calculator**: Accurately estimate your carbon footprint based on daily activities, transportation, energy usage, and dietary choices.
- **AI Agent Integration**: A unified AI Agent panel provides personalized sustainability recommendations, answers eco-related queries, and guides users through their carbon reduction journey.
- **Green Map**: Discover nearby eco-friendly businesses, recycling centers, and green spaces.
- **Challenges & Rewards**: Participate in daily and weekly sustainability challenges to earn rewards and build green habits.
- **Eco-Garden (Gamification)**: Visualize your progress! Watch your virtual eco-garden grow and flourish as you reduce your carbon emissions and complete challenges.
- **Learning Hub**: Access curated content, articles, and tips to deepen your understanding of environmental conservation and sustainable practices.
- **Community & Analytics**: Track your progress over time with detailed analytics and connect with a community of like-minded individuals.

## Installation and Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vaibhav010606/carbon-footprint.git
   cd carbon-footprint
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory and add your Firebase and AI API keys:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   VITE_AI_API_KEY=your_ai_api_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue for any bugs or feature requests.

## License

This project is licensed under the MIT License.
