"""Implements the supplied illustrative weights, without clinical drug mappings."""
from datetime import datetime
from .risk_models import DrugResistancePrediction, ResistanceRiskFactor

MONTH_DAYS = 30.44

def decay_weight(category, observed_at, as_of):
    if as_of.tzinfo is None or observed_at.tzinfo is None:
        raise ValueError('Explicit timezone required')
    if observed_at > as_of:
        return 0.0
    months = (as_of-observed_at).total_seconds() / (86400*MONTH_DAYS)
    if category == 'mrsa':
        return 1.0
    if category == 'high_consequence':
        return 1.0 if months <= 12 else .8
    if category != 'routine':
        raise ValueError('Unknown organism category')
    return 1.0 if months <= 6 else .5 if months <= 12 else .2

def calculate_drug_risk(profile, medication, medication_class, as_of, baselines=()):
    if as_of.tzinfo is None:
        raise ValueError('Explicit timezone required')
    factors, flags = [], []
    def add(name, record, adjustment, weight, explanation):
        factors.append(ResistanceRiskFactor(factor=name, source_event_id=record.record_id,
            source_quote=record.source_quote, source_date=record.observed_at,
            adjustment=adjustment, decay_modifier=weight, explanation=explanation))
    matches = [b for b in baselines if b.medication == medication and b.organism == profile.organism
               and b.unit_id == profile.unit_id and b.infection_type == profile.infection_type and b.observed_at <= as_of]
    baseline = max(matches, key=lambda b:(b.observed_at,b.record_id)) if matches else None
    score = baseline.resistance_rate if baseline else .15
    base = score
    if baseline:
        add('Baseline', baseline, score, 1, 'Matching authored synthetic unit/organism/context baseline.')
    else:
        flags.append('BASELINE_UNAVAILABLE')
        factors.append(ResistanceRiskFactor(factor='Baseline', source_event_id='demo-policy-v1',
            source_quote='Implementation plan: default baseline 0.15', source_date=None,
            adjustment=.15, decay_modifier=1, explanation='Explicit illustrative fallback; not a hospital estimate.'))
    if profile.transfer_unavailable:
        flags.append('DATA_UNAVAILABLE')
    if profile.test_status == 'not_ordered':
        flags.append('DATA_GAP_UNORDERED')
    elif profile.test_status == 'unknown':
        flags.append('TEST_STATUS_UNKNOWN')
    # Matching is exact and explicit. Never infer a drug class or organism from names.
    colonies = [c for c in profile.colonizations if c.organism == profile.organism
                and medication in c.relevant_medications and c.observed_at <= as_of]
    cultures = [c for c in profile.cultures if c.organism == profile.organism
                and medication in c.susceptibility and c.observed_at <= as_of]
    if colonies:
        c = max(colonies, key=lambda r:(r.observed_at,r.record_id))
        weight = decay_weight(c.category,c.observed_at,as_of)
        if c.category == 'mrsa' and c.decolonized_at and c.negative_rescreen_at and c.negative_rescreen_at <= as_of:
            weight = 0
        adjustment = .35*weight
        score += adjustment
        add('Colonization',c,adjustment,weight,'Latest relevant detection; MRSA clears only after both dated clearance steps.')
        if 0 < weight < 1:
            flags.append('AGED_POSITIVE')
    latest = max(cultures,key=lambda r:(r.observed_at,r.record_id)) if cultures else None
    if latest:
        result = latest.susceptibility[medication]
        weight = decay_weight(latest.category,latest.observed_at,as_of)
        adjustment = {'R':.45,'I':.15,'S':-.25}[result]*weight
        score += adjustment
        add('Prior culture',latest,adjustment,weight,f'Latest matching organism/drug culture: {result}.')
        if result == 'R' and weight < 1:
            flags.append('AGED_POSITIVE')
    exposures = [e for e in profile.exposures if e.medication_class == medication_class
                 and e.observed_at <= as_of and (as_of-e.ended_at).total_seconds() <= 90*86400]
    if exposures:
        e = max(exposures,key=lambda r:(r.observed_at,r.record_id))
        # Suppress only when the resistant culture occurred during/after this exposure.
        reflected = bool(latest and latest.susceptibility[medication] == 'R' and latest.observed_at >= e.observed_at)
        adjustment = 0 if reflected else .15
        score += adjustment
        add('Recent exposure',e,adjustment,1,'No extra weight: resistant culture follows exposure start.' if reflected else 'Matching explicit class overlaps the last 90 days.')
    final = min(.99,max(.01,score))
    if final != score:
        factors.append(ResistanceRiskFactor(factor='Clamp',source_event_id='demo-policy-v1',
            source_quote='Implementation plan: clamp 0.01–0.99',source_date=None,
            adjustment=final-score,decay_modifier=1,explanation='Illustrative display bounds.'))
    return DrugResistancePrediction(medication=medication,baseline_score=base,final_score=final,
        data_quality_flags=list(dict.fromkeys(flags)) or ['DOCUMENTED_INPUTS'],reasoning_chain=factors)
