
var point = { type: "Point", coordinates: [ -122, 45 ], id: "point" };
var featureCollection = {
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "id": "foo",
    "properties": {
      "foo": "bar"
    },
    "geometry":  {
      "type": "Polygon",
      "coordinates": [
        [ [41.83,71.01],[56.95,33.75],[21.79,36.56],[41.83,71.01] ]
      ]
    }
  }],
  "properties": {
    "bar": "baz"
  }
};

describe("PouchStorage", function() {

  it("should correctly add geojson as a point", function () {
    var test_point = false;
    runs(function(){
      var store = new Terraformer.GeoStore.PouchStorage();
      store.add(point, function(err, response){
        if(err)
          throw err;
        test_point = response;
      });
    })

    waitsFor(function(){
      return test_point === point;
    }, null, 1000);
  });

  it("should correctly update geojson as a point", function () {

    var test_point = false;
    runs(function(){
      var store = new Terraformer.GeoStore.PouchStorage();
      store.update(point, function(err, response){
        if(err)
          throw err;
        test_point = response;
      });
    })

    waitsFor(function(){
      return test_point === point;
    }, null, 1000);
  });

  it("should correctly add geojson as a feature collection", function () {

    var collection = false;
    runs(function(){
      var store = new Terraformer.GeoStore.PouchStorage();
      store.add(featureCollection, function(err, response){
        if(err)
          throw err;
          collection = response;
      });
    })

    waitsFor(function(){
      return collection === featureCollection;
    }, null, 1000);
  });

  it("should correctly get a geojson from the store", function () {

    var test_point = false;
    runs(function(){
      var store = new Terraformer.GeoStore.PouchStorage();
      store.add(point, function(err, response){
        if(err)
          throw err;
        store.get("point", function(error, object){
          test_point = object;
          if(error)
            throw error;
        });

      });
    })

    waitsFor(function(){
      return test_point.id == point.id;
    }, null, 5000);
  });

  it("should correctly remove a geojson from the store", function () {

    var store = new Terraformer.GeoStore.PouchStorage();

    var spy = jasmine.createSpy();
    store.add(point, function (err, geojson) {
      expect(err).toBeNull();
      expect(geojson).toEqual(point);
      store.remove("point", function (err, id) {
        expect(err).toBeNull();
        expect(id).toEqual("point");
        store.get("point", spy);
        expect(spy).toHaveBeenCalledWith(null, null);
      });
    });
  });

  it("should correctly serialize and deserialize", function () {

    var store = new Terraformer.GeoStore.PouchStorage();
    store.add(point);

    store.serialize(function (err, data) {
      store.remove("point");

      expect(data).toEqual('[{\"type\":\"Point\",\"coordinates\":[-122,45],\"id\":\"point\"}]');
      store.deserialize(data, function () { });

      var spy = jasmine.createSpy();
      store.get("point", spy);
      expect(spy).toHaveBeenCalledWith(null, point);
    });
  });


});
