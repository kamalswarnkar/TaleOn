function startToss() {
    const coin = document.getElementById("coin");
    const resultBox = document.getElementById("resultBox");
    const resultText = document.getElementById("resultText");

    // Simulate getting player list (later from backend)
    let players = JSON.parse(sessionStorage.getItem("players")) || [
        sessionStorage.getItem("playerName") || "Player",
        "AI_Buddy"
    ];

    // Play flip animation
    coin.style.animation = "flip 1s ease-in-out";
    document.querySelector(".toss-btn").disabled = true;

    setTimeout(() => {
        coin.style.animation = "none";
        const winner = players[Math.floor(Math.random() * players.length)];

        resultText.textContent = `${winner} starts the story!`;
        resultBox.classList.remove("hidden");
    }, 1000);
}

function goToGame() {
    window.location.href = "game-room.html";
}
