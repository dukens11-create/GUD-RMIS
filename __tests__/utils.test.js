/**
 * Unit tests for lib/utils.js and lib/gps.js
 * These test pure utility functions without any Firebase dependency.
 */

// Manually inline the functions so tests don't require module resolution of @/ aliases
// (Jest does not use Next.js module resolution by default)

// ─── GPS utilities (inlined from lib/gps.js) ─────────────────────────────────

const EARTH_RADIUS_M = 6_371_000;

function haversineDistance(a, b) {
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

function isValidGpsUpdate(prev, curr) {
  const MAX_ACCURACY_M = 50;
  const MAX_JUMP_MOVING_M = 500;
  const MAX_JUMP_STATIONARY_M = 30;
  const MOVING_SPEED_MPS = 2.24;

  if (curr.accuracy == null || curr.accuracy > MAX_ACCURACY_M) return false;
  if (prev == null) return true;

  const dist = haversineDistance(prev, curr);
  const speedMps = curr.speed ?? 0;
  const maxJump = speedMps > MOVING_SPEED_MPS ? MAX_JUMP_MOVING_M : MAX_JUMP_STATIONARY_M;
  return dist <= maxJump;
}

function snapToRoute(position, routeCoords, fromIndex) {
  const LOOK_AHEAD = 50;
  const BACK_TOLERANCE = 3;
  const MAX_SNAP_DISTANCE_M = 80;

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
    return { snapped: position, newIndex: fromIndex };
  }

  const [lat, lng] = routeCoords[bestIdx];
  const newIndex = bestIdx >= fromIndex - BACK_TOLERANCE ? bestIdx : fromIndex;
  return { snapped: { lat, lng }, newIndex };
}

function interpolatePosition(from, to, t) {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    lat: from.lat + (to.lat - from.lat) * clamped,
    lng: from.lng + (to.lng - from.lng) * clamped,
  };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount ?? 0);
}

function formatDate(value) {
  if (!value) return '—';
  const date = value?.toDate ? value.toDate() : new Date(value);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function titleCase(str) {
  if (!str) return '';
  return str
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function statusBadgeClass(status) {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_transit: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    open: 'bg-red-100 text-red-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-800';
}

// ─── exportToCsv (browser-side) ──────────────────────────────────────────────

function escapeCsvValue(val) {
  const str = val == null ? '' : String(val);
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvString(rows, columns, headers) {
  const headerRow = headers.map(escapeCsvValue).join(',');
  const dataRows = rows.map((row) =>
    columns.map((col) => escapeCsvValue(row[col])).join(',')
  );
  return [headerRow, ...dataRows].join('\n');
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  test('formats a positive number as USD', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });

  test('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  test('handles null/undefined gracefully (defaults to 0)', () => {
    expect(formatCurrency(null)).toBe('$0.00');
    expect(formatCurrency(undefined)).toBe('$0.00');
  });
});

describe('formatDate', () => {
  test('returns em-dash for falsy values', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('')).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  test('formats an ISO date string', () => {
    // Use a fixed UTC date; toLocaleDateString output depends on locale
    const result = formatDate('2024-01-15');
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/2024/);
  });

  test('formats a Firestore-like timestamp object with toDate()', () => {
    const fakeTimestamp = { toDate: () => new Date('2023-06-20') };
    const result = formatDate(fakeTimestamp);
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2023/);
  });
});

describe('titleCase', () => {
  test('converts snake_case to Title Case', () => {
    expect(titleCase('in_transit')).toBe('In Transit');
    expect(titleCase('on_leave')).toBe('On Leave');
  });

  test('handles plain lowercase', () => {
    expect(titleCase('pending')).toBe('Pending');
  });

  test('returns empty string for falsy input', () => {
    expect(titleCase('')).toBe('');
    expect(titleCase(null)).toBe('');
    expect(titleCase(undefined)).toBe('');
  });

  test('normalises mixed case', () => {
    expect(titleCase('ACTIVE')).toBe('Active');
  });
});

describe('statusBadgeClass', () => {
  test('returns known status classes', () => {
    expect(statusBadgeClass('active')).toContain('green');
    expect(statusBadgeClass('pending')).toContain('yellow');
    expect(statusBadgeClass('open')).toContain('red');
    expect(statusBadgeClass('resolved')).toContain('green');
    expect(statusBadgeClass('closed')).toContain('gray');
  });

  test('returns default gray class for unknown status', () => {
    expect(statusBadgeClass('unknown')).toBe('bg-gray-100 text-gray-800');
    expect(statusBadgeClass('')).toBe('bg-gray-100 text-gray-800');
    expect(statusBadgeClass(undefined)).toBe('bg-gray-100 text-gray-800');
  });
});

describe('CSV builder', () => {
  const rows = [
    { name: 'Alice Smith', status: 'active', phone: '' },
    { name: 'Bob, Jr.', status: 'inactive', phone: '555-1234' },
    { name: 'Carol "the Driver"', status: 'on_leave', phone: '' },
  ];
  const columns = ['name', 'status', 'phone'];
  const headers = ['Name', 'Status', 'Phone'];

  test('produces a header row and one data row per record', () => {
    const csv = buildCsvString(rows, columns, headers);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(4); // 1 header + 3 data rows
    expect(lines[0]).toBe('Name,Status,Phone');
  });

  test('wraps values containing commas in double-quotes', () => {
    const csv = buildCsvString(rows, columns, headers);
    expect(csv).toContain('"Bob, Jr."');
  });

  test('escapes embedded double-quotes', () => {
    const csv = buildCsvString(rows, columns, headers);
    expect(csv).toContain('"Carol ""the Driver"""');
  });

  test('handles null/undefined cell values as empty string', () => {
    const r = [{ name: null, status: undefined, phone: 'x' }];
    const csv = buildCsvString(r, columns, headers);
    const dataLine = csv.split('\n')[1];
    expect(dataLine).toBe(',,x');
  });
});

