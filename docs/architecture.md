---
layout: page
title: Core System Architecture
permalink: /docs/architecture.html
---

GoHyperrr is structured to decouple domain commerce dependencies from the core execution framework at compile-time. This guide details the component communication lifecycle.

---

## 1. Architectural Layout

```
                        ┌────────────────────────┐
                        │      HTTP Clients      │
                        │    (GraphQL / MCP)     │
                        └───────────┬────────────┘
                                    │
                                    ▼
                        ┌────────────────────────┐
                        │    Hyperrr Gateway     │
                        │  (Orchestrator Engine) │
                        └───────────┬────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
┌───────────────────────┐┌───────────────────────┐┌───────────────────────┐
│     Product Module    ││      Cart Module      ││      Order Module     │
│  ("commerce.product") ││   ("commerce.cart")   ││   ("commerce.order")  │
└───────────┬───────────┘└───────────┬───────────┘└───────────┬───────────┘
            │                       │                       │
            └───────────────────────┼───────────────────────┘
                                    │ (Event Subscriptions)
                                    ▼
                        ┌────────────────────────┐
                        │     MDK Runtime        │
                        │ (EventBus / Workflows) │
                        └────────────────────────┘
```

---

## 2. Component Explanations

### Module Development Kit (MDK)
The [MDK](https://github.com/GoHyperrr/mdk) defines the contracts and interfaces that modules must implement to join the ecosystem. The core structures include:
- **`Runtime`**: Injected into modules during initialization, providing scoped database logs, configuration parsers, the active EventBus, and the workflow engine.
- **`Module`**: Contract specifying ID, database models registration, lifecycle hooks (`Init`, `Shutdown`), and custom HTTP routes.

### Active EventBus
The EventBus coordinates asynchronous updates without coupling packages.
- **In-Memory Bus**: Default for lightweight local testing. Employs lock-free channels with thread-safe panic recovery context wrappers.
- **NATS Bus**: Scales communications horizontally across server instances in distributed setups.

### Asynchronous Saga Workflows
Long-running checkouts and order fulfillments are handled using DAG workflows:
1. **Dynamic Registration**: Modules register steps (using unique task IDs like `order.create_order` or `payments.charge`).
2. **ExecuteSync**: The engine executes linear or branched step queues. If a step fails, compensation handlers (rollbacks) are executed sequentially in reverse order to ensure data consistency.
