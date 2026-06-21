import { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, doc, setDoc, increment, limit } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const EMISSION_FACTORS = {
  transport: {
    petrol_car: { label: 'Petrol Car', multiplier: 0.192, defaultUnit: 'km' },
    diesel_car: { label: 'Diesel Car', multiplier: 0.171, defaultUnit: 'km' },
    ev: { label: 'Electric Vehicle', multiplier: 0.053, defaultUnit: 'km' },
    bus: { label: 'Bus', multiplier: 0.105, defaultUnit: 'km' },
    metro: { label: 'Metro / Train', multiplier: 0.041, defaultUnit: 'km' },
    domestic_flight: { label: 'Domestic Flight', multiplier: 0.255, defaultUnit: 'km' },
    long_haul_flight: { label: 'Long-haul Flight', multiplier: 0.150, defaultUnit: 'km' },
    ride_share: { label: 'Ride-sharing', multiplier: 0.205, defaultUnit: 'km' },
  },
  food: {
    beef: { label: 'Beef / Red Meat', multiplier: 27.0, defaultUnit: 'kg' },
    pork: { label: 'Pork', multiplier: 12.1, defaultUnit: 'kg' },
    chicken: { label: 'Chicken / Poultry', multiplier: 6.9, defaultUnit: 'kg' },
    fish: { label: 'Fish / Seafood', multiplier: 6.1, defaultUnit: 'kg' },
    dairy: { label: 'Dairy / Cheese', multiplier: 3.0, defaultUnit: 'kg' },
    coffee: { label: 'Coffee', multiplier: 17.0, defaultUnit: 'kg' },
    vegetarian: { label: 'Vegetarian Meal', multiplier: 2.0, defaultUnit: 'items' },
    vegan: { label: 'Vegan Meal', multiplier: 1.5, defaultUnit: 'items' },
  },
  energy: {
    electricity: { label: 'Electricity', multiplier: 0.39, defaultUnit: 'kwh' },
    gas: { label: 'Natural Gas', multiplier: 0.2, defaultUnit: 'kwh' },
  },
  shopping: {
    clothes: { label: 'Clothing (Fast Fashion)', multiplier: 15.0, defaultUnit: 'items' },
    shoes: { label: 'Shoes', multiplier: 13.5, defaultUnit: 'items' },
    electronics: { label: 'Electronics', multiplier: 50.0, defaultUnit: 'items' },
    general: { label: 'General Goods', multiplier: 5.0, defaultUnit: 'items' },
  },
  digital: {
    streaming: { label: 'Video Streaming (Netflix, etc)', multiplier: 0.055, defaultUnit: 'hours' },
    video_call: { label: 'Video Call (Zoom, etc)', multiplier: 0.15, defaultUnit: 'hours' },
    cloud_storage: { label: 'Cloud Storage', multiplier: 0.02, defaultUnit: 'gb' },
  },
  waste: {
    landfill: { label: 'General Trash (Landfill)', multiplier: 0.5, defaultUnit: 'kg' },
    water: { label: 'Water Usage', multiplier: 0.001, defaultUnit: 'liters' },
  },
  positive: {
    bike: { label: 'Biked/Walked instead of driving', multiplier: -0.192, defaultUnit: 'km' },
    plant_tree: { label: 'Planted a Tree', multiplier: -20.0, defaultUnit: 'items' },
    compost: { label: 'Composted Food Waste', multiplier: -1.2, defaultUnit: 'kg' },
    recycle: { label: 'Recycled Materials', multiplier: -0.8, defaultUnit: 'kg' },
  }
};

const CATEGORIES = {
  transport: { label: 'Transport (Driving, Flying)' },
  energy: { label: 'Home Energy (Electricity, Gas)' },
  food: { label: 'Diet & Food' },
  shopping: { label: 'Shopping & Goods' },
  digital: { label: 'Digital & Tech' },
  waste: { label: 'Waste & Water' },
  positive: { label: 'Positive Actions (Offsets)' },
};

const QUICK_PRESETS = [
  { icon: '🚗', label: 'Car 10km', data: { cat: 'transport', sub: 'petrol_car', amount: '10', unit: 'km', notes: 'Short drive' } },
  { icon: '🍔', label: 'Beef Burger', data: { cat: 'food', sub: 'beef', amount: '0.2', unit: 'kg', notes: 'Burger' } },
  { icon: '🚲', label: 'Biked 5km', data: { cat: 'positive', sub: 'bike', amount: '5', unit: 'km', notes: 'Biked to work' } },
  { icon: '✈️', label: 'Flight', data: { cat: 'transport', sub: 'domestic_flight', amount: '500', unit: 'km', notes: 'Flight' } },
];

