let isFocusActive = false;
let isBreakActive = false;
let focusDuration = 25;
let shortBreakDuration = 5;
let longBreakDuration = 15;
let timer;
let itemFocusTimer;
let remainingTime;
let breakClicks = 0;
let timerTracker;
let currentTaskName;
let resumeIndex = null;
let initRemainingTime = 0;
let currentTaskIndex = 0;
let focusMode = false;
let taskStartTime = null;
let taskTimers = new Map();
let timeSpentTracker = {};
let exited = false;
let itemFocusTracker;
let itemFocusTime;
let trimmedText;

const lightModeColors = ['#FF0B00', '#FFFD00', '#00FF00', '#00FFF0', '#0000FF', '#FF00FF'];
const darkModeColors = ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#FFBAF0'];
const alarmSound = new Audio('assets/audio/gong.mp3');
const completionSound = new Audio('assets/audio/completion.mp3');
const itemInput = document.getElementById("itemInput");
const itemInputPhone = document.getElementById("itemInput-phone");
const pasteBtn = document.getElementById("pasteBtn");
const pasteBtnPhone = document.getElementById("pasteBtn-phone");
const buttonContainer = document.getElementById("buttonContainer");
const editBtn = document.getElementById("editBtn");
const todoList = document.getElementById("todoList");
const addItemBtn = document.getElementById("addItemBtn");
const goBtn = document.getElementById("goBtn");
const doneBtn = document.getElementById("doneBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
let isPhoneScreen = window.innerWidth < 430 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const inputContainer = document.getElementsByClassName("input-container")[0];
const inputContainerPhone = document.getElementsByClassName("input-container-phone")[0];
const completedTasksContainer = document.getElementById("completedTasksContainer");
const strictModeCheckbox = document.getElementById('strictModeCheckbox');
const themeSwitch = document.getElementById('theme-switch');
const soundsSwitch = document.getElementById('sounds-switch');
const darkModeToggle = document.getElementById('darkModeToggle');
const soundsToggle = document.getElementById("soundsToggle");
const logo = document.getElementById('logo');
const pomodoroCheckbox = document.getElementById("pomodoroCheckbox");
const pomodoroSettings = document.getElementById("pomodoroSettings");
const timerDisplay = document.getElementById("timerDisplay");
const takeBreakBtn = document.getElementById("takeBreakBtn");
const settingsLink = document.getElementById("settingsLink");
const donateLink = document.querySelector(".donate-link");

// ----------------------------------------------------------

window.addEventListener('resize', () => {
    toggleResponsiveClasses();
    initializeEventListeners();
});

document.getElementById("goBtn").addEventListener("click", () => {

    const editingInputs = document.querySelectorAll(".edit-text-input");
    editingInputs.forEach(input => {
        const listItem = input.closest("li");
        if (listItem) {
            const saveBtn = listItem.querySelector(".save-btn");
            if (saveBtn) {
                saveBtn.click();
            }
        }
    });

    let rawTime;
    focusDuration = document.getElementById("focusDuration").value || 25;
    shortBreakDuration = document.getElementById("shortBreakDuration").value || 5;
    longBreakDuration = document.getElementById("longBreakDuration").value || 15;

    const loadUserPreferences = () => {
        const userPreferences = JSON.parse(localStorage.getItem("userPreferences")) || {};
        isBreakActive = userPreferences.isBreakActive || false;
        isFocusActive = userPreferences.isFocusActive || false;
    };

    const loadPomodoroState = () => {
        const savedPomodoroTimerState = JSON.parse(localStorage.getItem("pomodoroTimerState"));
        rawTime = savedPomodoroTimerState?.remainingTime - 1 || 0;
    };

    const calculateInitRemainingTime = () => {
        if (isFocusActive) {
            return rawTime / 60 || focusDuration;
        } else if (isBreakActive) {
            return rawTime / 60 || (breakClicks % 4 === 0 ? longBreakDuration : shortBreakDuration);
        }

        return 0;
    };

    const rejoinPomodoro = () => {
        startFocusMode();
        if (isBreakActive) {
            startBreak(initRemainingTime);
        } else {
            startPomodoroFocus()
        }
    };

    if (exited) {
        if (pomodoroCheckbox.checked) {
            loadUserPreferences();
            loadPomodoroState();
            initRemainingTime = calculateInitRemainingTime();
            rejoinPomodoro();
        } else {
            clearInterval(timer);
            clearInterval(timerTracker);
            localStorage.removeItem("pomodoroTimerState");
            startFocusMode();
        }
    } else {
        startFocusMode();
        if (pomodoroCheckbox.checked) {
            startPomodoroFocus();
        } else {
            isFocusActive = false;
            isBreakActive = false;
        }
    }

    saveItems();
});


editBtn.addEventListener("click", exitFocusMode);
doneBtn.addEventListener("click", markAsDoneAndNext);
prevBtn.addEventListener("click", previousTask);
nextBtn.addEventListener("click", nextTask);
pomodoroCheckbox.addEventListener("change", togglePomodoroElements);
document.getElementById("clearCompletedBtn").addEventListener("click", deleteAllCompletedItems);

document.addEventListener("DOMContentLoaded", () => {

    toggleResponsiveClasses();

    const currentTheme = localStorage.getItem('theme') || 'light';

    setBackground(currentTheme);

    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
        donateLink.classList.add('dark-theme');
        darkModeToggle.checked = true;
        logo.src = 'assets/images/planiteer_light.webp';
    }


    const soundsEnabled = localStorage.getItem("soundsEnabled");

    if (soundsEnabled !== null) {
        soundsToggle.checked = soundsEnabled === "true";
    } else {
        soundsToggle.checked = true;
    }

    const completedLists = JSON.parse(localStorage.getItem("completedLists")) || [];

    if (completedLists.length > 0) {
        document.getElementById("clearCompletedBtn").style.display = 'block';
    }

    completedTasksContainer.innerHTML = '';

    completedLists.forEach(completedListData => {
        createCompletedListItem(completedListData);
    });

    togglePomodoroElements();

    loadItems();
    saveItems();
    initializeEventListeners();
});

