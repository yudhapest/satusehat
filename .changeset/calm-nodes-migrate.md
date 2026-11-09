---
"@digitalmedika/satusehat": minor
---

Move the toolchain from Bun to Node.js and upgrade to Zod 4.

- Require Node.js >= 24. Development uses npm, `tsx`, and the built-in `node:test` runner.
- Upgrade `zod` to v4 so consumers on Zod 4 share a single Zod instance. Validation issue messages in `SatuSehatValidationError.issues` now use Zod 4 wording.
- Keep UUID search parameters (`encounter`, `context`, `specimen`, `based-on`, `prescription`) accepting any hex UUID-shaped id, matching the previous behavior instead of Zod 4's stricter RFC 9562 check.
- Export the `FetchLike` and `HeadersInit` types used by the client options.
- Distribute builds as tarballs attached to GitHub Releases instead of publishing to npm.
