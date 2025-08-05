# -*- coding: utf-8 -*-
"""
Cấu hình kết nối FPT Mail Server
"""

# Cấu hình server FPT Mail
FPT_MAIL_CONFIG = {
    # IMAP Settings
    'imap': {
        'server': 'mail.fpt.com',
        'port': 993,
        'use_ssl': True,
        'timeout': 30
    },
    
    # POP3 Settings  
    'pop3': {
        'server': 'mail.fpt.com',
        'port': 995,
        'use_ssl': True,
        'timeout': 30
    },
    
    # SMTP Settings (để gửi email)
    'smtp': {
        'server': 'mail.fpt.com',
        'port': 587,
        'use_tls': True,
        'timeout': 30
    },
    
    # Alternative servers (nếu server chính không hoạt động)
    'alternative_servers': {
        'imap': [
            {'server': 'imap.fpt.com', 'port': 993, 'use_ssl': True},
            {'server': 'mail.fpt.vn', 'port': 993, 'use_ssl': True}
        ],
        'pop3': [
            {'server': 'pop3.fpt.com', 'port': 995, 'use_ssl': True},
            {'server': 'mail.fpt.vn', 'port': 995, 'use_ssl': True}
        ]
    }
}

# Cấu hình mặc định
DEFAULT_SETTINGS = {
    'max_emails': 50,
    'default_folder': 'INBOX',
    'encoding': 'utf-8',
    'save_attachments': False,
    'attachment_dir': 'attachments'
}

# Mapping thư mục tiếng Việt
FOLDER_MAPPING = {
    'hộp thư đến': 'INBOX',
    'inbox': 'INBOX',
    'thư đã gửi': 'Sent',
    'sent': 'Sent',
    'thùng rác': 'Trash',
    'trash': 'Trash',
    'spam': 'Spam',
    'junk': 'Junk',
    'nháp': 'Drafts',
    'drafts': 'Drafts'
}