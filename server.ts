import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { Stage, RouteSegment, CrowdsourcedReport, SMSSession, SimulationScenario, RouteQueryResult } from "./src/types";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google GenAI if API Key is available
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini GenAI successfully initialized.");
  } catch (error) {
    console.error("Error initializing Gemini API:", error);
  }
} else {
  console.log("GEMINI_API_KEY not configured or set to placeholder. Operating in simulated intelligence mode.");
}

// Global In-Memory Data Store (Nairobi Transit Knowledge Graph)
const STAGES: Stage[] = [
  { id: "kawangware", name: "Kawangware Stage", lat: -1.2828, lng: 36.7441, aliases: ["Kawangware", "Congo", "Precious Blood"] },
  { id: "prestige", name: "Prestige Stage", lat: -1.3005, lng: 36.7865, aliases: ["Prestige", "Adams Arcade", "Yaya Junction"] },
  { id: "corner", name: "Dagoretti Corner", lat: -1.3061, lng: 36.7612, aliases: ["Corner", "Dagoretti Corner Stage", "Junction"] },
  { id: "kencom", name: "Kencom/Archives", lat: -1.2843, lng: 36.8251, aliases: ["Kencom", "Archives", "CBD Kencom", "CBD Archives"] },
  { id: "railways", name: "Railways Stage", lat: -1.2892, lng: 36.8242, aliases: ["Railways", "CBD Railways"] },
  { id: "accrard", name: "Accra Road", lat: -1.2822, lng: 36.8291, aliases: ["Accra Rd", "Accra Stage", "Tearoom", "Ruai Stage"] },
  { id: "ngara", name: "Ngara Stage", lat: -1.2743, lng: 36.8275, aliases: ["Ngara", "KIE Stage", "Soko ya Ngara"] },
  { id: "outerring", name: "Outer Ring Interchange", lat: -1.2582, lng: 36.8791, aliases: ["Outer Ring", "Outerring", "Allsops"] },
  { id: "utawala", name: "Utawala Junction", lat: -1.3129, lng: 36.9538, aliases: ["Utawala", "Aviation", "Shooters"] },
  { id: "ruai", name: "Ruai Stage", lat: -1.2721, lng: 36.9831, aliases: ["Ruai", "Ruai Center", "Ruai bypass"] },
  { id: "githurai", name: "Githurai 45", lat: -1.2069, lng: 36.9080, aliases: ["Githurai", "Githurai 45 Stage", "45"] },
  { id: "kayole", name: "Kayole Stage", lat: -1.2891, lng: 36.9048, aliases: ["Kayole", "Soweto", "Masimba"] },
  { id: "rongai", name: "Rongai Stage", lat: -1.3972, lng: 36.7145, aliases: ["Rongai", "Ronga", "Tuskys Rongai", "Maasai Lodge"] }
];

const ROUTE_SEGMENTS: RouteSegment[] = [
  // Kawangware -> CBD Area
  { id: "kawangware-cbd", origin: "Kawangware Stage", destination: "Kencom/Archives", routeNumber: "46", baseFare: 80, typicalDurationMinutes: 35, operator: "Kawangware Travellers Sacco", notes: "Passes through Prestige and Ngong Rd." },
  { id: "corner-cbd", origin: "Dagoretti Corner", destination: "Kencom/Archives", routeNumber: "4W", baseFare: 70, typicalDurationMinutes: 30, operator: "Metro Trans", notes: "Ngong Rd corridor." },
  { id: "kawangware-corner", origin: "Kawangware Stage", destination: "Dagoretti Corner", routeNumber: "46", baseFare: 40, typicalDurationMinutes: 10, operator: "Kawangware Sacco" },

  // CBD Area -> Ruai
  { id: "cbd-ruai", origin: "Accra Road", destination: "Ruai Stage", routeNumber: "120", baseFare: 120, typicalDurationMinutes: 50, operator: "Ruai Trans", notes: "Thika Rd then bypass or Kangundo Rd. Highly dynamic." },
  { id: "cbd-ngara", origin: "Accra Road", destination: "Ngara Stage", routeNumber: "120", baseFare: 30, typicalDurationMinutes: 10, operator: "Ruai Sacco / Ngara Travellers" },
  { id: "ngara-outerring", origin: "Ngara Stage", destination: "Outer Ring Interchange", routeNumber: "120", baseFare: 50, typicalDurationMinutes: 15, operator: "Various" },
  { id: "outerring-ruai", origin: "Outer Ring Interchange", destination: "Ruai Stage", routeNumber: "120", baseFare: 80, typicalDurationMinutes: 25, operator: "Ruai Link Sacco" },

  // CBD -> Other places
  { id: "cbd-githurai", origin: "Accra Road", destination: "Githurai 45", routeNumber: "45", baseFare: 60, typicalDurationMinutes: 30, operator: "Githurai Travelers (45 Sacco)" },
  { id: "cbd-kayole", origin: "Kencom/Archives", destination: "Kayole Stage", routeNumber: "19C", baseFare: 70, typicalDurationMinutes: 40, operator: "Pinpoint Sacco / Double M", notes: "Jogoo Rd route, heavy rush hour delays." },
  { id: "cbd-rongai", origin: "Railways Stage", destination: "Rongai Stage", routeNumber: "125", baseFare: 100, typicalDurationMinutes: 55, operator: "Oromats Sacco / Starbus", notes: "Mbagathi Way -> Langata Rd. Infamous for loud mathrees and police checks." }
];

