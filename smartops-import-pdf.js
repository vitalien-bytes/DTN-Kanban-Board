document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("pdfImport");
  if (!input) return;

  const LS_KEY = "DTN_SMARTOPS_BOARD_V2";

  function uid() {
    return "id_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function cleanText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function getBetween(text, startLabel, endLabel) {
    const start = text.toLowerCase().indexOf(startLabel.toLowerCase());
    if (start === -1) return "";
    const from = start + startLabel.length;
    const end = endLabel
      ? text.toLowerCase().indexOf(endLabel.toLowerCase(), from)
      : -1;
    const chunk = end === -1 ? text.slice(from) : text.slice(from, end);
    return cleanText(chunk);
  }

  function extractPhone(text) {
    const m = text.match(/0[1-9](?:[\s.\-]?\d{2}){4}/);
    return m ? m[0].replace(/[^\d]/g, "") : "";
  }

  function extractLastname(text) {
    let value =
      getBetween(text, "Contact sur site :", "Téléphone :") ||
      getBetween(text, "Nom client :", "Adresse :") ||
      getBetween(text, "Nom du collaborateur :", "Référent technique") ||
      getBetween(text, "Nom du collaborateur :", "Date audit de site") ||
      getBetween(text, "Nom :", "Prénom :");

    value = cleanText(value);

    if (!value) return "Client";

    value = value
      .replace(/^[:\-\s]+/, "")
      .replace(/\bTéléphone\b.*$/i, "")
      .replace(/\bAdresse\b.*$/i, "")
      .trim();

    return value || "Client";
  }

  function extractFirstname(text) {
    let value = getBetween(text, "Prénom :", "Nom de l'entreprise :");
    value = cleanText(value);
    return value;
  }

  function extractAddress(text) {
    let value =
      getBetween(text, "Adresse :", "INFORMATIONS SITE") ||
      getBetween(text, "Adresse :", "Référent technique ENSIO") ||
      getBetween(text, "Adresse installation borne :", "Numéro :");

    value = cleanText(value);

    if (!value) {
      const m = text.match(/Adresse\s*:\s*(.+?)(INFORMATIONS SITE|Référent technique ENSIO|Date audit de site)/i);
      if (m) value = cleanText(m[1]);
    }

    if (!value) {
      const m2 = text.match(/Adresse\s*:\s*(.+)/i);
      if (m2) value = cleanText(m2[1]);
    }

    value = value
      .replace(/\bINFORMATIONS SITE\b.*$/i, "")
      .replace(/\bRéférent technique ENSIO\b.*$/i, "")
      .replace(/\bDate audit de site\b.*$/i, "")
      .trim();

    return value;
  }

  function buildTravaux(text) {
    const travaux = [];

    function addIf(test, label) {
      if (test && !travaux.includes(label)) travaux.push(label);
    }

    addIf(/augmentation de puissance nécessaire\s*:?\s*oui/i.test(text), "Augmentation de puissance à prévoir");
    addIf(/terrassement/i.test(text), "Terrassement à prévoir");
    addIf(/massif béton/i.test(text), "Massif béton à créer");
    addIf(/fourreau existant/i.test(text), "Réutilisation d’un fourreau existant");
    addIf(/tableau divisionnaire|tableautin|TD à créer|2nd tableau|second tableau/i.test(text), "Création / adaptation d’un tableau électrique");
    addIf(/répartiteurs unipolaires|remplacement des bornes par des répartiteurs/i.test(text), "Adaptation du tableau existant");
    addIf(/percement/i.test(text), "Percement(s) à réaliser");
    addIf(/carottage/i.test(text), "Carottage à réaliser");
    addIf(/tube IRL|sous IRL/i.test(text), "Cheminement sous tube IRL");
    addIf(/goulotte/i.test(text), "Cheminement sous goulotte");
    addIf(/garage/i.test(text), "Passage / pose dans le garage");
    addIf(/pose de la borne sur pied|borne sur pied/i.test(text), "Pose de la borne sur pied");
    addIf(/mode de pose\s*:?\s*mural|pose murale|pose de la borne sur le mur/i.test(text), "Pose murale de la borne");
    addIf(/support.*client/i.test(text), "Pose sur support préparé par le client");
    addIf(/smartsensor|smart sensor/i.test(text), "Prévoir Smart Sensor");
    addIf(/délesteur/i.test(text), "Prévoir un délesteur si besoin");
    addIf(/protection.*TGBT|pose des protections dans le TGBT/i.test(text), "Pose des protections dans le TGBT");
    addIf(/reprise du câble existant/i.test(text), "Reprise du câble existant");
    addIf(/mur parpaing/i.test(text), "Percement / fixation sur mur parpaing");
    addIf(/placo/i.test(text), "Percement / passage dans le placo");
    addIf(/faux plafond/i.test(text), "Passage dans le faux plafond");
    addIf(/extérieur/i.test(text), "Installation en extérieur");

    const distanceMatch =
      text.match(/Distance totale du câble IRVE\s*:?\s*([^\n\r]+)/i) ||
      text.match(/Longueur totale du câble\s*:?\s*([^\n\r]+)/i) ||
      text.match(/Longueur totale câble\s*:?\s*([^\n\r]+)/i) ||
      text.match(/Distance entre le tableau électrique et la borne\s*:?\s*([^\n\r]+)/i);

    if (distanceMatch && distanceMatch[1]) {
      travaux.push("Distance estimée du câble : " + cleanText(distanceMatch[1]));
    }

    let note = "Import automatique PDF";
    if (travaux.length) {
      note += "\n\nTravaux à réaliser :\n- " + travaux.join("\n- ");
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

        const lastname = extractLastname(text);
        const firstname = extractFirstname(text);
        const phone = extractPhone(text);
        const address = extractAddress(text);
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
