// Firestore collection names
export const COLLECTIONS = {
  DRIVERS: 'drivers',
  LOADS: 'loads',
  INVOICES: 'invoices',
  TASKS: 'tasks',
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

// Navigation links
export const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/drivers', label: 'Drivers' },
  { href: '/loads', label: 'Loads' },
  { href: '/invoices', label: 'Invoices' },
];
