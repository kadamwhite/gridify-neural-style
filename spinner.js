const Spinner = require( 'cli-spinner' ).Spinner;

let currentSpinner;

const spinner = message => {
  currentSpinner = new Spinner( `${message} %s` );
  currentSpinner.setSpinnerString( 25 );
  currentSpinner.start();
};

const stopSpinner = () => {
  currentSpinner.stop( true );
};

spinner( 'foo' );

setTimeout( () => {
  stopSpinner();
  spinner( 'bar' );
  setTimeout( () => stopSpinner(), 1000 );
}, 1000 );
