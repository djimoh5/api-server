import { StaticController } from '../controller/static.controller';
import { APIController } from '../controller/api.controller';

import { BaseRouter, RouteInfo } from './base.router';
import {  Config } from '../config/config';

export class Router extends BaseRouter {
    init() {
        let routes: RouteInfo[] = [
            //API Endpoints
            { path: `${this.getBaseUrl()}`, controller: APIController }
        ];

        //static pages
        if(!Config.SERVERLESS) {
            routes = routes.concat([
                { path: '*', controller: StaticController }
            ]);
        }

        return routes;
    }
}