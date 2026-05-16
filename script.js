// ---------------- BACKGROUND ----------------
window.addEventListener("DOMContentLoaded", function () {
  const backgrounds = [
    "https://images3.alphacoders.com/137/thumb-1920-1373768.png",
    "https://images8.alphacoders.com/912/thumb-1920-912051.jpg",
    "https://fanart.fanabyss.com/657/thumb-Naruto-87.jpg"
  ];

  const randomIndex = Math.floor(Math.random() * backgrounds.length);
  document.body.style.backgroundImage = `url('${backgrounds[randomIndex]}')`;
});

// ---------------- DATA ----------------
let allJsonFiles = [];
let pageCache = {};
let currentFiles = [];
let currentPage = 1;
let totalFilesCount = 0;
const itemsPerPage = 10;

const fileList = document.getElementById("fileList");

// ---------------- LOAD JSON ----------------
async function loadJSON() {
  const res = await fetch("files.json");
  allJsonFiles = await res.json();
}

// ---------------- GET TOTAL COUNT ----------------
async function getTotalCount() {
  const snap = await db.collection("files")
    .orderBy("customId", "desc")
    .limit(1)
    .get();

  let highestId = 0;

  if (!snap.empty) {
    highestId = snap.docs[0].data().customId;
  }

  totalFilesCount = Math.max(highestId, allJsonFiles.length);
}

// ---------------- LOAD PAGE ----------------
async function loadPage(page) {

  if (pageCache[page]) {
    currentFiles = pageCache[page];
    displayFiles();
    return;
  }

  const startId = totalFilesCount - (page * itemsPerPage) + 1;
  const endId = totalFilesCount - ((page - 1) * itemsPerPage);
  const safeStart = Math.max(1, startId);

  const localFiles = allJsonFiles.filter(f =>
    f.id >= safeStart && f.id <= endId
  );

  const snapshot = await db.collection("files")
    .where("customId", ">=", safeStart)
    .where("customId", "<=", endId)
    .get();

  const firebaseFiles = snapshot.docs.map(doc => {
    const d = doc.data();
    return {
      id: d.customId,
      name: d.name,
      type: d.type,
      category: d.category,
      description: d.description || "",
      image: d.image || "",
      downloads: d.links || []
    };
  });

  const pageFiles = [...localFiles, ...firebaseFiles];

  pageFiles.sort((a, b) => b.id - a.id);

  pageCache[page] = pageFiles;
  currentFiles = pageFiles;

  displayFiles();
}

// ---------------- DISPLAY ----------------
function displayFiles() {
  fileList.innerHTML = "";

  currentFiles.forEach(file => {
    fileList.innerHTML += `
      <div class="file">
        <div>
          <strong>${file.name}</strong><br>
          <small>${file.type} • ${file.category}</small>
        </div>
        <button onclick="openFile(${file.id})">View Details</button>
      </div>
    `;
  });

  createPagination();
}

// ---------------- PAGINATION ----------------
function createPagination() {

  const totalPages = Math.ceil(totalFilesCount / itemsPerPage);

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalFilesCount);

  let html = '<div class="pagination">';

  html += `<p class="page-info">Showing ${startItem}–${endItem} of ${totalFilesCount} files</p>`;

  html += `<button onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Prev</button>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button class="${i === currentPage ? 'active-page' : ''}" onclick="goToPage(${i})">
        ${i}
      </button>
    `;
  }

  html += `<button onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>`;

  html += '</div>';

  fileList.innerHTML += html;
}

// ---------------- PAGE SWITCH ----------------
function goToPage(page) {
  if (page < 1) return;
  currentPage = page;
  loadPage(page);
}

// ---------------- NAVIGATION ----------------
function openFile(id) {
  window.location.href = "file.html?id=" + id;
}

function goHome() {
  window.location.href = "index.html";
}

// ---------------- SEARCH ----------------
document.getElementById("search").addEventListener("input", async function (e) {

  const value = e.target.value.toLowerCase().trim();

  if (!value) {
    loadPage(currentPage);
    return;
  }

  let results = [];

  const localMatches = allJsonFiles.filter(file =>
    file.name.toLowerCase().includes(value) ||
    file.category.toLowerCase().includes(value) ||
    file.type.toLowerCase().includes(value)
  );

  results.push(...localMatches);

  const snapshot = await db.collection("files")
    .where("name", ">=", value)
    .where("name", "<=", value + "\uf8ff")
    .get();

  const firebaseMatches = snapshot.docs.map(doc => {
    const d = doc.data();
    return {
      id: d.customId,
      name: d.name,
      type: d.type,
      category: d.category,
      description: d.description || "",
      image: d.image || "",
      downloads: d.links || []
    };
  });

  results.push(...firebaseMatches);

  results.sort((a, b) => b.id - a.id);

  currentFiles = results;
  displayFiles();
});

// ---------------- DARK MODE ----------------
const toggleBtn = document.getElementById("themeToggle");

if (toggleBtn) {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    toggleBtn.textContent = "☀️";
  }

  toggleBtn.addEventListener("click", function () {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
      localStorage.setItem("theme", "dark");
      toggleBtn.textContent = "☀️";
    } else {
      localStorage.setItem("theme", "light");
      toggleBtn.textContent = "🌙";
    }
  });
}

// ---------------- INIT ----------------
(async function init() {
  await loadJSON();
  await getTotalCount();
  loadPage(1);
})();
