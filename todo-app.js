document.addEventListener("DOMContentLoaded", () => {
    const completedLists = JSON.parse(localStorage.getItem("completedLists")) || [];

    completedLists.forEach(completedList => {
        const completedListItem = document.createElement("div");
        completedListItem.className = "completed-list";
        completedListItem.textContent = `${completedList.timestamp} (${completedList.tasks.length})`;

        const completedItemsDiv = document.createElement("div");
        completedItemsDiv.className = "completed-items";
        completedItemsDiv.textContent = completedList.tasks.join(", ");

        completedListItem.onclick = () => toggleCompletedTasks(completedItemsDiv); // Toggle function to expand/collapse

        completedTasksContainer.appendChild(completedListItem);
        completedTasksContainer.appendChild(completedItemsDiv);
    });
});

const itemInput = document.getElementById("itemInput");
const addItemBtn = document.getElementById("addItemBtn");
const pasteBtn = document.getElementById("pasteBtn");
const todoList = document.getElementById("todoList");
const goBtn = document.getElementById("goBtn");
const doneBtn = document.getElementById("doneBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const completionMessage = document.getElementById("completionMessage");
const completedTasksContainer = document.getElementById("completedTasksContainer");
const strictModeCheckbox = document.getElementById('strictModeCheckbox');

let currentTaskIndex = 0;

addItemBtn.addEventListener("click", () => {
    addItem();
});
itemInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        addItem();
    }
});

pasteBtn.addEventListener("click", async () => {
    try {
        const text = await navigator.clipboard.readText();
        const items = text.split('\n').map(item => item.trim()).filter(item => item);
        items.forEach(item => addItem(item));
    } catch (err) {
        console.error('Failed to read clipboard contents: ', err);
    }
});

goBtn.addEventListener("click", startFocusMode);
doneBtn.addEventListener("click", markAsDoneAndNext);
prevBtn.addEventListener("click", previousTask);
nextBtn.addEventListener("click", nextTask);

function addItem(itemText = "") {
    const trimmedText = itemText.trim() || itemInput.value.trim();
    if (trimmedText) {
        const listItem = document.createElement("li");

        const numberSpan = document.createElement("span");
        numberSpan.className = "number";
        numberSpan.textContent = todoList.children.length + 1 + ".";
        listItem.appendChild(numberSpan);

        const textSpan = document.createElement("span");
        textSpan.className = "text";
        textSpan.textContent = trimmedText;
        listItem.appendChild(textSpan);

        const deleteBtn = document.createElement("span");
        deleteBtn.className = "todo-delete-btn";
        deleteBtn.textContent = "✖";
        deleteBtn.onclick = () => {
            listItem.remove();
            updateNumbers();
            if (todoList.children.length === 0) {
                goBtn.style.display = "none";
            }
        };
        listItem.appendChild(deleteBtn);

        todoList.appendChild(listItem);
        itemInput.value = "";
        updateNumbers();

        if (todoList.children.length === 1) {
            goBtn.style.display = "block";
        }

        if (goBtn.style.display === "none") {
            exitFocusMode()
        }
    }
}


function startFocusMode() {
    if (todoList.children.length > 0) {
        document.querySelectorAll(".todo-delete-btn").forEach(btn => btn.classList.add("hidden"));
        
        let foundUncompletedTask = false;
        for (let i = 0; i < todoList.children.length; i++) {
            const task = todoList.children[i];
            if (!task.classList.contains("done")) {
                currentTaskIndex = i;
                displayTask(currentTaskIndex);
                foundUncompletedTask = true;
                break; 
            }
        }
        
        if (!foundUncompletedTask) {
            currentTaskIndex = 0;
            displayTask(currentTaskIndex);
        }

        goBtn.style.display = "none";
        doneBtn.style.display = "block";

        strictModeCheckbox.parentElement.style.display = "none";
        const isStrictModeEnabled = strictModeCheckbox.checked;

        if (isStrictModeEnabled) {
            prevBtn.style.display = "none";
            nextBtn.style.display = "none"; 
        } else {
            prevBtn.style.display = "block";
            nextBtn.style.display = "block";
        }
    }
}

function displayTask(index) {
    if (index >= 0 && index < todoList.children.length) {
        Array.from(todoList.children).forEach((item, i) => {
            item.style.display = i === index ? "block" : "none";
        });
    }
}

function markAsDoneAndNext() {
    const currentTask = todoList.children[currentTaskIndex];
    currentTask.classList.add("done");

    const nextIndex = findNextUncompleted(currentTaskIndex);
    if (nextIndex !== -1) {
        currentTaskIndex = nextIndex;
        displayTask(currentTaskIndex);
    } else {
        checkCompletion();
    }
}

function previousTask() {
    const previousIndex = findPreviousUncompleted(currentTaskIndex);
    if (previousIndex !== -1) {
        currentTaskIndex = previousIndex;
        displayTask(currentTaskIndex);
    }
}

function nextTask() {
    const nextIndex = findNextUncompleted(currentTaskIndex);
    if (nextIndex !== -1) {
        currentTaskIndex = nextIndex;
        displayTask(currentTaskIndex);
    } else {
        checkCompletion();
    }
}

function findNextUncompleted(startIndex) {
    for (let i = startIndex + 1; i < todoList.children.length; i++) {
        if (!todoList.children[i].classList.contains("done")) {
            return i;
        }
    }
    for (let i = 0; i < startIndex; i++) {
        if (!todoList.children[i].classList.contains("done")) {
            return i;
        }
    }
    return -1;
}

