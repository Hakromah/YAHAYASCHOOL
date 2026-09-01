const axios = require('axios');
axios.get('http://localhost:1337/api/content-type-builder/content-types').catch(e => console.log(e.response.status));
