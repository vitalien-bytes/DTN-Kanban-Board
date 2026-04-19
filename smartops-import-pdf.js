// ================================
// IMPORT PDF → SMARTOPS
// ================================

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("pdfImport");
  if (!input) return;

  input.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function () {
      const typedarray = new Uint8Array(this.result);

      const pdf = await pdfjsLib.getDocument(typedarray).promise;
      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(" ") + " ";
      }

      // ============================
      // EXTRACTION DES INFOS
      // ============================

      const get = (regex) => {
        const match = text.match(regex);
        return match ? match[1].trim() : "";
      };

      const lastname =
        get(/Contact sur site\s*:\s*([A-ZÉÈÊA-Z\- ]+)/i) ||
        get(/Nom\s*:\s*([A-ZÉÈÊA-Z\- ]+)/i) ||
        "Client";

      const phone = get(/0\d(?:\s?\d{2}){4}/);

      const address = get(/Adresse\s*:\s*([^0-9\n]+[0-9].+?France)/i);

      // ============================
      // CREATION DE LA FICHE
      // ============================

      const newCard = {
        id: "ID-" + Date.now(),
        lastname: lastname + " - ENSIO",
        firstname: "",
        tel: phone,
        email: "",
        address: address,
        date: "",
        work: "IRVE",
        note: "Import automatique depuis PDF",
        status: "todo"
      };

      // ============================
      // AJOUT DANS SMARTOPS
      // ============================

      let board = JSON.parse(localStorage.getItem("boardData")) || [];

      if (board.length === 0) {
        board = [
          { name: "À faire", cards: [] },
          { name: "En cours", cards: [] },
          { name: "Terminé", cards: [] }
        ];
      }

      board[0].cards.push(newCard);

      localStorage.setItem("boardData", JSON.stringify(board));

      alert("✅ Fiche client créée !");
      location.reload();
    };

    reader.readAsArrayBuffer(file);
  });
});
