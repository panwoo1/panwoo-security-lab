---
title: "[모각코]해킹맛보기(리버스 엔지니어링 3.5 ~ 3.6)"
excerpt_separator: "<!--more-->"
toc: true
toc_sticky: true
categories:
  - 모각코
tags:
  - 모각코
  - Hacking
---

## 08-07 토요일

## 한 줄 리버싱

실습 코드

```C
#include <stdio.h>

int main()
{
  int lv = 2;
  printf("%x\n", lv);

  return 0;
}
```

어셈블리어 코드

```
0x012613EE MOV DWORD PTR SS:[EBP-8], 2
0x012613F5 MOV ESI, ESP
0X012613F7 MOV EAX, DWORD PTR SS:[EBP-8]
0X012613FA PUSH EAX
0X012613FB PUSH 1235858
0x01261400 CALL DWORD PTR DS:[<&MSVCRT110D.printf>]
```

**MOV**

- 어셈블리어의 핵심 명령어로 2개의 Operand를 가짐  
  위의 코드에서 첫 번째 줄의 오퍼랜드는 \[EBP-8\]과 상수 2
  이를 해석하면 EBP-8 주소에 상수 2를 저장하라는 명령어

**ADD**

- 레지스터에 값에 상수를 더해 다시 저장
  ADD EAX, 2 일 경우 EAX레지스터 값과 상수 2를 더해 EAX레지스터에 저장

ADD와 같이 1개의 오퍼랜드를 가지는 명령어는 연산한 값을 해당 오퍼랜드에 다시 저장

- 전역변수의 경우 지역변수와 다르게 데이터 세그먼트 위치에 저장됨  
  특정 메모리에 저장되어 모든 함수에서 사용할 수 있음

- 구조체는 선언된 자료형에 따라 연속된 크기의 바이트에 차례대로 값이 저장됨

  ex) int형 구조체 EBP-0x14 EBP-0x10 EBP-0xC

### if 리버싱

올리디버거를 통해 확인한 부분

