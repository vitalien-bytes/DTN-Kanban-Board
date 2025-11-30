/* ============================
   DTN SMARTOPS – LOGIQUE KANBAN
============================== */

let board = JSON.parse(localStorage.getItem("board")) || {
  columns: [
    { id: "col1", name: "À faire", cards: [] },
    { id: "col2", name: "En cours", cards: [] },
    { id: "col3", name: "Terminé", cards: [] }
  ]
};

function saveBoard() {
  localStorage.setItem("board", JSON.stringify(board));
}

/* ------- RENDU DU TABLEAU ------- */
function renderBoard() {
  const container = document.getElementById("board");
  container.innerHTML = "";

  board.columns.forEach((col, colIndex) => {
    const column = document.createElement("div");
    column.className = "column";

    column.innerHTML = `
      <div class="column-head">
        <h3>${col.name}</h3>
        <button class="icon-btn" onclick="toggleMenu('menu-col-${col.id}')">⋮</button>

        <div class="menu-list" id="menu-col-${col.id}">
          <button onclick="renameColumn('${col.id}')">Renommer</button>
          <button onclick="deleteColumn('${col.id}')">Supprimer</button>
        </div>
      </div>
      <div class="cards" id="cards-${col.id}"></div>
    `;

    container.appendChild(column);

    const cardContainer = document.getElementById(`cards-${col.id}`);

    /* ----- Cartes client ----- */
    col.cards.forEach(card => {
      const div = document.createElement("div");
      div.className = "card";
      div.draggable = true;

      div.innerHTML = `
        ${card.content}
        <button class="icon-btn card-menu" onclick="toggleMenu('menu-card-${card.id}')">⋮</button>
        <div class="menu-list" id="menu-card-${card.id}">
          <button onclick="editClient('${col.id}', '${card.id}')">Modifier</button>
          <button onclick="deleteClient('${col.id}', '${card.id}')">Supprimer</button>
        </div>
      `;

      /* --- drag --- */
      div.ondragstart = ev => {
        ev.dataTransfer.setData("clientId", card.id);
        ev.dataTransfer.setData("fromColumn", colIndex);
      };

      cardContainer.ondragover = ev => ev.preventDefault();

      cardContainer.ondrop = ev => {
        const clientId = ev.dataTransfer.getData("clientId");
        const fromColumn = ev.dataTransfer.getData("fromColumn");
        moveClient(fromColumn, colIndex, clientId);
      };

      cardContainer.appendChild(div);
    });
  });
}

/* ------- MENU (3 points) ------- */
function toggleMenu(id) {
  document.querySelectorAll(".menu-list").forEach(m => m.classList.remove("open"));
  document.getElementById(id).classList.toggle("open");
}

/* ------- COLONNES ------- */
function addColumn() {
  const name = prompt("Nom de la colonne :");
  if (!name) return;

  board.columns.push({
    id: "col" + Date.now(),
    name,
    cards: []
  });

  saveBoard();
  renderBoard();
}

function renameColumn(id) {
  const newName = prompt("Nouveau nom :");
  if (!newName) return;

  const col = board.columns.find(c => c.id === id);
  col.name = newName;

  saveBoard();
  renderBoard();
}

function deleteColumn(id) {
  if (!confirm("Supprimer cette colonne ?")) return;
  board.columns = board.columns.filter(c => c.id !== id);
  saveBoard();
  renderBoard();
}

/* ------- CLIENTS ------- */
function openClientModal() {
  document.getElementById("clientModal").style.display = "flex";
}
function closeClientModal() {
  document.getElementById("clientModal").style.display = "none";
}

function createClient(e) {
  e.preventDefault();

  const last = document.getElementById("lastname").value;
  const first = document.getElementById("firstname").value;
  const tel = document.getElementById("tel").value;
  const address = document.getElementById("address").value;
  const email = document.getElementById("email").value;
  const comment = document.getElementById("comment").value;
  const work = document.getElementById("work").value;

  const content = `
👤 ${last} ${first}
📞 ${tel}
🏠 ${address}
📧 ${email}
🛠 ${work}
💬 ${comment}
  `;

  board.columns[0].cards.push({
    id: "card" + Date.now(),
    content
  });

  saveBoard();
  closeClientModal();
  renderBoard();
}

/* ------- Modifier / supprimer carte ------- */
function deleteClient(colId, cardId) {
  const col = board.columns.find(c => c.id === colId);
  col.cards = col.cards.filter(c => c.id !== cardId);
  saveBoard();
  renderBoard();
}

function editClient(colId, cardId) {
  const col = board.columns.find(c => c.id === colId);
  const card = col.cards.find(c => c.id === cardId);

  const newText = prompt("Modifier la fiche client :", card.content);
  if (!newText) return;

  card.content = newText;

  saveBoard();
  renderBoard();
}

/* ------- Déplacement clients ------- */
function moveClient(fromCol, toCol, cardId) {
  const client = board.columns[fromCol].cards.find(c => c.id == cardId);

  board.columns[fromCol].cards = board.columns[fromCol].cards.filter(c => c.id != cardId);
  board.columns[toCol].cards.push(client);

  saveBoard();
  renderBoard();
}

/* ------- EXPORT JSON ------- */
function exportJSON() {
  const blob = new Blob([JSON.stringify(board, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "board-data.json";
  a.click();
}

/* ------- Déconnexion ------- */
function logout() {
  localStorage.clear();
  sessionStorage.clear();
  location.href = "index.html";
}

renderBoard();
