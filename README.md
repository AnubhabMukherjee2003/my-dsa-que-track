# DSA Tracker (LowDB + GitHub Powered)

## Overview

DSA Tracker is a personal web application to organize and track LeetCode and other DSA practice questions. It is a **fully frontend-only, decentralized, offline-first app** powered by **LowDB (local JSON database)** for persistent storage and **Svelte** for UI.

---

## Goals

* No backend / no server
* Persistent decentralized storage
* Fast CRUD operations

---

## Tech Stack

| Layer    | Technology                       |
| -------- | -------------------------------- |
| Frontend | Svelte / SvelteKit               |
| Database | LowDB (File-based JSON Database) |

---

## Data Model

> Data is stored locally in plain JSON files managed by LowDB and committed to GitHub for versioning & backup.

### Category

```
{
  id,
  name,
  order
}
```

### Subcategory

```
{
  id,
  categoryId,
  name,
  order
}
```

### Question

```
{
  id,
  subcategoryId,
  name,
  url,
  solution,
  isDone,
  order
}
```

---

## Data Persistence & Git Workflow

### Persistence Strategy

* All application data lives inside the `data/` folder as plain JSON files managed by LowDB.
* The entire `data/` directory is version-controlled using Git.
* GitHub acts as the permanent cloud backup and history log of your DSA progress.

### Daily Workflow

1. `git pull` to sync latest data
2. `npm run dev`
3. Use the UI to add/update/delete questions
4. Commit changes: `git add data && git commit -m "Update DSA progress"`
5. Push: `git push`

### Benefits

* Free permanent cloud backup
* Full version history & rollback
* Works completely offline
* Zero vendor lock‑in

---

## Core Features

### CRUD

* Create / Edit / Delete Categories
* Create / Edit / Delete Subcategories
* Create / Edit / Delete Questions

### Tracking

* Mark Done / Pending
* Completion % per Category

### Ordering

* Drag & Drop Custom Order

### Offline Mode

* Works without internet
* Auto sync on reconnect

### Search & Filter

* Keyword search
* Filter by completion

##
