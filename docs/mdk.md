---
layout: page
title: Module Development Kit (MDK)
permalink: /docs/mdk.html
---

The **Module Development Kit (MDK)** is the core software development kit (SDK) of the Hyperrr ecosystem. It provides the contracts, interfaces, workflow state machines, and unit-testing runtimes that allow developers to write fully decoupled, event-native modules.

---

## 1. Core Interfaces

To build a module for the Hyperrr engine, your module must implement the following interfaces:

### A. `mdk.Module`
Every module must implement the base `Module` interface to define its lifecycle hooks, model registries, and HTTP routes.

```go
type Module interface {
	// ID returns a unique namespaced identifier (e.g., "commerce.product")
	ID() string

	// Models returns GORM models to auto-migrate on startup
	Models() []any

	// Init initializes the module with access to the system Runtime
	Init(ctx context.Context, rt Runtime) error

	// Shutdown handles graceful termination (closes database sessions, etc.)
	Shutdown(ctx context.Context) error

	// Routes returns list of static HTTP endpoints the module registers
	Routes() []Route
}
```

### B. `mdk.Runtime`
The `Runtime` is injected into the module during the `Init` lifecycle call. It grants safe access to shared system resources without coupling the module to the gateway.

```go
type Runtime interface {
	// DB returns the GORM database connection pool
	DB() *gorm.DB

	// Bus returns the active event publisher/subscriber
	Bus() EventBus

	// Workflows returns the dynamic saga execution engine
	Workflows() WorkflowEngine

	// Logger returns a contextual structured logger
	Logger() *slog.Logger

	// Config returns the global configurations map
	Config() ConfigProvider
}
```

### C. `mdk.DependentModule` (Optional)
If a module has initialization dependencies (for example, a checkout workflow that requires the payments database tables to be migrated first), implement `DependentModule`.

```go
type DependentModule interface {
	Module
	// Dependencies returns list of module IDs that must initialize first
	Dependencies() []string
}
```

### D. `mdk.MiddlewareProvider` (Optional)
Implement this interface to register global HTTP middlewares at the gateway level (e.g., JWT validation or API key tracking).

```go
type MiddlewareProvider interface {
	// Middlewares returns a list of HTTP handler wrappers
	Middlewares() []func(http.Handler) http.Handler
}
```

---

## 2. Workflows & Sagas

Workflows in Hyperrr are modeled as **Directed Acyclic Graphs (DAGs)**. If a step fails, the workflow engine automatically fires compensatory steps (rollbacks) in reverse order.

### Defining a Workflow
Below is a **BrewStore** example showing how to declare a linear saga that allocates loyalty points on checkouts:

```go
workflow := mdk.Workflow{
	ID:         "brewstore.award_points.v1",
	Name:       "Award Checkout Points",
	ExposeToAI: true,
	Steps: []mdk.Step{
		{
			ID:        "calculate_points",
			Uses:      "brewstore.calc_points_handler",
			DependsOn: []string{},
		},
		{
			ID:        "credit_balance",
			Uses:      "brewstore.credit_balance_handler",
			DependsOn: []string{"calculate_points"},
		},
	},
}
```

### Registering Step Handlers
Register the execution and rollback logic in your module's `Init` call:

```go
func (m *Module) Init(ctx context.Context, rt mdk.Runtime) error {
	// Register the workflow schema
	_ = rt.Workflows().Register(workflow)

	// Register the step execution and compensation logic
	rt.Workflows().RegisterHandler("brewstore.calc_points_handler", 
		func(ctx context.Context, input map[string]any) (map[string]any, error) {
			orderAmount := input["amount"].(float64)
			points := int(orderAmount * 0.1) // 10% points reward
			return map[string]any{"points": points}, nil
		},
		nil, // No compensation needed for read-only calculations
	)

	rt.Workflows().RegisterHandler("brewstore.credit_balance_handler",
		func(ctx context.Context, input map[string]any) (map[string]any, error) {
			points := input["points"].(int)
			customerID := input["customer_id"].(string)
			// Perform GORM DB update to add points
			return nil, creditPointsInDB(rt.DB(), customerID, points)
		},
		func(ctx context.Context, input map[string]any) error {
			// Rollback logic: deduct points on checkout failure
			points := input["points"].(int)
			customerID := input["customer_id"].(string)
			return deductPointsFromDB(rt.DB(), customerID, points)
		},
	)
	return nil
}
```

---

## 3. Unit-Testing with `mdktest`

MDK isolates testing dependencies. You can run unit tests on database migrations and event routing without booting the gateway by using `mdktest.NewInMemoryTestRuntime()`.

### Write a Module Unit Test
Here is how to test the BrewStore loyalty points allocation:

```go
func TestLoyaltyPoints(t *testing.T) {
	// 1. Initialize Mock Runtime with an in-memory SQLite database
	rt, err := mdktest.NewInMemoryTestRuntime()
	if err != nil {
		t.Fatalf("failed to boot runtime: %v", err)
	}

	// 2. Initialize your Module
	mod := &Module{}
	if err := rt.DB().AutoMigrate(mod.Models()...); err != nil {
		t.Fatalf("failed schema migration: %v", err)
	}

	if err := mod.Init(context.Background(), rt); err != nil {
		t.Fatalf("failed module init: %v", err)
	}

	// 3. Execute the workflow synchronously
	engine := rt.Workflows().(*mdktest.TestWorkflowEngine)
	output, err := engine.ExecuteSync(
		context.Background(),
		"wf_run_1",
		"brewstore.award_points.v1",
		map[string]any{"amount": 100.0, "customer_id": "cust_alice"},
	)

	if err != nil {
		t.Fatalf("workflow failed: %v", err)
	}

	// 4. Validate output matches expected logic
	points := output["points"].(int)
	if points != 10 {
		t.Errorf("expected 10 points, got %d", points)
	}
}
```
