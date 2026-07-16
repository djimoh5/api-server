import { Routes, RouterModule } from '@angular/router';

//import { AuthGuard, NoAuthGuard } from 'app/auth';
import { HomeComponent } from './component/home/home.component';

export const routes: Routes = [
    //unauthenticated routes
    { path: '', component: HomeComponent },
    
    //catch all
    { path: '**', component: HomeComponent }
];

export const routing = RouterModule.forRoot(routes, {
    anchorScrolling: 'enabled'
});