let players = JSON.parse(sessionStorage.getItem("players")) || [
    sessionStorage.getItem("playerName") || "Player",
    "AI_Buddy"
];

let currentTurnIndex = 0;
let turnTime = parseInt(sessionStorage.getItem("turnTime")) || 10; // in minutes
let timer;
let story = [];
let maxRounds = parseInt(sessionStorage.getItem("maxRounds")) || 5; // configurable
let currentRound = 1;

// Display Room Code
document.getElementById("roomCode").textContent = sessionStorage.getItem("roomCode") || "ABCD12";

// Start first turn from toss winner
let tossWinner = sessionStorage.getItem("tossWinner");
if (tossWinner) {
    currentTurnIndex = players.indexOf(tossWinner);
}
updateTurnDisplay();
startTimer();

function updateTurnDisplay() {
    document.getElementById("currentPlayer").textContent = players[currentTurnIndex];
    document.getElementById("storyInput").value = "";
    
    // If AI's turn, auto-generate text after delay (mock for now)
    if (players[currentTurnIndex] === "AI_Buddy") {
        document.getElementById("turnInputArea").style.display = "none";
        setTimeout(() => {
            let aiText = "AI_Buddy continues the story with a spooky twist...";
            story.push({ player: "AI_Buddy", text: aiText });
            renderStory();
            nextTurn();
        }, 2000);
    } else {
        document.getElementById("turnInputArea").style.display = "block";
    }
}

function startTimer() {
    let timeLeft = turnTime;
    document.getElementById("timer").textContent = timeLeft;

    timer = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            if (players[currentTurnIndex] !== "AI_Buddy") {
                // Auto-skip if player doesn't submit
                nextTurn();
            }
        }
    }, 60000); // 1 min steps
}

function submitTurn() {
    const text = document.getElementById("storyInput").value.trim();
    if (!text) {
        alert("Please write something before submitting!");
        return;
    }
    story.push({ player: players[currentTurnIndex], text });
    renderStory();
    nextTurn();
}

function renderStory() {
    const feed = document.getElementById("storyFeed");
    feed.innerHTML = "";
    story.forEach(entry => {
        let p = document.createElement("p");
        p.innerHTML = `<strong>${entry.player}:</strong> ${entry.text}`;
        feed.appendChild(p);
    });
    feed.scrollTop = feed.scrollHeight;
}

function nextTurn() {
    clearInterval(timer);

    if (currentTurnIndex === players.length - 1) {
        currentRound++;
    }

    if (currentRound > maxRounds) {
        sessionStorage.setItem("story", JSON.stringify(story));
        window.location.href = "judgement.html";
        return;
    }

    currentTurnIndex = (currentTurnIndex + 1) % players.length;

    // If all players had a turn, you can decide to end game here or continue
    updateTurnDisplay();
    startTimer();
}
