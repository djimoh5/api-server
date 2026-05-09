import { Bootstrap, Injectable } from "../config/bootstrap";
import { BaseRepository } from "./base.repository";
import { UserAuth } from "../../model/auth.model";

@Injectable()
@Bootstrap()
export class AuthRepository extends BaseRepository {
    constructor() {
        super('agent_auth');
    }

    getByUsername(username: string): Promise<UserAuth> {
        return this.context.findOne({ username: username }, { password: 0 });
    }

    getByUsernameWithCredentials(username: string): Promise<UserAuth> {
        return this.context.findOne({ username: username });
    } 

    update(auth: UserAuth): Promise<UserAuth> {
        console.log(`updating auth ${auth.oid}`);
        return super.updateObject(auth);
    }
}