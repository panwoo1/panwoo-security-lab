---
title: "[모각코]WebHacking(6강~7강)"
excerpt_separator: "<!--more-->"
toc: true
toc_sticky: true
categories:
  - 모각코
tags:
  - 모각코
  - Hacking
---

## 07-21 수요일

## NoSQL

- **Not Only SQL** 로 많이 사용되며 데이터를 다루기 위해 꼭 SQL을 사용하지 않아도  
  데이터를 다룰 수 있다는 의미를 가짐

- SQL을 사용해 데이터를 조회/추가/삭제하는 괸계형 데이터베이스와 달리 SQL을 사용하지 않음

- NoSQL의 다루는 데이터 구조와 특징에 따라 여러 종류 분류 가능

### MongoDB

- key-value 쌍을 가지는 JSON objects 형태인 document 저장
- Schema가 존재하지 않아 각 테이블에 대한 특별한 정의 하지 않아도 됨
- JSON 형식으로 쿼리를 작성 가능
- \_id 필드가 Primary Key 역할

```
$ mongo  //몽고 서버 연결
> db.user.insert({uid: 'admin', upw: 'secretpassword'}) //User Collection에 데이터 추가
WriteResult({ "nInserted" : 1 })

> db.user.find({uid: 'admin'}) //User Coleecton 데이터 조회
{ "_id" : ObjectId("5e71d395b050a2511caa827d"), "uid" : "admin", "upw" : "secretpassword" }
```

명령어 앞에 `$`를 붙여서 연산자를 사용한다

- **Comparison**

  - **$eq** (equal)
  - **$gt** (greater than)
  - **$gte** (greater than equal)
  - **$in** (in)
  - **$lt** (less than)
  - **$lte** (less than equal)
  - **$nin** (not in)

- **Logical**

  - **$and**
  - **$not**
  - **$nor**
  - **$or**

- **Element**

  - **$exists** - 지정된 필드가 있는 문서를 찾음
  - **$type** - 지정된 필드가 지정된 유형인 문서 선택

- **Evaluation**

  - **$expr** - 쿼리 언어 내에서 집계 식 사용
  - **$json Schema** - 주어진 JSON 스키마에 대해 문서를 검증
  - **$mod** - 필드값에 대해 mod 연상 수행, 지정된 결과를 가진 문서 선택
  - **$regex** - 지정된 정규식과 일치하는 문서 선택
  - **$text** - 지정된 텍스트 검색
  - **$where** - 지정된 JavaScript 식을 만족하는 문서와 일치

#### Bug Case

사용자 입력 데이터에 대한 검증이 충분하지 않아 취약점으로  
 MongoDB Inejction이 발생함

- **Blind Injection**

  Blind Injection 기법은 DBMS의 함수 또는 연산 과정 등을 이용해 데이터베이스  
  내에 존재하는 데이터와 사용자 입력을 비교하며, 특정한 조건 발생 시  
  특별한 응답을 발생시켜 해당 비교에 대한 검증을 수행함.

  MangoDB쿼리에서는 `$regex, $where` 를 사용해 Blind Injection

- **$regex**
  정규식을 한글자 씩 비교하면서 Blind SQL Injection

  ```
  ex)
  > db.user.find({upw: {$regex:"^a}})
  > db.user.find({upw: {$regex:"^b}})
  ...

  > db.user.find({upw: {$regex:"^g"}})
  { "_id" : ObjectId("5ea0110b85d34e079adb3d19"), "uid" : "guest", "upw" : "guest" }
  ```

- **$where**
  - 필드안에서는 사용할 수 없음
  - `$where` 연산자를 사용할 수 있거나, 연산자의 데이터로  
    입력 값을 추가할 수 있으면 데이터 추출 가능
  - `$where` Time Based - sleep 함수를 통해 시간 지연 발생
  - `$where` Error Based

### Redis

key-value 데이터 모델을 가지며 메모리 가븐올 작동하는 NoSQL DBMS  
메모리 기반이기 때문에 Read/Write 속도 빠름

```
ex)
$ redis-cli
127.0.0.1:6379> SET test 1234 #SET key value
OK

127.0.0.1:6379> GET test #GET key
"1234"
```

