# FPT Mail Reader - Node.js

Node.js application để đọc email từ FPT Mail server sử dụng IMAP với TypeScript và cron jobs.

## ✨ Tính năng

- ✅ **Kết nối IMAP** với FPT Mail server
- ✅ **Cron Jobs** tự động đọc email theo lịch
- ✅ **Multiple Accounts** hỗ trợ nhiều tài khoản FPT Mail
- ✅ **TypeScript** với type safety
- ✅ **Winston Logging** với log rotation
- ✅ **SSL/TLS Security** với custom CA certificate
- ✅ **Graceful Shutdown** xử lý thoát an toàn
- ✅ **Error Handling** xử lý lỗi toàn diện

## 🚀 Cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình environment

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin FPT Mail của bạn:

```env
FPT_MAIL_USER=your_email@fpt.com
FPT_MAIL_PASSWORD=your_password
FPT_MAIL_HOST=mail.fpt.com
FPT_MAIL_PORT=993
FPT_CRON_TIME=*/5 * * * *
FPT_MAIL_ACTIVE=true
FPT_MAX_EMAILS=10
```

### 3. Build project

```bash
npm run build
```

## 🔧 Sử dụng

### Test kết nối

```bash
npm run test
```

### Chạy ở development mode

```bash
npm run dev
```

### Chạy production

```bash
npm start
```

## ⚙️ Cấu hình

### Cron Time Format

```
┌─────────────── second (optional)
│ ┌───────────── minute (0 - 59)
│ │ ┌─────────── hour (0 - 23)
│ │ │ ┌───────── day of month (1 - 31)
│ │ │ │ ┌─────── month (1 - 12)
│ │ │ │ │ ┌───── day of week (0 - 6) (0 to 6 are Sunday to Saturday)
│ │ │ │ │ │
* * * * * *
```

**Ví dụ:**
- `*/5 * * * *` - Mỗi 5 phút
- `0 */2 * * *` - Mỗi 2 giờ
- `0 9 * * 1-5` - 9h sáng từ thứ 2 đến thứ 6

### Multiple Accounts

Có thể cấu hình nhiều tài khoản FPT Mail:

```env
# Account 1
FPT_MAIL_USER=account1@fpt.com
FPT_MAIL_PASSWORD=password1
FPT_MAIL_ACTIVE=true

# Account 2
FPT_MAIL_USER_2=account2@fpt.com
FPT_MAIL_PASSWORD_2=password2
FPT_MAIL_ACTIVE_2=true
```

### SSL/TLS Configuration

Nếu gặp vấn đề SSL, có thể:

1. **Tắt verify certificate** (không khuyến nghị):
```env
FPT_REJECT_UNAUTHORIZED=false
```

2. **Sử dụng custom CA certificate**:
```env
FPT_CA_CERT="-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----"
```

## 📊 Logs

Logs được lưu trong thư mục `logs/`:
- `error.log` - Chỉ lỗi
- `combined.log` - Tất cả logs

Log format: JSON với timestamp, level, message và metadata.

## 🔍 Cấu trúc Project

```
src/
├── index.ts              # Entry point chính
├── config.ts             # Cấu hình FPT Mail
├── interfaces.ts         # TypeScript interfaces
├── logger.ts             # Winston logger setup
├── test.ts              # Test script
└── services/
    ├── index.ts          # Export services
    └── fptMailService.ts # FPT Mail service logic
```

## 🚨 Xử lý lỗi

### Lỗi kết nối thường gặp

1. **Authentication failed**
```
❌ IMAP connection failed: [AUTHENTICATIONFAILED] Authentication failed
```
**Giải pháp:** Kiểm tra email/password, bật IMAP trong FPT Mail

2. **SSL Certificate error**
```
❌ Connection error: unable to verify the first certificate
```
**Giải pháp:** Set `FPT_REJECT_UNAUTHORIZED=false` hoặc thêm CA cert

3. **Connection timeout**
```
⏰ Connection timeout after 30 seconds
```
**Giải pháp:** Kiểm tra network, firewall, hoặc thử server khác

### Debug Mode

Để debug chi tiết:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 📝 Code Changes từ Original

### Cải tiến từ code gốc:

1. **Promise-based**: Chuyển từ callback sang Promise/async-await
2. **Better Error Handling**: Timeout protection, detailed error messages
3. **Enhanced Logging**: Structured logging với Winston
4. **Email Reading**: Thêm chức năng đọc email content
5. **Multiple Folders**: Hỗ trợ đọc từ nhiều folders
6. **Header Decoding**: Xử lý MIME encoded headers (tiếng Việt)
7. **Graceful Shutdown**: Xử lý thoát an toàn

### Original function signature:
```typescript
// Trước
function testFptMailConnection(config: FptMailConfig, dateRunning: string) {
  // callback-based với console.log
}

// Sau
function testFptMailConnection(config: FptMailConfig, dateRunning: string): Promise<FptMailConnectionResult> {
  // Promise-based với structured result
}
```

## 🛠️ Development

### Thêm tính năng mới

1. **Database Integration**: Lưu emails vào database
```typescript
// Trong cron job
if (emails.length > 0) {
  await saveEmailsToDatabase(emails);
}
```

2. **Webhook Notifications**: Gửi thông báo khi có email mới
```typescript
// Trong cron job
if (emails.length > 0) {
  await sendWebhookNotification(emails);
}
```

3. **Email Filtering**: Lọc email theo criteria
```typescript
const filteredEmails = emails.filter(email => 
  email.subject.includes('important') || 
  email.from.includes('noreply')
);
```

## 📋 TODO

- [ ] Email body content parsing (HTML/text)
- [ ] Attachment download
- [ ] Email search by criteria
- [ ] Database integration
- [ ] Webhook notifications
- [ ] Email templates
- [ ] Performance monitoring

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push và tạo Pull Request

## 📄 License

MIT License