export default function Calculator() {
  const [activityType, setActivityType] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');
  const getLocalDateString = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  const [date, setDate] = useState(getLocalDateString());
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successData, setSuccessData] = useState(null);
  
  const [history, setHistory] = useState([]);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState({});
  const WEEKLY_GOAL = 50; // Configurable later

  // Fetch history and calculate weekly total
  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Create a date for 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const q = query(
      collection(db, 'activities'), 
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activities = [];
      let currentWeeklyTotal = 0;
      let curCategoryTotals = {
        transport: 0,
        food: 0,
        energy: 0,
        shopping: 0,
        digital: 0,
        waste: 0,
        positive: 0,
        other: 0
      };
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const activity = { id: doc.id, ...data };
        activities.push(activity);
        
        // Calculate weekly total manually
        if (data.timestamp) {
          const actDate = typeof data.timestamp.toDate === 'function' ? data.timestamp.toDate() : new Date(data.timestamp);
          if (actDate > sevenDaysAgo) {
            currentWeeklyTotal += (data.amount || 0);
            if (data.activityType) {
              if (curCategoryTotals[data.activityType] !== undefined) {
                curCategoryTotals[data.activityType] += (data.amount || 0);
              } else {
                curCategoryTotals.other += (data.amount || 0);
              }
            }
          }
        }
      });
      
      setHistory(activities.slice(0, 20));
      setWeeklyTotal(currentWeeklyTotal);
      setCategoryTotals(curCategoryTotals);
    }, (err) => {
      console.error("Firestore history error:", err);
    });

    return () => unsubscribe();
  }, []);

  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setActivityType(cat);
    // Reset sub-category and set defaults
    const firstSub = Object.keys(EMISSION_FACTORS[cat] || {})[0];
    setSubCategory(firstSub);
    setUnit(EMISSION_FACTORS[cat]?.[firstSub]?.defaultUnit || '');
  };

  const handleSubCategoryChange = (e) => {
    const sub = e.target.value;
    setSubCategory(sub);
    setUnit(EMISSION_FACTORS[activityType]?.[sub]?.defaultUnit || '');
  };

  const applyPreset = (preset) => {
    setActivityType(preset.data.cat);
    setSubCategory(preset.data.sub);
    setAmount(preset.data.amount);
    setUnit(preset.data.unit);
    setNotes(preset.data.notes);
  };

  // Live Preview Calculation
  const estimatedCO2 = useMemo(() => {
    if (!activityType || !subCategory || !amount || isNaN(amount)) return 0;
    
    const factorData = EMISSION_FACTORS[activityType]?.[subCategory];
    if (!factorData) return 0;
    
    let multiplier = factorData.multiplier;
    
    // Quick unit conversion handling if they chose miles instead of km
    if (unit === 'miles' && factorData.defaultUnit === 'km') {
      multiplier = multiplier * 1.60934;
    }
    
    return Number(amount) * multiplier;
  }, [activityType, subCategory, amount, unit]);

  const generateEquivalentFact = (co2) => {
    if (co2 < 0) {
      const treeDays = Math.round(Math.abs(co2) / (20/365));
      return `That's equivalent to the carbon absorbed by a tree over ${treeDays} days!`;
    }
    const smartphoneCharges = Math.round(co2 / 0.00822);
    const petrolKm = (co2 / 0.192).toFixed(1);
    
    if (smartphoneCharges > 1000) {
      return `That's equivalent to driving ${petrolKm} km in a petrol car!`;
    }
    return `That's equivalent to charging your smartphone ${smartphoneCharges} times!`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setErrorMsg("You must be logged in to log activities.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const calculatedCO2 = estimatedCO2;
      if (calculatedCO2 === 0) throw new Error("Amount must not be 0");

      // We need to parse the selected date to a timestamp, default to now if today
      const [y, m, d] = date.split('-');
      const selectedDate = new Date(y, m - 1, d);
      const today = new Date();
      // If selected date is today, use current time, otherwise use noon of that date
      if (selectedDate.toDateString() === today.toDateString()) {
        selectedDate.setHours(today.getHours(), today.getMinutes(), today.getSeconds());
      } else {
        selectedDate.setHours(12, 0, 0);
      }

      // Firebase Web SDK hangs indefinitely if the Cloud Firestore API is disabled. 
      // We wrap the addDoc call in a timeout so the UI doesn't get stuck loading forever.
      const addDocPromise = addDoc(collection(db, 'activities'), {
        userId: auth.currentUser.uid,
        activityType: activityType,
        subCategory: subCategory,
        notes: notes.trim().slice(0, 200),
        rawAmount: Number(amount),
        rawUnit: unit,
        amount: parseFloat(calculatedCO2.toFixed(2)),
        unit: 'kg CO₂e',
        timestamp: selectedDate,
        source: 'manual_calculator'
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout: Could not connect to database. Your Cloud Firestore API might be disabled in the Firebase Console.")), 6000)
      );

      await Promise.race([addDocPromise, timeoutPromise]);
      
      setSuccessData({
        co2: parseFloat(calculatedCO2.toFixed(2)),
        equivalent: generateEquivalentFact(calculatedCO2)
      });
      
      // Award 10 points for manual logging (static imports, not dynamic)
      setDoc(doc(db, 'users', auth.currentUser.uid), {
        leafPoints: increment(10),
        displayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'EcoWarrior'
      }, { merge: true }).catch(e => console.error('Failed to award points:', e));
      
    } catch (error) {
      console.error("Error adding document: ", error);
      setErrorMsg("Error saving activity. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'activities', id));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const resetForm = () => {
    setActivityType('');
    setSubCategory('');
    setAmount('');
    setUnit('');
    setNotes('');
    setSuccessData(null);
  };

  // Build weekly chart data: last 7 days with CO2 totals
  const weeklyChartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({ date: d, label: d.toLocaleDateString(undefined, { weekday: 'short' }), co2: 0 });
    }
    history.forEach(item => {
      if (!item.timestamp) return;
      const ts = typeof item.timestamp.toDate === 'function' ? item.timestamp.toDate() : new Date(item.timestamp);
      const tsDay = new Date(ts);
      tsDay.setHours(0, 0, 0, 0);
      const bucket = days.find(d => d.date.getTime() === tsDay.getTime());
      if (bucket) bucket.co2 = parseFloat((bucket.co2 + (item.amount || 0)).toFixed(2));
    });
    return days.map(({ label, co2 }) => ({ label, co2 }));
  }, [history]);

  const weeklyProgress = Math.max(0, Math.min(100, (weeklyTotal / WEEKLY_GOAL) * 100));

  const insight = useMemo(() => {
    if (weeklyTotal <= 0) return "Great job tracking! You currently have a net zero or negative footprint for the week.";
    
    // Find highest category
    let maxCat = '';
    let maxVal = 0;
    Object.entries(categoryTotals).forEach(([cat, val]) => {
      if (val > maxVal && cat !== 'positive') {
        maxVal = val;
        maxCat = cat;
      }
    });

    if (maxVal === 0) return "Log more activities to generate smart insights!";

    const percent = Math.round((maxVal / Math.max(1, weeklyTotal)) * 100);
    
    if (maxCat === 'transport') return `🚗 Transport makes up ${percent}% of your footprint this week. Try biking or carpooling to reduce it!`;
    if (maxCat === 'food') return `🍔 Diet makes up ${percent}% of your footprint this week. Swapping beef for plant-based meals drastically lowers this.`;
    if (maxCat === 'energy') return `⚡ Energy makes up ${percent}% of your footprint. Remember to turn off lights and unplug unused electronics.`;
    if (maxCat === 'shopping') return `🛍️ Shopping makes up ${percent}% of your footprint. Buying second-hand instead of new saves massive amounts of carbon.`;
    if (maxCat === 'digital') return `💻 Digital footprint makes up ${percent}%. Streaming at a lower resolution can cut emissions in half!`;
    if (maxCat === 'waste') return `🗑️ Waste makes up ${percent}%. Recycling and composting can turn these emissions into negative offsets.`;
    
    return "Great job tracking your footprint! Keep it up.";
  }, [categoryTotals, weeklyTotal]);

  return (
    <div className="animate-fade-in-up relative">
      {/* Error Banner */}
      {errorMsg && (
        <div className="bg-terracotta/10 border-2 border-terracotta p-4 rounded-xl mb-6 flex items-start gap-3">
          <iconify-icon icon="ph:warning-circle-fill" class="text-terracotta text-2xl shrink-0 mt-0.5"></iconify-icon>
          <div className="text-terracotta font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Header & Goal Progress */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
        <div>
          <h2 className="font-serif text-4xl font-bold text-forest mb-2">Manual Calculator</h2>
          <p className="text-soil font-medium">Log your activities directly to your carbon ledger.</p>
        </div>
        
        <div className="bg-cream border-2 border-forest p-3 rounded-2xl shadow-brutal-sm w-full md:w-64 shrink-0">
          <div className="flex justify-between items-center mb-1">
            <span className="text-forest font-bold text-xs uppercase tracking-widest">Weekly Goal</span>
            <span className="text-forest font-black text-xs">{weeklyTotal.toFixed(1)} / {WEEKLY_GOAL}kg</span>
          </div>
          <div className="w-full bg-forest/10 h-2 rounded-full border border-forest overflow-hidden flex">
             {Object.entries(categoryTotals).filter(([cat, val]) => val > 0 && cat !== 'positive').map(([cat, val]) => {
                const percentage = Math.min(100, (val / Math.max(0.1, weeklyTotal)) * weeklyProgress);
                const color = cat === 'transport' ? 'bg-terracotta' : cat === 'food' ? 'bg-ochre' : cat === 'energy' ? 'bg-leaf' : cat === 'digital' ? 'bg-blue-400' : 'bg-forest';
                return <div key={cat} className={`h-full border-r border-forest/20 smooth-transition ${color}`} style={{ width: `${percentage}%` }}></div>
             })}
          </div>
        </div>
      </div>

      {/* Smart Insight */}
      <div className="mb-8 bg-leaf/10 border border-leaf rounded-xl p-3 flex gap-3 items-center">
        <iconify-icon icon="ph:lightbulb-fill" class="text-leaf text-xl shrink-0"></iconify-icon>
        <div className="text-forest text-sm font-medium">{insight}</div>
      </div>

      {successData ? (
        <div className="bg-leaf/10 border-4 border-forest shadow-brutal p-8 organic-card text-center flex flex-col items-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 border-forest shadow-brutal-sm mb-6 animate-bounce-spring ${successData.co2 < 0 ? 'bg-leaf' : 'bg-terracotta'}`}>
             <iconify-icon icon={successData.co2 < 0 ? "ph:tree-fill" : "ph:check-fat-fill"} class="text-5xl text-cream"></iconify-icon>
          </div>
          <h3 className={`font-serif text-4xl font-bold mb-2 ${successData.co2 < 0 ? 'text-leaf' : 'text-forest'}`}>
            {successData.co2 > 0 ? '+' : ''}{successData.co2} kg CO₂e
          </h3>
          <p className="text-soil font-bold text-lg mb-6 max-w-sm mx-auto">
            {successData.equivalent}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button onClick={resetForm} className="bg-forest border-4 border-forest text-cream font-bold text-lg py-3 px-8 rounded-full hover:bg-leaf hover:-translate-y-1 hover:shadow-brutal-hover active:translate-y-0 smooth-transition shadow-brutal-sm uppercase tracking-widest">
              Log Another
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-cream border-4 border-forest shadow-brutal p-6 md:p-8 organic-card relative overflow-hidden">
          <div className="absolute inset-0 chat-texture-bg opacity-30 pointer-events-none"></div>
          
          {/* Quick Presets */}
          <div className="relative z-10 flex flex-wrap gap-2 mb-8">
            {QUICK_PRESETS.map((preset, idx) => (
              <button 
                key={idx} 
                onClick={() => applyPreset(preset)}
                className="bg-white border-2 border-forest text-forest font-bold text-xs uppercase tracking-widest py-2 px-4 rounded-full hover:bg-leaf hover:text-cream smooth-transition shadow-sm"
              >
                {preset.icon} {preset.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-forest font-bold mb-2 uppercase tracking-wider text-sm">Category</label>
                <select 
                  id="category"
                  className="w-full bg-white border-4 border-forest rounded-xl p-4 text-forest font-medium focus:outline-none focus:ring-0 shadow-inner"
                  value={activityType} 
                  onChange={handleCategoryChange}
                  required
                >
                  <option value="" disabled>Select category</option>
                  {Object.entries(CATEGORIES).map(([key, data]) => (
                    <option key={key} value={key}>{data.label}</option>
                  ))}
                </select>
              </div>

              {activityType && (
                <div className="animate-fade-in-up">
                  <label htmlFor="subCategory" className="block text-forest font-bold mb-2 uppercase tracking-wider text-sm">Sub-category</label>
                  <select 
                    id="subCategory"
                    className="w-full bg-white border-4 border-forest rounded-xl p-4 text-forest font-medium focus:outline-none focus:ring-0 shadow-inner"
                    value={subCategory} 
                    onChange={handleSubCategoryChange}
                    required
                  >
                    <option value="" disabled>Select type</option>
                    {Object.entries(EMISSION_FACTORS[activityType] || {}).map(([key, data]) => (
                      <option key={key} value={key}>{data.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 w-full md:w-1/3">
                <label htmlFor="amount" className="block text-forest font-bold mb-2 uppercase tracking-wider text-sm">Amount</label>
                <input 
                  id="amount"
                  type="number" 
                  step="0.01"
                  className="w-full bg-white border-4 border-forest rounded-xl p-4 text-forest font-medium focus:outline-none shadow-inner"
                  placeholder="e.g. 15"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex-1 w-full md:w-1/3">
                <label htmlFor="unit" className="block text-forest font-bold mb-2 uppercase tracking-wider text-sm">Unit</label>
                <select 
                  id="unit"
                  className="w-full bg-white border-4 border-forest rounded-xl p-4 text-forest font-medium focus:outline-none shadow-inner"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  required
                >
                  <option value="" disabled>Unit</option>
                  <option value="km">km</option>
                  <option value="miles">miles</option>
                  <option value="kwh">kWh</option>
                  <option value="kg">kg</option>
                  <option value="items">items</option>
                  <option value="hours">hours</option>
                  <option value="gb">GB</option>
                  <option value="liters">liters</option>
                </select>
              </div>

              <div className="flex-1 w-full md:w-1/3">
                <label htmlFor="date" className="block text-forest font-bold mb-2 uppercase tracking-wider text-sm">Date</label>
                <input 
                  id="date"
                  type="date" 
                  className="w-full bg-white border-4 border-forest rounded-xl p-4 text-forest font-medium focus:outline-none shadow-inner"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-forest font-bold mb-2 uppercase tracking-wider text-sm">Notes (Optional)</label>
              <input 
                id="notes"
                type="text" 
                className="w-full bg-white border-4 border-forest rounded-xl p-4 text-forest font-medium focus:outline-none shadow-inner"
                placeholder="e.g. Morning commute to the office"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                maxLength={200}
                autoComplete="off"
              />
            </div>
            
            {/* Live Preview — aria-live so screen readers announce estimate changes */}
            <div
              aria-live="polite"
              aria-atomic="true"
              className={`text-center py-4 rounded-xl border-2 border-dashed ${estimatedCO2 !== 0 ? (estimatedCO2 < 0 ? 'bg-leaf/10 border-leaf' : 'bg-forest/5 border-forest') : 'bg-transparent border-forest/30'} smooth-transition`}
            >
              {estimatedCO2 !== 0 ? (
                <div>
                  <div className={`font-bold text-xs uppercase tracking-widest mb-1 ${estimatedCO2 < 0 ? 'text-leaf' : 'text-soil'}`}>
                     {estimatedCO2 < 0 ? 'Carbon Offset (Negative)' : 'Estimated Footprint'}
                  </div>
                  <div className={`font-serif text-3xl font-bold ${estimatedCO2 < 0 ? 'text-leaf' : 'text-forest'}`}>
                    ≈ {estimatedCO2.toFixed(2)} kg CO₂e
                  </div>
                </div>
              ) : (
                <div className="text-soil font-medium">Fill out the details above to see estimate</div>
              )}
            </div>

            <button type="submit" disabled={loading} className="w-full bg-leaf border-4 border-forest text-cream font-bold text-xl py-4 rounded-2xl hover:bg-forest hover:-translate-y-1 hover:shadow-brutal-hover active:translate-y-0 smooth-transition shadow-brutal-sm uppercase tracking-widest mt-4 flex items-center justify-center gap-3">
              {loading ? <iconify-icon icon="ph:spinner-gap-bold" class="animate-spin"></iconify-icon> : <iconify-icon icon="ph:plus-bold"></iconify-icon>}
              Log Activity
            </button>
          </form>
        </div>
      )}

      {/* Weekly CO₂ Chart */}
      {weeklyChartData.some(d => d.co2 !== 0) && (
        <div className="mt-12">
          <h3 className="font-serif text-2xl font-bold text-forest mb-6 flex items-center gap-2">
            <iconify-icon icon="ph:chart-bar-bold"></iconify-icon> 7-Day CO₂ Trend
          </h3>
          <div className="bg-cream border-4 border-forest shadow-brutal p-6 rounded-[2rem]">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="label" tick={{ fontFamily: 'inherit', fontWeight: 700, fontSize: 11, fill: '#3d5a3e' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: 'inherit', fontWeight: 600, fontSize: 10, fill: '#7a6652' }} axisLine={false} tickLine={false} unit=" kg" />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '2px solid #3d5a3e', fontFamily: 'inherit', fontSize: 12, fontWeight: 700 }}
                  formatter={(value) => [`${value} kg CO₂e`, 'Emissions']}
                />
                <Bar dataKey="co2" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {weeklyChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.co2 < 0 ? '#6a994e' : entry.co2 > WEEKLY_GOAL / 7 ? '#bc4749' : '#a7c957'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs font-bold text-soil text-center mt-2 uppercase tracking-widest">Green = under daily target · Red = over daily target</p>
          </div>
        </div>
      )}

      {/* History Ledger */}
      <div className="mt-12">
        <h3 className="font-serif text-2xl font-bold text-forest mb-6 flex items-center gap-2">
          <iconify-icon icon="ph:list-dashes-bold"></iconify-icon> Activity Ledger
        </h3>
        
        {history.length > 0 ? (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {history.map(item => (
              <div key={item.id} className="bg-white border-4 border-forest shadow-brutal-sm p-4 rounded-2xl flex items-center justify-between group hover:shadow-brutal-sm-hover smooth-transition">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full border-2 border-forest flex items-center justify-center shrink-0 ${item.amount < 0 ? 'bg-leaf/20' : 'bg-cream'}`}>
                    {item.source === 'ai_agent' ? (
                      <iconify-icon icon="ph:robot-fill" class="text-2xl text-leaf"></iconify-icon>
                    ) : item.amount < 0 ? (
                      <iconify-icon icon="ph:tree-fill" class="text-2xl text-leaf"></iconify-icon>
                    ) : item.activityType === 'transport' ? (
                      <iconify-icon icon="ph:car-profile-fill" class="text-2xl text-terracotta"></iconify-icon>
                    ) : item.activityType === 'food' ? (
                      <iconify-icon icon="ph:hamburger-fill" class="text-2xl text-ochre"></iconify-icon>
                    ) : item.activityType === 'energy' ? (
                      <iconify-icon icon="ph:lightning-fill" class="text-2xl text-leaf"></iconify-icon>
                    ) : (
                      <iconify-icon icon="ph:shopping-bag-fill" class="text-2xl text-forest"></iconify-icon>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-forest text-lg leading-tight">
                      {item.notes || (item.subCategory ? EMISSION_FACTORS[item.activityType]?.[item.subCategory]?.label : item.activityType) || 'Activity'}
                    </h4>
                    <p className="text-soil text-xs font-bold uppercase tracking-widest">
                      {item.timestamp ? (typeof item.timestamp.toDate === 'function' ? item.timestamp.toDate() : new Date(item.timestamp)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Unknown Date'} 
                      {item.rawAmount && ` • ${item.rawAmount} ${item.rawUnit}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`font-serif font-bold text-xl shrink-0 ${item.amount < 0 ? 'text-leaf' : 'text-forest'}`}>
                    {item.amount > 0 ? '+' : ''}{item.amount.toFixed(1)} kg
                  </div>
                  <button aria-label="Delete activity" onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-full border-2 border-transparent text-soil hover:bg-terracotta hover:border-forest hover:text-cream flex items-center justify-center smooth-transition opacity-50 group-hover:opacity-100">
                    <iconify-icon icon="ph:trash-bold"></iconify-icon>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white border-2 border-dashed border-forest/30 rounded-2xl">
            <p className="text-soil font-medium">Your ledger is empty. Log your first activity above!</p>
          </div>
        )}
      </div>

    </div>
  );
}
