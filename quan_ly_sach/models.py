from django.db import models
from django.core.exceptions import ValidationError

class Sach(models.Model):
    ma_sach = models.CharField(max_length=10, primary_key=True)
    ten_sach = models.CharField(max_length=255)
    ten_tac_gia = models.CharField(max_length=255, blank=True, null=True)
    the_loai = models.CharField(max_length=100, blank=True, null=True)
    ten_nha_xuat_ban = models.CharField(max_length=255, blank=True, null=True)
    nam_xuat_ban = models.PositiveIntegerField()
    so_luong = models.PositiveIntegerField()
    class Meta:
        db_table = 'Sach'
        ordering = ['ten_sach']
        verbose_name = 'Sách'
        verbose_name_plural = 'Sách'

    def clean(self):
        if self.nam_xuat_ban <= 0:
            raise ValidationError({'nam_xuat_ban': 'Năm xuất bản phải lớn hơn 0.'})

    def __str__(self):
        return f"{self.ma_sach} - {self.ten_sach}"


class SachTrongKho(models.Model):
    ma_sach_trong_kho = models.CharField(max_length=10, primary_key=True)
    ma_sach = models.ForeignKey(Sach, on_delete=models.PROTECT, related_name='sach_trong_kho')
    ma_vach = models.CharField(max_length=50, unique=True)
    trang_thai_sach = models.CharField(max_length=50)

    class Meta:
        db_table = 'SachTrongKho'
        ordering = ['ma_sach_trong_kho']
        verbose_name = 'Sách trong kho'
        verbose_name_plural = 'Sách trong kho'

    def __str__(self):
        return f"{self.ma_sach_trong_kho} - {self.ma_sach.ten_sach}"
