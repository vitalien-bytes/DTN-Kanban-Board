/* ===============================
   Script Board Kanban DTN
   Gestion colonnes + cards + LocalStorage
   =============================== */

// Initialisation si vide
const defaultData = {
  columns: [
    { id: "col-1", name: "À faire", cards: [] },
    { id: "col-2", name: "En cours", cards: [] },
    { id: "col-3", name: "Terminé", cards: [] }
  ]
};

let boardData = JSON.parse(localStorage.getItem("board-data") || JSON.stringify(defaultData));
localStorage.setItem("board-data", JSON.stringify(boardData));

// Ajouter une colonne avec l'id unique
window.addColumn = function(name) {
  const id = Date.now().toString();
  boardData.columns.push({ id, name, cards: [] });
  localStorage.setItem("board-data", JSON.stringify(boardData));
  renderBoard();
};

// Ajouter un client (fiche)
window.createCard = function(name, city, work, email, comment) {
  const card = `👤 ${name}\n📍 ${city}\n🛠 ${work}\n📧 ${email}\n💬 ${comment}`;
  boardData.columns[0].cards.push(card); // Ajouter dans "À faire" par défaut
  localStorage.setItem("board-data", JSON.stringify(boardData));
  renderBoard();
};

// Supprimer une carte
function deleteCard(columnId, clientId) {
  const col = boardData.columns.find(c => c.id === columnId);
  if (col) col.cards = col.cards.filter(c => c.id !== clientId);
  localStorage.setItem("board-data", JSON.stringify(boardData));
  renderBoard();
}

// Render board
function renderBoard() {
  const board = document.getElementById("board");
  if (!board) return;
  board.innerHTML = "";

  boardData.columns.forEach(col => {
    const div = document.createElement("div");
    div.className = "column";
    div.id = col.id;
    div.innerHTML = `<h3>${col.name}</h3><div class="cards"></div>`;
    board.appendChild(div);

    const cardsContainer = div.querySelector(".cards");
    col.cards.forEach(card => {
      const cardDiv = document.createElement("div");
      cardDiv.className = "card";
      cardDiv.innerText = card;
      cardsContainer.appendChild(cardDiv);
    });
  });
}
