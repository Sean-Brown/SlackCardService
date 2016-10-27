# SlackCardService
Service for playing card games

Getting started:
- clone the project locally
- configure the typescript compiler to use the settings defined in the tsconfig.json file
- run "npm install" from the command line to install the node modules
- run "typings install" from the command line to install the typescript definition files

That should be enough to get started, but it's also good to setup the test runners:
- Mocha: configure Mocha to run the tests in the ./spec/Node directory
- Node.js: configure a Node.js test runner to run the tests in the ./spec/SlackCardService directory

To run the tests:
  * open a command pompt
  * cd to the root of the SlackCardService project
  * run "npm test"
This should run all the tests under the "spec" directory

If you get errors, check the test output and make sure that the version of node and npm specified 
that were used when running the tests are the same version as node and npm in package.json under the 
'engines' section

## TODO (make into projects...)
* Add routes for viewing stats (wins/losses, hand history, average points per hand, etc) 
* Write code to check the database when it starts to get full and export the data elsewhere
* Better display at the end of the round -- show the player hands and crib as images
* Better display when points scored (peg color next to a #?)
* Play is allowed to continue even after the game ends...
* Allow multiple games to be played at once (will probably require an ID with each game to be passed in with the request)
* Allow players to forfeit