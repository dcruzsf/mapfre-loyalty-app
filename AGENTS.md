# AGENTS.md - Contexto del Proyecto CaixaBank Experience

## 📋 Información General del Proyecto

**Nombre del Proyecto:** CaixaBank Experience
**Tipo:** Programa de fidelización bancaria digital
**Tecnología:** Node.js + Express + EJS
**Enfoque:** Banca 100% digital que premia el uso de canales digitales
**Inspiración de Diseño:** Revolut, N26 (neobanks modernos)

---

## 🎯 Concepto del Programa

**CaixaBank Experience** es un programa de fidelización bancaria enfocado en incentivar el uso de operaciones digitales. A diferencia de programas tradicionales de retail, este programa recompensa acciones bancarias digitales como transferencias Bizum, pagos contactless, inversiones automáticas, etc.

### Sistema de Puntos

El programa utiliza **dos tipos de puntos** con nomenclatura específica:

1. **Caixapoints** (antes "Caixapoints Status", "levelPoints" o "Stars Totales")
   - Son puntos de **nivel/estado**
   - Determinan la **categoría del usuario** (Basic, Plus, Premium, Elite)
   - Se acumulan pero **NO se canjean**
   - Funcionan como indicador de engagement

2. **Cashback** (antes "Caixapoints Rewards", "rewardPoints" o "Stars Canjeables")
   - Son puntos de **consumo/canje**
   - Se pueden **canjear por recompensas** (cashback instantáneo, upgrades, experiencias)
   - Se gastan al realizar canjes

### Niveles (Tiers)

| Nivel | Threshold | Nombre Display | Beneficios |
|-------|-----------|----------------|------------|
| Bronze | 0 | Basic | Caixapoints base, recompensas básicas, app sin comisiones |
| Silver | 500 | Plus | +15% bonus, cashback 1%, transferencias internacionales gratis |
| Gold | 1000 | Premium | +30% bonus, cashback 2%, asesoría digital, acceso prioritario |
| Platinum | 2000 | Elite | +50% bonus, cashback 3%, gestor 24/7, eventos VIP, IA premium |

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Directorios

```
loyalty-demo-interactive-caixabank/
├── config/
│   ├── brand.js          # Configuración de marca (colores, mensajes, naming)
│   ├── catalog.js        # Operaciones digitales, actividades, recompensas, logros
│   └── tiers.js          # Sistema de niveles con beneficios
├── locales/
│   ├── es.json           # Traducciones español (idioma por defecto)
│   └── en.json           # Traducciones inglés
├── middleware/
│   └── auth.js           # Middleware de autenticación
├── models/
│   └── member.js         # Modelo de miembro con lógica de puntos
├── modules/
│   ├── i18n.js           # Sistema de internacionalización
│   ├── brandTranslations.js      # Traducciones de marca
│   ├── catalogTranslations.js    # Traducciones de catálogo/operaciones
│   └── transactionTranslations.js # Traducciones de transacciones
├── public/
│   ├── css/style.css     # Estilos modernos tipo Revolut
│   └── js/main.js        # JavaScript cliente (notificaciones, tabs, animaciones)
├── routes/
│   ├── index.js          # Ruta principal y home
│   ├── accrual.js        # Ganar puntos (operaciones + actividades)
│   ├── redemption.js     # Canjear puntos
│   └── achievements.js   # Logros
├── views/
│   ├── partials/
│   │   ├── header.ejs    # Header con navegación
│   │   └── footer.ejs    # Footer con scripts
│   ├── index.ejs         # Página principal
│   ├── accrual.ejs       # Página de acumulación
│   ├── redemption.ejs    # Página de canje
│   └── achievements.ejs  # Página de logros
└── app.js                # Archivo principal de la aplicación
```

---

## 🎨 Identidad Visual

### Paleta de Colores

```javascript
colors: {
  primary: '#0066B3',        // Azul CaixaBank principal
  secondary: '#00C9FF',      // Azul cielo brillante (digital)
  accent: '#003D6E',         // Azul profundo premium
  lightGray: '#F8F9FB',      // Gris ultra claro (background)
  successColor: '#00E676',   // Verde brillante (digital success)
  errorColor: '#FF3D71',     // Rojo moderno

  // Colores de tier
  tierColors: {
    bronze: '#B87333',       // Basic - Bronce cálido
    silver: '#B8BEC5',       // Plus - Plata moderna
    gold: '#F4C542',         // Premium - Oro vibrante
    platinum: '#C9D5E0'      // Elite - Platino elegante
  }
}
```

