// Server Configuration

var conf = {};

// Development configuration
if (process.env.NODE_ENV === 'development') {
    
    conf.azure_config = {
        client: 'mysql',
            connection: {
                host     : 'eu-cdbr-azure-west-d.cloudapp.net',
                port     : '3306',
                user     : 'bdcc04cdbd943a',
                password : '319a49c8',
                database : 'groepj',
                charset  : 'utf8'
            },
            pool: {
                min: 1,
                max: 4
            },
            useNullAsDefault: true
    };
}

module.exports = conf;