function findPreviousUncompleted(startIndex) {
    for (let i = startIndex - 1; i >= 0; i--) {
        if (!todoList.children[i].classList.contains("done")) {
            return i;
        }
    }
    for (let i = todoList.children.length - 1; i > startIndex; i--) {
        if (!todoList.children[i].classList.contains("done")) {
            return i;
        }
    }
    return -1;
}

function exitFocusMode() {
     // Show all tasks in their original state
     Array.from(todoList.children).forEach((task) => {
        task.style.display = "flex"; // Make sure all tasks are visible
        task.classList.remove("focused-task"); // Remove any focus-specific styling
    });

    // Re-enable the delete buttons for each task
    document.querySelectorAll(".todo-delete-btn").forEach(btn => btn.classList.remove("hidden"));
    
    // Show the "Go" button and hide "Prev", "Next", and "Done" buttons
    goBtn.style.display = "block";
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
    doneBtn.style.display = "none";

    // Apply line-through styling for completed tasks
    document.querySelectorAll("#todoList li").forEach(task => {
        if (task.classList.contains("done")) {
            task.style.textDecoration = "line-through";
            task.style.color = "gray";
        }
    });
}

function checkCompletion() {
    const allDone = Array.from(todoList.children).every(item => item.classList.contains("done"));
    if (allDone) {
        completeList();
    }
}

function completeList() {
    createConfetti();
    const completedTasks = Array.from(todoList.children).map(item => item.querySelector(".text").textContent);
    const timestamp = new Date().toLocaleString();

    const completedListData = {
        timestamp: timestamp,
        tasks: completedTasks
    };

    const completedLists = JSON.parse(localStorage.getItem("completedLists")) || [];
    if (completedLists.length >= 0) {
        document.getElementById("clearCompletedBtn").style.display = 'block';
    }
    completedLists.push(completedListData);
    localStorage.setItem("completedLists", JSON.stringify(completedLists));

    createCompletedListItem(completedListData);
    todoList.innerHTML = "";
    completionMessage.style.display = "block";
    prevBtn.style.display = "none";
    doneBtn.style.display = "none";
    nextBtn.style.display = "none";

    strictModeCheckbox.parentElement.style.display = "block";

    setTimeout(() => {
        completionMessage.style.display = "none";
    }, 2000);
}

function createCompletedListItem(completedListData) {
    const completedListItem = document.createElement("div");
    completedListItem.className = "completed-list";
    completedListItem.textContent = `${completedListData.timestamp} (${completedListData.tasks.length})`;

    const deleteBtn = document.createElement("span");
    deleteBtn.className = "completed-delete-btn";
    deleteBtn.textContent = "✖";
    deleteBtn.onclick = (event) => {
        event.stopPropagation();
        removeFromLocalStorage(completedListData.timestamp);
        completedTasksContainer.removeChild(completedListItem);
        completedTasksContainer.removeChild(completedItemsDiv);
    };

    completedListItem.appendChild(deleteBtn);

    const completedItemsDiv = document.createElement("div");
    completedItemsDiv.className = "completed-items";
    completedItemsDiv.innerHTML = completedListData.tasks.map((task, index) => `${index + 1}. ${task}`).join("<br>");
    completedItemsDiv.style.display = "none";

    completedListItem.onclick = () => {
        const isVisible = completedItemsDiv.style.display === "block";
        completedItemsDiv.style.display = isVisible ? "none" : "block";
    };

    completedTasksContainer.appendChild(completedListItem);
    completedTasksContainer.appendChild(completedItemsDiv);
}



function toggleCompletedTasks(completedItemsDiv) {
    if (completedItemsDiv.style.display === "none" || completedItemsDiv.style.display === "") {
        completedItemsDiv.style.display = "block";
    } else {
        completedItemsDiv.style.display = "none";
    }
}

const sortable = Sortable.create(todoList, {
    animation: 150,
    onEnd: function () {
        updateNumbers();
    }
});

function updateNumbers() {
    Array.from(todoList.children).forEach((item, index) => {
        item.querySelector(".number").textContent = (index + 1) + ".";
    });
}

function removeFromLocalStorage(timestamp) {
    const completedLists = JSON.parse(localStorage.getItem("completedLists")) || [];
    const updatedLists = completedLists.filter(list => list.timestamp !== timestamp);
    localStorage.setItem("completedLists", JSON.stringify(updatedLists));
}

function loadCompletedTasks() {
    const completedLists = JSON.parse(localStorage.getItem("completedLists")) || [];

    if (completedLists.length > 0) {
        document.getElementById("clearCompletedBtn").style.display = 'block';
    }

    completedTasksContainer.innerHTML = '';

    completedLists.forEach(completedListData => {
        createCompletedListItem(completedListData);
    });
}

function createConfetti() {
    const colors = ['#FF0B00', '#FFFD00', '#00FF00', '#00FFF0', '#0000FF', '#FF00FF'];
    const confettiCount = 100;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confetti.style.animationDuration = Math.random() * 2 + 1 + 's';

        document.getElementById('confetti-container').appendChild(confetti);

        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }
}

function deleteAllCompletedItems() {
    localStorage.removeItem("completedLists");
    refreshTaskDisplay();
    const clearCompletedBtn = document.getElementById("clearCompletedBtn")
    clearCompletedBtn.style.display = 'none';
}

function refreshTaskDisplay() {
    const completedItemsDiv = document.getElementById("completedTasksContainer");
    completedItemsDiv.innerHTML = '';
}

document.getElementById("clearCompletedBtn").addEventListener("click", deleteAllCompletedItems);

// Call this function when the page is loaded
window.onload = loadCompletedTasks;