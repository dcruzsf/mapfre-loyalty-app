router.get('/', async (req, res) => {
  const message = req.query.message;
  let member = req.member;

  // Sincronización con Salesforce
  if (member && member.salesforceId && process.env.USE_SALESFORCE === 'true') {
    try {
      await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
      Member.save(member);
    } catch (err) {
      console.warn('⚠️ Error sincronía:', err.message);
    }
  }

  res.render('index', {
    member: member || null,
    message: message || null,
    // ESTRUCTURA COMPLETA PARA EVITAR ERRORES DE 'UNDEFINED'
    brand: {
      name: 'Club MAPFRE',
      fullName: 'Club MAPFRE',
      images: {
        favicon: '/img/favicon.ico',
        logo: '/img/logo.png'
      },
      colors: {
        primary: '#d81e05',
        secondary: '#333333',
        accent: '#a31604',
        lightGray: '#f4f4f4'
      },
      messages: { tagline: 'Tu confianza siempre tiene recompensa' }
    },
    t: req.t,
    locale: req.locale || 'es'
  });
});