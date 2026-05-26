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
  RefreshCw
} from "lucide-react";
import { Stage, RouteSegment, CrowdsourcedReport, SMSSession, SimulationScenario, RouteQueryResult } from "./types";

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

  // Keys derived from build process.env properties
  const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || "";
  const AFRICAS_TALKING_KEY = process.env.AFRICAS_TALKING_API_KEY || "";

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
        <div className="bg-white rounded-full p-2.5 shadow-xl border border-slate-100 flex items-center md:gap-4 gap-2 max-w-2xl mx-auto w-full group focus-within:ring-2 focus-within:ring-[#1E3A5F]/20 transition-all">
          <div className="bg-emerald-500 text-white p-3 rounded-full flex items-center justify-center font-bold shadow-md">
            <Search className="w-5 h-5" />
          </div>
          
          <div className="flex-1 grid grid-cols-2 divide-x divide-slate-100 text-slate-800 pr-2">
            <div className="px-3 flex flex-col justify-center">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">From</span>
              <select
                value={origin}
                onChange={(e) => {
                  setOrigin(e.target.value);
                  handleCalculateRoute(e.target.value, destination);
                }}
                className="bg-transparent font-bold text-xs md:text-sm text-slate-800 focus:outline-none w-full cursor-pointer pr-2"
              >
                {stages.map(st => (
                  <option key={`min-orig-${st.id}`} value={st.name}>{st.name}</option>
                ))}
              </select>
            </div>
            
            <div className="px-4 flex flex-col justify-center">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">To</span>
              <select
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  handleCalculateRoute(origin, e.target.value);
                }}
                className="bg-transparent font-bold text-xs md:text-sm text-slate-800 focus:outline-none w-full cursor-pointer pr-2"
              >
                {stages.map(st => (
                  <option key={`min-dest-${st.id}`} value={st.name}>{st.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => handleCalculateRoute()}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-full p-3 font-bold transition shadow"
            title="Search Route Path"
          >
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
              
              {GOOGLE_MAPS_KEY ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                  <iframe
                    title="Nairobi Minimal Route Map"
                    width="100%"
                    height="240"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_KEY}&origin=${encodeURIComponent(origin + " Nairobi")}&destination=${encodeURIComponent(destination + " Nairobi")}&mode=transit`}
                  />
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                  <MapPin className="w-5 h-5 text-slate-400 mx-auto animate-bounce" />
                  <h5 className="font-bold text-xs text-slate-700">Google Directions Integration</h5>
                  <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
                    Configure <code>GOOGLE_MAPS_PLATFORM_KEY</code> to enable real-time routing navigation graphics.
                  </p>
                </div>
              )}
              
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

                    <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-6 text-slate-400 text-xs font-bold">
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

                      <div className="text-[10px] uppercase font-bold tracking-widest text-[#2E8B57] bg-emerald-500/10 px-2 py-0.5 rounded ml-auto">
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
        <div className="col-span-12 relative flex flex-col justify-center items-center select-none py-6">
          <h1 className="text-7xl md:text-8xl font-black italic tracking-tighter text-[#1C2F52] select-all uppercase leading-none transform -skew-x-12 tracking-wide opacity-90">
            MSHIKE
          </h1>
          <h1 className="text-7xl md:text-8xl font-black italic tracking-tighter text-emerald-600 uppercase leading-none transform -skew-x-12 tracking-wide opacity-90 -mt-2">
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

            <div className="flex flex-col md:flex-row gap-4 items-center mt-6">
              <div className="flex-1 w-full grid grid-cols-2 gap-2 text-xs font-black text-black bg-white p-2 rounded-xl border border-black uppercase">
                <div className="px-2">
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
                <div className="px-2 border-l border-black/30">
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
                className="w-full md:w-auto px-6 py-4 bg-black hover:bg-neutral-900 font-extrabold text-white rounded-xl text-xs uppercase tracking-widest cursor-pointer shadow-[3px_3px_0px_rgba(255,255,255,0.2)] transition"
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
                
                {GOOGLE_MAPS_KEY ? (
                  <div className="mt-3 overflow-hidden rounded-xl border border-black/30 shadow-md">
                    <iframe
                      title="Nairobi Route Live directions map"
                      width="100%"
                      height="210"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_KEY}&origin=${encodeURIComponent(origin + " Nairobi")}&destination=${encodeURIComponent(destination + " Nairobi")}&mode=transit`}
                    />
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-xl text-center space-y-1.5">
                    <MapPin className="w-6 h-6 text-slate-400 mx-auto animate-bounce" />
                    <h5 className="font-bold text-[11px] text-slate-700">Google Interactive Maps Sandbox</h5>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-normal">
                      Provide <code>GOOGLE_MAPS_PLATFORM_KEY</code> in Settings Secrets to render real directions.
                    </p>
                  </div>
                )}
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
    <div id="mzee-global-wrapper" className={`min-h-screen ${currentLayout === 'minimal' ? 'bg-slate-50 text-slate-900' : currentLayout === 'hustle' ? 'bg-[#FAF9F5] text-black' : 'bg-[#F3F4F6] text-[#1E3A5F]'} font-sans flex flex-col transition-colors duration-300 relative`}>
      
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

        {/* Layout Switcher Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-2xl p-1 border border-gray-200 shadow-inner">
          <button
            id="layout-tab-bento"
            onClick={() => setCurrentLayout('bento')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
              currentLayout === 'bento'
                ? 'bg-[#1E3A5F] text-white shadow-md'
                : 'text-gray-500 hover:text-[#1E3A5F] hover:bg-white/50'
            }`}
          >
            🍱 Bento (mzee1)
          </button>
          <button
            id="layout-tab-minimal"
            onClick={() => {
              setCurrentLayout('minimal');
              setActiveTab('route');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
              currentLayout === 'minimal'
                ? 'bg-[#1E3A5F] text-white shadow-md'
                : 'text-gray-500 hover:text-[#1E3A5F] hover:bg-white/50'
            }`}
          >
            ☁️ Air (mzee2)
          </button>
          <button
            id="layout-tab-pulse"
            onClick={() => setCurrentLayout('pulse')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
              currentLayout === 'pulse'
                ? 'bg-[#1E3A5F] text-white shadow-md'
                : 'text-gray-500 hover:text-[#1E3A5F] hover:bg-white/50'
            }`}
          >
            💬 Pulse (mzee3)
          </button>
          <button
            id="layout-tab-hustle"
            onClick={() => setCurrentLayout('hustle')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
              currentLayout === 'hustle'
                ? 'bg-amber-500 text-black shadow-md font-extrabold'
                : 'text-gray-500 hover:text-black hover:bg-white/50'
            }`}
          >
            ⚡ Bold (mzee4)
          </button>
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
          {/* Mzee1 Premium Landing page Hero banner card exactly styled to mzee1.png guidelines */}
          <div className="w-full max-w-7xl mx-auto px-4 md:px-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#163359] text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl border border-blue-900/40">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              {/* Left Column Text details */}
              <div className="col-span-12 lg:col-span-8 space-y-5 relative z-10">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-none text-white font-sans">
                  Navigate Nairobi <br className="hidden md:inline" /> Like a Local.
                </h2>
                <p className="text-sm md:text-base text-blue-100/90 font-medium leading-relaxed max-w-xl">
                  Mzee uses crowdsourced intelligence to route you through the city, even during crackdowns or rain.
                </p>
                <button 
                  onClick={() => {
                    const el = document.getElementById('search-dock');
                    if(el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-[#FAA92C] hover:bg-opacity-95 text-black font-extrabold px-6 py-3.5 rounded-xl transition shadow-lg inline-flex items-center gap-2 text-xs uppercase cursor-pointer"
                >
                  <span>Ask Mzee Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Right Column Stats column */}
              <div className="col-span-12 lg:col-span-4 flex flex-row lg:flex-col gap-4 self-center relative z-10 w-full md:w-auto">
                <div className="flex-1 bg-white/10 p-5 rounded-2xl border border-white/5 shadow flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50/10 text-emerald-400 flex items-center justify-center font-extrabold text-sm">
                    ↗
                  </div>
                  <div>
                    <h4 className="text-2xl font-black italic">120+</h4>
                    <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Active Hops</span>
                  </div>
                </div>

                <div className="flex-1 bg-white/10 p-5 rounded-2xl border border-white/5 shadow flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-400/10 text-red-300 flex items-center justify-center font-extrabold text-sm">
                    ⚠️
                  </div>
                  <div>
                    <h4 className="text-2xl font-black italic">{reports.length > 0 ? reports.length : 2}</h4>
                    <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Live Reports</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Additional Visual Layer Elements for landing page exactly like layout in mzee1.png */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
              {/* Crowdsourced Transit Intel Item Feed */}
              <div className="md:col-span-8 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                  <h3 className="font-bold text-sm text-[#1E3A5F] flex items-center gap-2 uppercase tracking-wider">
                    <span className="text-emerald-500 animate-pulse">●</span> Crowdsourced Transit Intel
                  </h3>
                  <span className="text-[9.5px] font-bold text-gray-400 tracking-wider">LIVE FEED</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-gray-50/55 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center text-xs font-black shadow">🚌</div>
                      <div>
                        <h4 className="font-extrabold text-xs text-[#1E3A5F]">Khoja / CBD</h4>
                        <p className="text-xs text-slate-500 italic mt-0.5">"Traffic at Globe is heavy"</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono font-bold">12:55 AM</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-[#FAF9F5] rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-black shadow">🚌</div>
                      <div>
                        <h4 className="font-extrabold text-xs text-[#1E3A5F]">Kawangware</h4>
                        <p className="text-xs text-slate-500 italic mt-0.5">"Buses filling fast"</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono font-bold">12:55 AM</span>
                  </div>
                </div>
              </div>

              {/* Side controls */}
              <div className="md:col-span-4 space-y-4">
                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                  <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-widest mb-3">Quick Actions</h4>
                  <div className="space-y-2.5">
                    <button 
                      onClick={() => {
                        const el = document.getElementById('search-dock');
                        if(el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full text-left p-2.5 hover:bg-gray-50 rounded-xl transition flex items-center justify-between border border-transparent hover:border-gray-100 group cursor-pointer"
                    >
                      <div>
                        <h5 className="font-bold text-xs text-[#1E3A5F]">Direct Navigation</h5>
                        <p className="text-[10px] text-gray-400 mt-0.5">AI-powered multi-hop routing</p>
                      </div>
                      <span className="text-slate-400 group-hover:text-[#1E3A5F] transition font-bold text-xs">→</span>
                    </button>
                    <button 
                      onClick={() => {
                        const el = document.getElementById('bento-crowdsource');
                        if(el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full text-left p-2.5 hover:bg-gray-50 rounded-xl transition flex items-center justify-between border border-transparent hover:border-gray-100 group cursor-pointer"
                    >
                      <div>
                        <h5 className="font-bold text-xs text-[#1E3A5F]">Submit Alert</h5>
                        <p className="text-[10px] text-gray-400 mt-0.5">Share live traffic updates</p>
                      </div>
                      <span className="text-slate-400 group-hover:text-[#1E3A5F] transition font-bold text-xs">→</span>
                    </button>
                  </div>
                </div>

                {/* Rush hour alert */}
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-amber-500 text-black rounded-lg font-black text-xs shrink-0">⏰</div>
                  <div>
                    <h5 className="font-black text-xs text-amber-700 uppercase tracking-wide">Rush Hour Alert</h5>
                    <p className="text-xs text-amber-900 mt-0.5 font-medium leading-relaxed font-sans">Large queues expected soon for Jogoo Rd. Plan accordingly.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Main Bento Frame Container */}
          <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* 2. SYSTEM SIMULATOR STATUS PANEL (Span 12) */}
        <section id="bento-scenarios" className="col-span-12 bg-white rounded-3xl p-5 border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm uppercase tracking-widest text-gray-400 font-bold flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-[#E9A93D]" /> Environment Scenario Controls
              </h2>
              <p className="text-sm text-gray-600">
                Change dynamic city conditions. Watch route paths, prices & warnings real-time simulate constraints:
              </p>
            </div>
            {/* Action cards to toggle scenarios */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                id="scenario-btn-normal"
                onClick={() => handleUpdateScenario("NORMAL")}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs tracking-wider uppercase transition cursor-pointer ${
                  currentScenario === "NORMAL"
                    ? "bg-[#1E3A5F] text-white shadow-md shadow-[#1E3A5F]/20"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                ☀️ Normal Transit
              </button>
              <button
                id="scenario-btn-rush"
                onClick={() => handleUpdateScenario("RUSH_HOUR")}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs tracking-wider uppercase transition cursor-pointer ${
                  currentScenario === "RUSH_HOUR"
                    ? "bg-[#E9A93D] text-white shadow-md shadow-[#E9A93D]/20"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                ⏰ Rush Hour Peak
              </button>
              <button
                id="scenario-btn-rain"
                onClick={() => handleUpdateScenario("RAINY_DAY")}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs tracking-wider uppercase transition cursor-pointer ${
                  currentScenario === "RAINY_DAY"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-400/20"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                🌧️ Rainy Day Chaos
              </button>
              <button
                id="scenario-btn-crackdown"
                onClick={() => handleUpdateScenario("CRACKDOWN")}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs tracking-wider uppercase transition cursor-pointer ${
                  currentScenario === "CRACKDOWN"
                    ? "bg-red-600 text-white shadow-md shadow-red-500/10"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                👮 Police Operation
              </button>
            </div>
          </div>
        </section>

        {/* 3. INTERACTIVE SEARCH CONTROLS DOCK (Span 12) */}
        <div id="search-dock" className="col-span-12 bg-white rounded-3xl p-5 md:p-6 border border-gray-200 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <h3 className="font-bold text-lg text-[#1E3A5F] flex items-center gap-2">
              <Navigation className="w-5 h-5 text-[#2E8B57]" /> Dynamic Route query router
            </h3>
            {/* Quick Suggest presets for user tests */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400 uppercase font-semibold">Commuter Presets:</span>
              <button 
                id="preset-kawangware-ruai"
                onClick={() => selectPreset("Kawangware", "Ruai")}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-[#1E3A5F] text-xs font-semibold rounded-lg transition"
              >
                Kawangware → Ruai (Multi)
              </button>
              <button 
                id="preset-kawangware-cbd"
                onClick={() => selectPreset("Kawangware", "Kencom/Archives")}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-[#1E3A5F] text-xs font-semibold rounded-lg transition"
              >
                Kawangware → CBD (Direct Route 46)
              </button>
              <button 
                id="preset-cbd-rongai"
                onClick={() => selectPreset("Railways", "Rongai")}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-[#1E3A5F] text-xs font-semibold rounded-lg transition"
              >
                Railways → Rongai (Route 125)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Origin Input */}
            <div className="md:col-span-4 relative">
              <label className="absolute left-3 top-1 text-[10px] uppercase font-bold text-gray-400">Commuting From</label>
              <select
                id="origin-select"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full pt-5 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              >
                {stages.map(st => (
                  <option key={`orig-${st.id}`} value={st.name}>{st.name}</option>
                ))}
              </select>
            </div>

            {/* Path connector visual arrow */}
            <div className="hidden md:flex md:col-span-1 justify-center">
              <ArrowRight className="w-6 h-6 text-[#2E8B57]" />
            </div>

            {/* Destination Input */}
            <div className="md:col-span-4 relative">
              <label className="absolute left-3 top-1 text-[10px] uppercase font-bold text-gray-400">Commuting To</label>
              <select
                id="dest-select"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full pt-5 pb-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              >
                {stages.map(st => (
                  <option key={`dest-${st.id}`} value={st.name}>{st.name}</option>
                ))}
              </select>
            </div>

            {/* Query submit Button */}
            <div className="md:col-span-3">
              <button
                id="ask-mzee-btn"
                onClick={() => handleCalculateRoute()}
                disabled={routingLoading}
                className="w-full bg-[#1E3A5F] hover:bg-opacity-90 text-white font-bold py-3.5 px-6 rounded-xl text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {routingLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mzee Inquiring...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4" />
                    <span>Ask Mzee Route</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        {/* Seamless Route Results Delivery Panel */}
        {routingResult && (
          <div className="col-span-12 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full">
                  ★ Active Route Results
                </span>
                <h4 className="text-xl font-black text-[#1E3A5F] mt-1.5">
                  {origin} to {destination}
                </h4>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#1E3A5F]/5 px-3.5 py-2 rounded-xl text-right">
                  <span className="text-[10px] uppercase text-gray-400 font-bold block">Estimated Fare</span>
                  <span className="text-lg font-black text-[#1E3A5F]">
                    KES {routingResult?.telemetry?.total_estimated_fare || "150"}
                  </span>
                </div>
                <div className="bg-[#2E8B57]/5 px-3.5 py-2 rounded-xl text-right">
                  <span className="text-[10px] uppercase text-gray-400 font-bold block">Mzee Score</span>
                  <span className="text-lg font-black text-[#2E8B57]">
                    {routingResult?.telemetry?.confidence_score ? Math.round(routingResult.telemetry.confidence_score * 100) : 89}%
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Steps / Hops */}
              <div className="lg:col-span-8 space-y-3">
                {routingResult?.hops && routingResult.hops.length > 0 ? (
                  routingResult.hops.map((hop, idx) => (
                    <div key={`bento-res-hop-${idx}`} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F] flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          {hop.type === 'transit' ? `Matatu Route ${hop.route || '46'}` : 'Transfer'}
                        </p>
                        <p className="font-extrabold text-[#1E3A5F] text-sm">
                          {hop.from} → {hop.to}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-[#1E3A5F]">KES {hop.fareEstimate}</p>
                        <p className="text-[10px] text-gray-400">{hop.durationMinutes}m</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic py-4">No hops generated. Please search above.</p>
                )}
              </div>

              {/* Mzee's Advice */}
              <div className="lg:col-span-4 bg-[#1E3A5F] text-white rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#2E8B57] bg-emerald-500/10 px-2 py-1 rounded-md">
                    Mzee's Transit Advice
                  </span>
                  <p className="text-xs italic leading-relaxed text-blue-100 font-medium mt-3">
                    "{routingResult?.sms_response || "Select your route above to receive Mzee's local advisory."}"
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[10px] font-bold text-blue-200">
                  <span>Scenario: {currentScenario}</span>
                  <span>Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 11. KNOWLEDGE BASE ROUTE SEGMENTS EXPLORER (Span 12) */}
        <section id="bento-segments" className="col-span-12 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-lg text-[#1E3A5F] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#1E3A5F]" /> Baseline Transit Segments Grid
              </h3>
              <p className="text-xs text-gray-500">
                Baseline data compiled by independent transport operators in the Nairobi Metropolitan Transit Authority (without GTFS fallback):
              </p>
            </div>
            
            <div className="flex gap-2">
              <span className="bg-[#1E3A5F]/5 text-[#1E3A5F] text-[10px] font-bold px-3 py-1.5 rounded-lg">
                Total Segments: {segments.length}
              </span>
              <span className="bg-[#2E8B57]/10 text-[#2E8B57] text-[10px] font-bold px-3 py-1.5 rounded-lg">
                Verified Stages: {stages.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="py-3 px-2">Origin Stage</th>
                  <th className="py-3 px-2">Destination Stage</th>
                  <th className="py-3 px-2 text-center">Route No</th>
                  <th className="py-3 px-2 text-center">Baseline Fare</th>
                  <th className="py-3 px-2 text-center">Est. Time</th>
                  <th className="py-3 px-2">Major Operator Sacco</th>
                  <th className="py-3 px-2">Commuter Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {segments.map(seg => (
                  <tr key={seg.id} className="hover:bg-gray-50/50 transition duration-100">
                    <td className="py-3 px-2 font-bold text-[#1E3A5F]">{seg.origin}</td>
                    <td className="py-3 px-2 font-bold text-[#1E3A5F]">{seg.destination}</td>
                    <td className="py-3 px-2 text-center"><span className="bg-[#1E3A5F]/5 px-2 py-0.5 rounded font-bold text-[#1E3A5F]">{seg.routeNumber}</span></td>
                    <td className="py-3 px-2 text-center text-[#2E8B57] font-black">KES {seg.baseFare}</td>
                    <td className="py-3 px-2 text-center font-bold">{seg.typicalDurationMinutes} mins</td>
                    <td className="py-3 px-2 text-[#1E3A5F] font-semibold">{seg.operator}</td>
                    <td className="py-3 px-2 text-gray-500 italic text-[11px] font-medium">{seg.notes || "Standard path connection"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  )}

      {/* Footer system bar */}
      <footer id="footer-bento" className="bg-white border-t border-gray-200 mt-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest gap-2">
        <span>Nairobi, Kenya Metropolitan • 1.286° S, 36.817° E</span>
        <span>Offline USSD Mode Available: *483*92#</span>
        <span>Powered by Gemini 1.5 Pro & LangGraph Agent</span>
      </footer>

    </div>
  );
}
