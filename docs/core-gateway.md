---
layout: page
title: Core Gateway & Builder
permalink: /docs/core-gateway.html
---

The **Hyperrr Core Gateway** is the boot manager and runtime orchestrator. It connects database pools, initiates event buses, stitches GraphQL schemas, hosts the Model Context Protocol (MCP) server, and boots the CLI/TUI interface.

---

## 1. Directory Configurations (`hyperrr.yml`)

The list of active plugins and modules is defined inside the gateway's [hyperrr.yml](file:///D:/hyperrr-commerce-ai/hyperrr/hyperrr.yml) config. Below is the configuration file for the **BrewStore** setup:

```yaml
version: "0.1.0"
server:
  port: 8080
  host: "0.0.0.0"
database:
  driver: "sqlite"
  dsn: "brewstore.db"
eventbus:
  driver: "in_memory" # Swap to "nats" for clustered environment
modules:
  - resolve: "github.com/GoHyperrr/auth/emailpass"
    id: "auth.emailpass"
  - resolve: "github.com/GoHyperrr/commerce/product"
    id: "commerce.product"
  - resolve: "github.com/GoHyperrr/commerce/cart"
    id: "commerce.cart"
  - resolve: "github.com/GoHyperrr/commerce/order"
    id: "commerce.order"
  - resolve: "github.com/GoHyperrr/commerce/payments"
    id: "commerce.payments"
```

---

## 2. Compilation Builder (`hyperrr build`)

Hyperrr utilizes a custom static code-generation tool to wire modules on compile-time. The builder handles three main phases:

1. **Schema Discovery**: Scans active module directories listed in `hyperrr.yml` for files ending in `.graphqls` and aggregates them into the central cache (`api/graph/schema_gen`).
2. **GraphQL Binding**: Compiles the unified GraphQL syntax schema using the `gqlgen` generator.
3. **Resolver Stitching**: Analyzes active modules that implement `GraphQLProvider` hooks and generates static mapping files (`imports_generated.go` and `resolvers_impl.go`) to compile them into the core executable.

### Execution Command
To rebuild after adding new modules or modifying GraphQL schemas:

```bash
hyperrr build
```

The compiled binary will be written to `bin/hyperrr` (or `bin/hyperrr.exe` on Windows).

---

## 3. Model Context Protocol (MCP) Server

Hyperrr features built-in support for the **Model Context Protocol (MCP)**, exposing system modules directly to AI coding assistants and agents over Server-Sent Events (SSE).

### Automatic Tool Registration
Any workflow registered with `ExposeToAI: true` is automatically mapped to an MCP tool. The AI can discover and execute these tools dynamically.

For example, when the BrewStore loyalty points workflow is exposed:
- **Tool Name**: `brewstore_award_points_v1`
- **Arguments Schema**: Generated dynamically from input parameters (e.g., `amount: number`, `customer_id: string`).

### Resource Mappings
Database structures registered by modules can be declared as **MCP Resources**. This allows AI agents to inspect entity schemas (like reading active shopping cart statuses or products catalogs) without writing manual API queries.

### Run with SSE Transport
Start the server and expose the MCP endpoints:

```bash
hyperrr start
```

AI clients connect by specifying the SSE endpoint URL:
`http://localhost:8080/mcp/sse`


---

## 4. TUI / CLI Command Registry

Hyperrr features a built-in terminal dashboard (TUI) and modular CLI commands. Modules can register custom CLI scripts that compile directly into the gateway binary.

### Registering CLI Commands
Implement CLI registrations in your module setup:

```go
func (m *Module) Init(ctx context.Context, rt mdk.Runtime) error {
	rt.Config().RegisterCLICommand(&cobra.Command{
		Use:   "brewstore-points [customer_id]",
		Short: "Retrieve loyalty points balance for a BrewStore customer",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			var balance int
			err := rt.DB().Model(&LoyaltyAccount{}).
				Select("points").
				Where("customer_id = ?", args[0]).
				Scan(&balance).Error
			if err != nil {
				return err
			}
			fmt.Printf("Loyalty Balance: %d points\n", balance)
			return nil
		},
	})
	return nil
}
```

This command becomes instantly available when running the binary:
```bash
./bin/hyperrr brewstore-points cust_alice
```
