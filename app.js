/******************** DTN SmartOps v2 SAFE (Drive + backups) ********************/

// 1) Colle ton URL Apps Script Web App ICI :
const DRIVE_ENDPOINT = "https://script.google.com/macros/s/AKfycbxCKlMUQLVTZI1G_Ubt8UxOwNQyFvcBPjwDLEwd0RrMvhzXxSmGiK7DaZaY8pKGudMD/exec";

// 2) Une seule clé locale (FINI les mélanges)
const LS_KEY = "DTN_SMARTOPS_BOARD_V2";

const defaultBoard = {
  meta: { version: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  columns: [
    { id: "col-1", name: "À faire", cards: [] },
    { id: "col-2", name: "En cours", cards: [] },
    { id: "col-3", name: "Terminé", cards: [] },
    { id: "archives", name: "Archives", cards: [] }
  ]
};

let state = loadLocal() || structuredClone(defaultBoard);
let editingCard = null;
let autoSaveTimer = null;

function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    driveWrite(false).catch(err => {
      console.error("Auto-save Drive error:", err);
      setStatus("⚠️ Erreur sauvegarde auto Drive");
    });
  }, 1200);
}

const elBoard = document.getElementById("board");
const elStatus = document.getElementById("status");
const elSearch = document.getElementById("search");

// Modal
const modal = document.getElementById("modal");
const m_lastname = document.getElementById("m_lastname");
const m_firstname = document.getElementById("m_firstname");
const m_tel = document.getElementById("m_tel");
const m_email = document.getElementById("m_email");
const m_address = document.getElementById("m_address");
const m_date = document.getElementById("m_date");
const m_work = document.getElementById("m_work");
const m_note = document.getElementById("m_note");
const m_col = document.getElementById("m_col");

function setStatus(msg) { elStatus.textContent = msg; }

function saveLocal() {
  state.meta = state.meta || {};
  state.meta.updatedAt = new Date().toISOString();
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function loadLocal() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function uid() { return "id_" + Math.random().toString(16).slice(2) + Date.now().toString(16); }

function countCards(data) {
  if (!data || !Array.isArray(data.columns)) return 0;
  return data.columns.reduce((sum, c) => sum + (Array.isArray(c.cards) ? c.cards.length : 0), 0);
}

function ensureArchivesColumn() {
  if (!state.columns.some(c => c.id === "archives")) {
    state.columns.push({ id:"archives", name:"Archives", cards:[] });
  }
}

function render() {
  ensureArchivesColumn();

  const q = (elSearch.value || "").trim().toLowerCase();
  elBoard.innerHTML = "";

  // refresh select colonnes modal
  m_col.innerHTML = state.columns.map(c => `<option value="${c.id}">${c.name}</option>`).join("");

  state.columns.forEach(col => {
    const colEl = document.createElement("div");
    colEl.className = "column";
    colEl.dataset.col = col.id;
    // 🔒 FIX drag & drop : binding immédiat et fiable
colEl.addEventListener("dragover", (e) => {
  e.preventDefault();
  colEl.classList.add("drag-over");
});

colEl.addEventListener("dragleave", () => {
  colEl.classList.remove("drag-over");
});

colEl.addEventListener("drop", (e) => {
  e.preventDefault();
  colEl.classList.remove("drag-over");
  onDrop(e, col.id);
});


    colEl.innerHTML = `
      <div class="col-head">
        <div class="col-title">${escapeHtml(col.name)}</div>
        <button class="kebab" title="Options">⋮</button>
      </div>
      <div class="cards" data-drop="${col.id}"></div>
    `;

    const kebab = colEl.querySelector(".kebab");
    kebab.onclick = () => columnMenu(col.id);

    const cardsEl = colEl.querySelector(".cards");
    cardsEl.ondragover = (e) => {
  e.preventDefault();
  colEl.classList.add("drag-over");
};

cardsEl.ondragleave = () => {
  colEl.classList.remove("drag-over");
};

cardsEl.ondrop = (e) => {
  colEl.classList.remove("drag-over");
  onDrop(e, col.id);
};


    col.cards
      .filter(card => {
        if (!q) return true;
        const blob = `${card.lastname||""} ${card.firstname||""} ${card.tel||""} ${card.city||""} ${card.work||""} ${card.note||""}`.toLowerCase();
        return blob.includes(q);
      })
      .forEach(card => cardsEl.appendChild(renderCard(col.id, card)));

    elBoard.appendChild(colEl);
  });

  saveLocal();
}

function renderCard(colId, card) {
  const div = document.createElement("div");
  const workClass =
  `work-${(card.work || "autre").toLowerCase().replace(/[^a-z]/g, "")}`;

const overdueClass = isOverdue(card.date) ? "is-overdue" : "";

div.className = `card ${workClass} ${overdueClass}`;

  div.draggable = true;
  div.dataset.card = card.id;

  div.ondragstart = (e) => {
  div.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("cardId", card.id);
  e.dataTransfer.setData("fromCol", colId);
};

div.ondragend = () => {
  div.classList.remove("dragging");
};


div.innerHTML = `
  <div class="name">${escapeHtml((card.lastname||"").toUpperCase())} ${escapeHtml(card.firstname||"")}</div>
  <div class="meta">
    ${card.address ? `
  <a class="chip chip-link" target="_blank" rel="noopener"
     href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(card.address)}">
     📍 ${escapeHtml(card.address)}
  </a>` : ""}

    ${card.work ? `<span class="chip">🛠 ${escapeHtml(card.work)}</span>` : ""}
    ${card.tel ? `<span class="chip">📞 ${escapeHtml(card.tel)}</span>` : ""}
    ${card.email ? `
  <a class="chip chip-link"
     href="mailto:${escapeHtml(card.email)}">
     ✉ ${escapeHtml(card.email)}
  </a>` : ""}

  </div>
  ${card.note ? `<div class="note">${escapeHtml(card.note)}</div>` : ""}
  <div class="card-actions">
  ${card.date ? `<span class="chip">📅 ${escapeHtml(card.date)}</span>` : ""}

    <button class="icon" data-action="edit" title="Modifier">✎</button>
    <button class="icon" data-action="history" title="Historique">📜</button>
    <button class="icon" data-action="archive" title="Archiver">🗄</button>
    <button class="icon" data-action="delete" title="Supprimer">🗑</button>
  </div>
`;

// ✅ handlers hors du template
div.querySelector('[data-action="edit"]').onclick = () => openModal(card, colId);
div.querySelector('[data-action="history"]').onclick = () => showHistory(card);
div.querySelector('[data-action="archive"]').onclick = () => archiveCard(colId, card.id);
div.querySelector('[data-action="delete"]').onclick = () => deleteCard(colId, card.id);

return div;

}
function showHistory(card) {
  if (!card.history || card.history.length === 0) {
    alert("Aucun historique pour ce client.");
    return;
  }

  const text = card.history
    .map(h => `• ${h.date}\n  ${h.action} : ${h.details}`)
    .join("\n\n");

  alert(`Historique client :\n\n${text}`);
}


