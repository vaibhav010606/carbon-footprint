import { useState } from 'react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function AuthModal({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (onAuthSuccess) onAuthSuccess(result.user);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      let result;
      if (isLogin) {
        result = await signInWithEmailAndPassword(auth, email, password);
      } else {
        result = await createUserWithEmailAndPassword(auth, email, password);
      }
      if (onAuthSuccess) onAuthSuccess(result.user);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-cream border-4 border-forest shadow-brutal p-8 organic-card max-w-md w-full relative">
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-leaf rounded-full flex items-center justify-center shadow-brutal-sm border-4 border-forest mx-auto mb-4 animate-bounce-spring">
            <iconify-icon icon="ph:plant-fill" class="text-4xl text-cream"></iconify-icon>
          </div>
          <h2 className="font-serif text-4xl font-bold text-forest">Welcome to Sprout</h2>
          <p className="text-soil font-medium mt-2">Log in to track your carbon footprint across devices.</p>
        </div>

        {error && (
          <div className="bg-terracotta/20 border-2 border-terracotta text-terracotta p-3 rounded-lg text-sm font-bold mb-4">
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border-4 border-forest shadow-brutal-sm rounded-2xl p-4 flex items-center justify-center gap-3 hover:-translate-y-1 hover:shadow-brutal-hover active:translate-y-0 smooth-transition mb-6"
        >
          <iconify-icon icon="flat-color-icons:google" class="text-2xl"></iconify-icon>
          <span className="font-bold text-forest uppercase tracking-widest text-sm">Continue with Google</span>
        </button>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t-2 border-forest/20"></div>
          <span className="flex-shrink-0 mx-4 text-soil font-bold text-xs uppercase tracking-widest">or</span>
          <div className="flex-grow border-t-2 border-forest/20"></div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label htmlFor="emailInput" className="block text-forest font-bold mb-1 uppercase tracking-wider text-xs">Email</label>
            <input 
              id="emailInput"
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border-4 border-forest rounded-xl p-3 text-forest font-medium focus:outline-none shadow-inner"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="passwordInput" className="block text-forest font-bold mb-1 uppercase tracking-wider text-xs">Password</label>
            <input 
              id="passwordInput"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border-4 border-forest rounded-xl p-3 text-forest font-medium focus:outline-none shadow-inner"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-leaf border-4 border-forest text-cream font-bold text-lg py-3 rounded-2xl hover:bg-forest hover:-translate-y-1 hover:shadow-brutal-hover active:translate-y-0 smooth-transition shadow-brutal-sm uppercase tracking-widest mt-2"
          >
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <p className="text-center mt-6 text-soil text-sm font-medium">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            className="text-forest font-bold underline hover:text-leaf smooth-transition"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>

      </div>
    </div>
  );
}
