'use strict';
/*
Relevant resources:

http://imagemagick.org/Usage/crop/#crop_tile
http://imagemagick.org/Usage/crop/#crop_equal
*/
const path = require( 'path' );
const util = require( './util' );
const {
  execCommand,
  execQuietly,
  execRegardless,
  getDimensions,
  hasArg,
  log,
  ls,
  runInSequence
} = util;

// If --help was specified, log help text & exit
util.exitIfHelpRequested();

const config = require( './config' );
const {
  inputFile,
  inputFileAbsPath,
  maxTileSize,
  neuralStyleAbsPath,
  outputDir,
  projectRoot,
  tilePattern,
  tilesDir
} = config;

// Tile output directory helper method
const tile = filename => `${tilesDir}/${filename}`;

// Final output directory helper method
const output = filename => `${outputDir}/${filename}`;

// Neural Style working directory helper method
const nsDir = filename => `${neuralStyleAbsPath}/${filename}`;

let tileSize;

const verbose = hasArg( '--verbose' );

// Empty & recreate the tiles & final output directories
Promise.all([
  console.log( `Emptying temporary directories...\n` ),
  execQuietly( `rm -rf ${outputDir}` ).then( () => execQuietly( `mkdir ${outputDir}` ) ),
  execQuietly( `rm -rf ${tilesDir}` ).then( () => execQuietly( `mkdir ${tilesDir}` ) )
])
  .then( log( `\nCalculating optimal tile dimensions...` ) )
  .then( () => getDimensions( inputFileAbsPath ) )
  .then( dimensions => {
    console.log( dimensions );
    const maxTilesFor = size => Math.round( size / ( Math.floor( size / maxTileSize ) + 1 ) );
    tileSize = dimensions.width % maxTileSize > dimensions.height % maxTileSize ?
      maxTilesFor( dimensions.width ) :
      maxTilesFor( dimensions.height );
  })
  .then( () => console.log( `${tileSize}x${tileSize}px` ) )
  .then( log( `\nBreaking input image ${inputFile} into tiles...` ) )
  // Run our imagemagick command to tile the image
  .then( () => execCommand( `convert ${inputFileAbsPath} +gravity -crop ${tileSize}x${tileSize} ${tile(tilePattern)}` ) )
  // Change to neural style directory
  .then( () => process.chdir( neuralStyleAbsPath ) )
  // Figure out how many tiles were created to deduce the range for our -layers command input
  .then( log( `\nCounting tiles...` ) )
  .then( () => ls( tilesDir ) )
  .then( files => {
    console.log( `${files.length} tiles generated.\n` );

    if ( hasArg( '--skip-nn' ) ) {
      return files;
    }

    const filesToConvert = [].concat( files );
    if ( hasArg( '--fast' ) ) {
      filesToConvert.length = 3;
    }
    const copyAndProcessFiles = filesToConvert.map( file => () => {
      const tileOutputDir = path.join( tilesDir, file.replace( /\.[\w\d]+$/, '' ) );

      const exec = verbose ? execCommand : execQuietly;

      return execRegardless( `rm ${nsDir('*.png')}`, true )
        .then( log( `Processing file ${file}...` ) )
        // Copy file to Neural Style directory
        .then( () => exec( `mv ${tile(file)} ${nsDir(file)}` ) )
        // Run neural style
        .then( () => exec([
          `th neural_style.lua`,
          `-style_image ${inputFileAbsPath}`,
          `-content_image ${nsDir(file)}`,
          `-image_size ${tileSize}`,
          hasArg( '--fast' ) ? `-num_iterations 5` : '',
          hasArg( '--no-gpu' ) ? `-gpu -1` : ''
        ].join( ' ' ) ) )
        // Copy output file back
        .then( () => exec( `cp ${nsDir('out.png')} ${tile(file)}` ) )
        .then( () => exec( `rm ${nsDir(file)}` ) )
        // Save intermediate steps
        .then( () => exec( `mkdir ${tileOutputDir}` ) )
        .then( () => exec( `mv *.png ${tileOutputDir}/` ) );
    });

    return runInSequence( copyAndProcessFiles )
      .then( () => process.chdir( projectRoot ) )
      .then( () => files );
  })
  .then( files => {
    // files will have format "tiles_0.png" through "tiles_nnn.png"
    const range = `[0-${files.length-1}]`;

    // Reassemble the image
    console.log( `\nRe-assembling image...\n` );
    return execCommand( `convert ${tile(tilePattern + range)} -background none -layers merge ${output('output.png')}` );
  })
  .then( log( `\nFinal image saved to output/output.png` ) )
  .catch( err => console.error( err ) );
