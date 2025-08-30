from flask import Flask, request, jsonify, render_template, Response
from flask_cors import CORS
import numpy as np
import pandas as pd
import joblib
import os
import time
import string
import random
import json
import re

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

PASSWORDS_CSV = os.environ.get("COMMON_PASSWORDS_CSV", "common_passwords.csv")
KNN_PATH = os.environ.get("KNN_MODEL_PATH", "knn_model.pkl")

if os.path.exists(PASSWORDS_CSV):
    try:
        passwords_df = pd.read_csv(PASSWORDS_CSV)
    except Exception:
        passwords_df = pd.DataFrame({"password": []})
else:
    passwords_df = pd.DataFrame({"password": []})

try:
    knn_model = joblib.load(KNN_PATH) if os.path.exists(KNN_PATH) else None
except Exception:
    knn_model = None
    print("KNN model not found. Falling back to basic analysis.")

def shannon_entropy_bits(pwd: str) -> float:
    if not pwd:
        return 0.0
    from math import log2
    probs = [pwd.count(c) / len(pwd) for c in set(pwd)]
    H = -sum(p * log2(p) for p in probs)
    return round(H * len(pwd), 2)

def classes_used(pwd: str):
    return {
        "lower": any(c.islower() for c in pwd),
        "upper": any(c.isupper() for c in pwd),
        "digit": any(c.isdigit() for c in pwd),
        "symbol": any(c in string.punctuation for c in pwd),
        "length": len(pwd)
    }

def calculate_similarity_percentage(input_password, common_passwords):
    try:
        from Levenshtein import distance as levenshtein_distance
    except Exception:
        if not common_passwords:
            return 0.0
        if input_password in common_passwords:
            return 100.0
        return 0.0
    distances = []
    for common_password in common_passwords:
        max_len = max(len(input_password), len(common_password))
        if max_len == 0:
            continue
        dist = levenshtein_distance(input_password, common_password)
        similarity = 100 - ((dist / max_len) * 100)
        distances.append(similarity)
    max_similarity = max(distances) if distances else 0
    return round(max_similarity, 2)

def analyze_password_strength(password):
    score = 0
    feedback = []
    if len(password) >= 12:
        score += 25
        feedback.append("Strength: Adequate length (12+).")
    elif len(password) >= 8:
        score += 15
        feedback.append("Neutral: Medium length (8–11). Prefer 12+.")
    else:
        feedback.append("Weakness: Too short (<8).")
    if any(char.isupper() for char in password):
        score += 10
    else:
        feedback.append("Weakness: Add uppercase letters.")
    if any(char.islower() for char in password):
        score += 10
    else:
        feedback.append("Weakness: Add lowercase letters.")
    if any(char.isdigit() for char in password):
        score += 10
    else:
        feedback.append("Weakness: Add digits.")
    if any(char in string.punctuation for char in password):
        score += 10
    else:
        feedback.append("Weakness: Add symbols.")
    if len(set(password)) == len(password):
        score += 10
    else:
        feedback.append("Weakness: Avoid repeating characters.")
    sequences = [string.ascii_lowercase, string.ascii_uppercase, string.digits]
    sequential = any(seq[i:i+3] in password or seq[i:i+3][::-1] in password for seq in sequences for i in range(len(seq)-2))
    if not sequential:
        score += 10
    else:
        feedback.append("Weakness: Avoid sequential characters.")
    used = classes_used(password)
    class_count = sum([used["lower"], used["upper"], used["digit"], used["symbol"]])
    if class_count >= 3 and len(password) >= 12:
        score += 15
    return min(score, 100), feedback

def l33t_normalize(s: str) -> str:
    mapping = {"@":"a","4":"a","3":"e","1":"i","!":"i","|":"i","0":"o","5":"s","$":"s","7":"t","8":"b","9":"g","2":"z"}
    return "".join(mapping.get(ch, ch) for ch in s.lower())

