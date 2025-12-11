/* Neon Trip Logger — Final Script (Full Features + Light/Dark Mode + Themes) */

const LS = 'neonTripDB_v2';
let trips = JSON.parse(localStorage.getItem(LS) || '[]');
function save(){ localStorage.setItem(LS, JSON.stringify(trips)); }

function toast(msg, t=2200){
  const box = document.getElementById("toasts");
  if(!box) return;
  const div = document.createElement("div");
  div.className = "toast";
  div.innerText = msg;
  box.appendChild(div);
  setTimeout(()=>{ div.style.opacity=0; setTimeout(()=>div.remove(),300); }, t);
}

/* ---------------- THEME SYSTEM ---------------- */
function applyPalette(p){
  document.body.classList.remove("theme-neon","theme-violet","theme-aqua","theme-forest");
  document.body.classList.add("theme-" + p);
  localStorage.setItem("palette", p);
}

function applyMode(mode){
  if(mode === "light"){
    document.body.classList.add("light-mode");
    document.getElementById("modeToggle").innerText = "Light";
  } else {
    document.body.classList.remove("light-mode");
    document.getElementById("modeToggle").innerText = "Dark";
  }
  localStorage.setItem("mode", mode);
}

document.addEventListener("DOMContentLoaded", () => {
  /* apply saved palette */
  const savedPalette = localStorage.getItem("palette") || "neon";
  const themeSel = document.getElementById("themeSelect");
  if(themeSel){
    themeSel.value = savedPalette;
    themeSel.onchange = ()=> applyPalette(themeSel.value);
  }
  applyPalette(savedPalette);

  /* apply saved mode */
  const savedMode = localStorage.getItem("mode") || "dark";
  applyMode(savedMode);
  const modeBtn = document.getElementById("modeToggle");
  if(modeBtn){
    modeBtn.onclick = ()=>{
      const now = document.body.classList.contains("light-mode") ? "dark" : "light";
      applyMode(now);
      toast(now === "light" ? "Light mode" : "Dark mode");
    };
  }

  /* keyboard shortcuts */
  const search = document.getElementById("search");
  document.addEventListener("keydown", e=>{
    if(e.key === "/" && document.activeElement !== search){
      e.preventDefault(); search?.focus();
    }
  });
});

