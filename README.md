# ODA Intelligence Plugin

[한국어](README.md) | [English](README.en.md)

근거 기반 개발협력 조사를 위한 Claude, Codex 및 ChatGPT 공개 패키지입니다.

이 플러그인은 세 개의 Skill을 설치하고, 다음의 공개 읽기 전용 MCP 게이트웨이
한 개에 연결합니다.

```text
https://oda-mcp.fly.dev/oda-intelligence/v2/mcp
```

게이트웨이는 국제원조 및 국가 현황, 한국 ODA 사업, 개발협력 문서, KOICA 규정
조사를 위한 통제된 도구를 제공합니다. 사용자는 OAuth 토큰이나 IATI 인증 정보를
제공할 필요가 없습니다.

네 가지 데이터 도메인은 각각 별도의 Claude 커넥터로 설치되지 않습니다.
Claude에는 `oda-intelligence` 커넥터 한 개가 표시되며, 이 커넥터가 제공하는
29개의 읽기 전용 도구는 `io-mcp`, `oda-map-lab`, `devcoop-kg`,
`koica-reg` 백엔드로 요청을 전달합니다. 별도로 구성한 `devcoop-trends` 또는
`koica-reg-mcp` 커넥터는 레거시/직접 연결이며 이 플러그인과 독립적으로
작동합니다.

이 저장소에는 서버 구현 소스, 배포 비밀 정보, 비공개 Git 기록 또는 로컬 인증
정보 저장소가 포함되어 있지 않습니다. 유일한 런타임 의존성은 공개 MCP
계약입니다.

## Claude

`amnotyoung/oda-intelligence-plugin`을 개인 플러그인 마켓플레이스로 추가한
다음 `ODA Intelligence`를 설치합니다.

마켓플레이스를 동기화하거나 플러그인을 업데이트한 뒤에는 새 Claude 대화를
시작하세요. 기존 대화에는 대화 생성 시점의 도구 스냅샷이 남아 있을 수 있습니다.
플러그인 상세 화면에는 다음 구성 요소가 설치된 것으로 표시되어야 합니다.

- Skill 세 개
- `oda-intelligence`라는 이름의 커넥터 한 개
- 해당 커넥터가 제공하는 읽기 전용 도구 29개

Skill 세 개만 표시된다면 마켓플레이스를 동기화하고 플러그인을 업데이트하거나
재설치한 뒤 새 대화를 시작하세요. Skill 자체는 숨겨진 백엔드를 호출하지 않으며,
번들로 제공되는 커넥터가 필요합니다.

Claude Code:

```bash
claude plugin marketplace add amnotyoung/oda-intelligence-plugin
claude plugin install oda-intelligence@oda-intelligence-plugin
```

아래는 데스크톱 앱에서의 설치 데모입니다. 마켓플레이스를 추가하고, Skill 세 개와
커넥터 한 개가 설치된 것을 확인한 뒤, 실제 질문에 답하기까지를 2배속으로
담았습니다.

![ODA Intelligence 설치 데모](docs/assets/install-demo.gif)

## Codex

공개 마켓플레이스에서 설치합니다.

```bash
codex plugin marketplace add amnotyoung/oda-intelligence-plugin
codex plugin add oda-intelligence@oda-intelligence-plugin
```

로컬 개발 시에는 저장소 인자를 `.`으로 바꾸세요.

설치 또는 업데이트 후 새 작업을 시작해야 Codex가 새 Skill과 MCP 구성을
불러옵니다.

## ChatGPT

전체 플러그인은 번들로 제공되는 세 개의 Skill과 등록된 `ODA Intelligence`
MCP 앱을 결합합니다. 커밋된 `.app.json`에는 앱의 기술 식별자가 들어 있으며,
인증 정보나 인증 토큰은 포함되어 있지 않습니다.

유지관리자 테스트 시 ChatGPT 개발자 모드를 활성화하고, 이 저장소를 개인
마켓플레이스 소스로 추가한 다음 `ODA Intelligence`를 설치하세요. 등록된 앱은
인증 없이 위 게이트웨이 URL을 사용합니다.

이 개발자 모드 패키지는 아직 공개 디렉터리에 출시되지 않았습니다. 모든
ChatGPT 사용자에게 배포하려면 동일한 게이트웨이를 **With MCP** 유형으로
디렉터리에 제출해야 합니다. Skill만 제출하면 앱 매핑은 의도적으로 제외됩니다.

