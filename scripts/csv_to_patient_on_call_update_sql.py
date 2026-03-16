import csv

INPUT_CSV = "data.csv"
OUTPUT_SQL = "update_patient_on_call.sql"


def sql_quote(value):
    if value is None:
        return "NULL"
    value = value.strip()
    if value == "":
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def sql_number(value):
    if value is None:
        return "NULL"
    value = value.strip()
    return value if value else "NULL"


def generate_sql(csv_file_path, sql_file_path):
    with open(csv_file_path, "r", encoding="utf-8-sig", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        rows = list(reader)

    with open(sql_file_path, "w", encoding="utf-8") as sql_file:
        sql_file.write("-- generated from CSV\n")
        sql_file.write("BEGIN;\n\n")

        for row in rows:
            row_id = sql_number(row.get("id"))
            first_name = sql_quote(row.get("doctor_first_name"))
            last_name = sql_quote(row.get("doctor_last_name"))
            second_name = sql_quote(row.get("doctor_second_name"))
            job_info_id = sql_number(row.get("ar_job_execution_id"))

            sql_file.write(
                "UPDATE patient_on_call\n"
                f"SET doctor_first_name = {first_name},\n"
                f"    doctor_last_name = {last_name},\n"
                f"    doctor_second_name = {second_name},\n"
                f"    medical_employee_job_info_id = {job_info_id}\n"
                f"WHERE id = {row_id};\n\n"
            )

        sql_file.write("COMMIT;\n")

    print(f"Готово: {sql_file_path}")


if __name__ == "__main__":
    generate_sql(INPUT_CSV, OUTPUT_SQL)
