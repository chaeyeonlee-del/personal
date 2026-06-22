function fetchThenEvalAsync(url) {
  return Promise.reject(
    new Error(`Split bundle loading is disabled for Apps in Toss review: ${url}`)
  );
}

module.exports = { fetchThenEvalAsync };
