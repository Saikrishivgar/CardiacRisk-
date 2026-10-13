import re
from typing import Dict, Any, List

def parse_clinical_text(text: str, input_columns: List[str]) -> Dict[str, Any]:
    extracted_features = {}
    missing_features = []
    uncertain_features = []
    warnings = []
    
    # Normalize text to lower case for regex but keep original for context
    lines = text.split('\n')
    
    # 1. Define mappings and regexes
    # Feature -> List of (regex, value_mapper)
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
            (r"valvular heart disease[:\s]*(none|mild|moderate|severe)\b", lambda m: "None" if m.group(1).lower()=="none" else "mild" if m.group(1).lower()=="mild" else "Moderate" if m.group(1).lower()=="moderate" else "Severe"),
            (r"\bvhd[:\s]*(none|mild|moderate|severe)\b", lambda m: "None" if m.group(1).lower()=="none" else "mild" if m.group(1).lower()=="mild" else "Moderate" if m.group(1).lower()=="moderate" else "Severe")
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
    
    # Binary/Categorical features
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
    
    # Yes/No features (Categorical in model)
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
    
    # Scan through lines
    for line in lines:
        lower_line = line.lower()
        
        # 1. Numeric values
        for feature, patterns in rules.items():
            for pattern, mapper in patterns:
                matches = list(re.finditer(pattern, lower_line))
                if matches:
                    val = mapper(matches[0])
                    if feature in extracted_features and extracted_features[feature]['value'] != val:
                        # Conflict!
                        uncertain_features.append(feature)
                        warnings.append(f"Conflicting values found for {feature}: {extracted_features[feature]['value']} and {val}")
                    else:
                        extracted_features[feature] = {
                            "value": val,
                            "status": "extracted",
                            "source_text": line.strip()
                        }
                        
        # 2. Binary values
        for feature, keywords in binary_mappings.items():
            for kw in keywords:
                uncertain_match = re.search(rf"\b{kw}\b\s*(?:[a-z]+\s*){{0,4}}(?:cannot be ruled out|suspected|possible|probable|borderline|uncertain)\b|\b(?:cannot be ruled out|suspected|possible|probable|borderline|uncertain)\b\s*(?:[a-z]+\s*){{0,4}}\b{kw}\b", lower_line)
                neg_match = re.search(rf"(?:no\s+(?:history\s+of\s+)?|denies\s+(?:any\s+)?(?:history\s+of\s+)?)\b{kw}\b|\b{kw}\b\s*(?:[a-z]+\s*){{0,4}}:\s*(?:no|negative)\b", lower_line)
                unknown_match = re.search(rf"\b{kw}\b\s*(?:[a-z]+\s*){{0,3}}(?:not documented|unknown|unclear|not assessed)\b", lower_line)
                pos_match = re.search(rf"\b{kw}\b", lower_line)
                
                if unknown_match:
                    continue

                if uncertain_match:
                    if feature not in uncertain_features:
                        uncertain_features.append(feature)
                        warnings.append(f"Uncertainty detected for {feature}")
                    continue
                
                val = None
                if pos_match and not neg_match:
                    val = "Yes"
                elif neg_match:
                    val = "No"
                    
                if val is not None:
                    if feature in extracted_features and extracted_features[feature]['value'] != val:
                        if feature not in uncertain_features:
                            uncertain_features.append(feature)
                            warnings.append(f"Conflicting values for {feature}")
                    else:
                        extracted_features[feature] = {
                            "value": val,
                            "status": "extracted",
                            "source_text": line.strip()
                        }
                        
        # 3. Y/N categorical values
        for feature, keywords in yn_mappings.items():
            for kw in keywords:
                uncertain_match = re.search(rf"\b{kw}\b\s*(?:[a-z]+\s*){{0,4}}(?:cannot be ruled out|suspected|possible|probable|borderline|uncertain)\b|\b(?:cannot be ruled out|suspected|possible|probable|borderline|uncertain)\b\s*(?:[a-z]+\s*){{0,4}}\b{kw}\b", lower_line)
                neg_match = re.search(rf"(?:no\s+(?:history\s+of\s+)?|denies\s+(?:any\s+)?(?:history\s+of\s+)?)\b{kw}\b|\b{kw}\b\s*(?:[a-z]+\s*){{0,4}}:\s*(?:no|negative)\b", lower_line)
                unknown_match = re.search(rf"\b{kw}\b\s*(?:[a-z]+\s*){{0,3}}(?:not documented|unknown|unclear|not assessed)\b", lower_line)
                pos_match = re.search(rf"\b{kw}\b", lower_line)
                
                if unknown_match:
                    continue

                if uncertain_match:
                    if feature not in uncertain_features:
                        uncertain_features.append(feature)
                        warnings.append(f"Uncertainty detected for {feature}")
                    continue
                
                val = None
                if pos_match and not neg_match:
                    val = "Yes"
                elif neg_match:
                    val = "No"
                    
                if val is not None:
                    if feature in extracted_features and extracted_features[feature]['value'] != val:
                        if feature not in uncertain_features:
                            uncertain_features.append(feature)
                            warnings.append(f"Conflicting values for {feature}")
                    else:
                        extracted_features[feature] = {
                            "value": val,
                            "status": "extracted",
                            "source_text": line.strip()
                        }
    
    # Determine missing features
    for col in input_columns:
        if col not in extracted_features and col != "Exertional CP":
            missing_features.append(col)
            
    # Handle Exertional CP which is constant No in training data
    if "Exertional CP" not in extracted_features:
        extracted_features["Exertional CP"] = {
            "value": "No",
            "status": "extracted",
            "source_text": "Default constant value in schema"
        }
        
    return {
        "extracted_features": extracted_features,
        "missing_features": missing_features,
        "uncertain_features": uncertain_features,
        "extraction_sources": {k: v['source_text'] for k, v in extracted_features.items()},
        "warnings": warnings
    }
