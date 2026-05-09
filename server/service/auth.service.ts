
import { Bootstrap, Injectable } from '../config/bootstrap';
import { AuthRepository } from '../repository/auth.repository';
import { InviteRepository } from '../repository/invite.repository';
import { LoginCodeRepository } from '../repository/login-code.repository';

import { ApiResponse, BaseService } from './base.service';
import { AppService } from './app.service';
import { EmailService } from './email.service';

import { UserAuth } from '../../model/auth.model';
import { Invite } from '../../model/invite.model';
import { LoginCode, LoginCodePurpose } from '../../model/login-code.model';
import { Email } from '../../model/email.model';
import { PasswordUtility } from '../../utility/password.utility';
import { Config } from '../config/config';
import { Common } from '../../utility/common';

const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');

@Injectable()
@Bootstrap()
export class AuthService extends BaseService {
    private readonly saltRounds: number;

    constructor(
        protected appService: AppService,
        protected authRepository: AuthRepository,
        protected inviteRepository: InviteRepository,
        protected loginCodeRepository: LoginCodeRepository,
        protected emailService: EmailService
    ) {
        super(appService);

        this.saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
    }

    async requestLoginCode(username: string): Promise<ApiResponse<null>> {
        const auth = await this.authRepository.getByUsername(username);

        if (!auth) {
            return new ApiResponse(true, null, 'If an account exists, a code has been sent.');
        }

        const secret = speakeasy.generateSecret();
        const code: string = speakeasy.totp.generate({ secret: secret.base32, encoding: 'base32' });

        await this.loginCodeRepository.save(new LoginCode(username, secret.base32, LoginCodePurpose.Login));

        const email: Email = {
            to: [username],
            subject: 'Your login code',
            html: `<p>Your one-time login code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`
        };
        this.emailService.sendEmail(email, auth.oid as string);

        return new ApiResponse(true, null, 'If an account exists, a code has been sent.');
    }

    async verifyLoginCode(username: string, code: string): Promise<ApiResponse<UserAuth>> {
        const EXPIRY_MS = 15 * 60 * 1000;
        const loginCode = await this.loginCodeRepository.getByUsername(username);

        if (!loginCode || (Date.now() - loginCode.createdAt) > EXPIRY_MS) {
            return new ApiResponse(false, null, 'Invalid or expired code.');
        }

        const isValid: boolean = speakeasy.totp.verify({
            secret: loginCode.secret,
            encoding: 'base32',
            token: code,
            window: 1
        });

        if (!isValid) {
            return new ApiResponse(false, null, 'Invalid or expired code.');
        }

        loginCode.used = true;
        await this.loginCodeRepository.save(loginCode);

        const auth = await this.authRepository.getByUsername(username);
        if (!auth) {
            return new ApiResponse(false, null, 'Invalid or expired code.');
        }

        return new ApiResponse(true, auth);
    }

    async requestPasswordReset(username: string): Promise<ApiResponse<null>> {
        const auth = await this.authRepository.getByUsername(username);

        if (!auth || auth.virtual) {
            return new ApiResponse(true, null, 'If an account exists, a reset code has been sent.');
        }

        const secret = speakeasy.generateSecret();
        const code: string = speakeasy.totp.generate({ secret: secret.base32, encoding: 'base32' });

        await this.loginCodeRepository.save(new LoginCode(username, secret.base32, LoginCodePurpose.PasswordReset));

        const email: Email = {
            to: [username],
            subject: 'Reset your password',
            html: `<p>Your password reset code is: <strong>${code}</strong></p><p>This code expires in 15 minutes. If you did not request a password reset, you can ignore this email.</p>`
        };
        this.emailService.sendEmail(email, auth.oid as string);

        return new ApiResponse(true, null, 'If an account exists, a reset code has been sent.');
    }

    async resetPassword(username: string, code: string, newPassword: string): Promise<ApiResponse<null>> {
        const EXPIRY_MS = 15 * 60 * 1000;
        const loginCode = await this.loginCodeRepository.getByUsernameForReset(username);

        if (!loginCode || (Date.now() - loginCode.createdAt) > EXPIRY_MS) {
            return new ApiResponse(false, null, 'Invalid or expired code.');
        }

        const isValid: boolean = speakeasy.totp.verify({
            secret: loginCode.secret,
            encoding: 'base32',
            token: code,
            window: 1
        });

        if (!isValid) {
            return new ApiResponse(false, null, 'Invalid or expired code.');
        }

        if (!PasswordUtility.isPasswordSecure(newPassword)) {
            return new ApiResponse(false, null, PasswordUtility.insecurePasswordMessage(newPassword));
        }

        loginCode.used = true;
        await this.loginCodeRepository.save(loginCode);

        await this.persistAuth(username, newPassword);

        return new ApiResponse(true, null, 'Password has been reset successfully.');
    }

