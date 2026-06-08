import { useState, useEffect, useRef, FormEvent } from "react";
import { 
  MapPin, 
  ArrowRight, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  Send, 
  Database, 
  Cpu, 
  Clock, 
  Coins, 
  MessageSquare, 
  Settings, 
  ShieldCheck, 
  HelpCircle, 
  Activity, 
  CloudRain, 
  Radio, 
  Users, 
  Layers, 
  Search, 
  Navigation, 
  UserCheck, 
  RefreshCw,
  Megaphone
} from "lucide-react";
import { Stage, RouteSegment, CrowdsourcedReport, SMSSession, SimulationScenario, RouteQueryResult } from "./types";
import InteractiveTransitMap from "./components/InteractiveTransitMap";

export default function App() {
  // Application State
  const [stages, setStages] = useState<Stage[]>([]);
  const [reports, setReports] = useState<CrowdsourcedReport[]>([]);
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [currentScenario, setCurrentScenario] = useState<string>("NORMAL");
  const [geminiStatus, setGeminiStatus] = useState<string>("SIMULATED_INTELLIGENCE");
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Geolocation and Key Configurations
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearestStageName, setNearestStageName] = useState<string | null>(null);
  const [nearestDistance, setNearestDistance] = useState<number | null>(null);
  const [geolocationStatus, setGeolocationStatus] = useState<'idle' | 'prompt' | 'loading' | 'granted' | 'denied' | 'error'>('idle');

  // Keys derived dynamically from server status or build configuration environment
  const [googleMapsKey, setGoogleMapsKey] = useState<string>("");
  const [africasTalkingKey, setAfricasTalkingKey] = useState<string>("");

  // Multi-Layout Systems
  const [currentLayout, setCurrentLayout] = useState<'bento' | 'minimal' | 'pulse' | 'hustle'>('bento');
  const [verifications, setVerifications] = useState<Record<string, number>>({});
  const [isLayersMenuOpen, setIsLayersMenuOpen] = useState<boolean>(false);

  // Search Context
  const [origin, setOrigin] = useState<string>("Kawangware");
  const [destination, setDestination] = useState<string>("Ruai");
  const [routingResult, setRoutingResult] = useState<RouteQueryResult | null>(null);
  const [routingLoading, setRoutingLoading] = useState<boolean>(false);

  // New Crowd intellect input state
  const [newIntelStage, setNewIntelStage] = useState<string>("Kencom/Archives");
  const [newIntelStatus, setNewIntelStatus] = useState<CrowdsourcedReport["status"]>("congested");
  const [newIntelMultiplier, setNewIntelMultiplier] = useState<number>(1.2);
  const [newIntelMsg, setNewIntelMsg] = useState<string>("");
  const [submittingIntel, setSubmittingIntel] = useState<boolean>(false);
  const [intelSuccess, setIntelSuccess] = useState<boolean>(false);

  // Africa's Talking Simulated SMS Session state
  const [smsPhone, setSmsPhone] = useState<string>("+254712345890");
  const [smsInput, setSmsInput] = useState<string>("");
  const [smsSessionState, setSmsSessionState] = useState<string>("AWAITING_ORIGIN_DEST");
  const [smsHistory, setSmsHistory] = useState<Array<{ sender: 'user' | 'mzee'; text: string; timestamp: string }>>([]);
  const [smsSending, setSmsSending] = useState<boolean>(false);

  // Conversational Chat with Mzee states and handlers
  const [isMzeeChatOpen, setIsMzeeChatOpen] = useState<boolean>(false);
  const [queryMode, setQueryMode] = useState<'select' | 'chat'>('chat');
  
  interface MzeeChatMessage {
    sender: 'user' | 'mzee';
    text: string;
    timestamp: string;
    englishTranslation?: string;
    probabilityScore?: number;
    totals?: {
      fare?: number;
      duration?: number;
      hops?: number;
    };
  }

  const [mzeeChatHistory, setMzeeChatHistory] = useState<MzeeChatMessage[]>([
    {
      sender: 'mzee',
      text: 'Habari Kijana! Mimi ni Mzee, Route Agent wako wa Nairobi. Niambie stesheni unayotoka na unakoenda, au niulize maoni yoyote ya usafiri hapa tunayopitia hivi sasa.',
      englishTranslation: 'Hello young commuter! I am Mzee, your Nairobi route agent. Tell me which station you are starting from and where you are going, or ask me any question about the current traffic situation in town right now.',
      timestamp: new Date().toISOString(),
      probabilityScore: 98,
      totals: { fare: 0, duration: 0, hops: 0 }
    }
  ]);
  const [translatedMsgIndices, setTranslatedMsgIndices] = useState<number[]>([]);
  const [mzeeChatInput, setMzeeChatInput] = useState<string>("");
  const [mzeeChatLoading, setMzeeChatLoading] = useState<boolean>(false);

  const toggleTranslation = (idx: number) => {
    setTranslatedMsgIndices(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleSendMzeeChatMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!mzeeChatInput.trim() || mzeeChatLoading) return;

    const userText = mzeeChatInput.trim();
    setMzeeChatInput("");
    
    const newUserMessage: MzeeChatMessage = {
      sender: 'user' as const,
      text: userText,
      timestamp: new Date().toISOString()
    };
    
    const updatedHistory = [...mzeeChatHistory, newUserMessage];
    setMzeeChatHistory(updatedHistory);
    setMzeeChatLoading(true);

    try {
      const res = await fetch("/api/mzee/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: updatedHistory.slice(-8)
        })
      });

      if (!res.ok) throw new Error("Connection failed");
      const data = await res.json();
      
      setMzeeChatHistory(prev => [
        ...prev,
        {
          sender: 'mzee' as const,
          text: data.reply || "Mzee yuko shughuli kidogo leo. Hebu jaribu tena hivi sasa.",
          englishTranslation: data.englishTranslation,
          timestamp: new Date().toISOString(),
          probabilityScore: data.probabilityScore,
          totals: data.totals
        }
      ]);

      if (data.detectedRoute && data.routeResult) {
        setOrigin(data.detectedRoute.origin);
        setDestination(data.detectedRoute.destination);
        setRoutingResult(data.routeResult);
      }
    } catch (err) {
      console.error(err);
      setMzeeChatHistory(prev => [
        ...prev,
        {
          sender: 'mzee' as const,
          text: "Samahani kijana wangu, mtandao imeenda chini kidogo. Hebu uulize tena baada ya mda.",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      mzeeChatLoading && setMzeeChatLoading(false);
      setMzeeChatLoading(false);
    }
  };

  // Map representation UI toggle
  const [activeTab, setActiveTab] = useState<'route' | 'stages' | 'segments'>('route');

  // Upvote / Verify live peer updates
  const handleVerifyReport = (id: string) => {
    setVerifications(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  // Load backend configuration
  const loadSystemStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/system/status");
      if (!res.ok) throw new Error("Could not retrieve system intelligence state");
      const data = await res.json();
      setStages(data.stages || []);
      setReports(data.reports || []);
      setSegments(data.routeSegments || []);
      setCurrentScenario(data.currentScenario || "NORMAL");
      setGeminiStatus(data.geminiStatus || "SIMULATED_INTELLIGENCE");
      if (data.googleMapsKey) setGoogleMapsKey(data.googleMapsKey);
      if (data.africasTalkingKey) setAfricasTalkingKey(data.africasTalkingKey);
      setErrorMsg("");
    } catch (e: any) {
      console.error(e);
      setErrorMsg("Error connecting to Nairobi Transit Agent server. Operating in fallback mode.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger Routing Inquiry
  const handleCalculateRoute = async (customOrigin?: string, customDest?: string) => {
    const qOrig = customOrigin || origin;
    const qDest = customDest || destination;
    
    setRoutingLoading(true);
    try {
      const res = await fetch("/api/mzee/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: qOrig, destination: qDest })
      });
      if (!res.ok) throw new Error("Inference failure");
      const data = await res.json();
      setRoutingResult(data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to query route planning engine.");
    } finally {
      setRoutingLoading(false);
    }
  };

  // Alter Simulation Environment Scenario
  const handleUpdateScenario = async (scenario: string) => {
    try {
      setCurrentScenario(scenario);
      const res = await fetch("/api/simulation/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario })
      });
      if (res.ok) {
        // Reload crowdsource feed & re-apply route logic
        await loadSystemStatus();
        await handleCalculateRoute(origin, destination);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Simulated Crowdsourced Report Webhook
  const handlePostCrowdsourcedReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!newIntelMsg.trim()) return;

    setSubmittingIntel(true);
    setIntelSuccess(false);
    try {
      // Craft simulated SMS mimicking Africa's Talking payload structure e.g.: "Accra road congested 1.5x"
      const reportMessage = `${newIntelMsg} at ${newIntelStage} (Status: ${newIntelStatus.toUpperCase()})`;
      
      const res = await fetch("/api/crowdsource/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "trusted-operator",
          message: reportMessage
        })
      });

      if (!res.ok) throw new Error("Ingress webhook error");
      setIntelSuccess(true);
      setNewIntelMsg("");
      setTimeout(() => setIntelSuccess(false), 3000);
      
      // Auto-reload and refresh path
      await loadSystemStatus();
      await handleCalculateRoute(origin, destination);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingIntel(false);
    }
  };

  // Send Conversational SMS to Simulated Session (Redis state machine test)
  const handleSendSMS = async (e: FormEvent) => {
    e.preventDefault();
    if (!smsInput.trim()) return;

    const userMsg = smsInput;
    setSmsInput("");
    setSmsSending(true);

    try {
      const res = await fetch("/api/sms/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: smsPhone,
          message: userMsg
        })
      });

      if (!res.ok) throw new Error("Conversation failure");
      const data = await res.json();
      setSmsSessionState(data.current_state);
      setSmsHistory(data.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSmsSending(false);
    }
  };

  // Request user geo-location and resolve nearest transit stage
  const requestGeoLocation = (stagesList: Stage[] = stages) => {
    if (!navigator.geolocation) {
      setGeolocationStatus('error');
      // Fallback
      handleCalculateRoute("Kawangware", "Ruai");
      return;
    }
    
    setGeolocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
         setUserCoords({ lat: latitude, lng: longitude });
        setGeolocationStatus('granted');
        
        const targets = stagesList.length > 0 ? stagesList : stages;
        if (targets.length > 0) {
          let minDistance = Infinity;
          let closest: Stage | null = null;
          targets.forEach(stage => {
            // Flat distance in km
            const dist = Math.sqrt(Math.pow(stage.lat - latitude, 2) + Math.pow(stage.lng - longitude, 2)) * 111.12;
            if (dist < minDistance) {
              minDistance = dist;
              closest = stage;
            }
          });
          if (closest) {
            setNearestStageName((closest as Stage).name);
            setNearestDistance(minDistance);
            setOrigin((closest as Stage).name);
            handleCalculateRoute((closest as Stage).name, destination);
          } else {
            handleCalculateRoute("Kawangware", "Ruai");
          }
        } else {
          handleCalculateRoute("Kawangware", "Ruai");
        }
      },
      (error) => {
        console.error("Geolocation was denied or failed:", error);
        setGeolocationStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error');
        // Fallback to default
        handleCalculateRoute("Kawangware", "Ruai");
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  // Fetch initial data
  useEffect(() => {
    loadSystemStatus();
  }, []);

  // Run a default route calculation on load or launch geolocation search
  useEffect(() => {
    if (stages.length > 0) {
      requestGeoLocation(stages);
    }
  }, [stages]);

  // Quick select helper preset queries
  const selectPreset = (orig: string, dest: string) => {
    setOrigin(orig);
    setDestination(dest);
    handleCalculateRoute(orig, dest);
  };

  // --- LAYOUT 2: MINIMAL AIR (mzee2.png style layout) ---
  const renderMinimalAir = () => {
    return (
      <div id="minimal-air-wrapper" className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
        
        {/* Title & Subtitle */}
        <div className="text-center space-y-2 mt-4">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 font-sans italic">
            Where are we headed?
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Real-time Nairobi transit intelligence at your fingertips.
          </p>
        </div>

        {/* Big Search Capsule Pill Input */}
        <div className="bg-white rounded-2xl md:rounded-full p-3 shadow-xl border border-slate-100 flex flex-col md:flex-row items-stretch md:items-center gap-3 max-w-2xl mx-auto w-full group focus-within:ring-2 focus-within:ring-[#1E3A5F]/20 transition-all">
          <div className="hidden md:flex bg-emerald-500 text-white p-3 rounded-full items-center justify-center font-bold shadow-md self-center">
            <Search className="w-5 h-5" />
          </div>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 text-slate-800 md:pr-2 pb-2 md:pb-0 gap-2 md:gap-0">
            <div className="px-3 flex flex-col justify-center pt-2 md:pt-0">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">From</span>
              <select
                value={origin}
                onChange={(e) => {
                  setOrigin(e.target.value);
                  handleCalculateRoute(e.target.value, destination);
                }}
                className="bg-transparent font-bold text-xs md:text-sm text-slate-800 focus:outline-none w-full cursor-pointer pr-2 pt-0.5"
              >
                {stages.map(st => (
                  <option key={`min-orig-${st.id}`} value={st.name}>{st.name}</option>
                ))}
              </select>
            </div>
            
            <div className="px-3 md:px-4 flex flex-col justify-center pt-2 md:pt-0">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">To</span>
              <select
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  handleCalculateRoute(origin, e.target.value);
                }}
                className="bg-transparent font-bold text-xs md:text-sm text-slate-800 focus:outline-none w-full cursor-pointer pr-2 pt-0.5"
              >
                {stages.map(st => (
                  <option key={`min-dest-${st.id}`} value={st.name}>{st.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => handleCalculateRoute()}
            className="bg-[#1E3A5F] hover:bg-slate-800 text-white rounded-xl md:rounded-full py-3.5 md:p-3 font-bold transition shadow flex items-center justify-center gap-2 md:w-auto shrink-0 uppercase tracking-wider text-xs md:text-base font-black px-6 md:px-3"
            title="Search Route Path"
          >
            <span className="md:hidden">Get Route Path</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center text-xs text-slate-400 font-medium tracking-wide">
          Ask Mzee: <span className="text-slate-600 font-bold hover:underline cursor-pointer" onClick={() => selectPreset("Kawangware", "Kencom/Archives")}>"Kawangware to CBD Archives"</span> or <span className="text-slate-600 font-bold hover:underline cursor-pointer" onClick={() => selectPreset("Railways", "Rongai")}>"Railways to Rongai"</span>
        </div>

        {/* Three Central Grid Cards with Toggle Inline Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto w-full">
          {/* Card 1: Map View */}
          <button
            onClick={() => setActiveTab('route')}
            className={`cursor-pointer rounded-2xl p-6 text-center border transition-all flex flex-col items-center gap-2.5 ${
              activeTab === 'route' 
                ? 'bg-white border-[#1E3A5F] shadow-lg shadow-[#1E3A5F]/5 scale-[1.02]' 
                : 'bg-white/60 border-slate-100 hover:bg-white hover:border-slate-200'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1E3A5F] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Map View</h3>
              <p className="text-[11px] text-slate-400 font-medium">Interactive stage explorer</p>
            </div>
          </button>

          {/* Card 2: Submit Intel */}
          <button
            onClick={() => setActiveTab('stages')}
            className={`cursor-pointer rounded-2xl p-6 text-center border transition-all flex flex-col items-center gap-2.5 ${
              activeTab === 'stages' 
                ? 'bg-white border-[#1E3A5F] shadow-lg shadow-[#1E3A5F]/5 scale-[1.02]' 
                : 'bg-white/60 border-slate-100 hover:bg-white hover:border-slate-200'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Submit Intel</h3>
              <p className="text-[11px] text-slate-400 font-medium">Report live disruptions</p>
            </div>
          </button>

          {/* Card 3: Dashboard */}
          <button
            onClick={() => setActiveTab('segments')}
            className={`cursor-pointer rounded-2xl p-6 text-center border transition-all flex flex-col items-center gap-2.5 ${
              activeTab === 'segments' 
                ? 'bg-white border-[#1E3A5F] shadow-lg shadow-[#1E3A5F]/5 scale-[1.02]' 
                : 'bg-white/60 border-slate-100 hover:bg-white hover:border-slate-200'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Dashboard</h3>
              <p className="text-[11px] text-slate-400 font-medium">Transit statistics</p>
            </div>
          </button>
        </div>

        {/* Conditionally Render Content of Selected Mode Inside Minimal Air Frame */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md max-w-3xl mx-auto w-full">
          {activeTab === 'route' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-xs uppercase font-black text-slate-400 tracking-widest">Active Direction Path</span>
                <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  EST. FARE: KES {routingResult?.telemetry?.total_estimated_fare || "150"}
                </span>
              </div>
              
              <InteractiveTransitMap
                googleMapsKey={googleMapsKey}
                origin={origin}
                destination={destination}
                stages={stages}
                routingResult={routingResult}
                height={240}
              />
              
              {routingResult?.hops && routingResult.hops.length > 0 ? (
                <div className="space-y-3">
                  {routingResult.hops.map((hop, idx) => (
                    <div key={`min-hop-${idx}`} className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 font-bold uppercase">Leg {idx + 1}: {hop.type === 'transit' ? 'Matatu' : 'Transfer'}</p>
                        <p className="font-extrabold text-[#1E3A5F] text-sm">{hop.from} → {hop.to}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-800">KES {hop.fareEstimate}</p>
                        <p className="text-[10px] text-slate-400">{hop.durationMinutes}m</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs py-4 text-slate-400">Loading Nairobi path guidelines...</p>
              )}
            </div>
          )}

          {activeTab === 'stages' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">Crowdsource SMS Inbound Sim Gateway</h4>
                <p className="text-xs text-slate-400">Ingest live transit events manually into Nairobi Transit database:</p>
              </div>

              <form onSubmit={handlePostCrowdsourcedReport} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Stage</label>
                    <select
                      value={newIntelStage}
                      onChange={(e) => setNewIntelStage(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                    >
                      {stages.map(st => (
                        <option key={`min-form-st-${st.id}`} value={st.name}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Incident Status</label>
                    <select
                      value={newIntelStatus}
                      onChange={(e) => setNewIntelStatus(e.target.value as any)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                    >
                      <option value="normal">🟢 Normal</option>
                      <option value="congested">🟠 Congested</option>
                      <option value="police_crackdown">🚨 Crackdown</option>
                      <option value="rain_disruption">🌧️ Flooding</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Commuter Update Message</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Clean flow, no queues"
                    value={newIntelMsg}
                    onChange={(e) => setNewIntelMsg(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>

                {intelSuccess && (
                  <div className="p-2 bg-emerald-50 text-emerald-700 font-bold rounded text-center">
                    Report submitted successfully!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingIntel}
                  className="w-full bg-slate-900 text-white rounded-xl py-2.5 font-bold uppercase tracking-wider hover:bg-slate-800 cursor-pointer text-xs"
                >
                  Submit Commuter Report
                </button>
              </form>
            </div>
          )}

          {activeTab === 'segments' && (
            <div className="space-y-4">
              <h4 className="font-extrabold text-sm text-slate-900 uppercase border-b border-slate-100 pb-3">Nairobi Transit Volatilities</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Estimated Peak Spike</span>
                  <p className="text-2xl font-extrabold text-[#1E3A5F] mt-1">
                    {currentScenario === "RUSH_HOUR" ? "+40%" : "+0%"}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Rain Impact Index</span>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                    {currentScenario === "RAINY_DAY" ? "Severe Flooding" : "Neutral"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Alerts Feed Timeline */}
        <div className="max-w-2xl mx-auto w-full space-y-4">
          <div className="flex justify-between items-center px-1">
            <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-zinc-400" /> Recent Alerts
            </h4>
            <span className="text-[10px] text-zinc-400 font-black uppercase">Live stream feed</span>
          </div>

          <div className="space-y-3.5">
            {reports.slice(0, 3).map((rep) => (
              <div key={`min-rep-${rep.id}`} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between gap-4">
                <div>
                  <h5 className="font-bold text-xs text-[#1E3A5F] select-all">{rep.stage}</h5>
                  <p className="text-xs text-slate-500 italic mt-0.5">"{rep.description}"</p>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">
                  {new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  };

  // --- LAYOUT 3: THE STREET PULSE (mzee3.png style layout) ---
  const renderStreetPulse = () => {
    return (
      <div id="street-pulse-wrapper" className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Banner Section */}
        <div className="col-span-12 flex justify-between items-center mt-2 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-3xl font-black text-[#1E3A5F] tracking-tight">The Street Pulse</h2>
            <p className="text-xs text-slate-500 font-medium">Commuter intelligence streams in Nairobi</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button className="px-3.5 py-1.5 bg-white text-[#1E3A5F] text-xs font-black rounded-lg shadow-sm">Hot</button>
            <button className="px-3.5 py-1.5 text-slate-400 text-xs font-bold hover:text-[#1E3A5F]">Recent</button>
          </div>
        </div>

        {/* Left Column: Live Activity Stream Feed */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {reports.map((rep) => {
            const localVotes = verifications[rep.id] || 0;
            const seedVotes = Math.round(rep.reporterReputation * 12);
            const totalVotes = seedVotes + localVotes;

            return (
              <div key={`pulse-feed-${rep.id}`} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow transition">
                <div className="flex gap-4 items-start">
                  
                  {/* Initial Circle Avatar */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow ${
                    rep.status === 'police_crackdown' ? 'bg-red-500' : rep.status === 'congested' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}>
                    {rep.stage.charAt(0)}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-extrabold text-sm text-[#1E3A5F] flex items-center gap-1.5">
                        {rep.stage}
                        {rep.status === 'police_crackdown' && <span className="bg-red-50 text-red-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">CRACKDOWN</span>}
                        {rep.status === 'congested' && <span className="bg-amber-50 text-amber-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">CONGESTED</span>}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-semibold italic mt-1.5">
                      "{rep.description}"
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-50 flex flex-wrap items-center gap-3 md:gap-6 text-slate-400 text-xs font-bold">
                      <button 
                        onClick={() => handleVerifyReport(rep.id)}
                        className="flex items-center gap-1.5 hover:text-emerald-500 bg-slate-50 px-3 py-1 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                        title="Upvote / Verify current warning"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Verify ({totalVotes})</span>
                      </button>
                      
                      <button 
                        onClick={() => selectPreset(rep.stage, "Kencom/Archives")}
                        className="flex items-center gap-1.5 hover:text-[#1E3A5F] cursor-pointer"
                        title="Plot path guidelines"
                      >
                        <Navigation className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Directions</span>
                      </button>

                      <div className="text-[10px] uppercase font-bold tracking-widest text-[#2E8B57] bg-emerald-500/10 px-2 py-0.5 rounded sm:ml-auto">
                        Rep {rep.reporterReputation ? rep.reporterReputation.toFixed(2) : "0.75"}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Interaction Cards & Trends */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* Join the Hustle */}
          <div className="bg-[#1E3A5F] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full"></div>
            <h3 className="font-extrabold text-lg text-white mb-2">Join the Hustle.</h3>
            <p className="text-xs text-blue-200/95 leading-relaxed mb-4">
              Verified reports earn reputation points. Help build the most accurate transit map in Nairobi.
            </p>
            
            <form onSubmit={handlePostCrowdsourcedReport} className="space-y-3 bg-white/5 p-3 rounded-2xl border border-white/10 text-xs text-white">
              <span className="text-[10px] uppercase tracking-wider font-bold block text-blue-200">Post Live Update</span>
              
              <select
                value={newIntelStage}
                onChange={(e) => setNewIntelStage(e.target.value)}
                className="w-full p-2 rounded-lg bg-[#27456b] border border-[#3b5d8a] focus:outline-none"
              >
                {stages.map(st => (
                  <option key={`pulse-form-st-${st.id}`} value={st.name} className="text-black">{st.name}</option>
                ))}
              </select>

              <textarea
                maxLength={140}
                placeholder="e.g. Traffic is flowing smoothly..."
                value={newIntelMsg}
                onChange={(e) => setNewIntelMsg(e.target.value)}
                className="w-full p-2 rounded-lg bg-[#27456b] border border-[#3b5d8a] placeholder-blue-300 placeholder:opacity-60 focus:outline-none"
                rows={2}
              />

              <button
                type="submit"
                disabled={submittingIntel}
                className="w-full bg-[#2E8B57] hover:bg-opacity-90 rounded-xl py-2 font-bold cursor-pointer uppercase tracking-widest text-[9.5px] text-white transition"
              >
                + Post Update
              </button>
            </form>
          </div>

          {/* Trending Stages */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-extrabold text-sm text-[#1E3A5F] uppercase tracking-wider mb-4 flex items-center gap-1 text-slate-400">
              ⚡ Trending Stages
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-amber-500 font-mono">01</span>
                  <span className="text-xs font-bold text-[#1E3A5F]">Globe Roundabout</span>
                </div>
                <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">High Activity</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-amber-500 font-mono">02</span>
                  <span className="text-xs font-bold text-[#1E3A5F]">Kencom/Archives</span>
                </div>
                <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">High Activity</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-amber-500 font-mono">03</span>
                  <span className="text-xs font-bold text-[#1E3A5F]">Khoja</span>
                </div>
                <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">High Activity</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-400 font-mono">04</span>
                  <span className="text-xs font-bold text-[#1E3A5F]">Westlands</span>
                </div>
                <span className="bg-slate-100 text-slate-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Normal</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    );
  };

  // --- LAYOUT 4: BOLD HUSTLE / Mshike Mshike (mzee4.png style layout) ---
  const renderBoldHustle = () => {
    return (
      <div id="bold-hustle-wrapper" className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Playful loud overlapping angled title header */}
        <div className="col-span-12 relative flex flex-col justify-center items-center select-none py-6 overflow-hidden">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black italic tracking-tighter text-[#1C2F52] select-all uppercase leading-none transform -skew-x-12 tracking-wide opacity-90">
            MSHIKE
          </h1>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black italic tracking-tighter text-emerald-600 uppercase leading-none transform -skew-x-12 tracking-wide opacity-90 -mt-2">
            MSHIKE
          </h1>
        </div>

        {/* Left Interactive Side: GET THE BEST MATHREE */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          
          {/* Main Action Banner (Yellow Offset container) */}
          <div className="bg-[#FAA92C] border-3 border-black rounded-3xl p-6 shadow-[5px_5px_0px_rgba(0,0,0,1)] flex flex-col justify-between min-h-[200px] transform -rotate-1">
            <div>
              <div className="w-10 h-10 bg-black text-[#FAA92C] rounded-xl flex items-center justify-center font-black">
                ★
              </div>
              <h3 className="text-2xl font-black text-black tracking-tighter uppercase italic mt-4">
                GET THE BEST MATHREE.
              </h3>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center mt-6">
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-black text-black bg-white p-2 rounded-xl border border-black uppercase divide-y sm:divide-y-0 sm:divide-x divide-black/10">
                <div className="px-2 pb-2 sm:pb-0">
                  <span className="text-[9px] text-[#2C2F36]/60">FROM</span>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-transparent font-black mt-0.5 text-black focus:outline-none"
                  >
                    {stages.map(st => (
                      <option key={`hustle-orig-${st.id}`} value={st.name}>{st.name}</option>
                    ))}
                  </select>
                </div>
                <div className="px-2 pt-2 sm:pt-0 sm:border-l border-black/30">
                  <span className="text-[9px] text-[#2C2F36]/60">TO</span>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-transparent font-black mt-0.5 text-black focus:outline-none"
                  >
                    {stages.map(st => (
                      <option key={`hustle-dest-${st.id}`} value={st.name}>{st.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                onClick={() => handleCalculateRoute()}
                className="w-full md:w-auto px-6 py-4 bg-black hover:bg-neutral-900 font-extrabold text-white rounded-xl text-xs uppercase tracking-widest cursor-pointer shadow-[3px_3px_0px_rgba(255,255,255,0.2)] transition shrink-0"
              >
                START MY TRIP →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* THE MAP indicator block */}
            <div className="bg-white border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="font-extrabold uppercase text-[10px] text-zinc-500">THE MAP STATE</span>
                </div>
                <h4 className="font-extrabold text-sm text-black">ACTIVE PATH MAP</h4>
                <p className="text-xs text-slate-500 mt-1">Route is active. KES {routingResult?.telemetry?.total_estimated_fare || "200"} fee estimate.</p>
                
                <div className="mt-3">
                  <InteractiveTransitMap
                    googleMapsKey={googleMapsKey}
                    origin={origin}
                    destination={destination}
                    stages={stages}
                    routingResult={routingResult}
                    height={210}
                  />
                </div>
              </div>

              <div className="mt-4 bg-[#FAF9F5] border border-black p-3 rounded-lg text-xs leading-none shrink-0">
                <span className="font-bold text-[#1E3A5F]">Current Road conditions:</span> {currentScenario}
              </div>
            </div>

            {/* LIVE ALERTS */}
            <div className="bg-white border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2 mb-2 text-red-500">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-extrabold uppercase text-[10px]">LIVE ALERTS</span>
              </div>
              <h4 className="font-extrabold text-sm text-black">ACTIVE HAZARDS</h4>
              <p className="text-xs text-slate-500 mt-1">
                {currentScenario === 'NORMAL' ? "Transit paths functioning as anticipated." : `${currentScenario} constraint applies. Check route guide.`}
              </p>
            </div>
          </div>

        </div>

        {/* Right Columns: LIVE INTEL List Feed */}
        <div className="col-span-12 lg:col-span-5">
          <div className="bg-white border-3 border-black rounded-3xl p-5 shadow-[5px_5px_0px_rgba(0,0,0,1)] h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-black pb-3 mb-4">
              <h4 className="font-black text-sm uppercase text-black tracking-wider flex items-center gap-2">
                <span className="text-emerald-500">●</span> LIVE INTEL
              </h4>
              <span className="text-[10px] font-bold text-gray-400 font-mono">STREET_STREAM</span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
              {reports.map((rep) => (
                <div key={`bold-rep-${rep.id}`} className="p-3.5 bg-[#FAF9F5] border-2 border-black rounded-xl">
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="font-black text-black">{rep.stage}</span>
                    <span className="text-[10px] text-zinc-400 font-mono font-bold">
                      {new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 italic select-none">"{rep.description}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div id="mzee-global-wrapper" className={`w-full max-w-full overflow-x-hidden min-h-screen ${currentLayout === 'minimal' ? 'bg-slate-50 text-slate-900' : currentLayout === 'hustle' ? 'bg-[#FAF9F5] text-black' : 'bg-[#F3F4F6] text-[#1E3A5F]'} font-sans flex flex-col transition-colors duration-300 relative`}>
      
      {/* 1. Header Section */}
      <header id="header-global" className="bg-white border-b border-gray-100 px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#1E3A5F] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-md">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-[#1E3A5F]">
                Mzee <span className="text-[#2E8B57] font-semibold">Intelligence</span>
              </h1>
              <span className="bg-[#1E3A5F]/10 text-[#1E3A5F] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                v1.5 Pro
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">
              Nairobi Metropolitan Route Intelligence Agent
            </p>
          </div>
        </div>


        {/* Global Stats indicators inside header */}
        <div className="flex flex-wrap items-center gap-3">
          <div id="stat-indicator-pulse" className="flex items-center gap-1.5 bg-[#2E8B57]/5 px-3.5 py-2 rounded-xl text-[#2E8B57] font-extrabold text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2E8B57] animate-pulse"></span>
            <span>SYSTEM LIVE: {reports.length * 8} reports/hr</span>
          </div>

          <button 
            id="refresh-state-btn" 
            onClick={loadSystemStatus}
            className="p-2.5 text-gray-400 hover:text-[#1E3A5F] hover:bg-gray-100 rounded-xl transition cursor-pointer relative"
            title="Refresh Knowledge Graph State"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#2E8B57]" : ""}`} />
          </button>
        </div>
      </header>

      {/* Dynamic Layout Delivery Frame */}
      {currentLayout === 'minimal' && renderMinimalAir()}
      {currentLayout === 'pulse' && renderStreetPulse()}
      {currentLayout === 'hustle' && renderBoldHustle()}

      {currentLayout === 'bento' && (
        <>
          {/* Section A: Viewport-height landing page containing what Mzee is all about */}
          <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12 lg:min-h-[calc(100vh-80px)] flex flex-col justify-center relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 bg-[#163359] text-white rounded-3xl md:rounded-[40px] p-5 sm:p-8 md:p-12 relative overflow-hidden shadow-2xl border border-blue-900/40">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              {/* Left Column - Mzee Core Definition & Setup */}
              <div className="col-span-12 lg:col-span-8 flex flex-col justify-between space-y-6 relative z-10">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-normal">
                    ✨ CROWDSOURCED NAIROBI TRANSIT INTELLIGENCE
                  </span>
                  
                  <h2 className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tight leading-tight md:leading-none text-white font-sans">
                    Navigate Nairobi <br className="hidden md:inline" /> Like a Local.
                  </h2>
                  
                  <p className="text-xs sm:text-sm md:text-base text-blue-100/90 font-medium leading-relaxed max-w-2xl font-sans">
                    Mzee is the metropolitan route agent powered by localized conversational intelligence. 
                    Ask Mzee anything to instantly skip police crackdowns, dodge heavy rush-hour snarls, anticipate fare changes, and route safely through the city.
                  </p>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => setIsMzeeChatOpen(true)}
                    className="bg-[#FAA92C] hover:bg-[#faa92c]/90 text-black font-black px-6 md:px-10 py-4 md:py-5 rounded-2xl transition-all hover:scale-[1.02] shadow-xl inline-flex items-center gap-3 text-xs md:text-sm uppercase tracking-wider cursor-pointer"
                  >
                    <span>Ask Mzee Now</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Environment Scenario Controls positioned right below the 'Ask Mzee Now' button */}
                <div className="pt-4 md:pt-6 border-t border-white/10 space-y-2.5 md:space-y-3.5 w-full">
                  <div>
                    <h3 className="text-[10px] md:text-xs uppercase tracking-widest text-[#FAA92C] font-black flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#FAA92C]" /> Real-time Scenario Configurator
                    </h3>
                    <p className="text-[11px] md:text-xs text-blue-200/95 mt-0.5 md:mt-1">
                      Choose city conditions below to dynamically simulate mathree routes and fares:
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-2.5 w-full">
                    <button
                      id="scenario-btn-normal"
                      onClick={() => handleUpdateScenario("NORMAL")}
                      className={`w-full md:w-auto flex items-center justify-center gap-1.5 px-3 py-2.5 md:px-4 md:py-3 rounded-xl font-extrabold text-[10px] md:text-[11px] tracking-wider uppercase transition-all cursor-pointer ${
                        currentScenario === "NORMAL"
                          ? "bg-emerald-500 text-white shadow-lg"
                          : "bg-white/10 hover:bg-white/15 text-white/90"
                      }`}
                    >
                      ☀️ Normal (70 KES)
                    </button>
                    <button
                      id="scenario-btn-rush"
                      onClick={() => handleUpdateScenario("RUSH_HOUR")}
                      className={`w-full md:w-auto flex items-center justify-center gap-1.5 px-3 py-2.5 md:px-4 md:py-3 rounded-xl font-extrabold text-[10px] md:text-[11px] tracking-wider uppercase transition-all cursor-pointer ${
                        currentScenario === "RUSH_HOUR"
                          ? "bg-[#E9A93D] text-black shadow-lg"
                          : "bg-white/10 hover:bg-white/15 text-white/90"
                      }`}
                    >
                      ⏰ Rush (+30 KES)
                    </button>
                    <button
                      id="scenario-btn-rain"
                      onClick={() => handleUpdateScenario("RAINY_DAY")}
                      className={`w-full md:w-auto flex items-center justify-center gap-1.5 px-3 py-2.5 md:px-4 md:py-3 rounded-xl font-extrabold text-[10px] md:text-[11px] tracking-wider uppercase transition-all cursor-pointer ${
                        currentScenario === "RAINY_DAY"
                          ? "bg-blue-500 text-white shadow-lg"
                          : "bg-white/10 hover:bg-white/15 text-white/90"
                      }`}
                    >
                      🌧️ Rain (2x Fare)
                    </button>
                    <button
                      id="scenario-btn-crackdown"
                      onClick={() => handleUpdateScenario("CRACKDOWN")}
                      className={`w-full md:w-auto flex items-center justify-center gap-1.5 px-3 py-2.5 md:px-4 md:py-3 rounded-xl font-extrabold text-[10px] md:text-[11px] tracking-wider uppercase transition-all cursor-pointer ${
                        currentScenario === "CRACKDOWN"
                          ? "bg-red-500 text-white shadow-lg"
                          : "bg-white/10 hover:bg-white/15 text-white/90"
                      }`}
                    >
                      👮 Crackdown (NTSA)
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Status Stats & Live Alert Panel */}
              <div className="col-span-12 lg:col-span-4 flex flex-col justify-between gap-6 w-full relative z-10">
                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 p-5 rounded-3xl shadow-md backdrop-blur-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-lg select-none">
                      🧭
                    </div>
                    <div>
                      <h4 className="text-3xl font-black italic tracking-tight">{stages.length > 0 ? stages.length : "14"}</h4>
                      <span className="text-[9px] text-blue-200 font-extrabold uppercase tracking-widest">Monitored Stations</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-5 rounded-3xl shadow-md backdrop-blur-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-[#FAA92C] flex items-center justify-center font-black text-lg select-none">
                      ⚡
                    </div>
                    <div>
                      <h4 className="text-3xl font-black italic tracking-tight">{reports.length}</h4>
                      <span className="text-[9px] text-blue-200 font-extrabold uppercase tracking-widest">Active Commuter Reports</span>
                    </div>
                  </div>
                </div>

                {/* Static Live Alert Box */}
                <div className="bg-black/35 border border-blue-900/40 p-6 rounded-3xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    <span className="font-extrabold uppercase tracking-widest text-[9.5px]">LIVE SCENARIO WARNING</span>
                  </div>
                  <h4 className="font-black text-sm text-white">Nairobi Metropolitan Snarls</h4>
                  <p className="text-xs text-blue-100/80 font-sans leading-relaxed">
                    {currentScenario === 'NORMAL' 
                      ? "Normal operations across most sectors. Safaricom and AT connections operating with standard latency." 
                      : `Alert: Current ${currentScenario} parameters are actively overriding baseline fares and route security criteria.`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Scroll Down Hint Anchor */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-70 select-none animate-bounce">
              <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Scroll Down for Route Insights</span>
              <span className="text-slate-400">↓</span>
            </div>
          </div>

          {/* Section B: Scrollable Core Transit Insights Frame */}
          <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-gray-100">
            
            {/* Left Main Insights Area (Routes & Segments) Elevated to Top of Grid */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              
              {/* 1. BASELINE TRANSIT SEGMENTS GRID (Sits directly in the former Active Router space) */}
              <section id="bento-segments" className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 border-b border-gray-50 pb-3">
                  <div>
                    <h3 className="font-extrabold text-base text-[#1E3A5F] flex items-center gap-2">
                      <Layers className="w-5 h-5 text-emerald-600" /> Baseline Transit Schedule Segments
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Static baseline timetable compiled across Nairobi Met Sacco structures:
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <span className="bg-[#1E3A5F]/5 text-[#1E3A5F] text-[9.5px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wide">
                      Segments: {segments.length}
                    </span>
                    <span className="bg-[#2E8B57]/10 text-[#2E8B57] text-[9.5px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wide">
                      Verified: {stages.length}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase text-[9.5px] font-black tracking-widest">
                        <th className="py-3 px-2">Origin Station</th>
                        <th className="py-3 px-2">Destination Station</th>
                        <th className="py-3 px-2 text-center">Route</th>
                        <th className="py-3 px-2 text-center">Base KES</th>
                        <th className="py-3 px-2 text-center">Typical Time</th>
                        <th className="py-3 px-2">SACCO operators</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-semibold text-[#1E3A5F]">
                      {segments.map(seg => (
                        <tr key={seg.id} className="hover:bg-gray-50/50 transition duration-100">
                          <td className="py-3 px-2 font-bold">{seg.origin}</td>
                          <td className="py-3 px-2 font-bold">{seg.destination}</td>
                          <td className="py-3 px-2 text-center">
                            <span className="bg-[#1E3A5F]/5 px-2.5 py-1 rounded-md font-bold text-[#1E3A5F]">
                              {seg.routeNumber}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center text-emerald-600 font-extrabold">KES {seg.baseFare}</td>
                          <td className="py-3 px-2 text-center text-slate-500 font-bold">{seg.typicalDurationMinutes} mins</td>
                          <td className="py-3 px-2 text-slate-500 text-[11px] font-normal">{seg.operator}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            {/* Right Side Sidebar Panel - Crowdsourced alerts Feed & Submission */}
            <div id="bento-right-sidebar" className="col-span-12 lg:col-span-4 space-y-6">
              
              {/* Crowdsourced Transit Live Reports list */}
              <div id="bento-live-reports" className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <h4 className="font-extrabold text-sm uppercase text-[#1E3A5F] tracking-wider flex items-center gap-2">
                    <span className="text-emerald-500 animate-pulse">●</span> Live Commuter Feed
                  </h4>
                  <span className="text-[9px] font-black text-gray-400 font-mono">NBO_TRANSIT_LIVE</span>
                </div>

                <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                  {reports.map((rep) => (
                    <div key={`bento-sidebar-rep-${rep.id}`} className="p-3 bg-gray-50/85 hover:bg-gray-50 border border-gray-100 rounded-2xl transition">
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="font-bold text-[#1E3A5F]">{rep.stage}</span>
                        <span className="text-[9px] text-gray-400 font-mono font-bold">
                          {new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 italic">"{rep.description}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Transit Alert / Upvote */}
              <div id="bento-crowdsource" className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-[#1E3A5F] border-b border-gray-55 pb-3">
                  <Megaphone className="w-5 h-5 text-[#FAA92C]" />
                  <h4 className="font-extrabold text-xs uppercase tracking-widest text-[#1E3A5F]">Report Road Update</h4>
                </div>
                
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newIntelMsg.trim()) return;
                    setSubmittingIntel(true);
                    try {
                      const res = await fetch("/api/intel/report", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          stage: newIntelStage,
                          description: newIntelMsg,
                          status: newIntelStatus,
                        }),
                      });
                      if (res.ok) {
                        const added = await res.json();
                        setReports(prev => [added.report, ...prev]);
                        setNewIntelMsg("");
                        setIntelSuccess(true);
                        setTimeout(() => setIntelSuccess(false), 3000);
                      }
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setSubmittingIntel(false);
                    }
                  }} 
                  className="space-y-3"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Target Stage</label>
                    <select
                      value={newIntelStage}
                      onChange={(e) => setNewIntelStage(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
                    >
                      {stages.map(s => (
                        <option key={`intel-st-${s.id}`} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Stage Status</label>
                    <select
                      value={newIntelStatus}
                      onChange={(e) => setNewIntelStatus(e.target.value as any)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
                    >
                      <option value="clear">Clear Path (Standard fares)</option>
                      <option value="congested">Heavy Snarl (Typical Delay)</option>
                      <option value="crackdown">Police Crackdown (Alert)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Description Message</label>
                    <textarea
                      required
                      value={newIntelMsg}
                      onChange={(e) => setNewIntelMsg(e.target.value)}
                      placeholder="e.g. 'Globe traffic heavy but flow continues'"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1E3A5F] h-16 min-h-[60px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingIntel}
                    className="w-full bg-[#1E3A5F] hover:bg-opacity-95 text-white font-black text-[11px] uppercase tracking-wider py-3 px-4 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {submittingIntel ? "Publishing Intel..." : "Publish Intel Update"}
                  </button>

                  {intelSuccess && (
                    <p className="text-[10px] text-[#2E8B57] font-black uppercase text-center">Intel successfully broadcasted!</p>
                  )}
                </form>
              </div>

            </div>

          </main>

          {/* Conversational Mzee Chat Modal Dialog - Opens on "Ask Mzee Now" */}
          {isMzeeChatOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white w-full max-w-2xl rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col h-[85vh] md:h-[75vh]">
                
                {/* Header */}
                <div className="bg-[#1E3A5F] text-white p-5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-extrabold text-sm tracking-tight">Mzee Intelligent Router</h3>
                      <p className="text-[10px] text-blue-200 font-black uppercase tracking-widest">Nairobi Metropolitan Transit Agent</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMzeeChatOpen(false)}
                    className="p-2 text-white/75 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer font-bold text-lg"
                  >
                    ✕
                  </button>
                </div>

                {/* Message list area */}
                <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 flex flex-col gap-4">
                  {mzeeChatHistory.map((m, idx) => (
                    <div 
                      key={`modal-mzee-chat-bubble-${idx}`} 
                      className={`flex flex-col gap-1 max-w-[85%] ${m.sender === 'user' ? 'self-end' : 'self-start'}`}
                    >
                      <div className="flex items-center gap-1.5 px-0.5">
                        {m.sender === 'mzee' ? (
                          <div className="bg-emerald-600 font-sans text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shrink-0 shadow-sm select-none">
                            Mzee Agent
                          </div>
                        ) : (
                          <div className="bg-blue-600 font-sans text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shrink-0 shadow-sm select-none">
                            Commuter
                          </div>
                        )}
                        <span className="text-[9px] text-gray-400 font-bold font-mono">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div 
                        className={`p-4 rounded-2xl text-xs leading-relaxed border transition-all duration-300 ${
                          m.sender === 'user' 
                            ? 'bg-[#1E3A5F] border-[#1E3A5F] text-white rounded-tr-none shadow-md'
                            : 'bg-white border-gray-100 text-slate-800 rounded-tl-none shadow-sm hover:border-gray-200'
                        }`}
                      >
                        {m.sender === 'mzee' && translatedMsgIndices.includes(idx) && m.englishTranslation ? (
                          <div className="space-y-1.5 animate-fadeIn">
                            <span className="inline-flex items-center gap-1 bg-[#1E3A5F]/5 text-[#1E3A5F] text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mb-1.5 select-none">
                              🇬🇧 English View
                            </span>
                            <p className="text-slate-750 font-sans font-medium leading-relaxed italic">
                              "{m.englishTranslation}"
                            </p>
                          </div>
                        ) : (
                          <p className="whitespace-pre-line font-medium leading-relaxed">{m.text}</p>
                        )}

                        {m.sender === 'mzee' && m.englishTranslation && (
                          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => toggleTranslation(idx)}
                              className="text-[9px] text-slate-500 hover:text-[#1E3A5F] hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/50 font-black uppercase tracking-wider transition duration-150 flex items-center gap-1.5 cursor-pointer select-none"
                            >
                              <span>🌐 {translatedMsgIndices.includes(idx) ? "Onyesha Sheng (Original)" : "Translate to English"}</span>
                            </button>
                          </div>
                        )}

                        {m.sender === 'mzee' && (m.probabilityScore !== undefined || m.totals) && (
                          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2 items-center text-[11px]">
                            {m.probabilityScore !== undefined && m.probabilityScore > 0 && (
                              <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-[#1E3A5F] px-2 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-wider">
                                🎯 Prob: {m.probabilityScore}%
                              </span>
                            )}
                            {m.totals && m.totals.fare !== undefined && m.totals.fare > 0 && (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-wider">
                                💰 Total: KES {m.totals.fare}
                              </span>
                            )}
                            {m.totals && m.totals.duration !== undefined && m.totals.duration > 0 && (
                              <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-150 text-amber-600 px-2 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-wider">
                                ⏱️ Time: {m.totals.duration}m
                              </span>
                            )}
                            {m.totals && m.totals.hops !== undefined && m.totals.hops > 0 && (
                              <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-100 text-purple-600 px-2 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-wider">
                                🚌 Hops: {m.totals.hops}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {mzeeChatLoading && (
                    <div className="flex flex-col gap-1 self-start">
                      <div className="bg-emerald-600 font-sans text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shrink-0 select-none animate-pulse">
                        Mzee Agent
                      </div>
                      <div className="p-3 bg-white border border-gray-100 text-gray-500 rounded-2xl rounded-tl-none flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-450 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-gray-450 rounded-full animate-bounce delay-100"></span>
                        <span className="w-1.5 h-1.5 bg-gray-450 rounded-full animate-bounce delay-200"></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestions dock */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center shrink-0 overflow-x-auto scrollbar-none gap-2 select-none">
                  <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider shrink-0">Tap to Ask:</span>
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none whitespace-nowrap">
                    <button 
                      type="button"
                      onClick={() => {
                        setMzeeChatInput("Kawangware to Kencom/Archives");
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 text-[#1E3A5F] text-[10px] font-bold rounded-lg border border-gray-200 transition shrink-0"
                    >
                      "Kawangware to Kencom"
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setMzeeChatInput("How do I get from Railways to Rongai?");
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 text-[#1E3A5F] text-[10px] font-bold rounded-lg border border-gray-200 transition shrink-0"
                    >
                      "Railways to Rongai"
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setMzeeChatInput("What is the path from Githurai to CBD?");
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 text-[#1E3A5F] text-[10px] font-bold rounded-lg border border-gray-200 transition shrink-0"
                    >
                      "Githurai to CBD"
                    </button>
                  </div>
                </div>

                {/* Input action bar */}
                <form onSubmit={handleSendMzeeChatMessage} className="p-4 border-t border-gray-100 bg-white flex gap-3 shrink-0">
                  <input
                    type="text"
                    value={mzeeChatInput}
                    onChange={(e) => setMzeeChatInput(e.target.value)}
                    placeholder="Ask Mzee route advice or type: 'Kawangware to Ruai'..."
                    disabled={mzeeChatLoading}
                    className="flex-grow bg-slate-50 border border-gray-200 rounded-xl px-4 py-3.5 text-xs font-semibold text-slate-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={mzeeChatLoading || !mzeeChatInput.trim()}
                    className="bg-[#1E3A5F] hover:bg-opacity-95 disabled:opacity-50 text-white font-extrabold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Send</span>
                  </button>
                </form>

              </div>
            </div>
          )}
        </>
      )}


      {/* Floating Layout Selector Menu in Bottom Right */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 select-none">
        {isLayersMenuOpen && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-3 w-56 flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="px-2 py-1 border-b border-gray-100 mb-1 flex items-center justify-between">
              <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Select Theme Layer</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            
            <button
              onClick={() => {
                setCurrentLayout('bento');
                setIsLayersMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                currentLayout === 'bento'
                  ? 'bg-[#1E3A5F] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>🍱 Bento (mzee1)</span>
              {currentLayout === 'bento' && <span className="text-[10px]">●</span>}
            </button>

            <button
              onClick={() => {
                setCurrentLayout('minimal');
                setActiveTab('route');
                setIsLayersMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                currentLayout === 'minimal'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>☁️ Air (mzee2)</span>
              {currentLayout === 'minimal' && <span className="text-[10px]">●</span>}
            </button>

            <button
              onClick={() => {
                setCurrentLayout('pulse');
                setIsLayersMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                currentLayout === 'pulse'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>💬 Pulse (mzee3)</span>
              {currentLayout === 'pulse' && <span className="text-[10px]">●</span>}
            </button>

            <button
              onClick={() => {
                setCurrentLayout('hustle');
                setIsLayersMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                currentLayout === 'hustle'
                  ? 'bg-amber-500 text-black shadow-sm font-black'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>⚡ Bold (mzee4)</span>
              {currentLayout === 'hustle' && <span className="text-[10px]">●</span>}
            </button>
          </div>
        )}

        {/* The Action Button */}
        <button
          onClick={() => setIsLayersMenuOpen(!isLayersMenuOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all cursor-pointer hover:scale-105 active:scale-95 ${
            isLayersMenuOpen 
              ? 'bg-rose-500 hover:bg-rose-600 rotate-90 duration-300' 
              : 'bg-[#1E3A5F] hover:bg-[#1E3A5F]/95'
          }`}
          title="Switch Mzee Theme Layers"
        >
          <Layers className="w-6 h-6" />
        </button>
      </div>

      {/* Footer system bar */}
      <footer id="footer-bento" className="bg-white border-t border-gray-200 mt-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest gap-2">
        <span>Nairobi, Kenya Metropolitan • 1.286° S, 36.817° E</span>
        <span>Offline USSD Mode Available: *483*92#</span>
        <span>Powered by Gemini 1.5 Pro & LangGraph Agent</span>
      </footer>

    </div>
  );
}
