import Imap from 'imap';
import { logger } from '../logger';
import { FptMailConfig, EmailData, FptMailConnectionResult } from '../interfaces';

export class FptMailService {
  private config: FptMailConfig;

  constructor(config: FptMailConfig) {
    this.config = config;
  }

  /**
   * Test kết nối FPT Mail (cải tiến từ code gốc)
   */
  public testFptMailConnection(dateRunning: string): Promise<FptMailConnectionResult> {
    return new Promise((resolve) => {
      const caCert = process.env.FPT_CA_CERT?.replace(/\\n/g, '\n');

      const imap = new Imap({
        user: this.config.user,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        tls: true,
        tlsOptions: {
          ca: caCert ? [caCert] : [],
          rejectUnauthorized: process.env.FPT_REJECT_UNAUTHORIZED !== 'false', // Mặc định true
        },
        connTimeout: 30000, // 30 seconds
        authTimeout: 30000, // 30 seconds
        keepalive: true,
      });

      logger.info(`[${this.config.tenant}] Testing IMAP connection...`);

      imap.once('ready', () => {
        const message = `✅ IMAP connection successful at ${dateRunning}`;
        logger.info(`[${this.config.tenant}] ${message}`);
        
        resolve({
          success: true,
          message,
          tenant: this.config.tenant,
          timestamp: dateRunning
        });
        
        imap.end();
      });

      imap.once('error', (err: any) => {
        const message = `❌ IMAP connection failed: ${err.message}`;
        logger.error(`[${this.config.tenant}] ${message}`);
        
        resolve({
          success: false,
          message,
          tenant: this.config.tenant,
          timestamp: dateRunning
        });
      });

      imap.once('end', () => {
        logger.info(`[${this.config.tenant}] 🔁 IMAP connection ended`);
      });

      // Timeout protection
      const timeout = setTimeout(() => {
        const message = '⏰ Connection timeout after 30 seconds';
        logger.error(`[${this.config.tenant}] ${message}`);
        
        resolve({
          success: false,
          message,
          tenant: this.config.tenant,
          timestamp: dateRunning
        });
        
        imap.destroy();
      }, 30000);

      imap.once('ready', () => clearTimeout(timeout));
      imap.once('error', () => clearTimeout(timeout));

      try {
        imap.connect();
      } catch (error: any) {
        clearTimeout(timeout);
        const message = `❌ Connection error: ${error.message}`;
        logger.error(`[${this.config.tenant}] ${message}`);
        
        resolve({
          success: false,
          message,
          tenant: this.config.tenant,
          timestamp: dateRunning
        });
      }
    });
  }

  /**
   * Đọc emails từ FPT Mail
   */
  public getEmails(dateRunning: string): Promise<EmailData[]> {
    return new Promise((resolve, reject) => {
      const caCert = process.env.FPT_CA_CERT?.replace(/\\n/g, '\n');
      const emails: EmailData[] = [];

      const imap = new Imap({
        user: this.config.user,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        tls: true,
        tlsOptions: {
          ca: caCert ? [caCert] : [],
          rejectUnauthorized: process.env.FPT_REJECT_UNAUTHORIZED !== 'false',
        },
        connTimeout: 30000,
        authTimeout: 30000,
        keepalive: true,
      });

      logger.info(`[${this.config.tenant}] Starting to read emails at ${dateRunning}`);

      imap.once('ready', () => {
        this.processMailboxes(imap, emails, resolve, reject);
      });

      imap.once('error', (err: any) => {
        logger.error(`[${this.config.tenant}] IMAP error: ${err.message}`);
        reject(err);
      });

      imap.once('end', () => {
        logger.info(`[${this.config.tenant}] IMAP connection ended`);
      });

      imap.connect();
    });
  }

