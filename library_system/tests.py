from django.test import TestCase
from django.urls import reverse

from .models import Sach, SachTrongKho


class LibraryPagesTest(TestCase):
	def test_main_pages_render(self):
		self.assertEqual(self.client.get(reverse('dashboard')).status_code, 200)
		self.assertEqual(self.client.get(reverse('borrow_list')).status_code, 200)
		self.assertEqual(self.client.get(reverse('return_list')).status_code, 200)
		self.assertEqual(self.client.get(reverse('reader_list')).status_code, 200)
		self.assertEqual(self.client.get(reverse('book_list')).status_code, 200)

	def test_reader_page_contains_search_ui(self):
		response = self.client.get(reverse('reader_list'))
		self.assertContains(response, 'Tra cứu người dùng')
		self.assertContains(response, 'Danh sách người dùng')


class BookFlowTest(TestCase):
	def setUp(self):
		self.book = Sach.objects.create(
			ma_sach='BK001',
			ten_sach='Kinh te vi mo',
			ten_tac_gia='Tran A',
			the_loai='Kinh te',
			ten_nha_xuat_ban='NXB Tre',
			nam_xuat_ban=2023,
		)
		SachTrongKho.objects.create(
			ma_sach_trong_kho='K001',
			ma_sach=self.book,
			ma_vach='BAR001',
			trang_thai_sach='san sang',
		)

	def test_book_list_search(self):
		response = self.client.get(reverse('book_list'), {'q': 'vi mo'})
		self.assertContains(response, 'BK001')

	def test_create_book(self):
		response = self.client.post(
			reverse('book_list'),
			{
				'action': 'create',
				'book_id': 'BK002',
				'title': 'Ke toan quan tri',
				'author': 'Nguyen B',
				'category': 'Ke toan',
				'publisher': 'NXB Giao duc',
				'year': '2022',
			},
			follow=True,
		)
		self.assertEqual(response.status_code, 200)
		self.assertTrue(Sach.objects.filter(ma_sach='BK002').exists())

	def test_update_book(self):
		response = self.client.post(
			reverse('book_list'),
			{
				'action': 'update',
				'original_id': 'BK001',
				'book_id': 'BK001',
				'title': 'Kinh te vi mo nang cao',
				'author': 'Tran A',
				'category': 'Kinh te',
				'publisher': 'NXB Tre',
				'year': '2024',
			},
			follow=True,
		)
		self.assertEqual(response.status_code, 200)
		self.book.refresh_from_db()
		self.assertEqual(self.book.ten_sach, 'Kinh te vi mo nang cao')
		self.assertEqual(self.book.nam_xuat_ban, 2024)

	def test_delete_book_blocked_when_has_inventory(self):
		response = self.client.post(
			reverse('book_list'),
			{'action': 'delete', 'book_id': 'BK001'},
			follow=True,
		)
		self.assertEqual(response.status_code, 200)
		self.assertTrue(Sach.objects.filter(ma_sach='BK001').exists())

	def test_delete_book_without_inventory(self):
		book = Sach.objects.create(
			ma_sach='BK003',
			ten_sach='Quan tri hoc',
			ten_tac_gia='Le C',
			the_loai='Quan tri',
			ten_nha_xuat_ban='NXB Lao dong',
			nam_xuat_ban=2021,
		)
		response = self.client.post(
			reverse('book_list'),
			{'action': 'delete', 'book_id': book.ma_sach},
			follow=True,
		)
		self.assertEqual(response.status_code, 200)
		self.assertFalse(Sach.objects.filter(ma_sach='BK003').exists())
