class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = 'all';
        
        this.initializeElements();
        this.bindEvents();
        this.render();
    }
    
    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.taskList = document.getElementById('taskList');
        this.taskCount = document.getElementById('taskCount');
        this.clearCompletedBtn = document.getElementById('clearCompletedBtn');
        this.filterBtns = document.querySelectorAll('.filter-btn');
    }
    
    bindEvents() {
        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
        
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
    }
    
    addTask() {
        const text = this.taskInput.value.trim();
        if (text) {
            const task = {
                id: Date.now(),
                text,
                completed: false,
                createdAt: new Date()
            };
            
            this.tasks.unshift(task);
            this.saveTasks();
            this.render();
            this.taskInput.value = '';
            this.taskInput.focus();
        }
    }
    
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }
    
    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.render();
    }
    
    clearCompleted() {
        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveTasks();
        this.render();
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        
        // 更新按鈕狀態
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.render();
    }
    
    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }
    
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
    
    render() {
        const filteredTasks = this.getFilteredTasks();
        
        // 渲染任務列表
        this.taskList.innerHTML = '';
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}"></div>
                <div class="task-text ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.text)}</div>
                <button class="delete-btn" data-id="${task.id}">×</button>
            `;
            this.taskList.appendChild(li);
        });
        
        // 綁定任務相關事件
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.toggleTask(id);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.deleteTask(id);
            });
        });
        
        // 更新統計
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const activeTasks = totalTasks - completedTasks;
        
        this.taskCount.textContent = `共 ${totalTasks} 項任務 (${activeTasks} 項進行中)`;
        
        // 如果沒有任務，顯示提示
        if (filteredTasks.length === 0) {
            const emptyMsg = document.createElement('li');
            emptyMsg.className = 'task-item';
            emptyMsg.style.justifyContent = 'center';
            emptyMsg.style.color = '#999';
            emptyMsg.style.fontStyle = 'italic';
            emptyMsg.style.padding = '30px';
            emptyMsg.textContent = this.currentFilter === 'all' ? '目前沒有任務' : 
                                  this.currentFilter === 'active' ? '沒有進行中的任務' : 
                                  '沒有已完成的任務';
            this.taskList.appendChild(emptyMsg);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});

// 添加一些示例任務（僅首次使用時）
if (!localStorage.getItem('tasks')) {
    const sampleTasks = [
        { id: 1, text: '歡迎使用現代化 TODO LIST', completed: false, createdAt: new Date() },
        { id: 2, text: '點擊左側複選框標記完成', completed: false, createdAt: new Date() },
        { id: 3, text: '點擊右側 × 刪除任務', completed: true, createdAt: new Date() },
        { id: 4, text: '使用上方篩選器查看不同類型', completed: false, createdAt: new Date() }
    ];
    localStorage.setItem('tasks', JSON.stringify(sampleTasks));
}