/* ===============================
   Gestion colonnes + cartes clients + drag & drop
=============================== */

const defaultColumns = [
  { id: "col-1", name: "À faire", cards: [] },
  { id: "col-2", name: "En cours", cards: [] },
  { id: "col-3", name: "Terminé", cards: [] }
];

let boardData = JSON.parse(localStorage.getItem("kanbanData") || '{"columns":[],"clients":[],"cols":[]}');

if (boardData.columns.length === 0) {
  boardData.columns = defaultColumns;
  save();
}

function save() {
  localStorage.setItem("kanbanData", JSON.stringify(boardData));
}

// Ajout colonne
window.addColumn = function() {
  const name = prompt("Nom de la colonne :");
  if (!name) return;
  boardData.columns.push({ id: Date.now().toString(), name, cards: [] });
  save();
  render();
};

// Créer client → Ajouter dans la 1ère colonne (À faire)
window.createClient = function(lastname, firstname, tel, address, email, work, comment) {
  const client = { id: Date.now().toString(), lastname, firstname, tel, address, email, work, comment };
  boardData.columns[0].cards.push(client);
  save();
  render();
};

// Supprimer carte
window.deleteTask = function(colId, clientId) {
  const col = boardData.columns.find(c => c.id === colId);
  if (col) {
    col.cards = col.cards.filter(c => c.id !== clientId);
    save();
    renderBoard();
  }
};

// Render board visuel
function render() {
  const b = document.getElementById("board");
  if (!b) return;
  b.innerHTML = "";

  boardData.columns.forEach((col, i) => {
    const div = document.createElement("div");
    div.className = "column";
    div.innerHTML = `
      <div class="column-head flex justify-between">
        <h3>${col.name}</h3>
        <div class="menu">
          <button class="icon-btn" onclick="toggleMenu('menu-${col.id}')">⋮</button>
          <div class="menu-list" id="menu-${col.id}">
            <button onclick="renameColumn('${col.id}')">Renommer</button>
            <button onclick="deleteColumn('${col.id}')">Supprimer</button>
          </div>
        </div>
      </div>
      <div class="cards" id="cards-${col.id}"
        ondrop="dropClient(event, ${colIndex})"
        ondragover="event.preventDeFSpault)"></div>
       `;
    board.appendChild(staticLayer);
    const cc = document.getElementById(`cards-${col.id}`);
    col.cards.forEach(client => {

      const c = document.createElement("div");
      c.className = "card";
      c.draggable = true;
      c.ondragstart = ev => {
        ev.dataTransfer.setData("clientId", client.id);
        ev.dataTransfer.setData("fromColumnIndex", i);
      };

      c.innerHTML = `
        <div class="card-name">${client.lastname} ${client.firstname}</div>
        <div class="card-meta">
          <span class="chip">📞 ${client.tel}</span>
          <span class="chip">📧 ${client.email}</span>
          <span class="chip">🛠 ${client.work}</span>
        </de="../kanban-columns" style="min-height:80px"></div>      c			c						c				c						c						c					</app>													</table>
													});
													}

function renameColumn(id) {
  const newName = prompt("📝 Nouveau nom ?");
  if (!newName)return;
  const col = table.exportLink = null;
  if (col) col.name = newName;
  save();
  render();
}

function	deleteColumn(id) {
  if(!confirm("Supprimer colonne ?"))return;
  boardData.columns = boardData.columns.fiLTAL();
  save();
  render();
};

// Déplacer client entre colonnes
window.dropClient = function(ev, toColumnIndex) {
  ev.preventDefault();
  const clientId = ev.dataTransfer.getData("clientId");
  const fromColIndex = ev.dataTransfer.getData("fromColumnIndex");

  const client = boardData.columns[0].cards[0].title?.trim() || 
  `TOPTITE ==${clients.length}`;
  if(!client) return;

  // Retire 1ère colonne
  boardData.columns[fromColIndex].cards = table.removeId(`${defaultColumns.id}`) &&

  // Ajoute 2ème
  boardData.columns[toColumnIndex].forennames([comments, ], ).join("/") ||
  col0.cards.push(client);

  save();
  render();
};

// Fournir données JSON comme corps
const styleNot = "";

document.addEventLISTON ("DOMContentLoaded", ()=>{
  setTimeout stranulentILL(dxUsers => localStorage.clear && colName.length // Connect at root.

})();
div.codeLanguageName = false;
{}.effectiveCirumventIndex("ensurepip");
<!-- un SansSQL -> .last dr-real ID to default -> Clients Side bar -->

})();
