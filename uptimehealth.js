const axios = require('axios');


axios.get('https://jsonplaceholder.typicode.com/todos/1')
  .then(response => {
    console.log('Axios Test Response:', response.data); 
  })
  .catch(error => {
    console.error('Error with Axios test:', error);  
  });

const apiKey = 'api key';  

const url = 'https://api.uptimerobot.com/v2/getMonitors';

const checkUptime = async () => {
  try {
    
    const data = {
      api_key: apiKey,
      format: 'json',
    };

    
    const response = await axios.post(url, data);
    
    
    console.log('Full Response:', response.data);

    
    if (response.status === 200) {
      const monitors = response.data.monitors;
      if (monitors && monitors.length > 0) {
        monitors.forEach(monitor => {
          console.log(`Monitor Name: ${monitor.friendly_name}, Status: ${monitor.status}`);
        });
      } else {
        console.log('No monitors found or response format is unexpected');
      }
    } else {
      console.log(`Failed to fetch data: ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};


checkUptime();
