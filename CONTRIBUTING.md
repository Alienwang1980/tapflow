# Contributing to Tapflow

Thanks for your interest in Tapflow! This is a small project, so contributing is simple.

## Three steps

1. **Open an issue first** — describe the bug or idea. For bugs, include:
   - macOS version and Tapflow version
   - Steps to reproduce
   - What you expected vs. what happened

2. **Fork & branch** — create a short-lived branch off `main` (e.g. `fix/ws-reconnect`).

3. **Open a PR** — keep it focused on one thing, reference the issue, and describe what changed. CI checks and a maintainer review will follow.

## Guidelines

- Follow the existing code style; keep functions small and readable.
- Run the test suite before submitting (`python3 /tmp/test_*.py`-style checks live outside the repo; ask in the issue if unsure).
- Don't commit build artifacts (`Build/`, `dist/`, `.dmg` files).
- No hardcoded secrets — API keys go through the app's settings UI.

## Code of Conduct

Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before participating.
