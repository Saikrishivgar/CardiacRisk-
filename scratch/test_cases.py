import requests

tests = [
    "Diabetes Mellitus: No",
    "Diabetes Mellitus: Yes",
    "History of Diabetes: No",
    "History of Diabetes: Yes",
    "Diabetes status not documented",
    "Denies diabetes",
    "Diabetes cannot be ruled out"
]

for t in tests:
    res = requests.post("http://localhost:8000/extract-clinical-data", json={"text": t}).json()
    val = res["extracted_features"].get("DM", {}).get("value", "Missing")
    
    if "DM" in res["uncertain_features"]:
        val = "Uncertain"
        
    print(f"'{t}' -> DM = {val}")
