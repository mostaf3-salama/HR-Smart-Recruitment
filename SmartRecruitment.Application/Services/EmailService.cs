using Microsoft.Extensions.Configuration;
using SmartRecruitment.Application.Contract;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;

namespace SmartRecruitment.Application.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration )
        {
           _configuration = configuration;
        }
        public async Task SendEmailAsync(string to, string subject, string body)
        {
            var host = _configuration["EmailSettings:Host"] ?? "smtp-relay.brevo.com";
            var port = int.Parse(_configuration["EmailSettings:Port"] ?? "587");
            var username = _configuration["EmailSettings:Username"] ?? throw new InvalidOperationException("Email Username is missing in configuration.");
            var password = _configuration["EmailSettings:Password"] ?? throw new InvalidOperationException("Email Password is missing in configuration.");
            var fromEmail = _configuration["EmailSettings:From"] ?? username;

            using var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(fromEmail, "Smart Recruitment System"),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            mailMessage.To.Add(to);

            await client.SendMailAsync(mailMessage);
        }
    }
}
