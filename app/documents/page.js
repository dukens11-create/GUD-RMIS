'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import DocumentPanel from '@/components/DocumentPanel';
import AttachmentsPanel from '@/components/AttachmentsPanel';
import { getDrivers, getVehicles, getLoads, getInvoices, getIncidents } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { formatCurrency } from '@/lib/utils';

const DRIVER_DOC_TYPES = [
  { docType: 'drivers_license', label: "Driver's License" },
  { docType: 'medical_card', label: 'Medical Card' },
  { docType: 'drug_test_new_hire', label: 'Drug Test – New Hire' },
  { docType: 'drug_test_random', label: 'Drug Test – Random' },
];

const VEHICLE_DOC_TYPES = [
  { docType: 'truck_registration', label: 'Truck Registration' },
  { docType: 'dot_inspection', label: 'DOT Inspection' },
];

function formatVehicleName(vehicle) {
  const base = [vehicle.make, vehicle.model].filter(Boolean).join(' ');
  const year = vehicle.year ? ` (${vehicle.year})` : '';
  const plate = vehicle.licensePlate ? ` — ${vehicle.licensePlate}` : '';
  return `${base}${year}${plate}` || vehicle.id;
}

function formatLoadLabel(load) {
  if (load.origin && load.destination) return `${load.origin} → ${load.destination}`;
  return load.id;
}

function formatInvoiceLabel(inv) {
  const amount = inv.amount != null ? formatCurrency(inv.amount) : '';
  const status = inv.status ? ` (${inv.status})` : '';
  return amount ? `${amount}${status}` : inv.id;
}

function formatIncidentLabel(inc) {
  const type = inc.type || 'Incident';
  const date = inc.date ? ` — ${inc.date}` : '';
  return `${type}${date}`;
}

