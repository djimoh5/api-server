import { Common } from "../utility/common";
import { authid, AuthId } from "./id.model";

export class UserAuth {
    oid: authid;
    token?: string;
    virtual?: boolean;

    constructor(public username: string, public password: string) {
        this.oid = AuthId(Common.uniqueId());
    }
}