---
title: "[모각코]WebHacking(3강~4강)"
excerpt_separator: "<!--more-->"
toc: true
toc_sticky: true
categories:
  - 모각코
tags:
  - 모각코
  - Hacking
---

## 07-14 수요일

## Sever-side Basic

- 서버에서는 사용자가 요청 한 데이터를 해석하고 처리한 후 사용자에게 응답
- 이 과정에서 사용자의 요청 데이터에 의해 발생하는 취약점이 서버사이드 취약점

- 주 목적
  - 서버 내에 존재하는 사용자들의 정보 탈취
  - 서버의 권한 장악

### Injection(인젝션)

- 사용자의 입력 값이 어플리케이션의 처리 과정에서 구조나 문법적인 데이터로 해석돼 발생하는 취약점

- **SQL Injection**

  - SQL을 사용할 때 공격자의 입력 값이 정상적인 요청에 영향을 주는 취약점
  - 웹 어플리케이션에서 DBMS에 저장된 정보를 조회하는 기능을 구현하기 위해 SQL 쿼리에 사용자의 입력데이터를 추가하여 DBMS에 요청  
     -> 이 과정에서 사용자의 입력이 SQL 쿼리에 삽입되어 SQL 구문으로 해석되거나 문법적으로 조작하게되면 임의의 쿼리가 실행될 수 있음
  - SQL의 사용 목적과 행위 따른 구분

    - _DDL(Data definition language)_
      - 데이터를 저장하기 위한 스키마, 데이터베이스의 생성/수정/삭제 등의 행위를 수행
    - _DML (Data manipulation language)_
      - 실제 데이터베이스 내에 존재하는 데이터에 대해 조회/저장/수정/삭제 등의 행위를 수행
    - _DCL (Data control language)_
      - 데이터베이스의 접근 권한 등의 설정을 하기 위한 언어

  - SQL쿼리 로그인 기능
    ```
    //간단한 형태의 쿼리
    //{아이디} {패스워드}에 사용자 입력값 삽입 및 DBMS 전달 '를 기준으로 문자열 구분
    select * from user_table
    where uid='{uid}' and upw='{upw}';
    ```
  - 실습

    - _or_ 연산은 A or B 와 같은 구조일 경우 A와 B 중 하나라도 참인 경우 결과는 참
    - 이를 이용하여 1 'or' 1 과 같은 공격 페이로드를 통해 _정보 출력 가능_

    ![SQL injection - 1](https://user-images.githubusercontent.com/66258691/125620311-8fe0711e-995f-4d20-912b-3b528be7bd7b.png)

    ![SQL injection - 2](https://user-images.githubusercontent.com/66258691/125620342-cc2aa5a2-7039-4678-982f-1d88d93958f1.png)

  - 취약점 방지
    - 사용자의 입력 데이터가 SQL 쿼리로 해석되지 않아야 함
    ```
    //문자열 구분자 '를 삽입하지 않고 SQL Injection을 통해
    //where 절의 조건 항상 참이 되도록 하는 예제
    select * from board_table where post_idx=100 or 1=1;
    ```
    - ORM과 같이 인증된 SQL 라이브러리를 사용하면 SQL Injection으로 부터 상대적으로 안전함
    - ORM(Object Relational Mapper)은 SQL의 쿼리 작성을 돕기 위한 라이브러리
    - ORM을 사용하더라도 입력 데이터의 타입 검증이 없으면 잠재적인 위협이 될 수 있음

- **Command Injection**

  - OS Command를 사용 시 사용자의 입력 데이터에 의해 실행되는 Command를 변조할 수 있는 취약점
  - Os Command를 사용할 때 사용자의 입력 값을 검증하지 않고 함수의 인자로 전달한다면  
     다음과 같은 문자를 이용해 사용자가 원하는 명령어를 함께 실행 가능

    - `\`\`` - 명령어 치환
    - `$()` - 명령어 치환(중복 사용)
    - `&&` - 명령어 연속 실행
    - `||` - 명령어 연속 실행
    - `;` - 명령어 구분자
    - `|` - 파이프(앞 명령어의 결과가 뒷 명령어의 입력으로 들어감)

  - 취약점 방지
    - 사용자의 입력 데이터가 Command 인자가 아닌 다른 값으로 해석되는 것을 방지
    - 웹 어플리케이션에서 OS Command를 사용하지 않는 것이 가장 좋은 방법
    - 불가피하게 사용해야할 경우 화이트/블랙 리스트 필터링 방식 사용

- **Sever Side Template Injection (SSTI)**

  - 템플릿 변환 도중 사용자의 입력 데이터가 템플릿으로 사용돼 발생하는 취약점
  - Template Engine이 실행하는 문법을 사용할 수 있기 때문에 발생하게 됨
    ![template](https://user-images.githubusercontent.com/66258691/125728293-4782a185-de50-4a9e-887d-cd0027e1246d.png)
  - 각 언어별 많이 사용되는 Template Engine

    |  Language  |      Template Engine      |
    | :--------: | :-----------------------: |
    |   Python   | Jinja2, Mako, Tornado ... |
    |    PHP     |     Smarty, Twig, ...     |
    | JavaScript |    Pug, Marko, EJS ...    |

  - 대부분의 Tempalte Engine 에서 {% raw %}{{}}{% endraw %}, ${}과 같은 문법 지원

- **Path Traversal**

  - URL / File Path를 사용 시 사용자의 입력 데이터에 의해 임의의 경로에 접근하는 취약점
  - URI에서 해석되는 구분 문자

    | 문자 |                             의미                             |
    | :--: | :----------------------------------------------------------: |
    |  /   |                       Path identifier                        |
    |  ..  |      Parent directory \*/tmp/test/../1234 => /tmp/1234       |
    |  ?   |            Query identifier \*? 뒤는 query로 해석            |
    |  #   |   Fragment identifer \* # 뒤의 값은 Sever로 전달 되지 않음   |
    |  &   | Parameter separator \*key1=value&key2=value... 형식으로 사용 |

- **Sever Side Request Forgery (SSRF)**
  - 공격자가 서버에 변조된 요청을 보낼 수 있는 취약점
  - 취약점을 방지하기 위해서는 사용자가 입력한 URL의 Host를 화이트리스트 방식으로 검증

### File vulnerability

- 파일을 업로드/다운로드 하는 기능에서 발생할 수 있는 취약점 존재

- **파일 업로드 취약점**

  - 서버의 파일 시스템에 사용자가 원하는 경로 또는 파일 명 등으로 업로드가 가능하여 악영향을 미칠 수 있는 파일이 업로드되는 취약점
  - 공격자는 웹 어플리케이션 또는 서버의 서비스가 참조하는 파일을 업로드하여 공격에 사용 가능
    - CGI (Common Gateway Interface)는 사용자의 요청을 받은 서버가 동적인 페이지를 구성하기 위해  
      엔진에 요청을 보내고 엔진이 처리한 결과를 서버에게 반환하는 기능
  - 웹 어플리케이션이 실행하는 코드를 악의적인 공격자가 조작 가능하다면,  
    내장된 OS 명령어 등을 사용할 수 있으며, WebShell(웹쉘)이라는 악성코드 사용

- **파일 다운로드 취약점**
  - 서버의 기능 구현 상 의도하지 않은 파일을 다운로드 할 수 있는 취약점
  - 흔한 형태로 사용자가 입력한 파일이름을 검증하지 않은 채 그대로 다운로드를 제공하는 행위
  - ../ 상위 디렉토리 접근을 통해 파일 다운로드
  - 이를 막기 위해 ..과 / 와 \\을 적절하게 필터링 해야 함

### Business Logic Vulnerability(비즈니스 로직 취약점)

- 규칙에 따라 데이터를 생성·표시·저장·변경하는 로직, 알고리즘 등
- 서비스의 기능에서 적용되어야 할 로직이 없거나 잘못 설계된 경우 발생
- **Business Logic Vulnerability**

  - 정상적인 흐름에서 검증 과정의 부재 및 미흡으로 인해 정상적인 흐름이 악용되는 취약점
  - ex) 후기 이벤트 오류 - 글 작성 삭제를 반복하여 포인트 무한대로 획득
  - 비즈니스 로직 취약점을 방어하기 위해서는 로직을 확실하게 이해하고, 설계 및 개발 단계에서  
    어떤 위협이 발생할 수 있는지 위협을 파악하고 방어하는 것이 중요

- **IDOR (Insecure Direct Object Reference)**

  - 변조된 파라미터 값이 다른 사용자의 오브젝트 값을 참조할 때 발생하는 취약점
  - 사용자의 입력 데이터에 의해 참조하는 객체가 변하는 기능에서 사용자가  
    참고하고자 하는 객체에 대한 권한 검증이 올바르지 않아 발생
  - ex) 사용자의 금액을 저장하는 데이터베이스에서 계좌번호 조작, 금액 조회 및 송금
  - 취약점 방지
    - 객체 참조시 사용자의 권한을 검증하는 것이 중요
    - 사용자가 의도한 권한을 벗어나서 행동 할 수 없도록 권한 등을 분리해서 관리

- **Race Condition**
  - 비즈니스 로직의 순서가 잘못되거나, 한 오브젝트에 여러 요청이 동시에 처리되는 상황에서 발생하는 취약점

### Language specific Vulnerability(PHP, Python, NodeJS)

- 언어에서 제공하는 모든 함수가 안전한 것은 아님
- 의도한 기능을 제공하는 함수를 잘못 사용해서 문제가 발생할 수 있으며,  
  사용자의 입력 데이터가 함수의 인자로 사용되어 취약점 발생 가능

- **Common**

  - 코드 실행 함수(eval)
    - 사용자의 입력 데이터가 eval의 인자로 사용되지 않아야 함
  - OS command function
    - 사용자의 입력 데이터가 포함될 경우 Command Injection 취약점 발생 가능
    - Python
      - os.system, popen
      - subprocess.call, run, Popen
    - PHP
      - system, passthru
      - shell_exec, backtick operator(ex. `ls`)
      - popen, proc_open
      - exec
    - JavaScript (Node JS)
      - child_process.exec, spawn
  - Filesystem function

    - 대표적 서버의 피해
    - File Read - 어플리케이션 코드, 설정 파일 정보 등의 노출
    - File Write
      - WebShell 생성을 통한 원격 코드 실행 공격
      - 기존 설정 파일을 덮는 공격을 통해 운영체제 또는 어플리케이션 설정 변경
    - Etc
      - 파일 복사를 통해 File Write와 유사한 상황 발생
      - 설정 파일을 삭제하여 운영체제 또는 어플리케이션 서비스 무력화

  - serialize / deserialize

    - serialize(직렬화)는 Object 또는 Data의 상태 또는 타입을 특정한 형태의 포맷을 가진 데이터로 변환하는 것을 의미
    - deserialize(역직렬화)는 직렬화된 데이터를 원래의 Object 또는 Data의 상태 또는 타입으로 변환하는 것을 의미
    - 공격자는 역직렬화 과정에서 어플리케이션 상에서 다른 행위를 발생시키는 상태 또는 타입을 이용하여 악의적인 행위를 발생시키거나,  
      특정한 상황에서 호출되는 메소드들을 이용하여 공격에 사용

    - python 취약점 예시 코드

    ```python
    import pickle
    import os

    class TestClass:
      def __reduce__(self):
        return os.system, ("id", )
    ClassA = TestClass()

    # ClassA 직렬화
    ClassA_dump = pickle.dumps(ClassA)
    print(ClassA_dump)

    # 역직렬화
    pickle.loads(ClassA_dump)
    ```

- **PHP**

  - _include_
    - php 태그가 포함될 경우 php코드가 실행되기 때문에 주의 해야함
  - _Wrappers_
    - 파일 시스템 함수에서 URL style 프로토콜을 위해 존재
    - 사용자의 입력이 될 경우 개발자의 의도와는 다른 행위를 발생 시킬 수 있음
  - _extract_
    - 배열에서 변수를 가져오는 함수
    - 기존에 사용되고 있는 변수의 데이터를 덮을 수 있어 신뢰할 수 없는 데이터가 사용되면  
      다른 변수를 변조하여 공격에 사용 가능
  - _Type Juggling_
    - 서로 다른 타입인 변수를 비교 또는 연산 시 자동으로 형변환이 발생하며 의도치 않은 결과 발생 가능
  - _Comparison_
    - 서로 다른 타입이 비교 연산자에 사용될 경우 type-juggling 에 의해 의도치 않은 결과 발생 가능
  - _session_
    - 사용자의 입력 데이터가 들어가게 되면 공격과 연계하여 사용 가능
    - ex) inclue함수의 인자를 조작 가능하고 인자에 대한 검증이 없는 페이지에서  
      세션 파일을 inclue 인자로 넘겨 원하는 php 코드 실행 가능
  - _Upload Logic_

    1. php 코드상에서 업로드 기능을 구현하지 않아도 사용자가 서버의 임시 디렉토리에 업로드 가능
    2. 예측 가능한 임시 파일 생성 규칙

    - 이러한 문제점을 통해 include 또는 파일 시스템에서 발생하는 취약점과 연계되면 서버의 명령어를 실행시키는 등의 공격을 연계될 수 있음