darkModeToggle.addEventListener('change', function () {
    if (darkModeToggle.checked) {
        document.body.classList.add('dark-theme');
        donateLink.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        logo.src = 'assets/images/planiteer_light.webp';
        setBackground('dark');
    } else {
        document.body.classList.remove('dark-theme');
        donateLink.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
        logo.src = 'assets/images/planiteer.webp';
        setBackground('light');
    }
});

soundsToggle.addEventListener("change", function () {
    localStorage.setItem("soundsEnabled", soundsToggle.checked);
});

takeBreakBtn.addEventListener("click", () => {
    if (isFocusActive) {
        isFocusActive = false;
        breakClicks++;
        clearInterval(timer);
        if (breakClicks % 4 === 0) {
            startBreak(longBreakDuration);
        } else {
            startBreak(shortBreakDuration);
        }
    } else {
        startPomodoroFocus();
    }
});

pomodoroCheckbox.addEventListener("change", () => {
    if (pomodoroCheckbox.checked) {
        settingsLink.style.visibility = "visible";
    } else {
        settingsLink.style.visibility = "hidden";
        pomodoroSettings.style.display = "none";
    }
});

document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', () => {
        if (input.value && input.value < 1) {
            input.value = 1;
        }
    });

    input.addEventListener('blur', () => {
        if (input.value === '') {
            if (input.id === 'focusDuration') {
                input.value = focusDuration;
            } else if (input.id === 'shortBreakDuration') {
                input.value = shortBreakDuration;
            } else if (input.id === 'longBreakDuration') {
                input.value = longBreakDuration;
            } else {
                input.value = 1;
            }
        }
    });
});

document.getElementById("toggleSettings").addEventListener("click", (event) => {
    event.preventDefault();
    if (pomodoroSettings.style.display === "none") {
        pomodoroSettings.style.display = "block";
    } else {
        pomodoroSettings.style.display = "none";
    }
});

document.getElementById('saveTasksBtn').addEventListener('click', savePastedTasks);
document.getElementById('cancelPasteBtn').addEventListener('click', hidePasteDropdown);

// ----------------------------------------------------------

