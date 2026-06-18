---
layout: page
title: Installation & Quickstart
permalink: /docs/installation.html
---

This guide outlines the steps required to set up and run a GoHyperrr development cluster locally on your machine.

---

## Prerequisites

Before setting up GoHyperrr, ensure you have the following installed:
- **Go** (version 1.26 or higher recommended)
- **Git**

---

## 🛠️ Workspace Setup

GoHyperrr utilizes a multi-module workspace structure via `go.work`.

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

## 🚀 Building & Running the Gateway

The Hyperrr repository includes an automated build manager that handles GraphQL schema collection, code generation, custom resolver stitching, and final compilation.

### 1. Configure Modules
Update [hyperrr.yml](file:///D:/hyperrr-commerce-ai/hyperrr/hyperrr.yml) inside the `hyperrr/` directory to enable or disable active plugins:

```yaml
modules:
  - resolve: "github.com/GoHyperrr/commerce/product"
    id: "commerce.product"
  - resolve: "github.com/GoHyperrr/commerce/cart"
    id: "commerce.cart"
  - resolve: "github.com/GoHyperrr/commerce/order"
    id: "commerce.order"
```

### 2. Run the Builder
Execute the builder tool from the `hyperrr` directory:

```bash
cd hyperrr
go run cmd/builder/main.go
```

The builder will clean the cache, scan files for GraphQL schemas, generate bindings, compile the resolvers, and build the final executable in `bin/hyperrr` (or `bin/hyperrr.exe` on Windows).

### 3. Start the Server
Launch the compiled binary:

```bash
./bin/hyperrr --server
```

By default, the server boots on port `8080`, exposing the GraphQL playground, SSE Model Context Protocol (MCP) server, and the real-time event runtime.
