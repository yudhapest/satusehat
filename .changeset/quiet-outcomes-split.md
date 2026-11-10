---
"@digitalmedika/satusehat": minor
---

Accept real SATUSEHAT search and Organization responses that previously failed response validation.

- Search bundles: SATUSEHAT mixes `OperationOutcome` entries into search results, for example results suppressed by consent rules. Any search whose bundle contained one used to fail response validation. They are now moved to a new `outcomes` field, and `entry` only holds the searched resource type. `total` still reflects the server value.
- All 26 resource bundle schemas now share one internal search bundle helper. Export the `OperationOutcome` and `OperationOutcomeIssue` types.
- Organization responses: `identifier` and `type` are now optional, following FHIR cardinality. Parent organizations registered by Kemenkes are returned with `identifier: []` and no `type`. `OrganizationCreateSchema` still requires both for outgoing payloads.
- Add `npm run smoke:sandbox`, a read-only check of several resources against the SATUSEHAT sandbox.
