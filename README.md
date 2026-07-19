# CacheForge Frontend ⚡

The **CacheForge frontend** is the web dashboard for managing and interacting with your cache system.

Built with:

- ⚛️ **React**
- 🎨 **Tailwind CSS**
- 🧩 **shadcn/ui components**

The frontend provides a clean interface to monitor cache performance, manage keys, execute Redis-style commands, and interact with real-time messaging features.

---

## ✨ Features

The dashboard contains five main sections:

### 📊 Overview

A real-time monitoring dashboard showing:

- Total keys
- Memory usage
- Cache hit rate
- Operations per second
- Live performance metrics

---

### 🔑 Key Browser

Manage your cache keys through an easy-to-use interface.

Capabilities:

- Search keys
- View key values
- Create new keys
- Edit existing keys
- Delete keys

---

### 💻 CLI Terminal

A browser-based Redis-style terminal.

Examples:

```bash
SET username shriprasad

GET username
