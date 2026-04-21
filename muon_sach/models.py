from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError

class PhieuMuon(models.Model):
    TRANG_THAI_MUON_CHOICES = [
        ('dang_muon', 'Đang mượn'),
        ('qua_han', 'Quá hạn'),
        ('da_tra', 'Đã trả'),
        ('dang_xu_ly', 'Đang xử lý'),
        ('cho_den_sach', 'Chờ đền sách'),
    ]
    ma_phieu_muon = models.CharField(max_length=10, primary_key=True)

    def save(self, *args, **kwargs):
        if not self.ma_phieu_muon:
            # Lấy phiếu mượn cuối cùng dựa trên mã
            last_pm = PhieuMuon.objects.all().order_by('ma_phieu_muon').last()

            if not last_pm:
                # Nếu chưa có phiếu nào, bắt đầu từ PM0000001
                self.ma_phieu_muon = 'PM0000001'
            else:
                # Cắt chuỗi bỏ 'PM', lấy phần số và tăng thêm 1
                last_number = int(last_pm.ma_phieu_muon[2:])
                new_number = last_number + 1
                # Ghép lại với tiền tố PM và format 7 chữ số (tổng độ dài là 9)
                self.ma_phieu_muon = 'PM' + str(new_number).zfill(7)

        super(PhieuMuon, self).save(*args, **kwargs)
    ma_nguoi_dung = models.ForeignKey(
        'quan_ly_nguoi_dung.NguoiDung',
        on_delete=models.PROTECT,
        related_name='phieu_muon'
    )
    ngay_muon = models.DateField(default=timezone.now)
    trang_thai = models.CharField(
        max_length=20,
        choices=TRANG_THAI_MUON_CHOICES,
        default='dang_muon',
        verbose_name="Trạng thái mượn"
    )
    nguoi_tao = models.ForeignKey(
        'quan_ly_nguoi_dung.NguoiDung',
        on_delete=models.PROTECT,
        related_name='phieu_muon_da_tao'
    )

    class Meta:
        db_table = 'PhieuMuon'
        ordering = ['-ngay_muon']
        verbose_name = 'Phiếu mượn'
        verbose_name_plural = 'Phiếu mượn'
        permissions = [
            ('extend_phieumuon', 'Can extend borrow slip'),
        ]

    def __str__(self):
        return f"{self.ma_phieu_muon}- {self.get_trang_thai_display()}"

    def sync_status(self):
        """
        Calculates and updates the trang_thai field based on book details and current date.
        """
        chi_tiet = self.chi_tiet_phieu_muon.all()
        if not chi_tiet.exists():
            return self.trang_thai

        today = timezone.now().date()
        all_returned = all(ct.ngay_tra is not None for ct in chi_tiet)
        any_overdue = any(ct.ngay_tra is None and ct.han_tra < today for ct in chi_tiet)

        new_status = 'dang_muon'
        if all_returned:
            new_status = 'da_tra'
        elif any_overdue:
            new_status = 'qua_han'

        if self.trang_thai != new_status:
            self.trang_thai = new_status
            PhieuMuon.objects.filter(pk=self.pk).update(trang_thai=new_status)
        
        return new_status


class ChiTietPhieuMuon(models.Model):
    ma_phieu_muon = models.ForeignKey(
        PhieuMuon,
        on_delete=models.CASCADE,
        related_name='chi_tiet_phieu_muon'
    )
    ma_sach_trong_kho = models.ForeignKey(
        'quan_ly_sach.SachTrongKho',
        on_delete=models.PROTECT,
        related_name='chi_tiet_phieu_muon'
    )
    han_tra = models.DateField()
    ngay_tra = models.DateField(blank=True, null=True)
    tinh_trang_khi_tra = models.CharField(max_length=100, blank=True, null=True)
    ngay_khai_bao_mat = models.DateField(blank=True, null=True)
    phuong_an_boi_thuong = models.CharField(
        max_length=20,
        choices=[
            ('', 'Chưa chọn'),
            ('den_bu_tien', 'Bồi thường tiền'),
            ('den_sach_moi', 'Đền sách mới')
        ],
        default='',
        blank=True,
        verbose_name='Phương án bồi thường'
    )

    class Meta:
        db_table = 'ChiTietPhieuMuon'
        verbose_name = 'Chi tiết phiếu mượn'
        verbose_name_plural = 'Chi tiết phiếu mượn'
        constraints = [
            models.UniqueConstraint(
                fields=['ma_phieu_muon', 'ma_sach_trong_kho'],
                name='unique_chi_tiet_phieu_muon'
            )
        ]

    def clean(self):
        if self.han_tra and self.ma_phieu_muon and self.han_tra < self.ma_phieu_muon.ngay_muon:
            raise ValidationError({'han_tra': 'Hạn trả không được nhỏ hơn ngày mượn.'})

        if self.ngay_tra and self.ma_phieu_muon and self.ngay_tra < self.ma_phieu_muon.ngay_muon:
            raise ValidationError({'ngay_tra': 'Ngày trả không được nhỏ hơn ngày mượn.'})

    def __str__(self):
        return f"{self.ma_phieu_muon_id} - {self.ma_sach_trong_kho_id}"
