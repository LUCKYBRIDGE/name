# Third-Party Notices

This repository combines original database structure and editorial work with
third-party data and reference sources. This file records the notices that
must accompany redistributed third-party data used directly in the repository.

This is a notice file, not a license for the repository as a whole. No license
for first-party code, documentation, schemas, editorial interpretations, or
other original repository content is granted merely by this file. If a
repository-wide license is chosen later, it should be added separately at the
repository root.

## 1. rutopio / Korean-Name-Hanja-Charset

Upstream:
- Project: `rutopio/Korean-Name-Hanja-Charset`
- Upstream data used: `data-gov.csv`
- Repository source ID: `RUTOPIO_NAME_HANJA`
- License: MIT
- Copyright: Copyright (c) 2024 ChingRu (rutopio@github)

Repository use:
- `data/hanja/raw/rutopio-data-gov-2024-07-16.csv`
- `data/hanja/normalized/by-reading.csv`
- `data/hanja/normalized/characters.csv`
- `data/hanja/normalized/reading-index.json`
- portions of Hanja-derived enriched/semantic files that preserve or transform
  the upstream reading-character relationships

The raw mirror and derivatives are used for candidate search and normalization.
They are not treated as proof of current legal eligibility. Current legal
eligibility must be checked against the official Korean court source.

Full license text: `LICENSES/MIT-rutopio.txt`

## 2. libhangul Hanja dictionary data

Upstream:
- Project: `libhangul/libhangul`
- Upstream file: `data/hanja/hanja.txt`
- Repository source ID: `LIBHANGUL_HANJA`
- License on that data file: BSD 3-Clause
- Copyright: Copyright (c) 2005,2006 Choe Hwanjin

Repository use:
- `data/hanja/enriched/legal-reading-meaning.csv`
- `data/hanja/enriched/hanja-meaning-summary.csv`
- `data/hanja/semantics/meaning-senses.csv`
- portions of `data/hanja/enriched/hanja-master-enriched.csv`

The repository mechanically joins and splits Hanja reading/meaning records.
Editorial naming interpretations are maintained separately from the upstream
dictionary meanings.

Full notice text: `LICENSES/BSD-3-Clause-libhangul-hanja.txt`

## 3. Unicode Unihan Database

Upstream:
- Publisher: Unicode, Inc.
- Dataset: Unihan Database
- Repository source ID: `UNICODE_UNIHAN`
- License: Unicode License v3 / SPDX `Unicode-3.0`
- Copyright notice in current upstream license: Copyright © 2021-2026 Unicode, Inc.

Repository use:
- `data/hanja/enriched/unihan-radical-strokes-provisional.csv`
- Unicode-derived radical / technical stroke fields in
  `data/hanja/enriched/hanja-master-enriched.csv`

These values are technical Unicode metadata and are not automatically treated
as Korean naming-numerology stroke counts.

Full license text: `LICENSES/Unicode-3.0.txt`

## 4. KOSIS statistics

Source IDs:
- `KOSIS_SURNAME_2015`
- `KOSIS_SURNAME_2015_MASS`

The repository uses 2015 surname and clan statistics from the Korean Statistical
Information Service (KOSIS). KOSIS's statistics-use guide permits use of its
statistical information subject to conditions including accurate source
identification and no arbitrary alteration or distortion of the statistics.

Repository policy:
- retain KOSIS attribution in the app and documentation;
- distinguish KOSIS source values from repository-computed derivatives;
- do not describe `상위 본관 외 나머지` as a KOSIS-native `기타` row.

The secondary source `YESJOKBO_CENSUS2015_APPENDIX` is retained only as an
extraction/cross-check reference. Its presence is **not** treated as the legal
basis for redistribution. Before broad public or commercial release,
`data/surnames/clans-core-2015.csv` should be rebuilt or reverified directly
against KOSIS official data.

## 5. Academy of Korean Studies / Encyclopedia of Korean Culture text

Source IDs beginning with `AKS_` refer to textual material from the
Encyclopedia of Korean Culture (한국민족문화대백과사전), operated by the Academy
of Korean Studies.

The encyclopedia's textual content is provided under Korea Open Government
License Type 1 (공공누리 제1유형). When the repository or an application uses
that text or a summary grounded in a specific article, preserve article-level
attribution in the following form:

> 출처: 「항목명」, ⓒ한국민족문화대백과사전

This permission is **not** automatically extended to photographs, illustrations,
video, or other media attached to an article; those items may carry separate
use conditions.

Repository files such as `data/surnames/clan-history.csv` and
`data/surnames/entries/*.json` contain independently written factual
summaries and caveats rather than bulk copies of encyclopedia prose.

## 6. Korea Astronomy and Space Science Institute calendar information

Source ID:
- `KASI_CALENDAR`

The 2026/2027 solar-term files use factual calendar-face astronomical
information from the Korea Astronomy and Space Science Institute (KASI).
Where the relevant KASI material carries Korea Open Government License Type 1,
source attribution must be retained.

Repository policy:
- use only the needed calendar/astronomical facts such as solar-term date/time;
- identify KASI as the source;
- do not reproduce KASI photographs, page design, or the complete almanac as a
  substitute publication merely because the factual calendar data is used.

## 7. Official Korean laws and rules

Source ID:
- `KR_LAW_NAME_RULE`

Constitutional, statutory, treaty, decree, ordinance, and rule texts falling
within Article 7 of the Korean Copyright Act are not treated as copyrighted
works. This does not mean that third-party commentary, site design, editorial
annotations, or images surrounding the law text are free of copyright.

## 8. Reference-only or unresolved sources

The following categories do **not** receive a blanket redistribution license
from this notice:

- KCI academic papers and their tables/figures;
- `YESJOKBO_CENSUS2015_APPENDIX`;
- `SECONDARY_ROOTSINFO_*`;
- local-government or institutional pages for which an item-level KOGL or
  equivalent reuse condition has not been verified;
- Korean court pages/PDFs whose bulk redistribution terms remain unresolved.

For these sources, repository use defaults to:
- source metadata and citations;
- independently verifiable factual values;
- independently written summaries and caveats;
- cross-checking against official or clearly licensed sources.

Do not copy substantial source prose, tables, figures, PDFs, or databases into
this repository unless a separate permission or applicable license supports it.

Detailed operational policy:
- `COPYRIGHT_AND_DATA_USE.md`
- `APP_ATTRIBUTION.md`
- `data/meta/source-audit.csv`
- `data/meta/license-map.csv`
- `data/meta/distribution-policy.csv`

## 9. No endorsement

Names of third-party copyright holders, institutions, or projects are used for
attribution and source identification only. Their inclusion does not imply
endorsement of this repository, its naming methods, or any application built
from it.
