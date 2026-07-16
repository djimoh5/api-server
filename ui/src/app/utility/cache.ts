import { GenericMap } from '../../../../model/shared.model';

declare var md5:any;

declare var $: any;

export class Cache {
    private static memoryCache: GenericMap<any> = {};

	static set(key: string, keyCategory: string, data: any, expirationInSeconds: number, subKey: string = '_', inMemory?: boolean) {
        let encryptedKey = this.getEncryptedKey(key, keyCategory);
        let currentData = inMemory ? this.memoryCache[encryptedKey] : $.jStorage.get(encryptedKey);
        
        if(!currentData) {
            currentData = {};
        }
        
        currentData[md5(subKey || '_')] = data;

        if(inMemory) {
            this.memoryCache[encryptedKey] = currentData;
        }
        else {
            $.jStorage.set(encryptedKey, currentData, { TTL: expirationInSeconds * 1000 });
        }
	}
	
    static get(key: string, keyCategory: string, subKey: string = '_', inMemory?: boolean) {
        let encryptedKey = this.getEncryptedKey(key, keyCategory);
        let data = inMemory ? this.memoryCache[encryptedKey] : $.jStorage.get(encryptedKey);
        return data ? data[md5(subKey || '_')] : undefined;
	}
	
    static remove(key: string, keyCategory: string = null) {
        let encryptedKey = this.getEncryptedKey(key, keyCategory);
        $.jStorage.deleteKey(encryptedKey);
        delete this.memoryCache[encryptedKey];
	}
	
    static flush(keyCategory: string = null, expirationThreshold: number = null) {
        if (keyCategory) {
            var keys = $.jStorage.index();
            keys.forEach((key: string) => {
                if (key.substring(0, keyCategory.length) === keyCategory && 
                    (!expirationThreshold || $.jStorage.getTTL(key) < (expirationThreshold * 1000))) {
                    $.jStorage.deleteKey(key);
                }
            });
        }
        else {
            $.jStorage.flush();
        }

        this.memoryCache = {};
	}
	
	static size () {
		return $.jStorage.storageSize();
	}
	
	static free () {
		return $.jStorage.storageAvailable();
    }

    private static getEncryptedKey(key: string, keyCategory: string) {
        return keyCategory ? `${keyCategory}${md5(key)}` : md5(key);
    }
}