function loadItems() {
    const userPreferences = JSON.parse(localStorage.getItem("userPreferences")) || {};
    strictModeCheckbox.checked = userPreferences.strictMode || false;
    pomodoroCheckbox.checked = userPreferences.pomodoro || false;
    strictModeCheckbox.parentElement.style.visibility = "visible";
    pomodoroCheckbox.parentElement.style.visibility = "visible";
    timerDisplay.style.display = "none";
    takeBreakBtn.style.display = "none";
    if (pomodoroCheckbox.checked) {
        settingsLink.style.visibility = "visible";
    } else {
        settingsLink.style.visibility = "hidden";
    }
    focusMode = userPreferences.focusMode || false;

    focusDuration = userPreferences.focus || 25;
    shortBreakDuration = userPreferences.short || 5;
    longBreakDuration = userPreferences.long || 15;
    autoStart = userPreferences.autoStart || false;
    autoSwitch = userPreferences.autoSwitch || false;
    document.getElementById("focusDuration").value = focusDuration;
    document.getElementById("shortBreakDuration").value = shortBreakDuration;
    document.getElementById("longBreakDuration").value = longBreakDuration;
    document.getElementById("autoStartNextPomodoro").checked = autoStart;
    document.getElementById("autoSwitchToNextTask").checked = autoSwitch;

    breakClicks = userPreferences.breakClicks || 0;
    isBreakActive = userPreferences.isBreakActive || false;
    isFocusActive = userPreferences.isFocusActive || false;
    const savedPomodoroTimerState = JSON.parse(localStorage.getItem("pomodoroTimerState"));
    let rawTime = 0;
    if (savedPomodoroTimerState) {
        rawTime = savedPomodoroTimerState.remainingTime - 1 || 0;
    }
    if (isFocusActive) {
        initRemainingTime = rawTime / 60 || focusDuration;
    } else if (isBreakActive) {
        initRemainingTime = rawTime / 60
            || (breakClicks % 4 === 0 ? longBreakDuration : shortBreakDuration);
    }


    const savedItems = JSON.parse(localStorage.getItem("todoItems")) || [];
    let taskName = userPreferences.currentTask || "";

    let i = 0;
    savedItems.forEach(item => {
        addItem(item.text, true);
        if (item.done) {
            const listItem = todoList.children[i];
            listItem.classList.add("done");

            const editBtn = listItem.querySelector(".edit-text-btn");
            if (editBtn) {
                editBtn.classList.add("hiddenItemElement");
            }
        }
        if (item.text == taskName) {
            resumeIndex = i;
        }
        i++;
    });

    taskTimers = new Map(userPreferences.taskTimers);
    const savedItemTimerState = JSON.parse(localStorage.getItem("itemTimerState"));
    if (savedItemTimerState) {
        let unsavedFocusTime = savedItemTimerState.itemFocusTime;
        taskTimers.set(resumeIndex, (taskTimers.get(resumeIndex) || 0) + unsavedFocusTime);
    }

    if (focusMode) {
        startFocusMode()
        if (isFocusActive) {
            startPomodoroFocus()
        } else if (isBreakActive) {
            startBreak(initRemainingTime)
        }
    }
    itemFocusTime = 0;
}

function saveItems() {
    const itemsToSave = Array.from(todoList.children).map((item) => {
        const textElement = item.querySelector(".text") || item.querySelector("input.edit-text-input");

        if (!textElement) {
            console.error("Item text not found, skipping item...");
            return { text: "", done: item.classList.contains("done") };
        }

        return {
            text: textElement.textContent || textElement.value,
            done: item.classList.contains("done"),
        };
    });

    const task = todoList.children[currentTaskIndex];
    const taskName = task ? task.querySelector(".text") ? task.querySelector(".text").textContent : "" : "";
    currentTaskName = taskName;

    const autoStart = document.getElementById("autoStartNextPomodoro").checked;
    const autoSwitch = document.getElementById("autoSwitchToNextTask").checked;

    const userPreferences = {
        strictMode: strictModeCheckbox.checked,
        pomodoro: pomodoroCheckbox.checked,
        focus: document.getElementById("focusDuration").value,
        short: document.getElementById("shortBreakDuration").value,
        long: document.getElementById("longBreakDuration").value,
        autoStart: autoStart,
        autoSwitch: autoSwitch,
        focusMode: focusMode,
        currentTask: taskName,
        breakClicks: breakClicks,
        isBreakActive: isBreakActive,
        isFocusActive: isFocusActive,
        taskTimers: Array.from(taskTimers.entries()),
    };
    localStorage.setItem("todoItems", JSON.stringify(itemsToSave));
    localStorage.setItem("userPreferences", JSON.stringify(userPreferences));
}


function savePomodoroTimerState() {
    const pomodoroTimerState = {
        remainingTime: remainingTime,
    };
    localStorage.setItem("pomodoroTimerState", JSON.stringify(pomodoroTimerState));
}

function saveItemTimerState() {
    const itemTimerState = {
        itemFocusTime: itemFocusTime,
    };
    localStorage.setItem("itemTimerState", JSON.stringify(itemTimerState));
}

