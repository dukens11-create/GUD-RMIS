/**
 * GPS utility functions for live truck tracking.
 *
 * Provides:
 *  - haversineDistance  – great-circle distance between two lat/lng points (metres)
 *  - isValidGpsUpdate   – relaxed filter so valid positions while moving are accepted
 *  - snapToRoute        – forward-only snap to the nearest route point at or ahead of
 *                         the current route index
 *  - interpolatePosition – linear interpolation between two lat/lng positions
 */

const EARTH_RADIUS_M = 6_371_000; // metres

/**
 * Return the great-circle distance between two lat/lng points in metres.
 *
 * @param {{ lat: number, lng: number }} a
 * @param {{ lat: number, lng: number }} b
 * @returns {number} distance in metres
 */
export function haversineDistance(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Decide whether a new GPS position should be accepted.
 *
 * Rules (all must pass):
 *  1. accuracy must be present and ≤ MAX_ACCURACY_M
 *  2. If a previous position exists and speed > MOVING_SPEED_MPS (≈ 5 mph),
 *     only reject the point if it jumps MORE than MAX_JUMP_M metres
 *     (relaxed filter while moving).
 *  3. When stationary (speed ≤ MOVING_SPEED_MPS), apply a tighter jitter cap.
 *
 * @param {{ lat: number, lng: number, speed: number|null } | null} prev  previous accepted position (or null)
 * @param {{ lat: number, lng: number, speed: number|null, accuracy: number }} curr  candidate position
 * @returns {boolean}
 */
export function isValidGpsUpdate(prev, curr) {
  const MAX_ACCURACY_M = 50; // metres – reject very noisy fixes
  const MAX_JUMP_MOVING_M = 500; // max realistic jump while moving, metres
  const MAX_JUMP_STATIONARY_M = 30; // tight jitter cap when stopped, metres
  const MOVING_SPEED_MPS = 2.24; // ≈ 5 mph in m/s

  if (curr.accuracy == null || curr.accuracy > MAX_ACCURACY_M) {
    return false;
  }

  if (prev == null) return true; // first fix always accepted

  const dist = haversineDistance(prev, curr);
  const speedMps = curr.speed ?? 0;
  const maxJump = speedMps > MOVING_SPEED_MPS ? MAX_JUMP_MOVING_M : MAX_JUMP_STATIONARY_M;

  return dist <= maxJump;
}

/**
 * Snap a position to the nearest route point at or ahead of `fromIndex`.
 *
 * The search window starts at `fromIndex` (allowing a small backward tolerance
 * of `BACK_TOLERANCE` points) and scans forward up to `LOOK_AHEAD` points.
 * Returns the index of the closest match within that window; if none are
 * closer than `MAX_SNAP_DISTANCE_M` metres the original position is kept and
 * `fromIndex` is returned unchanged.
 *
 * @param {{ lat: number, lng: number }} position  raw GPS position
 * @param {Array<[number, number]>} routeCoords    route as [lat, lng] pairs
 * @param {number} fromIndex                       current route progress index
 * @returns {{ snapped: { lat: number, lng: number }, newIndex: number }}
 */
export function snapToRoute(position, routeCoords, fromIndex) {
  const LOOK_AHEAD = 50; // scan up to this many points ahead
  const BACK_TOLERANCE = 3; // allow tiny backward look to handle GPS jitter
  const MAX_SNAP_DISTANCE_M = 80; // don't snap if the closest point is too far

  if (!routeCoords || routeCoords.length === 0) {
    return { snapped: position, newIndex: fromIndex };
  }

  const startIdx = Math.max(0, fromIndex - BACK_TOLERANCE);
  const endIdx = Math.min(routeCoords.length - 1, fromIndex + LOOK_AHEAD);

  let bestIdx = fromIndex;
  let bestDist = Infinity;

  for (let i = startIdx; i <= endIdx; i++) {
    const [lat, lng] = routeCoords[i];
    const dist = haversineDistance(position, { lat, lng });
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }

  if (bestDist > MAX_SNAP_DISTANCE_M) {
    // No close route point found – return the raw position and keep the index
    return { snapped: position, newIndex: fromIndex };
  }

  const [lat, lng] = routeCoords[bestIdx];
  // Never allow the index to move more than BACK_TOLERANCE points backward
  const newIndex = bestIdx >= fromIndex - BACK_TOLERANCE ? bestIdx : fromIndex;
  return { snapped: { lat, lng }, newIndex };
}

/**
 * Linearly interpolate between two lat/lng positions.
 *
 * @param {{ lat: number, lng: number }} from  start position
 * @param {{ lat: number, lng: number }} to    end position
 * @param {number} t  interpolation fraction in [0, 1]
 * @returns {{ lat: number, lng: number }}
 */
export function interpolatePosition(from, to, t) {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    lat: from.lat + (to.lat - from.lat) * clamped,
    lng: from.lng + (to.lng - from.lng) * clamped,
  };
}
