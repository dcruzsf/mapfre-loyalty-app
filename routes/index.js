const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { getCurrentMember } = require('../middleware/auth');
const salesforceLoyalty = require('../modules/salesforceLoyalty');

router.use(getCurrentMember);

router.get('/', async (req, res) => {
  const message = req.query.message;
  let member = req.member;

  if (member && member.salesforceId && process.env.USE_SALESFORCE === 'true') {
    try {
      await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
      Member.save(member);
    } catch (err) {
      console.warn('⚠️ Club MAPFRE Sync Error:', err.message);
    }
  }

  res.render('index', {
    member: member || null,
    message: message || null,
    currentPage: 'home',
    t: req.t,
    locale: req.locale || 'es',
    // ESTA ES LA ESTRUCTURA QUE TU HEADER NECESITA
    brand: {
      fullName: 'Club MAPFRE',
      images: { favicon: '/img/favicon.ico' },
      colors: {
        primary: '#d81e05',
        secondary: '#333333',
        accent: '#a31604',
        lightGray: '#f4f4f4',
        midGray: '#999999',
        darkGray: '#444444',
        textColor: '#333333',
        textLight: '#777777',
        backgroundColor: '#ffffff',
        cardBackground: '#ffffff',
        borderColor: '#dddddd',
        successColor: '#28a745',
        errorColor: '#dc3545',
        notificationColor: '#d81e05',
        tierColors: {
          bronze: '#CD7F32',
          silver: '#C0C0C0',
          gold: '#FFD700',
          platinum: '#E5E4E2'
        }
      }
    }
  });
});

module.exports = router;