// Local Storage Key
const STORAGE_KEY = 'coursePlannerData';

// View mode state
let isHierarchicalView = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    checkAndShowHomePage();
});

// Setup Event Listeners
function setupEventListeners() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');

    // File input change
    fileInput.addEventListener('change', handleFileUpload);

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    });
}

// Handle File Upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        processFile(file);
    }
}

// Process File
function processFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        const lines = content.split('\n').filter(line => line.trim() !== '');
        createCoursePlan(lines);
    };
    reader.readAsText(file);
}

// Process Manual Input
function processManualInput() {
    const manualInput = document.getElementById('manualInput');
    const content = manualInput.value.trim();
    
    if (content === '') {
        alert('Please paste your course plan first!');
        return;
    }

    const lines = content.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
        alert('No valid content found!');
        return;
    }

    createCoursePlan(lines);
    manualInput.value = '';
}

// Create Course Plan
function createCoursePlan(lines) {
    const tasks = lines.map((line, index) => {
        const parts = line.split('|').map(p => p.trim());
        let subject = 'General';
        let topic = null;
        let taskName = line.trim();
        
        if (parts.length >= 3) {
            // Format: Subject | Topic | Subtopic
            subject = parts[0];
            topic = parts[1];
            taskName = parts[2];
        } else if (parts.length === 2) {
            // Format: Subject | Task
            subject = parts[0];
            taskName = parts[1];
        }
        
        return {
            id: Date.now() + index,
            subject: subject,
            topic: topic,
            name: taskName,
            completed: false,
            priority: 'medium',
            addedOn: new Date().toISOString(),
            completedOn: null
        };
    });

    const existingTasks = getTasks();
    const allTasks = [...existingTasks, ...tasks];
    saveData(allTasks);
    
    // Show home page with subjects
    showHomePage();

    // Show success notification
    showNotification('Course plan created successfully! 🎉', 'success');
}

// Save Data to Local Storage
function saveData(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Load Data from Local Storage
function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        const tasks = JSON.parse(data);
        if (tasks.length > 0) {
            // Don't auto-show sections, let checkAndShowHomePage handle it
            return;
        }
    }
}

// Check and Show Home Page
function checkAndShowHomePage() {
    const tasks = getTasks();
    if (tasks.length > 0) {
        showHomePage();
    }
}

// Go to Home Page
function goToHome() {
    const tasks = getTasks();
    if (tasks.length > 0) {
        showHomePage();
    }
    // If no tasks, stay on upload page (which is already visible)
}

// Show Home Page
function showHomePage() {
    document.getElementById('heroSection').style.display = 'none';
    document.getElementById('homeSection').style.display = 'block';
    document.getElementById('progressSection').style.display = 'none';
    document.getElementById('planSection').style.display = 'none';
    renderSubjectsGrid();
}

