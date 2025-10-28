document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap components
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize all modals
    document.querySelectorAll('.modal').forEach(modalEl => {
        new bootstrap.Modal(modalEl);
    });

    // Global groups storage
    window.groupsData = [
        { id: '1', name: 'English 101', description: 'Beginner English class', studentCount: 15, color: '#4361ee' },
        { id: '2', name: 'Math Advanced', description: 'Advanced mathematics', studentCount: 12, color: '#ef476f' }
    ];

    // Navigation
    const navLinks = document.querySelectorAll('.nav-link, [data-page]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            if (targetPage) {
                showPage(targetPage);
                // Update dropdowns and selects when switching pages
                updateGroupSelections();
            }
        });
    });

    // Show initial page (dashboard)
    showPage('dashboard');

    // Initialize calendar
    initializeCalendar();
    initializeMiniCalendar();

    // Initialize form handlers
    initializeFormHandlers();

    // Initialize view and edit buttons
    initializeActionButtons();

    // Initial update of all group selections
    updateGroupSelections();
});

// Function to show a specific page
function showPage(pageId) {
    // Force redraw of all pages
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });

    // Show the selected page with a slight delay to ensure DOM updates
    setTimeout(() => {
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.style.display = 'block';
            console.log(`Showing page: ${pageId}-page`);

            // If we just showed the calendar page, ensure the FullCalendar
            // instance is rendered and sized correctly. FullCalendar cannot
            // compute sizes when initialized on a hidden container, so we
            // render (or update) it after the page becomes visible.
            if (pageId === 'calendar') {
                const calendarEl = document.getElementById('calendar');
                if (calendarEl && calendarEl.fullCalendar) {
                    const cal = calendarEl.fullCalendar;
                    // Render only once
                    if (!cal._rendered) {
                        try {
                            cal.render();
                        } catch (e) {
                            // Some environments may attach instance differently;
                            // try calling render on a stored global instance as a fallback
                            if (window.calendarInstance && typeof window.calendarInstance.render === 'function') {
                                window.calendarInstance.render();
                            }
                        }
                        cal._rendered = true;
                    }
                    // Always update size after becoming visible
                    if (typeof cal.updateSize === 'function') cal.updateSize();
                }
            }
        } else {
            console.error(`Page not found: ${pageId}-page`);
            // Fallback to dashboard if page not found
            document.getElementById('dashboard-page').style.display = 'block';
        }
    }, 10);

    // Update active state in navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });
}

