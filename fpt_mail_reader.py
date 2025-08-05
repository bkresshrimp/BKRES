#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FPT Mail Reader
Script để kết nối và đọc email từ mail server FPT
"""

import imaplib
import poplib
import email
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import decode_header
import getpass
import sys
from datetime import datetime
import json

class FPTMailReader:
    def __init__(self):
        # Cấu hình server FPT Mail
        self.imap_server = "mail.fpt.com"
        self.pop3_server = "mail.fpt.com"
        self.imap_port = 993  # IMAP SSL
        self.pop3_port = 995  # POP3 SSL
        self.smtp_server = "mail.fpt.com"
        self.smtp_port = 587  # SMTP TLS
        
    def decode_mime_words(self, s):
        """Giải mã MIME encoded words"""
        if s is None:
            return ""
        decoded_fragments = decode_header(s)
        decoded_string = ""
        for fragment, encoding in decoded_fragments:
            if isinstance(fragment, bytes):
                if encoding:
                    decoded_string += fragment.decode(encoding)
                else:
                    decoded_string += fragment.decode('utf-8', errors='ignore')
            else:
                decoded_string += fragment
        return decoded_string
    
    def connect_imap(self, username, password):
        """Kết nối IMAP với FPT Mail"""
        try:
            print(f"Đang kết nối IMAP tới {self.imap_server}:{self.imap_port}...")
            
            # Tạo SSL context
            context = ssl.create_default_context()
            
            # Kết nối IMAP với SSL
            mail = imaplib.IMAP4_SSL(self.imap_server, self.imap_port, ssl_context=context)
            
            # Đăng nhập
            mail.login(username, password)
            print("✓ Kết nối IMAP thành công!")
            
            return mail
            
        except imaplib.IMAP4.error as e:
            print(f"✗ Lỗi IMAP: {e}")
            return None
        except Exception as e:
            print(f"✗ Lỗi kết nối: {e}")
            return None
    
    def connect_pop3(self, username, password):
        """Kết nối POP3 với FPT Mail"""
        try:
            print(f"Đang kết nối POP3 tới {self.pop3_server}:{self.pop3_port}...")
            
            # Kết nối POP3 với SSL
            mail = poplib.POP3_SSL(self.pop3_server, self.pop3_port)
            
            # Đăng nhập
            mail.user(username)
            mail.pass_(password)
            print("✓ Kết nối POP3 thành công!")
            
            return mail
            
        except poplib.error_proto as e:
            print(f"✗ Lỗi POP3: {e}")
            return None
        except Exception as e:
            print(f"✗ Lỗi kết nối: {e}")
            return None
    
    def list_folders_imap(self, mail):
        """Liệt kê các thư mục email (IMAP)"""
        try:
            print("\n=== DANH SÁCH THƯ MỤC ===")
            status, folders = mail.list()
            if status == 'OK':
                for folder in folders:
                    folder_name = folder.decode('utf-8')
                    print(f"📁 {folder_name}")
            return folders
        except Exception as e:
            print(f"✗ Lỗi khi liệt kê thư mục: {e}")
            return []
    
    def read_emails_imap(self, mail, folder='INBOX', limit=10):
        """Đọc email từ thư mục (IMAP)"""
        try:
            # Chọn thư mục
            mail.select(folder)
            print(f"\n=== ĐỌC EMAIL TỪ THƯ MỤC: {folder} ===")
            
            # Tìm kiếm email
            status, messages = mail.search(None, 'ALL')
            if status != 'OK':
                print("✗ Không thể tìm kiếm email")
                return []
            
            email_ids = messages[0].split()
            total_emails = len(email_ids)
            print(f"📧 Tổng số email: {total_emails}")
            
            # Lấy email mới nhất
            emails = []
            for i in range(min(limit, total_emails)):
                email_id = email_ids[-(i+1)]  # Lấy từ email mới nhất
                
                # Lấy email
                status, msg_data = mail.fetch(email_id, '(RFC822)')
                if status != 'OK':
                    continue
                
                # Parse email
                email_body = msg_data[0][1]
                email_message = email.message_from_bytes(email_body)
                
                # Trích xuất thông tin
                subject = self.decode_mime_words(email_message['Subject'])
                from_addr = self.decode_mime_words(email_message['From'])
                to_addr = self.decode_mime_words(email_message['To'])
                date = email_message['Date']
                
                # Lấy nội dung email
                body = self.get_email_body(email_message)
                
                email_info = {
                    'id': email_id.decode(),
                    'subject': subject,
                    'from': from_addr,
                    'to': to_addr,
                    'date': date,
                    'body': body[:500] + '...' if len(body) > 500 else body  # Giới hạn độ dài
                }
                
                emails.append(email_info)
                
                print(f"\n📧 Email {i+1}:")
                print(f"   Tiêu đề: {subject}")
                print(f"   Từ: {from_addr}")
                print(f"   Đến: {to_addr}")
                print(f"   Ngày: {date}")
                print(f"   Nội dung: {body[:200]}{'...' if len(body) > 200 else ''}")
                print("-" * 50)
            
            return emails
            
        except Exception as e:
            print(f"✗ Lỗi khi đọc email: {e}")
            return []
    
    def read_emails_pop3(self, mail, limit=10):
        """Đọc email với POP3"""
        try:
            print(f"\n=== ĐỌC EMAIL VỚI POP3 ===")
            
            # Lấy thông tin email
            num_messages = len(mail.list()[1])
            print(f"📧 Tổng số email: {num_messages}")
            
            emails = []
            for i in range(min(limit, num_messages)):
                # Lấy email (từ email mới nhất)
                email_index = num_messages - i
                raw_email = b"\n".join(mail.retr(email_index)[1])
                email_message = email.message_from_bytes(raw_email)
                
                # Trích xuất thông tin
                subject = self.decode_mime_words(email_message['Subject'])
                from_addr = self.decode_mime_words(email_message['From'])
                to_addr = self.decode_mime_words(email_message['To'])
                date = email_message['Date']
                
                # Lấy nội dung email
                body = self.get_email_body(email_message)
                
                email_info = {
                    'id': str(email_index),
                    'subject': subject,
                    'from': from_addr,
                    'to': to_addr,
                    'date': date,
                    'body': body[:500] + '...' if len(body) > 500 else body
                }
                
                emails.append(email_info)
                
                print(f"\n📧 Email {i+1}:")
                print(f"   Tiêu đề: {subject}")
                print(f"   Từ: {from_addr}")
                print(f"   Đến: {to_addr}")
                print(f"   Ngày: {date}")
                print(f"   Nội dung: {body[:200]}{'...' if len(body) > 200 else ''}")
                print("-" * 50)
            
            return emails
            
        except Exception as e:
            print(f"✗ Lỗi khi đọc email POP3: {e}")
            return []
    
    def get_email_body(self, email_message):
        """Trích xuất nội dung email"""
        body = ""
        
        if email_message.is_multipart():
            for part in email_message.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition"))
                
                if content_type == "text/plain" and "attachment" not in content_disposition:
                    try:
                        body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                        break
                    except:
                        pass
                elif content_type == "text/html" and "attachment" not in content_disposition and not body:
                    try:
                        body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    except:
                        pass
        else:
            try:
                body = email_message.get_payload(decode=True).decode('utf-8', errors='ignore')
            except:
                body = str(email_message.get_payload())
        
        return body
    
    def save_emails_to_json(self, emails, filename='fpt_emails.json'):
        """Lưu email vào file JSON"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(emails, f, ensure_ascii=False, indent=2)
            print(f"✓ Đã lưu {len(emails)} email vào file: {filename}")
        except Exception as e:
            print(f"✗ Lỗi khi lưu file: {e}")

