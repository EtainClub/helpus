//// component to generally create context and provider 

import React, { useReducer } from 'react';

// @param reducer: reducer to update state
// @param actions: actions
// @param defaultValue: initial state
export default (reducer, actions, defaultValue) => {
  // create context with empty argument
  const Context = React.createContext();

  // create Provider
  const Provider = (props) => {
    // use reducer
    const [state, dispatch] = useReducer(reducer, defaultValue);

    // bind actions
    const boundActions = {};
    for (let key in actions) {
      // set the function with dispatch of reducer
      boundActions[key] = actions[key](dispatch);
    }

    return (
      <Context.Provider value={{ state, ...boundActions }}>
        {props.children}
      </Context.Provider>
    );
  }; 

  // return context and provider
  return { Context, Provider };
};
