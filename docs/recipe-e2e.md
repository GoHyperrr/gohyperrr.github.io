---
layout: page
title: E2E Ecommerce Backend Recipe
permalink: /docs/recipe-e2e.html
---

This recipe provides a step-by-step guide to developing an end-to-end ecommerce backend using the Hyperrr framework. We will configure a development cluster for a specialty coffee shop called **BrewStore** and build a custom **Rewards Module** that gives customer loyalty points automatically on checkout event triggers.

---

## 🛠️ Step 1: Set Up the Workspace

Create a parent workspace folder and clone the core frameworks.

### 1. Structure the Folders
```bash
mkdir brewstore-backend && cd brewstore-backend
git clone https://github.com/GoHyperrr/mdk.git
git clone https://github.com/GoHyperrr/hyperrr.git
git clone https://github.com/GoHyperrr/commerce.git
```

### 2. Initialize `go.work`
Initialize a workspace file inside `brewstore-backend/go.work`:

```go
go 1.26

use (
	./mdk
	./hyperrr
	./commerce
	./rewards # This is where we will write our custom loyalty module
)
```

---

## 💻 Step 2: Implement the Rewards Module

Let's write a new standalone module inside the `rewards/` folder.

### 1. Create `rewards/go.mod`
```go
module github.com/BrewStore/rewards

go 1.26

require (
	github.com/GoHyperrr/mdk v0.1.0
	gorm.io/gorm v1.25.0
)
```

### 2. Implement the Database Models (`rewards/model.go`)
Define a schema to track customer reward points:

```go
package rewards

type LoyaltyAccount struct {
	ID         string `gorm:"primaryKey"`
	CustomerID string `gorm:"index;unique"`
	Points     int    `gorm:"default:0"`
}
```

### 3. Implement the Module Lifecycle (`rewards/module.go`)
Create the core module setup. We will subscribe to `commerce.order.completed` events and credit the user's loyalty account.

```go
package rewards

import (
	"context"
	"encoding/json"
	"log/slog"
	
	"github.com/GoHyperrr/mdk"
)

type Module struct {
	rt mdk.Runtime
}

func NewModule() mdk.Module {
	return &Module{}
}

func (m *Module) ID() string {
	return "brewstore.rewards"
}

func (m *Module) Models() []any {
	return []any{&LoyaltyAccount{}}
}

func (m *Module) Init(ctx context.Context, rt mdk.Runtime) error {
	m.rt = rt

	// Subscribe to checkout completed event
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
	return nil // No custom HTTP routes needed
}

func init() {
	mdk.Register(func() mdk.Module {
		return NewModule()
	})
}
```

---

## ⚙️ Step 3: Register the Module inside the Gateway

Open `hyperrr/hyperrr.yml` and add your rewards module resolve path under `modules`:

```yaml
version: "0.1.0"
server:
  port: 8080
  host: "0.0.0.0"
database:
  driver: "sqlite"
  dsn: "brewstore.db"
eventbus:
  driver: "in_memory"
modules:
  - resolve: "github.com/GoHyperrr/commerce/product"
    id: "commerce.product"
  - resolve: "github.com/GoHyperrr/commerce/cart"
    id: "commerce.cart"
  - resolve: "github.com/GoHyperrr/commerce/order"
    id: "commerce.order"
  - resolve: "github.com/BrewStore/rewards" # Add our rewards module here
    id: "brewstore.rewards"
```

---

## ⚡ Step 4: Run the Builder and Boot

To dynamically compile your rewards module with the GraphQL schema stitching and dependencies resolving:

### 1. Compile the Binary
```bash
cd hyperrr
go run cmd/builder/main.go
```

The gateway builder automatically scans `rewards/`, registers your `LoyaltyAccount` model inside the migrations runner, and links the event listener logic cleanly.

### 2. Boot the Server
```bash
./bin/hyperrr --server
```

You should see log lines indicating migrations ran, and your rewards module initialized:
```
[INFO] BrewStore Rewards Module loaded successfully
[INFO] Starting GraphQL Gateway at http://localhost:8080/query
```

---

## 🧪 Step 5: Test the Checkout Flow

Open the GraphQL playground or make an API request to test the flow:

### 1. Create a Product
Create a product for our Ethiopian beans:
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

Behind the scenes, when the checkout workflow transitions to `completed`:
1. The `commerce.order` module publishes an `order.completed` event containing the payload `{"customer_id": "cust_alice", "amount": 15.0}`.
2. The `rewards` module interceptor catches the event.
3. It creates a `LoyaltyAccount` for `cust_alice` and credits `150` points.
4. You will see the event logging output inside your terminal console!
```
[INFO] Credited loyalty points customer=cust_alice points=150
```
