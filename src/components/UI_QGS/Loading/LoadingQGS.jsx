import React from 'react';
import PropTypes from 'prop-types';
import Spinner from '../../UI/Spinner/Spinner';
import './LoadingQGS.css';

const LoadingQGS = ({ }) => {
  return (
  <div className="loading-qgs">
    <Spinner />
  </div>
  );
};

LoadingQGS.propTypes = {

};

export default LoadingQGS;