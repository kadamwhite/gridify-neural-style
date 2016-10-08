'use strict';

const exec = require( 'child_process' ).exec;
const fs = require( 'fs' );

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


const execRegardless = command => {
  return execCommand( command ).catch( err => console.log( err ) );
};

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

module.exports = {
  ls,
  execCommand,
  execRegardless,
  runInSequence
};
