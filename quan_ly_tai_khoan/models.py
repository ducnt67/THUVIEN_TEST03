from django.db import models

class TaiKhoan(models.Model):
    ma_nguoi_dung = models.OneToOneField(
        'quan_ly_nguoi_dung.NguoiDung',
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='tai_khoan'
    )
    mat_khau = models.CharField(max_length=255)
    vai_tro = models.CharField(max_length=50)
    trang_thai_tai_khoan = models.BooleanField(default=True)

    class Meta:
        db_table = 'TaiKhoan'
        ordering = ['ma_nguoi_dung']
        verbose_name = 'Tài khoản'
        verbose_name_plural = 'Tài khoản'

    def __str__(self):
        return f"{self.ma_nguoi_dung_id} - {self.vai_tro}"
