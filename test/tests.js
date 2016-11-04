import globby from 'globby'
globby.sync([__dirname + '/../src/**/__tests__/*.js']).forEach(file => require(file))
