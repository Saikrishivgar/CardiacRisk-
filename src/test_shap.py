"""
test_shap.py — Standalone SHAP verification for the CAD (cath_model) pipeline.

PURPOSE
-------
Technical smoke-test to confirm that SHAP explanations can be correctly
extracted from the saved sklearn Pipeline.  The first dataset row is used
only as a known, repeatable input so we can verify the machinery end-to-end.

IMPORTANT CAVEATS
-----------------
* The model was trained on the FULL dataset (all 303 rows).  Using row 0 as
  input does NOT constitute an independent evaluation; the model has already
  seen this sample during training.
* SHAP values measure how each feature shifts the model's prediction away
  from its baseline (expected) output.  A positive value pushes the
  prediction toward CAD; a negative value pushes it away from CAD.
* SHAP values do NOT indicate causation, physical blockage location, or any
  percentage of artery stenosis.
"""

from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import shap

# ── Paths ──────────────────────────────────────────────────────────────────
ROOT      = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "z_alizadeh_sani.xlsx"
MODEL_PATH = ROOT / "models" / "cath_model.joblib"

TARGETS = ["Cath", "LAD", "LCX", "RCA"]

# ── 1. Load the saved pipeline ─────────────────────────────────────────────
print("Loading model pipeline …")
pipe = joblib.load(MODEL_PATH)
prep  = pipe.named_steps["prep"]    # ColumnTransformer (impute + encode)
model = pipe.named_steps["model"]   # RandomForestClassifier

print(f"  Preprocessor : {type(prep).__name__}")
print(f"  Classifier   : {type(model).__name__}")

# ── 2. Load one dataset row as a technical test input ─────────────────────
print("\nLoading dataset row 0 (technical test input only) …")
df = pd.read_excel(DATA_PATH, sheet_name="Sheet 1 - Table 1")

# Apply the same Sex normalisation used during training
df["Sex"] = df["Sex"].replace({"Fmale": "Female", "Male": "Male"})

# Remove target columns — exactly as done in train.py
row = df.drop(columns=TARGETS).iloc[[0]].copy()

# ── 3. Predict CAD probability via the full pipeline ──────────────────────
prob = pipe.predict_proba(row)[0, 1]
print(f"\nCAD probability: {prob * 100:.2f}%")

# ── 4. Build SHAP explanation ──────────────────────────────────────────────
# Transform the input using the pipeline's own preprocessor so SHAP sees
# the exact same feature space the Random Forest was trained on.
Xt    = prep.transform(row)                    # shape: (1, n_features)
names = prep.get_feature_names_out()           # aligned feature names

# TreeExplainer is the correct, exact SHAP method for Random Forest models.
print("\nBuilding SHAP TreeExplainer …")
explainer = shap.TreeExplainer(model)

# shap_values returns shape (n_samples, n_features, n_classes) for sklearn RF
sv = explainer.shap_values(Xt)                 # numpy array
sv = np.asarray(sv)

if sv.ndim == 3:
    # Binary classifier: index 1 = "positive class" (CAD = 1)
    sv = sv[:, :, 1]

vals = sv[0]   # SHAP values for our single row, shape: (n_features,)

# ── 5. Rank features by absolute SHAP contribution ────────────────────────
# Strip ColumnTransformer prefixes ("num__", "cat__") for readable names.
def clean_name(raw: str) -> str:
    """Remove 'num__' / 'cat__' prefix added by ColumnTransformer."""
    for prefix in ("num__", "cat__"):
        if raw.startswith(prefix):
            return raw[len(prefix):]
    return raw

clean_names = [clean_name(n) for n in names]

order = np.argsort(np.abs(vals))[::-1][:10]   # top 10 by absolute value

print("\nTop SHAP contributors (CAD model — technical test on row 0):")
print("─" * 60)
for rank, i in enumerate(order, start=1):
    name   = clean_names[i]
    value  = vals[i]
    direction = ("→ pushes prediction TOWARD CAD"
                 if value >= 0
                 else "→ pushes prediction AWAY from CAD")
    print(f"  {rank:>2}. {name:<32} {value:+.4f}   {direction}")

print("─" * 60)
print("\nNOTE: These SHAP values reflect the model's internal decision logic")
print("for this single technical test row.  They do NOT indicate causation,")
print("physical blockage location, or percentage of artery stenosis.")
print("\n✓ CAD SHAP verification complete.")