function addItem(itemText = "", skipSave = false) {

    const trimmedText = isPhoneScreen
        ? itemText.trim() || itemInputPhone.value.trim()
        : itemText.trim() || itemInput.value.trim();

    if (trimmedText) {
        const listItem = document.createElement("li");
        const handleSpan = document.createElement("span");
        handleSpan.className = "handle";
        handleSpan.innerHTML = "<i class='fas fa-arrows-alt'></i>";
        listItem.appendChild(handleSpan);
        const numberSpan = document.createElement("span");
        numberSpan.className = "number";
        numberSpan.textContent = todoList.children.length + 1 + ".";
        listItem.appendChild(numberSpan);

        const textSpan = document.createElement("span");
        textSpan.className = "text";
        textSpan.textContent = trimmedText;
        listItem.appendChild(textSpan);

        const editBtn = document.createElement("span");
        editBtn.className = "edit-text-btn";
        editBtn.innerHTML = "✏️";
        editBtn.onclick = () => enterEditMode(listItem, textSpan);
        listItem.appendChild(editBtn);

        const deleteBtn = document.createElement("span");
        deleteBtn.className = "todo-delete-btn";
        deleteBtn.textContent = "✖";
        deleteBtn.onclick = () => {
            listItem.remove();
            updateNumbers();
            if (todoList.children.length === 0) {
                goBtn.style.display = "none";
            }
            saveItems()
        };
        listItem.appendChild(deleteBtn);

        todoList.appendChild(listItem);
        if (isPhoneScreen) {
            itemInputPhone.value = "";
        } else {
            itemInput.value = "";
        }
        updateNumbers();
        if (!skipSave) {
            saveItems();
        }

        if (todoList.children.length === 1) {
            goBtn.style.display = "block";
        }

        if (goBtn.style.display === "none") {
            exitFocusMode()
        }
        pomodoroSettings.style.display = "none";
    }
}

