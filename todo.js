// this sets up the page with initial color and loads tasks
document.addEventListener('DOMContentLoaded', async () => {
    let colorIndex = parseInt(localStorage.getItem('colorIndex')) || 0;
    const colors = ['color-1', 'color-2', 'color-3'];
    $('#form-container').addClass(colors[colorIndex]);
    await fetchTasks();

// here we add a new task when the post button is clicked
    $('#add').on('click', async () => {
        const task = $('#new-task').val().trim();
        const startDate = $('#new-start-date').val();
        const endDate = $('#new-end-date').val();
        if (task && startDate && endDate) {
            const newTask = {
                task,
                startDate,
                endDate,
                completed: false,
                color: colors[colorIndex]
            };
            await createTask(newTask);
            colorIndex = (colorIndex + 1) % 3;
            localStorage.setItem('colorIndex', colorIndex);
            $('#form-container').removeClass(colors.join(' ')).addClass(colors[colorIndex]);
            $('#new-task').val('');
            $('#new-start-date').val('');
            $('#new-end-date').val('');
            await fetchTasks();
        }
    });

// this updates the task display when a sort option is picked
    $('#sort-notes').on('change', async () => {
        await fetchTasks();
    });

// we fetch and show tasks from the server with sorting
    async function fetchTasks() {
        const sortBy = $('#sort-notes').val();
        const response = await fetch(`http://localhost:3000/tasks?_sort=${sortBy === 'complete' ? 'completed' : sortBy}&_order=asc`);
        const tasks = await response.json();
        $('#board').empty();
        tasks.forEach(task => addStickyNote(task));
    }

// these three functions post, patch, and delete a new task to/from the server
    async function createTask(task) {
        await fetch('http://localhost:3000/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
    }

    async function updateTask(id, updates) {
        await fetch(`http://localhost:3000/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
    }

    async function deleteTask(id) {
        await fetch(`http://localhost:3000/tasks/${id}`, {
            method: 'DELETE'
        });
    }

// this builds a sticky note and adds it to the board with buttons
    function addStickyNote(task) {
        const formatDate = (dateStr) => {
            const date = new Date(dateStr);
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${month}/${day}`;
        };
        const startFormatted = formatDate(task.startDate);
        const endFormatted = formatDate(task.endDate);
        const note = $(`
            <div class="sticky-note ${task.color} fade-in" data-id="${task.id}">
                <div class="note-content p-2">
                    <div class="d-flex justify-content-between align-items-start">
                        <strong>Task:</strong>
                        <div class="buttons">
                            <button class="btn btn-sm btn-success complete-btn me-1">✓</button>
                            <button class="btn btn-sm btn-danger delete-btn">X</button>
                        </div>
                    </div>
                    <p>${task.task}</p>
                    <div class="row">
                        <div class="col-6">Start: ${startFormatted}</div>
                        <div class="col-6">Deadline: ${endFormatted}</div>
                    </div>
                    <div class="completed-overlay ${task.completed ? 'visible' : ''}"></div>
                </div>
            </div>
        `);
        note.find('.complete-btn').on('click', async () => {
            if (!task.completed) {
                task.completed = true;
                await updateTask(task.id, { completed: true });
                note.find('.completed-overlay').addClass('visible');
            }
        });
        note.find('.delete-btn').on('click', async () => {
            note.addClass('fade-out');
            setTimeout(async () => {
                await deleteTask(task.id);
                note.remove();
            }, 500);
        });
        $('#board').append(note);
    }
});