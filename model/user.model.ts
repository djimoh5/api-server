export interface User {
    oid: string;
    token?: string;
    username?: string;
    _ts?: number;
}

export class UserHeaderKey {
    static Authorization: string = 'Authorization';
    static AppAuthorization: string = 'App-Authorization';
    static EncryptionSecret = 'o9dJ!he#$43r34lwe';
    static UserAgent = 'user-agent';
    static CacheVersionId = 'cache-version';
    static RateLimiter = 'rate-limit';
}

export var UICacheKey = 'UI-Cache-Key';