function startFocusMode() {

    document.querySelectorAll('.completed-items').forEach(item => {
        item.style.display = "none";
    });

    pomodoroSettings.style.display = "none";

    if ("Notification" in window) {
        if (Notification.permission === 'granted') {
            console.log('User has already granted permission for notifications.');
        } else if (Notification.permission === 'denied') {
            handleNotificationDenial();
        } else {
            requestNotificationPermission();
        }
    }

    focusMode = true;
    saveItems()
    if (exited) {
        updateNumbers()
        for (let i = 0; i < todoList.children.length; i++) {
            const task = todoList.children[i];
            const taskName = task.querySelector(".text").textContent;
            const accumulatedTime = timeSpentTracker[taskName] || 0;
            taskTimers.set(i, accumulatedTime);
            taskStartTime = null;
            exited = false;
        };
        timeSpentTracker = {};
    }

    if (todoList.children.length > 0) {
        document.querySelectorAll(".edit-text-btn").forEach(btn => btn.classList.add("hiddenItemElement"));
        document.querySelectorAll(".todo-delete-btn").forEach(btn => btn.classList.add("hiddenItemElement"));
        document.querySelectorAll(".handle").forEach(handle => handle.classList.add("hiddenItemElement"));
        if (resumeIndex == null) {
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
        } else {
            displayTask(resumeIndex);
            foundUncompletedTask = true;
            resumeIndex = null;
        }

        const settingsElements = document.querySelectorAll('.hiddenWhenFocused');
        settingsElements.forEach(element => {
            element.classList.add('hidden');
        });

        inputContainerPhone.style.display = "none";
        inputContainer.style.display = "none";

        editBtn.style.display = "block";

        goBtn.style.display = "none";

        prevBtn.style.visibility = "visible";
        doneBtn.style.display = "block";
        nextBtn.style.visibility = "visible";

        if (pomodoroCheckbox.checked) {
            playSound(alarmSound);
            timerDisplay.style.display = "block";
            takeBreakBtn.style.display = "inline";
        }

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
    itemFocusTime = 0;
    clearInterval(itemFocusTimer);
    clearInterval(itemFocusTracker);
    itemFocusTimer = setInterval(() => {
        itemFocusTime++;
    }, 1000);

    itemFocusTracker = setInterval(saveItemTimerState, 1000);

    currentTaskIndex = index;
    taskStartTime = Date.now();

    if (index >= 0 && index < todoList.children.length) {
        Array.from(todoList.children).forEach((item, i) => {
            item.style.display = i === index ? "block" : "none";
        });
    }
}

function markAsDoneAndNext() {
    const currentTask = todoList.children[currentTaskIndex];
    currentTask.classList.add("done");

    saveCurrentTaskTime();

    const nextIndex = findNextUncompleted(currentTaskIndex);
    if (nextIndex !== -1) {
        currentTaskIndex = nextIndex;
        displayTask(currentTaskIndex);
    } else {
        checkCompletion();
    }
    saveItems();
}

function saveCurrentTaskTime() {
    if (taskStartTime !== null) {
        const elapsedTime = (Date.now() - taskStartTime) / 1000;
        taskTimers.set(currentTaskIndex, (taskTimers.get(currentTaskIndex) || 0) + elapsedTime);
        taskStartTime = null;
    }
}

function previousTask() {
    saveCurrentTaskTime();
    const previousIndex = findPreviousUncompleted(currentTaskIndex);
    if (previousIndex !== -1) {
        currentTaskIndex = previousIndex;
        displayTask(currentTaskIndex);
    }
    saveItems()
}

function nextTask() {
    saveCurrentTaskTime();
    const nextIndex = findNextUncompleted(currentTaskIndex);
    if (nextIndex !== -1) {
        currentTaskIndex = nextIndex;
        displayTask(currentTaskIndex);
    } else {
        checkCompletion();
    }
    saveItems()
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
    clearInterval(timer);
    clearInterval(timerTracker);
    clearInterval(itemFocusTimer);
    clearInterval(itemFocusTracker);
    focusMode = false;
    saveItems();
    isBreakActive = false;
    isFocusActive = false;
    saveCurrentTaskTime()
    Array.from(todoList.children).forEach((task) => {
        task.style.display = "flex";
        task.classList.remove("focused-task");
    });

    for (let i = 0; i < todoList.children.length; i++) {
        const task = todoList.children[i];
        const taskName = task.querySelector(".text").textContent;
        const currentTimeSpent = taskTimers.get(i) || 0;
        timeSpentTracker[taskName] = (timeSpentTracker[taskName] || 0) + currentTimeSpent;
    }
    document.querySelectorAll(".edit-text-btn").forEach(btn => btn.classList.remove("hiddenItemElement"));
    document.querySelectorAll(".todo-delete-btn").forEach(btn => btn.classList.remove("hiddenItemElement"));
    document.querySelectorAll(".handle").forEach(handle => handle.classList.remove("hiddenItemElement"));

    goBtn.style.display = "block";
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
    doneBtn.style.display = "none";

    document.querySelectorAll("#todoList li").forEach(task => {

        const editBtn = task.querySelector(".edit-text-btn");

        if (task.classList.contains("done")) {
            task.style.textDecoration = "line-through";
            task.style.color = "gray";
            if (editBtn) {
                editBtn.classList.add("hiddenItemElement");
            }
        } else {
            if (editBtn) {
                editBtn.classList.remove("hiddenItemElement");
            }
        }
    });

    if (pomodoroCheckbox.checked) {
        timerDisplay.style.display = "none";
        takeBreakBtn.style.display = "none";
    }
    exited = true;
    const settingsElements = document.querySelectorAll('.hiddenWhenFocused');
    settingsElements.forEach(element => {
        element.classList.remove('hidden');
    });
    if (isPhoneScreen) {
        inputContainerPhone.style.display = "flex";
    } else {
        inputContainer.style.display = "flex";
    }
    editBtn.style.display = "none";

    if (pomodoroCheckbox.checked) {
        settingsLink.style.visibility = "visible";
    }
}

function checkCompletion() {
    const allDone = Array.from(todoList.children).every(item => item.classList.contains("done"));
    if (allDone) {
        completeList();
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);

    if (secs === 60) {
        return `${(mins + 1).toString().padStart(2, '0')}:00`;
    }

    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function completeList() {
    focusMode = false;
    isBreakActive = false;
    isFocusActive = false;
    breakClicks = 0;

    if ("Notification" in window) {
        sendNotification("Planiteer", {
            body: "To-do list complete!",
            icon: "assets/images/favicon.ico",
        });
    }

    playSound(completionSound);
    setOffFireworks();
    clearInterval(timerTracker);
    clearInterval(itemFocusTimer);
    clearInterval(itemFocusTracker);

    const completedTasks = Array.from(todoList.children).map((item, index) => {
        const taskName = item.querySelector(".text").textContent;
        const timeSpent = taskTimers.get(index) || 0;
        return { name: taskName, timeSpent: timeSpent };
    });

    const totalTimeSpent = completedTasks.reduce((total, task) => total + task.timeSpent, 0);

    const timestamp = new Date().toLocaleString();

    const completedListData = {
        timestamp: timestamp,
        tasks: completedTasks,
        totalTime: totalTimeSpent
    };

    const completedLists = JSON.parse(localStorage.getItem("completedLists")) || [];
    if (completedLists.length >= 0) {
        document.getElementById("clearCompletedBtn").style.display = 'block';
    }
    completedLists.push(completedListData);
    localStorage.setItem("completedLists", JSON.stringify(completedLists));

    createCompletedListItem(completedListData);
    todoList.innerHTML = "";
    prevBtn.style.display = "none";
    doneBtn.style.display = "none";
    nextBtn.style.display = "none";

    const settingsElements = document.querySelectorAll('.hiddenWhenFocused');
    settingsElements.forEach(element => {
        element.classList.remove('hidden');
    });
    editBtn.style.display = "none";
    toggleResponsiveClasses()

    if (pomodoroCheckbox.checked) {
        settingsLink.style.visibility = "visible";
        timerDisplay.style.display = "none";
        takeBreakBtn.style.display = "none";
    }

    clearInterval(timer);

    // localStorage.removeItem("userPreferences");
    localStorage.removeItem("pomodoroTimerState");
    localStorage.removeItem("itemTimerState");
    localStorage.removeItem("todoItems");
    taskTimers.clear()
    localStorage.removeItem("taskTimers")
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
    completedItemsDiv.style.display = "none";

    completedItemsDiv.innerHTML = completedListData.tasks
        .map((task, index) => `<div class="task-row">
            <span class="task-name">${index + 1}. ${task.name}</span>
            <span class="task-time">${formatTime(task.timeSpent)}</span>
        </div>`).join("");

    const totalTimeDiv = document.createElement("div");
    totalTimeDiv.className = "task-row";
    totalTimeDiv.style.marginTop = "10px";

    const totalTimeLabel = document.createElement("span");
    totalTimeLabel.className = "task-name";
    totalTimeLabel.style.fontWeight = "bold";
    totalTimeLabel.textContent = "Total time:";

    const totalTimeValue = document.createElement("span");
    totalTimeValue.className = "task-time";
    totalTimeValue.style.fontWeight = "bold";
    totalTimeValue.textContent = formatTime(completedListData.totalTime);

    totalTimeDiv.appendChild(totalTimeLabel);
    totalTimeDiv.appendChild(totalTimeValue);
    completedItemsDiv.appendChild(totalTimeDiv);

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

function startTimer(duration) {
    if (pomodoroCheckbox.checked) {
        clearInterval(timerTracker);
        timerTracker = setInterval(savePomodoroTimerState, 1000);

        remainingTime = duration * 60;
        saveItems()
        updateTimerDisplay();

        clearInterval(timer);
        timer = setInterval(() => {
            remainingTime--;
            updateTimerDisplay();

            if (remainingTime <= 0) {
                clearInterval(timer);
                playSound(alarmSound);
                breakClicks++;

                if ("Notification" in window) {
                    sendNotification("Planiteer", {
                        body: "Time to take a break...",
                        icon: "assets/images/favicon.ico",
                        requireInteraction: true,
                    });
                }

                if (breakClicks % 4 === 0) {
                    if (initRemainingTime > 0) {
                        startBreak(initRemainingTime)
                    } else {
                        startBreak(longBreakDuration);
                    }
                } else {
                    if (initRemainingTime > 0) {
                        startBreak(initRemainingTime)
                    } else {
                        startBreak(shortBreakDuration);
                    }
                }
            }
        }, 1000);
    }
    initRemainingTime = 0;
}

function startBreak(duration) {
    isFocusActive = false;
    isBreakActive = true;
    saveCurrentTaskTime();
    clearInterval(itemFocusTimer);
    itemFocusTime = 0;
    saveItemTimerState()
    remainingTime = duration * 60;
    updateTimerDisplay();
    takeBreakBtn.textContent = "Start Next Pomodoro";

    clearInterval(itemFocusTracker);

    clearInterval(timerTracker);
    timerTracker = setInterval(savePomodoroTimerState, 1000);

    clearInterval(timer);
    timer = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();

        if (remainingTime <= 0) {
            clearInterval(timer);
            playSound(alarmSound);

            const autoStart = document.getElementById("autoStartNextPomodoro").checked
            if (autoStart) {
                startPomodoroFocus();
            }

            if ("Notification" in window) {
                sendNotification("Planiteer", {
                    body: "Time to start the next pomodoro (" + currentTaskName + ")",
                    icon: "assets/images/favicon.ico",
                    requireInteraction: true,
                });
            }
        }
    }, 1000);

    prevBtn.style.visibility = "hidden";
    if (strictModeCheckbox.checked) {
        doneBtn.style.visibility = "hidden";
    } else {
        doneBtn.style.display = "none";
    }
    nextBtn.style.visibility = "hidden";
    initRemainingTime = 0;
    saveItems();
}

function startPomodoroFocus() {
    isFocusActive = true;
    isBreakActive = false;
    playSound(alarmSound);
    const autoSwitch = document.getElementById("autoSwitchToNextTask").checked
    if (autoSwitch) {
        nextTask()
    }
    focusDuration = document.getElementById("focusDuration").value || 25;
    if (initRemainingTime > 0) {
        startTimer(initRemainingTime)
    } else {
        startTimer(focusDuration);
    }
    takeBreakBtn.textContent = "Take a Break";

    prevBtn.style.visibility = "visible";
    if (strictModeCheckbox.checked) {
        doneBtn.style.visibility = "visible";
    } else {
        doneBtn.style.display = "block";
    }
    nextBtn.style.visibility = "visible";

    itemFocusTime = 0;
    clearInterval(itemFocusTimer);
    clearInterval(itemFocusTracker);
    itemFocusTimer = setInterval(() => {
        itemFocusTime++;
    }, 1000);
    itemFocusTracker = setInterval(saveItemTimerState, 1000);

    initRemainingTime = 0;
}

function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function togglePomodoroElements() {
    if (pomodoroCheckbox.checked) {
        settingsLink.style.visibility = "visible";

    } else {
        settingsLink.style.visibility = "hidden";
        pomodoroSettings.style.display = "none";
        timerDisplay.style.display = "none";
        takeBreakBtn.style.display = "none";
    }
}

function playSound(sound) {
    const soundsToggle = document.getElementById("soundsToggle");
    if (soundsToggle.checked) {
        sound.currentTime = 0;
        sound.play().catch(error => console.error("Failed to play sound:", error));
    }
}

function setOffFireworks() {
    const duration = 3 * 1000,
        animationEnd = Date.now() + duration,
        defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti(
            Object.assign({}, defaults, {
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            })
        );
        confetti(
            Object.assign({}, defaults, {
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            })
        );
    }, 250);
}

