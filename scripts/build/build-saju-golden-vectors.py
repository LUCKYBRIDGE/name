import csv
from datetime import datetime
from pathlib import Path

from lunar_python import Solar

ROOT = Path(__file__).resolve().parents[2]
BOUNDARY = ROOT / "tests" / "사주-절기경계-검증.csv"
OUT = ROOT / "tests" / "사주-팔자-교차검증-lunar-python-1.4.9.csv"

REF_IMPL = "6tail/lunar-python"
REF_VERSION = "1.4.9"
REF_COMMIT = "1645ad3"
TIME_BASIS = "Asia/Seoul local civil clock supplied as plain fields; reference library itself does not receive a timezone argument"

TERM_CN = {
    "입춘": "立春", "경칩": "惊蛰", "청명": "清明", "입하": "立夏",
    "망종": "芒种", "소서": "小暑", "입추": "立秋", "백로": "白露",
    "한로": "寒露", "입동": "立冬", "대설": "大雪", "소한": "小寒",
}

GENERAL_CASES = [
    ("GEN-2000-NEWYEAR-NOON", "general_modern", "2000-01-01T12:00:00+09:00", ""),
    ("GEN-2010-SUMMER-NOON", "general_modern", "2010-06-15T12:00:00+09:00", ""),
    ("GEN-2020-LEAPDAY-NOON", "general_modern", "2020-02-29T12:00:00+09:00", ""),
    ("GEN-2024-LEAPDAY-NOON", "general_modern", "2024-02-29T12:00:00+09:00", ""),
    ("GEN-2026-NEWYEAR-NOON", "general_modern", "2026-01-01T12:00:00+09:00", ""),
    ("GEN-2026-MIDYEAR-NOON", "general_modern", "2026-06-15T12:00:00+09:00", ""),
    ("GEN-2026-YEAREND-NOON", "general_modern", "2026-12-31T12:00:00+09:00", ""),
    ("GEN-2027-NEWYEAR-NOON", "general_modern", "2027-01-01T12:00:00+09:00", ""),
]

ZI_CASES = [
    ("ZI-2026-0601-2259", "zi_hour_method_probe", "2026-06-01T22:59:00+09:00"),
    ("ZI-2026-0601-2300", "zi_hour_method_probe", "2026-06-01T23:00:00+09:00"),
    ("ZI-2026-0601-2359", "zi_hour_method_probe", "2026-06-01T23:59:00+09:00"),
    ("ZI-2026-0602-0000", "zi_hour_method_probe", "2026-06-02T00:00:00+09:00"),
]

def lunar_for(local_iso: str):
    dt = datetime.fromisoformat(local_iso)
    return Solar.fromYmdHms(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second).getLunar()

def pillars(local_iso: str, sect: int):
    lunar = lunar_for(local_iso)
    ec = lunar.getEightChar()
    ec.setSect(sect)
    return {
        "year_pillar": ec.getYear(),
        "month_pillar": ec.getMonth(),
        "day_pillar": ec.getDay(),
        "time_pillar": ec.getTime(),
        "month_branch": ec.getMonthZhi(),
        "day_stem": ec.getDayGan(),
        "day_branch": ec.getDayZhi(),
        "time_branch": ec.getTimeZhi(),
    }

rows = []

with BOUNDARY.open(encoding="utf-8-sig", newline="") as f:
    for i, r in enumerate(csv.DictReader(f), start=1):
        p = pillars(r["probe_local"], 2)
        ref_term_text = lunar_for(r["probe_local"]).getJieQiTable()[TERM_CN[r["term"]]].toYmdHms()
        ref_term_dt = datetime.strptime(ref_term_text, "%Y-%m-%d %H:%M:%S")
        kasi_term_dt = datetime.fromisoformat(r["boundary_local"]).replace(tzinfo=None)
        term_delta_minutes = round((ref_term_dt - kasi_term_dt).total_seconds() / 60, 3)
        rows.append({
            "case_id": f"KASI-BND-{i:02d}",
            "category": "kasi_month_branch_boundary",
            "solar_local": r["probe_local"],
            "time_basis": TIME_BASIS,
            "reference_impl": REF_IMPL,
            "reference_version": REF_VERSION,
            "reference_commit": REF_COMMIT,
            "sect": 2,
            **p,
            "official_boundary_term": r["term"],
            "official_expected_month_branch": r["expected_month_branch"],
            "official_expected_month_branch_hangul": r["expected_month_branch_hangul"],
            "reference_month_branch_matches_official": str(p["month_branch"] == r["expected_month_branch"]).lower(),
            "reference_term_clock": ref_term_text,
            "reference_term_delta_minutes_vs_kasi": term_delta_minutes,
            "clock_basis_warning": "reference solar-term clock is library-local; do not assume Asia/Seoul without normalization",
            "notes": f"KASI boundary={r['boundary_local']}; relation={r['relation_to_boundary']}",
        })

for case_id, category, local_iso, note in GENERAL_CASES:
    p = pillars(local_iso, 2)
    rows.append({
        "case_id": case_id,
        "category": category,
        "solar_local": local_iso,
        "time_basis": TIME_BASIS,
        "reference_impl": REF_IMPL,
        "reference_version": REF_VERSION,
        "reference_commit": REF_COMMIT,
        "sect": 2,
        **p,
        "official_boundary_term": "",
        "official_expected_month_branch": "",
        "official_expected_month_branch_hangul": "",
        "reference_month_branch_matches_official": "",
        "reference_term_clock": "",
        "reference_term_delta_minutes_vs_kasi": "",
        "clock_basis_warning": "",
        "notes": note or "general modern-date crosscheck vector",
    })

for case_id, category, local_iso in ZI_CASES:
    for sect in (1, 2):
        p = pillars(local_iso, sect)
        rows.append({
            "case_id": f"{case_id}-SECT{sect}",
            "category": category,
            "solar_local": local_iso,
            "time_basis": TIME_BASIS,
            "reference_impl": REF_IMPL,
            "reference_version": REF_VERSION,
            "reference_commit": REF_COMMIT,
            "sect": sect,
            **p,
            "official_boundary_term": "",
            "official_expected_month_branch": "",
            "official_expected_month_branch_hangul": "",
            "reference_month_branch_matches_official": "",
            "reference_term_clock": "",
            "reference_term_delta_minutes_vs_kasi": "",
            "clock_basis_warning": "",
            "notes": "sect 1/2 comparison for day-pillar boundary handling; reference library defaults to sect 2",
        })

fields = [
    "case_id","category","solar_local","time_basis",
    "reference_impl","reference_version","reference_commit","sect",
    "year_pillar","month_pillar","day_pillar","time_pillar",
    "month_branch","day_stem","day_branch","time_branch",
    "official_boundary_term","official_expected_month_branch",
    "official_expected_month_branch_hangul",
    "reference_month_branch_matches_official",
    "reference_term_clock","reference_term_delta_minutes_vs_kasi",
    "clock_basis_warning","notes"
]

with OUT.open("w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(rows)

boundary_rows = [r for r in rows if r["category"] == "kasi_month_branch_boundary"]
matches = sum(r["reference_month_branch_matches_official"] == "true" for r in boundary_rows)
deltas = sorted({r["reference_term_delta_minutes_vs_kasi"] for r in boundary_rows})
print(f"wrote {len(rows)} crosscheck vectors; KASI month-branch matches {matches}/{len(boundary_rows)} under naive clock input; term clock deltas={deltas}")
