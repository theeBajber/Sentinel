const params = new URLSearchParams(window.location.search);
const rawUrl = params.get("u") || "Unknown URL";
const score = params.get("score") || "0";
const reasons = params.get("reasons")
  ? JSON.parse(decodeURIComponent(params.get("reasons")))
  : [];

// Parse the URL to extract hostname for display
let displayUrl;
try {
  displayUrl = new URL(rawUrl);
  document.getElementById("url").textContent = displayUrl.hostname;
} catch (e) {
  document.getElementById("url").textContent = "Invalid URL";
}

document.getElementById("score").textContent = score + "% Critical";

const reasonsList = document.getElementById("reasons");
reasons.forEach((r) => {
  const li = document.createElement("li");
  li.textContent = r;
  reasonsList.appendChild(li);
});

document.getElementById("goBackBtn").addEventListener("click", () => {
  window.history.back();
});

document.getElementById("proceedBtn").addEventListener("click", () => {
  if (confirm("Are you sure? This site may be dangerous.")) {
    // Append bypass param to the ORIGINAL URL (not parsed)
    // Use & if URL already has query params, ? if not
    const separator = rawUrl.includes("?") ? "&" : "?";
    window.location.href = rawUrl + separator + "sentinel_bypass=1";
  }
});
