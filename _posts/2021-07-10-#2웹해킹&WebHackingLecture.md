---
title: "[모각코]2장 웹 해킹(2.5장까지) & WebHacking Lecture"
excerpt_separator: "<!--more-->"
toc: true
toc_sticky: true
categories:
  - 모각코
tags:
  - 모각코
  - Hacking
---

## 07-10 토요일

### 1. **개요**

- 웹 어플리케이션이 활성화되면서 중요 서비스들의 다수가 웹을 통해 이뤄지고 있음
- 수많은 웹 어플리케이션이 공격에 노출되어 있고 대규모 개인정보 유출 등 크고 작은 웹 해킹 사고들이 끊임없이 발생

### 2. **사례**

- DDoS
- 파일 업로드 공격
- 웹 쉘
- 구글 해킹(검색을 이용한 해킹)
- 크로스 사이트 스크립트 웜 배포

### 3. **실습 환경**

- APM(Apache, PHP, MYSQL)
- Web Proxy tool
  - parosproxy = 기존에 가장 유명하면서 많이 쓰이는 프로그램이지만 현재는 수년간 업데이트가 이뤄지지 않아 쓰이지 않음
  - 현재는 Burp Suit, OWASP-ZAP, Acunetix 등이 주류로 쓰임

### 구글 해킹

