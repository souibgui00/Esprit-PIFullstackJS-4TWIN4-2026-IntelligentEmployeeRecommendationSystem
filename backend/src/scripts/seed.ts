import { NestFactory } from '@nestjs/core';
import { Types } from 'mongoose';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';

async function seed() {
  try {
    console.log('🌱 Starting seed script...\n');

    const app = await NestFactory.create(AppModule);
    const usersService = app.get(UsersService);

    const testUsers = [
      {
        name: 'Admin User',
        matricule: 'ADM001',
        telephone: '1111111111',
        email: 'admin@test.com',
        password: 'Password123',
        date_embauche: new Date('2020-01-01'),
        department_id: new Types.ObjectId('000000000000000000000001'),
        role: Role.ADMIN,
      },
      {
        name: 'HR User',
        matricule: 'HR001',
        telephone: '2222222222',
        email: 'hr@test.com',
        password: 'Password123',
        date_embauche: new Date('2020-06-01'),
        department_id: new Types.ObjectId('000000000000000000000002'),
        role: Role.HR,
      },
      {
        name: 'Manager User',
        matricule: 'MGR001',
        telephone: '3333333333',
        email: 'manager@test.com',
        password: 'Password123',
        date_embauche: new Date('2021-01-01'),
        department_id: new Types.ObjectId('000000000000000000000003'),
        role: Role.MANAGER,
      },
      {
        name: 'Employee User',
        matricule: 'EMP001',
        telephone: '4444444444',
        email: 'employee@test.com',
        password: 'Password123',
        date_embauche: new Date('2022-01-01'),
        department_id: new Types.ObjectId('000000000000000000000004'),
        role: Role.EMPLOYEE,
      },
    ];

    for (const user of testUsers) {
      try {
        const existing = await usersService.findByEmail(user.email);
        if (existing) {
          console.log(`⏭️  Skipped: ${user.email} (already exists)`);
        } else {
          const createdUser = await usersService.create(user);
          console.log(`✅ Created: ${user.email} (${user.role})`);
          console.log(`   ID: ${createdUser._id}\n`);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Failed to create ${user.email}:`, errorMessage);
      }
    }

    console.log('\n🎉 Seed script completed!\n');
    console.log('Test Credentials:');
    console.log('-------------------');
    console.log('ADMIN:    admin@test.com / Password123');
    console.log('HR:       hr@test.com / Password123');
    console.log('MANAGER:  manager@test.com / Password123');
    console.log('EMPLOYEE: employee@test.com / Password123\n');

    await app.close();
    process.exit(0);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Seed script failed:', errorMessage);
    process.exit(1);
  }
}

seed();
