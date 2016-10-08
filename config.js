'use strict';

const path = require( 'path' );

// Change this to point to where you have torch installed, relative to your
// home directory
const torchPath = '~/torch';

// Change this to point to where you have the neural-style repo cloned, relative
// to your home directory
const neuralStylePath = '~/torch/neural-style';

// Read in the name of a file to split & process from the command line,
// specified with `--file filename`. Use algo14 as a "sensible default"
// because it is amazing.
const fileName = process.argv.filter( ( arg, idx ) => {
  return '--file' === process.argv[ idx - 1 ];
})[ 0 ] || 'algorithm14.png';

const absPathFromHomeRelative = pathStr => path.join( process.env.HOME, pathStr.replace( /^~\//, '' ) );

module.exports = {
  // Source file information
  inputFile: fileName,
  inputFileAbsPath: path.resolve( __dirname, fileName ),

  // Working directories within this project
  projectRoot: __dirname,
  tilesDir: path.join( __dirname, 'tiles' ),
  outputDir: path.join( __dirname, 'output' ),

  // Working file name format
  tilePattern: 'tiles_%d.png',

  // Torch location information
  torchPath: torchPath,
  torchAbsPath: absPathFromHomeRelative( torchPath ),
  neuralStylePath: neuralStylePath,
  neuralStyleAbsPath: absPathFromHomeRelative( neuralStylePath )
};

Object.freeze( module.exports );
