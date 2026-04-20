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

  input.addEventListener("change", (e) => {
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
        note: "Carte créée depuis import PDF",
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
