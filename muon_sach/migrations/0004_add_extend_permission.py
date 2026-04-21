from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('muon_sach', '0003_sync_phuong_an_boi_thuong_column'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='phieumuon',
            options={
                'ordering': ['-ngay_muon'],
                'permissions': [('extend_phieumuon', 'Can extend borrow slip')],
                'verbose_name': 'Phiếu mượn',
                'verbose_name_plural': 'Phiếu mượn',
            },
        ),
    ]

