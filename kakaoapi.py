import requests
import json
import os

# 1. API 설정
rest_api_key = "442ebf9f7285d9ec8bec491e3d33d712"
url = "https://dapi.kakao.com/v3/search/book"
headers = {"Authorization": f"KakaoAK {rest_api_key}"}
params = {"query": "파이썬", "size": 10}

# 2. API 호출
response = requests.get(url, headers=headers, params=params)

if response.status_code == 200:
    new_documents = response.json()['documents']
    
    file_path = 'json/data.json'
    final_data = {}

    # 3. 기존 데이터 불러오기
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            try:
                final_data = json.load(f)
            except json.JSONDecodeError:
                final_data = {}

    # 4. [핵심 수정] 기존 'kakaoBooks' 리스트가 있으면 유지하고 그 뒤에 추가
    # 만약 kakaoBooks 키가 없으면 새로운 리스트로 생성합니다.
    if 'kakaoBooks' in final_data and isinstance(final_data['kakaoBooks'], list):
        # 기존 리스트 뒤에 새로운 데이터들을 이어 붙입니다 (Extend)
        final_data['kakaoBooks'].extend(new_documents)
        print(f"기존 데이터 뒤에 {len(new_documents)}건의 도서가 추가되었습니다.")
    else:
        # 키가 없거나 리스트가 아니면 새로 만듭니다.
        final_data['kakaoBooks'] = new_documents
        print("새로운 kakaoBooks 리스트가 생성되었습니다.")

    # 5. 파일 저장 (덮어쓰기가 아닌, 내용이 업데이트된 객체를 다시 저장)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, ensure_ascii=False, indent=4)
        
    print(f"최종 성공: {file_path} 파일의 맨 아랫줄에 데이터가 추가되었습니다.")
else:
    print(f"API 호출 에러: {response.status_code}")
