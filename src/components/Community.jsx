import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';

export default function Community() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Query top 50 users by leafPoints
    const q = query(
      collection(db, 'users'),
      orderBy('leafPoints', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const topUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeaders(topUsers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Header */}
      <div className="bg-leaf border-4 border-forest shadow-brutal p-6 organic-card text-cream relative overflow-hidden">
        <div className="absolute -top-10 -right-10 opacity-20">
          <iconify-icon icon="ph:users-three-fill" class="text-9xl"></iconify-icon>
        </div>
        <div className="relative z-10">
          <h2 className="font-serif text-3xl font-bold mb-1">Global Community</h2>
          <p className="text-sm font-medium">See how you stack up against other Eco-Warriors.</p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-cardBg border-4 border-forest shadow-brutal p-6 rounded-[2rem]">
        <h3 className="font-serif text-2xl font-bold text-forest mb-6 flex items-center gap-2">
          <iconify-icon icon="ph:trophy-fill" class="text-terracotta"></iconify-icon> Top Planters
        </h3>

        {loading ? (
          <div className="p-8 text-center font-bold text-forest animate-pulse">Loading Leaderboard...</div>
        ) : (
          <div className="space-y-3">
            {leaders.length > 0 ? leaders.map((user, index) => {
              const isCurrentUser = auth.currentUser && user.id === auth.currentUser.uid;
              
              let rankStyle = "bg-cream text-forest border-forest";
              let rankIcon = null;
              if (index === 0) {
                rankStyle = "bg-ochre text-forest border-forest shadow-brutal-sm scale-[1.02] -translate-y-1 z-10 relative";
                rankIcon = <iconify-icon icon="ph:crown-fill" class="text-terracotta text-xl animate-bounce-spring"></iconify-icon>;
              } else if (index === 1) {
                rankStyle = "bg-gray-200 text-forest border-forest";
              } else if (index === 2) {
                rankStyle = "bg-orange-200 text-forest border-forest";
              }

              return (
                <div key={user.id} className={`border-2 p-3 rounded-xl flex items-center justify-between transition-all ${rankStyle} ${isCurrentUser ? 'ring-4 ring-leaf ring-offset-2 ring-offset-cardBg' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-8 font-black text-lg text-center opacity-70">
                      #{index + 1}
                    </div>
                    <div className="w-10 h-10 bg-white border-2 border-forest rounded-full flex items-center justify-center font-bold text-forest shrink-0">
                      {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : '🌿'}
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {user.displayName || 'EcoWarrior'} {isCurrentUser && <span className="text-[10px] bg-leaf text-cream px-2 py-0.5 rounded-full uppercase tracking-widest">You</span>}
                      </div>
                      <div className="text-xs font-medium opacity-80">Lvl {Math.floor((user.leafPoints || 0) / 1000) + 1}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-right">
                    {rankIcon}
                    <div>
                      <div className="font-black text-lg leading-none">{user.leafPoints || 0}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Points</div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-6 text-soil font-medium">
                No users found. Be the first to earn points!
              </div>
            )}
          </div>
        )}
      </div>
      
    </div>
  );
}
