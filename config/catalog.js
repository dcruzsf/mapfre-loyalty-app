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
      journalSubTypeId: '0lSJ70000008OMNMA2' // ID de ejemplo de tu SF
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
    },
    {
      id: 'amazon_gift',
      title: 'Cheque Amazon',
      description: 'Canjea tus Tréboles por saldo para tus compras en Amazon.es.',
      points: 100,
      image: '/img/experiencia4.png',
      icon: 'gift',
      journalType: 'Redemption',
      journalSubType: 'Tarjeta Amazon'
    },
    {
      id: 'fuel_card',
      title: 'Tarjeta Combustible',
      description: 'Consigue descuentos directos al repostar en gasolineras Repsol y asociadas.',
      points: 50,
      image: '/img/descuento1.png',
      icon: 'gas-pump',
      journalType: 'Redemption',
      journalSubType: 'Vale Combustible'
    },
    {
      id: 'avios',
      title: 'Avios Iberia',
      description: 'Canjea tus Tréboles por Avios y vuela más cerca de tu próximo destino con Iberia.',
      points: 500,
      image: '/img/experiencia1.png',
      icon: 'plane',
      journalType: 'Redemption',
      journalSubType: 'Uso Avios'
    }
  ]
};