def analyze_social_engineering(password, personal_info):
    analysis_report = []
    pwd_lower = password.lower()
    pwd_norm = l33t_normalize(pwd_lower)
    email = personal_info.get('email address', '').lower().strip()
    email_username = email.split('@')[0] if '@' in email else email
    components = {
        'name': personal_info.get('name', '').lower().strip(),
        'email username': email_username,
        'date of birth': personal_info.get('date of birth', '').lower().strip(),
        'location': personal_info.get('location', '').lower().strip(),
        'phone number': personal_info.get('phone number', '').lower().strip(),
        'company': personal_info.get('company', '').lower().strip(),
        'address': personal_info.get('address', '').lower().strip(),
    }
    used_personal = False
    for key, value in components.items():
        if not value:
            analysis_report.append(f"Strength: No {key} provided for analysis.")
            continue
        val_norm = l33t_normalize(value)
        if value in pwd_lower or val_norm in pwd_norm:
            analysis_report.append(f"Weakness: Password contains your {key}.")
            used_personal = True
        else:
            substrings = sorted({value[i:j] for i in range(len(value)) for j in range(i+3, len(value)+1)}, key=len, reverse=True)
            matched = False
            for sub in substrings:
                sub_norm = l33t_normalize(sub)
                if sub in pwd_lower or sub_norm in pwd_norm:
                    analysis_report.append(f"Weakness: Password contains part of your {key} ('{sub}').")
                    used_personal = True
                    matched = True
            if not matched:
                analysis_report.append(f"Strength: Password does not contain your {key}.")
    return analysis_report, used_personal

def build_suggestion(password, personal_info):
    pwd = password or ""
    suggestion = pwd[:8]
    changes = []
    email = personal_info.get('email address', '')
    email_user = email.split('@')[0] if '@' in email else email
    for key in ['name', 'date of birth', 'location', 'phone number', 'company', 'address']:
        val = personal_info.get(key, '')
        for token in [val, email_user]:
            if not token:
                continue
            token = token.strip()
            if not token:
                continue
            pattern = re.compile(re.escape(token), re.IGNORECASE)
            if pattern.search(suggestion) or pattern.search(pwd):
                pwd = pattern.sub('', pwd)
                suggestion = pattern.sub('', suggestion)
                changes.append(f"Removed {key} token")
    if not any(c.isupper() for c in suggestion): suggestion += "A"; changes.append("Added uppercase")
    if not any(c.islower() for c in suggestion): suggestion += "a"; changes.append("Added lowercase")
    if not any(c.isdigit() for c in suggestion): suggestion += "7"; changes.append("Added digit")
    if not any(c in string.punctuation for c in suggestion): suggestion += "!"; changes.append("Added symbol")
    suggestion = re.sub(r"(1234|2345|3456|4567|5678|6789)", "7x9", suggestion)
    suggestion = re.sub(r"(abcd|bcde|cdef|qwerty|asdf)", "AxZ!", suggestion, flags=re.I)
    suggestion = re.sub(r"(.)\1{2,}", lambda m: m.group(1)+"x"+m.group(1), suggestion)
    pool = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*?"
    while len(suggestion) < 14:
        suggestion += random.choice(pool)
    suggestion = "".join(random.sample(suggestion, len(suggestion)))
    return suggestion, changes

@app.post('/analyze_password')
def analyze_password():
    data = request.get_json(force=True) or {}
    password = data.get('password', '') or ''
    name = data.get('name', '') or ''
    dob = data.get('dob', '') or ''
    location = data.get('location', '') or ''
    phone = data.get('phone', '') or ''
    email = data.get('email', '') or ''
    company = data.get('company', '') or ''
    address = data.get('address', '') or ''
    personal_info = {
        'name': name,
        'date of birth': dob,
        'location': location,
        'phone number': phone,
        'email address': email,
        'company': company,
        'address': address
    }
    if not password:
        return jsonify({"error": "Password is required."}), 400
    common_passwords = passwords_df['password'].tolist() if 'password' in passwords_df.columns else []
    similarity_percentage = calculate_similarity_percentage(password, common_passwords)
    base_score, feedback = analyze_password_strength(password)
    entropy_bits = shannon_entropy_bits(password)
    se_report, used_personal = analyze_social_engineering(password, personal_info)
    score = base_score
    if similarity_percentage >= 85:
        score = max(0, score - 25)
        feedback.insert(0, "Weakness: Very similar to a common password.")
    if used_personal:
        score = max(0, score - 20)
        feedback.insert(0, "Weakness: Contains personal information.")
    suggested_password, changes = build_suggestion(password, personal_info)
    advice = [
        "Use 14+ characters with at least 3 character classes.",
        "Avoid any personal information or predictable dates.",
        "Prefer passphrases of unrelated words, then add a number and a symbol.",
        "Use a unique password per site; enable a password manager and 2FA."
    ]
    return jsonify({
        "final_score": score,
        "similarity_percentage": similarity_percentage,
        "strength": {"entropy_bits": entropy_bits, "length": len(password), "classes": classes_used(password)},
        "feedback": feedback + se_report,
        "advice": advice,
        "suggestion": {"password": suggested_password, "changes": changes}
    })

