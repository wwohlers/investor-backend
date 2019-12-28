const User = require('../models/User');
const Portfolio = require('../models/Portfolio');

const pown = async(req, res, next) => {
  const pid = req.body.id;
  Portfolio.findById(pid, async function(err, p) {
    if (err) {
      throw new Error();
    }
    if (!p) {
      res.status(400).send({ error: "Portfolio does not exist" });
    }
    
    if (p.canWrite(req.user)) {
      next();
    } else {
      res.status(401).send({ error: 'Not owner of this portfolio' });
    }
  })
}

module.exports = pown;