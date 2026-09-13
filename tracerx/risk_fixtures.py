"""Authored risk examples shared by both frontends."""
from datetime import timedelta
from .fixtures import DEMO_NOW
from .risk_models import RiskProfile, ColonizationRecord

SCENARIOS = ['Not tested', 'Aged positive', 'Transfer records unavailable', 'MRSA persistence', 'MRSA clearance']

def demo_profile(patient_id, scenario):
    profile = RiskProfile(patient_id=patient_id,organism='Synthetic organism',unit_id='Demo unit',
        infection_type='Synthetic context',test_status='not_ordered' if scenario == 'Not tested' else 'documented',
        transfer_unavailable=scenario == 'Transfer records unavailable')
    if scenario == 'Aged positive' or scenario.startswith('MRSA'):
        profile.colonizations.append(ColonizationRecord(record_id='SYN-COL-1',
            source_quote='Authored synthetic fixture: positive screen; relevant to Demo drug A.',
            observed_at=DEMO_NOW-timedelta(days=400),organism=profile.organism,
            category='routine' if scenario == 'Aged positive' else 'mrsa', relevant_medications=['Demo drug A'],
            decolonized_at=DEMO_NOW-timedelta(days=20) if scenario == 'MRSA clearance' else None,
            negative_rescreen_at=DEMO_NOW-timedelta(days=10) if scenario == 'MRSA clearance' else None))
    return profile
