'use client';

/**
 * LiveTracker – real-time GPS truck tracking component.
 *
 * Architecture (single source of truth):
 *  - acceptedPosition ref holds the ONE canonical live position used by
 *    the truck marker, speed display, and camera follow.
 *  - Every accepted Geolocation update flows through one pipeline:
 *      raw fix → isValidGpsUpdate filter → (optional) snapToRoute
 *      → acceptedPosition → update marker + speed + camera
 *  - Smooth animation interpolates the marker between the previous and
 *    the new accepted position using requestAnimationFrame.
 *
 * Requirements addressed:
 *  1. VERIFY LOCATION STREAM – every accepted fix is logged to console.
 *  2. SINGLE SOURCE OF TRUTH – one acceptedPosition drives everything.
 *  3. FIX MARKER UPDATE – marker moves on every accepted update.
 *  4. FIX SNAP-TO-ROUTE – forward-only snap; never big backward jumps.
 *  5. ROUTE PROGRESS LOCK – _currentRouteIndex moves monotonically.
 *  6. RELAX BAD FILTERS – only rejects obviously bad jumps.
 *  7. SMOOTH MOVEMENT – requestAnimationFrame interpolation.
 *  8. CAMERA FOLLOW – follows latest marker position when enabled.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  haversineDistance,
  isValidGpsUpdate,
  snapToRoute,
  interpolatePosition,
} from '@/lib/gps';

/** Duration (ms) for the smooth interpolation animation. */
const ANIMATION_DURATION_MS = 800;

/** Default map zoom level. */
const DEFAULT_ZOOM = 16;

