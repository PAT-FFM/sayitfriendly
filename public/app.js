const form = document.getElementById("form");
const input = document.getElementById("input");
const button = document.getElementById("submit");
const status = document.getElementById("status");
const result = document.getElementById("result");
const original = document.getElementById("original");
const friendly = document.getElementById("friendly");
const resultHeading = document.getElementById("result-heading");
const fill = document.getElementById("fill");

const MODES = {
  friendly: {
    examples: [
      "Das Meeting war komplett sinnlos und du hast mal wieder alles verbockt.",
      "Deine Präsentation war so langweilig, dass ich fast eingeschlafen wäre. Nächstes Mal bitte mit Inhalt.",
      "Your code is a mess and nobody understands what you were thinking.",
    ],
    button: "Freundlich machen",
    loading: "Wird schöngefärbt …",
    heading: "Freundlich",
  },
  plain: {
    examples: [
      "I'm thrilled and humbled to announce that after 7 amazing years I'm starting a new chapter. 🚀 #grateful",
      "Was mir mein Hund über Leadership beigebracht hat: Er wartet nicht auf Perfektion, er geht einfach los. 🐕 Agree? 👇 #Mindset #Leadership",
      "Ich bin unglaublich dankbar, Teil dieser Reise sein zu dürfen. Neue Herausforderungen warten! 💪 #NewBeginnings #OpenToWork",
    ],
    button: "Klartext bitte",
    loading: "Wird entschwurbelt …",
    heading: "Klartext",
  },
  immo: {
    examples: [
      "Lichtdurchflutete Wohnung mit Charme in aufstrebender Lage, verkehrsgünstig gelegen. Ideal für Kreative mit Liebe zum Detail.",
      "Gemütliches Hotelzimmer mit Blick auf das pulsierende Stadtleben, nur wenige Gehminuten zum Strand. Frühstück auf Anfrage.",
      "Cozy studio full of potential in a vibrant up-and-coming neighbourhood. Perfect for minimalists who love the urban lifestyle.",
    ],
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
  input.placeholder = `z. B.: ${labels.examples[0]}`;
  button.textContent = labels.button;
  resultHeading.textContent = labels.heading;
  result.hidden = true;
  setStatus("");
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

// Zufälliges Beispiel des aktuellen Modus, möglichst nicht dasselbe wie gerade im Feld
fill.addEventListener("click", () => {
  const candidates = MODES[currentMode()].examples.filter((example) => example !== input.value);
  input.value = candidates[Math.floor(Math.random() * candidates.length)];
  input.focus();
});

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
