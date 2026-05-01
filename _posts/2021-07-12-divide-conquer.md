---
title: "Divide and Conquer"
excerpt_separator: "<!--more-->"
toc: true
toc_sticky: true
categories:
  - Algorithm
tags:
  - Python
  - Algorithm
---

1. 원래 문제를 풀 수 있을 정도의 작은 크기의 부분 문제들로 분할해 각각 해결한 후, 부분 문제의  
   해답을 잘 모아 원래 문제의 해답을 얻는 방법

   - 크기가 작아질 뿐 문제 자체는 변하지 않기 때문에, 분할은 재귀적인 분할
   - 재귀적인 분할이므로 알고리즘 수행시간 T(n)은 점화식으로 표현

2. 예시

   - n 개의 수 중에서 최대 값 구하기

```python
def find_max1(A):
    if(len(A) == 1):
        return A[0]
    else:
        return max(A[0], find_max1(A[1:]))

def find_max2(A):
    if(len(A) < 1):
        return -float('inf')
    elif(len(A) == 1):
        return A[0]
    else:
        return find_max2(max(A[:len(A)//2], A[len(A)//2:]))
```

- a^n 계산하기

```python
def power1(a, n):  # 선형 재귀 호출로 작성하기
   if(n == 1):
       return a
   return a * power1(a, n-1)

def power2(a, n):  # 이중 재귀 호출로 작성하기
   if(n == 0):
       return 1
   if(n % 2 == 1):
       return power2(a, n//2)*power2(a, n//2)*a
   else:
       return power2(a, n//2)*power2(a, n//2)

def power3(a, n):
   if(n == 0):
       return 1
   p = power3(a, n // 2)
   if(n % 2 == 1):
       return p * p * a
   else:
       return p * p

# pow(x, y) x^y를 계산
# y가 음수일 수도 있음!

def pow(x, y):
   if(y < 0):
       y = abs(y)
       return power3(1/x, y)
   return power3(x, y)
```

- fibonacci
- F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2)로 정의 되는 수열

1. 피보나치수 정의를 재귀함수로 그대로 구현하는 방법

   - 간단하지만, 수행시간이 (g^n) 지수 시간이 걸림(g = 황금비율 = 1.618...)

   ```
   T(n) = T(n-1) + T(n-2) + 1
   T(n) + 1 = T(n-1) + 1 + T(n-2) + 1
   S(n) = S(n-1) + S(n-2), S(0) = T(0) + 1 = 1, S(1) = T(1) + 1 = 2
   S(n) = 1, 2, 3, 5, 8, ...
   T(n) = S(n) - 1 = Fn-1 - 1 = O(g^n)
   ```

2. 세 변수만을 이용해서 n번째 수를 계산하는 방법

   - 함수연습 - 피보나치-루프
   - O(n) 시간

3. 배열에 0번째 수부터 n번째 수까지 차례대로 채우는 방법

   - for루프를 이용하면, 쉽게 O(n) 시간에 가능

4. power(a, n) = a^n을 O(log n) 시간에 계산하는 방법

   - O(log n) 시간에 가능

```python
def fibonacci1(n):
    if(n <= 1):
        return n
    return fibonacci1(n-1) + fibonacci1(n-2)


def fibonacci2(n):
    pass #2는 나중에 복습할 때 다시 구현해보기


def fibonacci3(n):
    if(n == 0 or n == 1):
        return n
    k = n//2
    Fk = fibonacci3(k)
    Fk_minus_1 = fibonacci3(k-1)
    Fk_plus_1 = Fk_minus_1 + Fk

    if(n % 2 == 0):
        return Fk*Fk + 2*Fk*Fk_minus_1
    else:
        return Fk_plus_1 * Fk_plus_1 + Fk * Fk


def fibonacci4(n):
    F = [0, 1]
    for i in range(2, n+1):
        F.append(F[i-1] + F[i-2])
    return F[n]


def fibonacci5(n):
    a, b = 0, 1
    for i in range(2, n+1):
        a, b = b, a+b
    return b
```
