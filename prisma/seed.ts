import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (dans l'ordre correct pour les contraintes de clés étrangères)
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.session.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.ride.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.bike.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.pricingConfig.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Créer les rôles d'abord
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'SUPER_ADMIN',
      description: 'Super Administrator with full access',
      isDefault: false
    }
  });

  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      description: 'Administrator with limited access',
      isDefault: false
    }
  });

  const employeeRole = await prisma.role.create({
    data: {
      name: 'EMPLOYEE',
      description: 'Employee with basic management access',
      isDefault: false
    }
  });

  const userRole = await prisma.role.create({
    data: {
      name: 'USER',
      description: 'Regular user with basic access',
      isDefault: true
    }
  });

  console.log('✅ Created roles');

  // Créer les permissions
  const permissions = [
    // Admin permissions
    { name: 'admin:manage', description: 'Full admin access', resource: 'admin', action: 'manage' },
    { name: 'admin:read', description: 'View admin dashboard', resource: 'admin', action: 'read' },
    
    // User permissions
    { name: 'users:create', description: 'Create users', resource: 'users', action: 'create' },
    { name: 'users:read', description: 'View users', resource: 'users', action: 'read' },
    { name: 'users:update', description: 'Update users', resource: 'users', action: 'update' },
    { name: 'users:delete', description: 'Delete users', resource: 'users', action: 'delete' },
    { name: 'users:manage', description: 'Full user management', resource: 'users', action: 'manage' },
    
    // Bike permissions
    { name: 'bikes:create', description: 'Create bikes', resource: 'bikes', action: 'create' },
    { name: 'bikes:read', description: 'View bikes', resource: 'bikes', action: 'read' },
    { name: 'bikes:update', description: 'Update bikes', resource: 'bikes', action: 'update' },
    { name: 'bikes:delete', description: 'Delete bikes', resource: 'bikes', action: 'delete' },
    { name: 'bikes:manage', description: 'Full bike management', resource: 'bikes', action: 'manage' },
    
    // Ride permissions
    { name: 'rides:create', description: 'Create rides', resource: 'rides', action: 'create' },
    { name: 'rides:read', description: 'View rides', resource: 'rides', action: 'read' },
    { name: 'rides:update', description: 'Update rides', resource: 'rides', action: 'update' },
    { name: 'rides:delete', description: 'Delete rides', resource: 'rides', action: 'delete' },
    
    // Maintenance permissions
    { name: 'maintenance:create', description: 'Add maintenance logs', resource: 'maintenance', action: 'create' },
    { name: 'maintenance:read', description: 'View maintenance logs', resource: 'maintenance', action: 'read' },
    { name: 'maintenance:update', description: 'Update maintenance logs', resource: 'maintenance', action: 'update' },
    { name: 'maintenance:delete', description: 'Delete maintenance logs', resource: 'maintenance', action: 'delete' },
    { name: 'maintenance:manage', description: 'Full maintenance management', resource: 'maintenance', action: 'manage' },
    
    // Chat permissions
    { name: 'chat:create', description: 'Send messages', resource: 'chat', action: 'create' },
    { name: 'chat:read', description: 'View conversations', resource: 'chat', action: 'read' },
    { name: 'chat:update', description: 'Update messages', resource: 'chat', action: 'update' },
    { name: 'chat:delete', description: 'Delete messages', resource: 'chat', action: 'delete' },
    { name: 'chat:manage', description: 'Full chat management', resource: 'chat', action: 'manage' },
    
    // Notification permissions
    { name: 'notifications:create', description: 'Send notifications', resource: 'notifications', action: 'create' },
    { name: 'notifications:read', description: 'View notifications', resource: 'notifications', action: 'read' },
    { name: 'notifications:update', description: 'Update notifications', resource: 'notifications', action: 'update' },
    { name: 'notifications:delete', description: 'Delete notifications', resource: 'notifications', action: 'delete' },
    { name: 'notifications:manage', description: 'Full notification management', resource: 'notifications', action: 'manage' },
    
    // Wallet permissions
    { name: 'wallet:read', description: 'View wallet data', resource: 'wallet', action: 'read' },
    { name: 'wallet:update', description: 'Update wallet', resource: 'wallet', action: 'update' },
    { name: 'wallet:manage', description: 'Full wallet management', resource: 'wallet', action: 'manage' },
    
    // Settings permissions
    { name: 'settings:read', description: 'View settings', resource: 'settings', action: 'read' },
    { name: 'settings:update', description: 'Update settings', resource: 'settings', action: 'update' },
    
    // Pricing permissions
    { name: 'pricing:read', description: 'View pricing', resource: 'pricing', action: 'read' },
    { name: 'pricing:update', description: 'Update pricing', resource: 'pricing', action: 'update' },
    
    // Incident permissions
    { name: 'incidents:read', description: 'View incidents', resource: 'incidents', action: 'read' },
    { name: 'incidents:update', description: 'Update incidents', resource: 'incidents', action: 'update' },

    // Reviews permissions
    { name: 'reviews:create', description: 'Create reviews', resource: 'reviews', action: 'create' },
    { name: 'reviews:read', description: 'View reviews', resource: 'reviews', action: 'read' },
    { name: 'reviews:update', description: 'Update reviews', resource: 'reviews', action: 'update' },
    { name: 'reviews:delete', description: 'Delete reviews', resource: 'reviews', action: 'delete' },
    { name: 'reviews:manage', description: 'Full reviews management', resource: 'reviews', action: 'manage' },
    
    // Logs permissions
    { name: 'logs:read', description: 'View activity logs', resource: 'logs', action: 'read' },
    
    // Roles permissions
    { name: 'roles:create', description: 'Create roles', resource: 'roles', action: 'create' },
    { name: 'roles:read', description: 'View roles', resource: 'roles', action: 'read' },
    { name: 'roles:update', description: 'Update roles', resource: 'roles', action: 'update' },
    { name: 'roles:delete', description: 'Delete roles', resource: 'roles', action: 'delete' },
    
    // Permissions permissions
    { name: 'permissions:read', description: 'View permissions', resource: 'permissions', action: 'read' },
  ];

  for (const permission of permissions) {
    await prisma.permission.create({
      data: permission
    });
  }

  console.log('✅ Created permissions');

  // Assigner toutes les permissions au SUPER_ADMIN
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: superAdminRole.id,
        permissionId: permission.id
      }
    });
  }

  // Assigner des permissions spécifiques à l'ADMIN
  const adminPermissions = [
    'admin:read', 'users:read', 'users:update', 'bikes:manage', 'rides:read', 
    'incidents:read', 'incidents:update', 'logs:read', 'maintenance:manage',
    'chat:read', 'chat:create', 'notifications:create', 'wallet:read',
    'reviews:read', 'reviews:update', 'reviews:manage'
  ];
  for (const permName of adminPermissions) {
    const permission = await prisma.permission.findUnique({ where: { name: permName } });
    if (permission) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      });
    }
  }

  // Assigner des permissions spécifiques à l'EMPLOYEE
  const employeePermissions = [
    'bikes:read', 'bikes:update', 'rides:read', 'incidents:read', 'incidents:update',
    'maintenance:create', 'maintenance:read', 'chat:read', 'reviews:read'
  ];
  for (const permName of employeePermissions) {
    const permission = await prisma.permission.findUnique({ where: { name: permName } });
    if (permission) {
      await prisma.rolePermission.create({
        data: {
          roleId: employeeRole.id,
          permissionId: permission.id
        }
      });
    }
  }

  // Assigner des permissions de base à l'USER
  const userPermissions = [
    'bikes:read', 'rides:create', 'rides:read', 'incidents:create', 'chat:create',
    'notifications:read', 'wallet:read', 'settings:read', 'pricing:read', 'reviews:create'
  ];
  for (const permName of userPermissions) {
    const permission = await prisma.permission.findUnique({ where: { name: permName } });
    if (permission) {
      await prisma.rolePermission.create({
        data: {
          roleId: userRole.id,
          permissionId: permission.id
        }
      });
    }
  }

  console.log('✅ Assigned permissions to roles');

  // Create users avec roleId
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@freebike.cm',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'FreeBike',
      phone: '+237600000001',
      role: 'SUPER_ADMIN',
      roleId: superAdminRole.id,
      emailVerified: true,
      status: 'active',
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'manager@freebike.cm',
      password: hashedPassword,
      firstName: 'Manager',
      lastName: 'System',
      phone: '+237600000002',
      role: 'ADMIN',
      roleId: adminRole.id,
      emailVerified: true,
      status: 'active',
      isActive: true,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'user@freebike.cm',
      password: userPassword,
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '+237600000003',
      role: 'USER',
      roleId: userRole.id,
      emailVerified: true,
      status: 'active',
      isActive: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'marie@freebike.cm',
      password: userPassword,
      firstName: 'Marie',
      lastName: 'Martin',
      phone: '+237600000004',
      role: 'USER',
      roleId: userRole.id,
      emailVerified: true,
      status: 'active',
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'support@freebike.cm',
      password: hashedPassword,
      firstName: 'Support',
      lastName: 'Team',
      phone: '+237600000005',
      role: 'EMPLOYEE',
      roleId: employeeRole.id,
      emailVerified: true,
      status: 'active',
      isActive: true,
    },
  });

  console.log('✅ Created users');

  // Créer des paramètres par défaut
  const defaultSettings = [
    { key: 'companyName', value: 'EcoMobile' },
    { key: 'description', value: 'Service de location de vélos électriques écologique et moderne' },
    { key: 'email', value: 'contact@ecomobile.cm' },
    { key: 'phone', value: '+237 699 123 456' },
    { key: 'address', value: 'Boulevard de la Liberté' },
    { key: 'city', value: 'Douala' },
    { key: 'country', value: 'Cameroun' },
    { key: 'orangeMoneyNumber', value: '+237 699 123 456' },
    { key: 'mobileMoneyNumber', value: '+237 677 123 456' },
    { key: 'facebook', value: 'https://facebook.com/ecomobile' },
    { key: 'instagram', value: 'https://instagram.com/ecomobile' },
    { key: 'website', value: 'https://ecomobile.cm' },
  ];

  for (const setting of defaultSettings) {
    await prisma.settings.create({
      data: setting
    });
  }

  console.log('✅ Created default settings');


  // Create wallets
  const wallet1 = await prisma.wallet.create({
    data: {
      userId: user1.id,
      balance: 5000,
    },
  });

  const wallet2 = await prisma.wallet.create({
    data: {
      userId: user2.id,
      balance: 3000,
    },
  });

  await prisma.wallet.create({
    data: {
      userId: admin.id,
      balance: 0,
    },
  });

  console.log('✅ Created wallets');

  // Create transactions
  await prisma.transaction.create({
    data: {
      walletId: wallet1.id,
      type: 'DEPOSIT',
      amount: 5000,
      fees: 175,
      totalAmount: 5175,
      status: 'COMPLETED',
      paymentMethod: 'orange_money',
      paymentProvider: 'MyCoolPay',
    },
  });

  await prisma.transaction.create({
    data: {
      walletId: wallet2.id,
      type: 'DEPOSIT',
      amount: 3000,
      fees: 145,
      totalAmount: 3145,
      status: 'COMPLETED',
      paymentMethod: 'mtn_money',
      paymentProvider: 'MyCoolPay',
    },
  });

  await prisma.transaction.create({
    data: {
      walletId: wallet1.id,
      type: 'REFUND',
      amount: 750,
      fees: 0,
      totalAmount: 750,
      status: 'COMPLETED',
      paymentMethod: 'INCIDENT_REFUND',
      metadata: {
        incidentId: 'incident_refund_1',
        description: 'Remboursement pour problème technique'
      }
    },
  });

  await prisma.transaction.create({
    data: {
      walletId: wallet2.id,
      type: 'REFUND',
      amount: 500,
      fees: 0,
      totalAmount: 500,
      status: 'COMPLETED',
      paymentMethod: 'INCIDENT_REFUND',
      metadata: {
        incidentId: 'incident_refund_2',
        description: 'Remboursement pour pneu crevé'
      }
    },
  });

  console.log('✅ Created transactions');

  // Create bikes
  const bikes = [];
  const bikeModels = ['E-Bike Pro', 'E-Bike Sport', 'E-Bike City'];
  const locations = [
    { lat: 4.0511, lng: 9.7679, name: 'Douala Centre' },
    { lat: 4.0583, lng: 9.7083, name: 'Akwa' },
    { lat: 4.0483, lng: 9.7383, name: 'Bonanjo' },
    { lat: 4.0611, lng: 9.7479, name: 'Bonapriso' },
    { lat: 4.0711, lng: 9.7579, name: 'Bonaberi' },
  ];

  for (let i = 1; i <= 10; i++) {
    const location = locations[i % locations.length];
    const bike = await prisma.bike.create({
      data: {
        code: `BIKE${String(i).padStart(3, '0')}`,
        model: bikeModels[i % bikeModels.length],
        status: i <= 7 ? 'AVAILABLE' : i === 8 ? 'IN_USE' : 'MAINTENANCE',
        batteryLevel: 20 + (i * 8),
        latitude: location.lat + (Math.random() - 0.5) * 0.01,
        longitude: location.lng + (Math.random() - 0.5) * 0.01,
        qrCode: `QR${String(i).padStart(6, '0')}`,
        lastMaintenanceAt: new Date(Date.now() - i * 86400000),
      },
    });
    bikes.push(bike);
  }

  console.log('✅ Created bikes');

  // Create rides
  await prisma.ride.create({
    data: {
      userId: user1.id,
      bikeId: bikes[7].id,
      startLatitude: 4.0511,
      startLongitude: 9.7679,
      status: 'IN_PROGRESS',
    },
  });

  await prisma.ride.create({
    data: {
      userId: user2.id,
      bikeId: bikes[0].id,
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(Date.now() - 1800000),
      startLatitude: 4.0583,
      startLongitude: 9.7083,
      endLatitude: 4.0611,
      endLongitude: 9.7479,
      distance: 5.2,
      duration: 30,
      cost: 750,
      status: 'COMPLETED',
    },
  });

  await prisma.ride.create({
    data: {
      userId: user1.id,
      bikeId: bikes[1].id,
      startTime: new Date(Date.now() - 86400000),
      endTime: new Date(Date.now() - 82800000),
      startLatitude: 4.0511,
      startLongitude: 9.7679,
      endLatitude: 4.0483,
      endLongitude: 9.7383,
      distance: 3.8,
      duration: 25,
      cost: 625,
      status: 'COMPLETED',
    },
  });

  console.log('✅ Created rides');

  // Create maintenance logs
  await prisma.maintenanceLog.create({
    data: {
      bikeId: bikes[8].id,
      type: 'repair',
      description: 'Remplacement de la batterie',
      cost: 15000,
      performedBy: 'Technicien 1',
    },
  });

  await prisma.maintenanceLog.create({
    data: {
      bikeId: bikes[0].id,
      type: 'routine',
      description: 'Vérification générale',
      cost: 2000,
      performedBy: 'Technicien 2',
    },
  });

  console.log('✅ Created maintenance logs');

  // Create incidents
  await prisma.incident.create({
    data: {
      userId: user2.id,
      bikeId: bikes[5].id,
      type: 'technical',
      description: 'Pneu crevé pendant le trajet',
      status: 'RESOLVED',
      priority: 'HIGH',
      resolvedAt: new Date(),
      refundAmount: 500,
      adminNote: 'Remboursement pour réparation du pneu',
      resolvedBy: admin.id,
    },
  });

  await prisma.incident.create({
    data: {
      userId: user1.id,
      bikeId: bikes[3].id,
      type: 'payment',
      description: 'Problème de surfacturation',
      status: 'OPEN',
      priority: 'MEDIUM',
    },
  });

  await prisma.incident.create({
    data: {
      userId: user1.id,
      bikeId: bikes[2].id,
      type: 'theft',
      description: 'Vol présumé du vélo',
      status: 'CLOSED',
      priority: 'HIGH',
      resolvedAt: new Date(Date.now() - 86400000),
      refundAmount: 0,
      adminNote: 'Incident rejeté - preuves insuffisantes',
      resolvedBy: admin.id,
    },
  });

  await prisma.incident.create({
    data: {
      userId: user2.id,
      bikeId: bikes[4].id,
      type: 'accident',
      description: 'Chute avec le vélo',
      status: 'RESOLVED',
      priority: 'HIGH',
      resolvedAt: new Date(Date.now() - 172800000),
      refundAmount: 1000,
      adminNote: 'Remboursement pour dommages matériels',
      resolvedBy: admin.id,
    },
  });

  await prisma.incident.create({
    data: {
      userId: user1.id,
      bikeId: bikes[1].id,
      type: 'technical',
      description: 'Problème de freins - vélo dangereux',
      status: 'RESOLVED',
      priority: 'HIGH',
      resolvedAt: new Date(Date.now() - 432000000),
      refundAmount: 750,
      adminNote: 'Remboursement complet pour problème de sécurité',
      resolvedBy: admin.id,
    },
  });

  console.log('✅ Created incidents');

  // Create notifications
  await prisma.notification.create({
    data: {
      userId: user1.id,
      title: 'Bienvenue sur FreeBike',
      message: 'Merci de vous être inscrit ! Profitez de 10% de réduction sur votre premier trajet.',
      type: 'welcome',
    },
  });

  await prisma.notification.create({
    data: {
      userId: user1.id,
      title: 'Trajet en cours',
      message: 'Votre trajet est en cours. Bon voyage !',
      type: 'ride',
      isRead: true,
    },
  });

  await prisma.notification.create({
    data: {
      userId: user2.id,
      title: 'Trajet terminé',
      message: 'Votre trajet de 5.2 km a coûté 750 FCFA.',
      type: 'ride',
      isRead: true,
    },
  });

  console.log('✅ Created notifications');

  // Create chat messages
  await prisma.chatMessage.create({
    data: {
      userId: user1.id,
      message: 'Bonjour, j\'ai un problème avec le vélo BIKE003',
      isAdmin: false,
    },
  });

  await prisma.chatMessage.create({
    data: {
      userId: user1.id,
      message: 'Bonjour ! Nous allons regarder cela tout de suite.',
      isAdmin: true,
    },
  });

  console.log('✅ Created chat messages');

  // Create activity logs
  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      action: 'USER_LOGIN',
      resource: 'auth',
      resourceId: admin.id,
      details: 'Admin user logged in',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user1.id,
      action: 'RIDE_STARTED',
      resource: 'ride',
      resourceId: 'ride_1',
      details: 'User started a new ride',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
    },
  });

  console.log('✅ Created activity logs');

  // Create sessions
  await prisma.session.create({
    data: {
      userId: admin.id,
      token: 'admin_session_token_123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  await prisma.session.create({
    data: {
      userId: user1.id,
      token: 'user_session_token_456',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  console.log('✅ Created sessions');

  // Create settings
  await prisma.settings.create({
    data: {
      key: 'company_name',
      value: 'FreeBike Cameroun',
    },
  });

  await prisma.settings.create({
    data: {
      key: 'support_email',
      value: 'support@freebike.cm',
    },
  });

  await prisma.settings.create({
    data: {
      key: 'support_phone',
      value: '+237600000000',
    },
  });

  console.log('✅ Created settings');

  console.log('');
  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📝 Test Accounts:');
  console.log('');
  console.log('👑 Super Admin:');
  console.log('   Email: admin@freebike.cm');
  console.log('   Password: admin123');
  console.log('   Permissions: Full access');
  console.log('');
  console.log('👨‍💼 Manager:');
  console.log('   Email: manager@freebike.cm');
  console.log('   Password: admin123');
  console.log('   Permissions: Limited admin access');
  console.log('');
  console.log('👤 User:');
  console.log('   Email: user@freebike.cm');
  console.log('   Password: user123');
  console.log('   Balance: 5000 FCFA');
  console.log('   Permissions: Basic user access');
  console.log('');
  console.log('👩‍💼 Support:');
  console.log('   Email: support@freebike.cm');
  console.log('   Password: admin123');
  console.log('   Permissions: Employee access');
  console.log('');
  console.log('🚲 Bikes: 10 bikes created with various statuses');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });