import type {
  BinaryNumericColumn,
  ContinuousColumn,
  CodeColumn,
  ModelColumn,
  YNCategoricalColumn,
} from "@/types/patient";

/**
 * UI schema for the 55 model input columns.
 * `Record<ModelColumn, ...>` makes TypeScript fail the build if any column is
 * missing, or if a non-model column (e.g. Cholesterol, Cardiac Enzymes,
 * Cath/CAD/LAD/LCX/RCA) is added.
 *
 * Training-data ranges come from data/z_alizadeh_sani.xlsx (303 rows).
 * Units are intentionally NOT shown: they are not documented in the project files.
 * Code meanings (Function Class, Region RWMA) are intentionally NOT shown.
 */

export type FieldSpec =
  | { kind: "number"; label: string; range: readonly [number, number]; hint?: string }
  | { kind: "code"; label: string; codes: readonly number[] }
  | { kind: "yesno"; label: string }
  | { kind: "sex"; label: string }
  | { kind: "bbb"; label: string }
  | { kind: "vhd"; label: string }
  | { kind: "constantNo"; label: string; note: string };

export const FIELD_SPECS: Record<ModelColumn, FieldSpec> = {
  // Demographics
  Age: { kind: "number", label: "Age", range: [30, 86] },
  Weight: { kind: "number", label: "Weight", range: [48, 120] },
  Length: { kind: "number", label: "Height", range: [140, 188], hint: "Model column: Length" },
  Sex: { kind: "sex", label: "Sex" },
  BMI: { kind: "number", label: "BMI", range: [18.115412710007302, 40.90065778377467] },

  // Medical history
  DM: { kind: "yesno", label: "Diabetes" },
  HTN: { kind: "yesno", label: "Hypertension" },
  "Current Smoker": { kind: "yesno", label: "Current Smoker" },
  "EX-Smoker": { kind: "yesno", label: "Former Smoker" },
  FH: { kind: "yesno", label: "Family History" },
  Obesity: { kind: "yesno", label: "Obesity" },
  CRF: { kind: "yesno", label: "Chronic Renal Failure" },
  CVA: { kind: "yesno", label: "Cerebrovascular Accident" },
  "Airway disease": { kind: "yesno", label: "Airway Disease" },
  "Thyroid Disease": { kind: "yesno", label: "Thyroid Disease" },
  CHF: { kind: "yesno", label: "Congestive Heart Failure" },
  DLP: { kind: "yesno", label: "Dyslipidemia" },

  // Vitals & physical examination
  BP: { kind: "number", label: "Blood Pressure", range: [90, 190], hint: "Model column: BP" },
  PR: { kind: "number", label: "Pulse Rate", range: [50, 110], hint: "Model column: PR" },
  Edema: { kind: "yesno", label: "Edema" },
  "Weak Peripheral Pulse": { kind: "yesno", label: "Weak Peripheral Pulse" },
  "Lung rales": { kind: "yesno", label: "Lung Rales" },
  "Systolic Murmur": { kind: "yesno", label: "Systolic Murmur" },
  "Diastolic Murmur": { kind: "yesno", label: "Diastolic Murmur" },

  // Symptoms
  "Typical Chest Pain": { kind: "yesno", label: "Typical Chest Pain" },
  Dyspnea: { kind: "yesno", label: "Dyspnea" },
  "Function Class": { kind: "code", label: "Function Class", codes: [0, 1, 2, 3] },
  Atypical: { kind: "yesno", label: "Atypical Chest Pain" },
  Nonanginal: { kind: "yesno", label: "Non-anginal Chest Pain" },
  "Exertional CP": {
    kind: "constantNo",
    label: "Exertional CP",
    note: "Fixed to No: the training data contains only “N” for this column (303 of 303 records).",
  },
  "LowTH Ang": { kind: "yesno", label: "Low-Threshold Angina" },

  // ECG
  "Q Wave": { kind: "yesno", label: "Q Wave" },
  "St Elevation": { kind: "yesno", label: "ST Elevation" },
  "St Depression": { kind: "yesno", label: "ST Depression" },
  Tinversion: { kind: "yesno", label: "T-Wave Inversion" },
  LVH: { kind: "yesno", label: "Left Ventricular Hypertrophy" },
  "Poor R Progression": { kind: "yesno", label: "Poor R-Wave Progression" },
  BBB: { kind: "bbb", label: "Bundle Branch Block" },

  // Laboratory
  FBS: { kind: "number", label: "Fasting Blood Sugar", range: [62, 400], hint: "Model column: FBS" },
  CR: { kind: "number", label: "Creatinine", range: [0.5, 2.2], hint: "Model column: CR" },
  TG: { kind: "number", label: "Triglycerides", range: [37, 1050], hint: "Model column: TG" },
  LDL: { kind: "number", label: "LDL", range: [18, 232] },
  HDL: { kind: "number", label: "HDL", range: [15.9, 111] },
  BUN: { kind: "number", label: "Blood Urea Nitrogen", range: [6, 52], hint: "Model column: BUN" },
  ESR: { kind: "number", label: "ESR", range: [1, 90] },
  HB: { kind: "number", label: "Hemoglobin", range: [8.9, 17.6], hint: "Model column: HB" },
  K: { kind: "number", label: "Potassium", range: [3.0, 6.6], hint: "Model column: K" },
  Na: { kind: "number", label: "Sodium", range: [128, 156], hint: "Model column: Na" },
  WBC: { kind: "number", label: "White Blood Cell Count", range: [3700, 18000], hint: "Model column: WBC" },
  Lymph: { kind: "number", label: "Lymphocytes", range: [7, 60], hint: "Model column: Lymph" },
  Neut: { kind: "number", label: "Neutrophils", range: [32, 89], hint: "Model column: Neut" },
  PLT: { kind: "number", label: "Platelets", range: [25, 742], hint: "Model column: PLT" },

  // Echocardiography / other
  "EF-TTE": { kind: "number", label: "Ejection Fraction", range: [15, 60], hint: "Model column: EF-TTE" },
  "Region RWMA": { kind: "code", label: "Region RWMA (code)", codes: [0, 1, 2, 3, 4] },
  VHD: { kind: "vhd", label: "Valvular Heart Disease" },
};

