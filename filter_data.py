import json
import re
import sys

def main():
    file_path = '/Users/manishkumar/.gemini/antigravity/scratch/public_portal/data.js'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    match = re.search(r'const visaData = (\{.*\});', content, re.DOTALL)
    if not match:
        print("Could not find visaData")
        sys.exit(1)
        
    json_str = match.group(1)
    try:
        data = json.loads(json_str)
    except Exception as e:
        print(f"JSON error: {e}")
        sys.exit(1)

    exclusion_keywords = [
        "雇用契約書", 
        "労働条件通知書",
        "登記事項証明書",
        "決算",
        "会社案内",
        "履歴書",
        "卒業証明書",
        "学位",
        "実務経験",
        "理由書"
    ]

    for v_id, v_data in data.items():
        # skip those already updated manually
        if v_id in ["47", "51", "58", "60"]:
            continue
            
        if 'extension' in v_data['requirements']:
            new_extension = []
            for doc in v_data['requirements']['extension']:
                exclude = False
                for kw in exclusion_keywords:
                    if kw in doc:
                        # Exception for 経営・管理 (42): keep 決算 and 登記
                        if v_id == "42" and kw in ["決算", "登記事項証明書"]:
                            continue
                        exclude = True
                        break
                if not exclude:
                    new_extension.append(doc)
            
            v_data['requirements']['extension'] = new_extension

    new_json_str = json.dumps(data, ensure_ascii=False, indent=4)
    # The original keys were double quoted, json.dumps does this.
    
    new_content = content[:match.start(1)] + new_json_str + content[match.end(1):]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print("Updated data.js successfully.")

if __name__ == "__main__":
    main()
