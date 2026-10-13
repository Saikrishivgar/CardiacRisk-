"""
test_manual_patient.py — Manual unseen-patient inference test.

PURPOSE
-------
Verify that all four saved pipelines (CAD, LAD, LCX, RCA) accept a manually
constructed patient input and produce probability outputs without errors.

This is the first step before adding SHAP explanations for manual patient
inputs.  No SHAP is computed here.

IMPORTANT
---------
* This patient is a fictitious example constructed for testing purposes.
  It is NOT based on any real individual.
* The probabilities produced are model-estimated probabilities for the
  corresponding dataset target classes.
* They are NOT percentages of physical artery blockage and are NOT a
  medical diagnosis of any kind.
* The models were trained on the full 303-row dataset; no independent
  hold-out evaluation is performed here.
"""

from pathlib import Path
import joblib
import pandas as pd

# ── Paths ──────────────────────────────────────────────────────────────────
ROOT      = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models"

# ── Load all four saved pipelines ─────────────────────────────────────────
print("Loading saved model pipelines …")
models = {
    "CAD (Cath)"    : joblib.load(MODEL_DIR / "cath_model.joblib"),
    "LAD stenosis"  : joblib.load(MODEL_DIR / "lad_model.joblib"),
    "LCX stenosis"  : joblib.load(MODEL_DIR / "lcx_model.joblib"),
    "RCA stenosis"  : joblib.load(MODEL_DIR / "rca_model.joblib"),
}
for label, pipe in models.items():
    clf = pipe.named_steps["model"]
    print(f"  {label:<18} → {type(clf).__name__}")

# ── Manually constructed fictitious patient ────────────────────────────────
# Every column that the training pipeline expects is included.
# Values are chosen within the observed dataset ranges and use only
# the valid category strings confirmed from the training data.
# Target columns (Cath, LAD, LCX, RCA) are intentionally excluded.
patient = {
    # Demographics
    "Age"                  : 62,
    "Weight"               : 82,
    "Length"               : 170,
    "Sex"                  : "Male",       # "Male" or "Female"
    "BMI"                  : 28.4,

    # Binary risk factors (0 = No, 1 = Yes)
    "DM"                   : 1,            # Diabetes mellitus
    "HTN"                  : 1,            # Hypertension
    "Current Smoker"       : 0,
    "EX-Smoker"            : 1,
    "FH"                   : 0,            # Family history of CAD

    # Categorical comorbidities (valid values: "N" or "Y")
    "Obesity"              : "N",
    "CRF"                  : "N",          # Chronic renal failure
    "CVA"                  : "N",          # Cerebrovascular accident
    "Airway disease"       : "N",
    "Thyroid Disease"      : "N",
    "CHF"                  : "N",          # Congestive heart failure
    "DLP"                  : "Y",          # Dyslipidemia

    # Vitals
    "BP"                   : 145,          # Systolic blood pressure (mmHg)
    "PR"                   : 78,           # Pulse rate (bpm)

    # Physical exam (0/1 binary)
    "Edema"                : 0,
    "Weak Peripheral Pulse": "N",
    "Lung rales"           : "N",
    "Systolic Murmur"      : "N",
    "Diastolic Murmur"     : "N",

    # Symptoms
    "Typical Chest Pain"   : 1,            # 0 or 1
    "Dyspnea"              : "Y",
    "Function Class"       : 2,            # 0–3 (NYHA functional class)
    "Atypical"             : "N",          # Atypical chest pain
    "Nonanginal"           : "N",
    "Exertional CP"        : "N",          # Only observed value: "N"
    "LowTH Ang"            : "N",          # Low-threshold angina

    # ECG findings (0/1 binary)
    "Q Wave"               : 0,
    "St Elevation"         : 0,
    "St Depression"        : 1,
    "Tinversion"           : 1,
    "LVH"                  : "N",          # Left ventricular hypertrophy
    "Poor R Progression"   : "N",
    "BBB"                  : "N",          # Bundle branch block: "N","LBBB","RBBB"

    # Lab results
    "FBS"                  : 112,          # Fasting blood sugar (mg/dL)
    "CR"                   : 1.1,          # Creatinine (mg/dL)
    "TG"                   : 185,          # Triglycerides (mg/dL)
    "LDL"                  : 128,          # LDL cholesterol (mg/dL)
    "HDL"                  : 36,           # HDL cholesterol (mg/dL)
    "BUN"                  : 18,           # Blood urea nitrogen (mg/dL)
    "ESR"                  : 22,           # Erythrocyte sedimentation rate
    "HB"                   : 13.8,         # Hemoglobin (g/dL)
    "K"                    : 4.1,          # Potassium (mEq/L)
    "Na"                   : 140,          # Sodium (mEq/L)
    "WBC"                  : 8200,         # White blood cell count
    "Lymph"                : 28,           # Lymphocyte percentage
    "Neut"                 : 65,           # Neutrophil percentage
    "PLT"                  : 230,          # Platelet count (×10³/µL)

    # Echo / imaging
    "EF-TTE"               : 45,           # Ejection fraction % (TTE)
    "Region RWMA"          : 1,            # Regional wall motion abnormality (0–4)
    "VHD"                  : "N",          # Valvular heart disease: "N","mild","Moderate","Severe"
}

# ── Build DataFrame and verify columns ────────────────────────────────────
frame = pd.DataFrame([patient])

# Confirm the reference column list from the training metadata
import json
META = json.loads((ROOT / "reports" / "metrics.json").read_text())
required_cols = META["input_columns"]   # 55 columns in training order

missing = [c for c in required_cols if c not in frame.columns]
extra   = [c for c in frame.columns   if c not in required_cols]

if missing:
    raise ValueError(f"Manual patient is missing required columns: {missing}")
if extra:
    raise ValueError(f"Manual patient has unexpected extra columns: {extra}")

# Reorder columns to match training order
frame = frame[required_cols]

print(f"\nInput feature count : {len(frame.columns)} columns")
print("\n── Manual patient input values ──────────────────────────────────")
for col in required_cols:
    print(f"  {col:<25} : {frame[col].iloc[0]}")

# ── Run inference through all four pipelines ──────────────────────────────
print("\n── Model probability outputs ────────────────────────────────────")
for label, pipe in models.items():
    prob = pipe.predict_proba(frame)[0, 1]
    print(f"  {label:<18} : {prob * 100:.2f}%")

print("\n" + "─" * 62)
print("IMPORTANT:")
print("  These probabilities are model-estimated probabilities for the")
print("  dataset target classes.  They are NOT percentages of physical")
print("  artery blockage and are NOT a medical diagnosis.")
print("─" * 62)
print("\n✓ Manual patient inference test complete.")
