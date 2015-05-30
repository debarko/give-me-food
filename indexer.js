var csv = require('csv-to-json'),
	elasticsearch = require('elasticsearch'),
	dataFile = {
		filename: 'data.csv'
	},
	parsedCSV, esClient, dataToLoad, indexName = 'eat-load', typeData = 'food';

function connectES() {
	esClient = new elasticsearch.Client({
		host: 'localhost:9200',
		log: 'trace'
	});

	deleteIndex();
}

function deleteIndex() {
	esClient.indices.delete({
    	index: indexName
	}, createIndex);
}

function createIndex() {
	esClient.indices.create({
    	index: indexName,
    	type: typeData,
    	body: {
    		number_of_shards: 3,
    		number_of_replicas: 0
    	}
	}, function(err,resp,respcode){
	    if (!err) {
	    	pushSettings();
	    }
	});
}

function pushSettings() {
	var body = {
		analysis: {
			filter : {
                english_snow : {
                    type : 'snowball',
                    language : 'English'
                }
            },
			analyzer: {
				stemmed_keyword: {
					type: 'custom',
					tokenizer: 'keyword',
					filter: [
						'stop',
						'lowercase',
						'english_snow'
					]
				}
			}
		}
	};

	esClient.indices.close({
		index: indexName
	}, function(err, resp, respcode) {
		if (!err) {
			esClient.indices.putSettings({
				index: indexName,
				body: body
			}, function (err, resp, respcode) {
				if (!err) {
					esClient.indices.open({
						index: indexName
					}, function (err, resp, respcode) {
						if (!err) {
							pushMapping();
						}
					});
				}
			});
		}
	});
}

function pushMapping() {
	var body = {};

	body[typeData] = {
		properties : {
			Food: {
				type: 'string'
			},
			Calories: {
				type: 'integer'
			},
			Protein: {
				type: 'integer'
			},
			proTag: {
				type: 'string',
				index_analyzer: 'stemmed_keyword'
			},
			Fat: {
				type: 'integer'
			},
			fatTag: {
				type: 'string',
				index_analyzer: 'stemmed_keyword'
			},
			Carbs: {
				type: 'integer'
			},
			carTag: {
				type: 'string',
				index_analyzer: 'stemmed_keyword'
			},
			Rating: {
				type: 'string'
			},
			ratTag: {
				type: 'string'
			}
		}
	};
	esClient.indices.putMapping({
		index: indexName,
		type: typeData,
		body:body
	}, function (err, resp, respcode) {
		if (!err) {
			dataEntry();
		}
	});
}

function dataEntry() {
	dataToLoad.forEach(function (datum) {
		if (datum.Protein > 50) {
			datum.proTag = 'high protein rich';
		} else if (datum.Protein < 20) {
			datum.proTag = 'less protein low';
		} else {
			datum.proTag = 'normal protein average';
		}

		if (datum.Fat > 50) {
			datum.fatTag = 'high fat rich';
		} else if (datum.Fat < 20) {
			datum.fatTag = 'less fat low';
		} else {
			datum.fatTag = 'normal fat average';
		}

		if (datum.Carbs > 50) {
			datum.carTag = 'high carbs carb carbohydrates rich';
		} else if (datum.Carbs < 20) {
			datum.carTag = 'less carbs carb carbohydrates low';
		} else {
			datum.carTag = 'normal carbs carb carbohydrates average';
		}

		if (datum.Rating.indexOf('A') > -1 || datum.Rating === 'B+' ) {
			datum.ratTag = 'healthy healthful good food diet';
		} else {
			datum.ratTag = 'unhealthy bad food diet';
		}

		esClient.index({
			index: indexName,
			type: typeData,
			body: datum
		});
	});

}

//Process the parsed CSV
parsedCSV = function (err, json) {
	json.forEach(function (jsonItem) {
		jsonItem.Calories = parseInt(jsonItem.Calories, 10);
		jsonItem.Protein = parseInt(jsonItem.Protein, 10);
		jsonItem.Fat = parseInt(jsonItem.Fat, 10);
		jsonItem.Carbs = parseInt(jsonItem.Carbs, 10);
	});

	dataToLoad = json;
	connectES();
}

csv.parse(dataFile, parsedCSV);
