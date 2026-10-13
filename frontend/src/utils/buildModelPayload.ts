import {
  BINARY_NUMERIC_COLUMNS,
  CODE_COLUMNS,
  CONTINUOUS_COLUMNS,
  EXPECTED_FEATURE_COUNT,
  FORBIDDEN_TARGET_COLUMNS,
  MODEL_COLUMNS,
  YN_CATEGORICAL_COLUMNS,
  type FieldIssue,
  type ModelColumn,
  type ModelPayload,
  type NumericDrafts,
  type PatientInput,
} from "@/types/patient";
import { FIELD_SPECS } from "@/config/patientSchema";

const BINARY_NUMERIC_SET: ReadonlySet<string> = new Set(BINARY_NUMERIC_COLUMNS);
const YN_SET: ReadonlySet<string> = new Set(YN_CATEGORICAL_COLUMNS);
const CONTINUOUS_SET: ReadonlySet<string> = new Set(CONTINUOUS_COLUMNS);
const CODE_SET: ReadonlySet<string> = new Set(CODE_COLUMNS);

type LooseRecord = Record<ModelColumn, number | string | null>;

/** Empty patient: no default clinical values. Only Exertional CP is fixed (training data has only "N"). */
export function createEmptyPatient(): PatientInput {
  const empty: Partial<LooseRecord> = {};
  for (const col of MODEL_COLUMNS) {
    if (CONTINUOUS_SET.has(col) || CODE_SET.has(col)) empty[col] = null;
    else empty[col] = "";
  }
  empty["Exertional CP"] = "No";
  return empty as PatientInput;
}

/** Sample verified patient from src/test_manual_patient.py for quick testing / demonstration */
export function createSamplePatient(): { patient: PatientInput; drafts: NumericDrafts } {
  const patient: PatientInput = {
    Age: 62,
    Weight: 82,
    Length: 170,
    Sex: "Male",
    BMI: 28.4,
    DM: "Yes",
    HTN: "Yes",
    "Current Smoker": "No",
    "EX-Smoker": "Yes",
    FH: "No",
    Obesity: "No",
    CRF: "No",
    CVA: "No",
    "Airway disease": "No",
    "Thyroid Disease": "No",
    CHF: "No",
    DLP: "Yes",
    BP: 145,
    PR: 78,
    Edema: "No",
    "Weak Peripheral Pulse": "No",
    "Lung rales": "No",
    "Systolic Murmur": "No",
    "Diastolic Murmur": "No",
    "Typical Chest Pain": "Yes",
    Dyspnea: "Yes",
    "Function Class": 2,
    Atypical: "No",
    Nonanginal: "No",
    "Exertional CP": "No",
    "LowTH Ang": "No",
    "Q Wave": "No",
    "St Elevation": "No",
    "St Depression": "Yes",
    Tinversion: "Yes",
    LVH: "No",
    "Poor R Progression": "No",
    BBB: "None",
    FBS: 112,
    CR: 1.1,
    TG: 185,
    LDL: 128,
    HDL: 36,
    BUN: 18,
    ESR: 22,
    HB: 13.8,
    K: 4.1,
    Na: 140,
    WBC: 8200,
    Lymph: 28,
    Neut: 65,
    PLT: 230,
    "EF-TTE": 45,
    "Region RWMA": 1,
    VHD: "None",
  };

  const drafts: NumericDrafts = {
    Age: "62",
    Weight: "82",
    Length: "170",
    BMI: "28.4",
    BP: "145",
    PR: "78",
    FBS: "112",
    CR: "1.1",
    TG: "185",
    LDL: "128",
    HDL: "36",
    BUN: "18",
    ESR: "22",
    HB: "13.8",
    K: "4.1",
    Na: "140",
    WBC: "8200",
    Lymph: "28",
    Neut: "65",
    PLT: "230",
    "EF-TTE": "45",
  };

  return { patient, drafts };
}

