function generateRoom() {
    const playerName = document.getElementById("playerName").value.trim();
    if (!playerName) {
        alert("Please enter your name!");
        return;
    }

    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    document.getElementById("roomCode").textContent = roomCode;
    document.getElementById("roomCodeBox").classList.remove("hidden");
}

function goLobby() {
    alert("Redirecting to Lobby...");
    window.location.href = "lobby.html";
}