ChatGPT는 승인된 도구 정의의 스냅샷을 유지합니다. 호환되는 데이터 및 서버 동작
변경은 같은 URL에서 사용할 수 있지만, 도구 계약의 새 버전은 워크스페이스
관리자가 검토하고 갱신해야 합니다.

## 도구

커넥터는 다섯 개 출처 도메인에 걸쳐 29개의 읽기 전용 도구를 제공합니다. 출처에
쓰기를 수행하는 도구는 없으며, 사용자에게 인증 정보를 요구하는 도구도 없습니다.

번들로 제공되는 Skill 세 개가 대부분의 질문을 알맞은 도구로 연결하므로, 평범한
질문에는 도구 이름을 댈 필요가 없습니다. 아래 표는 호출을 직접 고르거나, 남이
만든 호출을 읽을 때 쓰는 자료입니다.

이 도구들로 만든 답변이 버티려면 두 가지 습관이 필요합니다.

- **상태 도구를 먼저 호출합니다.** `oda_map_data_status`,
  `procurement_model_status`, `country_data_status`, `iati_status`는 각 백엔드가
  지금 무엇을 보유하고 있는지 보고합니다. 이를 건너뛰고 근거 도구를 부르면
  빈약한 응답을 완결된 답으로 오해하기 쉽습니다.
- **결측은 0이 아닙니다.** `stale`, `no_data`, `disabled`, `error`는 모두 근거를
  관측하지 못했다는 뜻입니다. 수치가 0이라거나 위험이 없다는 뜻이 아닙니다.
  응답에 실리는 `missing_is_zero: false`가 그것을 명시합니다.

### 자연어로 묻기

Skill은 도구 이름이 아니라 주제로 라우팅합니다. 세 Skill이 각각 다른 종류의
질문을 맡습니다.

| Skill | 맡는 질문 | 사용하는 도메인 |
|---|---|---|
| `korean-oda-portfolio-lookup` | 한국 기관이 그 나라에서 무엇을 하고 있는지 — 사업 목록, 기관·분야별 분포, 진행·종료 건수, 개별 사업 상세, 특정 사업과 비슷한 사업 찾기 | `korean-oda-map` |
| `generate-development-country-report` | 국가보고서·원조 지형 검토, 중점분야 선정, 참여 경로, 조달 진입, Go/No-Go 위험 | 다섯 개 전부 |
| `koica-regulation-research` | KOICA 내부 규정 — 인사, 휴가, 보수, 승진, 징계, 조직, 회계, 계약, 조달, 감사, 복리후생, 연수 | `koica-regulations` |

프롬프트를 쓸 때 다음 네 가지가 결과를 좌우합니다.

- **국가명을 밝힙니다.** 한국어와 영문이 모두 해석됩니다(`미얀마`, `Myanmar`).
  조달은 `nepal`, `NPL` 같은 slug·ISO3 코드도 받습니다.
- **기준일을 지정합니다.** 건수를 재현해야 할 때 필요합니다. 사업 상태는 호출할
  때마다 다시 계산되므로 "2026-03-31 기준으로"라고 못 박아야 고정됩니다.
- **무엇에 쓸 답인지 말합니다.** 보고서인지, 슬라이드인지, 의사결정 메모인지에
  따라 끌어올 근거의 양이 달라집니다.
- **인용 검증을 직접 요청합니다.** 규정을 인용한 문단이라면 "인용한 조문을
  검증해줘"라고 덧붙이면 `verify_citation`이 초안을 훑어 존재하지 않는 조문을
  잡아냅니다.

아래 각 도메인에는 프롬프트와, 그 프롬프트가 대체로 풀려 나가는 호출을 함께
싣습니다. 호출을 고르는 것은 모델이므로 보장된 순서가 아니라 통상적인 해석으로
읽으세요.

### 한국 ODA 사업 — `korean-oda-map`

한국 개발협력 사업과 그 위치를 다룹니다. 상태 도구부터 호출하세요. 원천 레이어와
승인 보정 레이어의 상태를 분리해 보고합니다.

