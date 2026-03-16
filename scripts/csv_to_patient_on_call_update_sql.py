#!/usr/bin/env python3
import argparse
import csv
from pathlib import Path


REQUIRED_COLUMNS = {
    "id",
    "doctor_first_name",
    "doctor_last_name",
    "doctor_second_name",
    "ar_job_execution_id",
}


def sql_quote(value: str | None) -> str:
    if value is None:
        return "NULL"
    value = value.strip()
    if value == "":
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def sql_number(value: str | None) -> str:
    if value is None:
        return "NULL"
    value = value.strip()
    return value if value else "NULL"


def validate_columns(fieldnames: list[str] | None) -> None:
    if not fieldnames:
        raise ValueError("CSV пустой или не содержит заголовок")

    missing = REQUIRED_COLUMNS.difference(fieldnames)
    if missing:
        raise ValueError(
            "В CSV отсутствуют обязательные колонки: " + ", ".join(sorted(missing))
        )


def build_update(row: dict[str, str]) -> str:
    row_id = sql_number(row.get("id"))
    if row_id == "NULL":
        raise ValueError("Найдена строка без id")

    first_name = sql_quote(row.get("doctor_first_name"))
    last_name = sql_quote(row.get("doctor_last_name"))
    second_name = sql_quote(row.get("doctor_second_name"))
    job_info_id = sql_number(row.get("ar_job_execution_id"))

    return (
        "UPDATE patient_on_call\n"
        f"SET doctor_first_name = {first_name},\n"
        f"    doctor_last_name = {last_name},\n"
        f"    doctor_second_name = {second_name},\n"
        f"    medical_employee_job_info_id = {job_info_id}\n"
        f"WHERE id = {row_id};\n"
    )


def convert(csv_path: Path, sql_path: Path, with_transaction: bool) -> int:
    with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        validate_columns(reader.fieldnames)
        statements = [build_update(row) for row in reader]

    with sql_path.open("w", encoding="utf-8", newline="") as sql_file:
        sql_file.write("-- generated from CSV\n")
        sql_file.write(f"-- source: {csv_path.name}\n\n")

        if with_transaction:
            sql_file.write("BEGIN;\n\n")

        for statement in statements:
            sql_file.write(statement)
            sql_file.write("\n")

        if with_transaction:
            sql_file.write("COMMIT;\n")

    return len(statements)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Генерирует .sql с UPDATE patient_on_call из CSV"
    )
    parser.add_argument("csv_file", help="Путь до входного CSV-файла")
    parser.add_argument(
        "-o",
        "--output",
        help="Путь до выходного .sql файла. По умолчанию рядом с CSV",
    )
    parser.add_argument(
        "--no-transaction",
        action="store_true",
        help="Не добавлять BEGIN/COMMIT в итоговый SQL",
    )

    args = parser.parse_args()

    csv_path = Path(args.csv_file)
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV-файл не найден: {csv_path}")

    output_path = (
        Path(args.output)
        if args.output
        else csv_path.with_name(f"{csv_path.stem}_patient_on_call_update.sql")
    )

    count = convert(csv_path, output_path, with_transaction=not args.no_transaction)
    print(f"Готово. Сформировано {count} UPDATE-запросов: {output_path}")


if __name__ == "__main__":
    main()
