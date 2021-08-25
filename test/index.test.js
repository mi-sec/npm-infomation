/** ****************************************************************************************************
 * File: index.test.js
 * Project: template-npm-module
 * @author Nick Soggin <iSkore@users.noreply.github.com> on 17-Nov-2019
 *******************************************************************************************************/
'use strict';

const
    chai   = require( 'chai' ),
    expect = chai.expect,
    test   = require( '../index' );

describe( 'template-npm-module', () => {
    it( 'should say "hello world"', () => {
        expect( test ).to.eq( 'hello world' );
    } );
} );
