"""
test_manual_patient_shap.py — SHAP explanations for the manually constructed patient.

PURPOSE
-------
Combine the verified manual patient inference (test_manual_patient.py) with the
verified SHAP machinery (test_shap*.py) to produce per-model SHAP explanations
for the fictitious example patient.

IMPORTANT CAVEATS
-----------------
* The patient is FICTITIOUS — constructed for testing purposes only.
  It does NOT represent any real individual and is NOT a medical diagnosis.
* The models were trained on the full 303-row dataset; this is NOT an
  independent evaluation.
* SHAP values explain the model's internal prediction logic for this patient.
  Positive SHAP → pushes the model toward the positive target class.
  Negative SHAP → pushes the model away from the positive target class.
* SHAP does NOT establish causation.
* SHAP does NOT identify a physical blockage location in any artery.
* Probabilities are NOT percentages of physical artery stenosis.
* LCX uses XGBoost (SHAP values in log-odds space); CAD, LAD, RCA use
  RandomForest (SHAP values in probability-contribution space).
  Do NOT directly compare raw SHAP magnitudes across these two model types.
"""

from pathlib import Path
import json
import joblib
import numpy as np
import pandas as pd
import shap

# ── Paths ──────────────────────────────────────────────────────────────────
ROOT      = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models"
META      = json.loads((ROOT / "reports" / "metrics.json").read_text())

# ── Exact patient dictionary from test_manual_patient.py ──────────────────
patient = {
    "Age"                  : 62,
    "Weight"               : 82,
    "Length"               : 170,
    "Sex"                  : "Male",
    "BMI"                  : 28.4,
    "DM"                   : 1,
    "HTN"                  : 1,
    "Current Smoker"       : 0,
    "EX-Smoker"            : 1,
    "FH"                   : 0,
    "Obesity"              : "N",
    "CRF"                  : "N",
    "CVA"                  : "N",
    "Airway disease"       : "N",
    "Thyroid Disease"      : "N",
    "CHF"                  : "N",
    "DLP"                  : "Y",
    "BP"                   : 145,
    "PR"                   : 78,
    "Edema"                : 0,
    "Weak Peripheral Pulse": "N",
    "Lung rales"           : "N",
    "Systolic Murmur"      : "N",
    "Diastolic Murmur"     : "N",
    "Typical Chest Pain"   : 1,
    "Dyspnea"              : "Y",
    "Function Class"       : 2,
    "Atypical"             : "N",
    "Nonanginal"           : "N",
    "Exertional CP"        : "N",
    "LowTH Ang"            : "N",
    "Q Wave"               : 0,
    "St Elevation"         : 0,
    "St Depression"        : 1,
    "Tinversion"           : 1,
    "LVH"                  : "N",
    "Poor R Progression"   : "N",
    "BBB"                  : "N",
    "FBS"                  : 112,
    "CR"                   : 1.1,
    "TG"                   : 185,
    "LDL"                  : 128,
    "HDL"                  : 36,
    "BUN"                  : 18,
    "ESR"                  : 22,
    "HB"                   : 13.8,
    "K"                    : 4.1,
    "Na"                   : 140,
    "WBC"                  : 8200,
    "Lymph"                : 28,
    "Neut"                 : 65,
    "PLT"                  : 230,
    "EF-TTE"               : 45,
    "Region RWMA"          : 1,
    "VHD"                  : "N",
}

# Build DataFrame in training column order
frame = pd.DataFrame([patient])[META["input_columns"]]

# ── Helper: clean ColumnTransformer prefix ─────────────────────────────────
def clean_name(raw: str) -> str:
    for prefix in ("num__", "cat__"):
        if raw.startswith(prefix):
            return raw[len(prefix):]
    return raw

