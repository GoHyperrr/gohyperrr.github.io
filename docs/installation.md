---
layout: page
title: Installation & Quickstart
permalink: /docs/installation.html
---

This guide outlines the steps required to get started with Hyperrr. 

For application developers, starting a new project takes just a single command. For contributors to the core Hyperrr framework modules, see the [Core Workspace Setup](#-core-developer-workspace-setup) section below.

---

## Prerequisites

Before setting up GoHyperrr, ensure you have the following installed:
- **Go** (version 1.26 or higher)
- **Git**

---

## ⚡ Quickstart: Create a New Project

The unified `hyperrr` CLI scaffolds a complete, production-ready commerce engine in seconds.

### 1. Install the CLI Tool
Download and install the `hyperrr` binary globally on your path:

```bash
go install github.com/GoHyperrr/hyperrr/cmd/hyperrr@latest
```

### 2. Scaffold a New Project
Run the `new` command, which kicks off an interactive configuration wizard:

```bash
hyperrr new my-store
```

The interactive prompt will configure your Go module path, module preset (e.g. `commerce-full` or `commerce-minimal`), default database driver, and git settings. You can skip the interactive prompt and use standard defaults with the `-y` flag:

```bash
hyperrr new my-store -y
```

### 3. Generate Resolvers & Compile
Move into your new project directory and build the schema registry and local server:

```bash
cd my-store
hyperrr build
```

This aggregates all active module GraphQL schemas, runs the code generator, and compiles a project-local binary at `bin/hyperrr`.

### 4. Run the Server
Boot up the GraphQL API and MCP gateways:

```bash
hyperrr start
```

By default, the server runs at `http://localhost:8080`, exposing the interactive GraphQL playground and SSE endpoints for AI agents.

---

## 🛠️ Core Developer Workspace Setup

If you are developing the core Hyperrr SDK packages, use the `go.work` multi-module layout.

### 1. Clone the Repositories
Create a parent directory and clone the core repositories into it:

```bash
mkdir gohyperrr-workspace && cd gohyperrr-workspace

# Clone the core repositories
git clone https://github.com/GoHyperrr/mdk.git
git clone https://github.com/GoHyperrr/hyperrr.git
git clone https://github.com/GoHyperrr/commerce.git
git clone https://github.com/GoHyperrr/notification.git
```

### 2. Configure the Go Workspace
Initialize a `go.work` file at the parent workspace root:

```go
go 1.26

use (
	./auth
	./commerce
	./database
	./event-bus
	./file-storage
	./hyperrr
	./integration-tests
	./mdk
	./notification
)
```

---

## 🚀 Adding Custom Modules

To add a new custom module inside your project workspace:

```bash
hyperrr module create my-custom-module
```

This scaffolds a new module under `modules/my-custom-module` containing standard GORM models, resolver implementations, and GraphQL schemas automatically bound to your project.

