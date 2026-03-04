// config/catalog.js - Catálogo Adaptado a Mapfre (Respetando nombres de imágenes originales)
module.exports = {
  
  // --- GANAR TRÉBOLES (ACCRUAL) ---
  accrual: [
    {
      id: 'prod_auto',
      title: 'Seguro de Coche',
      description: 'Contrata o renueva tu póliza de auto con las mejores coberturas y suma Tréboles.',
      points: 50,
      image: '/img/compra1.png', // Imagen original mantenida
      icon: 'car',
      journalType: 'Accrual',
      journalSubType: 'Compra con tarjeta', // Mantenido para match con SF
      journalSubTypeId: '0lSJ70000008OMNMA2'
    },
    {
      id: 'prod_home',
      title: 'Seguro de Hogar',
      description: 'Protege tu casa frente a cualquier imprevisto y ahorra en tu próxima renovación.',
      points: 30,
      image: '/img/compra4.png', // Imagen original mantenida
      icon: 'home',
      journalType: 'Accrual',
      journalSubType: 'Alta Seguro Hogar'
    },
    {
      id: 'prod_health',
      title: 'Seguro de Salud',
      description: 'Tu bienestar y el de tu familia es lo primero. Súmate a Salud Mapfre.',
      points: 40,
      image: '/img/compra5.png', // Imagen original mantenida
      icon: 'heartbeat',
      journalType: 'Accrual',
      journalSubType: 'Alta Seguro Salud'
    },
    {
      id: 'health_check',
      title: 'Revisión Médica Anual',
      description: 'Completar tu chequeo anual te ayuda a prevenir y te regala Tréboles.',
      points: 15,
      image: '/img/compra2.png', // Imagen original mantenida
      icon: 'user-md',
      journalType: 'Accrual',
      journalSubType: 'Actividad Prevencion'
    }
  ],

  // --- CANJEAR TRÉBOLES (REDEMPTION) ---
  redemption: [
    {
      id: 'discount_policy',
      title: 'Descuento en Recibo',
      description: 'Usa tus Tréboles para pagar menos en tu próximo recibo de cualquier seguro.',
      points: 20,
      image: '/img/compra3.png', // Imagen original mantenida
      icon: 'file-invoice-dollar',
      journalType: 'Redemption',
      journalSubType: 'Purchase' 
    },
    {
      id: 'amazon_gift',
      title: 'Cheque Amazon',
      description: 'Canjea tus Tréboles por saldo para tus compras en Amazon.es.',
      points: 100,
      image: '/img/experiencia4.png', // Imagen original mantenida
      icon: 'gift',
      journalType: 'Redemption',
      journalSubType: 'Tarjeta Amazon'
    },
    {
      id: 'fuel_card',
      title: 'Tarjeta Combustible',
      description: 'Consigue descuentos directos al repostar en gasolineras asociadas.',
      points: 50,
      image: '/img/descuento1.png', // Imagen original mantenida
      icon: 'gas-pump',
      journalType: 'Redemption',
      journalSubType: 'Vale Combustible'
    },
    {
      id: 'avios',
      title: 'Avios Iberia',
      description: 'Canjea tus Tréboles por Avios y vuela más cerca de tu próximo destino.',
      points: 500,
      image: '/img/experiencia1.png', // Imagen original mantenida
      icon: 'plane',
      journalType: 'Redemption',
      journalSubType: 'Uso Avios'
    },
    {
      id: 'vip_lounge',
      title: 'Sala VIP Aeropuerto',
      description: 'Acceso exclusivo a salas VIP antes de tu vuelo por ser cliente Platino.',
      points: 800,
      image: '/img/experiencia2.png', // Imagen original mantenida
      icon: 'glass-cheers',
      journalType: 'Redemption',
      journalSubType: 'Acceso VIP'
    }
  ]
};