# Sprout: Carbon Footprint Tracker

Sprout is a comprehensive, interactive carbon footprint tracking dashboard designed to empower users to understand, reduce, and offset their environmental impact. Built with a nature-inspired design system, Sprout combines robust tracking tools with engaging gamification and AI-driven insights to make sustainable living accessible and rewarding.

## Features

- **Carbon Calculator**: Accurately estimate your carbon footprint based on daily activities, transportation, energy usage, and dietary choices.
- **AI Agent Integration**: A unified AI Agent panel provides personalized sustainability recommendations, answers eco-related queries, and guides users through their carbon reduction journey.
- **Green Map**: Discover nearby eco-friendly businesses, recycling centers, and green spaces.
- **Challenges & Rewards**: Participate in daily and weekly sustainability challenges to earn rewards and build green habits.
- **Eco-Garden (Gamification)**: Visualize your progress! Watch your virtual eco-garden grow and flourish as you reduce your carbon emissions and complete challenges.
- **Learning Hub**: Access curated content, articles, and tips to deepen your understanding of environmental conservation and sustainable practices.
- **Community & Analytics**: Track your progress over time with detailed analytics and connect with a community of like-minded individuals.

## Tech Stack

- **Frontend**: React, Vite, Vanilla CSS
- **Backend/Services**: Firebase (Authentication, Firestore)
- **AI Integration**: LangChain / LangGraph
- **Styling**: Custom CSS with a polished, nature-inspired "Stitch" design system, prioritizing accessibility and modern aesthetics.

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