// Initialize FullCalendar
// Initialize FullCalendar with Mongoose backend integration
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        // Fetch events from backend
        events: async function(fetchInfo, successCallback, failureCallback) {
            try {
                const res = await fetch('/api/calendar-events');
                const events = await res.json();
                // Transform backend events into FullCalendar format
                const fcEvents = events.map(ev => ({
                    id: ev._id,
                    title: ev.title,
                    start: ev.start,
                    end: ev.end,
                    backgroundColor: ev.backgroundColor || '#6c757d',
                    extendedProps: {
                        description: ev.description,
                        groupIds: ev.groupIds || []
                    }
                }));
                successCallback(fcEvents);
            } catch (err) {
                console.error('Failed to fetch events', err);
                failureCallback(err);
            }
        },
        eventClick: function(info) {
            const description = info.event.extendedProps ? .description || 'No description';
            const groupIds = info.event.extendedProps ? .groupIds || [];
            alert(`Event: ${info.event.title}\nDescription: ${description}\nStart: ${info.event.start}\nEnd: ${info.event.end}\nGroups: ${groupIds.join(', ')}`);
        }
    });

    calendarEl.fullCalendar = calendar;
    window.calendarInstance = calendar;
    calendar._rendered = false;

    // Apply group filter
    const applyFilterBtn = document.getElementById('apply-calendar-filter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', function() {
            const selectedGroups = Array.from(document.getElementById('calendar-group-filter').selectedOptions)
                .map(opt => opt.value);

            calendar.getEvents().forEach(event => {
                const groups = event.extendedProps.groupIds || [];
                if (selectedGroups.length === 0 || groups.some(g => selectedGroups.includes(g))) {
                    event.setProp('display', 'auto');
                } else {
                    event.setProp('display', 'none');
                }
            });
        });
    }

    // Reset filter
    const resetFilterBtn = document.getElementById('reset-calendar-filter');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', function() {
            document.getElementById('calendar-group-filter').selectedIndex = -1;
            calendar.getEvents().forEach(event => event.setProp('display', 'auto'));
        });
    }

    // Event creation handler
    const saveEventBtn = document.getElementById('save-event');
    if (saveEventBtn) {
        saveEventBtn.addEventListener('click', async function() {
            const title = document.getElementById('event-title').value;
            const description = document.getElementById('event-description') ? .value || '';
            const startDate = document.getElementById('event-start-date').value;
            const endDate = document.getElementById('event-end-date').value;
            const selectedGroupIds = Array.from(document.querySelectorAll('input[id^="event-group-"]:checked'))
                .map(cb => cb.value);

            if (!title || !startDate || !endDate) return alert('Please fill in all required fields');

            try {
                const res = await fetch('/api/calendar-events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        description,
                        startDate,
                        endDate,
                        groups: selectedGroupIds,
                        createdBy: 'ID_DO_PROFESSOR_FIXO_AQUI' // Substituir pelo ID real
                    })
                });
                const newEvent = await res.json();

                // Add event(s) to calendar
                if (selectedGroupIds.length > 0) {
                    selectedGroupIds.forEach(groupId => {
                        const group = window.groupsData.find(g => g.id === groupId);
                        calendar.addEvent({
                            id: newEvent._id + '-' + groupId,
                            title: `${title} (${group?.name || ''})`,
                            start: startDate,
                            end: endDate,
                            backgroundColor: group ? .color || '#6c757d',
                            extendedProps: {
                                description,
                                groupIds: [groupId]
                            }
                        });
                    });
                } else {
                    calendar.addEvent({
                        id: newEvent._id,
                        title,
                        start: startDate,
                        end: endDate,
                        backgroundColor: '#6c757d',
                        extendedProps: { description, groupIds: [] }
                    });
                }

                const modal = bootstrap.Modal.getInstance(document.getElementById('addEventModal'));
                if (modal) modal.hide();
                document.getElementById('add-event-form').reset();
            } catch (err) {
                console.error('Failed to save event', err);
                alert('Failed to save event');
            }
        });
    }
}

// Initialize mini calendar for dashboard
// Initialize mini calendar with backend integration
function initializeMiniCalendar() {
    const miniCalendarEl = document.getElementById('mini-calendar');
    if (!miniCalendarEl) return;

    const miniCalendar = new FullCalendar.Calendar(miniCalendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next',
            center: 'title',
            right: ''
        },
        height: 'auto',
        events: async function(fetchInfo, successCallback, failureCallback) {
            try {
                const res = await fetch('/api/calendar-events');
                const events = await res.json();
                const fcEvents = events.map(ev => ({
                    id: ev._id,
                    title: ev.title,
                    start: ev.start,
                    end: ev.end,
                    backgroundColor: ev.backgroundColor || '#6c757d',
                    extendedProps: {
                        description: ev.description,
                        groupIds: ev.groupIds || []
                    }
                }));
                successCallback(fcEvents);
            } catch (err) {
                console.error('Failed to fetch mini calendar events', err);
                failureCallback(err);
            }
        },
        eventClick: function(info) {
            const description = info.event.extendedProps ? .description || 'No description';
            alert(`Event: ${info.event.title}\nDescription: ${description}\nStart: ${info.event.start}`);
        }
    });

    miniCalendar.render();
    window.miniCalendarInstance = miniCalendar;
}