// Seed active Crowdsourced Reports
let crowdsourcedReports: CrowdsourcedReport[] = [
  {
    id: "rep-1",
    stage: "Kencom/Archives",
    status: "congested",
    fareMultiplier: 1.3,
    confidence: 0.92,
    description: "Msururu mrefu pale Archives upande wa Ruai 120, kumejaa sana",
    timestamp: new Date().toISOString(),
    reporterReputation: 0.95,
  },
  {
    id: "rep-2",
    stage: "Ngara Stage",
    status: "normal",
    fareMultiplier: 1.0,
    confidence: 0.85,
    description: "Ngara kuko sawa, magari yanaingia town bila shida",
    timestamp: new Date().toISOString(),
    reporterReputation: 0.88,
  }
];

// Sessions keyed by Phone Number
const smsSessions: Record<string, SMSSession> = {};

// Active Simulation Scenario
let currentScenario: SimulationScenario = "NORMAL";

// Helper tool executables
function getNearbyStages(lat: number, lng: number) {
  // Simple bounding distance formula
  return STAGES.map(stage => {
    const dist = Math.sqrt(Math.pow(stage.lat - lat, 2) + Math.pow(stage.lng - lng, 2)) * 111; // simple km conversion
    return { ...stage, distanceKm: parseFloat(dist.toFixed(2)) };
  }).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 4);
}

function getHistoricalRouteSegments(origin: string, destination: string) {
  const norm = (val: string) => val.toLowerCase().replace(/ stage/i, "").trim();
  const oNorm = norm(origin);
  const dNorm = norm(destination);

  // Match direct segments
  return ROUTE_SEGMENTS.filter(seg => {
    const segONorm = norm(seg.origin);
    const segDNorm = norm(seg.destination);
    // Exact or direct alias contains
    return (segONorm.includes(oNorm) || oNorm.includes(segONorm)) &&
           (segDNorm.includes(dNorm) || dNorm.includes(segDNorm));
  });
}

function getRealtimeCrowdsourcedReports(stageName: string) {
  const norm = (val: string) => val.toLowerCase().replace(/ stage/i, "").trim();
  const sNorm = norm(stageName);

  return crowdsourcedReports.filter(rep => {
    return norm(rep.stage).includes(sNorm) || sNorm.includes(norm(rep.stage));
  });
}

function calculateTransferDistance(stageA: string, stageB: string) {
  // Find in STAGES
  const norm = (val: string) => val.toLowerCase().replace(/ stage/i, "").trim();
  const stA = STAGES.find(s => norm(s.name).includes(norm(stageA)) || norm(stageA).includes(norm(s.name)));
  const stB = STAGES.find(s => norm(s.name).includes(norm(stageB)) || norm(stageB).includes(norm(s.name)));

  if (stA && stB) {
    const dist = Math.sqrt(Math.pow(stA.lat - stB.lat, 2) + Math.pow(stA.lng - stB.lng, 2)) * 111;
    return parseFloat(dist.toFixed(2));
  }
  return 0.5; // CBD default transfer distance if unknown
}

function estimateDynamicFare(route: RouteSegment, timeContext: string, activeMultiplier: number = 1.0) {
  let baseMultiplier = 1.0;
  
  // Apply Scenario Multipliers
  if (currentScenario === "RUSH_HOUR") {
    baseMultiplier = 1.4;
  } else if (currentScenario === "RAINY_DAY") {
    baseMultiplier = 1.8;
  } else if (currentScenario === "CRACKDOWN") {
    // Fares spike due to fewer vehicles
    baseMultiplier = 1.3;
  }

  const calculated = Math.ceil(route.baseFare * baseMultiplier * activeMultiplier);
  // Round to nearest 10 or 50 KES
  return Math.ceil(calculated / 10) * 10;
}

function detectDisruptions(routeSegmentId: string) {
  const segment = ROUTE_SEGMENTS.find(r => r.id === routeSegmentId);
  if (!segment) return [];

  const disruptions: string[] = [];

  // Active reports around segments
  const originReports = getRealtimeCrowdsourcedReports(segment.origin);
  const destReports = getRealtimeCrowdsourcedReports(segment.destination);

  [...originReports, ...destReports].forEach(rep => {
    if (rep.status !== "normal") {
      disruptions.push(`${rep.status.toUpperCase()} at ${rep.stage}: ${rep.description}`);
    }
  });

  // Scenario specific disruptions
  if (currentScenario === "RUSH_HOUR") {
    disruptions.push("Heavy evening traffic bottleneck on all major routes leading out of CBD");
  } else if (currentScenario === "RAINY_DAY") {
    disruptions.push("Substantial flooding near Globe Roundabout and Accra Road causing static traffic logs");
  } else if (currentScenario === "CRACKDOWN") {
    if (segment.origin.toLowerCase().includes("kawangware") || segment.destination.toLowerCase().includes("kencom")) {
      disruptions.push("POLICE OPERATION: Sacco crackdown on Ngong Road. Commuters being dropped early near Kilimani.");
    }
  }

  // De-duplicate
  return Array.from(new Set(disruptions));
}

