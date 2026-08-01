# ODA Intelligence Plugin

[English](README.md) | [한국어](README.ko.md)

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
23개의 읽기 전용 도구는 `io-mcp`, `oda-map-lab`, `devcoop-kg`,
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
- 해당 커넥터가 제공하는 읽기 전용 도구 23개

Skill 세 개만 표시된다면 마켓플레이스를 동기화하고 플러그인을 업데이트하거나
재설치한 뒤 새 대화를 시작하세요. Skill 자체는 숨겨진 백엔드를 호출하지 않으며,
번들로 제공되는 커넥터가 필요합니다.

Claude Code:

```bash
claude plugin marketplace add amnotyoung/oda-intelligence-plugin
claude plugin install oda-intelligence@oda-intelligence-plugin
```

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

## 통제된 업데이트

- 데이터 및 호환되는 서버 동작은 플러그인을 업데이트하지 않아도 원격
  서비스에서 변경될 수 있습니다.
- 버전이 지정된 `v1` 엔드포인트는 승인된 도구 표면을 고정합니다. 도구 이름,
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

- KOICA 규정 도구는 범위가 제한된 검색 결과 일부, 출처 메타데이터, 상호 참조
  및 인용 검증 기능을 제공합니다. 규정 전문, 첨부 자료, 별표·별지 파일 및
  대량 텍스트는 공개 프로필에서 제공하지 않습니다.
- 개발협력 문서 도구는 문서 코퍼스 탐색, 범위가 제한된 요약 및 공개 원문
  URL을 제공합니다. 색인된 문서 전문과 추출된 관계 그래프는 공개 프로필에서
  제공하지 않습니다.
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

## 개발

```bash
npm ci
npm test
npm run contracts:check
```

소스 코드는 [Apache License 2.0](LICENSE)에 따라 제공됩니다. MCP 도구가
반환하는 데이터에 이 저장소의 라이선스가 새로 적용되는 것은 아닙니다.
[개인정보 처리방침](PRIVACY.md)과 [이용약관](TERMS.md)을 확인하세요.
