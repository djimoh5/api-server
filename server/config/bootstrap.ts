import 'core-js/es7/reflect';
import { ReflectiveInjector, Provider, InjectionToken } from 'injection-js';
export { Injectable } from 'injection-js';

export function Bootstrap(injectionToken: InjectionToken<any> = null) {
    return (target) => {
        if(!Injector.disabledAutoBootstrap) {
            if(injectionToken) {
                const provider: Provider = {
                    multi: true,
                    provide: injectionToken,
                    useClass: target
                };

                Injector.add(provider);
            }
            else {
                Injector.add(target);
            }
        }
    };
}

export class Injector {
    private static injector: { [injectionId: number]: any } = {};
    private static injectables: any[] = [];
    static disabledAutoBootstrap: boolean = false;

    static add(cls: any) {
        this.injectables.push(cls);
    }

    static get<T>(cls: { new(...args: any): T; }, injectionId?: string): T {
        if(!injectionId) {
            injectionId = '';
        }
        
        if(!this.injector[injectionId]) {
            this.injector[injectionId] = ReflectiveInjector.resolveAndCreate(this.injectables);
        }

        return this.injector[injectionId].get(cls);
    }
}
