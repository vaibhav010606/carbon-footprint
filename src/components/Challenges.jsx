import { useUser } from '../context/UserContext';

export default function Challenges() {
  // Pull all derived data from the shared UserContext — no separate Firestore listeners needed.
  const { leafPoints, badges, meatlessDays } = useUser();

  const level = Math.floor(leafPoints / 1000) + 1;

  return (
    <div className="animate-fade-in-up">
      <h2 className="font-serif text-4xl font-bold text-forest mb-2">Game &amp; Challenges</h2>
      <p className="text-soil font-medium mb-8">Your live progress based on actual activities logged.</p>
      
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1 bg-ochre border-4 border-forest shadow-brutal p-6 organic-card flex items-center gap-4 hover:-translate-y-1 hover:shadow-brutal-hover smooth-transition">
          <div className="w-14 h-14 bg-cream border-2 border-forest rounded-full flex items-center justify-center shrink-0">
            <iconify-icon icon="ph:star-fill" class="text-3xl text-terracotta"></iconify-icon>
          </div>
          <div>
            <p className="text-forest font-bold text-xs uppercase tracking-widest">Total Points</p>
            <h3 className="font-serif text-4xl font-black text-forest">{leafPoints}</h3>
          </div>
        </div>
        
        <div className="flex-1 bg-cardBg border-4 border-forest shadow-brutal p-6 organic-card-alt flex items-center gap-4 hover:-translate-y-1 hover:shadow-brutal-hover smooth-transition">
          <div className="w-14 h-14 bg-leaf border-2 border-forest rounded-full flex items-center justify-center shrink-0">
            <iconify-icon icon="ph:trend-up-bold" class="text-3xl text-cream"></iconify-icon>
          </div>
          <div>
            <p className="text-forest font-bold text-xs uppercase tracking-widest">Current Level</p>
            <h3 className="font-serif text-4xl font-black text-forest">Lvl {level}</h3>
          </div>
        </div>
      </div>
      
      <h3 className="font-serif text-2xl font-bold text-forest mb-4">Your Badges</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {badges.map((badge, idx) => (
          <div key={idx} className="bg-cream border-4 border-forest shadow-brutal-sm p-4 rounded-2xl flex items-center gap-3 hover:-translate-y-1 hover:shadow-brutal-hover smooth-transition">
            <iconify-icon icon="ph:medal-fill" class="text-2xl text-terracotta"></iconify-icon>
            <span className="font-bold text-forest">{badge}</span>
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <h3 className="font-serif text-2xl font-bold text-forest">Active Challenges</h3>
        <span className="bg-forest text-cream text-[10px] font-bold uppercase px-2 py-1 rounded border-2 border-forest">Coming Soon</span>
      </div>
      <div className="bg-white border-4 border-forest shadow-brutal p-6 rounded-[2rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-leaf/10 blob-shape -mr-10 -mt-10 group-hover:scale-[2] smooth-transition duration-700"></div>
        <div className="flex justify-between items-start mb-2 relative z-10">
          <h4 className="font-serif text-2xl font-bold text-forest">Meatless Week</h4>
          <span className="bg-terracotta text-cream text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border-2 border-forest rotate-3">+500 pts</span>
        </div>
        <p className="text-soil font-medium mb-6 relative z-10">Log 0 meat-based meals for 7 consecutive days.</p>
        
        <div className="w-full bg-cream border-2 border-forest h-4 rounded-full overflow-hidden relative z-10">
          <div className="bg-leaf h-full border-r-2 border-forest transition-all duration-1000" style={{ width: `${(meatlessDays / 7) * 100}%` }}></div>
        </div>
        <p className="text-right text-xs font-bold text-forest mt-2 uppercase tracking-widest relative z-10">{meatlessDays}/7 Days Complete</p>
      </div>
    </div>
  );
}