function retrieveTemporalEmbeddings(timeContext: string) {
  // Simulated semantic lookup depending on scenario
  if (currentScenario === "RUSH_HOUR") {
    return "Commuter surge. Archives is congested. Mathrees charging double fare. Alternatives suggested via walking to Tea Room.";
  }
  if (currentScenario === "RAINY_DAY") {
    return "Heavy rain has flooded key intersections. Archives and Nairobi River paths are extremely muddy. Transit speeds down 60%.";
  }
  if (currentScenario === "CRACKDOWN") {
    return "Traffic police checkpoints at Prestige. Unlicensed mathrees refusing Ngong Rd runs. Normal security checks on other pathways.";
  }
  return "Sunny afternoon conditions. Transit flow is optimal. Commuter volumes are standard.";
}

// Scenario applicator helper
function setScenarioData(scenario: SimulationScenario) {
  currentScenario = scenario;
  // Clear out old simulation reports
  crowdsourcedReports = crowdsourcedReports.filter(r => !r.isSimulation);

  if (scenario === "RUSH_HOUR") {
    crowdsourcedReports.push({
      id: "sim-1",
      stage: "Kencom/Archives",
      status: "congested",
      fareMultiplier: 1.5,
      confidence: 0.95,
      description: "Foleni kubwa mno hadi Railways. Magari yanaenda polepole, hakuna gari za 46",
      timestamp: new Date().toISOString(),
      reporterReputation: 0.99,
      isSimulation: true
    });
    crowdsourcedReports.push({
      id: "sim-2",
      stage: "Accra Road",
      status: "congested",
      fareMultiplier: 1.4,
      confidence: 0.90,
      description: "Watu wengi sana Accra Road wa kwenda Ruai. Magari yanachelewa kufika Globe Roundabout",
      timestamp: new Date().toISOString(),
      reporterReputation: 0.82,
      isSimulation: true
    });
  } else if (scenario === "RAINY_DAY") {
    crowdsourcedReports.push({
      id: "sim-3",
      stage: "Kencom/Archives",
      status: "rain_disruption",
      fareMultiplier: 2.0,
      confidence: 0.97,
      description: "Mvua kubwa imemwagika Nairobi! Archives kumenyesha, barabara imefurika. Fare dabo dabo!",
      timestamp: new Date().toISOString(),
      reporterReputation: 0.96,
      isSimulation: true
    });
    crowdsourcedReports.push({
      id: "sim-4",
      stage: "Outer Ring Interchange",
      status: "rain_disruption",
      fareMultiplier: 1.7,
      confidence: 0.89,
      description: "Outer Ring Allsops kuna kigugumizi, maji imejaa kwa bypass",
      timestamp: new Date().toISOString(),
      reporterReputation: 0.77,
      isSimulation: true
    });
  } else if (scenario === "CRACKDOWN") {
    crowdsourcedReports.push({
      id: "sim-5",
      stage: "Prestige Stage",
      status: "police_crackdown",
      fareMultiplier: 1.3,
      confidence: 0.98,
      description: "Cop ALERT: Ngong Road kuna crackdown kubwa. Mathree nyingi zinaepuka barabara, andazi sana!",
      timestamp: new Date().toISOString(),
      reporterReputation: 0.94,
      isSimulation: true
    });
    crowdsourcedReports.push({
      id: "sim-6",
      stage: "Accra Road",
      status: "normal",
      fareMultiplier: 1.0,
      confidence: 0.80,
      description: "Njia ya Ruai iko shwari bila kizuizi",
      timestamp: new Date().toISOString(),
      reporterReputation: 0.89,
      isSimulation: true
    });
  }
}

