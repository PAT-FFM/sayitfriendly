const form = document.getElementById("form");
const input = document.getElementById("input");
const button = document.getElementById("submit");
const status = document.getElementById("status");
const result = document.getElementById("result");
const original = document.getElementById("original");
const friendly = document.getElementById("friendly");
const resultHeading = document.getElementById("result-heading");

const MODES = {
  friendly: {
    placeholder: "z. B.: Das Meeting war komplett sinnlos und du hast mal wieder alles verbockt.",
    button: "Freundlich machen",
    loading: "Wird schöngefärbt …",
    heading: "Freundlich",
  },
  plain: {
    placeholder: "z. B.: I'm thrilled and humbled to announce that after 7 amazing years I'm starting a new chapter. 🚀 #grateful",
    button: "Klartext bitte",
    loading: "Wird entschwurbelt …",
    heading: "Klartext",
  },
  immo: {
    placeholder: "z. B.: Lichtdurchflutete Wohnung mit Charme in aufstrebender Lage, verkehrsgünstig gelegen. Ideal für Kreative mit Liebe zum Detail.",
    button: "Klartext bitte",
    loading: "Wird entmaklert …",
    heading: "Klartext",
  },
};

function currentMode() {
  return form.elements.mode.value;
}

function applyMode() {
  const labels = MODES[currentMode()];
  input.placeholder = labels.placeholder;
  button.textContent = labels.button;
  resultHeading.textContent = labels.heading;
  result.hidden = true;
  setStatus("");
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

form.addEventListener("change", (event) => {
  if (event.target.name === "mode") applyMode();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) {
    setStatus("Bitte gib zuerst einen Text ein.", true);
    input.focus();
    return;
  }

  const mode = currentMode();
  button.disabled = true;
  setStatus(MODES[mode].loading);

  try {
    const response = await fetch("/api/friendly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, mode }),
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

applyMode();
