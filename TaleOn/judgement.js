// Load story from sessionStorage
let story = JSON.parse(sessionStorage.getItem("story")) || [
    { player: "Player_1", text: "Once upon a time..." },
    { player: "AI_Buddy", text: "Suddenly, a ghost appeared..." }
];

// Render story
const storyDiv = document.getElementById("storyContent");
story.forEach(entry => {
    let p = document.createElement("p");
    p.innerHTML = `<strong>${entry.player}:</strong> ${entry.text}`;
    storyDiv.appendChild(p);
});

// Simulate AI analysis (later via OpenAI API)
setTimeout(() => {
    const verdict = Math.random() > 0.5 ? "WIN" : "LOSE"; // Mock
    const verdictBox = document.getElementById("verdictBox");
    const verdictText = document.getElementById("verdictText");

    verdictText.textContent = verdict === "WIN" ? "You All Win!" : "You All Lose!";
    verdictBox.classList.add(verdict === "WIN" ? "win" : "lose");

    document.getElementById("flowScore").textContent = `${Math.floor(Math.random() * 5) + 1}/5`;
    document.getElementById("creativityScore").textContent = `${Math.floor(Math.random() * 5) + 1}/5`;
    document.getElementById("vibeScore").textContent = `${Math.floor(Math.random() * 5) + 1}/5`;
    document.getElementById("immersionScore").textContent = `${Math.floor(Math.random() * 5) + 1}/5`;

    sessionStorage.setItem("gameResult", verdict);
}, 1500);

function goToRoast() {
    window.location.href = "roast.html";
}
