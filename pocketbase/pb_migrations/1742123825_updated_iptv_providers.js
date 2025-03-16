/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_331825146")

  // update collection data
  unmarshal({
    "createRule": "user_id = @request.auth.id",
    "deleteRule": "user_id = @request.auth.id",
    "listRule": "user_id = @request.auth.id",
    "updateRule": "user_id = @request.auth.id",
    "viewRule": "user_id = @request.auth.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_331825146")

  // update collection data
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, collection)

  return app.save(collection)
})