/** Parse a numeric text draft. Returns null for empty or non-numeric text. */
export function parseNumericDraft(text: string): number | null {
  const t = text.trim();
  if (t === "") return null;
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function formatBound(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/**
 * Distinguishes required / invalid data type / outside training range.
 * Out-of-range is a WARNING only: values are never clamped or replaced.
 */
export function validatePatient(form: PatientInput, drafts: NumericDrafts): FieldIssue[] {
  const issues: FieldIssue[] = [];
  const values = form as unknown as LooseRecord;

  for (const col of MODEL_COLUMNS) {
    const spec = FIELD_SPECS[col];
    const value = values[col];

    if (spec.kind === "constantNo") continue;

    if (spec.kind === "number") {
      const draft = (drafts as Partial<Record<string, string>>)[col] ?? "";
      if (value === null || value === undefined) {
        if (draft.trim() !== "") {
          issues.push({ column: col, severity: "invalid", message: "Enter a valid number." });
        } else {
          issues.push({ column: col, severity: "required", message: "Required." });
        }
      } else if (typeof value === "number") {
        const [min, max] = spec.range;
        if (value < min || value > max) {
          issues.push({
            column: col,
            severity: "range",
            message: `Value is outside the training-data range (${formatBound(min)}–${formatBound(max)}). Prediction may be less reliable.`,
          });
        }
      }
      continue;
    }

    if (spec.kind === "code") {
      if (value === null || value === undefined) {
        issues.push({ column: col, severity: "required", message: "Required." });
      } else if (typeof value !== "number" || !spec.codes.includes(value)) {
        issues.push({ column: col, severity: "invalid", message: "Select one of the listed codes." });
      }
      continue;
    }

    // yesno / sex / bbb / vhd
    if (value === "" || value === null || value === undefined) {
      issues.push({ column: col, severity: "required", message: "Required." });
    }
  }

  return issues;
}

/**
 * Single place that converts UI state into the exact model payload.
 * - Numeric binary columns: Yes -> 1, No -> 0 (numbers)
 * - Categorical Y/N columns: Yes -> "Y", No -> "N"
 * - BBB: None -> "N";  VHD: None -> "N"  (other spellings preserved exactly)
 * - Exertional CP: always "N"
 * Throws if any required value is missing.
 */
export function buildModelPayload(form: PatientInput): ModelPayload {
  const values = form as unknown as LooseRecord;
  const payload: Partial<ModelPayload> = {};
  const missing: string[] = [];

  for (const col of MODEL_COLUMNS) {
    const v = values[col];

    if (col === "Exertional CP") {
      payload[col] = "N";
    } else if (CONTINUOUS_SET.has(col) || CODE_SET.has(col)) {
      if (typeof v === "number") payload[col] = v;
      else missing.push(col);
    } else if (BINARY_NUMERIC_SET.has(col)) {
      if (v === "Yes") payload[col] = 1;
      else if (v === "No") payload[col] = 0;
      else missing.push(col);
    } else if (YN_SET.has(col)) {
      if (v === "Yes") payload[col] = "Y";
      else if (v === "No") payload[col] = "N";
      else missing.push(col);
    } else if (col === "Sex") {
      if (v === "Male" || v === "Female") payload[col] = v;
      else missing.push(col);
    } else if (col === "BBB") {
      if (v === "None") payload[col] = "N";
      else if (v === "LBBB" || v === "RBBB") payload[col] = v;
      else missing.push(col);
    } else if (col === "VHD") {
      if (v === "None") payload[col] = "N";
      else if (v === "mild" || v === "Moderate" || v === "Severe") payload[col] = v;
      else missing.push(col);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Cannot build payload; missing values: ${missing.join(", ")}`);
  }
  return payload as ModelPayload;
}

export interface PayloadCheck {
  ok: boolean;
  count: number;
  errors: string[];
}

/** Development-only structural check of a generated payload. */
export function verifyPayloadShape(payload: Record<string, unknown>): PayloadCheck {
  const errors: string[] = [];
  const keys = Object.keys(payload);

  if (keys.length !== EXPECTED_FEATURE_COUNT) {
    errors.push(`Expected ${EXPECTED_FEATURE_COUNT} keys, found ${keys.length}.`);
  }
  const expected: ReadonlySet<string> = new Set(MODEL_COLUMNS);
  const missing = MODEL_COLUMNS.filter((c) => !(c in payload));
  if (missing.length) errors.push(`Missing model columns: ${missing.join(", ")}`);

  const unexpected = keys.filter((k) => !expected.has(k));
  if (unexpected.length) errors.push(`Unexpected columns: ${unexpected.join(", ")}`);

  const targets = FORBIDDEN_TARGET_COLUMNS.filter((c) => c in payload);
  if (targets.length) errors.push(`Target columns must not be inputs: ${targets.join(", ")}`);

  return { ok: errors.length === 0, count: keys.length, errors };
}