// Heuristic route calculator fallback/helper
function resolveRouteWithAgentLogic(origin: string, destination: string): RouteQueryResult {
  const norm = (tag: string) => tag.toLowerCase();
  const o = norm(origin);
  const d = norm(destination);

  console.log(`Executing local routing reasoning loop for route: ${origin} -> ${destination}`);

  // Hops and reasoning history setup
  const reasoning_hops: Array<{ step: number; activity: string; description: string; agentState?: string }> = [];
  let stepCounter = 1;

  reasoning_hops.push({
    step: stepCounter++,
    activity: "Parse Commuter Intent",
    description: `Targeting transit path from '${origin}' to '${destination}' under current scenario [${currentScenario}]`,
    agentState: "Seeking Origin Stage Candidates"
  });

  // Identify nearby stages
  const originCandidates = STAGES.filter(s => s.aliases.some(a => norm(a).includes(o) || o.includes(norm(a))));
  const destCandidates = STAGES.filter(s => s.aliases.some(a => norm(a).includes(d) || d.includes(norm(a))));

  const originStage = originCandidates[0] || STAGES.find(s => s.id === "kawangware")!;
  const destStage = destCandidates[0] || STAGES.find(s => s.id === "ruai")!;

  reasoning_hops.push({
    step: stepCounter++,
    activity: "Identify Nearby Stages",
    description: `Selected Best Match Origin: "${originStage.name}" (${originStage.lat}, ${originStage.lng}) and Destination: "${destStage.name}" (${destStage.lat}, ${destStage.lng})`,
    agentState: "Retrieving Segment Context"
  });

  // Fetch temporal context report
  const temporalContextText = retrieveTemporalEmbeddings(new Date().toISOString());
  reasoning_hops.push({
    step: stepCounter++,
    activity: "Retrieve Temporal Embeddings",
    description: `Temporal environmental contextualization: "${temporalContextText}"`,
    agentState: "Analyzing Live Crowdsourced Feedback"
  });

  // Check live reports for stages
  const targetStagesForReports = [originStage.name, "Kencom/Archives", "Accra Road", destStage.name];
  const activeFeedback: string[] = [];
  let heaviestMultiplier = 1.0;

  targetStagesForReports.forEach(st => {
    const reps = getRealtimeCrowdsourcedReports(st);
    reps.forEach(r => {
      activeFeedback.push(`[${r.status}] at ${r.stage}: ${r.description} (Multiplier: ${r.fareMultiplier}x)`);
      if (r.fareMultiplier > heaviestMultiplier) {
        heaviestMultiplier = r.fareMultiplier;
      }
    });
  });

  reasoning_hops.push({
    step: stepCounter++,
    activity: "Fetch Near Real-Time Reports",
    description: `Queried reports database. Extracted ${activeFeedback.length} active updates:\n` + (activeFeedback.length > 0 ? activeFeedback.join(" | ") : "Optimal flow reports across segments"),
    agentState: "Multi-Hop Traversal Simulation"
  });

  // Multi-hop solver (Standard Kawangware to Ruai multi-hop vs options)
  const isKawangwareToRuai = (originStage.id === "kawangware" || originStage.id === "prestige" || originStage.id === "corner") && 
                             (destStage.id === "ruai" || destStage.id === "utawala");
  const isNormalCbdTransit = !isKawangwareToRuai && (destStage.id !== "kencom" && destStage.id !== "railways" && destStage.id !== "accrard");

  const finalHops: RouteQueryResult["hops"] = [];
  let confidence = 0.92;
  const detected_disruptions: string[] = [];

  if (isKawangwareToRuai) {
    // Hop 1: Kawangware to CBD (Archives/Kencom)
    const seg1 = ROUTE_SEGMENTS.find(r => r.id === "kawangware-cbd")!;
    const dis1 = detectDisruptions(seg1.id);
    dis1.forEach(d => detected_disruptions.push(d));

    // Fare estimation
    const fare1 = estimateDynamicFare(seg1, new Date().toISOString(), heaviestMultiplier);

    finalHops.push({
      type: "transit",
      from: originStage.name,
      to: "Kencom/Archives",
      route: seg1.routeNumber,
      fareEstimate: fare1,
      durationMinutes: currentScenario === "RUSH_HOUR" ? 55 : currentScenario === "RAINY_DAY" ? 70 : 35,
      disruptions: dis1
    });

    // Hop 2: CBD Walking transition (Archives to Accra Rd)
    const walkDistance = calculateTransferDistance("Kencom/Archives", "Accra Road");
    let walkDisruption: string[] = [];
    if (currentScenario === "RAINY_DAY") {
      walkDisruption.push("Nairobi River drainage flooded, pathways very muddy. Use Accra Rd standard sidewalks.");
    }

    finalHops.push({
      type: "walk",
      from: "Kencom/Archives",
      to: "Accra Road",
      fareEstimate: 0,
      durationMinutes: currentScenario === "RAINY_DAY" ? 12 : 6,
      disruptions: walkDisruption
    });

    // Hop 3: Accra Road to Ruai Stage
    const seg2 = ROUTE_SEGMENTS.find(r => r.id === "cbd-ruai")!;
    const dis2 = detectDisruptions(seg2.id);
    dis2.forEach(d => detected_disruptions.push(d));

    const fare2 = estimateDynamicFare(seg2, new Date().toISOString(), heaviestMultiplier);

    finalHops.push({
      type: "transit",
      from: "Accra Road",
      to: destStage.name,
      route: seg2.routeNumber,
      fareEstimate: fare2,
      durationMinutes: currentScenario === "RUSH_HOUR" ? 75 : currentScenario === "RAINY_DAY" ? 95 : 50,
      disruptions: dis2
    });

    // Confidence penalties
    if (currentScenario === "RAINY_DAY") {
      confidence -= 0.15;
    }
    if (currentScenario === "CRACKDOWN") {
      confidence -= 0.10;
    }
    if (currentScenario === "RUSH_HOUR") {
      confidence -= 0.05;
    }

    reasoning_hops.push({
      step: stepCounter++,
      activity: "Simulate Walking Transition & Multi-Hop Segments",
      description: `Discovered Accra Road transfer needed (${walkDistance}km walking). Traced path segments & checked dynamic restrictions. Calculated final route confidence score: ${confidence.toFixed(2)}`,
      agentState: "Assembling Final Route Recommendations"
    });

    // Build perfect localized mzee SMS response
    let sms_response = "";
    if (currentScenario === "NORMAL") {
      sms_response = `Panda mat ya Kawangware Route 46 hadi Gen Archives (80 KES). Tembea Nairobi Accra Rd. Panda Ruai Route 120 (120 KES). Njia swari! Mzee out.`;
    } else if (currentScenario === "RUSH_HOUR") {
      sms_response = `Panda mat ya Kawangware CBD (Route 46). Shuka Archives. Tembea haraka upande wa Accra Rd, fika mapema kuzuia msongamano. Mat 120 ya Ruai ni 160 KES juu ya rush hour. Pila shaka!`;
    } else if (currentScenario === "RAINY_DAY") {
      sms_response = `Mvua imeleta balaa town. Panda ya Kawangware mapema (KES 150). Shuka Archives, tembea kwa uangalifu upande wa Accra Road kwasababu ya matope. Nauli ya Ruai imepanda sana, fare est KES 200-220. Kuvumilia ndio msingi!`;
    } else if (currentScenario === "CRACKDOWN") {
      sms_response = `Ngong Rd inadaiwa crackdown kubwa ya polisi! Kwa usalama wako, panda route mbadala au shuka Adams Arcade badala ya kuelekea Prestige. Archives fika uende Accra Rd upande Ruai (Route 120, KES 120). Ka mshikemshike!`;
    }

    const totalFare = finalHops.reduce((sum, h) => sum + h.fareEstimate, 0);

    return {
      telemetry: {
        total_estimated_fare: totalFare,
        confidence_score: parseFloat(confidence.toFixed(2)),
        hops_count: finalHops.filter(h => h.type === "transit").length,
        detected_disruptions: Array.from(new Set(detected_disruptions))
      },
      sms_response,
      reasoning_hops,
      hops: finalHops
    };

  } else {
    // Generic routing engine logic for other route selections
    // e.g. Kawangware to Rongai, CBD to Githurai
    const directRoute = ROUTE_SEGMENTS.find(r => {
      const segONorm = norm(r.origin);
      const segDNorm = norm(r.destination);
      return (segONorm.includes(o) || o.includes(segONorm)) && (segDNorm.includes(d) || d.includes(segDNorm));
    });

    if (directRoute) {
      const tfare = estimateDynamicFare(directRoute, new Date().toISOString(), heaviestMultiplier);
      const dis = detectDisruptions(directRoute.id);
      dis.forEach(d => detected_disruptions.push(d));

      finalHops.push({
        type: "transit",
        from: originStage.name,
        to: destStage.name,
        route: directRoute.routeNumber,
        fareEstimate: tfare,
        durationMinutes: directRoute.typicalDurationMinutes * (currentScenario === "RUSH_HOUR" ? 1.5 : currentScenario === "RAINY_DAY" ? 2.0 : 1.0),
        disruptions: dis
      });

      reasoning_hops.push({
        step: stepCounter++,
        activity: "Evaluate Direct Segment Route",
        description: `Determined high reliability single-leg track using Route ${directRoute.routeNumber} direct.`,
        agentState: "Completed Route Logic Integration"
      });

      return {
        telemetry: {
          total_estimated_fare: tfare,
          confidence_score: 0.95,
          hops_count: 1,
          detected_disruptions: Array.from(new Set(detected_disruptions))
        },
        sms_response: `Panda mat ${directRoute.routeNumber} kutoka ${originStage.name} hadi ${destStage.name}. Fare est KES ${tfare}. Safari njema! mzee amethibitisha.`,
        reasoning_hops,
        hops: finalHops
      };
    } else {
      // Direct leg not found. Attempt CBD Hub transition.
      // Origin -> CBD -> Destination
      const originToCbd = ROUTE_SEGMENTS.find(r => norm(r.origin).includes(o) && norm(r.destination).includes("kencom"));
      const cbdToDest = ROUTE_SEGMENTS.find(r => (norm(r.origin).includes("accra") || norm(r.origin).includes("railways")) && norm(r.destination).includes(d));

      if (originToCbd && cbdToDest) {
        const fare1 = estimateDynamicFare(originToCbd, new Date().toISOString(), heaviestMultiplier);
        const fare2 = estimateDynamicFare(cbdToDest, new Date().toISOString(), heaviestMultiplier);
        const dis1 = detectDisruptions(originToCbd.id);
        const dis2 = detectDisruptions(cbdToDest.id);

        dis1.forEach(d => detected_disruptions.push(d));
        dis2.forEach(d => detected_disruptions.push(d));

        finalHops.push({
          type: "transit",
          from: originStage.name,
          to: originToCbd.destination,
          route: originToCbd.routeNumber,
          fareEstimate: fare1,
          durationMinutes: originToCbd.typicalDurationMinutes,
          disruptions: dis1
        });

        finalHops.push({
          type: "walk",
          from: originToCbd.destination,
          to: cbdToDest.origin,
          fareEstimate: 0,
          durationMinutes: 8,
          disruptions: []
        });

        finalHops.push({
          type: "transit",
          from: cbdToDest.origin,
          to: destStage.name,
          route: cbdToDest.routeNumber,
          fareEstimate: fare2,
          durationMinutes: cbdToDest.typicalDurationMinutes,
          disruptions: dis2
        });

        reasoning_hops.push({
          step: stepCounter++,
          activity: "Reconstruct CBD Hub Two-Hop Route",
          description: `Discovered composite multi-hop routing using CBD Kencom/Railways to Accra Rd walking transfer.`,
          agentState: "Ready to answer query"
        });

        return {
          telemetry: {
            total_estimated_fare: fare1 + fare2,
            confidence_score: 0.88,
            hops_count: 2,
            detected_disruptions: Array.from(new Set(detected_disruptions))
          },
          sms_response: `Panda ${originToCbd.routeNumber} hadi CBD. Transfer upande wa terminal nyingine, basi panda ${cbdToDest.routeNumber} hadi ${destStage.name}. Total Fare est KES ${fare1 + fare2}. mzee out.`,
          reasoning_hops,
          hops: finalHops
        };
      }
    }
  }

  // Double fallback generic
  return {
    telemetry: {
      total_estimated_fare: 150,
      confidence_score: 0.60,
      hops_count: 1,
      detected_disruptions: ["No verified connection. Expressing uncertainty."]
    },
    sms_response: `Mzee hana uhakika wa route hii bado. Panda mat ya CBD kisha uulize dereva wa Accra Rd au Railways njia rahisi ya kufika huko weza. Hakikisha nauli kwanza!`,
    reasoning_hops,
    hops: [
      {
        type: "transit",
        from: origin,
        to: "CBD Hub",
        route: "Direct/Town",
        fareEstimate: 80,
        durationMinutes: 45,
        disruptions: ["Traffic alerts may apply"]
      }
    ]
  };
}

