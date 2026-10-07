const form = document.getElementById("form");
const input = document.getElementById("input");
const button = document.getElementById("submit");
const status = document.getElementById("status");
const result = document.getElementById("result");
const original = document.getElementById("original");
const friendly = document.getElementById("friendly");

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) {
    setStatus("Bitte gib zuerst einen Text ein.", true);
    input.focus();
    return;
  }

  button.disabled = true;
  setStatus("Wird schöngefärbt …");

  try {
    const response = await fetch("/api/friendly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Der Server antwortet mit Fehler ${response.status}.`);
    }

    original.textContent = text;
    friendly.textContent = data.friendly;
    result.hidden = false;
    setStatus("");
  } catch (err) {
    const message = err instanceof TypeError
      ? "Der Server ist gerade nicht erreichbar. Bitte versuch es gleich noch einmal."
      : err.message;
    setStatus(message, true);
  } finally {
    button.disabled = false;
  }
});