@app.get('/generate_password')
def generate_password():
    length = max(8, min(int(request.args.get('length', 16)), 64))
    use_symbols = request.args.get('symbols', '1') not in ['0', 'false', 'False']
    use_numbers = request.args.get('numbers', '1') not in ['0', 'false', 'False']
    alphabet = string.ascii_letters
    if use_numbers: alphabet += string.digits
    if use_symbols: alphabet += string.punctuation
    alphabet = alphabet.replace('l', '').replace('I', '').replace('O', '').replace('0', '')
    generated = ''.join(random.SystemRandom().choice(alphabet) for _ in range(length))
    return jsonify({'password': generated})

def brute_force_crack(input_password, time_limit=120, personal_info=None):
    start = time.time()
    charset = string.ascii_letters + string.digits + string.punctuation
    n = len(input_password)
    found = ['_'] * n
    personal_components = []
    subs = {'a':['@','4'],'e':['3'],'i':['1','!'],'o':['0'],'s':['5','$'],'l':['1'],'t':['7'],'b':['8'],'g':['9'],'z':['2']}
    if personal_info:
        for key in ['name','date of birth','location','phone number','email username','company','address']:
            v = personal_info.get(key, '')
            if v: personal_components.append(v.lower())
    for i in range(n):
        ch = input_password[i]
        matched = False
        for info in personal_components:
            if i < len(info) and ch.lower() == info[i]:
                found[i] = ch
                yield f"Found character '{ch}' at position {i+1} via personal info"
                matched = True
                break
        if not matched:
            for info in personal_components:
                if i < len(info):
                    orig = info[i]
                    for s in subs.get(orig.lower(), []):
                        if ch == s:
                            found[i] = ch
                            yield f"Found character '{ch}' at position {i+1} via substitution of '{orig}'"
                            matched = True
                            break
                if matched: break
        if not matched:
            for c in charset:
                if time.time() - start > time_limit:
                    yield "Time limit exceeded. Password could not be found."
                    return
                if c == ch:
                    found[i] = c
                    yield f"Found character '{c}' at position {i+1} via brute-force"
                    matched = True
                    break
        yield f"Cracked so far: {''.join(found)}"
    cracked = ''.join(found)
    if cracked == input_password:
        yield f"Password cracked successfully: {cracked}"
    else:
        yield "Failed to crack the password within the given time limit."

@app.get('/crack_password_stream/<string:input_password>')
def crack_password_stream(input_password):
    time_limit = request.args.get('time_limit', default=120, type=int)
    use_personal_info = request.args.get('use_personal_info', 'false') == 'true'
    personal_info = {}
    if use_personal_info:
        full_name = request.args.get('full_name', '')
        if full_name: personal_info['name'] = full_name
        personal_info['date of birth'] = request.args.get('dob', '')
        personal_info['location'] = request.args.get('location', '')
        personal_info['phone number'] = request.args.get('phone', '')
        personal_info['company'] = request.args.get('company', '')
        personal_info['address'] = request.args.get('address', '')
        email = request.args.get('email', '')
        email_username = email.split('@')[0] if '@' in email else email
        personal_info['email username'] = email_username
    def stream():
        for msg in brute_force_crack(input_password, time_limit=time_limit, personal_info=personal_info):
            yield f"data: {msg}\n\n"
    return Response(stream(), content_type='text/event-stream')

@app.get('/')
def index():
    return render_template('PasscheckUI.html')

@app.get('/healthz')
def healthz():
    return {"ok": True}, 200

if __name__ == '__main__':
    app.run(debug=True)
