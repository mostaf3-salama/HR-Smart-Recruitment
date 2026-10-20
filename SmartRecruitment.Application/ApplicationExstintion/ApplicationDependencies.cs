using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using SmartRecruitment.Application.Contract;
using SmartRecruitment.Application.Interfaces;
using SmartRecruitment.Application.Services;
using SmartRecruitment.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartRecruitment.Application.ApplicationExstintion
{
    public static class ApplicationDependencies
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<IJobService, JobIServices>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<IApplicantService, ApplicantService>();
            services.AddScoped<IInterviewService, InterviewService>();
            services.AddScoped<IDashboardService, DashboardService>();
            services.AddScoped<ICandidateService, CandidateService>();
            services.AddScoped<IJobRecommendationService, JobRecommendationService>();
            // Register all validators from the Application assembly automatically
            services.AddValidatorsFromAssembly(typeof(ApplicationDependencies).Assembly);

            return services;
        }
    }
}
