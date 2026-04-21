from django.db import migrations


def add_phuong_an_boi_thuong_if_missing(apps, schema_editor):
    table_name = 'ChiTietPhieuMuon'
    column_name = 'phuong_an_boi_thuong'

    with schema_editor.connection.cursor() as cursor:
        existing_columns = {
            col.name for col in schema_editor.connection.introspection.get_table_description(cursor, table_name)
        }

    if column_name in existing_columns:
        return

    schema_editor.execute(
        'ALTER TABLE "ChiTietPhieuMuon" '
        'ADD COLUMN "phuong_an_boi_thuong" varchar(20) NOT NULL DEFAULT ""'
    )


class Migration(migrations.Migration):

    dependencies = [
        ('muon_sach', '0002_alter_phieumuon_trang_thai'),
    ]

    operations = [
        migrations.RunPython(add_phuong_an_boi_thuong_if_missing, migrations.RunPython.noop),
    ]

