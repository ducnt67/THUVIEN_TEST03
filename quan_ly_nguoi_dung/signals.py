from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group
from .models import NguoiDung

@receiver(post_save, sender=NguoiDung)
def dong_bo_group_sau_khi_luu_nguoi_dung(sender, instance, **kwargs):
    if not instance.user:
        return

    mapping = {
        'doc_gia': 'DOC_GIA',
        'thu_thu': 'THU_THU',
        'quan_tri': 'QUAN_TRI',
    }

    user = instance.user

    # Xóa group cũ
    user.groups.clear()

    # Gán group mới theo loại người dùng
    ten_nhom = mapping.get(instance.loai_nguoi_dung)
    if ten_nhom:
        group, _ = Group.objects.get_or_create(name=ten_nhom)
        user.groups.add(group)

    # Đồng bộ quyền quản trị
    if instance.loai_nguoi_dung == 'doc_gia':
        user.is_staff = False
        user.is_superuser = False
    elif instance.loai_nguoi_dung == 'thu_thu':
        user.is_staff = True
        user.is_superuser = False
    elif instance.loai_nguoi_dung == 'quan_tri':
        user.is_staff = True
        user.is_superuser = True

    user.save()