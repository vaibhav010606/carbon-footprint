import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function Recommendations() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'activities'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const hasActivities = activities.length > 0;
  
  const hasDairy = activities.some(act => act.subCategory === 'dairy');
  const hasBeef = activities.some(act => act.subCategory === 'beef');
  const hasPetrol = activities.some(act => act.subCategory === 'petrol_car' || act.subCategory === 'diesel_car');
  
  let recommendations = [];
  
  if (hasDairy) {
    recommendations.push({
      title: "Switch to Oat Milk",
      desc: "We noticed you log dairy milk frequently. Switching to oat milk can reduce your beverage emissions by up to 70%.",
      icon: "ph:drop-fill", color: "bg-leaf text-cream"
    });
  }
  
  if (hasPetrol) {
    recommendations.push({
      title: "Carpooling Opportunities",
      desc: "You log car trips often. Sharing these rides with one other person could cut these emissions in half.",
      icon: "ph:car-profile-fill", color: "bg-ochre text-forest"
    });
  }

  if (hasBeef) {
    recommendations.push({
      title: "Try Plant-Based Alternatives",
      desc: "Beef has a very high carbon footprint. Try replacing one beef meal a week with a plant-based alternative.",
      icon: "ph:hamburger-fill", color: "bg-terracotta text-cream"
    });
  }

  if (recommendations.length === 0 && hasActivities) {
    recommendations.push({
      title: "Great Job!",
      desc: "You're doing great! Keep logging activities to get more personalized tips.",
      icon: "ph:star-fill", color: "bg-forest text-cream"
    });
  }

  return (
    <div className="animate-fade-in-up">
      <h2 className="font-serif text-4xl font-bold text-forest mb-2">Eco-Tips</h2>
      <p className="text-soil font-medium mb-8">Personalized suggestions based on your logged activities.</p>
      
      {!hasActivities ? (
        <div className="bg-cream border-4 border-forest shadow-brutal p-12 organic-card text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-white border-4 border-forest rounded-full flex items-center justify-center shadow-brutal-sm mb-6">
            <iconify-icon icon="ph:leaf-duotone" class="text-4xl text-forest/30"></iconify-icon>
          </div>
          <h3 className="font-serif text-3xl font-bold text-forest mb-4">Log more activities</h3>
          <p className="text-soil font-medium max-w-md mx-auto">
            Log a few activities using the Calculator or Agent to get personalized suggestions tailored to your footprint.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {recommendations.map((rec, idx) => (
            <div key={idx} className={`bg-white border-4 border-forest shadow-brutal p-6 ${idx % 2 === 0 ? 'organic-card' : 'organic-card-alt'} flex flex-col md:flex-row gap-6 items-start hover:-translate-y-1 hover:shadow-brutal-hover smooth-transition`}>
              <div className={`w-16 h-16 ${rec.color} border-2 border-forest rounded-[1rem] flex items-center justify-center shrink-0 ${idx % 2 === 0 ? '-rotate-3' : 'rotate-3'}`}>
                <iconify-icon icon={rec.icon} class="text-3xl"></iconify-icon>
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-forest mb-2">{rec.title}</h3>
                <p className="text-soil font-medium mb-4 max-w-2xl">{rec.desc}</p>
                <button className="bg-cream border-2 border-forest text-forest font-bold text-sm py-2 px-6 rounded-full hover:bg-forest hover:text-cream hover:-translate-y-0.5 active:translate-y-0 smooth-transition shadow-brutal-sm uppercase tracking-widest flex items-center gap-2">
                  Learn More <iconify-icon icon="ph:arrow-right-bold" class="text-lg"></iconify-icon>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
