const User = require('../models/User');
const Portfolio = require('../models/Portfolio');

const pread = async(req, res, next) => {
  const pid = req.body.id;
  Portfolio.findById(pid, async function(err, p) {
    if (err) {
      throw new Error();
    }
    if (!p) {
      res.status(400).send("Portfolio not found");
    }
    if (p.canRead(user)) {
      next();
    } else {
      res.status(500).send("Not authorized to access this portfolio");
    }
  })
}

module.exports = pread;