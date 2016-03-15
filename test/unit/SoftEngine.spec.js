'use strict';

import SoftEngine from '../../src/SoftEngine.js';
import chai from 'chai';

let expect = chai.expect;

describe( 'SoftEngine ( unit )', () => {

  describe( 'when instantiated', () => {

    let engine = new SoftEngine();

    it( 'should return an Object', () => {

      expect( engine ).to.be.an( 'object' );

    } );

  } );

} );