/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_331825146")

  // add field
  collection.fields.addAt(26, new Field({
    "hidden": false,
    "id": "number39353658",
    "max": null,
    "min": null,
    "name": "max_connections",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_331825146")

  // remove field
  collection.fields.removeById("number39353658")

  return app.save(collection)
})
