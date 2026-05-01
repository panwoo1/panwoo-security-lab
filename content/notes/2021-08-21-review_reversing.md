---
title: "[모각코] Reversing 복습"
excerpt_separator: "<!--more-->"
toc: true
toc_sticky: true
categories:
  - 모각코
tags:
  - 모각코
  - Hacking
---

## 08-21

### 리버싱

리버싱은 소스 코드가 없는 상태에서 컴파일된 대상 소프트웨어의 구조를  
여러 가지 방법으로 분석하고, 메모리 덤프를 비롯한 바이너리 분석 결과를 토대로  
동작 원리와 내부 구조를 파악하는 것

**리버싱 방법**

1. 정적 분석 방법(Static Analysis)

   - 프로그램을 실행시키지 않고 분석
   - 실행 파일을 구성하는 모든 요소, 대상 실행 파일이 실제로 동작  
     CPU 아키텍처에 해당하는 어셈블리 코드를 이해하는 것이 필요

2. 동적 분석 방법(Dynamic Analysis)

   - 프로그램을 실행시켜 입출력과 내부 동작 단계를 살피며 분석
   - 실행 단계별로 자세한 동작 과정을 살펴봄
   - 환경에 맞는 디버거를 이용해 단계별로 분석하는 기술을 익혀야함

**어셈블리 코드**

숫자로 이뤄진 명령 코드를 사람이 이해할 수 있도록 작성된 코드  
명령코드와 1:1로 대응되며, 연산할 때 사용할 피연사도 알아보기 쉬움

- **Data Movement**

  - **mov**

    `mov`는 `src`에 들어있는 값을 `dst`로 옮김

  - **lea**

    `lea`는 Load Effective Address로, `dst`에 주소를 저장

- **Conditional Operations**

  - **test**

    논리연산을 하지만, 결과값을 피연산자에게 저장하지 않음
    FLAGS 레지스터에 영향을 미침

    - FLAGS는 상태 레지스터로 현재 상태나 조건을 0과 1로 나타내는 레지스터  
      64개의 비트들 각각이 서로 다른 의미를 지님

    | Flag Abbreviation |                                                     설명                                                      |
    | :---------------: | :-----------------------------------------------------------------------------------------------------------: |
    |  CF(Carry Flag)   |       산술 연산 혹은 bit shift/rotate 등의 연산이 일어났을 때, **자리 올림이 생기는 경우 CF의 값이 1**        |
    |   ZF(Zero Flag)   |                                        **연산의 결과가 0일때 ZF는 1**                                         |
    |   SF(Sign Flag)   | 부호가 있는 값의 연산에 쓰이며, **최상위 비트가 0이면 SF=0**, **음수가 되면 최상위 비트가 1이고 똑같이 SF=1** |
    | OF(Overflow Flag) |                                      부호가 있는 값의 연산에서 CF의 역할                                      |

- **cmp**

  마찬가지로 FLAGS 레지스터의 ZF와 CF 플레그에만 영향을 미침

- **jmp, jcc**

  `jmp` - 피연산자가 가리키는 곳으로 점프  
  `jcc` - 조건에 따라 점프

- **Stack Operations**

  - **rsp revisit**

    `rsp` - 스택의 가장 위쪽을 가리키므로, 마지막으로 데이터가 추가된 위치를 저장하는 레지스터

- **Function Prologue / Epilogue**

  **함수가 시작할 때**에는 `rsp` 레지스터에 들어있는 주소에서 충분한 값을 뺌
  **함수가 끝날 때**에는 프롤로그에서 빼준 값만큼 다시 `rsp`에 더해줌

- **Procedure Call Instructions**

  - **call**

    함수를 실행할 때 쓰임

  - **ret**

    호출된 함수가 마지막으로 사용하는 명령어
    함수를 종료한 뒤 Return Address로 돌아가는 역할

### 리버싱 연습

해당 코드를 리버싱

![연습코드](https://user-images.githubusercontent.com/66258691/130308876-ddde9238-edb0-4d12-9658-b1694212ddf5.png){: width="100%" height="100%"}{: .center}

문자열 참조를 통해 "Hello" 구문을 이용하여 메인함수 찾기

![문자열 참조](https://user-images.githubusercontent.com/66258691/130308952-8d48ccd2-67aa-497a-8d3e-23593e325b1e.png){: width="100%" height="100%"}{: .center}

![main 함수](https://user-images.githubusercontent.com/66258691/130308955-84229ef7-a065-4b88-9fba-631ad07062bb.png){: width="100%" height="100%"}{: .center}

여기서 rbp, rdi는 각각 베이스 포인터 레지스터와 목적지 인덱스 레지스터를 의미

이를 해석하면,

```
rsp = rsp - E8
rbp = rsp + 20
rcx = 함수 호출 인자
함수 호출
rcx = 함수 호출 인자
함수 호출
논리 연산
rsp = rbp + C8
해제
리턴
```

![리버싱과정](https://user-images.githubusercontent.com/66258691/130315299-60c78b0b-8efc-4056-b8dd-f1eb6c31b375.png){: width="100%" height="100%"}{: .center}
