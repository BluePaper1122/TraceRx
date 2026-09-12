"""Separate synthetic score contracts; never interpreted as clinical probabilities."""
from typing import Literal
from pydantic import AwareDatetime, Field, model_validator
from .models import StrictModel

Category = Literal['routine', 'high_consequence', 'mrsa']

class SourceRecord(StrictModel):
    record_id: str = Field(min_length=1)
    source_quote: str = Field(min_length=1)
    observed_at: AwareDatetime

class ColonizationRecord(SourceRecord):
    organism: str
    category: Category
    relevant_medications: list[str]
    decolonized_at: AwareDatetime | None = None
    negative_rescreen_at: AwareDatetime | None = None

    @model_validator(mode='after')
    def chronological_clearance(self):
        if self.decolonized_at and self.decolonized_at < self.observed_at:
            raise ValueError('Decolonization precedes detection')
        if self.negative_rescreen_at and (not self.decolonized_at or self.negative_rescreen_at < self.decolonized_at):
            raise ValueError('Rescreen requires earlier decolonization')
        return self

class PriorCultureRecord(SourceRecord):
    organism: str
    specimen: str
    category: Category
    susceptibility: dict[str, Literal['S', 'I', 'R']]

class AntibioticExposureRecord(SourceRecord):
    medication_class: str
    ended_at: AwareDatetime

    @model_validator(mode='after')
    def coherent(self):
        if self.ended_at < self.observed_at:
            raise ValueError('Exposure ends before start')
        return self

class AntibiogramBaseline(SourceRecord):
    unit_id: str
    organism: str
    medication: str
    infection_type: str
    resistance_rate: float = Field(ge=0, le=1)

class RiskProfile(StrictModel):
    patient_id: str
    organism: str
    unit_id: str
    infection_type: str
    test_status: Literal['documented', 'not_ordered', 'unknown'] = 'unknown'
    transfer_unavailable: bool = False
    colonizations: list[ColonizationRecord] = Field(default_factory=list)
    cultures: list[PriorCultureRecord] = Field(default_factory=list)
    exposures: list[AntibioticExposureRecord] = Field(default_factory=list)

    @model_validator(mode='after')
    def unique_ids(self):
        ids = [r.record_id for r in self.colonizations + self.cultures + self.exposures]
        if len(ids) != len(set(ids)):
            raise ValueError('Duplicate risk record IDs')
        return self

class ResistanceRiskFactor(StrictModel):
    factor: str
    source_event_id: str
    source_quote: str
    source_date: AwareDatetime | None
    adjustment: float
    decay_modifier: float = Field(ge=0, le=1)
    explanation: str

class DrugResistancePrediction(StrictModel):
    medication: str
    baseline_score: float
    final_score: float = Field(ge=0.01, le=0.99)
    data_quality_flags: list[str]
    reasoning_chain: list[ResistanceRiskFactor]
    rule_version: str = 'synthetic-score-v1'
    scope: str = 'Illustrative additive score; not calibrated resistance or treatment-failure probability.'
