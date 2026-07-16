import { NgModule } from '@angular/core';

import { AppService } from './app.service';
import { RouterService } from './router.service';
import { ApiService, ApiTokenService } from './api.service';
import { AuthService } from './auth.service';

@NgModule({
    providers: [
        AppService,
        RouterService,
        ApiService,
        ApiTokenService,
        AuthService
    ]
})
export class ServiceModule {}