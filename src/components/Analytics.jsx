import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';

export default function Analytics({ currentMonthCO2 }) {
  const [activities, setActivities] = useState([]);
  const [budget, setBudget] = useState(500); // Default 500kg
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState(500);
  const [loading, setLoading] = useState(true);

  // Fetch activities & budget
  useEffect(() => {
    if (!auth.currentUser) return;

    // Listen to budget
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribeBudget = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().monthlyBudget) {
        setBudget(docSnap.data().monthlyBudget);
        // Only update newBudget if not currently editing to avoid overriding user input
        setNewBudget(prev => isEditingBudget ? prev : docSnap.data().monthlyBudget);
      }
    });

    // Listen to activities
    const q = query(
      collection(db, 'activities'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const acts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // safely convert timestamp to date string
        date: doc.data().timestamp?.toDate() 
          ? format(doc.data().timestamp.toDate(), 'MMM dd, yyyy HH:mm') 
          : 'Just now',
        shortDate: doc.data().timestamp?.toDate()
          ? format(doc.data().timestamp.toDate(), 'MMM dd')
          : 'Today'
      }));
      setActivities(acts);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (typeof unsubscribeBudget === 'function') unsubscribeBudget();
    };
  }, [isEditingBudget]);

  const saveBudget = async () => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, 'users', auth.currentUser.uid), {
      monthlyBudget: Number(newBudget)
    }, { merge: true });
    setBudget(Number(newBudget));
    setIsEditingBudget(false);
  };
  
  const budgetPercent = Math.min((currentMonthCO2 / budget) * 100, 100);

  const chartData = useMemo(() => {
    const map = activities.reduce((acc, act) => {
      if (!acc[act.shortDate]) {
        acc[act.shortDate] = { date: act.shortDate, total: 0 };
      }
      acc[act.shortDate].total += (act.amount || 0);
      return acc;
    }, {});
    return Object.values(map).reverse();
  }, [activities]);

  if (loading) {
    return <div className="p-8 text-center font-bold text-forest animate-pulse">Loading Analytics...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Header & Budget Tracker */}
      <div className="bg-terracotta border-4 border-forest shadow-brutal p-6 organic-card text-cream relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="font-serif text-3xl font-bold mb-1">Carbon Analytics</h2>
            <p className="text-sm font-medium opacity-90">Track your impact and manage your budget.</p>
          </div>
          <iconify-icon icon="ph:chart-bar-fill" class="text-4xl text-cream/80"></iconify-icon>
        </div>

        {/* Budget Progress */}
        <div className="bg-cardBg border-4 border-forest p-4 rounded-xl text-forest">
          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-soil">Monthly Usage</div>
              <div className="font-black text-2xl">{currentMonthCO2.toFixed(1)} <span className="text-sm">kg CO₂e</span></div>
            </div>
            <div className="text-right">
              {isEditingBudget ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-20 bg-cream border-2 border-forest rounded px-2 py-1 text-sm font-bold focus:outline-none"
                  />
                  <button onClick={saveBudget} className="bg-leaf text-cream border-2 border-forest px-2 py-1 text-xs font-bold rounded hover:bg-forest transition-colors">Save</button>
                </div>
              ) : (
                <div className="group cursor-pointer" onClick={() => setIsEditingBudget(true)}>
                  <div className="text-xs font-bold uppercase tracking-widest text-soil group-hover:text-terracotta transition-colors flex items-center gap-1 justify-end">
                    Budget <iconify-icon icon="ph:pencil-simple-fill"></iconify-icon>
                  </div>
                  <div className="font-black text-xl text-soil group-hover:text-forest transition-colors">{budget} <span className="text-sm">kg CO₂e</span></div>
                </div>
              )}
            </div>
          </div>

          <div className="w-full bg-soil/20 h-4 rounded-full border-2 border-forest overflow-hidden relative">
            <div 
              className={`h-full border-r-2 border-forest transition-all duration-1000 ${budgetPercent > 90 ? 'bg-terracotta' : 'bg-leaf'}`}
              style={{ width: `${budgetPercent}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs font-bold text-right opacity-80">
            {budgetPercent.toFixed(1)}% of monthly budget
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-cardBg border-4 border-forest shadow-brutal p-6 rounded-[2rem]">
        <h3 className="font-serif text-2xl font-bold text-forest mb-6 flex items-center gap-2">
          <iconify-icon icon="ph:trend-down-bold"></iconify-icon> Emissions Timeline
        </h3>
        
        {chartData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#2B3A2F', fontWeight: 'bold', fontSize: 12 }}
                  axisLine={{ stroke: '#2B3A2F', strokeWidth: 2 }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#2B3A2F', fontWeight: 'bold', fontSize: 12 }}
                  axisLine={{ stroke: '#2B3A2F', strokeWidth: 2 }}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#8C9A8E', opacity: 0.2 }}
                  contentStyle={{ backgroundColor: '#F4F1EB', border: '2px solid #2B3A2F', borderRadius: '8px', fontWeight: 'bold', color: '#2B3A2F' }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4A6B53' : '#CC5B43'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-soil font-medium border-2 border-dashed border-forest rounded-xl">
            No data yet. Start logging activities!
          </div>
        )}
      </div>

      {/* History Ledger */}
      <div className="bg-cream border-4 border-forest shadow-brutal p-6 organic-card-alt">
        <h3 className="font-serif text-2xl font-bold text-forest mb-4 flex items-center gap-2">
          <iconify-icon icon="ph:list-dashes-bold"></iconify-icon> Activity Ledger
        </h3>
        
        <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
          {activities.length > 0 ? activities.map(act => (
            <div key={act.id} className="bg-cardBg border-2 border-forest p-3 rounded-xl flex justify-between items-center hover:-translate-y-1 hover:shadow-brutal-sm transition-all group cursor-default">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-leafMuted border-2 border-forest rounded-full flex items-center justify-center text-forest group-hover:bg-leaf group-hover:text-cream transition-colors">
                  <iconify-icon icon={act.source === 'ai_agent' ? "ph:robot-fill" : "ph:leaf-fill"}></iconify-icon>
                </div>
                <div>
                  <div className="font-bold text-forest capitalize">{act.subCategory?.replace('_', ' ') || act.activityType}</div>
                  <div className="text-xs text-soil font-medium">{act.date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-terracotta text-lg">{act.amount}</div>
                <div className="text-[10px] font-bold uppercase text-forest">{act.unit || 'kg CO₂'}</div>
              </div>
            </div>
          )) : (
            <div className="text-center py-6 text-soil font-medium">
              Your ledger is empty.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