| 도구 | 무엇을 반환하는가 | 입력 |
|---|---|---|
| `oda_map_data_status` | 레이어 상태(`fresh`, `stale`, `no_data`, `disabled`, `error`), 캐시 시각, 레코드 수, 커버리지 | `country` |
| `oda_map_country_context` | 국가별 사업·기관·위치 현황 요약. 지도 핀 수와 고유 사업 수를 구분하고 사업 상태를 `as_of` 기준으로 다시 계산합니다. 실시간 재난·치안·여행경보는 포함하지 않습니다 | **`country`**, `as_of`, `sections`, `sample_limit`, `include_coordinates` |
| `oda_map_projects` | 국가의 사업을 검색·필터·페이지 처리합니다. 다중 위치 사업은 활동 식별자 기준으로 한 번만 집계하고 위치는 `locations`에 보존합니다 | **`country`**, `query`, `agency`, `sector`, `status`, `layers`, `as_of`, `limit`, `offset`, `fields`, `include_coordinates` |
| `oda_map_project_detail` | 사업 식별자 또는 위치 접미사가 붙은 지도 entity ID로 사업 상세를 조회합니다. 다중 위치, 예산 중복, 원천 레이어 상태, 기준일 상태를 분리해 반환합니다 | **`project_id`**, `country`, `as_of`, `include_coordinates` |

> 미얀마에서 한국 기관들이 하는 보건 사업을 정리하고, 어느 출처에서 나온
> 목록인지 밝혀줘.

```text
oda_map_data_status    { "country": "미얀마" }
oda_map_projects       { "country": "미얀마", "sector": "보건", "limit": 3 }
oda_map_project_detail { "project_id": "iati:KR-GOV-110-201917011048" }
```

`status`는 `active`, `ended`, `planned`, `unknown` 중 하나이며 저장된 값이 아니라
`as_of`로 다시 계산한 값입니다. 따라서 사업 건수는 어느 기준일로 계산했는지와
함께 제시해야 의미가 있습니다.

### 국제 현황 — `international-data`

국제 출처에서 모은 국가 현황입니다. `country_data_status`가 출처 키별로 최신성을
보고하므로, 어떤 수치든 인용하기 전에 먼저 확인하세요.

| 도구 | 무엇을 반환하는가 | 입력 |
|---|---|---|
| `country_data_status` | IATI·World Bank·OECD·재난·HAPI·UNHCR·WHO·ReliefWeb 문서의 관측일·수집일·캐시일·건수·오류·최신성 요약 | **`countryCode`**, `refresh` |
| `country_report_context` | 보고서용 정제 데이터를 한 번에 반환합니다. 기본은 출처 상태·건수·출처별 표본 3건입니다 | **`countryCode`**, `sampleSize`, `fields`, `refresh` |
| `country_humanitarian_context` | HDX HAPI·UNHCR·WHO GHO의 정형 관측치와 ReliefWeb·World Bank 최신 문서 메타데이터 | **`countryCode`**, `sampleSize`, `fields`, `refresh` |
| `country_hazard_snapshot` | USGS·GDACS·NASA EONET 사건을 국가 경계로 거른 뒤 같은 유형·100㎞·48시간 기준으로 중복 제거한 결과 | **`countryCode`**, `sampleSize`, `includeEvents`, `fields`, `refresh` |
| `country_travel_alert` | 외교부 여행경보 단계. 대한민국 국민 대상 안전 정보이며 사업 타당성 평가가 아닙니다. 공개 배포에서는 비활성 상태입니다(아래 참조) | **`countryCode`**, `refresh` |
| `country_list` | KOICA 해외사무소 소재국·겸임국을 ISO 코드, 담당 사무소, 관할 역할과 함께 반환 | (없음) |
| `country_map_outline` | 보고서 배경용 단순화 국가 윤곽선. 사업 위치를 얹을 지리 맥락일 뿐 경계 확정이 아닙니다 | **`countryCode`** |
| `iati_query_country` | IATI 활동·거래·예산 조회. 기본은 건수와 표본 3건이며 `summary: false`일 때 상세 레코드를 반환합니다 | **`countryCode`**, `collection`, `rows`, `start`, `summary`, `fields`, `sectorCode`, `reportingOrganisation`, `iatiIdentifier`, `activityStatusCode`, `startDate`, `lastUpdatedAfter` |
| `iati_status` | 서버의 IATI 조회 기능이 준비됐는지만 확인합니다. 자격 증명 값이나 저장 위치는 반환하지 않습니다 | (없음) |
| `iati_test_connection` | 서버가 관리하는 자격 증명으로 미얀마 활동 1건을 조회해 연결을 시험합니다. 자격 증명은 출력하지 않습니다 | (없음) |

