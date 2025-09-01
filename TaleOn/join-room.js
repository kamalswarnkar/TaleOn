function joinRoom() {
    const name = document.getElementById("playerName").value.trim();
    const code = document.getElementById("roomCode").value.trim().toUpperCase();

    if (!name || !code) {
        alert("Please enter both name and room code!");
        return;
    }

    // Save in session storage (mock)
    sessionStorage.setItem("playerName", name);
    sessionStorage.setItem("roomCode", code);

    alert(`Joining room ${code}...`);
    window.location.href = "lobby.html";
}

function goBack() {
    window.location.href = "landing.html";
}
