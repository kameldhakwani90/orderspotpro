const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

console.log('👤 Création utilisateur admin...');

async function seedAdmin() {
  const prisma = new PrismaClient();
  
  try {
    const adminEmail = 'medkamel.dhakwani@gmail.com';
    const adminPassword = 'Admin1920';
    
    // Vérifier si admin existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin existe déjà');
      return;
    }
    
    // Créer admin
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Kamel Dhakwani',
        role: 'ADMIN',
        password: hashedPassword
      }
    });
    
    console.log('✅ Admin créé avec succès');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    
  } catch (error) {
    console.error('❌ Erreur création admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();