// Render Subjects Grid
function renderSubjectsGrid() {
    const tasks = getTasks();
    const subjects = [...new Set(tasks.map(t => t.subject))];
    const grid = document.getElementById('subjectsGrid');
    
    if (subjects.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <p>No subjects yet. Add your first task to get started!</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = subjects.map(subject => {
        const subjectTasks = tasks.filter(t => t.subject === subject);
        const completedCount = subjectTasks.filter(t => t.completed).length;
        const totalCount = subjectTasks.length;
        const percentage = Math.round((completedCount / totalCount) * 100);
        const color = getSubjectColor(subject);
        
        return `
            <div class="subject-card" onclick="viewSubject('${subject.replace(/'/g, "\\'")}')">
                <div class="subject-card-header" style="background: ${color}">
                    <i class="fas fa-book"></i>
                </div>
                <div class="subject-card-body">
                    <h3 class="subject-card-title">${subject}</h3>
                    <div class="subject-card-stats">
                        <div class="stat">
                            <i class="fas fa-tasks"></i>
                            <span>${totalCount} tasks</span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-check-circle"></i>
                            <span>${completedCount} completed</span>
                        </div>
                    </div>
                    <div class="subject-progress">
                        <div class="subject-progress-bar">
                            <div class="subject-progress-fill" style="width: ${percentage}%; background: ${color}"></div>
                        </div>
                        <span class="subject-progress-text">${percentage}%</span>
                    </div>
                </div>
                <div class="subject-card-footer">
                    <span class="view-details">View Details <i class="fas fa-arrow-right"></i></span>
                </div>
            </div>
        `;
    }).join('');
}

// View Subject Details
function viewSubject(subject) {
    currentFilter = subject;
    showTasksView();
}

// View All Tasks
function viewAllTasks() {
    currentFilter = 'all';
    showTasksView();
}

// Show Tasks View
function showTasksView() {
    document.getElementById('heroSection').style.display = 'none';
    document.getElementById('homeSection').style.display = 'none';
    document.getElementById('progressSection').style.display = 'block';
    document.getElementById('planSection').style.display = 'block';
    renderPlan();
}

// Show Upload Page
function showUploadPage() {
    document.getElementById('heroSection').style.display = 'block';
    document.getElementById('homeSection').style.display = 'none';
    document.getElementById('progressSection').style.display = 'none';
    document.getElementById('planSection').style.display = 'none';
    
    // Scroll to top
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Get Tasks
function getTasks() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Current filter state
let currentFilter = 'all';

// Toggle View Mode
function toggleViewMode() {
    isHierarchicalView = !isHierarchicalView;
    const btn = document.getElementById('viewToggleBtn');
    const hierarchicalView = document.getElementById('hierarchicalView');
    const tableView = document.getElementById('tableView');
    
    if (isHierarchicalView) {
        hierarchicalView.style.display = 'block';
        tableView.style.display = 'none';
        btn.innerHTML = '<i class="fas fa-table"></i> Table View';
        renderHierarchicalView();
    } else {
        hierarchicalView.style.display = 'none';
        tableView.style.display = 'block';
        btn.innerHTML = '<i class="fas fa-th-list"></i> Hierarchical View';
        renderTableView();
    }
}

// Render Hierarchical View
function renderHierarchicalView() {
    const allTasks = getTasks();
    const tasks = currentFilter === 'all' 
        ? allTasks 
        : allTasks.filter(t => t.subject === currentFilter);
    
    const container = document.getElementById('hierarchicalContent');
    
    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No tasks yet. Upload your course plan or add tasks manually.</p>
            </div>
        `;
        return;
    }
    
    // Group by subject and topic
    const grouped = {};
    tasks.forEach(task => {
        if (!grouped[task.subject]) {
            grouped[task.subject] = {};
        }
        const topicName = task.topic || 'Other';
        if (!grouped[task.subject][topicName]) {
            grouped[task.subject][topicName] = [];
        }
        grouped[task.subject][topicName].push(task);
    });
    
    // Generate HTML
    let html = '';
    Object.keys(grouped).forEach(subject => {
        const subjectTasks = Object.values(grouped[subject]).flat();
        const completedCount = subjectTasks.filter(t => t.completed).length;
        const totalCount = subjectTasks.length;
        const percentage = Math.round((completedCount / totalCount) * 100);
        
        html += `
            <div class="subject-section">
                <div class="subject-header" onclick="toggleSubject('subject-${subject.replace(/\s+/g, '-')}')">
                    <div class="subject-header-left">
                        <i class="fas fa-chevron-down toggle-icon" id="icon-subject-${subject.replace(/\s+/g, '-')}"></i>
                        <span class="subject-badge-large" style="background: ${getSubjectColor(subject)}">
                            ${subject}
                        </span>
                    </div>
                    <div class="subject-header-right">
                        <span class="progress-text">${completedCount}/${totalCount} completed (${percentage}%)</span>
                        <div class="mini-progress-bar">
                            <div class="mini-progress-fill" style="width: ${percentage}%; background: ${getSubjectColor(subject)}"></div>
                        </div>
                    </div>
                </div>
                <div class="subject-content" id="subject-${subject.replace(/\s+/g, '-')}">
        `;
        
        // Topics within subject
        Object.keys(grouped[subject]).forEach(topic => {
            const topicTasks = grouped[subject][topic];
            const topicCompleted = topicTasks.filter(t => t.completed).length;
            const topicTotal = topicTasks.length;
            const topicPercentage = Math.round((topicCompleted / topicTotal) * 100);
            
            html += `
                <div class="topic-section">
                    <div class="topic-header" onclick="toggleTopic('topic-${subject.replace(/\s+/g, '-')}-${topic.replace(/\s+/g, '-')}')">
                        <div class="topic-header-left">
                            <i class="fas fa-chevron-down toggle-icon" id="icon-topic-${subject.replace(/\s+/g, '-')}-${topic.replace(/\s+/g, '-')}"></i>
                            <i class="fas fa-folder topic-icon"></i>
                            <span class="topic-name">${topic}</span>
                        </div>
                        <div class="topic-header-right">
                            <span class="topic-progress">${topicCompleted}/${topicTotal}</span>
                        </div>
                    </div>
                    <div class="topic-content" id="topic-${subject.replace(/\s+/g, '-')}-${topic.replace(/\s+/g, '-')}">
            `;
            
            // Tasks within topic
            topicTasks.forEach(task => {
                html += `
                    <div class="task-item ${task.completed ? 'completed' : ''}">
                        <div class="task-item-left">
                            <input type="checkbox" 
                                   class="task-checkbox" 
                                   ${task.completed ? 'checked' : ''} 
                                   onchange="toggleTask(${task.id})">
                            <span class="task-item-name ${task.completed ? 'completed' : ''}">${task.name}</span>
                        </div>
                        <div class="task-item-right">
                            <span class="priority-badge ${task.priority}">${task.priority.toUpperCase()}</span>
                            <button class="btn-icon-small" onclick="deleteTask(${task.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    updateProgress();
}

// Toggle Subject Accordion
function toggleSubject(id) {
    const content = document.getElementById(id);
    const icon = document.getElementById('icon-' + id);
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.style.transform = 'rotate(0deg)';
    } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(-90deg)';
    }
}

