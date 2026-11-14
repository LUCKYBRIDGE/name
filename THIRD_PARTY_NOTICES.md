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

## 4. Official statistics, laws, public reference pages, and academic sources

The repository also contains factual values and short editorial summaries
derived from sources such as KOSIS, Korean court materials, KASI, government
and local-government pages, the Academy of Korean Studies, KCI, and other
references.

These sources do **not** receive a blanket open-data license from this notice.
Their individual source metadata and current internal redistribution review
state are tracked in:
- `data/meta/sources.csv`
- `data/meta/source-audit.csv`
- `data/meta/license-map.csv`

General repository policy:
- store factual values and independently written summaries rather than copying
  substantial source prose;
- preserve source IDs and caveats;
- do not redistribute source PDFs, articles, tables, or other substantial
  source content unless the applicable terms permit it;
- where a source license or reuse condition is unresolved, use it as a
  reference/citation source rather than assuming redistribution permission.

## 5. No endorsement

Names of third-party copyright holders or projects are used for attribution
and source identification only. Their inclusion does not imply endorsement of
this repository, its naming methods, or any future application built from it.
