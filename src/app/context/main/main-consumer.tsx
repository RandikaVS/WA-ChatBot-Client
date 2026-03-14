
import PropTypes from 'prop-types';


import { MainContext } from './main-context';

// ----------------------------------------------------------------------

export function MainConsumer({ children }: { children: React.ReactNode }) {
  return (
    <MainContext.Consumer>
      {(auth:any) => (auth?.loading ? <div>Loading...</div> : children)}
    </MainContext.Consumer>
  );
}

MainConsumer.propTypes = {
  children: PropTypes.node,
};