// Toggle Topic Accordion
function toggleTopic(id) {
    const content = document.getElementById(id);
    const icon = document.getElementById('icon-' + id);
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.style.transform = 'rotate(0deg)';
    } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(-90deg)';
    }
}

// Render Table View
function renderTableView() {
    const allTasks = getTasks();
    const tasks = currentFilter === 'all' 
        ? allTasks 
        : allTasks.filter(t => t.subject === currentFilter);
    
    const tbody = document.getElementById('planTableBody');
    
    if (tasks.length === 0) {
        const message = currentFilter === 'all' 
            ? 'No tasks yet. Upload your course plan or add tasks manually.'
            : `No tasks found for "${currentFilter}". Try selecting a different subject.`;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    ${message}
                </td>
            </tr>
        `;
        updateProgress();
        return;
    }

    tbody.innerHTML = tasks.map(task => {
        const displayName = task.topic ? `${task.topic} - ${task.name}` : task.name;
        return `
        <tr class="${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
            <td>
                <div class="checkbox-wrapper">
                    <input type="checkbox" 
                           class="task-checkbox" 
                           ${task.completed ? 'checked' : ''} 
                           onchange="toggleTask(${task.id})">
                </div>
            </td>
            <td>
                <span class="subject-badge" style="background: ${getSubjectColor(task.subject)}">
                    ${task.subject}
                </span>
            </td>
            <td>
                <span class="task-name ${task.completed ? 'completed' : ''}">${displayName}</span>
            </td>
            <td>
                <span class="priority-badge ${task.priority}">${task.priority.toUpperCase()}</span>
            </td>
            <td>
                <span class="date-text">${formatDate(task.addedOn)}</span>
            </td>
            <td>
                <span class="date-text">${task.completedOn ? formatDate(task.completedOn) : '-'}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="deleteTask(${task.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    }).join('');

    updateProgress();
    updateSubjectChips();
}

// Render Course Plan (wrapper function)
function renderPlan() {
    if (isHierarchicalView) {
        renderHierarchicalView();
    } else {
        renderTableView();
    }
}

// Toggle Task Completion
function toggleTask(taskId) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
        task.completed = !task.completed;
        task.completedOn = task.completed ? new Date().toISOString() : null;
        saveData(tasks);
        
        if (isHierarchicalView) {
            renderHierarchicalView();
        } else {
            renderTableView();
        }
        
        if (task.completed) {
            showNotification('Great job! Task completed! 🎉', 'success');
            celebrateCompletion();
        }
    }
}