// REST APIs
// 1. Process Route Query using Gemini (or fallback)
app.post("/api/mzee/query", async (req, res) => {
  const { origin, destination } = req.body;
  if (!origin || !destination) {
    return res.status(400).json({ error: "Origin and destination are required" });
  }

  // Pre-calculate the structure using local helper (which ensures accuracy of segment mapping)
  const solvedStructure = resolveRouteWithAgentLogic(origin, destination);

  // If Gemini client is running, we enrich the response and rewrite the SMS/Reasoning steps to sound exactly like an expert
  if (ai) {
    try {
      console.log("Calling Gemini 3.5 Flash to synthesize expert route guidance...");
      const schemaPrompt = `
        You are "Mzee", the expert AI transit agent of Nairobi.
        Using the following current simulation scenario: "${currentScenario}"
        And these real-time environmental context details: "${retrieveTemporalEmbeddings(new Date().toISOString())}"
        
        The user wants to navigate from "${origin}" to "${destination}".
        We have calculated the following draft route structure:
        ${JSON.stringify(solvedStructure, null, 2)}

        Refine this route guidance. Produce a highly authentic, localized Kamba/Kikuyu/Sheng Kenyan commuter SMS response (sms_response) and detailed telemetry.
        Never fabricate routes if confidence should be low. Maintain localized transport terms (Panda, Shuka, Stage, Mathree, CBD, Archives, Accra Rd, Mshikemshike).
        
        Your output MUST be a strict JSON matching this format:
        {
          "telemetry": {
            "total_estimated_fare": number,
            "confidence_score": number,
            "hops_count": number,
            "detected_disruptions": [string]
          },
          "sms_response": "kenyan localized sms string",
          "reasoning_hops_enrichment": [
            {
              "step": number,
              "activity": "string value describing the step",
              "description": "rich details of mzee's internal agent reasoning"
            }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: schemaPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              telemetry: {
                type: Type.OBJECT,
                properties: {
                  total_estimated_fare: { type: Type.INTEGER },
                  confidence_score: { type: Type.NUMBER },
                  hops_count: { type: Type.INTEGER },
                  detected_disruptions: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["total_estimated_fare", "confidence_score", "hops_count", "detected_disruptions"]
              },
              sms_response: { type: Type.STRING },
              reasoning_hops_enrichment: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step: { type: Type.INTEGER },
                    activity: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["step", "activity", "description"]
                }
              }
            },
            required: ["telemetry", "sms_response", "reasoning_hops_enrichment"]
          }
        }
      });

      const resultText = response.text;
      if (resultText) {
        const enriched = JSON.parse(resultText);
        // Replace our telemetry and sms_response with Gemini's high quality output
        solvedStructure.telemetry = enriched.telemetry;
        solvedStructure.sms_response = enriched.sms_response;
        if (enriched.reasoning_hops_enrichment && enriched.reasoning_hops_enrichment.length > 0) {
          solvedStructure.reasoning_hops = enriched.reasoning_hops_enrichment;
        }
        console.log("Successfully enriched routing query via Gemini.");
      }
    } catch (error) {
      console.error("Failed to query Gemini, returning standard heuristic route solver values:", error);
    }
  }

  return res.json(solvedStructure);
});

// 2. Crowdsourced SMS Webhook Ingestion Pipeline
app.post("/api/crowdsource/webhook", async (req, res) => {
  const { from, message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "SMS message text is required" });
  }

  console.log(`Webhook Ingress active: SMS received from ${from || "Anonymous"}: "${message}"`);

  // Default initial parsing
  let parsedStage = "Kencom/Archives";
  let parsedStatus: CrowdsourcedReport["status"] = "normal";
  let parsedFareMultiplier = 1.0;
  let parsedConfidence = 0.70;
  let extractedDescription = message;

  // Use Gemini Flash to extract entities dynamically if active
  if (ai) {
    try {
      console.log("Analyzing crowdsourced report text using Gemini Flash...");
      const entityPrompt = `
        Analyze this crowdsourced commuter SMS report from Nairobi Kenya:
        "${message}"

        Extract:
        1. "stage": Best matching stage name from: "Kawangware Stage", "Prestige Stage", "Dagoretti Corner", "Kencom/Archives", "Railways Stage", "Accra Road", "Ngara Stage", "Outer Ring Interchange", "Utawala Junction", "Ruai Stage", "Githurai 45", "Kayole Stage", "Rongai Stage".
        2. "status": State category of the transport. Select ONLY one of: "normal", "congested", "police_crackdown", "rain_disruption", "heavy_fare".
        3. "fare_multiplier": Estimated price increase factor (parseFloat, e.g., 1.0, 1.5, 2.0).
        4. "confidence": Extraction confidence from 0.0 to 1.0.

        Your output MUST be a strict JSON structure:
        {
          "stage": "extracted stage name",
          "status": "extracted status",
          "fare_multiplier": 1.5,
          "confidence": 0.85
        }
      `;

      const geminiRes = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: entityPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              stage: { type: Type.STRING },
              status: { type: Type.STRING },
              fare_multiplier: { type: Type.NUMBER },
              confidence: { type: Type.NUMBER }
            },
            required: ["stage", "status", "fare_multiplier", "confidence"]
          }
        }
      });

      const extracted = JSON.parse(geminiRes.text.trim());
      parsedStage = extracted.stage || parsedStage;
      parsedStatus = extracted.status || parsedStatus;
      parsedFareMultiplier = extracted.fare_multiplier || parsedFareMultiplier;
      parsedConfidence = extracted.confidence || parsedConfidence;
      console.log("Extraction successful via Gemini:", extracted);
    } catch (err) {
      console.error("Gemini report extraction failed, falling back to regex match:", err);
      // Fallback regex matching
      const msgLower = message.toLowerCase();
      if (msgLower.includes("kawangware")) parsedStage = "Kawangware Stage";
      else if (msgLower.includes("prestige")) parsedStage = "Prestige Stage";
      else if (msgLower.includes("corner")) parsedStage = "Dagoretti Corner";
      else if (msgLower.includes("ruai")) parsedStage = "Ruai Stage";
      else if (msgLower.includes("accra")) parsedStage = "Accra Road";
      else if (msgLower.includes("archives") || msgLower.includes("kencom")) parsedStage = "Kencom/Archives";
      else if (msgLower.includes("rongai")) parsedStage = "Rongai Stage";

      if (msgLower.includes("polisi") || msgLower.includes("cop") || msgLower.includes("crackdown") || msgLower.includes("shika")) {
        parsedStatus = "police_crackdown";
        parsedFareMultiplier = 1.3;
      } else if (msgLower.includes("mvua") || msgLower.includes("rain") || msgLower.includes("flooded") || msgLower.includes("maji")) {
        parsedStatus = "rain_disruption";
        parsedFareMultiplier = 1.8;
      } else if (msgLower.includes("traffic") || msgLower.includes("jam") || msgLower.includes("congest") || msgLower.includes("imejaa")) {
        parsedStatus = "congested";
        parsedFareMultiplier = 1.4;
      } else if (msgLower.includes("fare") || msgLower.includes("nauli") || msgLower.includes("dabo")) {
        parsedStatus = "heavy_fare";
        parsedFareMultiplier = 1.5;
      }
    }
  }

  // Create real Crowdsourced Report item and persist to our store!
  const newReport: CrowdsourcedReport = {
    id: "rep-webhook-" + Math.random().toString(36).substring(7),
    stage: parsedStage,
    status: parsedStatus,
    fareMultiplier: parsedFareMultiplier,
    confidence: parseFloat(parsedConfidence.toFixed(2)),
    description: message,
    timestamp: new Date().toISOString(),
    reporterReputation: from === "trusted-operator" ? 0.98 : 0.72,
    isSimulation: true // Treat ingested reports as simulation markers for cleanup ease
  };

  crowdsourcedReports.unshift(newReport);

  return res.json({
    status: "success",
    message: "Crowdsourced report parsed and ingested successfully into route graph",
    ingested_report: newReport
  });
});

// 3. Stateful SMS Session Management (Redis Simulation)
app.post("/api/sms/session", async (req, res) => {
  const { phoneNumber, message } = req.body;
  if (!phoneNumber || !message) {
    return res.status(400).json({ error: "phoneNumber and message are required" });
  }

  // Retrieve or create session
  if (!smsSessions[phoneNumber]) {
    smsSessions[phoneNumber] = {
      phoneNumber,
      state: "AWAITING_ORIGIN_DEST",
      history: []
    };
  }

  const session = smsSessions[phoneNumber];
  session.history.push({ sender: "user", text: message, timestamp: new Date().toISOString() });

  let responseText = "";

  // Perform Agent State reasoning logic
  if (session.state === "AWAITING_ORIGIN_DEST") {
    // Attempt to extract origin and destination
    const cleanMsg = message.toLowerCase();
    
    // Simple lookups or extraction
    let originMatch = "";
    let destMatch = "";

    // Search for known stages in message
    STAGES.forEach(st => {
      st.aliases.forEach(alias => {
        if (cleanMsg.includes(alias.toLowerCase())) {
          if (!originMatch) {
            originMatch = st.name;
          } else if (!destMatch && st.name !== originMatch) {
            destMatch = st.name;
          }
        }
      });
    });

    if (originMatch && destMatch) {
      // Direct match
      session.routeContext = { origin: originMatch, destination: destMatch };
      const solved = resolveRouteWithAgentLogic(originMatch, destMatch);
      responseText = solved.sms_response;
      session.state = "IDLE";
    } else if (originMatch) {
      // Has origin but lacks destination
      session.routeContext = { origin: originMatch };
      responseText = `Mzee amepata umeanza safari kutoka ${originMatch}. Unasafiri kuelekea wapi haswa?`;
      session.state = "AWAITING_CLARIFICATION";
    } else {
      // No stages matched
      responseText = `Habari! Mimi ni Mzee, Route Agent wako wa Nairobi. Unataka kusafiri kutoka wapi kwenda wapi hivi sasa? (Mfano: 'Niko Kawangware naenda Ruai')`;
    }
  } else if (session.state === "AWAITING_CLARIFICATION") {
    // Process clarification reply
    if (session.routeContext?.origin) {
      const originMatch = session.routeContext.origin;
      const cleanMsg = message.toLowerCase();
      let destMatch = "";

      STAGES.forEach(st => {
        st.aliases.forEach(alias => {
          if (cleanMsg.includes(alias.toLowerCase())) {
            destMatch = st.name;
          }
        });
      });

      if (destMatch) {
        session.routeContext.destination = destMatch;
        const solved = resolveRouteWithAgentLogic(originMatch, destMatch);
        responseText = solved.sms_response;
        session.state = "IDLE";
      } else {
        responseText = `Mzee hajatambua mahali hapo kwa sasa. Tafadhali sema stesheni yako ya mwisho kama Ruai, Githurai, au CBD.`;
      }
    } else {
      session.state = "AWAITING_ORIGIN_DEST";
      responseText = `Tunaanza upya. Unasafiri kutoka stesheni gani kuelekea wapi?`;
    }
  } else {
    // IDLE state - treating any new query as fresh
    session.state = "AWAITING_ORIGIN_DEST";
    const cleanMsg = message.toLowerCase();
    let originMatch = "";
    let destMatch = "";

    STAGES.forEach(st => {
      st.aliases.forEach(alias => {
        if (cleanMsg.includes(alias.toLowerCase())) {
          if (!originMatch) {
            originMatch = st.name;
          } else if (!destMatch && st.name !== originMatch) {
            destMatch = st.name;
          }
        }
      });
    });

    if (originMatch && destMatch) {
      session.routeContext = { origin: originMatch, destination: destMatch };
      const solved = resolveRouteWithAgentLogic(originMatch, destMatch);
      responseText = solved.sms_response;
      session.state = "IDLE";
    } else {
      responseText = `Mzee amesikia. Unataka kufanya search nyingine? Hebu niambie stesheni yako ya sasa na kule unakoenda.`;
    }
  }

  session.history.push({ sender: "mzee", text: responseText, timestamp: new Date().toISOString() });
  session.lastResponse = responseText;

  return res.json({
    session_phoneNumber: phoneNumber,
    current_state: session.state,
    response: responseText,
    history: session.history
  });
});

// 4. Get System Status & Knowledge Base States
app.get("/api/system/status", (req, res) => {
  return res.json({
    currentScenario,
    stagesCount: STAGES.length,
    activeReportsCount: crowdsourcedReports.length,
    activeSessionsCount: Object.keys(smsSessions).length,
    stages: STAGES,
    reports: crowdsourcedReports,
    routeSegments: ROUTE_SEGMENTS,
    geminiStatus: ai ? "ACTIVE_SECURE" : "SIMULATED_INTELLIGENCE"
  });
});

// 5. Update/Toggle Simulation Scenarios
app.post("/api/simulation/state", (req, res) => {
  const { scenario } = req.body;
  if (!scenario || !["NORMAL", "RUSH_HOUR", "RAINY_DAY", "CRACKDOWN"].includes(scenario)) {
    return res.status(400).json({ error: "Invalid scenario specifier" });
  }

  setScenarioData(scenario as SimulationScenario);
  console.log(`System simulation shifted to scenario: ${scenario}`);
  return res.json({
    status: "success",
    currentScenario,
    activeReportsCount: crowdsourcedReports.length
  });
});

// Serve Frontend Vite connection
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
