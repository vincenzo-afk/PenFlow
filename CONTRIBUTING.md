# Contributing to PenFlow

Thank you for helping improve PenFlow. The project is a browser-first handwriting studio, so contributions should preserve the local-first model and avoid introducing server dependencies unless they are discussed first.

## Development setup

Use the package manager pinned by the repository, then start the Vite development server:

```bash
corepack enable
pnpm install
pnpm dev
```

Run the repository checks before opening a pull request:

```bash
pnpm check
pnpm build
```

`pnpm check` runs the TypeScript compiler without emitting files. `pnpm build` produces the client bundle and the production Express server bundle.

## Scope and design principles

PenFlow treats handwriting content, calibration samples, profiles, and replay media as local browser data. Contributions must not transmit this material to a third party without a clear, user-facing reason and an explicit opt-in.

The application uses React, TypeScript, Vite, Tailwind CSS, and Canvas APIs. Prefer small, focused modules in `client/src/lib/` for rendering or export behavior and reusable components in `client/src/components/` for UI behavior. Update the README when a change affects a user-visible workflow, local-storage behavior, or export format.

## Branches, commits, and pull requests

Create a descriptive branch such as `feat/profile-import`, `fix/replay-timeline`, or `docs/contributing`. Use clear, imperative commit subjects; Conventional Commit prefixes such as `feat:`, `fix:`, `docs:`, and `chore:` are encouraged.

Pull requests should explain the user problem, summarize the implementation, list the commands run, and call out any privacy, accessibility, mobile-layout, or export-behavior impact. Keep unrelated formatting and refactoring changes out of feature pull requests when possible.

## Reporting issues

Use the bug-report template for reproducible defects and the feature-request template for product ideas. Please remove handwriting samples, personal text, and other sensitive material before attaching screenshots or reproduction files.

## Security concerns

Do not open a public issue for a suspected vulnerability. Follow the private reporting guidance in [SECURITY.md](SECURITY.md).
