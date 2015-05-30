var elasticsearch = require('elasticsearch'),
	prompt = require('prompt'),
	question;

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
});