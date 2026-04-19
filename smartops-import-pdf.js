document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("pdfImport");
  if (!input) return;

  const LS_KEY = "DTN_SMARTOPS_BOARD_V2";

  function uid() {
    return "id_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function extract(regex, text) {
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  }

  function getPhone(text) {
    const match = text.match(/(0\d(?:[\s.\-]?\d{2}){4})/);
    return match ? match[1].replace(/[^\d]/g, "") : "";
  }

  input.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();

      reader.onload = async function () {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;

        let text = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(" ") + "\n";
        }

        console.log("PDF TEXT:", text); // debug

        // ======================
        // EXTRACTION
        // ======================

        const lastname =
          extract(/Contact sur site\s*:\s*([^\n]+)/i, text) ||
          extract(/Nom client\s*:\s*([^\n]+)/i, text) ||
          extract(/Nom du collaborateur\s*:\s*([^\n]+)/i, text) ||
          "Client";

        const phone = getPhone(text);

        const address =
          extract(/Adresse\s*:\s*([^\n]+France)/i, text) ||
          extract(/Adresse\s*:\s*([^\n]+)/i, text) ||
          "";

        // ======================
        // CREATION CARTE
        // ======================

        let board = JSON.parse(localStorage.getItem(LS_KEY));

        const targetCol =
          board.columns.find(c => c.name === "À faire") ||
          board.columns[0];

        const now = new Date().toLocaleString("fr-FR");

        const newCard = {
          id: uid(),
          lastname: lastname + " - ENSIO",
          firstname: "",
          tel: phone,
          email: "",
          address: address,
          date: "",
          work: "IRVE",
          note: "Import automatique PDF",
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

        localStorage.setItem(LS_KEY, JSON.stringify(board));

        alert("✅ Fiche client créée !");
        location.reload();
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      alert("Erreur PDF : " + err.message);
    }

    e.target.value = "";
  });
});
