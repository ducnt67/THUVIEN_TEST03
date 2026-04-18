from django.db import models, transaction
from django.core.exceptions import ValidationError
import base64
import hashlib

class Sach(models.Model):
    # editable=False để ẩn khỏi form nhập liệu vì máy tự sinh
    ma_sach = models.CharField(max_length=15, primary_key=True, editable=False)
    ten_sach = models.CharField(max_length=255)
    ten_tac_gia = models.CharField(max_length=255, blank=True, null=True)
    the_loai = models.CharField(max_length=100, blank=True, null=True)
    ten_nha_xuat_ban = models.CharField(max_length=255, blank=True, null=True)
    nam_xuat_ban = models.PositiveIntegerField()
    so_luong = models.PositiveIntegerField()

    class Meta:
        db_table = 'Sach'
        verbose_name = 'Sách'
        verbose_name_plural = 'Sách'

    def save(self, *args, **kwargs):
        # Tự sinh mã chính khi tạo mới
        if not self.ma_sach:
            last_book = Sach.objects.all().order_by('ma_sach').last()
            if not last_book:
                self.ma_sach = "MS0001"
            else:
                last_id_num = int(last_book.ma_sach[2:])
                self.ma_sach = f"MS{str(last_id_num + 1).zfill(4)}"

        with transaction.atomic():
            super().save(*args, **kwargs)
            self.dong_bo_kho()  # Luôn kiểm tra để đẻ thêm nếu thiếu

    def dong_bo_kho(self):
        prefix = self.ma_sach
        current_count = self.sach_trong_kho.count()

        # Nếu số lượng mới lớn hơn số lượng đang có -> Đẻ thêm
        if current_count < self.so_luong:
            items_to_create = []
            for i in range(current_count + 1, self.so_luong + 1):
                # Mã kho ví dụ: MS0001-001
                ma_kho = f"{prefix}-{str(i).zfill(3)}"

                # SỬA TẠI ĐÂY: Mã vạch sẽ lấy theo mã kho cho sạch sẽ và dễ quét
                # Kết quả sẽ là: BC-MS0001-001 (Không bao giờ có dấu +)
                ma_vach = f"BC-{ma_kho}"

                items_to_create.append(SachTrongKho(
                    ma_sach_trong_kho=ma_kho,
                    ma_sach=self,
                    ma_vach=ma_vach,
                    trang_thai_sach='available'
                ))
            SachTrongKho.objects.bulk_create(items_to_create)

    def __str__(self):
        return f"{self.ma_sach} - {self.ten_sach}"


class SachTrongKho(models.Model):
    # Để max_length dài ra tí cho thoải mái
    class TrangThai(models.TextChoices):
        AVAILABLE = 'available', 'Có sẵn'
        BORROWED = 'borrowed', 'Đang mượn'
        OVERDUE = 'overdue', 'Quá hạn'
        AWAITING_REPLACEMENT = 'awaiting_replacement', 'Chờ đền sách'
        PROCESSED = 'processed', 'Đã xử lý (Đã đền bù)'
        LOST_DAMAGED = 'lost_damaged', 'Mất/Hỏng'

    ma_sach_trong_kho = models.CharField(max_length=25, primary_key=True, editable=False)
    ma_sach = models.ForeignKey(Sach, on_delete=models.CASCADE, related_name='sach_trong_kho')
    ma_vach = models.CharField(max_length=50, unique=True, editable=False)
    trang_thai_sach = models.CharField(
        max_length=30,  # Tăng max_length lên tí cho thoải mái
        choices=TrangThai.choices,
        default=TrangThai.AVAILABLE
    )
    class Meta:
        db_table = 'SachTrongKho'
        ordering = ['ma_sach_trong_kho']
        verbose_name = 'Sách trong kho'
        verbose_name_plural = 'Sách trong kho'

    def __str__(self):
        return f"{self.ma_sach_trong_kho} - {self.ma_sach.ten_sach}"