- **JavaScript**
  - Comparison Problem
    - 타입이 다른 두 변수의 값을 비교할 때 문제점 발생
      - 두 값 모두 객체가 아닐 경우 valueOf, toString 함수를 이용해 원시 값을 가져와 비교
  - Prototype Pollution
    - 객체를 생설할 때 초기화 할 프로토타입을 지정해주지 않으면 Object.prototype의 속성과 정의된 함수를 상속 받음
    - 상속받은 모든 객체는 메모리 상 같은 주소를 가리킴

### Misconfiguration

- 잘못된 설정 취약점은 모든 웹 어플리케이션 계층에서 발생 가능
- 잘못된 설정으로 공격자는 허가되지 않은 동작을 수행 할 수 있음

- **부주의로 인해 발생하는 문제점**

  - 권한 설정 문제
    - 잘못된 권한 설정
    - 기본 계정
  - 기본 서비스
    - 관리 서비스
    - 모니터링 서비스
  - 임시/백업 파일, 개발 관련 파일
    - 디렉토리 스캐너를 통해 파일 유출 가능

- **편의성을 위한 설정에 의해 발생하는 문제점**

  - 개발자를 위한 설정이 서비스 환경에서도 켜져있어 공격자가 이를 통해  
    시스템 내부의 정보를 알아내 추가적인 공격에 사용될 수 있음
  - DEBUG / Error Message Disclosure
  - 0.0.0.0으로 바인딩된 네트워크 설정

