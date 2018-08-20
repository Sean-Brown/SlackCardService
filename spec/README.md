To run the tests:
  
  * create .env files under the spec/ and spec/db/postgres/integration directories, these .env files need to contain:
    ```
    DB_HOST     (e.g. DB_HOST=localhost)
    DB_PORT     (e.g. DB_PORT=5432)
    DB_NAME       (e.g. DB_NAME=slackcardservice)
    DB_USER     (e.g. DB_USER=postgres)
    DB_PASS     (e.g. DB_PASS=password)      
    ST_JOIN     (e.g. ST_JOIN_GAME=abcd123)
    ST_DESCRIBE (e.g. ST_DESCRIBE=abcd123)
    ST_RESET    (e.g. ST_RESET_GAME=abcd123)
    ST_BEGIN    (e.g. ST_BEGIN_GAME=abcd123)
    ST_SHOW     (e.g. ST_SHOW_HAND=abcd123)
    ST_PLAY     (e.g. ST_PLAY_CARD=abcd123)
    ST_THROW    (e.g. ST_THROW_CARD=abcd123)
    ST_GO       (e.g. ST_GO=abcd123)      

## Setting up tests in WebStorm
Here are my WebStorm test runner configurations:

### Node.js integration tests
![Node.js integration tests][node_app_tests]

### Basic unit tests for the service
![Basic unit tests for the service][service_tests]

### Postgres database unit tests
![Postgres database unit tests][DB_NAME_unit_tests]

### Generic database unit tests
![Generic database unit tests][db_unit_tests]

### Postgres database integration tests
![Postgres database integration tests][DB_NAME_integration_tests]

### All tests (using the Multirun plugin)
**Note the delay of 1 second in between, this will prevent the integration
tests from stepping on each others feet because the integration tests
setup and destroy the database schemas. If you notice the integration tests
failing, then try increasing the delay time**

![All tests][all_tests]

### Alternatively
  * open a command pompt
  * cd to the root of the SlackCardService project
  * run "npm test"


[node_app_tests]: img/node_app_tests.png
[service_tests]: img/service_tests.png
[DB_NAME_unit_tests]: img/DB_NAME_unit_tests.png
[db_unit_tests]: img/db_unit_tests.png
[DB_NAME_integration_tests]: img/DB_NAME_integration_tests.png
[all_tests]: img/all_tests.png

