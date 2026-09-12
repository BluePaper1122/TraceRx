"""Isolated, authored score/trap fixtures; never inferred from workflow documents."""
from datetime import timedelta
import streamlit as st
from .fixtures import DEMO_NOW
from .risk_models import PriorCultureRecord
from .risk_engine import calculate_drug_risk
from .ledger import MockLedger

from .risk_fixtures import SCENARIOS, demo_profile

def scorecard(patient_id, as_of):
    st.subheader('Synthetic resistance scorecard')
    st.info('This illustrative score is not a measured probability of resistance or treatment failure and must not guide treatment.')
    st.caption('Explore authored synthetic scenarios, separate from the patient timeline. The demo clock controls evaluation.')
    scenario = st.selectbox('Synthetic risk scenario',SCENARIOS,key='risk_scenario_'+patient_id)
    profile = demo_profile(patient_id,scenario)
    if scenario == 'Transfer records unavailable':
        cache_key = 'risk_transfer_'+patient_id
        if st.button('Cross-hospital ledger lookup (mock)',key='lookup_'+patient_id):
            culture = PriorCultureRecord(record_id='SYN-TRANSFER-CULTURE',organism=profile.organism,
                specimen='Synthetic sample',category='routine',observed_at=DEMO_NOW-timedelta(days=10),
                susceptibility={'Demo drug A':'R'},source_quote='Fictional hospital B: Demo drug A = R.')
            ledger = MockLedger()
            ledger.register('fictional-transfer-token','Fictional hospital B',culture.model_dump(mode='json'),{'Fictional hospital A'})
            result = ledger.lookup('fictional-transfer-token','Fictional hospital A')
            if result['state'] == 'verified':
                st.session_state[cache_key] = result
        result = st.session_state.get(cache_key)
        if result:
            profile.cultures.append(PriorCultureRecord.model_validate(result['payload']))
            profile.transfer_unavailable = False
            st.success('Mock fingerprint verified; fictional history loaded for this session.')
            st.caption('SHA-256: '+result['sha256'])
        st.caption('In-memory mock only: no hospital query, Fabric network, authenticated identity, durable ledger, or real patient identifiers.')
    prediction = calculate_drug_risk(profile,'Demo drug A','Demo class A',as_of)
    labels = {'DATA_GAP_UNORDERED':'Not Tested — explicitly not ordered',
        'AGED_POSITIVE':'Aged Positive — reduced weight', 'DATA_UNAVAILABLE':'Records Unavailable',
        'TEST_STATUS_UNKNOWN':'Testing status unknown','BASELINE_UNAVAILABLE':'No local baseline — illustrative 15-point fallback',
        'DOCUMENTED_INPUTS':'Authored inputs available'}
    for flag in prediction.data_quality_flags:
        (st.error if flag == 'DATA_UNAVAILABLE' else st.warning if flag != 'DOCUMENTED_INPUTS' else st.info)(labels[flag])
    st.metric('Illustrative score / 100',f'{prediction.final_score*100:.1f}')
    with st.expander('Reasoning scorecard: sources and arithmetic',expanded=True):
        st.dataframe([{'Step':r.factor,'Points':round(r.adjustment*100,2),'Decay':r.decay_modifier,
            'Source':r.source_event_id,'Date':str(r.source_date or 'Policy'), 'Quote':r.source_quote,
            'Reason':r.explanation} for r in prediction.reasoning_chain],hide_index=True)
        st.caption('Baseline + adjustments + clamp = displayed score. Weights are demo assumptions, not learned or calibrated estimates.')
    st.download_button('Download synthetic scorecard',prediction.model_dump_json(indent=2),
        'synthetic-scorecard.json','application/json',key='score_download_'+patient_id)
