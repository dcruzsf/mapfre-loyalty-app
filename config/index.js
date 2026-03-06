<%- include('partials/header', {currentPage: 'home'}) %>

<div class="container mt-5">
  <div class="row text-center mb-5">
    <div class="col-12">
      <h1 class="display-4" style="color: #d81e05; font-weight: 800; text-transform: uppercase;">CLUB MAPFRE</h1>
      <p class="lead text-muted">Bienvenido al programa que premia tu confianza</p>
    </div>
  </div>

  <% 
    // Lógica de seguridad para la Demo
    let user = (typeof member !== 'undefined' && member) ? member : { name: 'Elena Gomez', levelPoints: 25, rewardPoints: 25, tier: 'Plata' };
  %>

  <div class="row justify-content-center">
    <div class="col-md-10">
      <div class="card shadow-lg border-0" style="border-radius: 20px; background: linear-gradient(135deg, #d81e05 0%, #a31604 100%); color: white;">
        <div class="card-body p-5">
          <h3 class="mb-4" style="font-weight: 600;">Hola, <%= user.name %></h3>
          
          <div class="row text-center align-items-center">
            <div class="col-md-4 border-right border-white-50">
              <small style="text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; font-weight: 700;">Puntos Nivel</small>
              <h2 class="display-4 mb-0" style="font-weight: 800;"><%= user.levelPoints %></h2>
            </div>
            
            <div class="col-md-4 border-right border-white-50">
              <small style="text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; font-weight: 700;">Tréboles</small>
              <h2 class="display-3 mb-0" style="font-weight: 900;"><%= user.rewardPoints %></h2>
            </div>
            
            <div class="col-md-4">
              <small style="text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; font-weight: 700;">Nivel Actual</small>
              <h2 class="display-4 mb-0" style="font-weight: 800; text-transform: uppercase;"><%= user.tier %></h2>
            </div>
          </div>
        </div>
      </div>

      <div class="row mt-5">
        <div class="col-md-6 mb-3">
          <a href="/accrual" class="btn btn-danger btn-lg btn-block shadow-sm py-3" style="background-color: #d81e05; border: none; border-radius: 50px; font-weight: 800; color: white; text-decoration: none;">
            GANAR TRÉBOLES
          </a>
        </div>
        <div class="col-md-6 mb-3">
          <a href="/redemption" class="btn btn-dark btn-lg btn-block shadow-sm py-3" style="background-color: #333; border: none; border-radius: 50px; font-weight: 800; color: white; text-decoration: none;">
            CANJEAR TRÉBOLES
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

<%- include('partials/footer') %>