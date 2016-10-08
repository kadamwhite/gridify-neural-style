'use strict';
/*
Relevant resources:

http://imagemagick.org/Usage/crop/#crop_tile
http://imagemagick.org/Usage/crop/#crop_equal
*/
const util = require( './util' );
const { ls, execCommand, execQuietly, execRegardless, runInSequence, log } = util;

// If --help was specified, log help text & exit
util.exitIfHelpRequested();

const config = require( './config' );
const { inputFile, inputFileAbsPath, tilePattern, tilesDir, outputDir } = config;
const { projectRoot, neuralStyleAbsPath } = config;

// Tile output directory helper method
const tile = filename => `${tilesDir}/${filename}`;

// Final output directory helper method
const output = filename => `${outputDir}/${filename}`;

// Neural Style working directory helper method
const nsDir = filename => `${neuralStyleAbsPath}/${filename}`;

// Move a file to the neural style directory
const copyFileToNeuralStyleDir = file => execQuietly( `mv ${tile(file)} ${nsDir(file)}` );

// Copy a file from the neural style directory back to its source tile
const copyResultBackToTilesDir = file => execQuietly( `cp ${nsDir(file)} ${tile(file)}` );

// Empty & recreate the tiles & final output directories
Promise.all([
  console.log( `Emptying temporary directories...\n` ),
  execQuietly( `rm -rf ${outputDir}` ).then( () => execQuietly( `mkdir ${outputDir}` ) ),
  execQuietly( `rm -rf ${tilesDir}` ).then( () => execQuietly( `mkdir ${tilesDir}` ) )
])
  .then( log( `\nBreaking input image ${inputFile} into tiles...` ) )
  // Run our imagemagick command to tile the image
  .then( () => execCommand( `convert ${inputFileAbsPath} +gravity -crop 320x320 ${tile(tilePattern)}` ) )
  // Change to neural style directory
  .then( () => process.chdir( neuralStyleAbsPath ) )
  // Figure out how many tiles were created to deduce the range for our -layers command input
  .then( log( `\nCounting tiles...` ) )
  .then( () => ls( tilesDir ) )
  .then( files => {
    console.log( `${files.length} tiles generated.` );

    const copyAndProcessFiles = files.map( file => () => {
      return copyFileToNeuralStyleDir( file )
        .then( () => copyResultBackToTilesDir( file ) )
        .then( () => execQuietly( `rm ${nsDir(file)}` ) );
    });

    return runInSequence( copyAndProcessFiles )
      .then( () => process.chdir( projectRoot ) )
      .then( () => files );
  })
  .then( files => {
    // files will have format "tiles_0.png" through "tiles_nnn.png"
    const range = `[0-${files.length-1}]`;

    // Reassemble the image
    console.log( `Re-assembling image...\n` );
    return execCommand( `convert ${tile(tilePattern + range)} -background none -layers merge ${output('output.png')}` );
  })
  .then( log( `\nFinal image saved to output/output.png` ) )
  .catch( err => console.error( err ) );
