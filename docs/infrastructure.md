---
layout: page
title: Infrastructure Modules
permalink: /docs/infrastructure.html
---

The core gateway integrates pluggable infrastructure modules for database management, event pub/sub, distributed locking, and file storage. Swapping providers requires no changes to module source code — only configuration adjustments inside `hyperrr.yml`.

---

## 1. Database Connections (`database`)

Hyperrr uses GORM as its Object-Relational Mapping (ORM) layer. The database module registers dialect providers and handles connection pooling.

### Supported Dialects
- **SQLite**: Recommended for local development (runs fully in-memory or on local disk).
- **PostgreSQL**: Recommended for production clustering.

### Shared Migrations
During boot, the gateway gathers models from all active modules (`Models() []any`) and executes a single schema auto-migration, preventing index conflicts or table locking.

```go
// Example model definition in a BrewStore Loyalty module
type LoyaltyAccount struct {
	ID         string `gorm:"primaryKey"`
	CustomerID string `gorm:"index;unique"`
	Points     int    `gorm:"default:0"`
}

func (m *Module) Models() []any {
	return []any{&LoyaltyAccount{}}
}
```

---

## 2. Event Bus (`event-bus`)

The EventBus coordinates asynchronous updates across decoupled modules.

### Event Schema
Every event emitted into the fabric contains unique metadata:

```go
type Event struct {
	ID         string    `json:"id"`
	Namespace  string    `json:"namespace"`  // e.g. "commerce"
	Type       string    `json:"type"`       // e.g. "order.created"
	TraceID    string    `json:"trace_id"`   // Carried over for span correlation
	OccurredAt time.Time `json:"occurred_at"`
	Payload    []byte    `json:"payload"`    // Raw JSON data
}
```

### Supported Drivers
1. **In-Memory (`in_memory`)**: Utilizes lock-free channels with internal go-routines. Employs recovery middleware to capture panicked handlers.
2. **NATS JetStream (`nats`)**: Clustered event broker. Event namespaces map to NATS subjects (e.g. `commerce.order.created`). Ensures **at-least-once delivery guarantees** with persistent streams.

### Usage Example
How to publish and subscribe inside the BrewStore context:

```go
// Publishing an event
payload, _ := json.Marshal(map[string]any{"customer_id": "cust_alice", "amount": 100.0})
err := rt.Bus().Publish(ctx, mdk.Event{
	Namespace: "commerce",
	Type:      "order.completed",
	Payload:   payload,
})

// Subscribing to an event
rt.Bus().Subscribe("commerce", "order.completed", func(ctx context.Context, e mdk.Event) error {
	var data map[string]any
	_ = json.Unmarshal(e.Payload, &data)
	rt.Logger().Info("received order event", "customer", data["customer_id"])
	return nil
})
```

---

## 3. Distributed Locker (`locking`)

To prevent race conditions during concurrent checkouts or saga executions, the locking module provides distributed mutual exclusions (Mutexes).

```go
type Locker interface {
	// Lock attempts to acquire a lock key. Returns false if already locked.
	Lock(ctx context.Context, key string, ttl time.Duration) (bool, error)
	
	// Unlock releases the lock key
	Unlock(ctx context.Context, key string) error
}
```

### Supported Drivers
- **In-Memory**: Uses a thread-safe sync map with expiration timers.
- **NATS KV**: Utilizes NATS JetStream Key-Value buckets. Employs optimistic locking via revision sequences.

---

## 4. File Storage (`file-storage`)

The file storage module abstracts document, image, and sitemap uploads. It is built on top of `gocloud.dev/blob`, ensuring API compatibility across cloud providers.

### Configuration

```yaml
storage:
  driver: "local"
  local:
    directory: "./uploads"
  # Production example:
  # driver: "s3"
  # s3:
  #   bucket: "brewstore-assets"
  #   region: "us-east-1"
```

### Uploading a Product Image
```go
// Retrieve the storage bucket injection from runtime config
bucket, _ := rt.Storage().Bucket(ctx, "assets")

// Write file
writer, err := bucket.NewWriter(ctx, "products/organic-ethiopian.jpg", nil)
if err != nil {
	return err
}
defer writer.Close()
_, err = writer.Write(imageBytes)
```
