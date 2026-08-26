import React from 'react';
import { Task, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface TaskKanbanViewProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onOpenAiBreakdown?: (task: Task) => void;
  onOpenCreateTask: (defaultStatus?: TaskStatus) => void;
}

interface ColumnDef {
  id: TaskStatus;
  title: string;
  icon: string;
  badgeClass: string;
}

export const TaskKanbanView: React.FC<TaskKanbanViewProps> = ({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onUpdateStatus,
  onOpenAiBreakdown,
  onOpenCreateTask,
}) => {
  const columns: ColumnDef[] = [
    {
      id: 'pending',
      title: 'Pending',
      icon: 'bi-hourglass-split',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      icon: 'bi-play-circle',
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    },
    {
      id: 'completed',
      title: 'Completed',
      icon: 'bi-check-circle-fill',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    },
  ];

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const newStatus = destination.droppableId as TaskStatus;
      onUpdateStatus(draggableId, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-3xl border border-slate-200 bg-slate-100/70 p-4 dark:border-slate-800 dark:bg-slate-900/60"
            >
              {/* Column Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className={`bi ${col.icon} text-slate-500`}></i>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {col.title}
                  </h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${col.badgeClass}`}>
                    {colTasks.length}
                  </span>
                </div>

                <button
                  onClick={() => onOpenCreateTask(col.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition"
                  title={`Add to ${col.title}`}
                >
                  <i className="bi bi-plus-lg text-xs"></i>
                </button>
              </div>

              {/* Column Droppable area */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 space-y-3 min-h-[300px] rounded-2xl p-1 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    {colTasks.length === 0 ? (
                      <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-400">
                        <span>No {col.title.toLowerCase()} tasks</span>
                      </div>
                    ) : (
                      colTasks.map((task, index) => (
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
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
