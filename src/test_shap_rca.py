"""
test_shap_rca.py — Standalone SHAP verification for the RCA (rca_model) pipeline.

PURPOSE
-------
Technical smoke-test to confirm that SHAP explanations can be correctly
extracted from the saved RCA sklearn Pipeline (RandomForest classifier).
Dataset row 0 is used only as a known, repeatable input to verify the
machinery end-to-end.

IMPORTANT CAVEATS
-----------------
* Row 0 is part of the training dataset — this is NOT independent model
  evaluation; the model has already seen this sample during training.
* SHAP values explain the model's internal prediction logic for this input.
  A positive value pushes the prediction toward RCA stenosis; a negative
  value pushes it away.
* SHAP values do NOT establish causation.
* SHAP values do NOT identify a physical blockage location in the artery.
* RCA probability is NOT a percentage of physical artery blockage.
"""

from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import shap

# ── Paths ──────────────────────────────────────────────────────────────────
ROOT       = Path(__file__).resolve().parents[1]
DATA_PATH  = ROOT / "data" / "z_alizadeh_sani.xlsx"
MODEL_PATH = ROOT / "models" / "rca_model.joblib"

TARGETS = ["Cath", "LAD", "LCX", "RCA"]

# ── 1. Load the saved pipeline ─────────────────────────────────────────────
print("Loading RCA model pipeline …")
pipe  = joblib.load(MODEL_PATH)
prep  = pipe.named_steps["prep"]    # ColumnTransformer (impute + encode)
model = pipe.named_steps["model"]   # RandomForestClassifier

print(f"  Preprocessor : {type(prep).__name__}")
print(f"  Classifier   : {type(model).__name__}")

# ── 2. Load one dataset row as a technical test input ─────────────────────
print("\nLoading dataset row 0 (technical test input only) …")
df = pd.read_excel(DATA_PATH, sheet_name="Sheet 1 - Table 1")

# Apply the same Sex normalisation used during training
df["Sex"] = df["Sex"].replace({"Fmale": "Female", "Male": "Male"})

# Remove all target columns — exactly as done in train.py
row = df.drop(columns=TARGETS).iloc[[0]].copy()

# ── 3. Predict RCA stenosis probability via the full pipeline ─────────────
prob = pipe.predict_proba(row)[0, 1]
print(f"\nRCA probability: {prob * 100:.2f}%")

# ── 4. Build SHAP explanation ──────────────────────────────────────────────
# Transform the input using the pipeline's own preprocessor so SHAP sees
# the exact same feature space the Random Forest was trained on.
Xt    = prep.transform(row)           # shape: (1, n_features)
names = prep.get_feature_names_out()  # aligned feature names

# TreeExplainer is the correct, exact SHAP method for Random Forest models.
print("\nBuilding SHAP TreeExplainer …")
explainer = shap.TreeExplainer(model)

sv = explainer.shap_values(Xt)
sv = np.asarray(sv)

# Inspect the actual output shape before slicing.
print(f"  SHAP output shape : {sv.shape}  (ndim={sv.ndim})")

if sv.ndim == 3:
    # sklearn RandomForest binary classifier: shape (n_samples, n_features, n_classes)
    # Index 1 selects the positive class (RCA Stenotic = 1).
    sv = sv[:, :, 1]
elif sv.ndim == 2:
    # Already (n_samples, n_features) — positive class values returned directly.
    pass
else:
    raise ValueError(f"Unexpected SHAP output ndim={sv.ndim}, shape={sv.shape}")

vals = sv[0]   # SHAP values for our single row, shape: (n_features,)

# ── 5. Rank features by absolute SHAP contribution ────────────────────────
def clean_name(raw: str) -> str:
    """Remove 'num__' / 'cat__' prefix added by ColumnTransformer."""
    for prefix in ("num__", "cat__"):
        if raw.startswith(prefix):
            return raw[len(prefix):]
    return raw

clean_names = [clean_name(n) for n in names]

order = np.argsort(np.abs(vals))[::-1][:10]   # top 10 by absolute value

print("\nTop SHAP contributors (RCA model — technical test on row 0):")
print("─" * 62)
for rank, i in enumerate(order, start=1):
    name      = clean_names[i]
    value     = vals[i]
    direction = ("→ pushes prediction TOWARD RCA stenosis"
                 if value >= 0
                 else "→ pushes prediction AWAY from RCA stenosis")
    print(f"  {rank:>2}. {name:<32} {value:+.4f}   {direction}")

print("─" * 62)
print("\nNOTE: These SHAP values reflect the model's internal decision logic")
print("for this single technical test row.  They do NOT indicate causation,")
print("physical blockage location, or percentage of artery stenosis.")
print("\n✓ RCA SHAP verification complete.")
