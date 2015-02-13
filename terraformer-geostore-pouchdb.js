(function(root, factory) {
    // Browser Global.
    if (typeof root.navigator === "object") {
        if (!root.Terraformer) {
            throw new Error("Terraformer.GeoStore.PouchStorage requires the core Terraformer library. https://github.com/esri/Terraformer");
        }
        if (!root.Terraformer.GeoStore) {
            throw new Error("Terraformer.GeoStore.PouchStorage requires the Terraformer GeoStore library. https://github.com/esri/terraformer-geostore");
        }
        root.Terraformer.GeoStore.PouchStorage = factory(root.Terraformer).PouchStorage;
    }
}(this, function() {
    var exports = {};

    var callback;

    // These methods get called in context of the geostore
    function PouchStorage() {
        var opts = arguments[0] || {};
        this._key = opts.key || "_terraformer";
        var config = opts.config || {
            adapter: 'websql'
        }
        this._store = new PouchDB(this._key, config);
    }

    // store the data at id returns true if stored successfully
    PouchStorage.prototype.add = function(geojson, callback) {
        console.debug(arguments);
        if (!callback) {
            callback = function() {};
        }
        if (geojson.type === "FeatureCollection") {
            for (var i = 0; i < geojson.features.length; i++) {
                geojson.features[i]._id = "" + geojson.features[i].id;
            }
            this._store.bulkDocs(geojson.features, function(err, response) {
                console.debug(arguments);
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, geojson);
                }
            });
        } else {
            this.set(geojson, callback);
        }
    };

    PouchStorage.prototype.key = function(id) {
        return id;
    };

    // remove the data from the index and data with id returns true if removed successfully.
    PouchStorage.prototype.remove = function(id, callback) {
        var self = this;
        this._store.get(id).then(function(doc) {
            return self._store.remove(doc, callback);
        }).catch(function(err) {
            callback(err, null)
        });
    };

    // return the data stored at id
    PouchStorage.prototype.get = function(id, callback) {
        this._store.get(id, function(err, response) {
            if (err) {
                callback(err, null);
            } else {
                delete response._id;
                delete response._rev;
                callback(null, response);
            }
        });
    };

    //really this is set or update
    PouchStorage.prototype.set = function(feature, callback) {
        var self = this;
        feature._id = "" + feature.id;
        this._store.put(feature, function(err, response) {
            if (err) {
                if (err.status == 409) {
                    self.update(feature, callback);
                } else {
                    callback(err, null);
                }
            } else {
                callback(null, feature);
            }
        });
    };

    PouchStorage.prototype.update = function(geojson, callback) {
        var self = this;
        geojson._id = "" + geojson.id;
        this._store.get(geojson.id, function(err, otherDoc) {
            if (err) {
                return callback(err, null);
            }
            self._store.put(geojson, otherDoc._rev, function(err, response) {
                if (err) {
                    callback(err, null);
                } else {
                    delete geojson._id;
                    callback(null, geojson);
                }
            });
        });
    };

    PouchStorage.prototype.serialize = function(callback) {
        var objs = [];

        this._store.allDocs({
            include_docs: true
        }, function(err, response) {
            if (err) {
                if (callback) {
                    callback(err, null);
                }
            } else {
                for (var i = 0; i < response.rows.length; i++) {
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

    PouchStorage.prototype.deserialize = function(serial, callback) {



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
