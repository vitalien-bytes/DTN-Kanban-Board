/* ===============================
   Script Board Kanban DTN
=============================== */

const defaultData = {
  columns: [
    {id:"1", name:"À faire", cards:[]},
    {id:"2", name:"En cours", cards:[]},
    {id:"3", name:"Terminé", cards:[]}
  ]
};

let columns = JSON.parse(localStorage.getItem("boardColumns")) || defaultData.columns;
function save(){localStorage.setItem("boardColumns", JSON.stringify(columns));}

function render(){
  const b=document.getElementById("board");
  b.innerHTML="";
  columns.forEach((col,i)=>{
    const d=document.createElement("div");
    d.className="column";
    d.innerHTML=`
      <div class="column-head">
        <h3 class="column-title">${col.name}</h3>
        <div class="menu">
          <button class="icon-btn" onclick="toggleMenu('menu-${col.id}')">⋮</button>
          <div class="menu-list" id="menu-${col.id}">
            <button onclick="editColumn('${col.id}')">Modifier</button>
            <button onclick="removeColumn('${col.id}')">Supprimer</button>
          </div>
        </div>
      </div>
      <div class="cards" id="cards-${col.id}"></div>
      <div class="column-foot">
        <button class="btn btn-primary">+ Ajouter fiche client</button>
      </div>
    `;
    b.appendChild(d);
    const cc=document.getElementById(`cards-${col.id}`);
    if(cc) col.cards.forEach(card=>{
      const cd=document.createElement("div");
      cd.className="card";
      cd.draggable=true;
      cd.innerHTML=`
        ${card.content}
        <div class="menu" style="float:right">
          <button class="icon-btn" onclick="toggleMenu('menu-${col.id}-${card.id}')">⋮</button>
          <div class="menu-list" id="menu-${col.id}-${card.id}">
            <button onclick="editCard('${col.id}', '${card.id}')">Modifier</button>
            <button onclick="deleteCard('${col.id}', '${card.id}')">Supprimer</button>
          </div>
        </div>
      `;
      cc.appendChild(cd.card);
    });
  });
}

window.addColumn=function(){
  const n=document.getElementById("newColumnName").value.trim();
  if(!n) return alert("Nom requis");
  columns.push({id:Date.now().toString(), name:n, cards:[]});
  save();
  render();
}

window.toggleMenu=function(id){
  document.getElementById(id)?.classList.toggle("open");
}

window.editColumn=function(id){
  const nn=prompt("Nouveau nom :");
  if(!nn)return;
  const c=columns.find(x=>x.id===id);
  if(c)c.name=nn;
  save();
  render();
}

window.removeColumn=function(id){
  if(!confirm("Supprimer colonne ?"))return;
  columns=columns.filter(x=>x.id!==id);
  save();
  render();
}

window.createCard=function(columnId,name,city,work,email,comment){
  const col=columns.find(x=>x.id===columnId);
  if(!col)return;
  col.cards.push({id:Date.now().toString(), content:`👤 ${name}\n📍 ${city}\n🛠 ${work}\n📧 ${email}\n💬 ${comment}`});
  save();
  render();
}

window.editCard=function(columnId,cardId){
  const col=columns.find(x=>x.id===columnId);
  if(!col)return;
  const idx=col.cards.findIndex(c=>c.id===cardId);
  if(idx===-1)return;
  const nc=prompt("Modifier fiche :");
  if(!nc)return;
  col.cards[idx].content=nc;
  save();
  render();
}

window.deleteCard=function(columnId,cardId){
  const col=columns.find(x=>x.id===columnId);
  if(col) col.cards=col.cards.filter(c=>c.id!==cardId);
  save();
  render();
}

// Init
document.addEventListener("DOMContentLoaded", render);
