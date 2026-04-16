from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone


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


class TaiKhoan(models.Model):
    ma_nguoi_dung = models.OneToOneField(
        NguoiDung,
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


class PhieuMuon(models.Model):
    ma_phieu_muon = models.CharField(max_length=10, primary_key=True)
    ma_nguoi_dung = models.ForeignKey(
        NguoiDung,
        on_delete=models.PROTECT,
        related_name='phieu_muon'
    )
    ngay_muon = models.DateField(default=timezone.now)
    trang_thai = models.CharField(max_length=50)
    nguoi_tao = models.ForeignKey(
        NguoiDung,
        on_delete=models.PROTECT,
        related_name='phieu_muon_da_tao'
    )

    class Meta:
        db_table = 'PhieuMuon'
        ordering = ['-ngay_muon']
        verbose_name = 'Phiếu mượn'
        verbose_name_plural = 'Phiếu mượn'

    def __str__(self):
        return self.ma_phieu_muon


class ChiTietPhieuMuon(models.Model):
    ma_phieu_muon = models.ForeignKey(
        PhieuMuon,
        on_delete=models.CASCADE,
        related_name='chi_tiet_phieu_muon'
    )
    ma_sach_trong_kho = models.ForeignKey(
        SachTrongKho,
        on_delete=models.PROTECT,
        related_name='chi_tiet_phieu_muon'
    )
    han_tra = models.DateField()
    ngay_tra = models.DateField(blank=True, null=True)
    tinh_trang_khi_tra = models.CharField(max_length=100, blank=True, null=True)
    ngay_khai_bao_mat = models.DateField(blank=True, null=True)

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


class ChinhSachPhat(models.Model):
    ma_loai_phat = models.CharField(max_length=10, primary_key=True)
    loai_phat = models.CharField(max_length=100)
    muc_phat_moi_ngay = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)]
    )
    muc_phat_hu_hong = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)]
    )
    muc_den_bu_mat_sach = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)]
    )

    class Meta:
        db_table = 'ChinhSachPhat'
        ordering = ['loai_phat']
        verbose_name = 'Chính sách phạt'
        verbose_name_plural = 'Chính sách phạt'

    def __str__(self):
        return f"{self.ma_loai_phat} - {self.loai_phat}"


class KhoanPhat(models.Model):
    ma_phat = models.CharField(max_length=10, primary_key=True)
    ma_nguoi_dung = models.ForeignKey(
        NguoiDung,
        on_delete=models.PROTECT,
        related_name='khoan_phat'
    )
    ma_phieu_muon = models.ForeignKey(
        PhieuMuon,
        on_delete=models.PROTECT,
        related_name='khoan_phat'
    )
    ma_sach_trong_kho = models.ForeignKey(
        SachTrongKho,
        on_delete=models.PROTECT,
        related_name='khoan_phat'
    )
    ma_loai_phat = models.ForeignKey(
        ChinhSachPhat,
        on_delete=models.PROTECT,
        related_name='khoan_phat'
    )
    so_tien = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    ngay_tao = models.DateTimeField(default=timezone.now)
    trang_thai_tt = models.CharField(max_length=50)
    ly_do = models.CharField(max_length=255, blank=True, null=True)
    nguoi_tao = models.ForeignKey(
        TaiKhoan,
        on_delete=models.PROTECT,
        related_name='khoan_phat_da_tao'
    )

    class Meta:
        db_table = 'KhoanPhat'
        ordering = ['-ngay_tao']
        verbose_name = 'Khoản phạt'
        verbose_name_plural = 'Khoản phạt'

    def __str__(self):
        return self.ma_phat


class GiaoDichThanhToan(models.Model):
    ma_giao_dich = models.CharField(max_length=10, primary_key=True)
    ma_nguoi_dung = models.ForeignKey(
        NguoiDung,
        on_delete=models.PROTECT,
        related_name='giao_dich_thanh_toan'
    )
    tong_so_tien = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    phuong_thuc = models.CharField(max_length=50, blank=True, null=True)
    thoi_gian_thanh_toan = models.DateTimeField(default=timezone.now)
    trang_thai = models.CharField(max_length=50)
    nguoi_thu = models.ForeignKey(
        TaiKhoan,
        on_delete=models.PROTECT,
        related_name='giao_dich_da_thu'
    )

    class Meta:
        db_table = 'GiaoDichThanhToan'
        ordering = ['-thoi_gian_thanh_toan']
        verbose_name = 'Giao dịch thanh toán'
        verbose_name_plural = 'Giao dịch thanh toán'

    def __str__(self):
        return self.ma_giao_dich


class ChiTietThanhToan(models.Model):
    ma_giao_dich = models.ForeignKey(
        GiaoDichThanhToan,
        on_delete=models.CASCADE,
        related_name='chi_tiet_thanh_toan'
    )
    ma_phat = models.ForeignKey(
        KhoanPhat,
        on_delete=models.CASCADE,
        related_name='chi_tiet_thanh_toan'
    )
    so_tien_thanh_toan = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )

    class Meta:
        db_table = 'ChiTietThanhToan'
        verbose_name = 'Chi tiết thanh toán'
        verbose_name_plural = 'Chi tiết thanh toán'
        constraints = [
            models.UniqueConstraint(
                fields=['ma_giao_dich', 'ma_phat'],
                name='unique_chi_tiet_thanh_toan'
            )
        ]

    def __str__(self):
        return f"{self.ma_giao_dich_id} - {self.ma_phat_id}"