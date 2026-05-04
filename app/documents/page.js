'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import DocumentPanel from '@/components/DocumentPanel';
import { getDrivers, getVehicles } from '@/lib/firestore';

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

export default function DocumentsPage() {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDriverId, setOpenDriverId] = useState(null);
  const [openVehicleId, setOpenVehicleId] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [driverData, vehicleData] = await Promise.all([getDrivers(), getVehicles()]);
        setDrivers(driverData);
        setVehicles(vehicleData);
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
            subtitle="Manage compliance documents for drivers and vehicles"
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
            <>
              {/* Driver Documents */}
              <SectionCard title="Driver Documents" className="mb-6">
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
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
