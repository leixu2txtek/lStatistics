var client = require('./src/connection.js');

client.connect(function (db) {

  //create collection pv_day
  db.createCollection('pv_day', { w: 1 }, function (err, collection) {

    if (!!err) {
      console.error('Mongo init collection pv_day error: %s', err.stack);
      return;
    }

    collection.createIndex({ date: -1 }, { unique: true, background: true, w: 1, name: 'date' }, function (err, name) {

      if (!!err) {
        console.error('Mongo create index error: %s', err.stack);
        return;
      }

      console.log('index %s is created', name);
    });

  });

  //create collection pv_view
  db.createCollection('pv_view', { w: 1 }, function (err, collection) {

    if (!!err) {
      console.error('Mongo init collection pv_view error: %s', err.stack);
      return;
    }

    //socket_id
    collection.createIndex({ socket_id: -1 }, { background: true, w: 1, name: 'socket_id' }, function (err, name) {

      if (!!err) {
        console.error('Mongo create index error: %s', err.stack);
        return;
      }

      console.log('index %s is created', name);
    });

    //date_in    
    collection.createIndex({ date_in: -1 }, { background: true, w: 1, name: 'date_in' }, function (err, name) {

      if (!!err) {
        console.error('Mongo create index error: %s', err.stack);
        return;
      }

      console.log('index %s is created', name);
    });
  });

  //create collection pv_visitor
  db.createCollection('pv_visitor', { w: 1 }, function (err, collection) {

    if (!!err) {
      console.error('Mongo init collection pv_visitor error: %s', err.stack);
      return;
    }

    //uid
    collection.createIndex({ uid: -1 }, { unique: true, background: true, w: 1, name: 'uid' }, function (err, name) {

      if (!!err) {
        console.error('Mongo create index error: %s', err.stack);
        return;
      }

      console.log('index %s is created', name);
    });

    //sockets    
    collection.createIndex({ sockets: 1 }, { background: true, w: 1, name: 'sockets' }, function (err, name) {

      if (!!err) {
        console.error('Mongo create index error: %s', err.stack);
        return;
      }

      console.log('index %s is created', name);
    });

    //last_visit_time    
    collection.createIndex({ last_visit_time: -1 }, { background: true, w: 1, name: 'last_visit_time' }, function (err, name) {

      if (!!err) {
        console.error('Mongo create index error: %s', err.stack);
        return;
      }

      console.log('index %s is created', name);
    });

  });

});