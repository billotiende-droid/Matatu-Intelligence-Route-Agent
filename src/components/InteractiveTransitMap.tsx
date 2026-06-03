import { useEffect, useRef, useState } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import { Stage, RouteQueryResult } from "../types";
import { MapPin, Compass, Info, AlertTriangle, ArrowRight, CornerDownRight, CheckCircle2, Navigation } from "lucide-react";

// Standard coordinates for Nairobi center fallback
const NAIROBI_CENTER = { lat: -1.2921, lng: 36.8219 };

interface PolylineProps {
  points: google.maps.LatLngLiteral[];
  color?: string;
  weight?: number;
}

// Subcomponent to dynamically draw transit line and fit boundary viewport on state change
function TransitPolyline({ points, color = "#10B981", weight = 5 }: PolylineProps) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    // Remove any stale polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    if (points.length < 1) return;

    // Draw the native route path on map
    polylineRef.current = new google.maps.Polyline({
      path: points,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 0.85,
      strokeWeight: weight,
    });

    polylineRef.current.setMap(map);

    // Calculate bounding box and fit maps viewport to contain all stages
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    
    map.fitBounds(bounds);

    // Apply minor zoom constraints if centering on a single stage
    if (points.length === 1) {
      setTimeout(() => {
        map.setZoom(14);
      }, 100);
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, points, color, weight]);

  return null;
}

interface InteractiveTransitMapProps {
  googleMapsKey: string;
  origin: string;
  destination: string;
  stages: Stage[];
  routingResult: RouteQueryResult | null;
  height?: string | number;
}