/* Escape helper */
function esc(s){ 
  return (s||"").replace(/[&<>"']/g, c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  })[c]);
}

/* ================================================================
   INDEX PAGE LOGIC
================================================================= */
if(location.pathname.endsWith("index.html") || location.pathname==="/" || location.pathname.endsWith("/")){
  
  const listEl = document.getElementById("tripList");
  const totalTrips = document.getElementById("totalTrips");
  const totalPlaces = document.getElementById("totalPlaces");
  const totalItems = document.getElementById("totalItems");
  const totalImages = document.getElementById("totalImages");

  const search = document.getElementById("search");
  const sort = document.getElementById("sort");
  const from = document.getElementById("from");
  const to = document.getElementById("to");
  const listInfo = document.getElementById("listInfo");

  function genId(){ return Date.now().toString(36) + Math.random().toString(36).slice(2); }

  window.createTrip = ()=>{
    const name = document.getElementById("name").value.trim();
    if(!name) return toast("Enter trip name");
    const t = {
      id: genId(),
      name,
      location: document.getElementById("location").value.trim(),
      start: document.getElementById("start").value || "",
      end: document.getElementById("end").value || "",
      category: document.getElementById("category").value,
      desc: document.getElementById("desc").value || "",
      itinerary: [],
      images: []
    };
    trips.unshift(t); save(); render(); toast("Trip Added");

    document.getElementById("name").value="";
    document.getElementById("location").value="";
    document.getElementById("desc").value="";
  };

  window.createQuickTrip = ()=> document.getElementById("name").focus();
  window.focusCreate = ()=> document.getElementById("name").focus();
  window.clearFilters = ()=>{ from.value=""; to.value=""; render(); };

  window.importJSON = ()=>{
    const input = document.createElement("input");
    input.type="file"; input.accept="application/json";
    input.onchange = e=>{
      const f = e.target.files[0];
      if(!f) return;
      const r = new FileReader();
      r.onload = ()=>{
        try{
          const arr = JSON.parse(r.result);
          if(Array.isArray(arr)){
            trips = arr.concat(trips);
            save(); render();
            toast("Imported JSON");
          } else toast("Invalid JSON");
        } catch{ toast("Error importing"); }
      };
      r.readAsText(f);
    };
    input.click();
  };

  window.exportAll = ()=>{
    const a = document.createElement("a");
    a.href = "data:application/json," + encodeURIComponent(JSON.stringify(trips));
    a.download = "all_trips.json"; a.click();
  };

  window.exportVisible = ()=>{
    const q = search.value.toLowerCase();
    const arr = filterTrips(trips);
    const a = document.createElement("a");
    a.href="data:application/json," + encodeURIComponent(JSON.stringify(arr));
    a.download="visible_trips.json"; a.click();
  };

  function filterTrips(arr){
    let res = arr.slice();
    if(from.value) res = res.filter(t=>t.start >= from.value);
    if(to.value) res = res.filter(t=>t.end <= to.value);
    if(search.value){
      let q = search.value.toLowerCase();
      res = res.filter(t => (t.name+t.location+t.desc).toLowerCase().includes(q));
    }
    if(sort.value==="latest") res.sort((a,b)=> b.id.localeCompare(a.id));
    if(sort.value==="oldest") res.sort((a,b)=> a.id.localeCompare(b.id));
    if(sort.value==="az") res.sort((a,b)=> a.name.localeCompare(b.name));
    return res;
  }

  function computeStats(arr){
    totalTrips.innerText = trips.length;
    totalPlaces.innerText = [...new Set(trips.map(t=>t.location||t.name))].length;
    totalItems.innerText = trips.reduce((s,t)=>s+t.itinerary.length,0);
    totalImages.innerText = trips.reduce((s,t)=>s+t.images.length,0);
    listInfo.innerText = `(${arr.length} shown)`;
  }

  function render(){
    let arr = filterTrips(trips);
    computeStats(arr);

    listEl.innerHTML = arr.map(t=>{
      const done = t.itinerary.filter(i=>i.done).length;
      const pct = t.itinerary.length ? Math.round(done*100/t.itinerary.length) : 0;
      return `
      <div class="tripCard">
        <div>
          <strong>${esc(t.name)}</strong>
          <div class="muted">${esc(t.location||"")}</div>
          <div class="tag ${t.category}">${t.category}</div>
        </div>
        <div style="text-align:right">
          <small class="muted">${t.images.length} 📷 • ${t.itinerary.length} 🗒</small>
          <br>
          <a href="trip.html?id=${t.id}">
            <button class="btn small">Open</button>
          </a>
          <button class="btn small" onclick="deleteTripHome('${t.id}',event)">Delete</button>

          <div class="progressMini"><i style="width:${pct}%"></i></div>
        </div>
      </div>`;
    }).join("");
  }

  window.deleteTripHome = (id,e)=>{
    e.stopPropagation();
    if(!confirm("Delete trip?")) return;
    trips = trips.filter(t=>t.id!==id);
    save(); render(); toast("Deleted");
  };

  search.oninput = render;
  sort.onchange = render;
  from.onchange = render;
  to.onchange = render;

  render();
}

/* ================================================================
   TRIP PAGE LOGIC
================================================================= */
if(location.pathname.endsWith("trip.html")){
  const q = new URLSearchParams(location.search);
  const id = q.get("id");
  let cur = trips.find(t=>t.id===id);
  if(!cur) location.href="index.html";

  const tTitle = document.getElementById("tTitle");
  const tSub = document.getElementById("tSub");
  const itList = document.getElementById("itList");
  const itCount = document.getElementById("itCount");
  const gallery = document.getElementById("gallery");
  const drop = document.getElementById("dropzone");
  const printArea = document.getElementById("printArea");

  function showTrip(){
    tTitle.innerText = cur.name;
    tSub.innerText = `${cur.location||""} • ${cur.category}`;

    document.getElementById("eName").value = cur.name;
    document.getElementById("eLoc").value = cur.location;
    document.getElementById("eStart").value = cur.start;
    document.getElementById("eEnd").value = cur.end;
    document.getElementById("eDesc").value = cur.desc;
    document.getElementById("eCat").value = cur.category;

    renderIt();
    renderGallery();
  }

  /* ---------- Itinerary ---------- */
  window.addIt = ()=>{
    const time = document.getElementById("itTime").value;
    const text = document.getElementById("itText").value;
    if(!text) return toast("Enter activity");
    cur.itinerary.push({ id: Date.now().toString(36), time, text, done:false });
    save(); renderIt(); toast("Added");
  };

  function renderIt(){
    itCount.innerText = `(${cur.itinerary.length})`;
    itList.innerHTML = cur.itinerary.map(i=>`
      <li class="itItem ${i.done?"done":""}" draggable="true"
          data-id="${i.id}" ondragstart="dragStart(event,'${i.id}')">
        <div><strong>${esc(i.time||"")}</strong> — ${esc(i.text)}</div>
        <div class="actions">
          <button class="btn small" onclick="toggleDone('${i.id}')">${i.done?"↺":"✓"}</button>
          <button class="btn small" onclick="editIt('${i.id}')">✎</button>
          <button class="btn small" onclick="delIt('${i.id}')">🗑</button>
        </div>
      </li>
    `).join("");
  }

  window.toggleDone = id=>{
    const it = cur.itinerary.find(x=>x.id===id);
    if(!it) return;
    it.done = !it.done;
    save(); renderIt();
  };
  window.editIt = id=>{
    const it = cur.itinerary.find(x=>x.id===id);
    const s = prompt("Edit activity", it.text);
    if(s != null){ it.text = s; save(); renderIt(); }
  };
  window.delIt = id=>{
    if(!confirm("Delete item?")) return;
    cur.itinerary = cur.itinerary.filter(x=>x.id!==id);
    save(); renderIt();
  };

  /* Drag reorder */
  let dragId = null;
  window.dragStart = (e,id)=> dragId = id;
  window.allowDrop = e=> e.preventDefault();
  itList.ondrop = e=>{
    e.preventDefault();
    const target = e.target.closest(".itItem");
    if(!target) return;
    const toId = target.dataset.id;

    const fromIndex = cur.itinerary.findIndex(x=>x.id===dragId);
    const toIndex = cur.itinerary.findIndex(x=>x.id===toId);
    const [item] = cur.itinerary.splice(fromIndex,1);
    cur.itinerary.splice(toIndex,0,item);

    save(); renderIt();
  };

  /* ---------- Gallery ---------- */
  window.filesPicked = files => [...files].forEach(addImage);

  function addImage(file){
    const reader = new FileReader();
    reader.onload = ev=>{
      const img = new Image();
      img.onload = ()=>{
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 1600 / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        const out = canvas.toDataURL("image/jpeg", 0.78);
        cur.images.push(out); save(); renderGallery();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  ["dragenter","dragover"].forEach(ev=>{
    drop.addEventListener(ev, e=>{ e.preventDefault(); drop.classList.add("drag"); });
  });
  ["dragleave","drop"].forEach(ev=>{
    drop.addEventListener(ev, e=> drop.classList.remove("drag"));
  });
  drop.addEventListener("drop", e=>{
    e.preventDefault();
    const files = e.dataTransfer.files;
    if(files.length) window.filesPicked(files);
  });

  function renderGallery(){
    gallery.innerHTML = cur.images.map((img,i)=>`
      <div class="thumb">
        <img src="${img}" onclick="openModal(${i})">
        <button class="del" onclick="delImg(${i})">×</button>
      </div>
    `).join("");
  }

  window.delImg = i=>{
    if(!confirm("Delete image?")) return;
    cur.images.splice(i,1); save(); renderGallery();
  };

  /* Modal */
  const modal = document.getElementById("photoModal");
  const modalImg = document.getElementById("modalImg");
  let curPhoto = 0;

  window.openModal = i=>{
    curPhoto = i;
    modal.style.display="flex";
    modalImg.src = cur.images[i];
    document.body.style.overflow="hidden";
  };
  window.closeModal = e=>{
    if(e.target===modal){
      modal.style.display="none";
      document.body.style.overflow="auto";
    }
  };
  window.prevPhoto = e=>{
    e.stopPropagation();
    curPhoto = (curPhoto - 1 + cur.images.length) % cur.images.length;
    modalImg.src = cur.images[curPhoto];
  };
  window.nextPhoto = e=>{
    e.stopPropagation();
    curPhoto = (curPhoto + 1) % cur.images.length;
    modalImg.src = cur.images[curPhoto];
  };

  /* ---------- Edit Trip ---------- */
  window.saveTripEdits = ()=>{
    cur.name = document.getElementById("eName").value;
    cur.location = document.getElementById("eLoc").value;
    cur.start = document.getElementById("eStart").value;
    cur.end = document.getElementById("eEnd").value;
    cur.desc = document.getElementById("eDesc").value;
    cur.category = document.getElementById("eCat").value;
    save(); toast("Saved"); showTrip();
  };

  window.deleteTrip = ()=>{
    if(!confirm("Delete entire trip?")) return;
    trips = trips.filter(t=>t.id!==cur.id); save();
    location.href="index.html";
  };

  /* ---------- Exports ---------- */
  window.exportTrip = ()=>{
    const a = document.createElement("a");
    a.href = "data:application/json," + encodeURIComponent(JSON.stringify(cur));
    a.download = (cur.name || "trip") + ".json";
    a.click();
  };

  window.printTrip = ()=>{
    let html = `
      <h1>${esc(cur.name)}</h1>
      <p>${esc(cur.location)}</p>
      <p>${esc(cur.start||"" )}  →  ${esc(cur.end||"")}</p>
      <p>${esc(cur.desc)}</p>
      <h2>Itinerary</h2>
      <ul>
    `;
    cur.itinerary.forEach(i=> html += `<li><strong>${esc(i.time)}</strong> — ${esc(i.text)}</li>`);
    html += `</ul><h2>Photos</h2>`;
    cur.images.forEach(img=> html += `<img src="${img}" style="width:240px;margin:8px;border-radius:8px;">`);

    printArea.innerHTML = html;
    setTimeout(()=> window.print(), 200);
  };

  window.shareTrip = ()=>{
    const txt = JSON.stringify(cur,null,2);
    navigator.clipboard?.writeText(txt).then(()=>toast("Copied"), ()=> prompt("Copy:",txt));
  };

  window.openMapPreview = ()=>{
    if(!cur.location) return toast("No location");
    const q = encodeURIComponent(cur.location);
    window.open("https://www.openstreetmap.org/search?query="+q, "_blank");
  };

  showTrip();
}

/* End of Script */
