import { useState, useEffect, useRef } from 'react';
import { transportService } from '../../services/transportService';
import {
  Bus,
  AlertTriangle,
  Info,
  MapPin,
  RefreshCw,
  Navigation,
  Clock,
  Phone,
  ShieldAlert,
  X,
} from 'lucide-react';
import L from 'leaflet';
import { getStatusBadgeStyle } from '../../utils/validators';

const LiveTracking = () => {
  const [buses, setBuses] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const polylineRef = useRef(null);

  // Fetch live bus data
  const fetchLiveBuses = async () => {
    try {
      const res = await transportService.getLiveLocations();
      if (res.success && res.liveBuses) {
        setBuses(res.liveBuses);
        setLastUpdated(new Date());

        // Extract alerts
        const allAlerts = res.liveBuses.flatMap((b) =>
          (b.alerts || []).map((a) => ({ ...a, routeCode: b.routeCode, routeName: b.routeName }))
        );
        if (allAlerts.length > 0) {
          setAlerts(allAlerts);
        }
      }
    } catch (err) {
      console.error('Error updating bus coordinates:', err);
    }
  };

  // Initial map setup
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center Skardu City, Gilgit-Baltistan, Pakistan
    const initialMap = L.map(mapContainerRef.current).setView([35.2971, 75.6341], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(initialMap);

    mapInstanceRef.current = initialMap;

    return () => {
      initialMap.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Polling loop for simulated bus movement (every 3.5s)
  useEffect(() => {
    fetchLiveBuses();
    const interval = setInterval(fetchLiveBuses, 3500);
    return () => clearInterval(interval);
  }, []);

  // Update map markers when buses update
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || buses.length === 0) return;

    const currentBus = selectedRouteId
      ? buses.find((b) => b._id === selectedRouteId)
      : buses[0];

    // Remove old polylines
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
    }

    // Draw route path if stops exist
    if (currentBus && currentBus.stops && currentBus.stops.length > 1) {
      const pathCoords = currentBus.stops.map((s) => [s.lat, s.lng]);
      polylineRef.current = L.polyline(pathCoords, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.8,
        dashArray: '6, 6',
      }).addTo(map);

      // Add stop markers
      currentBus.stops.forEach((stop, i) => {
        const stopKey = `stop_${currentBus._id}_${i}`;
        if (!markersRef.current[stopKey]) {
          const stopIcon = L.divIcon({
            className: 'custom-stop-marker',
            html: `
              <div style="background-color: #475569; color: white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                ${i + 1}
              </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          markersRef.current[stopKey] = L.marker([stop.lat, stop.lng], { icon: stopIcon })
            .bindPopup(`<b>${stop.stopName}</b><br/>Pickup: ${stop.morningTime}<br/>Drop: ${stop.eveningTime}`)
            .addTo(map);
        }
      });
    }

    // Update each bus marker
    buses.forEach((bus) => {
      const coords = [bus.currentCoordinates.lat, bus.currentCoordinates.lng];
      const busKey = `bus_${bus._id}`;

      const busIcon = L.divIcon({
        className: 'custom-bus-marker',
        html: `
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; border-radius: 12px; padding: 4px 8px; font-size: 11px; font-weight: bold; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 10px rgba(37,99,235,0.4); border: 2px solid white; white-space: nowrap;">
            <span>🚌</span> <span>${bus.routeCode}</span>
          </div>
        `,
        iconSize: [80, 30],
        iconAnchor: [40, 15],
      });

      if (!markersRef.current[busKey]) {
        markersRef.current[busKey] = L.marker(coords, { icon: busIcon })
          .bindPopup(`
            <div style="font-family: inherit; font-size: 12px;">
              <strong style="color: #1e293b;">${bus.routeName}</strong><br/>
              Vehicle: <b>${bus.vehicleNumber}</b><br/>
              Driver: ${bus.driverName} (${bus.driverPhone})<br/>
              Status: <span style="color: ${bus.status === 'Delayed' ? '#e11d48' : '#16a34a'}; font-weight: bold;">${bus.status}</span><br/>
              Speed: ~${bus.speedKmh || 42} km/h
            </div>
          `)
          .addTo(map);
      } else {
        markersRef.current[busKey].setLatLng(coords);
      }
    });

    // Pan map to active bus
    if (currentBus && currentBus.currentCoordinates) {
      map.panTo([currentBus.currentCoordinates.lat, currentBus.currentCoordinates.lng], {
        animate: true,
        duration: 1,
      });
    }
  }, [buses, selectedRouteId]);

  const activeBus = selectedRouteId
    ? buses.find((b) => b._id === selectedRouteId)
    : buses[0];

  return (
    <div className="space-y-4">
      {/* Parent Alert Notification Banner */}
      {!isAlertDismissed && alerts.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-amber-500 via-orange-500 to-rose-500 p-0.5 shadow-lg shadow-orange-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 px-5 py-3.5 rounded-[14px]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Live Transit Alert for Parents:
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    [{alerts[0].routeCode}]
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                  {alerts[0].message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className="text-[11px] text-slate-400 font-medium">Auto-updated live</span>
              <button
                onClick={() => setIsAlertDismissed(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Dismiss Banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Live GPS Bus Fleet Map</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Telemetry
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive Leaflet simulation of bus trajectories, student stop waypoints, and speedometers.
          </p>
        </div>

        {/* Route selector buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {buses.map((bus) => (
            <button
              key={bus._id}
              onClick={() => setSelectedRouteId(bus._id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                (selectedRouteId === bus._id || (!selectedRouteId && bus === buses[0]))
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              <span>{bus.routeCode}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Box & Live Bus Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map Container */}
        <div className="lg:col-span-3 h-130 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md relative">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Map bottom overlay pill */}
          <div className="absolute bottom-4 left-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 shadow-sm flex items-center gap-2">
            <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
            <span>GPS Ping: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Selected Bus Telemetry Card */}
        {activeBus ? (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active Bus Telemetry
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeStyle(
                    activeBus.status
                  )}`}
                >
                  {activeBus.status}
                </span>
              </div>

              <div className="mt-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {activeBus.routeName}
                </h3>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Vehicle: {activeBus.vehicleNumber}
                </div>
              </div>

              {/* Speed & Next Stop */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Speed</span>
                  <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    {activeBus.speedKmh || 42} <span className="text-xs font-normal text-slate-400">km/h</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Commuters</span>
                  <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {activeBus.activeStudentsCount} <span className="text-xs font-normal text-slate-400">onboard</span>
                  </div>
                </div>
              </div>

              {/* Next Stop Waypoint */}
              <div className="mt-4 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                <div className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> Approaching Waypoint
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                  {activeBus.nextStop || activeBus.stops?.[1]?.stopName || 'Campus Main Terminal'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Estimated: 3-5 mins
                </div>
              </div>

              {/* Driver info */}
              <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Driver:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{activeBus.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Emergency Phone:</span>
                  <a
                    href={`tel:${activeBus.driverPhone}`}
                    className="font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" /> {activeBus.driverPhone}
                  </a>
                </div>
              </div>
            </div>

            {/* Stop breakdown list */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Waypoints on Route
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {(activeBus.stops || []).map((s, i) => (
                  <div key={i} className="text-xs flex items-center justify-between py-1 text-slate-600 dark:text-slate-400">
                    <span className="truncate flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      {s.stopName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{s.morningTime}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">Select a bus to view telemetry</div>
        )}
      </div>
    </div>
  );
};

export default LiveTracking;