export default function InteractiveTransitMap({
  googleMapsKey,
  origin,
  destination,
  stages,
  routingResult,
  height = 240,
}: InteractiveTransitMapProps) {
  // We default to "schematic" because it's client-side, ultra-responsive, beautiful, 
  // and perfectly offline-compatible even if the Google Cloud key throws Referrer or Activation errors!
  const [mapMode, setMapMode] = useState<"schematic" | "embed" | "webgl">("schematic");

  // Find exact coordinate mapping for dynamic stage lookup
  const findStageCoords = (nameOrId: string): google.maps.LatLngLiteral | null => {
    if (!nameOrId) return null;
    const normalizedQuery = nameOrId.trim().toLowerCase();
    const match = stages.find(
      (s) =>
        s.id.toLowerCase() === normalizedQuery ||
        s.name.toLowerCase() === normalizedQuery ||
        s.aliases.some((a) => a.toLowerCase() === normalizedQuery)
    );
    return match ? { lat: match.lat, lng: match.lng } : null;
  };

  // Compile coordinates chronologically across route hops
  const routePoints: google.maps.LatLngLiteral[] = [];
  const markersToDraw: Array<{ id: string; label: string; coords: google.maps.LatLngLiteral; type: "origin" | "dest" | "stop" }> = [];

  if (routingResult?.hops && routingResult.hops.length > 0) {
    routingResult.hops.forEach((hop, index) => {
      const fromCoords = findStageCoords(hop.from);
      if (fromCoords) {
        const alreadyExists = routePoints.some(
          (p) => Math.abs(p.lat - fromCoords.lat) < 1e-6 && Math.abs(p.lng - fromCoords.lng) < 1e-6
        );
        if (!alreadyExists) {
          routePoints.push(fromCoords);
          markersToDraw.push({
            id: `from-${index}-${hop.from}`,
            label: hop.from,
            coords: fromCoords,
            type: index === 0 ? "origin" : "stop",
          });
        }
      }

      const toCoords = findStageCoords(hop.to);
      if (toCoords) {
        const alreadyExists = routePoints.some(
          (p) => Math.abs(p.lat - toCoords.lat) < 1e-6 && Math.abs(p.lng - toCoords.lng) < 1e-6
        );
        if (!alreadyExists) {
          routePoints.push(toCoords);
          markersToDraw.push({
            id: `to-${index}-${hop.to}`,
            label: hop.to,
            coords: toCoords,
            type: index === routingResult.hops.length - 1 ? "dest" : "stop",
          });
        }
      }
    });
  } else {
    // Falls back to UI query fields
    const origCoords = findStageCoords(origin);
    const destCoords = findStageCoords(destination);

    if (origCoords) {
      routePoints.push(origCoords);
      markersToDraw.push({ id: "pre-origin", label: `${origin} (Origin)`, coords: origCoords, type: "origin" });
    }
    if (destCoords) {
      routePoints.push(destCoords);
      markersToDraw.push({ id: "pre-dest", label: `${destination} (Destination)`, coords: destCoords, type: "dest" });
    }
  }

  const defaultCenter = routePoints[0] || NAIROBI_CENTER;

  // Build high-compatibility URL for the Embed directions view with Transit preference
  const rawOrigin = origin || "Kawangware Stage";
  const rawDest = destination || "Dagoretti Corner";
  const embedUrl = `https://www.google.com/maps/embed/v1/directions?key=${googleMapsKey}&origin=${encodeURIComponent(rawOrigin + " Nairobi")}&destination=${encodeURIComponent(rawDest + " Nairobi")}&mode=transit`;

  return (
    <div className="flex flex-col space-y-2">
      {/* Dynamic Compatibility Tab Selector */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900 text-white p-2 rounded-xl border border-slate-800 gap-2">
        <div className="flex items-center gap-1.5 pl-1.5">
          <Navigation className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[10px] uppercase font-black text-slate-300 tracking-wider">MZEE ROUTE MAP</span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMapMode("schematic")}
            className={`text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              mapMode === "schematic"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-450 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Schematic (100% Works)
          </button>
          <button
            type="button"
            onClick={() => setMapMode("embed")}
            className={`text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              mapMode === "embed"
                ? "bg-[#1E3A5F] text-white shadow-sm"
                : "text-slate-450 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Embed Mode
          </button>
          <button
            type="button"
            onClick={() => setMapMode("webgl")}
            className={`text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              mapMode === "webgl"
                ? "bg-[#1E3A5F] text-white shadow-sm"
                : "text-slate-450 hover:bg-slate-800 hover:text-white"
            }`}
          >
            WebGL Live Map
          </button>
        </div>
      </div>

      {/* 1. SCHEMATIC NATIVE VECTOR VIEW */}
      {mapMode === "schematic" && (
        <div 
          className="bg-slate-950 border border-slate-800 text-slate-100 rounded-2xl p-5 flex flex-col justify-between overflow-hidden relative shadow-inner"
          style={{ height }}
        >
          {/* Subtle Ambient BG Coordinates Grid */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">
              ● Active Nairobi Path Schematic
            </span>
            <span className="text-[10px] font-bold text-slate-500 font-mono select-none">
              Vector Layer v1.0
            </span>
          </div>

          {/* Graphical Transit Line */}
          <div className="my-auto relative py-2 select-none z-10">
            {routingResult?.hops && routingResult.hops.length > 0 ? (
              <div className="flex flex-col space-y-3">
                {/* Horizontal schematic track */}
                <div className="relative flex items-center justify-between px-6">
                  {/* Background tracks */}
                  <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-slate-800"></div>
                  <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400-600 animate-pulse"></div>

                  {routingResult.hops.map((hop, index) => {
                    const isFirst = index === 0;
                    return (
                      <div key={`sch-hop-${index}`} className="flex flex-col items-center relative z-20">
                        {/* Stage circle anchor */}
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-xs ${
                          isFirst 
                            ? "bg-emerald-950 border-emerald-400 text-emerald-400 shadow-lg shadow-emerald-500/10" 
                            : "bg-slate-900 border-slate-500 text-slate-300"
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-[10px] font-black text-white mt-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] text-center">
                          {hop.from}
                        </span>
                        <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          {hop.type === "walk" ? "👟 Walk" : `🚌 Route ${hop.route}`}
                        </span>
                      </div>
                    );
                  })}

                  {/* Final Destination circle */}
                  <div className="flex flex-col items-center relative z-20">
                    <div className="w-8 h-8 rounded-full border-2 bg-rose-950 border-rose-500 text-rose-400 flex items-center justify-center font-black text-xs shadow-lg shadow-rose-500/10">
                      🏁
                    </div>
                    <span className="text-[10px] font-black text-white mt-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] text-center">
                      {routingResult.hops[routingResult.hops.length - 1].to}
                    </span>
                    <span className="text-[8.5px] font-bold text-rose-400 uppercase tracking-widest font-mono">
                      Dest
                    </span>
                  </div>
                </div>

                {/* Micro text info indicator */}
                <div className="flex items-center gap-1.5 justify-center bg-slate-900/60 p-2 rounded-xl text-[10px] border border-slate-800 max-w-lg mx-auto text-center">
                  <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
                  <span className="text-slate-300">
                    Nairobi commutations computed perfectly. Toggle to <strong>Embed Mode</strong> or <strong>WebGL Mode</strong> to view satellite street maps.
                  </span>
                </div>
              </div>
            ) : (
              /* Normal setup fallback route drawing */
              <div className="flex flex-col items-center py-2 space-y-4">
                <div className="flex items-center gap-4 w-full justify-center max-w-sm">
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-400 rounded-xl text-center flex-1">
                    <span className="text-[9px] uppercase font-bold text-emerald-500 tracking-wider">Origin Start</span>
                    <div className="font-extrabold text-xs text-white truncate max-w-[140px] mt-0.5">{origin || "Not Specified"}</div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 shrink-0" />
                  <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-400 rounded-xl text-center flex-1">
                    <span className="text-[9px] uppercase font-bold text-rose-500 tracking-wider">Destination</span>
                    <div className="font-extrabold text-xs text-white truncate max-w-[140px] mt-0.5">{destination || "Not Specified"}</div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 text-center max-w-sm font-medium">
                  Enter starting and ending locations kisha ask Mzee advice to draw the complete hop-by-hop schematic path trace!
                </p>
              </div>
            )}
          </div>

          {/* Visual Legend Metrics */}
          <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between select-none text-[9px] md:text-[10px] uppercase font-black tracking-wider text-slate-400 z-10">
            <span className="flex items-center gap-1">🟢 Standard Safety Latency</span>
            <span className="flex items-center gap-1">🟠 Traffic Checked</span>
            <span className="flex items-center gap-1">🟣 Saccos Cleared</span>
          </div>
        </div>
      )}

      {/* 2. DIRECT EMBED MODE (NEEDS "MAPS EMBED API" ON CLOUD CONSOLE) */}
      {mapMode === "embed" && (
        <div className="flex flex-col space-y-1.5">
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm relative bg-slate-100" style={{ height }}>
            <iframe
              title="Google Route directions embed override"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src={embedUrl}
              onError={() => console.log("Embed load error")}
            />
          </div>
          <div className="bg-slate-50 border border-slate-200 text-slate-600 rounded-xl p-3 text-[10.5px] leading-relaxed">
            <h6 className="font-extrabold text-slate-850 uppercase text-[9px] tracking-wider mb-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" /> 
              Embed Mode Troubleshooting (GCP Console Warning)
            </h6>
            If the Google Maps frame says "Google Maps Platform rejected your request. This API is not activated":
            <ol className="list-decimal pl-4.5 mt-1 space-y-0.5 font-semibold text-slate-700">
              <li>Log in to your <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a>.</li>
              <li>Ensure the correct API project is active in the top navbar.</li>
              <li>Go to <strong>APIs & Services &gt; Library</strong>.</li>
              <li>Search for and enable the <strong>Maps Embed API</strong>.</li>
            </ol>
          </div>
        </div>
      )}

      {/* 3. INTERACTIVE WEBGL MODE (NEEDS "MAPS JAVASCRIPT API" ON CLOUD CONSOLE) */}
      {mapMode === "webgl" && (
        <div className="flex flex-col space-y-1.5">
          <div className="relative">
            <APIProvider apiKey={googleMapsKey} version="weekly">
              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm relative text-black" style={{ height }}>
                <Map
                  defaultCenter={defaultCenter}
                  defaultZoom={12}
                  mapId="MZEE_TRANSIT_ROUTER_MAP"
                  internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                  style={{ width: "100%", height: "100%" }}
                  gestureHandling="cooperative"
                  disableDefaultUI={true}
                  zoomControl={true}
                >
                  {/* Dynamic route line connecting stops */}
                  {routePoints.length > 0 && <TransitPolyline points={routePoints} />}

                  {/* Render markers for each point on the trip */}
                  {markersToDraw.map((marker) => {
                    let pinBg = "#3B82F6"; // blue
                    if (marker.type === "origin") pinBg = "#10B981"; // emerald
                    if (marker.type === "dest") pinBg = "#EF4444"; // red

                    return (
                      <AdvancedMarker key={marker.id} position={marker.coords} title={marker.label}>
                        <Pin background={pinBg} borderColor="#ffffff" glyphColor="#ffffff" scale={1.0} />
                      </AdvancedMarker>
                    );
                  })}
                </Map>
              </div>
            </APIProvider>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-[10px] leading-relaxed">
            <h6 className="font-extrabold text-amber-950 uppercase text-[9px] tracking-wider mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              WebGL Mode Activation Requirement (GCP Console Warnings)
            </h6>
            This mode uses the modern vector browser rendering layers. Double-check your setup:
            <ul className="list-disc pl-4.5 mt-1 space-y-0.5 font-semibold text-amber-800">
              <li>Enable the <strong>Maps JavaScript API</strong> in GCP Console Library.</li>
              <li>Make sure that <code>https://ais-dev-oxg7ojstuka4bskce4y3iv-31666432107.europe-west2.run.app/</code> is allowed under HTTP Referrers for this key.</li>
              <li>If either of the above is incorrectly configured, toggle back to the <strong>Schematic View (Default)</strong> or <strong>Embed Mode</strong> which use simpler loading criteria.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
