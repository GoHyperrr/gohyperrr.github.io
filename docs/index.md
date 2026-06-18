---
layout: page
title: Documentation Hub
permalink: /docs/
---

Welcome to the **GoHyperrr** documentation repository. This hub contains comprehensive technical guides, API references, and architecture blueprints for building on the GoHyperrr Commerce OS.

---

## 📖 Section Index

### 1. [Installation & Quickstart]({{ '/docs/installation.html' | relative_url }})
Learn how to set up the GoHyperrr workspace locally, configure module definitions via `hyperrr.yml`, and run the automated compiler and codegen builder.

### 2. [System Architecture]({{ '/docs/architecture.html' | relative_url }})
Deep dive into the core architecture of the Module Development Kit (MDK), the EventBus pub/sub boundaries, the asynchronous saga workflow engines, and the API gateway bindings.

---

## 📦 Core Component Stack

| Component | Scope | GitHub Repository |
| :--- | :--- | :--- |
| **MDK SDK** | Core module interfaces, testing runtimes, and validation hooks. | [GoHyperrr/mdk](https://github.com/GoHyperrr/mdk) |
| **Hyperrr Gateway** | Boot orchestrator, GraphQL schema assembly, and MCP server. | [GoHyperrr/hyperrr](https://github.com/GoHyperrr/hyperrr) |
| **Commerce Modules** | High-performance, decoupled commerce engines (`product`, `cart`, `order`, etc.). | [GoHyperrr/commerce](https://github.com/GoHyperrr/commerce) |
| **Notification Node** | Event-driven templated multi-channel SMTP/WhatsApp alert dispatcher. | [GoHyperrr/notification](https://github.com/GoHyperrr/notification) |