function sendNotification(title, options) {
    if (Notification.permission === "granted") {
        const notification = new Notification(title, options);

        notification.onclick = function (event) {
            event.preventDefault();
            window.focus();
        };
    } else {
        console.log("Notifications are not allowed");
    }
}

function showPasteDropdown() {
    document.getElementById('pasteDropdown').style.display = 'block';
}

function hidePasteDropdown() {
    document.getElementById('pasteDropdown').style.display = 'none';
    document.getElementById('pasteInput').value = '';
}

function savePastedTasks() {
    const pasteInput = document.getElementById('pasteInput').value;
    const tasks = parseTasks(pasteInput);

    tasks.forEach(task => addItem(task, true));

    hidePasteDropdown();

    saveItems()
}

function parseTasks(input) {
    return input.split('\n').map(line => line.trim()).filter(line => line !== "");
}

function requestNotificationPermission() {
    Notification.requestPermission().then(permission => {
        switch (permission) {
            case 'granted':
                console.log('User has granted permission for notifications.');
                break;
            case 'denied':
                handleNotificationDenial();
                break;
            default:
                console.log('Notification permission request was dismissed.');
                break;
        }
    });
}

function handleNotificationDenial() {
    const alertShown = localStorage.getItem('notificationAlertShown');
    if (!alertShown) {
        alert("The popup notification is blocked by the browser. "
            + "Please allow it by clicking the bell icon on the URL bar.");
        localStorage.setItem('notificationAlertShown', 'true');
    }
}

