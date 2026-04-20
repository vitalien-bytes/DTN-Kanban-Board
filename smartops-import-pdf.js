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

        const lastname = extractLastname(text);
        const firstname = extractFirstname(text);
        const phone = extractPhone(text);
        const address = extractAddress(text);
        const note = buildTravaux(text);

        console.log("lastname =", lastname);
        console.log("firstname =", firstname);
        console.log("phone =", phone);
        console.log("address =", address);
        console.log("note =", note);
