//DO NOT REFERENCE CLASS OUTSIDE OF ANY DEPLOYMENT SCRIPTS, USE PLATFORM.SERVICE INSTEAD!
export class DeployConfig {
    static INJECTED_PLATFORM_ID = 1;
    static DOMAIN: string = 'mahjtrack.com';
    static BUCKET: string = 'mahjong.release';
    static CLOUDFRONT_DISTRIBUTION_NAME: string = 'MahjUp';
    static CLOUDFRONT_DISTRIBUTION: string = '';
    static AWS_ACCESS_KEY = "";
    static AWS_ACCESS_SECRET = "";
    static SERVER = "";
}