### Características de Diseño

- **Glassmorphism**: Backdrop blur en navbar
- **Gradientes sutiles**: En fondos, botones y títulos
- **Sombras suaves**: Box-shadows multicapa para profundidad
- **Animaciones fluidas**: Transitions con cubic-bezier
- **Tipografía moderna**: -apple-system, peso 700-800, letter-spacing negativo
- **Bordes redondeados**: 16-24px para cards y botones

---

## 💳 Operaciones Digitales (Productos)

| ID | Operación | Precio | Points | Categoría |
|----|-----------|--------|--------|-----------|
| 1 | Transferencia Inmediata Bizum | 10€ | 15 | digital_banking |
| 2 | Pago Contactless o Apple/Google Pay | 25€ | 20 | digital_banking |
| 3 | Inversión Automática en Fondos | 100€ | 250 | investments |
| 4 | Pago de Recibos desde la App | 50€ | 30 | digital_banking |
| 5 | Compra Online con Tarjeta Virtual | 75€ | 40 | digital_banking |

**Nota**: Estas operaciones tienen un coste en euros que se descuenta del balance del usuario.

---

## 🎯 Actividades Digitales

| ID | Actividad | Points | Categoría |
|----|-----------|--------|-----------|
| 1 | Activar CaixaBankNow en tu móvil | 150 | app |
| 2 | Completar perfil financiero | 80 | profile |
| 3 | Invitar amigos a CaixaBank Experience | 100 | referral |
| 4 | Activar Face ID / Huella Digital | 75 | security |
| 5 | Vincular Apple/Google Wallet | 90 | digital_wallet |
| 6 | Domiciliación de Nómina Digital | 500 | payroll |

**Nota**: Las actividades son gratuitas y solo otorgan puntos.

---

## 🎁 Recompensas

| ID | Recompensa | Cost (Points) | Tipo |
|----|-----------|---------------|------|
| 1 | Cashback Instantáneo 10€ | 150 | cashback |
| 2 | Cashback Instantáneo 25€ | 350 | cashback |
| 3 | Mes Premium GRATIS | 500 | subscription |
| 4 | Inversión Asistida por IA | 800 | service |
| 5 | Upgrade de Tarjeta a Premium | 1000 | product |
| 6 | Acceso VIP a Eventos Exclusivos | 1200 | experience |

---

## 🏆 Sistema de Logros

### Logros Principales

1. **Bienvenido a Experience** - Te has unido a la revolución digital (50 pts, auto)
2. **Primera Operación Digital** - Has realizado tu primera operación 100% digital (75 pts)
3. **Inversor Premium** - Has activado inversiones automáticas (200 pts)
4. **Primera Recompensa** - Has canjeado tus Caixapoints por primera vez (100 pts)
5. **Guerrero Digital** - Completaste el reto de 5 operaciones digitales (80 pts)
6. **Perfil 100% Configurado** - Completaste toda la configuración (90 pts)
7. **Influencer Financiero** - Invitaste a 3 amigos (100 pts)
8. **Nivel Plus** - Has alcanzado el nivel Plus (150 pts)
9. **Nivel Premium** - Has alcanzado el nivel Premium (250 pts)
10. **Nivel Elite** - Has alcanzado el nivel Elite (400 pts)

---

## 🌐 Sistema de Internacionalización (i18n)

### Configuración

- **Idioma por defecto**: Español (`es`)
- **Idiomas disponibles**: Español (`es`), Inglés (`en`)
- **Detección**: NO se detecta del navegador, siempre español por defecto
- **Cambio manual**: Via query param `?lang=en` o selector de idioma

### Archivos Clave

- `modules/i18n.js` - Sistema de i18n
- `locales/es.json` - Traducciones español
- `locales/en.json` - Traducciones inglés
- `modules/brandTranslations.js` - Traducciones de marca
- `modules/catalogTranslations.js` - Traducciones de operaciones/recompensas

---

## ⚙️ Configuración Técnica

### Variables de Entorno

No se utilizan variables de entorno críticas. El proyecto funciona out-of-the-box.

### Sesiones

