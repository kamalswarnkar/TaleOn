// Optional: Show custom error message if set in sessionStorage
const customMessage = sessionStorage.getItem("errorMessage");
if (customMessage) {
    document.getElementById("errorMessage").textContent = customMessage;
}

function goHome() {
    window.location.href = "landing.html";
}
