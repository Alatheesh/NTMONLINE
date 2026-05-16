<!DOCTYPE html>
<html>
<head>
  <title>File Details</title>
  <style>
    body {
      margin: 0;
      font-family: Arial;
      background: #111;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }

    .card {
      background: rgba(255,255,255,0.05);
      padding: 30px;
      border-radius: 12px;
      width: 350px;
      text-align: center;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
      margin: 40px 0;
    }

    .card img {
      width: 100%;
      height: 180px;
      object-fit: cover;
      border-radius: 10px;
      margin-bottom: 15px;
    }

    button {
      margin: 8px;
      padding: 10px 18px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      background: #007bff;
      color: white;
    }

    .back {
      background: #555;
      margin-bottom: 40px;
    }

    #reportContainer {
      margin-top: 10px;
      margin-bottom: 10px;
    }

    #reportBtn {
      background: #ff4444;
      width: 80%;
      max-width: 300px;
    }
  </style>
</head>
<body>

<div class="card" id="fileCard">Loading...</div>

<!-- 🔥 Report button appears here -->
<div id="reportContainer"></div>

<button class="back" onclick="history.back()">← Back</button>

<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>

<script>
const firebaseConfig = {
  apiKey: "AIzaSyA8rEqkC8m8bmDi9UhnJuGuTqaWXY5CuKM",
  authDomain: "filehub-counter.firebaseapp.com",
  projectId: "filehub-counter"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentFileId = null;

async function loadFile() {

  const id = Number(new URLSearchParams(location.search).get("id"));

  const res = await fetch("files.json");
  const localFiles = await res.json();

  const snapshot = await db.collection("files").get();

  const firebaseFiles = [];
  snapshot.forEach(doc => {
    const d = doc.data();
    firebaseFiles.push({
      id: Number(d.customId),
      name: d.name,
      type: d.type,
      category: d.category,
      image: d.image,
      description: d.description,
      links: d.links,
      link: d.link
    });
  });

  const file = [...localFiles, ...firebaseFiles].find(f => Number(f.id) === id);

  if (!file) {
    fileCard.innerHTML = "File not found";
    return;
  }

  currentFileId = file.id;

  // 🔥 Link logic
  let links = [];

  if (Array.isArray(file.links) && file.links.length > 0) {
    links = file.links;
  } 
  else if (Array.isArray(file.downloads) && file.downloads.length > 0) {
    links = file.downloads;
  } 
  else if (file.link && typeof file.link === "string" && file.link.trim() !== "") {
    links = [file.link];
  }

  // 🔥 Check report ON/OFF
  let reportEnabled = true;

  try {
    const settingsDoc = await db.collection("settings").doc("config").get();
    if (settingsDoc.exists) {
      reportEnabled = settingsDoc.data().reportEnabled !== false;
    }
  } catch (e) {
    console.log("Settings fetch error", e);
  }

  // 🔥 Build UI
  fileCard.innerHTML = `
    <img src="${file.image || 'https://via.placeholder.com/300'}">
    <h2>${file.name}</h2>
    <p>${file.type} • ${file.category}</p>
    <p>${file.description || ''}</p>

    ${
      links.length > 0
      ? links.map((l,i)=>{

          let url, label;

          if (typeof l === "string") {
            url = l;
            label = `Download ${i+1}`;
          } else {
            url = l.url;
            label = l.size
              ? `⬇ Download • ${l.size} ${l.unit}`
              : `Download ${i+1}`;
          }

          return `
            <button onclick="window.open('${url}','_blank')">
              ${label}
            </button>
          `;
        }).join("")
      : "<p style='opacity:0.7;'>No download link available</p>"
    }
  `;

  // 🔥 Add report button
  if (reportEnabled) {
    document.getElementById("reportContainer").innerHTML = `
      <button id="reportBtn" onclick="reportIssue()">⚠ Report Issue</button>
    `;
  }
}

// 📤 Report function
function reportIssue() {
  const msg = prompt("Describe the issue:");
  if (!msg) return;

  db.collection("reports").add({
    fileId: currentFileId,
    message: msg,
    time: new Date()
  });

  alert("Report submitted 👍");
}

loadFile();
</script>

</body>
</html>