function handleKeyPress(event) {
    if (event.key === "Enter") {
        addItem();
    }
}

function initializeEventListeners() {
    const input = document.getElementById("itemInput");
    const phoneInput = document.getElementById("itemInput-phone");
    const addItemBtn = document.getElementById("addItemBtn");

    addItemBtn?.removeEventListener("click", addItem);
    input?.removeEventListener("keypress", handleKeyPress);

    if (isPhoneScreen) {
        pasteBtnPhone.addEventListener('click', showPasteDropdown);
        if (addItemBtn) {
            addItemBtn.addEventListener("click", () => addItem(""));
            phoneInput.addEventListener("keypress", handleKeyPress);
        }
    } else {
        pasteBtn.addEventListener('click', showPasteDropdown);
        if (input) {
            input.addEventListener("keypress", handleKeyPress);
        }
    }
}

function toggleResponsiveClasses() {
    const isMobile = window.innerWidth <= 430;
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

    if (isMobile || isAndroid || isIOS) {
        if (!focusMode) {
            inputContainerPhone.style.display = "flex";
            buttonContainer.style.display = "flex";
            addItemBtn.style.display = "flex";
            itemInputPhone.style.display = "flex";
            pasteBtnPhone.style.display = "flex";
        }
        inputContainer.style.display = "none";
        itemInput.style.display = "none";
        pasteBtn.style.display = "none";
        isPhoneScreen = true;
    } else {
        inputContainerPhone.style.display = "none";
        buttonContainer.style.display = "none";
        addItemBtn.style.display = "none";
        itemInputPhone.style.display = "none";
        pasteBtnPhone.style.display = "none";
        if (!focusMode) {
            inputContainer.style.display = "flex";
            itemInput.style.display = "block";
            pasteBtn.style.display = "flex";
        }
        isPhoneScreen = false;
    }
}

