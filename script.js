// Bookmark Manager - Vanilla JS (implements all 16 requirements)
// Save as app.js

const STORAGE_KEY = "bm_app_data_v2";

/* DOM */
const dom = {
  bookmarksGrid: document.getElementById("bookmarksGrid"),
  addBtn: document.getElementById("addBtn"),
  modal: document.getElementById("modal"),
  closeModal: document.getElementById("closeModal"),
  cancelBtn: document.getElementById("cancelBtn"),
  bookmarkForm: document.getElementById("bookmarkForm"),
  titleInput: document.getElementById("title"),
  descInput: document.getElementById("description"),
  urlInput: document.getElementById("url"),
  tagsInput: document.getElementById("tagsInput"),
  search: document.getElementById("search"),
  searchMobile: document.getElementById("searchMobile"),
  sortSelect: document.getElementById("sortSelect"),
  tagsContainer: document.getElementById("tagsContainer"),
  resetFilters: document.getElementById("resetFilters"),
  homeBtn: document.getElementById("homeBtn"),
  archivedBtn: document.getElementById("archivedBtn"),
  listTitle: document.getElementById("listTitle"),
  toast: document.getElementById("toast"),
  themeToggle: document.getElementById("themeToggle"),
  emptyState: document.getElementById("empty")
};

/* App State */
let state = {
  bookmarks: [],
  filterTags: new Set(),
  query: "",
  view: "all", // 'all' or 'archived'
  editingId: null
};

/* Helpers */
function uid(){ return Math.random().toString(36).slice(2,10); }
function nowISO(){ return new Date().toISOString(); }
function toReadable(iso){ if(!iso) return "Never"; return new Date(iso).toLocaleString(); }
function showToast(msg){ dom.toast.textContent = msg; dom.toast.classList.add("show"); setTimeout(()=>dom.toast.classList.remove("show"),1600); }
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state.bookmarks)); }
function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try{ state.bookmarks = JSON.parse(raw); }catch(e){ state.bookmarks = []; }
  } else {
    // seed with a few items similar to your screenshot for immediate view
    state.bookmarks = [
      { id: uid(), title:"Frontend Mentor", desc:"Improve your front-end coding skills by building real projects. Solve real-world HTML, CSS and JavaScript challenges.", url:"https://www.frontendmentor.io", tags:["Practice","Learning","Community"], pinned:false, archived:false, views:47, lastVisited:"2025-01-15T10:00:00.000Z", dateAdded:"2024-09-23T08:00:00.000Z"},
      { id: uid(), title:"MDN Web Docs", desc:"Reference docs about Web technologies (HTML, CSS, JS).", url:"https://developer.mozilla.org", tags:["Reference","HTML","CSS","JavaScript"], pinned:false, archived:false, views:152, lastVisited:"2025-01-10T11:00:00.000Z", dateAdded:"2024-09-24T08:00:00.000Z"},
      { id: uid(), title:"React Docs", desc:"The library for web and native user interfaces.", url:"https://react.dev", tags:["JavaScript","Framework","Reference"], pinned:false, archived:false, views:0, lastVisited:null, dateAdded:"2025-02-20T09:00:00.000Z"},
      { id: uid(), title:"Tailwind CSS", desc:"A utility-first CSS framework for rapidly building modern websites.", url:"https://tailwindcss.com", tags:["CSS","Framework","Tools"], pinned:true, archived:false, views:52, lastVisited:"2024-09-12T09:00:00.000Z", dateAdded:"2024-09-19T08:00:00.000Z"}
    ];
    save();
  }
}

/* Favicon helper */
function faviconFor(url){
  try{
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  }catch(e){ return ""; }
}

/* Tag collection */
function collectTags(){
  const map = new Map();
  state.bookmarks.forEach(b => {
    if(b.archived) return; // show counts for non-archived
    (b.tags || []).forEach(t => {
      map.set(t, (map.get(t)||0)+1);
    });
  });
  return map;
}

/* Render tags in sidebar */
function renderTags(){
  dom.tagsContainer.innerHTML = "";
  const map = collectTags();
  if(map.size === 0){
    dom.tagsContainer.innerHTML = `<div class="small">No tags yet</div>`;
    return;
  }
  Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).forEach(([tag,count])=>{
    const div = document.createElement("div");
    div.className = "tag-item";
    div.innerHTML = `<div class="tag-left">
      <input type="checkbox" data-tag="${tag}" id="tg-${tag}">
      <label for="tg-${tag}">${tag}</label>
      </div>
      <div class="tag-count">${count}</div>`;
    const cb = div.querySelector("input[type=checkbox]");
    cb.checked = state.filterTags.has(tag);
    cb.addEventListener("change", (e)=>{
      if(e.target.checked) state.filterTags.add(tag); else state.filterTags.delete(tag);
      renderBookmarks();
    });
    dom.tagsContainer.appendChild(div);
  });
}

