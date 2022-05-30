import NodeCache from 'node-cache';

let cache = null;

// eslint-disable-next-line consistent-return
export const start = (done) => {
  if (cache) return done();

  cache = new NodeCache();
};

export const instance = () => cache;

export default {
  start,
  instance,
};