> 지금 미얀마에 대해 국제 근거가 얼마나 확보되는지, IATI에는 무엇이 있는지
> 알려줘.

```text
country_data_status    { "countryCode": "MM" }
country_report_context { "countryCode": "MM", "sampleSize": 3 }
iati_query_country     { "countryCode": "MM", "collection": "activity", "rows": 3 }
```

`countryCode`는 ISO alpha-2 코드이며(미얀마는 `MM`), `collection`은 `activity`,
`transaction`, `budget` 중 하나입니다.

### KOICA 규정 — `koica-regulations`

KOICA 규정 색인에 대한 검색·전문 조회·상호참조·인용 검증입니다. 단독 배포판
`koica-reg-mcp` 공개 서버와 같은 도구 표면입니다. 규정 텍스트는 공공데이터포털의
"한국국제협력단_정관 및 내부규정"(이용허락범위 제한 없음)으로 개방되어 있으며,
그것이 전문을 여기서 그대로 제공하는 재배포 근거입니다. 사용 순서는 탐색 →
전문 조회 → 인용 검증입니다.

| 도구 | 무엇을 반환하는가 | 입력 |
|---|---|---|
| `search_regulation` | 규정 메타데이터와 조문 스니펫, 적합도 점수. `include_attachments: true`면 별표·별지도 함께 검색합니다 | **`query`**, `category`, `source`, `limit`, `fuzzy`, `include_attachments` |
| `get_article` | 규정명·조문 번호로 조문 본문 전체를 반환합니다. 본칙 조문이 같은 번호의 부칙 조문보다 우선합니다 | **`source`**, **`article`** |
| `list_sources` | 색인된 현행 규정 목록. 규정 유형, 개정일, 조문 수 포함 | `category` |
| `list_attachments` | 별표·별지 목록을 제목·발췌와 함께 반환하며 규정·유형·종류로 필터링합니다. 응답 예산에 맞춰 잘리지만 `total`이 언제나 실제 총계를 담습니다 | `source`, `category`, `kind`, `include_deleted` |
| `get_attachment` | 규정명과 라벨로 별표·별지 본문 전체를 반환합니다. 라벨은 `"별표 1"`, `"별지 제3호 서식"` 등 자유 형식입니다 | **`source`**, **`label`** |
| `find_references` | 조문 하나의 인용 관계 그래프. 이 조문이 인용한 곳(`outgoing`)과 이 조문을 인용한 곳(`incoming`)을 각각 `same_regulation`, `cross_regulation`, `external`로 표시합니다. `include_mermaid: true`면 인용망 flowchart 코드가 함께 실립니다. 조문을 찾지 못해도 오류가 아니라 빈 그래프를 반환합니다 | **`source`**, **`article`**, `limit`, `include_mermaid` |
| `compliance_radar` | 정비 레이더 — 모규정이 더 최근에 개정된 시행세칙·지침을 `review_needed` / `ok` / `unknown` / `no_parent`로 플래그합니다 | `source` |
| `verify_citation` | 텍스트 안의 모든 `{규정명} 제N조` 인용을 색인과 대조해 `ok`, `not_found`, `unknown_source`로 분류합니다 | **`text`** |

> 연차휴가를 며칠 쓸 수 있는지 근거 조문 전문과 함께 알려줘.

```text
search_regulation { "query": "연차휴가", "limit": 3 }
get_article       { "source": "복무규정", "article": "제24조" }
get_attachment    { "source": "복무규정", "label": "별표 1" }
find_references   { "source": "직제규정", "article": "제9조" }
verify_citation   { "text": "인사규정 제9999조에 따라 처리한다." }
```

`verify_citation`은 지어낸 조문을 막는 장치입니다. 위 인용은 `not_found`로
돌아옵니다. 인사규정에 제9999조가 없기 때문입니다. 규정을 인용한 문단은 회람하기
전에 이 도구로 한 번 훑으세요. 색인은 동기화 주기만큼 공식 개정을 뒤따르므로,
중대한 결론은 현행 공식 원문으로 확인하세요.

### 개발협력 문서 — `development-documents`

국가사무소 개발협력 문서와 거기서 추출한 관계를 다룹니다 — 동향 위키에 직접
가지 않아도 그 내용을 조회할 수 있습니다. 코퍼스가 사무소 단위이므로 검색 전에
사무소부터 확인합니다. 사용 순서는 탐색 → 문서 컨텍스트 → 관계 근거입니다.

