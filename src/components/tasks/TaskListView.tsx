import React from 'react';
import { Task, Pagination } from '../../types';
import { TaskCard } from './TaskCard';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface TaskListViewProps {
  tasks: Task[];
  pagination?: Pagination;
  onPageChange: (page: number) => void;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onOpenAiBreakdown?: (task: Task) => void;
  onOpenCreateTask: () => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  pagination,
  onPageChange,
  onToggleComplete,
  onEdit,
  onDelete,
  onReorder,
  onOpenAiBreakdown,
  onOpenCreateTask,
}) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const orderedIds = items.map((t) => t.id);
    onReorder(orderedIds);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/60 p-12 text-center dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
          <i className="bi bi-clipboard2-check text-2xl"></i>
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">No tasks found</h3>
        <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
          Get started by adding a task, or try changing your filters and search term.
        </p>
        <button
          onClick={onOpenCreateTask}
          className="mt-5 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-95"
        >
          <i className="bi bi-plus-lg"></i>
          <span>Create Task</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tasks-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2.5"
            >
              {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <TaskCard
                        task={task}
                        onToggleComplete={onToggleComplete}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onOpenAiBreakdown={onOpenAiBreakdown}
                        isDragging={snapshot.isDragging}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800 text-xs text-slate-500">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
            tasks
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Prev
            </button>
            <span className="px-2 font-medium text-slate-700 dark:text-slate-200">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
