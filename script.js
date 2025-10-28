// =======================
// Main Script.js
// =======================

document.addEventListener('DOMContentLoaded', function() {
    // ----------------------
    // Bootstrap Initialization
    // ----------------------
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    document.querySelectorAll('.modal').forEach(modalEl => {
        new bootstrap.Modal(modalEl);
    });

    // ----------------------
    // Global Data
    // ----------------------
    window.groupsData = [
        { id: '1', name: 'English 101', description: 'Beginner English class', studentCount: 15, color: '#4361ee' },
        { id: '2', name: 'Math Advanced', description: 'Advanced mathematics', studentCount: 12, color: '#ef476f' }
    ];
    window.allEvents = []; // global array for calendar events

    // ----------------------
    // Navigation
    // ----------------------
    const navLinks = document.querySelectorAll('.nav-link, [data-page]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            if (targetPage) {
                showPage(targetPage);
                updateGroupSelections();
            }
        });
    });

    showPage('dashboard');

    // ----------------------
    // Initialize Calendars
    // ----------------------
    initializeCalendars();

    // ----------------------
    // Initialize Forms and Action Buttons
    // ----------------------
    initializeFormHandlers();
    initializeActionButtons();

    // ----------------------
    // Update Group Selections Everywhere
    // ----------------------
    updateGroupSelections();
});

// =======================
// Page Navigation
// =======================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');

    setTimeout(() => {
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) targetPage.style.display = 'block';
        else document.getElementById('dashboard-page').style.display = 'block';
    }, 10);

    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    if (activeLink) activeLink.classList.add('active');
}

// =======================
// Calendar Initialization
// =======================
function initializeCalendars() {
    const calendarEl = document.getElementById('calendar');
    const miniCalendarEl = document.getElementById('mini-calendar');

    if (miniCalendarEl) {
        window.miniCalendar = new FullCalendar.Calendar(miniCalendarEl, {
            initialView: 'dayGridMonth',
            height: 200,
            headerToolbar: false,
            events: window.allEvents,
            eventClick: info => {
                alert(`Event: ${info.event.title}\nDescription: ${info.event.extendedProps.description || 'No description'}`);
            }
        });
        window.miniCalendar.render();
    }

    if (calendarEl) {
        window.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: window.allEvents,
            eventClick: info => {
                const description = info.event.extendedProps.description || 'No description';
                const groups = info.event.extendedProps.groups || [];
                alert(`Event: ${info.event.title}\nDescription: ${description}\nGroups: ${groups.join(', ')}`);
            }
        });
        window.calendar.render();
    }

    // Setup modal save button and filters
    setupCalendarEventHandlers();
}

// =======================
// Calendar Modal & Filters
// =======================
function setupCalendarEventHandlers() {
    const saveEventBtn = document.getElementById('save-event');
    const applyFilterBtn = document.getElementById('apply-calendar-filter');
    const resetFilterBtn = document.getElementById('reset-calendar-filter');

    if (saveEventBtn) {
        saveEventBtn.addEventListener('click', function() {
            const title = document.getElementById('event-title').value;
            const start = document.getElementById('event-start-date').value;
            const end = document.getElementById('event-end-date').value;
            const description = document.getElementById('event-description') ? .value || '';

            if (!title || !start || !end) return alert('Please fill in all required fields!');

            const groups = Array.from(document.querySelectorAll('#event-groups .form-check-input'))
                .filter(cb => cb.checked)
                .map(cb => cb.value);

            const event = { title, start, end, extendedProps: { description, groups } };
            window.allEvents.push(event);

            if (window.calendar) window.calendar.addEvent(event);
            if (window.miniCalendar) window.miniCalendar.addEvent(event);

            bootstrap.Modal.getInstance(document.getElementById('addEventModal')).hide();
            document.getElementById('add-event-form').reset();
        });
    }

    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', function() {
            const selectedGroups = Array.from(document.getElementById('calendar-group-filter').selectedOptions)
                .map(opt => opt.value);

            window.calendar.removeAllEvents();
            window.allEvents.forEach(ev => {
                if (!selectedGroups.length || ev.extendedProps.groups.some(g => selectedGroups.includes(g))) {
                    window.calendar.addEvent(ev);
                }
            });
        });
    }

    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', function() {
            document.getElementById('calendar-group-filter').selectedIndex = -1;
            window.calendar.removeAllEvents();
            window.allEvents.forEach(ev => window.calendar.addEvent(ev));
        });
    }
}

