var soap = require('soap');
var soapHttp = require('soap/lib/http');
var soapClient = require('soap/lib/client');

// ---

soap.WSDL.prototype.describeEntries = function () {
	var result = [];
	
	// ---
	
	var services = this.describeServices();
	
	// ---
	
	for (var serviceName in services) {
		var service = services[serviceName];
		
		// ---
		
		for (var portName in service) {
			var port = service[portName];
			
			// ---
			
			for (var opName in port) {
				var op = port[opName];
				
				// ---
				
				result.push({
					service: serviceName,
					port: portName,
					op: opName,
					input: op.input,
					output: op.output
				});
			}
		}
	}
	
	// ---
	
	return result;
};

// ---

soapHttp.request = function (url, data, callback, headers, options) {
	this.request.url = url;
	this.request.data = data;
	this.request.headers = headers;
	this.request.options = options;
	
	// ---
	
	callback(new Error('cancel'));
	
	// ---
	
	// satisfy dependencies
	
	return {
		headers: headers
	};
};

// ---

exports.wsdlToRequests = function (url, src, options, callback, endpoint) {
	if (typeof options === 'function') {
		endpoint = callback;
		callback = options;
		options = {};
	}
	
	// ---
	
	endpoint = options.endpoint || endpoint;
	
	// ---
	
	var wsdl = new soap.WSDL(src, url, options);
	
	// ---
	
	wsdl.onReady(function (err, wsdl) {
		if (err) {
			return callback(err);
		}
		
		// ---
		
		var client = new soapClient.Client(wsdl, endpoint, options);
		
		// ---
		
		var requests = [];
		
		// ---
		
		wsdl.describeEntries().forEach(function (entry) {
			var func = client[entry.service][entry.port][entry.op];
			
			// ---
			
			var args = entry.input;
			
			// ---
			
			func(args, function () {
				var url = soapHttp.request.url;
				var data = soapHttp.request.data;
				var headers = soapHttp.request.headers;
				var options = soapHttp.request.options;
				
				// ---
				
				requests.push({
					method: data ? 'POST' : 'GET',
					uri: url,
					headers: headers,
					body: data
				});
			});
		});
		
		// ---
		
		callback(null, requests);
	});
};

// ---
