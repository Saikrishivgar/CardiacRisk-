import requests

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
    res = requests.post("http://localhost:8000/extract-clinical-data", json={"text": t}).json()
    extracted = res.get("extracted_features", {})
    
    found = False
    for k, v in extracted.items():
        if k != "Exertional CP":
            print(f"'{t}' -> {k} = {v['value']}")
            found = True
            break
            
    if not found:
        print(f"'{t}' -> NOTHING FOUND")
