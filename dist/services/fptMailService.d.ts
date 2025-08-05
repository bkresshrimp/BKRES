import { FptMailConfig, EmailData, FptMailConnectionResult } from '../interfaces';
export declare class FptMailService {
    private config;
    constructor(config: FptMailConfig);
    /**
     * Test kết nối FPT Mail (cải tiến từ code gốc)
     */
    testFptMailConnection(dateRunning: string): Promise<FptMailConnectionResult>;
    /**
     * Đọc emails từ FPT Mail
     */
    getEmails(dateRunning: string): Promise<EmailData[]>;
    private processMailboxes;
    private decodeHeader;
    private decodeQuotedPrintable;
}
export declare function testFptMailConnection(config: FptMailConfig, dateRunning: string): Promise<FptMailConnectionResult>;
export declare function getEmails(config: FptMailConfig, dateRunning: string): Promise<EmailData[]>;
//# sourceMappingURL=fptMailService.d.ts.map