- 자주 사용되는 명령어

  - 데이터 관련

  | 명령어 |              구조              |        설명        |
  | :----: | :----------------------------: | :----------------: |
  |  GET   |            GET key             |    데이터 조회     |
  |  MGET  |       MGET key[key... ]        | 여러 데이터를 조회 |
  |  SET   |         SET key value          | 새로운 데이터 추가 |
  |  MSET  | MSET key value [key value ...] | 여러 데이터를 추가 |
  |  DEL   |       DEL key [key ...]        |    데이터 삭제     |
  | EXISTS |      EXISTS key [key ...]      |  데이터 유무 확인  |
  |  INCR  |            INCR key            | 데이터 값에 1 더함 |
  |  DECR  |            DECR key            |  데이터 값에 1 뺌  |

  - 관리 명령어

  |   명령어   |            구조            |        설명        |
  | :--------: | :------------------------: | :----------------: |
  |    INFO    |      INFO \[section\]      |   DBMS 정보 조회   |
  | CONFIG GET |    CONFIG GET parameter    |     설정 조회      |
  | CONFIG SET | CONFIG SET parameter value | 새로운 설정을 입력 |

#### Bug Case 1

- node-Redis 모듈
  `req.query`에 해당하는 부분에 문자열 타입외에 다른 타입 삽입 가능
  이로 인해 임의의 값을 value로 사용 가능

```
//String
key, value, callback => Command(command, [key, value], callback)

//Array Type
[key, value] => Command(command, key, value)
```

#### Bug Case 2

- SSRF(Sever-Side Request Forgery)

  - Redis는 기본적으로 인증 체계가 존재하지 않아 인증과정없이 명령어 실행 가능  
    공격자는 이를 이용하여 Redisd에 명령어 실행 가능

  - Redis에서는 이전 명령어가 유효하지 않은 명령어가 입력되어도 연결이 끊어지지  
    않고 다음 유효한 명령어를 처리

    - 다음과 같은 처리구조를 이용해 HTTP 프로토콜을 이용한 공격 예시

      ```
      POST / HTTP/1.1
      host: 127.0.0.1:6379
      user-agent: Mozilla/5.0...
      content-type: application/x-www-form-urlencoded

      data=a
      SET key value
      ```

#### Redis Exploit Technique

Redis 공격을 통해 Redis에 저장되어있는 정보를 얻을 수 있고  
어플리케이션의 로직에 따라 주요한 정보가 포함되어 있는 경우도 있음

이를 기반으로 로직을 실행하는 다른 어플리케이션을 이용하거나,  
Redis 자체의 명령어를 이용한 공격 방법 존재

- django-redis-cache

  - Redis에 원하는 데이터 저장한 후 해당 데이터가 deserialize하게 되는 과정에서  
    pickle 모듈을 이용하여 공격을 수행

- Redis 명령어(SAVE)

  Redis는 메모리에 데이터를 저장 및 조회하는 인메모리 데이터 베이스이기 때문에  
  일정 시간마다 메모리의 데이터를 시스템에 저장함

  Redis의 명령어를 통해 해당파일을 저장하는 주기 변경, 파일 경로 등을 설정 가능  
  => 시스템에 원하는 파일을 생성한 후 PHP 등의 다른 어플리케이션과 연계 공격

- Redis 명령어(SLAVEOF / REPLICAOF)

  다른 Redis 노드를 마스터 노드로 지정할 수 있어서 마스터 노드와 성공적으로 연결이 완료되면,  
  마스터 노드의 데이터를 복제하여 저장

  이러한 과정에서 발생하는 네트워크 트래픽을 통해 Redis 공격이 성공적으로 수행했음을  
  확인할 수 있음

- Redis 명령어 (MODULE LOAD)

  Redis Module에 system 함수와 같은 OS명령어를 실행하는 함수 또는 원하는 파일 시스템에  
  접근 할 수 있는 함수등을 포함시켜 공격에 사용 가능

### CouchDB

key-value 쌍인 구조로 JSON objects 형태인 document 저장
HTTP 기반 서버로 REST API 형식으로 HTTP Method 를 기반해 요청처리

#### 특수 구성 요소

- **Sever**

  - `/` - 인스턴스에 대한 메타 정보를 반환
  - `_all_dbs` - 인스턴스의 databases 목록 반환
  - `/_utils` - 관리자 페이지로 이동

- **Databases**

  - `/db` - 지정된 데이터베이스에 대한 정보 반환
  - `'/{db}/_alld_docs` - 지정된 데이터베이스에 포함된 모든 document를 반환
  - `/{db}/_find` - 지정된 데이터베이스에 JSON 쿼리에 해당하는 모든 document를 반환

