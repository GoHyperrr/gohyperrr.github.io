---
layout: page
title: Branching, Versioning & Release Promotion
permalink: /docs/release-management.html
---

To maintain reliability, modularity, and clean dependency management across all co-dependent workspaces, the GoHyperrr organization uses a strict branching and versioning policy.

---

## 1. Semantic Versioning (SemVer) Standard

All modules and the core gateway are versioned uniformly using **SemVer** (`vX.Y.Z`):
*   **Major (`X`)**: Breaking changes that alter core interfaces in `mdk` or break backward compatibility in API endpoints.
*   **Minor (`Y`)**: Addition of features, modules, or non-breaking API extensions (e.g. `v0.4.0` for core decoupling).
*   **Patch (`Z`)**: Backward-compatible bug fixes and security hotfixes.

Every dependent module and the core gateway must require an explicit, tagged version of their dependencies (e.g., `github.com/GoHyperrr/mdk v0.4.0`) in their `go.mod` files rather than using mutable branch names or local directory `replace` directives in production.

---

## 2. Branching Flow

Every repository contains two permanent branches:
1.  **`dev` (Development & Integration)**: The active development branch. All feature branches, bug fixes, and developer pull requests must target `dev`.
2.  **`main` (Production & Releases)**: The stable branch containing release-ready code.

---

## 3. Release Elevation Strategy

1.  **Feature Development**: Developers create branches (e.g. `feature/my-addon`) and submit PRs to merge into the `dev` branch.
2.  **Validation**: GitHub Actions runs CI checks (generation, linting, tests) on `dev` when PRs are created.
3.  **Promotion to Main**: Periodically or at milestones, a Pull Request is opened to merge `dev` into `main`. This is the "elevation" step.
4.  **Release & Tagging**: Once merged to `main`, a new version tag is created and pushed (e.g. `git tag v0.4.0` and `git push origin v0.4.0`). For Go packages, tag order matters:
    *   First, bump and tag `mdk`.
    *   Second, update `go.mod` of dependent modules (`auth`, `commerce`, `database`, etc.) to point to the new `mdk` tag, push, and tag them.
    *   Finally, update the core `hyperrr` gateway dependencies, push, and tag `hyperrr`.

---

## 4. Release Automation

To simplify this process, developers can use the pre-built release scripts at the root of the workspace:
*   `./release.sh [version]` (Bash)
*   `.\release.ps1 -Version [version]` (PowerShell)

These scripts automatically checkout branches, check version file constants, perform the required `go.mod` replacements, run `go mod tidy` verification checks, and push tag releases to GitHub in the correct sequence.
