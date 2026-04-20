document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("pdfImport");

  if (!input) {
    alert("❌ input pdfImport introuvable");
    return;
  }

  if (typeof pdfjsLib === "undefined") {
    alert("❌ PDF.js non chargé");
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

      const fileBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;

      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        text += pageText + "\n";
      }

      text = cleanText(text);
      // ===== EXTRACTION =====

function extract(regex) {
  const m = text.match(regex);
  return m ? m[1].trim() : "";
}

// NOM
const lastname =
  extract(/Contact sur site\s*:?\s*([A-ZÀ-ÿ'’\-\s]+?)\s+Téléphone/i) ||
  extract(/Nom client\s*:?\s*([A-ZÀ-ÿ'’\-\s]+?)\s+Adresse/i) ||
  extract(/Nom du collaborateur\s*:?\s*([A-ZÀ-ÿ'’\-\s]+?)\s+(?:Référent|Date)/i) ||
  extract(/Nom\s*:?\s*([A-ZÀ-ÿ'’\-\s]+?)\s+Prénom/i) ||
  file.name.replace(".pdf","");

// PRENOM
const firstname =
  extract(/Prénom\s*:?\s*([A-ZÀ-ÿ'’\-\s]+)/i) || "";

// TELEPHONE
const phoneMatch = text.match(/0[1-9](?:[\s.\-]?\d{2}){4}/);
const phone = phoneMatch ? phoneMatch[0].replace(/[^\d]/g, "") : "";

// ADRESSE
const address =
  extract(/Adresse\s*:?\s*(.+?)\s+INFORMATIONS/i) ||
  extract(/Adresse\s*:?\s*(.+?)\s+Référent/i) ||
  extract(/Adresse\s*:?\s*(.+?)\s+Date audit/i) ||
  extract(/Adresse\s*:?\s*(.+?)\s+Type/i) ||
  "";

      const now = new Date().toLocaleString("fr-FR");

      const newCard = {
  id: uid(),
  lastname: lastname + " - ENSIO",
  firstname: firstname,
  tel: phone,
  email: "",
  address: address,
  date: "",
  work: "IRVE",
  note: text.slice(0, 1500),
  history: [
    {
      date: now,
      action: "Création",
      details: "Import PDF"
    }
  ],
  updatedAt: now,
  createdAt: now
};

      targetCol.cards.unshift(newCard);
      board.meta = board.meta || {};
      board.meta.updatedAt = new Date().toISOString();

      localStorage.setItem(LS_KEY, JSON.stringify(board));

      alert("✅ Carte ajoutée");
      location.reload();
    } catch (err) {
      console.error(err);
      alert("❌ Erreur JS : " + err.message);
    } finally {
      e.target.value = "";
    }
  });
});
