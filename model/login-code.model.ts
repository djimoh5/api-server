import { Common } from "../utility/common";
import { uniqueid, UniqueId } from "./id.model";

export enum LoginCodePurpose {
    Login = 'login',
    PasswordReset = 'password_reset'
}

export class LoginCode {
    oid: uniqueid;
    username: string;
    secret: string;    // base32 TOTP secret from speakeasy
    createdAt: number; // ms timestamp for 15-min expiry check
    used: boolean;
    purpose: LoginCodePurpose;

    constructor(username: string, secret: string, purpose: LoginCodePurpose) {
        this.oid = UniqueId(Common.uniqueId());
        this.username = username;
        this.secret = secret;
        this.createdAt = Date.now();
        this.used = false;
        this.purpose = purpose;
    }
}