// Delete Task
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        let tasks = getTasks();
        tasks = tasks.filter(t => t.id !== taskId);
        saveData(tasks);
        renderPlan();
        showNotification('Task deleted!', 'info');
    }
}

// Update Progress
function updateProgress() {
    const tasks = getTasks();
    const subjects = [...new Set(tasks.map(t => t.subject))];
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('subjectCount').textContent = subjects.length;
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('totalCount').textContent = total;
    document.getElementById('percentageComplete').textContent = percentage + '%';
    document.getElementById('progressBar').style.width = percentage + '%';
}

// Update Subject Chips
function updateSubjectChips() {
    const tasks = getTasks();
    const subjects = [...new Set(tasks.map(t => t.subject))];
    const chipsContainer = document.getElementById('subjectChips');
    
    if (subjects.length === 0) {
        chipsContainer.innerHTML = '<p style="color: var(--text-secondary);">No subjects yet</p>';
        return;
    }
    
    const allChip = `
        <button class="chip ${currentFilter === 'all' ? 'active' : ''}" 
                onclick="filterBySubject('all')">
            <i class="fas fa-list"></i> All (${tasks.length})
        </button>
    `;
    
    const subjectChips = subjects.map(subject => {
        const subjectTasks = tasks.filter(t => t.subject === subject);
        const completedCount = subjectTasks.filter(t => t.completed).length;
        const totalCount = subjectTasks.length;
        
        return `
            <button class="chip ${currentFilter === subject ? 'active' : ''}" 
                    onclick="filterBySubject('${subject.replace(/'/g, "\\'")}')">
                ${subject} (${completedCount}/${totalCount})
            </button>
        `;
    }).join('');
    
    chipsContainer.innerHTML = allChip + subjectChips;
}

