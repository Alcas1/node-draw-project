'use strict';

// Production specific configuration
// =================================
module.exports = {
  // Server IP 
  ip:       process.env.OPENSHIFT_NODEJS_IP ||
            process.env.IP ||
            '127.0.0.1',

  // Server port
  port:     process.env.OPENSHIFT_NODEJS_PORT ||
            process.env.PORT ||
            8080,

  // MongoDB connection options
  mongo: {
    uri:    'mongodb://jonathanwu70:startart1@ds045242.mongolab.com:45242/nodedraw-db' ||
            process.env.MONGOHQ_URL ||
            process.env.OPENSHIFT_MONGODB_DB_URL+process.env.OPENSHIFT_APP_NAME ||
            'mongodb://localhost/nodedraw'
  }
};