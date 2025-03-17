/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_331825146")

  // remove field
  collection.fields.removeById("editor39353658")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_331825146")

  // add field
  collection.fields.addAt(11, new Field({
    "convertURLs": false,
    "hidden": false,
    "id": "editor39353658",
    "maxSize": 0,
    "name": "max_connections",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "editor"
  }))

  return app.save(collection)
})
