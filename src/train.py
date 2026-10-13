
from pathlib import Path
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from xgboost import XGBClassifier

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "z_alizadeh_sani.xlsx"
MODELS = ROOT / "models"
REPORTS = ROOT / "reports"
MODELS.mkdir(exist_ok=True)
REPORTS.mkdir(exist_ok=True)

df = pd.read_excel(DATA, sheet_name="Sheet 1 - Table 1")

TARGETS = ["Cath", "LAD", "LCX", "RCA"]
X = df.drop(columns=TARGETS).copy()

# The source sheet contains "Fmale" for one Sex category; normalize this
# obvious data-entry spelling to "Female" before modeling.
X["Sex"] = X["Sex"].replace({"Fmale": "Female", "Male": "Male"})

Y = {
    "Cath": df["Cath"].eq("CAD").astype(int),
    "LAD": df["LAD"].eq("Stenotic").astype(int),
    "LCX": df["LCX"].eq("Stenotic").astype(int),
    "RCA": df["RCA"].eq("Stenotic").astype(int),
}

cat_cols = X.select_dtypes(include="object").columns.tolist()
num_cols = X.select_dtypes(exclude="object").columns.tolist()

pre_lr = ColumnTransformer([
    ("num", Pipeline([
        ("imp", SimpleImputer(strategy="median")),
        ("sc", StandardScaler())
    ]), num_cols),
    ("cat", Pipeline([
        ("imp", SimpleImputer(strategy="most_frequent")),
        ("oh", OneHotEncoder(handle_unknown="ignore"))
    ]), cat_cols)
])

pre_tree = ColumnTransformer([
    ("num", SimpleImputer(strategy="median"), num_cols),
    ("cat", Pipeline([
        ("imp", SimpleImputer(strategy="most_frequent")),
        ("oh", OneHotEncoder(handle_unknown="ignore"))
    ]), cat_cols)
])

def make_model(name):
    if name == "LogisticRegression":
        return Pipeline([
            ("prep", pre_lr),
            ("model", LogisticRegression(max_iter=3000, class_weight="balanced"))
        ])
    if name == "RandomForest":
        return Pipeline([
            ("prep", pre_tree),
            ("model", RandomForestClassifier(
                n_estimators=500, min_samples_leaf=2,
                class_weight="balanced", random_state=42, n_jobs=-1
            ))
        ])
    if name == "XGBoost":
        return Pipeline([
            ("prep", pre_tree),
            ("model", XGBClassifier(
                n_estimators=300, max_depth=3, learning_rate=0.03,
                subsample=0.85, colsample_bytree=0.85, reg_lambda=2,
                objective="binary:logistic", eval_metric="logloss",
                random_state=42, n_jobs=-1
            ))
        ])
    raise ValueError(name)

# Model comparison by 5-fold stratified CV.
candidates = ["LogisticRegression", "RandomForest", "XGBoost"]
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
rows = []

for target, y in Y.items():
    for name in candidates:
        fold = []
        for tr, te in cv.split(X, y):
            pipe = make_model(name)
            pipe.fit(X.iloc[tr], y.iloc[tr])
            pred = pipe.predict(X.iloc[te])
            prob = pipe.predict_proba(X.iloc[te])[:, 1]
            fold.append({
                "accuracy": accuracy_score(y.iloc[te], pred),
                "precision": precision_score(y.iloc[te], pred, zero_division=0),
                "recall": recall_score(y.iloc[te], pred, zero_division=0),
                "f1": f1_score(y.iloc[te], pred, zero_division=0),
                "roc_auc": roc_auc_score(y.iloc[te], prob)
            })
        rows.append({
            "target": target,
            "model": name,
            **{k: float(np.mean([z[k] for z in fold])) for k in fold[0]}
        })

metrics = pd.DataFrame(rows)
best = {}
for target in Y:
    best[target] = (
        metrics[metrics.target == target]
        .sort_values("roc_auc", ascending=False)
        .iloc[0]["model"]
    )

# Fit selected pipelines on all 303 records and save them.
for target, model_name in best.items():
    pipe = make_model(model_name)
    pipe.fit(X, Y[target])
    joblib.dump(pipe, MODELS / f"{target.lower()}_model.joblib")

metadata = {
    "dataset": "Extension of Z-Alizadeh Sani Dataset",
    "sheet": "Sheet 1 - Table 1",
    "rows": int(len(df)),
    "input_columns": X.columns.tolist(),
    "excluded_from_input": TARGETS,
    "targets": {
        "CAD": "Cath == CAD",
        "LAD": "LAD == Stenotic",
        "LCX": "LCX == Stenotic",
        "RCA": "RCA == Stenotic"
    },
    "selected_models": best,
    "metrics": metrics.to_dict(orient="records")
}
(REPORTS / "metrics.json").write_text(json.dumps(metadata, indent=2))
metrics.to_csv(REPORTS / "model_comparison.csv", index=False)

print("Selected models:", best)
print(metrics.to_string(index=False))
