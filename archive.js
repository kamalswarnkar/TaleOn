// Mock archive data (later from DB)
let archive = [
    {
        id: 1,
        verdict: "WIN",
        story: [
            { player: "Player_1", text: "Once upon a time..." },
            { player: "AI_Buddy", text: "A ghost appeared and laughed..." }
        ]
    },
    {
        id: 2,
        verdict: "LOSE",
        story: [
            { player: "Player_2", text: "We went to Mars..." },
            { player: "AI_Buddy", text: "But forgot to bring oxygen." }
        ]
    }
];

function renderStories(list) {
    const container = document.getElementById("storyList");
    container.innerHTML = "";

    list.forEach(item => {
        let div = document.createElement("div");
        div.classList.add("story-card");
        div.classList.add(item.verdict === "WIN" ? "win" : "lose");

        let header = document.createElement("div");
        header.classList.add("story-header");
        header.innerHTML = `<span>Game #${item.id}</span> <span>${item.verdict}</span>`;

        let body = document.createElement("div");
        body.classList.add("story-body");
        body.innerHTML = item.story.map(s => `<strong>${s.player}:</strong> ${s.text}`).join("<br>");

        div.appendChild(header);
        div.appendChild(body);
        container.appendChild(div);
    });
}

function filterStories(type) {
    if (type === "all") {
        renderStories(archive);
    } else {
        renderStories(archive.filter(s => s.verdict === type));
    }
}

function goHome() {
    window.location.href = "landing.html";
}

// Initial load
renderStories(archive);
