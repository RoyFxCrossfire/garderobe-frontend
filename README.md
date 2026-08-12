# Garderobe frontend

React + Vite storefront. Haalt live producten op bij `garderobe-backend`
via `/api/catalog`.

## Lokaal draaien

```bash
npm install
cp .env.example .env   # vul VITE_API_BASE in
npm run dev
```

## Naar GitHub

```bash
git init
git add .
git commit -m "Initial commit: Garderobe frontend"
git branch -M main
git remote add origin https://github.com/<jouw-gebruikersnaam>/garderobe-frontend.git
git push -u origin main
```

(Maak eerst een lege repo aan op github.com — New repository, zonder
README/gitignore aan te vinken, anders krijg je een merge-conflict bij de
eerste push.)

## Hosten (Vercel)

1. Ga naar vercel.com, log in met je GitHub-account.
2. "Add New" → "Project" → selecteer je `garderobe-frontend` repo.
3. Vercel herkent automatisch dat het een Vite-project is (build command
   `vite build`, output directory `dist`) — meestal hoef je niets aan te
   passen.
4. Onder "Environment Variables": voeg `VITE_API_BASE` toe met de URL van
   je gedeployde backend (zie garderobe-backend README voor hosten via
   Railway).
5. Deploy. Je krijgt een `https://garderobe-frontend-xxxx.vercel.app` URL.
6. Later een eigen domein koppelen kan onder Project → Settings → Domains.

Elke `git push` naar `main` deployt vanaf nu automatisch een nieuwe versie.
