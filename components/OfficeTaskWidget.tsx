
import React, { useState } from 'react';
import type { OfficeTask } from '../types';
import { ClipboardListIcon, TrashIcon, PlusIcon, CheckCircleSolidIcon, CheckCircleIcon } from './Icons';

interface OfficeTaskWidgetProps {
  tasks: OfficeTask[];
  onAddTask: (title: string) => void;
  onToggleTask: (task: OfficeTask) => void;
  onDeleteTask: (taskId: string) => void;
  fullView?: boolean;
}

const OfficeTaskWidget: React.FC<OfficeTaskWidgetProps> = ({ tasks, onAddTask, onToggleTask, onDeleteTask, fullView = false }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle);
    setNewTaskTitle('');
  };

  const sortedTasks = [...tasks].sort((a, b) => {
      // Unfinished first
      if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1;
      }
      // Then by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 flex flex-col h-full animate-fade-in`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
            <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-lg mr-3">
                <ClipboardListIcon className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Attività Ufficio</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">To-Do List (Volture, Subentri...)</p>
            </div>
        </div>
        <span className="bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200 text-xs font-bold px-2.5 py-1 rounded-full">
            {tasks.filter(t => !t.isCompleted).length}
        </span>
      </div>

      {/* Add Task Form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Aggiungi nuova attività..."
            className="flex-1 min-w-0 px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <button 
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="p-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <PlusIcon className="h-5 w-5" />
        </button>
      </form>

      {/* Tasks List */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar ${fullView ? '' : 'max-h-60'}`}>
        {sortedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-400 h-full py-6">
                <CheckCircleIcon className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Nessuna attività in elenco.</p>
            </div>
        ) : (
            <ul className="space-y-2">
                {sortedTasks.map(task => (
                    <li 
                        key={task.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            task.isCompleted 
                                ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 opacity-60' 
                                : 'bg-white dark:bg-slate-700/30 border-slate-200 dark:border-slate-600 shadow-sm'
                        }`}
                    >
                        <div className="flex items-center flex-1 min-w-0 mr-3">
                            <button
                                onClick={() => onToggleTask(task)}
                                className={`flex-shrink-0 mr-3 focus:outline-none ${
                                    task.isCompleted ? 'text-green-500' : 'text-slate-300 hover:text-pink-500'
                                }`}
                            >
                                {task.isCompleted ? (
                                    <CheckCircleSolidIcon className="h-6 w-6" />
                                ) : (
                                    <CheckCircleIcon className="h-6 w-6" />
                                )}
                            </button>
                            <span className={`text-sm truncate ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-200 font-medium'}`}>
                                {task.title}
                            </span>
                        </div>
                        <button 
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                            aria-label="Elimina attività"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </li>
                ))}
            </ul>
        )}
      </div>
    </div>
  );
};

export default OfficeTaskWidget;
