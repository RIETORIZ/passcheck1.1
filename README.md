# PassCheck 1.1 — Deploy to Render

## Backend (Render Web Service)
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn app:app`
- Optional: place `common_passwords.csv` and `knn_model.pkl` next to `app.py` if you want them (not included in this package).

## Frontend (Render Static Site)
- Root Directory: `ui`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- Environment: `VITE_API_BASE=https://YOUR-BACKEND-URL.onrender.com`
