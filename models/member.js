// Almacenamiento en memoria para mapeo con Salesforce
// Este modelo YA NO gestiona puntos, tier, transacciones, etc.
// TODO es manejado por Salesforce Loyalty Management
const members = [];
let currentId = 1;

class Member {
  constructor(name, email, preferences = []) {
    this.id = currentId++;
    this.name = name;
    this.email = email;
    this.preferences = preferences;
    this.createdAt = new Date();
    this.salesforceId = null; // ID del LoyaltyProgramMember en Salesforce

    // Campos temporales para almacenar datos sincronizados desde Salesforce
    // Estos NO se calculan localmente, solo se actualizan desde SF
    this.levelPoints = 0; // Sincronizado desde Salesforce (Caixapoints)
    this.rewardPoints = 0; // Sincronizado desde Salesforce (Cashback)
    this.tier = 'Basic'; // Sincronizado desde Salesforce MemberTier
  }

  // Métodos estáticos para búsqueda y almacenamiento
  static findById(id) {
    return members.find(member => member.id === parseInt(id));
  }

  static findByEmail(email) {
    return members.find(member => member.email === email);
  }

  static findBySalesforceId(sfId) {
    return members.find(member => member.salesforceId === sfId);
  }

  static save(member) {
    // Solo guardar si no existe ya
    const existing = members.find(m => m.id === member.id);
    if (!existing) {
      members.push(member);
    }
    return member;
  }

  static getAll() {
    return members;
  }
}

module.exports = Member;
