"""Optional interface seams. No network, FHIR ingestion, or terminology claims."""
from typing import Protocol
from .models import Case

class FHIRSource(Protocol):
    def fetch_synthetic_case(self, patient_id: str, encounter_id: str) -> Case:
        """Implement validated mapping for MedicationRequest, DiagnosticReport and review provenance.
        Preserve report versions, encounter linkage, statuses and timezone-aware event times.
        Do not infer antimicrobial classification from a medication name alone.
        """
        ...

class RxNormResolver(Protocol):
    def lookup(self, medication_text: str) -> list[dict[str, str]]:
        """Return candidate identifiers for human confirmation, not drug recommendations."""
        ...

def integration_status():
    return {'FHIR': 'Interface only — not connected', 'RxNorm': 'Interface only — not connected'}
