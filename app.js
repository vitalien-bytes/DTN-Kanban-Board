const defaultData = {
  columns: [
    { id: 1, title: "À faire", cards: [] },
    { id: 2, title: "En cours", cards: [] },
    { id: 3, title: "Terminé", cards: [] }
  ]
};

// Charger depuis LocalStorage (mémoire navigateur)
const saved = localStorage.getItem("kanbanData");
let data = saved ? JSON.parse(saved) : defaultData;
localStorage.setItem("kanbanData", JSON.stringify(data));

// Afficher colonnes
const board = document.getElementById("board");
function renderBoard() {
  board.innerHTML = "";
  data.columns.forEach(col => {
    const div = document.createElement("div");
    div.className = "bg-white p-3 rounded-xl shadow-md w-64 flex-shrink-0";
    div.innerHTML = `
      <h3 class="text-xl font-semibold mb-2">${col.title}</h3>
      <div id="col-${col.id}" class="space-y-2 mb-2"></div>
      <input id="input-${col.id}" type="text" placeholder="+ Ajouter une carte" class="w-full p-1 border rounded"/>
      <button onclick="addCard(${col.id})" class="w-full bg-orange-500 text-white p-1 rounded text-sm">Ajouter</button>
    `;
    board.appendChild(div);

    const cardContainer = div.querySelector("#col-" + col.id);
    col.cards.forEach(card => {
      const c = document.createElement("div");
      c.className = "bg-gray-200 p-2 rounded-lg text-sm cursor-move";
      c.innerText = card;
      cardContainer.appendChild(c);
    });
  });
}
renderBoard();

// Ajouter carte
window.addCard = function(colId) {
  const input = document.getElementById("input-" + colId);
  if (!input.value.trim()) return;
  const col = data.columns.find(c => c.id === colId);
  col.cards.push(input.value);
  input.value = "";
  save();
  renderBoard();
};

// Sauvegarder dans mémoire navigateur
function save() {
  localStorage.setItem("kanbanData", JSON.stringify(data));
}

// Fonction de sauvegarde JSON (à uploader ensuite sur Drive par toi/secrétaire)
window.save = function() {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "board-data.json";
  a.click();
};
