import { useState, useEffect, useRef } from 'react';
import { Camera, FileText, X, MonitorUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ChatBubble from './ChatBubble';
import { playSuccess } from '../audio';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { createSproutGraph } from "../agent/graph";

const ALL_CHIPS = ['Took the train', 'Bought a coffee', 'Ate a salad', 'Used AC all day', 'Bicycled 5km', 'Ate a burger', 'Flew to Delhi', 'Drove 20km', 'Turned off lights'];

// Round-robin key selector — module-level so index persists across renders
let keyIndex = 0;
const getNextKey = () => {
  const keysStr = import.meta.env.VITE_GEMINI_API_KEYS;
  if (!keysStr) return null;
  const keys = keysStr.split(',').map(k => k.trim()).filter(Boolean);
  if (keys.length === 0) return null;
  const key = keys[keyIndex % keys.length];
  keyIndex = (keyIndex + 1) % keys.length; // prevent integer overflow on long sessions
  return key;
};

// Unique ID generator — avoids Date.now() collision on fast calls
let msgId = 100;
const nextId = () => ++msgId;

export default function AIAgentPanel() {
  const [messages, setMessages] = useState([
    { id: nextId(), type: 'agent', text: "Hello! I'm your growing Sprout. What activity shall we log today?" }
  ]);
  const [input, setInput] = useState('');
  const [chips, setChips] = useState(['Drove 20km', 'Ate a burger', 'Flew to Delhi']);
  const [scanModal, setScanModal] = useState(false);
  const [receiptModal, setReceiptModal] = useState(false);
  const [screenShareModal, setScreenShareModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState(null); // visible error for debugging
  const [todayStats, setTodayStats] = useState({ co2: 0, count: 0 });

  const sproutGraphRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Listen to today's activities for the stats card
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'activities'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      let count = 0;
      let co2 = 0;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Exclude game points from CO2 totals
        if (data.source === 'eco_sorter_game') return;
        
        const timestamp = data.timestamp?.toDate();
        if (timestamp && timestamp >= today) {
          count++;
          co2 += (data.amount || 0);
        }
      });
      
      setTodayStats({ co2, count });
    });
    return () => unsubscribe();
  }, []);

  const addAgentMessage = (text) => {
    setMessages(prev => [...prev, { id: nextId(), type: 'agent', text }]);
  };

  const sendMessage = async (text, base64Image = null, mimeType = 'image/jpeg') => {
    const trimmed = text.trim();
    if ((!trimmed && !base64Image) || isTyping) return;

    // Immediately show user message and clear input
    setMessages(prev => [...prev, { id: nextId(), type: 'user', text: trimmed, image: base64Image }]);
    setInput('');
    setIsTyping(true);

    // Rotate suggestion chips (exclude the just-used one)
    if (trimmed) {
      const newChips = ALL_CHIPS
        .filter(c => c !== trimmed)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      setChips(newChips);
    }

    try {
      const apiKey = getNextKey();
      if (!apiKey) {
        throw new Error('No Gemini API keys configured in .env.local');
      }

      setApiError(null);

      // Build the LangChain message history
      const langChainMessages = messages
        .filter(m => m.text || m.image) // allow empty text if image
        .map(m => {
          const content = [];
          if (m.text) content.push({ type: "text", text: m.text });
          if (m.image) {
            const match = m.image.match(/^data:([^;]+);base64,/);
            const extractedMime = match ? match[1] : 'image/jpeg';
            content.push({
              type: "image_url",
              image_url: `data:${extractedMime};base64,${m.image.split(',')[1]}`
            });
          }
          return m.type === 'user' ? new HumanMessage({ content }) : new AIMessage({ content });
        });

      // Add the current user message
      const currentUserContent = [];
      if (trimmed) currentUserContent.push({ type: "text", text: trimmed });
      if (base64Image) {
        currentUserContent.push({
          type: "image_url",
          image_url: `data:${mimeType};base64,${base64Image.split(',')[1]}`
        });
      }
      if (currentUserContent.length > 0) {
        langChainMessages.push(new HumanMessage({ content: currentUserContent }));
      }

      const systemPrompt = `You are Sprout, a warm and encouraging eco-friendly AI assistant that helps users track their carbon footprint.

If the user describes a real-world activity or provides an image (e.g., receipt, barcode, product, screen capture), analyze it to identify the activity/product and estimate a realistic CO2 equivalent in kg based on scientific averages.

You MUST respond with ONLY a raw valid JSON object — absolutely no markdown, no code fences, no extra text before or after the JSON:
{
  "isActivity": true,
  "activityType": "Short label e.g. 'Flight Mumbai-Delhi' or 'Cheese Pizza'",
  "amount": 5.2,
  "unit": "kg CO2e",
  "reply": "Friendly 1-2 sentence response mentioning the CO2 estimate and confirming it is saved."
}

If the user is NOT describing an activity and the image does not depict an activity/product (asking a general question, chatting), respond:
{
  "isActivity": false,
  "activityType": "",
  "amount": 0,
  "unit": "kg CO2e",
  "reply": "Your helpful conversational reply here."
}`;

      // Memoize the graph instance
      if (!sproutGraphRef.current) {
        sproutGraphRef.current = createSproutGraph(apiKey, systemPrompt);
      }
      const sproutGraph = sproutGraphRef.current;

      // Invoke the LangGraph workflow
      const graphResult = await sproutGraph.invoke({ messages: langChainMessages });

      // The result is the updated state. The last message is the AI's response.
      const aiResponse = graphResult.messages[graphResult.messages.length - 1];
      const rawText = aiResponse.content ?? '';

      // Extract JSON payload reliably by finding the bounds
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      const jsonStr = firstBrace !== -1 && lastBrace !== -1 
        ? rawText.substring(firstBrace, lastBrace + 1) 
        : rawText;

      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (err) {
        // Output detailed debugging info if JSON parse fails
        const debugInfo = `**JSON Parse Failed**\nError: ${err.message}\nRaw Length: ${rawText.length} chars\n\n**Raw Text:**\n\`\`\`json\n${rawText}\n\`\`\``;
        console.error("JSON Parse Error:", err, "Raw:", rawText);
        addAgentMessage(debugInfo);
        return;
      }

      // Save to Firebase only if it's a real logged activity
      if (parsed.isActivity && parsed.amount > 0 && auth.currentUser) {
        // Fire and forget: don't await this so the chat doesn't hang if Firestore is offline/unreachable
        addDoc(collection(db, 'activities'), {
          userId: auth.currentUser.uid,
          activityType: parsed.activityType || trimmed,
          amount: Number(parsed.amount),
          unit: parsed.unit || 'kg CO2e',
          timestamp: serverTimestamp(),
          source: 'ai_agent'
        }).then(() => {
          playSuccess(); // Trigger sound effect!
        }).catch(e => {
          console.error("Failed to save activity to Firebase:", e);
        });

        // Award 50 leaf points for logging an activity
        import('firebase/firestore').then(({ doc, setDoc, increment }) => {
          setDoc(doc(db, 'users', auth.currentUser.uid), {
            leafPoints: increment(50),
            // Ensure displayName exists for leaderboards
            displayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'EcoWarrior'
          }, { merge: true }).catch(e => console.error("Failed to award points:", e));
        });
      }

      addAgentMessage(parsed.reply || "Got it! I've noted that for you.");

    } catch (error) {
      console.error('[Sprout Agent Error]', error.message);
      // Show real error in UI so user can report it
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
      const displayMsg = isNetworkError
        ? 'Network error — check your internet connection. 🌐'
        : `Something went wrong: ${error.message}`;
      setApiError(displayMsg);
      addAgentMessage("I'm having a little trouble connecting right now. Please try again in a moment! 🌱");
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = (file, promptText) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      sendMessage(promptText, base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleScreenCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      
      // Wait a bit to ensure it has painted
      await new Promise(r => setTimeout(r, 500));
      
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1280;
      let width = video.videoWidth;
      let height = video.videoHeight;
      if (width > MAX_WIDTH) {
        height = Math.floor(height * (MAX_WIDTH / width));
        width = MAX_WIDTH;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      
      stream.getTracks().forEach(t => t.stop());
      setScreenShareModal(false);
      sendMessage('Please analyze this screen capture to identify any carbon footprint activities (e.g., flight booking, shopping) and estimate their CO2e.', base64, 'image/jpeg');
    } catch (err) {
      console.error('Screen capture failed:', err);
      setScreenShareModal(false);
    }
  };


  return (
    <div className="bg-cream rounded-[2.5rem] border-4 border-forest overflow-hidden shadow-brutal flex flex-col h-[calc(100vh-6rem)] min-h-[750px] relative group hover:shadow-brutal-hover smooth-transition">
      {/* Background texture for chat */}
      <div className="absolute inset-0 chat-texture-bg opacity-50 pointer-events-none"></div>

      {/* API Error Banner — shows real error reason for debugging */}
      {apiError && (
        <div className="relative z-20 bg-terracotta/90 border-b-2 border-forest px-4 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <iconify-icon icon="ph:warning-circle-fill" class="text-cream text-base shrink-0"></iconify-icon>
            <p className="text-cream text-[10px] font-bold truncate">{apiError}</p>
          </div>
          <button aria-label="Close error message" onClick={() => setApiError(null)} className="text-cream/70 hover:text-cream shrink-0 text-xs font-bold">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-forest dark:bg-[#1E221B] p-6 flex items-center justify-between relative z-10 border-b-4 border-forest dark:border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center border-2 border-forest relative">
            <iconify-icon icon="ph:plant-fill" class="text-leaf text-2xl animate-bounce-spring"></iconify-icon>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-forest flex items-center justify-center ${isTyping ? 'bg-ochre' : 'bg-leaf'}`}>
              <div className="w-1.5 h-1.5 bg-cream rounded-full animate-pulse"></div>
            </div>
          </div>
          <div>
            <h3 className="text-cream font-serif font-bold text-xl leading-none">Sprout Agent</h3>
            <p className="text-cream/80 text-[10px] font-bold uppercase tracking-wider mt-1">{isTyping ? 'Thinking...' : 'Awake & Growing'}</p>
          </div>
        </div>
        <button aria-label="Agent options" className="w-10 h-10 border-2 border-forest bg-leafMuted rounded-full flex items-center justify-center text-cream hover:bg-cream hover:text-forest smooth-transition shadow-brutal-sm">
          <iconify-icon icon="ph:dots-three-bold" class="text-xl"></iconify-icon>
        </button>
      </div>

      {/* Chat Thread */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 relative z-10 no-scrollbar">
        {messages.length < 3 && (
          <div className="bg-white dark:bg-[#1E221B] border-2 border-forest dark:border-white/10 rounded-2xl p-4 mb-6 shadow-brutal-sm mx-auto max-w-[85%] rotate-1 hover:rotate-0 smooth-transition">
            <h4 className="text-forest dark:text-leaf text-[10px] font-black uppercase tracking-widest mb-3 text-center">Today So Far</h4>
            <div className="flex justify-between items-center px-4">
              <div className="text-center">
                <span className="block text-2xl font-black text-leaf">{todayStats.co2.toFixed(1)}</span>
                <span className="text-[8px] text-soil uppercase font-bold tracking-wider">kg CO₂e</span>
              </div>
              <div className="w-0.5 h-6 bg-forest/20"></div>
              <div className="text-center">
                <span className="block text-2xl font-black text-leaf">{todayStats.count}</span>
                <span className="text-[8px] text-soil uppercase font-bold tracking-wider">Activities</span>
              </div>
              <div className="w-0.5 h-6 bg-forest/20"></div>
              <div className="text-center text-terracotta">
                <iconify-icon icon="ph:trend-down-bold" class="text-xl"></iconify-icon>
                <span className="block text-[8px] uppercase font-bold tracking-wider">LIVE</span>
              </div>
            </div>
          </div>
        )}

        {messages.map(msg => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}
        
        {isTyping && (
           <div className="flex gap-3 max-w-[85%] animate-fade-in-up">
              <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center shrink-0 border-2 border-forest shadow-sm mt-auto">
                <iconify-icon icon="ph:plant-fill" class="text-leaf text-sm"></iconify-icon>
              </div>
              <div className="bg-white border-2 border-forest text-forest dark:bg-[#23261F] dark:text-[#EDE8DA] dark:border-white/10 rounded-[1.5rem_1.5rem_1.5rem_0] p-4 shadow-brutal-sm dark:shadow-none flex items-center gap-1">
                <div className="w-2 h-2 bg-leaf rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-leaf rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-leaf rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-[#1E221B] border-t-4 border-forest dark:border-white/10 relative z-10">
        <div className="flex flex-wrap gap-2 mb-3">
          {chips.map(chip => (
            <button
              key={chip}
              onClick={() => sendMessage(chip)}
              disabled={isTyping}
              className="px-3 py-1.5 rounded-full border-2 border-forest bg-cream text-[10px] font-black uppercase tracking-wider text-forest hover:bg-forest hover:text-cream hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-cream disabled:hover:text-forest smooth-transition shadow-sm"
            >
              {chip}
            </button>
          ))}
        </div>
        
        <div className="flex flex-col bg-cream dark:bg-[#15170F] border-2 border-forest dark:border-white/10 rounded-2xl p-2 shadow-inner">
          <textarea 
            aria-label="Message Input"
            className="w-full bg-transparent border-none resize-none h-12 px-3 py-2 text-forest dark:text-[#EDE8DA] font-medium placeholder-forest/50 dark:placeholder-white/30 focus:outline-none text-sm"
            placeholder="Log an activity, ask a question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isTyping}
            maxLength={2000}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
          ></textarea>
          
          <div className="flex justify-between items-center mt-2 border-t-2 border-forest/10 pt-2">
            <div className="flex items-center gap-2 sm:gap-6 text-forest relative">
              <div className="group/icon relative flex flex-col items-center">
                <button disabled={isTyping} onClick={() => setReceiptModal(true)} className="w-16 h-16 flex items-center justify-center hover:bg-white rounded-xl hover:text-leafMuted smooth-transition border-2 border-transparent hover:border-forest shadow-sm hover:shadow-brutal-sm disabled:opacity-50" aria-label="Upload Image">
                  <iconify-icon icon="ph:image-square-fill" class="text-4xl"></iconify-icon>
                </button>
                <span className="text-[10px] font-black uppercase tracking-wider text-forest/70 mt-1">Receipt</span>
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-forest text-cream text-[12px] font-medium px-4 py-2 rounded-xl opacity-0 group-hover/icon:opacity-100 smooth-transition pointer-events-none whitespace-nowrap z-[100] shadow-brutal border-2 border-forest transform translate-y-2 group-hover/icon:translate-y-0 flex flex-col items-center">
                  Upload receipt for CO₂ estimate
                  <div className="absolute -bottom-1.5 w-3 h-3 bg-forest border-r-2 border-b-2 border-forest rotate-45"></div>
                </div>
              </div>
              <div className="group/icon relative flex flex-col items-center">
                <button disabled={isTyping} onClick={() => setScanModal(true)} className="w-16 h-16 flex items-center justify-center hover:bg-white rounded-xl hover:text-leafMuted smooth-transition border-2 border-transparent hover:border-forest shadow-sm hover:shadow-brutal-sm disabled:opacity-50" aria-label="Scan Barcode">
                  <iconify-icon icon="ph:barcode-fill" class="text-4xl"></iconify-icon>
                </button>
                <span className="text-[10px] font-black uppercase tracking-wider text-forest/70 mt-1">Barcode</span>
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-forest text-cream text-[12px] font-medium px-4 py-2 rounded-xl opacity-0 group-hover/icon:opacity-100 smooth-transition pointer-events-none whitespace-nowrap z-[100] shadow-brutal border-2 border-forest transform translate-y-2 group-hover/icon:translate-y-0 flex flex-col items-center">
                  Scan product to get footprint
                  <div className="absolute -bottom-1.5 w-3 h-3 bg-forest border-r-2 border-b-2 border-forest rotate-45"></div>
                </div>
              </div>
              <div className="group/icon relative flex flex-col items-center">
                <button disabled={isTyping} onClick={() => setScreenShareModal(true)} className="w-16 h-16 flex items-center justify-center hover:bg-white rounded-xl hover:text-leafMuted smooth-transition border-2 border-transparent hover:border-forest shadow-sm hover:shadow-brutal-sm disabled:opacity-50" aria-label="Share Screen">
                  <MonitorUp size={36} />
                </button>
                <span className="text-[10px] font-black uppercase tracking-wider text-forest/70 mt-1">Screen</span>
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-forest text-cream text-[12px] font-medium px-4 py-2 rounded-xl opacity-0 group-hover/icon:opacity-100 smooth-transition pointer-events-none whitespace-nowrap z-[100] shadow-brutal border-2 border-forest transform translate-y-2 group-hover/icon:translate-y-0 flex flex-col items-center">
                  Share screen to analyze activities
                  <div className="absolute -bottom-1.5 w-3 h-3 bg-forest border-r-2 border-b-2 border-forest rotate-45"></div>
                </div>
              </div>
            </div>
            
            <button 
              disabled={isTyping || !input.trim()}
              aria-label="Send message"
              className="w-10 h-10 bg-forest rounded-xl flex items-center justify-center text-cream hover:bg-leaf hover:-translate-y-1 hover:shadow-brutal-sm active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none smooth-transition border-2 border-forest"
              onClick={() => sendMessage(input)}
            >
              <iconify-icon aria-hidden="true" icon="ph:paper-plane-tilt-fill" class="text-xl"></iconify-icon>
            </button>
          </div>
        </div>
      </div>

      {/* Screen Share Modal */}
      {screenShareModal && (
        <div className="fixed inset-0 bg-forest/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-cream rounded-[2rem] p-8 w-full max-w-sm relative border-4 border-forest shadow-brutal organic-card">
            <button aria-label="Close screen share modal" onClick={() => setScreenShareModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-white border-2 border-forest rounded-full flex items-center justify-center text-forest hover:bg-forest hover:text-cream smooth-transition">
              <X size={16} strokeWidth={3} />
            </button>
            <h3 className="text-forest mb-5 text-2xl font-serif font-bold">Share Screen</h3>
            <div className="h-40 bg-white rounded-2xl flex flex-col items-center justify-center mb-6 border-4 border-dashed border-forest/30 cursor-pointer hover:border-forest hover:bg-forest/5 smooth-transition group">
              <div className="text-center text-forest/70 group-hover:text-forest smooth-transition">
                <MonitorUp size={36} className="mx-auto mb-2" />
                <p className="font-sans font-bold text-sm uppercase tracking-wider">Select screen</p>
              </div>
            </div>
            <button className="w-full py-4 bg-terracotta border-2 border-forest shadow-brutal-sm hover:shadow-brutal-hover text-cream rounded-xl font-black uppercase tracking-widest text-sm hover:-translate-y-1 active:translate-y-0 smooth-transition" onClick={handleScreenCapture}>
              Start Sharing
            </button>
          </div>
        </div>
      )}

      {/* Scan Modal */}
      {scanModal && (
        <div className="fixed inset-0 bg-forest/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-cream rounded-[2rem] p-8 w-full max-w-sm relative border-4 border-forest shadow-brutal organic-card-alt">
            <button aria-label="Close scan modal" onClick={() => setScanModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-white border-2 border-forest rounded-full flex items-center justify-center text-forest hover:bg-forest hover:text-cream smooth-transition">
              <X size={16} strokeWidth={3} />
            </button>
            <h3 className="text-forest mb-5 text-2xl font-serif font-bold">Scan Barcode</h3>
            <label className="h-40 bg-white rounded-2xl flex items-center justify-center mb-6 border-4 border-dashed border-forest/30 group cursor-pointer hover:bg-forest/5 smooth-transition">
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                if (e.target.files?.[0]) {
                  setScanModal(false);
                  handleFileUpload(e.target.files[0], 'I scanned this product/barcode. Can you identify it and estimate the carbon footprint?');
                }
              }} />
              <div className="text-center text-forest/70 group-hover:text-forest">
                <Camera size={36} className="mx-auto mb-2" />
                <p className="font-sans font-bold text-sm uppercase tracking-wider">Open Camera / Select Image</p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Receipt Modal (Now Drag and Drop capable) */}
      {receiptModal && (
        <div className="fixed inset-0 bg-forest/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-cream rounded-[2rem] p-8 w-full max-w-sm relative border-4 border-forest shadow-brutal organic-card">
            <button aria-label="Close receipt modal" onClick={() => setReceiptModal(false)} className="absolute top-4 right-4 w-8 h-8 bg-white border-2 border-forest rounded-full flex items-center justify-center text-forest hover:bg-forest hover:text-cream smooth-transition">
              <X size={16} strokeWidth={3} />
            </button>
            <h3 className="text-forest mb-5 text-2xl font-serif font-bold">Upload Receipt</h3>
            <label 
              className="h-40 bg-white rounded-2xl flex items-center justify-center mb-6 border-4 border-dashed border-forest/30 cursor-pointer hover:border-forest hover:bg-forest/5 smooth-transition group"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files?.[0]) {
                  setReceiptModal(false);
                  handleFileUpload(e.dataTransfer.files[0], 'Please analyze this receipt and estimate the total carbon footprint for these items.');
                }
              }}
            >
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                if (e.target.files?.[0]) {
                  setReceiptModal(false);
                  handleFileUpload(e.target.files[0], 'Please analyze this receipt and estimate the total carbon footprint for these items.');
                }
              }} />
              <div className="text-center text-forest/70 group-hover:text-forest smooth-transition">
                <FileText size={36} className="mx-auto mb-2 group-hover:-translate-y-2 smooth-transition" />
                <p className="font-sans font-bold text-sm uppercase tracking-wider">Drag file here<br/><span className="text-[10px] normal-case tracking-normal">or click to browse</span></p>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
