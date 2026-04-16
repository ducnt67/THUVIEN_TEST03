from django.db import models

class NguoiDung(models.Model):
    ma_nguoi_dung = models.CharField(max_length=10, primary_key=True)
    loai_nguoi_dung = models.CharField(max_length=50)
    ho_ten = models.CharField(max_length=255)
    lop = models.CharField(max_length=50, blank=True, null=True)
    trang_thai_tot_nghiep = models.BooleanField(blank=True, null=True)
    email = models.CharField(max_length=100, default='0')
    so_dien_thoai = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        db_table = 'NguoiDung'
        ordering = ['ho_ten']
        verbose_name = 'Người dùng'
        verbose_name_plural = 'Người dùng'

    def __str__(self):
        return f"{self.ma_nguoi_dung} - {self.ho_ten}"