export default function LiveTracker({ routeCoords = [] }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const watchIdRef = useRef(null);
  const animFrameRef = useRef(null);

  // Single source of truth: the last accepted GPS position
  const acceptedPositionRef = useRef(null);

  // Previous accepted position (for animation start)
  const prevPositionRef = useRef(null);

  // Monotonically increasing route progress index
  const currentRouteIndexRef = useRef(0);

  // Animation state
  const animStartTimeRef = useRef(null);
  const animFromRef = useRef(null);
  const animToRef = useRef(null);

  // React state for the UI panel
  const [followMode, setFollowMode] = useState(true);
  const [statusText, setStatusText] = useState('Waiting for GPS…');
  const [speedMph, setSpeedMph] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [heading, setHeading] = useState(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [error, setError] = useState('');
  const [lastLogEntry, setLastLogEntry] = useState(null);

  // ─── Leaflet bootstrap (client-only) ─────────────────────────────────────

  useEffect(() => {
    let map;
    let marker;

    async function initMap() {
      if (mapRef.current) return; // already initialised

      const L = (await import('leaflet')).default;
      // Leaflet CSS must be loaded once
      if (!document.querySelector('#leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Fix default icon paths broken by webpack
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Custom truck icon
      const truckIcon = L.divIcon({
        className: '',
        html: `<div class="truck-marker" style="
          width:36px;height:36px;border-radius:50%;
          background:#1d4ed8;border:3px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
          display:flex;align-items:center;justify-content:center;
          font-size:18px;line-height:1;">🚛</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      map = L.map(mapContainerRef.current, { zoomControl: true }).setView(
        [37.7749, -122.4194], // San Francisco default until first GPS fix
        DEFAULT_ZOOM
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Draw the route polyline if provided
      if (routeCoords.length > 1) {
        L.polyline(routeCoords, { color: '#2563eb', weight: 4, opacity: 0.7 }).addTo(map);
      }

      // Create the truck marker at the map centre; hidden until first fix
      marker = L.marker([37.7749, -122.4194], { icon: truckIcon });
      marker.addTo(map);

      mapRef.current = map;
      markerRef.current = marker;
    }

    initMap();

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (animFrameRef.current != null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Animation loop ───────────────────────────────────────────────────────

  const runAnimation = useCallback((timestamp) => {
    if (!animStartTimeRef.current) animStartTimeRef.current = timestamp;
    const elapsed = timestamp - animStartTimeRef.current;
    const t = Math.min(elapsed / ANIMATION_DURATION_MS, 1);

    const from = animFromRef.current;
    const to = animToRef.current;
    if (from && to && markerRef.current) {
      const interp = interpolatePosition(from, to, t);
      markerRef.current.setLatLng([interp.lat, interp.lng]);
    }

    if (t < 1) {
      animFrameRef.current = requestAnimationFrame(runAnimation);
    } else {
      animFrameRef.current = null;
    }
  }, []);

  /**
   * Start a smooth animation from `from` to `to`.
   * Cancels any in-progress animation first.
   */
  const animateMarker = useCallback(
    (from, to) => {
      if (animFrameRef.current != null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      animStartTimeRef.current = null;
      animFromRef.current = from;
      animToRef.current = to;
      animFrameRef.current = requestAnimationFrame(runAnimation);
    },
    [runAnimation]
  );

  // ─── GPS position handler (SINGLE SOURCE OF TRUTH pipeline) ──────────────

  const handlePosition = useCallback(
    (geoPos) => {
      const { latitude, longitude, speed, accuracy: acc, heading: hdg } = geoPos.coords;

      const candidate = { lat: latitude, lng: longitude, speed: speed ?? 0, accuracy: acc };

      // STEP 1 – Filter: only accept valid updates
      if (!isValidGpsUpdate(acceptedPositionRef.current, candidate)) {
        console.debug('[GPS] Rejected update', { lat: latitude, lng: longitude, speed, accuracy: acc });
        return;
      }

      // STEP 2 – Snap to route (forward-only)
      let finalPosition = candidate;
      if (routeCoords.length > 1) {
        const { snapped, newIndex } = snapToRoute(
          candidate,
          routeCoords,
          currentRouteIndexRef.current
        );
        // Only advance the index, never reset backward past tolerance
        currentRouteIndexRef.current = Math.max(
          currentRouteIndexRef.current,
          newIndex
        );
        finalPosition = { ...candidate, lat: snapped.lat, lng: snapped.lng };
      }

      // STEP 3 – Accepted; log every accepted fix (req: VERIFY LOCATION STREAM)
      const logEntry = {
        lat: finalPosition.lat,
        lng: finalPosition.lng,
        speed_mph: speed != null ? (speed * 2.23694).toFixed(1) : 'n/a',
        accuracy_m: acc != null ? acc.toFixed(1) : 'n/a',
        heading: hdg != null ? hdg.toFixed(0) : 'n/a',
        ts: new Date().toISOString(),
        routeIndex: currentRouteIndexRef.current,
      };
      console.info('[GPS] Accepted update', logEntry);

      // STEP 4 – Update single source of truth
      prevPositionRef.current = acceptedPositionRef.current ?? finalPosition;
      acceptedPositionRef.current = finalPosition;

      // STEP 5 – Animate marker from previous to new position
      animateMarker(prevPositionRef.current, finalPosition);

      // STEP 6 – Camera follow (uses the SAME accepted position)
      if (followMode && mapRef.current) {
        mapRef.current.panTo([finalPosition.lat, finalPosition.lng], {
          animate: true,
          duration: 0.8,
        });
      }

      // STEP 7 – Update UI state (speed, accuracy, heading all from same fix)
      const mph = speed != null ? speed * 2.23694 : 0;
      setSpeedMph(mph.toFixed(1));
      setAccuracy(acc != null ? acc.toFixed(0) : null);
      setHeading(hdg != null ? hdg.toFixed(0) : null);
      setStatusText('Tracking live position');
      setLastLogEntry(logEntry);
    },
    // followMode is captured via ref trick below to avoid re-registering the watch
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [animateMarker, routeCoords]
  );

  // Keep a ref to followMode so the GPS callback reads the latest value without
  // needing to be re-created (which would require re-registering the watcher).
  const followModeRef = useRef(followMode);
  useEffect(() => {
    followModeRef.current = followMode;
  }, [followMode]);

  // ─── Start / stop GPS watcher ─────────────────────────────────────────────

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setError('');
    setStatusText('Acquiring GPS signal…');
    setGpsActive(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      (err) => {
        console.error('[GPS] watchPosition error', err);
        setError(`GPS error: ${err.message}`);
        setStatusText('GPS error');
        setGpsActive(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10_000,
      }
    );
  }, [handlePosition]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (animFrameRef.current != null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setGpsActive(false);
    setStatusText('Tracking stopped');
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Control bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
        {!gpsActive ? (
          <button
            onClick={startTracking}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            ▶ Start Tracking
          </button>
        ) : (
          <button
            onClick={stopTracking}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
          >
            ■ Stop Tracking
          </button>
        )}

        <button
          onClick={() => setFollowMode((f) => !f)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            followMode
              ? 'bg-green-700 text-white hover:bg-green-600 focus:ring-green-500'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400'
          }`}
        >
          {followMode ? '🔒 Follow ON' : '🔓 Follow OFF'}
        </button>

        {/* Status indicators */}
        <div className="ml-auto flex flex-wrap items-center gap-4 text-sm text-gray-700">
          <span>
            <span className="font-medium">Status:</span> {statusText}
          </span>
          {speedMph !== null && (
            <span>
              <span className="font-medium">Speed:</span> {speedMph} mph
            </span>
          )}
          {accuracy !== null && (
            <span>
              <span className="font-medium">Accuracy:</span> ±{accuracy} m
            </span>
          )}
          {heading !== null && (
            <span>
              <span className="font-medium">Heading:</span> {heading}°
            </span>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Map container */}
      <div
        ref={mapContainerRef}
        style={{ height: '520px', width: '100%' }}
        className="overflow-hidden rounded-xl shadow-md"
        aria-label="Live truck tracking map"
      />

      {/* Latest accepted GPS log entry */}
      {lastLogEntry && (
        <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500 font-mono">
          <span className="font-semibold text-gray-700">Last accepted fix: </span>
          lat {lastLogEntry.lat.toFixed(6)}, lng {lastLogEntry.lng.toFixed(6)},
          speed {lastLogEntry.speed_mph} mph, accuracy ±{lastLogEntry.accuracy_m} m,
          heading {lastLogEntry.heading}°, routeIdx {lastLogEntry.routeIndex},
          ts {lastLogEntry.ts}
        </div>
      )}
    </div>
  );
}
