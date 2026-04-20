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

      const now = new Date().toLocaleString("fr-FR");

      const newCard = {
        id: uid(),
        lastname: file.name.replace(/\.pdf$/i, "") + " - ENSIO",
        firstname: "",
        tel: "",
        email: "",
        address: "",
        date: "",
        work: "IRVE",
        note: text ? text.slice(0, 1500) : "Import PDF sans texte détecté",
        history: [
          {
            date: now,
            action: "Création",
            details: "Carte créée depuis import PDF"
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