function onDrop(e, toCol) {
  const cardId = e.dataTransfer.getData("cardId");
  const fromCol = e.dataTransfer.getData("fromCol");
  if (!cardId || !fromCol || fromCol === toCol) return;

  const src = state.columns.find(c => c.id === fromCol);
  const dst = state.columns.find(c => c.id === toCol);
  if (!src || !dst) return;

  const idx = src.cards.findIndex(x => x.id === cardId);
  if (idx < 0) return;
 const [card] = src.cards.splice(idx, 1);

const fromName = src.name;
const toName = dst.name;
const now = new Date().toLocaleString("fr-FR");

card.history = card.history || [];
card.history.unshift({
  date: now,
  action: "Déplacement",
  details: `${fromName} → ${toName}`
});

dst.cards.unshift(card);
render();

}

function columnMenu(colId) {
  const col = state.columns.find(c => c.id === colId);
  if (!col) return;

  const choice = prompt(
    `Options colonne "${col.name}"\n\nTape :\n1 = Renommer\n2 = Supprimer (si vide)\n\nTon choix :`
  );

  if (choice === "1") {
    const n = prompt("Nouveau nom :", col.name);
    if (n && n.trim()) {
      col.name = n.trim();
      render();
    }
  } else if (choice === "2") {
    if ((col.cards || []).length > 0) {
      alert("⚠️ Colonne non vide. Déplace/Archive d'abord les cartes.");
      return;
    }
    if (confirm("Supprimer cette colonne ?")) {
      state.columns = state.columns.filter(c => c.id !== colId);
      render();
    }
  }
}

function openModal(card=null, colId=null) {
  editingCard = card ? { ...card, _colId: colId } : null;

  m_lastname.value = card?.lastname || "";
  m_firstname.value = card?.firstname || "";
  m_tel.value = card?.tel || "";
  m_email.value = card?.email || "";
  m_address.value = card?.address || "";
  m_date.value = card?.date || "";
  m_work.value = card?.work || "Électricité";
  m_note.value = card?.note || "";

  if (colId) m_col.value = colId;

  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
  editingCard = null;
}

