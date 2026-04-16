import { useState } from 'react';
import { Plus, CheckSquare, Loader2, AlertCircle } from 'lucide-react';
import { useTasks, useTaskStats } from './hooks/useTasks';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import type { Task, TaskStatus, TaskInsert } from './types/database';

type FilterValue = TaskStatus | 'all';

const filters: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export default function App() {
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const { tasks, loading, error, createTask, updateTask, deleteTask } = useTasks(activeFilter);
  const { stats, refetch: refetchStats } = useTaskStats();

  const handleCreate = async (data: TaskInsert) => {
    await createTask(data);
    refetchStats();
  };

  const handleUpdate = async (data: TaskInsert) => {
    if (!editingTask) return;
    await updateTask(editingTask.id, data);
    refetchStats();
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    await deleteTask(deletingTask.id);
    setDeletingTask(null);
    refetchStats();
  };

  const completionRate = stats.total > 0
    ? Math.round((stats.done / stats.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <CheckSquare size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">TaskFlow</span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Plus size={16} />
            New Task
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total" value={stats.total} color="text-gray-900" />
          <StatCard label="To Do" value={stats.todo} color="text-gray-600" />
          <StatCard label="In Progress" value={stats.in_progress} color="text-blue-600" />
          <StatCard label="Done" value={stats.done} color="text-emerald-600" />
        </div>

        {stats.total > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Overall progress</span>
              <span className="text-sm font-semibold text-gray-900">{completionRate}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                activeFilter === f.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-200 hover:text-blue-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-6">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState filter={activeFilter} onCreate={() => setShowCreateModal(true)} />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={setEditingTask}
                onDelete={setDeletingTask}
              />
            ))}
          </div>
        )}
      </main>

      {(showCreateModal || editingTask) && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTask(null);
          }}
          onSubmit={editingTask ? handleUpdate : handleCreate}
        />
      )}

      {deletingTask && (
        <ConfirmDialog
          title="Delete Task"
          message={`"${deletingTask.title}" will be permanently removed.`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function EmptyState({ filter, onCreate }: { filter: FilterValue; onCreate: () => void }) {
  const message = filter === 'all'
    ? 'No tasks yet. Create your first task to get started.'
    : `No ${filter.replace('_', ' ')} tasks found.`;

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
        <CheckSquare size={28} className="text-blue-400" />
      </div>
      <p className="text-gray-600 text-sm mb-4">{message}</p>
      {filter === 'all' && (
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus size={16} />
          Create Task
        </button>
      )}
    </div>
  );
}