- Se usa `express-session` con almacenamiento en memoria
- `memberId` se guarda en sesión para autenticación
- Los datos de miembros se almacenan en memoria (demo)

### Middleware de Autenticación

```javascript
// middleware/auth.js
requireAuth: Verifica que existe memberId en sesión
```

---

## 🔄 Flujo de Usuario

1. **Registro**: Usuario se registra con nombre, email, intereses
2. **Home**: Ve su tarjeta de miembro con Caixapoints y Cashback
3. **Ganar Puntos**:
   - Realiza operaciones digitales (Tab "Operaciones")
   - Completa actividades (Tab "Actividades")
4. **Canjear**: Usa Cashback para obtener recompensas
5. **Logros**: Desbloquea achievements automáticamente
6. **Progresión**: Acumula Caixapoints para subir de nivel

---

## 🎨 Componentes UI Principales

### Notificaciones

- **Ubicación**: Top-right fixed
- **Duración**: 2 segundos (2000ms)
- **Animación**: Fade in/out con transform
- **Trigger**: Después de operaciones exitosas

### Tarjeta de Miembro (Member Summary)

- **Estilo**: Tipo tarjeta bancaria premium
- **Gradiente**: Primary → Accent
- **Información**: Saldo, Caixapoints, Cashback, Nivel
- **Progreso**: Barra de progreso hacia siguiente nivel

### Pestañas (Tabs)

- **Sistema**: Tab activo con border-bottom y color primario
- **Contenido**: Tab-content con display none/block
- **JavaScript**: Click handler en main.js

---

## 🐛 Issues Conocidos y Soluciones Recientes

### ✅ RESUELTO: Catálogo mostrando productos de retail
**Problema**: catalogTranslations.js tenía productos antiguos (camisetas, pantalones)
**Solución**: Actualizado con operaciones digitales bancarias

### ✅ RESUELTO: Notificaciones no desaparecían
**Problema**: Timeout de 4 segundos y no se eliminaban automáticamente
**Solución**: Cambiado a 2 segundos en main.js línea 66

### ✅ RESUELTO: Confusión entre tipos de puntos
**Problema**: "Stars Totales" y "Stars Canjeables" no eran claros
**Solución**: Renombrado primero a "Caixapoints Status" y "Caixapoints Rewards", luego simplificado a "Caixapoints" y "Cashback"

### ✅ RESUELTO: Idioma se detectaba del navegador
**Problema**: Usuario veía inglés si su navegador estaba en inglés
**Solución**: Eliminada detección Accept-Language en i18n.js, siempre español por defecto

### ✅ RESUELTO: Navegación "Gana Stars / Canjea Stars"
**Problema**: Menú mostraba "Stars" en lugar de "Puntos"
**Solución**: Actualizado locales/es.json y en.json con "Ganar Puntos" / "Canjear Puntos"

### ✅ RESUELTO: Operaciones sin precio
**Problema**: Todas las operaciones tenían 0€ de precio
**Solución**: Añadidos precios realistas (10€-150€) en catalog.js

### ✅ RESUELTO: Configurar alertas → Completar perfil
**Problema**: Actividad incorrecta
**Solución**: Cambiada actividad #2 a "Completar perfil financiero"

### ✅ RESUELTO: Logros con niveles incorrectos
**Problema**: Achievements mostraban Silver/Gold/Platinum en lugar de Plus/Premium/Elite
**Solución**: Actualizados IDs de logros a tier_plus, tier_premium, tier_elite

### ✅ RESUELTO: Navegación con fondo azul oscuro
**Problema**: Fondo azul oscuro en nav activo no era elegante
**Solución**: Rediseñado con gradiente sutil y línea indicadora inferior

### ✅ RESUELTO: Auto-fill registro con tildes en email
**Problema**: Emails generados incluían tildes (jaimegarcia+maría@...)
**Solución**: Normalización NFD para eliminar acentos en generación de email

### ✅ RESUELTO: Domiciliación de Nómina como operación
**Problema**: Era una operación con coste en lugar de actividad gratuita
**Solución**: Movida de products array a activities array

### ✅ RESUELTO: Solo visible una recompensa
**Problema**: En canje solo se veía "Acceso VIP a Eventos Exclusivos"
**Solución**: Actualizado redemption.ejs para mostrar las 6 recompensas en 3 categorías

