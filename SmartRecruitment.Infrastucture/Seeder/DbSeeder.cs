using Microsoft.AspNetCore.Identity;
using SmartRecruitment.Domain.Entities;
using SmartRecruitment.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartRecruitment.Infrastructure.Seeder
{
    public static class DbSeeder
    {
        public static async Task SeedAdminUserAsync(IUnitOfWork unitOfWork)
        {
            var adminEmail = "admin@smartrecruitment.com";

            var existingAdmin = await unitOfWork.Repository<User>()
                .FirstOrDefaultAsync(u => u.Email == adminEmail);

            if (existingAdmin == null)
            {
                var passwordHasher = new PasswordHasher<User>();
                var admin = new User
                {
                    Name = "System Admin",
                    Email = adminEmail,
                    Role = "admin",
                    CreatedAt = DateTime.UtcNow
                };

                admin.PasswordHash = passwordHasher.HashPassword(admin, "Admin@123456");

                await unitOfWork.Repository<User>().AddAsync(admin);
                await unitOfWork.SaveChangesAsync();
            }
        }
    }
}