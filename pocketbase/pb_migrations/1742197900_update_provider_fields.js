/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_331825146');

		// update max_connections field type
		const maxConnectionsField = collection.fields.find((f) => f.id === 'editor39353658');
		if (maxConnectionsField) {
			maxConnectionsField.type = 'text';
		}

		// add new server info fields
		collection.fields.push(
			new Field({
				id: 'text_xui',
				name: 'xui',
				type: 'bool',
				required: false,
				presentable: false,
				system: false
			})
		);

		collection.fields.push(
			new Field({
				id: 'text_version',
				name: 'version',
				type: 'text',
				required: false,
				presentable: false,
				system: false
			})
		);

		collection.fields.push(
			new Field({
				id: 'text_revision',
				name: 'revision',
				type: 'number',
				required: false,
				presentable: false,
				system: false
			})
		);

		collection.fields.push(
			new Field({
				id: 'text_timestamp',
				name: 'timestamp_now',
				type: 'number',
				required: false,
				presentable: false,
				system: false
			})
		);

		collection.fields.push(
			new Field({
				id: 'text_time_now',
				name: 'time_now',
				type: 'text',
				required: false,
				presentable: false,
				system: false
			})
		);

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_331825146');

		// revert max_connections field type
		const maxConnectionsField = collection.fields.find((f) => f.id === 'editor39353658');
		if (maxConnectionsField) {
			maxConnectionsField.type = 'editor';
		}

		// remove added fields
		collection.fields = collection.fields.filter(
			(f) =>
				!['text_xui', 'text_version', 'text_revision', 'text_timestamp', 'text_time_now'].includes(
					f.id
				)
		);

		return app.save(collection);
	}
);
