import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Task, TaskInsert, TaskUpdate, TaskStatus } from '../types/database';

export function useTasks(statusFilter: TaskStatus | 'all') {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error: fetchError } = await query;
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setTasks(data as Task[]);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (input: TaskInsert): Promise<Task | null> => {
    const { data, error: insertError } = await supabase
      .from('tasks')
      .insert(input)
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      return null;
    }
    await fetchTasks();
    return data as Task;
  };

  const updateTask = async (id: string, updates: TaskUpdate): Promise<Task | null> => {
    const { data, error: updateError } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      return null;
    }
    await fetchTasks();
    return data as Task;
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError(deleteError.message);
      return false;
    }
    await fetchTasks();
    return true;
  };

  return { tasks, loading, error, createTask, updateTask, deleteTask, refetch: fetchTasks };
}

export function useTaskStats() {
  const [stats, setStats] = useState({ total: 0, todo: 0, in_progress: 0, done: 0 });

  const fetchStats = useCallback(async () => {
    const { data } = await supabase.from('tasks').select('status');
    if (data) {
      const total = data.length;
      const todo = data.filter(t => t.status === 'todo').length;
      const in_progress = data.filter(t => t.status === 'in_progress').length;
      const done = data.filter(t => t.status === 'done').length;
      setStats({ total, todo, in_progress, done });
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, refetch: fetchStats };
}
