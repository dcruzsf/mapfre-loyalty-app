// main.js - Interactividad para la aplicación loyalty-demo-interactive

document.addEventListener('DOMContentLoaded', function() {
  // Configurar todos los elementos con data-width (barras de progreso)
  const progressBars = document.querySelectorAll('[data-width]');
  progressBars.forEach(bar => {
    const width = bar.getAttribute('data-width');
    if (width) {
      bar.style.width = width + '%';
    }
  });

  // Manejo de pestañas
  const tabs = document.querySelectorAll('.tab');
  if (tabs.length > 0) {
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Obtener el contenido de la pestaña
        const target = this.getAttribute('data-target');
        
        // Desactivar todas las pestañas y contenidos
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        
        // Activar la pestaña seleccionada y su contenido
        this.classList.add('active');
        document.getElementById(target).style.display = 'block';
      });
    });
  }
  
  // Mostrar notificaciones
  const showNotification = (title, message, points = null) => {
    // Crear el elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    let content = `
      <div class="notification-title">${title}</div>
      <div class="notification-body">${message}</div>
    `;
    
    if (points !== null) {
      content += `<div class="notification-points">${points > 0 ? '+' : ''}${points} puntos</div>`;
    }
    
    notification.innerHTML = content;
    
    // Añadir al cuerpo del documento
    document.body.appendChild(notification);
    
    // Forzar un reflow para que la transición funcione
    notification.offsetHeight;
    
    // Mostrar la notificación
    notification.classList.add('show');

    // Ocultar después de 2 segundos
    setTimeout(() => {
      notification.classList.remove('show');

      // Eliminar del DOM después de que termine la transición
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  };
  
  // Manejar formularios de compra
  const purchaseForms = document.querySelectorAll('.purchase-form');
  if (purchaseForms.length > 0) {
    purchaseForms.forEach(form => {
      form.addEventListener('submit', function(e) {
        // Animación visual del botón
        const button = this.querySelector('button[type="submit"]');
        if (button) {
          button.innerHTML = '<span class="spinner">Procesando...</span>';
        }
      });
    });
  }
  
  // Manejar formularios de canje
  const redeemForms = document.querySelectorAll('.redeem-form');
  if (redeemForms.length > 0) {
    redeemForms.forEach(form => {
      form.addEventListener('submit', function(e) {
        // Animación visual del botón
        const button = this.querySelector('button[type="submit"]');
        if (button) {
          button.innerHTML = '<span class="spinner">Procesando...</span>';
        }
      });
    });
  }
  
  // Añadir efecto hover a las tarjetas
  const cards = document.querySelectorAll('.product-card, .reward-card, .achievement-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)';
      this.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = '';
      this.style.boxShadow = '';
    });
  });
  
  // Verificar si hay mensaje de éxito en la URL
  const urlParams = new URLSearchParams(window.location.search);
  const message = urlParams.get('message');
  const points = urlParams.get('points');
  
  if (message) {
    showNotification('¡Éxito!', message, points ? parseInt(points) : null);
  }
  
  // Manejar logros nuevos
  const hasNewAchievement = urlParams.get('newAchievement');
  if (hasNewAchievement === 'true') {
    const achievementName = urlParams.get('achievementName');
    const achievementPoints = urlParams.get('achievementPoints');
    
    if (achievementName) {
      showNotification('¡LOGRO DESBLOQUEADO!', achievementName, achievementPoints ? parseInt(achievementPoints) : null);
    }
  }
  
  // Añadir animación a los elementos
  const animateElements = document.querySelectorAll('.animate-in');
  if (animateElements.length > 0) {
    animateElements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('fade-in');
      }, index * 100);
    });
  }

  // Botón de autorelleno mágico en registro
  const autofillBtn = document.getElementById('autofillBtn');
  if (autofillBtn) {
    // Lista de nombres y apellidos españoles
    const nombres = ['Carlos', 'María', 'José', 'Ana', 'Luis', 'Carmen', 'Miguel', 'Laura', 'Antonio', 'Isabel',
                     'Javier', 'Elena', 'David', 'Sofía', 'Pablo', 'Marta', 'Sergio', 'Patricia', 'Daniel', 'Cristina'];
    const apellidos = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Fernández', 'Sánchez', 'Pérez',
                       'Romero', 'Torres', 'Ruiz', 'Ramírez', 'Flores', 'Morales', 'Jiménez', 'Castro', 'Ortiz'];

    autofillBtn.addEventListener('click', function() {
      // Seleccionar nombre y apellido aleatorio
      const nombre = nombres[Math.floor(Math.random() * nombres.length)];
      const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
      const nombreCompleto = `${nombre} ${apellido}`;

      // Crear email en formato d.cruz+NombreApellido@salesforce.com (sin tildes)
      const nombreApellidoJunto = (nombre + apellido)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Eliminar tildes
      const email = `d.cruz+${nombreApellidoJunto}@salesforce.com`;

      // Rellenar los campos
      document.getElementById('name').value = nombreCompleto;
      document.getElementById('email').value = email;

      // Marcar aleatoriamente 1-2 checkboxes de intereses
      const checkboxes = document.querySelectorAll('input[name="preferences"]');
      checkboxes.forEach(cb => cb.checked = false); // Desmarcar todos primero

      const numToCheck = Math.floor(Math.random() * 2) + 1; // 1 o 2
      const indices = [];
      while(indices.length < numToCheck) {
        const r = Math.floor(Math.random() * checkboxes.length);
        if(indices.indexOf(r) === -1) indices.push(r);
      }
      indices.forEach(i => checkboxes[i].checked = true);

      // Animación visual
      this.innerHTML = '<i class="fas fa-check"></i> ¡Rellenado!';
      this.style.backgroundColor = '#00E676';
      setTimeout(() => {
        this.innerHTML = '<i class="fas fa-magic"></i> Rellenar automáticamente (Demo)';
        this.style.backgroundColor = '';
      }, 2000);
    });
  }

  // Auto-login: Intentar restaurar sesión desde localStorage
  async function tryAutoLogin() {
    const savedEmail = localStorage.getItem('caixabank_user_email');

    // Solo intentar auto-login si no estamos en la página de registro
    // y si hay un email guardado
    if (savedEmail && !window.location.pathname.includes('/register')) {
      try {
        const response = await fetch('/register/auto-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: savedEmail })
        });

        const data = await response.json();

        if (data.success) {
          console.log('✅ Auto-login exitoso');
          // Si estamos en una página protegida y el auto-login fue exitoso,
          // no necesitamos hacer nada, ya estamos logueados
        } else if (response.status === 404) {
          // Usuario no encontrado, limpiar localStorage
          localStorage.removeItem('caixabank_user_email');
          console.log('⚠️ Usuario no encontrado, localStorage limpiado');
        }
      } catch (error) {
        console.error('Error en auto-login:', error);
      }
    }
  }

  // Ejecutar auto-login
  tryAutoLogin();
});