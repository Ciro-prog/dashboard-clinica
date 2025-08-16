// MongoDB initialization script for Admin System
db = db.getSiblingDB('clinic_admin');

// Create admin user
db.createUser({
  user: 'clinic_admin',
  pwd: 'clinic_admin_password',
  roles: [
    {
      role: 'readWrite',
      db: 'clinic_admin'
    }
  ]
});

// Create collections with basic indexes
db.createCollection('clinics');
db.createCollection('patients');
db.createCollection('professionals');
db.createCollection('appointments');
db.createCollection('subscription_plans');
db.createCollection('metrics');
db.createCollection('admin_users');

// Create indexes for better performance
db.clinics.createIndex({ "clinic_id": 1 }, { unique: true });
db.clinics.createIndex({ "email": 1 }, { unique: true });
db.clinics.createIndex({ "suscriber": 1 });
db.clinics.createIndex({ "status_clinic": 1 });

db.patients.createIndex({ "clinic_id": 1 });
db.patients.createIndex({ "dni": 1 });
db.patients.createIndex({ "email": 1 });

db.professionals.createIndex({ "clinic_id": 1 });
db.professionals.createIndex({ "email": 1 });

db.appointments.createIndex({ "clinic_id": 1 });
db.appointments.createIndex({ "patient_id": 1 });
db.appointments.createIndex({ "professional_id": 1 });
db.appointments.createIndex({ "datetime": 1 });

db.subscription_plans.createIndex({ "name": 1 }, { unique: true });

db.metrics.createIndex({ "clinic_id": 1 });
db.metrics.createIndex({ "timestamp": 1 });

db.admin_users.createIndex({ "username": 1 }, { unique: true });

print('Database initialized successfully');