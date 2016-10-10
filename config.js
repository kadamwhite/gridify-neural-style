'use strict';

const path = require( 'path' );
const { getArg, hasArg } = require( './util' );

// Change this to point to where you have torch installed, relative to your
// home directory
const torchPath = '~/torch';

// Change this to point to where you have the neural-style repo cloned, relative
// to your home directory
const neuralStylePath = '~/torch/neural-style';

// Read in the name of a file to split & process from the command line,
// specified with `--file filename`. Use algo14 as a "sensible default"
// because it is amazing.
const fileName = getArg( '--file', 'algorithm14.png' );

const styleFileName = getArg( '--style', 'algorithm14.png' );

const absPathFromHomeRelative = pathStr => path.join( process.env.HOME, pathStr.replace( /^~\//, '' ) );

module.exports = {
  // Source file information
  inputFile: fileName,
  inputFileAbsPath: path.resolve( __dirname, fileName ),
  styleFile: styleFileName,
  styleFileAbsPath: path.resolve( __dirname, styleFileName ),

  // Working directories within this project
  projectRoot: __dirname,
  tilesDir: path.join( __dirname, 'tiles' ),
  outputDir: path.join( __dirname, 'output' ),

  // Working file max dimensions
  maxTileSize: 400,

  // Torch location information
  torchPath: torchPath,
  torchAbsPath: absPathFromHomeRelative( torchPath ),
  neuralStylePath: neuralStylePath,
  neuralStyleAbsPath: absPathFromHomeRelative( neuralStylePath )
};

Object.freeze( module.exports );
