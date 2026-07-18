# Agent Guidelines: scoped-search-bar

This repository contains a dependency-free TypeScript UI component. Keep changes small, typed, accessible, and covered by tests.

## Build, Lint, And Test Commands

The project uses `pnpm`, `vite`, `tsdown`, `vitest`, `playwright`, `typedoc`, `oxlint`, `oxfmt`, and `stylelint`.

### Mandatory Validation After Code Changes

- Run `pnpm run ci` and `pnpm run integration-test` after code changes.
- A task is complete only when both commands finish successfully with no errors and no warnings.

### Core Commands

- `pnpm install` - install dependencies.
- `pnpm run dev` - start the demo.
- `pnpm run build` - build demo assets into `dist-demo/`.
- `pnpm run build:lib` - build ESM library and declarations into `dist/`.
- `pnpm run typecheck` - run `tsc --noEmit`.
- `pnpm run lint` - run `oxlint`.
- `pnpm run lint:css` - run `stylelint`.
- `pnpm run format` - run `oxfmt --write` and CSS autofix.
- `pnpm run format:check` - verify formatting.
- `pnpm run test` - run Vitest browser unit tests.
- `pnpm run integration-test` - run Playwright e2e tests.
- `pnpm run docs:api` - generate TypeDoc API docs.
- `pnpm run screenshot` - capture the demo screenshot.
- `pnpm run ci` - run typecheck, lint, CSS lint, format check, library build, demo build, docs, and tests.

## Source Layout

- `src/lib/scoped-search-bar.ts` - public component implementation and types.
- `src/lib/index.ts` - package exports.
- `src/lib/scoped-search-bar.test.ts` - unit/browser behavior tests.
- `src/styles/scoped-search-bar.css` - component stylesheet and tokens.
- `src/demo/app.ts` - Vite demo app.
- `tests/e2e/scoped-search-bar.e2e-test.ts` - Playwright demo regression tests.
- `docs/guide.md` - public usage guide.

## Code Style

- Use strict TypeScript and avoid `any`.
- Use tabs for indentation, single quotes in TypeScript, double quotes in CSS where required by formatter/stylelint.
- Keep public APIs documented with succinct JSDoc when behavior is not obvious.
- Prefer native DOM APIs and dependency-free implementations.
- Do not add React, MUI, or other runtime dependencies unless explicitly requested.

## Component Quality Requirements

- Preserve keyboard accessibility for the input, menu, and scope toggles.
- Keep async `onSearch` pending state deterministic and tested.
- Normalize selected scope IDs against available scopes.
- Keep CSS scoped under `.scoped-search-bar` and custom properties prefixed with `--scoped-search-bar-`.
- Pair every behavior change in `src/lib/**/*` with unit and/or e2e coverage.

## Quality Guardrails

- Do not weaken lint, format, typecheck, coverage, build, docs, or test gates without explicit user approval.
- Do not commit, amend, push, or create PRs unless explicitly requested.

---

_This file is intended for agentic use. Update it when durable project conventions change._
