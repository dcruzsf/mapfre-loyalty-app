// main.js - Interactividad para Mapfre Te Cuidamos

document.addEventListener('DOMContentLoaded', function() {
  // Configurar barras de progreso (Niveles de fidelidad)
  const progressBars = document.querySelectorAll('[data-width]');
  progressBars.forEach(bar => {
    const width = bar.getAttribute('data-width');
    if (width) {
      bar.style.width = width + '%';
      // Color institucional Mapfre para la carga
      bar.style.backgroundColor = '#D31411';
    }
  });

  // Manejo de pestañas (Dashboard de Cliente)
  const tabs = document.querySelectorAll('.tab');
  if (tabs.length > 0) {
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const target = this.getAttribute('data-target');
        
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        
        this.classList.add('active');
        // El estilo active ahora se controla desde CSS con el borde rojo inferior
        document.getElementById(target).style.display = 'block';
      });
    });
  }
  
  // Notificaciones Mapfre Te Cuidamos
  const showNotification = (title, message, points = null) => {
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    // Icono de trébol por defecto para Mapfre
    const icon = points !== null ? '🍀' : '🔔';
    
    let content = `
      <div class="notification-title">${icon} ${title}</div>
      <div class="notification-body">${message}</div>
    `;
    
    if (points !== null) {
      content += `<div class="notification-points">${points > 0 ? '+' : ''}${points} tréboles</div>`;
    }
    
    notification.innerHTML = content;
    document.body.appendChild(notification);
    
    notification.offsetHeight;
    notification.classList.add('show');

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) document.body.removeChild(notification);
      }, 300);
    }, 3500); // Un poco más de tiempo para leer mensajes de confianza
  };
  
  // Manejar formularios de contratación y canje
  const handleFormLoading = (forms) => {
    forms.forEach(form => {
      form.addEventListener('submit', function() {
        const button = this.querySelector('button[type="submit"]');
        if (button) {
          button.disabled = true;
          button.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Procesando...';
          button.style.backgroundColor = '#666'; // Color neutro durante carga
        }
      });
    });
  };

  handleFormLoading(document.querySelectorAll('.purchase-form, .redeem-form'));
  
  // Efecto hover profesional (menos agresivo que el estilo "gaming")
  const cards = document.querySelectorAll('.product-card, .reward-card, .achievement-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-3px)';
      card.style.borderColor = '#D31411';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.borderColor = '';
    });
  });
  
  // Mensajes de éxito basados en URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('message')) {
    showNotification('Gestión Completada', urlParams.get('message'), urlParams.get('points') ? parseInt(urlParams.get('points')) : null);
  }
  
  // Desbloqueo de Hitos (Achievements)
  if (urlParams.get('newAchievement') === 'true') {
    showNotification('¡NUEVO HITO ALCANZADO!', urlParams.get('achievementName'), urlParams.get('achievementPoints') ? parseInt(urlParams.get('achievementPoints')) : null);
  }

  // Botón de autorelleno mágico (Actualizado para Mapfre Demo)
  const autofillBtn = document.getElementById('autofillBtn');
  if (autofillBtn) {
    const nombres = ['Ricardo', 'Beatriz', 'Ignacio', 'Margarita', 'Fernando', 'Paula', 'Alberto', 'Teresa'];
    const apellidos = ['Sanz', 'Vila', 'Heredia', 'Blanco', 'Pascual', 'Domínguez', 'Mora', 'Reyes'];

    autofillBtn.addEventListener('click', function() {
      const nombre = nombres[Math.floor(Math.random() * nombres.length)];
      const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
      const nombreCompleto = `${nombre} ${apellido}`;

      const cleanEmail = (nombre + apellido).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const email = `mapfre.demo+${cleanEmail}@salesforce.com`;

      document.getElementById('name').value = nombreCompleto;
      document.getElementById('email').value = email;

      // Marcar intereses de seguros (Auto, Hogar, Salud)
      const checkboxes = document.querySelectorAll('input[name="preferences"]');
      checkboxes.forEach((cb, i) => cb.checked = i < 2); // Activa los dos primeros por defecto

      // Animación estilo Mapfre (Azul -> Gris)
      this.innerHTML = '✨ Perfil Generado';
      this.style.backgroundColor = '#00519E';
      this.style.color = '#FFFFFF';
      
      setTimeout(() => {
        this.innerHTML = '<i class="fas fa-magic"></i> Rellenar Datos de Cliente';
        this.style.backgroundColor = '';
        this.style.color = '';
      }, 2000);
    });
  }
});