def main():
    """Hàm chính"""
    print("=" * 60)
    print("           FPT MAIL READER")
    print("=" * 60)
    
    reader = FPTMailReader()
    
    # Nhập thông tin đăng nhập
    print("\n📧 Nhập thông tin đăng nhập FPT Mail:")
    username = input("Email: ").strip()
    password = getpass.getpass("Mật khẩu: ")
    
    if not username or not password:
        print("✗ Vui lòng nhập đầy đủ thông tin!")
        return
    
    # Chọn giao thức
    print("\n🔧 Chọn giao thức kết nối:")
    print("1. IMAP (khuyến nghị - có thể đọc nhiều thư mục)")
    print("2. POP3 (chỉ đọc hộp thư đến)")
    
    choice = input("Chọn (1/2): ").strip()
    
    if choice == "1":
        # Kết nối IMAP
        mail = reader.connect_imap(username, password)
        if mail:
            try:
                # Liệt kê thư mục
                reader.list_folders_imap(mail)
                
                # Chọn thư mục
                folder = input("\nNhập tên thư mục (để trống = INBOX): ").strip()
                if not folder:
                    folder = 'INBOX'
                
                # Số lượng email cần đọc
                try:
                    limit = int(input("Số lượng email cần đọc (mặc định 10): ") or "10")
                except ValueError:
                    limit = 10
                
                # Đọc email
                emails = reader.read_emails_imap(mail, folder, limit)
                
                # Lưu vào file
                if emails:
                    save_choice = input("\nBạn có muốn lưu email vào file JSON? (y/n): ").strip().lower()
                    if save_choice == 'y':
                        reader.save_emails_to_json(emails)
                
                mail.logout()
                
            except Exception as e:
                print(f"✗ Lỗi: {e}")
                mail.logout()
    
    elif choice == "2":
        # Kết nối POP3
        mail = reader.connect_pop3(username, password)
        if mail:
            try:
                # Số lượng email cần đọc
                try:
                    limit = int(input("Số lượng email cần đọc (mặc định 10): ") or "10")
                except ValueError:
                    limit = 10
                
                # Đọc email
                emails = reader.read_emails_pop3(mail, limit)
                
                # Lưu vào file
                if emails:
                    save_choice = input("\nBạn có muốn lưu email vào file JSON? (y/n): ").strip().lower()
                    if save_choice == 'y':
                        reader.save_emails_to_json(emails)
                
                mail.quit()
                
            except Exception as e:
                print(f"✗ Lỗi: {e}")
                mail.quit()
    
    else:
        print("✗ Lựa chọn không hợp lệ!")

if __name__ == "__main__":
    main()