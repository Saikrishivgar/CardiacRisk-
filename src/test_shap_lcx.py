"""
test_shap_lcx.py — Standalone SHAP verification for the LCX (lcx_model) pipeline.

PURPOSE
-------
Technical smoke-test to confirm that SHAP explanations can be correctly
extracted from the saved LCX sklearn Pipeline (XGBoost classifier).
Dataset row 0 is used only as a known, repeatable input to verify the
machinery end-to-end.

IMPORTANT CAVEATS
-----------------
* Row 0 is part of the training dataset — this is NOT independent model
  evaluation; the model has already seen this sample during training.
* SHAP values explain the model's internal prediction logic for this input.
  A positive value pushes the prediction toward LCX stenosis; a negative
  value pushes it away.
* SHAP values do NOT establish causation.
* SHAP values do NOT identify a physical blockage location in the artery.
* LCX probability is NOT a percentage of physical artery blockage.
"""

from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import shap

# ── Paths ──────────────────────────────────────────────────────────────────
ROOT       = Path(__file__).resolve().parents[1]
DATA_PATH  = ROOT / "data" / "z_alizadeh_sani.xlsx"
MODEL_PATH = ROOT / "models" / "lcx_model.joblib"

TARGETS = ["Cath", "LAD", "LCX", "RCA"]

# ── 1. Load the saved pipeline ─────────────────────────────────────────────
print("Loading LCX model pipeline …")
pipe  = joblib.load(MODEL_PATH)
prep  = pipe.named_steps["prep"]    # ColumnTransformer (impute + encode)
model = pipe.named_steps["model"]   # XGBClassifier

print(f"  Preprocessor : {type(prep).__name__}")
print(f"  Classifier   : {type(model).__name__}")

# ── 2. Load one dataset row as a technical test input ─────────────────────
print("\nLoading dataset row 0 (technical test input only) …")
df = pd.read_excel(DATA_PATH, sheet_name="Sheet 1 - Table 1")

# Apply the same Sex normalisation used during training
df["Sex"] = df["Sex"].replace({"Fmale": "Female", "Male": "Male"})

# Remove all target columns — exactly as done in train.py
row = df.drop(columns=TARGETS).iloc[[0]].copy()

# ── 3. Predict LCX stenosis probability via the full pipeline ─────────────
prob = pipe.predict_proba(row)[0, 1]
print(f"\nLCX probability: {prob * 100:.2f}%")

# ── 4. Build SHAP explanation ──────────────────────────────────────────────
# Transform the input using the pipeline's own preprocessor so SHAP sees
# the exact same feature space XGBoost was trained on.
Xt    = prep.transform(row)           # shape: (1, n_features)
names = prep.get_feature_names_out()  # aligned feature names

# TreeExplainer is the correct SHAP method for XGBoost models.
print("\nBuilding SHAP TreeExplainer …")
explainer = shap.TreeExplainer(model)

sv = explainer.shap_values(Xt)
sv = np.asarray(sv)

# XGBoost binary classifier: TreeExplainer returns shape (n_samples, n_features)
# — a single 2-D array of log-odds contributions for the positive class.
# No class-axis slicing is needed (unlike sklearn RandomForest which returns 3-D).
if sv.ndim == 3:
    # Guard: if future SHAP/XGBoost versions return 3-D, take positive class
    sv = sv[:, :, 1]

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

print("\nTop SHAP contributors (LCX model — technical test on row 0):")
print("─" * 62)
for rank, i in enumerate(order, start=1):
    name      = clean_names[i]
    value     = vals[i]
    direction = ("→ pushes prediction TOWARD LCX stenosis"
                 if value >= 0
                 else "→ pushes prediction AWAY from LCX stenosis")
    print(f"  {rank:>2}. {name:<32} {value:+.4f}   {direction}")

print("─" * 62)
print("\nNOTE: These SHAP values reflect the model's internal decision logic")
print("for this single technical test row.  They do NOT indicate causation,")
print("physical blockage location, or percentage of artery stenosis.")
print("\n✓ LCX SHAP verification complete.")
