from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('tra_sach', '0002_alter_khoanphat_nguoi_tao_and_more'),
        ('quan_ly_tai_khoan', '0001_initial'),
    ]

    operations = [
        migrations.DeleteModel(
            name='TaiKhoan',
        ),
    ]

