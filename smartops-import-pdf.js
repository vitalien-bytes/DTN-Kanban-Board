document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("pdfImport");
  if (!input) {
    alert("❌ input pdfImport introuvable");
    return;
  }

  if (typeof pdfjsLib === "undefined") {
    alert("❌ PDF.js non chargé dans board.html");
    return;
  }

  const LS_KEY = "DTN_SMARTOPS_BOARD_V2";

  function uid() {
    return "id_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  input.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      let board = JSON.parse(localStorage.getItem(LS_KEY) || "null");

      if (!board || !Array.isArray(board.columns)) {
        alert("❌ Board introuvable dans localStorage");
        return;
      }

      const targetCol =
        board.columns.find(c => c.name === "À faire") ||
        board.columns.find(c => c.id === "col-1") ||
        board.columns[0];

      const typedarray = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;

      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        const pageText = content.items
          .map(item => item.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        text += pageText + "\n";
      }

      console.log("=== TEXTE PDF ===");
      console.log(text);

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
        note: text.slice(0, 800),
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

      targetCol.cards = targetCol.cards || [];
      targetCol.cards.unshift(newCard);

      board.meta = board.meta || {};
      board.meta.updatedAt = new Date().toISOString();

      localStorage.setItem(LS_KEY, JSON.stringify(board));

      alert("✅ Carte créée avec texte du PDF");
      location.reload();
    } catch (err) {
      console.error(err);
      alert("❌ Erreur : " + err.message);
    } finally {
      e.target.value = "";
    }
  });
});
