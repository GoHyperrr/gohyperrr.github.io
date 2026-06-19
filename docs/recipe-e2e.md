---
layout: page
title: E2E Ecommerce Backend Recipe
permalink: /docs/recipe-e2e.html
---

This recipe provides a step-by-step guide to developing an end-to-end ecommerce backend using the Hyperrr framework. We will configure a development cluster for a specialty coffee shop called **BrewStore** and build a custom **Rewards Module** that gives customer loyalty points automatically on checkout event triggers.

---

## 🛠️ Step 1: Create the Project

Instead of cloning multiple core repositories and manually configuration, we can use the unified `hyperrr` CLI to boot a fresh workspace.

### 1. Install the CLI
Download and install the `hyperrr` binary globally:

```bash
go install github.com/GoHyperrr/hyperrr/cmd/hyperrr@latest
```

### 2. Scaffold BrewStore
Run the `new` command with standard defaults (`-y` flag) to create a new project:

```bash
hyperrr new brewstore -y
cd brewstore
```

This generates a ready-to-go commerce engine structure utilizing the `commerce-full` preset containing standard products, checkout workflows, carts, and order processing.

---

## 💻 Step 2: Implement the Rewards Module

Let's scaffold our custom rewards logic. Instead of writing a separate Go module in a sibling repository, we can create a project-local module:

```bash
hyperrr module create rewards
```

This scaffolds a code structure under `modules/rewards/` and automatically registers it inside `configs/hyperrr.yml`.

### 1. Implement the Database Models (`modules/rewards/models.go`)
Open `modules/rewards/models.go` and define the database schema to track customer loyalty points:

```go
package rewards

type LoyaltyAccount struct {
	ID         string `gorm:"primaryKey"`
	CustomerID string `gorm:"index;unique"`
	Points     int    `gorm:"default:0"`
}
```

### 2. Implement the Module Lifecycle (`modules/rewards/module.go`)
Open `modules/rewards/module.go`. We will subscribe to `commerce.order.completed` events, compute rewards (10 points per dollar), and credit the customer's account in the database.

Replace the file contents with:

```go
package rewards

import (
	"context"
	"encoding/json"

	"github.com/GoHyperrr/mdk"
)

// Module implements the mdk.Module interface.
type Module struct {
	rt mdk.Runtime
}

func NewModule() *Module {
	return &Module{}
}

func init() {
	mdk.Register(func() mdk.Module { return NewModule() })
}

func (m *Module) ID() string {
	return "brewstore.rewards"
}

func (m *Module) Models() []any {
	return []any{&LoyaltyAccount{}}
}

func (m *Module) Init(ctx context.Context, rt mdk.Runtime) error {
	m.rt = rt

	// Subscribe to commerce completion events
	err := rt.Bus().Subscribe("commerce", "order.completed", m.handleOrderCompleted)
	if err != nil {
		return err
	}

	rt.Logger().Info("BrewStore Rewards Module loaded successfully")
	return nil
}

func (m *Module) handleOrderCompleted(ctx context.Context, e mdk.Event) error {
	var payload struct {
		CustomerID string  `json:"customer_id"`
		Amount     float64 `json:"amount"`
	}

	if err := json.Unmarshal(e.Payload, &payload); err != nil {
		return err
	}

	// Calculate points reward: 10 points per dollar
	pointsToCredit := int(payload.Amount * 10)

	// Save to database
	var account LoyaltyAccount
	err := m.rt.DB().Where("customer_id = ?", payload.CustomerID).
		FirstOrCreate(&account, LoyaltyAccount{CustomerID: payload.CustomerID}).Error
	if err != nil {
		return err
	}

	account.Points += pointsToCredit
	err = m.rt.DB().Save(&account).Error
	if err == nil {
		m.rt.Logger().Info("Credited loyalty points",
			"customer", payload.CustomerID, "points", pointsToCredit)
	}
	return err
}

func (m *Module) Shutdown(ctx context.Context) error {
	return nil
}

func (m *Module) Routes() []mdk.Route {
	return nil
}
```

---

## ⚡ Step 3: Run the Build & Boot

Now compile your project and run the server.

### 1. Compile the Binary
Run `hyperrr build` from the project root:

```bash
hyperrr build
```

The gateway builder automatically aggregates the GraphQL schemas, registers your `LoyaltyAccount` model inside the migrations runner, adds the rewards import to `cmd/server/imports_generated.go`, and compiles your project-local binary at `bin/hyperrr`.

### 2. Boot the Server
Run `hyperrr start` to start the GraphQL + MCP gateways:

```bash
hyperrr start
```

You should see log lines indicating migrations ran, and your rewards module initialized:
```
[INFO] BrewStore Rewards Module loaded successfully
[INFO] Server is ready: http://localhost:8080
```

---

## 🧪 Step 4: Test the Checkout Flow

Open the GraphQL playground at `http://localhost:8080` (or make a POST request) to test the flow:

### 1. Create a Product
Create a product for our specialty beans:
```graphql
mutation {
  createProduct(input: {
    sku: "ethiopian-sidama-1",
    name: "Ethiopian Organic Sidama",
    price: 15.0
  }) {
    id
  }
}
```

### 2. Add to Cart & Checkout
Create a shopping cart session and checkout:
```graphql
mutation {
  checkoutCart(input: {
    cartId: "cart_alice_session",
    customerId: "cust_alice",
    paymentProvider: "mock"
  }) {
    orderId
    status
  }
}
```

Behind the scenes, when the checkout workflow completed:
1. The `commerce.order` module publishes an `order.completed` event containing the payload `{"customer_id": "cust_alice", "amount": 15.0}`.
2. The `rewards` module catches the event.
3. It creates a `LoyaltyAccount` for `cust_alice` and credits `150` points.
4. You will see the event logging output inside your terminal console:
```
[INFO] Credited loyalty points customer=cust_alice points=150
```

