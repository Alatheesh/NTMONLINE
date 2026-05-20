<div align="center">
  
  # 🎬 NTM Watch Hub 🍿
  
  **A premium, high-performance cinematic streaming interface and hybrid file indexing hub.**

  [![Web UI](https://img.shields.io/badge/UI-Glassmorphism-blue?style=for-the-badge)](#)
  [![Database](https://img.shields.io/badge/Database-Firebase%20%7C%20JSON-orange?style=for-the-badge)](#)
  [![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-yellow?style=for-the-badge)](#)

</div>

---

## 🚀 About The Project

**NTM Watch Hub** (also known as NTM Stream) is a custom-built web application designed to index, manage, and stream media files with a premium cinematic user experience. 

Built entirely with Vanilla JavaScript and Firebase, it features a highly optimized **Hybrid Data System** that merges local JSON caching with real-time Firestore database queries. This significantly reduces database read costs while providing lightning-fast search results. It also includes advanced bypass routing for strict mobile environments (like Telegram Webview).

## ✨ Key Features

* 🌗 **Cinematic Glassmorphism UI:** Advanced Dark and Light modes featuring dynamic, floating particle background animations and frosted glass components.
* ⚡ **Hybrid Database Architecture:** Smart fetching system that merges local `files.json` data with live `Firebase Firestore` data, caching pages locally to minimize database reads.
* 🎥 **Premium Custom Video Player:** Built on Video.js, customized with a floating Live Badge, PiP (Picture-in-Picture), playback speed controls, and a custom fullscreen override.
* 📱 **MX Player Deep-Linking:** Advanced Android Intent routing (`intent://`) that bypasses strict in-app browser blocks (e.g., Telegram) to launch streams directly inside the native MX Player app.
* 🛡️ **Secure Admin Dashboard:** A hidden, Firebase Auth-protected control panel to Add, Edit, Delete, and Export the media database, complete with user issue reporting.
* 📈 **Live Analytics:** Tracks daily unique visitors dynamically using Firebase increments.

## 💻 Tech Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Backend / Database:** Google Firebase (Firestore, Authentication)
* **Media Player:** Video.js API

---

## 📸 Screenshots

*(Replace these placeholder links with actual screenshots of your website!)*

| Dark Mode (Search) | Light Mode | Video Player |
| :---: | :---: | :---: |
| <img src="https://via.placeholder.com/300x500?text=Search+Dark+Mode" width="200"> | <img src="https://via.placeholder.com/300x500?text=Light+Mode" width="200"> | <img src="https://via.placeholder.com/300x500?text=Video+Player" width="200"> |

---

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/ntmonline.git](https://github.com/yourusername/ntmonline.git)
