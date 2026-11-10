---
"@digitalmedika/satusehat": patch
---

Fix `update` (PUT) for every resource except Encounter. The body was validated with the create schema, which has no `id` field, so the id was stripped and SATUSEHAT rejected the request ("failed to parse resource id from payload"). The transport now sets the resource id in the body after validation (new `resourceId` request option), for all 26 resource clients.
