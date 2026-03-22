'use client';

import { titleCase, statusBadgeClass } from '@/lib/utils';
import { TASK_STATUS } from '@/lib/constants';

const COLUMNS = [
  { status: TASK_STATUS.TODO, label: 'To Do' },
  { status: TASK_STATUS.IN_PROGRESS, label: 'In Progress' },
  { status: TASK_STATUS.DONE, label: 'Done' },
];

export default function TaskBoard({ tasks = [], onStatusChange }) {
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.status] = tasks.filter((t) => t.status === col.status);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map(({ status, label }) => (
        <div key={status} className="rounded-xl border border-gray-200 bg-gray-50">
          {/* Column header */}
          <div className="border-b border-gray-200 px-4 py-3">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(status)}`}>
              {label}
            </span>
            <span className="ml-2 text-xs text-gray-500">
              {grouped[status]?.length ?? 0}
            </span>
          </div>

          {/* Cards */}
          <div className="space-y-2 p-3">
            {(grouped[status] ?? []).length === 0 && (
              <p className="py-4 text-center text-xs text-gray-400">No tasks</p>
            )}
            {(grouped[status] ?? []).map((task) => (
              <div
                key={task.id}
                className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
              >
                <p className="text-sm font-medium text-gray-800">{task.title}</p>
                {task.description && (
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                    {task.description}
                  </p>
                )}
                {onStatusChange && (
                  <div className="mt-2 flex gap-1">
                    {COLUMNS.filter((c) => c.status !== status).map((c) => (
                      <button
                        key={c.status}
                        onClick={() => onStatusChange(task.id, c.status)}
                        className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
                      >
                        → {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
