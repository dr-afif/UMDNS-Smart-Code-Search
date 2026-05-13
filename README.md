# 🏥 UMDNS Smart Search | AI-Powered Medical Classification

A premium, production-grade Progressive Web App (PWA) designed for healthcare professionals to quickly search, identify, and classify medical equipment using **UMDNS (Universal Medical Device Nomenclature System)** codes.

This tool transforms a static CSV database into a high-performance, conceptually aware search engine using client-side AI.

---

## ✨ Key Features

### 🧠 AI-Assisted Semantic Matching
- **Transformers.js Integration**: Uses the `all-MiniLM-L6-v2` model for browser-based vector embeddings.
- **Conceptual Search**: Finds results based on meaning, not just keywords (e.g., searching "stomach scope" will prioritize "Gastroscopes").
- **Hybrid Ranking Engine**: Combines direct phrase matching, medical aliases, specialty category boosts, and semantic similarity for superior precision.

### 💎 Premium Glassmorphic UI
- **Modern Design**: A sleek, translucent interface with vibrant gradients and smooth micro-animations.
- **Adaptive Layout**: Fully responsive experience optimized for desktop workstations and mobile devices.
- **Keyboard Optimized**: Full `ArrowUp`/`ArrowDown` navigation and `Enter` to copy for high-speed workflows.

### 📶 Progressive Web App (PWA)
- **Offline First**: Fully functional without an internet connection once loaded.
- **IndexedDB Caching**: AI embeddings are calculated once and stored locally, ensuring instantaneous subsequent loads.
- **Installable**: Can be installed directly onto your desktop or mobile home screen.

### 📊 Professional Excel Integration
- **Smart Copy**: Clicking a result copies both the **UMDNS Code** and the **Term** separated by a tab character.
- **Efficiency**: Allows users to paste directly into Excel/Spreadsheets, populating two adjacent columns automatically.

---

## 🛠️ Technical Stack

- **Inference**: [Transformers.js](https://huggingface.co/docs/transformers.js/index) (all-MiniLM-L6-v2)
- **Logic**: Vanilla ES Modules (Javascript)
- **Styling**: Modern CSS (Variables, Glassmorphism, Flex/Grid)
- **Storage**: IndexedDB (for vector cache)
- **Database**: Local CSV (`umdns_codes.csv`)

---

## 🚀 Deployment

This application is designed to be hosted on any static hosting service, such as **GitHub Pages**.

1.  Push the repository to GitHub.
2.  Enable **GitHub Pages** in Settings → Pages.
3.  Ensure the following files are in the root:
    - `index.html`, `index.css`, `app.js`
    - `sw.js`, `manifest.json`
    - `umdns_codes.csv`

---

## 💡 Usage Tips

- **AI Initialization**: On the first visit, the app will download a small AI model (~23MB) and generate an index. This happens only once.
- **Multi-Cell Paste**: Use the copy feature and paste directly into your procurement spreadsheets to save time.
- **Offline Access**: Once initialized, you can use the tool in areas with no hospital Wi-Fi.

---

## ⚠️ Disclaimer

This tool is designed to assist clinical procurement and equipment classification. All results are suggested matches and must be manually validated by a qualified professional before final equipment classification or procurement processing.

---

**Developed by Dr. Muhammad Afif Abdullah • ED HSAAS**
