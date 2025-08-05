# FPT Mail Reader

Script Python để kết nối và đọc email từ mail server FPT (mail.fpt.com).

## Tính năng

- ✅ Kết nối IMAP và POP3 với SSL/TLS
- ✅ Đọc email từ nhiều thư mục (IMAP)
- ✅ Giải mã tiếng Việt và các encoding khác
- ✅ Xuất email ra file JSON
- ✅ Xử lý email multipart và attachment
- ✅ Giao diện dòng lệnh thân thiện

## Yêu cầu

- Python 3.6+
- Các thư viện chuẩn: `imaplib`, `poplib`, `email`, `ssl`

## Cách sử dụng

### 1. Test kết nối nhanh

```bash
python test_fpt_mail.py
```

### 2. Sử dụng script đầy đủ

```bash
python fpt_mail_reader.py
```

### 3. Sử dụng như module

```python
from fpt_mail_reader import FPTMailReader

# Tạo đối tượng reader
reader = FPTMailReader()

# Kết nối IMAP
mail = reader.connect_imap("your_email@fpt.com", "your_password")

if mail:
    # Đọc 10 email mới nhất từ INBOX
    emails = reader.read_emails_imap(mail, 'INBOX', 10)
    
    # Lưu vào file JSON
    reader.save_emails_to_json(emails, 'my_emails.json')
    
    # Đóng kết nối
    mail.logout()
```

## Cấu hình Server

Script sử dụng cấu hình sau cho FPT Mail:

- **IMAP**: mail.fpt.com:993 (SSL)
- **POP3**: mail.fpt.com:995 (SSL)
- **SMTP**: mail.fpt.com:587 (TLS)

## Lưu ý quan trọng

### 1. Bật IMAP/POP3 trong FPT Mail

Trước khi sử dụng, bạn cần:

1. Đăng nhập vào https://mail.fpt.com/owa/
2. Vào **Cài đặt** → **Mail** → **Tài khoản**
3. Bật **IMAP** và/hoặc **POP3**
4. Lưu cài đặt

### 2. Bảo mật

- Không lưu mật khẩu trong code
- Sử dụng App Password nếu có bật 2FA
- Kiểm tra kết nối SSL/TLS

### 3. Giới hạn

- POP3 chỉ đọc được INBOX
- IMAP có thể đọc tất cả thư mục
- Một số email có thể cần xử lý encoding đặc biệt

## Xử lý lỗi thường gặp

### Lỗi kết nối

```
✗ Lỗi IMAP: [AUTHENTICATIONFAILED] Authentication failed
```

**Giải pháp:**
- Kiểm tra email và mật khẩu
- Đảm bảo đã bật IMAP trong cài đặt
- Thử sử dụng App Password

### Lỗi SSL

```
✗ Lỗi kết nối: [SSL: CERTIFICATE_VERIFY_FAILED]
```

**Giải pháp:**
- Cập nhật Python và certificates
- Kiểm tra firewall/proxy

### Lỗi encoding

```
UnicodeDecodeError: 'utf-8' codec can't decode
```

**Giải pháp:**
- Script đã xử lý tự động với `errors='ignore'`
- Nếu vẫn lỗi, có thể cần xử lý thêm encoding đặc biệt

## Ví dụ output

```
============================================================
           FPT MAIL READER
============================================================

📧 Nhập thông tin đăng nhập FPT Mail:
Email: your_email@fpt.com
Mật khẩu: 

🔧 Chọn giao thức kết nối:
1. IMAP (khuyến nghị - có thể đọc nhiều thư mục)
2. POP3 (chỉ đọc hộp thư đến)

Chọn (1/2): 1

Đang kết nối IMAP tới mail.fpt.com:993...
✓ Kết nối IMAP thành công!

=== DANH SÁCH THƯ MỤC ===
📁 (\HasNoChildren) "INBOX"
📁 (\HasNoChildren) "Sent Items"
📁 (\HasNoChildren) "Deleted Items"

Nhập tên thư mục (để trống = INBOX): 
Số lượng email cần đọc (mặc định 10): 5

=== ĐỌC EMAIL TỪ THƯ MỤC: INBOX ===
📧 Tổng số email: 150

📧 Email 1:
   Tiêu đề: Thông báo quan trọng
   Từ: sender@example.com
   Đến: your_email@fpt.com
   Ngày: Mon, 23 Dec 2024 10:30:00 +0700
   Nội dung: Nội dung email ở đây...
--------------------------------------------------
```

## Files

- `fpt_mail_reader.py`: Script chính
- `fpt_mail_config.py`: Cấu hình server
- `test_fpt_mail.py`: Script test nhanh
- `FPT_MAIL_README.md`: Hướng dẫn này

## Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:

1. Kết nối internet
2. Thông tin đăng nhập
3. Cài đặt IMAP/POP3 trong FPT Mail
4. Firewall/antivirus có chặn không

---

**Lưu ý**: Script này chỉ dành cho mục đích học tập và sử dụng cá nhân. Vui lòng tuân thủ điều khoản sử dụng của FPT Mail.