그 외 <https://docs.couchdb.org/en/latest/api/>

#### Bug Case

CouchDB에서는 주로 사용자 입력 데이터에 대한 타입 검증이 충분하지 않거나  
특수 구성요소로 사용되어지는 값들에 대한 접근으로 인해 취약점 발생

---

## Command Injeciton Advanced

### Shell

Shell은 운영 체제에서 커널과 사용자의 입/출력을 담당하는 시스템 프로그램  
ex) Windows나 Linux에서 사용자가 콘솔을 통해 명령어를 처리

#### Exploit Technique

- **실행 결과를 확인할 수 없는 환경 - I**

  Command Injection 취약점이 발생해 OS명령어를 실행할 수 있지만,  
  실행 결과가 사용자에게 노출되지 않는 상황에서 활용할 수 있는 공격 방법

  - Network Outbound
    OS명령어를 실행한 결과를 네트워크 도구를 이용해 외부 서버로 전송시키는 방법

  - Reverse Shell / Bind Shell
    쉘 명령어를 네트워크를 통해 입력하거나 출력하여 공격하는 기법

  - 파일 생성
    어플리케이션 로직을 통해 확인할 수 있는 공간에 파일을 생성시켜 확인하는 방법

- **실행결과를 확인할 수 없는 환경 - II**

  Network In/Out Bound가 막혀 있고 파일로 출력 값을 redirection 시켜 결과를 확인  
  할 수 없는 상황에서는 참/거짓 판별로 데이터를 추출해야함

  - 지연 시간(sleep)
    비교 하는 값이 참일 경우 sleep 명령어를 통해 지연시간을 발생시켜 확인

  - 에러(DoS)
    비교하는 값이 참일 경우 시스템 에러를 발생시켜 500코드(서버 에러)를 확인

- **입력 길이가 제한된 상황 - I**

  한 글자씩 원하는 문자를 파일에 저장한 후 `bash` 나 `python` 과 같은 인터프리터를 이용해 실행하는 방식

- **입력 길이가 제한된 상황 - II**

  네트워크를 통해 사용할 명령어를 전송하는 방법

- **입력 값의 내용이 제한된 상황**

  쉘에서 제공하는 기능 또는 환경 변수 등을 이용하여 최종적으로 원하는 명령어를 실행

### Windows 환경

Linux 환경과 대응하는 명령어

|    Linux    | Windows  |          설명           |
| :---------: | :------: | :---------------------: |
|     ls      |   dir    | 디렉토리 파일 목록 출력 |
|     cat     |   type   |     파일 내용 출력      |
|     cd      |    cd    |      디렉토리 이동      |
|     rm      |   del    |        파일 삭제        |
|     mv      |   move   |        파일 이동        |
|     cp      |   copy   |      네트워크 설정      |
|  ifconfig   | ipconfig |      네트워크 설정      |
| env, export |   set    |      환경변수 설정      |

#### Exploit Technique

윈도우 환경의 리버스 쉘 스크립트는 온라인에서 쉽게 구할 수 있음  
하지만 해당 스크립트를 사용하면 윈도우 디펜더에 의해 차단됨
=> 이를 우회하기 위해서는 파워쉘 환경에서 제공하는 함수를 사용

### Command Injection Bug Cases

**open**

ruby와 perl의 Input/Ouput Util 함수인 open은 command 처리를 지원

**Demo**

open 말고도 다른 함수들도 똑같이 command injection 에 취약함

**escapeshellcmd**

Command Injection을 막기 위해 escapeshellcmd를 활용해 패치하면  
공격자가 임의 인자를 추가적으로 입력하도록 할 수 있게됨

**취약한 실행 파일**

프로그램에서 옵션으로 원하는 커맨드를 실행할 수 있는 기능을 통해 커맨드 실행
대표적으로 zip / python

```python
$ python -c
'__import__("os").system("id")'
input.py
uid=1000(dreamhack)
gid=1000(dreamhack)
groups=1000(dreamhack)
```

curl/wget 명령어는 URL을 입력으로 받은 후 접속하는 CLI 프로그램  
원하는 커맨드를 실행할 순 없지만 옵션을 통해 임의 경로에 다운로드 결과 저장 가능

---

- 참고자료
  - dreamhack WebHacking online lecture <https://dreamhack.io/lecture>
