import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase';
import { doc, onSnapshot, collection, query, where, limit } from 'firebase/firestore';

const UserContext = createContext(null);

/**
 * Compute consecutive-day logging streak from a flat activities array.
 */
function computeStreak(activities) {
  const daysArray = [];
  activities.forEach(data => {
    if (data.timestamp) {
      const d = typeof data.timestamp.toDate === 'function'
        ? data.timestamp.toDate()
        : new Date(data.timestamp);
      if (d) {
        const dStr = d.toDateString();
        if (!daysArray.includes(dStr)) daysArray.push(dStr);
      }
    }
  });

  daysArray.sort((a, b) => new Date(b) - new Date(a));
  let currentStreak = 0;
  const checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  if (daysArray.length > 0) {
    const firstDate = new Date(daysArray[0]);
    firstDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((checkDate - firstDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 0 || diffDays === 1) {
      let expectedDate = new Date(firstDate);
      for (const dateStr of daysArray) {
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        if (d.getTime() === expectedDate.getTime()) {
          currentStreak++;
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }
  return currentStreak;
}

/**
 * Compute category totals (transport, food, etc.) from activities.
 */
function computeCategorySummary(activities) {
  const summary = {};
  activities.forEach(data => {
    if (data.activityType && data.amount) {
      summary[data.activityType] = (summary[data.activityType] || 0) + data.amount;
    }
  });
  return summary;
}

/**
 * Compute earned badge list from activities.
 */
function computeBadges(activities) {
  const badges = [];
  if (activities.length > 0) badges.push('First Step');
  if (activities.length >= 10) badges.push('Eco Warrior');
  if (activities.some(a => a.subCategory === 'recycle' || a.activityType === 'waste')) badges.push('Recycler');
  if (activities.some(a => a.activityType === 'positive')) badges.push('Planet Saver');
  if (badges.length === 0) badges.push('Getting Started');
  return badges;
}

/**
 * Compute meatless days (max 7) from activities.
 */
function computeMeatlessDays(activities) {
  const meatlessDates = new Set();
  activities.forEach(a => {
    if (a.activityType === 'food' && (a.subCategory === 'vegetarian' || a.subCategory === 'vegan')) {
      if (a.timestamp) {
        const d = typeof a.timestamp.toDate === 'function' ? a.timestamp.toDate() : new Date(a.timestamp);
        meatlessDates.add(d.toDateString());
      }
    }
  });
  return Math.min(meatlessDates.size, 7);
}

/**
 * Compute today's CO2 totals (excluding game activities).
 */
function computeTodayStats(activities) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let count = 0;
  let co2 = 0;
  activities.forEach(data => {
    if (data.source === 'eco_sorter_game') return;
    const ts = data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp ? new Date(data.timestamp) : null;
    if (ts && ts >= today) {
      count++;
      co2 += data.amount || 0;
    }
  });
  return { co2, count };
}

/**
 * UserProvider — single source of truth for user Firestore data.
 * Replaces the per-component onSnapshot listeners on users/{uid}
 * and activities, cutting Firestore reads by 3×.
 */
export function UserProvider({ children }) {
  const [leafPoints, setLeafPoints] = useState(0);
  const [rawActivities, setRawActivities] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      setIsLoaded(true);
      return;
    }

    // ── Single listener on users/{uid} ──────────────────────────────────
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const unsubUser = onSnapshot(userDocRef, (snap) => {
      if (snap.exists() && typeof snap.data().leafPoints === 'number') {
        setLeafPoints(snap.data().leafPoints);
      }
      setIsLoaded(true);
    });

    // ── Single listener on activities (limit 200) ───────────────────────
    const q = query(
      collection(db, 'activities'),
      where('userId', '==', auth.currentUser.uid),
      limit(200)
    );
    const unsubActivities = onSnapshot(q, (snap) => {
      setRawActivities(snap.docs.map(d => d.data()));
    });

    return () => {
      unsubUser();
      unsubActivities();
    };
  }, []);

  // All derived values are memoised so consumers only re-render when their
  // specific slice of data actually changes.
  const streak         = useMemo(() => computeStreak(rawActivities),         [rawActivities]);
  const categorySummary= useMemo(() => computeCategorySummary(rawActivities), [rawActivities]);
  const badges         = useMemo(() => computeBadges(rawActivities),          [rawActivities]);
  const meatlessDays   = useMemo(() => computeMeatlessDays(rawActivities),    [rawActivities]);
  const todayStats     = useMemo(() => computeTodayStats(rawActivities),      [rawActivities]);

  return (
    <UserContext.Provider value={{
      leafPoints,
      rawActivities,
      streak,
      categorySummary,
      badges,
      meatlessDays,
      todayStats,
      isLoaded,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside a <UserProvider>');
  return ctx;
}