// =======================
// Group Management
// =======================
function updateGroupSelections() {
    const groupSelects = [
        document.getElementById('student-group'),
        document.getElementById('attendance-group-select'),
        document.getElementById('homework-group-select'),
        document.getElementById('calendar-group-filter')
    ];
    const groupCheckboxContainers = [document.getElementById('event-groups')];

    // Update selects
    groupSelects.forEach(select => {
        if (!select) return;
        const currentValue = select.value;
        const firstOption = select.querySelector('option:first-child');
        select.innerHTML = '';
        if (firstOption && !firstOption.value) select.appendChild(firstOption);

        window.groupsData.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            select.appendChild(option);
        });

        if (currentValue) select.value = currentValue;
    });

    // Update checkboxes
    groupCheckboxContainers.forEach(container => {
        if (!container) return;
        container.innerHTML = '';
        window.groupsData.forEach(group => {
            const div = document.createElement('div');
            div.className = 'form-check';
            div.innerHTML = `
                <input class="form-check-input" type="checkbox" value="${group.id}" id="event-group-${group.id}">
                <label class="form-check-label" for="event-group-${group.id}">${group.name}</label>
            `;
            container.appendChild(div);
        });
    });

    // Attendance preview
    const attendanceGroupsPreview = document.getElementById('attendance-groups-preview');
    if (attendanceGroupsPreview) {
        attendanceGroupsPreview.innerHTML = '';
        window.groupsData.forEach(group => {
            attendanceGroupsPreview.innerHTML += `
                <a href="#" class="list-group-item list-group-item-action" 
                   onclick="document.getElementById('attendance-group-select').value='${group.id}'; 
                            document.getElementById('load-attendance').click(); 
                            return false;">
                    ${group.name} <span class="badge bg-primary rounded-pill">${group.studentCount} students</span>
                </a>
            `;
        });
    }
}

// =======================
// Forms & Action Buttons
// =======================
function initializeFormHandlers() {
    // Groups, Students, Homework
    setupFormHandler('save-group', 'group-name', 'group-description', 'addGroupModal', 'groups-container', createGroupCard);
    setupFormHandler('save-student', 'student-name', 'student-email', 'addStudentModal', 'students-table-body', createStudentRow);
    setupFormHandler('save-homework', 'homework-title', 'homework-description', 'assignHomeworkModal', 'homework-table-body', createHomeworkRow);

    // Attendance
    const loadAttendanceBtn = document.getElementById('load-attendance');
    if (loadAttendanceBtn) {
        loadAttendanceBtn.addEventListener('click', function() {
            const groupSelect = document.getElementById('attendance-group-select');
            const groupName = groupSelect.options[groupSelect.selectedIndex] ? .text || '';
            const date = document.getElementById('attendance-date').value;

            if (groupSelect.value && date) {
                document.getElementById('attendance-group-name').textContent = groupName;
                document.getElementById('attendance-date-display').textContent = new Date(date).toLocaleDateString();
                document.getElementById('attendance-form-container').style.display = 'block';
            } else alert('Please select a group and date');
        });
    }

    // Delete buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-group') ||
            e.target.classList.contains('delete-student') ||
            e.target.classList.contains('delete-homework')) {
            if (confirm('Are you sure you want to delete this item?')) {
                const row = e.target.closest('tr');
                if (row) row.remove();
                else e.target.closest('.col-md-4') ? .remove();
            }
        }
    });
}

