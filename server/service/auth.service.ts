
import { Bootstrap, Injectable } from '../config/bootstrap';
import { AuthRepository } from '../respository/auth.repository';

import { ApiResponse, BaseService } from './base.service';
import { AppService } from './app.service';

import { UserAuth } from '../../model/auth.model';
import { PasswordUtility } from '../../utility/password.utility';

const bcrypt = require('bcrypt');

@Injectable()
@Bootstrap()
export class AuthService extends BaseService {
    private readonly saltRounds: number;

    constructor(protected appService: AppService, protected authRepository: AuthRepository) {
        super(appService);

        this.saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
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
        const auth = (await this.authRepository.getByUsernameWithCredentials(username))[0];

        if(create) {
            return this.register(auth, username, password);
        }

        return this.login(auth, password, bypassPassword);
    }

    private async persistAuth(username: string, password: string) {
        const hash = await bcrypt.hash((password), this.saltRounds);
        const auth = await this.authRepository.update(new UserAuth(username, hash));

        delete auth.password; // remove password from response
        return new ApiResponse(true, auth);
    }

    private register(auth: UserAuth, username: string, password: string) {
        if(!auth) {
            if(PasswordUtility.isPasswordSecure(password)) {
                return this.persistAuth(username, password);
            }
            
            return new ApiResponse(false, null, PasswordUtility.insecurePasswordMessage(password));
        }

        return new ApiResponse(false, null, 'the user already exists');
    }

    private async login(auth: UserAuth, password: string, bypassPassword?: boolean): Promise<ApiResponse<UserAuth>> {
        if(!auth) {
            return new ApiResponse(false, null, 'username of password incorrect');
        }

        const valid = bypassPassword || await bcrypt.compare(password, auth.password);
        if(!valid) {
            return new ApiResponse(false, null, 'username of password incorrect');
        }

        delete auth.password; // remove password from response
        return new ApiResponse(true, auth);
    }
}