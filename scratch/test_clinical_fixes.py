import re

def map_vhd(val):
    v = val.lower()
    return "None" if v == "none" else "mild" if v == "mild" else "Moderate" if v == "moderate" else "Severe"

rules = {
    "Age": [(r"age[:\s]*(\d+)", lambda m: int(m.group(1)))],
    "Weight": [(r"weight[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))],
    "Length": [
        (r"length[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1))),
        (r"height[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))
    ],
    "Sex": [
        (r"sex[:\s]*(male|female|m|f)\b", lambda m: "Male" if m.group(1).lower().startswith('m') else "Female"),
        (r"gender[:\s]*(male|female|m|f)\b", lambda m: "Male" if m.group(1).lower().startswith('m') else "Female")
    ],
    "BMI": [(r"bmi[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))],
    "FBS": [
        (r"fasting blood sugar[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1))),
        (r"fasting glucose[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1))),
        (r"\bfbs[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))
    ],
    "CR": [
        (r"(?:serum\s+)?creatinine[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1))),
        (r"\bcr[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))
    ],
    "TG": [
        (r"triglycerides[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1))),
        (r"\btg[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))
    ],
    "LDL": [(r"ldl(?: cholesterol)?[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))],
    "HDL": [(r"hdl(?: cholesterol)?[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))],
    "BUN": [
        (r"blood urea nitrogen[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1))),
        (r"\bbun[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))
    ],
    "ESR": [
        (r"erythrocyte sedimentation rate[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1))),
        (r"\besr[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))
    ],
    "HB": [
        (r"hemoglobin[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1))),
        (r"\bhb[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))
    ],
    "K": [
        (r"potassium[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1))),
        (r"\bk[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))
    ],
    "Na": [
        (r"sodium[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1))),
        (r"\bna[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))
    ],
    "WBC": [
        (r"white blood cell(?: count)?[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1))),
        (r"\bwbc[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))
    ],
    "Lymph": [(r"\blymph(?:ocytes)?[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))],
    "Neut": [(r"\bneut(?:rophils)?[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))],
    "PLT": [
        (r"platelets[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1))),
        (r"\bplt[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))
    ],
    "EF-TTE": [
        (r"ejection fraction[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1))),
        (r"\bef-tte[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1))),
        (r"\bef[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))
    ],
    "BP": [
        (r"blood pressure[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1))),
        (r"\bbp[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))
    ],
    "PR": [
        (r"pulse rate[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1))),
        (r"heart rate[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1))),
        (r"\bpr[:\s]*(\d+(?:\.\d+)?)", lambda m: float(m.group(1)))
    ],
    "Region RWMA": [
        (r"regional wall motion abnormality(?:\s*\(rwma\))?[:\s]*(\d+)", lambda m: int(m.group(1))),
        (r"rwma[:\s]*(\d+)", lambda m: int(m.group(1)))
    ],
    "VHD": [
        (r"valvular heart disease[:\s]*(none|mild|moderate|severe)\b", lambda m: map_vhd(m.group(1))),
        (r"\bvhd[:\s]*(none|mild|moderate|severe)\b", lambda m: map_vhd(m.group(1)))
    ],
    "Function Class": [
        (r"(?:nyha\s*)?function(?:al)? class[:\s]*(\d+)", lambda m: int(m.group(1))),
        (r"nyha\s*(?:class\s*)?(\d+)", lambda m: int(m.group(1))),
        (r"fc[:\s]*(\d+)", lambda m: int(m.group(1)))
    ],
    "BBB": [
        (r"(left|right)\s+bundle branch block", lambda m: "LBBB" if m.group(1).lower() == "left" else "RBBB"),
        (r"\b(lbbb|rbbb)\b", lambda m: m.group(1).upper()),
        (r"bundle branch block[:\s]*none", lambda m: "None"),
        (r"no\s+bundle branch block", lambda m: "None")
    ]
}

binary_mappings = {
    "DM": ["diabetes", "dm"],
    "HTN": ["hypertension", "htn"],
    "Current Smoker": ["current smoker", "smoking: yes", "smoker: yes"],
    "EX-Smoker": ["ex-smoker", "former smoker"],
    "FH": ["family history", "fh"],
    "Edema": ["edema"],
    "Typical Chest Pain": ["typical chest pain", "typical angina"],
    "Q Wave": ["q wave"],
    "St Elevation": ["st elevation", "st-elevation"],
    "St Depression": ["st depression", "st-depression"],
    "Tinversion": ["t inversion", "t-inversion", "t wave inversion", "t-wave inversion"],
}

yn_mappings = {
    "Obesity": ["obesity", "obese"],
    "CRF": ["crf", "chronic renal failure"],
    "CVA": ["cva", "stroke"],
    "Airway disease": ["airway disease", "copd", "asthma"],
    "Thyroid Disease": ["thyroid disease", "hypothyroidism", "hyperthyroidism"],
    "CHF": ["chf", "congestive heart failure"],
    "DLP": ["dlp", "dyslipidemia"],
    "Weak Peripheral Pulse": ["weak peripheral pulse"],
    "Lung rales": ["lung rales", "rales"],
    "Systolic Murmur": ["systolic murmur"],
    "Diastolic Murmur": ["diastolic murmur"],
    "Dyspnea": ["dyspnea", "shortness of breath", "sob"],
    "Atypical": ["atypical chest pain", "atypical angina"],
    "Nonanginal": ["nonanginal", "non-anginal"],
    "LowTH Ang": ["lowth ang", "low threshold angina"],
    "LVH": ["lvh", "left ventricular hypertrophy"],
    "Poor R Progression": ["poor r progression", "prwp", "poor r wave progression", "poor r-wave progression"],
}

tests = [
    "Family History of Cardiovascular Disease: No",
    "Potassium: 4.7 mmol/L",
    "Sodium: 139 mmol/L",
    "Regional Wall Motion Abnormality (RWMA): 2",
    "Valvular Heart Disease: Mild",
    "Blood Pressure: 120",
    "Pulse Rate: 75",
    "Creatinine: 1.2",
    "Erythrocyte Sedimentation Rate: 15",
    "Function Class: 2",
    "T-wave inversion: Yes",
    "Poor R wave progression: No",
    "Left Bundle Branch Block"
]

for t in tests:
    lower_line = t.lower()
    found = False
    
    # 1. Numeric/Categorical Rules
    for feature, patterns in rules.items():
        for pattern, mapper in patterns:
            matches = list(re.finditer(pattern, lower_line))
            if matches:
                val = mapper(matches[0])
                print(f"'{t}' -> {feature} = {val}")
                found = True
                
    # 2. Binary
    for feature, keywords in binary_mappings.items():
        for kw in keywords:
            uncertain_match = re.search(rf"\b{kw}\b\s*(?:[a-z]+\s*){{0,4}}(?:cannot be ruled out|suspected|possible|probable|borderline|uncertain)\b|\b(?:cannot be ruled out|suspected|possible|probable|borderline|uncertain)\b\s*(?:[a-z]+\s*){{0,4}}\b{kw}\b", lower_line)
            neg_match = re.search(rf"(?:no\s+(?:history\s+of\s+)?|denies\s+(?:any\s+)?(?:history\s+of\s+)?)\b{kw}\b|\b{kw}\b\s*(?:[a-z]+\s*){{0,4}}:\s*(?:no|negative)\b", lower_line)
            unknown_match = re.search(rf"\b{kw}\b\s*(?:[a-z]+\s*){{0,3}}(?:not documented|unknown|unclear|not assessed)\b", lower_line)
            pos_match = re.search(rf"\b{kw}\b", lower_line)
            
            if unknown_match or uncertain_match:
                continue
                
            val = None
            if pos_match and not neg_match:
                val = "Yes"
            elif neg_match:
                val = "No"
                
            if val is not None:
                print(f"'{t}' -> {feature} = {val}")
                found = True

    # 3. YN
    for feature, keywords in yn_mappings.items():
        for kw in keywords:
            uncertain_match = re.search(rf"\b{kw}\b\s*(?:[a-z]+\s*){{0,4}}(?:cannot be ruled out|suspected|possible|probable|borderline|uncertain)\b|\b(?:cannot be ruled out|suspected|possible|probable|borderline|uncertain)\b\s*(?:[a-z]+\s*){{0,4}}\b{kw}\b", lower_line)
            neg_match = re.search(rf"(?:no\s+(?:history\s+of\s+)?|denies\s+(?:any\s+)?(?:history\s+of\s+)?)\b{kw}\b|\b{kw}\b\s*(?:[a-z]+\s*){{0,4}}:\s*(?:no|negative)\b", lower_line)
            unknown_match = re.search(rf"\b{kw}\b\s*(?:[a-z]+\s*){{0,3}}(?:not documented|unknown|unclear|not assessed)\b", lower_line)
            pos_match = re.search(rf"\b{kw}\b", lower_line)
            
            if unknown_match or uncertain_match:
                continue
                
            val = None
            if pos_match and not neg_match:
                val = "Yes"
            elif neg_match:
                val = "No"
                
            if val is not None:
                print(f"'{t}' -> {feature} = {val}")
                found = True

    if not found:
        print(f"'{t}' -> NOTHING FOUND")
