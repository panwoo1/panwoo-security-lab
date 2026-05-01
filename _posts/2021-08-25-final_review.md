---
title: "[모각코] 마무리 복습"
excerpt_separator: "<!--more-->"
toc: true
toc_sticky: true
categories:
  - 모각코
tags:
  - 모각코
  - Hacking
---

## 08-25

## 웹해킹 복습

### SQL DML 구문이해

- **DML 구문 이해**

SQL DML은 데이터베이스에서 데이터를 조회하거나, 추가/삭제/수정을 수행하는 구문

- **SELECT**

  데이터를 조회하는 구문

  `SELECT` 문자열을 시작으로 조회의 결과로 사용될 표현식 또는  
   컬럼들에 대해 정의

  `FROM`절에서 데이터를 조회하기 위한 테이블의 이름 입력

  `WHERE` 절에서는 해당 테이블 내에 조회하는 데이터의 조건 설정

  `ORDERED BY` 절은 쿼리의 결과 값들을 원하는 컬럼을 기준으로 정렬

  `LIMIT` 절은 쿼리의 결과로 출력될 row의 개수를 또는 Offset을 지정

  ```SQL
  연습

  --table_name로 부터 모든 컬럼 조회
  SELECT * FROM table_name

  --이름이 '임찬우'인 사람 검색
  SELECT * FROM table_name WHERE name='임찬우'

  --점수 정렬
  SELECT * FROM Scores
  WHERE Scores >= 70
  ORDERED BY Score

  --점수 정렬 + 갯수
  SELECT * From Scores
  WHERE Scores >= 70
  ORDERED By Score LIMIT 0, 10    --10개의 컬럼
  ```

- **INSERT**

  데이터를 추가하기 위한 구문

  `INSERT` 문자열을 시작으로 INSERT 구문이 시작하며, 데이터가 추가될 테이블을 정의

  `VALUES[S]` 절에서는 추가될 데이터의 값을 입력

  `,`를 통해 여러 데이터를 한번에 추가할 수 있음

  ```SQL
  INSERT INTO table_name VALUES(value1, value2, ...)
  INSERT INTO table_name VALUES(value1, value2,...), (1, 2, ...,)
  ```

- **UPDATE**

  데이터를 수정하는 구문

  `UPDATE` 문자열을 시작으로 수정을 요청할 테이블 정의
  `SET` 절에서는 수정할 컬럼과 수정될 데이터를 정의
  `WHERE` 절을 통해 수정할 row 지정

  ```SQL
  UPDATE table_name SET value=modify_value
  ```

- **DELETE**

  데이터를 삭제하는 구문

  `DELETE FROM` 문자열을 시작으로 삭제할 데이터가 존재하는 테이블 정의
  `WHERE` 절을 통해 삭제할 데이터의 row 지정

  ```SQL
  DELETE FROM table_name    --테이블 전체 삭제
  DELETE FROM taqlbe_name WHERE id=1111     --테이블 데이터 일부 삭제
  ```

### SQL Injection 공격 기법

- **Logic**

  논리 연산을 이용한 공격 방법, 대표적으로 and연산 or 연산

  ```SQL
  --and연산 username이 "admin"이며 userpw가 "admin"인 경우에만 결과 반환

  SELECT uid
  FROM UserTable
  WHERE username="admin" and userpw="admin";


  --or 연산 모든 데이터에 접근 가능

  SELECT uid
  FROM UserTable
  WHERE username="admin" or 1;
  ```

- **Union**

  Union절은 다수의 SELECT 구문의 결과를 결합시키는 행위를 수행

  다음과 같이 사용함

  ```SQL
  SELECT * FROM UserTable
  UNION SELECT "id", "pw";
  ```

  이를 통해 다른 테이블에 접근하거나 원하는 쿼리 결과 데이터를 생성하여
  어플리케이션에서 처리되는 데이터를 조작할 수 있음

  Union절 사용 시 특정 조건이 만족되어야 함

  - 이전 SELECT 구문과 UNION SELECT 구문의 결과 컬럼의 수가 같아야함

  - 특정 DBMS에서 사용 시 이전 컬럼과 UNION SELECT 구문의 컬럼의 타입이 같아야 함

    ```SQL
    --error
    SELECT 'ABC'
    UNION SELECT 123;
    --conversion failed when converting the varchar value 'ABC' to data type int.
    ```