- **메뉴얼과 실제 구현체의 차이로 인해 발생하는 문제점**

  - NGINX ALIAS Path Traversal 취약점

- **해당 코드나 설정에 대한 이해 없이 사용해 발생하는 문제점**

  - 취약점이 존재하는 예제코드, StackOverflow 답변등을 이해 없이 복사 붙여넣기 해 사용하거나  
    메뉴얼에 존재하는 권고 설정을 무시한채 사용해 발생
  - 모든 도메인을 허용한 CORS 설정

---

## Client-side Advanced

- 취약점 방어 시 고려해야 할 사항이 상당수, 공격 및 우회 기법이 끊임없이 고안되어 왔고  
  방어를 위한 오픈소스 라이브러리 또한 무수히 많은 것이 특징

### Cross-Site Scripting(XSS)

- 가장 확실한 방어 방법은 사용자가 HTML 태그나 엔티티 자체를 입력하지 못하도록 하고,  
  대신 입력을 서식 없는 평문으로 취급하는 것
- 태그 및 속성 필터링

  - 코드를 실행할 수 있는 HTML 요소는 `<script>` 이외에도 상당수 존재
  - 요소의 속성값 또한 `&lt;` 와 같은 HTML 엔티티를 포함할 수 있어 본래 코드를 숨길 때에 사용될 수 있음

  - 대문자 혹은 소문자만을 인식하는 필터 우회

  ```
  x => !x.includes('script') && !x.includes('On')
  -->
  <scriPT>alert(document.cookie)</scriPT>
  --> <img src=x: oneRroR=alert(document.cookie) />
  ```

  - _JavaScript 함수 및 키워드 필터링_

    - JavaScript는 코드를 난독화할 수 있는 다양한 기능들을 포함하여 필터를 우회할 수 있음
    - `atob` 와 `decodeURI`함수는 각각 데이터를 디코딩 하는 함수로써 키워드 등을 부호화하여 필터를 우회할 수 있음

    - 예시

    |                     구문                     |                                  대체 구문                                  |
    | :------------------------------------------: | :-------------------------------------------------------------------------: |
    | alert, XMLHttpRequest 등 최상위 객체 및 함수 | window\['al' + 'ert'\], window\['XMLHtt' + 'pRequest'\] 등 이름 끊어서 쓰기 |
    |                    window                    |                                 self, this                                  |
    |                  eval(code)                  |                              Function(code)()                               |
    |                   Function                   |         isNaN\['constr' + 'uctor'\] 등 함수의 constructor 속성 접근         |

