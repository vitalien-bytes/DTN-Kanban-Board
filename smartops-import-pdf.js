document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("pdfImport");

  if (!input) {
    alert("❌ pdfImport introuvable");
    return;
  }

  const LS_KEY = "DTN_SMARTOPS_BOARD_V2";

  function uid() {
    return "id_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function cleanText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  input.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      alert("❌ Aucun fichier sélectionné");
      return;
    }

    try {
      if (typeof pdfjsLib === "undefined") {
        alert("❌ PDF.js non chargé");
        return;
      }

      const raw = localStorage.getItem(LS_KEY);
      const board = JSON.parse(raw || "null");

      if (!board || !Array.isArray(board.columns)) {
        alert("❌ Board introuvable dans localStorage");
        return;
      }

      const targetCol =
        board.columns.find(c => c.name === "À faire") ||
        board.columns.find(c => c.id === "col-1") ||
        board.columns[0];

      if (!targetCol.cards) targetCol.cards = [];

      const typedarray = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;

      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        text += pageText + "\n";
      }

      text = cleanText(text);

      const now = new Date().toLocaleString("fr-FR");

      const newCard = {
        // ===== EXTRACTION =====

function extract(regex, text) {
  const m = text.match(regex);
  return m ? m[1].trim() : "";
}

function getPhone(text) {
  const m = text.match(/0[1-9](?:[\s.\-]?\d{2}){4}/);
  return m ? m[0].replace(/[^\d]/g, "") : "";
}

// NOM
const lastname =
  extract(/Contact sur site\s*:?\s*([A-ZÀ-ÿ'’\-\s]+?)\s+Téléphone/i, text) ||
  extract(/Nom client\s*:?\s*([A-ZÀ-ÿ'’\-\s]+?)\s+Adresse/i, text) ||
  extract(/Nom du collaborateur\s*:?\s*([A-ZÀ-ÿ'’\-\s]+?)\s+(?:Référent technique|Date audit)/i, text) ||
  extract(/Nom\s*:?\s*([A-ZÀ-ÿ'’\-\s]+?)\s+Prénom/i, text) ||
  file.name.replace(".pdf","");

// PRENOM
const firstname =
  extract(/Prénom\s*:?\s*([A-ZÀ-ÿ'’\-\s]+)/i, text) || "";

// TEL
const phone = getPhone(text);

// ADRESSE
const address =
  extract(/Adresse\s*:?\s*(.+?)\s+INFORMATIONS/i, text) ||
  extract(/Adresse\s*:?\s*(.+?)\s+Référent/i, text) ||
  extract(/Adresse\s*:?\s*(.+?)\s+Date audit/i, text) ||
  extract(/Adresse\s*:?\s*(.+?)\s+Type/i, text) ||
  "";

// ===== TRAVAUX =====

let travaux = [];

function addIf(test, label) {
  if (test) travaux.push(label);
}

addIf(/terrassement/i.test(text), "Terrassement à prévoir");
addIf(/massif béton/i.test(text), "Massif béton à créer");
addIf(/fourreau existant/i.test(text), "Fourreau existant");
addIf(/percement/i.test(text), "Percement(s)");
addIf(/carottage/i.test(text), "Carottage");
addIf(/IRL/i.test(text), "Passage en IRL");
addIf(/goulotte/i.test(text), "Passage en goulotte");
addIf(/tableau/i.test(text), "Modification tableau électrique");
addIf(/extérieur/i.test(text), "Installation extérieure");

const note =
  travaux.length > 0
    ? "Travaux à réaliser :\n- " + travaux.join("\n- ")
    : "Import automatique PDF";

      targetCol.cards.unshift(newCard);
      board.meta = board.meta || {};
      board.meta.updatedAt = new Date().toISOString();

      localStorage.setItem(LS_KEY, JSON.stringify(board));

      alert("✅ Carte ajoutée avec le détail du PDF");
      location.reload();
    } catch (err) {
      console.error(err);
      alert("❌ Erreur JS : " + err.message);
    } finally {
      e.target.value = "";
    }
  });
});