  private processMailboxes(
    imap: Imap, 
    emails: EmailData[], 
    resolve: (emails: EmailData[]) => void, 
    reject: (error: any) => void
  ): void {
    const folders = this.config.folders || ['INBOX'];
    let processedFolders = 0;

    const processSingleFolder = (folderIndex: number) => {
      if (folderIndex >= folders.length) {
        logger.info(`[${this.config.tenant}] Completed reading ${emails.length} emails from ${folders.length} folders`);
        imap.end();
        resolve(emails);
        return;
      }

      const folder = folders[folderIndex];
      
      imap.openBox(folder, true, (err, box) => { // true = read-only
        if (err) {
          logger.error(`[${this.config.tenant}] Error opening folder ${folder}: ${err.message}`);
          processSingleFolder(folderIndex + 1);
          return;
        }

        logger.info(`[${this.config.tenant}] Opened folder: ${folder} (${box.messages.total} messages)`);

        if (box.messages.total === 0) {
          processSingleFolder(folderIndex + 1);
          return;
        }

        // Lấy email mới nhất
        const maxEmails = this.config.maxEmails || 10;
        const start = Math.max(1, box.messages.total - maxEmails + 1);
        const end = box.messages.total;

        const fetch = imap.seq.fetch(`${start}:${end}`, {
          bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
          struct: true
        });

        fetch.on('message', (msg, seqno) => {
          let emailData: Partial<EmailData> = {
            id: seqno.toString(),
            tenant: this.config.tenant,
            folder: folder
          };

          msg.on('body', (stream, info) => {
            let buffer = '';
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });
            stream.once('end', () => {
              const header = Imap.parseHeader(buffer);
              emailData.subject = this.decodeHeader(header.subject?.[0] || '');
              emailData.from = this.decodeHeader(header.from?.[0] || '');
              emailData.to = this.decodeHeader(header.to?.[0] || '');
              emailData.date = header.date?.[0] || '';
            });
          });

          msg.once('attributes', (attrs) => {
            emailData.body = `Message UID: ${attrs.uid}`;
          });

          msg.once('end', () => {
            if (emailData.subject && emailData.from) {
              emails.push(emailData as EmailData);
              logger.debug(`[${this.config.tenant}] Read email: ${emailData.subject}`);
            }
          });
        });

        fetch.once('error', (err) => {
          logger.error(`[${this.config.tenant}] Fetch error in folder ${folder}: ${err.message}`);
          processSingleFolder(folderIndex + 1);
        });

        fetch.once('end', () => {
          logger.info(`[${this.config.tenant}] Finished reading folder: ${folder}`);
          processSingleFolder(folderIndex + 1);
        });
      });
    };

    processSingleFolder(0);
  }

  private decodeHeader(header: string): string {
    try {
      // Xử lý MIME encoded words
      return header.replace(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/gi, (match, charset, encoding, encoded) => {
        try {
          if (encoding.toUpperCase() === 'B') {
            // Xử lý charset cho base64 decode
            const normalizedCharset = charset.toLowerCase();
            const supportedEncodings: BufferEncoding[] = ['utf8', 'utf-8', 'ascii', 'latin1', 'base64', 'hex'];
            const bufferEncoding = supportedEncodings.includes(normalizedCharset as BufferEncoding) 
              ? (normalizedCharset as BufferEncoding) 
              : 'utf8';
            return Buffer.from(encoded, 'base64').toString(bufferEncoding);
          } else if (encoding.toUpperCase() === 'Q') {
            return this.decodeQuotedPrintable(encoded, charset);
          }
        } catch (e) {
          logger.warn(`[${this.config.tenant}] Failed to decode header: ${match}`);
        }
        return match;
      });
    } catch (error) {
      logger.warn(`[${this.config.tenant}] Header decode error: ${error}`);
      return header;
    }
  }

  private decodeQuotedPrintable(encoded: string, charset: string): string {
    try {
      const decoded = encoded
        .replace(/_/g, ' ')
        .replace(/=([0-9A-F]{2})/gi, (match, hex) => {
          return String.fromCharCode(parseInt(hex, 16));
        });
      // Xử lý charset để tương thích với BufferEncoding
      const normalizedCharset = charset.toLowerCase();
      const supportedEncodings: BufferEncoding[] = ['utf8', 'utf-8', 'ascii', 'latin1', 'base64', 'hex'];
      const encoding = supportedEncodings.includes(normalizedCharset as BufferEncoding) 
        ? (normalizedCharset as BufferEncoding) 
        : 'utf8';
      
      return Buffer.from(decoded, 'binary').toString(encoding);
    } catch (error) {
      return encoded;
    }
  }
}

// Export function để tương thích với code gốc
export function testFptMailConnection(config: FptMailConfig, dateRunning: string): Promise<FptMailConnectionResult> {
  const service = new FptMailService(config);
  return service.testFptMailConnection(dateRunning);
}

export function getEmails(config: FptMailConfig, dateRunning: string): Promise<EmailData[]> {
  const service = new FptMailService(config);
  return service.getEmails(dateRunning);
}