function saveModal() {
  const now = new Date().toLocaleString("fr-FR");

const data = {
  id: editingCard?.id || uid(),
  lastname: (m_lastname.value || "").trim(),
  firstname: (m_firstname.value || "").trim(),
  tel: (m_tel.value || "").trim(),
  email: (m_email.value || "").trim(),
  address: (m_address.value || "").trim(),
  date: (m_date.value || "").trim(),
  work: (m_work.value || "").trim(),
  note: (m_note.value || "").trim(),
  history: editingCard?.history || [
    {
      date: now,
      action: "Création",
      details: "Client créé"
    }
  ],
  updatedAt: now,
  createdAt: editingCard?.createdAt || now
};


  const targetColId = m_col.value;
  const targetCol = state.columns.find(c => c.id === targetColId);
  if (!targetCol) return;

  // si édition : supprimer l'ancienne
  if (editingCard) {
    const fromCol = state.columns.find(c => c.id === editingCard._colId);
    if (fromCol) fromCol.cards = fromCol.cards.filter(x => x.id !== editingCard.id);
  }

  targetCol.cards.unshift(data);
  closeModal();
  render();
}

function deleteCard(colId, cardId) {
  if (!confirm("Supprimer ce client ?")) return;
  const col = state.columns.find(c => c.id === colId);
  if (!col) return;
  col.cards = col.cards.filter(c => c.id !== cardId);
  render();
}

function archiveCard(colId, cardId) {
  const col = state.columns.find(c => c.id === colId);
  const arc = state.columns.find(c => c.id === "archives");
  if (!col || !arc) return;

  const idx = col.cards.findIndex(c => c.id === cardId);
  if (idx < 0) return;
  const [card] = col.cards.splice(idx, 1);
  arc.cards.unshift(card);
  render();
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isOverdue(dateStr) {
  if (!dateStr) return false;          // pas de date = pas de retard
  const due = new Date(dateStr);       // ex: 2026-01-02
  if (isNaN(due)) return false;
  return startOfDay(due) < startOfDay(new Date());
}

/* -------------------- Drive Sync (MANUEL + SAFE) -------------------- */

async function driveRead() {
  if (!DRIVE_ENDPOINT || DRIVE_ENDPOINT.includes("COLLE_ICI")) {
    alert("⚠️ Mets l’URL du WebApp Apps Script dans DRIVE_ENDPOINT (app.js).");
    return;
  }

  setStatus("Chargement depuis Drive…");
  const res = await fetch(DRIVE_ENDPOINT, {
  method: "POST",
  body: JSON.stringify({ action: "read" })
});


  const json = await res.json().catch(() => null);
  if (!json?.ok) {
    setStatus("Erreur chargement Drive.");
    alert("Erreur Drive: " + (json?.error || "inconnue"));
    return;
  }

  const remote = json.data;
  const remoteCount = countCards(remote);
  const localCount  = countCards(state);

  if (!confirm(`Drive contient ${remoteCount} carte(s). Local contient ${localCount}.\n\nRemplacer le LOCAL par Drive ?`)) {
    setStatus("Chargement Drive annulé.");
    return;
  }

  state = remote;
  saveLocal();
  render();
  setStatus("✅ Données chargées depuis Drive.");
}

async function driveWrite(force=false) {
  if (!DRIVE_ENDPOINT || DRIVE_ENDPOINT.includes("COLLE_ICI")) {
    alert("⚠️ Mets l’URL du WebApp Apps Script dans DRIVE_ENDPOINT (app.js).");
    return;
  }

  const cards = countCards(state);
  if (cards === 0 && !force) {
    const ok = confirm("⚠️ Ton board est VIDE (0 carte).\n\nPar sécurité, je bloque.\nClique OK pour annuler.\n\nSi tu veux VRAIMENT écraser Drive avec vide, utilise 'Forcer' (console).");
    setStatus("Sauvegarde Drive bloquée (vide).");
    return;
  }

  setStatus("Sauvegarde sur Drive… (backup auto)");
  const res = await fetch(DRIVE_ENDPOINT, {
  method: "POST",
  body: JSON.stringify({ action: "write", data: state, force })
});


  const json = await res.json().catch(() => null);
  if (!json?.ok) {
    setStatus("Erreur sauvegarde Drive.");
    alert("Erreur Drive: " + (json?.error || "inconnue"));
    return;
  }

  setStatus(`✅ Sauvegardé Drive. Cartes: ${json.savedCards}. (Backup créé)`);
}

// Option “forcer” si tu en as besoin un jour : dans la console -> driveWrite(true)
window.driveWrite = driveWrite;

/* -------------------- Import / Export -------------------- */

function exportJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "board-data.json";
  a.click();
}