// Initialize form handlers
function initializeFormHandlers() {
    // Form submission handlers
    setupFormHandler('save-group', 'group-name', 'group-description', 'addGroupModal', 'groups-container', createGroupCard);
    setupFormHandler('save-student', 'student-name', 'student-email', 'addStudentModal', 'students-table-body', createStudentRow);
    setupFormHandler('save-homework', 'homework-title', 'homework-description', 'assignHomeworkModal', 'homework-table-body', createHomeworkRow);

    // Calendar Event Handler
    const saveEventBtn = document.getElementById('save-event');
    if (saveEventBtn) {
        saveEventBtn.addEventListener('click', function() {
            const title = document.getElementById('event-title').value;
            const description = document.getElementById('event-description') ? .value || '';
            const startDate = document.getElementById('event-start-date').value;
            const endDate = document.getElementById('event-end-date').value;

            // Get colors from groupsData
            const groupColors = {};
            window.groupsData.forEach(group => {
                groupColors[group.id] = group.color;
            });

            // Get selected groups from checkboxes
            const selectedGroups = [];
            document.querySelectorAll('input[id^="event-group-"]:checked').forEach(checkbox => {
                selectedGroups.push({
                    id: checkbox.value,
                    name: checkbox.nextElementSibling.textContent.trim(),
                    color: groupColors[checkbox.value] || '#6c757d'
                });
            });

            if (title && startDate && endDate) {
                const calendarEl = document.getElementById('calendar');

                if (selectedGroups.length > 0) {
                    // Create separate events for each selected group
                    selectedGroups.forEach(group => {
                        const newEvent = {
                            title: `${title} (${group.name})`,
                            start: startDate,
                            end: endDate,
                            backgroundColor: group.color,
                            groupId: group.id,
                            extendedProps: {
                                description: description
                            }
                        };

                        // Add to calendar
                        if (calendarEl && calendarEl.fullCalendar) {
                            calendarEl.fullCalendar.addEvent(newEvent);
                        }
                    });
                } else {
                    // Create a single event with no group
                    const newEvent = {
                        title: title,
                        start: startDate,
                        end: endDate,
                        backgroundColor: '#6c757d',
                        extendedProps: {
                            description: description
                        }
                    };

                    // Add to calendar
                    if (calendarEl && calendarEl.fullCalendar) {
                        calendarEl.fullCalendar.addEvent(newEvent);
                    }
                }

                alert(`Event "${title}" has been added!`);

                // Close modal
                const modalElement = document.getElementById('addEventModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                } else {
                    const newModal = new bootstrap.Modal(modalElement);
                    newModal.hide();
                }

                // Reset form
                document.getElementById('add-event-form').reset();
                document.querySelectorAll('input[id^="event-group-"]:checked').forEach(checkbox => {
                    checkbox.checked = false;
                });
            } else {
                alert('Please fill in all required fields');
            }
        });
    }

    // Attendance Form
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
            } else {
                alert('Please select a group and date');
            }
        });
    }

    // Delete buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-group') ||
            e.target.classList.contains('delete-student') ||
            e.target.classList.contains('delete-homework')) {
            if (confirm('Are you sure you want to delete this item?')) {
                const row = e.target.closest('tr');
                if (row) {
                    row.remove();
                } else {
                    e.target.closest('.col-md-4').remove();
                }
            }
        }
    });
}

