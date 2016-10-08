/*
Relevant resources:

http://imagemagick.org/Usage/crop/#crop_tile
http://imagemagick.org/Usage/crop/#crop_equal
*/
var path = require( 'path' );

var util = require( './util' );
const { ls, execCommand, execRegardless, runInSequence } = util;

const config = require( './config' );
const { inputFile, tilePattern, tilesDir, outputDir } = config;

// Tile output directory helper method
const tile = filename => `${tilesDir}/${filename}`;

// Final output directory helper method
const output = filename => `${outputDir}/${filename}`;

// Empty & recreate the tiles & final output directories
Promise.all([
  execCommand( `rm -rf ${outputDir}` ).then( () => execCommand( `mkdir ${outputDir}` ) ),
  execCommand( `rm -rf ${tilesDir}` ).then( () => execCommand( `mkdir ${tilesDir}` ) )
])
  // Run our imagemagick command to tile the image
  .then( () => execCommand( `convert ${inputFile} +gravity -crop 320x320 ${tile(tilePattern)}` ) )
  // Figure out how many tiles were created to deduce the range for our -layers command input
  .then( () => ls( tilesDir ) )
  .then( files => {
    // files will have format "tiles_0.png" through "tiles_nnn.png"
    const range = `[0-${files.length-1}]`;
    // Reassemble the image
    return execCommand( `convert ${tile(tilePattern + range)} -background none -layers merge ${output('output.png')}` );
  })
  .catch( err => console.error( err ) );
