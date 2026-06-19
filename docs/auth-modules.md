---
layout: page
title: Authentication Modules
permalink: /docs/auth-modules.html
---

Hyperrr includes standard pluggable authentication strategy modules located inside the `auth/` directory. These strategies authenticate incoming HTTP requests and populate the runtime Context with an authorized `Actor` record.

---

## 1. Actor Context Propagation

Once a middleware validates credentials, it registers the client details inside the Go `context.Context` using the MDK actor utilities. This context travels along the entire request lifecycle, including downstream event listeners and saga workflows.

### Retrieving an Actor in a Resolver
```go
func (r *queryResolver) CurrentProfile(ctx context.Context) (*Profile, error) {
	// Extract actor details from context
	actor, ok := mdk.ActorFromContext(ctx)
	if !ok {
		return nil, fmt.Errorf("unauthorized access")
	}

	// Verify actor scopes
	if actor.Type != mdk.ActorUser {
		return nil, fmt.Errorf("access restricted to user accounts")
	}

	return fetchProfile(r.db, actor.ID)
}
```

---

## 2. Email & Password Strategy (`auth/emailpass`)

This module manages traditional customer user accounts. It handles registration, password hashing (using bcrypt), and signs JSON Web Tokens (JWT) for session persistence.

### JWT Middleware Injection
When enabled in `hyperrr.yml`, the emailpass module automatically registers a global HTTP middleware (`JWTMiddleware`) that executes before GraphQL queries:

```go
func (m *Module) JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// If already authenticated by another middleware, skip
		if _, ok := mdk.ActorFromContext(r.Context()); ok {
			next.ServeHTTP(w, r)
			return
		}

		header := r.Header.Get("Authorization")
		if header == "" {
			next.ServeHTTP(w, r)
			return
		}

		// Parse "Bearer <token>" header
		parts := strings.Split(header, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Unauthorized: Malformed Authorization header", http.StatusUnauthorized)
			return
		}

		// Validate token and extract actor
		actor, err := m.store.ValidateToken(r.Context(), parts[1])
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Set actor inside context and propagate
		ctx := mdk.WithActor(r.Context(), actor)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
```

---

## 3. API Key Strategy (`auth/apikey`)

Designed for machine-to-machine integrations, webhooks, and Model Context Protocol (MCP) clients. It validates keys with a prefix (e.g. `hk_`) and grants specific access scopes.

### Accessing the MCP Server Safely
When an AI agent (such as Claude or Gemini) connects to the Hyperrr MCP server over Server-Sent Events (SSE), it must provide an authorized API Key in the headers.

```
Request Header:
X-API-Key: hk_brewstore_dev_agent_7f8a9e...
```

The `APIKeyMiddleware` validates the token, resolves it to an AI Agent actor, and logs every tool execution under that specific agent's identifier for audits:

```go
func (m *Module) APIKeyMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, ok := mdk.ActorFromContext(r.Context()); ok {
			next.ServeHTTP(w, r)
			return
		}

		apiKey := r.Header.Get("X-API-Key")
		if apiKey == "" {
			next.ServeHTTP(w, r)
			return
		}

		actor, err := m.GetActorByAPIKey(r.Context(), apiKey)
		if err != nil {
			http.Error(w, "Unauthorized API Key", http.StatusUnauthorized)
			return
		}

		ctx := mdk.WithActor(r.Context(), actor)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
```

---

## 4. GraphQL Schema Definition

Below are the default mutations exposed by the authentication modules:

```graphql
extend type Mutation {
  # Register a new customer user profile
  registerCustomer(input: RegisterInput!): AuthPayload!

  # Authenticate credentials and return a Bearer JWT Token
  loginCustomer(input: LoginInput!): AuthPayload!

  # Generate an API Key for agentic integrations
  createAPIKey(input: APIKeyInput!): APIKeyPayload!
}

type AuthPayload {
  token: String!
  expiresAt: String!
  customer: Customer!
}
```