export default function DocumentsPage() {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loads, setLoads] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [trackingRecords, setTrackingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDriverId, setOpenDriverId] = useState(null);
  const [openVehicleId, setOpenVehicleId] = useState(null);
  const [openLoadId, setOpenLoadId] = useState(null);
  const [openInvoiceId, setOpenInvoiceId] = useState(null);
  const [openIncidentId, setOpenIncidentId] = useState(null);
  const [openTrackingId, setOpenTrackingId] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const dbInst = db();
        let trackingData = [];
        if (dbInst) {
          try {
            const q = query(
              collection(dbInst, COLLECTIONS.TRACKING),
              orderBy('createdAt', 'desc')
            );
            const snap = await getDocs(q);
            trackingData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          } catch {
            // tracking collection may not exist yet
          }
        }
        const [driverData, vehicleData, loadData, invoiceData, incidentData] = await Promise.all([
          getDrivers(),
          getVehicles(),
          getLoads(),
          getInvoices(),
          getIncidents(),
        ]);
        setDrivers(driverData);
        setVehicles(vehicleData);
        setLoads(loadData);
        setInvoices(invoiceData);
        setIncidents(incidentData);
        setTrackingRecords(trackingData);
      } catch (err) {
        setError('Failed to load data. Please try again.');
        console.error('Documents page load error:', err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <PageHeader
            title="Documents"
            subtitle="Manage compliance documents and attachments for all modules"
          />

          {error && (
            <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500" aria-live="polite" aria-busy="true">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden="true" />
              Loading…
            </div>
          ) : (
            <div className="space-y-6">
              {/* Driver Documents */}
              <SectionCard title="Driver Documents">
                {drivers.length === 0 ? (
                  <p className="text-sm text-gray-500">No drivers found. Add drivers first.</p>
                ) : (
                  <div className="space-y-4">
                    {drivers.map((driver) => (
                      <div key={driver.id} className="rounded-lg border border-gray-200 bg-white">
                        <button
                          onClick={() => setOpenDriverId(openDriverId === driver.id ? null : driver.id)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-lg"
                          aria-expanded={openDriverId === driver.id}
                        >
                          <span>{driver.name}</span>
                          <span className="text-gray-400 text-xs">
                            {openDriverId === driver.id ? '▲ Hide' : '▼ Show Documents'}
                          </span>
                        </button>
                        {openDriverId === driver.id && (
                          <div className="border-t border-gray-100 p-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              {DRIVER_DOC_TYPES.map(({ docType, label }) => (
                                <DocumentPanel
                                  key={docType}
                                  label={label}
                                  docType={docType}
                                  entityPath={`drivers/${driver.id}`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* Vehicle Documents */}
              <SectionCard title="Vehicle Documents">
                {vehicles.length === 0 ? (
                  <p className="text-sm text-gray-500">No vehicles found. Add vehicles first.</p>
                ) : (
                  <div className="space-y-4">
                    {vehicles.map((vehicle) => (
                      <div key={vehicle.id} className="rounded-lg border border-gray-200 bg-white">
                        <button
                          onClick={() => setOpenVehicleId(openVehicleId === vehicle.id ? null : vehicle.id)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-lg"
                          aria-expanded={openVehicleId === vehicle.id}
                        >
                          <span>{formatVehicleName(vehicle)}</span>
                          <span className="text-gray-400 text-xs">
                            {openVehicleId === vehicle.id ? '▲ Hide' : '▼ Show Documents'}
                          </span>
                        </button>
                        {openVehicleId === vehicle.id && (
                          <div className="border-t border-gray-100 p-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              {VEHICLE_DOC_TYPES.map(({ docType, label }) => (
                                <DocumentPanel
                                  key={docType}
                                  label={label}
                                  docType={docType}
                                  entityPath={`vehicles/${vehicle.id}`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* Load Attachments */}
              <SectionCard title="Load Attachments">
                {loads.length === 0 ? (
                  <p className="text-sm text-gray-500">No loads found. Add loads first.</p>
                ) : (
                  <div className="space-y-4">
                    {loads.map((load) => (
                      <div key={load.id} className="rounded-lg border border-gray-200 bg-white">
                        <button
                          onClick={() => setOpenLoadId(openLoadId === load.id ? null : load.id)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-lg"
                          aria-expanded={openLoadId === load.id}
                        >
                          <span>{formatLoadLabel(load)}</span>
                          <span className="text-gray-400 text-xs">
                            {openLoadId === load.id ? '▲ Hide' : '▼ Show Attachments'}
                          </span>
                        </button>
                        {openLoadId === load.id && (
                          <div className="border-t border-gray-100 p-4">
                            <AttachmentsPanel entityPath={`loads/${load.id}`} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* Invoice Attachments */}
              <SectionCard title="Invoice Attachments">
                {invoices.length === 0 ? (
                  <p className="text-sm text-gray-500">No invoices found. Add invoices first.</p>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="rounded-lg border border-gray-200 bg-white">
                        <button
                          onClick={() => setOpenInvoiceId(openInvoiceId === inv.id ? null : inv.id)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-lg"
                          aria-expanded={openInvoiceId === inv.id}
                        >
                          <span>{formatInvoiceLabel(inv)}</span>
                          <span className="text-gray-400 text-xs">
                            {openInvoiceId === inv.id ? '▲ Hide' : '▼ Show Attachments'}
                          </span>
                        </button>
                        {openInvoiceId === inv.id && (
                          <div className="border-t border-gray-100 p-4">
                            <AttachmentsPanel entityPath={`invoices/${inv.id}`} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* Incident Attachments */}
              <SectionCard title="Incident Attachments">
                {incidents.length === 0 ? (
                  <p className="text-sm text-gray-500">No incidents found. Report incidents first.</p>
                ) : (
                  <div className="space-y-4">
                    {incidents.map((inc) => (
                      <div key={inc.id} className="rounded-lg border border-gray-200 bg-white">
                        <button
                          onClick={() => setOpenIncidentId(openIncidentId === inc.id ? null : inc.id)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-lg"
                          aria-expanded={openIncidentId === inc.id}
                        >
                          <span>{formatIncidentLabel(inc)}</span>
                          <span className="text-gray-400 text-xs">
                            {openIncidentId === inc.id ? '▲ Hide' : '▼ Show Attachments'}
                          </span>
                        </button>
                        {openIncidentId === inc.id && (
                          <div className="border-t border-gray-100 p-4">
                            <AttachmentsPanel entityPath={`incidents/${inc.id}`} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* Tracking Attachments */}
              <SectionCard title="Tracking Attachments">
                {trackingRecords.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No tracking sessions found. Add tracking sessions on the{' '}
                    <a href="/tracking" className="text-blue-600 hover:underline">Tracking page</a>.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {trackingRecords.map((record) => (
                      <div key={record.id} className="rounded-lg border border-gray-200 bg-white">
                        <button
                          onClick={() => setOpenTrackingId(openTrackingId === record.id ? null : record.id)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-lg"
                          aria-expanded={openTrackingId === record.id}
                        >
                          <span>{record.title || record.id}</span>
                          <span className="text-gray-400 text-xs">
                            {openTrackingId === record.id ? '▲ Hide' : '▼ Show Attachments'}
                          </span>
                        </button>
                        {openTrackingId === record.id && (
                          <div className="border-t border-gray-100 p-4">
                            <AttachmentsPanel entityPath={`tracking/${record.id}`} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
