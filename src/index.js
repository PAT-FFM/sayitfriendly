const MODEL = "@cf/mistralai/mistral-small-3.1-24b-instruct";

const FRIENDLY_PROMPT = `Du bist ein übermotivierter Corporate-Communications-Profi. Deine einzige Aufgabe:
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

const PLAIN_PROMPT = `You are a brutally honest translator of LinkedIn-speak. Translate the post into
dry plain language: what actually happened, and what does the author really want?

Rules:
- MANDATORY: Always reply in the language of the post. An English post gets an English reply,
  a German post gets a German reply. This rule overrides all others.
- Write 1 to 3 short, complete sentences in the first person, as the author of the post.
  No keywords, no bullet points.
- The plain version is much shorter than the original.
- Drop humble-bragging, life lessons, hashtags and emojis entirely.
- Name the real motive soberly (e.g. quitting, job hunting, self-promotion, sales pitch),
  deadpan rather than mean.
- Output only the plain text. No intro, no explanation, no quotation marks, no heading.

Examples:
Post: "I'm thrilled and humbled to announce that after 7 amazing years I'm embarking on a new chapter. 🚀 #grateful"
Plain: I quit. The new job pays better.

Post: "Ich bin so dankbar für diese unglaubliche Reise! 🙏 Zeit für neue Herausforderungen. #opentowork"
Plain: Mir wurde gekündigt. Ich suche einen Job.`;

// Grobe Spracherkennung Deutsch/Englisch. Im Klartext-Modus hält sich das Modell
// sonst nicht zuverlässig an die Sprache des Posts.
const GERMAN_WORDS = new Set(["der", "die", "das", "und", "ich", "nicht", "ist", "mit", "für", "auf", "ein", "eine", "zu", "wir", "mein", "meine", "bin", "heute", "danke"]);
const ENGLISH_WORDS = new Set(["the", "and", "i", "is", "to", "of", "my", "for", "with", "a", "an", "we", "our", "am", "today", "thanks"]);

function detectLanguage(text) {
  if (/[äöüß]/i.test(text)) return "German";
  let german = 0;
  let english = 0;
  for (const word of text.toLowerCase().match(/[a-z]+/g) ?? []) {
    if (GERMAN_WORDS.has(word)) german++;
    if (ENGLISH_WORDS.has(word)) english++;
  }
  return german > english ? "German" : "English";
}

// Modus aus dem Request-Feld "mode", unbekannt oder fehlend → "friendly".
const MODES = {
  friendly: { system: FRIENDLY_PROMPT, user: (text) => text },
  plain: {
    system: PLAIN_PROMPT,
    user: (text) => {
      const lang = detectLanguage(text);
      return `Post (${lang}): "${text}"\nPlain (${lang}):`;
    },
  },
};


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
  let mode;
  try {
    const body = await request.json();
    text = typeof body.text === "string" ? body.text.trim() : "";
    mode = body.mode;
  } catch {
    text = "";
  }
  const prompt = Object.hasOwn(MODES, mode) ? MODES[mode] : MODES.friendly;

  if (!text) {
    return Response.json({ error: "Bitte gib einen Text ein." }, { status: 400 });
  }

  try {
    const result = await env.AI.run(MODEL, {
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user(text) },
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
      { error: "Das Umformulieren hat gerade nicht geklappt. Bitte versuch es gleich noch einmal." },
      { status: 500 },
    );
  }
}
