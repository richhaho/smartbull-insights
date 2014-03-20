const WRONG_ON_PURPOSE = 'wrong on purpose';
const envConfig = {
    test: {

        mongodb_uri: "mongodb://localhost:27017/smartbull-insights--test",
        rabbit_url: process.env.CLOUDAMQP_URL || 'amqp://FAIL',
        forceHttps: false,
        jwt_secret: 'shhhhh',
        awsAccessKey: WRONG_ON_PURPOSE,
        awsSecretKey: WRONG_ON_PURPOSE,
        awsBucket: WRONG_ON_PURPOSE,
        ggServiceAccountKey: WRONG_ON_PURPOSE,
    },
    development: {
        mongodb_uri: process.env.MONGO_URL || process.env.MONGODB_URI || "mongodb://localhost:27017/smartbull-insights",
        rabbit_url: process.env.CLOUDAMQP_URL || 'amqp://localhost',
        forceHttps: false,
        jwt_secret: 'shhhhh',
        awsAccessKey: 'AKIAIDDUE34YLG54US3A',
        awsSecretKey: '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',
        awsBucket: 'smartbull-dev-uploads'
    },
    staging: {
        mongodb_uri: process.env.MONGO_URL || process.env.MONGODB_URI || process.env.MONGOLAB_URI || process.env.MONGOHQ_URL,
        rabbit_url: process.env.CLOUDAMQP_URL,
        awsAccessKey: 'AKIAIDDUE34YLG54US3A',
        awsSecretKey: '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',
        awsBucket: 'smartbull-dev-uploads',
        forceHttps: true,
        jwt_secret: 'B152Iz919QhULqM53m158VopujfkthjHSThu37Ju'
    },
    production: {
        mongodb_uri: process.env.MONGO_URL || process.env.MONGODB_URI || process.env.MONGOLAB_URI || process.env.MONGOHQ_URL,
        rabbit_url: process.env.CLOUDAMQP_URL || 'amqp://FAIL',
        forceHttps: true,
        awsBucket:'smartbull-approvals',
    }
};
process.env.NODE_ENV = process.env.NODE_ENV || 'development'
let config = envConfig[process.env.NODE_ENV];

config.forceHttps = (process.env.FORCE_HTTPS ? (process.env.FORCE_HTTPS === "true") : config.forceHttps);

config.awsAccessKey = process.env.AWS_ACCESS_KEY || config.awsAccessKey;
config.awsSecretKey = process.env.AWS_SECRET_KEY || config.awsSecretKey;
config.awsBucket = process.env.AWS_BUCKET || config.awsBucket;

config.jwt_secret = config.jwt_secret || process.env.SECRET;
if (!config.jwt_secret){
    throw new Error('JWT secret not defined');
}

// config.ggServiceAccountKey = (process.env.ggServiceAccountKey && JSON.parse(process.env.ggServiceAccountKey)) || config.ggServiceAccountKey;
// if (!config.ggServiceAccountKey){
//     throw new Error('google sheets api creds undefined!');
// }
config.ggServiceAccountKey={
  "type": "service_account",
  "project_id": "smartbull-insights",
  "private_key_id": "885053d97e00982ea947f270883af055369fd77a",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCHaTWqgZRkSVp0\ng+YyjcUnbVrkhOIipL91eAjqZekCXAEzz1Trd0WN6RAespXfNXOR/ugbxQBj+KGP\nj/D8+/alB6HDphcEFY0IvCZPDyMzcBkidsbcTzsVhqhAi89BoA1qUVtCpkAfhlJf\nYz6QztA0pRWu2ixizTxWUcHSmzER1R5/fuO4hYAoruaogCaxjoMtQHgu3hYexnuZ\nCXq8lsp3IREnLYMU9w09aK6jTh0zcP794WHQWoav2jNyPnwV+kXWtCuYxF7oHAuC\ngj+ft1OjIOjM3KPMaGQ25sEoSiFRP4m+HPIV0sUYTLe60Cf5+ialu9PVcbJlqcWO\nuGYQTmH1AgMBAAECggEAAZgWBmBR1sWcHQ7pLYJUSxzVHulkeNiKU53f9ERl5J3x\n32A1OUsS4wd1qbo+yLN7qO+azKKWaGhVQ2qL1sH7Qk8Q7x1OCrnIKY9f5YhORQ2Z\nQ/fu12Ecu/tKcfUrohxyTexKakI0twtC+lISG9GTdgVg1U1Go2aEdUMUSJC65fDE\nM2/9r7Bss2/4leuP4VHih0EVC0Ep/0q5hvfUPyjkdDwsv4VsLpztXtY1ol4nm+iJ\nWbBrCbHKOEzPYUh4PJHW9m3pjagYDbdadSxeuObssI7Mut1kZ0Bn61J/ZrMfJlei\nF7KjldqiT+3h+lOaULblupLJGYjOTX0eMFctOX/ZcQKBgQC+TN3zuXTCYbL6p7rm\nHwLc5KUN7YfL1jV/1wh0EtuMxPib05UNwat1rIXrgKHFtzaXCd3If4MbYqm3lErR\nU2OWpr3MCL1y78Ose8VZQ94zSqcFshY7VqOhEMcYwJnmCR7AnRDuRbPkcWJ6pAMJ\nsL4NuI1EgVG+dPnHKnIIFFqldwKBgQC2KR0BUQ6kH12bx7rXWJDjZua6gMFXr7Er\nTJgm0AE7MK61Qak/f9AKtqvJQievFWCuFQ0XRHXqBly2GD19P4v66aYuMeN7zJ8u\nWKcYVRFO7mJp7sEFJPrPv103OyHXsaq3abkT8D5vbUupfio3Mpc6vv/kfR7Cl9Uu\n+eHmtXO+8wKBgCf4MyIO0NRG+vWkpx/QYaSNrZE4U65fhoscWh0vHMf7UxA/p23l\nQKMNom8tbEz/x0p/+wIyrhHhbi4tym0e66rnyLODHm92po2izXeLRq9VPbF3jy3V\na7bXtEmhonFrdvcTxkuVfkw7+Ggz7KNraO+u1JUP6GBtZ00KwDqsM8HPAoGAPYQc\n23j4LMy63ATTQC4Un/b8LDeXE3mtpyWyrEjKYabLGUMXWO5c34FY+hpxNFtPzvok\n9ZqVB3cmkAgXm9h9+To2eJs4a3Jqv0gJBdqUgcdXTNboMEiQut+xJxm9EA5bzJzT\nd7xGGXMbfh2xO/rFv30JBayLWsPTpo2UkEju0akCgYEAlK4JqSqmr10DiSqiBsdv\nKln1Uy3jMG6R2ozwJ61l5FuZnURrv2aa6b9BICMOkGLP25QsBw2gPJCekmXx1R9B\nM2v+cmjdHrl4nRxxeTqhjTqnzPF/hqO2utEWgpQxxXC4XIEf1mcYIYOGptMCJSZg\n1ucwis+BLaP4Vpjrz/U6DrE=\n-----END PRIVATE KEY-----\n",
  "client_email": "viktor@smartbull-insights.iam.gserviceaccount.com",
  "client_id": "114713762572445411678",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/viktor%40smartbull-insights.iam.gserviceaccount.com"
}
// for values, see consts FF_*
config.FEATURE_FLAGS = new Set((process.env.FEATURE_FLAGS || '').split(/[,;\s]/g).filter(x=>!!x));

// console.log('config', config)

module.exports = config;
