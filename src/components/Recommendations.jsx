import { useMemo } from 'react';
import { useUser } from '../context/UserContext';

/**
 * Generates a ranked, personalised recommendation list driven by the user's
 * actual category totals (from UserContext). Each tip is tailored to the
 * biggest emitting category in the user's recent history.
 */
function buildRecommendations(categorySummary, rawActivities) {
  const recs = [];
  const hasAny = rawActivities.length > 0;
  if (!hasAny) return recs;

  // Rank non-positive categories by total CO2 descending
  const ranked = Object.entries(categorySummary)
    .filter(([cat]) => cat !== 'positive')
    .sort(([, a], [, b]) => b - a);

  const topCategory = ranked[0]?.[0];
  const topValue = ranked[0]?.[1] ?? 0;

  // Category-specific personalised tips
  const TIPS = {
    transport: {
      title: 'Rethink Your Commute',
      desc: `Transport is your biggest category (${topValue.toFixed(1)} kg CO₂e). Switching one car trip per week to cycling or public transit can cut transport emissions by up to 30%.`,
      icon: 'ph:car-profile-fill', color: 'bg-terracotta text-cream'
    },
    food: {
      title: 'Shift Your Plate',
      desc: `Food accounts for ${topValue.toFixed(1)} kg CO₂e of your footprint. Replacing one beef meal per week with a plant-based alternative saves roughly 2–4 kg CO₂ each time.`,
      icon: 'ph:hamburger-fill', color: 'bg-ochre text-forest'
    },
    energy: {
      title: 'Cut Your Home Energy Use',
      desc: `Home energy is your top emitter at ${topValue.toFixed(1)} kg CO₂e. Setting your thermostat 2°C closer to the outdoor temperature can reduce heating/cooling bills and emissions by ~10%.`,
      icon: 'ph:lightning-fill', color: 'bg-forest text-cream'
    },
    shopping: {
      title: 'Shop Secondhand First',
      desc: `Shopping adds ${topValue.toFixed(1)} kg CO₂e to your footprint. Buying one secondhand item instead of new this month avoids roughly 5–15 kg CO₂ per item.`,
      icon: 'ph:shopping-bag-fill', color: 'bg-leaf text-cream'
    },
    digital: {
      title: 'Lower Your Digital Footprint',
      desc: `Digital activity contributes ${topValue.toFixed(1)} kg CO₂e. Reducing video streaming quality from 4K to 1080p halves the energy used per hour.`,
      icon: 'ph:monitor-play-fill', color: 'bg-cardBg text-forest'
    },
    waste: {
      title: 'Compost & Recycle More',
      desc: `Waste produces ${topValue.toFixed(1)} kg CO₂e in your data. Starting a small compost bin for food scraps can divert up to 30% of household waste from landfill.`,
      icon: 'ph:recycle-fill', color: 'bg-terracotta text-cream'
    },
  };

  if (topCategory && TIPS[topCategory]) {
    recs.push(TIPS[topCategory]);
  }

  // Suggest dairy swap if dairy is logged
  if (rawActivities.some(a => a.subCategory === 'dairy')) {
    recs.push({
      title: 'Switch to Plant Milk',
      desc: 'We detected dairy in your logs. Oat milk produces ~3× less CO₂ per litre than cow\'s milk — a simple swap with a big impact.',
      icon: 'ph:drop-fill', color: 'bg-leaf text-cream'
    });
  }

  // Suggest carpooling if petrol/diesel car trips are logged
  if (rawActivities.some(a => a.subCategory === 'petrol_car' || a.subCategory === 'diesel_car')) {
    recs.push({
      title: 'Carpool on Your Next Trip',
      desc: 'You\'ve logged car trips this week. Sharing with one passenger halves the per-person emissions on every journey.',
      icon: 'ph:users-fill', color: 'bg-ochre text-forest'
    });
  }

  // Universal positive nudge if user already has positive actions
  if (categorySummary.positive < 0) {
    recs.push({
      title: 'Keep Offsetting!',
      desc: `You've already offset ${Math.abs(categorySummary.positive).toFixed(1)} kg CO₂e through positive actions. Every bike ride, tree planted, or recycling session adds up fast — keep it going!`,
      icon: 'ph:tree-fill', color: 'bg-forest text-cream'
    });
  }

  // Fallback if nothing personalised matches
  if (recs.length === 0 && hasAny) {
    recs.push({
      title: 'Great Start!',
      desc: 'Keep logging activities to unlock personalised, data-driven tips tailored to your biggest sources of emissions.',
      icon: 'ph:star-fill', color: 'bg-forest text-cream'
    });
  }

  return recs.slice(0, 4); // Cap at 4 recommendations
}

export default function Recommendations() {
  const { categorySummary, rawActivities } = useUser();

  const recommendations = useMemo(
    () => buildRecommendations(categorySummary, rawActivities),
    [categorySummary, rawActivities]
  );

  const hasActivities = rawActivities.length > 0;

  return (
    <div className="animate-fade-in-up">
      <h2 className="font-serif text-4xl font-bold text-forest mb-2">Eco-Tips</h2>
      <p className="text-soil font-medium mb-8">Personalised suggestions driven by your actual logged activity data.</p>
      
      {!hasActivities ? (
        <div className="bg-cream border-4 border-forest shadow-brutal p-12 organic-card text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-white border-4 border-forest rounded-full flex items-center justify-center shadow-brutal-sm mb-6">
            <iconify-icon icon="ph:leaf-duotone" class="text-4xl text-forest/30"></iconify-icon>
          </div>
          <h3 className="font-serif text-3xl font-bold text-forest mb-4">Log more activities</h3>
          <p className="text-soil font-medium max-w-md mx-auto">
            Log a few activities using the Calculator or Agent to get personalised suggestions tailored to your footprint.
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
