// ---------------- DATA ----------------
let allJsonFiles = [];
let pageCache = {};
let currentFiles = [];
let currentPage = 1;
let totalFilesCount = 0;
const itemsPerPage = 10;

// 🛑 THE NEW MASTER CACHE
let allFirebaseFiles = null; 

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

// ---------------- PRELOAD FIREBASE CACHE ----------------
// This runs once in the background to save you Firebase reads!
async function preloadAllFiles() {
  if (allFirebaseFiles !== null) return; // Already downloaded!

  try {
    const snapshot = await db.collection("files").get();
    allFirebaseFiles = []; // Initialize empty array
    
    snapshot.forEach(doc => {
      const d = doc.data();
      allFirebaseFiles.push({
        id: d.customId,
        name: d.name,
        type: d.type,
        category: d.category,
        description: d.description || "",
        image: d.image || "",
        downloads: d.links || [],
        year: d.year || ""
      });
    });
    console.log("Database secured in local cache.");
  } catch (error) {
    console.error("Error preloading Firebase cache:", error);
  }
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

// ---------------- SMART SEARCH & TOGGLE CLEAR ----------------
const searchInput = document.getElementById("search");
const searchBtn = document.getElementById("searchBtn");
let isSearchActive = false; 

async function toggleSearch() {
  if (isSearchActive) {
    // 🛑 CLEAR SEARCH
    searchInput.value = "";              
    searchBtn.innerHTML = "🔍";          
    isSearchActive = false;              
    
    currentPage = 1;
    loadPage(1);
    
  } else {
    // 🟢 PERFORM SEARCH ON LOCAL CACHE
    const value = searchInput.value.toLowerCase().trim();
    if (!value) return; 
    
    searchBtn.innerHTML = "✖";
    isSearchActive = true;
    fileList.innerHTML = "<p style='text-align: center; color: white;'>Searching...</p>";

    let results = [];
    const searchWords = value.split(" ").filter(word => word.trim() !== "");

    // 1. Search Local JSON
    const localMatches = allJsonFiles.filter(file => {
      const fileData = `${file.name || ""} ${file.type || ""} ${file.category || ""} ${file.description || ""} ${file.year || ""}`.toLowerCase();
      return searchWords.every(word => fileData.includes(word));
    });
    
    results.push(...localMatches);

    // 2. Search Firebase Cache (NO READ COSTS HERE!)
    try {
      // Safety check: If the user searches before the background download finishes, force it to finish
      if (allFirebaseFiles === null) {
        await preloadAllFiles(); 
      }
      
      const firebaseMatches = allFirebaseFiles.filter(f => {
        const fileData = `${f.name || ""} ${f.type || ""} ${f.category || ""} ${f.description || ""} ${f.year || ""}`.toLowerCase();
        return searchWords.every(word => fileData.includes(word));
      });

      const combined = [...results, ...firebaseMatches];
      const uniqueResultsMap = new Map();
      combined.forEach(item => uniqueResultsMap.set(item.id, item));
      results = Array.from(uniqueResultsMap.values());

    } catch (error) {
      console.error("Error searching cache:", error);
    }

    results.sort((a, b) => b.id - a.id);
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
}

// Add event listeners
if (searchBtn) searchBtn.onclick = toggleSearch;

if (searchInput) {
  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!isSearchActive) toggleSearch();
    }
  });

  searchInput.addEventListener("input", function(e) {
    if (isSearchActive) {
        searchBtn.innerHTML = "🔍";
        isSearchActive = false;
    }
    if (e.target.value.trim() === "") {
        currentPage = 1;
        loadPage(1);
    }
  });
}

// ---------------- LIGHT / DARK MODE ----------------
const toggleBtn = document.getElementById("themeToggle");

if (toggleBtn) {
  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-mode");
    toggleBtn.textContent = "🌙";
  } else {
    toggleBtn.textContent = "☀️";
  }

  toggleBtn.addEventListener("click", function () {
    document.body.classList.toggle("light-mode");
    if (document.body.classList.contains("light-mode")) {
      localStorage.setItem("theme", "light");
      toggleBtn.textContent = "🌙";
    } else {
      localStorage.setItem("theme", "dark");
      toggleBtn.textContent = "☀️";
    }
  });
}

// ---------------- INIT ----------------
(async function init() {
  await loadJSON();
  await getTotalCount();
  
  // 1. Instantly load Page 1 so the user isn't waiting
  loadPage(1); 
  
  // 2. Silently download the rest of the database in the background!
  preloadAllFiles(); 
})();
