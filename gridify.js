'use strict';
/*
Relevant resources:

http://imagemagick.org/Usage/crop/#crop_tile
http://imagemagick.org/Usage/crop/#crop_equal
*/
const util = require( './util' );
const { ls, execCommand, execRegardless, runInSequence, log } = util;

// If --help was specified, log help text & exit
util.exitIfHelpRequested();

const config = require( './config' );
const { inputFile, inputFileAbsPath, tilePattern, tilesDir, outputDir } = config;

// Tile output directory helper method
const tile = filename => `${tilesDir}/${filename}`;

// Final output directory helper method
const output = filename => `${outputDir}/${filename}`;

// Empty & recreate the tiles & final output directories
Promise.all([
  console.log( `Emptying temporary directories...\n` ),
  execCommand( `rm -rf ${outputDir}` ).then( () => execCommand( `mkdir ${outputDir}` ) ),
  execCommand( `rm -rf ${tilesDir}` ).then( () => execCommand( `mkdir ${tilesDir}` ) )
])
  .then( log( `\nBreaking input image ${inputFile} into tiles...` ) )
  // Run our imagemagick command to tile the image
  .then( () => execCommand( `convert ${inputFileAbsPath} +gravity -crop 320x320 ${tile(tilePattern)}` ) )
  // Figure out how many tiles were created to deduce the range for our -layers command input
  .then( log( `\nCounting tiles...` ) )
  .then( () => ls( tilesDir ) )
  .then( files => {
    console.log( `${files.length} tiles generated.` );

    // files will have format "tiles_0.png" through "tiles_nnn.png"
    const range = `[0-${files.length-1}]`;

    // Reassemble the image
    console.log( `Re-assembling image...\n` );
    return execCommand( `convert ${tile(tilePattern + range)} -background none -layers merge ${output('output.png')}` );
  })
  .then( log( `\nFinal image saved to output/output.png` ) )
  .catch( err => console.error( err ) );