- _문자열 치환_

  - 필터되는 문자열 사이에 또 다른 필터되는 문자열을 넣으면 최종적으로 바깥에 필터링 되는  
    문자열이 다시 나타나게 되어 필터가 무력화될 뿐만 아니라 방화벽 등에서 탐지하지 못하게 되는 부작용 발생
    ```
    (x => x.replace(/script/g, ''))('<scrscriptipt>alscriptert(documescriptnt.cooscriptkie)</scrscriptipt>')
    --> <script>alert(document.cookie)</script>
    ```

- _활성 하이퍼링크_

  - `javascript:` 스키마는 URL 로드 시 자바스크립트 코드를 실행할 수 있도록 함
  - 정규화를 거치는 과정에서 `\x01\, \x04\` 와 같은 특수 제어 문자들이 제거될 수 있음
  - 이를 이용하면 다양한 우회 기법 사용 가능

- _디코딩 전 필터링_

  - 일부 웹 응용은 웹 방화벽 등의 필터링 기능에 의존하거나, 데이터를 개별 요소를 추출하기 전에 전체 데이터에 필터를 가하는 경우가 있음
  - 예를 들어 XSS 필터 검사를하고 URL Decode 등을 가한다면 필터가 무용지물이 되어버림

- _길이 제한_

  - URL의 Fragment 부분을 추출하여 eval()로 실행하는 기법이 흔히 쓰임
  - 쿠키에 페이로드를 저장하는 방식과 import와 같은 외부 자원을 스크립트로 로드하는 방법 또한 사용 가능

### Content Security Policy(CSP)

- XSS 공격이 발생하였을 때 그 피해를 줄이고 웹 관리자가 공격 시도를 보고받을 수 있도록 하는 기술
- 웹 페이지에 사용될 수 있는 자원에서 위치 등에 제약을 걸어 공격자가 웹 사이트에 본래 있지 않던 스크립트를 삽입하거나 공격자에게 권한이 있는 서버 등에 요청을 보내지 못하도록 막을 수 있음

```
CSP 헤더는 1개 이상의 정책 디렉티브가 세미콜론으로 분리된 형태
다음은 아래 URL에서만 로드되어야 함을 나타내는 CSP 헤더
Content-Security-Policy:
default-src 'self'
https://example.dreamhack.io
```

- _CSP 우회 방법_

  1. **신뢰하는 도메인에 업로드**

  - 해당 사이트에 스크립트 등을 업로드한 뒤 다운로드 주소로 대상 웹 페이지에 해당 자원을 포함시킬 수 있음
    - 이에 대한 해결책으로는 도메인 Origin 대신 해쉬나 nonce 등을 이용하는 방법

  ```
  <meta http-equiv="Content-Security-Policy"
  content="script-src 'self'">
  ...
  <h1>검색 결과: <script
  src="/download_file.php>id=177742"></script></h1>
  ```

  2. **nonce 예측 가능**

     - nonce를 이용하면 따로 도메인이나 해쉬 등을 지정하지 않아도 공격자가 예측할 수 없는 특정 nonce 값이 태그 속성에 존재할 것을 요구함으로써 XSS 공격을 방어할 수 있음
     - 이를 생성하는 알고리즘이 취약하여 결과 예측이 가능하면 공격자는 이를 유추해 자신의 스크립트를 웹 사이트에 삽입할 수 있음

  3. **base-uri 미지정**

  - HTML `<base>` 요소는 상대 경로가 해석되는 기준점을 변경할 수 있도록 하며 `<a>, <form> 등의 target` 속성의 기본값을 지정하도록 함
  - 공격자가 `<base href="https://malice.text/xss-proxy/">`와 같은 마크업을 삽입하게 되면  
    추후 상대 경로를 사용하는 URL들은 본래 의도한 위치가 아닌 공격자의 서버에 자원을 가리키게 되어 공격자는 이를 통해 임의의 스크립트 등을 삽입할 수 있게 됨

### Cross-Site Request Forgery(CSRF)

- _CSRF 방어 시 주의점_

  - CSRF Token은 같은 Origin에서만 접근 가능한 형태로 특정 토큰을 저장해 제3자가 아닌 사용자로부터 요청이 왔다는 것을 인증할 수 있는 방법

    1. 짧은 CSRF Token
       - CSRF Token은 외부자가 예측 불가능하도록 설계된 만큼 무차별 대입 공격이 효과적이지 않도록 토큰의
    2. 에측 가능한 CSRF Token
       - 토큰의 길이가 충분하여도 공격자가 충분히 접근 가능한 데이터, 암호학적으로 안전하지 않은 의사 난수 생성기를 사용하게되면 토큰을 예측하는 것이 덜 어려워짐
    3. CSRF Token 유출
       - URL의 Query 파라미터로 넘겨지게 되면 이후 다른 링크를 방문하였을 때 Referer 헤더로 토큰이 그대로 노출되고, 공격자는 이를 역으로 사용자를 공격할 수 있음

### Cross-Origin Resource Sharing(CORS)

- _취약점_

  1. 현재 사이트에서 다른 사이트로 정보 유출(기밀성)
     - 다른 사이트로 부터 CORS 요청을 받을 때 Origin에 대한 검사가 진행되지 않고 응답하거나 Origin에 제약이 없는 경우 사용자의 신원 등 민감한 정보가 노출될 수 있음
  2. 다른 사이트에서 현재 사이트 변조(무결성)
     - Origin이 신뢰할 수 있는 출처인지 확인 또는 제한하지 않거나 CORS 응답을 그대로 사용할 경우 XSS 등 보안문제가 발생할 수 있음

  - Window.postMessage API

    - Origin을 횡단하여 메세지를 주고받을 수 있는 API
    - 취약점
      1. Origin 미확인
         - 자유자재로 다른 윈도와 통신할 수 있도록 만들어진 API이기 때문에 Origin 검사 필요
      2. Origin 전환 경합 조건
         - 하이퍼링크를 방문하거나 스크립트가 다른 문서로 Redirect 시켜 들어있는 문서가 바뀐 상태에서  
           메시지를 보내면 Origin에 메세지가 누출되는 보안 문제 발생

  - JSONP(JSON with Padding)

    - CORS 기술이 도입되기 전 SOP를 우회하기 위해 흔히 쓰였던 방식
    - 취약점
      1. Origin 검사 부재로 인한 CSRF
      2. 콜백 함수명 검증 부재로 인한 제공자 XSS
      3. JSONP API 침해 사고 발생시 사용자 XSS

  - **CORS 정책**

    - 서버가 HTTP응답 헤더를 통해 직접 허용하고자 하는 Origin을 지정할 수 있도록 하는 기술
    - `OPTIONS` 메소드를 가징 예행 요청을 추가로 보내 판별
    - CORS 정책을 요청하는 클라이언트 헤더

    |            헤더 이름             |                                   설명                                   |
    | :------------------------------: | :----------------------------------------------------------------------: |
    | `Access-Control-Request-Headers` |  `OPTIONS` 요청이 끝나고 실제 요청을 보낼 때 포함될 헤더의 목록을 지정   |
    | `Access-Control-Request-Method`  | `OPTIONS` 요청이 끝나고 실제 요청을 보낼 때 사용될 HTTP 메소드 이름 지정 |

- **Exploit Techniques**

  - XSS 공격과 연계 공격

  1. **Relative Path Overwrite(RPO)**
     - 특정 URL의 하위 경로를 접근해도 같은 웹 페이지가 출력되는 것을 이용해 페이지에서 참조된 상대 경로 URL의 기준점을 바꾸는 공격
     - 방어할 수 있는 최선의 방법은 CSS, JS 등을 참조할 때 절대 경로를 사용하는 것
  2. **DOM Clobbering**
     - 메일 수신자, 게시글 작성자 등 제3자에 의해 HTML 마크업이 제공될 때, `id` 나 `name` 과 같은 속성을 이용하여  
       JS 에 접근할 수 있는 전역변수 공간 또는 객체 속성 공간 상에서 원하는 이름으로 임의의 DOM 객체를 삽입하는 공격
     - 효과정인 방어법은 간접적 메소드 호출 및 접근자를 사용하는 것
       ex) `HTMLFormElement.prototype.reset.call(elm)`
       하지만 번거로워서 잘 사용하지 않음
     - `id`, `name` 등 식별자 atribute를 제거할 수 있는 DOMPurify와 같은 라이브러리를 사용하는 것이 좋음
  3. **Template / DOM XSS**
     - JS에서 `innerHTML` 등 마크업을 해석하는 속성을 사용하거나 템플릿 라이브러리를 사용할 때  
       이를 제 3자가 제공 가능할 때 이를 이용해 스크립트 등을 삽입하는 공격
     - 이를 방지하려면 가급적 `innerHTML`와 같이 마크업을 해석하는 속성의 사용을 피해야 함
  4. **CSS Injection**
     - sytle태그 또는 style 속성에 대해서 변조 가능 시 사용할 수 있는 방법 중 하나
     - 다른 태그의 속성 값을 참/거짓의 방식을 통해 알아내거나, HTTP 트래픽을 생성시킬 수 있음

- 참고자료
  - dreamhack WebHacking online lecture <https://dreamhack.io/lecture>
