export interface FptMailConfig {
    tenant: string;
    user: string;
    password: string;
    host: string;
    port: number;
    cronTime: string;
    is_active: boolean;
    maxEmails?: number;
    folders?: string[];
}
export interface EmailData {
    id: string;
    subject: string;
    from: string;
    to: string;
    date: string;
    body: string;
    tenant: string;
    folder: string;
}
export interface FptMailConnectionResult {
    success: boolean;
    message: string;
    tenant: string;
    timestamp: string;
}
//# sourceMappingURL=interfaces.d.ts.map