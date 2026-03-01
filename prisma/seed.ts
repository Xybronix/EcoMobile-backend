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
    // ===== ADMIN GLOBAL =====
    { name: 'admin:manage', description: 'Accès administrateur complet', resource: 'admin', action: 'manage' },
    { name: 'admin:read', description: 'Voir le tableau de bord admin', resource: 'admin', action: 'read' },

    // ===== DASHBOARD =====
    { name: 'dashboard:read', description: 'Voir le tableau de bord', resource: 'dashboard', action: 'read' },
    { name: 'dashboard:export', description: 'Exporter les données du tableau de bord', resource: 'dashboard', action: 'export' },

    // ===== UTILISATEURS =====
    { name: 'users:create', description: 'Créer des utilisateurs', resource: 'users', action: 'create' },
    { name: 'users:read', description: 'Voir les utilisateurs', resource: 'users', action: 'read' },
    { name: 'users:update', description: 'Modifier les utilisateurs', resource: 'users', action: 'update' },
    { name: 'users:delete', description: 'Supprimer des utilisateurs', resource: 'users', action: 'delete' },
    { name: 'users:export', description: 'Exporter la liste des utilisateurs', resource: 'users', action: 'export' },
    { name: 'users:manage', description: 'Gestion complète des utilisateurs', resource: 'users', action: 'manage' },
    { name: 'users:ban', description: 'Bloquer/débloquer des utilisateurs', resource: 'users', action: 'ban' },
    { name: 'users:verify', description: 'Vérifier manuellement les comptes utilisateurs', resource: 'users', action: 'verify' },
    { name: 'users:reset_password', description: 'Réinitialiser le mot de passe d\'un utilisateur', resource: 'users', action: 'reset_password' },
    { name: 'users:manage_deposit', description: 'Gérer la caution des utilisateurs', resource: 'users', action: 'manage_deposit' },
    { name: 'users:manage_wallet', description: 'Gérer le portefeuille des utilisateurs', resource: 'users', action: 'manage_wallet' },
    { name: 'users:view_documents', description: 'Voir les documents des utilisateurs', resource: 'users', action: 'view_documents' },
    { name: 'users:validate_documents', description: 'Valider les documents des utilisateurs', resource: 'users', action: 'validate_documents' },

    // ===== VÉLOS =====
    { name: 'bikes:create', description: 'Ajouter des vélos', resource: 'bikes', action: 'create' },
    { name: 'bikes:read', description: 'Voir les vélos', resource: 'bikes', action: 'read' },
    { name: 'bikes:update', description: 'Modifier les vélos', resource: 'bikes', action: 'update' },
    { name: 'bikes:delete', description: 'Supprimer des vélos', resource: 'bikes', action: 'delete' },
    { name: 'bikes:export', description: 'Exporter la liste des vélos', resource: 'bikes', action: 'export' },
    { name: 'bikes:manage', description: 'Gestion complète des vélos', resource: 'bikes', action: 'manage' },
    { name: 'bikes:view_map', description: 'Voir la carte des vélos', resource: 'bikes', action: 'view_map' },
    { name: 'bikes:view_trips', description: 'Voir l\'historique des trajets d\'un vélo', resource: 'bikes', action: 'view_trips' },
    { name: 'bikes:view_maintenance', description: 'Voir l\'historique de maintenance d\'un vélo', resource: 'bikes', action: 'view_maintenance' },
    { name: 'bikes:manage_actions', description: 'Gérer les actions sur les vélos (verrouillage, déverrouillage)', resource: 'bikes', action: 'manage_actions' },

    // ===== RÉSERVATIONS =====
    { name: 'reservations:create', description: 'Créer des réservations', resource: 'reservations', action: 'create' },
    { name: 'reservations:read', description: 'Voir les réservations', resource: 'reservations', action: 'read' },
    { name: 'reservations:update', description: 'Modifier les réservations', resource: 'reservations', action: 'update' },
    { name: 'reservations:delete', description: 'Supprimer des réservations', resource: 'reservations', action: 'delete' },
    { name: 'reservations:export', description: 'Exporter les réservations', resource: 'reservations', action: 'export' },
    { name: 'reservations:manage', description: 'Gestion complète des réservations', resource: 'reservations', action: 'manage' },
    { name: 'reservations:cancel', description: 'Annuler des réservations', resource: 'reservations', action: 'cancel' },

    // ===== TRAJETS =====
    { name: 'rides:create', description: 'Créer des trajets', resource: 'rides', action: 'create' },
    { name: 'rides:read', description: 'Voir les trajets', resource: 'rides', action: 'read' },
    { name: 'rides:update', description: 'Modifier les trajets', resource: 'rides', action: 'update' },
    { name: 'rides:delete', description: 'Supprimer des trajets', resource: 'rides', action: 'delete' },
    { name: 'rides:export', description: 'Exporter les trajets', resource: 'rides', action: 'export' },
    { name: 'rides:manage', description: 'Gestion complète des trajets', resource: 'rides', action: 'manage' },

    // ===== MAINTENANCE =====
    { name: 'maintenance:create', description: 'Ajouter des entrées de maintenance', resource: 'maintenance', action: 'create' },
    { name: 'maintenance:read', description: 'Voir les entrées de maintenance', resource: 'maintenance', action: 'read' },
    { name: 'maintenance:update', description: 'Modifier les entrées de maintenance', resource: 'maintenance', action: 'update' },
    { name: 'maintenance:delete', description: 'Supprimer des entrées de maintenance', resource: 'maintenance', action: 'delete' },
    { name: 'maintenance:export', description: 'Exporter les données de maintenance', resource: 'maintenance', action: 'export' },
    { name: 'maintenance:manage', description: 'Gestion complète de la maintenance', resource: 'maintenance', action: 'manage' },

    // ===== CHAT =====
    { name: 'chat:create', description: 'Envoyer des messages', resource: 'chat', action: 'create' },
    { name: 'chat:read', description: 'Voir les conversations', resource: 'chat', action: 'read' },
    { name: 'chat:update', description: 'Modifier des messages', resource: 'chat', action: 'update' },
    { name: 'chat:delete', description: 'Supprimer des messages', resource: 'chat', action: 'delete' },
    { name: 'chat:manage', description: 'Gestion complète du chat', resource: 'chat', action: 'manage' },

    // ===== NOTIFICATIONS =====
    { name: 'notifications:create', description: 'Envoyer des notifications', resource: 'notifications', action: 'create' },
    { name: 'notifications:read', description: 'Voir les notifications', resource: 'notifications', action: 'read' },
    { name: 'notifications:update', description: 'Modifier des notifications', resource: 'notifications', action: 'update' },
    { name: 'notifications:delete', description: 'Supprimer des notifications', resource: 'notifications', action: 'delete' },
    { name: 'notifications:manage', description: 'Gestion complète des notifications', resource: 'notifications', action: 'manage' },
    { name: 'notifications:send_bulk', description: 'Envoyer des notifications en masse', resource: 'notifications', action: 'send_bulk' },

    // ===== PORTEFEUILLE / FINANCES =====
    { name: 'wallet:read', description: 'Voir les données du portefeuille', resource: 'wallet', action: 'read' },
    { name: 'wallet:update', description: 'Modifier le portefeuille', resource: 'wallet', action: 'update' },
    { name: 'wallet:manage', description: 'Gestion complète du portefeuille', resource: 'wallet', action: 'manage' },
    { name: 'wallet:export', description: 'Exporter les données financières', resource: 'wallet', action: 'export' },
    { name: 'wallet:refund', description: 'Effectuer des remboursements', resource: 'wallet', action: 'refund' },
    { name: 'wallet:charge', description: 'Débiter un compte utilisateur', resource: 'wallet', action: 'charge' },
    { name: 'wallet:view_transactions', description: 'Voir les transactions', resource: 'wallet', action: 'view_transactions' },

    // ===== PARAMÈTRES =====
    { name: 'settings:read', description: 'Voir les paramètres', resource: 'settings', action: 'read' },
    { name: 'settings:update', description: 'Modifier les paramètres', resource: 'settings', action: 'update' },
    { name: 'settings:manage', description: 'Gestion complète des paramètres', resource: 'settings', action: 'manage' },

    // ===== TARIFICATION =====
    { name: 'pricing:read', description: 'Voir la tarification', resource: 'pricing', action: 'read' },
    { name: 'pricing:create', description: 'Créer des plans tarifaires', resource: 'pricing', action: 'create' },
    { name: 'pricing:update', description: 'Modifier la tarification', resource: 'pricing', action: 'update' },
    { name: 'pricing:delete', description: 'Supprimer des plans tarifaires', resource: 'pricing', action: 'delete' },
    { name: 'pricing:manage', description: 'Gestion complète de la tarification', resource: 'pricing', action: 'manage' },
    { name: 'pricing:manage_free_days', description: 'Gérer les règles de jours gratuits', resource: 'pricing', action: 'manage_free_days' },

    // ===== INCIDENTS =====
    { name: 'incidents:create', description: 'Créer des incidents', resource: 'incidents', action: 'create' },
    { name: 'incidents:read', description: 'Voir les incidents', resource: 'incidents', action: 'read' },
    { name: 'incidents:update', description: 'Modifier les incidents', resource: 'incidents', action: 'update' },
    { name: 'incidents:delete', description: 'Supprimer des incidents', resource: 'incidents', action: 'delete' },
    { name: 'incidents:export', description: 'Exporter les incidents', resource: 'incidents', action: 'export' },
    { name: 'incidents:manage', description: 'Gestion complète des incidents', resource: 'incidents', action: 'manage' },
    { name: 'incidents:resolve', description: 'Résoudre des incidents', resource: 'incidents', action: 'resolve' },

    // ===== AVIS / REVIEWS =====
    { name: 'reviews:create', description: 'Créer des avis', resource: 'reviews', action: 'create' },
    { name: 'reviews:read', description: 'Voir les avis', resource: 'reviews', action: 'read' },
    { name: 'reviews:update', description: 'Modifier des avis', resource: 'reviews', action: 'update' },
    { name: 'reviews:delete', description: 'Supprimer des avis', resource: 'reviews', action: 'delete' },
    { name: 'reviews:export', description: 'Exporter les avis', resource: 'reviews', action: 'export' },
    { name: 'reviews:manage', description: 'Gestion complète des avis', resource: 'reviews', action: 'manage' },
    { name: 'reviews:moderate', description: 'Modérer les avis (approuver/rejeter)', resource: 'reviews', action: 'moderate' },

    // ===== JOURNAUX D'ACTIVITÉ =====
    { name: 'logs:read', description: 'Voir les journaux d\'activité', resource: 'logs', action: 'read' },
    { name: 'logs:export', description: 'Exporter les journaux d\'activité', resource: 'logs', action: 'export' },
    { name: 'logs:delete', description: 'Supprimer des journaux d\'activité', resource: 'logs', action: 'delete' },

    // ===== RÔLES =====
    { name: 'roles:create', description: 'Créer des rôles', resource: 'roles', action: 'create' },
    { name: 'roles:read', description: 'Voir les rôles', resource: 'roles', action: 'read' },
    { name: 'roles:update', description: 'Modifier des rôles', resource: 'roles', action: 'update' },
    { name: 'roles:delete', description: 'Supprimer des rôles', resource: 'roles', action: 'delete' },
    { name: 'roles:manage', description: 'Gestion complète des rôles', resource: 'roles', action: 'manage' },
    { name: 'roles:assign', description: 'Assigner des rôles aux employés', resource: 'roles', action: 'assign' },

    // ===== PERMISSIONS =====
    { name: 'permissions:read', description: 'Voir les permissions', resource: 'permissions', action: 'read' },
    { name: 'permissions:manage', description: 'Gérer les permissions', resource: 'permissions', action: 'manage' },

    // ===== EMPLOYÉS =====
    { name: 'employees:create', description: 'Créer des employés', resource: 'employees', action: 'create' },
    { name: 'employees:read', description: 'Voir les employés', resource: 'employees', action: 'read' },
    { name: 'employees:update', description: 'Modifier des employés', resource: 'employees', action: 'update' },
    { name: 'employees:delete', description: 'Supprimer des employés', resource: 'employees', action: 'delete' },
    { name: 'employees:export', description: 'Exporter la liste des employés', resource: 'employees', action: 'export' },
    { name: 'employees:manage', description: 'Gestion complète des employés', resource: 'employees', action: 'manage' },
    { name: 'employees:reset_password', description: 'Réinitialiser le mot de passe d\'un employé', resource: 'employees', action: 'reset_password' },

    // ===== ABONNEMENTS =====
    { name: 'subscriptions:read', description: 'Voir les abonnements', resource: 'subscriptions', action: 'read' },
    { name: 'subscriptions:create', description: 'Créer des abonnements', resource: 'subscriptions', action: 'create' },
    { name: 'subscriptions:update', description: 'Modifier des abonnements', resource: 'subscriptions', action: 'update' },
    { name: 'subscriptions:delete', description: 'Supprimer des abonnements', resource: 'subscriptions', action: 'delete' },
    { name: 'subscriptions:export', description: 'Exporter les abonnements', resource: 'subscriptions', action: 'export' },
    { name: 'subscriptions:manage', description: 'Gestion complète des abonnements', resource: 'subscriptions', action: 'manage' },

    // ===== MONITORING / SÉCURITÉ =====
    { name: 'monitoring:read', description: 'Voir le monitoring de sécurité', resource: 'monitoring', action: 'read' },
    { name: 'monitoring:manage', description: 'Gérer le monitoring de sécurité', resource: 'monitoring', action: 'manage' },

    // ===== DOCUMENTS =====
    { name: 'documents:read', description: 'Voir les documents', resource: 'documents', action: 'read' },
    { name: 'documents:update', description: 'Modifier les documents', resource: 'documents', action: 'update' },
    { name: 'documents:delete', description: 'Supprimer des documents', resource: 'documents', action: 'delete' },
    { name: 'documents:manage', description: 'Gestion complète des documents', resource: 'documents', action: 'manage' },
    { name: 'documents:validate', description: 'Valider des documents', resource: 'documents', action: 'validate' },
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
    // Dashboard
    'admin:read', 'dashboard:read', 'dashboard:export',
    // Utilisateurs
    'users:create', 'users:read', 'users:update', 'users:export', 'users:ban', 'users:verify',
    'users:reset_password', 'users:manage_deposit', 'users:manage_wallet',
    'users:view_documents', 'users:validate_documents',
    // Vélos
    'bikes:create', 'bikes:read', 'bikes:update', 'bikes:delete', 'bikes:export',
    'bikes:view_map', 'bikes:view_trips', 'bikes:view_maintenance', 'bikes:manage_actions',
    // Réservations
    'reservations:read', 'reservations:update', 'reservations:export', 'reservations:cancel',
    // Trajets
    'rides:read', 'rides:export',
    // Maintenance
    'maintenance:create', 'maintenance:read', 'maintenance:update', 'maintenance:delete', 'maintenance:export',
    // Incidents
    'incidents:create', 'incidents:read', 'incidents:update', 'incidents:delete', 'incidents:export', 'incidents:resolve',
    // Avis
    'reviews:create', 'reviews:read', 'reviews:update', 'reviews:delete', 'reviews:export', 'reviews:moderate',
    // Finances
    'wallet:read', 'wallet:update', 'wallet:export', 'wallet:refund', 'wallet:charge', 'wallet:view_transactions',
    // Chat
    'chat:read', 'chat:create', 'chat:delete',
    // Notifications
    'notifications:create', 'notifications:read', 'notifications:send_bulk', 'notifications:delete',
    // Journaux
    'logs:read', 'logs:export', 'logs:delete',
    // Rôles
    'roles:create', 'roles:read', 'roles:update', 'roles:delete', 'roles:assign',
    // Permissions
    'permissions:read', 'permissions:manage',
    // Employés
    'employees:create', 'employees:read', 'employees:update', 'employees:delete',
    'employees:export', 'employees:reset_password',
    // Abonnements
    'subscriptions:create', 'subscriptions:read', 'subscriptions:update', 'subscriptions:delete', 'subscriptions:export',
    // Documents
    'documents:read', 'documents:update', 'documents:delete', 'documents:validate',
    // Monitoring
    'monitoring:read', 'monitoring:manage',
    // Tarification
    'pricing:read', 'pricing:create', 'pricing:update', 'pricing:delete', 'pricing:manage_free_days',
    // Paramètres
    'settings:read', 'settings:update',
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
    // Dashboard
    'admin:read', 'dashboard:read',
    // Utilisateurs (lecture seulement)
    'users:read',
    // Vélos
    'bikes:read', 'bikes:update', 'bikes:view_map', 'bikes:view_trips', 'bikes:view_maintenance',
    'bikes:manage_actions',
    // Réservations
    'reservations:read',
    // Trajets
    'rides:read',
    // Maintenance
    'maintenance:create', 'maintenance:read', 'maintenance:update',
    // Incidents
    'incidents:read', 'incidents:update', 'incidents:resolve',
    // Avis
    'reviews:read',
    // Chat
    'chat:read', 'chat:create',
    // Notifications
    'notifications:read',
    // Documents
    'documents:read',
    // Tarification (lecture seulement)
    'pricing:read',
    // Abonnements (lecture seulement)
    'subscriptions:read',
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