// Filter by Subject
function filterBySubject(subject) {
    currentFilter = subject;
    renderPlan();
    
    // Scroll to table
    document.getElementById('planSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Get Subject Color
function getSubjectColor(subject) {
    const colors = [
        'linear-gradient(135deg, #3366ff, #5478ff)',
        'linear-gradient(135deg, #9333ea, #a855f7)',
        'linear-gradient(135deg, #ec4899, #f472b6)',
        'linear-gradient(135deg, #10b981, #34d399)',
        'linear-gradient(135deg, #f59e0b, #fbbf24)',
        'linear-gradient(135deg, #ef4444, #f87171)',
        'linear-gradient(135deg, #06b6d4, #22d3ee)',
        'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    ];
    
    // Generate consistent color based on subject name
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
        hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

// Show Add Task Modal
function showAddTaskModal() {
    // Populate existing subjects and topics in datalist
    const tasks = getTasks();
    const subjects = [...new Set(tasks.map(t => t.subject))];
    const topics = [...new Set(tasks.filter(t => t.topic).map(t => t.topic))];
    
    const subjectList = document.getElementById('subjectList');
    subjectList.innerHTML = subjects.map(s => `<option value="${s}">`).join('');
    
    const topicList = document.getElementById('topicList');
    topicList.innerHTML = topics.map(t => `<option value="${t}">`).join('');
    
    document.getElementById('addTaskModal').classList.add('active');
}

// Close Add Task Modal
function closeAddTaskModal() {
    document.getElementById('addTaskModal').classList.remove('active');
    document.getElementById('taskSubject').value = '';
    document.getElementById('taskTopic').value = '';
    document.getElementById('taskName').value = '';
    document.getElementById('taskPriority').value = 'medium';
}

// Add New Task
function addNewTask(event) {
    event.preventDefault();
    
    const taskSubject = document.getElementById('taskSubject').value.trim();
    const taskTopic = document.getElementById('taskTopic').value.trim();
    const taskName = document.getElementById('taskName').value.trim();
    const taskPriority = document.getElementById('taskPriority').value;
    
    if (taskSubject === '' || taskName === '') {
        alert('Please fill in Subject and Task name!');
        return;
    }

    const tasks = getTasks();
    const newTask = {
        id: Date.now(),
        subject: taskSubject,
        topic: taskTopic || null,
        name: taskName,
        completed: false,
        priority: taskPriority,
        addedOn: new Date().toISOString(),
        completedOn: null
    };

    tasks.push(newTask);
    saveData(tasks);
    renderPlan();
    closeAddTaskModal();
    showNotification('Task added successfully!', 'success');
}

// Clear All Data
function clearAllData() {
    if (confirm('Are you sure you want to clear all your progress? This cannot be undone!')) {
        localStorage.removeItem(STORAGE_KEY);
        currentFilter = 'all';
        document.getElementById('heroSection').style.display = 'block';
        document.getElementById('homeSection').style.display = 'none';
        document.getElementById('progressSection').style.display = 'none';
        document.getElementById('planSection').style.display = 'none';
        showNotification('All data cleared!', 'info');
    }
}

// Export Progress
function exportProgress() {
    const tasks = getTasks();
    
    if (tasks.length === 0) {
        alert('No data to export!');
        return;
    }

    const subjects = [...new Set(tasks.map(t => t.subject))];
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const percentage = Math.round((completed / total) * 100);

    let content = `Coursify - Progress Report\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `\n=================================\n`;
    content += `Overall Progress: ${completed}/${total} tasks (${percentage}%)\n`;
    content += `Total Subjects: ${subjects.length}\n`;
    content += `=================================\n\n`;

    // Progress by subject
    content += `PROGRESS BY SUBJECT:\n`;
    content += `--------------------\n`;
    subjects.forEach(subject => {
        const subjectTasks = tasks.filter(t => t.subject === subject);
        const subjectCompleted = subjectTasks.filter(t => t.completed).length;
        const subjectTotal = subjectTasks.length;
        const subjectPercentage = Math.round((subjectCompleted / subjectTotal) * 100);
        content += `${subject}: ${subjectCompleted}/${subjectTotal} (${subjectPercentage}%)\n`;
    });
    content += `\n`;

    // Completed tasks by subject
    content += `COMPLETED TASKS (${completed}):\n`;
    content += `------------------\n`;
    subjects.forEach(subject => {
        const completedTasks = tasks.filter(t => t.subject === subject && t.completed);
        if (completedTasks.length > 0) {
            content += `\n[${subject}]\n`;
            completedTasks.forEach((task, index) => {
                content += `  ${index + 1}. [✓] ${task.name}\n`;
                content += `     Priority: ${task.priority.toUpperCase()} | Completed: ${formatDate(task.completedOn)}\n`;
            });
        }
    });

    // Pending tasks by subject
    const pending = tasks.filter(t => !t.completed);
    if (pending.length > 0) {
        content += `\n\nPENDING TASKS (${pending.length}):\n`;
        content += `------------------\n`;
        subjects.forEach(subject => {
            const pendingTasks = tasks.filter(t => t.subject === subject && !t.completed);
            if (pendingTasks.length > 0) {
                content += `\n[${subject}]\n`;
                pendingTasks.forEach((task, index) => {
                    content += `  ${index + 1}. [ ] ${task.name}\n`;
                    content += `     Priority: ${task.priority.toUpperCase()}\n`;
                });
            }
        });
    }

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `course-progress-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Progress exported successfully!', 'success');
}

// Format Date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Show Notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === 'success' ? 'linear-gradient(135deg, var(--accent-green), var(--accent-blue))' : 'var(--bg-tertiary)'};
        color: var(--text-primary);
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Celebrate Completion
function celebrateCompletion() {
    const tasks = getTasks();
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;

    if (completed === total && total > 0) {
        setTimeout(() => {
            showNotification('🎉 Congratulations! You completed your entire course! 🎉', 'success');
        }, 500);
    }
}

// Scroll to Top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
