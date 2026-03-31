document.getElementById("saveBtn").addEventListener("click", async () => {
  const apiKey = document.getElementById("apiKey").value.trim();
  const statusEl = document.getElementById("status");
  const btn = document.getElementById("saveBtn");

  if (!apiKey || !apiKey.startsWith("sent_")) {
    statusEl.className = "status error";
    statusEl.textContent = 'Please enter a valid API key starting with "sent_"';
    return;
  }

  btn.disabled = true;
  btn.textContent = "Validating...";

  try {
    const response = await fetch(
      "https://sentinel-zeta-pied.vercel.app/api/stats",
      {
        headers: {
          "X-API-Key": apiKey,
        },
      },
    );

    if (response.ok) {
      await browser.runtime.sendMessage({
        action: "setApiKey",
        apiKey: apiKey,
      });

      statusEl.className = "status success";
      statusEl.textContent = "✓ API key saved successfully!";

      setTimeout(() => {
        window.close();
      }, 1500);
    } else if (response.status === 401) {
      throw new Error("Invalid API key");
    } else {
      throw new Error("Server error");
    }
  } catch (error) {
    statusEl.className = "status error";
    statusEl.textContent =
      "✗ " + (error.message || "Failed to validate API key");
    btn.disabled = false;
    btn.textContent = "Save & Activate";
  }
});

document.getElementById("skipBtn").addEventListener("click", (e) => {
  e.preventDefault();
  window.close();
});
