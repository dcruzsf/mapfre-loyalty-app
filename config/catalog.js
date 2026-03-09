// config/catalog.js - Catálogo Adaptado a Club MAPFRE (Partners Reales)
module.exports = {
  
  // --- GANAR TRÉBOLES (ACCRUAL) ---
  accrual: [
    {
      id: 'eci',
      title: 'Compra en El Corte Inglés',
      description: 'Obtén tréboles por tus compras en moda, tecnología y hogar en centros asociados.',
      points: 15,
      image: '/img/compra1.png', 
      icon: 'shopping-bag',
      journalType: 'Accrual',
      journalSubType: 'Compra en El Corte Inglés',
      journalSubTypeId: '0lS7Q000000srPgUAI' // ID de ejemplo de tu SF
    },
    {
      id: 'amazon_accrual',
      title: 'Compra en Amazon',
      description: 'Tus compras online ahora te ayudan a reducir el coste de tu próxima póliza.',
      points: 10,
      image: '/img/compra4.png',
      icon: 'amazon',
      journalType: 'Accrual',
      journalSubType: 'Compra en Amazon'
    },
    {
      id: 'repsol_accrual',
      title: 'Repostaje en Repsol',
      description: 'Suma tréboles en cada repostaje de carburante en la red de estaciones Repsol.',
      points: 25,
      image: '/img/compra5.png',
      icon: 'gas-pump',
      journalType: 'Accrual',
      journalSubType: 'Repostaje en Repsol'
    },
    {
      id: 'tarjeta_mapfre',
      title: 'Pago con Tarjeta MAPFRE',
      description: 'Bonificación exclusiva por utilizar tu tarjeta de crédito MAPFRE en cualquier establecimiento.',
      points: 50,
      image: '/img/compra2.png',
      icon: 'credit-card',
      journalType: 'Accrual',
      journalSubType: 'Pago con Tarjeta Mapfre'
    }
  ],

  // --- CANJEAR TRÉBOLES (REDEMPTION) ---
  redemption: [
    {
      id: 'discount_policy',
      title: 'Descuento en Recibo',
      description: 'Usa tus Tréboles para pagar menos en tu próximo recibo de cualquier seguro MAPFRE.',
      points: 20,
      image: '/img/compra3.png',
      icon: 'file-invoice-dollar',
      journalType: 'Redemption',
      journalSubType: 'Purchase' 
    }
  ]
};