const {clearHash} = require('../services/cache');

module.exports = async (req, res, next) => {
  // waits for next to invoke the next piece of middleware
  // in this case we save our user blog post to the db
  await next();
  // then we clear our cache
  clearHash(req.user.id);

}