- **Subquery**

  서브 쿼리는 하나의 쿼리 내에 또 다른 쿼리를 사용하는 것을 의미

  ```SQL
  SELECT 1, 2, 3; --Main Query
  (SELECT 456);   --Sub Query
  ```

  - 서브 쿼리를 사용하기 위해서는 `(Sub Query)`와 같이 괄호를 통해 선언
  - 서브 쿼리에서는 **SELECT** 구문 만을 사용할 수 있음

    서브 쿼리를 이용해 메인 쿼리가 접근하는 테이블이 아닌 다른 테이블에  
    접근 하거나, SELECT 구문이 아닌 구문에서 SQL Injection 이 발생해도  
    서브 쿼리의 SELECT 구문을 사용하여 테이블의 데이터에 접근 가능

    - **사용 예시**

      - **COLUMNS Clause**

        ```SQL
        SELECT username, (SELECT "ABCD") FROM users;
        --단일행, 단일 컬럼의 결과가 반환되도록 해야함
        ```

      - **FROM Clause(Inline View)**

        ```SQL
        SELECT * FROM (SELECT *, 1234 FROM users) as u;
        --다중 행, 다중 컬럼의 결과를 사용할 수 있음
        ```

      - **WHERE Clause**

        ```SQL
        SELECT * FROM users
        WHERE username IN (SELECT "admin" UNION SELECT "guest");
        --다중 행의  결과를 사용할 수 있음
        ```

    - **Error Based**

      에러 베이스는 이용자가 임의적으로 에러를 발생시켜 정보를 획득하는 공격 기법

      ```SQL
      -- MySQL 에서 Error Based SQL Injection을 위해 많이 사용되는 공격 형태 중 하나
      SELECT extractvalue(1, concat(0x3a, version()));
      ```

      extravalue 함수는 첫번째 인자에 존재하는 xml 데이터에서 두번째  
      인자의 XPATH 식을 통해 데이터를 추출하는 함수

      하지만 두번째 인자에 올바르지 않은 XPATH 식을 입력하게 되면  
      올바르지 않은 XPATH 식이라는 에러와 함께 해당 인자가 함께 출력  
      되기 때문에 이를 이용한 공격

      DBMS 별로 Error Based SQL Injection을 위해 사용하는 주요 쿼리문

      - **MySQL**

        ```SQL
        SELECT updatexml(null, concat(0x0a,version()), null);

        SELECT extractvalue(1, concat(0x3a, version()))

        SELECT COUNT(*), CONCAT((SELECT version()),0x3a,FLOOR(RAND(0)*2)) x FROM information_schema.tables GROUP BY x;
        ```

      - **MSSQL**

            ```SQL
            SELECT convert(int,@@version);
            SELECT cast((SELECT @@version) as int);
            ```

      - **Oracle**

        ```SQL
        SELECT CTXSYS.DRITHSX.SN(user, (select banner from v$version where rownum=1)) FROM dual;

        SELECT ordays.ord_dicom.getmappingxpath((select banner from v$version where rownum=1), user, user) FROM dual;
        ```

    - **Blind**

      데이터베이스 조회 후 결과를 직접적으로 확인할 수 없는 경우 사용되는 공격 기법

      기법의 원리는 DBMS의 함수 또는 연산 과정 등을 이용해 데이터베이스  
       내에서 존재하는 데이터와 이용자 입력을 비교하며, 특정 조건 발생 시  
       특별한 응답을 발생시켜 해당 비교에 대한 검증 수행

      Blind SQL Injection이 수행하기 위해서는 다음 조건 만족

      - 데이터를 비교해 참/거짓을 구분
      - 참/거짓의 결과에 따른 특별한 응답 생성

        ```SQL
        SELECT IF(1=1, True, False);
        ```

        - **Application Logic**

          데이터베이스의 결과를 받은 어플리케이션에서 결과 값에 따라  
           다른 행위를 수행하게 되는 점을 이용해 참과 거짓 구분

          ex) username에 의해 SQL injeciton이 발생하며,  
           데이터 베이스의 결과인 username이 admin인 경우  
           이용자에게 "True"가 반환, 아니면 "False"

          ```python
          from flask import Flask, request
          import pymysql

          app = Flask(__name__)

          def getConnection():
            return pymysql.connect(host='localhost', user='dream', password='hack', db='dreamhack', charset='utf8')


          @app.route('/' , methods=['GET'])
          def index():
            username = request.args.get('username')
            sql = "select username from users where username='%s'" %username

            conn = getConnection()
            curs = conn.cursor(pymysql.cursors.DictCursor)
            curs.execute(sql)
            rows = curs.fetchall()
            conn.close()
            if(rows[0]['username'] == "admin"):
              return "True"
            else:
              return "False"

          app.run(host='0.0.0.0', port=8000)
          ```

        - **Time Based**

          시간 지연을 이용해 참/거짓 여부를 판단

          DBMS에서 제공하는 함수를 이용하거나, 무거운 연산과정을  
           발생시켜 쿼리 처리 시간을 지연시키는 heavy query 등이 존재

        ```SQL
        --benchmark 함수, heavy query 등과 같이 DBMS에서 기본적으로
        --제공하는 시간 지연함수가 아닌 경우에는 대상 시스템의 성능, 환경등에 --따라 지연 시간이 다르게 동작할 수도 있음

        SELECT IF(1=1, sleep(1), 0);

        SELECT IF(1=0, sleep(1), 0);

        ```
