import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import Calculator from './Calculator';
import GreenMap from './GreenMap';
import Challenges from './Challenges';
import LearningHub from './LearningHub';
import EcoGarden from './EcoGarden';
import Recommendations from './Recommendations';
import Game from './Game';
import Analytics from './Analytics';
import Community from './Community';
import { ArrowLeft } from 'lucide-react';
import { playBloop } from '../audio';

function renderTab(id) {
  switch (id) {
    case 'calculator':     return <Calculator />;
    case 'greenMap':       return <GreenMap />;
    case 'challenges':     return <Challenges />;
    case 'learningHub':    return <LearningHub />;
    case 'game':           return <Game />;
    case 'rewards':        return <EcoGarden />;
    case 'recommendations':return <Recommendations />;
    case 'analytics':      return <Analytics />;
    case 'community':      return <Community />;
    default: return null;
  }
}

export default function ContentPanel() {
  const [activeTab, setActiveTab] = useState(null);
  const [leafPoints, setLeafPoints] = useState(0);
  const [streak, setStreak] = useState(0);

  const getStageData = (points) => {
    if (points <= 200) return { level: 1, name: 'The Little Sprout', icon: 'ph:plant-bold', nextThreshold: 201, nextName: 'The Young Sapling' };
    if (points <= 600) return { level: 2, name: 'The Young Sapling', icon: 'ph:plant-fill', nextThreshold: 601, nextName: 'The Flourishing Tree' };
    if (points <= 1200) return { level: 3, name: 'The Flourishing Tree', icon: 'ph:potted-plant-duotone', nextThreshold: 1201, nextName: 'The Eternal Guardian' };
    return { level: 4, name: 'The Eternal Guardian', icon: 'ph:tree-fill', nextThreshold: null, nextName: 'Max Level' };
  };

  const stage = getStageData(leafPoints);
  let progressPercent = 100;
  let remaining = 0;
  if (stage.nextThreshold) {
    const minPoints = stage.level === 1 ? 0 : stage.level === 2 ? 201 : 601;
    const pointsInCurrentTier = leafPoints - minPoints;
    const totalPointsInTier = stage.nextThreshold - minPoints;
    progressPercent = (pointsInCurrentTier / totalPointsInTier) * 100;
    remaining = stage.nextThreshold - leafPoints;
  }

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Listen to activities for streak
    const q = query(collection(db, 'activities'), where('userId', '==', auth.currentUser.uid));
    const unsubscribeActivities = onSnapshot(q, (snapshot) => {
      let daysArray = [];
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data.timestamp) {
          const d = typeof data.timestamp.toDate === 'function' ? data.timestamp.toDate() : new Date(data.timestamp);
          if (d) {
            const dString = d.toDateString();
            if (!daysArray.includes(dString)) daysArray.push(dString);
          }
        }
      });
      
      daysArray.sort((a, b) => new Date(b) - new Date(a));
      let currentStreak = 0;
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);
      
      if (daysArray.length > 0) {
        const firstDate = new Date(daysArray[0]);
        firstDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((checkDate - firstDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 0 || diffDays === 1) {
          let expectedDate = new Date(firstDate);
          for (let dateStr of daysArray) {
            const d = new Date(dateStr);
            d.setHours(0,0,0,0);
            if (d.getTime() === expectedDate.getTime()) {
              currentStreak++;
              expectedDate.setDate(expectedDate.getDate() - 1);
            } else {
              break;
            }
          }
        }
      }

      setStreak(currentStreak);
    });

    // Listen to user document for leafPoints
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists() && typeof docSnap.data().leafPoints === 'number') {
        setLeafPoints(docSnap.data().leafPoints);
      }
    });

    return () => {
      unsubscribeActivities();
      unsubscribeUser();
    };
  }, []);

  const handleTabClick = (tabId) => {
    playBloop();
    setActiveTab(tabId);
  };

  if (activeTab) {
    return (
      <div className="space-y-6">
        <button 
          className="flex items-center gap-2 text-forest hover:text-leaf font-medium transition-colors" 
          onClick={() => handleTabClick(null)}
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <div className="bg-cardBg p-8 rounded-[2rem] border-4 border-forest shadow-brutal">
          {renderTab(activeTab)}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Top Section: Stats & Hero */}
      <div className="relative animate-on-load animate-fade-in-up delay-200">
        {/* Floating Stats Card */}
        <div className="absolute -top-6 lg:-top-10 right-0 lg:-right-8 bg-ochre border-4 border-forest shadow-brutal organic-card p-6 w-72 lg:w-80 rotate-2 z-20 hover:-translate-y-2 hover:rotate-0 hover:scale-[1.02] hover:shadow-brutal-hover smooth-transition">
          <div className="flex justify-between items-center mb-2">
            <span className="font-sans font-bold text-xs uppercase tracking-widest text-soil">Current Stage</span>
            <span className="bg-cream text-forest font-bold text-xs px-2 py-1 rounded-full border-2 border-forest">LVL {stage.level}</span>
          </div>
          <div className="flex items-end gap-3 mb-4">
            <div className="w-16 h-16 bg-cream border-2 border-forest rounded-full flex items-center justify-center shrink-0 hover:rotate-[360deg] transition-transform duration-700 ease-in-out" aria-hidden="true">
              <iconify-icon icon={stage.icon} class="text-4xl text-leaf"></iconify-icon>
            </div>
            <h2 className="font-serif text-3xl font-bold leading-none text-forest">
              {stage.name.split(' ').map((word, i) => (
                <React.Fragment key={i}>
                  {word}
                  {i < stage.name.split(' ').length - 1 && <br />}
                </React.Fragment>
              ))}
            </h2>
          </div>
          <div className="flex gap-4 mb-4 text-forest">
            <div>
              <div className="font-black text-xl">{leafPoints} pts</div>
              <div className="text-xs font-medium opacity-80">Leaf Points</div>
            </div>
            <div>
              <div className="font-black text-xl flex items-center gap-1 hover:scale-110 smooth-transition origin-left"><iconify-icon icon="ph:fire-fill" class="text-terracotta animate-pulse"></iconify-icon>{streak}</div>
              <div className="text-xs font-medium opacity-80">Active Days</div>
            </div>
          </div>
          <div className="w-full bg-soil/20 h-3 rounded-full border-2 border-forest overflow-hidden">
            <div 
              className="bg-forest h-full border-r-2 border-forest origin-left smooth-transition"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="text-right text-[10px] font-bold mt-1 uppercase text-soil">
            {stage.nextThreshold ? `${remaining} PTS TO ${stage.nextName.toUpperCase()}` : 'MAX LEVEL ACHIEVED'}
          </div>
        </div>

        {/* Hero Typography */}
        <div className="pt-12 lg:pt-20 pr-32">
          <h1 className="font-serif text-6xl md:text-[5.5rem] leading-[0.85] text-forest font-black tracking-tight mb-6 relative z-10 hover:text-leaf smooth-transition cursor-default">
            SPROUT
            <span className="block text-leafMuted italic font-medium hover:text-terracotta smooth-transition">CARBON</span>
            TRACKER.
          </h1>
          <p className="font-sans text-xl md:text-2xl font-medium text-soil max-w-md">
            Your living guide to a <span className="text-leaf font-bold italic border-b-4 border-leafMuted hover:bg-leafMuted hover:text-cream px-1 smooth-transition">greener</span> lifestyle.
          </p>
        </div>
      </div>

      {/* Feature Grid (Maximalist Asymmetry) */}
      <nav aria-label="Feature navigation" className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 relative mt-8">
        
        {/* Main Action Card */}
        <button aria-label="Open Carbon Calculator" onClick={() => handleTabClick('calculator')} className="animate-on-load animate-fade-in-up delay-300 col-span-2 md:col-span-2 bg-terracotta dark:bg-[#3b2820] border-4 border-forest dark:border-terracotta shadow-brutal dark:shadow-none p-8 organic-card-alt text-left group hover:scale-[1.02] hover:-translate-y-2 hover:shadow-brutal-hover active:scale-95 smooth-transition relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cream/20 blob-shape -mr-10 -mt-10 group-hover:scale-[2] group-hover:rotate-45 smooth-transition duration-700"></div>
          <div className="absolute top-4 right-6 bg-transparent border-2 border-cream dark:border-terracotta dark:bg-terracotta text-cream dark:text-[#3b2820] text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full rotate-3 group-hover:animate-bounce-spring">
            Start Here
          </div>
          <div className="w-16 h-16 bg-cream dark:bg-terracotta/20 border-4 border-forest dark:border-terracotta rounded-full flex items-center justify-center mb-6 relative z-10 group-hover:rotate-12 group-hover:scale-110 smooth-transition">
            <iconify-icon icon="ph:leaf-fill" class="text-3xl text-leaf dark:text-terracotta"></iconify-icon>
          </div>
          <h3 className="font-serif text-3xl font-bold text-cream dark:text-terracotta mb-2 relative z-10 leading-tight group-hover:text-cream/90 dark:group-hover:text-terracotta/90 smooth-transition">
            Log today's commute
          </h3>
          <p className="text-cream/90 dark:text-terracotta/90 font-medium text-sm md:text-base max-w-[80%] relative z-10">
            Calculate your daily footprint and feed your sprout.
          </p>
        </button>

        {/* Secondary Card */}
        <button onClick={() => handleTabClick('greenMap')} className="animate-on-load animate-fade-in-up delay-400 col-span-1 md:col-span-1 bg-cardBg dark:bg-cardBg border-4 border-forest dark:border dark:border-white/10 shadow-brutal dark:shadow-none p-6 rounded-[2rem] text-left group hover:bg-leafMuted hover:text-cream hover:scale-[1.02] hover:-translate-y-2 hover:shadow-brutal-hover active:scale-95 smooth-transition flex flex-col justify-between overflow-hidden relative">
          <div className="w-12 h-12 bg-forest dark:bg-white/5 text-cream dark:text-forest rounded-full flex items-center justify-center mb-4 group-hover:bg-cream group-hover:text-forest smooth-transition">
            <iconify-icon icon="ph:map-pin-line" class="text-2xl"></iconify-icon>
          </div>
          <div className="relative z-10">
            <h3 className="font-serif text-xl md:text-2xl font-bold mb-2 group-hover:translate-x-1 smooth-transition text-forest group-hover:text-cream">
              Green Map
            </h3>
            <p className="text-sm font-medium opacity-80 group-hover:translate-x-1 smooth-transition delay-75 text-forest group-hover:text-cream">
              Find eco-trails & spots.
            </p>
          </div>
        </button>

        {/* Small Grid Items */}
        <div className="col-span-2 md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <button onClick={() => handleTabClick('game')} className="col-span-2 md:col-span-2 animate-on-load animate-fade-in-up delay-500 bg-cardBg dark:bg-cardBg border-4 border-forest dark:border dark:border-white/10 p-5 rounded-[1.5rem] flex items-center gap-4 group hover:shadow-brutal-sm-hover hover:-translate-y-1 hover:scale-[1.02] active:scale-95 smooth-transition">
            <div className="w-20 h-20 bg-leafMuted dark:bg-[#2F6F50]/20 border-2 border-forest dark:border-transparent rounded-full flex shrink-0 items-center justify-center group-hover:rotate-45 smooth-transition">
              <iconify-icon icon="ph:footprints-fill" class="text-cream dark:text-[#2F6F50] text-5xl"></iconify-icon>
            </div>
            <div className="text-left">
              <h4 className="font-serif font-bold text-xl leading-tight group-hover:text-terracotta smooth-transition">Carbon Footprint Awareness Game</h4>
              <p className="text-sm font-medium text-soil">Track your footprints</p>
            </div>
          </button>

          <button onClick={() => handleTabClick('community')} className="animate-on-load animate-fade-in-up delay-600 bg-ochre dark:bg-[#40301a] border-4 border-forest dark:border dark:border-white/10 p-5 rounded-[1.5rem] flex items-center gap-4 group hover:shadow-brutal-sm-hover hover:-translate-y-1 hover:scale-[1.02] active:scale-95 smooth-transition relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
            <div className="w-14 h-14 bg-cream dark:bg-ochre/20 border-2 border-forest dark:border-transparent rounded-full flex shrink-0 items-center justify-center group-hover:scale-110 smooth-transition">
              <iconify-icon icon="ph:users-three-fill" class="text-terracotta dark:text-ochre text-3xl group-hover:animate-bounce-spring"></iconify-icon>
            </div>
            <div className="text-left relative z-10">
              <h4 className="font-serif font-bold text-lg leading-tight text-forest dark:text-ochre">Community</h4>
              <p className="text-xs font-medium text-forest/80 dark:text-ochre/80">View leaderboards</p>
            </div>
          </button>

          <button onClick={() => handleTabClick('analytics')} className="animate-on-load animate-fade-in-up delay-700 bg-leafMuted dark:bg-[#1a3022] border-4 border-forest dark:border dark:border-white/10 p-5 rounded-[1.5rem] flex items-center gap-4 group hover:bg-forest hover:text-cream hover:shadow-brutal-sm-hover hover:-translate-y-1 hover:scale-[1.02] active:scale-95 smooth-transition">
            <div className="w-14 h-14 bg-cream dark:bg-leaf/20 border-2 border-forest dark:border-transparent rounded-full flex shrink-0 items-center justify-center group-hover:bg-terracotta group-hover:text-cream smooth-transition text-forest dark:text-leaf">
              <iconify-icon icon="ph:chart-bar-fill" class="text-3xl"></iconify-icon>
            </div>
            <div className="text-left">
              <h4 className="font-serif font-bold text-lg leading-tight text-forest dark:text-leaf group-hover:text-cream smooth-transition">Analytics</h4>
              <p className="text-xs font-medium text-soil dark:text-leaf/80 group-hover:text-cream/80">Track your impact</p>
            </div>
          </button>

          <button onClick={() => handleTabClick('rewards')} className="animate-on-load animate-fade-in-up delay-700 bg-cardBg dark:bg-cardBg border-4 border-forest dark:border dark:border-white/10 p-5 rounded-[1.5rem] flex items-center gap-4 group hover:bg-leaf hover:text-cream hover:shadow-brutal-sm-hover hover:-translate-y-1 hover:scale-[1.02] active:scale-95 smooth-transition">
            <div className="w-14 h-14 bg-leaf border-2 border-forest dark:border-transparent rounded-full flex shrink-0 items-center justify-center group-hover:bg-cream group-hover:text-leaf smooth-transition">
              <iconify-icon icon="ph:tree-evergreen-fill" class="text-cream text-3xl"></iconify-icon>
            </div>
            <div className="text-left">
              <h4 className="font-serif font-bold text-lg leading-tight text-forest group-hover:text-cream smooth-transition">Eco Garden</h4>
              <p className="text-xs font-medium text-soil group-hover:text-cream/80">Grow your digital forest</p>
            </div>
          </button>
        </div>

        {/* Full Width Card */}
        <button onClick={() => handleTabClick('learningHub')} className="animate-on-load animate-fade-in-up delay-800 col-span-2 md:col-span-3 bg-cardBg dark:bg-cardBg border-4 border-forest dark:border dark:border-white/10 shadow-brutal-sm dark:shadow-none p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-6 group hover:border-terracotta hover:shadow-brutal-sm-hover hover:-translate-y-1 hover:scale-[1.01] active:scale-95 smooth-transition text-left">
          <div className="w-16 h-16 bg-leafMuted dark:bg-white/5 text-cream dark:text-forest border-2 border-forest dark:border-transparent rounded-[1rem] flex items-center justify-center shrink-0 -rotate-3 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-terracotta smooth-transition">
            <iconify-icon icon="ph:book-open-text-duotone" class="text-3xl"></iconify-icon>
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold mb-2 text-forest group-hover:text-terracotta smooth-transition">
              The Field Guide
            </h3>
            <p className="text-sm font-medium text-soil max-w-lg">
              Dive deep into the science of sustainability and learn how your daily actions shape the larger ecosystem.
            </p>
          </div>
        </button>

      </nav>
    </>
  );
}
