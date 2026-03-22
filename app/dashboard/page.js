'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import StatCard from '@/components/StatCard';
import PageHeader from '@/components/PageHeader';
import TaskBoard from '@/components/TaskBoard';
import SectionCard from '@/components/SectionCard';
import { getDrivers } from '@/lib/firestore';
import { getLoads } from '@/lib/firestore';
import { getInvoices } from '@/lib/firestore';
import { getTasks, updateTask } from '@/lib/firestore';
import { LOAD_STATUS, INVOICE_STATUS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    drivers: 0,
    activeLoads: 0,
    pendingInvoices: 0,
    revenue: 0,
  });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [drivers, loads, invoices, taskList] = await Promise.all([
          getDrivers(),
          getLoads(),
          getInvoices(),
          getTasks(),
        ]);

        const activeLoads = loads.filter(
          (l) => l.status === LOAD_STATUS.IN_TRANSIT
        ).length;

        const pendingInvoices = invoices.filter(
          (i) => i.status === INVOICE_STATUS.SENT || i.status === INVOICE_STATUS.OVERDUE
        ).length;

        const revenue = invoices
          .filter((i) => i.status === INVOICE_STATUS.PAID)
          .reduce((sum, i) => sum + (i.amount ?? 0), 0);

        setStats({
          drivers: drivers.length,
          activeLoads,
          pendingInvoices,
          revenue,
        });
        setTasks(taskList);
      } catch (err) {
        console.error('Dashboard load error:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleTaskStatusChange(taskId, newStatus) {
    await updateTask(taskId, { status: newStatus });
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <PageHeader
            title="Dashboard"
            subtitle="Overview of your road management operations"
          />

          {/* Stats */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Drivers" value={stats.drivers} icon="🚗" color="blue" />
            <StatCard title="Active Loads" value={stats.activeLoads} icon="📦" color="green" />
            <StatCard title="Pending Invoices" value={stats.pendingInvoices} icon="🧾" color="yellow" />
            <StatCard title="Revenue (Paid)" value={formatCurrency(stats.revenue)} icon="💰" color="purple" />
          </div>

          {/* Task board */}
          <SectionCard title="Task Board">
            {loading ? (
              <p className="text-sm text-gray-500">Loading tasks…</p>
            ) : (
              <TaskBoard tasks={tasks} onStatusChange={handleTaskStatusChange} />
            )}
          </SectionCard>
        </main>
      </div>
    </ProtectedRoute>
  );
}