function initializeActionButtons() {
    // View/Edit groups
    document.querySelectorAll('.view-group').forEach(btn => {
        btn.addEventListener('click', () => alert(`Viewing group`));
    });
    document.querySelectorAll('.edit-group').forEach(btn => {
        btn.addEventListener('click', function() {
            const groupId = this.closest('[data-group-id]') ? .dataset.groupId;
            const group = window.groupsData.find(g => g.id === groupId);
            if (!group) return;

            document.getElementById('group-name').value = group.name;
            document.getElementById('group-description').value = group.description;
            document.getElementById('group-color').value = group.color;
            document.getElementById('addGroupModal').dataset.editingId = groupId;

            new bootstrap.Modal(document.getElementById('addGroupModal')).show();
        });
    });

    // View/Edit Students
    document.querySelectorAll('.view-student, .edit-student').forEach(btn => {
        btn.addEventListener('click', function() {
            alert(`Viewing/Editing student`);
        });
    });

    // View/Edit Homework
    document.querySelectorAll('.view-homework, .edit-homework').forEach(btn => {
        btn.addEventListener('click', function() {
            alert(`Viewing/Editing homework`);
        });
    });
}

// =======================
// Utility Functions
// =======================
function setupFormHandler(buttonId, nameFieldId, descFieldId, modalId, containerId, createElementFunc) {
    const saveBtn = document.getElementById(buttonId);
    if (!saveBtn) return;

    saveBtn.addEventListener('click', function() {
        const name = document.getElementById(nameFieldId).value;
        const description = document.getElementById(descFieldId) ? .value || '';
        if (!name) return alert('Please fill in all required fields');

        if (buttonId === 'save-group') {
            const newId = (Math.max(...window.groupsData.map(g => parseInt(g.id)), 0) + 1).toString();
            const color = document.getElementById('group-color').value;
            const editingId = document.getElementById(modalId).dataset.editingId;

            if (editingId) {
                const groupIndex = window.groupsData.findIndex(g => g.id === editingId);
                if (groupIndex !== -1) {
                    window.groupsData[groupIndex] = {...window.groupsData[groupIndex], name, description, color };
                }
                delete document.getElementById(modalId).dataset.editingId;
            } else {
                window.groupsData.push({ id: newId, name, description, studentCount: 0, color });
            }

            updateGroupSelections();
        }

        alert(`"${name}" has been added!`);
        const container = document.getElementById(containerId);
        if (container) container.insertAdjacentHTML('beforeend', createElementFunc(name, description));

        const modalElement = document.getElementById(modalId);
        bootstrap.Modal.getInstance(modalElement) ? .hide();
        document.getElementById(`add-${buttonId.split('-')[1]}-form`) ? .reset();
    });
}

function createGroupCard(name, description, color = '#4361ee') {
    return `
        <div class="col-md-4 mb-4" data-group-id="">
            <div class="card">
                <div class="card-header" style="background-color: ${color}; height: 10px;"></div>
                <div class="card-body">
                    <h5 class="card-title">${name}</h5>
                    <p class="card-text">${description}</p>
                    <p class="card-text"><small class="text-muted">0 students</small></p>
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-sm btn-primary view-group">View</button>
                        <button class="btn btn-sm btn-warning edit-group" data-color="${color}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-group">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createStudentRow(name, email) {
    const groupSelect = document.getElementById('student-group');
    const groupName = groupSelect ? .options[groupSelect.selectedIndex] ? .text || 'Not assigned';

    return `
        <tr>
            <td>${name}</td>
            <td>${email}</td>
            <td>${groupName}</td>
            <td>
                <button class="btn btn-sm btn-primary view-student">View</button>
                <button class="btn btn-sm btn-warning edit-student">Edit</button>
                <button class="btn btn-sm btn-danger delete-student">Delete</button>
            </td>
        </tr>
    `;
}

function createHomeworkRow(title, description) {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 7);

    return `
        <tr>
            <td>${title}</td>
            <td>All Groups</td>
            <td>${dueDate.toISOString().split('T')[0]}</td>
            <td><span class="badge bg-warning">Pending</span></td>
            <td>
                <button class="btn btn-sm btn-primary view-homework">View</button>
                <button class="btn btn-sm btn-warning edit-homework">Edit</button>
                <button class="btn btn-sm btn-danger delete-homework">Delete</button>
            </td>
        </tr>
    `;
}