| 도구 | 무엇을 반환하는가 | 입력 |
|---|---|---|
| `list_available_corpora` | 이용 가능한 공개 코퍼스와 사무소 관할. 문서 수, 문서 종류, 포함 국가를 함께 반환 | (없음) |
| `search_development_trends` | 문서 탐색 메타데이터와 요약, 문서별 공식 원문 링크 | **`office`**, **`query`**, `country`, `sector`, `kinds`, `office_role`, `month_from`, `month_to`, `limit` |
| `get_trend_document` | 검색이 반환한 `article_id`로 문서 하나의 컨텍스트를 조회합니다 — 메타데이터, 공식 링크, 그 문서에서 추출된 관계들 | **`office`**, **`document_id`** |
| `search_entity_relationships` | 특정 기관이 source 또는 target인 관계 검색. 관계마다 근거 문장과 근거 문서를 동봉하며, `total_matches`가 전체 일치 수를 항상 보고합니다 | **`office`**, **`entity`**, `relation_type`, `month_from`, `month_to`, `kinds`, `query`, `limit` |

> 캄보디아에서 KOICA가 어떤 기관들과 협력하는지, 무슨 근거로 그런지 보여줘.

```text
list_available_corpora      {}
search_development_trends   { "office": "캄보디아", "query": "보건 분야 동향", "limit": 3 }
get_trend_document          { "office": "캄보디아", "document_id": "<검색이 준 article_id>" }
search_entity_relationships { "office": "캄보디아", "entity": "KOICA", "limit": 10 }
```

`office`는 국가명 또는 slug(`캄보디아`, `cambodia`)를 받고, `kinds`는 `trend`와
`project` 중에서 고르며, `office_role`은 주재국과 겸임국을 구분합니다. 관계
추출은 검증된 사실이 아니라 신호입니다 — 모든 관계에 근거 문서가 동봉되므로,
주장을 옮기기 전에 그 문서를 확인하세요. 문서 식별자는 도구를 잇는 조회
키입니다. 독자용 산문에서는 원시 식별자가 아니라 제목·날짜·출처·공식 링크로
문서를 인용하세요.

### 협력국 조달 — `partner-country-procurement`

국가별로 세 개 축을 모델링합니다. `bidding`(입찰제도), `governance`(조달
거버넌스), `pipeline`(ODA 사업형성 절차)입니다. 조달 근거를 쓰기 전에 어떤 축이
있는지 먼저 확인하세요.

| 도구 | 무엇을 반환하는가 | 입력 |
|---|---|---|
| `procurement_model_status` | 국가별로 어떤 축이 모델링되어 있는지와 그 검증 상태 | `country` |
| `procurement_country_context` | 축별 요약: 권한기관, 절차 단계, 병목, 진입장벽. 전체 공정 그래프는 포함하지 않습니다 | **`country`** |
| `procurement_model_detail` | 한 국가·한 축의 모델 전체. canvas, 공정 그래프(lanes·stages·nodes·edges), 검증 원출처 포함 | **`country`**, **`axis`** |

> 네팔에서 ODA 사업이 어떤 절차로 형성되는지, 병목이 어디인지 설명해줘.

```text
procurement_model_status { "country": "네팔" }
procurement_model_detail { "country": "네팔", "axis": "pipeline" }
```

`country`는 slug, ISO3 코드, 한국어명, 영문명을 모두 받습니다(`nepal`, `NPL`,
`네팔`, `Nepal`). 모델이 없다는 것은 그 축이 아직 모델링되지 않았다는 뜻이지,
협력국에 공식 절차가 없다는 뜻이 아닙니다.

### 공개 프로필 제한

공개 프로필은 결과 크기를 제한하고 일부 필드를 제공하지 않습니다. 클라이언트가
아니라 게이트웨이가 강제합니다.