let backgroundChangeListenerAdded = false;

function setBackground(theme) {
    const backgroundSelector = document.getElementById("backgroundSelector");
    const imagePath = "assets/images/backgrounds/";
    const imageExtension = ".webp";

    fetch("backgrounds.json")
        .then(response => response.json())
        .then(data => {

            const backgroundList = theme === 'dark' ? data.dark : data.light;

            backgroundList.sort();

            backgroundSelector.innerHTML = "";
            backgroundList.forEach(imageName => {
                const option = document.createElement("option");
                option.value = imageName;
                option.textContent = imageName;
                backgroundSelector.appendChild(option);
            });

            const defaultBackground = theme === 'dark' ? 'leaves_dark' : 'leaves';

            const savedBackground = localStorage.getItem(
                theme === 'dark' ? 'selectedDarkBackground' : 'selectedLightBackground'
            );

            const finalBackground = savedBackground || defaultBackground;

            document.body.style.backgroundImage = `url('${imagePath}${finalBackground}${imageExtension}')`;
            backgroundSelector.value = finalBackground;

            if (!backgroundChangeListenerAdded) {
                backgroundSelector.addEventListener("change", backgroundChangeListener);
                backgroundChangeListenerAdded = true;
            }
        })
        .catch(error => console.error("Error fetching background images:", error));

    function backgroundChangeListener() {
        const selectedBackground = backgroundSelector.value;
        document.body.style.backgroundImage = `url('${imagePath}${selectedBackground}${imageExtension}')`;

        const currentTheme = localStorage.getItem('theme') || 'light';
        if (currentTheme === 'dark') {
            localStorage.setItem('selectedDarkBackground', selectedBackground);
        } else {
            localStorage.setItem('selectedLightBackground', selectedBackground);
        }
    }
}

function enterEditMode(listItem, textSpan) {
    const originalText = textSpan.textContent;

    const editBtn = listItem.querySelector(".edit-text-btn");
    if (editBtn) {
        editBtn.classList.add("hiddenItemElement");
    }

    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "edit-text-input";
    editInput.value = originalText;

    listItem.replaceChild(editInput, textSpan);
    editInput.focus();

    function handleEnterKey(event) {
        if (event.key === "Enter") {
            saveEdit(listItem, editInput, textSpan);
        }
    }

    editInput.removeEventListener("keydown", handleEnterKey);
    editInput.addEventListener("keydown", handleEnterKey);

    const saveBtn = document.createElement("span");
    saveBtn.className = "save-btn";
    saveBtn.textContent = "✔️";
    saveBtn.onclick = () => saveEdit(listItem, editInput, textSpan);

    listItem.insertBefore(saveBtn, editInput.nextSibling);

}

function saveEdit(listItem, editInput, textSpan) {
    const newText = editInput.value.trim();
    const oldText = textSpan.textContent.trim();

    if (newText && newText !== oldText) {
        textSpan.textContent = newText;

        if (timeSpentTracker[oldText]) {
            timeSpentTracker[newText] = timeSpentTracker[oldText];
            delete timeSpentTracker[oldText];
        }

        const listItems = Array.from(todoList.children);

        const listItemIndex = listItems.findIndex(item => {
            const textElement = item.querySelector(".text");
            return textElement && textElement.textContent.trim() === oldText;
        });

        if (listItemIndex !== -1) {
            const item = listItems[listItemIndex];
            const isDone = item.classList.contains("done");

            const textElement = item.querySelector(".text");
            if (textElement) {
                textElement.textContent = newText;
            }

            if (isDone) {
                item.classList.add("done");
            } else {
                item.classList.remove("done");
            }
        }

        saveItems();
    }

    listItem.replaceChild(textSpan, editInput);
    const saveBtn = listItem.querySelector(".save-btn");
    if (saveBtn) listItem.removeChild(saveBtn);

    const editBtn = listItem.querySelector(".edit-text-btn");
    if (editBtn) editBtn.classList.remove("hiddenItemElement");
}


// ----------------------------------------------------------

const sortable = Sortable.create(todoList, {
    animation: 150,
    handle: '.handle',
    onEnd: function () {
        updateNumbers();
        saveItems();
    }
});

// ----------------------------------------------------------