function importJSONFile(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      const rc = countCards(data);
      if (!confirm(`Importer ce fichier et remplacer le board actuel ?\nCartes dans le fichier: ${rc}`)) return;
      state = data;
      saveLocal();
      render();
      setStatus("✅ Import terminé.");
    } catch (e) {
      alert("Fichier JSON invalide.");
    }
  };
  r.readAsText(file);
}
/* -------------------- PLANNING -------------------- */

const planningModal = document.getElementById("planningModal");
const planningList = document.getElementById("planningList");
const plFilterEl = document.getElementById("plFilter");

function openPlanning() {
  if (!planningModal) {
    alert("⚠️ planningModal introuvable dans board.html (id='planningModal').");
    return;
  }
  planningModal.style.display = "flex";
  renderPlanning(0, 7);
}

function closePlanning() {
  if (!planningModal) return;
  planningModal.style.display = "none";
}

function colToFilter(colName){
  const n = (colName||"").toLowerCase();
  if (n.includes("faire")) return "todo";
  if (n.includes("cours")) return "doing";
  if (n.includes("termin")) return "done";
  return "all";
}

function inRange(dateStr, fromDays, toDays){
  if(!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return false;

  const today = new Date();
  today.setHours(0,0,0,0);

  const from = new Date(today); from.setDate(today.getDate() + fromDays);
  const to = new Date(today);   to.setDate(today.getDate() + toDays);

  return d >= from && d <= to;
}

function renderPlanning(fromDays, toDays) {
  if (!planningList) return;

  const filter = plFilterEl?.value || "all";

  const items = [];
  state.columns.forEach(col => {
    (col.cards || []).forEach(card => {
      if (!card.date) return;
      if (!inRange(card.date, fromDays, toDays)) return;
      if (filter !== "all" && colToFilter(col.name) !== filter) return;
      items.push({ card, col });
    });
  });

  items.sort((a,b) => (a.card.date || "").localeCompare(b.card.date || ""));

  planningList.innerHTML = "";

  if(items.length === 0){
    planningList.innerHTML = `<div style="color:#cfcfcf">Aucune intervention planifiée sur la période.</div>`;
    return;
  }

  items.forEach(({card, col}) => {
    const div = document.createElement("div");
    div.className = "pl-item";
    div.innerHTML = `
      <div class="pl-left">
        <div class="pl-name">${escapeHtml((card.lastname||"").toUpperCase())} ${escapeHtml(card.firstname||"")}</div>
        <div class="pl-sub">${card.city ? "📍 "+escapeHtml(card.city)+" — " : ""}${card.work ? "🛠 "+escapeHtml(card.work) : ""}</div>
        <span class="pl-badge">${escapeHtml(col.name)}</span>
      </div>
      <div class="pl-date">📅 ${escapeHtml(card.date)}</div>
    `;
    div.style.cursor = "pointer";
    div.onclick = () => { closePlanning(); openModal(card, col.id); };
    planningList.appendChild(div);
  });
}

/* -------------------- UI bindings -------------------- */

document.getElementById("btnAddCard").onclick = () => openModal(null, state.columns[0]?.id || "col-1");
document.getElementById("btnAddCol").onclick = () => {
  const name = prompt("Nom de la nouvelle colonne :");
  if (!name || !name.trim()) return;
  state.columns.push({ id: uid(), name: name.trim(), cards: [] });
  render();
};

document.getElementById("btnExport").onclick = exportJSON;

document.getElementById("fileImport").addEventListener("change", (e) => {
  const f = e.target.files?.[0];
  if (f) importJSONFile(f);
  e.target.value = "";
});

document.getElementById("btnLoadDrive").onclick = driveRead;
document.getElementById("btnSaveDrive").onclick = () => driveWrite(false);

document.getElementById("btnPlanning").onclick = openPlanning;
document.getElementById("closePlanning").onclick = closePlanning;
document.getElementById("plToday").onclick = () => renderPlanning(0, 0);
document.getElementById("plWeek").onclick = () => renderPlanning(0, 7);
document.getElementById("plFilter").onchange = () => renderPlanning(0, 7);


document.getElementById("closeModal").onclick = closeModal;
document.getElementById("btnCancel").onclick = closeModal;
document.getElementById("btnSave").onclick = saveModal;

elSearch.addEventListener("input", () => render());

/* init */
render();
setStatus("Prêt. (Local OK) — Drive: utilise Charger/Sauver.");
