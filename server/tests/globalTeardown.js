'use strict';

module.exports = async () => {
  const instance = global.__QUIZSPHERE_MONGOD__;
  if (!instance) return;
  await instance.stop();
  global.__QUIZSPHERE_MONGOD__ = undefined;
  console.log('\n[test] in-memory MongoDB stopped');
};
