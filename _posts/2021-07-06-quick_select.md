---
title: "Quick Select"
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

1. 현재의 후보 중에서 임의로 수 하나를 선택

   - pivot이라 부르고 p로 표기

2. 후보 수를 하나씩 p와 비교하여 p보다 작은 수는 집합 S에, 같은 수도 있을 수 있으니 집합 M에 p보다 큰 수는 집합 L로 분류
3. len(S) > k 라면:(즉, p보다 작은 수가 k개가 넘기 때문에 k번째로 작은 수는 S에 있음.) 따라서 S에서 k번째로 작은 수를 찾으면 됨.
4. len(S) + len(M) < k라면: p보다 작거나 같은 수가 k개 미만이라면 k번째로 작은 수는 당연히 L에 있어야 함. 그러면 L에서 k번째로 작은 수를 찾으면 된다
5. 위의 두 경우가 아니라면: 당연히 k번째로 작은 수는 M에있고, 그 수는 바로 피봇 p임. 따라서 p를 return

### pseudo code

<!-- prettier-ignore -->
```python
def Quick_Select(L, k):
  A, M, B = [], [], []
  p = L[0]
  for a in L:
    if(a < p): A.append(a)
    elif(a == p): M.append(a)
    else: B.append(a)
  if(len(A) >= k): return Quick_Select(A, k)
  elif(len(A) + len(M) < k): return Quick_Select(B, k - len(A) - len(M))
  else: return p
```

### 수행시간

1. 가장 좋은 경우

   - S 또는 L가 A의 반 정도로 계속 줄어드는 경우
   - T(n) = T(2/n) + n ..... -> O(n)

2. 가장 나쁜 경우

   - S 또는 L에 p를 제외한 모든 수가 몰리는 경우
   - T(n) = T(n - 1) + n ..... -> O(n^2)

### 약점

- S와 L의 크기를 A의 1/c 이내로 보장하기 위해 pivot 선택이 중요

- 대신 알고리즘의 평균적인 수행식간은 O(n) 보장
