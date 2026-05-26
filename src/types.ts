export interface Stage {
  id: string;
  name: string;
  lat: number;
  lng: number;
  aliases: string[];
}

export interface RouteSegment {
  id: string;
  origin: string; // Stage ID or Name
  destination: string; // Stage ID or Name
  routeNumber: string; // e.g. "46", "120"
  baseFare: number;
  typicalDurationMinutes: number;
  operator: string;
  notes?: string;
}

export interface CrowdsourcedReport {
  id: string;
  stage: string; // Stage Name/ID
  status: 'normal' | 'congested' | 'police_crackdown' | 'rain_disruption' | 'heavy_fare';
  fareMultiplier: number;
  confidence: number;
  description: string;
  timestamp: string; // ISO String
  reporterReputation: number; // 0 to 1
  isSimulation?: boolean;
}

export interface SMSSession {
  phoneNumber: string;
  state: 'AWAITING_ORIGIN_DEST' | 'AWAITING_CLARIFICATION' | 'IDLE';
  lastQuery?: string;
  routeContext?: {
    origin?: string;
    destination?: string;
  };
  lastResponse?: string;
  history: Array<{ sender: 'user' | 'mzee'; text: string; timestamp: string }>;
}

export type SimulationScenario = 'NORMAL' | 'RUSH_HOUR' | 'RAINY_DAY' | 'CRACKDOWN';

export interface RouteQueryResult {
  telemetry: {
    total_estimated_fare: number;
    confidence_score: number;
    hops_count: number;
    detected_disruptions: string[];
  };
  sms_response: string;
  reasoning_hops: Array<{
    step: number;
    activity: string;
    description: string;
    agentState?: string;
  }>;
  hops: Array<{
    type: 'transit' | 'walk';
    from: string;
    to: string;
    route?: string;
    fareEstimate: number;
    durationMinutes: number;
    disruptions: string[];
  }>;
}