/* Matches current filtering/search/view */
function matches(b){
  if(state.view === "all" && b.archived) return false;
  if(state.view === "archived" && !b.archived) return false;
  if(state.query && !b.title.toLowerCase().includes(state.query.toLowerCase())) return false;
  if(state.filterTags.size > 0){
    // show if bookmark has ANY of selected tags
    let found = false;
    for(let t of state.filterTags) if(b.tags.includes(t)) { found = true; break; }
    if(!found) return false;
  }
  return true;
}

/* Sorting and pinned-first */
function sortList(list){
  const mode = dom.sortSelect.value;
  const copy = list.slice();
  if(mode === "recent") copy.sort((a,b)=> new Date(b.dateAdded) - new Date(a.dateAdded));
  if(mode === "visited") copy.sort((a,b)=> (new Date(b.lastVisited||0) - new Date(a.lastVisited||0)));
  if(mode === "most") copy.sort((a,b)=> (b.views - a.views));
  // pinned first
  copy.sort((a,b)=> (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));
  return copy;
}

/* Render bookmarks grid */
function renderBookmarks(){
  dom.bookmarksGrid.innerHTML = "";
  const filtered = state.bookmarks.filter(matches);
  const sorted = sortList(filtered);
  if(sorted.length === 0){
    dom.emptyState.classList.add("show");
    dom.emptyState.style.display = "block";
  } else {
    dom.emptyState.classList.remove("show");
    dom.emptyState.style.display = "none";
  }

  sorted.forEach(b => {
    const card = document.createElement("div");
    card.className = "card";
    if(b.pinned) card.innerHTML += `<div class="pin-badge">PINNED</div>`;
    card.innerHTML += `
      <div class="top">
        <div class="favicon"><img src="${faviconFor(b.url)}" alt=""></div>
        <div style="flex:1">
          <div class="title">${escapeHtml(b.title)}</div>
          <a class="url" href="${b.url}" target="_blank" rel="noopener" data-id="${b.id}">${b.url}</a>
        </div>
      </div>
      <div class="desc">${escapeHtml(b.desc||"")}</div>
      <div class="tags-row">${(b.tags||[]).map(t=>`<span class="tag-pill">${t}</span>`).join("")}</div>
      <div class="meta">
        <span>👁 ${b.views}</span>
        <span>•</span>
        <span>Last: ${b.lastVisited? toReadable(b.lastVisited) : "Never"}</span>
        <span>•</span>
        <span>Added: ${toReadable(b.dateAdded)}</span>
      </div>
      <div class="actions">
        <button class="action-btn" data-action="visit" data-id="${b.id}">Visit</button>
        <button class="action-btn" data-action="copy" data-id="${b.id}">Copy</button>
        <button class="action-btn" data-action="edit" data-id="${b.id}">Edit</button>
        <button class="action-btn" data-action="archive" data-id="${b.id}">${b.archived? "Unarchive":"Archive"}</button>
        <button class="action-btn" data-action="pin" data-id="${b.id}">${b.pinned? "Unpin":"Pin"}</button>
      </div>
    `;

    // attach listeners for buttons inside card
    card.querySelectorAll(".action-btn").forEach(btn=>{
      btn.addEventListener("click", onCardAction);
    });

    // clicking url should also increment views & open
    const link = card.querySelector("a.url");
    link.addEventListener("click", (e)=>{
      e.preventDefault();
      const id = e.currentTarget.dataset.id;
      openUrl(id);
    });

    dom.bookmarksGrid.appendChild(card);
  });

  renderTags();
}

/* Card actions */
function onCardAction(e){
  const id = e.currentTarget.dataset.id;
  const action = e.currentTarget.dataset.action;
  const idx = state.bookmarks.findIndex(x=>x.id===id);
  if(idx === -1) return;
  const bm = state.bookmarks[idx];

  if(action === "visit"){
    openUrl(id);
  } else if(action === "copy"){
    navigator.clipboard.writeText(bm.url).then(()=>showToast("URL copied"));
  } else if(action === "edit"){
    openEdit(bm.id);
  } else if(action === "archive"){
    bm.archived = !bm.archived;
    save(); renderBookmarks();
    showToast(bm.archived? "Archived":"Unarchived");
  } else if(action === "pin"){
    bm.pinned = !bm.pinned;
    save(); renderBookmarks();
    showToast(bm.pinned? "Pinned":"Unpinned");
  }
}