    async updateAuth(username: string, password: string, newPassword: string): Promise<ApiResponse<UserAuth>> {
        const existing = await this.authRepository.getByUsernameWithCredentials(username);
        if (existing) {
            if(!(await this.authenticate(username, password))) {
                return new ApiResponse(false, null, 'unauthorized access');
            }

            return this.persistAuth(username, newPassword);
        }

        return new ApiResponse(false, null, 'unauthorized access');
    }

    update(auth: UserAuth) {
        return this.authRepository.update(auth);
    }

    async authenticate(username: string, password: string, create?: boolean, bypassPassword?: boolean): Promise<ApiResponse<UserAuth>> {
        const auth = await this.authRepository.getByUsernameWithCredentials(username);

        if(create) {
            return this.register(auth, username, password);
        }

        return this.login(auth, password, bypassPassword);
    }

    async invite(username: string, invitedBy: string): Promise<ApiResponse<null>> {
        const auth = await this.authRepository.getByUsername(username);
        if (auth && !auth.virtual) {
            return new ApiResponse(false, null, 'user already exists');
        }

        if (!auth) {
            const userAuth = new UserAuth(username, '');
            userAuth.virtual = true;
            await this.authRepository.update(userAuth);
        }

        const inviteCode = Common.uniqueId();
        const inviteExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;

        const existing = await this.inviteRepository.getByUsername(username);
        let invite: Invite;
        if (existing) {
            existing.inviteCode = inviteCode;
            existing.inviteExpiry = inviteExpiry;
            existing.invitedBy = invitedBy;
            invite = existing;
        } else {
            invite = new Invite(username, inviteCode, inviteExpiry, invitedBy);
        }
        await this.inviteRepository.save(invite);

        const email: Email = {
            to: [username],
            subject: "You've been invited",
            html: `<p>You've been invited to join. Click the link below to get started.</p><p><a href="${Config.APP_URL}/invite?code=${inviteCode}">Accept Invite</a></p>`
        };
        this.emailService.sendEmail(email, invitedBy);

        return new ApiResponse(true, null);
    }

    async redeemInviteCode(code: string): Promise<ApiResponse<UserAuth>> {
        const invite = await this.inviteRepository.getByCode(code);
        if (!invite) {
            return new ApiResponse(false, null, 'invalid invite code');
        }
        if (Date.now() > invite.inviteExpiry) {
            return new ApiResponse(false, null, 'invite code has expired');
        }
        const auth = await this.authRepository.getByUsername(invite.username);
        if (!auth || !auth.virtual) {
            return new ApiResponse(false, null, 'invalid invite code');
        }
        return new ApiResponse(true, auth);
    }

    private async persistAuth(username: string, password: string, existingAuth?: UserAuth) {
        const hash = await bcrypt.hash(password, this.saltRounds);
        let auth: UserAuth;
        if (existingAuth) {
            existingAuth.password = hash;
            delete existingAuth.virtual;
            auth = await this.authRepository.update(existingAuth);
        } else {
            auth = await this.authRepository.update(new UserAuth(username, hash));
        }
        delete auth.password;
        return new ApiResponse(true, auth);
    }

    private register(auth: UserAuth, username: string, password: string) {
        if (!auth || auth.virtual) {
            if (PasswordUtility.isPasswordSecure(password)) {
                return this.persistAuth(username, password, auth?.virtual ? auth : undefined);
            }
            return new ApiResponse(false, null, PasswordUtility.insecurePasswordMessage(password));
        }
        return new ApiResponse(false, null, 'the user already exists');
    }

    private async login(auth: UserAuth, password: string, bypassPassword?: boolean): Promise<ApiResponse<UserAuth>> {
        if (!auth || auth.virtual) {
            return new ApiResponse(false, null, 'username or password incorrect');
        }
        const valid = bypassPassword || await bcrypt.compare(password, auth.password);
        if (!valid) {
            return new ApiResponse(false, null, 'username or password incorrect');
        }
        delete auth.password;
        return new ApiResponse(true, auth);
    }
}