// Update all group selections across the site
function updateGroupSelections() {
    // Get all group selection elements
    const groupSelects = [
        document.getElementById('student-group'),
        document.getElementById('attendance-group-select'),
        document.getElementById('homework-group-select'),
        document.getElementById('calendar-group-filter')
    ];

    // Get all group checkbox containers
    const groupCheckboxContainers = [
        document.getElementById('event-groups')
    ];

    // Update dropdowns
    groupSelects.forEach(select => {
        if (select) {
            // Save current selection if any
            const currentValue = select.value;

            // Clear options except the first one (if it's a placeholder)
            const firstOption = select.querySelector('option:first-child');
            select.innerHTML = '';
            if (firstOption && !firstOption.value) {
                select.appendChild(firstOption);
            }

            // Add options for each group
            window.groupsData.forEach(group => {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = group.name;
                select.appendChild(option);
            });

            // Restore selection if possible
            if (currentValue) {
                select.value = currentValue;
            }
        }
    });

    // Update checkboxes
    groupCheckboxContainers.forEach(container => {
        if (container) {
            container.innerHTML = '';

            // Add a checkbox for each group
            window.groupsData.forEach(group => {
                const div = document.createElement('div');
                div.className = 'form-check';
                div.innerHTML = `
                    <input class="form-check-input" type="checkbox" value="${group.id}" id="event-group-${group.id}">
                    <label class="form-check-label" for="event-group-${group.id}">
                        ${group.name}
                    </label>
                `;
                container.appendChild(div);
            });
        }
    });

    // Update attendance groups preview
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

function setupFormHandler(buttonId, nameFieldId, descFieldId, modalId, containerId, createElementFunc) {
    const saveBtn = document.getElementById(buttonId);
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const name = document.getElementById(nameFieldId).value;
            const description = document.getElementById(descFieldId) ? .value || '';

            if (name) {
                // Special handling for groups
                if (buttonId === 'save-group') {
                    // Generate a new ID (in a real app, this would come from the server)
                    const newId = (Math.max(...window.groupsData.map(g => parseInt(g.id)), 0) + 1).toString();

                    // Get the selected color
                    const color = document.getElementById('group-color').value;

                    // Check if we're editing an existing group
                    const editingId = document.getElementById('addGroupModal').dataset.editingId;

                    if (editingId) {
                        // Update existing group
                        const groupIndex = window.groupsData.findIndex(g => g.id === editingId);
                        if (groupIndex !== -1) {
                            window.groupsData[groupIndex].name = name;
                            window.groupsData[groupIndex].description = description;
                            window.groupsData[groupIndex].color = color;

                            // Update all events with this group's color
                            updateEventsWithGroupColor(editingId, color);
                        }
                        // Clear the editing ID
                        delete document.getElementById('addGroupModal').dataset.editingId;
                    } else {
                        // Add new group to global groups data
                        window.groupsData.push({
                            id: newId,
                            name: name,
                            description: description,
                            studentCount: 0,
                            color: color
                        });
                    }

                    // Update all group selections
                    updateGroupSelections();
                }

                alert(`"${name}" has been added!`);

                const container = document.getElementById(containerId);
                if (container) {
                    container.insertAdjacentHTML('beforeend', createElementFunc(name, description));
                }

                // Get the modal element and hide it
                const modalElement = document.getElementById(modalId);
                const modalInstance = bootstrap.Modal.getInstance(modalElement);

                if (modalInstance) {
                    modalInstance.hide();
                } else {
                    // If the modal instance doesn't exist, create and hide it
                    const newModal = new bootstrap.Modal(modalElement);
                    newModal.hide();
                }

                const form = document.getElementById(`add-${buttonId.split('-')[1]}-form`);
                if (form) form.reset();
            } else {
                alert('Please fill in all required fields');
            }
        });
    }
}

