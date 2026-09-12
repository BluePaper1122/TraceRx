# Updated integrated demo

Use the three-minute sequence in [RECONCILIATION.md](RECONCILIATION.md) for the new scorecard and mock ledger. The workflow-only script below remains available for the shorter offline fallback. Live accuracy is unmeasured until an actual report is saved; score points are illustrative.

# ResistLens · Demo script for Yiyi

## Before presenting

Start Streamlit, open the local page, keep **Offline fixture replay** selected, reset the session, and set the clock to **36** (Sep 11, 18:00 UTC). Confirm the work queue shows six synthetic cases. Download the source pack in About & demo if you want to show drag-and-drop uploads. No API key or Wi-Fi is needed after setup.

## Three-minute presentation

**0:00–0:25 · Overview**

“ResistLens asks a narrow, auditable question: when final microbiology evidence arrives after an active antimicrobial order, is there a documented review? This is a synthetic workflow demonstration. It does not recommend medications.”

Point to two cases needing review, one needing verification, and one reviewed case. The two other cases have no trigger. Counts describe workflow, not disease severity.

**0:25–1:00 · The evidence arrives**

Open Patient workspace, select DEMO-101. Move the clock to **27** (09:00 UTC): no final report is available. Move it to **28** (10:00 UTC): a review flag appears. Return to **36**. Open Evidence & reasoning and expand the order and report.

“Here are the source timestamps, order identity and report identity. The rule is deterministic; an AI model does not decide the flag.”

**1:00–1:35 · Close the documentation gap**

Open Document a review. Enter reviewer **Yiyi demo** and note **I reviewed the displayed synthetic report in context of this order.** Confirm source inspection and record the review.

“The review links this exact order and report version. The state becomes Reviewed. We recorded a workflow event; we did not change medication.”

**1:35–2:05 · Show restraint and versioning**

Select DEMO-105: its timestamp is unreadable, so it needs verification. Select DEMO-106: the old report has a review, but the amended report remains open.

“Missing data does not become a clean bill of health. A prior review cannot hide newer evidence.”

**2:05–2:35 · Multimodal path**

Open Document studio. Expand the sample image; choose Offline fixture replay and click Extract document. Show source alongside validated JSON and field evidence.

“For reliable presentation this is explicitly labeled fixture replay, not live vision. The optional live adapter extracts the same schema from images. Either path requires source verification before imported evidence enters the rule engine.”

Do not claim that a mock run demonstrates AI accuracy. If live AI is configured and tested beforehand, you can show that mode with a synthetic image; do not make the presentation depend on it.

**2:35–3:00 · Measurement and close**

Open Evaluation lab.

“These metrics measure local parser and authored rule regressions. There is a separate optional live vision evaluation. Our contribution is a traceable document-to-review workflow, with uncertainty visible and every flag tied to evidence.”

## Five-minute extension

- Show DEMO-103 (preliminary) and DEMO-104 (order ended).
- Show a local synthetic text edit, JSON validation, human source confirmation and explicit replacement.
- Show state and unit filters in Overview, session activity and JSON/CSV exports.
- Download the synthetic PNG/text source pack.
- Explain that FHIR and RxNorm are future interface seams, not claimed integrations.

## Questions judges may ask

**Where is the AI?** The optional vision adapter converts synthetic images into a strict structured clinical-event schema with quoted evidence. Offline fixture replay is a disclosed fallback. The rule engine is deliberately deterministic.

**Is it clinically validated?** No. This is a synthetic workflow prototype with tests. It does not establish clinical safety, resistance reduction, patient benefit or prescribing accuracy.

**Why would an AI confidence score be trusted?** It is not treated as a calibrated probability. Readiness is a visible engineering heuristic plus a mandatory human-verification gate.

**What if a physician reviewed it somewhere else?** The flag says no qualifying review exists in the available record, not that nobody reviewed it. Completeness of external records is outside this demonstration.

**What happens without internet?** The bundled document, timeline, rules, review action, dashboard, exports and local evaluation remain available.

**What is missing for a hospital pilot?** Validated integrations, data completeness guarantees, authentication, persistence, durable audit, operational ownership and clinical governance. The current app is synthetic-only.

## Recovery

If a live call fails, select Offline fixture replay, use the bundled sample, and explicitly call it replay. If session edits obscure a scenario, use Reset demo in the sidebar. If moving time makes a review disappear, return the clock to 36 or later: records in the future are intentionally excluded.
