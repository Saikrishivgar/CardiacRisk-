/**
 * Patient input types for the 55 verified model input columns.
 * Source of truth: reports/metrics.json (input_columns), src/train.py,
 * data/z_alizadeh_sani.xlsx.
 *
 * Target columns (Cath, CAD, LAD, LCX, RCA) are NEVER patient inputs.
 */

/** All 55 model input columns, in the exact order of reports/metrics.json. */
export const MODEL_COLUMNS = [
  "Age", "Weight", "Length", "Sex", "BMI",
  "DM", "HTN", "Current Smoker", "EX-Smoker", "FH", "Obesity", "CRF", "CVA",
  "Airway disease", "Thyroid Disease", "CHF", "DLP",
  "BP", "PR", "Edema", "Weak Peripheral Pulse", "Lung rales",
  "Systolic Murmur", "Diastolic Murmur",
  "Typical Chest Pain", "Dyspnea", "Function Class", "Atypical", "Nonanginal",
  "Exertional CP", "LowTH Ang",
  "Q Wave", "St Elevation", "St Depression", "Tinversion", "LVH",
  "Poor R Progression", "BBB",
  "FBS", "CR", "TG", "LDL", "HDL", "BUN", "ESR", "HB", "K", "Na", "WBC",
  "Lymph", "Neut", "PLT",
  "EF-TTE", "Region RWMA", "VHD",
] as const;

export type ModelColumn = (typeof MODEL_COLUMNS)[number];

export const EXPECTED_FEATURE_COUNT = 55;

/** Target columns that must never appear in a patient payload. */
export const FORBIDDEN_TARGET_COLUMNS = ["Cath", "CAD", "LAD", "LCX", "RCA"] as const;

/** Numeric (continuous) pipeline columns: entered as a number. */
export const CONTINUOUS_COLUMNS = [
  "Age", "Weight", "Length", "BMI", "BP", "PR",
  "FBS", "CR", "TG", "LDL", "HDL", "BUN", "ESR", "HB", "K", "Na", "WBC",
  "Lymph", "Neut", "PLT", "EF-TTE",
] as const;
export type ContinuousColumn = (typeof CONTINUOUS_COLUMNS)[number];

/** Numeric pipeline columns whose values are coded integers (dropdown). */
export const CODE_COLUMNS = ["Function Class", "Region RWMA"] as const;
export type CodeColumn = (typeof CODE_COLUMNS)[number];

/**
 * Numeric pipeline columns that are binary: UI shows Yes/No,
 * payload value is 1 / 0 (numbers, never strings).
 */
export const BINARY_NUMERIC_COLUMNS = [
  "DM", "HTN", "Current Smoker", "EX-Smoker", "FH", "Edema",
  "Typical Chest Pain", "Q Wave", "St Elevation", "St Depression", "Tinversion",
] as const;
export type BinaryNumericColumn = (typeof BINARY_NUMERIC_COLUMNS)[number];

/**
 * Categorical pipeline columns with Y/N values: UI shows Yes/No,
 * payload value is "Y" / "N".
 */
export const YN_CATEGORICAL_COLUMNS = [
  "Obesity", "CRF", "CVA", "Airway disease", "Thyroid Disease", "CHF", "DLP",
  "Weak Peripheral Pulse", "Lung rales", "Systolic Murmur", "Diastolic Murmur",
  "Dyspnea", "Atypical", "Nonanginal", "LowTH Ang", "LVH", "Poor R Progression",
] as const;
export type YNCategoricalColumn = (typeof YN_CATEGORICAL_COLUMNS)[number];

/** UI value for any Yes/No control. "" = not yet answered. */
export type YesNo = "Yes" | "No" | "";

export type SexValue = "Male" | "Female" | "";
export type BBBUiValue = "None" | "LBBB" | "RBBB" | "";
export type VHDUiValue = "None" | "mild" | "Moderate" | "Severe" | "";

/**
 * Complete typed form state for all 55 model features.
 * Empty state: numbers are null, choices are "".
 * "Exertional CP" is the single exception: the training data contains only "N",
 * so it is a fixed, non-selectable "No".
 */
export type PatientInput = { [K in ContinuousColumn]: number | null } & {
  [K in CodeColumn]: number | null;
} & {
  [K in BinaryNumericColumn]: YesNo;
} & {
  [K in YNCategoricalColumn]: YesNo;
} & {
  "Exertional CP": "No";
  Sex: SexValue;
  BBB: BBBUiValue;
  VHD: VHDUiValue;
};

/** Exact model payload value shapes (what FastAPI will later receive). */
export type ModelPayload = Record<ModelColumn, number | string>;

/** Raw text drafts for numeric inputs (lets us detect invalid data types). */
export type NumericDrafts = Partial<Record<ContinuousColumn, string>>;

export type IssueSeverity = "required" | "invalid" | "range";

export interface FieldIssue {
  column: ModelColumn;
  severity: IssueSeverity;
  message: string;
}

export type RiskLevel = "LOW" | "MODERATE" | "HIGH";

export interface ShapContribution {
  feature: string;
  shap_value: number;
}

export interface PredictionResponse {
  predictions: {
    CAD: number;
    LAD: number;
    LCX: number;
    RCA: number;
  };
  risk_levels: {
    CAD: RiskLevel;
    LAD: RiskLevel;
    LCX: RiskLevel;
    RCA: RiskLevel;
  };
  explanations: {
    CAD: ShapContribution[];
    LAD: ShapContribution[];
    LCX: ShapContribution[];
    RCA: ShapContribution[];
  };
  shap_scales?: {
    CAD: string;
    LAD: string;
    LCX: string;
    RCA: string;
  };
  note: string;
}
