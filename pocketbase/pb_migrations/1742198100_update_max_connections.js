/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_331825146');

		// change max_connections field type from editor to number
		const maxConnectionsField = collection.fields.find((f) => f.id === 'editor39353658');
		if (maxConnectionsField) {
			maxConnectionsField.type = 'number';
			maxConnectionsField.min = 1;
			maxConnectionsField.max = null;
			maxConnectionsField.onlyInt = true;
		}

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_331825146');

		// revert max_connections field type back to editor
		const maxConnectionsField = collection.fields.find((f) => f.id === 'editor39353658');
		if (maxConnectionsField) {
			maxConnectionsField.type = 'editor';
			delete maxConnectionsField.min;
			delete maxConnectionsField.max;
			delete maxConnectionsField.onlyInt;
		}

		return app.save(collection);
	}
);
