# Security Policy

## Supported version

Security fixes are considered for the current `main` branch. The project does not currently publish versioned maintenance branches.

## Reporting a vulnerability

Please do **not** report suspected vulnerabilities in public issues. Use the repository’s private security-reporting flow from its [Security tab](https://github.com/vincenzo-afk/PenFlow/security) when that option is available. If private reporting is unavailable, create a private draft security advisory from the repository’s Security area and describe the issue there.

Include a concise description, affected files or flows, reproduction steps, and potential impact. Avoid attaching personal handwriting samples, access tokens, or private documents. The repository does not state a response-time commitment.

## Security boundaries

PenFlow is designed as a browser-first application. Handwriting samples, calibrated style profiles, direct-ink strokes, and exported replay media are stored and rendered locally by the application. Contributors should preserve this behavior and document any change that affects data handling or introduces external communication.
