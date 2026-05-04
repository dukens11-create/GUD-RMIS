// Firestore collection names
export const COLLECTIONS = {
  DRIVERS: 'drivers',
  LOADS: 'loads',
  INVOICES: 'invoices',
  TASKS: 'tasks',
  VEHICLES: 'vehicles',
  INCIDENTS: 'incidents',
};

// Load status values
export const LOAD_STATUS = {
  PENDING: 'pending',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// Invoice status values
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
};

// Task status values
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
};

// Driver status values
export const DRIVER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_LEAVE: 'on_leave',
};

// Vehicle status values
export const VEHICLE_STATUS = {
  ACTIVE: 'active',
  IN_MAINTENANCE: 'in_maintenance',
  OUT_OF_SERVICE: 'out_of_service',
};

// Incident severity values
export const INCIDENT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Incident status values
export const INCIDENT_STATUS = {
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

// Navigation links
export const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/drivers', label: 'Drivers' },
  { href: '/vehicles', label: 'Vehicles' },
  { href: '/loads', label: 'Loads' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/incidents', label: 'Incidents' },
  { href: '/tracking', label: 'Tracking' },
  { href: '/documents', label: 'Documents' },
];
