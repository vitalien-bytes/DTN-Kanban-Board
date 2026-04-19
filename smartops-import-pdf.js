document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("pdfImport");
  if (!input) {
    alert("❌ input pdfImport introuvable");
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
        console.log("Contenu localStorage:", localStorage.getItem(LS_KEY));
        return;
      }

      const targetCol =
        board.columns.find(c => c.name === "À faire") ||
        board.columns.find(c => c.id === "col-1") ||
        board.columns[0];

      const now = new Date().toLocaleString("fr-FR");

      const newCard = {
        id: uid(),
        lastname: file.name.replace(".pdf", "") + " - ENSIO",
        firstname: "",
        tel: "",
        email: "",
        address: "",
        date: "",
        work: "IRVE",
        note: "Carte test créée depuis import PDF",
        history: [
          {
            date: now,
            action: "Création",
            details: "Carte test créée"
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

      alert("✅ Carte test créée");
      location.reload();
    } catch (err) {
      console.error(err);
      alert("❌ Erreur : " + err.message);
    } finally {
      e.target.value = "";
    }
  });
});
