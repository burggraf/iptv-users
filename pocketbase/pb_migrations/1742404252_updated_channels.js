/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3009067695")

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "date21960509",
    "max": "",
    "min": "",
    "name": "validation_date",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "json2537329608",
    "maxSize": 0,
    "name": "validation_result",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3009067695")

  // remove field
  collection.fields.removeById("date21960509")

  // remove field
  collection.fields.removeById("json2537329608")

  return app.save(collection)
})
