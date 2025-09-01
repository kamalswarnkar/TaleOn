// Simulate pulling room code from previous page
document.getElementById("roomCode").textContent = sessionStorage.getItem("roomCode") || "ABCD12";

// Example player list
let players = [
    { name: sessionStorage.getItem("playerName") || "Host (You)" },
    { name: "AI_Buddy" }
];

// Render players
function renderPlayers() {
    const list = document.getElementById("playerList");
    list.innerHTML = "";
    players.forEach(player => {
        const li = document.createElement("li");
        li.textContent = player.name;
        list.appendChild(li);
    });
}
renderPlayers();

function startGame() {
    alert("Starting game...");
    window.location.href = "toss.html";
}

function leaveLobby() {
    alert("Leaving lobby...");
    window.location.href = "landing.html";
}
