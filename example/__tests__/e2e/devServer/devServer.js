/*
Copyright 2023 Splunk Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/*
Copyright 2023 Splunk Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const express = require('express');
const http = require('http');

function getDevServer(options) {
  if (!options) {
    options = {};
  }
  const port = options.port || 53820;
  const app = express();

  const spans = [];
  function handleSpanRecived(span) {
    console.log('span received', span.name);
    spans.push(span);
  }
  function clearSpans() {
    spans.length = 0;
  }

  function getSpans() {
    return spans;
  }

  function findSpan(filter, ellapsedTime) {
    console.log('ellapsedTime', ellapsedTime);

    ellapsedTime = ellapsedTime || 0;
    if (ellapsedTime > 5000) {
      console.error('Listing recorded spans for your convenience.');
      console.error(spans);
      return undefined;
    }

    const span = spans.find(filter);
    if (span) {
      return span;
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(findSpan(filter, ellapsedTime + 1000));
      }, 1000);
    });
  }

  // add json middleware
  app.use(express.json());

  app.post('/zipkindump', (req, res) => {
    console.log('zipkin dump received');
    req.body.forEach(handleSpanRecived);
    res.json({ message: `Spans received: ${spans.length}` });

    //respond with status code 201 and empty body
    res.status(201).end();
  });

  app.get('/some-data', (req, res) => {
    console.log('Devserver get');
    
    res.send({
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    });
  });

  http.createServer({}, app).listen(port, () => {
    console.log(`Listening... ${port}`);
  });

  return {
    handleSpanRecived,
    clearSpans,
    getSpans,
    findSpan,
  };
}

exports.getDevServer = getDevServer;
