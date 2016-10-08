'use strict';

const exec = require( 'child_process' ).exec;
const fs = require( 'fs' );
const calipers = require( 'calipers' )( 'png' );

const exitIfHelpRequested = () => {
  if ( process.argv.indexOf( '--help' ) > -1 ) {
    console.log(`
Use this script to convert an image into a set of tiles and run the "neural
algorithm of artistic style" process on each tile, creating a gridded image
of the input file's original resolution with the neural style of the whole
applied to each individual segment.

This script expects torch to be installed in ~/torch, and the neural-style
library for torch to be cloned into ~/torch/neural-style: if you have installed
these tools in alternative locations please update config.js.

Usage:

   node gridify.js --file your-input-file.jpg` );
    process.exit();
  }
};

/**
 * Get the list of files in a directory, either as a list of file and subdir
 * names or a list of absolute file system paths
 *
 * @private
 * @param {string} inputDir The file system path to the directory to read
 * @returns {Promise} A promise to the string array of file names
 */
const ls = ( inputDir, absolute ) => {
  return new Promise( ( resolve, reject ) => {
    fs.readdir( inputDir, ( err, list ) => {
      if ( err ) {
        return reject( err );
      }

      resolve( list );
    });
  });
};

/**
 * Execute a shell command and return a promise that will resolve or exit
 * when that command completes
 *
 * @param {string} command A shell command string e.g. "mv file1 file2"
 * @param {boolean} quiet Whether to suppress outputting the command to be run
 * @returns {Promise} A promise that completes when the command finishes
 */
const execCommand = ( command, quiet ) => {
  return new Promise( ( resolve, reject ) => {
    !quiet && console.log( command );
    exec( command, ( error, stdout, stderr ) => {
      if ( error ) {
        return reject( error );
      }
      resolve();
    });
  });
};

/**
 * Execute a shell command and return a promise that will resolve or exit
 * when that command completes, without showing the command's output
 *
 * @param {string} command A shell command string e.g. "mv file1 file2"
 * @returns {Promise} A promise that completes when the command finishes
 */
const execQuietly = command => execCommand( command, true );

/**
 * Execute the command and ignore errors
 *
 * @param {string} command A shell command string e.g. "mv file1 file2"
 * @returns {Promise} A promise that completes when the command exits
 */
const execRegardless = command => execCommand( command ).catch( err => console.log( err ) );

/**
 * Helper function that takes in an array of functions that return promises,
 * then executes those functions sequentially to execute each action
 *
 * @param {function[]} arrOfFnsReturningPromises An array of functions
 * @returns {Promise} A promise that will resolve once all the promises
 * returned by that function successfully complete
 */
const runInSequence = arrOfFnsReturningPromises => {
  return arrOfFnsReturningPromises.reduce(
    ( lastStep, startNextStep ) => lastStep.then( startNextStep ),
    Promise.resolve()
  );
};

const getDimensions = filePath => calipers
  .measure( filePath )
  .then( result => result.pages[ 0 ] );

const log = message => () => console.log( `${message}\n` );

module.exports = {
  exitIfHelpRequested,
  ls,
  execCommand,
  execQuietly,
  execRegardless,
  runInSequence,
  getDimensions,
  log
};
