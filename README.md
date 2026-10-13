# Explainable 3D Cardiac Risk Navigator — ML Module

Independent ML/backend module for the hackathon Track A prototype.

## Dataset
Extension of Z-Alizadeh Sani Dataset, `Sheet 1 - Table 1`, 303 rows.

## Targets
- CAD: `Cath == CAD`
- LAD: `LAD == Stenotic`
- LCX: `LCX == Stenotic`
- RCA: `RCA == Stenotic`

`Cath`, `LAD`, `LCX`, and `RCA` are excluded from model inputs to prevent target leakage.

## Train
```bash
python src/train.py
```

The script compares Logistic Regression, Random Forest, and XGBoost with 5-fold stratified CV, selects the highest mean ROC-AUC model separately for each target, then retrains the selected model on all 303 records.

## Run API
```bash
uvicorn api.main:app --reload
```

Endpoint:
`POST /predict`

The frontend can later send the clinical feature dictionary and receive CAD/LAD/LCX/RCA probabilities plus SHAP feature contributions.

> This is a hackathon/research prototype and not a clinical diagnostic system.
