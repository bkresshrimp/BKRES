import { FptMailConfig } from './interfaces';

export const configs = {
  fptMailConfig: [
    {
      tenant: 'FPT_MAIN',
      user: process.env.FPT_MAIL_USER || 'your_email@fpt.com',
      password: process.env.FPT_MAIL_PASSWORD || 'your_password',
      host: process.env.FPT_MAIL_HOST || 'mail.fpt.com',
      port: parseInt(process.env.FPT_MAIL_PORT || '993'),
      cronTime: process.env.FPT_CRON_TIME || '*/5 * * * *', // Mỗi 5 phút
      is_active: process.env.FPT_MAIL_ACTIVE === 'true' || true,
      maxEmails: parseInt(process.env.FPT_MAX_EMAILS || '10'),
      folders: ['INBOX', 'Sent'] // Có thể cấu hình thêm folders
    },
    // Có thể thêm nhiều cấu hình FPT Mail khác nhau
    {
      tenant: 'FPT_BACKUP',
      user: process.env.FPT_MAIL_USER_2 || 'backup@fpt.com',
      password: process.env.FPT_MAIL_PASSWORD_2 || 'backup_password',
      host: process.env.FPT_MAIL_HOST_2 || 'mail.fpt.com',
      port: parseInt(process.env.FPT_MAIL_PORT_2 || '993'),
      cronTime: process.env.FPT_CRON_TIME_2 || '*/10 * * * *', // Mỗi 10 phút
      is_active: process.env.FPT_MAIL_ACTIVE_2 === 'true' || false,
      maxEmails: parseInt(process.env.FPT_MAX_EMAILS_2 || '5'),
      folders: ['INBOX']
    }
  ] as FptMailConfig[]
};