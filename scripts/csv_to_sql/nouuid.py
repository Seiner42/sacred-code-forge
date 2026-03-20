import csv
import sys
from pathlib import Path

INPUT_CSV = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("input.csv")
OUTPUT_SQL = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("output.sql")

csvfile = open(INPUT_CSV, "r", encoding="utf-8-sig", newline="")
sqlfile = open(OUTPUT_SQL, "w", encoding="utf-8")

reader = csv.DictReader(csvfile)

for row in reader:
    raw_id = row.get("id", "").strip()
    if not raw_id:
        continue

    if not raw_id.isdigit():
        print(f"Пропускаю некорректный id: {raw_id}")
        continue

    sqlfile.write(
        f"update tmk_patient_on_call set conference_uuid = NULL where id={raw_id};\n"
    )

csvfile.close()
sqlfile.close()

print(f"Готово: {OUTPUT_SQL}")
