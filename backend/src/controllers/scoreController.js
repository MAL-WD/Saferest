const SecurityScore = require('../models/SecurityScore');

const listScores = async (req, res, next) => {
  try {
    const latestByDomain = await SecurityScore.aggregate([
      { $match: { user: req.user._id } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$domain',
          doc: { $first: '$$ROOT' },
        },
      },
    ]);
    const scores = latestByDomain.map((x) => x.doc);
    res.json({ success: true, scores });
  } catch (e) {
    next(e);
  }
};

const historyForDomain = async (req, res, next) => {
  try {
    const domain = String(req.params.domain || '')
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .split('/')[0];
    const rows = await SecurityScore.find({ user: req.user._id, domain })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ success: true, history: rows });
  } catch (e) {
    next(e);
  }
};

module.exports = { listScores, historyForDomain };
