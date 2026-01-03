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

  console.log('🗑️ Cleared existing data');

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

    // Reservations permissions
    { name: 'reservations:create', description: 'Create reservations', resource: 'reservations', action: 'create' },
    { name: 'reservations:read', description: 'View reservations', resource: 'reservations', action: 'read' },
    { name: 'reservations:update', description: 'Update reservations', resource: 'reservations', action: 'update' },
    { name: 'reservations:delete', description: 'Delete reservations', resource: 'reservations', action: 'delete' },
    { name: 'reservations:manage', description: 'Full reservation management', resource: 'reservations', action: 'manage' },
    
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
    'admin:read', 'users:read', 'users:update', 'bikes:manage', 'reservations:manage', 'rides:read', 
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
    'bikes:read', 'bikes:update', 'reservations:read', 'rides:read', 'incidents:read', 'incidents:update',
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
    { key: 'companyName', value: 'FreeBike' },
    { key: 'description', value: 'Service de location de vélos électriques écologique et moderne' },
    { key: 'email', value: 'contact@freebike.cm' },
    { key: 'phone', value: '+237 699 123 456' },
    { key: 'address', value: 'Boulevard de la Liberté' },
    { key: 'city', value: 'Douala' },
    { key: 'country', value: 'Cameroun' },
    { key: 'orangeMoneyNumber', value: '+237 699 123 456' },
    { key: 'mobileMoneyNumber', value: '+237 677 123 456' },
    { key: 'facebook', value: 'https://facebook.com/freebike' },
    { key: 'instagram', value: 'https://instagram.com/freebike' },
    { key: 'website', value: 'https://freebike.cm' },
  ];

  for (const setting of defaultSettings) {
    await prisma.settings.create({
      data: setting
    });
  }

  console.log('✅ Created default settings');

  // Create pricing configuration
  const pricingConfig = await prisma.pricingConfig.create({
    data: {
      unlockFee: 100,
      baseHourlyRate: 200,
      isActive: true
    }
  });

  // Create only the Standard pricing plan
  const standardPlan = await prisma.pricingPlan.create({
    data: {
      pricingConfigId: pricingConfig.id,
      name: 'Standard',
      hourlyRate: 200,
      dailyRate: 3000,
      weeklyRate: 18000,
      monthlyRate: 60000,
      minimumHours: 1,
      discount: 0,
      isActive: true,
      conditions: {}
    }
  });

  console.log('✅ Created pricing configuration (Standard plan only)');

  // Create bikes - only the first two real ones
  await prisma.bike.create({
    data: {
      id: '9170123060',
      code: 'BIKE001',
      model: 'E-Bike Pro',
      status: 'AVAILABLE',
      batteryLevel: 85,
      latitude: 4.0511,
      longitude: 9.7679,
      locationName: 'Douala Centre',
      equipment: ['headlight', 'taillight', 'basket', 'lock'],
      qrCode: 'QR000001',
      gpsDeviceId: '9170123060',
      pricingPlanId: standardPlan.id,
      lastMaintenanceAt: new Date(Date.now() - 86400000),
    },
  });

  await prisma.bike.create({
    data: {
      id: '9170123061',
      code: 'BIKE002',
      model: 'E-Bike Sport',
      status: 'AVAILABLE',
      batteryLevel: 75,
      latitude: 4.0583,
      longitude: 9.7083,
      locationName: 'Akwa',
      equipment: ['headlight', 'taillight', 'lock'],
      qrCode: 'QR000002',
      gpsDeviceId: '9170123061',
      pricingPlanId: standardPlan.id,
      lastMaintenanceAt: new Date(Date.now() - 172800000),
    },
  });

  console.log('✅ Created 2 real bikes with their specific IDs');

  // Create wallets (only for users, no fake transactions)
  await prisma.wallet.create({
    data: {
      userId: user1.id,
      balance: 0,
    },
  });

  await prisma.wallet.create({
    data: {
      userId: user2.id,
      balance: 0,
    },
  });

  await prisma.wallet.create({
    data: {
      userId: admin.id,
      balance: 0,
    },
  });

  console.log('✅ Created empty wallets for users');

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
  console.log('   Balance: 0 FCFA');
  console.log('   Permissions: Basic user access');
  console.log('');
  console.log('👩‍💼 Support:');
  console.log('   Email: support@freebike.cm');
  console.log('   Password: admin123');
  console.log('   Permissions: Employee access');
  console.log('');
  console.log('🚲 Bikes: 2 real bikes created with Standard pricing plan');
  console.log('');
  console.log('⚠️  Removed:');
  console.log('   - Fake bikes (only kept 2 real ones with specific IDs)');
  console.log('   - All fake incidents');
  console.log('   - All maintenance logs');
  console.log('   - All fake pricing rules (only kept Standard plan)');
  console.log('   - All fake transactions');
  console.log('   - All fake sessions');
  console.log('   - All notifications');
  console.log('   - All rides (including user-started ride)');
  console.log('   - All chat messages');
  console.log('   - All activity logs');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });