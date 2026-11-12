# Arbiter Hacks V1 분석 (2026-11-12)

## 1. 대회 요약
- Devpost 온라인, 2026-10-20 ~ **2026-12-20 9:00pm PST (= 12-21 14:00 KST)**, 늦으면 심사 제외
- **자격: 13세 이상 학생만**, 기업/전문조직 제외, 팀 1–4명, 국가 제한 없음(표준 제재국 제외)
- 트랙 중 하나만 선택
  - General: 자유 주제, 동작하는 SW/HW
  - Theme "Rethinking Waste": 핵심 목적이 폐기물 감축/분류/재활용이어야 함(억지 연결은 General 취급)
- 필수 제출물(누락 시 실격): 공개 repo, 2–3분 데모 영상(YouTube/Vimeo), 설명(what/how/next), Theme은 "대상 폐기물 문제 + 성공 측정 방법" 1문단 추가
- 상금 $7,800 표기지만 현금은 총 $300(1등 $100, 2등 $50), 나머지는 Adaption/Deployxa 크레딧
- 주최 "Arbiter" 신원 미확인, 첫 회차
- Cloudflare 때문에 /rules는 자동으로 읽지 못함. 검색 스니펫과 참가자 README로 복원했으므로 사람이 직접 확인 필요

### 심사 기준
| General | 가중치 | Theme | 가중치 |
|---|---|---|---|
| Innovation & Originality | 25 | Impact on Waste Problem | 35 |
| Technical Execution | 35 | Technical Execution | 25 |
| Completeness & Polish | 25 | Feasibility & Deployability | 20 |
| Presentation & Demo | 15 | Presentation & Demo | 20 |

## 2. 실행 환경 판단: GO (조건부)
- 디스크 가용 11GB(다른 대회 폴더와 공유), RAM 11GB(가용 약 4GB, swap 없음), 2코어, GPU 없음
- 예산: 프로젝트 ≤ 1.5GB, 여유 공간 ≥ 7GB 유지
- 금지: 로컬 LLM 가중치, torch, 대용량 데이터셋, Docker
- 정적 웹앱 + (선택적) 호스팅 LLM API로 진행. 현재 서버에는 LLM API 키가 없음

## 3. 유사 대회 수상작을 Arbiter 기준으로 다시 채점 (추정치)
유사 대회 9개, 수상작 31개의 원 조사 결과는 subagent 보고서에 있음. 아래 점수는 Arbiter 루브릭을 적용한 정성 추정.

### General 루브릭 (Innov 25 / Tech 35 / Polish 25 / Pres 15)
| 프로젝트 (원 대회, 순위) | Innov | Tech | Polish | Pres | 합계 |
|---|---|---|---|---|---|
| Aetherforge (Blueprint 1st) | 22 | 28 | 21 | 14 | **85** |
| HydroSwarm (Reverie 1st SW) | 21 | 32 | 20 | 12 | **85** |
| NeighbourNet (AI Builders Grand) | 22 | 30 | 18 | 13 | 83 |
| Strata (Reverie 1st ML) | 22 | 27 | 20 | 13 | 82 |
| Lily Memo (DSH 1st) | 17 | 29 | 23 | 12 | 81 |
| AgentCrashLab (Pixel Forge 1st) | 19 | 31 | 20 | 11 | 81 |
| SciSim (DSH 3rd) | 17 | 26 | 21 | 12 | 76 |
| Pawse (CS Girlies 1st) | 15 | 27 | 22 | 12 | 76 |
| PULSE (WarriorHacks 1st) | 18 | 28 | 16 | 10 | 72 |
| Negative Space (CS Girlies RU, AI 없음) | 18 | 14 | 22 | 12 | 66 |

### Theme 루브릭 (Impact 35 / Tech 25 / Feas 20 / Pres 20), 폐기물 관련 수상작
| 프로젝트 | Impact | Tech | Feas | Pres | 합계 |
|---|---|---|---|---|---|
| SurplusAI (NextStep 1st) | 28 | 20 | 14 | 16 | **78** |
| PantryPulse (WarriorHacks 3rd) | 27 | 16 | 16 | 15 | 74 |
| PromptFootprint (NextStep 2nd) | 22 | 17 | 17 | 15 | 71 |
| RightMeal (NextStep 3rd) | 24 | 17 | 15 | 14 | 70 |
| MoveOut Match (코드 없음) | 24 | 5 | 12 | 15 | 56 (Arbiter에선 실격 위험) |

**결론:** 입상선은 General 약 80점 이상, Theme 약 75점 이상으로 추정. 점수가 높은 작품의 공통점은 다음과 같음.
- 결정론적 코어 위에 LLM을 얹은 구조
- 가입 없이 바로 써볼 수 있는 배포 URL
- 구체적인 개인 경험·실제 사건으로 시작하는 서사
- 한계를 정직하게 명시

## 4. 후보 아이디어 5개
| # | 아이디어 | 트랙 | 핵심 | 예상 점수 | 리스크 |
|---|---|---|---|---|---|
| **1** | **SortLocal: 지역 분리배출 규칙을 코드로 만들고 오염률을 진단** | Theme | 재활용 오염의 원인은 "지역마다 규칙이 다름". 시 공식 가이드를 구조화된 규칙 코드(출처 인용 포함)로 컴파일하고, 결정론적 엔진이 품목마다 지역별 답과 근거를 제시. 오염 감사(audit) 모드에서 오염률·CO2e를 측정 | 27/21/17/16 = **81** | 지원 도시 규칙의 정확도(테스트로 보완) |
| 2 | Surplus Router: 잉여 식품 ↔ 푸드뱅크 최적 배정 | Theme | 제약 기반 최적화(유통기한, 콜드체인, 거리) + LLM이 자유 텍스트 등록글을 파싱 | 27/21/15/16 = 79 | 기존 수상작과 유사, 양면 시장이라 실현성 약함 |
| 3 | Campus Waste Audit Lab | Theme | 학교 쓰레기 감사 기록 → EPA WARM 계수로 전환율·CO2e 계산 → 개선 계획 | 26/19/17/15 = 77 | 시각적 임팩트가 약함 |
| 4 | Fix-or-Ditch: 전자제품 수리/교체 판단기 | Theme | 수리 가능성, 부품 가격, 수명주기 탄소 비교 | 25/18/16/15 = 74 | 데이터 확보가 어려움 |
| 5 | Arbiter Probe: LLM-as-judge 편향 테스트 도구 | General | 위치·길이·자기선호 편향을 통계 검정 | 21/28/19/12 = 80 | API 키 필요, 경쟁 치열 |

### Top 1 선정 이유: SortLocal
- Theme 트랙 1·2등은 General과 별도로 시상되고, 경쟁작 다수가 일반적인 CV 쓰레기 분류기임. SortLocal은 "지역 규칙 정확성"이라는 다른 각도를 잡음
- API 키 없이 정적 사이트로 동작해 GitHub Pages에 무료 배포 가능하고, 디스크 사용량이 매우 적음
- "결정론적 코어 + 출처 인용 + 테스트" 구조가 Tech/Feasibility 점수와 맞음
- 측정 방법(오염률, kg CO2e)이 제품 안에 내장되어 Theme 필수 문단과 바로 연결됨
