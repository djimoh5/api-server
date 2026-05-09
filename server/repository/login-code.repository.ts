import { Bootstrap, Injectable } from "../config/bootstrap";
import { BaseRepository } from "./base.repository";
import { LoginCode, LoginCodePurpose } from "../../model/login-code.model";

@Injectable()
@Bootstrap()
export class LoginCodeRepository extends BaseRepository {
    constructor() {
        super('login_code');
    }

    getByUsername(username: string): Promise<LoginCode> {
        return this.context.findOne({ username, used: false, purpose: LoginCodePurpose.Login });
    }

    getByUsernameForReset(username: string): Promise<LoginCode> {
        return this.context.findOne({ username, used: false, purpose: LoginCodePurpose.PasswordReset });
    }

    save(loginCode: LoginCode): Promise<LoginCode> {
        return super.updateObject(loginCode);
    }
}
