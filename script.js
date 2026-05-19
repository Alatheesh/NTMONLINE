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
const searchInput = document.getElementById("search");
const searchBtn = document.getElementById("searchBtn");

async function performSearch() {
  const value = searchInput.value.toLowerCase().trim();

  // If search is empty, reload page 1
  if (!value) {
    currentPage = 1;
    loadPage(1);
    return;
  }

  // Show loading indicator
  fileList.innerHTML = "<p style='text-align: center; color: white;'>Searching...</p>";

  let results = [];

  // 1. Search Local JSON
  const localMatches = allJsonFiles.filter(file => {
    const nameStr = (file.name || "").toLowerCase();
    const catStr = (file.category || "").toLowerCase();
    const typeStr = (file.type || "").toLowerCase();

    return nameStr.includes(value) || catStr.includes(value) || typeStr.includes(value);
  });
  
  results.push(...localMatches);

  // 2. Search Firebase
  try {
    const snapshot = await db.collection("files").get();
    
    const firebaseMatches = [];
    snapshot.forEach(doc => {
      const d = doc.data();
      const nameStr = (d.name || "").toLowerCase();
      const catStr = (d.category || "").toLowerCase();
      const typeStr = (d.type || "").toLowerCase();

      // Fixes the exact match bug by checking if the text is included anywhere
      if (nameStr.includes(value) || catStr.includes(value) || typeStr.includes(value)) {
        firebaseMatches.push({
          id: d.customId,
          name: d.name,
          type: d.type,
          category: d.category,
          description: d.description || "",
          image: d.image || "",
          downloads: d.links || []
        });
      }
    });

    // Combine and remove duplicates
    const combined = [...results, ...firebaseMatches];
    const uniqueResultsMap = new Map();
    combined.forEach(item => uniqueResultsMap.set(item.id, item));
    results = Array.from(uniqueResultsMap.values());

  } catch (error) {
    console.error("Error searching Firebase:", error);
  }

  // Sort descending
  results.sort((a, b) => b.id - a.id);

  // Update display
  currentFiles = results;
  
  fileList.innerHTML = "";
  
  if (currentFiles.length === 0) {
    fileList.innerHTML = `<p style="text-align:center; color: white;">No results found for "${searchInput.value}"</p>`;
    return;
  }

  fileList.innerHTML = `<p class="page-info">Found ${currentFiles.length} result(s)</p>`;

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
}

// Add event listeners for the new Search Button & Enter Key
if (searchBtn) {
  searchBtn.addEventListener("click", performSearch);
}

if (searchInput) {
  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch();
    }
  });

  // Reload the default list immediately if the user clears the search box
  searchInput.addEventListener("input", function(e) {
    if(e.target.value.trim() === "") {
        currentPage = 1;
        loadPage(1);
    }
  });
}

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
