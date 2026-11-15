const STORAGE_KEY = "daily_todos_v1";

const dateEl = document.getElementById("today-date");
const progressCountEl = document.getElementById("progress-count");
const progressBarEl = document.getElementById("progress-bar");
const formEl = document.getElementById("todo-form");
const inputEl = document.getElementById("todo-input");
const listEl = document.getElementById("todo-list");
const emptyEl = document.getElementById("empty-state");
const clearBtn = document.getElementById("clear-completed");
const filterBtns = document.querySelectorAll(".filter-btn");

let todos = loadTodos();
let currentFilter = "all";

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function renderDate() {
  const now = new Date();
  dateEl.textContent = now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function renderProgress() {
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  progressCountEl.textContent = `${completed} / ${total}`;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressBarEl.style.width = `${percent}%`;
  clearBtn.disabled = completed === 0;
}

function getFilteredTodos() {
  if (currentFilter === "active") return todos.filter((t) => !t.completed);
  if (currentFilter === "completed") return todos.filter((t) => t.completed);
  return todos;
}

function startEdit(itemEl, todo) {
  const textEl = itemEl.querySelector(".todo-text");
  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.className = "todo-edit-input";
  editInput.value = todo.text;
  editInput.maxLength = 120;

  let finished = false;
  const finish = (commit) => {
    if (finished) return;
    finished = true;
    const nextText = editInput.value.trim();
    if (commit && nextText) {
      todo.text = nextText;
      saveTodos();
    }
    render();
  };

  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finish(true);
    if (e.key === "Escape") finish(false);
  });
  editInput.addEventListener("blur", () => finish(true));

  textEl.replaceWith(editInput);
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);
}

function createTodoElement(todo) {
  const li = document.createElement("li");
  li.className = `todo-item${todo.completed ? " completed" : ""}`;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "todo-checkbox";
  checkbox.checked = todo.completed;
  checkbox.setAttribute("aria-label", `${todo.text} 완료 표시`);
  checkbox.addEventListener("change", () => {
    todo.completed = checkbox.checked;
    saveTodos();
    render();
  });

  const textSpan = document.createElement("span");
  textSpan.className = "todo-text";
  textSpan.textContent = todo.text;
  textSpan.title = "더블클릭하여 수정";
  textSpan.addEventListener("dblclick", () => startEdit(li, todo));

  const actions = document.createElement("div");
  actions.className = "todo-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "icon-btn";
  editBtn.textContent = "✎";
  editBtn.setAttribute("aria-label", "수정");
  editBtn.addEventListener("click", () => startEdit(li, todo));

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "icon-btn delete";
  deleteBtn.textContent = "✕";
  deleteBtn.setAttribute("aria-label", "삭제");
  deleteBtn.addEventListener("click", () => {
    todos = todos.filter((t) => t.id !== todo.id);
    saveTodos();
    render();
  });

  actions.append(editBtn, deleteBtn);
  li.append(checkbox, textSpan, actions);
  return li;
}

function render() {
  renderProgress();
  const filtered = getFilteredTodos();
  listEl.innerHTML = "";

  if (filtered.length === 0) {
    emptyEl.hidden = false;
    emptyEl.textContent =
      todos.length === 0
        ? "등록된 할 일이 없습니다. 위 입력창에서 오늘의 할 일을 추가해보세요!"
        : "해당 조건에 맞는 할 일이 없습니다.";
    return;
  }

  emptyEl.hidden = true;
  const fragment = document.createDocumentFragment();
  filtered.forEach((todo) => fragment.appendChild(createTodoElement(todo)));
  listEl.appendChild(fragment);
}

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = inputEl.value.trim();
  if (!text) return;

  todos.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    text,
    completed: false,
  });
  saveTodos();
  inputEl.value = "";
  render();
});

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    filterBtns.forEach((b) => {
      const isActive = b === btn;
      b.classList.toggle("active", isActive);
      b.setAttribute("aria-selected", String(isActive));
    });
    render();
  });
});

clearBtn.addEventListener("click", () => {
  todos = todos.filter((t) => !t.completed);
  saveTodos();
  render();
});

renderDate();
render();
