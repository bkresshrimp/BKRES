#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script test kết nối FPT Mail
Sử dụng script này để kiểm tra kết nối nhanh
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fpt_mail_reader import FPTMailReader
import getpass

def quick_test():
    """Test nhanh kết nối FPT Mail"""
    print("🔍 TEST KẾT NỐI FPT MAIL")
    print("-" * 40)
    
    # Nhập thông tin
    email = input("📧 Email FPT: ").strip()
    password = getpass.getpass("🔐 Mật khẩu: ")
    
    if not email or not password:
        print("❌ Thiếu thông tin đăng nhập!")
        return
    
    reader = FPTMailReader()
    
    print("\n🔄 Đang test kết nối IMAP...")
    imap_conn = reader.connect_imap(email, password)
    
    if imap_conn:
        print("✅ IMAP kết nối thành công!")
        try:
            # Test đọc 3 email đầu tiên
            print("\n📬 Đọc 3 email mới nhất...")
            emails = reader.read_emails_imap(imap_conn, 'INBOX', 3)
            print(f"✅ Đã đọc được {len(emails)} email")
            imap_conn.logout()
        except Exception as e:
            print(f"❌ Lỗi khi đọc email: {e}")
            imap_conn.logout()
    else:
        print("❌ IMAP kết nối thất bại!")
        
        print("\n🔄 Thử kết nối POP3...")
        pop3_conn = reader.connect_pop3(email, password)
        
        if pop3_conn:
            print("✅ POP3 kết nối thành công!")
            try:
                # Test đọc 3 email đầu tiên
                print("\n📬 Đọc 3 email mới nhất...")
                emails = reader.read_emails_pop3(pop3_conn, 3)
                print(f"✅ Đã đọc được {len(emails)} email")
                pop3_conn.quit()
            except Exception as e:
                print(f"❌ Lỗi khi đọc email: {e}")
                pop3_conn.quit()
        else:
            print("❌ Cả IMAP và POP3 đều kết nối thất bại!")
            print("\n💡 Gợi ý:")
            print("   - Kiểm tra lại email và mật khẩu")
            print("   - Đảm bảo đã bật IMAP/POP3 trong cài đặt email")
            print("   - Kiểm tra kết nối internet")

if __name__ == "__main__":
    quick_test()