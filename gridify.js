'use strict';

/*
Relevant resources:

http://imagemagick.org/Usage/crop/#crop_tile
http://imagemagick.org/Usage/crop/#crop_equal
*/
const path = require( 'path' );
const gm = require( 'gm' );

const util = require( './util' );

const {
  execCommand,
  execQuietly,
  execRegardless,
  getDimensions,
  hasArg,
  log,
  ls,
  runInSequence,
} = util;

// If --help was specified, log help text & exit
util.exitIfHelpRequested();

const config = require( './config' );

const {
  inputFile,
  inputFileAbsPath,
  styleFileAbsPath,
  maxTileSize,
  neuralStyleAbsPath,
  outputDir,
  projectRoot,
  tilesDir,
} = config;

// Tile output directory helper method
const tile = filename => `${tilesDir}/${filename}`;

// Final output directory helper method
const output = filename => `${outputDir}/${filename}`;

// Neural Style working directory helper method
const nsDir = filename => `${neuralStyleAbsPath}/${filename}`;

let tileSize;
let columns;

// Working file name format
const tilePattern = 'tiles_%d.png';
const numFromTile = tileName => parseInt( tileName.match( /\d+/ ), 10 );

const verbose = hasArg( '--verbose' );

const positionFromTile = tileName => {
  const tile = numFromTile( tileName );
  const col = tile % columns;
  const row = Math.floor( tile / columns );
  return `+${col * tileSize}+${row * tileSize}`;
};

const reassemble = ( files, outputFile ) => new Promise( ( resolve, reject ) => {
  // gm()
  //   .in('-page', '+0+0')  // Custom place for each of the images
  //   .in('a.jpg')
  //   ...
  const addTile = ( gmChain, file ) => gmChain
    .in( '-page', positionFromTile( file ) )
    .in( tile( file ) );

  files
    .reduce( addTile, gm() )
    // .minify()  // Halves the size, 512x512 -> 256x256
    .mosaic()  // Merge images as a matrix
    .write( outputFile, err => (
      err ? reject( err ) : resolve()
    ) );
});

// Empty & recreate the tiles & final output directories
Promise.all([
  console.log( `Emptying temporary directories...\n` ),
  execQuietly( `rm -rf ${outputDir}` ).then( () => execQuietly( `mkdir ${outputDir}` ) ),
  execQuietly( `rm -rf ${tilesDir}` ).then( () => execQuietly( `mkdir ${tilesDir}` ) ),
])
  .then( log( `\nCalculating optimal tile dimensions...` ) )
  .then( () => getDimensions( inputFileAbsPath ) )
  .then( dimensions => {
    const { width, height } = dimensions;
    const maxTilesFor = size => Math.round( size / ( Math.floor( size / maxTileSize ) + 1 ) );
    tileSize = width % maxTileSize > height % maxTileSize ?
      maxTilesFor( width ) :
      maxTilesFor( height );
    columns = Math.ceil( width / tileSize );
  })
  .then( () => console.log( `Rendering tiles of ${tileSize}x${tileSize}px in ${columns} columns` ) )
  .then( log( `\nBreaking input image ${inputFile} into tiles...` ) )
  // Run our imagemagick command to tile the image
  .then( () => execCommand( `convert ${inputFileAbsPath} +gravity -crop ${tileSize}x${tileSize} ${tile( tilePattern )}` ) )
  // Change to neural style directory
  .then( () => process.chdir( neuralStyleAbsPath ) )
  // Figure out how many tiles were created to deduce the range for our -layers command input
  .then( log( `\nCounting tiles...` ) )
  .then( () => ls( tilesDir ) )
  .then( files => files.sort( ( a, b ) => numFromTile( a ) - numFromTile( b ) ) )
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

      return execRegardless( `rm ${nsDir( '*.png' )}`, true )
        .then( log( `\nProcessing file ${file}...` ) )
        // Copy file to Neural Style directory
        .then( () => exec( `mv ${tile( file )} ${nsDir( file )}` ) )
        // Run neural style
        .then( () => exec([
          `th neural_style.lua`,
          `-style_image ${styleFileAbsPath},${nsDir( file )}`,
          `-style_blend_weights 7,2`,
          `-content_image ${nsDir( file )}`,
          `-original_colors 1`,
          `-backend cudnn`,
          `-image_size ${tileSize}`,
          hasArg( '--fast' ) ? `-num_iterations 5` : '',
          hasArg( '--half' ) ? `-num_iterations 500` : '-num_iterations 1500',
          hasArg( '--no-gpu' ) ? `-gpu -1` : '',
        ].join( ' ' ) ) )
        // Copy output file back
        .then( () => exec( `cp ${nsDir( 'out.png' )} ${tile( file )}` ) )
        .then( () => exec( `rm ${nsDir( file )}` ) )
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
    // const range = `[0-${files.length-1}]`;

    // Reassemble the image
    console.log( `\nRe-assembling image...\n` );
    return reassemble( files, output( 'output.png' ) );
    // return execCommand( `convert ${tile(tilePattern + range)} -background none -layers merge ${output('output.png')}` );
  })
  .then( log( `\nFinal image saved to output/output.png` ) )
  .catch( err => console.error( err ) );
