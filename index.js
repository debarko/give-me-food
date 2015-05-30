var elasticsearch = require('elasticsearch'),
	prompt = require('prompt'),
	client = new elasticsearch.Client({
	  host: 'localhost:9200',
	  log: 'trace'
	}),
	question, indexName = 'eat-load', typeData = 'food';

prompt.start();
prompt.message = "f00dQueue".rainbow;
prompt.delimiter = " : ".green;

prompt.get({
	properties: {
		query: {
			description: 'Please enter your query',
			type: 'string',
			required: true
		}
	}
}, function (err, result) {
	if (err) {
		console.log(err);
		return;
	}
	
	question = result.query;
	sendQuery();
});

function sendQuery() {
	var numbers = question.match(/^\d+|\d+\b|\d+(?=\w)/g), cT = '', pT = '', fT = '';

	if (!numbers || numbers.length > 1) {
		numbers = [1];
	}
	//Some hack has been implemented here
	//The query can be far more optimised
	//so that this hack is not required
	//like writing a synonyms query
	//Or we can use some stemming library
	//and synonym library to get to a single
	//word
	question = question.toLowerCase();
	question = question.replace('less', 'low');
	question = question.replace('rich', 'high');
	question = question.replace('excess', 'high');
	question = question.replace('more', 'high');
	question = question.replace('little', 'high');
	question = question.replace('carbohydrate', 'carb');
	question = question.replace('carbohydrates', 'carb');
	question = question.replace('average', 'carb');
	question = question.replace('fatty', 'fat');
	question = question.replace('norm', 'normal');

	if (question.indexOf('carb') > -1 && question.indexOf('high') > -1) {
		cT = 'high carb';
	}
	if (question.indexOf('carb') > -1 && question.indexOf('low') > -1) {
		cT = 'low carb';
	}
	if (question.indexOf('carb') > -1 && question.indexOf('normal') > -1) {
		cT = 'normal carb';
	}

	if (question.indexOf('fat') > -1 && question.indexOf('high') > -1) {
		fT = 'high fat';
	}
	if (question.indexOf('fat') > -1 && question.indexOf('low') > -1) {
		fT = 'low fat';
	}
	if (question.indexOf('fat') > -1 && question.indexOf('normal') > -1) {
		fT = 'normal fat';
	}

	if (question.indexOf('protein') > -1 && question.indexOf('high') > -1) {
		pT = 'high protein';
	}
	if (question.indexOf('protein') > -1 && question.indexOf('low') > -1) {
		pT = 'low protein';
	}
	if (question.indexOf('carb') > -1 && question.indexOf('normal') > -1) {
		pT = 'normal protein';
	}

	client.search({
	  index: indexName,
	  type: typeData,
	  body: {
	    query: {
	      bool: {
	      	should: [
	      		{
	      			match: {
		      			Food: {
		      				query: question,
		      				operator: 'and',
		      				boost: 900
		      			}
		      		}
		      	},
		      	{
		      		match: {
		      			proTag: {
		      				query: pT,
		      				operator: 'and',
		      				boost: 200
		      			}
		      		}
		      	},
		      	{
		      		match: {
		      			fatTag: {
		      				query: fT,
		      				operator: 'and',
		      				boost: 200
		      			}
		      		}
		      	},
		      	{
		      		match: {
		      			carTag: {
		      				query: cT,
		      				operator: 'and',
		      				boost: 200
		      			}
		      		}
		      	},
		      	{
		      		match: {
		      			ratTag: {
		      				query: question,
		      				operator: 'or',
		      				boost: 500
		      			}
		      		},
		      	},
	      		{
				    range : {
				        Calories : {
				            lte : parseInt(numbers[0], 10),
				            boost : 50
				        }
				    }
				}
	      	],
	      	minimum_should_match: 1
	      }
	    }
	  }
	}).then(function (resp) {
	    var hits = resp.hits.hits;
	    
	    console.log('\n\n\n\n\n\n\n---------------------------------');
	    if (hits.length) {
	    	console.log('Food]\t\t\t\t\t\tProtein\tFat\tCarbs\tRating\tCalories');
	    	hits.forEach(function(hitItem) {
	    		console.log(hitItem._source.Food + '\t\t\t\t\t\t' + hitItem._source.Protein + '\t' + hitItem._source.Fat + '\t' + hitItem._source.Carbs + '\t' + hitItem._source.Rating + '\t' + hitItem._source.Calories);
	    	});
	    	console.log("\n\nMatches: " + hits.length);
	    } else {
	    	console.log("No Results found");
	    }
	}, function (err) {
	    console.trace(err.message);
	});
}