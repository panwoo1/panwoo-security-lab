---
title: "Medians of Median"
excerpt_separator: "<!--more-->"
toc: true
toc_sticky: true
categories:
  - Algorithm
tags:
  - Python
  - Algorithm
---

## 알고리즘 단계

1. L의 수를 다섯 개씩 묶는다 -> n/5개의 묶음 존재
2. 각 묶음에 대해, 다섯 개의 수들의 중간값을 찾는다

   - 중간값보다 작은 2개의 수 -> 중간 값 -> 중간값보다 큰 2개의 수 순서로 재배열

3. 묶음 별 중간값을 모두 모아 (n/5개), 그 값들의 중간값을 찾는다

   - 중간값들의 중간값을 찾는다
   - 재귀 호출, 그 중간값을 m\*

4. 각 묶음을 재배열 하는데, 묶음의 중간값이 m\*보다 작으면 왼쪽으로 모으고, 크면 오른쪽으로 모은다.
5. m\*를 기준으로 네 구역 X, Y, Z, W로 나눈다.

   - X < m\*
   - W > m\*
   - Y, Z 정해지지 않음 < m* or > m*

6. - A = X + {Y와 Z값 중에서 m\*보다 작은 값}
   - B = W + {Y와 Z의 값 중에서 m\*보다 큰 값}
   - M = m\*와 같은 값

7. len(A) > k 이면 k번째로 작은 값이 A에 있으므로 A에 대해 재귀호출
8. len(A) + len(M) < k 이면 k 번째로 작은 값이 B에 있으므로 B에 대해 재귀호출
9. k번째로 작은 값이 m\* return

## 수행 시간

- n/4 <= len(A) <= 3/4\*n
- n/4 <= len(B) <= 3/4\*n c = 4/3
- T(n) = T(3/4*n) + T(n/5) + 11/5 * n, T(1) = 1
- induction(귀납법 사용)

1. guess T(n) <= 44n, T(1) = 1 <= 44
2. n보다 작은 모든 경우 성립 가정, T(n) <= 44n
3. - T(n) = T(3/4*n) + T(n/5) + 11/5 * n
   - <= 44*3/4 * n + 44 \* n/5 + 11/n
   - 33n + 11n = 44n

### pseudo code

<!-- prettier-ignore -->
```python
def MoM(A, k):
  if (|A| == 1): return A[0]
  S, L, M, medians = [], [], [], []
  i = 0
  while(i + 4 < |A|):
    medians.append(find_median_five(L[i : i+5]))
    i += 5
  if(i < |A| and i + 4 >= |A|):
    medians.append(find_median_five(L[i+5: ]))
  mom = MoM(medians, len(medians)//2)
  for v in A:
    if(v < mom): S.append(v)
    elif(v > mom): L.append(v)
    else: M.append(v)
  if(len(S) > k): return MoM(S, k)
  elif(len(S) + len(M) < k): return MoM(B, k - len(S) - len(M))
  else: return mom
```
