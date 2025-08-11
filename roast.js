let players = JSON.parse(sessionStorage.getItem("players")) || [
    sessionStorage.getItem("playerName") || "Player",
    "AI_Buddy"
];

let result = sessionStorage.getItem("gameResult") || "LOSE";

// Mock roast/compliment lines
let winRoasts = [
    "Your plot twist made no sense... but it was so good I almost cried.",
    "You kept the story alive, even if your grammar didn't.",
    "That was so weird, I loved it.",
    "Your part was like fine wine... except served in a plastic cup."
];

let loseRoasts = [
    "Your plot twist was so bad, even plot holes avoided it.",
    "I’ve seen more coherent stories in a toddler’s doodle book.",
    "If storytelling was a crime, you'd be sentenced to silence.",
    "Your scene was the narrative equivalent of a Windows XP error."
];

const roastList = document.getElementById("roastList");
players.forEach(player => {
    if (player === "AI_Buddy") return; // AI doesn't roast itself

    let div = document.createElement("div");
    div.classList.add("roast-item");

    let nameSpan = document.createElement("span");
    nameSpan.classList.add("roast-name");
    nameSpan.textContent = player + ": ";

    let roastText = document.createElement("span");
    roastText.textContent = result === "WIN"
        ? winRoasts[Math.floor(Math.random() * winRoasts.length)]
        : loseRoasts[Math.floor(Math.random() * loseRoasts.length)];

    div.appendChild(nameSpan);
    div.appendChild(roastText);
    roastList.appendChild(div);
});

function playAgain() {
    window.location.href = "lobby.html";
}

function goHome() {
    window.location.href = "landing.html";
}
