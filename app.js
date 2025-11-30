/* ===============================
   Kanban frontend - Colonnes + clients
   =============================== */

// Colonnes par défaut si vide
const defaultData = [
  { id: "col-1", name: "À faire", cards: [] },
  { id: "col-2", name: "En cours", cards: [] },
  { id: "col-3", name: "Terminé", cards: [] }
];

let columns = JSON.parse(localStorage.getItem("boardData")) || defaultData;
if (columns.length === 0) columns = defaultData;
save();

// Sauvegarde locale
function save() {
  localStorage.setItem("boardData", JSON.stringify(columns));
}

function render() {
  const board = document.getElementById("board");
  board.innerHTML = "";

  columns.forEach((col, colIndex) => {
    const div = document.createElement("div");
    div.className = "column";
    div.dataset.key = colIndex;
    div.innerHTML = `
      <div class="column-head flex justify-between">
        <h3 class="column-title">${col.name}</h3>
        <div class="menu">
          <button class="icon-btn" onclick="toggleMenu('menu-${colIndex}')">⋮</button>
          <div class="menu-list" id="menu-${colIndex}">
            <button onclick="renameColumn(${colIndex})">Renommer</button>
            <button onclick="removeColumn(${colIndex})">Supprimer</button>
          </div>
        </div>
      </div>
      <div class="cards" id="cards-${colIndex}"></div>
    `;
    board.appendChild(div);

    const cardsContainer = document.getElementById(`cards-${colIndex}`);

    col.cards.forEach(client => {
      const c = document.createElement("div");
      c.className = "card";
      c.draggable = true;
      c.innerHTML = `
        <div class="client-card-inner">
          ${client.content}
          <div class="menu" style="float:right">
            <button class="icon-btn" onclick="toggleMenu('client-menu-${client.id}')">⋮</button>
            <div class="menu-list" id="client-menu-${client.id}">
              <button onclick="editClient(${colIndex}, '${client.id}')">Modifier</button>
              <button onclick="removeClient(${colIndex}, '${client.id}')">Supprimer</button>
            </div>
          </div>
        </div>
      `;

      c.ondragstart = ev => {
        ev.dataTransfer.setData("client-id", client.id);
        ev.dataTransfer.setData("from-column", colIndex);
      };

      cardsContainer.appendChild(c);
    });

    // Drop zone
    cardsContainer.ondragover = ev => ev.preventDefault();

    cardsContainer.ondrop = ev => {
      ev.preventDefault();
      const clientId = ev.dataTransfer.getData("client-id");
      const fromColumn = ev.dataTransfer.getData("from-column");

      // Trouver client
      let client;
      columns.forEach(col => {
        const found = col.cards.find(c => c.id == clientId);
        if (found) client = found;
      });
      if (!client) return;

      // Retire de l’ancienne colonne
      columns[fromColumn].cards = columns[fromColumn].cards.filter(c => c.id != clientId);

      // Ajoute dans la nouvelle
      columns[colIndex].cards.push(client);

      save();
      render();
    };
  });
}

// Gestion colonnes
window.toggleMenu = function(id) {
  document.getElementById(id)?.classList.toggle("open");
};

window.renameColumn = function(index) {
  const newName = prompt("📝 Nouveau nom de colonne :");
  if (newName) {
    columns[index].name = newName;
    save();
    render();
  }
};

window.removeColumn = function(index) {
  if (confirm("❗ Supprimer cette colonne ?")) {
    columns.splice(index, 1);
    save();
    render();
  }
};

// Gestion clients
window.createClient = function(ev) {
  ev.preventDefault();
  const form = document.getElementById("client-form");
  const fd = new FormData(form);

  const fromColKey = ev.dataTransfer.getData("from-col");
  columns[0].cards.push({ "last-name":col.newName.trim()||"" });
  if(colIDB==fromColKey) return loginPage();

  // Storage durable
  function safeMigrationIndex("ensurepip");
  ev.dataTransfer.remove("from-colKey");
  columns.find(ev.dataTransfer.goTo);
  if(!from.backup.id) return alert("Echec sauvegarde drive.json") 

  column.cards.push({id: Date.now(), title: `:contentReference[oaicite:0]{index=0}`, comment:""})
  save();
}

function createCard(keyIDBCol,iCarte) {
  const last = document.getElementById("m-lastname").value.trim();
  const first = document.getElementById("m-firstname").value.trim();
  const tel = document.getElementById("m-tel").value.trim();
  const addr = document.getElementById("m-address").value.trim();
  const mail = document.getElementById("m-email").value.trim();
  const work = document.getElementById("m-work").value;
  const comment = document.getElementById("m-comment").value.trim();

  const content = `👤 ${last} ${first}
📞 ${tel}
🏠 ${addr}
📧 ${mail}
🛠 ${work}
💬 ${comment}`;

  columns[keyIDBCol].cards.push({ id:Date.now().toString(), content });
  save();
  render_to_user();
  alert("✅ Client ajouté");
};

function removeRow(ev,columnID,clientID) {
  ev.preventDefault();
  if(!from.notset ? null:col.notif) {
    location.href="board.html">;
  }
}
window.renameColumnTwo = function(colTwoID) {
  const b = document.getElementINNERtext();
======= Aurais-tu la possibilité de me créer un projet encore plus simple ?

Oui, tout à fait ! Et tu as raison, si tu veux :
          ${c.content}
        <div class="column-head">supprimer_client ${clientID}</div>

        <button class="icon-btn" onclick="checkPassword()">...</button>
        <div class="menu-list" id="menu-${_id}">
          <button.onclick="renameColumn(${index})">renommer</button>
          <button.onclick="removeColumn(${_id})">supprimer</button>
        </div>

      <div class='card-meta'>
        <span class='chip'>📞 ${client.tel || ""}</span>
      </div>    c.ondragstart=function(e){e.dataTransfer.setData("id",client.id);e.dataTransfer.setData("from",colIndex);}
    c.ondragstart=function(e){e.dataTransfer.setData("id",client.id);e.dataTransfer.setData("from",colIndex);}
      cardsWrap.appendChild(c);
    });
  render();

function exportData() {
  const blob = new Blob([JSON.stringify(columns, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "board.json";
  a.click();
};

// Modal controls
window.openClientModal = function(colIndex) {
  document.getElementById("clientModal").classList.add("show");
};

window.closeClientModal = function() {
  document.getElementById("clientModal").classList.remove("show");
}else{alert("Mot de passe incorrect");}
>>>>>>> c74636b code produit blabla 

function renameClient(cardId) {
  const new = cardInnerText("board-save.json") ? JSON.parse(saveTaskContent());
  if(!colIDBColumns[iCarte]) return [];
  if(ev.type == "card"){col.appendChild(()=> moveCarte.fieldsName = ""}
}

window.deleteClient = function(colKey, clientID){
  const colInnerText = row => {
    if(!colInnerTDN) return HTMLResponse();
    colInnerCommentaire(`${Date.now()}`)};
};