| 파라미터 | 제한 |
|---|---|
| `limit` | `search_regulation` 10, `find_references`·`search_development_trends` 20, `search_entity_relationships` 50, `oda_map_projects` 100 |
| `rows` | `iati_query_country` 20 |
| `sampleSize`, `sample_limit` | 10 |
| `offset`, `start` | 10000 |
| `fields` | 각 도구 스키마에 열거된 값만 |
| `refresh` | 무시 — 서버가 관리하는 캐시를 제공합니다 |
| `includeEvents` | 최대 200건 — 실제 총계는 `record_count`가 그대로 보고합니다 |
| `list_attachments` 결과 | 응답 예산에 맞춰 잘림 — `total`이 언제나 실제 총계를 담고, caveat가 좁힐 필터를 안내합니다 |
| `oda_map_projects` 항목 | 무거운 필드 조합(전체 필드+좌표)은 응답 예산에 맞춰 잘립니다 — `returned`·`has_more`가 페이징에 맞게 보정되고 caveat가 잘린 건수를 알립니다. 기본 압축 필드는 100건이 그대로 반환됩니다 |

## 통제된 업데이트

- 데이터 및 호환되는 서버 동작은 플러그인을 업데이트하지 않아도 원격
  서비스에서 변경될 수 있습니다.
- 버전이 지정된 `v2` 엔드포인트는 승인된 도구 표면을 고정합니다. 도구 이름,
  필수 입력, 필수 출력, 읽기 전용 보장 및 노출 위험이 높아 금지된 도구는
  `contracts/gateway-contract.json`을 기준으로 검사합니다.
- 일일 워크플로가 호환 가능한 메타데이터 변경을 기록하여 검토할 수 있게 합니다.
- 호환성을 깨뜨리는 계약 변경이 감지되면 승인된 계약을 다시 작성하지 않고
  검사에 실패합니다.
- Skill 라우팅 또는 승인된 계약을 변경하려면 버전이 지정된 플러그인
  업데이트가 필요합니다.

## 데이터 출처와 출처 제시

각 게이트웨이 도구는 자신의 출처 도메인을 도구 설명에 `[Source: ...]` 형태로
선언합니다. 답변은 근거로 삼은 출처의 이름과 공개 주소를 함께 제시합니다.
독자가 원본을 직접 열어 확인할 수 있어야 하기 때문입니다.

출처 상태 항목에는 `public_url` 필드가 실립니다. 아래 표보다 이 필드를 우선
사용하세요. 게이트웨이가 그 출처에 대해 직접 선언하는 값이며, 이 문서가 뒤처져도
정확합니다.

| 출처 도메인 | 도구 | 공개 주소 |
|---|---|---|
| `korean-oda-map` | `oda_map_data_status`, `oda_map_country_context`, `oda_map_projects`, `oda_map_project_detail` | https://oda-map-lab.pages.dev |
| `international-data` | `country_data_status`, `country_report_context`, `country_list`, `country_map_outline`, `country_hazard_snapshot`, `country_humanitarian_context`, `country_travel_alert`, `iati_query_country`, `iati_status`, `iati_test_connection` | 아래 출처 키별 주소 |
| `koica-regulations` | `search_regulation`, `find_references`, `list_sources`, `verify_citation` | 공개 주소 미등록 |
| `development-documents` | `list_available_corpora`, `search_development_trends` | 공개 주소 미등록 |
| `partner-country-procurement` | `procurement_country_context`, `procurement_model_detail`, `procurement_model_status` | 응답의 `model_url` 필드에 모델별 주소 |

`korean-oda-map`은 한국 개발협력 사업 위치를 독립적으로 취합한 비공식 지도입니다.
한국 ODA 사업 데이터에 기반하지만 어느 기관도 발행하지 않았고 어느 기관의 보증도
받지 않았습니다. 비공식 지도로 인용하고, 발행 기관을 지어내지 마세요.

`country_data_status`는 `international-data` 안에서 출처 키별로 최신성을
보고합니다. 도메인이 아니라 그 키를 출처로 제시합니다.

| 출처 키 | 공개 주소 |
|---|---|
| `iati` | https://d-portal.org |
| `oecd` | https://data-explorer.oecd.org |
| `world_bank` | https://data.worldbank.org |
| `world_bank_documents` | https://documents.worldbank.org |
| `unhcr` | https://www.unhcr.org/refugee-statistics/ |
| `who_gho` | https://www.who.int/data/gho |
| `reliefweb` | https://reliefweb.int |
| `hdx_hapi` | https://hapi.humdata.org |
| `usgs` | https://earthquake.usgs.gov |
| `gdacs` | https://www.gdacs.org |
| `eonet` | https://eonet.gsfc.nasa.gov |
| `acled` | https://acleddata.com |
| `mofa_travel_alert` | https://www.0404.go.kr |

