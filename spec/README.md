## Setting up tests in WebStorm
Here are my WebStorm test runner configurations:

### Node.js integration tests
![Node.js integration tests][node_app_tests]

### Basic unit tests for the service
![Basic unit tests for the service][service_tests]

### Postgres database unit tests
![Postgres database unit tests][pg_db_unit_tests]

### Generic database unit tests
![Generic database unit tests][db_unit_tests]

### Postgres database integration tests
![Postgres database integration tests][pg_db_integration_tests]

### All tests (using the Multirun plugin)
**Note the delay of 1 second in between, this will prevent the integration
tests from stepping on each others feet because the integration tests
setup and destroy the database schemas. If you notice the integration tests
failing, then try increasing the delay time**

![All tests][all_tests]

[node_app_tests]: img/node_app_tests.png
[service_tests]: img/service_tests.png
[pg_db_unit_tests]: img/pg_db_unit_tests.png
[db_unit_tests]: img/db_unit_tests.png
[pg_db_integration_tests]: img/pg_db_integration_tests.png
[all_tests]: img/all_tests.png

