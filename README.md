# UMDNS Smart Search

A simple static web app for searching UMDNS codes and terms.

## Features

- Runs fully in the browser
- Suitable for GitHub Pages
- No backend/server required
- Live search as users type
- Direct keyword, synonym, fuzzy, and lightweight semantic-style ranking
- Uses `umdns_codes.csv` as the searchable database

## Files

- `index.html` — main page and layout
- `app.js` — search logic
- `umdns_codes.csv` — UMDNS code/term database

## How to publish on GitHub Pages

1. Create a new GitHub repository, for example: `umdns-smart-search`.
2. Upload these files to the repository root:
   - `index.html`
   - `app.js`
   - `umdns_codes.csv`
   - `README.md`
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, select:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/root**
5. Click **Save**.
6. GitHub will provide a public URL after deployment. 

## Notes

This app suggests likely UMDNS matches for manual review. It should not be treated as automatic final classification without human validation.