export interface SectionSpec {
  id: string;
  title: string;
  subtitle: string;
  columns: readonly ModelColumn[];
}

export const FORM_SECTIONS: readonly SectionSpec[] = [
  {
    id: "demographics",
    title: "Demographics",
    subtitle: "Age, sex and body measurements",
    columns: ["Age", "Sex", "Weight", "Length", "BMI"],
  },
  {
    id: "history",
    title: "Medical History",
    subtitle: "Risk factors and comorbidities",
    columns: [
      "DM", "HTN", "Current Smoker", "EX-Smoker", "FH", "Obesity", "CRF", "CVA",
      "Airway disease", "Thyroid Disease", "CHF", "DLP",
    ],
  },
  {
    id: "vitals",
    title: "Vitals & Physical Examination",
    subtitle: "Hemodynamics and bedside findings",
    columns: [
      "BP", "PR", "Edema", "Weak Peripheral Pulse", "Lung rales",
      "Systolic Murmur", "Diastolic Murmur",
    ],
  },
  {
    id: "symptoms",
    title: "Symptoms",
    subtitle: "Presenting complaints",
    columns: [
      "Typical Chest Pain", "Atypical", "Nonanginal", "Exertional CP",
      "LowTH Ang", "Dyspnea", "Function Class",
    ],
  },
  {
    id: "ecg",
    title: "ECG",
    subtitle: "Electrocardiogram findings",
    columns: [
      "Q Wave", "St Elevation", "St Depression", "Tinversion", "LVH",
      "Poor R Progression", "BBB",
    ],
  },
  {
    id: "laboratory",
    title: "Laboratory",
    subtitle: "Blood tests",
    columns: [
      "FBS", "CR", "TG", "LDL", "HDL", "BUN", "ESR", "HB", "K", "Na", "WBC",
      "Lymph", "Neut", "PLT",
    ],
  },
  {
    id: "echo",
    title: "Echocardiography",
    subtitle: "Cardiac function and valves",
    columns: ["EF-TTE", "Region RWMA", "VHD"],
  },
];

/** Dropdown options. `value` is the UI value; the payload encoding lives in buildModelPayload. */
export const BBB_OPTIONS = [
  { value: "None", label: "None" },
  { value: "LBBB", label: "LBBB" },
  { value: "RBBB", label: "RBBB" },
] as const;

export const VHD_OPTIONS = [
  { value: "None", label: "None" },
  { value: "mild", label: "mild" },
  { value: "Moderate", label: "Moderate" },
  { value: "Severe", label: "Severe" },
] as const;

export const SEX_OPTIONS = ["Male", "Female"] as const;

// Compile-time guard: these helper unions must stay inside the model schema.
export type _SchemaGuard = ContinuousColumn | CodeColumn | BinaryNumericColumn | YNCategoricalColumn;
