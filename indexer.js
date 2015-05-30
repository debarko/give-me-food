var csv = require('csv-to-json'),
	dataFile = {
		filename: 'data.csv'
	},
	parsedCSV;

//Process the parsed CSV
parsedCSV = function (err, json) {
	json.forEach(function (jsonItem) {
		jsonItem.Calories = parseInt(jsonItem.Calories, 10);
		jsonItem.Protein = parseInt(jsonItem.Protein, 10);
		jsonItem.Fat = parseInt(jsonItem.Fat, 10);
		jsonItem.Carbs = parseInt(jsonItem.Carbs, 10);
	});

	console.log(json);
}

csv.parse(dataFile, parsedCSV);
