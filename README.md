# BigQuery Release Notes Hub

A web application built with **Python Flask** and **plain vanilla HTML, CSS, and JavaScript** that fetches the Google Cloud BigQuery release notes feed and displays them in a clean, modern interface. Users can search and filter updates, and share specific updates directly to Twitter/X using a custom-built, interactive tweet composer modal.

---

## 🚀 Features

- **Automated Feed Parsing**: Fetches the Atom XML feed from Google Cloud and splits entry updates into individual, category-specific release cards.
- **Local Cache**: Caches feed responses locally (`releases_cache.json`) for 1 hour to prevent redundant external network requests and ensure fast loading.
- **Dynamic Search & Filtering**: Real-time filtering by category (Features, Changes, Deprecations, Notes) and keyword search.
- **Twitter/X Sharing Composer**:
  - Automatically formats the tweet with the release date, category, and link.
  - Dynamically truncates the body description to stay under X's 280-character limit.
  - Features a live **character progress ring** (changes color from Green ➡️ Yellow ➡️ Red).
  - Displays a **mock tweet preview** of how the post will look on Twitter/X.
  - Built-in buttons for clipboard copying and direct posting via Twitter Web Intent.

---

## 🛠️ Project Structure

```text
bq-releases-notes/
│
├── static/
│   ├── css/
│   │   └── style.css      # Premium dark-theme styling, animations, and progress rings
│   └── js/
│       └── app.js         # State management, filter logics, character count, and modals
│
├── templates/
│   └── index.html         # Main page structure with Google Fonts, custom SVGs, and overlays
│
├── .gitignore             # Git ignore file excluding cache, virtualenvs, and IDE settings
├── app.py                 # Flask server, Atom feed parsing, and cache management
├── README.md              # Project documentation
└── requirements.txt       # Dependencies
```

---

## 📦 Prerequisites

Ensure you have **Python 3.x** installed. The project relies on the following packages:
- `Flask`
- `requests`
- `beautifulsoup4`

---

## 💻 How to Run Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/EvePulido/EvePulido-event-talks-app.git
   cd EvePulido-event-talks-app
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   *(Alternatively, install them manually: `pip install Flask requests beautifulsoup4`)*

3. **Start the Flask server**:
   ```bash
   python app.py
   ```

4. **Access the application**:
   Open your browser and navigate to **`http://127.0.0.1:5000`**.

---

## 📝 License

This project is open-source and available under the MIT License.
