document.addEventListener("DOMContentLoaded", () => {
    console.log("pdfjsLib =", typeof pdfjsLib, pdfjsLib);
  const input = document.getElementById("pdfImport");
  if (!input) {
    alert("❌ input pdfImport introuvable");
    return;
  }

  const LS_KEY = "DTN_SMARTOPS_BOARD_V2";

  function uid() {
    return "id_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function cleanText(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function extract(regex, text) {
    const m = text.match(regex);
    return m ? cleanText(m[1]) : "";
  }

  function extractPhone(text) {
    const m = text.match(/0[1-9](?:[\s.\-]?\d{2}){4}/);
    return m ? m[0].replace(/[^\d]/g, "") : "";
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

    const distance =
      extract(/Distance totale du câble IRVE\s*:?\s*([^\n\r]+)/i, text) ||
      extract(/Longueur totale du câble\s*:?\s*([^\n\r]+)/i, text) ||
      extract(/Longueur totale câble\s*:?\s*([^\n\r]+)/i, text) ||
      extract(/Distance entre le tableau électrique et la borne\s*:?\s*([^\n\r]+)/i, text);

    if (distance) {
      travaux.push("Distance estimée du câble : " + distance);
    }

    if (!travaux.length) return "Import automatique PDF";

    return "Travaux à réaliser :\n- " + travaux.join("\n- ");
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

      const typedarray = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;

      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        text += pageText + "\n";
      }

      console.log("=== TEXTE PDF ===");
      console.log(text);

      const lastname =
        extract(/Contact sur site\s*:?\s*([A-ZÀ-ÿ'’\-\s]+?)\s+Téléphone/i, text) ||
        extract(/Nom client\s*:?\s*([A-ZÀ-ÿ'’\-\s]+?)\s+Adresse/i, text) ||
        extract(/Nom du collaborateur\s*:?\s*([A-ZÀ-ÿ'’\-\s]+?)\s+(?:Référent technique|Date audit de site)/i, text) ||
        extract(/Nom\s*:?\s*([A-ZÀ-ÿ'’\-\s]+?)\s+Prénom/i, text) ||
        file.name.replace(/\.pdf$/i, "");

      const firstname =
        extract(/Prénom\s*:?\s*([A-ZÀ-ÿ'’\-\s]+?)\s+Nom de l'entreprise/i, text) ||
        "";

      const phone = extractPhone(text);

      const address =
        extract(/Adresse\s*:?\s*(.+?)\s+INFORMATIONS SITE/i, text) ||
        extract(/Adresse\s*:?\s*(.+?)\s+Référent technique ENSIO/i, text) ||
        extract(/Adresse\s*:?\s*(.+?)\s+Date audit de site/i, text) ||
        extract(/Adresse\s*:?\s*(.+?)\s+Type de bail/i, text) ||
        "";

      const note = buildTravaux(text);

      console.log("lastname =", lastname);
      console.log("firstname =", firstname);
      console.log("phone =", phone);
      console.log("address =", address);
      console.log("note =", note);

      const now = new Date().toLocaleString("fr-FR");

      const newCard = {
        id: uid(),
        lastname: cleanText(lastname) + " - ENSIO",
        firstname: cleanText(firstname),
        tel: phone,
        email: "",
        address: cleanText(address),
        date: "",
        work: "IRVE",
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

      targetCol.cards = targetCol.cards || [];
      targetCol.cards.unshift(newCard);

      board.meta = board.meta || {};
      board.meta.updatedAt = new Date().toISOString();

      localStorage.setItem(LS_KEY, JSON.stringify(board));

      alert("✅ Fiche client créée");
      location.reload();
    } catch (err) {
      console.error(err);
      alert("❌ Erreur : " + err.message);
    } finally {
      e.target.value = "";
    }
  });
});
