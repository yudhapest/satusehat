---
"@digitalmedika/satusehat": patch
---

Use HL7 CodeSystem URLs that SATUSEHAT accepts.

- `createEncounterDiagnosis` and the encounter condition builders defaulted `Encounter.diagnosis.use` to `https://www.hl7.org/fhir/Codesystem-diagnosis-role`, which SATUSEHAT rejects with RuleNumber 10317. The default is now `http://terminology.hl7.org/CodeSystem/diagnosis-role`, so finishing an Encounter with a diagnosis works.
- Docs and tests used `https://www.hl7.org/fhir/Codesystem-condition-ver-status` for `Condition.verificationStatus`, which SATUSEHAT rejects with RuleNumber 10170. They now use `http://terminology.hl7.org/CodeSystem/condition-ver-status`.
- Fix the encounter queue builder docs: `encounter.update` needs the encounter `id` in the body.
- Add `npm run smoke:sandbox:write`, which sends one outpatient visit to the sandbox and reads it back.