# ── Helper: compute and print top-N SHAP contributors ─────────────────────
def shap_for_model(label, pipe, toward_label, away_label, top_n=10):
    prep  = pipe.named_steps["prep"]
    model = pipe.named_steps["model"]

    # 1. Probability
    prob = pipe.predict_proba(frame)[0, 1]

    # 2. Transform
    Xt    = prep.transform(frame)
    names = [clean_name(n) for n in prep.get_feature_names_out()]

    # 3. SHAP
    explainer = shap.TreeExplainer(model)
    sv = np.asarray(explainer.shap_values(Xt))

    # 4. Select positive-class slice
    if sv.ndim == 3:
        # sklearn RandomForest: (n_samples, n_features, n_classes)
        sv = sv[:, :, 1]
    # XGBoost: already (n_samples, n_features) — no slicing needed

    vals  = sv[0]
    order = np.argsort(np.abs(vals))[::-1][:top_n]

    # 5. Print
    print(f"\n{'═' * 64}")
    print(f"  {label}")
    print(f"  Probability : {prob * 100:.2f}%")
    print(f"{'═' * 64}")
    print(f"  {'#':<4} {'Feature':<32} {'SHAP':>8}   Direction")
    print(f"  {'─' * 60}")
    for rank, i in enumerate(order, start=1):
        value     = vals[i]
        direction = toward_label if value >= 0 else away_label
        print(f"  {rank:<4} {names[i]:<32} {value:+.4f}   {direction}")
    print(f"  {'─' * 60}")

# ── Load pipelines ─────────────────────────────────────────────────────────
print("Loading saved model pipelines …")
pipes = {
    "CAD" : joblib.load(MODEL_DIR / "cath_model.joblib"),
    "LAD" : joblib.load(MODEL_DIR / "lad_model.joblib"),
    "LCX" : joblib.load(MODEL_DIR / "lcx_model.joblib"),
    "RCA" : joblib.load(MODEL_DIR / "rca_model.joblib"),
}
for key, pipe in pipes.items():
    print(f"  {key} → {type(pipe.named_steps['model']).__name__}")

# ── Step 1: Verify probabilities match test_manual_patient.py ─────────────
print("\n── Probability verification (must match previous run) ───────────")
expected = {"CAD": 97.31, "LAD": 89.37, "LCX": 60.36, "RCA": 77.69}
all_match = True
for key, pipe in pipes.items():
    prob = pipe.predict_proba(frame)[0, 1] * 100
    match = abs(prob - expected[key]) < 0.05       # allow <0.05 pp rounding
    flag  = "✓" if match else "✗ MISMATCH"
    print(f"  {key:<4} : {prob:.2f}%   (expected ≈ {expected[key]:.2f}%)  {flag}")
    if not match:
        all_match = False

if not all_match:
    raise RuntimeError("Probability mismatch detected — check model or patient dict.")

# ── Step 2: SHAP for each model ────────────────────────────────────────────
print("\nGenerating SHAP explanations for fictitious example patient …")

shap_for_model(
    "CAD  — Coronary Artery Disease  [RandomForest]",
    pipes["CAD"],
    toward_label="→ TOWARD CAD",
    away_label  ="→ AWAY from CAD",
)
shap_for_model(
    "LAD  — LAD Artery Stenosis  [RandomForest]",
    pipes["LAD"],
    toward_label="→ TOWARD LAD stenosis",
    away_label  ="→ AWAY from LAD stenosis",
)
shap_for_model(
    "LCX  — LCX Artery Stenosis  [XGBoost — log-odds scale]",
    pipes["LCX"],
    toward_label="→ TOWARD LCX stenosis",
    away_label  ="→ AWAY from LCX stenosis",
)
shap_for_model(
    "RCA  — RCA Artery Stenosis  [RandomForest]",
    pipes["RCA"],
    toward_label="→ TOWARD RCA stenosis",
    away_label  ="→ AWAY from RCA stenosis",
)

# ── Footer ─────────────────────────────────────────────────────────────────
print(f"\n{'═' * 64}")
print("IMPORTANT:")
print("  • Patient is FICTITIOUS — not a real individual or diagnosis.")
print("  • Probabilities are model estimates, NOT physical stenosis %.")
print("  • SHAP values reflect model logic, NOT causation.")
print("  • SHAP does NOT identify physical blockage location.")
print("  • LCX SHAP is in log-odds space; CAD/LAD/RCA in RF probability")
print("    contribution space — do NOT compare magnitudes across models.")
print(f"{'═' * 64}")
print("\n✓ Manual patient SHAP verification complete.")
