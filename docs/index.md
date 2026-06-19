---
layout: page
title: Documentation Hub
permalink: /docs/
---

Welcome to the **GoHyperrr** documentation repository. This hub contains comprehensive technical guides, API references, and architecture blueprints for building on the GoHyperrr Commerce OS.

---

## 📖 Section Index

### 1. [Installation & Quickstart]({{ '/docs/installation.html' | relative_url }})
Set up the multi-module workspace locally, configure `hyperrr.yml`, and run the compiler builder.

### 2. [System Architecture]({{ '/docs/architecture.html' | relative_url }})
Learn how the layers of the engine connect—the orchestrator, the event fabric, and the context observers.

### 3. [Module Development Kit (MDK)]({{ '/docs/mdk.html' | relative_url }})
Study the core interfaces (`Module`, `Runtime`), declare DAG saga workflows, and write unit tests using `mdktest`.

### 4. [Core Gateway & Builder]({{ '/docs/core-gateway.html' | relative_url }})
Dynamic startup routines, dynamic GraphQL resolver stitching config generator, and the Model Context Protocol (MCP) server.

### 5. [Infrastructure Modules]({{ '/docs/infrastructure.html' | relative_url }})
Review shared database pooling, the typed event bus configurations (NATS JetStream), file storage, and distributed locks.

### 6. [Authentication Modules]({{ '/docs/auth-modules.html' | relative_url }})
Manage client credentials using Email/Password auth and API Keys for AI agents with actor context propagation.

### 7. [Commerce Modules]({{ '/docs/commerce-modules.html' | relative_url }})
Deep dive into product catalogs, variant specifications, taxonomy terms, line item price locking, and the AP2 payment validation protocol.

### 8. [E2E Ecommerce Backend Recipe]({{ '/docs/recipe-e2e.html' | relative_url }})
A step-by-step developer tutorial building and testing a custom rewards module for a specialty coffee store called **BrewStore**.

---

## 📦 Core Component Stack

| Component | Scope | GitHub Repository |
| :--- | :--- | :--- |
| **MDK SDK** | Core module interfaces, testing runtimes, and validation hooks. | [GoHyperrr/mdk](https://github.com/GoHyperrr/mdk) |
| **Hyperrr Gateway** | Boot orchestrator, GraphQL schema assembly, and MCP server. | [GoHyperrr/hyperrr](https://github.com/GoHyperrr/hyperrr) |
| **Commerce Modules** | High-performance, decoupled commerce engines (`product`, `cart`, `order`, etc.). | [GoHyperrr/commerce](https://github.com/GoHyperrr/commerce) |
| **Notification Node** | Event-driven templated multi-channel SMTP/WhatsApp alert dispatcher. | [GoHyperrr/notification](https://github.com/GoHyperrr/notification) |
