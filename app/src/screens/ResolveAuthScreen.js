import React, { useEffect, useContext } from 'react';
import { Context as AuthContext } from '../context/AuthContext';

const ResolveAuthScreen = (props) => {
  console.log('ResolveAuthScreen', props);
  
  const { trySigninWithToken } = useContext(AuthContext);

  useEffect(() => {
    trySigninWithToken();
  }, []);

  return null;
};

export default ResolveAuthScreen;