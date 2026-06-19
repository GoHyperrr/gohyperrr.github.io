---
layout: page
title: Commerce Modules
permalink: /docs/commerce-modules.html
---

The `commerce` repository contains the core commerce engines. These modules are 100% decoupled from the central orchestrator and are loaded dynamically based on your `hyperrr.yml` configuration.

---

## 1. Product Module (`commerce/product`)

Manages the product catalog, variant configurations, price overrides, and search tags.

### AI Observation Support
Products can contain an `aiSystemContext` field. This is a text metadata block read by LLM agents via MCP. It helps the agent understand product specifications (e.g. grind compatibility, roast levels) to recommend items contextually.

### GraphQL Schema Example (BrewStore Coffee Catalog)
```graphql
type Product {
  id: ID!
  sku: String!
  name: String!
  price: Float!
  description: String
  aiSystemContext: String # Metadata context injected for LLM search queries
  variants: [ProductVariant!]!
}

type ProductVariant {
  id: ID!
  sku: String!
  price: Float!
  optionValues: [ProductOptionValue!]!
}
```

---

## 2. Taxonomy Module (`commerce/taxonomy`)

Manages product categorization trees, tags, and custom hierarchical links.

### Category Trees
Taxonomy operates with **Terms** mapped to hierarchical structures. For example, in the **BrewStore** catalog:
- Term: `Coffee Beans` (Root)
  - Term: `Single Origin` (Child)
  - Term: `Blends` (Child)
- Term: `Equipment` (Root)
  - Term: `Kettles` (Child)

---

## 3. Cart Module (`commerce/cart`)

Manages active shopping sessions for customers. Carts are temporary database tables that cache line items, selected shipping methods, and addresses before checkout.

### Line Item Price Lock
When items are added to the cart, the cart module locks the item price at the time of addition. If the product price changes in the catalog during the session, the customer is protected until checkout or cart expiration.

---

## 4. Order Module (`commerce/order`)

Handles order creation, status transitions (Saga updates), and line item logging.

### Cart-to-Order Conversion
Rather than requesting all details via a GraphQL mutation, the `createOrderFromCart` mutation retrieves the current state from the cart session and maps it to a permanent Order entity.

---

## 5. Payments Module (`commerce/payments`)

Coordinates transactions across multiple payment gateways (Stripe, Razorpay, Mock). It also implements the **Agent Payments Protocol (AP2)** for machine-to-machine transactions.

```
                              [ AP2 Checkout Flow ]
                              
  ┌─────────────┐            ┌────────────────────┐            ┌─────────────┐
  │  AI Agent   ├───────────►│  Payments Module   ├───────────►│   Payment   │
  │ (Customer)  │ Request    │ (Cryptographic verification)│   Gateway   │
  └─────────────┘ Assertion  └────────────────────┘            └─────────────┘
```

### The AP2 Protocol
AP2 allows an AI agent to authorize checkouts on behalf of a human user:
1. **Assertion Token**: The AI agent presents an AP2 token (containing a cryptographically signed **SD-JWT** assertion claim).
2. **Signature Verification**: The Payments module validates the assertion token signature against the user's public key (retrieved from the `auth` module).
3. **Gateway Authorization**: If verified, the payment is dispatched to the gateway, authorizing the transaction.

---

## 6. Store Settings Module (`commerce/store`)

Stores configuration metadata for store localization, tax regimes, currency displays, and legal entities.

### Localization Schema
```graphql
type StoreSettings {
  storeName: String!
  contactEmail: String!
  defaultCurrency: String! # e.g. "USD", "INR"
  defaultLanguage: String! # e.g. "en-US"
  timezone: String!
}
```

---

## 7. SEO Module (`commerce/seo`)

Automatically generates SEO metadata, sitemaps, and indexing configurations for products and taxonomy terms.

### Dynamic Metadata Generators
When catalog administrators add a new coffee product (e.g. *Ethiopian Organic Sidama*), the SEO module automatically creates:
- Title Tags: `Buy Organic Ethiopian Sidama Coffee Beans`
- Meta Description: Excerpted from the product description.
- Canonical Sitemap Entries.

---

## 8. Notification Module (`notification`)

An event-driven notification manager. It listens to event bus namespaces (such as `commerce.order.created`) and triggers SMS, Push, or Email alerts.

### Templated Notification Triggers
The module registers HTML layout templates. For example:
- **Trigger event**: `commerce.order.completed`
- **Listener**: Automatically formats the order parameters into a template (e.g., *BrewStore Order Confirmation*) and dispatches it over SMTP or Twilio APIs.
