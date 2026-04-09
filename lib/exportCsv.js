/**
 * Convert an array of objects to a CSV string and trigger a browser download.
 *
 * @param {Object[]} rows   - Array of plain objects (all share the same keys).
 * @param {string[]} columns - Ordered list of column keys to include.
 * @param {string[]} headers - Human-readable column headers (same order as columns).
 * @param {string}   filename - Downloaded file name (e.g. "drivers-export.csv").
 */
export function exportToCsv(rows, columns, headers, filename) {
  if (!rows || rows.length === 0) return;

  const escape = (val) => {
    const str = val == null ? '' : String(val);
    // Wrap in quotes if the value contains a comma, newline, or double-quote
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escape).join(',');
  const dataRows = rows.map((row) =>
    columns.map((col) => escape(row[col])).join(',')
  );

  const csv = [headerRow, ...dataRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Per-entity export helpers ────────────────────────────────────────────────

export function exportDriversCsv(drivers) {
  exportToCsv(
    drivers,
    ['name', 'licenseNumber', 'phone', 'status'],
    ['Name', 'License Number', 'Phone', 'Status'],
    'drivers-export.csv'
  );
}

export function exportVehiclesCsv(vehicles) {
  exportToCsv(
    vehicles,
    ['vin', 'make', 'model', 'year', 'licensePlate', 'status'],
    ['VIN', 'Make', 'Model', 'Year', 'License Plate', 'Status'],
    'vehicles-export.csv'
  );
}

export function exportLoadsCsv(loads) {
  exportToCsv(
    loads,
    ['origin', 'destination', 'scheduledDate', 'status'],
    ['Origin', 'Destination', 'Scheduled Date', 'Status'],
    'loads-export.csv'
  );
}

export function exportIncidentsCsv(incidents) {
  exportToCsv(
    incidents,
    ['date', 'type', 'severity', 'status', 'location', 'description'],
    ['Date', 'Type', 'Severity', 'Status', 'Location', 'Description'],
    'incidents-export.csv'
  );
}
