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

    getAll(): Promise<UserAuth[]> {
        return this.context.find({}, { password: 0 });
    }

    getByOids(oids: string[]): Promise<UserAuth[]> {
        return this.context.find({ oid: { $in: oids } }, { password: 0 });
    }

    getByUsernames(usernames: string[]): Promise<UserAuth[]> {
        return this.context.find({ username: { $in: usernames } }, { password: 0 });
    }

    removeVirtualFlag(oid: string): Promise<any> {
        return this.context.update({ oid }, { virtual: '' }, null, { unset: true });
    }
}