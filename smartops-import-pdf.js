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

  function cleanText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function pushIfFound(arr, condition, label) {
    if (condition) arr.push(label);
  }

  function buildTravaux(text) {
    const travaux = [];

    pushIfFound(travaux, /augmentation de puissance nécessaire\s*:\s*oui/i.test(text), "Augmentation de puissance à prévoir");
    pushIfFound(travaux, /terrassement/i.test(text), "Terrassement à prévoir");
    pushIfFound(travaux, /massif béton/i.test(text), "Massif béton à créer");
    pushIfFound(travaux, /fourreau existant/i.test(text), "Réutilisation d’un fourreau existant");
    pushIfFound(travaux, /tableau divisionnaire|tableautin|TD à créer|2nd tableau|second tableau/i.test(text), "Création / adaptation d’un tableau électrique");
    pushIfFound(travaux, /répartiteurs unipolaires|remplacement des bornes par des répartiteurs/i.test(text), "Adaptation du tableau existant");
    pushIfFound(travaux, /percement/i.test(text), "Percement(s) à réaliser");
    pushIfFound(travaux, /carottage/i.test(text), "Carottage à réaliser");
    pushIfFound(travaux, /tube IRL|sous IRL/i.test(text), "Cheminement sous tube IRL");
    pushIfFound(travaux, /goulotte/i.test(text), "Cheminement sous goulotte");
    pushIfFound(travaux, /garage/i.test(text), "Passage / pose dans le garage");
    pushIfFound(travaux, /pose de la borne sur pied|borne sur pied/i.test(text), "Pose de la borne sur pied");
    pushIfFound(travaux, /mode de pose\s*:\s*mural|pose murale|pose de la borne sur le mur/i.test(text), "Pose murale de la borne");
    pushIfFound(travaux, /support.*client/i.test(text), "Pose sur support préparé par le client");
    pushIfFound(travaux, /smartsensor|smart sensor/i.test(text), "Prévoir Smart Sensor");
    pushIfFound(travaux, /délesteur/i.test(text), "Prévoir un délesteur si besoin");
    pushIfFound(travaux, /protection.*TGBT|pose des protections dans le TGBT/i.test(text), "Pose des protections dans le TGBT");
    pushIfFound(travaux, /reprise du câble existant/i.test(text), "Reprise du câble existant");
    pushIfFound(travaux, /mur parpaing/i.test(text), "Percement / fixation sur mur parpaing");
    pushIfFound(travaux, /placo/i.test(text), "Percement / passage dans le placo");
    pushIfFound(travaux, /faux plafond/i.test(text), "Passage dans le faux plafond");
    pushIfFound(travaux, /extérieur/i.test(text), "Installation en extérieur");

    const distance =
      extract(/Distance totale du câble IRVE\s*:\s*([^\n\r]+)/i, text) ||
      extract(/Longueur totale du câble\s*:\s*([^\n\r]+)/i, text) ||
      extract(/Longueur totale câble\s*:\s*([^\n\r]+)/i, text) ||
      extract(/Distance entre le tableau électrique et la borne\s*:\s*([^\n\r]+)/i, text) ||
      extract(/Q13\.\s*Distance tableau életrique - borne\s*:\s*([^\n\r]+)/i, text);

    if (distance) {
      travaux.push("Distance estimée du câble : " + cleanText(distance));
    }

    const parcours =
      extract(/Description parcours dernier tableau - Borne\s*:\s*([^\n\r].*?)(STRUCTURE DE RECHARGE|Commentaires\s*:|$)/is, text) ||
      extract(/Descriptio\s*n parcours dernier tableau - Borne\s*:\s*([^\n\r].*?)(STRUCTURE DE RECHARGE|Commentaires\s*:|$)/is, text);

    let note = "Import automatique PDF";
    if (travaux.length) {
      note += "\n\nTravaux à réaliser :\n- " + travaux.join("\n- ");
    }
    if (parcours) {
      note += "\n\nDétail parcours :\n" + cleanText(parcours.replace(/STRUCTURE DE RECHARGE|Commentaires\s*:/gi, ""));
    }

    return note;
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
          cleanText(extract(/Contact sur site\s*:\s*([^\n]+)/i, text)) ||
          cleanText(extract(/Nom client\s*:\s*([^\n]+)/i, text)) ||
          cleanText(extract(/Nom du collaborateur\s*:\s*([^\n]+)/i, text)) ||
          "Client";

        const firstname =
          cleanText(extract(/Prénom\s*:\s*([^\n]+)/i, text)) || "";

        const phone = getPhone(text);

        const address =
          cleanText(extract(/Adresse\s*:\s*([^\n]+?France)/i, text)) ||
          cleanText(extract(/Adresse\s*:\s*([^\n]+)/i, text)) ||
          "";

        const note = buildTravaux(text);

        let board = JSON.parse(localStorage.getItem(LS_KEY));
        if (!board || !Array.isArray(board.columns)) {
          alert("⚠️ Board SmartOps introuvable.");
          return;
        }

        const targetCol =
          board.columns.find(c => c.name === "À faire") ||
          board.columns.find(c => c.id === "col-1") ||
          board.columns[0];

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
          note: note,
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

        alert("✅ Fiche client créée avec détails");
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
