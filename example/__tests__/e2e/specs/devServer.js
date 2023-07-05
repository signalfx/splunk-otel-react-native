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

import express from 'express';

const app = express();

// add json middleware
app.use(express.json());

// addd /api endpoint
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from server!' });
  //respond with status code 201 and empty body
  res.status(201).end();
});

// start server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
