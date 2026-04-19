document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("pdfImport");
  if (!input) return;

  const LS_KEY = "DTN_SMARTOPS_BOARD_V2";

  function uid() {
    return "id_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function normalizePhone(text) {
    const match = text.match(/(0\d(?:[\s.\-]?\d{2}){4})/);
    return match ? match[1].replace(/[^\d]/g, "") : "";
  }

  function extract(regex, text) {
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  }

  function buildNote(text) {
    const notes = [];

    if (/augmentation de puissance nécessaire\s*:\s*oui/i.test(text)) {
      notes.push("Augmentation de puissance à prévoir");
    }
    if (/terrassement/i.test(text)) {
      notes.push("Terrassement à prévoir");
    }
    if (/massif béton/i.test(text)) {
      notes.push("Massif béton à créer");
    }
    if (/fourreau existant/i.test(text)) {
      notes.push("Fourreau existant à réutiliser");
    }
    if (/tableau divisionnaire|tableautin|TD à créer/i.test(text)) {
      notes.push("Création / adaptation tableau à prévoir");
    }
    if (/percement/i.test(text)) {
      notes.push("Percement(s) à réaliser");
    }
    if (/carottage/i.test(text)) {
      notes.push("Carottage à prévoir");
    }
    if (/tube IRL|sous IRL/i.test(text)) {
      notes.push("Cheminement sous IRL");
    }
    if (/goulotte/i.test(text)) {
      notes.push("Cheminement sous goulotte");
    }
    if (/pose de la borne sur pied|borne sur pied/i.test(text)) {
      notes.push("Pose borne sur pied");
    }
    if (/mode de pose\s*:\s*mural|pose de la borne sur le mur|pose murale/i.test(text)) {
      notes.push("Pose borne murale");
    }

    const distance =
      extract(/Distance totale du câble IRVE\s*:\s*([^\n\r]+)/i, text) ||
      extract(/Longueur totale du câble\s*:\s*([^\n\r]+)/i, text) ||
      extract(/Longueur totale câble\s*:\s*([^\n\r]+)/i, text) ||
      extract(/Distance entre le tableau électrique et la borne\s*:\s*([^\n\r]+)/i, text) ||
      extract(/Q13\.\s*Distance tableau életrique - borne\s*:\s*([^\n\r]+)/i, text);

    if (distance) {
      notes.push("Distance estimée : " + distance);
    }

    return notes.length
      ? "Import automatique depuis PDF.\n- " + notes.join("\n- ")
      : "Import automatique depuis PDF.";
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

        const lastname =
          extract(/Contact sur site\s*:\s*([A-ZÀ-Ža-zà-ž'’\-\s]+)/i, text) ||
          extract(/Nom client\s*:\s*([A-ZÀ-Ža-zà-ž'’\-\s]+)/i, text) ||
          extract(/Nom du collaborateur\s*:\s*([A-ZÀ-Ža-zà-ž'’\-\s]+)/i, text) ||
          "Client";

        const firstname =
          extract(/Prénom\s*:\s*([A-ZÀ-Ža-zà-ž'’\-\s]+)/i, text) || "";

        const phone =
          normalizePhone(text);

        const address =
          extract(/Adresse\s*:\s*([^\n\r]+?France)/i, text) ||
          extract(/Adresse\s*:\s*([^\n\r]+)/i, text) ||
          "";

        const work = "IRVE";
        const note = buildNote(text);
        const now = new Date().toLocaleString("fr-FR");

        const newCard = {
          id: uid(),
          lastname: lastname.trim() + " - ENSIO",
          firstname: firstname.trim(),
          tel: phone,
          email: "",
          address: address.trim(),
          date: "",
          work: work,
          note: note,
          history: [
            {
              date: now,
              action: "Création",
              details: "Client créé depuis import PDF"
            }
          ],
          updatedAt: now,
          createdAt: now
        };

        let board;
        try {
          board = JSON.parse(localStorage.getItem(LS_KEY));
        } catch {
          board = null;
        }

        if (!board || !Array.isArray(board.columns)) {
          alert("⚠️ Board SmartOps introuvable dans le navigateur.");
          return;
        }

        const targetCol =
          board.columns.find(c => c.name === "À faire") ||
          board.columns.find(c => c.id === "col-1") ||
          board.columns[0];

        if (!targetCol.cards) targetCol.cards = [];
        targetCol.cards.unshift(newCard);

        board.meta = board.meta || {};
        board.meta.updatedAt = new Date().toISOString();

        localStorage.setItem(LS_KEY, JSON.stringify(board));

        alert("✅ Fiche client créée dans À faire");
        location.reload();
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      alert("Erreur import PDF : " + err.message);
    } finally {
      e.target.value = "";
    }
  });
});
