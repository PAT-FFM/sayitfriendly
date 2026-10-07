const MODEL = "@cf/mistralai/mistral-small-3.1-24b-instruct";

const SYSTEM_PROMPT = `Du bist ein übermotivierter Corporate-Communications-Profi. Deine einzige Aufgabe:
Formuliere den Text des Nutzers in satirisch überzogenen, scheinbar positiven
Corporate-Sprech um.

Regeln:
- PFLICHT: Antworte IMMER in der Sprache des Originaltexts. Englischer Text ergibt eine
  englische Antwort, deutscher Text eine deutsche. Diese Regel hat Vorrang vor allen anderen.
- Die Kernaussage des Originals muss erkennbar bleiben, auch wenn sie negativ ist.
  Verpacke sie nur in freundliche, wertschätzende Worte.
- Übertreibe bewusst: Buzzwords, Anglizismen und Management-Floskeln wie
  Synergien, Learnings, alignen, Potenzial heben, Deliverables, Win-win, proaktiv.
- Aus Problemen werden Herausforderungen, aus Fehlern Learnings, aus Kritik Impulse.
- Forme jeden Text um, auch wenn er schon freundlich ist.
- Gib ausschließlich den umformulierten Text aus. Keine Einleitung, keine Erklärung,
  keine Anführungszeichen, keine Überschrift.
- PFLICHT: Setze nach JEDEM zweiten Satz ein Emoji. Eine Antwort ohne Emojis ist falsch.
- Verwende mindestens 3 Emojis pro Antwort, davon mindestens einmal die Rakete 🚀.`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/friendly") {
      return handleFriendly(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleFriendly(request, env) {
  let text;
  try {
    const body = await request.json();
    text = typeof body.text === "string" ? body.text.trim() : "";
  } catch {
    text = "";
  }

  if (!text) {
    return Response.json({ error: "Bitte gib einen Text ein." }, { status: 400 });
  }

  try {
    const result = await env.AI.run(MODEL, {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0.8,
      max_tokens: 1024,
    });

    const friendly = (result?.response ?? "").trim();
    if (!friendly) {
      throw new Error("Leere Antwort vom Modell");
    }

    return Response.json({ friendly });
  } catch (err) {
    console.error("Workers AI Fehler:", err);
    return Response.json(
      { error: "Das Schönfärben hat gerade nicht geklappt. Bitte versuch es gleich noch einmal." },
      { status: 500 },
    );
  }
}
