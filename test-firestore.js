import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBfIBSuG-1jgdJum-7zVIH46lmTPlbPvEk",
  authDomain: "studio-2807730805-b1b99.firebaseapp.com",
  projectId: "studio-2807730805-b1b99",
  storageBucket: "studio-2807730805-b1b99.firebasestorage.app",
  messagingSenderId: "237606685680",
  appId: "1:237606685680:web:cb49075456996705e6eb35"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log("1. Testing Write Connection (addDoc)...");
  let writeSuccess = false;
  try {
    const res = await addDoc(collection(db, 'activities'), {
      userId: 'test_user_123',
      activityType: 'transport',
      subCategory: 'ev',
      notes: 'Test from script',
      rawAmount: 10,
      rawUnit: 'km',
      amount: 0.53,
      unit: 'kg CO₂e',
      timestamp: serverTimestamp(),
      source: 'manual_calculator'
    });
    console.log("✅ WRITE SUCCESS: Document added with ID:", res.id);
    writeSuccess = true;
  } catch (err) {
    console.error("❌ WRITE ERROR:", err.message);
  }

  console.log("\n2. Testing Read Query and Composite Indexes (getDocs)...");
  try {
    const q = query(
      collection(db, 'activities'), 
      where('userId', '==', 'test_user_123'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    
    const snapshot = await getDocs(q);
    console.log(`✅ READ SUCCESS: Fetched ${snapshot.size} documents.`);
    snapshot.forEach(doc => {
      console.log(`   -> Activity: ${doc.data().amount} kg CO2e (${doc.data().notes})`);
    });
  } catch (err) {
    console.error("❌ READ/INDEX ERROR:", err.message);
  }
  
  process.exit(0);
}

run();
