import React, { useState, useEffect, Suspense, lazy } from 'react';
const AIAgentPanel = lazy(() => import('./components/AIAgentPanel'));
const ContentPanel = lazy(() => import('./components/ContentPanel'));
import AuthModal from './components/AuthModal';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db } from './firebase';
import { doc, setDoc, increment } from 'firebase/firestore';
import { playBloop } from './audio';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [oledMode, setOledMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await setDoc(doc(db, 'users', currentUser.uid), {
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'EcoWarrior',
            leafPoints: increment(0)
          }, { merge: true });
        } catch (error) {
          console.error("Error initializing user document:", error);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    playBloop();
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Sign out failed", e);
    }
  };

  const toggleOledMode = () => {
    playBloop();
    const newMode = !oledMode;
    setOledMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('oled-mode');
    } else {
      document.documentElement.classList.remove('oled-mode');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-20 h-20 bg-leaf rounded-full flex items-center justify-center shadow-brutal-sm border-4 border-forest animate-bounce-spring">
          <iconify-icon icon="ph:plant-fill" class="text-4xl text-cream"></iconify-icon>
        </div>
      </div>
    );
  }

  return (
    <>
      {!user && <AuthModal onAuthSuccess={setUser} />}
      
      {/* Decorative Background Elements */}
      <div className="absolute -top-20 -left-20 -z-10 animate-spin-slow">
        <iconify-icon icon="ph:leaf-duotone" class="text-[40rem] text-leaf opacity-5"></iconify-icon>
      </div>
      <div className="absolute -bottom-40 right-1/4 -z-10 animate-spin-slow-reverse">
        <iconify-icon icon="ph:tree-duotone" class="text-[30rem] text-forest opacity-5"></iconify-icon>
      </div>

      <div className="w-full max-w-[1440px] p-4 md:p-8 relative z-10 mx-auto flex-1 flex flex-col">
        
        {/* Header / Logo */}
        <header className="flex justify-between items-center mb-8 lg:mb-12 animate-on-load animate-fade-in-up delay-100">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-leaf rounded-full flex items-center justify-center shadow-brutal-sm border-2 border-forest transform -rotate-6 hover:rotate-12 smooth-transition hover:shadow-brutal-sm-hover hover:scale-110">
              <iconify-icon icon="ph:plant-fill" class="text-3xl text-cream"></iconify-icon>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-forest">
              Sprout.
            </h1>
          </div>
          
          {user && (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-bold text-soil uppercase tracking-widest">Logged in as</span>
                <span className="font-serif text-lg font-bold text-forest">{user.email}</span>
              </div>

              {/* OLED Toggle Button */}
              <button 
                onClick={toggleOledMode}
                className={`border-2 rounded-full p-2 smooth-transition shadow-brutal-sm hover:-translate-y-1 active:translate-y-0 ${oledMode ? 'bg-[#39FF14] text-black border-[#39FF14]' : 'bg-cream text-forest border-forest hover:bg-ochre'}`}
                title="Toggle OLED Power Saver Mode"
              >
                <iconify-icon icon={oledMode ? "ph:moon-stars-fill" : "ph:sun-dim-fill"} class="text-xl"></iconify-icon>
              </button>

              <button 
                onClick={handleSignOut}
                aria-label="Sign Out"
                className="bg-cream border-2 border-forest rounded-full p-2 hover:bg-terracotta hover:text-cream hover:border-terracotta smooth-transition shadow-brutal-sm hover:-translate-y-1 active:translate-y-0"
                title="Sign Out"
              >
                <iconify-icon icon="ph:sign-out-bold" class="text-xl"></iconify-icon>
              </button>
            </div>
          )}
        </header>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 flex-1 relative" style={{ opacity: user ? 1 : 0.3, pointerEvents: user ? 'auto' : 'none' }}>
          
          {/* Left/Main Column */}
          <div className="lg:col-span-7 flex flex-col gap-10">
            <Suspense fallback={<div className="text-forest p-4 text-center">Loading content...</div>}>
              <ContentPanel />
            </Suspense>
          </div>

          {/* Right Column: AI Agent */}
          <div className="lg:col-span-5 h-[850px] lg:mt-0 mt-12 animate-on-load animate-fade-in-up delay-400">
            <Suspense fallback={<div className="text-forest p-4 text-center">Loading Sprout Agent...</div>}>
              <AIAgentPanel />
            </Suspense>
          </div>

        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t-2 border-forest/10 flex flex-col md:flex-row justify-between items-center gap-6 animate-on-load animate-fade-in-up delay-800 pb-10">
          <div className="flex items-center gap-2 text-forest hover:scale-105 smooth-transition cursor-default">
            <iconify-icon icon="ph:plant-fill" class="text-2xl animate-pulse"></iconify-icon>
            <span className="font-serif font-bold text-xl">Sprout.</span>
          </div>
          <div className="text-center md:text-left">
            <p className="font-serif font-bold text-forest text-sm hover:text-leaf smooth-transition cursor-default">
              Rooting for a sustainable future, one habit at a time.
            </p>
            <p className="text-xs font-medium text-soil mt-1">
              Your growth stays private and local.
            </p>
          </div>
          <div className="flex gap-4">
            <button type="button" aria-label="Twitter" className="bg-cream border-2 border-forest rounded-full p-2.5 hover:bg-forest hover:text-cream hover:-translate-y-1 smooth-transition shadow-brutal-sm cursor-not-allowed opacity-50" title="Coming soon">
              <iconify-icon icon="ph:twitter-logo-fill" class="text-xl block"></iconify-icon>
            </button>
            <button type="button" aria-label="Instagram" className="bg-cream border-2 border-forest rounded-full p-2.5 hover:bg-forest hover:text-cream hover:-translate-y-1 smooth-transition shadow-brutal-sm cursor-not-allowed opacity-50" title="Coming soon">
              <iconify-icon icon="ph:instagram-logo-fill" class="text-xl block"></iconify-icon>
            </button>
            <button type="button" aria-label="LinkedIn" className="bg-cream border-2 border-forest rounded-full p-2.5 hover:bg-forest hover:text-cream hover:-translate-y-1 smooth-transition shadow-brutal-sm cursor-not-allowed opacity-50" title="Coming soon">
              <iconify-icon icon="ph:linkedin-logo-fill" class="text-xl block"></iconify-icon>
            </button>
          </div>
        </footer>

      </div>
    </>
  );
}

export default App;
