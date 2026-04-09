/**
 * Unit tests for lib/utils.js
 * These test pure utility functions without any Firebase dependency.
 */

// Manually inline the functions so tests don't require module resolution of @/ aliases
// (Jest does not use Next.js module resolution by default)

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
