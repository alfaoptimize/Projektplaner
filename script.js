// LocalStorage Key
const STORAGE_KEY = 'projektplaner';

// State
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
  { id: '1', title: 'Erstes GitHub Projekt anlegen', priority: 'high', status: 'done' },
  { id: '2', title: 'Kanban Board mit VSCodium testen', priority: 'medium', status: 'inprogress' },
  { id: '3', title: 'GitHub Pages aktivieren', priority: 'low', status: 'todo' }
];

// DOM Elements
const newTaskForm = document.getElementById('newTaskForm');
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const columns = document.querySelectorAll('.kanban-column');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderTasks();
  setupDragAndDrop();
  setupExportImport();
});

// Render All Tasks to Columns
function renderTasks() {
  columns.forEach(col => col.innerHTML = '');

  tasks.forEach(task => {
    const card = createTaskCardElement(task);
    const column = document.getElementById(task.status);
    if (column) column.appendChild(card);
  });

  updateTaskCounts();
  saveTasks();
}

// Create Task Element HTML
function createTaskCardElement(task) {
  const card = document.createElement('div');
  card.className = 'task-card bg-slate-700 hover:bg-slate-650 p-3 rounded shadow border border-slate-600 cursor-grab active:cursor-grabbing transition duration-150 flex justify-between items-start gap-2';
  card.draggable = true;
  card.dataset.id = task.id;

  const priorityColors = {
    low: 'bg-slate-500/20 text-slate-300 border-slate-500',
    medium: 'bg-amber-500/20 text-amber-300 border-amber-500',
    high: 'bg-rose-500/20 text-rose-300 border-rose-500'
  };

  card.innerHTML = `
    <div class="flex-1">
      <p class="text-sm font-medium text-slate-100 break-words">${escapeHtml(task.title)}</p>
      <span class="inline-block mt-2 text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${priorityColors[task.priority]}">
        ${task.priority}
      </span>
    </div>
    <button onclick="deleteTask('${task.id}')" class="text-slate-400 hover:text-rose-400 text-xs px-1 py-0.5 rounded transition">
      ✕
    </button>
  `;

  // Drag Events for Individual Card
  card.addEventListener('dragstart', (e) => {
    card.classList.add('dragging');
    e.dataTransfer.setData('text/plain', task.id);
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
  });

  return card;
}

// Setup Drag & Drop Handlers for Columns
function setupDragAndDrop() {
  columns.forEach(column => {
    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      column.classList.add('drag-over');
    });

    column.addEventListener('dragleave', () => {
      column.classList.remove('drag-over');
    });

    column.addEventListener('drop', (e) => {
      e.preventDefault();
      column.classList.remove('drag-over');
      const taskId = e.dataTransfer.getData('text/plain');
      const newStatus = column.dataset.status;

      tasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
      renderTasks();
    });
  });
}

// Add Task Form Handler
newTaskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;

  const newTask = {
    id: Date.now().toString(),
    title: title,
    priority: prioritySelect.value,
    status: 'todo'
  };

  tasks.push(newTask);
  taskInput.value = '';
  renderTasks();
});

// Delete Task
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();
}

// LocalStorage Helper
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Update Column Badges
function updateTaskCounts() {
  document.getElementById('count-todo').textContent = tasks.filter(t => t.status === 'todo').length;
  document.getElementById('count-inprogress').textContent = tasks.filter(t => t.status === 'inprogress').length;
  document.getElementById('count-done').textContent = tasks.filter(t => t.status === 'done').length;
}

// Export / Import JSON Functionality
function setupExportImport() {
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');

  exportBtn.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `alfa-kanban-backup-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  importBtn.addEventListener('click', () => importFile.click());

  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (Array.isArray(importedData)) {
          tasks = importedData;
          renderTasks();
        }
      } catch (err) {
        alert('Ungültiges JSON-Format!');
      }
    };
    reader.readAsText(file);
  });
}

// Utility function to prevent XSS
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// deleteTask global verfügbar machen für das onclick-Event
window.deleteTask = deleteTask;