`international-data`에 속하지만 출처 키가 없는 도구가 둘 있습니다.
`country_list`는 개발협력 문서 인덱스에서 가져온 사무소 관할 정보를 반환하므로,
공개 주소가 등록되지 않은 그 인덱스를 출처로 제시합니다. `country_map_outline`은
자신의 출처를 응답에 직접 싣습니다. 매 응답의 `source` 필드가 공개
`datasets/geo-countries` GeoJSON 주소 —
https://raw.githubusercontent.com/datasets/geo-countries/main/data/countries.geojson
— 를 담으므로, 조달의 `model_url`처럼 그 필드를 인용합니다.

KOICA 규정 색인과 개발협력 문서 코퍼스에는 공개 주소가 없으며 게이트웨이가 곧
접근 경로입니다. 색인된 텍스트를 어디서 볼 수 있느냐는 질문에는 그렇게 답합니다.
이름이 비슷한 공개 포털은 다른 자료를 담고 있어, 그쪽으로 안내하면 독자가 하려던
확인을 오히려 막습니다. 조달은 다릅니다. 모델 응답마다 `model_url`이 실리므로
도메인이 아니라 그 필드를 인용합니다.

`country_travel_alert`는 계약에 승인되어 있지만, 공개 배포에 외교부 여행경보
서비스키가 설정되어 있지 않아 `mofa_travel_alert`가 `disabled`로 보고되고 도구는
경보 등급을 반환하지 않습니다. 이는 비활성 출처이지 여행 위험의 부재가 아닙니다.

## 공개 콘텐츠 범위

- KOICA 규정 도구는 검색, 조문 전문, 별표·별지 전문, 상호 참조, 정비 레이더 및
  인용 검증을 제공합니다. 재배포 근거는 공공데이터포털의 개방 릴리스
  "한국국제협력단_정관 및 내부규정"(이용허락범위 제한 없음)입니다. 대량 일괄
  추출은 여전히 제공하지 않으며, 목록은 응답 예산에 맞춰 잘리되 실제 총계를
  함께 보고합니다.
- 개발협력 문서 도구는 코퍼스 탐색, 요약, 공개 원문 URL, 문서별 컨텍스트,
  그리고 근거 문서가 동봉된 추출 관계를 제공합니다. 재배포 근거는
  공공데이터포털의 개방 릴리스 "한국국제협력단_국별 개발협력동향"(이용허락범위
  제한 없음)입니다. 문서 전문은 공식 원문 링크에 있으며, 위키 내부 경로와
  플래그는 공개 응답에서 제거됩니다.
- IATI 및 기타 국제 출처의 인증 정보는 서버에서 관리하며 플러그인에 포함하거나
  사용자에게 반환하지 않습니다.
- 한국 ODA 통합누리집 지도 도구는 공개 지도에 이미 표시된 최종 유효 좌표를
  반환할 수 있습니다. 좌표의 출처와 범위는 유지해야 하며, 보정 전 좌표,
  검토 이력 및 제출자 정보는 제외됩니다.

## 데이터 이용 안내

이 플러그인은 요청을 외부 데이터 서비스로 전달합니다. 출처의 가용성, 라이선스,
기밀성 및 재사용 조건에는 각 출처와 운영자의 정책이 적용됩니다. 공개 MCP
엔드포인트라는 이유만으로 반환된 모든 문서가 제한 없이 재배포할 수 있다고
간주하지 마세요.

## 함께 쓰는 도구

같은 관리자의 다중 에이전트 OECD-DAC 평가 프레임워크
[DevEval Agents](https://github.com/amnotyoung/dev-eval-agents)는 이
게이트웨이를 **선택적 증거원**으로 사용합니다 — 적절성·일관성 평정을 위한 국가
맥락, 중복 확인을 위한 한국 ODA 지도, 평가보고서의 규정 조문 인용을 검증하는
`verify_citation`. 연동은 단방향·선택 사항이며, 이 플러그인은 DevEval에
의존하지 않고 도구 표면도 그로 인해 달라지지 않습니다.

## 개발

```bash
npm ci
npm test
npm run contracts:check
```

소스 코드는 [Apache License 2.0](LICENSE)에 따라 제공됩니다. MCP 도구가
반환하는 데이터에 이 저장소의 라이선스가 새로 적용되는 것은 아닙니다.
[개인정보 처리방침](PRIVACY.md)과 [이용약관](TERMS.md)을 확인하세요.