function createGroupCard(name, description, color = '#4361ee') {
    return `
        <div class="col-md-4 mb-4">
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

// Render groups
function renderGroups() {
    const groupsContainer = document.getElementById('groups-container');
    if (!groupsContainer) return;

    groupsContainer.innerHTML = '';

    window.groupsData.forEach(group => {
        const groupCard = createGroupCard(group.name, group.description, group.color);
        const groupElement = document.createElement('div');
        groupElement.innerHTML = groupCard;
        groupElement.firstElementChild.dataset.groupId = group.id;
        groupsContainer.appendChild(groupElement.firstElementChild);
    });
}

// Function to update events when a group's color changes
function updateEventsWithGroupColor(groupId, newColor) {
    // Update any calendar events for this group
    const calendarEvents = document.querySelectorAll(`.calendar-event[data-group-id="${groupId}"]`);
    calendarEvents.forEach(event => {
        event.style.backgroundColor = newColor;
    });

    // Update any event cards for this group
    const eventCards = document.querySelectorAll(`.event-card[data-group-id="${groupId}"]`);
    eventCards.forEach(card => {
        card.querySelector('.card-header').style.backgroundColor = newColor;
    });

    // Re-render the calendar to reflect changes
    renderCalendar();
}

function createStudentRow(name, email) {
    // Get selected group
    const groupSelect = document.getElementById('student-group');
    const groupId = groupSelect.value;
    const groupName = groupSelect.options[groupSelect.selectedIndex].text;

    return `
        <tr>
            <td>${name}</td>
            <td>${email}</td>
            <td>${groupId ? groupName : 'Not assigned'}</td>
            <td>
                <button class="btn btn-sm btn-primary view-student" data-id="new">View</button>
                <button class="btn btn-sm btn-warning edit-student" data-id="new">Edit</button>
                <button class="btn btn-sm btn-danger delete-student" data-id="new">Delete</button>
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
                <button class="btn btn-sm btn-primary view-homework" data-id="new">View</button>
                <button class="btn btn-sm btn-warning edit-homework" data-id="new">Edit</button>
                <button class="btn btn-sm btn-danger delete-homework" data-id="new">Delete</button>
            </td>
        </tr>
    `;
}

// Initialize action buttons (View, Edit)
function initializeActionButtons() {
    // Group buttons
    document.querySelectorAll('.view-group').forEach(btn => {
        btn.addEventListener('click', function() {
            const groupId = this.getAttribute('data-id');
            const groupName = this.closest('.card').querySelector('.card-title').textContent;
            alert(`Viewing group: ${groupName} (ID: ${groupId || 'new'}`);
            // In a real app, this would open a detailed view
        });
    });

    document.querySelectorAll('.edit-group').forEach(btn => {
        btn.addEventListener('click', function() {
            const groupId = this.closest('.card').closest('[data-group-id]').dataset.groupId;
            const groupCard = this.closest('.card');
            const groupName = groupCard.querySelector('.card-title').textContent;
            const groupDesc = groupCard.querySelector('.card-text:not(:last-child)').textContent;
            const groupColor = this.getAttribute('data-color') || '#4361ee';

            // Populate the modal with existing data
            document.getElementById('group-name').value = groupName;
            document.getElementById('group-description').value = groupDesc;
            document.getElementById('group-color').value = groupColor;

            // Set a data attribute to know we're editing
            document.getElementById('addGroupModal').dataset.editingId = groupId;

            // Show the modal
            const modal = new bootstrap.Modal(document.getElementById('addGroupModal'));
            modal.show();
        });
    });

    // Student buttons
    document.querySelectorAll('.view-student, .edit-student').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentId = this.getAttribute('data-id');
            const row = this.closest('tr');
            const studentName = row.cells[0].textContent;
            const action = this.classList.contains('view-student') ? 'Viewing' : 'Editing';

            alert(`${action} student: ${studentName} (ID: ${studentId || 'new'}`);
            // In a real app, this would open a detailed view or edit form
        });
    });

    // Homework buttons
    document.querySelectorAll('.view-homework, .edit-homework').forEach(btn => {
        btn.addEventListener('click', function() {
            const homeworkId = this.getAttribute('data-id');
            const row = this.closest('tr');
            const homeworkTitle = row.cells[0].textContent;
            const action = this.classList.contains('view-homework') ? 'Viewing' : 'Editing';

            alert(`${action} homework: ${homeworkTitle} (ID: ${homeworkId || 'new'}`);
            // In a real app, this would open a detailed view or edit form
        });
    });
}