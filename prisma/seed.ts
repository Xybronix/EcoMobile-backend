import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    console.log('📦 Production mode: Only creating missing elements');
  } else {
    console.log('🔧 Development mode: Full seed');
  }

  // Créer les rôles uniquement s'ils n'existent pas
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Super Administrator with full access',
      isDefault: false
    }
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator with limited access',
      isDefault: false
    }
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: 'EMPLOYEE' },
    update: {},
    create: {
      name: 'EMPLOYEE',
      description: 'Employee with basic management access',
      isDefault: false
    }
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      description: 'Regular user with basic access',
      isDefault: true
    }
  });

  console.log('✅ Roles checked/created');

  // Créer les permissions uniquement si elles n'existent pas
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
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {}, // Ne pas modifier si existe
      create: permission
    });
  }

  console.log('✅ Permissions checked/created');

  // Assigner les permissions aux rôles uniquement si elles n'existent pas déjà
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    const existing = await prisma.rolePermission.findFirst({
      where: {
        roleId: superAdminRole.id,
        permissionId: permission.id
      }
    });
    
    if (!existing) {
      await prisma.rolePermission.create({
        data: {
          roleId: superAdminRole.id,
          permissionId: permission.id
        }
      });
    }
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
      const existing = await prisma.rolePermission.findFirst({
        where: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      });
      
      if (!existing) {
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        });
      }
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
      const existing = await prisma.rolePermission.findFirst({
        where: {
          roleId: employeeRole.id,
          permissionId: permission.id
        }
      });
      
      if (!existing) {
        await prisma.rolePermission.create({
          data: {
            roleId: employeeRole.id,
            permissionId: permission.id
          }
        });
      }
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
      const existing = await prisma.rolePermission.findFirst({
        where: {
          roleId: userRole.id,
          permissionId: permission.id
        }
      });
      
      if (!existing) {
        await prisma.rolePermission.create({
          data: {
            roleId: userRole.id,
            permissionId: permission.id
          }
        });
      }
    }
  }

  console.log('✅ Permissions assigned to roles (only missing ones)');

  // Créer les utilisateurs uniquement s'ils n'existent pas
  const maskPassword = await bcrypt.hash('mask123', 10);
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  await prisma.user.upsert({
    where: { email: 'xybronix@xybronix.cm' },
    update: {}, // Ne pas modifier si existe
    create: {
      email: 'xybronix@xybronix.cm',
      password: maskPassword,
      firstName: 'Admin',
      lastName: 'Mask',
      phone: '+237600000000',
      role: 'SUPER_ADMIN',
      roleId: superAdminRole.id,
      emailVerified: true,
      status: 'active',
      isActive: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@freebike.cm' },
    update: {}, // Ne pas modifier si existe
    create: {
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

  await prisma.user.upsert({
    where: { email: 'manager@freebike.cm' },
    update: {},
    create: {
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

  const user1 = await prisma.user.upsert({
    where: { email: 'user@freebike.cm' },
    update: {},
    create: {
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

  const user2 = await prisma.user.upsert({
    where: { email: 'marie@freebike.cm' },
    update: {},
    create: {
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

  await prisma.user.upsert({
    where: { email: 'support@freebike.cm' },
    update: {},
    create: {
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

  console.log('✅ Users checked/created');

  // Créer des paramètres par défaut uniquement s'ils n'existent pas
  const defaultSettings = [
    { key: 'companyName', value: 'FreeBike' },
    { key: 'description', value: 'Service de location de vélos électriques écologique et moderne' },
    { key: 'email', value: 'contact@freebike.cm' },
    { key: 'phone', value: '+237 690 60 11 86' },
    { key: 'address', value: 'Boulevard de la Liberté' },
    { key: 'city', value: 'Douala' },
    { key: 'country', value: 'Cameroun' },
    { key: 'orangeMoneyNumber', value: '+237 690 60 11 86' },
    { key: 'mobileMoneyNumber', value: '+237 677 123 456' },
    { key: 'facebook', value: 'https://facebook.com/freebike' },
    { key: 'instagram', value: 'https://instagram.com/freebike' },
    { key: 'website', value: 'https://freebike.cm' },
  ];

  for (const setting of defaultSettings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: {}, // Ne pas modifier si existe
      create: setting
    });
  }

  console.log('✅ Settings checked/created');

  // Créer la configuration de pricing uniquement si elle n'existe pas
  let pricingConfig = await prisma.pricingConfig.findFirst({
    where: { isActive: true }
  });

  if (!pricingConfig) {
    pricingConfig = await prisma.pricingConfig.create({
      data: {
        unlockFee: 100,
        baseHourlyRate: 200,
        isActive: true
      }
    });
    console.log('✅ Created pricing configuration');
  } else {
    console.log('✅ Pricing configuration already exists, skipping');
  }

  // Créer le plan Standard uniquement s'il n'existe pas
  let standardPlan = await prisma.pricingPlan.findFirst({
    where: {
      pricingConfigId: pricingConfig.id,
      name: 'Standard'
    }
  });

  if (!standardPlan) {
    standardPlan = await prisma.pricingPlan.create({
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
    console.log('✅ Created Standard pricing plan');
  } else {
    console.log('✅ Standard pricing plan already exists, skipping');
  }

  // Créer les vélos uniquement s'ils n'existent pas
  const bike1 = await prisma.bike.findUnique({
    where: { id: '9170123060' }
  });

  if (!bike1) {
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
    console.log('✅ Created bike BIKE001');
  } else {
    console.log('✅ Bike BIKE001 already exists, skipping');
  }

  const bike2 = await prisma.bike.findUnique({
    where: { id: '9170123061' }
  });

  if (!bike2) {
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
    console.log('✅ Created bike BIKE002');
  } else {
    console.log('✅ Bike BIKE002 already exists, skipping');
  }

  // Créer les wallets uniquement s'ils n'existent pas
  const wallet1 = await prisma.wallet.findUnique({
    where: { userId: user1.id }
  });

  if (!wallet1) {
    await prisma.wallet.create({
      data: {
        userId: user1.id,
        balance: 0,
      },
    });
    console.log('✅ Created wallet for user1');
  }

  const wallet2 = await prisma.wallet.findUnique({
    where: { userId: user2.id }
  });

  if (!wallet2) {
    await prisma.wallet.create({
      data: {
        userId: user2.id,
        balance: 0,
      },
    });
    console.log('✅ Created wallet for user2');
  }

  const walletAdmin = await prisma.wallet.findUnique({
    where: { userId: admin.id }
  });

  if (!walletAdmin) {
    await prisma.wallet.create({
      data: {
        userId: admin.id,
        balance: 0,
      },
    });
    console.log('✅ Created wallet for admin');
  }

  console.log('');
  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  if (isProduction) {
    console.log('📦 Production mode: Only missing elements were created');
    console.log('   Existing data was preserved');
  } else {
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
    console.log('🚲 Bikes: 2 real bikes with Standard pricing plan');
  }
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
