import { Pencil, Trash2, Clock } from 'lucide-react';
import type { Task } from '../types/database';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const statusConfig = {
  todo: { label: 'To Do', className: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  done: { label: 'Done', className: 'bg-emerald-100 text-emerald-700' },
};

const priorityConfig = {
  low: { label: 'Low', className: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  high: { label: 'High', className: 'bg-red-100 text-red-600', dot: 'bg-red-500' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];

  return (
    <div className="group bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">
            {task.title}
          </h3>
          {task.description && (
            <p className="mt-1.5 text-sm text-gray-500 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit task"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete task"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
          {status.label}
        </span>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${priority.className}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
          {priority.label}
        </span>
        <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
          <Clock size={11} />
          {formatDate(task.created_at)}
        </span>
      </div>
    </div>
  );
}
