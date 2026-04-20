from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('tra_sach', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='giaodichthanhtoan',
            name='nguoi_thu',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.PROTECT,
                related_name='giao_dich_da_thu',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name='khoanphat',
            name='nguoi_tao',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.PROTECT,
                related_name='khoan_phat_da_tao',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]

