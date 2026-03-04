<%- include('partials/header', {currentPage: 'home'}) %>

<div class="container mt-5">
  <div class="row text-center mb-5">
    <div class="col-12">
      <h1 class="display-4" style="color: #d81e05; font-weight: 800; text-transform: uppercase;">MAPFRE TE CUIDAMOS</h1>
      <p class="lead text-muted">Tu confianza siempre tiene recompensa</p>
    </div>
  </div>

  <% if (typeof member !== 'undefined' && member) { %>
    <div class="row justify-content-center">
      <div class="col-md-10">
        <div class="card shadow-lg border-0" style="border-radius: 20px; background: linear-gradient(135deg, #d81e05 0%, #a31604 100%); color: white;">
          <div class="card-body p-5">
            <h3 class="mb-4" style="font-weight: 600;">Bienvenido, <%= member.name %></h3>
            
            <div class="row text-center align-items-center">
              <div class="col-md-4 border-right border-white-50">
                <small style="text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; font-weight: 700;">Puntos Nivel</small>
                <h2 class="display-4 mb-0" style="font-weight: 800;"><%= member.levelPoints %></h2>
              </div>
              
              <div class="col-md-4 border-right border-white-50">
                <small style="text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; font-weight: 700;">Tréboles</small>
                <h2 class="display-3 mb-0" style="font-weight: 900;"><%= member.rewardPoints %></h2>
              </div>
              
              <div class="col-md-4">
                <small style="text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; font-weight: 700;">Nivel Actual</small>
                <h2 class="display-4 mb-0" style="font-weight: 800; text-transform: uppercase;">
                  <%= (member.tier) ? member.tier : 'Plata' %>
                </h2>
              </div>
            </div>
          </div>
        </div>

        <div class="row mt-5">
          <div class="col-md-6 mb-3">
            <a href="/accrual" class="btn btn-danger btn-lg btn-block shadow-sm" style="background-color: #d81e05; border: none; border-radius: 50px; padding: 20px; font-weight: 800; color: white; display: block; text-align: center; text-decoration: none;">
              GANAR TRÉBOLES
            </a>
          </div>
          <div class="col-md-6 mb-3">
            <a href="/redemption" class="btn btn-dark btn-lg btn-block shadow-sm" style="background-color: #333; border: none; border-radius: 50px; padding: 20px; font-weight: 800; color: white; display: block; text-align: center; text-decoration: none;">
              CANJEAR TRÉBOLES
            </a>
          </div>
        </div>
      </div>
    </div>
  <% } else { %>
    <div class="row justify-content-center mt-4">
      <div class="col-md-8 text-center">
        <div class="card p-5 shadow-sm border-0" style="border-radius: 30px; background: #fdfdfd;">
          <h2 class="font-weight-bold mb-3">¡Únete a Mapfre Te Cuidamos!</h2>
          <p class="text-muted mb-5">Acumula tréboles con cada seguro y gestión digital para ahorrar en tus próximas pólizas.</p>
          <a href="/register" class="btn btn-danger btn-lg px-5 py-3 shadow" style="background-color: #d81e05; border: none; border-radius: 50px; font-weight: 800; color: white; text-decoration: none; display: inline-block;">
            COMENZAR AHORA
          </a>
        </div>
      </div>
    </div>
  <% } %>
</div>

<%- include('partials/footer') %>