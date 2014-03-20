
# SmartBull Insights

## General

In finance, holding is a record of an investor (usually an big institution, eg Menora) that holds a certain security (AKA fund), eg facebook stock.

Insights is a platform that gathers data from all institutional holdings in Israel, digest it and provide a rich UI to query and learn from
As of today it gathers its data from smart google spreadsheet where all reported holdings are copied to manually, and enrich each holding with metadata using lookup and macroes

Down the road some or all this data gathering and enriching and will be automated.    

Project include a node/express server and a reactjs client in the same repository.
DB is mongodb 3.6
Server and server workers are communicating using rabbit-mq 

Server is quite slim - 
 1. Reads the data from google spreadsheets (preferrably using a worker), cache it in db and serve it upon request.
 1. Handles authentication (JWT) and authorization
 1. Provide admin API   
 
 
## Project Structure
Server is at root folder, client is at /client

### Server
server.js - main file

 - backend - home of all server logic
  - models - data models
   - foreign_holdings - manages reading holding of foreign securities from google and initially digesting it 
   - gov_holdings - manages reading of gov stats from google and initially digesting it  
   - user - db model of users
  - routers - express API routers (All json based) 
   - login - users login
   - users - admin users management
   - research - get holdings data api
   - admin - admin misc
   - settings - placeholder, not used now
  - utils - varius services
   - auth - auth helper class
   - ampq_conn - rabbit mq
   - gg_sheets - google spreadsheets api wrapper
  - workers 
   - workers_registry - infrastructure class
   - migrations worker - worker that does migration, eg refreshing data from google spreadsheets    
 - test - server tests (Mocha)
   
### Client
Main packages:
 - react 16.3
 - react router 4
 - lodash
 - bootstrap
 - highcharts
 - zippy data grid
 - react-select (v1)
 
Folders:
 - public
 - src (inspired by [this](https://medium.com/@alexmngn/how-to-better-organize-your-react-applications-2fd3ea1920f1))
  - scenes - main pages. when page is splitted to varius components and/or services it should hold it inside unless shared with other scenes (which in that case, that logic should be on src/ components|services)
  - components - shared components
  - models 
    - foreign_holdings - manages digesting of holding of foreign securities  
    - gov_holdings - manages digesting of gov stats   
  - services - shared utils

## Setup

### installing
Need to run `npm i` for both server and client.
For client to be able to install the zippy data grid component, the following needs to be defined:
 1. env ZIPPY_NPM_PW should be defined.
 1. `npm login --registry=https://registry.zippytech.io --scope=@zippytech` (creds are provided from .npmrc)
 1. `npm whoami --registry=https://registry.zippytech.io` should return "smartbull.co.il"

### Running
#### Prerequisites:
 1. proper node version, preferrably using nvm (to support changing node versions easily)
 1. mongodb 3.6
 1. rabbit-mq 3.6.14
 
#### Launching 
Make sure you have `ggServiceAccountKey` defined, preferrably at OS level. 
Run server and worker. There are helper scripts for *nix `run_nodemon.sh` and `run_nodemon_worker.sh` using nodemon for auto reloading.

Client is `create-react-app` based.
Run the dev client server by running `npm start` from root/client

The server creates the first admin user upon startup if it does not exist. check `server.js`. Look for `ADMIN_USER`. 
For now, All users within smartbull domain are considered admin.

Login using that user. First load should get data from google spreadsheets (could take a minute or two)                                                                                          
To refresh the data, see /admin/misc (worker must be running)



 
## Conventions
 - CSS in js
 - no index.js - use real names
 - Always export {something}, No expert default