### ✅ RESUELTO: "Stars" en descripciones de productos
**Problema**: Referencias a "Stars" en lugar de "Caixapoints"
**Solución**: Actualizado todo el código (brand.js, tiers.js, catalog.js, catalogTranslations.js, brandTranslations.js, transactionTranslations.js)

---

## 📝 Convenciones de Código

### Naming

- **Archivos**: camelCase para JS, kebab-case para CSS
- **Variables**: camelCase
- **Constantes**: UPPER_SNAKE_CASE (poco usado)
- **Clases CSS**: kebab-case
- **IDs**: kebab-case

### Estructura de Traducciones

```json
{
  "navigation": { ... },
  "common": { ... },
  "member": { ... },
  "pages": {
    "accrual": { ... },
    "redemption": { ... }
  },
  "tiers": { ... }
}
```

### Modelo de Datos (Member)

```javascript
{
  id: String (UUID),
  name: String,
  email: String,
  balance: Number,
  levelPoints: Number,      // Caixapoints Status
  rewardPoints: Number,     // Caixapoints Rewards
  tier: String,             // 'Bronze', 'Silver', 'Gold', 'Platinum'
  achievements: Array,
  transactions: Array,
  interests: Array,
  registrationDate: Date
}
```

---

## 🚀 Comandos Útiles

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm start
# o
node app.js

# La app corre en http://localhost:3000
```

---

## 📚 Dependencias Principales

```json
{
  "express": "^4.x",
  "express-session": "^1.x",
  "ejs": "^3.x",
  "uuid": "^9.x"
}
```

---

## 🎯 Próximas Iteraciones Sugeridas

1. **Persistencia de Datos**: Implementar MongoDB/PostgreSQL
2. **Autenticación Real**: JWT o Passport.js
3. **Integración Salesforce**: Conectar con Salesforce Loyalty Management
4. **Push Notifications**: Notificaciones en tiempo real
5. **Gamificación Avanzada**: Streaks, desafíos temporales
6. **Dashboard Analytics**: Visualización de métricas
7. **Multi-tenant**: Soporte para múltiples marcas

---

## 🔍 Debugging Tips

### Ver datos de sesión
```javascript
console.log(req.session.memberId);
```

### Ver traducciones cargadas
```javascript
console.log(i18n.translations);
```

### Limpiar sesión
```javascript
req.session.destroy();
```

---

## 📞 Contacto y Recursos

**Repositorio**: loyalty-demo-interactive-caixabank
**Inspiración**: Revolut, N26, Nubank
**Documentación Adicional**: Ver comentarios en código

---

## 🔄 Historial de Cambios Importantes

### Última Actualización: 2025-10-23

1. **Rebranding completo**: Hang-in-there → CaixaBank Experience
2. **Nuevo sistema de puntos**: Stars → Caixapoints Status/Rewards → **Caixapoints/Cashback**
3. **Catálogo digital**: Productos retail → Operaciones bancarias digitales
4. **Diseño modernizado**: Estilo Revolut con glassmorphism y animaciones
5. **Niveles actualizados**: Bronze/Silver/Gold/Platinum → Basic/Plus/Premium/Elite (display names)
6. **Traducciones**: Sistema i18n con español por defecto
7. **Notificaciones**: Timeout ajustado a 2 segundos
8. **Naming clarificado**: Distinción clara entre puntos de nivel (Caixapoints) y canje (Cashback)
9. **Menú mejorado**: Selección activa más sutil y elegante con gradientes
10. **Auto-fill registro**: Botón mágico para rellenar formulario de demo con email d.cruz+
11. **Precios realistas**: Operaciones con costes en euros (10€-150€)
12. **Domiciliación de Nómina**: Movida de operación a actividad
13. **Recompensas visibles**: Todas las recompensas organizadas en categorías (Cashback, Experiencias)
14. **Logros alineados**: tier_plus, tier_premium, tier_elite con nombres correctos
15. **Consistencia total**: "Caixapoints" y "Cashback" en todo el código y traducciones
16. **Integración Salesforce**: OAuth password flow configurado con Connected App

---

**NOTA IMPORTANTE PARA AGENTES**: Este documento debe ser consultado al inicio de cada iteración para mantener coherencia con la visión del proyecto. Actualizar este archivo cuando se realicen cambios arquitectónicos significativos.
