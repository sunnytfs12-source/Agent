import React, { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { Task, TaskFilters, TaskStatus } from '../types';
import { AiSuggestionsBanner } from '../components/ai/AiSuggestionsBanner';
import { TaskFilterBar } from '../components/tasks/TaskFilterBar';
import { TaskListView } from '../components/tasks/TaskListView';
import { TaskKanbanView } from '../components/tasks/TaskKanbanView';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { AiBreakdownModal } from '../components/ai/AiBreakdownModal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface TasksPageProps {
  selectedCategory?: string;
  selectedTag?: string;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  selectedCategory,
  selectedTag,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filters, setFilters] = useState<TaskFilters>({
    page: 1,
    limit: 15,
    sort: 'order_index',
    order: 'ASC',
  });

  // Modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [aiBreakdownTask, setAiBreakdownTask] = useState<Task | null>(null);

  // Combine parent selectedCategory/selectedTag with local filters
  const activeFilters: TaskFilters = {
    ...filters,
    category_id: selectedCategory || filters.category_id,
    tag_id: selectedTag || filters.tag_id,
  };

  const {
    tasks,
    pagination,
    isLoading,
    createTask,
    updateTask,
    toggleComplete,
    deleteTask,
    reorderTasks,
  } = useTasks(activeFilters);

  const handleFilterChange = (newFilters: Partial<TaskFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleOpenCreate = (defaultStatus?: TaskStatus) => {
    setEditingTask(defaultStatus ? ({ status: defaultStatus } as any) : null);
    setDetailModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setDetailModalOpen(true);
  };

  const handleSaveTask = async (taskData: any) => {
    if (editingTask && editingTask.id) {
      await updateTask({ id: editingTask.id, payload: taskData });
    } else {
      await createTask(taskData);
    }
  };

  const handleUpdateStatus = (id: string, status: TaskStatus) => {
    updateTask({ id, payload: { status } });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* AI Suggestions & Alert Banner */}
      <AiSuggestionsBanner onApplyPrioritize={reorderTasks} />

      {/* Filter and View Controls */}
      <TaskFilterBar
        filters={activeFilters}
        onFilterChange={handleFilterChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenCreateTask={() => handleOpenCreate()}
      />

      {/* Main Task View (List or Kanban) */}
      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" message="Loading tasks..." />
        </div>
      ) : viewMode === 'list' ? (
        <TaskListView
          tasks={tasks}
          pagination={pagination}
          onPageChange={(page) => handleFilterChange({ page })}
          onToggleComplete={toggleComplete}
          onEdit={handleOpenEdit}
          onDelete={deleteTask}
          onReorder={reorderTasks}
          onOpenAiBreakdown={(t) => setAiBreakdownTask(t)}
          onOpenCreateTask={() => handleOpenCreate()}
        />
      ) : (
        <TaskKanbanView
          tasks={tasks}
          onToggleComplete={toggleComplete}
          onEdit={handleOpenEdit}
          onDelete={deleteTask}
          onUpdateStatus={handleUpdateStatus}
          onOpenAiBreakdown={(t) => setAiBreakdownTask(t)}
          onOpenCreateTask={handleOpenCreate}
        />
      )}

      {/* Task Create / Edit Modal */}
      {detailModalOpen && (
        <TaskDetailModal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setEditingTask(null);
          }}
          task={editingTask}
          onSave={handleSaveTask}
          onDelete={deleteTask}
        />
      )}

      {/* AI Task Breakdown Modal */}
      {aiBreakdownTask && (
        <AiBreakdownModal
          isOpen={!!aiBreakdownTask}
          onClose={() => setAiBreakdownTask(null)}
          task={aiBreakdownTask}
          onAddSubtask={async (taskId, title) => {
            // Add subtask via update
            await updateTask({ id: taskId, payload: {} });
          }}
        />
      )}
    </div>
  );
};