/* Open link in new tab & increment */
function openUrl(id){
  const bm = state.bookmarks.find(x=>x.id===id);
  if(!bm) return;
  window.open(bm.url, "_blank", "noopener");
  bm.views = (bm.views||0) + 1;
  bm.lastVisited = nowISO();
  save(); renderBookmarks();
}

/* Modal: add / edit */
function openAdd(){
  state.editingId = null;
  dom.modal.classList.remove("hidden");
  dom.modal.setAttribute("aria-hidden","false");
  document.getElementById("modalTitle").textContent = "Add Bookmark";
  dom.bookmarkForm.reset();
  dom.titleInput.focus();
}
function openEdit(id){
  const bm = state.bookmarks.find(x=>x.id===id);
  if(!bm) return;
  state.editingId = id;
  dom.modal.classList.remove("hidden");
  dom.modal.setAttribute("aria-hidden","false");
  document.getElementById("modalTitle").textContent = "Edit Bookmark";
  dom.titleInput.value = bm.title;
  dom.descInput.value = bm.desc || "";
  dom.urlInput.value = bm.url;
  dom.tagsInput.value = (bm.tags||[]).join(", ");
  dom.titleInput.focus();
}
function closeModal(){
  dom.modal.classList.add("hidden");
  dom.modal.setAttribute("aria-hidden","true");
  state.editingId = null;
}

/* Form submit */
dom.bookmarkForm.addEventListener("submit", (e)=>{
  e.preventDefault();
  const title = dom.titleInput.value.trim();
  const url = dom.urlInput.value.trim();
  if(!title || !url){ showToast("Title & URL required"); return; }
  const tags = dom.tagsInput.value.split(",").map(s=>s.trim()).filter(Boolean);

  if(state.editingId){
    const bm = state.bookmarks.find(x=>x.id===state.editingId);
    if(!bm) return;
    bm.title = title; bm.desc = dom.descInput.value.trim(); bm.url = url; bm.tags = tags;
    showToast("Bookmark updated");
  } else {
    const newBm = {
      id: uid(),
      title,
      desc: dom.descInput.value.trim(),
      url,
      tags,
      pinned:false,
      archived:false,
      views:0,
      lastVisited:null,
      dateAdded: nowISO()
    };
    state.bookmarks.push(newBm);
    showToast("Bookmark added");
  }
  save(); closeModal(); renderBookmarks();
});

/* Search & sort */
dom.search.addEventListener("input", (e)=>{ state.query = e.target.value; renderBookmarks(); });
if(dom.searchMobile) dom.searchMobile.addEventListener("input", (e)=>{ state.query = e.target.value; renderBookmarks(); });
dom.sortSelect.addEventListener("change", renderBookmarks);

/* Reset tag filters */
dom.resetFilters.addEventListener("click", ()=>{
  state.filterTags.clear();
  // uncheck all checkboxes in tag list
  dom.tagsContainer.querySelectorAll("input[type=checkbox]").forEach(cb=>cb.checked = false);
  renderBookmarks();
});

/* Navigation (Home / Archived) */
dom.homeBtn.addEventListener("click", ()=>{
  state.view = "all";
  dom.homeBtn.classList.add("active");
  dom.archivedBtn.classList.remove("active");
  dom.listTitle.textContent = "All bookmarks";
  renderBookmarks();
});
dom.archivedBtn.addEventListener("click", ()=>{
  state.view = "archived";
  dom.homeBtn.classList.remove("active");
  dom.archivedBtn.classList.add("active");
  dom.listTitle.textContent = "Archived bookmarks";
  renderBookmarks();
});

/* Theme toggle */
dom.themeToggle.addEventListener("change", (e)=>{
  document.body.classList.toggle("dark", e.target.checked);
  try { localStorage.setItem("bm_theme_dark", e.target.checked ? "1":"0"); } catch {}
});
function restoreTheme(){
  try{
    const t = localStorage.getItem("bm_theme_dark");
    if(t === "1"){ dom.themeToggle.checked = true; document.body.classList.add("dark"); }
  }catch(e){}
}

/* Utilities */
function escapeHtml(s){ if(!s) return ""; return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }

/* Modal controls */
dom.addBtn.addEventListener("click", openAdd);
dom.closeModal.addEventListener("click", closeModal);
dom.cancelBtn.addEventListener("click", closeModal);
dom.modal.addEventListener("click", (e)=>{ if(e.target === dom.modal) closeModal(); });

/* Init */
function init(){
  load();
  restoreTheme();
  renderBookmarks();
}
init();
