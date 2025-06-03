# API IA Agent

Cette API permet de discuter avec un agent conversationnel intelligent, de gérer des utilisateurs, des discussions (conversations) et d'uploader des documents pour enrichir le contexte de l'agent (RAG).

## Prérequis
- Node.js >= 18
- Base SQLite (gérée automatiquement par Prisma)
- Variables d'environnement :
  - `GOOGLE_API_KEY` (pour Gemini)
  - `SERPAPI_API_KEY` (pour la recherche web)

## Lancement

```bash
npm install
npx prisma migrate deploy # ou dev pour dev
npm run dev
```

## Principales routes API

### 1. Authentification utilisateur

#### POST `/api/user/signup`
Créer un utilisateur (retourne l'ID à utiliser ensuite)

```json
{
  "email": "user@email.com",
  "name": "Nom optionnel",
  "password": "motdepasse"
}
```

Réponse :
```json
{
  "success": true,
  "userId": "..."
}
```

#### POST `/api/user/login`
Connexion utilisateur (retourne l'ID à utiliser ensuite)

```json
{
  "email": "user@email.com",
  "password": "motdepasse"
}
```

Réponse :
```json
{
  "success": true,
  "userId": "..."
}
```

### 2. Gestion des discussions

#### POST `/api/discussion`
Créer une nouvelle discussion pour un utilisateur

```json
{
  "userId": "...",
  "title": "Titre de la discussion (optionnel)"
}
```

Réponse :
```json
{
  "success": true,
  "discussionId": "..."
}
```

#### GET `/api/discussions?userId=...`
Lister toutes les discussions d'un utilisateur

Réponse :
```json
[
  {
    "id": "...",
    "title": "...",
    "createdAt": "...",
    "messages": [ ... ]
  },
  ...
]
```

### 3. Discuter avec l'agent

#### POST `/api/ask`
Envoyer une question à l'agent dans une discussion

```json
{
  "userId": "...",
  "discussionId": "...",
  "question": "Quel est le capital du Sénégal ?"
}
```

Réponse :
```json
{
  "response": "Le capital du Sénégal est Dakar.",
  "sessionId": "..."
}
```

### 4. Upload de document texte

#### POST `/api/upload-doc`

```json
{
  "title": "Nom du document",
  "content": "Texte du document"
}
```

Réponse :
```json
{
  "success": true
}
```

### 5. Upload de fichier (.docx, .txt)

#### POST `/api/upload-file`
FormData :
- `file` (fichier)
- `title` (optionnel)

Réponse :
```json
{
  "success": true
}
```

### 6. Récupérer l'historique utilisateur

#### GET `/api/user-history?email=...`

Réponse :
```json
{
  "history": [ { ... } ]
}
```

---

## Exemple d'utilisation dans un projet React

### Authentification et création de discussion

```js
// Création d'un compte
await fetch('/api/user/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, name, password })
});

// Connexion
const loginRes = await fetch('/api/user/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { userId } = await loginRes.json();

// Création d'une discussion
const discRes = await fetch('/api/discussion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, title: 'Ma discussion' })
});
const { discussionId } = await discRes.json();
```

### Envoyer une question à l'agent

```js
const askRes = await fetch('/api/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, discussionId, question: 'Bonjour, qui es-tu ?' })
});
const data = await askRes.json();
console.log(data.response);
```

### Uploader un document

```js
await fetch('/api/upload-doc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Cours de maths', content: '...' })
});
```

### Uploader un fichier

```js
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('title', 'Nom du fichier');
await fetch('/api/upload-file', {
  method: 'POST',
  body: formData
});
```

---

## Notes
- Toutes les routes attendent des UUID pour les identifiants.
- L'historique de la discussion est géré côté serveur, inutile de le transmettre côté client.
- Pour chaque question, il faut transmettre l'ID utilisateur et l'ID de la discussion.
- L'API est prête à être utilisée dans n'importe quelle application front moderne (React, mobile, etc.).