- 구글 자체 해킹이 아닌 구글 검색을 활용한 해킹
- 구글은 방대한 사이트 자료를 갖고 있어 여러 검색 고급 연산자를 지원함  
  구글이 지원하는 검색 부울 연산자와 검색 연산자 다음과 같음

  1. **검색을 이용한 공격**

  - 검색 연산자

    | 연산자 |               사용 예                |                            설명                             |
    | :----: | :----------------------------------: | :---------------------------------------------------------: |
    |  AND   |  "가"&"나", "가""나", "가" AND "나"  |       "가"와 "나"의 문자열을 모두 포함하는 문서 검색        |
    |   OR   |       "가"\|"나", "가" OR "나"       |      "가" 혹은 "나"의 문자열을 모두 포함하는 문서 검색      |
    |  NOT   | "가나다"-"한글", "가나다" NOT "한글" | "가나다" 문자열을 포함하고 "한글" 문자열을 제외한 문서 검색 |
    |   ""   |        "security conference"         |       인용부호를 사용해 정확한 단어 혹은 문구를 검색        |
    |   ~    |               ~hacking               |             동의어 또는 관련 검색어와 함께 검색             |
    |   \*   |           \* 모아 \* 이다            |  알 수 없는 단어가 위치한 부분에 "\*" 연산자를 사용해 검색  |
    |   ..   |          월드컵 1950..2000           | 숫자 사이에 ".."를 넣어 가격, 수치와 같이 범위 문서를 검색  |

  - 구글 검색 고급 연산자

    |  연산자   |       사용 예       |                  설명                  |
    | :-------: | :-----------------: | :------------------------------------: |
    |  inurl:   |      inurl:abc      |    주소에 "abc"가 들어간 문서 검색     |
    | intitle:  |    intitle:해킹     |   Title에 "해킹" 이 들어간 문서 검색   |
    |  intext:  |    intext:로그인    |   본문에 "로그인"이 들어간 문서 검색   |
    |   Site:   |   site:http://abc   |       http://abc 문서에서의 검색       |
    |   link:   |   link:http://abc   |   http://abc의 링크가 걸린 문서 검색   |
    | inanchor  | Inanchor:http://abc | http://abc가 텍스트로 표현된 문서 검색 |
    | filetype: |    filetype:jpg     |            jpg 확장자 검색             |
    |  cache:   |  cache:http://abc   |  구글에 저장된 http://abc 페이지 보기  |
    | numrange: | numrange:1000-2000  |   1000-2000 숫자 범위의 결과를 검색    |

    1. **백업 파일의 노출**

       - 대부분의 편집용 프로그램에서 기본적으로 제공하는 백업 기능은  
         특정 파일이 편집 중이거나 삭제되었을 때 백업 파일 저장
       - 홈 폴더에 관리자의 실수로 백업 파일을 남겨놓는 경우

    2. **관리자 페이지 권한의 실수, 노출**

       - /admin/ 이나 /manager/와 같은 관리자 페이지의 경우 "site:xxx.com, inurl:admin" 같은 쿼리를 통해  
         관리자 페이지를 찾아 낼 수 있음

    3. **기밀 업로드 파일의 관리 실수**

       - 파일 업로드 기능이 있는 게시판의 경우 폴더에 업로드한 파일을 저장
       - 만약 비밀 글이 있고 파일이 첨부되어 있다면, "inurl:/board/data/, site:xxx.com"과 같은 쿼리를 통해
         비밀 글의 첨부 파일을 받아 볼 수 있음

    4. **디렉터리 리스팅**

       - 웹 서버의 폴더 요청 시 index 파일이 존재하지 않을 경우 파일 목록을 출력해주는 Apache의 옵션
       - 환경에 따라 기본 옵션이 켜져 있는 경우가 많아 중요 정보 파일이 노출되는 사례가 많음

    5. **웹 쉘 노출**

       - 웹 쉘(웹 해킹에 자주 쓰이는 백도어)을 찾아낸다면, 해당 서버는 공격을 거치지 않고 구글 해킹만으로 점령 가능
       - 유명 웹 쉘 등이 많이 사용되기 때문에 특정 문자열을 이용해 검색 쿼리를 제작하면, 많은 서버 획득 가능

    6. **실습**

    ![구글 검색](https://user-images.githubusercontent.com/66258691/125149571-ae338500-e174-11eb-921b-ee813a3c3638.png)

    ![구글검색2](https://user-images.githubusercontent.com/66258691/125149595-d28f6180-e174-11eb-9951-e61383b1540f.png)

  2. **구글 해킹 도구**

     - 검색 패턴 데이터 베이스 사이트 http://www.hackersforcharity.org/ghdb/
       ![ghdb](https://user-images.githubusercontent.com/66258691/125149737-a58f7e80-e175-11eb-8f19-9148b0f2bdac.png)

  3. **방어 기법**
     - 특정 웹 사이트를 수집할 때 무분별한 수집을 방지하기 위한 '로봇 배제 표준' 규약

### 파일 업로드

- 이 취약점을 통해 공격하게 되면 해커는 시스템 명령어 실행 권한을 획들할 수 있음
- 공격 방법도 타 공격 방법에 비해 쉬운 편

  1. **웹 쉘 제작**

     - 웹 쉘 업로드 공격이 성공한 후에 해커들은 데이터베이스르 접속하는 PHP 파일을 열람  
       DB 계정을 획득하고, 개인정보를 탈취

  2. **취약점 공격**

     - 대부분의 게시판들은 사용자가 원하는 자료나 이미지를 올릴 수 있도록 구현됨
     - 취약점 공격은 이런 특성을 이용해 공격하는 방식

  3. **파일 업로드 우회 기법**

     - php.kr 우회 기법

       - Apache의 AddLanguage 옵션에 의해 발생, 파일명이 vuln.php.kr 일 경우에도 PHP파일이 실행됨
       - 해당 취약점은 확장자가 php가 아니므로 필터링을 우회할 수 있음

     - .htaccess 업로드 취약점

       - Apache 설정 파일인 .htaccess 를 업로드하게 되면 여러 아파치 옵션 변경 가능
       - *Addtype*과 같은 옵션을 통해 txt, jpg 등 원하는 확장자를 PHP코드로 실행 가능

     - 환경 취약점

       - 윈도우 환경에서는 파일 업로드시 콜론을 붙일 경우 그 뒤에 문자열 삭제되어 업로드
       - abc.php:jpg 파일을 업로드 할 경우 abc.php 파일이 업로드 됨

  4. **파일 업로드 방어 기법**

     - 업로드 파일명의 확장자를 파싱해서 php,htm 등 PHP 실행 권한을 가진 확장자를 필터링
     - 하지만 이는 몇 가지 우회 기법과 또 다른 공격 방법 혹은 코드 실수 등을 통해 취약점이 발생할 확률이 높음

     1. "php_value engine off" 내용의 .htaccess 파일을 업로드 폴더에 생성
     2. .htaccess 파일을 사용자가 업로드하지 못하도록 필터링

---

## Web Hacking Lecture 1 & 2

### 웹이란?

- 해킹 - 본래의 의도와는 다른 행위를 발생시키는 것
- 웹 - HTTP를 이용하여 정보를 공유하는 통신 서비스
- 웹 서버(Web Server) - 서비스를 제공하는 대상
- 웹 클라이언트(Web Client) - 서비스를 받는 사용자

### 웹 기초 지식

- Web Browser - 웹에 접속하기 위해 사용하는 소프트웨어
- Web Resource - 웹 상에 존재하는 모든 콘텐츠(HTML, CSS, JS, PDF, PNG 등)
- URI(URL) - Uniform Resource Identifier의 약자로 리소스를 식별하기 위한 식별자
- HTTP(HyperText Transfer Protocol) - 인터넷 서비스 대상 간 통신 규약, 웹을 이용하기 위한 통신 규약
- HTTPS(HyperText Transfer Protocol Secure) - 기존 HTTP 데이터를 암호화하여 통신
- Cookie - 웹 브라우저에 저장하는 데이터
- Session - 서버에 저장하는 데이터
- Domain Name - 네트워크상에서 컴퓨터를 식별하는 이름 (ex. www.naver.com은 네이버의 서버 컴퓨터를 식별하는 이름)
- Server - 인터넷상에서 사용자에게 서비스를 제공하는 컴퓨터
- Web Server - Web Browser 와 HTTP를 이용하여 통신하는 서버
- Application - 서버에서 설정한 특정 기능들을 수행하는 소프트웨어
- DataBase(DB) - 데이터를 저장하기 위해 사용하는 데이터 저장소

### Web Browser

|                        | Chrome |      Edge      |     Safari      |    Firefox    |
| :--------------------: | :----: | :------------: | :-------------: | :-----------: |
|         제조사         |  구글  | 마이크로소프트 |      애플       |  모질라 재단  |
|    JavaScript 엔진     |   V8   |   ChakraCore   | JavaScript Core | Spider Monkey |
|     HTML/CSS 엔진      | Blink  |   Edge HTML    |     Webkit      |     Gecko     |
| 사생활 보호/보장(EDNS) |   X    |       X        |        X        |       O       |
|    패스워드 동기화     |   O    |       O        |        O        |       O       |

### Web Resource

- 웹 리소스를 가리키는 주소는 URL.
- 대표적인 웹 리소스
  1. HTML: 웹 문서의 뼈대를 구축하기 위한 마크업 언어
  2. CSS: HTML이 표시되는 방법을 정의하는 스타일 시트 언어
  3. JS: Client Side Script를 이용하여 페이지 내에서의 행위들을 설정
  4. Etc: 문서, 이미지, 동영상, 폰트 등

### URI(URL)

- 리소스를 식별하기 위한 식별자
- URL은 리소스의 위치를 식별하기 위한 URI의 하위 개념

  <img width="960" alt="c974f9087eddea560f7ff225c5d6e35a0cfdfd1a1df14c284271ff321846e497" src="https://user-images.githubusercontent.com/66258691/125150288-ac1ff500-e179-11eb-9d78-89cd7b507753.png">

  - Scheme - 웹 서버에 접속할 때 어떤 체계를(프로토콜)를 이용할지에 대한 정보
  - Host - Authority의 일부로써 접속할 웹 서버의 호스트에 대한 정보
  - Port - Authority의 일부로써 접속할 웹 서버의 포트에 대한 정보
  - Path - 접속할 웹 서버의 경로에 대한 정보를가지고 있으면 /로 구분
  - Query - 웹 서버에 전달하는 파라미터이며 URI에서 ? 문자 뒤에 붙음
  - Fragment - 메인 리소스 내에 존재하는 서브 리소스에 접근할 때 이를 식별하기 위한 정보,  
    URI에서 # 문자 뒤에 붙음
    ```
    ex) http://example.com:80/path?search=1#fragment
    Scheme = http://
    Host = example.com
    Path = /path
    Query = ?search=1
    Fragment = #fragment
    ```

### Encoding

- Encoding - 문자 또는 기호 등의 정보, 형태를 표준화, 보안 등의 목적으로 다른 형태나 형식으로 변환하는 처리  
   혹은 그 처리 방식
- Decoding - 변환된 형태를 원래 형태로 변경하는 것

- 웹에서 사용하는 대표적인 인코딩
  1. URL
  2. HTML

### HTTP

- HTTP 또는 HTTPS는 URI의 구성 요소 중 Scheme(Protcol)에 해당
- TCP 혹은 TLS 를 사용해 통신하고 기본 포트로 80(HTTP), 443(HTTPS) 포트를 사용

- **HTTP Request** - HTTP Request는 서버에 대한 요청을 의미

  - HTTP Request의 구조 중 가장 첫번째 줄에는 사용자가 서버에 요청 시 수행하고자 하는 동작인  
    Method, 요청하는 웹 리소스의 경로인 Path, 사용하는 HTTP의 버전을 나타내는 Version으로 구성됨  
    두 번째 줄부터는 Header 부분 Header는 이름: 값 형태로 이루어짐 Header는 상황에 따라 많은 데이터를 포함할 수 있기 때문에  
    Header 부분의 끝을 표시하기 위한 CRLF을 한 번 더 출력 마지막으로 사용자의 데이터를 담는 부분인 Body (CRLF = 줄바꿈)

  - 구성요소

    1. Method - 서버에 요청 시 수행하고자 하는 동작
       - Head - GET 메소드와 동일하지만, Response의 Body 부분은 받지 않고, Header만 받음
       - Get - 리소스를 요청 (ex. 게시물/프로필 보기, 이미지 등)
       - POST - 특정 리소스 생성 및 데이터 추가를 위해 값을 제출할 때 사용
       - PUT - 특정 리소스의 내용을 보낸 값으로 설정
       - PATCH - 특정 리소스의 내용 중 보낸 값의 key만 변경
       - DELETE - 특정 리소스 삭제
       - TRACE - 요청받은 값을 Response의 Body로 다시 클라이언트에게 되돌려줌
    2. Path - 사용자가 서버에 요청하는 웹 리소스의 경로
    3. Version - HTTP의 버전
    4. Header - 서버에 추가 정보를 전달하는 데이터 부분  
        사용자와 서버가 상호작용하기 위한 정보를 담는 부분(ex. 사용자 데이터의 처리 방식 및 형식에 대한 정보, 서버에서 사용자를 식별하기 위한 쿠키 등)
       - Host - 데이터를 보내는 서버의 주소
       - Cookie - 사용자를 식별하기 위한 정보
       - User-Agent - 사용자가 사용하는 프로그램의 정보
       - Refer = 페이지 이동 시 이전 URI의 정보
       - Content-Type - 사용자가 전달하는 데이터의 처리 방식과 형식
    5. Body = 사용자가 입력한 데이터가 서버에 전달 시 데이터를 담는 부분

- **HTTP Response**

  - HTTP Response는 사용자의 요청에 대한 서버의 응답
  - HTTP Response의 구조 중 가장 첫번째 줄에는 Version과 사용자의 요청에 대한 서버의 상태 응답 코드인 Status code로 구성  
    두 번째 줄부터는 Header 부분 Header 부분의 각 줄은 이름: 값의 형태로 이루어짐 Header의 끝을 표시하기 위해 CRLF를 한 번 더 출력한 후, 서버의 응답 데이터 부분인 Body로 구성

  - 구성요소
    1. Version = HTTP의 버전
    2. Status code = 사용자의 요청에 대한 서버의 처리 결과
       - 200번 영역 = 사용자의 요청에 대한 서버의 처리가 성공하였음을 나타냄
       - 300번 영역 = 사용자가 요청한 리소스가 다른 경로로 변경된 경우를 나타내는 영역
       - 400번 영역 = 사용자가 서버에 요청하는 구조 또는 데이터가 잘못되었음을 나타내는 영역
       - 500번 영역 = 서버의 에러와 관련된 영역
    3. Headr = 사용자와 상호작용하기 위한 데이터를 담는 부분
       - Content-Type = 서버의 응답 데이터를 웹 브라우저에서 처리할 방식과 형식
       - Content-Length = 서버가 사용자에게 응답해주는 데이터의 길이
       - Server = 서버가 사용하는 소프트웨어의 정보
       - Allow = 허용되는 Method 목록을 사용자에게 알려줄 때 사용
       - Location = 300번 영역의 응답 코드 사용 시 변경된 웹 리소스의 주소
       - Set-Cookie = 사용자에게 쿠키를 발급할 때 사용
    4. Body = 서버가 사용자에게 응답하는 데이터를 담는 부분

### Cookie

- 웹 브라우저는 HTTP Response의 Set-Cookie Header나 JavaScript document.cookie 를 통해 데이터를 쿠키에 저장
- 쿠키는 인증 상태를 포함할 수 있음
- 쿠키는 사용자의 브라우저에 저장되며, 인증상태를 쿠키에 저장하게 되면  
  사용자가 임의 사용자로 인증된 것 처럼 요청을 조작할 수 있음

### Session

- 앞서 쿠키에서 확인된 조작된 요청으로 인해 서버에 데이터를 저장하기 위해 Session을 사용
- 데이터를 서버에 저장하고 해당 데이터에 접근할 수 있는 유추할 수 없는 *랜덤한 문자열 키*를 만들어 응답, 이를 **Session ID**라고 함

### Domain Name / Host Name

- URI 구성 요소 중 Host는 웹 브라우저가 어디에 연결할지 정함
- IP Adress는 네트워크 상에서 통신이 이루어질 때 장치를 식별하기 위해 사용되는 주소  
  하지만, 이는 사람이 외우기 어려우므로 사람이 외우기 쉽고, 의미를 부여하기 위해 Domain Name을 사용

### 웹 서버 어플리케이션

1.  **Web Server**

    - 웹 서버는 사용자의 HTTP 요청을 해석하여 처리한 후 응답하여 주는 역할
    - nginx, Apache, Tomcat, IIS 등

2.  **Web Application**

    - 웹 어플리케이션은 사용자의 요청을 동적으로 처리할 수 있도록 만들어진 어플리케이션
    - 웹 어플리케이션을 작성할 때는 사용자가 요청한 내용을 동적으로 처리하기 위해 Web Application Language 사용
    - PHP, NodeJS, Python, Java 등

3.  **DataBase Management System**

    - DBMS 는 데이터베이스 내의 데이터 조회/수정/삽입을 용이하게 할 수 있도록 도와주는 서버 어플리케이션
    - MYSQL, MS-SQL 등을 DBMS라 하며 해당 어플리케이션들이 관리하는 데이터를 데이터베이스라고 함

### 웹 해킹

1.  **Client-side Attack**

    - 서비스 사용자에 대한 공격
    - 웹 서버가 제공하는 데이터가 공격자에 의해 변조되어 취약점 발생

2.  **Server-side Attack**
    - 서비스를 운용하는 서버에 대한 공격
    - 서버의 어플리케이션 코드 또는 다른 사용자의 정보 유출, 서버 탈취 등

---

## Client-side Basic

- 공격자는 쿠키나 세션에 저장된 세션 아이디를 탈취해 사용자 권한을 얻거나,  
  사용자의 브라우저에서 자바스크립트를 실행하는 등의 특별한 행위를  
  수행해 사용자가 요청을 보낸 것처럼 하는 것이 클라이언트 사이드 취약점의 주 목적

### Same Origin Policy(SOP)

- 웹 브라우저가 공격으로부터 사용자를 보호하기 위해 만든 정책
- 서로 다른 오리진의 문서 또는 스크립트 들의 상호 작용을 제한
- 오리진은 **프로토콜(protocol, scheme), 포트(port), 호스트(host)**로 구성되며, 모두 일치해야 동일한 오리진

- ex. https://same-origin-com/ 과 비교

  |                URL                 |     결과     |     이유      |
  | :--------------------------------: | :----------: | :-----------: |
  | https://same-origin.com/frame.html | same origin  |  path만 다름  |
  | http://same-origin.com/frame.html  | cross origin | scheme이 다름 |
  |   https://cross.same-origin.com/   | cross origin |  host가 다름  |
  |   https://same-origin.com:1234/    | cross origin |  port가 다름  |

### Cross Origin Resource Sharing(CORS)

- 일반적으로는 SOP 영향으로 서로 다른 오리진과 리소스를 공유 불가
- 개발 또는 운영의 목적으로 다른 오리진들과 리소스를 공유해야 하는 상황
  - portMessage - 메시지를 주고받기 위한 이벤트 핸들러를 이용해 리소스를 공유
  - JSONP - 스크립트 태그를 통해 외부 자바스크립트 코드를 호출하면  
    현재 오리진에서 해당 코드가 실행되는 점을 이용한 방법

### Cross Site Scripting(XSS)

- 서버의 응답에 공격자가 삽입한 악성 스크립트가 포함되어 사용자의 웹 브라우저에서 해당 스크립트가 실행되는 취약점
- 임의의 악성 스크립트를 실행할 수 있으며 이를 통해 해당 웹 사이트의 사용자 쿠키 또는 세션을 탈취하여 공격 수행(악성 스크립트는 웹 리소스를 말하며, 대표적으로 HTML, JS 등)

  - **공격 조건**

  1. 입력 데이터에 대한 충분한 검증 과정이 없어야함
     - 입력한 데이터가 충분한 검증 과정이 이루어지지 않아 악성 스크립트각 삽입될 수 있어야 함
  2. 서버의 응답 데이터가 웹 브라우저 내 페이지에서 출력 시 충분한 검정 과정이 없어야 함
     - 응답 데이터 출력 시 악성 스크립트가 웹 브라우저의 렌더링 과정에 성공적으로 포함되어야 함

- **XSS with JavaScript**

  - JavaScript는 사용자와의 상호작용 없이 사용자의 권한으로 정보를 조회하거나  
    변경하는 등의 요청을 주고 응답받는 것 가능하여 이를 통해 XSS 공격, 대표적으로 `<script>` 태그 사용

- **Stored XSS**

  - 악성 스크립트가 서버 내에 존재하는 데이터베이스 또는 파일 등의 형태로 저장되어 있다가  
    사용자가 저장된 악성 스크립트를 조회하는 순간 발생하는 형태의 XSS
  - 불특정 다수에게 공격이 가능하다는 점에서 높은 파급력을 가질 수 있는 가능성도 존재하지만,  
    악성 스크립트가 실행되는 페이지가 사용자가 일반적으로 접근하기 어려운 서비스일 경우에는 파급력이 높지 않을 수 있음

- **Reflected XSS**

  - 악성 스크립트가 사용자의 요청과 함께 전송되는 형태, 사용자가 요청한 데이터가 서버의 응답에 포함되어 HTML 등의 악성 스크립트가 그대로 출력
  - Stored XSS와는 다르게 사용자의 요청 데이터에 의해 취약점이 발생하므로, 변조된 데이터가 사용자의 요청으로 전송되는 형태를 유도해야 함

- **Mitigations**

  1.  **Server-side Mitigations**

      - XSS를 유발할 수 있는 태그 삽입을 방지하기 위해 서버에서 검증하는 방법
      - 사용자의 입력 값에 따라 화이트리스트 필터링(HTML 사용 시 허용해도 안전한 일부 태그, 속성을 제외한 모든 값을 필터링) 필요

  2.  **HTTPOnly Flag**

      - 서버 측에서 응답 헤더에 Set-Cookie 헤더를 전송해 자바스크립트에서 해당 쿠키에 접근 하는 것을 금지

  3.  **Content Security Policy (CSP)**

      - 응답 헤더나 meta 태그를 통해 각각의 지시어를 적용하여 사이트에서 로드하는 리소스들의 출처를 제한
        ex. Content-Security-Policy: <지시어>;

  4.  **X-XSS-Protection Header**

      - X-XSS-Protection: <값>
      - 웹 브라우저에 내장된 XSS Filter를 활성화할 것인지를 판단  
        XSS Filter는 XSS 공격 여부를 판단하여 공격 발생을 사용자에게 알리고 차단
      - 최신 브라우저에서는 사용하지 않는 추세

### Cross Site Request Forgery(CSRF)

- 웹 브라우저는 기본적으로 SOP에 위반되지 않은 모든 요청에 쿠키를 포함해 전송함
- 비정상적으로 사용자의 의도와 무관하게 다른 사이트에 HTTP 요청을 보내는 것을 CSRF 공격 이라고 함
- CSRF 공격을 통해 공격자는 해당 세션 쿠키를 가진 사람만 사용할 수 있는 기능을 요청할 수 있음
- 공격 조건

  1.  해당 웹 사이트가 쿠키를 이용한 인증 방식을 사용해야 함
      - 모든 HTTP 전송엔 쿠키가 함께 전송되기 때문에 쿠키에 저장된 세션 아이디도 전송됨
  2.  공격자가 사전에 알 수 없는 파라미터가 존재해서는 안됨

      - 자동 입력 방지 문자를 넣어야 하는 요청은 공격자가 미리 알 수 없음
      - 패스워드 변경 기능에서 기존 패스워드를 입력 받는 다면 이 또한 공격자가 알 수 없음

  3.  예제 `<img src="/sendmoney?to=dreamhack&amount=1000000">`

  4.  **방어법**
      1. 세션 쿠키 대신 커스텀 헤더를 사용하여 사용자 인증
         - 사용자 인증만을 위한 헤더 추가
      2. 공격자가 예측할 수 없는 파라미터 추가 및 검증
         - Same Origin에서만 접근 가능한 데이터를 삽입
         - CSRF Token
         - CAPTCHA
         - 정상적인 사용자만 알고있는 기존의 값을 검증(ex. 현재 비밀번호)

  - 크로스 사이트에서 출발한 요청에 제한적으로 쿠키를 포함시키게 하는 옵션 'SameSite'
  - Strict = 모든 크로스 사이트에서 출발한 요청에 해당 쿠키를 삽입 X
  - Lax = Link, Prerender, Form Get을 제외한 요청에는 쿠키 삽입 X
  - Normal = 기존과 동일하게 모든 요청에 쿠키 삽입

### Open Redirect

- Redirect는 사용자의 Location을 이동시키기 위해 사용하는 기능 중 하나
- 주소가 공격자에 의해 변도될 경우 Open Redirect 취약점 발생
- 사용자가 접속한 도메인 사이트에 대한 신뢰를 무너뜨리는 공격으로 피싱사이트로 접속을 유도하거나,  
  다른 취약점을 연계하여 사용자를 공격
- 방어 방법으로 리다이렉트가 발생하는 경로에서 공격자의 입력 값에 의해 리다이렉트 되는 주소가 변경될 경우,  
  해당 경로와 공격자의 값이 함께 전달되도록 사용자를 유도하여 리다이렉트가 되도록 하는 방법

  - **Mitigation**

    - 허용한 주소에 대해서만 이동하게끔 하는 방법
    - 사용자의 입력 값으로 리다이렉트 되는 기능을 사용해야 하는 경우 해당 링크에 대한 검증을 배포하거나,
      외부 링크로 이동하는 것을 사용자가 알 수 있도록 하는 방법

### Click Jacking

- 웹 브라우저 화면에 출력되는 내용에 HTML, CSS, JS 등과 같이 화면 출력에 영향을  
  미치는 요소들을 이용하여 사용자의 눈을 속여 사용자의 클릭을 유도한는 공격 방법
- 외부 페이지 리소스를 불러올 수 있는 태그 엘리먼트  
  ( `<frame>, <iframe>, <object>, <embed>, <applet>`) 를 사용
- Mitigation

  1. X-Frame-Options - HTTP 응답 헤더를 통해 DENY와 SAMEORIGIN 두 개의 값으로 설정

     |     값     |                   내용                   |
     | :--------: | :--------------------------------------: |
     |    DENY    |    부모 페이지 URL 상관없이 모두 차단    |
     | SAMEORIGIN | 부모 페이지 URL이 Same Origin이라면 허용 |

  2. frame-ancestors
     - Content Security Policy(CSP)의 frame-ancestors 지시어를 통해 값을 설정
     - frame-ancestors 지시어는 CSP를 HTTP 응답 헤더를 통해 설정해야 함

|        값         |                                  내용                                  |
| :---------------: | :--------------------------------------------------------------------: |
|      'none'       |                      X-Frame-Options DENY와 동일                       |
|      'self'       |                   X-Frame-Options SAMEORIGIN과 동일                    |
| http://, https:// |                       scheme이 같으면 모두 허용                        |
| \*.xxxx.io, dr 등 | host나 scheme+host가 같으면 모두 허용, 와일드카드(\*)를 사용할 수 있음 |

- X-Frame-Options vs CSP frame-ancestors

  - X-frame-Options 은 최상위 parent의 URL을, frame-ancestors 은 모든 parent URL 들을 검사해야 한다고 명시
  - 대부분의 브라우저에서는 호환성과 보안 문제로 모든 parent URL들을 검사하지만  
    X-Frame-Options 보다는 최신 기술인 frame-ancestors를 사용하는 것을 권장

- 참고자료
  - 해킹 맛보기
  - dreamhack WebHacking online lecture <https://dreamhack.io/lecture>
