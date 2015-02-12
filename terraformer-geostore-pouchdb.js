(function (root, factory) {
  // Browser Global.
  if(typeof root.navigator === "object") {
    if (!root.Terraformer){
      throw new Error("Terraformer.GeoStore.PouchStorage requires the core Terraformer library. https://github.com/esri/Terraformer");
    }
    if (!root.Terraformer.GeoStore){
      throw new Error("Terraformer.GeoStore.PouchStorage requires the Terraformer GeoStore library. https://github.com/esri/terraformer-geostore");
    }
    root.Terraformer.GeoStore.PouchStorage = factory(root.Terraformer).PouchStorage;
  }
}(this, function() {
  var exports = { };

  var callback;

  // These methods get called in context of the geostore
  function PouchStorage(){
    var opts = arguments[0] || {};
    this._key = opts.key || "_terraformer";
    var config = opts.config ||  {adapter: 'websql'}
    this._store = new PouchDB(this._key, config);
  }

  // store the data at id returns true if stored successfully
  PouchStorage.prototype.add = function(geojson, callback){
    if(geojson.type === "FeatureCollection"){
      for (var i = 0; i < geojson.features.length; i++) {
        this.set(geojson.features[i]);
      }
    } else {
      this.set(geojson);
    }
    if (callback) {
      callback( null, geojson );
    }
  };

  PouchStorage.prototype.key = function(id){
    return id;
  };

  // remove the data from the index and data with id returns true if removed successfully.
  PouchStorage.prototype.remove = function( id, callback ){
    var self = this;
    this._store.get(id).then(function(doc) {
      return self._store.remove(doc, callback);
    }).catch(function(err){
      callback(err, null)
    });
  };

  // return the data stored at id
  PouchStorage.prototype.get = function(id, callback){
    this._store.get(id, callback);
  };

  PouchStorage.prototype.set = function(feature){
    this._store.put(feature);
  };

  PouchStorage.prototype.update = function(geojson, callback){
    var self = this;
    this._store.get(geojson.id, function(err, otherDoc) {
      if(err){
        return callback(err, null);
      }
      self._store.put(geojson, geojson.id, otherDoc._rev, callback);
    });
  };

  PouchStorage.prototype.serialize = function(callback){
    var objs = [];

    this._store.allDocs({include_docs: true}, function(err, response){
      if(err){
        if (callback) {
          callback(err, null);
        }
      } else {
        for(var i = 0; i < response.rows.length){
          var doc = response.rows[i].doc;
          //remove pouch this._store info
          delete doc._id;
          delete doc._rev;
          objs.push(doc);
        }
        if (callback) {
          callback(null, JSON.stringify(objs));
        }
      }

    });
  };

  PouchStorage.prototype.deserialize = function(serial, callback){



    var data = JSON.parse(serial);
    for (var i = data.length - 1; i >= 0; i--) {
      this.set(data[i]);
    }

    if (callback) {
      callback();
    }
  };

  exports.PouchStorage = PouchStorage;

  return exports;
}));