![if문 어셈블리코드](https://user-images.githubusercontent.com/66258691/128585485-ff137c39-d6cb-4715-9aae-a765faee2ccc.png)

**CMP**

- 2개의 오퍼랜드를 가지며 비교한 결과값을 EFLAGS 레지스터의 사인 플래그에 저장

**JLE**

- 바로 앞의 명령어인 CMP 명령어가 설정한 EFLAGS 레지스터의 값, 사인 플래그를 보고  
  점프 여부를 결정함

### switch 리버싱

CMP를 통해 비교한 후 JE 명령어에 의해 점프  
case가 적으면 if-else문과 차이가 없지만, case가 많아 질수록 주소의 JMP DWORD PTR 명령어에 의해  
계산된 주소로 한 번에 점프하기 때문에 if-else문보다 빠른 속도로 분기문을 실행

JMP - EFLAGS 레지스터와 상관없이 무조건 점프하는 명령어(Jump)

### for 리버싱

JGE - 할당된 변수를 비교하여 점프(Jump if greater or equal)

for문이 for(lv=0; lv<2; lv++)와 같을 경우 CMP 명령어를 통해 비교한 후  
JGE 명령어에 의해 할당된 변수가 2보다 크거나 같으면 반복문을 빠져나감

### while 리버싱

while문 예시

```C
while(true){
  if(lv == 2)
  break;
}
```

```
#주요 어셈블리 코드
0x013813EE MOV DWORD PTR SS:[EBP-8], 0
0x013813F5 MOV EAX, 1
0x013813FA TEST EAX, EAX
0x013813FC JE SHORT 0138142C
0x013813FE CMP DWORD PTR SS:[EBP-8], 2
0x01381402 JNZ SHORT 01381406
0x01381404 JNZ SHORT 0138142C
...
0x01381421 MOV, EAX, DWORD PTR SS:[EBP-8]
0x01381424 ADD EAX, 1
0x01381427 MOV DWORD PTR SS:[EBP-8], EAX
0x0138142A JMP SHORT 013813F5
...
```

CMP 명령어를 통해 2와 비교하여 주소의 JNZ 명령어에 의해 할당된 변수가 2가 아니면 점프를 실행
2일 경우 JMP를 통해 반복문을 빠져나감

JNZ(Jump not zero)

## 함수 리버싱

### 콜링 컨벤션

**콜링 컨벤션**은 함수가 어떻게 인자를 전달받고 자신을 호출한 함수에게 리턴값을 어떻게  
돌려주는지에 대한 약속된 함수 호출 규약

|      구분      |  \_\_cdecl  | \_\_stdcall |  \_\_fastcall  |
| :------------: | :---------: | :---------: | :------------: |
| 인자 전달 방법 |    스택     |    스택     | 레지스터, 스택 |
| 스택 해제 방법 | 호출한 함수 | 호출된 함수 |  호출된 함수   |

**\_\_cdecl**

```
#주소값 생략
PUSH 3
PUSH 2
PUSH 1
CALL 00221104
ADD ESP, 0C
MOV DWORD PTR SS:[EBP-8], EAX
...
RETN
```

PUSH 명령어를 이용해 스택에 인자를 차례대로 쌓아감  
스택 해제는 호출한 곳에서 하기때문에 함수 마지막 명령어 RETN 까지 스택 해제에 관련된  
어떠한 명령어도 수행되지 않음

**\_\_stdcall**

```
#주소값 생략
PUSH 3
PUSH 2
PUSH 1
CALL 01271104
MO DWORD PTR SS:[EBP-8], EAX
...
RETN 0C
```

\_\_cdecl 호출 규약과 같이 스택으로 입력 받음
하지만 스택 해제를 호출된 함수에서 하기 때문에  
RETN 0C를 이용해 스택 해제  
RETN 0C는 호출한 함수로 돌아가면서 ESP를 0C만큼 더해주는 명령

**\_\_fastcall**

```
#주소값 생략
PUSH 3
MOV EDX, 2
MOV ECX, 1
CALL 00B711EA
MOV DWORD PTR SS:[EBP-8], EAX
...
RETN 4
```

\_\_cdecl, \_\_stdcall 호출 규약과 달리 인자 입력에 메모리 보다  
속도가 빠른 레지스터가 사용되지만 사용에 한계가 있어 스택도 같이 사용됨  
스택 해제는 \_\_stdcall 과 같이 호출된 함수에서 함

### 함수 호출 리턴값

IA-32에서 함수의 리턴값은 EAX 레지스터를 사용

### 함수 프롤로그, 에필로그

**프롤로그** - 함수 시작을 위해 스택과 레지스터를 재구성  
**에필로그** - 함수 종료시 스택과 레지스터 정리

```
#주소값 생략 및 주요 부분
PUSH EBP
MOV EBP, ESP
...
MOV ESP,EBP
POP EBP
RETN
```

프롤로그에서 이전 함수에서 사용한 EBP를 PUSH EBP 를 사용해 스택에 저장  
MOV EBP, ESP 명령어를 사용해 스택의 위치를 EBP에 저장

에필로그에서 MOV ESP, EBP 명령어를 사용해 스택의 위치를 함수 시작전 위치로 되돌림  
POP EBP 명령어를 사용해 스택에 저장된 이전 EBP 값을 EBP 레지스터에 저장
정리가 끝나면 RETN을 통해 호출한 함수로 되돌아감

### 지역 변수, 전역 변수, 포인터

```C
//에제
#include <stdio.h>
#include <stdlib.h>

int main()
{
  int lv;
  int *gv;

  lv = 1;
  gv = (int*)malloc(0x4);
  *gv = 2;

  printf("lv is %d\n", lv);
  printf("gv is %d\n", gv);

  return 0;
}
```

```
#주소값 생략 및 주요 부분
MOV DWORD PTR SS:[EBP-8], 1
...
PUSH 4
CALL DWORD PTR DS:[2B92C0]
...
MOV DWORD PTR SS:[EBP-14], EAX
MOV EAX, DWORD PTR SS:[EBP-14]
MOV DWORD PTR DS:[EAX], 2
..
MOV EAX,DWORD PTR SS:[EBP-8]
...
MOV EAX,DWORD PTR SS:[EBP-14]
MOV ECX, DWORD PTR DS:[EAX]
```

PUSH 4, CALL ... 는 malloc에 해당하며 이는 힙 영역 메모리를 할당하는 함수  
malloc 함수를 호출하면 EAX 레지스터로 할당된 주소를 리턴

예제의 gv는 포인터로 선언되어 스택 주소에 할당된 힙 주소가 들어있음

```c
//포인터 예제
#include <stdio.h>

int inc(int *a)
{
  *a = *a+1;
  return *a;
}

int main()
{
  int s, ret;

  s = 2;
  ret = inc(&s);
  printf("%d, %d\n", s, ret);

  return 0;
}
```

지역 변수 s는 \[ESP-8\] 스택 주소에 저장됨  
inc()함수를 호출할 때 인자 값으로 스택 주소를 입력함

```
#포인터 사용 함수 어셈블리어
#주소 생략 및 주요 부분

MOV EAX,DWORD PTR SS:[EBP+8]
MOV ECX,DWORD PTR DS:[EAX]
ADD ECX,1
MOV EDX,DWORD PTR SS:[EBP+8]
MOV DWORD PTR DS:[EDX],ECX
MOV EAX,DWORD PTR SS:[EBP+8]
MOV EAX,DWORD PTR DS:[EAX]
```

변수 s의 스택 주소가 할당되어 EAX 레지스터의 값은 main 함수의 지역 변수 s의  
스택 주소로 할당되어 코드를 실행하면 ECX 레지스터에 2가 할당됨  
다시 main 함수의 스택 주소를 구해 1을 더한 값을 할당하여 main 함수의  
지역 변수 s의 값이 inc()함수에서 바뀌게 됨

올리디버거 실습

![포인터 어셈블리](https://user-images.githubusercontent.com/66258691/128587130-8000e01e-5198-41c3-951f-e4834a0569f0.png){: width="60%" height="60%"}{: .center}

참고자료

- 해킹맛보기
