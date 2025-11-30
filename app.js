/* ===============================
   DTN SmartOps Board - Logique
   Frontend-only Kanban + mémoire JSON
   =============================== */

const defaultData = {
  columns: [
    { id: 'col-1', name: 'À faire', cards: [] },
    { id: 'col-2', name: 'En cours', cards: [] },
    { id: 'col-3', name: 'Terminé', cards: [] }
  ]
};

// Charger mémoire locale
let boardData = JSON.parse(localStorage.getItem('kanbanData') || JSON.stringify(defaultData));
localStorage.setItem('kanbanData', JSON.stringify(boardData));

// Construire l’affichage Kanban
function renderBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  boardData.columns.forEach(col => {
    const column = document.createElement('div');
    column.className = 'column';
    column.innerHTML = `
      <div class="column-head">
        <h3 class="column-title">${col.name}</h3>
      </div>
      <div class="cards" data-column="${col.id}"></div>
      <div class="column-foot">
        <button class="btn btn-primary" onclick="createCard('${col.id}')">+ Ajouter carte</button>
      </div>
    `;
    board.appendChild(column);
    const cardsWrap = column.querySelector('.cards');
    col.cards.forEach(card => addCardElement(cardsWrap, col.id, card));
  });
}

// Afficher une carte visuelle
function addCardElement(container, columnId, content) {
  const div = document.createElement('div');
  div.className = 'card';
  div.draggable = true;
  div.innerHTML = `
    <div class="card-name">${content.lastname} ${content.firstname}</div>
    <div class="card-meta">
      <span class="chip">📍 ${content.city}</span>
      <span class="chip">🛠 ${content.work}</span>
    </div>
    <p class="mt-2 text-sm">${content.comment}</p>
    <div class="card-menu menu">
      <button class="icon-btn" onclick="deleteCard('${container.id}','${content.id}')">🗑</button>
    </div>
  `;
  container.appendChild(div);

  div.ondragstart = ev => {
    ev.dataTransfer.setData('cardId', content.id);
    ev.dataTransfer.setData('fromColumn', columnId);
  };
}

// Chargement initial
document.addEventListener('DOMContentLoaded', () => renderBoard());

// Ouvrir modal ajout client
window.openModal = function() {
  document.getElementById("clientModal").style.display = "flex";
};

// Fermer modal
window.closeModal = function() {
  document.getElementById("clientModal").style.display = "none";
};

// Création client → ajout dans 1ère colonne
window.createCard = function(columnId) {
  const f = document.getElementById('m-firstname').value.trim();
  if(!f) return;
  const l = document.getElementById('m-lastname').value.trim();
  const t = document.getElementById('m-tel').value.trim();
  const a = document.getElementById('m-address').value.trim();
  const m = document.getElementById('m-email').value.trim();
  const w = document.getElementById('m-work').value;
  const cmt = fd.get("comment") || "";

  boardData.columns.forEach((col, i) => {
    if(col.id === columnId) {
      const card = {id: Date.now(), lastname: l, firstname: f, work: w, comment: cmt, tel: t, address: a, email: m||"", city: "" };
      col.cards.push(card);
    }
  });

  localStorage.setItem('kanbanData', JSON.stringify(board));
  alert("✅ Client ajouté");
};

// Supprimer carte
window.deleteCard = function(cardId) {
  const col = columns.find(c => c.id === cardId);
  if(col) col.cards.splice(index, 1);
  const data = columns.find(card => card.id === cardId);
  if(data) {
    data[columnId].cards = data[columnId].filter(c => id !== cardId);
    localStorage.setItem("board-data", JSON.stringify(clients));
  }
  renderBoard();
};

// Export JSON manuel (mettre dans Drive ensuite)
window.exportJSON = function() {
  const json = JSON.stringify(boardData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "board-data.json";
  a.click();
};