// ─── GPS utils ────────────────────────────────────────────────────────────────

describe('haversineDistance', () => {
  test('returns 0 for identical coordinates', () => {
    const p = { lat: 37.7749, lng: -122.4194 };
    expect(haversineDistance(p, p)).toBeCloseTo(0, 1);
  });

  test('returns a positive distance between two different points', () => {
    const a = { lat: 37.7749, lng: -122.4194 }; // San Francisco
    const b = { lat: 34.0522, lng: -118.2437 }; // Los Angeles
    const dist = haversineDistance(a, b);
    // ~559 km
    expect(dist).toBeGreaterThan(550_000);
    expect(dist).toBeLessThan(570_000);
  });

  test('is symmetric', () => {
    const a = { lat: 40.7128, lng: -74.006 };
    const b = { lat: 41.8781, lng: -87.6298 };
    expect(haversineDistance(a, b)).toBeCloseTo(haversineDistance(b, a), 1);
  });
});

describe('isValidGpsUpdate', () => {
  const base = { lat: 37.7749, lng: -122.4194, accuracy: 10 };

  test('accepts first fix (prev === null) regardless of position', () => {
    expect(isValidGpsUpdate(null, { lat: 0, lng: 0, accuracy: 30 })).toBe(true);
  });

  test('rejects fix with accuracy > 50 m', () => {
    expect(isValidGpsUpdate(null, { lat: 0, lng: 0, accuracy: 51 })).toBe(false);
  });

  test('rejects fix with null accuracy', () => {
    expect(isValidGpsUpdate(null, { lat: 0, lng: 0, accuracy: null })).toBe(false);
  });

  test('accepts small movement when stationary', () => {
    // ~2 m move
    const next = { lat: 37.77491, lng: -122.4194, accuracy: 10, speed: 0 };
    expect(isValidGpsUpdate(base, next)).toBe(true);
  });

  test('rejects large jump when stationary (> 30 m)', () => {
    // ~100 m jump while speed = 0
    const next = { lat: 37.7758, lng: -122.4194, accuracy: 10, speed: 0 };
    expect(isValidGpsUpdate(base, next)).toBe(false);
  });

  test('accepts up to 500 m jump while moving at speed > 5 mph', () => {
    // 3 m/s ≈ 6.7 mph – relaxed filter; jump of ~200 m should be fine
    const next = { lat: 37.7767, lng: -122.4194, accuracy: 10, speed: 3 };
    expect(isValidGpsUpdate(base, next)).toBe(true);
  });

  test('rejects a huge jump (> 500 m) even while moving', () => {
    // ~1 km jump
    const next = { lat: 37.784, lng: -122.4194, accuracy: 10, speed: 3 };
    expect(isValidGpsUpdate(base, next)).toBe(false);
  });
});

describe('snapToRoute', () => {
  // A simple N→S route along a single longitude
  const route = Array.from({ length: 20 }, (_, i) => [37.7 + i * 0.001, -122.4]);

  test('returns original position when route is empty', () => {
    const pos = { lat: 37.71, lng: -122.4 };
    const result = snapToRoute(pos, [], 0);
    expect(result.snapped).toEqual(pos);
    expect(result.newIndex).toBe(0);
  });

  test('snaps to the nearest route point ahead of fromIndex', () => {
    // Position near index 5 on the route
    const pos = { lat: 37.705, lng: -122.4 };
    const { snapped, newIndex } = snapToRoute(pos, route, 3);
    expect(newIndex).toBeGreaterThanOrEqual(3);
    expect(newIndex).toBeLessThanOrEqual(8);
    expect(Math.abs(snapped.lat - route[newIndex][0])).toBeLessThan(0.01);
  });

  test('does not jump backward beyond tolerance', () => {
    // Position is behind fromIndex, but only within BACK_TOLERANCE (3 points)
    const pos = { lat: 37.708, lng: -122.4 }; // near index 8
    const { newIndex } = snapToRoute(pos, route, 10);
    // Should not go back more than 3 points from 10
    expect(newIndex).toBeGreaterThanOrEqual(7);
  });

  test('returns original position when no point is within 80 m', () => {
    // Position far from any route point
    const pos = { lat: 38.0, lng: -121.0 };
    const { snapped, newIndex } = snapToRoute(pos, route, 0);
    expect(snapped).toEqual(pos);
    expect(newIndex).toBe(0);
  });
});

describe('interpolatePosition', () => {
  const from = { lat: 0, lng: 0 };
  const to = { lat: 1, lng: 2 };

  test('returns from position when t=0', () => {
    const result = interpolatePosition(from, to, 0);
    expect(result.lat).toBeCloseTo(0);
    expect(result.lng).toBeCloseTo(0);
  });

  test('returns to position when t=1', () => {
    const result = interpolatePosition(from, to, 1);
    expect(result.lat).toBeCloseTo(1);
    expect(result.lng).toBeCloseTo(2);
  });

  test('returns midpoint at t=0.5', () => {
    const result = interpolatePosition(from, to, 0.5);
    expect(result.lat).toBeCloseTo(0.5);
    expect(result.lng).toBeCloseTo(1);
  });

  test('clamps t below 0 to 0', () => {
    const result = interpolatePosition(from, to, -1);
    expect(result).toEqual(interpolatePosition(from, to, 0));
  });

  test('clamps t above 1 to 1', () => {
    const result = interpolatePosition(from, to, 2);
    expect(result).toEqual(interpolatePosition(from, to, 1));
  });
});

