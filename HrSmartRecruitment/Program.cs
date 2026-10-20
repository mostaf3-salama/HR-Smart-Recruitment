using Microsoft.EntityFrameworkCore;
using SmartRecruitment.Application.ApplicationExstintion;
using SmartRecruitment.Domain.Interfaces;
using SmartRecruitment.Infrastructure.Extensions;
using SmartRecruitment.Infrastructure.Presistence.Data;
using SmartRecruitment.Infrastructure.Seeder;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Bearer token support in Swagger UI (shows the green "Authorize" button)
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Paste ONLY the accessToken from /api/Auth/Login"
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var unitOfWork = services.GetRequiredService<IUnitOfWork>();
    try
    {
        // Auto-apply EF migrations: creates the database + tables on first run.
        // Lets you point the app at any fresh database name in appsettings and it builds itself.
        var db = services.GetRequiredService<SmartRecruitmentDbContext>();
        await db.Database.MigrateAsync();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database migration skipped: {ex.Message}");
    }
    try
    {
        await DbSeeder.SeedAdminUserAsync(unitOfWork);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Admin seeding skipped: {ex.Message}");
    }
    try
    {
        await HrDemoSeeder.SeedDemoGraphAsync(unitOfWork);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Demo seeding skipped: {ex.Message}");
    }
}
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
