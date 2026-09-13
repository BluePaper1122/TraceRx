"""Trains a small illustrative classifier on ENTIRELY FABRICATED synthetic
data, then saves it for the '/api/ml-demo' endpoint to load at runtime.

This is NOT trained on real hospital data, real patients, or real
antimicrobial-resistance rates. It exists to demonstrate what a trained
statistical model looks like next to ResistLens's deterministic rule engine
-- nothing here should be read as a clinical claim. Every organism and
antibiotic name below is a synthetic label, consistent with the rest of
this project's synthetic-data policy.

The feature set (prior-organism history, antibiotic class/subtype exposure
in 30/90/365-day windows) is inspired by a real feature-engineering
approach for AST (antibiotic susceptibility testing) prediction, but the
data itself, and therefore every number this model reports, is fabricated
for this demo. Run with: python -m ml.train_synthetic_model
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score
from sklearn.model_selection import train_test_split

RANDOM_SEED = 42
N_ROWS = 4000

ORGANISMS = ["Organism A", "Organism B", "Organism C", "Organism D"]
ANTIBIOTICS = ["Antibiotic 1", "Antibiotic 2", "Antibiotic 3", "Antibiotic 4", "Antibiotic 5", "Antibiotic 6"]
CULTURE_DESCRIPTIONS = ["Synthetic blood", "Synthetic urine", "Synthetic wound", "Synthetic respiratory"]
ORDERING_MODES = ["Routine", "Stat"]
AGE_BUCKETS = ["0-17", "18-40", "41-65", "66+"]
GENDERS = ["Female", "Male", "Unknown"]

CATEGORICAL_COLS = ["organism", "antibiotic", "culture_description", "ordering_mode", "age_bucket", "gender"]
NUMERIC_COLS = [
    "prior_organism_count",
    "days_since_prior_organism",
    "class_exposure_30d",
    "class_exposure_90d",
    "class_exposure_365d",
    "subtype_exposure_30d",
    "subtype_exposure_90d",
    "subtype_exposure_365d",
]

# A fixed, made-up "usual resistance rate" per organism/antibiotic pair.
# Fabricated for this demo only -- not a real antibiogram.
rng = np.random.default_rng(RANDOM_SEED)
_BASE_RESISTANCE = {
    (o, a): rng.uniform(0.1, 0.75) for o in ORGANISMS for a in ANTIBIOTICS
}


def generate_synthetic_dataset(n_rows: int = N_ROWS, seed: int = RANDOM_SEED) -> pd.DataFrame:
    r = np.random.default_rng(seed)
    rows = []
    for _ in range(n_rows):
        organism = r.choice(ORGANISMS)
        antibiotic = r.choice(ANTIBIOTICS)
        prior_organism_count = r.poisson(0.6)
        days_since_prior_organism = float(r.integers(0, 720)) if prior_organism_count > 0 else 720.0
        class_30 = r.poisson(0.3)
        class_90 = class_30 + r.poisson(0.4)
        class_365 = class_90 + r.poisson(0.8)
        subtype_30 = r.poisson(0.2)
        subtype_90 = subtype_30 + r.poisson(0.3)
        subtype_365 = subtype_90 + r.poisson(0.6)

        base_resistance = _BASE_RESISTANCE[(organism, antibiotic)]
        # Fabricated relationship: more recent same-class exposure nudges
        # resistance up, mirroring (in spirit only) the same idea the
        # deterministic engine encodes explicitly and transparently.
        exposure_push = min(0.25, 0.08 * class_30 + 0.04 * class_90)
        recency_push = 0.1 if (prior_organism_count > 0 and days_since_prior_organism < 90) else 0.0
        resistance_p = float(np.clip(base_resistance + exposure_push + recency_push + r.normal(0, 0.05), 0.02, 0.97))
        susceptible = r.random() > resistance_p

        rows.append(
            {
                "organism": organism,
                "antibiotic": antibiotic,
                "culture_description": r.choice(CULTURE_DESCRIPTIONS),
                "ordering_mode": r.choice(ORDERING_MODES),
                "age_bucket": r.choice(AGE_BUCKETS),
                "gender": r.choice(GENDERS),
                "prior_organism_count": prior_organism_count,
                "days_since_prior_organism": days_since_prior_organism,
                "class_exposure_30d": class_30,
                "class_exposure_90d": class_90,
                "class_exposure_365d": class_365,
                "subtype_exposure_30d": subtype_30,
                "subtype_exposure_90d": subtype_90,
                "subtype_exposure_365d": subtype_365,
                "target_susceptible": int(susceptible),
            }
        )
    return pd.DataFrame(rows)


def main():
    df = generate_synthetic_dataset()
    print(f"Synthetic rows: {len(df)}")
    print(f"Susceptible rate: {df['target_susceptible'].mean():.3f}")

    X = df[CATEGORICAL_COLS + NUMERIC_COLS].copy()
    for col in CATEGORICAL_COLS:
        X[col] = X[col].astype("category")
    y = df["target_susceptible"].to_numpy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=RANDOM_SEED, stratify=y
    )

    model = HistGradientBoostingClassifier(
        categorical_features=CATEGORICAL_COLS,
        random_state=RANDOM_SEED,
        max_depth=4,
        learning_rate=0.08,
    )
    model.fit(X_train, y_train)

    probs = model.predict_proba(X_test)[:, 1]
    metrics = {
        "auroc": round(float(roc_auc_score(y_test, probs)), 4),
        "auprc": round(float(average_precision_score(y_test, probs)), 4),
        "brier_score": round(float(brier_score_loss(y_test, probs)), 4),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "test_susceptible_rate": round(float(y_test.mean()), 4),
    }
    print("Held-out metrics (synthetic test split):", metrics)

    out_dir = Path(__file__).parent
    import joblib

    joblib.dump(model, out_dir / "synthetic_model.joblib")
    (out_dir / "synthetic_model_metadata.json").write_text(
        json.dumps(
            {
                "categorical_cols": CATEGORICAL_COLS,
                "numeric_cols": NUMERIC_COLS,
                "organisms": ORGANISMS,
                "antibiotics": ANTIBIOTICS,
                "culture_descriptions": CULTURE_DESCRIPTIONS,
                "ordering_modes": ORDERING_MODES,
                "age_buckets": AGE_BUCKETS,
                "genders": GENDERS,
                "metrics": metrics,
                "disclaimer": (
                    "Trained entirely on fabricated synthetic data generated for this "
                    "hackathon demo. Not real hospital data, not a validated clinical "
                    "model, and not connected to any real antimicrobial-resistance "
                    "epidemiology. Kept separate from ResistLens's deterministic "
                    "resistance-risk scorecard."
                ),
            },
            indent=2,
        )
    )
    print(f"Saved model + metadata to {out_dir}")


if __name__ == "__main__":
    main()
